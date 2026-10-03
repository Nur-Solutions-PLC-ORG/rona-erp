import type { AiReportType } from '@rona/types/ai';
import type {
  DocumentBuilder,
  DocumentParts,
  ReportTable,
} from './report-models.js';

const money = (currency: string, value: number) =>
  `${currency} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const buildAttendanceDocument: DocumentBuilder = (
  bundle,
): DocumentParts => {
  const hr = bundle.hr;
  if (!hr) throw new Error('Attendance data is not available for this report');

  const summary: Array<[string, string]> = [
    ['Total headcount', String(hr.totalHeadcount)],
    ['Present', String(hr.presentCount)],
    ['Late', String(hr.lateCount)],
    ['Absent', String(hr.absentCount)],
    ['On leave', String(hr.onLeaveCount)],
    ['Not recorded', String(hr.notRecordedCount)],
    ['Attendance rate', `${hr.attendanceRatePct}%`],
    ['Absenteeism rate', `${hr.absenteeismRatePct}%`],
    ['Total overtime', `${hr.totalOvertimeHours} h`],
  ];

  const byEmployee: ReportTable = {
    name: 'Attendance by Employee',
    columns: [
      'Employee',
      'Department',
      'Shift',
      'Status',
      'Late (min)',
      'Overtime (h)',
      'Reason',
    ],
    aligns: ['left', 'left', 'left', 'left', 'right', 'right', 'left'],
    rows: hr.records.map((r) => [
      r.fullName,
      r.department,
      r.shift,
      r.status,
      r.lateMinutes,
      r.overtimeHours,
      r.absenceReason ?? 'N/A',
    ]),
  };
  const byDept: ReportTable = {
    name: 'By Department',
    columns: [
      'Department',
      'Headcount',
      'Present',
      'Late',
      'Absent',
      'On leave',
      'Absenteeism %',
      'Overtime (h)',
    ],
    aligns: [
      'left',
      'right',
      'right',
      'right',
      'right',
      'right',
      'right',
      'right',
    ],
    rows: hr.byDepartment.map((r) => [
      r.groupName,
      r.headcount,
      r.present,
      r.late,
      r.absent,
      r.onLeave,
      r.absenteeismRatePct,
      r.totalOvertimeHours,
    ]),
  };
  return ['Attendance Report', summary, [byEmployee, byDept]];
};

export const buildProductionDocument: DocumentBuilder = (
  bundle,
): DocumentParts => {
  const prod = bundle.production;
  if (!prod)
    throw new Error('Production data is not available for this report');

  const summary: Array<[string, string]> = [
    ['Target units', String(prod.totalTargetUnits)],
    ['Produced units', String(prod.totalProducedUnits)],
    ['Rejected units', String(prod.totalRejectedUnits)],
    ['Overall efficiency', `${prod.overallEfficiencyPct}%`],
    ['Reject rate', `${prod.rejectRatePct}%`],
    ['Downtime', `${prod.totalDowntimeMinutes} min`],
    ['Status', prod.overallStatus],
  ];

  const lines: ReportTable = {
    name: 'Production Lines',
    columns: [
      'Line',
      'Shift',
      'Product',
      'Target',
      'Produced',
      'Rejected',
      'Efficiency %',
      'Status',
    ],
    aligns: [
      'left',
      'left',
      'left',
      'right',
      'right',
      'right',
      'right',
      'left',
    ],
    rows: prod.lines.map((l) => [
      l.lineName,
      l.shift,
      l.product,
      l.targetUnits,
      l.producedUnits,
      l.rejectedUnits,
      l.efficiencyPct,
      l.status,
    ]),
  };
  const byShift: ReportTable = {
    name: 'By Shift',
    columns: ['Shift', 'Target', 'Produced', 'Efficiency %'],
    aligns: ['left', 'right', 'right', 'right'],
    rows: prod.byShift.map((s) => [
      s.shift,
      s.targetUnits,
      s.producedUnits,
      s.efficiencyPct,
    ]),
  };
  return ['Production Report', summary, [lines, byShift]];
};

export const buildInventoryDocument: DocumentBuilder = (
  bundle,
): DocumentParts => {
  const inv = bundle.inventory;
  if (!inv) throw new Error('Inventory data is not available for this report');

  const summary: Array<[string, string]> = [
    ['Total SKUs', String(inv.totalSkuCount)],
    ['Total inventory value', money(inv.currency, inv.totalInventoryValue)],
    ['Low stock', String(inv.lowStockCount)],
    ['Out of stock', String(inv.outOfStockCount)],
    ['Overstocked', String(inv.overstockedCount)],
    ['Slow-moving', String(inv.slowMovingCount)],
    ['Slow-moving value', money(inv.currency, inv.slowMovingValue)],
  ];

  const items: ReportTable = {
    name: 'Inventory Valuation',
    columns: [
      'SKU',
      'Name',
      'Category',
      'On hand',
      'UoM',
      'Reorder',
      'Unit cost',
      'Total value',
      'Status',
      'Reorder?',
    ],
    aligns: [
      'left',
      'left',
      'left',
      'right',
      'left',
      'right',
      'right',
      'right',
      'left',
      'left',
    ],
    rows: inv.items.map((i) => [
      i.sku,
      i.name,
      i.category,
      i.quantityOnHand,
      i.unitOfMeasure,
      i.reorderLevel,
      i.unitCost,
      i.totalValue,
      i.stockStatus,
      i.needsReorder ? 'yes' : 'no',
    ]),
  };
  return ['Inventory Valuation Report', summary, [items]];
};

export const buildFinanceDocument: DocumentBuilder = (
  bundle,
): DocumentParts => {
  const fin = bundle.finance;
  if (!fin) throw new Error('Finance data is not available for this report');

  const cur = fin.currency;
  const summary: Array<[string, string]> = [
    ['Revenue', money(cur, fin.revenue)],
    ['Expenses', money(cur, fin.expenses)],
    ['Gross profit', money(cur, fin.grossProfit)],
    ['Net profit', money(cur, fin.netProfit)],
    ['Profit margin', `${fin.profitMarginPct}%`],
    ['Outstanding receivables', money(cur, fin.outstandingReceivables)],
    ['Overdue receivables', money(cur, fin.overdueReceivables)],
    ['Overdue invoices', String(fin.overdueInvoiceCount)],
  ];

  const invoices: ReportTable = {
    name: 'Invoices',
    columns: [
      'Invoice',
      'Counterparty',
      'Direction',
      'Amount',
      'Paid',
      'Outstanding',
      'Issued',
      'Due',
      'Days overdue',
      'Status',
    ],
    aligns: [
      'left',
      'left',
      'left',
      'right',
      'right',
      'right',
      'left',
      'left',
      'right',
      'left',
    ],
    rows: fin.invoices.map((inv) => [
      inv.invoiceId,
      inv.counterparty,
      inv.direction,
      inv.amount,
      inv.amountPaid,
      inv.amountOutstanding,
      inv.issueDate,
      inv.dueDate,
      inv.daysOverdue,
      inv.status,
    ]),
  };
  const expenses: ReportTable = {
    name: 'Expense Breakdown',
    columns: ['Category', 'Amount', 'Over budget?'],
    aligns: ['left', 'right', 'left'],
    rows: fin.expenseBreakdown.map((e) => [
      e.category,
      e.amount,
      e.isOverBudget ? 'yes' : 'no',
    ]),
  };
  return ['Finance Report', summary, [invoices, expenses]];
};

export const buildManagementDocument: DocumentBuilder = (
  bundle,
): DocumentParts => {
  const summary: Array<[string, string]> = [];
  if (bundle.hr) {
    summary.push(['Attendance rate', `${bundle.hr.attendanceRatePct}%`]);
    summary.push(['Absent', String(bundle.hr.absentCount)]);
  }
  if (bundle.production) {
    summary.push([
      'Production efficiency',
      `${bundle.production.overallEfficiencyPct}%`,
    ]);
  }
  if (bundle.inventory) {
    summary.push([
      'Inventory value',
      money(bundle.inventory.currency, bundle.inventory.totalInventoryValue),
    ]);
    summary.push([
      'Low / out of stock',
      `${bundle.inventory.lowStockCount} / ${bundle.inventory.outOfStockCount}`,
    ]);
  }
  if (bundle.finance) {
    summary.push([
      'Net profit',
      money(bundle.finance.currency, bundle.finance.netProfit),
    ]);
  }
  if (bundle.quality) {
    summary.push(['Quality pass rate', `${bundle.quality.passRatePct}%`]);
  }
  if (bundle.sales) {
    summary.push([
      'Sales revenue',
      money(bundle.sales.currency, bundle.sales.totalRevenue),
    ]);
  }
  if (!summary.length) {
    throw new Error('No data available for a management summary');
  }

  const tables: ReportTable[] = [];
  const drillDowns: Array<[unknown, DocumentBuilder]> = [
    [bundle.hr, buildAttendanceDocument],
    [bundle.production, buildProductionDocument],
    [bundle.inventory, buildInventoryDocument],
    [bundle.quality, buildQualityDocument],
    [bundle.sales, buildSalesDocument],
    [bundle.finance, buildFinanceDocument],
  ];
  for (const [payload, builder] of drillDowns) {
    if (payload == null) continue;
    const [, , detailTables] = builder(bundle);
    tables.push(...detailTables);
  }

  if (bundle.alerts.length) {
    tables.push({
      name: 'Alerts',
      columns: ['Severity', 'Module', 'Title', 'Message', 'Detected'],
      aligns: ['left', 'left', 'left', 'left', 'left'],
      rows: bundle.alerts.map((a) => [
        a.severity,
        a.domain,
        a.title,
        a.message,
        a.detectedAt.toISOString(),
      ]),
    });
  }
  if (bundle.pendingTasks.length) {
    tables.push({
      name: 'Pending Tasks',
      columns: ['Module', 'Task', 'Due date', 'Overdue?'],
      aligns: ['left', 'left', 'left', 'left'],
      rows: bundle.pendingTasks.map((t) => [
        t.domain,
        t.title,
        t.dueDate ?? 'N/A',
        t.isOverdue ? 'yes' : 'no',
      ]),
    });
  }

  return ['Management Summary', summary, tables];
};

export const buildQualityDocument: DocumentBuilder = (
  bundle,
): DocumentParts => {
  const quality = bundle.quality;
  if (!quality)
    throw new Error('Quality data is not available for this report');

  const summary: Array<[string, string]> = [
    ['Total inspections', String(quality.totalInspectionCount)],
    ['In progress', String(quality.inProgressCount)],
    ['Completed', String(quality.completedCount)],
    ['Reviewed', String(quality.reviewedCount)],
    ['Reviewed pass rate', `${quality.passRatePct}%`],
    ['Rejected lots', String(quality.rejectedLotCount)],
  ];

  const inspections: ReportTable = {
    name: 'Inspections',
    columns: [
      'Inspection',
      'Item',
      'Lot',
      'Status',
      'Tests passed',
      'Tests failed',
      'Outcome',
    ],
    aligns: ['left', 'left', 'left', 'left', 'right', 'right', 'left'],
    rows: quality.inspections.map((inspection) => [
      inspection.inspectionId,
      inspection.itemType,
      inspection.lotNumber ?? 'N/A',
      inspection.status,
      inspection.testsPassed,
      inspection.testsFailed,
      inspection.outcome ?? 'N/A',
    ]),
  };
  return ['Quality Report', summary, [inspections]];
};

export const buildSalesDocument: DocumentBuilder = (bundle): DocumentParts => {
  const sales = bundle.sales;
  if (!sales) throw new Error('Sales data is not available for this report');

  const summary: Array<[string, string]> = [
    ['Total orders', String(sales.totalOrderCount)],
    ['Revenue', money(sales.currency, sales.totalRevenue)],
    ['Fulfilled', String(sales.fulfilledCount)],
    ['Pending', String(sales.pendingCount)],
    ['Overdue', String(sales.overdueCount)],
  ];

  const tables: ReportTable[] = [
    {
      name: 'Sales Orders',
      columns: [
        'Order',
        'Customer',
        'Products',
        'Quantity',
        'Status',
        'Order date',
        'Days late',
        'Amount',
      ],
      aligns: [
        'left',
        'left',
        'left',
        'right',
        'left',
        'left',
        'right',
        'right',
      ],
      rows: sales.orders.map((order) => [
        order.orderId,
        order.customer,
        order.productSummary,
        order.quantity,
        order.status,
        order.orderDate,
        order.daysLate,
        order.totalValue,
      ]),
    },
  ];

  if (sales.topProducts.length) {
    tables.push({
      name: 'Top Products',
      columns: ['Product', 'Units sold', 'Revenue'],
      aligns: ['left', 'right', 'right'],
      rows: sales.topProducts.map((product) => [
        product.product,
        product.unitsSold,
        product.revenue,
      ]),
    });
  }

  if (sales.customers.length) {
    tables.push({
      name: 'Customers',
      columns: ['Customer', 'Phone', 'Email', 'Status', 'Salesperson'],
      aligns: ['left', 'left', 'left', 'left', 'left'],
      rows: sales.customers.map((customer) => [
        customer.name,
        customer.phone ?? 'N/A',
        customer.email ?? 'N/A',
        customer.status,
        customer.salesperson ?? 'N/A',
      ]),
    });
  }

  return ['Sales Report', summary, tables];
};

export const DOCUMENT_BUILDERS: Record<AiReportType, DocumentBuilder> = {
  attendance: buildAttendanceDocument,
  production: buildProductionDocument,
  inventory_valuation: buildInventoryDocument,
  quality: buildQualityDocument,
  sales: buildSalesDocument,
  finance: buildFinanceDocument,
  management_summary: buildManagementDocument,
};
