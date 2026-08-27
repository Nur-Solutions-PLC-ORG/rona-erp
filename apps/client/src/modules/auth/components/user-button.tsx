"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateMutation } from "@/hooks/utils";
import { CLIENT_AUTH_SIGNIN_PAGE } from "@rona/routes/auth";
import { useRouter } from "next/navigation";
import { FaUser } from "react-icons/fa6";
import { FiLogOut } from "react-icons/fi";
import { toast } from "sonner";
import { ApiPostSignOut } from "../api";
import { useSession } from "../hooks";

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
        <Avatar className=" cursor-pointer hover:ring-2  hover:ring-border">
          <AvatarFallback className="bg-purple-700 shadow-inner relative overflow-hidden">
            <FaUser className="size-5.5 absolute bottom-0 text-white/50" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mx-2 min-w-52 max-w-64">
        <div className="flex flex-col text-sm items-center justify-center py-2 opacity-90">
          <span className="font-bold">{user?.name}</span>
          <span>{user?.email}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              signOutMutation.mutate({});

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
