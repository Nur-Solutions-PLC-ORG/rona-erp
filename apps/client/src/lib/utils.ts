import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseDate = (d: string | Date) => new Date(d);

export function slugToString(slug: string): string {
  if (!slug) return "";

  return slug
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function stringToSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createLookup<T, K extends keyof T, V extends keyof T>(
  items: T[],
  keyProp: K,
  valueProp: V,
): Record<string, T[V]> {
  return (items || []).reduce(
    (acc, item) => {
      const key = String(item[keyProp]);
      acc[key] = item[valueProp];
      return acc;
    },
    {} as Record<string, T[V]>,
  );
}
