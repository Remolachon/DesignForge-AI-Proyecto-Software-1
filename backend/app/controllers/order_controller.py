from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.order_service import OrderService
from app.schemas.order_schema import (
    CreateOrderRequest,
    DashboardResponse,
    DashboardOrder,
    OrderDetailResponse,
    OrdersPageResponse,
    UpdateOrderStatusRequest,
    UpdateOrderStatusResponse,
)
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


@router.get("/my-orders/page", response_model=OrdersPageResponse)
def get_my_orders_page(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")

    return OrderService.get_user_orders_page(
        db=db,
        user_id=db_user.id,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
    )


@router.get("/funcionario-orders/page", response_model=OrdersPageResponse)
def get_funcionario_orders_page(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")

    role_name = UserService.get_user_role_name(db, db_user.id)
    if role_name != "funcionario":
        raise HTTPException(status_code=403, detail="No autorizado")

    return OrderService.get_funcionario_orders_page(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
    )


@router.patch("/{order_id}/status", response_model=UpdateOrderStatusResponse)
def update_order_status(
    order_id: int,
    payload: UpdateOrderStatusRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")

    role_name = UserService.get_user_role_name(db, db_user.id)
    if role_name != "funcionario":
        raise HTTPException(status_code=403, detail="No autorizado")

    try:
        updated_order = OrderService.update_order_status(
            db=db,
            order_id=order_id,
            new_status=payload.status,
            changed_by_user_id=db_user.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {
        "message": "Estado actualizado",
        "order": updated_order,
    }


@router.get("/{order_id}", response_model=OrderDetailResponse)
def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Obtiene detalles completos de un pedido (incluyendo parámetros)"""
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")

    role_name = UserService.get_user_role_name(db, db_user.id)

    order_detail = OrderService.get_order_detail(
        db=db,
        order_id=order_id,
        user_id=db_user.id,
        role_name=role_name,
    )

    if not order_detail:
        raise HTTPException(status_code=404, detail="Pedido no encontrado o sin permiso")

    return order_detail