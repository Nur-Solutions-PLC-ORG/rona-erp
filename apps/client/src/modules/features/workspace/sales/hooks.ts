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
} from "@rona/types/sales";
import {
  ApiApproveCommission,
  ApiGetCommissionRecords,
  ApiGetCommissionRules,
  ApiGetCustomers,
  ApiGetSalesOrders,
  ApiMarkCommissionPaid,
  ApiPatchCommissionRule,
  ApiPostCommissionRule,
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
