from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta

from app.models.order import Order
from app.models.order_item import OrderItem
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
        if normalized == "listo para entrega" or normalized == "listo para entregar":
            return "Listo para entregar"
        if normalized == "entregado":
            return "Entregado"

        return value.strip() if value else "En diseño"

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