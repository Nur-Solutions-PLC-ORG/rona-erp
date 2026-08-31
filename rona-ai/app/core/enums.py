
from __future__ import annotations

from enum import Enum


class UserRole(str, Enum):

    FACTORY_OWNER = "factory_owner"          
    GENERAL_MANAGER = "general_manager"      
    PRODUCTION_MANAGER = "production_manager"  
    HR = "hr"                                
    FINANCE = "finance"                      
    WAREHOUSE = "warehouse"                  


    SAAS_ADMIN = "saas_admin"


class DataDomain(str, Enum):

    HR = "hr"
    ATTENDANCE = "attendance"
    PRODUCTION = "production"
    INVENTORY = "inventory"
    MAINTENANCE = "maintenance"
    FINANCE = "finance"
    PROCUREMENT = "procurement"
    SALES = "sales"
    REPORTS = "reports"


DOMAIN_LABELS: dict[DataDomain, str] = {
    DataDomain.HR: "HR Module",
    DataDomain.ATTENDANCE: "Attendance Module",
    DataDomain.PRODUCTION: "Production Module",
    DataDomain.INVENTORY: "Inventory Module",
    DataDomain.MAINTENANCE: "Maintenance Module",
    DataDomain.FINANCE: "Finance Module",
    DataDomain.PROCUREMENT: "Procurement Module",
    DataDomain.SALES: "Sales Module",
    DataDomain.REPORTS: "Reports Database",
}


_MISSING_LABELS = [domain.value for domain in DataDomain if domain not in DOMAIN_LABELS]
if _MISSING_LABELS:  
    raise RuntimeError(
        "DOMAIN_LABELS is missing an entry for: "
        f"{', '.join(_MISSING_LABELS)}. Every DataDomain needs a presentation "
        "label because the LLM may only cite modules by these names."
    )
del _MISSING_LABELS


def domain_label(domain: DataDomain) -> str:
    return DOMAIN_LABELS[domain]


def label_to_domain(label: str) -> DataDomain | None:
    return _LABELS_TO_DOMAIN.get(label.strip().casefold())


_LABELS_TO_DOMAIN: dict[str, DataDomain] = {
    label.casefold(): domain for domain, label in DOMAIN_LABELS.items()
}


class Language(str, Enum):

    EN = "en"
    AM = "am"   
    OM = "om"   


class Severity(str, Enum):

    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class Shift(str, Enum):

    MORNING = "morning"
    AFTERNOON = "afternoon"
    NIGHT = "night"


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    ON_LEAVE = "on_leave"
    HALF_DAY = "half_day"
    NOT_RECORDED = "not_recorded"   


class ProductionStatus(str, Enum):
    AHEAD = "ahead"
    ON_TARGET = "on_target"
    BELOW_TARGET = "below_target"
    HALTED = "halted"


class StockStatus(str, Enum):
    HEALTHY = "healthy"
    LOW = "low"                 
    OUT_OF_STOCK = "out_of_stock"
    OVERSTOCKED = "overstocked"
    SLOW_MOVING = "slow_moving"


class MachineStatus(str, Enum):
    OPERATIONAL = "operational"
    UNDER_MAINTENANCE = "under_maintenance"
    BREAKDOWN = "breakdown"
    IDLE = "idle"
    DECOMMISSIONED = "decommissioned"


class Criticality(str, Enum):

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class InvoiceDirection(str, Enum):
    RECEIVABLE = "receivable"   
    PAYABLE = "payable"         


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class PurchaseOrderStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    ORDERED = "ordered"
    PARTIALLY_RECEIVED = "partially_received"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class SalesOrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PRODUCTION = "in_production"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class TrendDirection(str, Enum):

    UP = "up"
    DOWN = "down"
    FLAT = "flat"


class ReportType(str, Enum):
    ATTENDANCE = "attendance"
    PRODUCTION = "production"
    INVENTORY_VALUATION = "inventory_valuation"
    MAINTENANCE = "maintenance"
    FINANCE = "finance"
    MANAGEMENT_SUMMARY = "management_summary"


class ExportFormat(str, Enum):
    PDF = "pdf"
    EXCEL = "excel"
    JSON = "json"
