import type {
  AiDataDomain,
  AiLanguage,
  AiSeverity,
  AiTrendDirection,
  AiProductionStatus,
  AiStockStatus,
} from '@rona/types/ai';

export interface CanonicalContextBase {
  tenantId: string;
  domain: AiDataDomain;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: Date;
  sourceSystem: string;
  recordCountTruncated: boolean;
}

export interface TrendComparison {
  metricLabel: string;
  currentValue: number;
  previousValue: number;
  changePct: number;
  direction: AiTrendDirection;
  previousPeriodLabel: string;
}

export interface PendingTask {
  taskId: string;
  domain: AiDataDomain;
  title: string;
  dueDate: string | null;
  isOverdue: boolean;
  assignedTo: string | null;
}

export interface SmartAlert {
  alertId: string;
  domain: AiDataDomain;
  severity: AiSeverity;
  title: string;
  message: string;
  metricLabel: string;
  metricValue: number;
  thresholdValue: number | null;
  entityRef: string | null;
  detectedAt: Date;
}

export interface PeriodSpec {
  start: string;
  end: string;
  label: string;
  previousStart: string | null;
  previousEnd: string | null;
  previousLabel: string | null;
}

export type ShiftName = 'morning' | 'afternoon' | 'night';
export type AttendanceStatus =
  'present' | 'absent' | 'late' | 'on_leave' | 'half_day' | 'not_recorded';

export interface EmployeeAttendanceRecord {
  employeeId: string;
  fullName: string;
  department: string;
  position: string;
  productionLine: string | null;
  shift: ShiftName;
  status: AttendanceStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  lateMinutes: number;
  overtimeHours: number;
  absenceReason: string | null;
}

export interface AttendanceRollup {
  groupName: string;
  headcount: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  absenteeismRatePct: number;
  totalOvertimeHours: number;
}

export interface HRContext extends CanonicalContextBase {
  domain: 'hr';
  totalHeadcount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  onLeaveCount: number;
  notRecordedCount: number;
  attendanceRatePct: number;
  absenteeismRatePct: number;
  totalOvertimeHours: number;
  employeesOnOvertime: number;
  records: EmployeeAttendanceRecord[];
  byDepartment: AttendanceRollup[];
  byProductionLine: AttendanceRollup[];
  trends: TrendComparison[];
}

export interface ProductionLineRecord {
  lineId: string;
  lineName: string;
  product: string;
  shift: ShiftName;
  targetUnits: number;
  producedUnits: number;
  rejectedUnits: number;
  efficiencyPct: number;
  downtimeMinutes: number;
  operatorsAssigned: number;
  status: AiProductionStatus;
  blockingMachineId: string | null;
}

export interface ShiftProductionRollup {
  shift: ShiftName;
  targetUnits: number;
  producedUnits: number;
  efficiencyPct: number;
}

export interface ProductionContext extends CanonicalContextBase {
  domain: 'production';
  totalTargetUnits: number;
  totalProducedUnits: number;
  totalRejectedUnits: number;
  overallEfficiencyPct: number;
  targetAchievementPct: number;
  rejectRatePct: number;
  totalDowntimeMinutes: number;
  overallStatus: AiProductionStatus;
  lines: ProductionLineRecord[];
  byShift: ShiftProductionRollup[];
  underperformingLineIds: string[];
  trends: TrendComparison[];
}

export interface InventoryItemRecord {
  itemId: string;
  sku: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  quantityOnHand: number;
  reorderLevel: number;
  quantityOnOrder: number;
  unitCost: number;
  totalValue: number;
  monthlyConsumption: number;
  daysOfCover: number | null;
  lastMovementDate: string | null;
  warehouseLocation: string | null;
  stockStatus: AiStockStatus;
  needsReorder: boolean;
}

export interface InventoryContext extends CanonicalContextBase {
  domain: 'inventory';
  currency: string;
  totalSkuCount: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockedCount: number;
  slowMovingCount: number;
  slowMovingValue: number;
  quarantinedLotCount: number;
  items: InventoryItemRecord[];
  reservations: StockReservationRecord[];
  reorderRecommendations: string[];
  trends: TrendComparison[];
}

export interface StockReservationRecord {
  reservationId: string;
  itemSku: string;
  itemName: string;
  warehouse: string;
  quantity: number;
  status: string;
  reference: string | null;
  createdAt: string;
}

export type InvoiceDirection = 'receivable' | 'payable';
export type InvoiceStatus =
  'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceRecord {
  invoiceId: string;
  counterparty: string;
  direction: InvoiceDirection;
  amount: number;
  amountPaid: number;
  amountOutstanding: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  daysOverdue: number;
  status: InvoiceStatus;
}

export interface ExpenseLine {
  category: string;
  amount: number;
  budgetAmount: number | null;
  variancePct: number | null;
  isOverBudget: boolean;
}

export interface PayrollSummary {
  periodLabel: string;
  employeeCount: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  overtimeCost: number;
  currency: string;
  dueDate: string | null;
  isPaid: boolean;
}

export interface FinanceContext extends CanonicalContextBase {
  domain: 'finance';
  currency: string;
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  profitMarginPct: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  overdueReceivables: number;
  overdueInvoiceCount: number;
  expenseBreakdown: ExpenseLine[];
  invoices: InvoiceRecord[];
  payroll: PayrollSummary | null;
  trends: TrendComparison[];
}

export type SalesOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface SalesOrderRecord {
  orderId: string;
  customer: string;
  productSummary: string;
  quantity: number;
  totalValue: number;
  currency: string;
  orderDate: string;
  promisedDeliveryDate: string | null;
  daysLate: number;
  status: SalesOrderStatus;
}

export interface ProductSalesRollup {
  product: string;
  unitsSold: number;
  revenue: number;
}

export interface SalesContext extends CanonicalContextBase {
  domain: 'sales';
  currency: string;
  totalOrderCount: number;
  totalRevenue: number;
  fulfilledCount: number;
  pendingCount: number;
  overdueCount: number;
  orders: SalesOrderRecord[];
  customers: CustomerRecord[];
  topProducts: ProductSalesRollup[];
  trends: TrendComparison[];
}

export interface CustomerRecord {
  customerId: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  salesperson: string | null;
}

export type InspectionOutcome = 'passed' | 'failed' | 'released' | 'rejected';

export interface InspectionRecord {
  inspectionId: string;
  itemType: string;
  lotNumber: string | null;
  status: 'in_progress' | 'completed' | 'reviewed';
  testsTotal: number;
  testsPassed: number;
  testsFailed: number;
  outcome: InspectionOutcome | null;
}

export interface QualityContext extends CanonicalContextBase {
  domain: 'quality';
  totalInspectionCount: number;
  inProgressCount: number;
  completedCount: number;
  reviewedCount: number;
  passRatePct: number;
  rejectedLotCount: number;
  inspections: InspectionRecord[];
  trends: TrendComparison[];
}

export interface OrganizationMemberRecord {
  userId: string;
  fullName: string;
  email: string;
  membershipStatus: string;
  roles: string[];
}

export interface DepartmentRecord {
  name: string;
  code: string | null;
  headcount: number;
}

export interface PositionRecord {
  title: string;
  code: string;
  department: string | null;
}

export interface OrganizationContext extends CanonicalContextBase {
  domain: 'organization';
  totalMemberCount: number;
  activeMemberCount: number;
  suspendedMemberCount: number;
  totalRoleCount: number;
  departmentCount: number;
  branchCount: number;
  members: OrganizationMemberRecord[];
  departments: DepartmentRecord[];
  positions: PositionRecord[];
  branches: string[];
}

export interface BomComponentRecord {
  component: string;
  quantityPerUnit: string;
  unitOfMeasure: string;
}

export interface BomRecord {
  bomId: string;
  code: string;
  name: string;
  finishedItem: string;
  latestVersion: string;
  status: 'DRAFT' | 'APPROVED' | 'RETIRED';
  componentCount: number;
  components: BomComponentRecord[];
}

export interface BomContext extends CanonicalContextBase {
  domain: 'bom';
  totalBomCount: number;
  activeBomCount: number;
  approvedCount: number;
  draftCount: number;
  boms: BomRecord[];
}

export type CanonicalContext =
  | HRContext
  | ProductionContext
  | InventoryContext
  | QualityContext
  | FinanceContext
  | SalesContext
  | OrganizationContext
  | BomContext;

export interface RonaContextBundle {
  tenantId: string;
  tenantName: string | null;
  userRole: string;
  language: AiLanguage;
  grantedDomains: AiDataDomain[];
  deniedDomains: AiDataDomain[];
  period: PeriodSpec;
  generatedAt: Date;
  failedDomains: AiDataDomain[];
  hr: HRContext | null;
  production: ProductionContext | null;
  inventory: InventoryContext | null;
  quality: QualityContext | null;
  finance: FinanceContext | null;
  sales: SalesContext | null;
  organization: OrganizationContext | null;
  bom: BomContext | null;
  alerts: SmartAlert[];
  pendingTasks: PendingTask[];
}
