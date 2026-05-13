from datetime import datetime

from pydantic import BaseModel


class CompanyCreateRequest(BaseModel):
    nit: str
    name: str
    description: str | None = None
    address: str | None = None
    phone: str | None = None
    start_date: datetime | None = None


class CompanyStatusUpdateRequest(BaseModel):
    status: str


class CompanyResponse(BaseModel):
    id: int
    nit: str
    name: str
    description: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str
    start_date: datetime | None = None
    status: str
    is_active: bool = False
    created_by_user_id: int

    class Config:
        from_attributes = True


class CompanyAdminResponse(BaseModel):
    id: int
    nit: str
    name: str
    description: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str
    start_date: datetime | None = None
    status: str
    is_active: bool
    created_by_user_id: int
    created_by_user_name: str | None = None

    class Config:
        from_attributes = True


class CompanyAdminActionRequest(BaseModel):
    status: str