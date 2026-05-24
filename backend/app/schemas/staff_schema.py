from pydantic import BaseModel, EmailStr

class StaffInviteRequest(BaseModel):
    email: EmailStr
