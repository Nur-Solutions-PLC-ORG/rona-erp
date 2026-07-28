"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import Logo from "@/components/custom/logo";
import { Toaster } from "@/components/ui/sonner";
import { useSession } from "@/modules/auth/hooks";

import { CLIENT_APP_DASHBOARD_PAGE } from "@rona/routes/app";
import { CLIENT_AUTH_SIGNIN_PAGE } from "@rona/routes/auth";
import LoaderPage from "@/components/custom/loader-page";

interface Props {
  children?: React.ReactNode;
}

export default function AppWrapper({ children }: Props) {
  const { data: session, isLoading } = useSession();

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      if (pathname !== CLIENT_AUTH_SIGNIN_PAGE) {
        router.replace(CLIENT_AUTH_SIGNIN_PAGE);
      }
      return;
    }

    if (pathname === CLIENT_AUTH_SIGNIN_PAGE) {
      router.replace(CLIENT_APP_DASHBOARD_PAGE);
    }
  }, [session, isLoading, pathname, router]);

  if (isLoading) {
    return <LoaderPage />;
  }

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
