from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.product_service import ProductService
from app.security.token_validator import get_current_user
from app.services.user_service import UserService
from app.models.user import User
from app.schemas.product_schema import (
    AdminProductResponse,
    AdminProductUpsertRequest,
    AdminProductVisibilityRequest,
)

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/")
def get_products(db: Session = Depends(get_db)):
    return ProductService.get_products(db)


def _get_funcionario_user(db: Session, current_user):
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")

    role_name = UserService.get_user_role_name(db, db_user.id)
    if role_name != "funcionario":
        raise HTTPException(status_code=403, detail="No autorizado")

    return db_user


@router.get("/admin", response_model=list[AdminProductResponse])
def get_admin_products(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_funcionario_user(db, current_user)
    company_id = db_user.company_id or 1
    return ProductService.get_admin_products(db, company_id=company_id)


@router.post("/admin", response_model=AdminProductResponse)
def create_admin_product(
    payload: AdminProductUpsertRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_funcionario_user(db, current_user)
    company_id = db_user.company_id or 1

    try:
        return ProductService.create_admin_product(
            db=db,
            payload=payload,
            company_id=company_id,
            created_by_user_id=db_user.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.put("/admin/{product_id}", response_model=AdminProductResponse)
def update_admin_product(
    product_id: int,
    payload: AdminProductUpsertRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_funcionario_user(db, current_user)
    company_id = db_user.company_id or 1

    try:
        return ProductService.update_admin_product(
            db=db,
            product_id=product_id,
            payload=payload,
            company_id=company_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.patch("/admin/{product_id}/visibility", response_model=AdminProductResponse)
def set_product_visibility(
    product_id: int,
    payload: AdminProductVisibilityRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_funcionario_user(db, current_user)
    company_id = db_user.company_id or 1

    try:
        return ProductService.set_product_visibility(
            db=db,
            product_id=product_id,
            is_public=payload.is_public,
            company_id=company_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/admin/{product_id}")
def logical_delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_funcionario_user(db, current_user)
    company_id = db_user.company_id or 1

    try:
        ProductService.logical_delete_product(
            db=db,
            product_id=product_id,
            company_id=company_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {"message": "Producto eliminado"}