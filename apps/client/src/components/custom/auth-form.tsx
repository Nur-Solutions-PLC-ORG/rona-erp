"use client";

import { cn } from "@/lib/utils";
import { Eye, EyeClosed } from "lucide-react";
import { useState } from "react";

export const AUTH_INPUT =
  "w-full px-3.5 py-2.5 rounded-md bg-zinc-50 border border-zinc-200/70 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 focus:bg-white transition text-sm";

export const AUTH_PRIMARY_BUTTON =
  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none";

export const AUTH_OUTLINE_BUTTON =
  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-medium transition border border-zinc-200 disabled:opacity-50 disabled:pointer-events-none";

export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1.5">
      <h1 className="text-xl font-bold tracking-tight text-zinc-900">
        {title}
      </h1>
      {description ? (
        <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
      ) : null}
    </div>
  );
}

export function AuthField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-zinc-700">
        {label}
      </label>
      {children}
      {error ? <p className="text-[11px] text-rose-600">{error}</p> : null}
    </div>
  );
}

export function AuthPasswordInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(AUTH_INPUT, "pr-10", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((value) => !value)}
        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <EyeClosed className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export function AuthDivider({ label = "OR" }: { label?: string }) {
  return (
    <div className="flex w-full items-center gap-3">
      <span className="h-px flex-1 bg-zinc-200" />
      <span className="text-[11px] font-medium tracking-widest text-zinc-400">
        {label}
      </span>
      <span className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}
