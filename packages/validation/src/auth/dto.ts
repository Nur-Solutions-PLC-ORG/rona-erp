import z from "zod";
import {
  MODULE_LIST,
  POSITIONS_LIST,
  USER_STATUS_LIST,
} from "@rona/config/auth";

export const userDto = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  status: z.enum(USER_STATUS_LIST),
  tenantId: z.string().min(1).optional(),
  role: z.object({
    position: z.enum(POSITIONS_LIST),
    modules: z.array(z.enum(MODULE_LIST)),
  }),
});
