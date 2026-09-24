"""Tests for the LLM fallback system (Gemini → NVIDIA Nemotron)."""

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

    # Gemini sub-config
    s.gemini.api_key = gemini_api_key
    s.gemini.model = "gemini-2.5-flash"
    s.gemini.temperature = 0.2
    s.gemini.max_tokens = 4096
    s.gemini.pacing_seconds = 0.0  # no delay in tests

    # NVIDIA sub-config
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
    """Tests for the unified generate_response() function."""

    def test_primary_provider_success(self):
        """When the primary provider succeeds, no fallback should be attempted."""
        mock_settings = _make_settings()
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = _fake_response("Primary answer")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_llm),
        ):
            from llm.llm_provider import generate_response
            result = generate_response("Hello")

        assert result == "Primary answer"
        mock_llm.invoke.assert_called_once()

    def test_fallback_on_quota_error(self):
        """When Gemini raises a 429 quota error, Nemotron should be used."""
        mock_settings = _make_settings()
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("429 RESOURCE_EXHAUSTED: quota exceeded")

        mock_fallback = MagicMock()
        mock_fallback.invoke.return_value = _fake_response("Fallback answer")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
            patch("llm.llm_provider._get_fallback_llm", return_value=mock_fallback),
        ):
            from llm.llm_provider import generate_response
            result = generate_response("Hello")

        assert result == "Fallback answer"
        mock_primary.invoke.assert_called_once()
        mock_fallback.invoke.assert_called_once()

    def test_fallback_on_503_error(self):
        """When Gemini raises a 503 UNAVAILABLE error, Nemotron should be used."""
        mock_settings = _make_settings()
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("503 UNAVAILABLE: service overloaded")

        mock_fallback = MagicMock()
        mock_fallback.invoke.return_value = _fake_response("Fallback 503 answer")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
            patch("llm.llm_provider._get_fallback_llm", return_value=mock_fallback),
        ):
            from llm.llm_provider import generate_response
            result = generate_response("Hello")

        assert result == "Fallback 503 answer"

    def test_no_fallback_when_disabled(self):
        """When fallback is disabled, quota errors should propagate directly."""
        mock_settings = _make_settings(nvidia_fallback_enabled=False)
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("429 RESOURCE_EXHAUSTED")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
        ):
            from llm.llm_provider import generate_response
            with pytest.raises(Exception, match="429"):
                generate_response("Hello")

    def test_no_fallback_when_no_api_key(self):
        """When no NVIDIA API key is set, errors should propagate directly."""
        mock_settings = _make_settings(nvidia_api_key="")
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("429 RESOURCE_EXHAUSTED")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
        ):
            from llm.llm_provider import generate_response
            with pytest.raises(Exception, match="429"):
                generate_response("Hello")

    def test_no_fallback_for_ollama(self):
        """When primary is Ollama (not Gemini), fallback should not trigger."""
        mock_settings = _make_settings(llm_provider="ollama")
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("503 Connection refused")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
        ):
            from llm.llm_provider import generate_response
            with pytest.raises(Exception, match="503"):
                generate_response("Hello")

    def test_non_retriable_error_not_caught(self):
        """Non-retriable errors (e.g. invalid prompt) should propagate immediately."""
        mock_settings = _make_settings()
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = ValueError("Invalid prompt format")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
        ):
            from llm.llm_provider import generate_response
            with pytest.raises(ValueError, match="Invalid prompt"):
                generate_response("Hello")

    def test_both_providers_fail_raises_primary_error(self):
        """When both providers fail, the primary error should be raised."""
        mock_settings = _make_settings()
        primary_error = Exception("429 RESOURCE_EXHAUSTED: quota exceeded")
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = primary_error

        mock_fallback = MagicMock()
        mock_fallback.invoke.side_effect = Exception("NVIDIA also failed")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
            patch("llm.llm_provider._get_fallback_llm", return_value=mock_fallback),
        ):
            from llm.llm_provider import generate_response
            with pytest.raises(Exception, match="RESOURCE_EXHAUSTED"):
                generate_response("Hello")

    def test_fallback_on_rate_limit_error(self):
        """When Gemini raises a rate limit error, Nemotron should be used."""
        mock_settings = _make_settings()
        mock_primary = MagicMock()
        mock_primary.invoke.side_effect = Exception("rate limit exceeded, please retry")

        mock_fallback = MagicMock()
        mock_fallback.invoke.return_value = _fake_response("Rate limit fallback")

        with (
            patch("llm.llm_provider.settings", mock_settings),
            patch("llm.llm_provider.get_llm", return_value=mock_primary),
            patch("llm.llm_provider._get_fallback_llm", return_value=mock_fallback),
        ):
            from llm.llm_provider import generate_response
            result = generate_response("Hello")

        assert result == "Rate limit fallback"


# ---------------------------------------------------------------------------
# Tests: _is_retriable
# ---------------------------------------------------------------------------

class TestIsRetriable:
    """Tests for the error classification helper."""

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
