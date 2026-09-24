"""NVIDIA Nemotron LLM client via LangChain ChatNVIDIA.

Used as a fallback provider when Gemini is unavailable due to
quota, rate-limit, or API availability issues.
"""

import logging

from langchain_nvidia_ai_endpoints import ChatNVIDIA
from config import settings

logger = logging.getLogger("osa.llm.nvidia")

_nvidia_instance = None


def create_nvidia():
    """Create and return a ChatNVIDIA instance for NVIDIA Nemotron."""
    cfg = settings.nvidia
    if not cfg.api_key:
        raise ValueError(
            "NVIDIA_API_KEY is required for Nemotron fallback. "
            "Set it in your .env file."
        )

    logger.info(
        "Initializing NVIDIA Nemotron client (model=%s)",
        cfg.model,
    )

    return ChatNVIDIA(
        model=cfg.model,
        nvidia_api_key=cfg.api_key,
        temperature=cfg.temperature,
        max_tokens=cfg.max_tokens,
    )


def get_nvidia_llm():
    """Get or create the singleton NVIDIA Nemotron LLM instance."""
    global _nvidia_instance
    if _nvidia_instance is None:
        _nvidia_instance = create_nvidia()
    return _nvidia_instance
