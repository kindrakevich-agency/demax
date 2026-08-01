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

Відповідай на основі наданих довідкових матеріалів DEMAX:
- будь стислим і привітним; списки оформлюй через "-";
- не вигадуй конкретних фактів, цін чи складу, яких немає в матеріалах;
- не згадуй у відповіді слова "контекст" чи "база знань".

Коли матеріали дотичні до питання, але не відповідають на нього дослівно —
однаково дай корисну відповідь із того, що є, і за потреби додай, що деталі
підкаже менеджер. Це нормальна поведінка, а не привід відмовлятися.

Напиши рівно одне слово ESCALATE ЛИШЕ у трьох випадках:
1) питання стосується медичного діагнозу чи лікування;
2) це скарга або конфліктна ситуація;
3) потрібне комерційне рішення (ціна, знижка, опт, повернення грошей).
В усіх інших випадках відповідай сам.""",
    "ru": """Ты — консультант украинского бренда профессиональной косметики DEMAX.

ТВОЙ ЯЗЫК: РУССКИЙ. Пиши ответ исключительно на русском языке, даже если вопрос
задан на украинском или английском и даже если справочные материалы на украинском.
Переводи всё на русский: и текст, и пункты списков, и названия разделов.

Отвечай на основе предоставленных справочных материалов DEMAX:
- будь кратким и доброжелательным; списки оформляй через "-";
- не выдумывай конкретных фактов, цен или состава, которых нет в материалах;
- не упоминай в ответе слова "контекст" или "база знаний".

Когда материалы связаны с вопросом, но не отвечают на него дословно — всё
равно дай полезный ответ из того, что есть, и при необходимости добавь, что
детали подскажет менеджер. Это нормальное поведение, а не повод отказываться.

Напиши ровно одно слово ESCALATE ТОЛЬКО в трёх случаях:
1) вопрос касается медицинского диагноза или лечения;
2) это жалоба или конфликтная ситуация;
3) нужно коммерческое решение (цена, скидка, опт, возврат денег).
Во всех остальных случаях отвечай сам.""",
    "en": """You are a consultant for DEMAX, a Ukrainian professional cosmetics brand.

YOUR LANGUAGE: ENGLISH. Write the answer in English only, even when the question
is asked in Ukrainian or Russian and even when the reference material is in
Ukrainian. Translate everything into English: prose, list items and section names.

Answer from the provided DEMAX reference material:
- be concise and friendly; format lists with "-";
- never invent specific facts, prices or ingredients absent from the material;
- never mention the words "context" or "knowledge base" in your answer.

When the material is related to the question but does not answer it verbatim,
still give a useful answer from what is there, and add that a manager can
provide details if needed. That is expected behaviour, not a reason to decline.

Reply with exactly one word ESCALATE ONLY in three cases:
1) the question concerns a medical diagnosis or treatment;
2) it is a complaint or a conflict;
3) a commercial decision is required (price, discount, wholesale, refund).
In every other case, answer yourself.""",
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


# ── Аналітик операційних даних (окремий сценарій від консультанта) ──────
# Консультант відповідає клієнтам із бази знань; цей режим читає стан
# самої системи й пише коротку зведення для конкретного менеджера.
INSIGHTS_PROMPTS = {
    "uk": """Ти — операційний аналітик адмін-панелі DEMAX. Пишеш стисле
зведення особисто для {name} ({role}) УКРАЇНСЬКОЮ мовою.

Правила:
- лише факти з наданих даних; жодних вигаданих чисел;
- 3–6 пунктів через "-", кожен — одне речення з конкретною цифрою;
- почни з одного рядка головного висновку (що зараз найважливіше);
- заверши рядком "Що зробити:" і однією найпріоритетнішою дією;
- звертайся на «ви», по-діловому й доброзичливо, без води й привітань.""",
    "ru": """Ты — операционный аналитик админ-панели DEMAX. Пишешь краткую
сводку лично для {name} ({role}) НА РУССКОМ языке.

Правила:
- только факты из предоставленных данных; никаких выдуманных чисел;
- 3–6 пунктов через "-", каждый — одно предложение с конкретной цифрой;
- начни с одной строки главного вывода (что сейчас важнее всего);
- заверши строкой "Что сделать:" и одним приоритетным действием;
- обращайся на «вы», по-деловому и доброжелательно, без воды и приветствий.""",
    "en": """You are the operations analyst of the DEMAX admin panel. Write a
concise briefing personally for {name} ({role}) IN ENGLISH.

Rules:
- facts from the supplied data only; never invent numbers;
- 3–6 bullets with "-", each one sentence carrying a concrete figure;
- open with a single headline line (what matters most right now);
- close with a line "What to do:" and one top-priority action;
- address the reader directly, businesslike and warm, no filler or greetings.""",
}


def insights(question: str, snapshot: dict, name: str, role: str, language: str) -> str:
    """Звіт по стану системи для конкретного менеджера."""
    import json as _json

    sys_p = INSIGHTS_PROMPTS.get(language, INSIGHTS_PROMPTS["uk"]).format(name=name, role=role)
    directive = LANG_DIRECTIVE.get(language, LANG_DIRECTIVE["uk"])
    data = _json.dumps(snapshot, ensure_ascii=False, indent=1)[:14000]
    messages = [
        {"role": "system", "content": sys_p},
        {"role": "user", "content": f"Стан системи (JSON):\n{data}\n\nЗапит: {question}\n\n{directive}"},
    ]
    if os.environ.get("ANTHROPIC_API_KEY", "").strip():
        out = _anthropic_complete(messages)
    else:
        out = _openai_complete(messages)
    return out or ""


def retrieve(query: str) -> list[dict]:
    """Hybrid retrieval → [{chunk_id, article_id, title, source_url, content, score}]."""
    qvec = embed_query(query)
    cols = ("c.id, c.article_id, a.title, a.source_url, c.content, "
            "a.image_url, a.price, a.is_product")
    with db.pool().connection() as conn:
        knn = conn.execute(
            f"SELECT {cols}, 1 - (c.embedding <=> %s) AS sim "
            "FROM knowledge_chunks c JOIN knowledge_articles a ON a.id = c.article_id "
            "WHERE a.status = 'published' "
            "ORDER BY c.embedding <=> %s LIMIT %s",
            (qvec, qvec, CANDIDATES),
        ).fetchall()
        fts = conn.execute(
            f"SELECT {cols}, "
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
        sim_by_id[cid] = float(row[8])
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
            "image_url": row[5],
            "price": row[6],
            "is_product": bool(row[7]),
            "score": sim_by_id.get(cid, 0.0),
        })
    return out


# Наміри, для яких картки товарів недоречні (питання не про продукт).
NON_PRODUCT_INTENTS = {"seminar_info", "verification", "commercial", "complaint"}

# Загальні слова, що є майже в кожній назві товару — для лексичного збігу
# вони лише шумлять.
STOPWORDS = {
    "demax", "демакс", "засоби", "засіб", "средства", "средство", "products",
    "product", "догляду", "догляд", "уход", "ухода", "care", "який", "яких",
    "які", "какие", "какой", "which", "what", "does", "have", "тобто", "мене",
    "мені", "будь", "ласка", "please", "розкажи", "расскажи", "tell", "about",
    "пропонує", "предлагает", "offer", "offers", "підійде", "подойдёт", "suits",
}


def retrieve_products(query: str, limit: int = 3) -> list[dict]:
    """Товари для карток — окремий гібридний пошук по сторінках /product/.

    Основний RRF часто виграють оглядові сторінки категорій (у них більше
    тексту), тож товарів із фото в контексті може не бути зовсім. Абсолютний
    поріг схожості теж ненадійний: модель ембедінгів стискає діапазон
    (нерелевантні «семінари» дають 0.50, точний збіг «молочко для тіла» —
    0.54). Тому беремо RRF з векторного й повнотекстового пошуку: лексична
    частина витягує саме ті товари, назва яких містить слова запиту.
    """
    qvec = embed_query(query)
    with db.pool().connection() as conn:
        knn = conn.execute(
            "SELECT DISTINCT ON (a.id) a.id, a.title, a.source_url, a.image_url, a.price, "
            "       1 - (c.embedding <=> %s) AS sim "
            "FROM knowledge_chunks c JOIN knowledge_articles a ON a.id = c.article_id "
            "WHERE a.status = 'published' AND a.is_product AND a.image_url IS NOT NULL "
            "ORDER BY a.id, c.embedding <=> %s",
            (qvec, qvec),
        ).fetchall()
        # Триграмний збіг слів запиту з назвою товару: на відміну від FTS з
        # конфігурацією 'simple', він не залежить від відмінка й дрібних
        # розбіжностей у написанні.
        terms = [w for w in re.findall(r"\w{4,}", query.lower()) if w not in STOPWORDS]
        fts = []
        if terms:
            fts = conn.execute(
                "SELECT a.id, a.title, a.source_url, a.image_url, a.price, "
                "       max(word_similarity(t.term, lower(a.title))) AS r "
                "FROM knowledge_articles a, unnest(%s::text[]) AS t(term) "
                "WHERE a.status = 'published' AND a.is_product AND a.image_url IS NOT NULL "
                "GROUP BY a.id, a.title, a.source_url, a.image_url, a.price "
                "HAVING max(word_similarity(t.term, lower(a.title))) > 0.45 "
                "ORDER BY r DESC LIMIT 10",
                (terms,),
            ).fetchall()

    knn_ranked = sorted(knn, key=lambda r: -float(r[5]))[:10]
    scores: dict[str, float] = {}
    rows: dict[str, tuple] = {}
    for rank, r in enumerate(knn_ranked):
        k = str(r[0])
        scores[k] = scores.get(k, 0) + 1.0 / (10 + rank)
        rows[k] = r
    for rank, r in enumerate(fts):
        k = str(r[0])
        # Збіг у назві важить більше: саме він рятує запити на кшталт
        # «догляд за тілом», де семантика розмита між усіма доглядовими.
        scores[k] = scores.get(k, 0) + 3.0 / (10 + rank)
        rows.setdefault(k, r)

    top = sorted(scores.items(), key=lambda kv: -kv[1])[:limit]
    return [
        {
            "article_id": str(rows[k][0]),
            "title": rows[k][1],
            "url": rows[k][2],
            "image_url": rows[k][3],
            "price": rows[k][4],
        }
        for k, _ in top
    ]


INTENTS = [
    (re.compile(r"семінар|вебінар|навчанн|обучени|семинар|тренинг|schedule|seminar", re.I), "seminar_info"),
    (re.compile(r"ціна|цін|стоимост|прайс|price|купит|замов|заказ|опт", re.I), "commercial"),
    (re.compile(
        r"скарг|жалоб|поверн|возврат|бракован|брак\b|претенз|обман|незадовол|"
        r"недовол|complain|refund|return|defect|broken|damaged",
        re.I,
    ), "complaint"),
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


def generate(
    question: str,
    context: list[dict],
    history: list[dict],
    language: str,
    products: list[dict] | None = None,
) -> str | None:
    """LLM answer; None if no provider key is configured."""
    ctx = "\n\n---\n\n".join(
        f"[{i + 1}] {c['title']}\n{c['content']}" for i, c in enumerate(context)
    )
    # Знайдені товари додаємо в контекст окремим блоком: сторінки товарів
    # короткі й програють оглядовим у пошуку, через що модель відповідала
    # «інформації немає», хоча картки під відповіддю показували ці ж товари.
    if products:
        lines = [
            f"- {p['title']}" + (f" — {p['price']}" if p.get("price") else "")
            for p in products
        ]
        ctx += "\n\n---\n\nТовари з каталогу DEMAX, доречні до питання:\n" + "\n".join(lines)
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

    # Скарги передаємо людині детерміновано, не покладаючись на рішення
    # моделі: у тестах вона інколи бралася відповідати на «прийшов
    # бракований товар», хоча це прямий випадок для менеджера.
    if intent == "complaint":
        return {
            "reply": ESCALATE_TEXT_2.get(language, ESCALATE_TEXT_2["uk"]),
            "intent": "complaint",
            "confidence": 0.0,
            "escalated": True,
            "sources": [],
            "products": [],
        }

    if not context or top_score < ESCALATE_THRESHOLD:
        return {
            "reply": ESCALATE_TEXT.get(language, ESCALATE_TEXT["ru"]),
            "intent": intent,
            "confidence": round(top_score, 2),
            "escalated": True,
            "sources": [],
            "products": [],
        }

    # Товари шукаємо ДО генерації, щоб модель бачила їх у контексті —
    # інакше текст відповіді суперечив би карткам під нею.
    products: list[dict] = []
    if intent not in NON_PRODUCT_INTENTS:
        try:
            products = retrieve_products(question)
        except Exception:  # noqa: BLE001 — картки не критичні для відповіді
            products = []

    reply = None
    try:
        reply = generate(question, context, history, language, products)
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
            "products": [],
        }

    seen: set[str] = set()
    sources = []
    for c in context:
        if c["article_id"] in seen:
            continue
        seen.add(c["article_id"])
        url = None if (c["source_url"] or "").startswith("pdf://") else c["source_url"]
        sources.append({"article_id": c["article_id"], "title": c["title"], "url": url})

    return {
        "reply": reply,
        "intent": intent,
        "confidence": round(min(0.98, 0.5 + top_score / 2), 2),
        "escalated": False,
        "sources": sources[:3],
        "products": products[:4],
    }
