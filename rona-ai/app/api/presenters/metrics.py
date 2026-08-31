from __future__ import annotations

from collections.abc import Callable

from app.api.schemas import MetricGroup, MetricItem
from app.core.enums import DataDomain, domain_label
from app.schemas import RonaContextBundle

MetricBuilder = Callable[[RonaContextBundle], "MetricGroup | None"]


def _group(domain: DataDomain, metrics: list[MetricItem]) -> MetricGroup:
    return MetricGroup(domain=domain, label=domain_label(domain), metrics=metrics)
def hr_metrics(bundle: RonaContextBundle) -> MetricGroup | None:
    hr = bundle.hr
    if hr is None:
        return None
    return _group(
        DataDomain.HR,
        [
            MetricItem(
                key="present_count",
                label="Present",
                value=str(hr.present_count),
                numeric_value=hr.present_count,
            ),
            MetricItem(
                key="absent_count",
                label="Absent",
                value=str(hr.absent_count),
                numeric_value=hr.absent_count,
            ),
            MetricItem(
                key="attendance_rate_pct",
                label="Attendance rate",
                value=f"{hr.attendance_rate_pct}%",
                numeric_value=hr.attendance_rate_pct,
                unit="%",
            ),
            MetricItem(
                key="total_overtime_hours",
                label="Overtime",
                value=f"{hr.total_overtime_hours} h",
                numeric_value=hr.total_overtime_hours,
                unit="h",
            ),
        ],
    )


def production_metrics(bundle: RonaContextBundle) -> MetricGroup | None:
    prod = bundle.production
    if prod is None:
        return None
    return _group(
        DataDomain.PRODUCTION,
        [
            MetricItem(
                key="overall_efficiency_pct",
                label="Efficiency",
                value=f"{prod.overall_efficiency_pct}%",
                numeric_value=prod.overall_efficiency_pct,
                unit="%",
            ),
            MetricItem(
                key="target_achievement_pct",
                label="Target achievement",
                value=f"{prod.target_achievement_pct}%",
                numeric_value=prod.target_achievement_pct,
                unit="%",
            ),
            MetricItem(
                key="overall_status",
                label="Status",
                value=prod.overall_status.value,
            ),
        ],
    )


def inventory_metrics(bundle: RonaContextBundle) -> MetricGroup | None:
    inv = bundle.inventory
    if inv is None:
        return None
    return _group(
        DataDomain.INVENTORY,
        [
            MetricItem(
                key="total_inventory_value",
                label="Total value",
                value=f"{inv.currency} {inv.total_inventory_value:,.2f}",
                numeric_value=inv.total_inventory_value,
                unit=inv.currency,
            ),
            MetricItem(
                key="low_stock_count",
                label="Low stock",
                value=str(inv.low_stock_count),
                numeric_value=inv.low_stock_count,
            ),
            MetricItem(
                key="out_of_stock_count",
                label="Out of stock",
                value=str(inv.out_of_stock_count),
                numeric_value=inv.out_of_stock_count,
            ),
        ],
    )


def maintenance_metrics(bundle: RonaContextBundle) -> MetricGroup | None:
    maint = bundle.maintenance
    if maint is None:
        return None
    return _group(
        DataDomain.MAINTENANCE,
        [
            MetricItem(
                key="operational_count",
                label="Operational",
                value=str(maint.operational_count),
                numeric_value=maint.operational_count,
            ),
            MetricItem(
                key="breakdown_count",
                label="Breakdown",
                value=str(maint.breakdown_count),
                numeric_value=maint.breakdown_count,
            ),
            MetricItem(
                key="fleet_availability_pct",
                label="Fleet availability",
                value=f"{maint.fleet_availability_pct}%",
                numeric_value=maint.fleet_availability_pct,
                unit="%",
            ),
        ],
    )


def finance_metrics(bundle: RonaContextBundle) -> MetricGroup | None:
    fin = bundle.finance
    if fin is None:
        return None
    return _group(
        DataDomain.FINANCE,
        [
            MetricItem(
                key="revenue",
                label="Revenue",
                value=f"{fin.currency} {fin.revenue:,.2f}",
                numeric_value=fin.revenue,
                unit=fin.currency,
            ),
            MetricItem(
                key="net_profit",
                label="Net profit",
                value=f"{fin.currency} {fin.net_profit:,.2f}",
                numeric_value=fin.net_profit,
                unit=fin.currency,
            ),
            MetricItem(
                key="profit_margin_pct",
                label="Profit margin",
                value=f"{fin.profit_margin_pct}%",
                numeric_value=fin.profit_margin_pct,
                unit="%",
            ),
        ],
    )


def procurement_metrics(bundle: RonaContextBundle) -> MetricGroup | None:
    proc = bundle.procurement
    if proc is None:
        return None
    return _group(
        DataDomain.PROCUREMENT,
        [
            MetricItem(
                key="open_po_count",
                label="Open POs",
                value=str(proc.open_po_count),
                numeric_value=proc.open_po_count,
            ),
            MetricItem(
                key="total_open_value",
                label="Open value",
                value=f"{proc.currency} {proc.total_open_value:,.2f}",
                numeric_value=proc.total_open_value,
                unit=proc.currency,
            ),
            MetricItem(
                key="overdue_delivery_count",
                label="Overdue deliveries",
                value=str(proc.overdue_delivery_count),
                numeric_value=proc.overdue_delivery_count,
            ),
        ],
    )


def sales_metrics(bundle: RonaContextBundle) -> MetricGroup | None:
    sales = bundle.sales
    if sales is None:
        return None
    return _group(
        DataDomain.SALES,
        [
            MetricItem(
                key="total_revenue",
                label="Revenue",
                value=f"{sales.currency} {sales.total_revenue:,.2f}",
                numeric_value=sales.total_revenue,
                unit=sales.currency,
            ),
            MetricItem(
                key="total_order_count",
                label="Orders",
                value=str(sales.total_order_count),
                numeric_value=sales.total_order_count,
            ),
            MetricItem(
                key="overdue_count",
                label="Overdue orders",
                value=str(sales.overdue_count),
                numeric_value=sales.overdue_count,
            ),
        ],
    )


METRIC_BUILDERS: tuple[MetricBuilder, ...] = (
    hr_metrics,
    production_metrics,
    inventory_metrics,
    maintenance_metrics,
    finance_metrics,
    procurement_metrics,
    sales_metrics,
)


def build_metric_groups(bundle: RonaContextBundle) -> list[MetricGroup]:
    """Build every metric group available in the bundle, in display order."""
    return [group for build in METRIC_BUILDERS if (group := build(bundle)) is not None]


__all__ = [
    "METRIC_BUILDERS",
    "build_metric_groups",
    "finance_metrics",
    "hr_metrics",
    "inventory_metrics",
    "maintenance_metrics",
    "procurement_metrics",
    "production_metrics",
    "sales_metrics",
]
