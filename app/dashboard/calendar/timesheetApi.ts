import axios from "axios";

export type TimesheetState = "required" | "missing" | "draft" | "submitted" | "approved" | "returned" | "rejected" | "not_required" | "setup_incomplete" | "upcoming";
export type TimesheetIssue = { code: string; message: string; action: string };
export type TimesheetSummary = {
  attendanceDate: string; state: TimesheetState; status: string; revision: number;
  loggedMinutes: number; requiredMinutes: number | null; shortfallMinutes: number | null;
  shortHours: boolean; required: boolean; overdue: boolean; canSave: boolean;
  setupIssues: TimesheetIssue[]; saveIssues: TimesheetIssue[]; dayType: string; timezone: string | null;
  hrExemption?: boolean; exemptMinutes?: number; deadlineExtended?: boolean;
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
  currentSubmission?: string | null;
  _id: string; revision: number; status: string; timezone: string; attendanceDate: string;
  entries: TimesheetEntry[]; loggedMinutes: number; requiredMinutes: number | null; shortfallMinutes: number | null;
};
export type TimesheetRules = {
  payrollMode?: "report_only" | "block" | "shortfall";
  required: boolean; minimumEntryMinutes: number; maximumDailyEntries: number;
  notesRequired: boolean; minimumNotesLength: number; allowExtraHours: boolean; maximumExtraMinutes: number;
};
export type TimesheetDay = {
  controls: TimesheetControl;
  attendanceDate: string; serverNow: string; timesheet: TimesheetDocument | null;
  requiredMinutes: number | null; loggedMinutes: number; shortfallMinutes: number | null; contextChanged: boolean;
  eligibility: { canSave: boolean; canSubmit: boolean; setupIssues: TimesheetIssue[]; saveIssues: TimesheetIssue[]; submissionIssues: TimesheetIssue[]; required: boolean; deadlineAt: string | null; editableUntilDate: string | null; editableUntilAt?: string | null; exemptMinutes?: number; baselineRequiredMinutes?: number | null; payrollCycle?: { periodKey: string; startDate: string; endDate: string; submissionAt: string; approvalAt: string } | null };
  context: {
    timezone: string | null; dayType: string; rules?: TimesheetRules;
    schedule: { startTime: string | null; endTime: string | null; grossMinutes: number | null; unpaidBreakMinutes: number | null; defaultWorkMode: string };
    attendance: { punchSessions: Array<{ punchIn: string | null; punchOut: string | null }>; workMode: string; revision: number } | null;
  };
};
type ControlEvidence = { reason: string; actorNameSnapshot: string; at: string; eventId: string };
export type TimesheetControl = { revision: number; exemption: (ControlEvidence & { mode: "full_day" | "minutes"; minutes: number | null }) | null; extension: (ControlEvidence & { until: string; timezone: string }) | null; payrollLockedAt: string | null };
export type ControlAction = "grant_exemption" | "extend_deadline" | "revoke_exemption" | "revoke_extension";
export type ControlPayload = { action: ControlAction; revision: number; requestId: string; reason: string; mode?: "full_day" | "minutes"; minutes?: number; untilDate?: string; untilTime?: string };
export type ControlAudit = { _id: string; action: ControlAction; revision: number; actorNameSnapshot: string; reason: string; createdAt: string; before: TimesheetControl; after: TimesheetControl };
export type ControlHistory = { control: TimesheetControl; capabilities: { authorized: boolean; canManage: boolean; blockedReason: string }; data: ControlAudit[]; pagination: { total: number; totalPages: number } };
export async function getTimesheetControls(date: string, page: number, target?: { employeeId: string; scope: string }, signal?: AbortSignal) {
  const url = target ? `/timesheets/operations/employees/${target.employeeId}/day/${date}/controls` : `/timesheets/day/${date}/controls`;
  return (await axios.get(url, { params: { page, limit: 5, ...(target ? { scope: target.scope } : {}) }, signal, timeout: 30000 })).data as ControlHistory;
}
export async function changeTimesheetControls(date: string, target: { employeeId: string; scope: string }, payload: ControlPayload) {
  return (await axios.post(`/timesheets/operations/employees/${target.employeeId}/day/${date}/controls`, payload, { params: { scope: target.scope }, timeout: 30000 })).data;
}
export type TimesheetChoice = { _id: string; name: string; code: string; available: boolean };
export type ChoicePage = { data: TimesheetChoice[]; pagination: { page: number; totalPages: number; total: number } };
export type EntryPayload = { entryId?: string; projectId: string; workTypeId: string; startDate: string; startTime: string; endDate: string; endTime: string; notes: string };
export type DraftPayload = { revision: number; requestId: string; entries: EntryPayload[] };
export type TimesheetRevision = { _id: string; revision: number; action: string; createdAt: string; snapshot: TimesheetDocument };

export type TimesheetSubmission = {
  approvalDeadlineAt?: string | null;
  approvalOverdue?: boolean;
  reassignment?: { authorized: boolean; canReassign: boolean; blockedReason: string };
  reassignmentCount?: number;
  loggedMinutes: number; requiredMinutes: number; shortfallMinutes: number;
  _id: string; attendanceDate: string; sheetRevision: number; submissionNumber: number; status: string; submittedAt: string;
  employee: { _id: string; name: string; code?: string; username?: string }; employeeNameSnapshot: string; employeeCodeSnapshot: string;
  reason?: string; snapshot?: TimesheetDocument & { contextSnapshot: TimesheetDay["context"] };
  currentApprovers: string[]; participantIds: string[];
  approvalInstance: { status: string; workflowNameSnapshot: string; currentStepOrder: number | null; steps: any[]; history: any[] };
  history: Array<{ _id: string; action: string; actorNameSnapshot: string; comment: string; at: string; reassignment?: ReassignmentEvidence }>;
};
export type ReassignmentEvidence = { stepOrder: number; stepName: string; approvalRule: string; from: { user: string; name: string; role: string }; to: { user: string; name: string; role: string }; pendingBefore: string[]; pendingAfter: string[] };
export type ReassignmentPayload = { revision: number; requestId: string; stepOrder: number; fromUserId: string; toUserId: string; reason: string };
export type ReassignmentChoice = { _id: string; name: string; code: string; role: string };
export async function getReassignmentChoices(submissionId: string, search: string, page: number, signal?: AbortSignal) {
  return (await axios.get(`/timesheets/submissions/${submissionId}/reassignment-options`, { params: { search, page, limit: 20 }, signal, timeout: 30000 })).data as { data: ReassignmentChoice[]; pagination: { hasMore: boolean } };
}
export async function reassignTimesheetApproval(submissionId: string, payload: ReassignmentPayload) {
  return (await axios.post(`/timesheets/submissions/${submissionId}/reassign`, payload, { timeout: 30000 })).data;
}
export type TimesheetActionPayload = { revision: number; requestId: string; comment?: string; acknowledgeShortfall?: boolean };
export async function submitTimesheetDay(date: string, payload: TimesheetActionPayload) {
  return (await axios.post(`/timesheets/day/${date}/submit`, payload, { timeout: 30000 })).data.data as TimesheetDocument;
}
export async function actOnTimesheetSubmission(id: string, action: "approve" | "return" | "reject" | "withdraw" | "reopen", payload: TimesheetActionPayload) {
  return (await axios.post(`/timesheets/submissions/${id}/${action}`, payload, { timeout: 30000 })).data.data as TimesheetDocument;
}
export async function getTimesheetSubmission(id: string, signal?: AbortSignal) {
  return (await axios.get(`/timesheets/submissions/${id}`, { signal, timeout: 30000 })).data.data as TimesheetSubmission;
}
export async function listTimesheetSubmissions(params: { scope: "mine" | "approvals"; page: number; limit: number }, signal?: AbortSignal) {
  return (await axios.get("/timesheets/submissions", { params, signal, timeout: 30000 })).data as { data: TimesheetSubmission[]; pagination: { total: number; totalPages: number } };
}

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
