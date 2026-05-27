from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


class ProductAttribute(Base):
    __tablename__ = "product_attributes"

    id = Column(Integer, primary_key=True, index=True)
    product_shape_id = Column(Integer, ForeignKey(
        "product_shapes.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False)
    label = Column(String(100), nullable=False)
    input_type = Column(String(20), nullable=False)
    required = Column(Boolean, default=False, nullable=False)
    placeholder = Column(String(255))
    sort_order = Column(Integer, default=0, nullable=False)

    product_shape = relationship("ProductShape", back_populates="attributes")
