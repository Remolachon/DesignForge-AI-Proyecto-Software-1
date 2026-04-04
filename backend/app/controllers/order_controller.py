from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.order_service import OrderService
from app.schemas.order_schema import CreateOrderRequest
from app.security.token_validator import get_current_user
from app.models.user import User  # 🔥 IMPORTANTE

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/")
def create_order(
    data: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    print("DATA RECIBIDA:", data)
    print("USER:", current_user)

    # 🔥 TRADUCCIÓN CLAVE (Supabase → DB)
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")

    # 🔥 AQUÍ ESTÁ LA SOLUCIÓN REAL
    order = OrderService.create_order(
        db=db,
        user_id=db_user.id,  # ✅ INTEGER correcto
        data=data
    )

    return {
        "message": "Order created successfully",
        "order_id": order.id,
        "total_amount": float(order.total_amount)
    }