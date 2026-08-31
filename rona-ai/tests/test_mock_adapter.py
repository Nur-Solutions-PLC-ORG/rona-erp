
from __future__ import annotations

from datetime import date

import pytest

from app.adapters.mock_adapter import MockRonaAdapter
from app.core.enums import DataDomain, MachineStatus, StockStatus, UserRole
from app.schemas import PeriodSpec

_PERIOD = PeriodSpec.for_day(date(2026, 8, 11))


async def test_hr_counters_reconcile():
    hr = await MockRonaAdapter().fetch_hr("demo_factory", _PERIOD)

    assert (
        hr.present_count + hr.late_count + hr.absent_count
        + hr.on_leave_count + hr.not_recorded_count
        == hr.total_headcount
    )
    assert hr.total_headcount == len(hr.records)

    expected_rate = round((hr.present_count + hr.late_count) / hr.total_headcount * 100, 1)
    assert hr.attendance_rate_pct == expected_rate


async def test_hr_trend_uses_actual_previous_day_snapshot():
    adapter = MockRonaAdapter()
    current = await adapter.fetch_hr("demo_factory", _PERIOD)
    previous_day = date.fromordinal(_PERIOD.start.toordinal() - 1)
    yesterday = await adapter.fetch_hr(
        "demo_factory", PeriodSpec.for_day(previous_day)
    )

    assert len(current.trends) == 1
    trend = current.trends[0]
    assert trend.current_value == current.attendance_rate_pct
    assert trend.previous_value == yesterday.attendance_rate_pct
    assert trend.change_pct == round(
        current.attendance_rate_pct - yesterday.attendance_rate_pct, 1
    )


async def test_production_totals_reconcile():
    prod = await MockRonaAdapter().fetch_production("demo_factory", _PERIOD)
    assert prod.total_produced_units == sum(l.produced_units for l in prod.lines)
    assert prod.total_target_units == sum(l.target_units for l in prod.lines)
    expected_eff = round(prod.total_produced_units / prod.total_target_units * 100, 1)
    assert prod.overall_efficiency_pct == expected_eff


async def test_maintenance_counts_reconcile():
    maint = await MockRonaAdapter().fetch_maintenance("demo_factory", _PERIOD)
    assert (
        maint.operational_count + maint.under_maintenance_count
        + maint.breakdown_count + maint.idle_count
        == maint.total_machines
    )
    assert maint.total_failures == sum(m.failure_count_period for m in maint.machines)


    for m in maint.machines:
        if m.status == MachineStatus.BREAKDOWN:
            assert m.failure_count_period >= 1


async def test_inventory_value_and_counts_reconcile():
    inv = await MockRonaAdapter().fetch_inventory("demo_factory", _PERIOD)
    assert inv.total_inventory_value == pytest.approx(sum(i.total_value for i in inv.items), abs=0.01)
    assert inv.low_stock_count == sum(1 for i in inv.items if i.stock_status == StockStatus.LOW)
    assert inv.out_of_stock_count == sum(1 for i in inv.items if i.stock_status == StockStatus.OUT_OF_STOCK)


async def test_finance_breakdown_reconciles_to_expenses():
    fin = await MockRonaAdapter().fetch_finance("demo_factory", _PERIOD)
    assert fin.gross_profit == pytest.approx(fin.revenue - fin.expenses, abs=0.01)

    assert sum(l.amount for l in fin.expense_breakdown) == pytest.approx(fin.expenses, abs=0.01)


async def _finance_signature(adapter: MockRonaAdapter, tenant: str):
    f = await adapter.fetch_finance(tenant, _PERIOD)
    return (f.revenue, f.expenses, f.net_profit, f.profit_margin_pct)


async def test_same_tenant_and_period_is_reproducible():


    a, b = MockRonaAdapter(), MockRonaAdapter()
    assert await _finance_signature(a, "demo_factory") == await _finance_signature(b, "demo_factory")


async def test_different_tenants_get_different_data():
    a = MockRonaAdapter()
    assert await _finance_signature(a, "demo_factory") != await _finance_signature(a, "acme_mfg")


async def test_unknown_tenant_name_is_none():
    assert await MockRonaAdapter().fetch_tenant_name("nope") is None
    assert await MockRonaAdapter().fetch_tenant_name("demo_factory") == "Rona Demo Factory"


class _RecordingAdapter(MockRonaAdapter):

    def __init__(self):
        super().__init__()
        self.fetched: set[str] = set()

    async def fetch_finance(self, tenant_id, period):
        self.fetched.add("finance")
        return await super().fetch_finance(tenant_id, period)

    async def fetch_hr(self, tenant_id, period):
        self.fetched.add("hr")
        return await super().fetch_hr(tenant_id, period)

    async def fetch_production(self, tenant_id, period):
        self.fetched.add("production")
        return await super().fetch_production(tenant_id, period)


async def test_denied_domains_are_never_fetched():
    adapter = _RecordingAdapter()
    granted = [DataDomain.PRODUCTION, DataDomain.MAINTENANCE, DataDomain.REPORTS]
    denied = [d for d in DataDomain if d not in granted]

    bundle = await adapter.build_context_bundle(
        tenant_id="demo_factory",
        user_role=UserRole.PRODUCTION_MANAGER,
        granted_domains=granted,
        denied_domains=denied,
        period=_PERIOD,
        include_alerts=True,
        include_pending_tasks=True,
        tenant_name="Rona Demo Factory",
    )


    assert bundle.production is not None
    assert bundle.finance is None
    assert bundle.hr is None
    assert bundle.loaded_domains() == [DataDomain.PRODUCTION, DataDomain.MAINTENANCE]


    assert "production" in adapter.fetched
    assert "finance" not in adapter.fetched
    assert "hr" not in adapter.fetched


    assert all(a.domain in {DataDomain.PRODUCTION, DataDomain.MAINTENANCE} for a in bundle.alerts)


async def test_empty_grant_yields_empty_bundle_without_fetching():
    adapter = _RecordingAdapter()
    bundle = await adapter.build_context_bundle(
        tenant_id="demo_factory",
        user_role=UserRole.SAAS_ADMIN,
        granted_domains=[],
        denied_domains=list(DataDomain),
        period=_PERIOD,
        include_alerts=True,
        include_pending_tasks=True,
        tenant_name="Rona Demo Factory",
    )
    assert bundle.is_empty()
    assert adapter.fetched == set()
