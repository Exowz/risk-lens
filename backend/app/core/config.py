"""
Application configuration via Pydantic BaseSettings.

All environment variables are loaded from .env file.
Never use os.environ directly -- always import settings from here.
"""

from pydantic import computed_field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """RiskLens application settings loaded from environment variables."""

    database_url: str
    secret_key: str
    mistral_api_key: str = ""
    allowed_origins: str = "http://localhost:3000"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated origins string into a list."""
        return [
            origin.strip()
            for origin in self.allowed_origins.split(",")
            if origin.strip()
        ]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()  # type: ignore[call-arg]
