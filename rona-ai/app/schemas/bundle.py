"""The single object every adapter returns and every prompt consumes.

:class:`RonaContextBundle` is the tenant-scoped envelope around the per-domain
snapshots. The tenant guard and the record cap live next to it because both
exist to keep a bundle honest about whose data it holds and how much of it
survived the adapter.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.core.enums import DataDomain, Language, UserRole
from app.schemas.base import CanonicalContext, CanonicalModel
from app.schemas.domains import (
    FinanceContext,
    HRContext,
    InventoryContext,
    MaintenanceContext,
    ProcurementContext,
    ProductionContext,
    SalesContext,
)
from app.schemas.period import PeriodSpec
from app.schemas.shared import PendingTask, SmartAlert


class RonaContextBundle(CanonicalModel):

    tenant_id: str
    tenant_name: str | None = None
    user_role: UserRole
    language: Language = Language.EN
    granted_domains: list[DataDomain] = Field(default_factory=list)
    denied_domains: list[DataDomain] = Field(default_factory=list)

    period: PeriodSpec
    generated_at: datetime

    failed_domains: list[DataDomain] = Field(default_factory=list)

    hr: HRContext | None = None
    production: ProductionContext | None = None
    inventory: InventoryContext | None = None
    maintenance: MaintenanceContext | None = None
    finance: FinanceContext | None = None
    procurement: ProcurementContext | None = None
    sales: SalesContext | None = None

    alerts: list[SmartAlert] = Field(default_factory=list)
    pending_tasks: list[PendingTask] = Field(default_factory=list)

    def loaded_domains(self) -> list[DataDomain]:
        granted = set(self.granted_domains)
        loaded: list[DataDomain] = []

        if self.hr is not None:
            hr_domains = [d for d in (DataDomain.HR, DataDomain.ATTENDANCE) if d in granted]
            loaded.extend(hr_domains or [DataDomain.HR])

        for domain, payload in (
            (DataDomain.PRODUCTION, self.production),
            (DataDomain.INVENTORY, self.inventory),
            (DataDomain.MAINTENANCE, self.maintenance),
            (DataDomain.FINANCE, self.finance),
            (DataDomain.PROCUREMENT, self.procurement),
            (DataDomain.SALES, self.sales),
        ):
            if payload is not None:
                loaded.append(domain)

        return loaded

    def is_empty(self) -> bool:
        return not self.loaded_domains() and not self.alerts

    def truncated_domains(self) -> list[DataDomain]:
        return [
            domain
            for domain, payload in (
                (DataDomain.HR, self.hr),
                (DataDomain.PRODUCTION, self.production),
                (DataDomain.INVENTORY, self.inventory),
                (DataDomain.MAINTENANCE, self.maintenance),
                (DataDomain.FINANCE, self.finance),
                (DataDomain.PROCUREMENT, self.procurement),
                (DataDomain.SALES, self.sales),
            )
            if payload is not None and payload.record_count_truncated
        ]


def assert_tenant_match(bundle_tenant_id: str, request_tenant_id: str) -> None:
    if bundle_tenant_id != request_tenant_id:
        raise ValueError(
            "Tenant isolation violation: adapter returned data for tenant "
            f"{bundle_tenant_id!r} while serving a request for {request_tenant_id!r}."
        )


_DETAIL_ROW_FIELDS: dict[str, tuple[str, ...]] = {
    "HRContext": ("records",),
    "ProductionContext": ("lines",),
    "InventoryContext": ("items",),
    "MaintenanceContext": ("machines", "upcoming_maintenance"),
    "FinanceContext": ("invoices",),
    "ProcurementContext": ("purchase_orders",),
    "SalesContext": ("orders",),
}


def apply_record_cap(context: CanonicalContext, max_records: int) -> CanonicalContext:
    if max_records <= 0:
        raise ValueError("max_records must be positive")

    truncated = False
    for field_name in _DETAIL_ROW_FIELDS.get(type(context).__name__, ()):
        rows = getattr(context, field_name, None)
        if isinstance(rows, list) and len(rows) > max_records:
            setattr(context, field_name, rows[:max_records])
            truncated = True

    if truncated:
        context.record_count_truncated = True
    return context


__all__ = ["RonaContextBundle", "assert_tenant_match", "apply_record_cap"]
