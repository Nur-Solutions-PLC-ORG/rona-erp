"use client";

import Logo from "@/components/custom/logo";
import { useSession } from "@/modules/auth/hooks";
import { useEffect } from "react";

interface Props {
  children?: React.ReactNode;
}

const AppWrapper = ({ children }: Props) => {
  const { data, isLoading } = useSession();

  useEffect(() => {
    if (isLoading) return;
  }, [data, isLoading]);

  return (
    <>
      {!isLoading ? (
        <Logo black className="animate-pulse opacity-5 mx-auto my-auto" />
      ) : (
        children
      )}
    </>
  );
};
export default AppWrapper;
