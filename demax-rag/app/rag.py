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

# Системний промпт пишеться ПОВНІСТЮ мовою відповіді — це найнадійніший сигнал
# для моделі. Інструкція «відповідай мовою X», написана іншою мовою, регулярно
# ігнорується, коли контекст із бази знань іншою мовою (тут — українською).
SYSTEM_PROMPTS = {
    "uk": """Ти — консультант українського бренду професійної косметики DEMAX.

ТВОЯ МОВА: УКРАЇНСЬКА. Пиши відповідь виключно українською мовою, навіть якщо
запитання поставлене російською або англійською.

Відповідай ЛИШЕ на основі наданого контексту з бази знань DEMAX:
- будь стислим і привітним; списки оформлюй через "-";
- не вигадуй фактів, цін чи властивостей, яких немає в контексті;
- не згадуй у відповіді слова "контекст" чи "база знань";
- якщо в контексті немає відповіді, або питання стосується медичної поради,
  скарги чи комерційного рішення — напиши рівно одне слово: ESCALATE""",
    "ru": """Ты — консультант украинского бренда профессиональной косметики DEMAX.

ТВОЙ ЯЗЫК: РУССКИЙ. Пиши ответ исключительно на русском языке, даже если вопрос
задан на украинском или английском и даже если справочные материалы на украинском.
Переводи всё на русский: и текст, и пункты списков, и названия разделов.

Отвечай ТОЛЬКО на основе предоставленного контекста из базы знаний DEMAX:
- будь кратким и доброжелательным; списки оформляй через "-";
- не выдумывай фактов, цен или свойств, которых нет в контексте;
- не упоминай в ответе слова "контекст" или "база знаний";
- если в контексте нет ответа, либо вопрос касается медицинской консультации,
  жалобы или коммерческого решения — напиши ровно одно слово: ESCALATE""",
    "en": """You are a consultant for DEMAX, a Ukrainian professional cosmetics brand.

YOUR LANGUAGE: ENGLISH. Write the answer in English only, even when the question
is asked in Ukrainian or Russian and even when the reference material is in
Ukrainian. Translate everything into English: prose, list items and section names.

Answer ONLY from the provided DEMAX knowledge-base context:
- be concise and friendly; format lists with "-";
- never invent facts, prices or properties that are not in the context;
- never mention the words "context" or "knowledge base" in your answer;
- if the context has no answer, or the question calls for medical advice,
  is a complaint, or needs a commercial decision — reply with exactly one word: ESCALATE""",
}

# Коротке нагадування наприкінці user-повідомлення — друга лінія захисту.
LANG_DIRECTIVE = {
    "uk": "Нагадування: відповідь має бути українською мовою.",
    "ru": "Напоминание: ответ должен быть на русском языке. Переведи на русский всё, включая списки.",
    "en": "Reminder: the answer must be in English. Translate everything, including list items.",
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
    return SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS["uk"])


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
    """Claude Opus 5 — основний провайдер відповідей консультанта.

    Налаштування під цей сценарій (коротка обґрунтована відповідь у чат-віджеті):
    - adaptive thinking на effort=low: на Opus 5 низький рівень зусиль дає високу
      якість при мінімальній затримці; вимикати thinking не варто — це окремий
      клас проблем (див. міграційний гайд Anthropic);
    - max_tokens покриває thinking + текст відповіді разом, тому із запасом;
    - server-side fallback: якщо класифікатор безпеки відхилить запит, Anthropic
      сам переграє його на резервній моделі замість того, щоб віддати відмову.
    """
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key:
        return None
    model = os.environ.get("ANTHROPIC_MODEL", "claude-opus-5")
    system = next((m["content"] for m in messages if m["role"] == "system"), "")
    rest = [m for m in messages if m["role"] != "system"]
    r = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "server-side-fallback-2026-07-01",
        },
        json={
            "model": model,
            "system": system,
            "messages": rest,
            "max_tokens": 4096,
            "thinking": {"type": "adaptive"},
            "output_config": {"effort": "low"},
            "fallbacks": "default",
        },
        timeout=60,
    )
    r.raise_for_status()
    data = r.json()
    # Відмова класифікатора — content порожній або частковий; віддаємо None,
    # щоб спрацював екстрактивний режим замість зламаної відповіді.
    if data.get("stop_reason") == "refusal":
        return None
    # З увімкненим thinking перший блок може бути thinking — беремо саме text.
    return next((b["text"] for b in data.get("content", []) if b.get("type") == "text"), None)


def generate(question: str, context: list[dict], history: list[dict], language: str) -> str | None:
    """LLM answer; None if no provider key is configured."""
    ctx = "\n\n---\n\n".join(
        f"[{i + 1}] {c['title']}\n{c['content']}" for i, c in enumerate(context)
    )
    directive = LANG_DIRECTIVE.get(language, LANG_DIRECTIVE["uk"])
    messages = [
        {"role": "system", "content": system_prompt(language)},
        *history[-6:],
        {"role": "user", "content": f"Довідкові матеріали DEMAX:\n\n{ctx}\n\nЗапитання: {question}\n\n{directive}"},
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
