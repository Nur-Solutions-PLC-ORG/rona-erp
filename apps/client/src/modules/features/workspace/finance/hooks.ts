import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePermissions } from "@/modules/workspace/hooks";
import { TryCatchNullWrap } from "@/api";
import { useCreateMutation } from "@/hooks/utils";
import type { Permission } from "@rona/types/tenancy";
import type { CostCreateInput, CostDto, InvoiceCreateInput, InvoiceDto, PaymentCreateInput, PaymentDto } from "@rona/types/finance";
import {
  ApiGetCosts,
  ApiGetInvoices,
  ApiGetPayments,
  ApiIssueInvoice,
  ApiPostCost,
  ApiPostInvoice,
  ApiPostPayment,
  ApiVoidInvoice,
} from "./api";

const FINANCE_REFETCH_INTERVAL_MS = 30_000;

function useFinanceQuery<TDto>(
  permission: Permission,
  queryKey: unknown[],
  queryFn: () => Promise<{ data?: TDto[]; meta?: unknown } | null>,
) {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey,
    queryFn,
    enabled: hasPermission(permission),
    refetchInterval: FINANCE_REFETCH_INTERVAL_MS,
  });
}

export function useInvoices() {
  const query = useFinanceQuery("finance.invoice.read", ["finance-invoices"], () =>
    TryCatchNullWrap(() => ApiGetInvoices())(),
  );

  return {
    invoices: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isRefetching: query.isFetching && !query.isLoading,
  };
}

export function usePayments() {
  const query = useFinanceQuery("finance.payment.read", ["finance-payments"], () =>
    TryCatchNullWrap(() => ApiGetPayments())(),
  );

  return {
    payments: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isRefetching: query.isFetching && !query.isLoading,
  };
}

export function useCosts() {
  const query = useFinanceQuery("finance.cost.read", ["finance-costs"], () =>
    TryCatchNullWrap(() => ApiGetCosts())(),
  );

  return {
    costs: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isRefetching: query.isFetching && !query.isLoading,
  };
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<InvoiceDto, InvoiceCreateInput>(
    (input) => ApiPostInvoice({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["finance-invoices"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useIssueInvoice = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<InvoiceDto, string>(
    (id) => ApiIssueInvoice({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["finance-invoices"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useVoidInvoice = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<InvoiceDto, string>(
    (id) => ApiVoidInvoice({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["finance-invoices"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useCreateCost = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<CostDto, CostCreateInput>(
    (input) => ApiPostCost({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["finance-costs"] });
    },
    (error) => toast.error(error.message),
  );
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<PaymentDto, PaymentCreateInput>(
    (input) => ApiPostPayment({ body: input }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["finance-payments"] });
      void queryClient.invalidateQueries({ queryKey: ["finance-invoices"] });
    },
    (error) => toast.error(error.message),
  );
};
