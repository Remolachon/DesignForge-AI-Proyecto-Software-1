from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from sqlalchemy import cast, String
from datetime import datetime, timedelta

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.user import User
from app.models.parameters import Parameters
from app.models.file_assets import FileAsset
from app.models.productionStage import ProductionStage
from app.models.statusHistory import StatusHistory
from app.models.product_type import ProductType
from app.providers.supabase_provider import supabase_admin


class OrderService:

    @staticmethod
    def _now_local() -> datetime:
        # UTC-5 fijo para evitar dependencia de tzdata en Windows
        return datetime.utcnow() - timedelta(hours=5)

    @staticmethod
    def _normalize_status(value: str | None) -> str:
        if not value:
            return ""

        return value.strip().lower()

    @staticmethod
    def _canonical_status(value: str | None) -> str:
        normalized = OrderService._normalize_status(value)

        if normalized == "en diseño":
            return "En diseño"
        if normalized == "en produccion" or normalized == "en producción":
            return "En producción"
        if normalized == "listo para entregar":
            return "Listo para entregar"
        if normalized == "entregado":
            return "Entregado"

        return value.strip() if value else "En diseño"

    @staticmethod
    def _status_candidates(value: str | None) -> list[str]:
        canonical = OrderService._canonical_status(value)

        if canonical == "Listo para entregar":
            return ["Listo para entregar"]

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
    def _safe_signed_url(bucket_name: str | None, storage_path: str | None) -> str | None:
        if not bucket_name or not storage_path:
            return None

        try:
            data = supabase_admin.storage.from_(bucket_name).create_signed_url(
                storage_path,
                3600,
            )
            return data.get("signedURL") or data.get("signedUrl")
        except Exception:
            return None

    @staticmethod
    def _serialize_order(order: Order, include_client: bool = False):
        item = (
            order.items[0]
            if hasattr(order, "items") and order.items
            else None
        )
        asset = item.assets[0] if item and hasattr(item, "assets") and item.assets else None

        stage_name = (
            item.current_stage.name
            if item and item.current_stage and item.current_stage.name
            else "En diseño"
        )
        stage_name = OrderService._canonical_status(stage_name)
        title = (
            item.product_type.name
            if item and item.product_type and item.product_type.name
            else "Pedido personalizado"
        )
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
            "image": {
                "bucket": bucket_name,
                "path": storage_path,
            },
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
                joinedload(Order.items)
                .joinedload(OrderItem.current_stage),
                joinedload(Order.items)
                .joinedload(OrderItem.product_type),
                joinedload(Order.items)
                .joinedload(OrderItem.assets),
            )
            .order_by(Order.created_at.desc())
        )

        if not is_funcionario:
            query = query.filter(Order.user_id == user_id)

        orders = query.all()

        serialized_orders = [
            OrderService._serialize_order(order, include_client=is_funcionario)
            for order in orders
        ]

        stats = {
            "total": len(serialized_orders),
            "design": len([o for o in serialized_orders if OrderService._canonical_status(o["status"]) == "En diseño"]),
            "production": len([o for o in serialized_orders if OrderService._canonical_status(o["status"]) == "En producción"]),
            "ready": len([o for o in serialized_orders if OrderService._canonical_status(o["status"]) == "Listo para entregar"]),
            "active": len([
                o for o in serialized_orders
                if OrderService._canonical_status(o["status"]) != "Entregado"
            ]),
        }

        return {
            "orders": serialized_orders,
            "stats": stats,
        }

    @staticmethod
    def get_user_orders(db: Session, user_id: int):
        query = (
            db.query(Order)
            .options(
                joinedload(Order.user),
                joinedload(Order.items)
                .joinedload(OrderItem.current_stage),
                joinedload(Order.items)
                .joinedload(OrderItem.product_type),
                joinedload(Order.items)
                .joinedload(OrderItem.assets),
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
            term = f"%{search.strip()}%"
            query = query.filter(cast(Order.id, String).ilike(term))

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
                .filter(
                    (cast(Order.id, String).ilike(term))
                    | (cast(Order.id, String).ilike(f"%{term_numeric}%"))
                    | (User.first_name.ilike(term))
                    | (User.last_name.ilike(term))
                    | (User.email.ilike(term))
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

        history = StatusHistory(
            order_item_id=item.id,
            production_stage_id=prev_stage_id,
            new_stage_id=target_stage.id,
            changed_by=changed_by_user_id,
            changed_at=OrderService._now_local(),
        )
        db.add(history)

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

        # 🔥 VALIDACIÓN EXTRA (CLAVE)
        if not isinstance(user_id, int):
            raise ValueError("user_id debe ser INTEGER (id interno de users)")

        # 🔥 VALIDACIÓN BÁSICA
        if not data.image_url:
            raise ValueError("La imagen es obligatoria")

        if not data.size or not data.material:
            raise ValueError("Faltan datos de configuración")

        # 🔴 NUEVO: buscar stage "En diseño"
        initial_stage = db.query(ProductionStage).filter(
            ProductionStage.name == "En diseño"
        ).first()

        if not initial_stage:
            raise ValueError("No existe el stage 'En diseño' en la BD")

        # 🔴 NUEVO: buscar tipo de producto
        product_type_obj = db.query(ProductType).filter(
            ProductType.name == data.product_type
        ).first()

        if not product_type_obj:
            raise ValueError("Tipo de producto no válido")

        # 1. Crear orden
        order = Order(
            user_id=user_id,
            created_at=OrderService._now_local(),
            total_amount=0
        )
        db.add(order)
        db.flush()

        # 2. Crear item (🔴 MODIFICADO)
        item = OrderItem(
            order_id=order.id,
            product_id=None,
            quantity=1,
            order_date=OrderService._now_local(),
            current_stage_id=initial_stage.id,     # 🔴 NUEVO
            product_type_id=product_type_obj.id    # 🔴 NUEVO
        )
        db.add(item)
        db.flush()

        # 🔴 NUEVO: guardar en status_history
        status = StatusHistory(
            order_item_id=item.id,
            production_stage_id=initial_stage.id,
            changed_at=OrderService._now_local(),
        )
        db.add(status)

        # 🔥 3. GUARDAR IMAGEN EN file_assets
        image_url = data.image_url

        storage_path = image_url.split("/object/sign/")[1].split("?")[0]

        bucket_name = storage_path.split("/")[0]

        storage_path_clean = "/".join(storage_path.split("/")[1:])

        file = FileAsset(
            bucket_name=bucket_name,
            storage_path=storage_path_clean,
            file_type="reference_image",
            order_item_id=item.id,
            is_active=True
        )

        db.add(file)

        # 3. Guardar parámetros
        params = Parameters(
            order_item_id=item.id,
            length=10,
            height=10,
            width=10,
            material=data.material
        )
        db.add(params)

        # 4. Calcular precio
        base_price = 10000

        size_map = {
            "small": 1,
            "medium": 1.5,
            "large": 2,
            "xlarge": 2.5
        }

        material_map = {
            "standard": 1,
            "premium": 1.3,
            "deluxe": 1.6
        }

        size_multiplier = size_map.get(data.size)
        material_multiplier = material_map.get(data.material)

        if size_multiplier is None or material_multiplier is None:
            raise ValueError("Valores inválidos en tamaño o material")

        total = base_price * size_multiplier * material_multiplier

        order.total_amount = total

        # 5. Guardar todo
        db.commit()
        db.refresh(order)

        return order