import { UseCustomSearchParamsReturn } from "@/hooks/search-params";
import SearchInput from "./search-input";
import z from "zod";
import { getSchemaInfo } from "@/lib/zod";
import Dropdown from "./dropdown";
import { slugToString } from "@/lib/utils";
import { Button } from "../ui/button";

type Props<TSearchParams> = {
  head?: React.ReactNode;
  searchParamsSchema?: z.ZodObject;
} & UseCustomSearchParamsReturn<TSearchParams>;

function DataHeader<TSearchParams>({
  head,
  searchParamsSchema,
  searchParams,
  updateParams,
  clearParams,
  removeParams,
}: Props<TSearchParams>) {
  const schemaInfo = getSchemaInfo(searchParamsSchema ?? z.object({}));
  const SEARCH_QUERY_KEY = "searchQuery";
  const includeSearchQuery = schemaInfo.hasKey(SEARCH_QUERY_KEY);

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
            value={
              (searchParams[SEARCH_QUERY_KEY as keyof TSearchParams] ||
                "") as string
            }
            onChange={(e) => {
              if (!e.target.value) {
                removeParams([SEARCH_QUERY_KEY as keyof TSearchParams]);
                return;
              }
              updateParams({
                [SEARCH_QUERY_KEY as keyof TSearchParams]: e.target.value,
              } as Partial<TSearchParams>);
            }}
            className="h-9 bg-white"
            containerClassName="flex-1"
            placeholder="Search anything..."
          />
        )}

        {/* Dropdowns */}
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

          {!!Object.values(searchParams as object).length && (
            <Button onClick={() => clearParams()} variant="outline">
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataHeader;
