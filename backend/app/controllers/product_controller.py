import logging
import fastapi
from fastapi import APIRouter, Depends, HTTPException, Query, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.database.database import get_db
from app.database.connection_retry import retry_on_connection_error
from app.services.product_service import ProductService
from app.security.token_validator import get_current_user
from app.services.user_service import UserService
from app.models.user import User
from app.schemas.product_schema import (
    AdminProductResponse,
    AdminProductUpsertRequest,
    AdminProductVisibilityRequest,
    FileAssetResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/")
def get_products(db: Session = Depends(get_db)):
    try:
        return ProductService.get_products(db)
    except OperationalError as e:
        logger.error(f"Error de BD al obtener productos: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


def _get_funcionario_user_with_retry(db: Session, current_user):
    """Obtiene usuario funcionario con reintentos automáticos"""
    def _query():
        db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

        if not db_user:
            raise HTTPException(status_code=404, detail="Usuario no existe en DB")

        role_name = UserService.get_user_role_name(db, db_user.id)
        if role_name not in ("funcionario", "administrador"):
            raise HTTPException(status_code=403, detail="No autorizado")

        return db_user
    
    try:
        return retry_on_connection_error(_query, max_retries=3)
    except OperationalError as e:
        logger.error(f"Error de BD en product_controller: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


def _get_db_user_with_retry(db: Session, current_user):
    """Obtiene usuario con reintentos automáticos"""
    def _query():
        db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

        if not db_user:
            raise HTTPException(status_code=404, detail="Usuario no existe en DB")

        return db_user
    
    try:
        return retry_on_connection_error(_query, max_retries=3)
    except OperationalError as e:
        logger.error(f"Error de BD en product_controller: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


@router.get("/admin", response_model=list[AdminProductResponse])
def get_admin_products(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_db_user_with_retry(db, current_user)
    
    try:
        role_name = UserService.get_user_role_name(db, db_user.id)

        if role_name == "administrador":
            company_id = None
        elif role_name == "funcionario":
            company_id = db_user.company_id or None
        else:
            raise HTTPException(status_code=403, detail="No autorizado")

        return ProductService.get_admin_products(db, company_id=company_id)
    except OperationalError as e:
        logger.error(f"Error de BD al obtener admin products: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


@router.get("/admin/page", response_model=dict)
def get_admin_products_page(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_db_user_with_retry(db, current_user)
    
    try:
        role_name = UserService.get_user_role_name(db, db_user.id)

        if role_name == "administrador":
            company_id = None
        elif role_name == "funcionario":
            company_id = db_user.company_id or None
        else:
            raise HTTPException(status_code=403, detail="No autorizado")

        return ProductService.get_admin_products_page(db=db, company_id=company_id, page=page, page_size=page_size, search=search)
    except OperationalError as e:
        logger.error(f"Error de BD al obtener página de admin products: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


@router.post("/admin", response_model=AdminProductResponse)
def create_admin_product(
    payload: AdminProductUpsertRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_funcionario_user_with_retry(db, current_user)
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
    except OperationalError as e:
        logger.error(f"Error de BD al crear producto: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


@router.put("/admin/{product_id}", response_model=AdminProductResponse)
def update_admin_product(
    product_id: int,
    payload: AdminProductUpsertRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_funcionario_user_with_retry(db, current_user)
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
    except OperationalError as e:
        logger.error(f"Error de BD al actualizar producto: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


@router.patch("/admin/{product_id}/visibility", response_model=AdminProductResponse)
def set_product_visibility(
    product_id: int,
    payload: AdminProductVisibilityRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_funcionario_user_with_retry(db, current_user)
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
    except OperationalError as e:
        logger.error(f"Error de BD al cambiar visibilidad: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


@router.delete("/admin/{product_id}")
def logical_delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_funcionario_user_with_retry(db, current_user)
    company_id = db_user.company_id or 1

    try:
        ProductService.logical_delete_product(
            db=db,
            product_id=product_id,
            company_id=company_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except OperationalError as e:
        logger.error(f"Error de BD al eliminar producto: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )

    return {"message": "Producto eliminado"}

@router.post("/admin/{product_id}/media", response_model=FileAssetResponse)
async def upload_product_media_endpoint(
    product_id: int,
    company_id: int = Form(...),
    media_kind: str = Form(...),
    media_role: str = Form(...),
    sort_order: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_funcionario_user_with_retry(db, current_user)
    user_company_id = db_user.company_id or company_id

    contents = await file.read()

    try:
        return ProductService.upload_product_media(
            db=db,
            product_id=product_id,
            company_id=user_company_id,
            user_id=db_user.id,
            media_kind=media_kind,
            media_role=media_role,
            sort_order=sort_order,
            file=contents,
            filename=file.filename or "unknown",
            content_type=file.content_type or "application/octet-stream",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except OperationalError as e:
        logger.error(f"Error de BD al subir media: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )
    except Exception as exc:
        logger.error(f"FATAL ERROR in upload_product_media_endpoint: {exc}")
        raise HTTPException(status_code=500, detail="Error interno al subir archivo")