"""Backward-compatible re-export of the unified LLM interface.

All existing imports like `from llm.ollama_client import llm` continue
to work without any code changes — the actual provider (Ollama or Gemini)
is selected by the LLM_PROVIDER env var in llm_provider.py.

New code should prefer:
    from llm.llm_provider import generate_response, generate_structured_response
"""

from llm.llm_provider import llm  # noqa: F401
from llm.llm_provider import generate_response  # noqa: F401
from llm.llm_provider import generate_structured_response  # noqa: F401
