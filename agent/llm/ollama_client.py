"""Backward-compatible re-export of the unified LLM instance.

All existing imports like `from llm.ollama_client import llm` continue
to work without any code changes — the actual provider (Ollama or Gemini)
is selected by the LLM_PROVIDER env var in llm_provider.py.
"""

from llm.llm_provider import llm  # noqa: F401
