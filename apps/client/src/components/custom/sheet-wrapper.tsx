import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import React from "react";
import { buttonVariants } from "../ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

interface SheetWrapperProps {
  side?: "bottom" | "left" | "right";
  open?: boolean;
  onOpen?: (open: boolean) => void;
  title?: string;
  description?: string;
  noBottom?: boolean;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  raw?: boolean;
  divClassName?: string;
}

const SheetWrapper: React.FC<SheetWrapperProps> = ({
  side = "right",
  open,
  onOpen,
  title,
  description,
  noBottom,
  raw,
  children,
  trigger,
  className,
  divClassName,
}) => {
  const isMobile = useIsMobile();
  return (
    <Sheet open={open} onOpenChange={onOpen}>
      {trigger && <SheetTrigger>{trigger}</SheetTrigger>}
      <SheetContent
        aria-describedby={description || "This is just a sheet form."}
        side={isMobile && side === "right" && !noBottom ? "bottom" : side}
        className={cn(
          "space-y-0 gap-2 z-50! md:min-w-xl",
          isMobile && !raw && "min-h-[80vh] max-h-[90vh]",
          className,
        )}
      >
        {raw ? (
          <>
            <SheetTitle className={cn("sr-only")}>
              {"This is just a sheet aside component"}
            </SheetTitle>
            {children}
          </>
        ) : (
          <>
            {(title || description) && (
              <SheetHeader className="border-b px-10 py-6">
                <SheetTitle className="text-lg">{title}</SheetTitle>
                {description && (
                  <SheetDescription>{description}</SheetDescription>
                )}
              </SheetHeader>
            )}
            <div
              className={cn(
                "px-4 pb-10 overflow-auto flex flex-col",
                divClassName,
              )}
            >
              {children}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

type SFWProps = {
  children: React.ReactNode;
};

export const SheetFooterWrapper = ({ children }: SFWProps) => {
  return (
    <SheetFooter className="flex-row items-center justify-start gap-6">
      <SheetClose className={buttonVariants({ variant: "secondary" })}>
        Cancel
      </SheetClose>
      {children}
    </SheetFooter>
  );
};

export default SheetWrapper;
