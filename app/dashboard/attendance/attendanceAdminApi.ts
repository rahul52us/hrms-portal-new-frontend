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
