import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { cn } from "@/lib/utils";

interface DialogWrapperProps {
  open: boolean;
  onOpen: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}

const DialogWrapper: React.FC<DialogWrapperProps> = ({
  open,
  onOpen,
  title,
  description,
  className,
  children,
  light,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent
        aria-describedby="Dialog content"
        className={cn("space-y-0 gap-4 p-0", className)}
      >
        <DialogHeader className="border-b pb-4 p-6 pt-12">
          <DialogTitle
            className={cn(
              !light ? "text-lg leading-[1.2] font-semibold" : "text-base",
            )}
          >
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="overflow-auto px-5 pb-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogWrapper;
