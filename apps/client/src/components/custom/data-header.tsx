import { UseCustomSearchParamsReturn } from "@/hooks/search-params";
import SearchInput from "./search-input";
import z from "zod";
import { getSchemaInfo } from "@/lib/zod";
import Dropdown from "./dropdown";
import { slugToString } from "@/lib/utils";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type Props<TSearchParams> = {
  head?: React.ReactNode;
  searchParamsSchema?: z.ZodObject;
  /** Controlled local search (filters already-loaded rows). */
  localSearch?: string;
  onLocalSearchChange?: (value: string) => void;
  /** Commit search to the server (refetch from backend). */
  onSearchServer?: (value: string) => void;
} & Omit<UseCustomSearchParamsReturn<TSearchParams>, "requestSearchParams">;

function DataHeader<TSearchParams>({
  head,
  searchParamsSchema,
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

  const [searchInput, setSearchInput] = useState(
    localSearch ?? externalSearchValue,
  );

  useEffect(() => {
    if (localSearch !== undefined) {
      setSearchInput(localSearch);
      return;
    }
    setSearchInput(externalSearchValue);
  }, [localSearch, externalSearchValue]);

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
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
    <div id="data-header" className="flex flex-col py-4 gap-5">
      {head && (
        <div className="px-5 flex">
          <span className="mr-auto" />
          {head}
        </div>
      )}

      <div className="px-5 flex flex-col md:flex-row gap-4 md:items-center">
        {includeSearchQuery && (
          <div className="flex flex-1 items-center gap-2">
            <SearchInput
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitServerSearch();
                }
              }}
              className="h-9 bg-white"
              containerClassName="flex-1"
              placeholder="Filter loaded rows… (Enter to search server)"
            />
            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0 gap-2"
              onClick={commitServerSearch}
            >
              <Search className="size-4" />
              Search server
            </Button>
          </div>
        )}

        <div className="flex items-center gap-4">
          {Object.keys(schemaInfo.keyValueLists).map((key) => {
            const options = schemaInfo.keyValueLists[key];
            const value = searchParams[
              key as keyof TSearchParams
            ] as unknown as string;

            return (
              <div key={key}>
                <Dropdown
                  placeholder={"Select " + slugToString(key)}
                  value={value}
                  onChange={(newValue) => {
                    updateParams({ [key]: newValue } as Partial<TSearchParams>);
                  }}
                  options={options.map((item) => ({
                    label: slugToString(item),
                    value: item,
                  }))}
                ></Dropdown>
              </div>
            );
          })}

          {(!!Object.values(searchParams as object).length ||
            !!searchInput) && (
            <Button
              onClick={() => {
                handleSearchInput("");
                clearParams();
              }}
              variant="outline"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataHeader;
