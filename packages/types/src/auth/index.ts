import { POSITIONS_LIST, MODULE_LIST } from "@rona/config/auth";
import { registerSchema, signInSchema } from "@rona/validation/auth";
import z from "zod";

// Roles types
export type Position = (typeof POSITIONS_LIST)[number];
export type Module = (typeof MODULE_LIST)[number];

// Sessions
export interface UserRole {
  position: Position;
  modules: Module[];
}

export interface SessionUser {
  id: string;
  email: string;
}

export interface Session {
  user: SessionUser;
  roles: UserRole;
  expires: string;
}

// Response types
export interface SignInResponseData {
  tfaEnabled: boolean;
}

// Zod schema types
export type SignInSchema = z.infer<typeof signInSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
