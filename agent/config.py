"""Centralized configuration module for the OSA Agent service.

Loads environment variables from .env and exposes typed, validated settings.
"""

import os
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from agent root directory
load_dotenv(dotenv_path=Path(__file__).parent / ".env")


@dataclass(frozen=True)
class GeminiConfig:
    api_key: str = field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    model: str = field(default_factory=lambda: os.getenv("GEMINI_MODEL", "gemini-2.5-flash"))
    temperature: float = field(
        default_factory=lambda: float(os.getenv("GEMINI_TEMPERATURE", "0.2"))
    )
    max_tokens: int = field(
        default_factory=lambda: int(os.getenv("GEMINI_MAX_TOKENS", "4096"))
    )


@dataclass(frozen=True)
class OllamaConfig:
    base_url: str = field(
        default_factory=lambda: os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    )
    model: str = field(default_factory=lambda: os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b"))
    temperature: float = field(
        default_factory=lambda: float(os.getenv("OLLAMA_TEMPERATURE", "0.2"))
    )
    max_tokens: int = field(
        default_factory=lambda: int(os.getenv("OLLAMA_MAX_TOKENS", "4096"))
    )
    num_ctx: int = field(
        default_factory=lambda: int(os.getenv("OLLAMA_NUM_CTX", "8192"))
    )


@dataclass(frozen=True)
class AgentSettings:
    llm_provider: str = field(
        default_factory=lambda: os.getenv("LLM_PROVIDER", "ollama").strip().lower()
    )
    agent_api_key: str = field(default_factory=lambda: os.getenv("AGENT_API_KEY", ""))
    frontend_origin: str = field(
        default_factory=lambda: os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    )
    callback_allowed_hosts: str = field(
        default_factory=lambda: os.getenv("CALLBACK_ALLOWED_HOSTS", "localhost,127.0.0.1")
    )
    repos_dir: str = field(
        default_factory=lambda: os.getenv(
            "OSA_REPOS_DIR", os.path.join(tempfile.gettempdir(), "osa_repos")
        )
    )
    github_token: str = field(default_factory=lambda: os.getenv("GITHUB_TOKEN", ""))

    gemini: GeminiConfig = field(default_factory=GeminiConfig)
    ollama: OllamaConfig = field(default_factory=OllamaConfig)

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origin.split(",") if origin.strip()]

    @property
    def allowed_callback_hosts(self) -> set[str]:
        return {host.strip() for host in self.callback_allowed_hosts.split(",") if host.strip()}


settings = AgentSettings()
