"use client";

import Logo from "@/components/custom/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import UserButton from "@/modules/auth/components/user-button";
import { useSession } from "@/modules/auth/hooks";
import { useSidebarStore } from "@/store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { FiMenu } from "react-icons/fi";
import { IconType } from "react-icons/lib";

type SidebarOptions = {
  header?: string;
  title: string;
  href: string;
  Icon?: IconType | (() => React.ReactNode);
}[];

type Props = {
  children: React.ReactNode;
  options?: SidebarOptions;
};

const DashboardWrapper = ({ children, options }: Props) => {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  return (
    <>
      <div className="flex flex-1">
        {!isMobile && (
          <DashboardSidebar pathname={pathname} options={options || []} />
        )}
        <div className="flex-1 flex flex-col">
          <DashboardNav
            options={options}
            pathname={pathname}
            isMobile={isMobile}
          />
          <div className="flex-1 w-full flex flex-col bg-secondary/50">
            {children}
          </div>
        </div>
      </div>

      <DashboardSidebar pathname={pathname} sheet options={options || []} />
    </>
  );
};

type NavProps = {
  isMobile?: boolean;
  options?: SidebarOptions;
  pathname: string;
};

const DashboardNav = ({ isMobile, options, pathname }: NavProps) => {
  return (
    <nav className="border-b h-20">
      <div className="px-8 flex h-full items-center gap-4">
        {isMobile && (
          <Button
            onClick={() => useSidebarStore.getState().setOpen(true)}
            size={"icon-sm"}
            variant={"ghost"}
          >
            <FiMenu className="size-5" />
          </Button>
        )}

        {options && (
          <div>
            <h1 className="text-2xl font-heading font-medium">
              {options.find((item) => item.href == pathname)?.title}
            </h1>
          </div>
        )}
        <span className="ml-auto" />
        <UserButton />
      </div>
    </nav>
  );
};

type SidebarProps = {
  options: SidebarOptions;
  sheet?: boolean;
  pathname: string;
};

const DashboardSidebar = ({ options, sheet, pathname }: SidebarProps) => {
  const { open, setOpen } = useSidebarStore();
  const { isAdmin } = useSession();

  const sidebar = (
    <div className="max-w-60 border-r bg-sidebar flex-1">
      <div className="flex h-20 px-4 gap-3 items-center">
        <Logo admin={isAdmin} />
      </div>
      <div className="flex flex-col">
        {options.map((option, i) => {
          const isActive = pathname == option.href;

          const link = (
            <Link
              key={option.href + i.toString()}
              href={option.href}
              className={cn(
                "flex items-center gap-4  cursor-pointer ",
                "px-4 py-2 hover:opacity-90 rounded-l-xl ml-2",
                isActive
                  ? "bg-secondary/10 text-white"
                  : "hover:bg-secondary/10 text-white/50 hover:text-white/75",
              )}
            >
              {option.Icon ? (
                <option.Icon className={cn("size-4", isActive && "")} />
              ) : (
                <span className="size-4" />
              )}
              <span>{option.title}</span>
            </Link>
          );

          return option.header ? (
            <div key={option.href} className="flex flex-col">
              <span className="px-4 text-white/25 tracking-wider mt-6 mb-2 font-normal uppercase text-sm">
                {option.header}
              </span>
              {link}
            </div>
          ) : (
            link
          );
        })}
      </div>
    </div>
  );

  return sheet ? (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-60!">
        {sidebar}
      </SheetContent>
    </Sheet>
  ) : (
    sidebar
  );
};

export { DashboardNav, DashboardWrapper };
