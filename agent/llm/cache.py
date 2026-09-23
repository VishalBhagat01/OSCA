"""Deployment-friendly in-memory LLM cache with capacity management.

Avoids disk-locking dependencies (like SQLite) to ensure compatibility
with stateless container deployments (Docker, Cloud Run, AWS ECS).
"""

import logging
from typing import Any, Optional
from langchain_core.caches import InMemoryCache
from langchain_core.globals import set_llm_cache

logger = logging.getLogger("osa.llm.cache")

_cache_instance: Optional[InMemoryCache] = None


class BoundedInMemoryCache(InMemoryCache):
    """In-memory cache with simple capacity bounding to prevent memory leaks in long-running processes."""

    def __init__(self, max_entries: int = 1000):
        super().__init__()
        self.max_entries = max_entries

    def update(self, prompt: str, llm_string: str, return_val: Any) -> None:
        """Evicts oldest keys if cache exceeds capacity, then inserts new entry."""
        if len(self._cache) >= self.max_entries:
            # Pop the first (oldest) key in the dictionary
            try:
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]
            except (StopIteration, KeyError):
                pass
        super().update(prompt, llm_string, return_val)


def init_llm_cache(max_entries: int = 1000) -> InMemoryCache:
    """Initializes and registers the in-memory LLM cache globally with LangChain."""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = BoundedInMemoryCache(max_entries=max_entries)
        set_llm_cache(_cache_instance)
        logger.info("Initialized bounded in-memory LLM cache (max_entries=%d)", max_entries)
    return _cache_instance


def clear_llm_cache() -> None:
    """Clears the current cache entries."""
    global _cache_instance
    if _cache_instance is not None:
        _cache_instance.clear()
        logger.info("Cleared in-memory LLM cache")
