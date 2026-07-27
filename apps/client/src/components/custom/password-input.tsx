import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { Button } from "../ui/button";

export default function PasswordInput({
  className,
  type: _,
  ...props
}: React.ComponentProps<"input">) {
  const [iType, setIType] = useState<"password" | "text">("password");
  return (
    <div className={cn("w-fit flex relative", className)}>
      <Input type={iType} className={className} {...props} />
      <Button
        onClick={() => setIType(iType == "password" ? "text" : "password")}
        size={"icon-sm"}
        variant={"ghost"}
        className="absolute top-1/2 -translate-y-1/2 right-1"
      >
        {iType == "password" ? <Eye /> : <EyeClosed />}
      </Button>
    </div>
  );
}
