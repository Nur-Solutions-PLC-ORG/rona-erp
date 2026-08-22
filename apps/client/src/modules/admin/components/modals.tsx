import { useHydrated } from "@/lib/hydrate";
import BranchModal from "@/modules/features/platform/branches/components/modal";
import CompanyModal from "@/modules/features/platform/companies/components/modal";
import CompanySettingsModal from "@/modules/features/platform/company-settings/components/modal";
import DepartmentModal from "@/modules/features/platform/departments/components/modal";
import EmployeeModal from "@/modules/features/platform/employees/components/modal";
import PlatformConfigModal from "@/modules/features/platform/platform-configs/components/modal";
import UserModal from "@/modules/features/platform/users/components/modal";

const AdminModals = () => {
  const mounted = useHydrated();

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
