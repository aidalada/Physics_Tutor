"""Application configuration via environment variables (pydantic-settings)."""

from typing import Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Gemini ──────────────────────────────────────────────────────────
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-3.8-flash"
    GEMINI_FALLBACK_MODELS: Union[str, list[str]] = ["gemini-3.6-flash"]
    GEMINI_MAX_RETRIES: int = 3
    GEMINI_RETRY_DELAY: float = 2.0

    # ── Image processing ────────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 8
    MAX_IMAGE_DIMENSION: int = 2000

    # ── CORS ────────────────────────────────────────────────────────────
    # Union[str, list[str]] prevents pydantic-settings from forcing json.loads on raw string env vars like '*'
    ALLOWED_ORIGINS: Union[str, list[str]] = ["*"]

    @field_validator("ALLOWED_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, list[str]]) -> list[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator("GEMINI_FALLBACK_MODELS", mode="after")
    @classmethod
    def assemble_fallback_models(cls, v: Union[str, list[str]]) -> list[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @property
    def candidate_models(self) -> list[str]:
        """Return ordered list of models to try (primary model first, then unique fallbacks)."""
        models: list[str] = [self.GEMINI_MODEL]
        for m in self.GEMINI_FALLBACK_MODELS:
            if m not in models:
                models.append(m)
        return models


settings = Settings()  # type: ignore[call-arg]
