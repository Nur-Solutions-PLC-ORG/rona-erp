import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugToString(slug: string) {
  const spaced = slug.replace("_", " ").replace("-", " ");
  const capitalized = spaced
    .split(" ")
    .map((item) => item[0].toUpperCase() + item.slice(1))
    .join(" ");
  return capitalized;
}
