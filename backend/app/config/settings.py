from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str 
    SUPABASE_URL: str 
    SUPABASE_KEY: str 

    JWT_SECRET: str | None = None
    EMAIL_HOST: str | None = None
    EMAIL_USER: str | None = None
    EMAIL_PASSWORD: str | None = None
    AI_API_KEY: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()