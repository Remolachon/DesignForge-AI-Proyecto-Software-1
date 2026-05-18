import time
import logging
from typing import Callable, TypeVar, Any
from sqlalchemy.exc import OperationalError, DBAPIError

logger = logging.getLogger(__name__)

T = TypeVar('T')

def retry_on_connection_error(
    func: Callable[..., T],
    max_retries: int = 3,
    initial_delay: float = 0.5,
    backoff_factor: float = 2.0,
    *args,
    **kwargs
) -> T:
    """
    Ejecuta una función con reintentos en caso de error de conexión a BD.
    
    Args:
        func: Función a ejecutar
        max_retries: Número máximo de reintentos
        initial_delay: Delay inicial en segundos
        backoff_factor: Factor multiplicador para delay exponencial
        *args, **kwargs: Argumentos para la función
    
    Returns:
        Resultado de la función
    
    Raises:
        La última excepción si todos los reintentos fallan
    """
    delay = initial_delay
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except (OperationalError, DBAPIError) as e:
            last_exception = e
            error_msg = str(e)
            
            # Errores que indica problemas de conexión/DNS
            is_connection_error = any(
                msg in error_msg.lower() for msg in [
                    'could not translate host name',
                    'name or service not known',
                    'connection refused',
                    'connection reset',
                    'connection timed out',
                    'pool',
                    'timeout expired',
                ]
            )
            
            if not is_connection_error:
                # No es error de conexión, re-lanzar inmediatamente
                raise
            
            if attempt < max_retries - 1:
                logger.warning(
                    f"Error de conexión a BD (intento {attempt + 1}/{max_retries}): {error_msg}. "
                    f"Reintentando en {delay}s..."
                )
                time.sleep(delay)
                delay *= backoff_factor
            else:
                logger.error(
                    f"Error de conexión a BD después de {max_retries} intentos: {error_msg}"
                )
    
    if last_exception:
        raise last_exception
    
    raise RuntimeError("Error desconocido después de reintentos")


class ConnectionRetryDecorator:
    """Decorador para reintentos en funciones"""
    
    def __init__(
        self,
        max_retries: int = 3,
        initial_delay: float = 0.5,
        backoff_factor: float = 2.0
    ):
        self.max_retries = max_retries
        self.initial_delay = initial_delay
        self.backoff_factor = backoff_factor
    
    def __call__(self, func: Callable[..., T]) -> Callable[..., T]:
        def wrapper(*args, **kwargs) -> T:
            return retry_on_connection_error(
                func,
                max_retries=self.max_retries,
                initial_delay=self.initial_delay,
                backoff_factor=self.backoff_factor,
                *args,
                **kwargs
            )
        return wrapper
