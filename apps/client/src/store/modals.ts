import { create } from "zustand";

interface ModalStore {
  open: string;
  data?: unknown;
  view?: boolean;
  closeModal: () => void;
  openModal: (value: string, data?: unknown, view?: boolean) => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  open: "",
  closeModal: () => {
    set({
      open: "",
    });
  },
  openModal: (value, data, view) => {
    set({
      open: value,
      data,
      view,
    });
  },
}));

interface ConfirmationModalStore {
  openModal: (data: {
    title: string;
    onClick: () => Promise<void>;
    description?: string;
    onCompleted?: () => void;
    variant?: "default" | "destructive";
  }) => void;

  open: boolean;
  variant?: "default" | "destructive";
  isLoading: boolean;

  title: string | null;
  description: string | null;

  handleClick: (() => Promise<void>) | null;

  closeModal: () => void;
}

export const useConfirmationModalStore = create<ConfirmationModalStore>(
  (set, get) => ({
    open: false,
    title: null,
    description: null,
    handleClick: null,
    isLoading: false,

    openModal: ({ title, description, onClick, variant }) => {
      const handleClick = async () => {
        set({ isLoading: true });

        await onClick();

        get().closeModal();
      };

      set({
        open: true,
        title: title ?? null,
        description: description ?? null,
        handleClick: handleClick,
        variant: variant,
      });
    },

    closeModal: () =>
      set({
        open: false,
        title: null,
        description: null,
        handleClick: null,
        isLoading: false,
      }),
  }),
);
