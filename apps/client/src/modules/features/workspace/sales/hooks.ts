import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePermissions } from "@/modules/workspace/hooks";
import { TryCatchNullWrap } from "@/api";
import { useCreateMutation } from "@/hooks/utils";
import type { Permission } from "@rona/types/tenancy";
import type {
  CommissionRecordDto,
  CommissionRuleCreateSchema,
  CommissionRuleDto,
  CommissionRuleUpdateSchema,
  CustomerCreateSchema,
  CustomerDto,
  SalesOrderCreateSchema,
  SalesOrderDto,
} from "@rona/types/sales";
import {
  ApiApproveCommission,
  ApiCancelSalesOrder,
  ApiConfirmSalesOrder,
  ApiFulfillSalesOrder,
  ApiGetCommissionRecords,
  ApiGetCommissionRules,
  ApiGetCustomers,
  ApiGetSalesOrderAvailability,
  ApiGetSalesOrders,
  ApiMarkCommissionPaid,
  ApiPatchCommissionRule,
  ApiPostCommissionRule,
  ApiPostCustomer,
  ApiPostSalesOrder,
} from "./api";

export const SALES_PAGE_SIZE = 25;

const SALES_REFETCH_INTERVAL_MS = 30_000;

function useSalesQuery<TDto>(
  permission: Permission,
  queryKey: unknown[],
  queryFn: () => Promise<{ data?: TDto[]; meta?: unknown } | null>,
) {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey,
    queryFn,
    enabled: hasPermission(permission),
    refetchInterval: SALES_REFETCH_INTERVAL_MS,
  });
}

export function useSalesCustomers() {
  const query = useSalesQuery("sales.customer.read", ["sales-customers"], () =>
    TryCatchNullWrap(() => ApiGetCustomers())(),
  );

  return {
    customers: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isRefetching: query.isFetching && !query.isLoading,
  };
}

export function useSalesOrders() {
  const query = useSalesQuery("sales.order.read", ["sales-orders"], () =>
    TryCatchNullWrap(() => ApiGetSalesOrders())(),
  );

  return {
    orders: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isRefetching: query.isFetching && !query.isLoading,
  };
}

export function useSalesAvailability(
  itemId: string | undefined,
  warehouseId: string | undefined,
) {
  const { hasPermission } = usePermissions();
  const enabled =
    Boolean(itemId && warehouseId) && hasPermission("sales.order.read");

  const query = useQuery({
    queryKey: ["sales-availability", itemId ?? "", warehouseId ?? ""],
    queryFn: TryCatchNullWrap(() =>
      ApiGetSalesOrderAvailability({
        searchParams: { itemId: itemId ?? "", warehouseId: warehouseId ?? "" },
      }),
    ),
    enabled,
  });

  return {
    availability: query.data?.data,
    isLoading: enabled && query.isLoading,
  };
}

export const useCreateSalesOrder = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<SalesOrderDto, SalesOrderCreateSchema>(
    (input) => ApiPostSalesOrder({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    },
    (error) => toast.error(error.message),
  );
};

const invalidateSalesOrders = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  void queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
};

export const useConfirmSalesOrder = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<SalesOrderDto, string>(
    (id) => ApiConfirmSalesOrder({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      invalidateSalesOrders(queryClient);
    },
    (error) => toast.error(error.message),
  );
};

export const useFulfillSalesOrder = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<SalesOrderDto, string>(
    (id) => ApiFulfillSalesOrder({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      invalidateSalesOrders(queryClient);
      void queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useCancelSalesOrder = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<SalesOrderDto, string>(
    (id) => ApiCancelSalesOrder({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      invalidateSalesOrders(queryClient);
    },
    (error) => toast.error(error.message),
  );
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<CustomerDto, CustomerCreateSchema>(
    (input) => ApiPostCustomer({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["sales-customers"] });
    },
    (error) => toast.error(error.message),
  );
};

export function useCommissionRules() {
  const query = useSalesQuery(
    "sales.commission.read",
    ["commission-rules"],
    () => TryCatchNullWrap(() => ApiGetCommissionRules())(),
  );

  return {
    rules: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isRefetching: query.isFetching && !query.isLoading,
  };
}

export function useCommissionRecords() {
  const query = useSalesQuery(
    "sales.commission.read",
    ["commission-records"],
    () => TryCatchNullWrap(() => ApiGetCommissionRecords())(),
  );

  return {
    records: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isRefetching: query.isFetching && !query.isLoading,
  };
}

export const useCreateCommissionRule = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<CommissionRuleDto, CommissionRuleCreateSchema>(
    (input) => ApiPostCommissionRule({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["commission-rules"] });
    },
    (error) => toast.error(error.message),
  );
};

export interface CommissionRuleUpdateInput
  extends CommissionRuleUpdateSchema {
  id: string;
}

export const useUpdateCommissionRule = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<CommissionRuleDto, CommissionRuleUpdateInput>(
    ({ id, ...input }) =>
      ApiPatchCommissionRule({ body: input, slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["commission-rules"] });
    },
    (error) => toast.error(error.message),
  );
};

const invalidateCommissionRecords = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: ["commission-records"] });
};

export const useApproveCommission = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<CommissionRecordDto, string>(
    (id) => ApiApproveCommission({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      invalidateCommissionRecords(queryClient);
    },
    (error) => toast.error(error.message),
  );
};

export const useMarkCommissionPaid = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<CommissionRecordDto, string>(
    (id) => ApiMarkCommissionPaid({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      invalidateCommissionRecords(queryClient);
    },
    (error) => toast.error(error.message),
  );
};
