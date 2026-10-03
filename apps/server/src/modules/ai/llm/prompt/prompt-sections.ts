import { PROMPT_MAX_ROWS, formatMoney } from './prompt-header.js';
import type { RonaContextBundle } from '../../types/ai-contexts.types.js';

export function hrSection(hr: NonNullable<RonaContextBundle['hr']>): string[] {
  const lines = [
    '\nHR & ATTENDANCE',
    `Headcount: ${hr.totalHeadcount} | present: ${hr.presentCount} | late: ${hr.lateCount} | absent: ${hr.absentCount} | on leave: ${hr.onLeaveCount} | not recorded: ${hr.notRecordedCount}`,
    `Attendance rate: ${hr.attendanceRatePct}% | absenteeism: ${hr.absenteeismRatePct}%`,
    `Overtime: ${hr.totalOvertimeHours}h across ${hr.employeesOnOvertime} employee(s)`,
  ];

  if (hr.byDepartment.length) {
    lines.push(
      'By department: ' +
        hr.byDepartment
          .map(
            (r) =>
              `${r.groupName} (present ${r.present}/${r.headcount}, absent ${r.absent})`,
          )
          .join('; '),
    );
  }

  if (hr.records.length) {
    lines.push('Attendance records:');
    for (const record of hr.records.slice(0, PROMPT_MAX_ROWS)) {
      let detail = record.status;
      if (record.status === 'late') detail += ` by ${record.lateMinutes} min`;
      else if (record.absenceReason) detail += ` (${record.absenceReason})`;
      if (record.checkInTime) detail += `, clocked in at ${record.checkInTime}`;
      if (record.checkOutTime)
        detail += `, clocked out at ${record.checkOutTime}`;
      const suffix = record.productionLine ? `/${record.productionLine}]` : ']';
      lines.push(
        `  - ${record.fullName} [${record.department}${suffix}: ${detail}`,
      );
    }
  }
  return lines;
}

export function productionSection(
  prod: NonNullable<RonaContextBundle['production']>,
): string[] {
  const lines = [
    '\nPRODUCTION',
    `Target: ${prod.totalTargetUnits} units | produced: ${prod.totalProducedUnits} | rejected: ${prod.totalRejectedUnits}`,
    `Overall efficiency: ${prod.overallEfficiencyPct}% (status: ${prod.overallStatus}) | reject rate: ${prod.rejectRatePct}% | downtime: ${prod.totalDowntimeMinutes} min`,
  ];

  if (prod.byShift.length) {
    lines.push(
      'By shift: ' +
        prod.byShift
          .map(
            (s) =>
              `${s.shift} ${s.producedUnits}/${s.targetUnits} (${s.efficiencyPct}%)`,
          )
          .join('; '),
    );
  }

  if (prod.lines.length) {
    lines.push('Lines:');
    for (const line of prod.lines.slice(0, PROMPT_MAX_ROWS)) {
      const note = line.blockingMachineId
        ? `, blocked by ${line.blockingMachineId}`
        : '';
      lines.push(
        `  - ${line.lineName} (${line.shift}, ${line.product}): ${line.producedUnits}/${line.targetUnits} units, ${line.efficiencyPct}% [${line.status}], downtime ${line.downtimeMinutes} min${note}`,
      );
    }
  }
  return lines;
}

export function inventorySection(
  inv: NonNullable<RonaContextBundle['inventory']>,
): string[] {
  const lines = [
    '\nINVENTORY',
    `SKUs: ${inv.totalSkuCount} | total value: ${inv.currency} ${formatMoney(inv.totalInventoryValue)}`,
    `Low: ${inv.lowStockCount} | out of stock: ${inv.outOfStockCount} | overstocked: ${inv.overstockedCount} | slow-moving: ${inv.slowMovingCount} | quarantined lots: ${inv.quarantinedLotCount}`,
  ];

  if (inv.reservations.length) {
    lines.push('Reservations (holding stock aside):');
    for (const reservation of inv.reservations.slice(0, PROMPT_MAX_ROWS)) {
      lines.push(
        `  - ${reservation.itemName} (${reservation.itemSku}): ${reservation.quantity} in ${reservation.warehouse} [${reservation.status}]${reservation.reference ? `, ref ${reservation.reference}` : ''}`,
      );
    }
  }

  const ATTENTION = ['low', 'out_of_stock', 'overstocked'];
  const notable = inv.items
    .filter((i) => i.needsReorder || ATTENTION.includes(i.stockStatus))
    .sort((a, b) => (a.daysOfCover ?? 1e9) - (b.daysOfCover ?? 1e9));

  if (notable.length) {
    lines.push('Items needing attention:');
    for (const item of notable.slice(0, PROMPT_MAX_ROWS)) {
      const cover =
        item.daysOfCover != null ? `, ${item.daysOfCover}d cover` : '';
      lines.push(
        `  - ${item.name} (${item.sku}): ${item.quantityOnHand} ${item.unitOfMeasure} on hand, reorder at ${item.reorderLevel} [${item.stockStatus}]${cover}`,
      );
    }
  }
  return lines;
}

export function qualitySection(
  quality: NonNullable<RonaContextBundle['quality']>,
): string[] {
  const lines = [
    '\nQUALITY',
    `Inspections: ${quality.totalInspectionCount} total | in progress: ${quality.inProgressCount} | completed: ${quality.completedCount} | reviewed: ${quality.reviewedCount}`,
    `Reviewed pass rate: ${quality.passRatePct}% | rejected lots: ${quality.rejectedLotCount}`,
  ];

  const needsAttention = quality.inspections.filter(
    (inspection) =>
      inspection.status !== 'reviewed' || inspection.testsFailed > 0,
  );
  if (needsAttention.length) {
    lines.push('Inspections needing attention:');
    for (const inspection of needsAttention.slice(0, PROMPT_MAX_ROWS)) {
      const detail =
        inspection.status === 'in_progress'
          ? 'still in progress'
          : inspection.status === 'completed'
            ? 'completed, awaiting QA review'
            : `${inspection.testsFailed}/${inspection.testsTotal} test(s) failed`;
      lines.push(
        `  - ${inspection.inspectionId} (${inspection.itemType}${inspection.lotNumber ? `, lot ${inspection.lotNumber}` : ''}): ${detail}`,
      );
    }
  }
  return lines;
}

export function financeSection(
  fin: NonNullable<RonaContextBundle['finance']>,
): string[] {
  const lines = [
    '\nFINANCE',
    `Revenue: ${fin.currency} ${formatMoney(fin.revenue)} | expenses: ${fin.currency} ${formatMoney(fin.expenses)} | net profit: ${fin.currency} ${formatMoney(fin.netProfit)} (margin ${fin.profitMarginPct}%)`,
    `Outstanding receivables: ${fin.currency} ${formatMoney(fin.outstandingReceivables)} | overdue receivables: ${fin.currency} ${formatMoney(fin.overdueReceivables)} across ${fin.overdueInvoiceCount} invoice(s)`,
  ];

  if (fin.expenseBreakdown.length) {
    lines.push(
      'Expense breakdown: ' +
        fin.expenseBreakdown
          .map(
            (e) =>
              `${e.category} ${fin.currency} ${formatMoney(e.amount)}` +
              (e.isOverBudget ? ` (over budget ${e.variancePct}%)` : ''),
          )
          .join('; '),
    );
  }

  if (fin.invoices.length) {
    lines.push('Invoices:');
    for (const inv of fin.invoices.slice(0, PROMPT_MAX_ROWS)) {
      const balance = `${inv.currency} ${formatMoney(inv.amountOutstanding)} outstanding of ${formatMoney(inv.amount)} total`;
      const when =
        inv.status === 'overdue'
          ? `, ${inv.daysOverdue} day(s) overdue`
          : inv.status === 'draft'
            ? ', not yet issued'
            : '';
      lines.push(
        `  - ${inv.invoiceId} (${inv.counterparty}, ${inv.direction}): ${balance} [${inv.status}], issue ${inv.issueDate}, due ${inv.dueDate}${when}`,
      );
    }
  }

  if (fin.payroll) {
    lines.push(
      `Payroll (${fin.payroll.periodLabel}): net ${fin.currency} ${formatMoney(fin.payroll.netPay)} for ${fin.payroll.employeeCount} employees, ${fin.payroll.isPaid ? 'paid' : 'unpaid'}`,
    );
  }
  return lines;
}

export function salesSection(
  sales: NonNullable<RonaContextBundle['sales']>,
): string[] {
  const lines = [
    '\nSALES',
    `Orders: ${sales.totalOrderCount} | revenue: ${sales.currency} ${formatMoney(sales.totalRevenue)} | fulfilled: ${sales.fulfilledCount} | pending: ${sales.pendingCount} | overdue: ${sales.overdueCount}`,
  ];

  if (sales.customers.length) {
    lines.push(
      'Customers: ' +
        sales.customers
          .slice(0, PROMPT_MAX_ROWS)
          .map(
            (c) =>
              `${c.name} (${c.status})${
                c.salesperson ? `, ${c.salesperson}` : ''
              }`,
          )
          .join('; '),
    );
  }

  if (sales.topProducts.length) {
    lines.push(
      'Top products: ' +
        sales.topProducts
          .slice(0, 5)
          .map(
            (tp) =>
              `${tp.product} (${tp.unitsSold} units, ${sales.currency} ${formatMoney(tp.revenue)})`,
          )
          .join('; '),
    );
  }

  if (sales.orders.length) {
    lines.push('Orders (newest first):');
    for (const order of sales.orders.slice(0, PROMPT_MAX_ROWS)) {
      const delivery =
        order.daysLate > 0
          ? `, ${order.daysLate} day(s) late`
          : `, promised ${order.promisedDeliveryDate ?? 'n/a'}`;
      lines.push(
        `  - ${order.orderId} (${order.customer}, ${order.productSummary}): ${order.currency} ${formatMoney(order.totalValue)} [${order.status}], ordered ${order.orderDate}${delivery}`,
      );
    }
  }
  return lines;
}

export function organizationSection(
  org: NonNullable<RonaContextBundle['organization']>,
): string[] {
  const lines = [
    '\nORGANIZATION',
    `Members: ${org.activeMemberCount} active of ${org.totalMemberCount} (${org.suspendedMemberCount} suspended) | roles used: ${org.totalRoleCount}`,
    `Departments: ${org.departmentCount} | branches: ${org.branchCount} | positions: ${org.positions.length}`,
  ];

  if (org.members.length) {
    lines.push('Members:');
    for (const member of org.members.slice(0, PROMPT_MAX_ROWS)) {
      lines.push(
        `  - ${member.fullName} (${member.email}): ${
          member.roles.join(', ') || member.membershipStatus
        } [${member.membershipStatus}]`,
      );
    }
  }

  if (org.departments.length) {
    lines.push(
      'Departments: ' +
        org.departments
          .map((d) => `${d.name} (${d.headcount} employee(s))`)
          .join('; '),
    );
  }
  if (org.positions.length) {
    lines.push(
      'Positions: ' +
        org.positions
          .slice(0, PROMPT_MAX_ROWS)
          .map((p) => `${p.title}${p.department ? ` (${p.department})` : ''}`)
          .join('; '),
    );
  }
  if (org.branches.length) {
    lines.push('Branches: ' + org.branches.join(', '));
  }
  return lines;
}

export function bomSection(
  bom: NonNullable<RonaContextBundle['bom']>,
): string[] {
  const lines = [
    '\nBILL OF MATERIALS',
    `BOMs: ${bom.totalBomCount} active | approved: ${bom.approvedCount} | draft: ${bom.draftCount}`,
  ];

  for (const record of bom.boms.slice(0, PROMPT_MAX_ROWS)) {
    const components = record.components.length
      ? record.components
          .map(
            (c) =>
              `${c.component} x${c.quantityPerUnit}${c.unitOfMeasure ? ` ${c.unitOfMeasure}` : ''}`,
          )
          .join('; ')
      : 'no components';
    lines.push(
      `  - ${record.code} ${record.name} -> ${record.finishedItem} (v${record.latestVersion}, [${record.status}], ${record.componentCount} component(s)): ${components}`,
    );
  }
  return lines;
}
