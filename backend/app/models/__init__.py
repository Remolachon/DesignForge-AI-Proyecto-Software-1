# Import all models here so SQLAlchemy can register them
# in its mapper registry before any relationships are resolved.
from app.models.company import Company  # noqa: F401
from app.models.role import Role        # noqa: F401
from app.models.user import User        # noqa: F401
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.parameters import Parameters
from app.models.productionStage import ProductionStage
from app.models.statusHistory import StatusHistory
from app.models.product_type import ProductType
from app.models.file_assets import FileAsset
from app.models.transaction import Transaction  # noqa: F401
from app.models.review import Review  # noqa: F401
from app.models.notification import Notification  # noqa: F401