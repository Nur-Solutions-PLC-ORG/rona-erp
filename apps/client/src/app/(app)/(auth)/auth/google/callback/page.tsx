import { redirect } from "next/navigation";
import { CLIENT_APP_DASHBOARD_PAGE } from "@rona/routes/app";

const getSafeRedirectPath = (redirectPath: string | undefined) => {
  if (
    !redirectPath ||
    !redirectPath.startsWith("/") ||
    redirectPath.startsWith("//")
  ) {
    return null;
  }

  return redirectPath;
};

interface Props {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function GoogleCallbackPage({ searchParams }: Props) {
  const { redirect: redirectPath } = await searchParams;

  redirect(getSafeRedirectPath(redirectPath) ?? CLIENT_APP_DASHBOARD_PAGE);
}
