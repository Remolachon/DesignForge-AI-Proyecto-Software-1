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
from app.models.user import User
from app.providers.payu_provider import payu_provider
from app.providers.supabase_provider import supabase_admin


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
        if normalized == "pago rechazado":
            return "Pago rechazado"

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
    def _safe_signed_url(bucket_name: str | None, storage_path: str | None) -> str | None:
        if not bucket_name or not storage_path:
            return None
        try:
            data = supabase_admin.storage.from_(bucket_name).create_signed_url(storage_path, 3600)
            return data.get("signedURL") or data.get("signedUrl")
        except Exception:
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
    def _serialize_order(order: Order, include_client: bool = False):
        item = order.items[0] if hasattr(order, "items") and order.items else None
        asset = item.assets[0] if item and hasattr(item, "assets") and item.assets else None

        stage_name = item.current_stage.name if item and item.current_stage and item.current_stage.name else "En diseño"
        stage_name = OrderService._canonical_status(stage_name)
        if getattr(order, "payment_status", None) == "pending_payment":
            stage_name = "Pendiente de pago"
        if getattr(order, "payment_status", None) in {"declined", "expired", "cancelled"}:
            stage_name = "Pago rechazado"

        title = item.product_type.name if item and item.product_type and item.product_type.name else "Pedido personalizado"
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
            "imageUrl": OrderService._safe_signed_url(bucket_name, storage_path),
            "productType": product_type,
        }

        if include_client:
            first_name = order.user.first_name if order.user else ""
            last_name = order.user.last_name if order.user else ""
            payload["clientName"] = f"{first_name} {last_name}".strip() or "Cliente"

        return payload

    @staticmethod
    def get_dashboard_data(db: Session, user_id: int, role_name: str):
        is_funcionario = role_name == "funcionario"

        query = (
            db.query(Order)
            .options(
                joinedload(Order.user),
                joinedload(Order.items).joinedload(OrderItem.current_stage),
                joinedload(Order.items).joinedload(OrderItem.product_type),
                joinedload(Order.items).joinedload(OrderItem.assets),
            )
            .order_by(Order.created_at.desc())
        )

        if not is_funcionario:
            query = query.filter(Order.user_id == user_id)

        orders = query.all()
        serialized_orders = [OrderService._serialize_order(order, include_client=is_funcionario) for order in orders]

        stats = {
            "total": len(serialized_orders),
            "design": len([o for o in serialized_orders if OrderService._canonical_status(o["status"]) == "En diseño"]),
            "production": len([o for o in serialized_orders if OrderService._canonical_status(o["status"]) == "En producción"]),
            "ready": len([o for o in serialized_orders if OrderService._canonical_status(o["status"]) == "Listo para entregar"]),
            "active": len([o for o in serialized_orders if OrderService._canonical_status(o["status"]) != "Entregado"]),
        }

        return {"orders": serialized_orders, "stats": stats}

    @staticmethod
    def get_user_orders(db: Session, user_id: int):
        query = (
            db.query(Order)
            .options(
                joinedload(Order.user),
                joinedload(Order.items).joinedload(OrderItem.current_stage),
                joinedload(Order.items).joinedload(OrderItem.product_type),
                joinedload(Order.items).joinedload(OrderItem.assets),
            )
            .filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
        )
        orders = query.all()
        return [OrderService._serialize_order(order, include_client=False) for order in orders]

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
            .options(
                joinedload(Order.user),
                joinedload(Order.items).joinedload(OrderItem.current_stage),
                joinedload(Order.items).joinedload(OrderItem.product_type),
                joinedload(Order.items).joinedload(OrderItem.assets),
            )
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
                    | (ProductType.name.ilike(term))
                )
                .distinct()
            )
            query = query.filter(Order.id.in_(matching_ids))

        if status and status != "all":
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
        serialized = [OrderService._serialize_order(o, include_client=False) for o in page_data["items"]]

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
    ):
        query = (
            db.query(Order)
            .options(
                joinedload(Order.user),
                joinedload(Order.items).joinedload(OrderItem.current_stage),
                joinedload(Order.items).joinedload(OrderItem.product_type),
                joinedload(Order.items).joinedload(OrderItem.assets),
            )
            .order_by(Order.created_at.desc())
        )

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
                    | (ProductType.name.ilike(term))
                )
                .distinct()
            )
            query = query.filter(Order.id.in_(matching_ids))

        if status and status != "all":
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
        serialized = [OrderService._serialize_order(o, include_client=True) for o in page_data["items"]]

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
            .options(
                joinedload(Order.user),
                joinedload(Order.items).joinedload(OrderItem.current_stage),
                joinedload(Order.items).joinedload(OrderItem.product_type),
                joinedload(Order.items).joinedload(OrderItem.assets),
            )
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
            return OrderService._serialize_order(order, include_client=True)

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

        updated_order = (
            db.query(Order)
            .options(
                joinedload(Order.user),
                joinedload(Order.items).joinedload(OrderItem.current_stage),
                joinedload(Order.items).joinedload(OrderItem.product_type),
                joinedload(Order.items).joinedload(OrderItem.assets),
            )
            .filter(Order.id == order_id)
            .first()
        )

        return OrderService._serialize_order(updated_order, include_client=True)

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
            payment_status="pending_payment",
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

        product_asset = (
            db.query(FileAsset)
            .filter(
                FileAsset.product_id == product.id,
                FileAsset.file_type == "product_main",
                FileAsset.is_active == True,
            )
            .first()
        )
        if not product_asset:
            raise ValueError("El producto no tiene una imagen principal configurada")

        order = Order(
            user_id=user_id,
            created_at=OrderService._now_local(),
            total_amount=0,
            payment_status="pending_payment",
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

        source_bucket = product_asset.bucket_name
        source_path = product_asset.storage_path
        file_ext = source_path.split(".")[-1] if "." in source_path else "png"
        order_bucket = "order-references"
        order_storage_path = f"{user_id}/orders/{order.id}/{uuid4().hex}.{file_ext}"

        image_bytes = supabase_admin.storage.from_(source_bucket).download(source_path)
        supabase_admin.storage.from_(order_bucket).upload(
            path=order_storage_path,
            file=image_bytes,
            file_options={"content-type": f"image/{file_ext}"},
        )

        db.add(
            FileAsset(
                bucket_name=order_bucket,
                storage_path=order_storage_path,
                file_type="reference_image",
                order_item_id=item.id,
                is_active=True,
            )
        )

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
    def get_order_detail(db: Session, order_id: int, user_id: int, role_name: str):
        query = (
            db.query(Order)
            .options(
                joinedload(Order.user),
                joinedload(Order.items).joinedload(OrderItem.current_stage),
                joinedload(Order.items).joinedload(OrderItem.product_type),
                joinedload(Order.items).joinedload(OrderItem.parameters),
                joinedload(Order.items).joinedload(OrderItem.assets),
            )
            .filter(Order.id == order_id)
        )

        if role_name != "funcionario":
            query = query.filter(Order.user_id == user_id)

        order = query.first()
        if not order or not order.items:
            return None

        item = order.items[0]
        asset = item.assets[0] if item.assets else None
        params = item.parameters

        stage_name = item.current_stage.name if item.current_stage and item.current_stage.name else "En diseño"
        stage_name = OrderService._canonical_status(stage_name)
        if getattr(order, "payment_status", None) == "pending_payment":
            stage_name = "Pendiente de pago"
        if getattr(order, "payment_status", None) in {"declined", "expired", "cancelled"}:
            stage_name = "Pago rechazado"

        title = item.product_type.name if item.product_type and item.product_type.name else "Pedido personalizado"
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
            "productType": product_type,
            "quantity": item.quantity,
            "parameters": {
                "length": params.length if params else 0,
                "height": params.height if params else 0,
                "width": params.width if params else 0,
                "material": params.material if params else "",
            } if params else None,
        }

        if role_name == "funcionario":
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
            if order.payment_status != "pending_payment":
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

            order.payment_reference = result.get("payment_reference")
            db.commit()
            
            # Actualizar referencia en transactions
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

            order.payment_transaction_id = webhook_data.get("transactionId", "")
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
                order.payment_status = "approved"
                order.payment_approved_at = OrderService._now_local()

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
            order.payment_status = payment_status
            order.payment_transaction_id = webhook_data.get("transactionId", "")

            # Actualizar transacción
            OrderService._update_transaction_status(
                db=db,
                order_id=int(order_id),
                status=payment_status,
                payu_transaction_id=webhook_data.get("transactionId", ""),
                payu_response_code=response_code,
                payu_state_pol=state_pol,
            )

            if item and payment_status in {"declined", "expired", "cancelled"}:
                declined_stage = OrderService._ensure_stage(db, "Pago rechazado")
                previous_stage_id = item.current_stage_id
                item.current_stage_id = declined_stage.id
                db.add(
                    StatusHistory(
                        order_item_id=item.id,
                        production_stage_id=previous_stage_id,
                        new_stage_id=declined_stage.id,
                        changed_by=None,
                        changed_at=OrderService._now_local(),
                    )
                )

            db.commit()
            return {
                "status": "payment_declined",
                "message": "Pago rechazado",
                "payment_status": payment_status,
                "order_id": order_id,
            }
        except Exception as e:
            return {"status": "error", "message": f"Error: {str(e)}"}

    @staticmethod
    def get_order_payment_status(db: Session, order_id: int) -> dict:
        try:
            order = db.query(Order).filter(Order.id == order_id).first()
            if not order:
                return {"status": "error", "message": "Orden no encontrada"}
            return {
                "status": "success",
                "order_id": order_id,
                "payment_status": order.payment_status,
                "payment_reference": order.payment_reference,
                "payment_approved_at": order.payment_approved_at.isoformat() if order.payment_approved_at else None,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
