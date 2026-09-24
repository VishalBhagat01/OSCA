"""Unified LLM provider factory with automatic fallback.

Reads LLM_PROVIDER from configuration and returns the appropriate LangChain chat model.
Supported providers:
  - "ollama"  (default) — local Ollama server via langchain-ollama
  - "gemini"           — Google Gemini API via langchain-google-genai

Fallback behaviour:
  When the primary provider is "gemini" and the NVIDIA_API_KEY is configured,
  Gemini failures caused by quota / rate-limit / API-availability errors are
  automatically retried through NVIDIA Nemotron.  The rest of the application
  only needs to call ``generate_response(prompt)`` — the provider selection
  and fallback are fully transparent.
"""

import logging
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

# ── Error classification helpers ────────────────────────────────────────────

_RETRIABLE_PATTERNS = [
    "429",
    "RESOURCE_EXHAUSTED",
    "quota",
    "rate limit",
    "rate_limit",
    "503",
    "UNAVAILABLE",
    "service unavailable",
    "overloaded",
    "capacity",
    "too many requests",
]


def _is_retriable(error: Exception) -> bool:
    """Return True if *error* looks like a quota / rate-limit / availability problem."""
    err_str = str(error).lower()
    return any(pat.lower() in err_str for pat in _RETRIABLE_PATTERNS)


# ── Backoff / retry logic (Gemini-specific) ─────────────────────────────────

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


# ── Resilient Gemini wrapper ────────────────────────────────────────────────

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


# ── Provider factories ─────────────────────────────────────────────────────

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


# ── Public helpers ──────────────────────────────────────────────────────────

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


# ── Unified generate_response() with automatic fallback ────────────────────

def _get_fallback_llm():
    """Lazily import and initialise the NVIDIA Nemotron fallback client."""
    from llm.nvidia_client import get_nvidia_llm
    return get_nvidia_llm()


def generate_response(prompt, *, config=None, **kwargs) -> str:
    """Generate a text response using the primary LLM with automatic fallback.

    This is the single entry-point the rest of the application should use.
    When the primary provider (Gemini) fails due to quota / rate-limit /
    API-availability errors **and** NVIDIA Nemotron is configured as a
    fallback, the request is transparently retried through Nemotron.

    Parameters
    ----------
    prompt : str | list
        The prompt (or list of LangChain messages) to send.
    config : dict, optional
        Optional LangChain ``RunnableConfig``.
    **kwargs
        Extra keyword arguments forwarded to the underlying model's
        ``invoke()`` method.

    Returns
    -------
    str
        The generated text content.
    """
    primary = get_llm()
    provider_used = get_provider_name()

    try:
        response = primary.invoke(prompt, config=config, **kwargs)
        logger.info("[LLM] Response generated via primary provider: %s", provider_used)
        return response.content if hasattr(response, "content") else str(response)

    except Exception as primary_err:
        # Only attempt fallback when:
        #   1. The error is a retriable quota / rate-limit / availability issue
        #   2. The primary provider is Gemini (Ollama errors are usually local infra)
        #   3. NVIDIA fallback is configured and enabled
        nvidia_cfg = settings.nvidia
        can_fallback = (
            _is_retriable(primary_err)
            and provider_used == "gemini"
            and nvidia_cfg.fallback_enabled
            and nvidia_cfg.api_key
        )

        if not can_fallback:
            raise

        logger.warning(
            "[LLM Fallback] Primary provider '%s' failed with a retriable error. "
            "Falling back to NVIDIA Nemotron. Error: %s",
            provider_used,
            type(primary_err).__name__,  # Log error type only — no keys/secrets
        )

        try:
            fallback = _get_fallback_llm()
            response = fallback.invoke(prompt, config=config, **kwargs)
            logger.info("[LLM] Response generated via fallback provider: nvidia-nemotron")
            return response.content if hasattr(response, "content") else str(response)

        except Exception as fallback_err:
            logger.error(
                "[LLM Fallback] NVIDIA Nemotron also failed. Error: %s",
                type(fallback_err).__name__,
            )
            # Raise the *original* primary error so callers see the root cause
            raise primary_err from fallback_err


def generate_structured_response(prompt, schema, *, config=None, **kwargs):
    """Generate a structured (Pydantic) response with automatic fallback.

    Works identically to ``generate_response`` but uses
    ``with_structured_output()`` for type-safe results.

    Parameters
    ----------
    prompt : str | list
        The prompt to send.
    schema : type[BaseModel]
        A Pydantic model class describing the expected output.
    config : dict, optional
        Optional LangChain ``RunnableConfig``.
    **kwargs
        Extra keyword arguments forwarded to ``invoke()``.

    Returns
    -------
    BaseModel
        An instance of *schema* populated by the LLM.
    """
    primary = get_llm()
    provider_used = get_provider_name()
    structured_primary = primary.with_structured_output(schema)

    try:
        result = structured_primary.invoke(prompt, config=config, **kwargs)
        logger.info("[LLM] Structured response generated via primary provider: %s", provider_used)
        return result

    except Exception as primary_err:
        nvidia_cfg = settings.nvidia
        can_fallback = (
            _is_retriable(primary_err)
            and provider_used == "gemini"
            and nvidia_cfg.fallback_enabled
            and nvidia_cfg.api_key
        )

        if not can_fallback:
            raise

        logger.warning(
            "[LLM Fallback] Primary provider '%s' failed (structured). "
            "Falling back to NVIDIA Nemotron. Error: %s",
            provider_used,
            type(primary_err).__name__,
        )

        try:
            fallback = _get_fallback_llm()
            structured_fallback = fallback.with_structured_output(schema)
            result = structured_fallback.invoke(prompt, config=config, **kwargs)
            logger.info("[LLM] Structured response generated via fallback provider: nvidia-nemotron")
            return result

        except Exception as fallback_err:
            logger.error(
                "[LLM Fallback] NVIDIA Nemotron also failed (structured). Error: %s",
                type(fallback_err).__name__,
            )
            raise primary_err from fallback_err


# Module-level singleton — created on first import
llm = get_llm()
