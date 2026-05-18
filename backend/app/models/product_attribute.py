from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class ProductAttribute(Base):
    __tablename__ = "product_attributes"

    id = Column(Integer, primary_key=True, index=True)
    product_type_id = Column(Integer, ForeignKey("product_types.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False)
    label = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)
    required = Column(Boolean, default=False, nullable=False)
    unit = Column(String(20))
    sort_order = Column(Integer, default=0, nullable=False)

    product_type = relationship("ProductType")
    options = relationship("ProductAttributeOption", back_populates="attribute", cascade="all, delete-orphan")
