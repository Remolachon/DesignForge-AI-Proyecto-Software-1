from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"))
    production_stage_id = Column("previous_stage_id", Integer, ForeignKey("production_stages.id"))
    new_stage_id = Column(Integer, ForeignKey("production_stages.id"))
    changed_by = Column(Integer, ForeignKey("users.id"))
    changed_at = Column(DateTime, server_default=func.now())

    order_item = relationship("OrderItem")
    production_stage = relationship(
        "ProductionStage",
        foreign_keys=[production_stage_id]
    )