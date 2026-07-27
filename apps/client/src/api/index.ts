import axios from "axios";
import { DEFAULT_API_URL } from "@rona/config/server";

export const apiClient = axios.create({
  baseURL: process.env.API_URL || DEFAULT_API_URL,
  withCredentials: true,
});

export * from "./utils";
export * from "@/modules/auth/api";
export * from "@/modules/platform/api";
