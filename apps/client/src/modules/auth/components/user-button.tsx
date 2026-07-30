"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useCreateMutation } from "@/hooks/utils";
import { FaUser } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { toast } from "sonner";
import { ApiPostSignOut } from "../api";
import { useSession } from "../hooks";
import { useRouter } from "next/navigation";
import { CLIENT_AUTH_SIGNIN_PAGE } from "@rona/routes/auth";

const UserButton = () => {
  const { user } = useSession();
  const router = useRouter();

  const signOutMutation = useCreateMutation(
    ApiPostSignOut,
    () => {
      router.push(CLIENT_AUTH_SIGNIN_PAGE);
      location.reload();
    },
    (data) => {
      toast.error(data.message);
    },
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarFallback className="bg-primary shadow-inner">
            <FaUser className="size-6 absolute bottom-0 right-0 opacity-50 text-white" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mx-2 min-w-52 max-w-64">
        <div className="flex flex-col p-2">
          <span className="text-sm">{user?.email}</span>
        </div>
        <Separator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              signOutMutation.mutate();

              toast.info("Signing out...");
            }}
          >
            <FiLogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default UserButton;
