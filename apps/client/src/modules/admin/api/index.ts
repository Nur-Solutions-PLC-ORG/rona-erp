import { Request } from "@/api";
import { API_ADMIN_DASHBOARD_URL } from "@rona/routes/admin";
import { AdminDashboardStats } from "@rona/types/admin";

export const ApiGetDashboard = Request<AdminDashboardStats>(
  "get",
  API_ADMIN_DASHBOARD_URL,
);
