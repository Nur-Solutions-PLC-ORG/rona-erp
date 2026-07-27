import { useQuery } from "@tanstack/react-query";
import { ApiGetSessionStatus } from "../api";

export const useSession = () => {
  const { data, isLoading } = useQuery({
    queryFn: ApiGetSessionStatus,
    queryKey: ["auth-session"],
  });

  return {
    data: data?.data,
    isLoading,
  };
};
