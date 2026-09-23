"""Unified LLM provider factory.

Reads LLM_PROVIDER from configuration and returns the appropriate LangChain chat model.
Supported providers:
  - "ollama"  (default) — local Ollama server via langchain-ollama
  - "gemini"           — Google Gemini API via langchain-google-genai
"""

import logging
import os
import random
import re
import time
from langchain_google_genai import ChatGoogleGenerativeAI
from config import settings
from llm.cache import init_llm_cache

logger = logging.getLogger("osa.llm")

# Initialize in-memory cache for prompt caching if enabled
if settings.llm_cache_enabled:
    init_llm_cache(max_entries=settings.llm_cache_max_entries)

_llm_instance = None


def _execute_with_backoff(func, *args, pacing: float | None = None, **kwargs):
    """Executes a function with smart retry and backoff for Gemini 429 and 503 errors."""
    max_attempts = 7
    if pacing is None:
        pacing = settings.gemini.pacing_seconds if get_provider_name() == "gemini" else 0.5

    for attempt in range(1, max_attempts + 1):
        try:
            # Polite pacing between requests to prevent quota bursting
            if pacing > 0:
                time.sleep(pacing)
            return func(*args, **kwargs)
        except Exception as e:
            err_str = str(e)
            is_429 = (
                "429" in err_str
                or "RESOURCE_EXHAUSTED" in err_str
                or "quota" in err_str.lower()
            )
            is_503 = "503" in err_str or "UNAVAILABLE" in err_str

            if (is_429 or is_503) and attempt < max_attempts:
                # Check for explicit retry delay in response:
                # e.g. "Please retry after 32s", "retry in 12.5s", "retryDelay: '32s'", or "retry_delay { seconds: 45 }"
                delay = None
                match_s = re.search(
                    r"(?:retry\s+(?:in|after)|retryDelay[:\s]+'?)\s*([\d\.]+)\s*s",
                    err_str,
                    re.IGNORECASE,
                )
                if match_s:
                    delay = float(match_s.group(1)) + 1.5
                else:
                    match_sec = re.search(
                        r"(?:retry_delay|retryDelay)[^}]*?seconds[:\s]+'?([\d\.]+)",
                        err_str,
                        re.IGNORECASE,
                    )
                    if match_sec:
                        delay = float(match_sec.group(1)) + 1.5

                if delay is None:
                    if is_429:
                        # Token bucket window resets around 60s, back off exponentially up to 65s
                        delay = min(
                            65.0,
                            5.0 * (2 ** (attempt - 1)) + random.uniform(0.5, 2.0),
                        )
                    else:  # 503
                        delay = min(
                            20.0,
                            3.0 * (1.5 ** (attempt - 1)) + random.uniform(0.5, 1.5),
                        )

                reason = "429 RESOURCE_EXHAUSTED" if is_429 else "503 UNAVAILABLE"
                logger.warning(
                    "[Gemini Rate Limit] %s on attempt %d/%d. Waiting %.1fs before retrying...",
                    reason,
                    attempt,
                    max_attempts,
                    delay,
                )
                time.sleep(delay)
            else:
                raise


class ResilientChatGoogleGenerativeAI(ChatGoogleGenerativeAI):
    """ChatGoogleGenerativeAI with intelligent backoff and retry-after parsing.

    Any call to invoke(), _generate(), or with_structured_output().invoke()
    delegates to this underlying model instance, automatically benefiting from _execute_with_backoff.
    """

    def invoke(self, input, config=None, **kwargs):
        return _execute_with_backoff(super().invoke, input, config=config, **kwargs)

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        return _execute_with_backoff(
            super()._generate, messages, stop=stop, run_manager=run_manager, **kwargs
        )


def _create_ollama():
    from langchain_ollama import ChatOllama

    cfg = settings.ollama
    return ChatOllama(
        model=cfg.model,
        temperature=cfg.temperature,
        num_predict=cfg.max_tokens,
        num_ctx=cfg.num_ctx,
        keep_alive="10m",
    )


def _create_gemini():
    cfg = settings.gemini
    if not cfg.api_key:
        raise ValueError(
            "GEMINI_API_KEY is required when LLM_PROVIDER=gemini. "
            "Set it in your .env file."
        )

    return ResilientChatGoogleGenerativeAI(
        model=cfg.model,
        google_api_key=cfg.api_key,
        temperature=cfg.temperature,
        max_output_tokens=cfg.max_tokens,
    )


_PROVIDERS = {
    "ollama": _create_ollama,
    "gemini": _create_gemini,
}


def get_provider_name() -> str:
    """Return the configured LLM provider name."""
    return settings.llm_provider


def get_llm():
    """Get or create the singleton LLM instance."""
    global _llm_instance
    if _llm_instance is not None:
        return _llm_instance

    provider = get_provider_name()
    factory = _PROVIDERS.get(provider)

    if factory is None:
        supported = ", ".join(sorted(_PROVIDERS.keys()))
        raise ValueError(
            f"Unknown LLM_PROVIDER='{provider}'. Supported: {supported}"
        )

    logger.info("Initializing LLM provider: %s", provider)
    _llm_instance = factory()
    return _llm_instance


# Module-level singleton — created on first import
llm = get_llm()
