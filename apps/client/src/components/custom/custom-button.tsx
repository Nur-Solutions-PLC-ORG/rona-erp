import { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "../ui/button";
import { FiLoader } from "react-icons/fi";
import { IconType } from "react-icons/lib";

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
      {Icon ? (
        isPending ? (
          <FiLoader className="animate-spin" />
        ) : (
          <Icon />
        )
      ) : null}
      {children}
    </Button>
  );
};

export default CustomButton;
