import { Request } from "@/api";
import {
  API_ADMIN_USER_BY_ID_URL,
  API_ADMIN_USER_RESET_PASSWORD_URL,
  API_ADMIN_USERS_URL,
} from "@rona/routes/admin";
import { UserCredentialsDto, UserDto } from "@rona/types/admin";
import { UserSchema } from "@rona/types/admin";

export const ApiGetUsers = Request<UserDto[]>("get", API_ADMIN_USERS_URL);
export const ApiPostUser = Request<UserCredentialsDto, UserSchema>(
  "post",
  API_ADMIN_USERS_URL,
);
export const ApiPatchUser = Request<UserDto, Partial<UserSchema>>(
  "patch",
  API_ADMIN_USER_BY_ID_URL,
);
export const ApiDeleteUser = Request<void>("delete", API_ADMIN_USER_BY_ID_URL);
export const ApiPostResetUserPassword = Request<UserCredentialsDto>(
  "post",
  API_ADMIN_USER_RESET_PASSWORD_URL,
);
