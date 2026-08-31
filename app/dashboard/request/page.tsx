import { redirect } from "next/navigation";

export default function LegacyEmployeeRequestsPage() {
  redirect("/dashboard/requests");
}
