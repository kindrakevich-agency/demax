"""Knowledge ingestion for the DEMAX RAG demo.

Sources:
  1. Live site demax.com.ua — crawled via its public WordPress sitemaps
     (products, professional preparations, pages, posts). Ukrainian pages
     only (Russian duplicates are skipped).
  2. The archived 2021 Home-Care catalog PDF (data/catalog_2021.pdf).

Pipeline: fetch → extract text → chunk (~1100 chars, 150 overlap) →
embed (fastembed, multilingual MiniLM, 384-dim) → insert into pgvector.
"""

import logging
import re
import time
import threading
from xml.etree import ElementTree

import httpx
from bs4 import BeautifulSoup

from . import db
from .embeddings import embed_passages

log = logging.getLogger("ingest")

SITE = "https://www.demax.com.ua"
SITEMAPS = [
    f"{SITE}/product-sitemap.xml",
    f"{SITE}/prof-preparaty-sitemap.xml",
    f"{SITE}/page-sitemap.xml",
    f"{SITE}/post-sitemap.xml",
]
HEADERS = {"User-Agent": "DEMAX-RAG-demo/1.0 (+demax.kindrakevich.com)"}

CHUNK_SIZE = 1100
CHUNK_OVERLAP = 150

state = {"status": "idle", "done": 0, "total": 0, "error": None}


def _sitemap_urls(client: httpx.Client) -> list[str]:
    urls: list[str] = []
    for sm in SITEMAPS:
        try:
            r = client.get(sm, headers=HEADERS, timeout=20)
            if r.status_code != 200:
                continue
            root = ElementTree.fromstring(r.content)
            ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            for loc in root.findall(".//s:loc", ns):
                u = (loc.text or "").strip()
                if not u or "/ru/" in u or u.rstrip("/") == SITE:
                    continue
                urls.append(u)
        except Exception as e:  # noqa: BLE001 — best-effort crawl
            log.warning("sitemap %s failed: %s", sm, e)
    # de-dup, keep order
    seen: set[str] = set()
    out = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def _category(url: str) -> str:
    if "/product/" in url:
        return "products"
    if "prof" in url:
        return "professional"
    if "/blog/" in url or "post" in url:
        return "blog"
    return "pages"


def _product_meta(soup: BeautifulSoup, url: str) -> tuple[str | None, str | None]:
    """Фото й ціна товару зі сторінки WooCommerce.

    og:image на demax.com.ua віддає логотип теми, тож шукаємо в розмітці.

    Головне фото товару лежить у слайдері галереї (`.splide__slide`). Блок
    `.ark-woo-product-item-img` — це карусель СХОЖИХ товарів, там фото інших
    продуктів. Раніше ми брали будь-яке зображення із суфіксом `_main`, а такі
    файли трапляються саме в цій каруселі — через це 43 товари ділили 25 фото,
    і одна картинка повторювалася на шести сторінках.
    """
    def _src(img) -> str:
        return img.get("data-large_image") or img.get("data-src") or img.get("src") or ""

    def _usable(u: str) -> bool:
        return (
            "/wp-content/uploads/" in u
            and not re.search(r"-\d{2,3}x\d{2,3}\.", u)  # мініатюра
            and not u.lower().endswith(".svg")  # іконки теми
        )

    def _from_related(img) -> bool:
        return any(
            "ark-woo-product-item-img" in (p.get("class") or [])
            for p in img.parents
            if getattr(p, "get", None)
        )

    def _in_gallery(img) -> bool:
        return any(
            "splide__slide" in (p.get("class") or [])
            for p in img.parents
            if getattr(p, "get", None)
        )

    gallery, fallback = [], []
    for img in soup.select("img"):
        u = _src(img)
        if not _usable(u) or _from_related(img):
            continue
        (gallery if _in_gallery(img) else fallback).append(u)

    image = next(iter(gallery), None) or next(iter(fallback), None)

    price = None
    meta_price = soup.find("meta", property="product:price:amount")
    if meta_price and meta_price.get("content"):
        cur = soup.find("meta", property="product:price:currency")
        price = f"{meta_price['content']} {cur['content'] if cur and cur.get('content') else 'UAH'}".strip()
    if not price:
        el = soup.select_one("p.price, .summary .price, span.woocommerce-Price-amount")
        if el:
            txt = re.sub(r"\s+", " ", el.get_text(" ", strip=True))[:40]
            price = txt or None
    if image and image.startswith("//"):
        image = "https:" + image
    return image, price


def _extract(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "header", "footer", "form", "noscript", "iframe"]):
        tag.decompose()
    h1 = soup.find("h1")
    title = h1.get_text(" ", strip=True) if h1 else (soup.title.get_text(strip=True) if soup.title else "")
    # WooCommerce product page: summary + tab panels; otherwise main content.
    parts: list[str] = []
    for sel in [".summary", ".woocommerce-Tabs-panel", ".woocommerce-product-details__short-description",
                ".entry-content", "article", "main"]:
        for el in soup.select(sel):
            txt = el.get_text("\n", strip=True)
            if txt and len(txt) > 60:
                parts.append(txt)
        if parts:
            break
    text = "\n\n".join(parts) if parts else soup.get_text("\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return title[:250], text[:12000]


def _chunk(text: str) -> list[str]:
    text = text.strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(len(text), start + CHUNK_SIZE)
        # prefer to break on a sentence/paragraph boundary
        if end < len(text):
            cut = max(text.rfind("\n", start + 400, end), text.rfind(". ", start + 400, end))
            if cut > start:
                end = cut + 1
        chunks.append(text[start:end].strip())
        if end >= len(text):
            break
        start = max(end - CHUNK_OVERLAP, start + 1)
    return [c for c in chunks if len(c) > 80]


def _store(title: str, content: str, url: str | None, category: str,
           image: str | None = None, price: str | None = None, is_product: bool = False) -> int:
    # Заголовок додається до КОЖНОГО фрагмента, а не лише до першого.
    # Раніше `_chunk(title + content)` лишав назву тільки в нульовому фрагменті,
    # тож «Demax сироватка Anti Redness» не потрапляла у вектор решти шматків —
    # короткі товарні сторінки через це програвали оглядовим у пошуку.
    # Заголовок у тексті фрагмента допомагає обом гілкам: і векторній, і лексичній.
    head = (title or "").strip()
    chunks = [f"{head}\n\n{c}" if head else c for c in _chunk(content)]
    if not chunks:
        return 0
    vectors = embed_passages(chunks)
    with db.pool().connection() as conn:
        row = conn.execute(
            "INSERT INTO knowledge_articles (category, title, content, source_url, image_url, price, is_product) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s) "
            "ON CONFLICT (source_url) DO UPDATE SET title = EXCLUDED.title, "
            "content = EXCLUDED.content, image_url = EXCLUDED.image_url, price = EXCLUDED.price, "
            "is_product = EXCLUDED.is_product, version = knowledge_articles.version + 1 "
            "RETURNING id",
            (category, title or url or "Без назви", content, url, image, price, is_product),
        ).fetchone()
        art_id = row[0]
        conn.execute("DELETE FROM knowledge_chunks WHERE article_id = %s", (art_id,))
        for i, (chunk, vec) in enumerate(zip(chunks, vectors)):
            conn.execute(
                "INSERT INTO knowledge_chunks (article_id, chunk_index, content, token_count, embedding) "
                "VALUES (%s, %s, %s, %s, %s)",
                (art_id, i, chunk, len(chunk) // 4, vec),
            )
    return len(chunks)


def _ingest_pdf() -> None:
    try:
        from pypdf import PdfReader

        reader = PdfReader("data/catalog_2021.pdf")
        pages = [(p.extract_text() or "").strip() for p in reader.pages]
        text = "\n\n".join(p for p in pages if p)
        if len(text) < 500:
            log.warning("catalog PDF has little extractable text (%d chars) — skipping", len(text))
            return
        n = _store("Каталог DEMAX «Домашній догляд» (2021)", text, "pdf://catalog_2021", "catalog_pdf")
        log.info("catalog PDF ingested: %d chunks", n)
    except Exception as e:  # noqa: BLE001
        log.warning("catalog PDF ingestion failed: %s", e)


def run_ingest() -> None:
    state.update(status="running", done=0, total=0, error=None)
    try:
        _ingest_pdf()
        with httpx.Client(follow_redirects=True) as client:
            urls = _sitemap_urls(client)
            state["total"] = len(urls)
            log.info("crawling %d urls", len(urls))
            for i, url in enumerate(urls):
                try:
                    r = client.get(url, headers=HEADERS, timeout=20)
                    if r.status_code == 200:
                        title, text = _extract(r.text)
                        if len(text) > 200:
                            cat = _category(url)
                            is_prod = "/product/" in url
                            image = price = None
                            if is_prod:
                                image, price = _product_meta(BeautifulSoup(r.text, "lxml"), url)
                            _store(title, text, url, cat, image, price, is_prod)
                except Exception as e:  # noqa: BLE001
                    log.warning("skip %s: %s", url, e)
                state["done"] = i + 1
                time.sleep(0.35)  # politeness
        state["status"] = "done"
        log.info("ingest complete: %d chunks total", db.chunk_count())
    except Exception as e:  # noqa: BLE001
        state.update(status="failed", error=str(e))
        log.exception("ingest failed")


def ensure_ingested_async() -> None:
    """Kick a background ingest if the KB is empty (first boot)."""
    if db.chunk_count() > 0 or state["status"] == "running":
        return
    threading.Thread(target=run_ingest, daemon=True).start()
