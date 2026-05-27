from sqlalchemy import Column, Integer, Text, ForeignKey, String
from sqlalchemy.orm import relationship
from app.database.database import Base


class OrderItemAttribute(Base):
    __tablename__ = "order_item_attributes"

    id = Column(Integer, primary_key=True, index=True)
    order_item_id = Column(Integer, ForeignKey(
        "order_items.id", ondelete="CASCADE"), nullable=False)
    attribute_code = Column(String(50), nullable=False)
    attribute_label = Column(String(100), nullable=False)
    value = Column(Text, nullable=False)

    order_item = relationship("OrderItem", back_populates="attributes")
