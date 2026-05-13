import os
from pydantic_settings import BaseSettings, SettingsConfigDict



class Settings(BaseSettings):

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow"  # permite variables extras en .env
    )

    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_KEY: str

    JWT_SECRET: str | None = None
    EMAIL_HOST: str | None = None
    EMAIL_USER: str | None = None
    EMAIL_PASSWORD: str | None = None
    HF_TOKEN: str
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