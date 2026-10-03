import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TryCatchNullWrap } from "@/api";
import { usePermissions } from "@/modules/workspace/hooks";
import { useCreateMutation } from "@/hooks/utils";
import type {
  Kiosk,
  KioskRegistrationResult,
  KioskUpdateResult,
} from "@rona/types/kiosk";
import {
  ApiGetKiosks,
  ApiPatchKiosk,
  ApiPostKiosk,
  ApiPostKioskActivate,
  ApiPostKioskDeactivate,
} from "./kiosk-api";

const KIOSKS_QUERY_KEY = ["organization-kiosks"];

export function useKiosks(status?: string) {
  const { hasPermission } = usePermissions();

  const query = useQuery({
    queryKey: [...KIOSKS_QUERY_KEY, status ?? "all"],
    queryFn: TryCatchNullWrap(() =>
      ApiGetKiosks({ searchParams: status ? { status } : undefined }),
    ),
    enabled: hasPermission("kiosk.read"),
  });

  return {
    kiosks: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  };
}

export const useRegisterKiosk = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<
    KioskRegistrationResult,
    { name: string; deviceToken?: string }
  >(
    (input) => ApiPostKiosk({ body: input }),
    (data) => {
      void queryClient.invalidateQueries({ queryKey: KIOSKS_QUERY_KEY });
    },
    (error) => toast.error(error.message),
  );
};

export interface KioskUpdateInputWithId {
  id: string;
  name?: string;
  deviceToken?: string;
}

export const useUpdateKiosk = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<KioskUpdateResult, KioskUpdateInputWithId>(
    ({ id, ...input }) =>
      ApiPatchKiosk({ body: input, slugReplacement: { id } }),
    (data) => {
      void queryClient.invalidateQueries({ queryKey: KIOSKS_QUERY_KEY });
    },
    (error) => toast.error(error.message),
  );
};

export const useActivateKiosk = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<Kiosk, string>(
    (id) => ApiPostKioskActivate({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: KIOSKS_QUERY_KEY });
    },
    (error) => toast.error(error.message),
  );
};

export const useDeactivateKiosk = () => {
  const queryClient = useQueryClient();

  return useCreateMutation<Kiosk, string>(
    (id) => ApiPostKioskDeactivate({ slugReplacement: { id } }),
    (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: KIOSKS_QUERY_KEY });
    },
    (error) => toast.error(error.message),
  );
};
