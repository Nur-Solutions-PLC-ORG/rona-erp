"use client";

import { DashboardWrapper } from "@/modules/app/components/dashboard";
import {
  LuBadge,
  LuBuilding,
  LuBuilding2,
  LuFactory,
  LuGitFork,
  LuGroup,
  LuNfc,
  LuSettings,
  LuSettings2,
  LuUserPlus,
  LuUsers,
  LuWrench,
} from "react-icons/lu";

import { GoHome } from "react-icons/go";
import AdminModals from "../modals";
import { FaCodeFork, FaScrewdriver, FaUsers } from "react-icons/fa6";
import {
  RiAccountBox2Fill,
  RiAccountCircleLine,
  RiTeamLine,
  RiUser2Fill,
  RiUser5Line,
} from "react-icons/ri";
import { GitFork, Nfc } from "lucide-react";

type Props = {
  children: React.ReactNode;
};

const AdminWrapper = ({ children }: Props) => {
  return (
    <>
      <DashboardWrapper
        options={[
          {
            title: "Home",
            href: "/admin",
            Icon: GoHome,
          },
          {
            header: "Tables",
            title: "Users",
            href: "/admin/users",
            Icon: FaUsers,
          },
          {
            title: "Companies",
            href: "/admin/companies",
            Icon: LuBuilding2,
          },
          {
            title: "Departments",
            href: "/admin/departments",
          },
          {
            title: "Branches",
            href: "/admin/branches",
          },
          {
            title: "Employees",
            href: "/admin/employees",
          },
          {
            header: "Settings",
            title: "Companies Settings",
            href: "/admin/companies-settings",
            Icon: LuSettings,
          },
          {
            title: "Platform Configs",
            href: "/admin/configs",
            Icon: LuWrench,
          },
        ]}
      >
        {children}
      </DashboardWrapper>

      <AdminModals />
    </>
  );
};
export default AdminWrapper;
