"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Session } from "@rona/types/auth";
import { API_AUTH_SESSION_URL, API_AUTH_SIGN_OUT_URL } from "@rona/routes/auth";
import { useRouter } from "next/navigation";
import { CLIENT_AUTH_SIGNIN_PAGE } from "@rona/routes/auth";

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSession() {
      const res = await apiGet<Session>(API_AUTH_SESSION_URL);
      if (res.success && res.data) {
        setSession(res.data);
      }
      setLoading(false);
    }
    fetchSession();
  }, []);

  const handleSignOut = async () => {
    await apiPost(API_AUTH_SIGN_OUT_URL, {});
    router.push(CLIENT_AUTH_SIGNIN_PAGE);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Middleware will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Rona ERP
          </h1>
          <button
            onClick={handleSignOut}
            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Profile Overview
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-card-foreground">
                  {session.user.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="font-medium capitalize text-card-foreground">
                  {session.roles.position}
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm md:col-span-2">
            <h2 className="text-lg font-semibold text-foreground">
              Accessible Modules
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {session.roles.modules.length > 0 ? (
                session.roles.modules.map((module) => (
                  <span
                    key={module}
                    className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary capitalize"
                  >
                    {module}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No modules assigned.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
