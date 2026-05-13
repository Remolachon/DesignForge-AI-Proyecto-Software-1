from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    product_type_id = Column(Integer, ForeignKey("product_types.id"))
    created_by_user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    description = Column(Text)
    base_price = Column(Numeric, nullable=False)
    is_public = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

    company = relationship("Company")
    file_assets = relationship("FileAsset", back_populates="product", cascade="all, delete-orphan")