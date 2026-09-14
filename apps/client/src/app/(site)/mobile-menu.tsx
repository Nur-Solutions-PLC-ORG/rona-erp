"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineBars3,
  HiOutlineXMark,
} from "react-icons/hi2";

type Props = {
  links: { label: string; href: string }[];
};

export function MobileMenu({ links }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50"
      >
        {open ? (
          <HiOutlineXMark className="h-5 w-5" />
        ) : (
          <HiOutlineBars3 className="h-5 w-5" />
        )}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-16 border-b border-zinc-200 bg-white px-4 pb-6 shadow-sm">
          <nav className="mx-auto max-w-6xl flex flex-col">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-zinc-100 py-3.5 text-sm font-medium text-zinc-700 last:border-0"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="group mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Launch Workspace
              <HiOutlineArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
