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
      light
      footer={
        <>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={isLoading}
            onClick={handleClick ?? undefined}
            variant={variant}
            type="button"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </>
      }
    />
  );
}
