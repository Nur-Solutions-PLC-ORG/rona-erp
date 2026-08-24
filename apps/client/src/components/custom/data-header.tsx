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
    <div id="data-header" className="flex flex-col py-4 gap-5">
      {head && (
        <div className="px-5 flex">
          <span className="mr-auto" />
          {head}
        </div>
      )}

      <div className="px-5 flex flex-col md:flex-row gap-4 md:items-center">
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
            className="h-9 bg-white"
            containerClassName="flex-1"
            placeholder="Search anything..."
          />
        )}

        {/* Dropdowns */}
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
            <Button onClick={handleClearParams} variant="outline">
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataHeader;
