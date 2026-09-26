"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import LoaderPage from "@/components/custom/loader-page";
import { useSession } from "@/modules/auth/hooks";
import { CLIENT_AUTH_SIGNIN_PAGE } from "@rona/routes/auth";

interface Props {
  children?: React.ReactNode;
}

export default function ApiDocsLayout({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isLoading } = useSession();

  const isSignedIn = Boolean(session);

  useEffect(() => {
    if (isLoading || isSignedIn) return;

    router.replace(
      `${CLIENT_AUTH_SIGNIN_PAGE}?redirect=${encodeURIComponent(pathname)}`,
    );
  }, [isLoading, isSignedIn, pathname, router]);

  if (isLoading || !isSignedIn) return <LoaderPage />;

  return <>{children}</>;
}
