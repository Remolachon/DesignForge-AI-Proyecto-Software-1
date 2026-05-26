from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):

    model_config = SettingsConfigDict(
        env_file=BACKEND_ENV_FILE,
        extra="allow"  # permite variables extras en .env
    )

    DATABASE_URL: str = "sqlite:///./test.db"  # Fallback para testing
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    JWT_SECRET: str | None = None
    BREVO_API_KEY: str | None = None
    BREVO_EMAIL_FROM: str | None = None
    FRONTEND_URL: str | None = None
    HF_TOKEN: str = ""
    HF_SPACE_ID: str = "Dupan21/LukArt"

    # PayU Configuration
    PAYU_MERCHANT_ID: str | None = None
    PAYU_ACCOUNT_ID: str | None = None
    PAYU_API_KEY: str | None = None
    PAYU_API_LOGIN: str | None = None
    PAYU_SANDBOX_MODE: bool = True
    PAYU_WEBHOOK_URL: str | None = None
    PAYU_RESPONSE_URL: str | None = None

    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str | None = None


settings = Settings()

