import { useHydrated } from "@/lib/hydrate";
import BranchModal from "@/modules/features/admin/branches/components/modal";
import CompanyModal from "@/modules/features/admin/companies/components/modal";
import CompanySettingsModal from "@/modules/features/admin/company-settings/components/modal";
import DepartmentModal from "@/modules/features/admin/departments/components/modal";
import EmployeeModal from "@/modules/features/admin/employees/components/modal";
import PlatformConfigModal from "@/modules/features/admin/platform-configs/components/modal";
import UserModal from "@/modules/features/admin/users/components/modal";

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
