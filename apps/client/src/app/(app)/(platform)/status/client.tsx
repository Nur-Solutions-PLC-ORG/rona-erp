"use client";

import { ApiServerStatusCheck } from "@/api";
import CardWrapper, {
  CardWrapperParent,
} from "@/components/custom/card-wrapper";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { FaCircle } from "react-icons/fa";

const Client = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: ApiServerStatusCheck,
  });

  return (
    <CardWrapperParent isLoading={isLoading || !data}>
      <CardWrapper center title="Rona Status">
        <div
          className={cn("h-8 rounded flex items-center gap-3 justify-center", {
            "bg-green-200/50 text-green-800": !!data?.success,
            "bg-red-200/50 text-red-800": !data?.success,
          })}
        >
          <FaCircle className={cn("size-2")} />
          <p>{data?.message}</p>
        </div>
      </CardWrapper>
    </CardWrapperParent>
  );
};
export default Client;
