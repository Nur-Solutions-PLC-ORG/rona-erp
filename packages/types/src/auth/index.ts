import { POSITIONS_LIST, MODULE_LIST } from "@rona/config/auth";

export type Position = (typeof POSITIONS_LIST)[number];
export type Module = (typeof MODULE_LIST)[number];
