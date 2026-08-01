import UserModal from "@/modules/features/users/modal";
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
    </>
  );
};

export default AdminModals;
