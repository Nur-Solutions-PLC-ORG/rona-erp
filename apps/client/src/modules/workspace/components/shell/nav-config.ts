import type { Permission } from "@rona/types/tenancy";
import {
  CLIENT_ASSISTANT_PAGE,
  CLIENT_ATTENDANCE_PAGE,
  CLIENT_AUDIT_PAGE,
  CLIENT_BATCHES_PAGE,
  CLIENT_BOMS_PAGE,
  CLIENT_COSTS_PAGE,
  CLIENT_CUSTOMERS_PAGE,
  CLIENT_DASHBOARD_PAGE,
  CLIENT_DEPARTMENTS_PAGE,
  CLIENT_EMPLOYEES_PAGE,
  CLIENT_INSPECTIONS_PAGE,
  CLIENT_INVOICES_PAGE,
  CLIENT_ITEMS_PAGE,
  CLIENT_KIOSKS_PAGE,
  CLIENT_LOTS_PAGE,
  CLIENT_MEMBERS_PAGE,
  CLIENT_MOVEMENTS_PAGE,
  CLIENT_ORGANIZATION_PAGE,
  CLIENT_PAYMENTS_PAGE,
  CLIENT_POSITIONS_PAGE,
  CLIENT_PRODUCTION_ORDERS_PAGE,
  CLIENT_RESERVATIONS_PAGE,
  CLIENT_ROLES_PAGE,
  CLIENT_SALES_COMMISSIONS_PAGE,
  CLIENT_SALES_ORDERS_PAGE,
  CLIENT_SHIFTS_PAGE,
  CLIENT_STOCK_PAGE,
  CLIENT_TRACEABILITY_PAGE,
  CLIENT_WAREHOUSES_PAGE,
} from "@rona/routes/workspace";

export interface NavItem {
  label: string;
  href: string;
  permission: Permission;
  anyOf?: Permission[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: CLIENT_DASHBOARD_PAGE,
        permission: "organization.read",
      },
      {
        label: "Rona AI",
        href: CLIENT_ASSISTANT_PAGE,
        permission: "organization.read",
        anyOf: [
          "hr.employee.read",
          "hr.attendance.read",
          "manufacturing.production.read",
          "inventory.stock.read",
          "quality.inspection.read",
          "finance.invoice.read",
          "sales.order.read",
          "membership.read",
          "manufacturing.bom.read",
        ],
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Items",
        href: CLIENT_ITEMS_PAGE,
        permission: "inventory.item.read",
      },
      {
        label: "Warehouses",
        href: CLIENT_WAREHOUSES_PAGE,
        permission: "inventory.warehouse.read",
      },
      {
        label: "Lots",
        href: CLIENT_LOTS_PAGE,
        permission: "inventory.lot.read",
      },
      {
        label: "Stock",
        href: CLIENT_STOCK_PAGE,
        permission: "inventory.stock.read",
      },
      {
        label: "Movements",
        href: CLIENT_MOVEMENTS_PAGE,
        permission: "inventory.movement.read",
      },
      {
        label: "Reservations",
        href: CLIENT_RESERVATIONS_PAGE,
        permission: "inventory.reservation.read",
      },
    ],
  },
  {
    label: "Manufacturing",
    items: [
      {
        label: "BOMs",
        href: CLIENT_BOMS_PAGE,
        permission: "manufacturing.bom.read",
      },
      {
        label: "Production Orders",
        href: CLIENT_PRODUCTION_ORDERS_PAGE,
        permission: "manufacturing.production.read",
      },
      {
        label: "Batches",
        href: CLIENT_BATCHES_PAGE,
        permission: "manufacturing.production.read",
      },
    ],
  },
  {
    label: "Quality",
    items: [
      {
        label: "Inspections",
        href: CLIENT_INSPECTIONS_PAGE,
        permission: "quality.inspection.read",
      },
    ],
  },
  {
    label: "Traceability",
    items: [
      {
        label: "Lot Tracing",
        href: CLIENT_TRACEABILITY_PAGE,
        permission: "traceability.read",
      },
    ],
  },
  {
    label: "Workforce",
    items: [
      {
        label: "Employees",
        href: CLIENT_EMPLOYEES_PAGE,
        permission: "hr.employee.read",
      },
      {
        label: "Attendance",
        href: CLIENT_ATTENDANCE_PAGE,
        permission: "hr.attendance.read",
      },
      {
        label: "Shifts",
        href: CLIENT_SHIFTS_PAGE,
        permission: "hr.schedule.read",
      },
      {
        label: "Departments",
        href: CLIENT_DEPARTMENTS_PAGE,
        permission: "hr.employee.read",
      },
      {
        label: "Positions",
        href: CLIENT_POSITIONS_PAGE,
        permission: "hr.employee.read",
      },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        label: "Customers",
        href: CLIENT_CUSTOMERS_PAGE,
        permission: "sales.customer.read",
      },
      {
        label: "Sales Orders",
        href: CLIENT_SALES_ORDERS_PAGE,
        permission: "sales.order.read",
      },
      {
        label: "Commissions",
        href: CLIENT_SALES_COMMISSIONS_PAGE,
        permission: "sales.commission.read",
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Invoices",
        href: CLIENT_INVOICES_PAGE,
        permission: "finance.invoice.read",
      },
      {
        label: "Payments",
        href: CLIENT_PAYMENTS_PAGE,
        permission: "finance.payment.read",
      },
      {
        label: "Costs",
        href: CLIENT_COSTS_PAGE,
        permission: "finance.cost.read",
      },
    ],
  },
  {
    label: "Organization",
    items: [
      {
        label: "Profile",
        href: CLIENT_ORGANIZATION_PAGE,
        permission: "organization.read",
      },
      {
        label: "Members",
        href: CLIENT_MEMBERS_PAGE,
        permission: "membership.read",
      },
      {
        label: "Roles",
        href: CLIENT_ROLES_PAGE,
        permission: "role.read",
      },
      {
        label: "Kiosks",
        href: CLIENT_KIOSKS_PAGE,
        permission: "kiosk.read",
      },
      {
        label: "Audit Log",
        href: CLIENT_AUDIT_PAGE,
        permission: "audit.read",
      },
    ],
  },
];

export interface LauncherModule {
  label: string;
  group?: string;
  href?: string;
  permission?: Permission;
  anyOf?: Permission[];
}

export const LAUNCHER_MODULES: LauncherModule[] = [
  {
    label: "Dashboard",
    href: CLIENT_DASHBOARD_PAGE,
    permission: "organization.read",
  },
  {
    label: "Rona AI",
    href: CLIENT_ASSISTANT_PAGE,
    permission: "organization.read",
    anyOf: [
      "hr.employee.read",
      "hr.attendance.read",
      "manufacturing.production.read",
      "inventory.stock.read",
      "quality.inspection.read",
      "finance.invoice.read",
      "sales.order.read",
      "membership.read",
      "manufacturing.bom.read",
    ],
  },
  { label: "Inventory", group: "Inventory" },
  { label: "Manufacturing", group: "Manufacturing" },
  { label: "Quality", group: "Quality" },
  { label: "Traceability", group: "Traceability" },
  { label: "Workforce", group: "Workforce" },
  { label: "Sales", group: "Sales" },
  { label: "Finance", group: "Finance" },
  { label: "Organization", group: "Organization" },
];
