import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.schemas.sales_schema import (
    TimeFilter,
    SalesSummarySchema,
    ChartDataPointSchema,
    SalesChartSchema,
    TransactionItemSchema,
    TransactionsListSchema,
)

logger = logging.getLogger(__name__)


def get_all_time_summary(db: Session) -> dict:
    """
    Calcula el total de ventas y ganancias acumuladas de TODAS las transacciones,
    sin filtro de fecha, abarcando todos los pedidos y empresas de la plataforma.
    Retorna un dict con: total_ventas, total_ganancias, total_transacciones,
    transacciones_aprobadas, ticket_promedio, tasa_aprobacion.
    """
    summary_sql = text("""
        SELECT
            COALESCE(SUM(t.amount), 0)                       AS total_ventas,
            COUNT(t.id)                                       AS total_transacciones,
            COUNT(t.id) FILTER (WHERE t.status = 'approved') AS transacciones_aprobadas
        FROM transactions t
    """)
    row = db.execute(summary_sql).fetchone()

    total_ventas = float(row.total_ventas or 0)
    total_transacciones = int(row.total_transacciones or 0)
    transacciones_aprobadas = int(row.transacciones_aprobadas or 0)

    # Ganancias reales: (unit_price - base_price) * quantity para transacciones aprobadas
    profit_sql = text("""
        SELECT
            COALESCE(
                SUM((oi.unit_price - p.base_price) * oi.quantity), 0
            ) AS total_ganancias
        FROM transactions t
        JOIN orders o    ON o.id  = t.order_id
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p  ON p.id  = oi.product_id
        WHERE t.status = 'approved'
    """)
    profit_row = db.execute(profit_sql).fetchone()
    total_ganancias = float(profit_row.total_ganancias or 0)

    # Fallback: 30% sobre ventas aprobadas si ganancia <= 0
    if total_ganancias <= 0 and total_ventas > 0:
        approved_sql = text("""
            SELECT COALESCE(SUM(t.amount), 0) AS ventas_aprobadas
            FROM transactions t
            WHERE t.status = 'approved'
        """)
        approved_row = db.execute(approved_sql).fetchone()
        total_ganancias = float(approved_row.ventas_aprobadas or 0) * 0.30

    ticket_promedio = total_ventas / total_transacciones if total_transacciones > 0 else 0.0
    tasa_aprobacion = (
        (transacciones_aprobadas / total_transacciones * 100)
        if total_transacciones > 0
        else 0.0
    )

    return {
        "total_ventas": total_ventas,
        "total_ganancias": total_ganancias,
        "total_transacciones": total_transacciones,
        "transacciones_aprobadas": transacciones_aprobadas,
        "ticket_promedio": round(ticket_promedio, 2),
        "tasa_aprobacion": round(tasa_aprobacion, 2),
    }


def _get_date_range(filter: TimeFilter) -> tuple[datetime, datetime]:
    """Calcula el rango de fechas según el filtro indicado."""
    now = datetime.now(timezone.utc)
    if filter == TimeFilter.day:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif filter == TimeFilter.week:
        start = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
    elif filter == TimeFilter.month:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # year
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return start, now


def get_sales_summary(db: Session, filter: TimeFilter) -> SalesSummarySchema:
    """
    Calcula métricas de ventas y ganancias para el período indicado.
    Ganancia = SUM((unit_price - base_price) * quantity) solo para transacciones aprobadas.
    Si la ganancia resulta <= 0, se aplica fallback del 30% sobre ventas.
    """
    start, end = _get_date_range(filter)

    summary_sql = text("""
        SELECT
            COALESCE(SUM(t.amount), 0)                      AS total_ventas,
            COUNT(t.id)                                      AS total_transacciones,
            COUNT(t.id) FILTER (WHERE t.status = 'approved') AS transacciones_aprobadas
        FROM transactions t
        WHERE t.transaction_date >= :start
          AND t.transaction_date <= :end
    """)

    row = db.execute(summary_sql, {"start": start, "end": end}).fetchone()

    total_ventas = float(row.total_ventas or 0)
    total_transacciones = int(row.total_transacciones or 0)
    transacciones_aprobadas = int(row.transacciones_aprobadas or 0)

    # Calcular ganancias reales solo para transacciones aprobadas
    profit_sql = text("""
        SELECT
            COALESCE(
                SUM((oi.unit_price - p.base_price) * oi.quantity), 0
            ) AS total_ganancias
        FROM transactions t
        JOIN orders o ON o.id = t.order_id
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE t.status = 'approved'
          AND t.transaction_date >= :start
          AND t.transaction_date <= :end
    """)

    profit_row = db.execute(profit_sql, {"start": start, "end": end}).fetchone()
    total_ganancias = float(profit_row.total_ganancias or 0)

    # Fallback: si la ganancia real es <= 0, usar 30% sobre ventas aprobadas
    if total_ganancias <= 0 and total_ventas > 0:
        # calcular ventas aprobadas para el fallback
        approved_sql = text("""
            SELECT COALESCE(SUM(t.amount), 0) AS ventas_aprobadas
            FROM transactions t
            WHERE t.status = 'approved'
              AND t.transaction_date >= :start
              AND t.transaction_date <= :end
        """)
        approved_row = db.execute(approved_sql, {"start": start, "end": end}).fetchone()
        total_ganancias = float(approved_row.ventas_aprobadas or 0) * 0.30

    ticket_promedio = total_ventas / total_transacciones if total_transacciones > 0 else 0.0
    tasa_aprobacion = (
        (transacciones_aprobadas / total_transacciones * 100)
        if total_transacciones > 0
        else 0.0
    )

    return SalesSummarySchema(
        total_ventas=total_ventas,
        total_ganancias=total_ganancias,
        total_transacciones=total_transacciones,
        transacciones_aprobadas=transacciones_aprobadas,
        ticket_promedio=ticket_promedio,
        tasa_aprobacion=round(tasa_aprobacion, 2),
    )


def get_sales_chart(db: Session, filter: TimeFilter) -> SalesChartSchema:
    """
    Agrupa los datos de ventas por período:
      - day   → por hora (DATE_TRUNC hour)
      - week/month → por día (DATE_TRUNC day)
      - year  → por mes (DATE_TRUNC month)
    """
    start, end = _get_date_range(filter)

    if filter == TimeFilter.day:
        trunc_unit = "hour"
    elif filter == TimeFilter.year:
        trunc_unit = "month"
    else:
        trunc_unit = "day"

    chart_sql = text(f"""
        SELECT
            DATE_TRUNC('{trunc_unit}', t.transaction_date) AS period,
            COALESCE(SUM(t.amount), 0)                      AS ventas,
            COUNT(t.id)                                      AS transacciones,
            COALESCE(
                SUM(
                    CASE WHEN t.status = 'approved'
                    THEN (
                        SELECT COALESCE(SUM((oi.unit_price - p.base_price) * oi.quantity), 0)
                        FROM order_items oi
                        JOIN products p ON p.id = oi.product_id
                        WHERE oi.order_id = t.order_id
                    )
                    ELSE 0 END
                ),
                0
            ) AS ganancias
        FROM transactions t
        WHERE t.transaction_date >= :start
          AND t.transaction_date <= :end
        GROUP BY period
        ORDER BY period ASC
    """)

    rows = db.execute(chart_sql, {"start": start, "end": end}).fetchall()

    data_points: list[ChartDataPointSchema] = []
    for row in rows:
        period: datetime = row.period
        ventas = float(row.ventas or 0)
        ganancias = float(row.ganancias or 0)
        transacciones = int(row.transacciones or 0)

        # Fallback ganancia
        if ganancias <= 0 and ventas > 0:
            ganancias = ventas * 0.30

        # Formatear label según el tipo de agrupación
        if trunc_unit == "hour":
            label = period.strftime("%H:%M")
        elif trunc_unit == "day":
            label = period.strftime("%d %b")
        else:
            label = period.strftime("%b %Y")

        data_points.append(
            ChartDataPointSchema(
                label=label,
                ventas=ventas,
                ganancias=ganancias,
                transacciones=transacciones,
            )
        )

    return SalesChartSchema(filter=filter, data=data_points)


def get_transactions_list(
    db: Session,
    filter: TimeFilter,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> TransactionsListSchema:
    """
    Retorna la lista paginada de transacciones con información del cliente,
    número de ítems de la orden y datos de PayU.
    Soporta filtro opcional por status.
    """
    start, end = _get_date_range(filter)

    status_clause = ""
    params: dict = {"start": start, "end": end, "limit": limit, "offset": offset}

    if status and status.strip():
        status_clause = "AND t.status = :status"
        params["status"] = status.strip()

    list_sql = text(f"""
        SELECT
            t.id,
            t.order_id,
            u.first_name,
            u.last_name,
            u.email,
            t.amount,
            t.status,
            t.payment_method,
            t.transaction_date,
            t.approved_at,
            t.payu_reference,
            (
                SELECT COUNT(*)
                FROM order_items oi
                WHERE oi.order_id = t.order_id
            ) AS items_count
        FROM transactions t
        JOIN users u ON u.id = t.user_id
        WHERE t.transaction_date >= :start
          AND t.transaction_date <= :end
          {status_clause}
        ORDER BY t.transaction_date DESC
        LIMIT :limit OFFSET :offset
    """)

    count_sql = text(f"""
        SELECT COUNT(*) AS total
        FROM transactions t
        WHERE t.transaction_date >= :start
          AND t.transaction_date <= :end
          {status_clause}
    """)

    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    total = int(db.execute(count_sql, count_params).scalar() or 0)
    rows = db.execute(list_sql, params).fetchall()

    items: list[TransactionItemSchema] = []
    for row in rows:
        first_name = row.first_name or ""
        last_name = row.last_name or ""
        customer_name = f"{first_name} {last_name}".strip() or "Cliente"

        items.append(
            TransactionItemSchema(
                id=row.id,
                order_id=row.order_id,
                customer_name=customer_name,
                customer_email=row.email or "",
                amount=float(row.amount or 0),
                status=row.status or "unknown",
                payment_method=row.payment_method or "payu",
                transaction_date=row.transaction_date.isoformat() if row.transaction_date else None,
                approved_at=row.approved_at.isoformat() if row.approved_at else None,
                payu_reference=row.payu_reference,
                items_count=int(row.items_count or 0),
            )
        )

    return TransactionsListSchema(total=total, items=items)


# ─── Funcionario: misma lógica pero filtrada por company_id ──────────────────


def get_company_sales_summary(db: Session, filter: TimeFilter, company_id: int) -> SalesSummarySchema:
    """
    Resumen de ventas y ganancias para una empresa específica.
    Solo considera transacciones cuyo pedido contiene productos de esa empresa.
    """
    start, end = _get_date_range(filter)

    summary_sql = text("""
        SELECT
            COALESCE(SUM(t.amount), 0)                       AS total_ventas,
            COUNT(DISTINCT t.id)                             AS total_transacciones,
            COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'approved') AS transacciones_aprobadas
        FROM transactions t
        JOIN orders o      ON o.id = t.order_id
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p    ON p.id = oi.product_id
        WHERE p.company_id = :company_id
          AND t.transaction_date >= :start
          AND t.transaction_date <= :end
    """)
    row = db.execute(summary_sql, {"company_id": company_id, "start": start, "end": end}).fetchone()

    total_ventas = float(row.total_ventas or 0)
    total_transacciones = int(row.total_transacciones or 0)
    transacciones_aprobadas = int(row.transacciones_aprobadas or 0)

    profit_sql = text("""
        SELECT
            COALESCE(SUM((oi.unit_price - p.base_price) * oi.quantity), 0) AS total_ganancias
        FROM transactions t
        JOIN orders o      ON o.id = t.order_id
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p    ON p.id = oi.product_id
        WHERE p.company_id = :company_id
          AND t.status = 'approved'
          AND t.transaction_date >= :start
          AND t.transaction_date <= :end
    """)
    profit_row = db.execute(profit_sql, {"company_id": company_id, "start": start, "end": end}).fetchone()
    total_ganancias = float(profit_row.total_ganancias or 0)

    if total_ganancias <= 0 and total_ventas > 0:
        approved_sql = text("""
            SELECT COALESCE(SUM(t.amount), 0) AS ventas_aprobadas
            FROM transactions t
            JOIN orders o      ON o.id = t.order_id
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p    ON p.id = oi.product_id
            WHERE p.company_id = :company_id
              AND t.status = 'approved'
              AND t.transaction_date >= :start
              AND t.transaction_date <= :end
        """)
        approved_row = db.execute(
            approved_sql, {"company_id": company_id, "start": start, "end": end}
        ).fetchone()
        total_ganancias = float(approved_row.ventas_aprobadas or 0) * 0.30

    ticket_promedio = total_ventas / total_transacciones if total_transacciones > 0 else 0.0
    tasa_aprobacion = (
        (transacciones_aprobadas / total_transacciones * 100) if total_transacciones > 0 else 0.0
    )

    return SalesSummarySchema(
        total_ventas=total_ventas,
        total_ganancias=total_ganancias,
        total_transacciones=total_transacciones,
        transacciones_aprobadas=transacciones_aprobadas,
        ticket_promedio=ticket_promedio,
        tasa_aprobacion=round(tasa_aprobacion, 2),
    )


def get_company_sales_chart(db: Session, filter: TimeFilter, company_id: int) -> SalesChartSchema:
    """
    Gráfica de ventas y ganancias para una empresa específica, agrupadas por período.
    """
    start, end = _get_date_range(filter)

    if filter == TimeFilter.day:
        trunc_unit = "hour"
    elif filter == TimeFilter.year:
        trunc_unit = "month"
    else:
        trunc_unit = "day"

    chart_sql = text(f"""
        SELECT
            DATE_TRUNC('{trunc_unit}', t.transaction_date) AS period,
            COALESCE(SUM(t.amount), 0)                      AS ventas,
            COUNT(DISTINCT t.id)                            AS transacciones,
            COALESCE(
                SUM(
                    CASE WHEN t.status = 'approved'
                    THEN (oi.unit_price - p.base_price) * oi.quantity
                    ELSE 0 END
                ), 0
            ) AS ganancias
        FROM transactions t
        JOIN orders o      ON o.id = t.order_id
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p    ON p.id = oi.product_id
        WHERE p.company_id = :company_id
          AND t.transaction_date >= :start
          AND t.transaction_date <= :end
        GROUP BY period
        ORDER BY period ASC
    """)

    rows = db.execute(chart_sql, {"company_id": company_id, "start": start, "end": end}).fetchall()

    data_points: list[ChartDataPointSchema] = []
    for row in rows:
        period: datetime = row.period
        ventas = float(row.ventas or 0)
        ganancias = float(row.ganancias or 0)
        transacciones = int(row.transacciones or 0)

        if ganancias <= 0 and ventas > 0:
            ganancias = ventas * 0.30

        if trunc_unit == "hour":
            label = period.strftime("%H:%M")
        elif trunc_unit == "day":
            label = period.strftime("%d %b")
        else:
            label = period.strftime("%b %Y")

        data_points.append(
            ChartDataPointSchema(label=label, ventas=ventas, ganancias=ganancias, transacciones=transacciones)
        )

    return SalesChartSchema(filter=filter, data=data_points)


def get_company_transactions_list(
    db: Session,
    filter: TimeFilter,
    company_id: int,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> TransactionsListSchema:
    """
    Lista paginada de transacciones para una empresa específica,
    con soporte para filtro por status.
    """
    start, end = _get_date_range(filter)

    status_clause = ""
    params: dict = {
        "company_id": company_id,
        "start": start,
        "end": end,
        "limit": limit,
        "offset": offset,
    }

    if status and status.strip():
        status_clause = "AND t.status = :status"
        params["status"] = status.strip()

    list_sql = text(f"""
        SELECT
            t.id,
            t.order_id,
            u.first_name,
            u.last_name,
            u.email,
            t.amount,
            t.status,
            t.payment_method,
            t.transaction_date,
            t.approved_at,
            t.payu_reference,
            COUNT(oi2.id) AS items_count
        FROM transactions t
        JOIN orders o      ON o.id  = t.order_id
        JOIN users u       ON u.id  = t.user_id
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p    ON p.id  = oi.product_id
        LEFT JOIN order_items oi2 ON oi2.order_id = o.id
        WHERE p.company_id = :company_id
          AND t.transaction_date >= :start
          AND t.transaction_date <= :end
          {status_clause}
        GROUP BY t.id, u.first_name, u.last_name, u.email
        ORDER BY t.transaction_date DESC
        LIMIT :limit OFFSET :offset
    """)

    count_sql = text(f"""
        SELECT COUNT(DISTINCT t.id) AS total
        FROM transactions t
        JOIN orders o      ON o.id = t.order_id
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p    ON p.id = oi.product_id
        WHERE p.company_id = :company_id
          AND t.transaction_date >= :start
          AND t.transaction_date <= :end
          {status_clause}
    """)

    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    total = int(db.execute(count_sql, count_params).scalar() or 0)
    rows = db.execute(list_sql, params).fetchall()

    items: list[TransactionItemSchema] = []
    for row in rows:
        first_name = row.first_name or ""
        last_name = row.last_name or ""
        customer_name = f"{first_name} {last_name}".strip() or "Cliente"

        items.append(
            TransactionItemSchema(
                id=row.id,
                order_id=row.order_id,
                customer_name=customer_name,
                customer_email=row.email or "",
                amount=float(row.amount or 0),
                status=row.status or "unknown",
                payment_method=row.payment_method or "payu",
                transaction_date=row.transaction_date.isoformat() if row.transaction_date else None,
                approved_at=row.approved_at.isoformat() if row.approved_at else None,
                payu_reference=row.payu_reference,
                items_count=int(row.items_count or 0),
            )
        )

    return TransactionsListSchema(total=total, items=items)
