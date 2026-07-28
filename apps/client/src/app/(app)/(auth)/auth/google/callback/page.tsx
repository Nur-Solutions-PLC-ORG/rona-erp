import { redirect } from "next/navigation";
import { CLIENT_DASHBOARD_PAGE } from "@rona/routes/auth";

export default function GoogleCallbackPage() {
  redirect(CLIENT_DASHBOARD_PAGE);
}
