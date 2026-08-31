"""Finance prompt section."""

from __future__ import annotations

from app.core.enums import InvoiceStatus
from app.services.llm.prompt.formatting import MAX_PROMPT_ROWS


def finance_section(fin) -> list[str]:
    lines = [
        "\nFINANCE",
        f"Revenue: {fin.currency} {fin.revenue:,.2f} | expenses: {fin.currency} {fin.expenses:,.2f} "
        f"| net profit: {fin.currency} {fin.net_profit:,.2f} (margin {fin.profit_margin_pct}%)",
        f"Outstanding receivables: {fin.currency} {fin.outstanding_receivables:,.2f} "
        f"| overdue receivables: {fin.currency} {fin.overdue_receivables:,.2f} "
        f"across {fin.overdue_invoice_count} invoice(s)",
    ]
    if fin.expense_breakdown:
        lines.append(
            "Expense breakdown: "
            + "; ".join(
                f"{e.category} {fin.currency} {e.amount:,.2f}"
                + (f" (over budget {e.variance_pct}%)" if e.is_over_budget else "")
                for e in fin.expense_breakdown
            )
        )

    overdue = [inv for inv in fin.invoices if inv.status == InvoiceStatus.OVERDUE]
    overdue.sort(key=lambda inv: -inv.days_overdue)
    if overdue:
        lines.append("Overdue invoices:")
        for inv in overdue[:MAX_PROMPT_ROWS]:
            lines.append(
                f"  - {inv.invoice_id} ({inv.counterparty}, {inv.direction.value}): "
                f"{inv.currency} {inv.amount_outstanding:,.2f} outstanding, "
                f"{inv.days_overdue} day(s) overdue"
            )

    if fin.payroll:
        payroll = fin.payroll
        lines.append(
            f"Payroll ({payroll.period_label}): net {fin.currency} {payroll.net_pay:,.2f} "
            f"for {payroll.employee_count} employees, "
            f"{'paid' if payroll.is_paid else 'unpaid'}"
        )
    return lines


__all__ = ["finance_section"]
