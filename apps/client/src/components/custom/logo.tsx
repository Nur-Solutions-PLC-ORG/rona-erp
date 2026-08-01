import { cn } from "@/lib/utils";
import Image from "next/image";

type Props = {
  className?: string;
  black?: boolean;
  icon?: boolean;
  admin?: boolean;
};

const Logo = ({ className, icon, black, admin }: Props) => {
  return (
    <Image
      src={
        icon
          ? "/rona-icon.png"
          : black
            ? "/rona-logo-black.png"
            : admin
              ? "/rona-logo-admin.png"
              : "/rona-logo.png"
      }
      alt="rona-logo"
      width={200}
      height={200}
      className={cn("w-20", icon && "w-10", admin && "w-36", className)}
    />
  );
};
export default Logo;
