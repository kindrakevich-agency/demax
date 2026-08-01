"""Postgres (pgvector) access for the DEMAX RAG demo.

Schema follows the DBSPEC naming: knowledge_articles / knowledge_chunks /
ai_conversations / ai_messages — trimmed to what the RAG surface needs.
"""

import os

from pgvector.psycopg import register_vector
from psycopg_pool import ConnectionPool

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://demax:demax@localhost:5432/demax")

EMBED_DIM = 384  # paraphrase-multilingual-MiniLM-L12-v2

_pool: ConnectionPool | None = None


def pool() -> ConnectionPool:
    """Connection pool with the pgvector type registered.

    register_vector fails until CREATE EXTENSION vector has run, so the
    extension is created via a plain connection in init_schema() BEFORE
    the pool is first opened.
    """
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            DATABASE_URL,
            min_size=1,
            max_size=8,
            kwargs={"autocommit": True},
            configure=register_vector,
            open=True,
        )
    return _pool


SCHEMA = f"""
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL DEFAULT 'products',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_url TEXT UNIQUE,
    language TEXT NOT NULL DEFAULT 'uk',
    status TEXT NOT NULL DEFAULT 'published',
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    token_count INT NOT NULL DEFAULT 0,
    embedding VECTOR({EMBED_DIM})
);
CREATE INDEX IF NOT EXISTS idx_chunks_article ON knowledge_chunks(article_id);

CREATE INDEX IF NOT EXISTS idx_articles_fts ON knowledge_articles
    USING GIN (to_tsvector('simple', title || ' ' || content));

-- Переклади інтерфейсу: єдине джерело правди для всіх мов адмінки.
-- Ключ — стабільний ідентифікатор рядка, значення — по мові.
CREATE TABLE IF NOT EXISTS ui_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    namespace TEXT NOT NULL,
    key TEXT NOT NULL,
    uk TEXT NOT NULL,
    ru TEXT NOT NULL,
    en TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (namespace, key)
);
CREATE INDEX IF NOT EXISTS idx_ui_translations_ns ON ui_translations(namespace);

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'active',
    last_intent TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    intent TEXT,
    confidence REAL,
    retrieved_article_ids UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON ai_messages(conversation_id, created_at);
"""


def init_schema() -> None:
    import time

    import psycopg

    # Plain connection (no vector type registration) — waits for Postgres
    # and creates the extension + tables, so the pool's register_vector
    # configure hook has the type available from its very first connection.
    last_err: Exception | None = None
    for _ in range(30):
        try:
            with psycopg.connect(DATABASE_URL, autocommit=True) as conn:
                conn.execute(SCHEMA)
                conn.execute(
                    "CREATE INDEX IF NOT EXISTS idx_chunks_hnsw ON knowledge_chunks "
                    "USING hnsw (embedding vector_cosine_ops)"
                )
            last_err = None
            break
        except psycopg.OperationalError as e:
            last_err = e
            time.sleep(2)
    if last_err is not None:
        raise last_err


def chunk_count() -> int:
    with pool().connection() as conn:
        row = conn.execute("SELECT count(*) FROM knowledge_chunks").fetchone()
        return int(row[0]) if row else 0


def article_stats() -> list[dict]:
    with pool().connection() as conn:
        rows = conn.execute(
            "SELECT a.category, count(DISTINCT a.id) AS articles, count(c.id) AS chunks "
            "FROM knowledge_articles a LEFT JOIN knowledge_chunks c ON c.article_id = a.id "
            "GROUP BY a.category ORDER BY articles DESC"
        ).fetchall()
        return [{"category": r[0], "articles": r[1], "chunks": r[2]} for r in rows]
