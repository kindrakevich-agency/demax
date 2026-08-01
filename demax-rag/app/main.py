"""DEMAX RAG demo API — the RAG slice of the Backend API Specification v1.1.

Implements (spec section in brackets):
  POST /v1/me/conversations/messages   — AI chat, grounded-or-escalate (4.4.4/§6)
  POST /v1/admin/knowledge/search      — hybrid retrieval preview (4.11.8)
  GET  /v1/admin/knowledge/articles    — ingested article stats (4.11.1, trimmed)
  POST /v1/admin/knowledge/reindex     — re-crawl + re-embed (4.11.7)
  GET  /v1/health, /v1/health/ready, /v1/version (4.15)

Демо: без auth-шару (в проді — JWT per spec §2); одна розмова на клієнта.
"""

import logging
import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Читаємо .env поруч із проєктом — потрібно для запуску під aaPanel
# Python Project Manager (де немає docker env_file).
load_dotenv()

from . import db, ingest, rag  # noqa: E402 — після load_dotenv, щоб модулі бачили env

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

app = FastAPI(title="DEMAX RAG API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _seed_translations() -> None:
    """Наповнює ui_translations рядками інтерфейсу (ідемпотентно)."""
    import json
    import pathlib

    f = pathlib.Path(__file__).parent / "translations_seed.json"
    if not f.exists():
        return
    rows = json.loads(f.read_text(encoding="utf-8"))
    with db.pool().connection() as conn:
        with conn.cursor() as cur:
            cur.executemany(
                "INSERT INTO ui_translations (namespace, key, uk, ru, en) VALUES (%s,%s,%s,%s,%s) "
                "ON CONFLICT (namespace, key) DO NOTHING",
                [(r["namespace"], r["key"], r["uk"], r["ru"], r["en"]) for r in rows],
            )
    logging.getLogger("startup").info("ui_translations seeded: %d", len(rows))


@app.on_event("startup")
def _startup() -> None:
    db.init_schema()
    try:
        _seed_translations()
    except Exception:  # noqa: BLE001 — сід не має валити старт сервісу
        logging.getLogger("startup").exception("translation seed failed")
    ingest.ensure_ingested_async()


# ---------- schemas ----------

class ChatIn(BaseModel):
    conversation_id: str | None = None
    text: str = Field(min_length=1, max_length=2000)
    # Admin-UI language (Accept-Language per spec §3.15): the reply is
    # ALWAYS produced in this language, regardless of the question's language.
    language: str = Field(default="ru", pattern="^(ru|en|uk)$")


class SearchIn(BaseModel):
    query: str = Field(min_length=2, max_length=500)
    top_k: int = Field(default=5, ge=1, le=20)


# ---------- endpoints ----------

@app.get("/v1/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/v1/version")
def version() -> dict:
    return {"version": "1.0-demo", "commit": "local"}


@app.get("/v1/health/ready")
def ready() -> dict:
    chunks = db.chunk_count()
    return {
        "status": "ok" if chunks > 0 else "degraded",
        "dependencies": {
            "postgresql": True,
            "knowledge_chunks": chunks,
            "ingest": ingest.state,
            "llm_provider": bool(
                os.environ.get("OPENAI_API_KEY", "").strip()
                or os.environ.get("ANTHROPIC_API_KEY", "").strip()
            ),
        },
    }


class TranslationIn(BaseModel):
    namespace: str = Field(min_length=1, max_length=64)
    key: str = Field(min_length=1, max_length=200)
    uk: str
    ru: str
    en: str


@app.get("/v1/admin/translations")
def list_translations(namespace: str | None = None) -> dict:
    """Переклади інтерфейсу з БД (spec-additive)."""
    with db.pool().connection() as conn:
        if namespace:
            rows = conn.execute(
                "SELECT namespace, key, uk, ru, en FROM ui_translations WHERE namespace = %s ORDER BY key",
                (namespace,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT namespace, key, uk, ru, en FROM ui_translations ORDER BY namespace, key"
            ).fetchall()
    return {
        "data": [
            {"namespace": r[0], "key": r[1], "uk": r[2], "ru": r[3], "en": r[4]} for r in rows
        ]
    }


@app.put("/v1/admin/translations")
def upsert_translation(body: TranslationIn) -> dict:
    """Створити або оновити рядок перекладу (редагується з адмінки)."""
    with db.pool().connection() as conn:
        conn.execute(
            "INSERT INTO ui_translations (namespace, key, uk, ru, en) VALUES (%s, %s, %s, %s, %s) "
            "ON CONFLICT (namespace, key) DO UPDATE SET uk = EXCLUDED.uk, ru = EXCLUDED.ru, "
            "en = EXCLUDED.en, updated_at = now()",
            (body.namespace, body.key, body.uk, body.ru, body.en),
        )
    return {"status": "saved", "namespace": body.namespace, "key": body.key}


@app.get("/v1/admin/knowledge/articles")
def articles() -> dict:
    return {"data": db.article_stats(), "total_chunks": db.chunk_count()}


@app.post("/v1/admin/knowledge/reindex", status_code=202)
def reindex() -> dict:
    if ingest.state["status"] != "running":
        import threading

        threading.Thread(target=ingest.run_ingest, daemon=True).start()
    return {"status": "reindex_queued", "state": ingest.state}


@app.post("/v1/admin/knowledge/search")
def knowledge_search(body: SearchIn) -> dict:
    hits = rag.retrieve(body.query)[: body.top_k]
    return {
        "results": [
            {
                "article_id": h["article_id"],
                "title": h["title"],
                "chunk": h["content"][:400],
                "score": round(h["score"], 3),
                "url": h["source_url"],
            }
            for h in hits
        ]
    }


@app.get("/v1/me/conversations/{conversation_id}/messages")
def conversation_messages(conversation_id: str) -> dict:
    """Історія розмови (spec 4.4.3) — віджет відновлює її при відкритті."""
    with db.pool().connection() as conn:
        row = conn.execute("SELECT id FROM ai_conversations WHERE id = %s", (conversation_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="conversation_not_found")
        rows = conn.execute(
            "SELECT m.id, m.sender, m.content, m.confidence, m.retrieved_article_ids "
            "FROM ai_messages m WHERE m.conversation_id = %s ORDER BY m.created_at, m.id",
            (conversation_id,),
        ).fetchall()
        out = []
        for mid, sender, content, confidence, article_ids in rows:
            sources = []
            if article_ids:
                for aid, title, url in conn.execute(
                    "SELECT id, title, source_url FROM knowledge_articles WHERE id = ANY(%s)",
                    (list(article_ids),),
                ).fetchall():
                    sources.append({
                        "article_id": str(aid),
                        "title": title,
                        "url": None if (url or "").startswith("pdf://") else url,
                    })
            out.append({
                "id": str(mid),
                "sender": sender,
                "content": content,
                "confidence": confidence,
                "sources": sources,
            })
    return {"data": out}


@app.post("/v1/me/conversations/messages")
def chat(body: ChatIn) -> dict:
    # resolve / open the conversation (one active per customer — spec 4.4.4)
    conv_id: str | None = None
    history: list[dict] = []
    with db.pool().connection() as conn:
        if body.conversation_id:
            row = conn.execute(
                "SELECT id FROM ai_conversations WHERE id = %s AND status = 'active'",
                (body.conversation_id,),
            ).fetchone()
            conv_id = str(row[0]) if row else None
        if conv_id is None:
            row = conn.execute(
                "INSERT INTO ai_conversations DEFAULT VALUES RETURNING id"
            ).fetchone()
            conv_id = str(row[0])
        else:
            for sender, content in conn.execute(
                "SELECT sender, content FROM ai_messages WHERE conversation_id = %s "
                "ORDER BY created_at DESC LIMIT 6",
                (conv_id,),
            ).fetchall()[::-1]:
                history.append({"role": "user" if sender == "customer" else "assistant", "content": content})

    result = rag.answer(body.text, history, body.language)

    with db.pool().connection() as conn:
        conn.execute(
            "INSERT INTO ai_messages (conversation_id, sender, content, intent) VALUES (%s, 'customer', %s, %s)",
            (conv_id, body.text, result["intent"]),
        )
        row = conn.execute(
            "INSERT INTO ai_messages (conversation_id, sender, content, intent, confidence, retrieved_article_ids) "
            "VALUES (%s, 'ai', %s, %s, %s, %s) RETURNING id",
            (
                conv_id,
                result["reply"],
                result["intent"],
                result["confidence"],
                [uuid.UUID(s["article_id"]) for s in result["sources"]] or None,
            ),
        ).fetchone()
        message_id = str(row[0])
        conn.execute(
            "UPDATE ai_conversations SET last_intent = %s, status = %s WHERE id = %s",
            (result["intent"], "escalated" if result["escalated"] else "active", conv_id),
        )

    out = {
        "conversation_id": conv_id,
        "message_id": message_id,
        "reply": result["reply"],
        "intent": result["intent"],
        "confidence": result["confidence"],
        "escalated": result["escalated"],
        "sources": result["sources"],
    }
    if result["escalated"]:
        out["escalation"] = {"id": str(uuid.uuid4()), "reason": "low_confidence", "status": "open"}
    return out
