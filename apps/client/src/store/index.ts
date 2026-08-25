import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  openGroups: Record<string, boolean>;
  setGroupOpen: (groupKey: string, open: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      open: false,
      setOpen: (open) => set({ open }),
      collapsed: false,
      setCollapsed: (collapsed) => set({ collapsed }),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      openGroups: {},
      setGroupOpen: (groupKey, open) =>
        set((state) => ({
          openGroups: { ...state.openGroups, [groupKey]: open },
        })),
    }),
    {
      name: "rona-sidebar",
      partialize: (state) => ({
        collapsed: state.collapsed,
        openGroups: state.openGroups,
      }),
    },
  ),
);

// exports
export * from "./modals";
