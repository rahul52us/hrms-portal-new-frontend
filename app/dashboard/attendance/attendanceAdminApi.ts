import axios from "axios";

export type AttendanceOverviewStatus =
  | "not_marked"
  | "pending"
  | "present"
  | "half_day"
  | "absent"
  | "incomplete"
  | "leave"
  | "holiday"
  | "weekly_off";

export type AttendanceOperation =
  | "adjust"
  | "set_status"
  | "set_work_mode"
  | "recalculate"
  | "finalize"
  | "reopen";

export type AttendanceOverviewRow = {
  attendanceDate: string;
  recordId: string | null;
  employee: {
    id: string;
    name: string;
    code: string;
    designation: string;
    picture?: string | null;
  };
  organization: {
    departmentId: string | null;
    department: string;
    teamId: string | null;
    team: string;
    officeLocationId: string | null;
    officeLocation: string;
    managerId: string | null;
    manager: string;
  };
  assignmentSource: string;
  status: AttendanceOverviewStatus;
  state: string;
  workMode: "office" | "remote" | "hybrid" | "field";
  dayType: string;
  requiresAttendance: boolean | null;
  expectedWorkMinutes: number | null;
  timezone: string;
  schedule: {
    configured: boolean;
    startTime?: string | null;
    endTime?: string | null;
  };
  setupGaps?: string[];
  holiday?: {
    name: string;
    type: string;
    isHalfDay: boolean;
  } | null;
  firstIn?: string | null;
  lastOut?: string | null;
  punchCount: number;
  hasOpenPunch: boolean;
  workedMinutes: number;
  breakMinutes: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  overtimeMinutes: number;
  overtimeApprovalRequired: boolean;
  overtimeApprovalStatus: "not_required" | "pending" | "approved" | "rejected";
  approvedOvertimeMinutes: number;
  isLate: boolean;
  isEarlyExit: boolean;
  hasMissingPunch: boolean;
  leave?: {
    id: string;
    name: string;
    code: string;
    portion: string;
    units: number;
    unit: string;
  } | null;
  remoteWork?: {
    id: string;
    portion: string;
    units: number;
  } | null;
};

export type AttendanceOverviewSummary = {
  employees: number;
  expected: number;
  exceptions: number;
  punchedIn: number;
  present: number;
  absent: number;
  halfDay: number;
  onLeave: number;
  wfh: number;
  holiday: number;
  weeklyOff: number;
  late: number;
  incomplete: number;
  pending: number;
  notMarked: number;
  unconfigured: number;
};

export type AttendanceOverviewOptions = {
  departments: Array<{
    id: string;
    name: string;
    teams: Array<{ id: string; name: string }>;
  }>;
  locations: Array<{ id: string; name: string; code: string }>;
  managers: Array<{ id: string; name: string; code: string }>;
  managersTruncated: boolean;
};

export async function fetchAttendanceOverview(
  params: Record<string, string | number | undefined>,
  signal?: AbortSignal
) {
  const response = await axios.get("/attendance/overview", { params, signal });
  return {
    attendanceDate: String(response.data?.data?.attendanceDate || params.date || ""),
    summary: response.data?.data?.summary as AttendanceOverviewSummary,
    items: (response.data?.data?.items || []) as AttendanceOverviewRow[],
    diagnostics: response.data?.data?.diagnostics || {},
    pagination: response.data?.pagination || {
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function fetchAttendanceOverviewOptions(date: string, signal?: AbortSignal) {
  const response = await axios.get("/attendance/overview/options", {
    params: { date },
    signal,
  });
  return response.data?.data as AttendanceOverviewOptions;
}

export async function fetchAttendanceEmployeeDay(
  employeeId: string,
  date: string,
  signal?: AbortSignal
) {
  const response = await axios.get(`/attendance/employee-day/${employeeId}`, {
    params: { date },
    signal,
  });
  return response.data?.data as any;
}

export async function updateAttendanceEmployeeDay(
  employeeId: string,
  input: {
    attendanceDate: string;
    reason: string;
    punchInTime?: string;
    punchOutTime?: string;
    punchOutNextDay?: boolean;
    clearPunches?: boolean;
    status?: string;
    workMode?: string;
  }
) {
  const response = await axios.patch(`/attendance/employee-day/${employeeId}`, input);
  return response.data;
}

export async function reopenAttendanceEmployeeDay(
  employeeId: string,
  attendanceDate: string,
  reason: string
) {
  const response = await axios.post(`/attendance/employee-day/${employeeId}/reopen`, {
    attendanceDate,
    reason,
  });
  return response.data;
}

export async function runBulkAttendanceOperation(input: {
  employeeIds: string[];
  attendanceDate: string;
  operation: AttendanceOperation;
  reason: string;
  status?: string;
  workMode?: string;
}) {
  const response = await axios.post("/attendance/operations/bulk", input);
  return response.data;
}

export type AttendanceImportPreview = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{
    rowNumber: number;
    employeeCode: string;
    attendanceDate: string;
    errors: string[];
  }>;
  sample: Array<Record<string, string | number | boolean>>;
};

export async function previewAttendanceImport(file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await axios.post("/attendance/import/preview", body);
  return response.data?.data as AttendanceImportPreview;
}

export async function applyAttendanceImport(file: File, idempotencyKey: string) {
  const body = new FormData();
  body.append("file", file);
  body.append("idempotencyKey", idempotencyKey);
  const response = await axios.post("/attendance/import/apply", body);
  return response.data;
}

export async function downloadAttendanceImportTemplate() {
  const response = await axios.get("/attendance/import/template", { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "attendance-import-template.xlsx";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export type AttendanceProcessorRun = {
  _id: string;
  attendanceDate: string;
  idempotencyKey: string;
  trigger: "manual" | "scheduled" | "cycle_preparation";
  status: "pending" | "running" | "completed" | "completed_with_errors" | "failed";
  counts: {
    scanned: number;
    processed: number;
    created: number;
    updated: number;
    skipped: number;
    notClosed: number;
    awaitingFinalization: number;
    autoFinalized: number;
    reviewRequired: number;
    setupGaps: number;
    failures: number;
  };
  failures: Array<{
    employee?: string | null;
    employeeCode?: string;
    message: string;
  }>;
  requestedBy?: { name?: string; code?: string; role?: string } | null;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs: number;
  lastError?: string;
  createdAt: string;
};

export async function fetchAttendanceProcessorRuns(attendanceDate: string) {
  const response = await axios.get("/attendance/processor/runs", {
    params: { attendanceDate, page: 1, limit: 10 },
  });
  return (response.data?.data || []) as AttendanceProcessorRun[];
}

export async function processAttendanceDay(input: {
  attendanceDate: string;
  idempotencyKey: string;
  batchSize?: number;
}) {
  const response = await axios.post("/attendance/processor/runs", input);
  return response.data?.data as AttendanceProcessorRun;
}

export async function fetchAttendanceProcessorRun(runId: string) {
  const response = await axios.get(`/attendance/processor/runs/${runId}`);
  return response.data?.data as AttendanceProcessorRun;
}

export async function resumeAttendanceProcessorRun(runId: string) {
  const response = await axios.post(`/attendance/processor/runs/${runId}/resume`);
  return response.data?.data as AttendanceProcessorRun;
}

export type AttendancePeriodView = {
  period: {
    _id: string | null;
    periodKey: string;
    startDate: string;
    endDate: string;
    status: "open" | "locked";
    version: number;
    lockedAt?: string | null;
    lockedBy?: { name?: string; code?: string; role?: string } | null;
    lockReason?: string;
    reopenedAt?: string | null;
    reopenedBy?: { name?: string; code?: string; role?: string } | null;
    reopenReason?: string;
  };
  cycle: {
    periodKey: string;
    startDate: string;
    endDate: string;
    attendanceCutoffDay: number;
  };
  readiness: {
    periodEnded: boolean;
    totalRecords: number;
    finalizedRecords: number;
    unfinalizedRecords: number;
    openRecords: number;
    pendingRecords: number;
    missingPunchRecords: number;
    pendingRegularizations: number;
    pendingOvertimeReviews: number;
    pendingLeaveRequests: number;
    pendingLeaveCancellations: number;
    pendingRemoteWorkRequests: number;
    activeProcessorRuns: number;
    activeImportBatches: number;
    calendarDays: number;
    closedCalendarDays: number;
    upcomingDays: number;
    processedDays: number;
    missingProcessorDays: number;
    problemProcessorDays: number;
    missingProcessorDates: string[];
    problemProcessorDates: string[];
    upcomingDates: string[];
    blockers: string[];
    readyToLock: boolean;
  };
  history: Array<{
    _id: string;
    action: "locked" | "reopened";
    version: number;
    reason: string;
    actor?: { name?: string; code?: string; role?: string } | null;
    createdAt: string;
  }>;
};

export async function fetchAttendancePeriod(periodKey: string, signal?: AbortSignal) {
  const response = await axios.get(`/attendance/periods/${periodKey}`, { signal });
  return response.data?.data as AttendancePeriodView;
}

export async function fetchAttendancePeriodForDate(attendanceDate: string, signal?: AbortSignal) {
  const response = await axios.get(`/attendance/periods/date/${attendanceDate}`, { signal });
  return response.data?.data as AttendancePeriodView;
}

export async function lockAttendancePeriod(periodKey: string, reason: string, expectedVersion: number) {
  const response = await axios.post(`/attendance/periods/${periodKey}/lock`, {
    reason,
    expectedVersion,
  });
  return response.data?.data as AttendancePeriodView;
}

export async function prepareAttendancePeriod(
  periodKey: string,
  reason: string,
  idempotencyKey: string
) {
  const response = await axios.post(`/attendance/periods/${periodKey}/prepare`, {
    reason,
    idempotencyKey,
  });
  return response.data as {
    success: boolean;
    message: string;
    data: {
      periodKey: string;
      startDate: string;
      endDate: string;
      targetDates: string[];
      queuedRuns: number;
    };
  };
}

export async function reopenAttendancePeriod(periodKey: string, reason: string, expectedVersion: number) {
  const response = await axios.post(`/attendance/periods/${periodKey}/reopen`, {
    reason,
    expectedVersion,
  });
  return response.data?.data as AttendancePeriodView;
}

export type AttendanceReportRecord = {
  id: string;
  attendanceDate: string;
  employee: { id: string; name: string; code: string; designation: string };
  organization: { department: string; team: string; location: string; manager: string };
  status: string;
  state: string;
  dayType: string;
  workMode: string;
  firstIn?: string | null;
  finalOut?: string | null;
  workedMinutes: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  overtimeMinutes: number;
  approvedOvertimeMinutes: number;
  hasMissingPunch: boolean;
  revisionNumber: number;
};

export type AttendanceMonthlySummary = {
  _id?: string;
  employee: string;
  employeeNameSnapshot: string;
  employeeCodeSnapshot: string;
  designationSnapshot?: string;
  departmentNameSnapshot?: string;
  teamNameSnapshot?: string;
  officeLocationNameSnapshot?: string;
  calendarDays: number;
  expectedDays: number;
  paidDays: number;
  unpaidDays: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  wfhDays: number;
  incompleteDays: number;
  workedMinutes: number;
  approvedOvertimeMinutes: number;
  lateDays: number;
  earlyExitDays: number;
  missingPunchDays: number;
  exceptionCount: number;
};

export type AttendanceReportsDashboard = {
  periodKey: string;
  totals: {
    records: number;
    present: number;
    absent: number;
    late: number;
    missingPunch: number;
    wfh: number;
    approvedOvertimeMinutes: number;
  };
  trend: Array<{
    date: string;
    employees: number;
    present: number;
    absent: number;
    leave: number;
    wfh: number;
    exceptions: number;
  }>;
  pendingApprovals: {
    regularizations: number;
    overtime: number;
    leave: number;
    wfh: number;
    total: number;
  };
};

export async function fetchAttendanceReportsDashboard(
  periodKey: string,
  params: Record<string, unknown> = {},
  signal?: AbortSignal
) {
  const response = await axios.get("/attendance/reports/dashboard", { params: { ...params, periodKey }, signal });
  return response.data?.data as AttendanceReportsDashboard;
}

export async function fetchDailyAttendanceReport(params: Record<string, unknown>, signal?: AbortSignal) {
  const response = await axios.get("/attendance/reports/daily", { params, signal });
  return response.data?.data as {
    date: string;
    items: AttendanceReportRecord[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

export async function fetchAttendanceExceptionsReport(params: Record<string, unknown>, signal?: AbortSignal) {
  const response = await axios.get("/attendance/reports/exceptions", { params, signal });
  return response.data?.data as {
    fromDate: string;
    toDate: string;
    type: string;
    items: AttendanceReportRecord[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

export async function fetchMonthlyAttendanceReport(params: Record<string, unknown>, signal?: AbortSignal) {
  const response = await axios.get("/attendance/reports/monthly", { params, signal });
  return response.data?.data as {
    periodKey: string;
    source: "live" | "locked";
    attendancePeriodVersion: number;
    items: AttendanceMonthlySummary[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

function downloadBlob(blob: Blob, fallbackName: string, contentDisposition?: string) {
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition || "");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = match?.[1] || fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadAttendanceReport(params: Record<string, unknown>) {
  const response = await axios.get("/attendance/reports/export", { params, responseType: "blob" });
  downloadBlob(response.data, `attendance-report.${params.format || "csv"}`, response.headers["content-disposition"]);
}

export type AttendancePayrollView = {
  period: {
    _id: string | null;
    periodKey: string;
    startDate: string;
    endDate: string;
    attendanceCutoffDay: number;
    status: "open" | "locked";
    version: number;
  };
  cycle: {
    periodKey: string;
    startDate: string;
    endDate: string;
    attendanceCutoffDay: number;
  };
  settings: { attendanceCutoffDay: number };
  summaryVersion: number;
  summaries: AttendanceMonthlySummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  pendingAdjustments: Array<{
    _id: string;
    employeeNameSnapshot: string;
    employeeCodeSnapshot: string;
    sourcePeriodKey: string;
    targetPeriodKey: string;
    deltas: Record<string, number>;
  }>;
  latestInput?: {
    _id: string;
    version: number;
    attendancePeriodVersion: number;
    cycleStartDate: string;
    cycleEndDate: string;
    attendanceCutoffDay: number;
    summaryCount: number;
    adjustmentCount: number;
    totals: Record<string, any>;
    reason: string;
    lockedAt: string;
    lockedBy?: { name?: string; code?: string; role?: string } | null;
  } | null;
  history: Array<{
    _id: string;
    version: number;
    attendancePeriodVersion: number;
    summaryCount: number;
    adjustmentCount: number;
    reason: string;
    lockedAt: string;
    lockedBy?: { name?: string; code?: string; role?: string } | null;
  }>;
  canLock: boolean;
};

export async function fetchAttendancePayroll(periodKey: string, page = 1, signal?: AbortSignal) {
  const response = await axios.get(`/attendance/payroll/${periodKey}`, { params: { page, limit: 25 }, signal });
  return response.data?.data as AttendancePayrollView;
}

export async function updateAttendancePayrollSettings(attendanceCutoffDay: number) {
  const response = await axios.patch("/attendance/payroll/settings", { attendanceCutoffDay });
  return response.data?.data as { attendanceCutoffDay: number };
}

export async function lockAttendancePayroll(periodKey: string, reason: string, expectedAttendancePeriodVersion: number) {
  const response = await axios.post(`/attendance/payroll/${periodKey}/lock`, { reason, expectedAttendancePeriodVersion });
  return response.data?.data as AttendancePayrollView;
}

export async function downloadAttendancePayroll(periodKey: string, format: "csv" | "xlsx", version?: number) {
  const response = await axios.get(`/attendance/payroll/${periodKey}/export`, {
    params: { format, version },
    responseType: "blob",
  });
  downloadBlob(response.data, `payroll-attendance-${periodKey}.${format}`, response.headers["content-disposition"]);
}
