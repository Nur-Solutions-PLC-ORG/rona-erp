import { Request } from "@/api";
import {
  API_ADMIN_PLATFORM_CONFIGS_URL,
  API_ADMIN_PLATFORM_CONFIG_BY_KEY_URL,
} from "@rona/routes/admin";
import { PlatformConfigDto } from "@rona/types/admin";
import { PlatformConfigSchema } from "@rona/types/admin";

export const ApiGetPlatformConfigs = Request<PlatformConfigDto[]>(
  "get",
  API_ADMIN_PLATFORM_CONFIGS_URL,
);
export const ApiPatchPlatformConfig = Request<
  PlatformConfigDto,
  Partial<PlatformConfigSchema>
>("patch", API_ADMIN_PLATFORM_CONFIG_BY_KEY_URL);
