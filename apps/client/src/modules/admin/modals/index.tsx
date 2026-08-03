import UserModal from "@/modules/features/users/modal";
import BranchModal from "@/modules/features/branches/modal";
import CompanyModal from "@/modules/features/companies/modal";
import CompanySettingsModal from "@/modules/features/company-settings/modal";
import DepartmentModal from "@/modules/features/departments/modal";
import EmployeeModal from "@/modules/features/employees/modal";
import PlatformConfigModal from "@/modules/features/platform-configs/modal";
import { useEffect, useState } from "react";

const AdminModals = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <UserModal />
      <CompanyModal />
      <DepartmentModal />
      <BranchModal />
      <EmployeeModal />
      <CompanySettingsModal />
      <PlatformConfigModal />
    </>
  );
};

export default AdminModals;
