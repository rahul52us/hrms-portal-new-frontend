import axios from "axios";

export type TimesheetState = "required" | "missing" | "draft" | "submitted" | "approved" | "returned" | "rejected" | "not_required" | "setup_incomplete" | "upcoming";
export type TimesheetIssue = { code: string; message: string; action: string };
export type TimesheetSummary = {
  attendanceDate: string; state: TimesheetState; status: string; revision: number;
  loggedMinutes: number; requiredMinutes: number | null; shortfallMinutes: number | null;
  shortHours: boolean; required: boolean; overdue: boolean; canSave: boolean;
  setupIssues: TimesheetIssue[]; saveIssues: TimesheetIssue[]; dayType: string; timezone: string | null;
};
export type TimesheetPlanner = {
  data: TimesheetSummary[]; today: string; timezone: string;
  range: { from: string; to: string };
  totals: { todayMinutes: number; weekMinutes: number; monthMinutes: number };
};
export type TimesheetEntry = {
  entryId: string; project: string; workType: string; projectNameSnapshot: string; projectCodeSnapshot: string;
  workTypeNameSnapshot: string; workTypeCodeSnapshot: string; startDate: string; startTime: string;
  endDate: string; endTime: string; startedAt: string; endedAt: string; minutes: number; notes: string;
};
export type TimesheetDocument = {
  _id: string; revision: number; status: string; timezone: string; attendanceDate: string;
  entries: TimesheetEntry[]; loggedMinutes: number; requiredMinutes: number | null; shortfallMinutes: number | null;
};
export type TimesheetRules = {
  required: boolean; minimumEntryMinutes: number; minuteIncrement: number; maximumDailyEntries: number;
  notesRequired: boolean; minimumNotesLength: number; allowExtraHours: boolean; maximumExtraMinutes: number;
};
export type TimesheetDay = {
  attendanceDate: string; serverNow: string; timesheet: TimesheetDocument | null;
  requiredMinutes: number | null; loggedMinutes: number; shortfallMinutes: number | null; contextChanged: boolean;
  eligibility: { canSave: boolean; setupIssues: TimesheetIssue[]; saveIssues: TimesheetIssue[]; submissionIssues: TimesheetIssue[]; required: boolean; deadlineAt: string | null; editableUntilDate: string | null };
  context: {
    timezone: string | null; dayType: string; rules?: TimesheetRules;
    schedule: { startTime: string | null; endTime: string | null; grossMinutes: number | null; unpaidBreakMinutes: number | null; defaultWorkMode: string };
    attendance: { punchSessions: Array<{ punchIn: string | null; punchOut: string | null }>; workMode: string; revision: number } | null;
  };
};
export type TimesheetChoice = { _id: string; name: string; code: string; available: boolean };
export type ChoicePage = { data: TimesheetChoice[]; pagination: { page: number; totalPages: number; total: number } };
export type EntryPayload = { entryId?: string; projectId: string; workTypeId: string; startDate: string; startTime: string; endDate: string; endTime: string; notes: string };
export type DraftPayload = { revision: number; requestId: string; entries: EntryPayload[] };
export type TimesheetRevision = { _id: string; revision: number; createdAt: string; snapshot: TimesheetDocument };

export async function getTimesheetPlanner(from: string, to: string, signal?: AbortSignal) {
  return (await axios.get("/timesheets/planner", { params: { from, to }, signal, timeout: 30000 })).data.data as TimesheetPlanner;
}
export async function getTimesheetDay(date: string, signal?: AbortSignal) {
  return (await axios.get(`/timesheets/day/${date}`, { signal, timeout: 30000 })).data.data as TimesheetDay;
}
export async function saveTimesheetDay(date: string, payload: DraftPayload) {
  return (await axios.put(`/timesheets/day/${date}`, payload, { timeout: 30000 })).data.data as TimesheetDocument;
}
export async function getTimesheetChoices(date: string, kind: "projects" | "work-types", params: { page: number; search: string; projectId?: string }, signal?: AbortSignal) {
  return (await axios.get(`/timesheets/day/${date}/${kind}`, { params: { ...params, limit: 20 }, signal, timeout: 20000 })).data as ChoicePage;
}
export async function getTimesheetHistory(date: string, page: number, signal?: AbortSignal) {
  return (await axios.get(`/timesheets/day/${date}/history`, { params: { page, limit: 10 }, signal, timeout: 20000 })).data as { data: TimesheetRevision[]; pagination: { totalPages: number; total: number } };
}
