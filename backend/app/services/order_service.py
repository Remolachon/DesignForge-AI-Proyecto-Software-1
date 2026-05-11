from uuid import uuid4
from datetime import datetime, timedelta

from sqlalchemy import String, cast
from sqlalchemy.orm import Session, joinedload

from app.models.file_assets import FileAsset
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.parameters import Parameters
from app.models.product import Product
from app.models.product_type import ProductType
from app.models.productionStage import ProductionStage
from app.models.statusHistory import StatusHistory
from app.models.transaction import Transaction
from app.models.company import Company
from app.models.user import User
from app.providers.payu_provider import payu_provider
from app.providers.supabase_provider import supabase_admin
from app.services.interaction_service import InteractionService


class OrderService:
    VAT_RATE_CO = 0.19

    @staticmethod
    def _now_local() -> datetime:
        return datetime.utcnow() - timedelta(hours=5)

    @staticmethod
    def _calculate_amounts_with_vat(subtotal: float) -> tuple[float, float, float]:
        safe_subtotal = round(float(subtotal or 0), 2)
        if safe_subtotal < 0:
            raise ValueError("El subtotal no puede ser negativo")

        tax_amount = round(safe_subtotal * OrderService.VAT_RATE_CO, 2)
        total_amount = round(safe_subtotal + tax_amount, 2)
        return safe_subtotal, tax_amount, total_amount

    @staticmethod
    def _normalize_status(value: str | None) -> str:
        if not value:
            return ""
        return value.strip().lower()

    @staticmethod
    def _get_filter_for_pending_payment_status(db: Session):
        """
        Retorna una función que filtra órdenes cuyo estado efectivo es "Pendiente de pago".
        Considera tanto ProductionStages como transaction statuses.
        """
        from sqlalchemy import and_, or_
        
        # Órdenes con transacciones en estado pending/declined/etc
        pending_tx = (
            db.query(Order.id)
            .join(Transaction)
            .filter(Transaction.status.in_(["pending", "declined", "expired", "cancelled", "refunded", "unknown"]))
            .distinct()
        )
        
        # También incluir órdenes con stage ProductionStage.name = "Pendiente de pago" si existe
        pending_stage_ids = (
            db.query(Order.id)
            .join(Order.items)
            .join(OrderItem.current_stage)
            .filter(ProductionStage.name.in_(["Pendiente de pago"]))
            .distinct()
        )
        
        return or_(Order.id.in_(pending_tx), Order.id.in_(pending_stage_ids))

    @staticmethod
    def _canonical_status(value: str | None) -> str:
        normalized = OrderService._normalize_status(value)

        if normalized in {"pendiente de pago", "pendiente_pago", "pending payment"}:
            return "Pendiente de pago"
        if normalized == "en diseño":
            return "En diseño"
        if normalized in {"en produccion", "en producción"}:
            return "En producción"
        if normalized == "listo para entregar":
            return "Listo para entregar"
        if normalized == "entregado":
            return "Entregado"
        if normalized in {"pago rechazado", "pago no aprobado", "payment declined", "declined"}:
            return "Pendiente de pago"

        return value.strip() if value else "En diseño"

    @staticmethod
    def _status_candidates(value: str | None) -> list[str]:
        canonical = OrderService._canonical_status(value)
        return [canonical]

    @staticmethod
    def _resolve_target_stage(db: Session, requested_status: str | None) -> ProductionStage | None:
        target_canonical = OrderService._canonical_status(requested_status)
        stages = db.query(ProductionStage).all()
        for stage in stages:
            if OrderService._canonical_status(stage.name) == target_canonical:
                return stage
        return None

    @staticmethod
    def _ensure_stage(db: Session, stage_name: str) -> ProductionStage:
        stage = db.query(ProductionStage).filter(ProductionStage.name == stage_name).first()
        if stage:
            return stage
        stage = ProductionStage(name=stage_name)
        db.add(stage)
        db.flush()
        return stage

    @staticmethod
    def _order_query_options():
        return [
            joinedload(Order.user).joinedload(User.company),
            joinedload(Order.items).joinedload(OrderItem.current_stage),
            joinedload(Order.items).joinedload(OrderItem.product_type),
            joinedload(Order.items).joinedload(OrderItem.assets),
            joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.company),
        ]

    @staticmethod
    def _safe_signed_url(bucket_name: str | None, storage_path: str | None) -> str | None:
        if not bucket_name or not storage_path:
            return None
        try:
            data = supabase_admin.storage.from_(bucket_name).create_signed_url(storage_path, 3600)
            return data.get("signedURL") or data.get("signedUrl")
        except Exception:
            return None

    @staticmethod
    def _sort_assets(assets: list[FileAsset]) -> list[FileAsset]:
        return sorted(
            assets,
            key=lambda asset: (
                0 if (asset.media_role or "").lower() == "main" else 1,
                asset.sort_order if asset.sort_order is not None else 9999,
                asset.id or 0,
            ),
        )

    @staticmethod
    def _serialize_media_asset(asset: FileAsset) -> dict:
        return {
            "bucket": asset.bucket_name,
            "path": asset.storage_path,
            "mediaKind": asset.media_kind,
            "mediaRole": asset.media_role,
            "mimeType": asset.mime_type,
            "sortOrder": asset.sort_order,
        }

    @staticmethod
    def _is_video_asset(asset: FileAsset) -> bool:
        media_kind = (asset.media_kind or "").lower()
        mime_type = (asset.mime_type or "").lower()
        return media_kind == "video" or mime_type.startswith("video/")

    @staticmethod
    def _resolve_order_assets(db: Session, item: OrderItem | None) -> list[FileAsset]:
        if not item:
            return []

        assets = OrderService._sort_assets(list(item.assets or []))
        if assets:
            return assets

        product = item.product if getattr(item, "product", None) else None
        if not product:
            return []

        fallback_asset = (
            db.query(FileAsset)
            .filter(
                FileAsset.product_id == product.id,
                FileAsset.file_type == "product_main",
                FileAsset.is_active == True,
            )
            .first()
        )

        return [fallback_asset] if fallback_asset else []

    @staticmethod
    def _resolve_order_asset(db: Session, item: OrderItem | None) -> FileAsset | None:
        assets = OrderService._resolve_order_assets(db, item)
        if not assets:
            return None

        for asset in assets:
            if not OrderService._is_video_asset(asset):
                return asset

        return assets[0]

    @staticmethod
    def _resolve_company_name(item: OrderItem | None) -> str | None:
        product = item.product if item and getattr(item, "product", None) else None
        product_company = product.company if product and getattr(product, "company", None) else None

        if product_company and product_company.name:
            return product_company.name

        return None

    @staticmethod
    def _create_transaction(
        db: Session,
        order_id: int,
        user_id: int,
        amount: float,
        payment_method: str = "payu",
    ) -> Transaction:
        """
        Crea un nuevo registro de transacción para una orden.
        """
        transaction = Transaction(
            order_id=order_id,
            user_id=user_id,
            payment_method=payment_method,
            amount=amount,
            status="pending",
            transaction_date=OrderService._now_local(),
        )
        db.add(transaction)
        db.flush()
        return transaction

    @staticmethod
    def _update_transaction_reference(
        db: Session,
        order_id: int,
        payu_reference: str,
    ) -> Transaction | None:
        """
        Actualiza la referencia de PayU en el registro de transacción más reciente.
        """
        transaction = (
            db.query(Transaction)
            .filter(Transaction.order_id == order_id)
            .order_by(Transaction.transaction_date.desc())
            .first()
        )
        if transaction:
            transaction.payu_reference = payu_reference
            db.flush()
        return transaction

    @staticmethod
    def _update_transaction_status(
        db: Session,
        order_id: int,
        status: str,
        payu_transaction_id: str | None = None,
        payu_response_code: str | None = None,
        payu_state_pol: str | None = None,
    ) -> Transaction | None:
        """
        Actualiza el estado y los datos de PayU en el registro de transacción más reciente.
        """
        transaction = (
            db.query(Transaction)
            .filter(Transaction.order_id == order_id)
            .order_by(Transaction.transaction_date.desc())
            .first()
        )
        if transaction:
            transaction.status = status
            if payu_transaction_id:
                transaction.payu_transaction_id = payu_transaction_id
            if payu_response_code:
                transaction.payu_response_code = payu_response_code
            if payu_state_pol:
                transaction.payu_state_pol = payu_state_pol
            if status == "approved":
                transaction.approved_at = OrderService._now_local()
            db.flush()
        return transaction

    @staticmethod
    def _get_transaction_payment_status(db: Session, order_id: int) -> str | None:
        """
        Obtiene el estado de pago más reciente para una orden desde transactions.
        Retorna: 'pending', 'approved', 'declined', 'expired', 'cancelled', 'refunded' o None
        """
        transaction = (
            db.query(Transaction)
            .filter(Transaction.order_id == order_id)
            .order_by(Transaction.transaction_date.desc())
            .first()
        )
        return transaction.status if transaction else None

    @staticmethod
    def _get_transaction_reference(db: Session, order_id: int) -> str | None:
        """
        Obtiene la referencia de PayU más reciente para una orden desde transactions.
        """
        transaction = (
            db.query(Transaction)
            .filter(Transaction.order_id == order_id)
            .order_by(Transaction.transaction_date.desc())
            .first()
        )
        return transaction.payu_reference if transaction else None

    @staticmethod
    def _serialize_order(db: Session, order: Order, include_client: bool = False, include_image_url: bool = False):
        item = order.items[0] if hasattr(order, "items") and order.items else None
        asset = OrderService._resolve_order_asset(db, item)
        media_assets = OrderService._resolve_order_assets(db, item)
        product = item.product if item and getattr(item, "product", None) else None

        stage_name = item.current_stage.name if item and item.current_stage and item.current_stage.name else "En diseño"
        stage_name = OrderService._canonical_status(stage_name)
        
        # Obtener estado de pago desde transactions
        payment_status = OrderService._get_transaction_payment_status(db, order.id)
        if payment_status in {"pending", "declined", "expired", "cancelled", "refunded", "unknown"}:
            stage_name = "Pendiente de pago"

        title = product.name if product and product.name else (item.product_type.name if item and item.product_type and item.product_type.name else "Pedido personalizado")
        product_type = item.product_type.name if item and item.product_type else None

        created_at = order.created_at or OrderService._now_local()
        delivery_date = created_at + timedelta(days=7)

        bucket_name = asset.bucket_name if asset else ""
        storage_path = asset.storage_path if asset else ""

        payload = {
            "id": str(order.id),
            "title": title,
            "status": stage_name,
            "price": float(order.total_amount or 0),
            "deliveryDate": delivery_date.isoformat(),
            "createdAt": created_at.isoformat(),
            "image": {"bucket": bucket_name, "path": storage_path},
            "imageUrl": OrderService._safe_signed_url(bucket_name, storage_path) if include_image_url else None,
            "media": [OrderService._serialize_media_asset(media_asset) for media_asset in media_assets],
            "productId": item.product_id if item else None,
            "productType": product_type,
            "quantity": item.quantity if item else 1,
            "parameters": {
                "length": item.parameters.length if item and item.parameters else 0,
                "height": item.parameters.height if item and item.parameters else 0,
                "width": item.parameters.width if item and item.parameters else 0,
                "material": item.parameters.material if item and item.parameters else "",
            } if item and item.parameters else None,
        }

        if include_client:
            first_name = order.user.first_name if order.user else ""
            last_name = order.user.last_name if order.user else ""
            payload["clientName"] = f"{first_name} {last_name}".strip() or "Cliente"
            payload["companyName"] = OrderService._resolve_company_name(item)

        return payload

    @staticmethod
    def get_dashboard_data(db: Session, user_id: int, role_name: str, company_id: int | None = None):
        is_funcionario = role_name == "funcionario"
        is_admin = role_name == "administrador"

        query = (
            db.query(Order)
            .options(*OrderService._order_query_options())
            .order_by(Order.created_at.desc())
        )

        if is_admin:
            pass
        elif is_funcionario:
            if company_id is None:
                query = query.filter(False)
            else:
                query = query.filter(Order.items.any(OrderItem.product.has(Product.company_id == company_id)))
        else:
            query = query.filter(Order.user_id == user_id)

        orders = query.all()
        serialized_orders = [OrderService._serialize_order(db, order, include_client=is_funcionario, include_image_url=True) for order in orders]

        canonical_statuses = [OrderService._canonical_status(o["status"]) for o in serialized_orders]

        stats = {
            "total": len(serialized_orders),
            "pending_payment": len([s for s in canonical_statuses if s == "Pendiente de pago"]),
            "design": len([s for s in canonical_statuses if s == "En diseño"]),
            "production": len([s for s in canonical_statuses if s == "En producción"]),
            "ready": len([s for s in canonical_statuses if s == "Listo para entregar"]),
            "active": len([s for s in canonical_statuses if s in {"En diseño", "En producción"}]),
        }

        return {"orders": serialized_orders, "stats": stats}

    @staticmethod
    def get_user_orders(db: Session, user_id: int):
        query = (
            db.query(Order)
            .options(*OrderService._order_query_options())
            .filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
        )
        orders = query.all()
        return [OrderService._serialize_order(db, order, include_client=False) for order in orders]

    @staticmethod
    def _paginate(query, page: int, page_size: int):
        safe_page = max(1, page)
        safe_page_size = max(1, min(page_size, 100))
        total_items = query.count()
        total_pages = max(1, (total_items + safe_page_size - 1) // safe_page_size)
        if safe_page > total_pages:
            safe_page = total_pages
        offset = (safe_page - 1) * safe_page_size
        items = query.offset(offset).limit(safe_page_size).all()
        return {
            "items": items,
            "page": safe_page,
            "page_size": safe_page_size,
            "total_items": total_items,
            "total_pages": total_pages,
        }

    @staticmethod
    def get_user_orders_page(
        db: Session,
        user_id: int,
        page: int,
        page_size: int,
        search: str | None = None,
        status: str | None = None,
    ):
        query = (
            db.query(Order)
            .options(*OrderService._order_query_options())
            .filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
        )

        if search:
            raw = search.strip()
            term = f"%{raw}%"
            term_numeric = raw.replace("#", "")
            matching_ids = (
                db.query(Order.id)
                .join(Order.items)
                .join(OrderItem.current_stage)
                .join(OrderItem.product_type)
                .filter(
                    (cast(Order.id, String).ilike(term))
                    | (cast(Order.id, String).ilike(f"%{term_numeric}%"))
                    | (ProductionStage.name.ilike(term))
                    | (Product.name.ilike(term))
                    | (ProductType.name.ilike(term))
                )
                .distinct()
            )
            query = query.filter(Order.id.in_(matching_ids))

        if status and status != "all":
            normalized_status = OrderService._normalize_status(status)
            if normalized_status in {"pendiente de pago", "pendiente_pago"}:
                query = query.filter(OrderService._get_filter_for_pending_payment_status(db))
            else:
                candidates = OrderService._status_candidates(status)
                matching_ids = (
                    db.query(Order.id)
                    .join(Order.items)
                    .join(OrderItem.current_stage)
                    .filter(ProductionStage.name.in_(candidates))
                    .distinct()
                )
                query = query.filter(Order.id.in_(matching_ids))

        page_data = OrderService._paginate(query, page, page_size)
        serialized = [OrderService._serialize_order(db, o, include_client=False, include_image_url=True) for o in page_data["items"]]

        return {
            "items": serialized,
            "page": page_data["page"],
            "pageSize": page_data["page_size"],
            "totalItems": page_data["total_items"],
            "totalPages": page_data["total_pages"],
        }

    @staticmethod
    def get_funcionario_orders_page(
        db: Session,
        page: int,
        page_size: int,
        search: str | None = None,
        status: str | None = None,
        company_id: int | None = None,
    ):
        query = (
            db.query(Order)
            .options(*OrderService._order_query_options())
            .order_by(Order.created_at.desc())
        )

        # Filtrar solo órdenes relacionadas con productos de la empresa del funcionario
        if company_id is not None:
            query = query.filter(Order.items.any(OrderItem.product.has(Product.company_id == company_id)))

        if search:
            raw = search.strip()
            term = f"%{raw}%"
            term_numeric = raw.replace("#", "")
            matching_ids = (
                db.query(Order.id)
                .join(User, Order.user_id == User.id)
                .join(Order.items)
                .join(OrderItem.current_stage)
                .join(OrderItem.product_type)
                .filter(
                    (cast(Order.id, String).ilike(term))
                    | (cast(Order.id, String).ilike(f"%{term_numeric}%"))
                    | (User.first_name.ilike(term))
                    | (User.last_name.ilike(term))
                    | (User.email.ilike(term))
                    | (ProductionStage.name.ilike(term))
                    | (Product.name.ilike(term))
                    | (ProductType.name.ilike(term))
                )
                .distinct()
            )
            query = query.filter(Order.id.in_(matching_ids))

        if status and status != "all":
            normalized_status = OrderService._normalize_status(status)
            if normalized_status in {"pendiente de pago", "pendiente_pago"}:
                query = query.filter(OrderService._get_filter_for_pending_payment_status(db))
            else:
                candidates = OrderService._status_candidates(status)
                matching_ids = (
                    db.query(Order.id)
                    .join(Order.items)
                    .join(OrderItem.current_stage)
                    .filter(ProductionStage.name.in_(candidates))
                    .distinct()
                )
                query = query.filter(Order.id.in_(matching_ids))

        page_data = OrderService._paginate(query, page, page_size)
        serialized = [OrderService._serialize_order(db, o, include_client=True, include_image_url=True) for o in page_data["items"]]

        return {
            "items": serialized,
            "page": page_data["page"],
            "pageSize": page_data["page_size"],
            "totalItems": page_data["total_items"],
            "totalPages": page_data["total_pages"],
        }

    @staticmethod
    def get_admin_orders_page(
        db: Session,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        status: str | None = None,
    ):
        query = (
            db.query(Order)
            .options(*OrderService._order_query_options())
            .order_by(Order.created_at.desc())
        )

        if search:
            raw = search.strip()
            term = f"%{raw}%"
            term_numeric = raw.replace("#", "")
            matching_ids = (
                db.query(Order.id)
                .join(User, Order.user_id == User.id)
                .outerjoin(User.company)
                .join(Order.items)
                .join(OrderItem.current_stage)
                .join(OrderItem.product_type)
                .filter(
                    (cast(Order.id, String).ilike(term))
                    | (cast(Order.id, String).ilike(f"%{term_numeric}%"))
                    | (User.first_name.ilike(term))
                    | (User.last_name.ilike(term))
                    | (User.email.ilike(term))
                    | (Company.name.ilike(term))
                    | (Product.company.has(Company.name.ilike(term)))
                    | (ProductionStage.name.ilike(term))
                    | (Product.name.ilike(term))
                    | (ProductType.name.ilike(term))
                )
                .distinct()
            )
            query = query.filter(Order.id.in_(matching_ids))

        if status and status != "all":
            normalized_status = OrderService._normalize_status(status)
            if normalized_status in {"pendiente de pago", "pendiente_pago"}:
                query = query.filter(OrderService._get_filter_for_pending_payment_status(db))
            else:
                candidates = OrderService._status_candidates(status)
                matching_ids = (
                    db.query(Order.id)
                    .join(Order.items)
                    .join(OrderItem.current_stage)
                    .filter(ProductionStage.name.in_(candidates))
                    .distinct()
                )
                query = query.filter(Order.id.in_(matching_ids))

        page_data = OrderService._paginate(query, page, page_size)
        serialized = [OrderService._serialize_order(db, o, include_client=True, include_image_url=True) for o in page_data["items"]]

        return {
            "items": serialized,
            "page": page_data["page"],
            "pageSize": page_data["page_size"],
            "totalItems": page_data["total_items"],
            "totalPages": page_data["total_pages"],
        }

    @staticmethod
    def update_order_status(
        db: Session,
        order_id: int,
        new_status: str,
        changed_by_user_id: int,
    ):
        order = (
            db.query(Order)
            .options(*OrderService._order_query_options())
            .filter(Order.id == order_id)
            .first()
        )

        if not order or not order.items:
            raise ValueError("Pedido no encontrado")

        item = order.items[0]
        prev_stage_id = item.current_stage_id
        prev_status = item.current_stage.name if item.current_stage else None
        target_stage = OrderService._resolve_target_stage(db, new_status)

        if not target_stage:
            raise ValueError("Estado no válido")

        if prev_status and OrderService._canonical_status(prev_status) == OrderService._canonical_status(target_stage.name):
            return OrderService._serialize_order(db, order, include_client=True)

        item.current_stage_id = target_stage.id
        db.add(
            StatusHistory(
                order_item_id=item.id,
                production_stage_id=prev_stage_id,
                new_stage_id=target_stage.id,
                changed_by=changed_by_user_id,
                changed_at=OrderService._now_local(),
            )
        )

        db.commit()
        db.refresh(order)

        delivered_status = OrderService._canonical_status(target_stage.name)
        product_item = next((order_item for order_item in order.items if order_item.product_id), item)

        if delivered_status == "Entregado" and product_item and product_item.product_id:
            try:
                product_name = None
                if product_item.product and product_item.product.name:
                    product_name = product_item.product.name
                elif product_item.product_type and product_item.product_type.name:
                    product_name = product_item.product_type.name

                InteractionService.create_delivery_review_notification(
                    db=db,
                    user_id=order.user_id,
                    order_id=order.id,
                    product_id=product_item.product_id,
                    product_name=product_name,
                )
                db.commit()
            except Exception:
                db.rollback()

        updated_order = (
            db.query(Order)
            .options(*OrderService._order_query_options())
            .filter(Order.id == order_id)
            .first()
        )

        return OrderService._serialize_order(db, updated_order, include_client=True)

    @staticmethod
    def create_order(db: Session, user_id: int, data):
        if not isinstance(user_id, int):
            raise ValueError("user_id debe ser INTEGER (id interno de users)")
        if not data.image_url:
            raise ValueError("La imagen es obligatoria")
        if not data.size or not data.material:
            raise ValueError("Faltan datos de configuración")

        pending_stage = OrderService._ensure_stage(db, "Pendiente de pago")
        OrderService._ensure_stage(db, "En diseño")

        product_type_obj = db.query(ProductType).filter(ProductType.name == data.product_type).first()
        if not product_type_obj:
            raise ValueError("Tipo de producto no válido")

        order = Order(
            user_id=user_id,
            created_at=OrderService._now_local(),
            total_amount=0,
        )
        db.add(order)
        db.flush()

        item = OrderItem(
            order_id=order.id,
            product_id=None,
            quantity=1,
            order_date=OrderService._now_local(),
            current_stage_id=pending_stage.id,
            product_type_id=product_type_obj.id,
        )
        db.add(item)
        db.flush()

        db.add(
            StatusHistory(
                order_item_id=item.id,
                production_stage_id=pending_stage.id,
                changed_at=OrderService._now_local(),
            )
        )

        image_url = data.image_url
        storage_path = image_url.split("/object/sign/")[1].split("?")[0]
        bucket_name = storage_path.split("/")[0]
        storage_path_clean = "/".join(storage_path.split("/")[1:])

        db.add(
            FileAsset(
                bucket_name=bucket_name,
                storage_path=storage_path_clean,
                file_type="reference_image",
                order_item_id=item.id,
                is_active=True,
            )
        )

        db.add(
            Parameters(
                order_item_id=item.id,
                length=10,
                height=10,
                width=10,
                material=data.material,
            )
        )

        base_price = 10000
        size_map = {"small": 1, "medium": 1.5, "large": 2, "xlarge": 2.5}
        material_map = {"standard": 1, "premium": 1.3, "deluxe": 1.6}
        size_multiplier = size_map.get(data.size)
        material_multiplier = material_map.get(data.material)

        if size_multiplier is None or material_multiplier is None:
            raise ValueError("Valores inválidos en tamaño o material")

        subtotal = base_price * size_multiplier * material_multiplier
        _, _, total_amount = OrderService._calculate_amounts_with_vat(subtotal)
        order.total_amount = total_amount
        db.commit()
        db.refresh(order)
        
        # Crear registro en transactions
        OrderService._create_transaction(
            db=db,
            order_id=order.id,
            user_id=user_id,
            amount=total_amount,
            payment_method="payu",
        )
        db.commit()
        
        return order

    @staticmethod
    def create_marketplace_order(db: Session, user_id: int, data):
        if not isinstance(user_id, int):
            raise ValueError("user_id debe ser INTEGER (id interno de users)")
        if not data.product_id:
            raise ValueError("El product_id es obligatorio")
        if data.length <= 0 or data.height <= 0 or data.width <= 0:
            raise ValueError("Las dimensiones deben ser mayores que 0")
        if not data.material:
            raise ValueError("El material es obligatorio")

        product = db.query(Product).filter(
            Product.id == data.product_id,
            Product.is_active == True,
            Product.is_public == True,
        ).first()
        if not product:
            raise ValueError("Producto no existe o no está disponible")

        pending_stage = OrderService._ensure_stage(db, "Pendiente de pago")
        OrderService._ensure_stage(db, "En diseño")

        product_type_id = product.product_type_id
        if not product_type_id:
            raise ValueError("El producto no tiene un tipo de producto asociado")

        product_assets = (
            db.query(FileAsset)
            .filter(
                FileAsset.product_id == product.id,
                FileAsset.is_active == True,
            )
            .order_by(FileAsset.sort_order.asc().nullslast(), FileAsset.id.asc())
            .all()
        )
        if not product_assets:
            raise ValueError("El producto no tiene una imagen principal configurada")

        order = Order(
            user_id=user_id,
            created_at=OrderService._now_local(),
            total_amount=0,
        )
        db.add(order)
        db.flush()

        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=1,
            order_date=OrderService._now_local(),
            current_stage_id=pending_stage.id,
            product_type_id=product_type_id,
        )
        db.add(item)
        db.flush()

        db.add(
            StatusHistory(
                order_item_id=item.id,
                production_stage_id=pending_stage.id,
                changed_at=OrderService._now_local(),
            )
        )

        order_bucket = "order-references"
        copied_assets = 0

        for source_asset in product_assets:
            try:
                source_bucket = source_asset.bucket_name
                source_path = source_asset.storage_path
                file_ext = source_path.split(".")[-1] if "." in source_path else (source_asset.extension or "png")
                order_storage_path = f"{user_id}/orders/{order.id}/{uuid4().hex}.{file_ext}"

                file_bytes = supabase_admin.storage.from_(source_bucket).download(source_path)
                fallback_content_type = f"video/{file_ext}" if (source_asset.media_kind or "").lower() == "video" else f"image/{file_ext}"
                supabase_admin.storage.from_(order_bucket).upload(
                    path=order_storage_path,
                    file=file_bytes,
                    file_options={"content-type": source_asset.mime_type or fallback_content_type},
                )

                db.add(
                    FileAsset(
                        bucket_name=order_bucket,
                        storage_path=order_storage_path,
                        file_type="reference_image",
                        order_item_id=item.id,
                        is_active=True,
                        media_kind=source_asset.media_kind,
                        media_role=source_asset.media_role,
                        sort_order=source_asset.sort_order,
                        mime_type=source_asset.mime_type,
                    )
                )
                copied_assets += 1
            except Exception:
                continue

        if copied_assets == 0:
            raise ValueError("No se pudo copiar la media del producto")

        db.add(
            Parameters(
                order_item_id=item.id,
                length=data.length,
                height=data.height,
                width=data.width,
                material=data.material,
            )
        )

        base_price = float(product.base_price)
        # En marketplace el valor comercial base del producto es el subtotal.
        subtotal = base_price
        _, _, total_amount = OrderService._calculate_amounts_with_vat(subtotal)
        order.total_amount = total_amount
        db.commit()
        db.refresh(order)
        
        # Crear registro en transactions
        OrderService._create_transaction(
            db=db,
            order_id=order.id,
            user_id=user_id,
            amount=total_amount,
            payment_method="payu",
        )
        db.commit()
        
        return order

    @staticmethod
    def get_order_detail(db: Session, order_id: int, user_id: int, role_name: str, company_id: int | None = None):
        query = (
            db.query(Order)
            .options(
                joinedload(Order.user).joinedload(User.company),
                joinedload(Order.items).joinedload(OrderItem.current_stage),
                joinedload(Order.items).joinedload(OrderItem.product_type),
                joinedload(Order.items).joinedload(OrderItem.parameters),
                joinedload(Order.items).joinedload(OrderItem.assets),
                joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.company),
            )
            .filter(Order.id == order_id)
        )

        # Admins can see any order. Funcionarios see orders linked to their company via the product.
        if role_name == "administrador":
            pass
        elif role_name == "funcionario":
            if not company_id:
                return None
            query = query.filter(Order.items.any(OrderItem.product.has(Product.company_id == company_id)))
        else:
            # Regular users can only see their own orders
            query = query.filter(Order.user_id == user_id)

        order = query.first()
        if not order or not order.items:
            return None

        item = order.items[0]
        asset = OrderService._resolve_order_asset(db, item)
        params = item.parameters
        product = item.product if item.product else None

        stage_name = item.current_stage.name if item.current_stage and item.current_stage.name else "En diseño"
        stage_name = OrderService._canonical_status(stage_name)
        
        # Obtener estado de pago desde transactions
        payment_status = OrderService._get_transaction_payment_status(db, order.id)
        if payment_status in {"pending", "declined", "expired", "cancelled", "refunded", "unknown"}:
            stage_name = "Pendiente de pago"

        title = product.name if product and product.name else (item.product_type.name if item.product_type and item.product_type.name else "Pedido personalizado")
        product_type = item.product_type.name if item.product_type else None
        created_at = order.created_at or OrderService._now_local()
        delivery_date = created_at + timedelta(days=7)
        bucket_name = asset.bucket_name if asset else ""
        storage_path = asset.storage_path if asset else ""

        payload = {
            "id": str(order.id),
            "title": title,
            "status": stage_name,
            "price": float(order.total_amount or 0),
            "deliveryDate": delivery_date.isoformat(),
            "createdAt": created_at.isoformat(),
            "image": {"bucket": bucket_name, "path": storage_path},
            "imageUrl": OrderService._safe_signed_url(bucket_name, storage_path),
            "media": [OrderService._serialize_media_asset(media_asset) for media_asset in OrderService._resolve_order_assets(db, item)],
            "productId": item.product_id if item else None,
            "productType": product_type,
            "quantity": item.quantity,
            "parameters": {
                "length": params.length if params else 0,
                "height": params.height if params else 0,
                "width": params.width if params else 0,
                "material": params.material if params else "",
            } if params else None,
            "companyName": OrderService._resolve_company_name(item),
        }

        first_name = order.user.first_name if order.user else ""
        last_name = order.user.last_name if order.user else ""
        payload["clientName"] = f"{first_name} {last_name}".strip() or "Cliente"

        return payload

    @staticmethod
    def generate_payment_url(db: Session, order_id: int) -> dict:
        try:
            order = db.query(Order).filter(Order.id == order_id).first()
            if not order:
                return {"error": "Orden no encontrada", "status": "error"}
            
            # Validar que el pago está pendiente (leer de transactions)
            payment_status = OrderService._get_transaction_payment_status(db, order_id)
            if payment_status != "pending":
                return {"error": "La orden no está en estado pendiente de pago", "status": "error"}
            
            user = order.user
            if not user:
                return {"error": "Usuario no encontrado", "status": "error"}

            buyer_name = f"{user.first_name} {user.last_name}".strip() or "Cliente"
            total_amount = float(order.total_amount or 0)
            tax_return_base = round(total_amount / (1 + OrderService.VAT_RATE_CO), 2)
            tax_amount = round(total_amount - tax_return_base, 2)

            result = payu_provider.generate_payment_url(
                order_id=order_id,
                user_email=user.email,
                total_amount=total_amount,
                buyer_name=buyer_name,
                tax_amount=tax_amount,
                tax_return_base=tax_return_base,
            )
            if result.get("status") == "error":
                return result

            # Actualizar referencia en transactions (no guardar en order ya que payment_status fue eliminado)
            OrderService._update_transaction_reference(
                db=db,
                order_id=order_id,
                payu_reference=result.get("payment_reference", ""),
            )
            db.commit()
            
            return result
        except Exception as e:
            return {"error": f"Error generando URL: {str(e)}", "status": "error"}

    @staticmethod
    def process_payu_webhook(db: Session, webhook_data: dict) -> dict:
        try:
            order_id = webhook_data.get("extra1")
            if not order_id:
                reference_code = webhook_data.get("referenceCode") or webhook_data.get("reference_code")
                if reference_code and str(reference_code).startswith("ORDER-"):
                    parts = str(reference_code).split("-")
                    if len(parts) >= 2 and parts[1].isdigit():
                        order_id = parts[1]
            if not order_id:
                return {"status": "error", "message": "order_id no encontrado"}

            order = db.query(Order).filter(Order.id == int(order_id)).first()
            if not order:
                return {"status": "error", "message": f"Orden {order_id} no encontrada"}

            response_code = (
                webhook_data.get("responseCode")
                or webhook_data.get("response_code_pol")
                or webhook_data.get("responseCodePol")
                or webhook_data.get("lapResponseCode")
                or webhook_data.get("transactionState")
                or ""
            )
            state_pol = webhook_data.get("statePol") or webhook_data.get("state_pol") or webhook_data.get("transactionState") or ""
            item = order.items[0] if order.items else None

            if payu_provider.is_payment_approved(response_code, state_pol):
                design_stage = OrderService._ensure_stage(db, "En diseño")

                # Actualizar transacción
                OrderService._update_transaction_status(
                    db=db,
                    order_id=int(order_id),
                    status="approved",
                    payu_transaction_id=webhook_data.get("transactionId", ""),
                    payu_response_code=response_code,
                    payu_state_pol=state_pol,
                )

                if item and item.current_stage_id != design_stage.id:
                    previous_stage_id = item.current_stage_id
                    item.current_stage_id = design_stage.id
                    db.add(
                        StatusHistory(
                            order_item_id=item.id,
                            production_stage_id=previous_stage_id,
                            new_stage_id=design_stage.id,
                            changed_by=None,
                            changed_at=OrderService._now_local(),
                        )
                    )

                db.commit()
                return {
                    "status": "success",
                    "message": f"Pago aprobado para orden {order_id}",
                    "payment_status": "approved",
                    "order_id": order_id,
                }

            payment_status = payu_provider.get_payment_status(state_pol)
            internal_payment_status = "pending"

            # Actualizar transacción
            OrderService._update_transaction_status(
                db=db,
                order_id=int(order_id),
                status=internal_payment_status,
                payu_transaction_id=webhook_data.get("transactionId", ""),
                payu_response_code=response_code,
                payu_state_pol=state_pol,
            )

            if item:
                pending_stage = OrderService._ensure_stage(db, "Pendiente de pago")
                previous_stage_id = item.current_stage_id
                if previous_stage_id != pending_stage.id:
                    item.current_stage_id = pending_stage.id
                    db.add(
                        StatusHistory(
                            order_item_id=item.id,
                            production_stage_id=previous_stage_id,
                            new_stage_id=pending_stage.id,
                            changed_by=None,
                            changed_at=OrderService._now_local(),
                        )
                    )

            db.commit()
            return {
                "status": "payment_pending",
                "message": "Pago no aprobado. La orden permanece en Pendiente de pago.",
                "payment_status": internal_payment_status,
                "order_id": order_id,
            }
        except Exception as e:
            return {"status": "error", "message": f"Error: {str(e)}"}

    @staticmethod
    def get_order_payment_status(db: Session, order_id: int) -> dict:
        try:
            transaction = (
                db.query(Transaction)
                .filter(Transaction.order_id == order_id)
                .order_by(Transaction.transaction_date.desc())
                .first()
            )
            if not transaction:
                return {"status": "error", "message": "No se encontró registro de transacción para esta orden"}
            return {
                "status": "success",
                "order_id": order_id,
                "payment_status": transaction.status,
                "payment_reference": transaction.payu_reference,
                "payment_approved_at": transaction.approved_at.isoformat() if transaction.approved_at else None,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
