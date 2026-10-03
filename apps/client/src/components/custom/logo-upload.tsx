"use client";

import { useRef } from "react";
import { HiOutlineCamera, HiOutlineTrash } from "react-icons/hi2";
import { toast } from "sonner";
import OrgLogo from "./org-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_FILE_BYTES = 1_000_000;

type Props = {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

const LogoUpload = ({ value, onChange, disabled }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      toast.error("Image must be 1 MB or smaller");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-start gap-3">
      <OrgLogo src={value ?? null} className="mt-0.5 h-12 w-12" />

      <div className="flex-1 space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <HiOutlineCamera className="size-3.5" />
            Upload logo
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange(null)}
            >
              <HiOutlineTrash className="size-3.5" />
              Remove
            </Button>
          ) : null}
        </div>
        <Input
          type="text"
          value={value && /^https:\/\/.+/i.test(value) ? value : ""}
          disabled={disabled}
          placeholder="… or paste an https:// logo URL"
          onChange={(event) => onChange(event.target.value.trim())}
        />
      </div>
    </div>
  );
};

export default LogoUpload;