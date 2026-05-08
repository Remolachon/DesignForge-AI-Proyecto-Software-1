from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    phone = Column(String(20))
    start_date = Column(TIMESTAMP, server_default=func.now())
    is_active = Column(Boolean, default=True)
    supabase_id = Column(String, unique=True)

    company = relationship("Company", back_populates="users", foreign_keys=[company_id])
    orders = relationship("Order", back_populates="user")
    