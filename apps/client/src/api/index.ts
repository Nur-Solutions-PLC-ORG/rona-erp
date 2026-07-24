import axios from "axios";
import { DEFAULT_API_URL } from "@rona/config";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL,
  withCredentials: true,
});

export function Request(type: "get" | "post" | "put", route: string) {
  switch (type) {
    // case "get":
    default:
      return async function () {
        const response = await apiClient.get(route);
        const responseData = response.data;
        return responseData;
      };
    // case "post":
    //   return;
    // case "put":
    //   return;
  }
}

export * from "@/modules/authentication/api";
export * from "@/modules/platform/api";
