from __future__ import annotations

from app.schemas import RonaContextBundle
from app.services.reports.errors import ReportDataUnavailableError
from app.services.reports.models import DocumentParts, ReportTable


def build_finance_document(bundle: RonaContextBundle) -> DocumentParts:
    fin = bundle.finance
    if fin is None:
        raise ReportDataUnavailableError("Finance data is not available for this report")

    cur = fin.currency
    summary = [
        ("Revenue", f"{cur} {fin.revenue:,.2f}"),
        ("Expenses", f"{cur} {fin.expenses:,.2f}"),
        ("Gross profit", f"{cur} {fin.gross_profit:,.2f}"),
        ("Net profit", f"{cur} {fin.net_profit:,.2f}"),
        ("Profit margin", f"{fin.profit_margin_pct}%"),
        ("Outstanding receivables", f"{cur} {fin.outstanding_receivables:,.2f}"),
        ("Outstanding payables", f"{cur} {fin.outstanding_payables:,.2f}"),
        ("Overdue receivables", f"{cur} {fin.overdue_receivables:,.2f}"),
        ("Overdue invoices", str(fin.overdue_invoice_count)),
    ]

    invoices = ReportTable(
        name="Invoices",
        columns=[
            "Invoice", "Counterparty", "Direction", "Amount", "Paid",
            "Outstanding", "Issued", "Due", "Days overdue", "Status",
        ],
        rows=[
            [
                inv.invoice_id, inv.counterparty, inv.direction.value, inv.amount,
                inv.amount_paid, inv.amount_outstanding, inv.issue_date.isoformat(),
                inv.due_date.isoformat(), inv.days_overdue, inv.status.value,
            ]
            for inv in fin.invoices
        ],
    )
    expenses = ReportTable(
        name="Expense Breakdown",
        columns=["Category", "Amount", "Budget", "Variance %", "Over budget?"],
        rows=[
            [
                e.category, e.amount,
                e.budget_amount if e.budget_amount is not None else "-",
                e.variance_pct if e.variance_pct is not None else "-",
                "yes" if e.is_over_budget else "no",
            ]
            for e in fin.expense_breakdown
        ],
    )
    return "Finance Report", summary, [invoices, expenses]


__all__ = ["build_finance_document"]
