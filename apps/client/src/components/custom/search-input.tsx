import { LuSearch } from "react-icons/lu";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

export default function SearchInput({
  containerClassName,
  className,
  translucent,
  ...props
}: React.ComponentProps<"input"> & {
  containerClassName?: string;
  translucent?: boolean;
}) {
  return (
    <div className={cn("relative", containerClassName)}>
      <LuSearch className="absolute top-1/2 -translate-y-1/2 opacity-25 ml-2.5 size-4" />
      <Input
        className={cn(
          "pl-10",
          translucent && "bg-white/75 border-none",
          className,
        )}
        {...props}
      />
    </div>
  );
}
