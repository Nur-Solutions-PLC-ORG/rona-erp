"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";
import { useSession } from "@/modules/auth/hooks";

import LoaderPage from "@/components/custom/loader-page";
import { CLIENT_APP_DASHBOARD_PAGE } from "@rona/routes/app";
import {
  CLIENT_AUTH_FORGOT_PASSWORD_PAGE,
  CLIENT_AUTH_GOOGLE_CALLBACK_PAGE,
  CLIENT_AUTH_RESET_PASSWORD_PAGE,
  CLIENT_AUTH_SIGNIN_PAGE,
} from "@rona/routes/auth";
import { CLIENT_ADMIN_DASHBOARD_PAGE } from "@rona/routes/admin";
import { ConfirmationModal } from "./confirmation-modal";

interface Props {
  children?: React.ReactNode;
}

export default function AppWrapper({ children }: Props) {
  const { data: session, isLoading, isAdmin } = useSession();

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const authPages = [
      CLIENT_AUTH_SIGNIN_PAGE,
      CLIENT_AUTH_RESET_PASSWORD_PAGE,
      CLIENT_AUTH_FORGOT_PASSWORD_PAGE,
      CLIENT_AUTH_GOOGLE_CALLBACK_PAGE,
    ];

    if (!session) {
      if (!authPages.includes(pathname)) {
        router.replace(CLIENT_AUTH_SIGNIN_PAGE);
      }
      return;
    }

    if (pathname === CLIENT_AUTH_SIGNIN_PAGE) {
      router.replace(CLIENT_APP_DASHBOARD_PAGE);
      return;
    }

    if (isAdmin) {
      if (!pathname.startsWith("/admin")) {
        router.replace(CLIENT_ADMIN_DASHBOARD_PAGE);
        return;
      }
    }

    if (!isAdmin) {
      if (pathname.startsWith("/admin")) {
        router.replace(CLIENT_APP_DASHBOARD_PAGE);
        return;
      }
    }
  }, [session, isLoading, pathname, router, isAdmin]);

  if (isLoading) {
    return <LoaderPage />;
  }

  return (
    <>
      {children}

      <Toaster />
      <ConfirmationModal />
    </>
  );
}
