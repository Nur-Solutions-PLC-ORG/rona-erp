import { redirect } from "next/navigation";
import { CLIENT_APP_DASHBOARD_PAGE } from "@rona/routes/app";

export default function GoogleCallbackPage() {
  redirect(CLIENT_APP_DASHBOARD_PAGE);
}
