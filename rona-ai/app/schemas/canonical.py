"""Backwards-compatible façade over the split canonical schema modules.

The canonical layer now lives in focused modules:

* :mod:`app.schemas.base` shared aliases, ``CanonicalModel``, ``CanonicalContext``
* :mod:`app.schemas.period` ``PeriodSpec``
* :mod:`app.schemas.shared` trends, tasks, alerts
* :mod:`app.schemas.domains` one module per ERP domain
* :mod:`app.schemas.bundle` ``RonaContextBundle`` plus tenant guard and record cap
* :mod:`app.schemas.ai_response` the structured LLM answer

New code should import from :mod:`app.schemas` (or the specific module above).
This module stays so that existing ``from app.schemas.canonical import ...``
imports keep working.
"""

from app.schemas.ai_response import KBCitation, RonaAIResponse, SupportingMetric
from app.schemas.base import (
    CanonicalContext,
    CanonicalModel,
    NonNegFloat,
    NonNegInt,
    Percent,
)
from app.schemas.bundle import RonaContextBundle, apply_record_cap, assert_tenant_match
from app.schemas.domains import (
    AttendanceRollup,
    EmployeeAttendanceRecord,
    ExpenseLine,
    FinanceContext,
    HRContext,
    InventoryContext,
    InventoryItemRecord,
    InvoiceRecord,
    MachineRecord,
    MaintenanceContext,
    PayrollSummary,
    ProcurementContext,
    ProductionContext,
    ProductionLineRecord,
    ProductSalesRollup,
    PurchaseOrderRecord,
    SalesContext,
    SalesOrderRecord,
    ShiftProductionRollup,
    UpcomingMaintenanceRecord,
)
from app.schemas.period import PeriodSpec
from app.schemas.shared import PendingTask, SmartAlert, TrendComparison

__all__ = [
    "Percent",
    "NonNegFloat",
    "NonNegInt",
    "CanonicalModel",
    "CanonicalContext",
    "PeriodSpec",
    "TrendComparison",
    "PendingTask",
    "SmartAlert",
    "EmployeeAttendanceRecord",
    "AttendanceRollup",
    "HRContext",
    "ProductionLineRecord",
    "ShiftProductionRollup",
    "ProductionContext",
    "InventoryItemRecord",
    "InventoryContext",
    "MachineRecord",
    "UpcomingMaintenanceRecord",
    "MaintenanceContext",
    "InvoiceRecord",
    "ExpenseLine",
    "PayrollSummary",
    "FinanceContext",
    "PurchaseOrderRecord",
    "ProcurementContext",
    "SalesOrderRecord",
    "ProductSalesRollup",
    "SalesContext",
    "RonaContextBundle",
    "assert_tenant_match",
    "apply_record_cap",
    "SupportingMetric",
    "KBCitation",
    "RonaAIResponse",
]
