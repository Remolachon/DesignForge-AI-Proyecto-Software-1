from fastapi import APIRouter
from app.providers.supabase_provider import supabase

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(email: str, password: str):
    response = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })

    return {
        "access_token": response.session.access_token
    }