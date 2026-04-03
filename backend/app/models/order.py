from sqlalchemy import Column, Integer, Numeric, DateTime
from sqlalchemy.orm import relationship

from backend.app.database import Base


class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    created_at = Column(DateTime)
    total_amount = Column(Numeric)

    user = relationship("User", back_populates="orders")
