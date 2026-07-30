import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { Button } from "../ui/button";

export default function PasswordInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  const [iType, setIType] = useState<"password" | "text">("password");
  return (
    <div className={cn("w-fit flex relative", className)}>
      <Input className={className} {...props} type={iType} />
      <Button
        type="button"
        onClick={() => setIType(iType == "password" ? "text" : "password")}
        size={"icon-sm"}
        variant={"ghost"}
        className="absolute top-1/2 -translate-y-1/2 right-1 z-10"
      >
        {iType == "password" ? <Eye /> : <EyeClosed />}
      </Button>
    </div>
  );
}
