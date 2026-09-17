"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineBars3,
  HiOutlineXMark,
} from "react-icons/hi2";

type Props = {
  links: { label: string; href: string }[];
  ctaHref?: string;
  ctaLabel?: string;
};

export function MobileMenu({
  links,
  ctaHref = "/sign-in",
  ctaLabel = "Launch Workspace",
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="site-mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center border border-[#e9e2f2] text-[#5c4d77] transition-colors hover:bg-[#f3eefb] hover:text-[#581c87]"
      >
        {open ? (
          <HiOutlineXMark className="h-5 w-5" />
        ) : (
          <HiOutlineBars3 className="h-5 w-5" />
        )}
      </button>

      {open ? (
        <div
          id="site-mobile-menu"
          className="absolute inset-x-0 top-14 border-b border-[#581c87] bg-white shadow-sm"
        >
          <nav className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-6 pt-2 sm:px-6">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-[#e9e2f2] py-3.5 text-[13px] font-medium text-[#5c4d77] hover:text-[#581c87] last:border-0"
              >
                {link.label}
              </a>
            ))}
            <Link
              href={ctaHref}
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex items-center justify-center gap-2 border border-[#581c87] bg-[#581c87] px-4 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-white hover:text-[#581c87]"
            >
              {ctaLabel}
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
