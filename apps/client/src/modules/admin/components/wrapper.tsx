"use client";

import { DashboardWrapper } from "@/modules/app/components/dashboard";
import {
  LuBuilding2,
  LuGitBranch,
  LuNetwork,
  LuSettings,
  LuUsersRound,
  LuWrench,
} from "react-icons/lu";

import { FaUsers } from "react-icons/fa6";
import { GoHome } from "react-icons/go";
import AdminModals from "./modals";

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
            title: "Organization",
            Icon: LuBuilding2,
            children: [
              {
                title: "Organizations",
                href: "/admin/organizations",
                Icon: LuBuilding2,
              },
              {
                title: "Departments",
                href: "/admin/departments",
                Icon: LuNetwork,
              },
              {
                title: "Branches",
                href: "/admin/branches",
                Icon: LuGitBranch,
              },
              {
                title: "Employees",
                href: "/admin/employees",
                Icon: LuUsersRound,
              },
            ],
          },
          {
            header: "Settings",
            title: "Org. Settings",
            href: "/admin/organization-settings",
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
