import { redirect } from "next/navigation";

export default function AssignedCoursesRedirectPage() {
  redirect("/dashboard/course/assigned");
}
