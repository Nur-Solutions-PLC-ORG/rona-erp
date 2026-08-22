import { ApiResponse } from "@rona/types/api";

export type Primitive = string | number | boolean;

export type RequestSearchParams = Record<
  string,
  Primitive | Primitive[] | undefined
>;

export type RequestSlugReplacement = Record<string, Primitive>;

export type Options = {
  slugReplacement?: RequestSlugReplacement;
};

export function buildRoute(route: string, options?: Options) {
  let finalRoute = route;

  if (options?.slugReplacement) {
    for (const [key, value] of Object.entries(options.slugReplacement)) {
      finalRoute = finalRoute.replace(
        `:${key}`,
        encodeURIComponent(String(value)),
      );
    }
  }

  return finalRoute;
}

export function TryCatchNullWrap<T>(func: () => Promise<ApiResponse<T>>) {
  return async function () {
    try {
      const funcRes = await func();
      return funcRes;
    } catch {
      return null;
    }
  };
}
