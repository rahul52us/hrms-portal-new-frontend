import { Suspense } from "react";
import CalendarWorkspace, { CalendarLoading } from "./CalendarWorkspace";
export default function CalendarPage() { return <Suspense fallback={<CalendarLoading />}><CalendarWorkspace /></Suspense>; }
