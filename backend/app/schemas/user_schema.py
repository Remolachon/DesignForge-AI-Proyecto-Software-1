from pydantic import BaseModel

class UserResponse(BaseModel):
    id: int
    email: str
    role_id: int | None
    company_id: int | None

    class Config:
        from_attributes = True