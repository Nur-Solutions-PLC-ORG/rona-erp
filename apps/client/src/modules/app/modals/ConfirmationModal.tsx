import DialogWrapper from "@/components/custom/dialog-wrapper";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
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
      title={`Are you absolutely sure you want to ${title}?`}
      description={
        description
          ? `This action cannot be undone. This will permanently ${description}.`
          : undefined
      }
      open={open}
      onOpen={() => closeModal()}
      className="max-w-md"
      light
    >
      <DialogFooter className="border-t-0 pb-0 px-0 pt-0">
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
      </DialogFooter>
    </DialogWrapper>
  );
}
