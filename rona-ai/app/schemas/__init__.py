"""Canonical schema layer the public import surface.

Import canonical models from this package rather than from the submodules so
that internal reorganisation stays invisible to callers.
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

    "CanonicalModel",
    "CanonicalContext",
    "Percent",
    "NonNegFloat",
    "NonNegInt",
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

    "KBCitation",
    "SupportingMetric",
    "RonaAIResponse",
]
