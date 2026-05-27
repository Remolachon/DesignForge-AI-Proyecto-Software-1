"""
Tests for sales_service.py — covers all public functions with mocked DB.
"""
import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone

from app.services.sales_service import (
    get_all_time_summary,
    _get_date_range,
    get_sales_summary,
    get_sales_chart,
    get_transactions_list,
    get_company_sales_summary,
    get_company_sales_chart,
    get_company_transactions_list,
)
from app.schemas.sales_schema import TimeFilter


@pytest.fixture
def mock_db():
    return MagicMock()


def _make_row(**kwargs):
    """Creates a MagicMock row with named attributes."""
    row = MagicMock()
    for k, v in kwargs.items():
        setattr(row, k, v)
    return row


# ── _get_date_range ──────────────────────────────────────────────────────────

def test_get_date_range_day():
    start, end = _get_date_range(TimeFilter.day)
    assert start <= end
    assert start.hour == 0


def test_get_date_range_week():
    start, end = _get_date_range(TimeFilter.week)
    assert start <= end


def test_get_date_range_month():
    start, end = _get_date_range(TimeFilter.month)
    assert start.day == 1


def test_get_date_range_year():
    start, end = _get_date_range(TimeFilter.year)
    assert start.month == 1
    assert start.day == 1


# ── get_all_time_summary ─────────────────────────────────────────────────────

def test_get_all_time_summary_with_data(mock_db):
    summary_row = _make_row(
    total_ventas=10000.0,
    total_transacciones=20,
     transacciones_aprobadas=15)
    profit_row = _make_row(total_ganancias=2000.0)

    mock_db.execute.return_value.fetchone.side_effect = [
        summary_row, profit_row]

    result = get_all_time_summary(mock_db)

    assert result["total_ventas"] == 10000.0
    assert result["total_ganancias"] == 2000.0
    assert result["total_transacciones"] == 20
    assert result["transacciones_aprobadas"] == 15
    assert result["ticket_promedio"] == 500.0
    assert result["tasa_aprobacion"] == 75.0


def test_get_all_time_summary_zero_transactions(mock_db):
    summary_row = _make_row(
    total_ventas=0,
    total_transacciones=0,
     transacciones_aprobadas=0)
    profit_row = _make_row(total_ganancias=0)

    mock_db.execute.return_value.fetchone.side_effect = [
        summary_row, profit_row]

    result = get_all_time_summary(mock_db)

    assert result["total_ventas"] == 0.0
    assert result["ticket_promedio"] == 0.0
    assert result["tasa_aprobacion"] == 0.0


def test_get_all_time_summary_fallback_ganancias(mock_db):
    """When profit <= 0 but sales > 0, use 30% fallback."""
    summary_row = _make_row(
    total_ventas=5000.0,
    total_transacciones=10,
     transacciones_aprobadas=8)
    profit_row = _make_row(total_ganancias=0.0)
    approved_row = _make_row(ventas_aprobadas=4000.0)

    mock_db.execute.return_value.fetchone.side_effect = [
        summary_row, profit_row, approved_row]

    result = get_all_time_summary(mock_db)
    assert result["total_ganancias"] == pytest.approx(1200.0)  # 4000 * 0.30


# ── get_sales_summary ────────────────────────────────────────────────────────

def test_get_sales_summary_with_data(mock_db):
    summary_row = _make_row(
    total_ventas=8000.0,
    total_transacciones=10,
     transacciones_aprobadas=8)
    profit_row = _make_row(total_ganancias=1600.0)

    mock_db.execute.return_value.fetchone.side_effect = [
        summary_row, profit_row]

    result = get_sales_summary(mock_db, TimeFilter.month)

    assert result.total_ventas == 8000.0
    assert result.total_ganancias == 1600.0
    assert result.ticket_promedio == 800.0
    assert result.tasa_aprobacion == 80.0


def test_get_sales_summary_zero_transactions(mock_db):
    summary_row = _make_row(
    total_ventas=0,
    total_transacciones=0,
     transacciones_aprobadas=0)
    profit_row = _make_row(total_ganancias=0)

    mock_db.execute.return_value.fetchone.side_effect = [
        summary_row, profit_row]

    result = get_sales_summary(mock_db, TimeFilter.week)

    assert result.total_ventas == 0.0
    assert result.ticket_promedio == 0.0
    assert result.tasa_aprobacion == 0.0


def test_get_sales_summary_fallback_ganancias(mock_db):
    summary_row = _make_row(
    total_ventas=3000.0,
    total_transacciones=5,
     transacciones_aprobadas=4)
    profit_row = _make_row(total_ganancias=0.0)
    approved_row = _make_row(ventas_aprobadas=2400.0)

    mock_db.execute.return_value.fetchone.side_effect = [
        summary_row, profit_row, approved_row]

    result = get_sales_summary(mock_db, TimeFilter.year)
    assert result.total_ganancias == pytest.approx(720.0)  # 2400 * 0.30


def test_get_sales_summary_day_filter(mock_db):
    summary_row = _make_row(
    total_ventas=500.0,
    total_transacciones=2,
     transacciones_aprobadas=2)
    profit_row = _make_row(total_ganancias=100.0)
    mock_db.execute.return_value.fetchone.side_effect = [
        summary_row, profit_row]

    result = get_sales_summary(mock_db, TimeFilter.day)
    assert result.total_ventas == 500.0


# ── get_sales_chart ──────────────────────────────────────────────────────────

def _make_period_row(period_dt, ventas, ganancias, transacciones):
    row = MagicMock()
    row.period = period_dt
    row.ventas = ventas
    row.ganancias = ganancias
    row.transacciones = transacciones
    return row


def test_get_sales_chart_month(mock_db):
    period = datetime(2024, 6, 15, tzinfo=timezone.utc)
    rows = [_make_period_row(period, 1000.0, 200.0, 5)]
    mock_db.execute.return_value.fetchall.return_value = rows

    result = get_sales_chart(mock_db, TimeFilter.month)

    assert result.filter == TimeFilter.month
    assert len(result.data) == 1
    assert result.data[0].ventas == 1000.0


def test_get_sales_chart_day(mock_db):
    period = datetime(2024, 6, 15, 14, 0, tzinfo=timezone.utc)
    rows = [_make_period_row(period, 500.0, 0.0, 3)]
    mock_db.execute.return_value.fetchall.return_value = rows

    result = get_sales_chart(mock_db, TimeFilter.day)
    # day filter → hour labels, fallback ganancia because 0
    assert result.data[0].ganancias == pytest.approx(150.0)  # 500 * 0.30


def test_get_sales_chart_year(mock_db):
    period = datetime(2024, 1, 1, tzinfo=timezone.utc)
    rows = [_make_period_row(period, 12000.0, 3600.0, 50)]
    mock_db.execute.return_value.fetchall.return_value = rows

    result = get_sales_chart(mock_db, TimeFilter.year)
    assert result.data[0].label == "Jan 2024"


def test_get_sales_chart_week(mock_db):
    period = datetime(2024, 6, 10, tzinfo=timezone.utc)
    rows = [_make_period_row(period, 2000.0, 600.0, 10)]
    mock_db.execute.return_value.fetchall.return_value = rows

    result = get_sales_chart(mock_db, TimeFilter.week)
    assert "Jun" in result.data[0].label


def test_get_sales_chart_empty(mock_db):
    mock_db.execute.return_value.fetchall.return_value = []
    result = get_sales_chart(mock_db, TimeFilter.month)
    assert result.data == []


# ── get_transactions_list ────────────────────────────────────────────────────

def _make_txn_row(**kwargs):
    row = MagicMock()
    defaults = {
        "id": 1, "order_id": 10, "first_name": "Juan", "last_name": "Perez",
        "email": "juan@test.com", "amount": 1000.0, "status": "approved",
        "payment_method": "credit_card", "transaction_date": datetime(2024, 6, 1),
        "approved_at": datetime(2024, 6, 1), "payu_reference": "REF001", "items_count": 2,
    }
    defaults.update(kwargs)
    for k, v in defaults.items():
        setattr(row, k, v)
    return row


def test_get_transactions_list_no_status_filter(mock_db):
    mock_db.execute.return_value.scalar.return_value = 1
    mock_db.execute.return_value.fetchall.return_value = [_make_txn_row()]

    result = get_transactions_list(mock_db, TimeFilter.month)

    assert result.total == 1
    assert len(result.items) == 1
    assert result.items[0].customer_name == "Juan Perez"


def test_get_transactions_list_with_status_filter(mock_db):
    mock_db.execute.return_value.scalar.return_value = 0
    mock_db.execute.return_value.fetchall.return_value = []

    result = get_transactions_list(mock_db, TimeFilter.month, status="pending")

    assert result.total == 0
    assert result.items == []


def test_get_transactions_list_null_fields(mock_db):
    row = _make_txn_row(
        first_name=None, last_name=None, email=None,
        transaction_date=None, approved_at=None, payu_reference=None
    )
    mock_db.execute.return_value.scalar.return_value = 1
    mock_db.execute.return_value.fetchall.return_value = [row]

    result = get_transactions_list(mock_db, TimeFilter.week)
    assert result.items[0].customer_name == "Cliente"
    assert result.items[0].transaction_date is None
    assert result.items[0].approved_at is None


# ── get_company_sales_summary ────────────────────────────────────────────────

def test_get_company_sales_summary(mock_db):
    row = _make_row(
    total_ventas=5000.0,
    total_transacciones=10,
     transacciones_aprobadas=7)
    mock_db.execute.return_value.fetchone.return_value = row

    result = get_company_sales_summary(mock_db, TimeFilter.month, company_id=1)

    assert result.total_ventas == 5000.0
    assert result.total_transacciones == 10
    assert result.total_ganancias == 0.0
    assert result.ticket_promedio == 500.0
    assert result.tasa_aprobacion == 70.0


def test_get_company_sales_summary_zero(mock_db):
    row = _make_row(
    total_ventas=0,
    total_transacciones=0,
     transacciones_aprobadas=0)
    mock_db.execute.return_value.fetchone.return_value = row

    result = get_company_sales_summary(mock_db, TimeFilter.day, company_id=1)
    assert result.ticket_promedio == 0.0
    assert result.tasa_aprobacion == 0.0


# ── get_company_sales_chart ──────────────────────────────────────────────────

def _make_company_row(period_dt, ventas, transacciones):
    row = MagicMock()
    row.period = period_dt
    row.ventas = ventas
    row.transacciones = transacciones
    return row


def test_get_company_sales_chart_day(mock_db):
    period = datetime(2024, 6, 15, 10, 0, tzinfo=timezone.utc)
    rows = [_make_company_row(period, 500.0, 3)]
    mock_db.execute.return_value.fetchall.return_value = rows

    result = get_company_sales_chart(mock_db, TimeFilter.day, company_id=1)
    assert result.data[0].label == "10:00"


def test_get_company_sales_chart_year(mock_db):
    period = datetime(2024, 3, 1, tzinfo=timezone.utc)
    rows = [_make_company_row(period, 8000.0, 20)]
    mock_db.execute.return_value.fetchall.return_value = rows

    result = get_company_sales_chart(mock_db, TimeFilter.year, company_id=1)
    assert "Mar" in result.data[0].label


def test_get_company_sales_chart_week(mock_db):
    period = datetime(2024, 6, 10, tzinfo=timezone.utc)
    rows = [_make_company_row(period, 2000.0, 5)]
    mock_db.execute.return_value.fetchall.return_value = rows

    result = get_company_sales_chart(mock_db, TimeFilter.week, company_id=1)
    assert result.filter == TimeFilter.week


def test_get_company_sales_chart_empty(mock_db):
    mock_db.execute.return_value.fetchall.return_value = []
    result = get_company_sales_chart(mock_db, TimeFilter.month, company_id=1)
    assert result.data == []


# ── get_company_transactions_list ────────────────────────────────────────────

def test_get_company_transactions_list_no_status(mock_db):
    mock_db.execute.return_value.scalar.return_value = 2
    mock_db.execute.return_value.fetchall.return_value = [
        _make_txn_row(id=1), _make_txn_row(id=2)
    ]

    result = get_company_transactions_list(
    mock_db, TimeFilter.month, company_id=1)

    assert result.total == 2
    assert len(result.items) == 2


def test_get_company_transactions_list_with_status(mock_db):
    mock_db.execute.return_value.scalar.return_value = 1
    mock_db.execute.return_value.fetchall.return_value = [
        _make_txn_row(status="approved")]

    result = get_company_transactions_list(
    mock_db, TimeFilter.week, company_id=1, status="approved")

    assert result.total == 1
    assert result.items[0].status == "approved"


def test_get_company_transactions_list_null_fields(mock_db):
    row = _make_txn_row(
        first_name=None, last_name=None, email=None,
        transaction_date=None, approved_at=None, payu_reference=None
    )
    mock_db.execute.return_value.scalar.return_value = 1
    mock_db.execute.return_value.fetchall.return_value = [row]

    result = get_company_transactions_list(
    mock_db, TimeFilter.year, company_id=1)
    assert result.items[0].customer_name == "Cliente"
    assert result.items[0].transaction_date is None
