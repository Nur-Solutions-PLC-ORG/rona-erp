"use client";

import { DashboardWrapper } from "@/modules/app/components/dashboard";
import {
  LuBuilding,
  LuFactory,
  LuGroup,
  LuSettings,
  LuSettings2,
  LuUserPlus,
  LuUsers,
} from "react-icons/lu";

import { GoHome } from "react-icons/go";
import AdminModals from "../modals";

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
            Icon: LuUsers,
          },
          {
            title: "Companies",
            href: "/admin/companies",
            Icon: LuFactory,
          },

          {
            title: "Departments",
            href: "/admin/departments",
            Icon: LuBuilding,
          },
          {
            title: "Branches",
            href: "/admin/branches",
            Icon: LuGroup,
          },
          {
            title: "Employees",
            href: "/admin/employees",
            Icon: LuUserPlus,
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
            Icon: LuSettings2,
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
