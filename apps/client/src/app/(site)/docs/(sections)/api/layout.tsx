import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_API_URL } from "@rona/config/server";
import { COOKIE_NAME } from "@rona/config/auth";
import {
  API_AUTH_SESSION_URL,
  CLIENT_AUTH_SIGNIN_PAGE,
} from "@rona/routes/auth";

interface Props {
  children?: React.ReactNode;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;

async function hasActiveSession(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiBaseUrl}${API_AUTH_SESSION_URL}`, {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
      cache: "no-store",
    });

    return response.ok;
  } catch {
    // Fail closed: an unreachable API must not expose the reference.
    return false;
  }
}

export default async function ApiDocsLayout({ children }: Props) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token || !(await hasActiveSession(token))) {
    redirect(
      `${CLIENT_AUTH_SIGNIN_PAGE}?redirect=${encodeURIComponent("/docs/api/authentication")}`,
    );
  }

  return <>{children}</>;
}
