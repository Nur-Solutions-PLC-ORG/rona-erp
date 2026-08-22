import { Request } from "@/api";
import {
  API_ADMIN_BRANCHES_URL,
  API_ADMIN_BRANCH_BY_ID_URL,
} from "@rona/routes/admin";
import { BranchDto } from "@rona/types/admin";
import { BranchSchema } from "@rona/types/admin";

export const ApiGetBranches = Request<BranchDto[]>(
  "get",
  API_ADMIN_BRANCHES_URL,
);
export const ApiPostBranch = Request<BranchDto, BranchSchema>(
  "post",
  API_ADMIN_BRANCHES_URL,
);
export const ApiPatchBranch = Request<BranchDto, Partial<BranchSchema>>(
  "patch",
  API_ADMIN_BRANCH_BY_ID_URL,
);
export const ApiDeleteBranch = Request<void>(
  "delete",
  API_ADMIN_BRANCH_BY_ID_URL,
);
