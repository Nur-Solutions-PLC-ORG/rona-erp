"""Per-domain canonical snapshots, one module per ERP module.

Each domain module owns its detail-row records, its rollups and its
``*Context`` snapshot. Import from here rather than from the individual
modules so that adding a domain only touches this package.
"""

from app.schemas.domains.finance import (
    ExpenseLine,
    FinanceContext,
    InvoiceRecord,
    PayrollSummary,
)
from app.schemas.domains.hr import (
    AttendanceRollup,
    EmployeeAttendanceRecord,
    HRContext,
)
from app.schemas.domains.inventory import InventoryContext, InventoryItemRecord
from app.schemas.domains.maintenance import (
    MachineRecord,
    MaintenanceContext,
    UpcomingMaintenanceRecord,
)
from app.schemas.domains.procurement import ProcurementContext, PurchaseOrderRecord
from app.schemas.domains.production import (
    ProductionContext,
    ProductionLineRecord,
    ShiftProductionRollup,
)
from app.schemas.domains.sales import (
    ProductSalesRollup,
    SalesContext,
    SalesOrderRecord,
)

__all__ = [
    # hr
    "EmployeeAttendanceRecord",
    "AttendanceRollup",
    "HRContext",
    # production
    "ProductionLineRecord",
    "ShiftProductionRollup",
    "ProductionContext",
    # inventory
    "InventoryItemRecord",
    "InventoryContext",
    # maintenance
    "MachineRecord",
    "UpcomingMaintenanceRecord",
    "MaintenanceContext",
    # finance
    "InvoiceRecord",
    "ExpenseLine",
    "PayrollSummary",
    "FinanceContext",
    # procurement
    "PurchaseOrderRecord",
    "ProcurementContext",
    # sales
    "SalesOrderRecord",
    "ProductSalesRollup",
    "SalesContext",
]
