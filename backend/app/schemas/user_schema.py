from pydantic import BaseModel, EmailStr, Field


# ── Requests ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    phone: str | None = None
    email: EmailStr
    password: str = Field(min_length=6)
    confirm_password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


# ── Responses ─────────────────────────────────────────────────────────────────

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    first_name: str
    last_name: str


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role_id: int | None = None
    company_id: int | None = None

    class Config:
        from_attributes = True