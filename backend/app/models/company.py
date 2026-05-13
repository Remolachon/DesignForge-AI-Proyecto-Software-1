from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    nit = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(150), unique=True, nullable=False)
    start_date = Column(TIMESTAMP, server_default=func.now())
    status = Column(String(20), nullable=False, server_default="PENDING")
    is_active = Column(Boolean, default=False, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_by_user = relationship("User", foreign_keys=[created_by_user_id])
    users = relationship("User", back_populates="company", foreign_keys="User.company_id")