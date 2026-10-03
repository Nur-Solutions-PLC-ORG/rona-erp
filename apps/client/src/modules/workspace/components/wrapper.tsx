"use client";

import { useEffect, useState } from "react";
import LoaderPage from "@/components/custom/loader-page";
import { useCurrentOrganization } from "@/modules/workspace/hooks";
import { Sidebar } from "./shell/sidebar";
import { Navbar } from "./shell/navbar";

type Props = {
  children: React.ReactNode;
};

const COLLAPSED_STORAGE_KEY = "rona-workspace-sidebar-collapsed";

const WorkspaceWrapper = ({ children }: Props) => {
  const { isLoading } = useCurrentOrganization();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => {
      if (media.matches) setMobileOpen(false);
    };
    media.addEventListener("change", handleChange);
    handleChange();
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      const next = !previous;
      localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  if (isLoading) return <LoaderPage />;

  return (
    <div className="flex h-screen flex-col app-canvas">
      <Navbar onOpenMobileNav={() => setMobileOpen(true)} />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 gap-5 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};

export default WorkspaceWrapper;
