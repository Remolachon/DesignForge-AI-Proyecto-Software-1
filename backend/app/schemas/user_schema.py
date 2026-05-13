from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str | None = None
    email: EmailStr
    password: str
    confirm_password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str



class GoogleOAuthRequest(BaseModel):
    access_token: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    first_name: str
    last_name: str
    role: str  # 🔥 NUEVO


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role_id: int | None = None
    company_id: int | None = None

    class Config:
        from_attributes = True