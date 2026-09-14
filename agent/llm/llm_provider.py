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

logger = logging.getLogger("osa.llm")

_llm_instance = None


def _execute_with_backoff(func, *args, **kwargs):
    """Executes a function with smart retry and backoff for Gemini 429 and 503 errors."""
    max_attempts = 5
    for attempt in range(1, max_attempts + 1):
        try:
            # Polite pacing between requests to prevent quota bursting
            time.sleep(0.5)
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
                # Check for explicit retry delay in response, e.g. "Please retry in 32s" or "retryDelay: '32s'"
                match = re.search(
                    r"(?:retry in|retryDelay[:\s]+'?)\s*([\d\.]+)\s*s",
                    err_str,
                    re.IGNORECASE,
                )
                if match:
                    delay = float(match.group(1)) + 1.5
                elif is_429:
                    # Token bucket window resets around 60s, so back off appropriately
                    delay = min(
                        40.0,
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

    Any call to invoke() or with_structured_output().invoke() delegates to this
    underlying model instance, automatically benefiting from _execute_with_backoff.
    """

    def invoke(self, input, config=None, **kwargs):
        return _execute_with_backoff(super().invoke, input, config=config, **kwargs)


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
