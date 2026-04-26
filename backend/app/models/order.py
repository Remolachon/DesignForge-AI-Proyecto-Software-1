from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    total_amount = Column(Numeric)
    
    # PayU Payment Fields
    payment_status = Column(String(50), default="pending")  # pending, approved, declined, expired, cancelled, refunded
    payment_reference = Column(String(255), nullable=True)  # Referencia de PayU
    payment_transaction_id = Column(String(255), nullable=True)  # Transaction ID de PayU
    payment_approved_at = Column(DateTime, nullable=True)  # Fecha de aprobación del pago

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")