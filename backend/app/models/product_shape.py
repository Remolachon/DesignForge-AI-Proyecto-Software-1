from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class ProductShape(Base):
    __tablename__ = "product_shapes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    attributes = relationship(
        "ProductAttribute", back_populates="product_shape")
    products = relationship("Product", back_populates="product_shape")

