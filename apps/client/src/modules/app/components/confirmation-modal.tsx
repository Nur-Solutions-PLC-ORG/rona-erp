import CustomButton from "@/components/custom/custom-button";
import DialogWrapper from "@/components/custom/dialog-wrapper";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { useConfirmationModalStore } from "@/store";
import { Loader2 } from "lucide-react";

export function ConfirmationModal() {
  const {
    handleClick,
    isLoading,
    variant,
    title,
    description,
    open,
    closeModal,
  } = useConfirmationModalStore();

  return (
    <DialogWrapper
      title="Confirm"
      info={`Are you absolutely sure you want to ${title}?`}
      description={
        description
          ? `This action cannot be undone. This will permanently ${description}.`
          : undefined
      }
      open={open}
      onOpen={() => closeModal()}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <CustomButton
            isPending={isLoading}
            onClick={handleClick ?? undefined}
            variant={variant}
            type="button"
          >
            Confirm
          </CustomButton>
        </>
      }
    />
  );
}
