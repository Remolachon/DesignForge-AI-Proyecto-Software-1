from supabase import create_client
from app.config.settings import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_user_from_token(token: str):
    try:
        user = supabase.auth.get_user(token)
        return user.user
    except Exception:
        return None