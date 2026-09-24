"use client";

import Logo from "@/components/custom/logo";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import UserButton from "@/modules/auth/components/user-button";
import { useSession } from "@/modules/auth/hooks";
import { useSidebarStore } from "@/store";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { FiMenu } from "react-icons/fi";
import { IconType } from "react-icons/lib";

export type SidebarOption = {
  header?: string;
  title: string;
  href?: string;
  Icon?: IconType | (() => React.ReactNode);
  children?: SidebarOption[];
};

export type SidebarOptions = SidebarOption[];

type Props = {
  children: React.ReactNode;
  options?: SidebarOptions;
  navExtra?: React.ReactNode;
};

function findActiveSidebarTitle(
  options: SidebarOptions,
  pathname: string,
): string | undefined {
  for (const option of options) {
    if (option.href === pathname) return option.title;

    if (option.children) {
      const childTitle = findActiveSidebarTitle(option.children, pathname);
      if (childTitle) return childTitle;
    }
  }

  return undefined;
}

function isGroupActive(option: SidebarOption, pathname: string) {
  return option.children?.some((child) => child.href === pathname) ?? false;
}

const DashboardWrapper = ({ children, options, navExtra }: Props) => {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);

  return (
    <>
      <div className="flex flex-1 min-w-0">
        {!isMobile && (
          <DashboardSidebar pathname={pathname} options={options || []} />
        )}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-[margin] duration-300",
            !isMobile && (collapsed ? "ml-0" : "ml-0"),
          )}
        >
          <DashboardNav
            options={options}
            pathname={pathname}
            isMobile={isMobile}
            navExtra={navExtra}
          />
          <div className="flex-1 w-full flex flex-col bg-secondary/50 min-w-0">
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
  navExtra?: React.ReactNode;
};

const DashboardNav = ({ isMobile, options, pathname, navExtra }: NavProps) => {
  const activeTitle = options
    ? findActiveSidebarTitle(options, pathname)
    : undefined;
  const { collapsed, toggleCollapsed } = useSidebarStore();

  return (
    <nav className="border-b h-20 shadow">
      <div className="px-6 md:px-8 flex h-full items-center gap-3">
        {isMobile ? (
          <Button
            onClick={() => useSidebarStore.getState().setOpen(true)}
            size={"icon-sm"}
            variant={"ghost"}
          >
            <FiMenu className="size-5" />
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleCollapsed}
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0"
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="size-5" />
                  ) : (
                    <PanelLeftClose className="size-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {activeTitle && (
          <div className="min-w-0">
            <h1 className="text-2xl font-heading font-medium truncate">
              {activeTitle}
            </h1>
          </div>
        )}
        <span className="ml-auto" />
        {navExtra}
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

const NavItemTooltip = ({
  label,
  enabled,
  children,
}: {
  label: string;
  enabled: boolean;
  children: React.ReactNode;
}) => {
  if (!enabled) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
};

const DashboardSidebar = ({ options, sheet, pathname }: SidebarProps) => {
  const { open, setOpen, openGroups, setGroupOpen, collapsed } =
    useSidebarStore();
  const { isAdmin } = useSession();
  const isIconMode = !sheet && collapsed;

  useEffect(() => {
    options.forEach((option) => {
      if (option.children?.length && isGroupActive(option, pathname)) {
        setGroupOpen(option.title, true);
      }
    });
  }, [options, pathname, setGroupOpen]);

  const itemClass = (isActive: boolean, nested = false) =>
    cn(
      "flex items-center cursor-pointer rounded-l-xl ml-2 transition-all duration-200",
      isIconMode
        ? "justify-center px-0 py-2.5 w-11 mx-auto ml-auto mr-auto rounded-xl"
        : "gap-4 px-4 py-2 hover:opacity-90",
      !isIconMode && nested && "pl-8",
      isActive
        ? "bg-secondary/10 text-white"
        : "hover:bg-secondary/10 text-white/50 hover:text-white/75",
    );

  const renderLink = (option: SidebarOption, nested = false) => {
    if (!option.href) return null;

    const isActive = pathname === option.href;
    const Icon = option.Icon;

    const link = (
      <Link
        key={option.href}
        onClick={() => {
          if (sheet) setOpen(false);
        }}
        href={option.href}
        className={itemClass(isActive, nested)}
      >
        {Icon ? (
          <Icon className="size-4 shrink-0" />
        ) : (
          <span
            className={cn(
              "size-1.5 rounded-full shrink-0 bg-current opacity-60",
              isIconMode && "size-2",
            )}
          />
        )}
        {!isIconMode && <span className="truncate">{option.title}</span>}
      </Link>
    );

    return (
      <NavItemTooltip
        key={option.href}
        label={option.title}
        enabled={isIconMode}
      >
        {link}
      </NavItemTooltip>
    );
  };

  const renderOption = (option: SidebarOption, index: number) => {
    if (option.children?.length) {
      const groupActive = isGroupActive(option, pathname);
      const isOpen = isIconMode
        ? false
        : (openGroups[option.title] ?? groupActive);
      const Icon = option.Icon;

      if (isIconMode) {
        return (
          <div key={`${option.title}-${index}`} className="flex flex-col gap-1">
            {option.header ? <span className="mt-3 block" /> : null}
            {option.children.map((child) => renderLink(child, true))}
          </div>
        );
      }

      return (
        <Collapsible
          key={`${option.title}-${index}`}
          open={isOpen}
          onOpenChange={(value) => setGroupOpen(option.title, value)}
        >
          <CollapsibleTrigger className={itemClass(groupActive)}>
            {Icon ? (
              <Icon className="size-4 shrink-0" />
            ) : (
              <span className="size-4" />
            )}
            <span className="flex-1 text-left truncate">{option.title}</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col">
            {option.children.map((child) => renderLink(child, true))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    if (!option.href) return null;

    const link = renderLink(option);

    return option.header && !isIconMode ? (
      <div key={option.href} className="flex flex-col">
        <span className="px-4 text-white/25 tracking-wider mt-6 mb-2 font-normal uppercase text-sm">
          {option.header}
        </span>
        {link}
      </div>
    ) : (
      <React.Fragment key={option.href}>
        {option.header && isIconMode && <span className="mt-4 block" />}
        {link}
      </React.Fragment>
    );
  };

  const sidebar = (
    <div
      className={cn(
        "border-r bg-sidebar flex flex-col h-full transition-[width] duration-300 ease-in-out relative",
        isIconMode ? "w-[4.25rem]" : "w-60 max-w-60",
      )}
    >
      <div
        className={cn(
          "flex h-20 gap-3 border-b border-border/10 items-center",
          isIconMode ? "px-2 justify-center" : "px-4 justify-center",
        )}
      >
        <Logo admin={isAdmin && !isIconMode} icon={isIconMode} />
      </div>
      <span className="mb-4 w-full" />
      <div className="flex flex-col gap-0.5 overflow-y-auto pb-4">
        {options.map((option, index) => renderOption(option, index))}
      </div>
    </div>
  );

  return sheet ? (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-60! p-0">
        <TooltipProvider>{sidebar}</TooltipProvider>
      </SheetContent>
    </Sheet>
  ) : (
    <TooltipProvider>
      <aside className="sticky top-0 h-screen shrink-0">{sidebar}</aside>
    </TooltipProvider>
  );
};

export { DashboardNav, DashboardWrapper };
