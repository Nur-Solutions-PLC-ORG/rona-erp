import { useHydrated } from "@/lib/hydrate";
import BranchModal from "@/modules/features/admin/branches/components/modal";
import OrganizationModal from "@/modules/features/admin/organizations/components/modal";
import OrganizationSettingsModal from "@/modules/features/admin/organization-settings/components/modal";
import DepartmentModal from "@/modules/features/admin/departments/components/modal";
import EmployeeModal from "@/modules/features/admin/employees/components/modal";
import PlatformConfigModal from "@/modules/features/admin/platform-configs/components/modal";
import UserModal from "@/modules/features/admin/users/components/modal";
import UserCredentialsModal from "@/modules/features/admin/users/components/credentials-modal";

const AdminModals = () => {
  const mounted = useHydrated();

  if (!mounted) return null;

  return (
    <>
      <UserModal />
      <UserCredentialsModal />
      <OrganizationModal />
      <DepartmentModal />
      <BranchModal />
      <EmployeeModal />
      <OrganizationSettingsModal />
      <PlatformConfigModal />
    </>
  );
};

export default AdminModals;
