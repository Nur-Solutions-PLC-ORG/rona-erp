
from __future__ import annotations

import asyncio
import hashlib
import random
from datetime import date, datetime, time, timedelta, timezone

from app.adapters.base import BaseRonaAdapter
from app.core.enums import (
    AttendanceStatus,
    Criticality,
    DataDomain,
    InvoiceDirection,
    InvoiceStatus,
    MachineStatus,
    ProductionStatus,
    PurchaseOrderStatus,
    SalesOrderStatus,
    Severity,
    Shift,
    StockStatus,
    TrendDirection,
)
from app.schemas import (
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
    PendingTask,
    PeriodSpec,
    ProcurementContext,
    ProductSalesRollup,
    ProductionContext,
    ProductionLineRecord,
    PurchaseOrderRecord,
    SalesContext,
    SalesOrderRecord,
    ShiftProductionRollup,
    SmartAlert,
    TrendComparison,
    UpcomingMaintenanceRecord,
)


_EFFICIENCY_TARGET_PCT = 95.0

_ABSENTEEISM_ALERT_PCT = 10.0

_MAINTENANCE_DUE_SOON_DAYS = 7


class MockRonaAdapter(BaseRonaAdapter):

    source_system = "mock"


    _TENANTS = {
        "demo_factory": "Rona Demo Factory",
        "acme_mfg": "ACME Manufacturing",
        "tech_prod": "Tech Production Ltd",
    }


    _EMPLOYEES = [
        ("EMP001", "Abebe Bikila", "Production", "Operator", "Line 1"),
        ("EMP002", "Tirunesh Dibaba", "Production", "Operator", "Line 1"),
        ("EMP003", "Haile Gebreselassie", "Production", "Supervisor", "Line 2"),
        ("EMP004", "Kenenisa Bekele", "Production", "Operator", "Line 2"),
        ("EMP005", "Almaz Ayana", "HR", "Manager", None),
        ("EMP006", "Genzebe Dibaba", "Finance", "Accountant", None),
        ("EMP007", "Feyisa Lilesa", "Warehouse", "Manager", None),
        ("EMP008", "Derartu Tulu", "Maintenance", "Technician", None),
        ("EMP009", "Meseret Defar", "Production", "Operator", "Line 3"),
        ("EMP010", "Ejegayehu Dibaba", "Production", "Operator", "Line 3"),
        ("EMP011", "Worknesh Kidane", "Production", "Operator", "Line 1"),
        ("EMP012", "Mestawet Tufa", "Production", "Operator", "Line 2"),
        ("EMP013", "Sentayehu Ejigu", "Finance", "Analyst", None),
        ("EMP014", "Buzunesh Deba", "HR", "Specialist", None),
        ("EMP015", "Kutre Dulecha", "Warehouse", "Staff", None),
    ]


    _PRODUCTION_LINES = [
        ("LINE1", "Line 1", "Steel Sheets"),
        ("LINE2", "Line 2", "Aluminum Panels"),
        ("LINE3", "Line 3", "Copper Pipes"),
    ]


    _MACHINES = [
        ("MCH001", "CNC Milling Machine A1", "LINE1", Criticality.HIGH),
        ("MCH002", "CNC Lathe B2", "LINE1", Criticality.HIGH),
        ("MCH003", "Press Brake C3", "LINE2", Criticality.MEDIUM),
        ("MCH004", "Welding Robot D4", "LINE2", Criticality.HIGH),
        ("MCH005", "Cutting Saw E5", "LINE3", Criticality.MEDIUM),
        ("MCH006", "Bending Press F6", "LINE3", Criticality.LOW),
    ]


    _INVENTORY_ITEMS = [
        ("SKU001", "Steel Sheet 2mm", "Raw Material", "Sheet", 450.0, 100.0, 2500.0),
        ("SKU002", "Steel Sheet 5mm", "Raw Material", "Sheet", 320.0, 80.0, 3200.0),
        ("SKU003", "Aluminum Panel", "Raw Material", "Panel", 180.0, 50.0, 1800.0),
        ("SKU004", "Copper Pipe 1in", "Raw Material", "Meter", 25.0, 30.0, 450.0),
        ("SKU005", "Copper Pipe 2in", "Raw Material", "Meter", 15.0, 20.0, 600.0),
        ("SKU006", "Industrial Bolt M10", "Hardware", "Piece", 5000.0, 1000.0, 0.5),
        ("SKU007", "Industrial Bolt M12", "Hardware", "Piece", 3500.0, 800.0, 0.6),
        ("SKU008", "Welding Rod", "Consumable", "kg", 120.0, 50.0, 45.0),
        ("SKU009", "Cutting Fluid", "Consumable", "Liter", 80.0, 40.0, 120.0),
        ("SKU010", "Safety Gloves", "PPE", "Pair", 200.0, 50.0, 15.0),
    ]

    def __init__(self, seed: int = 42):
        self._base_seed = seed


    def _rng(self, tenant_id: str, period: PeriodSpec, salt: str) -> random.Random:
        key = f"{self._base_seed}|{tenant_id}|{period.start.isoformat()}|{period.end.isoformat()}|{salt}"
        digest = hashlib.sha256(key.encode("utf-8")).digest()
        return random.Random(int.from_bytes(digest[:8], "big"))

    @staticmethod
    def _now() -> datetime:
        return datetime.now(timezone.utc)

    @staticmethod
    def _as_of(period: PeriodSpec) -> date:
        return period.end

    async def fetch_tenant_name(self, tenant_id: str) -> str | None:
        return self._TENANTS.get(tenant_id)


    async def fetch_hr(self, tenant_id: str, period: PeriodSpec) -> HRContext:
        rng = self._rng(tenant_id, period, "hr")
        records: list[EmployeeAttendanceRecord] = []

        for emp_id, name, dept, position, line in self._EMPLOYEES:
            roll = rng.random()
            check_in = check_out = None
            late_min = 0
            ot_hours = 0.0
            absence_reason = None

            if roll < 0.80:
                status = AttendanceStatus.PRESENT
                check_in = f"{7 + rng.randint(0, 1):02d}:{rng.randint(0, 59):02d}"
                check_out = f"{16 + rng.randint(0, 2):02d}:{rng.randint(0, 59):02d}"
                if rng.random() < 0.15:
                    ot_hours = round(rng.uniform(0.5, 4.0), 1)
            elif roll < 0.88:
                status = AttendanceStatus.LATE
                check_in = f"{9 + rng.randint(0, 1):02d}:{rng.randint(0, 59):02d}"
                check_out = f"{17 + rng.randint(0, 1):02d}:{rng.randint(0, 59):02d}"
                late_min = rng.randint(31, 120)
                if rng.random() < 0.10:
                    ot_hours = round(rng.uniform(0.5, 2.0), 1)
            elif roll < 0.94:
                status = AttendanceStatus.ABSENT
                absence_reason = rng.choice(["sick", "personal", "unexcused", "family emergency"])
            elif roll < 0.98:
                status = AttendanceStatus.ON_LEAVE
                absence_reason = rng.choice(["annual leave", "sick leave", "maternity"])
            else:
                status = AttendanceStatus.NOT_RECORDED

            records.append(
                EmployeeAttendanceRecord(
                    employee_id=emp_id,
                    full_name=name,
                    department=dept,
                    position=position,
                    production_line=line,
                    shift=rng.choice(list(Shift)),
                    status=status,
                    check_in_time=check_in,
                    check_out_time=check_out,
                    late_minutes=late_min,
                    overtime_hours=ot_hours,
                    absence_reason=absence_reason,
                )
            )

        def _rollups(key_fn) -> list[AttendanceRollup]:
            groups: dict[str, list[EmployeeAttendanceRecord]] = {}
            for r in records:
                key = key_fn(r)
                if key is not None:
                    groups.setdefault(key, []).append(r)
            rollups = []
            for group_name in sorted(groups):
                grp = groups[group_name]
                headcount = len(grp)
                absent = sum(1 for r in grp if r.status == AttendanceStatus.ABSENT)
                rollups.append(
                    AttendanceRollup(
                        group_name=group_name,
                        headcount=headcount,
                        present=sum(1 for r in grp if r.status == AttendanceStatus.PRESENT),
                        absent=absent,
                        late=sum(1 for r in grp if r.status == AttendanceStatus.LATE),
                        on_leave=sum(1 for r in grp if r.status == AttendanceStatus.ON_LEAVE),
                        absenteeism_rate_pct=round(absent / headcount * 100, 1) if headcount else 0.0,
                        total_overtime_hours=round(sum(r.overtime_hours for r in grp), 1),
                    )
                )
            return rollups


        headcount = len(records)
        present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        late = sum(1 for r in records if r.status == AttendanceStatus.LATE)
        absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        on_leave = sum(1 for r in records if r.status == AttendanceStatus.ON_LEAVE)
        not_recorded = sum(1 for r in records if r.status == AttendanceStatus.NOT_RECORDED)
        total_overtime = sum(r.overtime_hours for r in records)
        on_overtime = sum(1 for r in records if r.overtime_hours > 0)


        attendance_rate = (present + late) / headcount * 100 if headcount else 0.0
        absenteeism_rate = absent / headcount * 100 if headcount else 0.0

        if period.has_comparison:
            previous_period = PeriodSpec(
                start=period.previous_start,
                end=period.previous_end,
                label=period.previous_label or period.previous_start.strftime("%d %b %Y"),
            )
            previous_hr = await self.fetch_hr(tenant_id, previous_period)
            prev_rate = previous_hr.attendance_rate_pct
            trends = [
                TrendComparison(
                    metric_label="Attendance Rate",
                    current_value=round(attendance_rate, 1),
                    previous_value=prev_rate,
                    change_pct=round(attendance_rate - prev_rate, 1),
                    direction=_direction(attendance_rate, prev_rate),
                    previous_period_label=period.previous_label or "previous period",
                )
            ]
        else:
            trends = []

        return HRContext(
            tenant_id=tenant_id,
            domain=DataDomain.HR,
            period_label=period.label,
            period_start=period.start,
            period_end=period.end,
            generated_at=self._now(),
            source_system=self.source_system,
            total_headcount=headcount,
            present_count=present,
            absent_count=absent,
            late_count=late,
            on_leave_count=on_leave,
            not_recorded_count=not_recorded,
            attendance_rate_pct=round(attendance_rate, 1),
            absenteeism_rate_pct=round(absenteeism_rate, 1),
            total_overtime_hours=round(total_overtime, 1),
            employees_on_overtime=on_overtime,
            records=records,
            by_department=_rollups(lambda r: r.department),
            by_production_line=_rollups(lambda r: r.production_line),
            trends=trends,
        )


    async def fetch_production(self, tenant_id: str, period: PeriodSpec) -> ProductionContext:
        rng = self._rng(tenant_id, period, "production")
        machines_by_line: dict[str, list[str]] = {}
        for mid, _name, line_id, _crit in self._MACHINES:
            machines_by_line.setdefault(line_id, []).append(mid)

        lines: list[ProductionLineRecord] = []
        for line_id, line_name, product in self._PRODUCTION_LINES:
            for shift in Shift:
                target = rng.randint(400, 600)
                produced = int(target * rng.uniform(0.72, 1.12))
                rejected = int(produced * rng.uniform(0.01, 0.05))
                efficiency = produced / target * 100 if target else 0.0
                downtime = rng.randint(0, 120)
                operators = rng.randint(4, 8)
                status = _production_status(efficiency)

                blocking_machine = None
                if status in (ProductionStatus.BELOW_TARGET, ProductionStatus.HALTED) and downtime > 30:
                    candidates = machines_by_line.get(line_id)
                    if candidates:
                        blocking_machine = rng.choice(candidates)

                lines.append(
                    ProductionLineRecord(
                        line_id=line_id,
                        line_name=line_name,
                        product=product,
                        shift=shift,
                        target_units=target,
                        produced_units=produced,
                        rejected_units=rejected,
                        efficiency_pct=round(efficiency, 1),
                        downtime_minutes=downtime,
                        operators_assigned=operators,
                        status=status,
                        blocking_machine_id=blocking_machine,
                    )
                )

        total_target = sum(l.target_units for l in lines)
        total_produced = sum(l.produced_units for l in lines)
        total_rejected = sum(l.rejected_units for l in lines)
        total_downtime = sum(l.downtime_minutes for l in lines)
        overall_efficiency = total_produced / total_target * 100 if total_target else 0.0
        reject_rate = total_rejected / total_produced * 100 if total_produced else 0.0

        shift_rollups = []
        for shift in Shift:
            shift_lines = [l for l in lines if l.shift == shift]
            s_target = sum(l.target_units for l in shift_lines)
            s_produced = sum(l.produced_units for l in shift_lines)
            shift_rollups.append(
                ShiftProductionRollup(
                    shift=shift,
                    target_units=s_target,
                    produced_units=s_produced,
                    efficiency_pct=round(s_produced / s_target * 100, 1) if s_target else 0.0,
                )
            )


        underperforming = sorted(
            {l.line_id for l in lines if l.status in (ProductionStatus.BELOW_TARGET, ProductionStatus.HALTED)}
        )

        prev = round(overall_efficiency - rng.uniform(-6, 8), 1)
        trends = [
            TrendComparison(
                metric_label="Overall Efficiency",
                current_value=round(overall_efficiency, 1),
                previous_value=prev,
                change_pct=round(overall_efficiency - prev, 1),
                direction=_direction(overall_efficiency, prev),
                previous_period_label=period.previous_label or "previous period",
            )
        ]

        return ProductionContext(
            tenant_id=tenant_id,
            domain=DataDomain.PRODUCTION,
            period_label=period.label,
            period_start=period.start,
            period_end=period.end,
            generated_at=self._now(),
            source_system=self.source_system,
            total_target_units=total_target,
            total_produced_units=total_produced,
            total_rejected_units=total_rejected,
            overall_efficiency_pct=round(overall_efficiency, 1),
            target_achievement_pct=round(overall_efficiency, 1),
            reject_rate_pct=round(reject_rate, 1),
            total_downtime_minutes=total_downtime,
            overall_status=_production_status(overall_efficiency),
            lines=lines,
            by_shift=shift_rollups,
            underperforming_line_ids=underperforming,
            trends=trends,
        )


    async def fetch_inventory(self, tenant_id: str, period: PeriodSpec) -> InventoryContext:
        rng = self._rng(tenant_id, period, "inventory")
        as_of = self._as_of(period)
        items: list[InventoryItemRecord] = []

        for sku, name, category, uom, base_qty, reorder, cost in self._INVENTORY_ITEMS:
            current_qty = round(base_qty * rng.uniform(0.15, 1.5), 1)
            on_order = float(rng.randint(0, 60))
            monthly_consumption = round(rng.uniform(10, 120), 1)
            days_cover = round(current_qty / monthly_consumption * 30, 1) if monthly_consumption else None

            if current_qty <= 0:
                status = StockStatus.OUT_OF_STOCK
            elif current_qty <= reorder:
                status = StockStatus.LOW
            elif current_qty >= base_qty * 1.3:
                status = StockStatus.OVERSTOCKED
            elif days_cover is not None and days_cover > 90:
                status = StockStatus.SLOW_MOVING
            else:
                status = StockStatus.HEALTHY

            item_value = current_qty * cost
            items.append(
                InventoryItemRecord(
                    item_id=sku,
                    sku=sku,
                    name=name,
                    category=category,
                    unit_of_measure=uom,
                    quantity_on_hand=current_qty,
                    reorder_level=reorder,
                    quantity_on_order=on_order,
                    unit_cost=round(cost, 2),
                    total_value=round(item_value, 2),
                    monthly_consumption=monthly_consumption,
                    days_of_cover=days_cover,
                    last_movement_date=as_of - timedelta(days=rng.randint(1, 30)),
                    warehouse_location=f"Zone-{rng.choice(['A', 'B', 'C'])}-{rng.randint(1, 20)}",
                    stock_status=status,
                    needs_reorder=status in (StockStatus.LOW, StockStatus.OUT_OF_STOCK),
                )
            )

        total_value = sum(i.total_value for i in items)
        prev = round(total_value * rng.uniform(0.9, 1.1), 2)
        trends = [
            TrendComparison(
                metric_label="Inventory Value",
                current_value=round(total_value, 2),
                previous_value=prev,
                change_pct=round((total_value - prev) / prev * 100, 1) if prev else 0.0,
                direction=_direction(total_value, prev),
                previous_period_label=period.previous_label or "previous period",
            )
        ]

        return InventoryContext(
            tenant_id=tenant_id,
            domain=DataDomain.INVENTORY,
            period_label=period.label,
            period_start=period.start,
            period_end=period.end,
            generated_at=self._now(),
            source_system=self.source_system,
            currency="ETB",
            total_sku_count=len(items),
            total_inventory_value=round(total_value, 2),
            low_stock_count=sum(1 for i in items if i.stock_status == StockStatus.LOW),
            out_of_stock_count=sum(1 for i in items if i.stock_status == StockStatus.OUT_OF_STOCK),
            overstocked_count=sum(1 for i in items if i.stock_status == StockStatus.OVERSTOCKED),
            slow_moving_count=sum(1 for i in items if i.stock_status == StockStatus.SLOW_MOVING),
            slow_moving_value=round(
                sum(i.total_value for i in items if i.stock_status == StockStatus.SLOW_MOVING), 2
            ),
            items=items,
            reorder_recommendations=[i.item_id for i in items if i.needs_reorder],
            trends=trends,
        )


    async def fetch_maintenance(self, tenant_id: str, period: PeriodSpec) -> MaintenanceContext:
        rng = self._rng(tenant_id, period, "maintenance")
        as_of = self._as_of(period)
        machines: list[MachineRecord] = []
        upcoming: list[UpcomingMaintenanceRecord] = []

        for mid, mname, line, criticality in self._MACHINES:
            roll = rng.random()
            if roll < 0.68:
                status = MachineStatus.OPERATIONAL
            elif roll < 0.83:
                status = MachineStatus.UNDER_MAINTENANCE
            elif roll < 0.93:
                status = MachineStatus.IDLE
            else:
                status = MachineStatus.BREAKDOWN

            downtime = round(rng.uniform(0, 40), 1)


            if status == MachineStatus.BREAKDOWN:
                downtime += round(rng.uniform(10, 100), 1)
                failure_count = rng.randint(1, 5)
            else:
                failure_count = rng.randint(0, 2)

            last_service = as_of - timedelta(days=rng.randint(10, 90))
            next_service = last_service + timedelta(days=rng.randint(30, 90))
            mtbf = round(720 / failure_count, 1) if failure_count else None
            availability = max(0.0, 100.0 - downtime / 720 * 100)

            machines.append(
                MachineRecord(
                    machine_id=mid,
                    machine_name=mname,
                    production_line=line,
                    status=status,
                    criticality=criticality,
                    last_service_date=last_service,
                    next_service_due=next_service,
                    downtime_hours_period=round(downtime, 1),
                    failure_count_period=failure_count,
                    mtbf_hours=mtbf,
                    availability_pct=round(availability, 1),
                )
            )
            upcoming.append(
                UpcomingMaintenanceRecord(
                    machine_id=mid,
                    machine_name=mname,
                    maintenance_type=rng.choice(["preventive", "calibration", "inspection"]),
                    due_date=next_service,
                    days_until_due=(next_service - as_of).days,
                    assigned_to=rng.choice(["Derartu Tulu", "Mulatu Tesfaye", "Sara Mekonnen", "Amanuel Girma"]),
                    estimated_hours=round(rng.uniform(2, 8), 1),
                )
            )

        total_downtime = sum(m.downtime_hours_period for m in machines)
        total_failures = sum(m.failure_count_period for m in machines)
        fleet_availability = (
            sum(m.availability_pct for m in machines) / len(machines) if machines else 100.0
        )

        worst = max(machines, key=lambda m: (m.failure_count_period, m.machine_id)) if machines else None

        prev = round(fleet_availability - rng.uniform(-3, 5), 1)
        trends = [
            TrendComparison(
                metric_label="Fleet Availability",
                current_value=round(fleet_availability, 1),
                previous_value=prev,
                change_pct=round(fleet_availability - prev, 1),
                direction=_direction(fleet_availability, prev),
                previous_period_label=period.previous_label or "previous period",
            )
        ]

        return MaintenanceContext(
            tenant_id=tenant_id,
            domain=DataDomain.MAINTENANCE,
            period_label=period.label,
            period_start=period.start,
            period_end=period.end,
            generated_at=self._now(),
            source_system=self.source_system,
            total_machines=len(machines),
            operational_count=sum(1 for m in machines if m.status == MachineStatus.OPERATIONAL),
            under_maintenance_count=sum(1 for m in machines if m.status == MachineStatus.UNDER_MAINTENANCE),
            breakdown_count=sum(1 for m in machines if m.status == MachineStatus.BREAKDOWN),
            idle_count=sum(1 for m in machines if m.status == MachineStatus.IDLE),
            total_downtime_hours=round(total_downtime, 1),
            total_failures=total_failures,
            fleet_availability_pct=round(fleet_availability, 1),
            machines=machines,
            upcoming_maintenance=upcoming,
            worst_offender_machine_id=worst.machine_id if worst else None,
            trends=trends,
        )


    async def fetch_finance(self, tenant_id: str, period: PeriodSpec) -> FinanceContext:
        rng = self._rng(tenant_id, period, "finance")
        as_of = self._as_of(period)

        revenue = round(rng.uniform(800_000, 1_200_000), 2)
        expenses = round(rng.uniform(600_000, 900_000), 2)
        gross_profit = round(revenue - expenses, 2)
        net_profit = round(gross_profit * rng.uniform(0.7, 0.9), 2)
        profit_margin = net_profit / revenue * 100 if revenue else 0.0

        invoices: list[InvoiceRecord] = []
        for i in range(10):
            direction = rng.choice(list(InvoiceDirection))
            amount = round(rng.uniform(10_000, 100_000), 2)
            paid = round(rng.uniform(0, amount), 2)
            outstanding = round(amount - paid, 2)
            issue_date = as_of - timedelta(days=rng.randint(10, 60))
            due_date = issue_date + timedelta(days=30)
            days_overdue = max(0, (as_of - due_date).days)

            if paid >= amount:
                status = InvoiceStatus.PAID
            elif days_overdue > 0:
                status = InvoiceStatus.OVERDUE
            elif paid > 0:
                status = InvoiceStatus.PARTIALLY_PAID
            else:
                status = InvoiceStatus.SENT

            invoices.append(
                InvoiceRecord(
                    invoice_id=f"INV{1000 + i}",
                    counterparty=rng.choice(["Customer A", "Customer B", "Supplier X", "Supplier Y"]),
                    direction=direction,
                    amount=amount,
                    amount_paid=paid,
                    amount_outstanding=outstanding,
                    currency="ETB",
                    issue_date=issue_date,
                    due_date=due_date,
                    days_overdue=days_overdue,
                    status=status,
                )
            )

        receivables = [inv for inv in invoices if inv.direction == InvoiceDirection.RECEIVABLE]
        payables = [inv for inv in invoices if inv.direction == InvoiceDirection.PAYABLE]
        overdue_receivables = [inv for inv in receivables if inv.status == InvoiceStatus.OVERDUE]


        weights = {"Raw Materials": 0.40, "Labor": 0.30, "Utilities": 0.10, "Maintenance": 0.08}
        expense_breakdown: list[ExpenseLine] = []
        allocated = 0.0
        for idx, (category, weight) in enumerate(weights.items()):
            amount = round(expenses * weight, 2)
            allocated += amount
            budget = round(amount * rng.uniform(0.9, 1.15), 2)
            variance = (amount - budget) / budget * 100 if budget else 0.0
            expense_breakdown.append(
                ExpenseLine(
                    category=category,
                    amount=amount,
                    budget_amount=budget,
                    variance_pct=round(variance, 1),
                    is_over_budget=amount > budget,
                )
            )
        other = round(expenses - allocated, 2)
        other_budget = round(other * rng.uniform(0.9, 1.15), 2)
        expense_breakdown.append(
            ExpenseLine(
                category="Other",
                amount=other,
                budget_amount=other_budget,
                variance_pct=round((other - other_budget) / other_budget * 100, 1) if other_budget else 0.0,
                is_over_budget=other > other_budget,
            )
        )

        payroll = PayrollSummary(
            period_label=period.label,
            employee_count=len(self._EMPLOYEES),
            gross_pay=round(expenses * 0.35, 2),
            deductions=round(expenses * 0.05, 2),
            net_pay=round(expenses * 0.30, 2),
            overtime_cost=round(expenses * 0.02, 2),
            currency="ETB",
            due_date=as_of + timedelta(days=5),
            is_paid=False,
        )

        prev = round(net_profit * rng.uniform(0.8, 1.2), 2)
        trends = [
            TrendComparison(
                metric_label="Net Profit",
                current_value=net_profit,
                previous_value=prev,
                change_pct=round((net_profit - prev) / prev * 100, 1) if prev else 0.0,
                direction=_direction(net_profit, prev),
                previous_period_label=period.previous_label or "previous period",
            )
        ]

        return FinanceContext(
            tenant_id=tenant_id,
            domain=DataDomain.FINANCE,
            period_label=period.label,
            period_start=period.start,
            period_end=period.end,
            generated_at=self._now(),
            source_system=self.source_system,
            currency="ETB",
            revenue=revenue,
            expenses=expenses,
            gross_profit=gross_profit,
            net_profit=net_profit,
            profit_margin_pct=round(profit_margin, 1),
            outstanding_receivables=round(sum(inv.amount_outstanding for inv in receivables), 2),
            outstanding_payables=round(sum(inv.amount_outstanding for inv in payables), 2),
            overdue_receivables=round(sum(inv.amount_outstanding for inv in overdue_receivables), 2),
            overdue_invoice_count=sum(1 for inv in invoices if inv.status == InvoiceStatus.OVERDUE),
            expense_breakdown=expense_breakdown,
            invoices=invoices,
            payroll=payroll,
            trends=trends,
        )


    async def fetch_procurement(self, tenant_id: str, period: PeriodSpec) -> ProcurementContext:
        rng = self._rng(tenant_id, period, "procurement")
        as_of = self._as_of(period)
        suppliers = ["Supplier A", "Supplier B", "Supplier C", "Industrial Corp"]
        pos: list[PurchaseOrderRecord] = []

        for i in range(8):
            value = round(rng.uniform(20_000, 150_000), 2)
            order_date = as_of - timedelta(days=rng.randint(5, 45))
            expected = order_date + timedelta(days=rng.randint(7, 21))
            days_late = max(0, (as_of - expected).days)
            roll = rng.random()

            if days_late > 5:
                status = PurchaseOrderStatus.PARTIALLY_RECEIVED
            elif roll < 0.3:
                status = PurchaseOrderStatus.RECEIVED
            elif roll < 0.7:
                status = PurchaseOrderStatus.ORDERED
            else:
                status = PurchaseOrderStatus.APPROVED

            pos.append(
                PurchaseOrderRecord(
                    po_number=f"PO{5000 + i}",
                    supplier=rng.choice(suppliers),
                    item_summary=rng.choice(["Steel Sheets", "Aluminum Panels", "Hardware", "Consumables"]),
                    total_value=value,
                    currency="ETB",
                    order_date=order_date,
                    expected_delivery_date=expected,
                    days_late=days_late,
                    status=status,
                )
            )

        open_statuses = {PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.PARTIALLY_RECEIVED}
        open_pos = [p for p in pos if p.status in open_statuses]
        total_open = round(sum(p.total_value for p in open_pos), 2)
        overdue = sum(1 for p in pos if p.days_late > 0 and p.status != PurchaseOrderStatus.RECEIVED)

        prev = round(total_open * rng.uniform(0.8, 1.2), 2)
        trends = [
            TrendComparison(
                metric_label="Open PO Value",
                current_value=total_open,
                previous_value=prev,
                change_pct=round((total_open - prev) / prev * 100, 1) if prev else 0.0,
                direction=_direction(total_open, prev),
                previous_period_label=period.previous_label or "previous period",
            )
        ]

        return ProcurementContext(
            tenant_id=tenant_id,
            domain=DataDomain.PROCUREMENT,
            period_label=period.label,
            period_start=period.start,
            period_end=period.end,
            generated_at=self._now(),
            source_system=self.source_system,
            currency="ETB",
            open_po_count=len(open_pos),
            total_open_value=total_open,
            overdue_delivery_count=overdue,
            purchase_orders=pos,
            trends=trends,
        )


    async def fetch_sales(self, tenant_id: str, period: PeriodSpec) -> SalesContext:
        rng = self._rng(tenant_id, period, "sales")
        as_of = self._as_of(period)
        customers = ["Client X", "Client Y", "Distributor A", "Retailer B"]
        products = ["Steel Sheets", "Aluminum Panels", "Copper Pipes"]
        orders: list[SalesOrderRecord] = []

        for i in range(12):
            product = rng.choice(products)
            qty = round(rng.uniform(50, 500), 1)
            value = round(qty * rng.uniform(50, 200), 2)
            order_date = as_of - timedelta(days=rng.randint(1, 30))
            promised = order_date + timedelta(days=rng.randint(7, 14))
            days_late = max(0, (as_of - promised).days)
            roll = rng.random()

            if days_late > 3:
                status = SalesOrderStatus.IN_PRODUCTION
            elif roll < 0.4:
                status = SalesOrderStatus.DELIVERED
            elif roll < 0.7:
                status = SalesOrderStatus.SHIPPED
            elif roll < 0.9:
                status = SalesOrderStatus.IN_PRODUCTION
            else:
                status = SalesOrderStatus.CONFIRMED

            orders.append(
                SalesOrderRecord(
                    order_id=f"SO{2000 + i}",
                    customer=rng.choice(customers),
                    product_summary=product,
                    quantity=qty,
                    total_value=value,
                    currency="ETB",
                    order_date=order_date,
                    promised_delivery_date=promised,
                    days_late=days_late,
                    status=status,
                )
            )

        fulfilled_statuses = {SalesOrderStatus.SHIPPED, SalesOrderStatus.DELIVERED}
        fulfilled = sum(1 for o in orders if o.status in fulfilled_statuses and o.days_late == 0)
        overdue = sum(1 for o in orders if o.days_late > 0)
        pending = len(orders) - fulfilled - overdue

        product_sales: dict[str, list[float]] = {}
        for o in orders:
            agg = product_sales.setdefault(o.product_summary, [0.0, 0.0])
            agg[0] += o.quantity
            agg[1] += o.total_value
        top_products = [
            ProductSalesRollup(product=prod, units_sold=round(vals[0], 1), revenue=round(vals[1], 2))
            for prod, vals in sorted(product_sales.items(), key=lambda kv: kv[1][1], reverse=True)
        ]

        total_revenue = round(sum(o.total_value for o in orders), 2)
        prev = round(total_revenue * rng.uniform(0.85, 1.15), 2)
        trends = [
            TrendComparison(
                metric_label="Total Revenue",
                current_value=total_revenue,
                previous_value=prev,
                change_pct=round((total_revenue - prev) / prev * 100, 1) if prev else 0.0,
                direction=_direction(total_revenue, prev),
                previous_period_label=period.previous_label or "previous period",
            )
        ]

        return SalesContext(
            tenant_id=tenant_id,
            domain=DataDomain.SALES,
            period_label=period.label,
            period_start=period.start,
            period_end=period.end,
            generated_at=self._now(),
            source_system=self.source_system,
            currency="ETB",
            total_order_count=len(orders),
            total_revenue=total_revenue,
            fulfilled_count=fulfilled,
            pending_count=pending,
            overdue_count=overdue,
            orders=orders,
            top_products=top_products,
            trends=trends,
        )


    async def fetch_alerts(
        self, tenant_id: str, period: PeriodSpec, domains: list[DataDomain]
    ) -> list[SmartAlert]:
        detected_at = datetime.combine(period.end, time.min, tzinfo=timezone.utc)
        wanted = set(domains)
        alerts: list[SmartAlert] = []


        need_hr = bool(wanted & {DataDomain.HR, DataDomain.ATTENDANCE})
        # asyncio.gather instead of asyncio.TaskGroup so this works on
        # Python 3.10 (TaskGroup requires 3.11+).
        coros: dict[str, object] = {}
        if need_hr:
            coros["hr"] = self.fetch_hr(tenant_id, period)
        if DataDomain.PRODUCTION in wanted:
            coros["production"] = self.fetch_production(tenant_id, period)
        if DataDomain.INVENTORY in wanted:
            coros["inventory"] = self.fetch_inventory(tenant_id, period)
        if DataDomain.MAINTENANCE in wanted:
            coros["maintenance"] = self.fetch_maintenance(tenant_id, period)
        if DataDomain.FINANCE in wanted:
            coros["finance"] = self.fetch_finance(tenant_id, period)
        if DataDomain.SALES in wanted:
            coros["sales"] = self.fetch_sales(tenant_id, period)
        names = list(coros.keys())
        results = await asyncio.gather(*(coros[name] for name in names))
        ctx = dict(zip(names, results))

        seq = 0

        def _next_id() -> str:
            nonlocal seq
            seq += 1
            return f"ALERT-{seq:03d}"


        if need_hr:
            hr = ctx["hr"]
            hr_domain = DataDomain.ATTENDANCE if DataDomain.ATTENDANCE in wanted else DataDomain.HR
            if hr.absenteeism_rate_pct >= _ABSENTEEISM_ALERT_PCT:
                alerts.append(
                    SmartAlert(
                        alert_id=_next_id(),
                        domain=hr_domain,
                        severity=Severity.WARNING,
                        title="High absenteeism",
                        message=f"{hr.absent_count} of {hr.total_headcount} employees absent "
                        f"({hr.absenteeism_rate_pct}%).",
                        metric_label="Absenteeism rate",
                        metric_value=hr.absenteeism_rate_pct,
                        threshold_value=_ABSENTEEISM_ALERT_PCT,
                        detected_at=detected_at,
                    )
                )
            if hr.not_recorded_count > 0:
                alerts.append(
                    SmartAlert(
                        alert_id=_next_id(),
                        domain=hr_domain,
                        severity=Severity.INFO,
                        title="Missing attendance",
                        message=f"{hr.not_recorded_count} employee(s) have no attendance record.",
                        metric_label="Not recorded",
                        metric_value=float(hr.not_recorded_count),
                        threshold_value=0.0,
                        detected_at=detected_at,
                    )
                )

        if DataDomain.PRODUCTION in wanted:
            prod = ctx["production"]
            worst = min(prod.lines, key=lambda l: l.efficiency_pct, default=None)
            if worst is not None and worst.efficiency_pct < _EFFICIENCY_TARGET_PCT:
                alerts.append(
                    SmartAlert(
                        alert_id=_next_id(),
                        domain=DataDomain.PRODUCTION,
                        severity=Severity.CRITICAL if worst.efficiency_pct < 70 else Severity.WARNING,
                        title="Production below target",
                        message=f"{worst.line_name} ({worst.shift.value} shift) is at "
                        f"{worst.efficiency_pct}% efficiency.",
                        metric_label="Efficiency",
                        metric_value=worst.efficiency_pct,
                        threshold_value=_EFFICIENCY_TARGET_PCT,
                        entity_ref=worst.line_id,
                        detected_at=detected_at,
                    )
                )

        if DataDomain.INVENTORY in wanted:
            inv = ctx["inventory"]
            for item in inv.items:
                if item.needs_reorder:
                    alerts.append(
                        SmartAlert(
                            alert_id=_next_id(),
                            domain=DataDomain.INVENTORY,
                            severity=Severity.CRITICAL
                            if item.stock_status == StockStatus.OUT_OF_STOCK
                            else Severity.WARNING,
                            title="Low stock" if item.stock_status == StockStatus.LOW else "Out of stock",
                            message=f"{item.name} is at {item.quantity_on_hand} {item.unit_of_measure} "
                            f"(reorder level {item.reorder_level}).",
                            metric_label="Quantity on hand",
                            metric_value=item.quantity_on_hand,
                            threshold_value=item.reorder_level,
                            entity_ref=item.item_id,
                            detected_at=detected_at,
                        )
                    )

        if DataDomain.MAINTENANCE in wanted:
            maint = ctx["maintenance"]
            for m in maint.machines:
                if m.status == MachineStatus.BREAKDOWN:
                    alerts.append(
                        SmartAlert(
                            alert_id=_next_id(),
                            domain=DataDomain.MAINTENANCE,
                            severity=Severity.CRITICAL if m.criticality == Criticality.HIGH else Severity.WARNING,
                            title="Machine breakdown",
                            message=f"{m.machine_name} is in breakdown "
                            f"({m.failure_count_period} failure(s) this period).",
                            metric_label="Failures",
                            metric_value=float(m.failure_count_period),
                            entity_ref=m.machine_id,
                            detected_at=detected_at,
                        )
                    )
            for u in maint.upcoming_maintenance:
                if 0 <= u.days_until_due <= _MAINTENANCE_DUE_SOON_DAYS:
                    alerts.append(
                        SmartAlert(
                            alert_id=_next_id(),
                            domain=DataDomain.MAINTENANCE,
                            severity=Severity.INFO,
                            title="Maintenance due",
                            message=f"{u.machine_name} {u.maintenance_type} due in {u.days_until_due} day(s).",
                            metric_label="Days until due",
                            metric_value=float(u.days_until_due),
                            threshold_value=float(_MAINTENANCE_DUE_SOON_DAYS),
                            entity_ref=u.machine_id,
                            detected_at=detected_at,
                        )
                    )

        if DataDomain.FINANCE in wanted:
            fin = ctx["finance"]
            for inv in fin.invoices:
                if inv.status == InvoiceStatus.OVERDUE and inv.direction == InvoiceDirection.RECEIVABLE:
                    alerts.append(
                        SmartAlert(
                            alert_id=_next_id(),
                            domain=DataDomain.FINANCE,
                            severity=Severity.WARNING,
                            title="Overdue invoice",
                            message=f"Invoice {inv.invoice_id} ({inv.counterparty}) is "
                            f"{inv.days_overdue} day(s) overdue — {inv.currency} {inv.amount_outstanding:,.2f} outstanding.",
                            metric_label="Days overdue",
                            metric_value=float(inv.days_overdue),
                            threshold_value=0.0,
                            entity_ref=inv.invoice_id,
                            detected_at=detected_at,
                        )
                    )
            for line in fin.expense_breakdown:
                if line.is_over_budget:
                    alerts.append(
                        SmartAlert(
                            alert_id=_next_id(),
                            domain=DataDomain.FINANCE,
                            severity=Severity.INFO,
                            title="Budget overrun",
                            message=f"{line.category} is over budget by {line.variance_pct}%.",
                            metric_label=f"{line.category} variance",
                            metric_value=line.variance_pct or 0.0,
                            threshold_value=0.0,
                            detected_at=detected_at,
                        )
                    )

        if DataDomain.SALES in wanted:
            sales = ctx["sales"]
            if sales.overdue_count > 0:
                alerts.append(
                    SmartAlert(
                        alert_id=_next_id(),
                        domain=DataDomain.SALES,
                        severity=Severity.WARNING,
                        title="Overdue sales orders",
                        message=f"{sales.overdue_count} sales order(s) are past their promised delivery date.",
                        metric_label="Overdue orders",
                        metric_value=float(sales.overdue_count),
                        threshold_value=0.0,
                        detected_at=detected_at,
                    )
                )


        severity_rank = {Severity.CRITICAL: 0, Severity.WARNING: 1, Severity.INFO: 2}
        alerts.sort(key=lambda a: (severity_rank[a.severity], a.alert_id))
        return alerts

    async def fetch_pending_tasks(
        self, tenant_id: str, period: PeriodSpec, domains: list[DataDomain]
    ) -> list[PendingTask]:
        as_of = self._as_of(period)
        wanted = set(domains)
        tasks: list[PendingTask] = []

        if DataDomain.MAINTENANCE in wanted:
            maint = await self.fetch_maintenance(tenant_id, period)
            for u in sorted(maint.upcoming_maintenance, key=lambda x: x.days_until_due)[:2]:
                tasks.append(
                    PendingTask(
                        task_id=f"TASK-M-{u.machine_id}",
                        domain=DataDomain.MAINTENANCE,
                        title=f"{u.maintenance_type.capitalize()} maintenance for {u.machine_name}",
                        due_date=u.due_date,
                        is_overdue=u.days_until_due < 0,
                        assigned_to=u.assigned_to,
                    )
                )

        if DataDomain.PROCUREMENT in wanted:
            proc = await self.fetch_procurement(tenant_id, period)
            for po in proc.purchase_orders:
                if po.status == PurchaseOrderStatus.APPROVED:
                    tasks.append(
                        PendingTask(
                            task_id=f"TASK-P-{po.po_number}",
                            domain=DataDomain.PROCUREMENT,
                            title=f"Place approved purchase order {po.po_number} ({po.supplier})",
                            due_date=po.expected_delivery_date,
                            is_overdue=po.days_late > 0,
                        )
                    )

        if DataDomain.HR in wanted or DataDomain.ATTENDANCE in wanted:
            hr = await self.fetch_hr(tenant_id, period)
            if hr.employees_on_overtime > 0:
                tasks.append(
                    PendingTask(
                        task_id="TASK-H-overtime",
                        domain=DataDomain.HR,
                        title=f"Review {hr.employees_on_overtime} overtime request(s)",
                        due_date=as_of + timedelta(days=2),
                        is_overdue=False,
                    )
                )

        return tasks


def _production_status(efficiency_pct: float) -> ProductionStatus:
    if efficiency_pct >= 100:
        return ProductionStatus.AHEAD
    if efficiency_pct >= _EFFICIENCY_TARGET_PCT:
        return ProductionStatus.ON_TARGET
    if efficiency_pct >= 70:
        return ProductionStatus.BELOW_TARGET
    return ProductionStatus.HALTED


def _direction(current: float, previous: float) -> TrendDirection:
    if current > previous:
        return TrendDirection.UP
    if current < previous:
        return TrendDirection.DOWN
    return TrendDirection.FLAT
