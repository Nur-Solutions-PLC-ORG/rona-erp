"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LuBuilding2, LuCheck, LuChevronsUpDown } from "react-icons/lu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentOrganization } from "@/modules/workspace/hooks";
import { useOrganizationStore } from "@/store/organization";
import Spinner from "@/components/custom/spinner";
import { cn } from "@/lib/utils";

const OrganizationSwitcher = () => {
  const { organization, memberships, organizationId, isLoading } =
    useCurrentOrganization();
  const setOrganizationId = useOrganizationStore((s) => s.setOrganizationId);
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div className="flex h-9 w-48 items-center rounded-md bg-secondary/20 px-4">
        <Spinner className="h-4 w-4 text-zinc-400" />
      </div>
    );
  }

  if (!organization) return null;

  const handleSwitch = (id: string) => {
    if (id === organizationId) return;
    setOrganizationId(id);
    queryClient.invalidateQueries();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-9 max-w-64 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-secondary/10 focus:outline-none">
        <LuBuilding2 className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{organization.name}</span>
        <LuChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.organizationId}
            onClick={() => handleSwitch(membership.organizationId)}
          >
            <LuCheck
              className={cn(
                "size-4 shrink-0",
                membership.organizationId !== organizationId &&
                  "text-transparent",
              )}
            />
            <span className="truncate">
              {membership.organization?.name ?? membership.organizationId}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrganizationSwitcher;
