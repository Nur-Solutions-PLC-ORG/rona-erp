import { VariantProps } from "class-variance-authority";
import { IconType } from "react-icons/lib";
import { RiLoader5Fill } from "react-icons/ri";
import { Button, buttonVariants } from "../ui/button";

const CustomButton = ({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  isPending = false,
  disabled,
  children,
  icon: Icon,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  } & {
    isPending?: boolean;
    icon?: IconType | (() => React.ReactNode);
  }) => {
  return (
    <Button
      className={className}
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
