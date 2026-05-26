from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


class ProductAttributeOption(Base):
    __tablename__ = "product_attribute_options"

    id = Column(Integer, primary_key=True, index=True)
    attribute_id = Column(Integer, ForeignKey(
        "product_attributes.id", ondelete="CASCADE"), nullable=False)
    value = Column(String(100), nullable=False)
    label = Column(String(100), nullable=False)
    price_modifier = Column(Numeric(10, 2), default=0, nullable=False)

    attribute = relationship("ProductAttribute", back_populates="options")

