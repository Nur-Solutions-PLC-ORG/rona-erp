import axios from "axios";
import { DEFAULT_API_URL } from "@rona/config";

export const apiClient = axios.create({
  baseURL: process.env.API_URL || DEFAULT_API_URL,
  withCredentials: true,
});

export * from "./utils";
export * from "@/modules/authentication/api";
export * from "@/modules/platform/api";
