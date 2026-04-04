from sqlalchemy.orm import Session
from datetime import datetime

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.parameters import Parameters
from app.models.file_assets import FileAsset


class OrderService:

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

        # 1. Crear orden
        order = Order(
            user_id=user_id,
            created_at=datetime.utcnow(),
            total_amount=0
        )
        db.add(order)
        db.flush()

        # 2. Crear item
        item = OrderItem(
            order_id=order.id,
            product_id=None,
            quantity=1
        )
        db.add(item)
        db.flush()

        # 🔥 3. GUARDAR IMAGEN EN file_assets
        # Extraer path desde la URL firmada
        # Ejemplo URL:
        # https://.../object/sign/order-references/1/temp/xxx.png?token=...

        image_url = data.image_url

        # 🔥 EXTRAER SOLO EL PATH REAL
        # order-references/1/temp/xxx.png
        storage_path = image_url.split("/object/sign/")[1].split("?")[0]

        # bucket
        bucket_name = storage_path.split("/")[0]

        # path sin bucket
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