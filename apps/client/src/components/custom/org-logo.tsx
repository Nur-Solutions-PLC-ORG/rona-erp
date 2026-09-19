import { cn } from "@/lib/utils";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
};

const OrgLogo = ({
  src,
  alt = "Organization logo",
  className,
  iconClassName,
}: Props) => {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn(
          "h-8 w-8 shrink-0 rounded-md bg-zinc-100 object-contain border border-zinc-200",
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600",
        className,
      )}
    >
      <HiOutlineBuildingOffice2 className={cn("h-4 w-4", iconClassName)} />
    </span>
  );
};

export default OrgLogo;