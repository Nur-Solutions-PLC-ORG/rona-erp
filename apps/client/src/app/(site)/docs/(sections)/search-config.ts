// Shared by the docs pages, the search dialog and the search-index route.

/** Docs groups keyed by their first URL segment, in sidebar order. */
export const DOC_GROUPS: { segment: string; label: string }[] = [
  { segment: "getting-started", label: "Getting Started" },
  { segment: "modules", label: "Core Modules" },
  { segment: "admin", label: "Admin & Permissions" },
  { segment: "ai", label: "Rona AI" },
  { segment: "api", label: "API Reference" },
];

export const POPULAR: { label: string; href: string }[] = [
  { label: "Set up your workspace", href: "/docs/getting-started/setup" },
  {
    label: "Run your first production order",
    href: "/docs/getting-started/first-steps",
  },
  { label: "Trace a lot in five hops", href: "/docs/ai/tracing" },
  { label: "Understand RBAC", href: "/docs/admin/roles" },
];

export const SEARCH_INDEX_URL = "/docs/search-index.json";

export type SearchSection = { id: string; title: string; text: string };

export type SearchPage = {
  href: string;
  group: string;
  title: string;
  description: string;
  sections: SearchSection[];
};

/** Heading text -> anchor id. Used for section ids and search deep links. */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
