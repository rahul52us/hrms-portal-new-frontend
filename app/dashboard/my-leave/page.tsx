import { redirect } from "next/navigation";

export default function MyLeavePage() {
  redirect("/dashboard/requests");
}
