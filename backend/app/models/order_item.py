from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    order_date = Column(DateTime, server_default=func.now())
    product_type_id = Column(Integer, ForeignKey("product_types.id"))
    current_stage_id = Column(Integer, ForeignKey("production_stages.id"))
    
    current_stage = relationship(
        "ProductionStage",
        foreign_keys=[current_stage_id]
    )
    product_type = relationship("ProductType")
    product = relationship("Product")
    order = relationship("Order", back_populates="items")
    assets = relationship("FileAsset", back_populates="order_item")
    parameters = relationship("Parameters", uselist=False)