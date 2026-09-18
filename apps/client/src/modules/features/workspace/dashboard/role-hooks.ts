import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TryCatchNullWrap } from "@/api";
import { safeNumber } from "@/lib/format";
import type { RequestInput } from "@/api/request";
import { usePermissions } from "@/modules/workspace/hooks";
import type { ApiResponse } from "@rona/types/api";
import type { Permission } from "@rona/types/tenancy";
import type {
  AttendanceEvent,
  Employee,
} from "@rona/types/hr";
import type {
  CustomerDto,
  SalesOrderDto,
} from "@rona/types/sales";
import type {
  ItemDto,
  LotDto,
  MovementDto,
  ReservationDto,
} from "@rona/types/inventory";
import type { ProductionOrderDto } from "@rona/types/manufacturing";
import type { InspectionDto } from "@rona/types/quality";
import type { CostDto, InvoiceDto, PaymentDto } from "@rona/types/finance";
import {
  ApiGetInspections,
  ApiGetItems,
  ApiGetMovements,
  ApiGetProductionOrders,
  ApiGetStockBalances,
} from "./api";
import {
  ApiGetLots,
  ApiGetReservations,
} from "../inventory/api";
import {
  ApiGetAttendanceEvents,
  ApiGetEmployees,
} from "../workforce/api";
import {
  ApiGetCustomers,
  ApiGetSalesOrders,
} from "../sales/api";
import {
  ApiGetCosts,
  ApiGetInvoices,
  ApiGetPayments,
} from "../finance/api";
import {
  CLIENT_INSPECTIONS_PAGE,
  CLIENT_ITEMS_PAGE,
  CLIENT_LOTS_PAGE,
  CLIENT_CUSTOMERS_PAGE,
  CLIENT_SALES_ORDERS_PAGE,
  CLIENT_PRODUCTION_ORDERS_PAGE,
} from "@rona/routes/workspace";
import type { SearchResult } from "./components/shell";
import { useInventoryDashboardData } from "./inventory-dashboard-hooks";

const ROLE_LOOKUP_SIZE = 100;
const ROLE_PAGE_SIZE = 50;
const ROLE_RECENT_SIZE = 25;

function useList<T>(
  permission: Permission,
  queryKey: string,
  api: (input?: RequestInput) => Promise<ApiResponse<T[]>>,
  limit: number,
) {
  const { hasPermission } = usePermissions();

  const query = useQuery({
    queryKey: [queryKey],
    queryFn: TryCatchNullWrap<T[]>(() =>
      api({ searchParams: { limit: String(limit) } }),
    ),
    enabled: hasPermission(permission),
  });

  return {
    rows: (query.data?.data ?? []) as T[],
    isLoading: query.isLoading,
  };
}

function useMemoItemLookup(items: ItemDto[]) {
  return useMemo(() => {
    const map = new Map<string, ItemDto>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);
}

function searchResult(
  type: string,
  label: string,
  hint: string,
  href: string,
): SearchResult {
  return { type, label, hint, href };
}

export const useWarehouseDashboardData = () => {
  const inventory = useInventoryDashboardData();
  // Enough history to cover the 14-day in/out histogram.
  const movements = useList(
    "inventory.movement.read",
    "inventory-movements",
    ApiGetMovements,
    200,
  );
  const reservations = useList(
    "inventory.reservation.read",
    "inventory-reservations",
    ApiGetReservations,
    ROLE_PAGE_SIZE,
  );

  const innerSearch = inventory.searchIndex ?? [];
  const activeReservations = reservations.rows.filter(
    (reservation) => reservation.status === "ACTIVE",
  );

  return {
    ...inventory,
    movements: (movements.rows as MovementDto[]).slice(0, ROLE_RECENT_SIZE),
    movementHistory: movements.rows as MovementDto[],
    movementsLoading: movements.isLoading,
    reservations: reservations.rows as ReservationDto[],
    activeReservations,
    reservationsLoading: reservations.isLoading,
    searchIndex: innerSearch,
    isLoading: inventory.isLoading || movements.isLoading || reservations.isLoading,
    keyResultsLoading: inventory.keyResultsLoading,
    itemLookup: useMemoItemLookup(inventory.items),
  };
};

export const useProductionDashboardData = () => {
  const itemsQ = useList(
    "inventory.item.read",
    "inventory-items",
    ApiGetItems,
    ROLE_LOOKUP_SIZE,
  );
  const stockQ = useList(
    "inventory.stock.read",
    "inventory-stock",
    ApiGetStockBalances,
    ROLE_LOOKUP_SIZE * 2,
  );
  const ordersQ = useList(
    "manufacturing.production.read",
    "manufacturing-orders",
    ApiGetProductionOrders,
    ROLE_PAGE_SIZE,
  );
  const movementsQ = useList(
    "inventory.movement.read",
    "inventory-movements",
    ApiGetMovements,
    ROLE_RECENT_SIZE,
  );

  const itemLookup = useMemoItemLookup(itemsQ.rows);
  const orders = ordersQ.rows as ProductionOrderDto[];
  const openOrders = orders.filter(
    (order) => order.status !== "COMPLETED" && order.status !== "CANCELLED",
  );

  const inProgress = orders.filter(
    (order) => order.status === "IN_PROGRESS",
  ).length;
  const awaitingExecution = orders.filter((order) =>
    ["DRAFT", "PLANNED", "APPROVED"].includes(order.status),
  ).length;
  const completed = orders.filter(
    (order) => order.status === "COMPLETED",
  ).length;

  const stockPositions = useMemo(() => {
    const map = new Map<string, number>();
    for (const balance of stockQ.rows) {
      map.set(balance.itemId, (map.get(balance.itemId) ?? 0) + Number(balance.quantity));
    }
    return map.size;
  }, [stockQ.rows]);

  const searchIndex = useMemo<SearchResult[]>(
    () => [
      ...itemsQ.rows.map((item) =>
        searchResult("item", `${item.code} — ${item.name}`, "Item", CLIENT_ITEMS_PAGE),
      ),
      ...orders.map((order) =>
        searchResult("order", order.orderNumber, "Production order", CLIENT_PRODUCTION_ORDERS_PAGE),
      ),
    ],
    [itemsQ.rows, orders],
  );

  return {
    itemLookup,
    orders,
    openOrders,
    inProgress,
    awaitingExecution,
    completed,
    stockPositions,
    movements: movementsQ.rows as MovementDto[],
    searchIndex,
    isLoading:
      itemsQ.isLoading || stockQ.isLoading || ordersQ.isLoading || movementsQ.isLoading,
  };
};

export const useQualityDashboardData = () => {
  const itemsQ = useList(
    "inventory.item.read",
    "inventory-items",
    ApiGetItems,
    ROLE_LOOKUP_SIZE,
  );
  const inspectionsQ = useList(
    "quality.inspection.read",
    "quality-inspections",
    ApiGetInspections,
    ROLE_PAGE_SIZE,
  );
  const lotsQ = useList(
    "inventory.lot.read",
    "inventory-lots",
    ApiGetLots,
    ROLE_PAGE_SIZE * 2,
  );

  const itemLookup = useMemoItemLookup(itemsQ.rows);
  const inspections = inspectionsQ.rows as InspectionDto[];
  const openInspections = inspections.filter(
    (inspection) => inspection.status === "IN_PROGRESS",
  ).length;
  const completedInspections = inspections.filter(
    (inspection) => inspection.status === "COMPLETED",
  ).length;
  const reviewedInspections = inspections.filter(
    (inspection) => inspection.status === "REVIEWED",
  ).length;

  const lots = lotsQ.rows as LotDto[];
  const quarantinedLots = lots.filter(
    (lot) => lot.qualityStatus === "QUARANTINED",
  ).length;
  const approvedLots = lots.filter(
    (lot) => lot.qualityStatus === "APPROVED" || lot.qualityStatus === "RELEASED",
  ).length;
  const rejectedLots = lots.filter(
    (lot) => lot.qualityStatus === "REJECTED",
  ).length;

  const searchIndex = useMemo<SearchResult[]>(
    () => [
      ...itemsQ.rows.map((item) =>
        searchResult("item", `${item.code} — ${item.name}`, "Item", CLIENT_ITEMS_PAGE),
      ),
      ...inspections.map((inspection) =>
        searchResult("inspection", inspection.inspectionNumber, "Inspection", CLIENT_INSPECTIONS_PAGE),
      ),
      ...lots.map((lot) =>
        searchResult("lot", lot.lotNumber, "Lot", CLIENT_LOTS_PAGE),
      ),
    ],
    [itemsQ.rows, inspections, lots],
  );

  return {
    itemLookup,
    inspections,
    openInspections,
    completedInspections,
    reviewedInspections,
    quarantinedLots,
    approvedLots,
    rejectedLots,
    lots,
    searchIndex,
    isLoading:
      itemsQ.isLoading || inspectionsQ.isLoading || lotsQ.isLoading,
  };
};

export const useHrDashboardData = () => {
  const employeesQ = useList(
    "hr.employee.read",
    "hr-employees",
    ApiGetEmployees,
    ROLE_LOOKUP_SIZE,
  );
  // Enough history to cover the 14-day attendance histogram.
  const attendanceQ = useList(
    "hr.attendance.read",
    "hr-attendance",
    ApiGetAttendanceEvents,
    200,
  );

  const employees = employeesQ.rows as Employee[];
  const attendanceRows = attendanceQ.rows as AttendanceEvent[];
  const activeStaff = employees.filter(
    (employee) => employee.status === "active" && !employee.archivedAt,
  ).length;
  const onLeave = employees.filter(
    (employee) => employee.status === "on_leave",
  ).length;
  const resignedStaff = employees.filter((employee) =>
    ["resigned", "terminated"].includes(employee.status),
  ).length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const clockedInToday = useMemo(() => {
    const set = new Set<string>();
    for (const event of attendanceRows) {
      if (
        event.eventType === "CLOCK_IN" &&
        new Date(event.eventAt) >= startOfToday
      ) {
        set.add(event.employeeId);
      }
    }
    return set.size;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceRows]);

  const nameLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const employee of employees) {
      map.set(employee.id, employee.fullName);
    }
    return map;
  }, [employees]);

  const searchIndex = useMemo<SearchResult[]>(
    () =>
      employees.map((employee) =>
        searchResult("employee", employee.fullName, employee.eId, "/workforce/employees"),
      ),
    [employees],
  );

  return {
    employees,
    nameLookup,
    activeStaff,
    onLeave,
    resignedStaff,
    clockedInToday,
    attendance: attendanceRows.slice(0, ROLE_RECENT_SIZE),
    attendanceHistory: attendanceRows,
    searchIndex,
    isLoading: employeesQ.isLoading || attendanceQ.isLoading,
  };
};

export const useSalesDashboardData = () => {
  const customersQ = useList(
    "sales.customer.read",
    "sales-customers",
    ApiGetCustomers,
    ROLE_PAGE_SIZE,
  );
  const ordersQ = useList(
    "sales.order.read",
    "sales-orders",
    ApiGetSalesOrders,
    ROLE_PAGE_SIZE,
  );

  const customers = customersQ.rows as CustomerDto[];
  const orders = ordersQ.rows as SalesOrderDto[];

  const openOrders = orders.filter(
    (order) => order.status !== "FULFILLED" && order.status !== "CANCELLED",
  );
  const fulfilledOrders = orders.filter(
    (order) => order.status === "FULFILLED",
  );
  const cancelledOrders = orders.filter(
    (order) => order.status === "CANCELLED",
  );
  const activeCustomers = customers.filter(
    (customer) => customer.status === "ACTIVE",
  );

  const totalOrderValue = useMemo(
    () =>
      openOrders.reduce(
        (sum, order) => sum + safeNumber(order.total),
        0,
      ),
    [openOrders],
  );

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
        )
        .slice(0, 8),
    [orders],
  );

  const searchIndex = useMemo<SearchResult[]>(
    () => [
      ...customers.map((customer) =>
        searchResult("customer", customer.name, "Customer", CLIENT_CUSTOMERS_PAGE),
      ),
      ...orders.map((order) =>
        searchResult(
          "order",
          order.orderNumber,
          "Sales order",
          CLIENT_SALES_ORDERS_PAGE,
        ),
      ),
    ],
    [customers, orders],
  );

  return {
    customers,
    activeCustomers,
    orders,
    openOrders,
    fulfilledOrders,
    cancelledOrders,
    recentOrders,
    totalOrderValue,
    searchIndex,
    isLoading: customersQ.isLoading || ordersQ.isLoading,
  };
};

export const useFinanceDashboardData = () => {
  const invoicesQ = useList(
    "finance.invoice.read",
    "finance-invoices",
    ApiGetInvoices,
    ROLE_PAGE_SIZE * 2,
  );
  const paymentsQ = useList(
    "finance.payment.read",
    "finance-payments",
    ApiGetPayments,
    ROLE_PAGE_SIZE * 2,
  );
  const costsQ = useList(
    "finance.cost.read",
    "finance-costs",
    ApiGetCosts,
    ROLE_PAGE_SIZE * 2,
  );

  return {
    invoices: invoicesQ.rows as InvoiceDto[],
    payments: paymentsQ.rows as PaymentDto[],
    costs: costsQ.rows as CostDto[],
    isLoading:
      invoicesQ.isLoading || paymentsQ.isLoading || costsQ.isLoading,
  };
};

export const useOpsDashboardData = () => {
  const inventory = useInventoryDashboardData();
  const ordersQ = useList(
    "manufacturing.production.read",
    "manufacturing-orders",
    ApiGetProductionOrders,
    ROLE_PAGE_SIZE,
  );
  const inspectionsQ = useList(
    "quality.inspection.read",
    "quality-inspections",
    ApiGetInspections,
    ROLE_PAGE_SIZE,
  );
  const movementsQ = useList(
    "inventory.movement.read",
    "inventory-movements",
    ApiGetMovements,
    200,
  );

  const itemLookup = useMemoItemLookup(inventory.items);
  const orders = ordersQ.rows as ProductionOrderDto[];
  const openOrders = orders.filter(
    (order) => order.status !== "COMPLETED" && order.status !== "CANCELLED",
  );
  const inspections = inspectionsQ.rows as InspectionDto[];
  const openInspections = inspections.filter(
    (inspection) => inspection.status === "IN_PROGRESS",
  );

  const stockPositions = useMemo(
    () =>
      inventory.itemRows.reduce((total, row) => total + row.onHand, 0),
    [inventory.itemRows],
  );

  const searchIndex = useMemo<SearchResult[]>(
    () => [
      ...inventory.items.map((item) =>
        searchResult("item", `${item.code} — ${item.name}`, "Item", CLIENT_ITEMS_PAGE),
      ),
      ...orders.map((order) =>
        searchResult("order", order.orderNumber, "Production order", CLIENT_PRODUCTION_ORDERS_PAGE),
      ),
      ...inspections.map((inspection) =>
        searchResult("inspection", inspection.inspectionNumber, "Inspection", CLIENT_INSPECTIONS_PAGE),
      ),
    ],
    [inventory.items, orders, inspections],
  );

  return {
    ...inventory,
    itemLookup,
    orders,
    openOrders,
    inspections,
    openInspections,
    stockPositions,
    movements: (movementsQ.rows as MovementDto[]).slice(0, ROLE_RECENT_SIZE),
    movementHistory: movementsQ.rows as MovementDto[],
    searchIndex,
    isLoading:
      inventory.isLoading ||
      inventory.keyResultsLoading ||
      ordersQ.isLoading ||
      inspectionsQ.isLoading ||
      movementsQ.isLoading,
  };
};
