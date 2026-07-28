import z from "zod";
import { USER_STATUS_LIST } from "@rona/config/auth";

export const userDto = z.object({
  fullName: z.string(),
  email: z.string(),
  status: z.enum(USER_STATUS_LIST),
});
