import axios from "axios";
import { DEFAULT_API_URL } from "@rona/config/server";
import { ORGANIZATION_HEADER } from "@rona/config/tenancy";
import { useOrganizationStore } from "@/store/organization";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const organizationId = useOrganizationStore.getState().organizationId;

  if (organizationId) {
    config.headers[ORGANIZATION_HEADER] = organizationId;
  }

  return config;
});

export * from "./utils";
export * from "@/modules/auth/api";
export { Request } from "./request";
