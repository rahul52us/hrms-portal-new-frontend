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
