import base64
import json
from typing import Optional


class GoogleOAuthProvider:
    """
    Proveedor para validar y manejar autenticación con Google OAuth.
    Supabase maneja el flujo de OAuth y devuelve un token JWT que validamos aquí.
    """

    GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v1/certs"

    @staticmethod
    def _decode_jwt_payload(token: str) -> Optional[dict]:
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None

            payload_b64 = parts[1]
            padding = "=" * (-len(payload_b64) % 4)
            payload_bytes = base64.urlsafe_b64decode((payload_b64 + padding).encode("utf-8"))
            return json.loads(payload_bytes.decode("utf-8"))
        except Exception as e:
            print(f"Error decoding JWT payload: {e}", flush=True)
            return None

    @staticmethod
    def verify_supabase_token(access_token: str) -> Optional[dict]:
        """
        Decodifica localmente el JWT emitido por Supabase.
        Retorna un dict con la información mínima esperada (sub, email, user_metadata)
        o None si el token no tiene formato válido.
        """
        try:
            payload = GoogleOAuthProvider._decode_jwt_payload(access_token)
            if not payload:
                return None

            return {
                "sub": payload.get("sub"),
                "email": payload.get("email"),
                "user_metadata": payload.get("user_metadata", {}),
            }
        except Exception as e:
            print(f"Error getting user from token: {e}", flush=True)
            return None

    @staticmethod
    def extract_user_info(token_payload: dict) -> dict:
        """
        Extrae información del usuario del payload del token de Supabase.
        """
        user_metadata = token_payload.get("user_metadata", {})

        # Google devuelve solo 'full_name', no 'first_name' y 'last_name'
        # Separamos el full_name en first_name y last_name
        full_name = user_metadata.get("full_name") or user_metadata.get("name", "")
        name_parts = full_name.split() if full_name else []

        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        
        return {
            "supabase_id": token_payload.get("sub"),
            "email": token_payload.get("email"),
            "first_name": first_name,
            "last_name": last_name,
            "phone": user_metadata.get("phone"),
            "avatar_url": user_metadata.get("avatar_url"),
        }
