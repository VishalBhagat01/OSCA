"""Tests for the LLM fallback system (Gemini → NVIDIA Nemotron).

Covers:
  - Primary-provider success (no fallback)
  - First-call fallback on quota / rate-limit / 503 errors
  - Sticky fallback: subsequent calls skip Gemini entirely
  - Sticky fallback reset
  - No fallback when disabled / no API key / non-Gemini provider
  - Non-retriable errors propagate immediately
  - Both providers fail → primary error raised
  - _is_retriable classification
"""

from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_settings(
    llm_provider="gemini",
    gemini_api_key="test-gemini-key",
    nvidia_api_key="test-nvidia-key",
    nvidia_fallback_enabled=True,
):
    """Build a mock settings object matching the real AgentSettings shape."""
    s = MagicMock()
    s.llm_provider = llm_provider
    s.llm_cache_enabled = False

    s.gemini.api_key = gemini_api_key
    s.gemini.model = "gemini-2.5-flash"
    s.gemini.temperature = 0.2
    s.gemini.max_tokens = 4096
    s.gemini.pacing_seconds = 0.0

    s.nvidia.api_key = nvidia_api_key
    s.nvidia.model = "nvidia/llama-3.1-nemotron-70b-instruct"
    s.nvidia.temperature = 0.2
    s.nvidia.max_tokens = 4096
    s.nvidia.fallback_enabled = nvidia_fallback_enabled

    return s


def _fake_response(content: str):
    """Create a minimal object with a .content attribute."""
    resp = MagicMock()
    resp.content = content
    return resp


# ---------------------------------------------------------------------------
# Tests: generate_response
# ---------------------------------------------------------------------------

class TestGenerateResponse:

    def test_primary_provider_success(self):
        """Primary succeeds → no fallback, no sticky state change."""
        mock_settings = _make_settings()
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = _fake_response("Primary answer")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_llm),
            patch("llm.llm_provider._fallback_active", False),
        ):
            from llm.llm_provider import generate_response
            result = generate_response("Hello")

        assert result == "Primary answer"
        mock_llm.invoke.assert_called_once()

    def test_fallback_on_quota_error(self):
        """Gemini 429 → fallback to Nemotron, sticky activated."""
        mock_settings = _make_settings()
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("429 RESOURCE_EXHAUSTED: quota exceeded")

        mock_fallback = MagicMock()
        mock_fallback.invoke.return_value = _fake_response("Fallback answer")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
            patch("llm.llm_provider._get_fallback_llm", return_value=mock_fallback),
            patch("llm.llm_provider._fallback_active", False),
        ):
            from llm.llm_provider import generate_response
            result = generate_response("Hello")

        assert result == "Fallback answer"
        mock_primary.invoke.assert_called_once()
        mock_fallback.invoke.assert_called_once()

    def test_fallback_on_503_error(self):
        """Gemini 503 → fallback to Nemotron."""
        mock_settings = _make_settings()
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("503 UNAVAILABLE: service overloaded")

        mock_fallback = MagicMock()
        mock_fallback.invoke.return_value = _fake_response("Fallback 503")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
            patch("llm.llm_provider._get_fallback_llm", return_value=mock_fallback),
            patch("llm.llm_provider._fallback_active", False),
        ):
            from llm.llm_provider import generate_response
            result = generate_response("Hello")

        assert result == "Fallback 503"

    def test_no_fallback_when_disabled(self):
        """Fallback disabled → quota error propagates."""
        mock_settings = _make_settings(nvidia_fallback_enabled=False)
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("429 RESOURCE_EXHAUSTED")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
            patch("llm.llm_provider._fallback_active", False),
        ):
            from llm.llm_provider import generate_response
            with pytest.raises(Exception, match="429"):
                generate_response("Hello")

    def test_no_fallback_when_no_api_key(self):
        """No NVIDIA API key → quota error propagates."""
        mock_settings = _make_settings(nvidia_api_key="")
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("429 RESOURCE_EXHAUSTED")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
            patch("llm.llm_provider._fallback_active", False),
        ):
            from llm.llm_provider import generate_response
            with pytest.raises(Exception, match="429"):
                generate_response("Hello")

    def test_no_fallback_for_ollama(self):
        """Primary is Ollama → no fallback on errors."""
        mock_settings = _make_settings(llm_provider="ollama")
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("503 Connection refused")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
            patch("llm.llm_provider._fallback_active", False),
        ):
            from llm.llm_provider import generate_response
            with pytest.raises(Exception, match="503"):
                generate_response("Hello")

    def test_non_retriable_error_not_caught(self):
        """Non-retriable errors propagate without fallback attempt."""
        mock_settings = _make_settings()
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = ValueError("Invalid prompt format")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
            patch("llm.llm_provider._fallback_active", False),
        ):
            from llm.llm_provider import generate_response
            with pytest.raises(ValueError, match="Invalid prompt"):
                generate_response("Hello")

    def test_both_providers_fail_raises_primary_error(self):
        """Both fail → primary error raised, chained with fallback error."""
        mock_settings = _make_settings()
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("429 RESOURCE_EXHAUSTED: quota exceeded")

        mock_fallback = MagicMock()
        mock_fallback.invoke.side_effect = Exception("NVIDIA also failed")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
            patch("llm.llm_provider._get_fallback_llm", return_value=mock_fallback),
            patch("llm.llm_provider._fallback_active", False),
        ):
            from llm.llm_provider import generate_response
            with pytest.raises(Exception, match="RESOURCE_EXHAUSTED"):
                generate_response("Hello")

    def test_fallback_on_rate_limit_text(self):
        """Rate-limit text triggers fallback."""
        mock_settings = _make_settings()
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("rate limit exceeded, please retry")

        mock_fallback = MagicMock()
        mock_fallback.invoke.return_value = _fake_response("Rate limit fallback")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
            patch("llm.llm_provider._get_fallback_llm", return_value=mock_fallback),
            patch("llm.llm_provider._fallback_active", False),
        ):
            from llm.llm_provider import generate_response
            result = generate_response("Hello")

        assert result == "Rate limit fallback"


# ---------------------------------------------------------------------------
# Tests: Sticky fallback
# ---------------------------------------------------------------------------

class TestStickyFallback:

    def test_sticky_skips_primary(self):
        """When sticky fallback is active, Gemini is never called."""
        mock_settings = _make_settings()
        mock_primary = MagicMock()
        mock_fallback = MagicMock()
        mock_fallback.invoke.return_value = _fake_response("Sticky answer")

        import llm.llm_provider as mod
        original = mod._fallback_active
        try:
            mod._fallback_active = True
            with (
                patch("llm.llm_provider.settings", mock_settings),
                patch("llm.llm_provider.get_llm", return_value=mock_primary),
                patch("llm.llm_provider._get_fallback_llm", return_value=mock_fallback),
            ):
                result = mod.generate_response("Hello")
        finally:
            mod._fallback_active = original

        assert result == "Sticky answer"
        mock_primary.invoke.assert_not_called()
        mock_fallback.invoke.assert_called_once()

    def test_sticky_activates_after_first_fallback(self):
        """After a single fallback, the _fallback_active flag is set to True."""
        mock_settings = _make_settings()
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("429 RESOURCE_EXHAUSTED")

        mock_fallback = MagicMock()
        mock_fallback.invoke.return_value = _fake_response("Activated")

        import llm.llm_provider as mod
        original = mod._fallback_active
        try:
            mod._fallback_active = False
            with (
                patch("llm.llm_provider.settings", mock_settings),
                patch("llm.llm_provider.get_llm", return_value=mock_primary),
                patch("llm.llm_provider._get_fallback_llm", return_value=mock_fallback),
            ):
                mod.generate_response("Hello")
                assert mod._fallback_active is True
        finally:
            mod._fallback_active = original

    def test_reset_fallback_clears_sticky(self):
        """reset_fallback() clears the sticky flag."""
        import llm.llm_provider as mod
        original = mod._fallback_active
        try:
            mod._fallback_active = True
            mod.reset_fallback()
            assert mod._fallback_active is False
        finally:
            mod._fallback_active = original

    def test_get_active_provider_name_reflects_sticky(self):
        """get_active_provider_name() returns nvidia-nemotron when sticky is active."""
        mock_settings = _make_settings()
        import llm.llm_provider as mod
        original = mod._fallback_active
        try:
            with patch("llm.llm_provider.settings", mock_settings):
                mod._fallback_active = False
                assert mod.get_active_provider_name() == "gemini"

                mod._fallback_active = True
                assert mod.get_active_provider_name() == "nvidia-nemotron"
        finally:
            mod._fallback_active = original

    def test_sticky_structured_skips_primary(self):
        """Structured response also uses sticky fallback."""
        from pydantic import BaseModel

        class DummySchema(BaseModel):
            answer: str

        mock_settings = _make_settings()
        mock_primary = MagicMock()
        mock_fallback = MagicMock()
        mock_structured = MagicMock()
        mock_structured.invoke.return_value = DummySchema(answer="sticky structured")
        mock_fallback.with_structured_output.return_value = mock_structured

        import llm.llm_provider as mod
        original = mod._fallback_active
        try:
            mod._fallback_active = True
            with (
                patch("llm.llm_provider.settings", mock_settings),
                patch("llm.llm_provider.get_llm", return_value=mock_primary),
                patch("llm.llm_provider._get_fallback_llm", return_value=mock_fallback),
            ):
                result = mod.generate_structured_response("Hello", DummySchema)
        finally:
            mod._fallback_active = original

        assert result.answer == "sticky structured"
        mock_primary.with_structured_output.assert_not_called()


# ---------------------------------------------------------------------------
# Tests: _is_retriable
# ---------------------------------------------------------------------------

class TestIsRetriable:

    def test_429_is_retriable(self):
        from llm.llm_provider import _is_retriable
        assert _is_retriable(Exception("429 Too Many Requests"))

    def test_resource_exhausted_is_retriable(self):
        from llm.llm_provider import _is_retriable
        assert _is_retriable(Exception("RESOURCE_EXHAUSTED"))

    def test_503_is_retriable(self):
        from llm.llm_provider import _is_retriable
        assert _is_retriable(Exception("503 Service Unavailable"))

    def test_quota_is_retriable(self):
        from llm.llm_provider import _is_retriable
        assert _is_retriable(Exception("Quota exceeded for this project"))

    def test_random_error_not_retriable(self):
        from llm.llm_provider import _is_retriable
        assert not _is_retriable(ValueError("some unrelated error"))

    def test_auth_error_not_retriable(self):
        from llm.llm_provider import _is_retriable
        assert not _is_retriable(Exception("401 Unauthorized: invalid API key"))
