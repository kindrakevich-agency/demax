"""Retrieval + grounded generation for the DEMAX assistant.

Retrieval: hybrid — pgvector cosine (kNN) + Postgres FTS, fused with
Reciprocal Rank Fusion, per the Backend API spec §6.2.
Generation: OpenAI or Anthropic (env-selected); grounded-or-escalate per
spec §6.1 — the model answers ONLY from retrieved context or emits the
ESCALATE sentinel, which maps to the spec's escalation response.
"""

import os
import re

import httpx

from . import db
from .embeddings import embed_query

TOP_K = 5
CANDIDATES = 12
ESCALATE_THRESHOLD = 0.30  # cosine similarity floor for "we know nothing"

LANG_NAMES = {"ru": "русском языке", "en": "English", "uk": "українською мовою"}

# Trailing directive in the TARGET language — models follow it far more
# reliably than a mid-prompt rule, especially when the KB language differs.
LANG_DIRECTIVE = {
    "ru": "ВАЖНО: ответь ТОЛЬКО на русском языке (не на украинском!), независимо от языка вопроса и базы знаний.",
    "en": "IMPORTANT: reply ONLY in English (never Ukrainian or Russian), regardless of the question or knowledge-base language.",
    "uk": "ВАЖЛИВО: відповідай ТІЛЬКИ українською мовою, незалежно від мови питання чи бази знань.",
}

ESCALATE_TEXT = {
    "ru": "Я передал ваш вопрос персональному менеджеру — он ответит в ближайшее время.",
    "en": "I've handed your question to your personal manager — they will reply shortly.",
    "uk": "Я передав ваше питання персональному менеджеру — він відповість найближчим часом.",
}
ESCALATE_TEXT_2 = {
    "ru": "Этот вопрос лучше решит ваш менеджер — я уже передал ему диалог.",
    "en": "Your manager is better placed to handle this — I've already handed over the conversation.",
    "uk": "Це питання краще вирішить ваш менеджер — я вже передав йому діалог.",
}
EXTRACTIVE_PREFIX = {
    "ru": "Вот что я нашёл в базе знаний DEMAX:",
    "en": "Here is what I found in the DEMAX knowledge base:",
    "uk": "Ось що я знайшов у базі знань DEMAX:",
}


def system_prompt(language: str) -> str:
    lang_name = LANG_NAMES.get(language, LANG_NAMES["ru"])
    return f"""Ти — консультант бренду професійної косметики DEMAX (Україна).
Відповідай ТІЛЬКИ на основі наданого контексту з бази знань DEMAX.
Правила:
- ЗАВЖДИ відповідай {lang_name} — це мова інтерфейсу користувача.
  Відповідай нею незалежно від мови питання чи мови бази знань.
- Будь стислим і дружнім; форматуй списки через "-".
- Не вигадуй фактів, цін чи властивостей, яких немає в контексті.
- Якщо в контексті немає відповіді, або питання потребує медичної поради,
  скарги чи комерційного рішення — відповідай рівно одним словом: ESCALATE
- Не згадуй "контекст" чи "базу знань" у відповіді."""


def retrieve(query: str) -> list[dict]:
    """Hybrid retrieval → [{chunk_id, article_id, title, source_url, content, score}]."""
    qvec = embed_query(query)
    with db.pool().connection() as conn:
        knn = conn.execute(
            "SELECT c.id, c.article_id, a.title, a.source_url, c.content, "
            "       1 - (c.embedding <=> %s) AS sim "
            "FROM knowledge_chunks c JOIN knowledge_articles a ON a.id = c.article_id "
            "WHERE a.status = 'published' "
            "ORDER BY c.embedding <=> %s LIMIT %s",
            (qvec, qvec, CANDIDATES),
        ).fetchall()
        fts = conn.execute(
            "SELECT c.id, c.article_id, a.title, a.source_url, c.content, "
            "       ts_rank(to_tsvector('simple', c.content), websearch_to_tsquery('simple', %s)) AS r "
            "FROM knowledge_chunks c JOIN knowledge_articles a ON a.id = c.article_id "
            "WHERE a.status = 'published' "
            "  AND to_tsvector('simple', c.content) @@ websearch_to_tsquery('simple', %s) "
            "ORDER BY r DESC LIMIT %s",
            (query, query, CANDIDATES),
        ).fetchall()

    # Reciprocal Rank Fusion over both ranked lists.
    scores: dict[str, float] = {}
    rows: dict[str, tuple] = {}
    sim_by_id: dict[str, float] = {}
    for rank, row in enumerate(knn):
        cid = str(row[0])
        scores[cid] = scores.get(cid, 0) + 1.0 / (60 + rank)
        rows[cid] = row
        sim_by_id[cid] = float(row[5])
    for rank, row in enumerate(fts):
        cid = str(row[0])
        scores[cid] = scores.get(cid, 0) + 1.0 / (60 + rank)
        rows.setdefault(cid, row)

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:TOP_K]
    out = []
    for cid, _ in ranked:
        row = rows[cid]
        out.append({
            "chunk_id": cid,
            "article_id": str(row[1]),
            "title": row[2],
            "source_url": row[3],
            "content": row[4],
            "score": sim_by_id.get(cid, 0.0),
        })
    return out


INTENTS = [
    (re.compile(r"семінар|вебінар|навчанн|обучени|семинар|тренинг|schedule|seminar", re.I), "seminar_info"),
    (re.compile(r"ціна|цін|стоимост|прайс|price|купит|замов|заказ|опт", re.I), "commercial"),
    (re.compile(r"скарг|жалоб|поверн|возврат|брак|complain", re.I), "complaint"),
    (re.compile(r"верифік|диплом|professional|професійн.*доступ", re.I), "verification"),
    (re.compile(r"протокол|процедур|пілінг|пилинг|карбокси|мезо", re.I), "protocol_question"),
]


def detect_intent(text: str) -> str:
    for rx, intent in INTENTS:
        if rx.search(text):
            return intent
    return "product_recommendation"


def _openai_complete(messages: list[dict]) -> str | None:
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key:
        return None
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    r = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}"},
        json={"model": model, "messages": messages, "max_tokens": 700, "temperature": 0.3},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _anthropic_complete(messages: list[dict]) -> str | None:
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key:
        return None
    model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")
    system = next((m["content"] for m in messages if m["role"] == "system"), "")
    rest = [m for m in messages if m["role"] != "system"]
    r = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={"x-api-key": key, "anthropic-version": "2023-06-01"},
        json={"model": model, "system": system, "messages": rest, "max_tokens": 700},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["content"][0]["text"]


def generate(question: str, context: list[dict], history: list[dict], language: str) -> str | None:
    """LLM answer; None if no provider key is configured."""
    ctx = "\n\n---\n\n".join(
        f"[{i + 1}] {c['title']}\n{c['content']}" for i, c in enumerate(context)
    )
    directive = LANG_DIRECTIVE.get(language, LANG_DIRECTIVE["ru"])
    messages = [
        {"role": "system", "content": system_prompt(language)},
        *history[-6:],
        {"role": "user", "content": f"Контекст із бази знань DEMAX:\n\n{ctx}\n\nПитання клієнта: {question}\n\n{directive}"},
    ]
    if os.environ.get("ANTHROPIC_API_KEY", "").strip():
        return _anthropic_complete(messages)
    return _openai_complete(messages)


def extractive_answer(context: list[dict], language: str) -> str:
    """No-LLM fallback: compose the best chunks verbatim with titles."""
    parts = []
    for c in context[:2]:
        snippet = c["content"][:600].rsplit(".", 1)[0]
        parts.append(f"**{c['title']}**\n{snippet}.")
    prefix = EXTRACTIVE_PREFIX.get(language, EXTRACTIVE_PREFIX["ru"])
    return prefix + "\n\n" + "\n\n".join(parts)


def answer(question: str, history: list[dict], language: str = "ru") -> dict:
    """Full RAG turn → spec-shaped fields (reply/intent/confidence/escalated/sources)."""
    context = retrieve(question)
    intent = detect_intent(question)
    top_score = context[0]["score"] if context else 0.0

    if not context or top_score < ESCALATE_THRESHOLD:
        return {
            "reply": ESCALATE_TEXT.get(language, ESCALATE_TEXT["ru"]),
            "intent": intent,
            "confidence": round(top_score, 2),
            "escalated": True,
            "sources": [],
        }

    reply = None
    try:
        reply = generate(question, context, history, language)
    except Exception:  # noqa: BLE001 — LLM outage → graceful degradation per spec
        reply = None

    if reply is None:
        reply = extractive_answer(context, language)
    elif reply.strip().upper().startswith("ESCALATE"):
        return {
            "reply": ESCALATE_TEXT_2.get(language, ESCALATE_TEXT_2["ru"]),
            "intent": intent if intent != "product_recommendation" else "manager_request",
            "confidence": round(min(top_score, 0.4), 2),
            "escalated": True,
            "sources": [],
        }

    seen: set[str] = set()
    sources = []
    for c in context:
        if c["article_id"] in seen:
            continue
        seen.add(c["article_id"])
        sources.append({
            "article_id": c["article_id"],
            "title": c["title"],
            "url": None if (c["source_url"] or "").startswith("pdf://") else c["source_url"],
        })
    return {
        "reply": reply,
        "intent": intent,
        "confidence": round(min(0.98, 0.5 + top_score / 2), 2),
        "escalated": False,
        "sources": sources[:3],
    }
