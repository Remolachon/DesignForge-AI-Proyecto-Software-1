from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:didierduvankevin@db.ttfwjexqplbbcfdfhxsg.supabase.co:5432/postgres"
    SUPABASE_URL: str = "https://ttfwjexqplbbcfdfhxsg.supabase.co"
    SUPABASE_KEY: str = "sb_publishable_jN_oAj7BZ7PQhe079gdtZg_cvNM5vnG"

    JWT_SECRET: str | None = None
    EMAIL_HOST: str | None = None
    EMAIL_USER: str | None = None
    EMAIL_PASSWORD: str | None = None
    AI_API_KEY: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()