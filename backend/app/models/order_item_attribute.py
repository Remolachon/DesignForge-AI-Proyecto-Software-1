from sqlalchemy import Column, Integer, Text, ForeignKey, String
from sqlalchemy.orm import relationship
from app.database.database import Base

class OrderItemAttribute(Base):
    __tablename__ = "order_item_attributes"

    id = Column(Integer, primary_key=True, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False)
    attribute_id = Column(Integer, ForeignKey("product_attributes.id"), nullable=True)
    attribute_code = Column(String(50), nullable=True)
    value = Column(Text, nullable=False)
    custom_label = Column(String(100), nullable=True)

    order_item = relationship("OrderItem", back_populates="attributes")
    attribute = relationship("ProductAttribute")
