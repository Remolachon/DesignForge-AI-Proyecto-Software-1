from typing import Optional
from app.providers.supabase_provider import get_user_from_token


class GoogleOAuthProvider:
    """
    Proveedor para validar y manejar autenticación con Google OAuth.
    Supabase maneja el flujo de OAuth y devuelve un token JWT que validamos aquí.
    """

    GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v1/certs"
    @staticmethod
    def verify_supabase_token(access_token: str) -> Optional[dict]:
        """
        Obtiene el usuario asociado al `access_token` usando el cliente de Supabase.
        Retorna un dict con la información mínima esperada (sub, email, user_metadata)
        o None si el token no es válido o no se encuentra el usuario.
        """
        try:
            user = get_user_from_token(access_token)
            if not user:
                return None

            return {
                "sub": getattr(user, "id", None) or user.get("id"),
                "email": getattr(user, "email", None) or user.get("email"),
                "user_metadata": getattr(user, "user_metadata", None) or user.get("user_metadata", {}),
            }
        except Exception as e:
            print(f"Error getting user from Supabase with token: {e}")
            return None

    @staticmethod
    def extract_user_info(token_payload: dict) -> dict:
        """
        Extrae información del usuario del payload del token de Supabase.
        """
        return {
            "supabase_id": token_payload.get("sub"),
            "email": token_payload.get("email"),
            "first_name": token_payload.get("user_metadata", {}).get("first_name", ""),
            "last_name": token_payload.get("user_metadata", {}).get("last_name", ""),
            "phone": token_payload.get("user_metadata", {}).get("phone"),
            "avatar_url": token_payload.get("user_metadata", {}).get("avatar_url"),
        }
