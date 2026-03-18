# Import all models here so SQLAlchemy can register them
# in its mapper registry before any relationships are resolved.
from app.models.company import Company  # noqa: F401
from app.models.role import Role        # noqa: F401
from app.models.user import User        # noqa: F401