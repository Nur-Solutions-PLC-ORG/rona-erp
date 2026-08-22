import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { cn } from "@/lib/utils";

interface DialogWrapperProps {
  open: boolean;
  onOpen: (open: boolean) => void;
  title?: string;
  description?: string;
  info?: string;
  children?: React.ReactNode;
  className?: string;
  light?: boolean;
  footer?: React.ReactNode;
}

const DialogWrapper: React.FC<DialogWrapperProps> = ({
  open,
  onOpen,
  title,
  description,
  className,
  children,
  light,
  footer,
  info,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent
        aria-describedby="Dialog content"
        className={cn(className)}
      >
        <DialogHeader>
          <DialogTitle className={cn(light ? "text-base" : "text-lg")}>
            {title}
          </DialogTitle>
          {info && <p className="text-base opacity-80">{info}</p>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children && <div className="overflow-auto pb-5">{children}</div>}

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};

export default DialogWrapper;
