"use client";

import { DashboardWrapper } from "@/modules/app/components/dashboard";
import { LuBuilding2, LuSettings, LuWrench } from "react-icons/lu";

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
            header: "Management",
            title: "Users",
            href: "/admin/users",
            Icon: FaUsers,
          },
          {
            title: "Organizations",
            href: "/admin/organizations",
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
            title: "Organization Settings",
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
