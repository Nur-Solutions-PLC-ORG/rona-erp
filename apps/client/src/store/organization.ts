import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OrganizationState {
  organizationId: string | null;
  setOrganizationId: (organizationId: string | null) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      organizationId: null,
      setOrganizationId: (organizationId) => set({ organizationId }),
    }),
    { name: "rona-organization" }
  )
);
