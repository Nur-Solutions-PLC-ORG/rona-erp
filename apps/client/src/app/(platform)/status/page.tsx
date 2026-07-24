"use client";

import { ApiServerStatusCheck } from "@/api";
import CardWrapper, {
  CardWrapperParent,
} from "@/components/custom/card-wrapper";
import { useQuery } from "@tanstack/react-query";

const Page = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: ApiServerStatusCheck,
  });

  return (
    <CardWrapperParent>
      <CardWrapper title="Rona Status">
        {JSON.stringify({ data, isLoading })}
      </CardWrapper>
    </CardWrapperParent>
  );
};

export default Page;
