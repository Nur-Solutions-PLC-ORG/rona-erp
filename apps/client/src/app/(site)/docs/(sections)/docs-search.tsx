"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import {
  CornerDownLeft,
  FileText,
  Hash,
  History,
  Search,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { POPULAR, SEARCH_INDEX_URL, type SearchPage } from "./search-config";

// ---- Open/close store: shared by the shortcut, header button and hub box ----

let searchState = { open: false, initialQuery: "" };
const listeners = new Set<() => void>();

function setSearchState(next: typeof searchState) {
  searchState = next;
  listeners.forEach((listener) => listener());
}

export function openDocsSearch(initialQuery = "") {
  setSearchState({ open: true, initialQuery });
}

function closeDocsSearch() {
  setSearchState({ open: false, initialQuery: "" });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function useSearchState() {
  return useSyncExternalStore(
    subscribe,
    () => searchState,
    () => searchState,
  );
}

const noopSubscribe = () => () => {};

/** "⌘" on Apple platforms, "Ctrl" elsewhere (after mount). */
export function useModKey() {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/mac|iphone|ipad/i.test(navigator.platform) ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );
}

// ---- Index loading ----

let indexPromise: Promise<SearchPage[]> | null = null;

function loadIndex() {
  indexPromise ??= fetch(SEARCH_INDEX_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Search index: ${response.status}`);
      return response.json() as Promise<{ pages: SearchPage[] }>;
    })
    .then((data) => data.pages)
    .catch((error) => {
      indexPromise = null; // retry on next open
      throw error;
    });
  return indexPromise;
}

// ---- Ranking ----

type Hit = {
  key: string;
  href: string;
  group: string;
  pageTitle: string;
  sectionTitle?: string;
  snippet?: string;
  score: number;
};

const MAX_PER_GROUP = 6;
const MAX_GROUPS = 5;

function termScore(field: string, term: string, weight: number) {
  const index = field.indexOf(term);
  if (index < 0) return 0;
  const atWordStart = index === 0 || /[^a-z0-9]/.test(field[index - 1]);
  return weight + (atWordStart ? weight * 0.25 : 0);
}

/**
 * Every term must match one of the fields; the score sums each term's
 * best-weighted field. Returns 0 when any term is missing.
 */
function scoreFields(terms: string[], fields: [string, number][]) {
  let total = 0;
  for (const term of terms) {
    let best = 0;
    for (const [field, weight] of fields) {
      best = Math.max(best, termScore(field, term, weight));
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

function snippet(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  const index = terms
    .map((term) => lower.indexOf(term))
    .filter((position) => position >= 0)
    .sort((a, b) => a - b)[0];
  if (index === undefined) return undefined;
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + 80);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

function search(pages: SearchPage[], query: string): [string, Hit[]][] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const hits: Hit[] = [];
  for (const page of pages) {
    const title = page.title.toLowerCase();
    const description = page.description.toLowerCase();

    const pageScore = scoreFields(terms, [
      [title, 100],
      [description, 30],
    ]);
    if (pageScore > 0) {
      const inTitle = terms.every((term) => title.includes(term));
      hits.push({
        key: page.href,
        href: page.href,
        group: page.group,
        pageTitle: page.title,
        snippet: inTitle ? undefined : snippet(page.description, terms),
        score: pageScore + (title === query.toLowerCase().trim() ? 50 : 0),
      });
    }

    for (const section of page.sections) {
      const sectionTitle = section.title.toLowerCase();
      const text = section.text.toLowerCase();
      // A section only matches on its own words, not just its page title.
      if (
        !terms.some(
          (term) => sectionTitle.includes(term) || text.includes(term),
        )
      ) {
        continue;
      }
      const score = scoreFields(terms, [
        [sectionTitle, 60],
        [text, 10],
        [title, 5],
      ]);
      if (score === 0) continue;
      const inHeading = terms.every((term) => sectionTitle.includes(term));
      hits.push({
        key: `${page.href}#${section.id}`,
        href: `${page.href}#${section.id}`,
        group: page.group,
        pageTitle: page.title,
        sectionTitle: section.title,
        snippet: inHeading ? undefined : snippet(section.text, terms),
        score,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);

  // Group by docs section, ordering groups by their best hit.
  const groups = new Map<string, Hit[]>();
  for (const hit of hits) {
    const list = groups.get(hit.group) ?? [];
    if (list.length < MAX_PER_GROUP) list.push(hit);
    groups.set(hit.group, list);
  }
  return [...groups.entries()].slice(0, MAX_GROUPS);
}

// ---- Recent searches ----

type Recent = { href: string; pageTitle: string; sectionTitle?: string };
const RECENT_KEY = "rona-docs-recent";

function readRecent(): Recent[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as Recent[];
  } catch {
    return [];
  }
}

function pushRecent(entry: Recent) {
  try {
    const next = [
      entry,
      ...readRecent().filter((item) => item.href !== entry.href),
    ].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // recents are a convenience only
  }
}

// ---- Rendering helpers ----

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  return (
    <>
      {text.split(pattern).map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="bg-tint-2 px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

const ITEM_CLASS =
  "rounded-none! in-data-[slot=dialog-content]:rounded-none! items-start gap-3 border-l-2 border-transparent px-3 py-2.5 data-selected:border-primary data-selected:bg-tint";

function ResultRow({
  icon: Icon,
  title,
  context,
  snippet: snippetText,
  terms,
}: {
  icon: typeof FileText;
  title: string;
  context?: string;
  snippet?: string;
  terms: string[];
}) {
  return (
    <>
      <Icon className="mt-0.5 size-4 text-ink-3" strokeWidth={1.75} />
      <span className="min-w-0 flex-1">
        {context ? (
          <span className="block truncate text-[11px] text-ink-3">
            {context}
          </span>
        ) : null}
        <span className="block truncate text-[13px] font-medium text-ink">
          <Highlight text={title} terms={terms} />
        </span>
        {snippetText ? (
          <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-ink-2">
            <Highlight text={snippetText} terms={terms} />
          </span>
        ) : null}
      </span>
      <CornerDownLeft className="mt-1 size-3.5 text-ink-3 opacity-0 group-data-selected/command-item:opacity-100" />
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center border border-ink/20 bg-tint px-1 font-mono text-[10px] font-semibold text-ink-2">
      {children}
    </kbd>
  );
}

// ---- Dialog ----

/** Mounted once in the docs layout: the dialog plus the global shortcuts. */
export function DocsSearch() {
  const router = useRouter();
  const { open, initialQuery } = useSearchState();

  // Ctrl/⌘+K anywhere; "/" when not typing in a field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (searchState.open) closeDocsSearch();
        else openDocsSearch();
        return;
      }
      const target = event.target as HTMLElement | null;
      const typing =
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      if (event.key === "/" && !typing && !searchState.open) {
        event.preventDefault();
        openDocsSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => (next ? openDocsSearch() : closeDocsSearch())}
      title="Search documentation"
      description="Search pages and sections of the Rona docs"
      className="top-[10vh] max-w-[calc(100%-2rem)] gap-0 rounded-none! border-2 border-ink bg-card p-0 shadow-[6px_6px_0_0_var(--ink)] ring-0 sm:max-w-2xl"
    >
      {open ? (
        <SearchPanel
          key={initialQuery}
          initialQuery={initialQuery}
          onNavigate={(href, recent) => {
            pushRecent(recent);
            closeDocsSearch();
            router.push(href);
          }}
        />
      ) : null}
    </CommandDialog>
  );
}

function SearchPanel({
  initialQuery,
  onNavigate,
}: {
  initialQuery: string;
  onNavigate: (href: string, recent: Recent) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [pages, setPages] = useState<SearchPage[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [recent] = useState(readRecent);

  useEffect(() => {
    let cancelled = false;
    loadIndex()
      .then((data) => !cancelled && setPages(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const terms = useMemo(
    () => query.toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  );
  const groups = useMemo(
    () => (pages ? search(pages, query) : []),
    [pages, query],
  );
  const hasQuery = terms.length > 0;

  return (
    <CommandPrimitive
      shouldFilter={false}
      loop
      className="flex size-full flex-col overflow-hidden bg-card text-ink"
    >
      <div className="flex items-center gap-3 border-b-2 border-ink px-4">
        <Search className="size-4 shrink-0 text-ink-3" strokeWidth={2} />
        <CommandPrimitive.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Search the docs — try “lots”, “invoices”, “JWT”…"
          className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
        />
        <button
          type="button"
          onClick={closeDocsSearch}
          className="shrink-0"
          aria-label="Close search"
        >
          <Kbd>Esc</Kbd>
        </button>
      </div>

      <CommandList className="max-h-[min(60vh,28rem)] px-2 py-2">
        {failed ? (
          <p className="px-3 py-8 text-center text-sm text-ink-2">
            Search is unavailable right now. Try again in a moment.
          </p>
        ) : hasQuery && !pages ? (
          <p className="px-3 py-8 text-center text-sm text-ink-3">Loading…</p>
        ) : null}

        {hasQuery && pages ? (
          <CommandEmpty className="px-3 py-10 text-center text-sm text-ink-2">
            No results for “
            <span className="font-semibold text-ink">{query}</span>”.
            <span className="mt-1 block text-[12px] text-ink-3">
              Try a module name, a status, or an API path.
            </span>
          </CommandEmpty>
        ) : null}

        {hasQuery
          ? groups.map(([group, hits]) => (
              <CommandGroup
                key={group}
                heading={group}
                className="p-0 pb-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:font-bold **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:text-ink-3 **:[[cmdk-group-heading]]:uppercase"
              >
                {hits.map((hit) => (
                  <CommandItem
                    key={hit.key}
                    value={hit.key}
                    onSelect={() =>
                      onNavigate(hit.href, {
                        href: hit.href,
                        pageTitle: hit.pageTitle,
                        sectionTitle: hit.sectionTitle,
                      })
                    }
                    className={ITEM_CLASS}
                  >
                    <ResultRow
                      icon={hit.sectionTitle ? Hash : FileText}
                      title={hit.sectionTitle ?? hit.pageTitle}
                      context={hit.sectionTitle ? hit.pageTitle : undefined}
                      snippet={hit.snippet}
                      terms={terms}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          : null}

        {!hasQuery ? (
          <>
            {recent.length > 0 ? (
              <CommandGroup
                heading="Recent"
                className="p-0 pb-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:font-bold **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:text-ink-3 **:[[cmdk-group-heading]]:uppercase"
              >
                {recent.map((item) => (
                  <CommandItem
                    key={`recent-${item.href}`}
                    value={`recent-${item.href}`}
                    onSelect={() => onNavigate(item.href, item)}
                    className={ITEM_CLASS}
                  >
                    <ResultRow
                      icon={History}
                      title={item.sectionTitle ?? item.pageTitle}
                      context={item.sectionTitle ? item.pageTitle : undefined}
                      terms={[]}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            <CommandGroup
              heading="Popular"
              className="p-0 pb-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:font-bold **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:text-ink-3 **:[[cmdk-group-heading]]:uppercase"
            >
              {POPULAR.map((item) => (
                <CommandItem
                  key={`popular-${item.href}`}
                  value={`popular-${item.href}`}
                  onSelect={() =>
                    onNavigate(item.href, {
                      href: item.href,
                      pageTitle: item.label,
                    })
                  }
                  className={ITEM_CLASS}
                >
                  <ResultRow icon={Star} title={item.label} terms={[]} />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>

      <div className="flex items-center gap-4 border-t border-ink/15 bg-tint/50 px-4 py-2 text-[11px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          navigate
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>↵</Kbd>
          open
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>esc</Kbd>
          close
        </span>
      </div>
    </CommandPrimitive>
  );
}

// ---- Triggers ----

/** Header button: wide "Search docs… ⌘K" from md up, icon-only below. */
export function DocsSearchTrigger({ className }: { className?: string }) {
  const modKey = useModKey();
  return (
    <button
      type="button"
      onClick={() => openDocsSearch()}
      aria-label="Search documentation"
      className={cn(
        "inline-flex h-9 items-center gap-2 border border-ink/30 bg-card text-[12.5px] text-ink-3 transition-colors hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "w-9 justify-center md:w-64 md:justify-start md:px-3",
        className,
      )}
    >
      <Search className="size-4 shrink-0" />
      <span className="hidden flex-1 text-left md:inline">Search docs…</span>
      <span className="hidden items-center gap-1 md:inline-flex">
        <Kbd>{modKey}</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  );
}
