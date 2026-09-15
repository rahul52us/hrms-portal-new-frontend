import axios from "axios";

export type CalendarScope = "mine" | "reportees" | "organization";
export type CalendarCategory = "all" | "leave" | "wfh" | "holiday" | "weekly_off";
export type CalendarEvent = {
  id: string; kind: "leave" | "wfh"; title: string; code: string; status: string;
  fromDate: string; toDate: string; portion: string; units: number; unit: string; reason: string;
  canApprove: boolean; canWithdraw: boolean; cancellationPending: boolean;
  employee: { id: string; name: string; code: string };
};
export type CalendarDay = {
  date: string; employees: number; onLeave: number; wfh: number; pendingLeave: number; pendingWfh: number;
  weeklyOff: number; holiday: number; optionalHoliday: number; unconfigured: number;
  holidays: Array<{ name: string; type: string; isHalfDay: boolean; employees: number }>;
  events: CalendarEvent[];
};
export type CalendarRow = {
  date: string; employee: { id: string; name: string; code: string }; department: string; team: string; officeLocation: string;
  dayType: string; holiday: { name: string; type: string; isHalfDay: boolean; description: string } | null;
  schedule: { isWorkingDay: boolean | null; startTime: string | null; endTime: string | null };
  events: CalendarEvent[]; assignmentSource: string; timezone: string | null;
};
export type CalendarOptions = {
  scopes: CalendarScope[];
  departments: Array<{ id: string; name: string; teams: Array<{ id: string; name: string }> }>;
  locations: Array<{ id: string; name: string }>;
};
export async function fetchCalendarSummary(params: Record<string, any>, signal?: AbortSignal) {
  return (await axios.get("/calendar/summary", { params, signal })).data.data as {
    days: CalendarDay[]; diagnostics: { currentAssignmentFallbackEmployees: number; missingHistoryEmployees: number };
  };
}
export async function fetchCalendarOptions(params: Record<string, any>, signal?: AbortSignal) {
  return (await axios.get("/calendar/options", { params, signal })).data.data as CalendarOptions;
}
export async function fetchCalendarDay(params: Record<string, any>, signal?: AbortSignal) {
  const response = await axios.get("/calendar/day", { params, signal });
  return { items: response.data.data as CalendarRow[], pagination: response.data.pagination as { total: number; totalPages: number } };
}
export async function fetchCalendarEmployees(params: Record<string, any>) {
  return (await axios.get("/calendar/employees", { params })).data.data as Array<{ id: string; name: string; code: string }>;
}
