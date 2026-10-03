import { useQuery } from "@tanstack/react-query";
import { ApiGetSessionStatus } from "./api";
import { TryCatchNullWrap } from "@/api/utils";

export const useSession = () => {
  const { data, isLoading } = useQuery({
    queryFn: TryCatchNullWrap(ApiGetSessionStatus),
    queryKey: ["auth-session"],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    data: data?.data,
    user: data?.data?.user,
    role: data?.data?.role,
    isAdmin: data?.data?.role?.position == "super_admin",
    isLoading,
  };
};
