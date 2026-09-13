import { UseCustomSearchParamsReturn } from "@/hooks/search-params";
import SearchInput from "./search-input";
import z from "zod";
import { getSchemaInfo } from "@/lib/zod";
import Dropdown from "./dropdown";
import { slugToString } from "@/lib/utils";
import { Button } from "../ui/button";
import { useEffect, useRef, useState } from "react";

type FilterOption = { label: string; value: string };

type FilterReplacement = {
  label?: string;
  options: FilterOption[];
};

type Props<TSearchParams> = {
  head?: React.ReactNode;
  searchParamsSchema?: z.ZodObject;
  replacements?: Record<string, FilterReplacement>;
} & UseCustomSearchParamsReturn<TSearchParams>;

function DataHeader<TSearchParams>({
  head,
  searchParamsSchema,
  replacements = {},
  searchParams,
  updateParams,
  clearParams,
  removeParams,
}: Props<TSearchParams>) {
  const schemaInfo = getSchemaInfo(searchParamsSchema ?? z.object({}));
  const SEARCH_QUERY_KEY = "searchQuery";
  const includeSearchQuery = schemaInfo.hasKey(SEARCH_QUERY_KEY);
  const searchQuery = (searchParams[SEARCH_QUERY_KEY as keyof TSearchParams] ||
    "") as string;
  const [searchQueryInput, setSearchQueryInput] = useState(searchQuery);
  const searchQueryTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(searchQueryTimeout.current);
  }, []);

  const handleClearParams = () => {
    setSearchQueryInput("");
    clearParams();
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
          <SearchInput
            value={searchQueryInput}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQueryInput(value);
              window.clearTimeout(searchQueryTimeout.current);

              if (!value) {
                removeParams([SEARCH_QUERY_KEY as keyof TSearchParams]);
                return;
              }

              searchQueryTimeout.current = window.setTimeout(() => {
                updateParams({
                  [SEARCH_QUERY_KEY as keyof TSearchParams]: value,
                } as Partial<TSearchParams>);
              }, 600);
            }}
            className="h-8! rounded-md bg-zinc-100! border-transparent! text-xs placeholder:text-zinc-400 focus-visible:bg-white! focus-visible:ring-1! focus-visible:ring-zinc-500!"
            containerClassName="flex-1 md:max-w-80"
            placeholder="Search anything..."
          />
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

          {!!Object.values(searchParams as object).length && (
            <button
              onClick={handleClearParams}
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
