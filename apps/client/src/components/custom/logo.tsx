import { cn } from "@/lib/utils";
import Image from "next/image";

type Props = {
  className?: string;
  black?: boolean;
  icon?: boolean;
};

const Logo = ({ className, icon, black }: Props) => {
  return (
    <Image
      src={
        icon
          ? "/rona-icon.png"
          : black
            ? "/rona-logo-black.png"
            : "/rona-logo.png"
      }
      alt="rona-logo"
      width={200}
      height={200}
      className={cn("w-20", className)}
    />
  );
};
export default Logo;
