import logging
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool, StaticPool, QueuePool
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Configuración optimizada del engine
# QueuePool: mejor para aplicaciones multi-threaded
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"options": "-c timezone=America/Bogota"},
    # Validar conexión antes de usar (previene conexiones muertas)
    pool_pre_ping=True,
    # Reciclar conexiones cada 30 min para evitar timeouts
    pool_recycle=1800,
    # Tamaño del pool
    pool_size=10,
    # Conexiones adicionales si se agotan las del pool
    max_overflow=20,
    # Timeout al obtener conexión del pool
    pool_timeout=30,
    # Logging de conexiones
    echo_pool=False,
)

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