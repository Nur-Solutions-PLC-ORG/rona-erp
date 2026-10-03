"use client";

import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
}

export default function SearchInput({
  value,
  onChange,
  onKeyDown,
  placeholder ="Search…",
  className = "h-9 rounded-md bg-card border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors",
  containerClassName = "",
}: SearchInputProps) {
  return (
    <div className={cn("relative", containerClassName)}>
      <HiOutlineMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn(
          "w-full pl-8 pr-3 [&::-webkit-search-cancel-button]:hidden",
          className,
        )}
      />
    </div>
  );
}
