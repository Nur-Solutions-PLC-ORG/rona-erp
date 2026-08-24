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
import { FiChevronDown, FiChevronLeft, FiMenu } from "react-icons/fi";
import { IconType } from "react-icons/lib";

type SidebarOption = {
  header?: string;
  title: string;
  href: string;
  Icon?: IconType | (() => React.ReactNode);
  children?: SidebarOption[];
};

type SidebarOptions = SidebarOption[];

const findSidebarOption = (
  options: SidebarOptions,
  pathname: string,
): SidebarOption | undefined => {
  for (const option of options) {
    if (option.href === pathname) return option;

    const childOption =
      option.children && findSidebarOption(option.children, pathname);
    if (childOption) return childOption;
  }

  return undefined;
};

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

          <div className="flex-1 w-full flex flex-col bg-secondary/25">
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
          <h1 className="text-2xl font-heading font-medium">
            {findSidebarOption(options, pathname)?.title}
          </h1>
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
  const [expandedItems, setExpandedItems] = React.useState<
    Record<string, boolean>
  >({});

  const sidebar = (
    <div
      className={cn(
        "border-r bg-sidebar flex flex-col transition-[width] duration-200",
        "w-60",
      )}
    >
      <div className="flex h-20 px-4 gap-3 justify-center border-b border-border/10 items-center">
        <Logo admin={isAdmin} />
      </div>
      <span className="mb-4 w-full" />
      <div className="flex flex-col">
        {options.map((option, i) => {
          const isActive = pathname == option.href;
          const isExpanded = expandedItems[option.href] ?? true;

          const link = (
            <div key={option.href + i.toString()} className="flex items-center">
              <Link
                onClick={() => {
                  if (sheet) setOpen(false);
                }}
                href={option.href}
                className={cn(
                  "flex flex-1 items-center gap-4 cursor-pointer",
                  "px-4 py-2 hover:opacity-90 rounded-l-xl ml-2",
                  "relative",
                  isActive
                    ? "bg-secondary/10 text-white"
                    : "hover:bg-secondary/10 text-white/50 hover:text-white/75",
                )}
              >
                {option.Icon ? (
                  <option.Icon className={cn("size-4", isActive && "")} />
                ) : (
                  <></>
                )}
                <span>{option.title}</span>
                {option.children && (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      setExpandedItems((previous) => ({
                        ...previous,
                        [option.href]: !isExpanded,
                      }));
                    }}
                    size="icon-sm"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-secondary/3 hover:text-white"
                  >
                    <FiChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </Button>
                )}
              </Link>
            </div>
          );

          const children = option.children && isExpanded && (
            <div className="flex flex-col">
              {option.children.map((child, ic) => {
                const childIsActive = pathname === child.href;

                return (
                  <Link
                    key={child.href}
                    onClick={() => {
                      if (sheet) setOpen(false);
                    }}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-4 cursor-pointer px-4 py-2 hover:opacity-90 rounded-l-xl ml-2",
                      childIsActive
                        ? "bg-secondary/10 text-white"
                        : "hover:bg-secondary/10 text-white/50 hover:text-white/75",
                    )}
                  >
                    <span className="size-4 relative opacity-15">
                      <span
                        className={cn(
                          "border-l absolute h-3 w-2 bottom-full right-0",
                          ic == 0 ? "h-3" : "h-8",
                        )}
                      />
                      <span className="size-2 absolute top-0 right-0 border-l border-b" />
                      <span className="w-1.5 h-2 absolute top-0 left-full border-b" />
                    </span>
                    <span>{child.title}</span>
                  </Link>
                );
              })}
            </div>
          );

          return option.header ? (
            <div key={option.href} className="flex flex-col">
              <span className="px-4 text-white/25 tracking-wider mt-6 mb-2 font-normal uppercase text-sm">
                {option.header}
              </span>
              {link}
              {children}
            </div>
          ) : (
            <React.Fragment key={option.href}>
              {link}
              {children}
            </React.Fragment>
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

interface RowProps {
  children: React.ReactNode;
}

const Row = ({ children }: RowProps) => {
  return <div className="flex flex-col gap-4 px-6 py-4">{children}</div>;
};

export { DashboardNav, DashboardWrapper, Row };
