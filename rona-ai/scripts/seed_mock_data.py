
import asyncio
import json
from datetime import date

from app.adapters.mock_adapter import MockRonaAdapter
from app.core.enums import DataDomain
from app.schemas import PayrollSummary, PeriodSpec, ProductSalesRollup


async def main():
    print("=" * 60)
    print("Rona AI Mock Data Seeding & Validation")
    print("=" * 60)
    print()


    adapter = MockRonaAdapter(seed=42)
    tenant_id = "demo_factory"


    tenant_name = await adapter.fetch_tenant_name(tenant_id)
    print(f"Tenant: {tenant_name} (ID: {tenant_id})")
    print()


    period = PeriodSpec.for_day(date.today())
    print(f"Period: {period.label}")
    print()


    domains = [
        (DataDomain.HR, "HR & Attendance"),
        (DataDomain.PRODUCTION, "Production"),
        (DataDomain.INVENTORY, "Inventory"),
        (DataDomain.MAINTENANCE, "Maintenance"),
        (DataDomain.FINANCE, "Finance"),
        (DataDomain.PROCUREMENT, "Procurement"),
        (DataDomain.SALES, "Sales"),
    ]

    for domain, label in domains:
        print(f"\n{'=' * 60}")
        print(f"{label} Data")
        print(f"{'=' * 60}")

        try:
            if domain == DataDomain.HR:
                context = await adapter.fetch_hr(tenant_id, period)
                print(f"Total Headcount: {context.total_headcount}")
                print(f"Present: {context.present_count} ({context.attendance_rate_pct}%)")
                print(f"Absent: {context.absent_count} ({context.absenteeism_rate_pct}%)")
                print(f"Late: {context.late_count}")
                print(f"Total Overtime: {context.total_overtime_hours} hours")
                print(f"\nSample Records ({len(context.records)} total):")
                for record in context.records[:3]:
                    print(f"  - {record.full_name}: {record.status.value} ({record.department})")

            elif domain == DataDomain.PRODUCTION:
                context = await adapter.fetch_production(tenant_id, period)
                print(f"Target: {context.total_target_units} units")
                print(f"Produced: {context.total_produced_units} units")
                print(f"Efficiency: {context.overall_efficiency_pct}%")
                print(f"Status: {context.overall_status.value}")
                print(f"Downtime: {context.total_downtime_minutes} minutes")
                print(f"\nSample Lines ({len(context.lines)} total):")
                for line in context.lines[:3]:
                    print(f"  - {line.line_name}: {line.produced_units}/{line.target_units} units ({line.efficiency_pct}%)")

            elif domain == DataDomain.INVENTORY:
                context = await adapter.fetch_inventory(tenant_id, period)
                print(f"Total SKUs: {context.total_sku_count}")
                print(f"Total Value: {context.currency} {context.total_inventory_value:,.2f}")
                print(f"Low Stock: {context.low_stock_count}")
                print(f"Out of Stock: {context.out_of_stock_count}")
                print(f"\nSample Items ({len(context.items)} total):")
                for item in context.items[:3]:
                    print(f"  - {item.name}: {item.quantity_on_hand} {item.unit_of_measure} ({item.stock_status.value})")

            elif domain == DataDomain.MAINTENANCE:
                context = await adapter.fetch_maintenance(tenant_id, period)
                print(f"Total Machines: {context.total_machines}")
                print(f"Operational: {context.operational_count}")
                print(f"Breakdown: {context.breakdown_count}")
                print(f"Fleet Availability: {context.fleet_availability_pct}%")
                print(f"\nSample Machines ({len(context.machines)} total):")
                for machine in context.machines[:3]:
                    print(f"  - {machine.machine_name}: {machine.status.value} ({machine.criticality.value})")

            elif domain == DataDomain.FINANCE:
                context = await adapter.fetch_finance(tenant_id, period)
                print(f"Revenue: {context.currency} {context.revenue:,.2f}")
                print(f"Expenses: {context.currency} {context.expenses:,.2f}")
                print(f"Net Profit: {context.currency} {context.net_profit:,.2f}")
                print(f"Profit Margin: {context.profit_margin_pct}%")
                print(f"Overdue Receivables: {context.currency} {context.overdue_receivables:,.2f}")
                print(f"\nSample Invoices ({len(context.invoices)} total):")
                for invoice in context.invoices[:3]:
                    print(f"  - {invoice.invoice_id}: {invoice.direction.value} {invoice.currency} {invoice.amount:,.2f} ({invoice.status.value})")

            elif domain == DataDomain.PROCUREMENT:
                context = await adapter.fetch_procurement(tenant_id, period)
                print(f"Open POs: {context.open_po_count}")
                print(f"Total Open Value: {context.currency} {context.total_open_value:,.2f}")
                print(f"Overdue Deliveries: {context.overdue_delivery_count}")
                print(f"\nSample POs ({len(context.purchase_orders)} total):")
                for po in context.purchase_orders[:3]:
                    print(f"  - {po.po_number}: {po.supplier} {po.currency} {po.total_value:,.2f} ({po.status.value})")

            elif domain == DataDomain.SALES:
                context = await adapter.fetch_sales(tenant_id, period)
                print(f"Total Orders: {context.total_order_count}")
                print(f"Total Revenue: {context.currency} {context.total_revenue:,.2f}")
                print(f"Fulfilled: {context.fulfilled_count}")
                print(f"Pending: {context.pending_count}")
                print(f"\nSample Orders ({len(context.orders)} total):")
                for order in context.orders[:3]:
                    print(f"  - {order.order_id}: {order.customer} {order.currency} {order.total_value:,.2f} ({order.status.value})")

            print(f"\n[OK] {label} data generated successfully")

        except Exception as e:
            print(f"[FAIL] Error generating {label} data: {e}")


    print(f"\n{'=' * 60}")
    print("Smart Alerts")
    print(f"{'=' * 60}")
    alerts = await adapter.fetch_alerts(tenant_id, period, list(DataDomain))
    for alert in alerts:
        print(f"- [{alert.severity.value.upper()}] {alert.title}: {alert.message}")


    print(f"\n{'=' * 60}")
    print("Pending Tasks")
    print(f"{'=' * 60}")
    tasks = await adapter.fetch_pending_tasks(tenant_id, period, list(DataDomain))
    for task in tasks:
        print(f"- [{task.domain.value}] {task.title} (Due: {task.due_date})")

    print(f"\n{'=' * 60}")
    print("Mock data seeding complete!")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    asyncio.run(main())
