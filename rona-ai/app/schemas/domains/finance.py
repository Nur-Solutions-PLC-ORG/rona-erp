"""Finance snapshot."""

from __future__ import annotations

from datetime import date

from pydantic import Field

from app.core.enums import InvoiceDirection, InvoiceStatus
from app.schemas.base import (
    CanonicalContext,
    CanonicalModel,
    NonNegFloat,
    NonNegInt,
    Percent,
)
from app.schemas.shared import TrendComparison


class InvoiceRecord(CanonicalModel):
    invoice_id: str
    counterparty: str = Field(description="Customer name for receivables, supplier for payables.")
    direction: InvoiceDirection
    amount: NonNegFloat
    amount_paid: NonNegFloat = 0.0
    amount_outstanding: NonNegFloat = 0.0
    currency: str = "ETB"
    issue_date: date
    due_date: date
    days_overdue: int = 0
    status: InvoiceStatus


class ExpenseLine(CanonicalModel):
    category: str
    amount: NonNegFloat
    budget_amount: NonNegFloat | None = None
    variance_pct: Percent | None = Field(
        default=None, description="Actual vs budget. Positive means over budget."
    )
    is_over_budget: bool = False


class PayrollSummary(CanonicalModel):
    period_label: str
    employee_count: NonNegInt
    gross_pay: NonNegFloat
    deductions: NonNegFloat = 0.0
    net_pay: NonNegFloat
    overtime_cost: NonNegFloat = 0.0
    currency: str = "ETB"
    due_date: date | None = None
    is_paid: bool = False


class FinanceContext(CanonicalContext):
    currency: str = "ETB"
    revenue: float
    expenses: float
    gross_profit: float
    net_profit: float
    profit_margin_pct: Percent

    outstanding_receivables: NonNegFloat = 0.0
    outstanding_payables: NonNegFloat = 0.0
    overdue_receivables: NonNegFloat = 0.0
    overdue_invoice_count: NonNegInt = 0

    expense_breakdown: list[ExpenseLine] = Field(default_factory=list)
    invoices: list[InvoiceRecord] = Field(default_factory=list)
    payroll: PayrollSummary | None = None
    trends: list[TrendComparison] = Field(default_factory=list)


__all__ = ["InvoiceRecord", "ExpenseLine", "PayrollSummary", "FinanceContext"]
