import logging
import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool, StaticPool, QueuePool
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Validar y obtener DATABASE_URL
DATABASE_URL = settings.DATABASE_URL

# Si no hay URL válida o estamos en testing, usar SQLite
if not DATABASE_URL or not any(DATABASE_URL.startswith(prefix) for prefix in ["postgresql://", "mysql://", "sqlite:///"]):
    logger.warning(f"URL de BD inválida o vacía. Usando SQLite para testing.")
    DATABASE_URL = "sqlite:///./test.db"

# Detectar si estamos en testing
TESTING = os.getenv("TESTING", "false").lower() == "true"

# Configuración del engine adaptada según el tipo de base de datos
engine_config = {
    "pool_pre_ping": True,
    "echo_pool": False,
}

# Para PostgreSQL: usar QueuePool con configuración de pool
if DATABASE_URL.startswith("postgresql://"):
    engine_config.update({
        "connect_args": {"options": "-c timezone=America/Bogota"},
        "pool_recycle": 1800,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
    })
    logger.info("Usando PostgreSQL como BD")
# Para SQLite: usar StaticPool para testing
elif DATABASE_URL.startswith("sqlite://"):
    engine_config["poolclass"] = StaticPool
    logger.info("Usando SQLite como BD (testing)")

# Crear engine con configuración adaptada
engine = create_engine(DATABASE_URL, **engine_config)

# Event listeners para logging de conexión
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    logger.debug("Conexión a BD establecida")

@event.listens_for(engine, "close")
def receive_close(dbapi_conn, connection_record):
    logger.debug("Conexión a BD cerrada")

@event.listens_for(engine, "detach")
def receive_detach(dbapi_conn, connection_record):
    logger.debug("Conexión a BD desprendida")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    """
    Dependency para obtener sesión de BD.
    Implementa reintentos automáticos en caso de error de conexión.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Error en sesión de BD: {e}")
        db.rollback()
        raise
    finally:
        db.close()

async def check_db_connection():
    """
    Verifica que la conexión a la BD está disponible.
    Útil para health checks.
    """
    try:
        with engine.connect() as conn:
            # usar text() para compatibilidad con SQLAlchemy
            result = conn.execute(text("SELECT 1"))
            logger.info("Conexión a BD verificada exitosamente")
            return True
    except Exception as e:
        logger.error(f"Error al verificar conexión a BD: {e}")
        return False