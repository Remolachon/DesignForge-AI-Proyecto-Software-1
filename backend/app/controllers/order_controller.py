from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.order_service import OrderService
from app.schemas.order_schema import (
    CreateOrderRequest,
    CreateMarketplaceOrderRequest,
    DashboardResponse,
    DashboardOrder,
    OrderDetailResponse,
    OrdersPageResponse,
    PayUResponseSyncRequest,
    UpdateOrderStatusRequest,
    UpdateOrderStatusResponse,
)
from app.security.token_validator import get_current_user
from app.models.user import User
from app.services.user_service import UserService
from app.models.order import Order

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/")
def create_order(
    data: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")

    order = OrderService.create_order(
        db=db,
        user_id=db_user.id,
        data=data
    )

    payment_result = OrderService.generate_payment_url(db, order.id)

    if payment_result.get("status") == "error":
        raise HTTPException(status_code=400, detail=payment_result.get("error", "Error generando URL de pago"))

    return {
        "message": "Order created successfully",
        "order_id": order.id,
        "total_amount": float(order.total_amount),
        "payment_url": payment_result.get("payment_url"),
        "payment_action_url": payment_result.get("payment_action_url"),
        "payment_payload": payment_result.get("payment_payload"),
        "payment_reference": payment_result.get("payment_reference"),
    }


@router.post("/marketplace")
def create_marketplace_order(
    data: CreateMarketplaceOrderRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Endpoint para crear órdenes desde el marketplace.
    Requiere autenticación.
    Body:
        - product_id: int (ID del producto del marketplace)
        - length: int (largo en cm)
        - height: int (alto en cm)
        - width: int (ancho en cm)
        - material: str ("standard", "premium", "deluxe")
    """
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")

    try:
        order = OrderService.create_marketplace_order(
            db=db,
            user_id=db_user.id,
            data=data
        )

        payment_result = OrderService.generate_payment_url(db, order.id)

        if payment_result.get("status") == "error":
            raise HTTPException(status_code=400, detail=payment_result.get("error", "Error generando URL de pago"))

        return {
            "message": "Marketplace order created successfully",
            "order_id": order.id,
            "total_amount": float(order.total_amount),
            "payment_url": payment_result.get("payment_url"),
            "payment_action_url": payment_result.get("payment_action_url"),
            "payment_payload": payment_result.get("payment_payload"),
            "payment_reference": payment_result.get("payment_reference"),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating order: {str(e)}")


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
        company_id=db_user.company_id or None,
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
        company_id=db_user.company_id,
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
        company_id=db_user.company_id,
    )

    if not order_detail:
        raise HTTPException(status_code=404, detail="Pedido no encontrado o sin permiso")

    return order_detail


@router.post("/{order_id}/payment-url")
def get_payment_url(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Genera la URL de pago de PayU para una orden pendiente.
    Solo el dueño de la orden puede acceder.
    """
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    if order.user_id != db_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para acceder a esta orden")

    result = OrderService.generate_payment_url(db, order_id)

    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("error", "Error generando URL de pago"))

    return result


@router.get("/{order_id}/payment-status")
def get_payment_status(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Obtiene el estado de pago de una orden.
    Solo el dueño de la orden o un funcionario pueden acceder.
    """
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    role_name = UserService.get_user_role_name(db, db_user.id)
    if order.user_id != db_user.id and role_name != "funcionario":
        raise HTTPException(status_code=403, detail="No tienes permiso")

    return OrderService.get_order_payment_status(db, order_id)


@router.post("/payu-webhook")
async def payu_webhook(
    request_data: Request,
    db: Session = Depends(get_db),
):
    """
    Webhook para recibir confirmación de pago de PayU.
    Este endpoint es llamado por PayU después de procesar un pago.
    NO requiere autenticación porque PayU envía la solicitud directamente.
    """
    try:
        content_type = request_data.headers.get("content-type", "")
        payload: dict = {}

        if "application/json" in content_type:
            payload = await request_data.json()
        elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
            form_data = await request_data.form()
            payload = dict(form_data)
        else:
            payload = dict(request_data.query_params)

        result = OrderService.process_payu_webhook(db, payload)
        return result
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error procesando webhook: {str(e)}"
        }


@router.post("/payu-response")
async def payu_response_sync(
    request_data: Request,
    payload_body: PayUResponseSyncRequest | None = None,
    db: Session = Depends(get_db),
):
    """
    Sincroniza estado de pago desde el retorno del navegador (responseUrl).
    Útil en desarrollo local cuando PayU no puede alcanzar localhost para el webhook.
    """
    try:
        if payload_body is not None:
            payload = payload_body.model_dump(exclude_none=True)
        else:
            content_type = request_data.headers.get("content-type", "")
            payload: dict = {}

            if "application/json" in content_type:
                payload = await request_data.json()
            elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
                form_data = await request_data.form()
                payload = dict(form_data)
            else:
                payload = dict(request_data.query_params)

        result = OrderService.process_payu_webhook(db, payload)
        return result
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error procesando retorno de pago: {str(e)}"
        }