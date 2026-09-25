import { VariantProps } from "class-variance-authority";
import { IconType } from "react-icons/lib";
import { RiLoader5Fill } from "react-icons/ri";
import { Button, buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

const CustomButton = ({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  isPending = false,
  disabled,
  children,
  icon: Icon,
  primary,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  } & {
    isPending?: boolean;
    icon?: IconType | (() => React.ReactNode);
    primary?: boolean;
  }) => {
  return (
    <Button
      className={cn(
        primary &&
          "flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground text-xs font-semibold transition disabled:opacity-50 disabled:pointer-events-none h-8",
        className,
        isPending &&
          (variant == "destructive" ? "bg-red-200/50" : "bg-zinc-300"),
        variant == "destructive" && "border border-red-700/25",
      )}
      variant={variant}
      size={size}
      asChild={asChild}
      disabled={isPending || disabled}
      {...props}
    >
      {isPending ? (
        <RiLoader5Fill className="animate-spin" />
      ) : Icon ? (
        <Icon />
      ) : null}
      {children}
    </Button>
  );
};

export default CustomButton;
