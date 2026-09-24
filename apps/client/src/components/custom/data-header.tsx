import { UseCustomSearchParamsReturn } from "@/hooks/search-params";
import SearchInput from "./search-input";
import z from "zod";
import { getSchemaInfo } from "@/lib/zod";
import Dropdown from "./dropdown";
import { slugToString } from "@/lib/utils";
import { useState } from "react";
import { Search } from "lucide-react";

type FilterOption = { label: string; value: string };

type FilterReplacement = {
  label?: string;
  options: FilterOption[];
};

type Props<TSearchParams> = {
  head?: React.ReactNode;
  searchParamsSchema?: z.ZodObject;
  replacements?: Record<string, FilterReplacement>;
  /** Controlled local search (filters already-loaded rows). */
  localSearch?: string;
  onLocalSearchChange?: (value: string) => void;
  /** Commit search to the server (refetch from backend). */
  onSearchServer?: (value: string) => void;
} & Omit<UseCustomSearchParamsReturn<TSearchParams>, "requestSearchParams">;

function DataHeader<TSearchParams>({
  head,
  searchParamsSchema,
  replacements = {},
  searchParams,
  updateParams,
  clearParams,
  removeParams,
  localSearch,
  onLocalSearchChange,
  onSearchServer,
}: Props<TSearchParams>) {
  const schemaInfo = getSchemaInfo(searchParamsSchema ?? z.object({}));
  const SEARCH_QUERY_KEY = "searchQuery";
  const includeSearchQuery = schemaInfo.hasKey(SEARCH_QUERY_KEY);

  const externalSearchValue =
    (searchParams[SEARCH_QUERY_KEY as keyof TSearchParams] || "") as string;

  const isLocallyControlled = localSearch !== undefined;
  const [draftSearch, setDraftSearch] = useState(
    () => localSearch ?? externalSearchValue,
  );
  const [prevExternalSearch, setPrevExternalSearch] =
    useState(externalSearchValue);

  // Sync draft from URL when the input is not controlled by localSearch.
  if (!isLocallyControlled && externalSearchValue !== prevExternalSearch) {
    setPrevExternalSearch(externalSearchValue);
    setDraftSearch(externalSearchValue);
  }

  const searchInput = isLocallyControlled ? localSearch : draftSearch;

  const handleSearchInput = (value: string) => {
    if (!isLocallyControlled) {
      setDraftSearch(value);
    }
    onLocalSearchChange?.(value);
  };

  const commitServerSearch = () => {
    const value = searchInput.trim();
    if (onSearchServer) {
      onSearchServer(value);
      return;
    }

    if (value) {
      updateParams({
        [SEARCH_QUERY_KEY as keyof TSearchParams]: value,
      } as Partial<TSearchParams>);
    } else {
      removeParams([SEARCH_QUERY_KEY as keyof TSearchParams]);
    }
  };

  return (
    <div id="data-header" className="flex flex-col gap-3">
      {head && (
        <div className="flex">
          <span className="mr-auto" />
          {head}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-2 md:items-center md:flex-wrap bg-white p-3 sm:p-4 rounded-lg border border-zinc-200">
        {includeSearchQuery && (
          <div className="flex flex-1 items-center gap-2 md:max-w-120">
            <SearchInput
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitServerSearch();
                }
              }}
              className="h-8! rounded-md bg-zinc-100! border-transparent! text-xs placeholder:text-zinc-400 focus-visible:bg-white! focus-visible:ring-1! focus-visible:ring-zinc-500!"
              containerClassName="flex-1"
              placeholder="Filter loaded rows… (Enter to search server)"
            />
            <button
              type="button"
              onClick={commitServerSearch}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition border border-zinc-200 shrink-0 h-8"
            >
              <Search className="size-3.5" />
              Search server
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          {[
            ...Object.keys(schemaInfo.keyValueLists),
            ...Object.keys(replacements).filter(
              (key) => !schemaInfo.keyValueLists[key],
            ),
          ].map((key) => {
            const replacement = replacements[key];
            const options =
              replacement?.options ??
              schemaInfo.keyValueLists[key].map((item) => ({
                label: slugToString(item),
                value: item,
              }));
            const value = searchParams[
              key as keyof TSearchParams
            ] as unknown as string;

            return (
              <div key={key}>
                <Dropdown
                  placeholder={
                    "Select " + (replacement?.label ?? slugToString(key))
                  }
                  value={value}
                  className="h-8! bg-zinc-50! rounded-md! text-xs min-w-36 focus:ring-1! focus:ring-zinc-500!"
                  onChange={(newValue) => {
                    if (!newValue) {
                      removeParams([key as keyof TSearchParams]);
                      return;
                    }
                    updateParams({
                      [key]: newValue,
                    } as unknown as Partial<TSearchParams>);
                  }}
                  options={[...options]}
                ></Dropdown>
              </div>
            );
          })}

          {(!!Object.values(searchParams as object).length ||
            !!searchInput) && (
            <button
              onClick={() => {
                handleSearchInput("");
                clearParams();
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition border border-zinc-200 disabled:opacity-50 disabled:pointer-events-none h-8"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataHeader;
