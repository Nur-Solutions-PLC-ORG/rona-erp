import { useQuery } from "@tanstack/react-query";
import { ApiGetDashboard } from "./api";

export const useAdminDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-branches"],
    queryFn: () => ApiGetDashboard(),
  });

  return {
    stats: data?.data,
    isLoading,
  };
};
