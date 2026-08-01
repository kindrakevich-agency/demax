"""Local embeddings via fastembed (ONNX, CPU) — no external API calls.

Model: paraphrase-multilingual-MiniLM-L12-v2 (384-dim), covers uk/ru/en —
the demo stand-in for the production embedding model (BLOCKING OQ-7).
"""

from functools import lru_cache

import numpy as np
from fastembed import TextEmbedding

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


@lru_cache(maxsize=1)
def _model() -> TextEmbedding:
    return TextEmbedding(model_name=MODEL_NAME)


def embed_passages(texts: list[str]) -> list[np.ndarray]:
    return [np.array(v, dtype=np.float32) for v in _model().embed(texts, batch_size=16)]


def embed_query(text: str) -> np.ndarray:
    return next(iter(embed_passages([text])))
