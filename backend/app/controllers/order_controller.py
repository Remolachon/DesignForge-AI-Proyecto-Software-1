from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.order_service import OrderService
from app.schemas.order_schema import CreateOrderRequest, DashboardResponse, DashboardOrder
from app.security.token_validator import get_current_user
from app.models.user import User  # 🔥 IMPORTANTE
from app.services.user_service import UserService

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


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")

    role_name = UserService.get_user_role_name(db, db_user.id)

    return OrderService.get_dashboard_data(
        db=db,
        user_id=db_user.id,
        role_name=role_name,
    )


@router.get("/my-orders", response_model=list[DashboardOrder])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")

    return OrderService.get_user_orders(db=db, user_id=db_user.id)