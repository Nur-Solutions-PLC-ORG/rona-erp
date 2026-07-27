import { Request } from "@/api";
import { SERVER_AUTH_GOOGLE_URL, SERVER_AUTH_STATUS_URL } from "@rona/config";

export const ApiGetGoogleUrl = Request<string>("get", SERVER_AUTH_GOOGLE_URL);
export const ApiGetSessionStatus = Request<string>(
  "get",
  SERVER_AUTH_STATUS_URL,
);
