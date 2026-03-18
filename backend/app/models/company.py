from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from app.database.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    nit = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(150))
    start_date = Column(TIMESTAMP)