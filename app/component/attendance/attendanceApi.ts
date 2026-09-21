import axios from "axios";

export type AttendancePunchSession = {
  _id?: string;
  punchIn?: string | null;
  punchOut?: string | null;
  source: string;
};

export type AttendanceRecord = {
  _id: string;
  attendanceDate: string;
  timezone: string;
  state: "open" | "calculated" | "finalized";
  status: string;
  workMode: "office" | "remote" | "hybrid" | "field";
  punchSessions: AttendancePunchSession[];
  workedMinutes: number;
  breakMinutes: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  overtimeMinutes: number;
  isLate: boolean;
  isEarlyExit: boolean;
  hasMissingPunch: boolean;
  departmentNameSnapshot?: string;
  teamNameSnapshot?: string;
  officeLocationNameSnapshot?: string;
  dayTypeSnapshot?: string;
  requiresAttendanceSnapshot?: boolean | null;
  expectedWorkMinutesSnapshot?: number | null;
  scheduleStartTimeSnapshot?: string;
  scheduleEndTimeSnapshot?: string;
};

export type AttendanceHistorySummary = {
  recordedDays: number;
  presentDays: number;
  halfDayDays: number;
  absentDays: number;
  incompleteDays: number;
  leaveDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  workedMinutes: number;
  lateDays: number;
};

export type TodayAttendance = {
  attendanceDate: string;
  timezone: string;
  record: AttendanceRecord | null;
  context: {
    dayType: string;
    requiresAttendance: boolean | null;
    expectedWorkMinutes: number | null;
    defaultAttendanceStatus: string;
    schedule: {
      startTime?: string | null;
      endTime?: string | null;
      scheduledMinutes?: number | null;
    };
    holiday?: { name: string; type: string; isHalfDay: boolean } | null;
    missingPolicies: string[];
    warnings: string[];
  };
  remoteWorkAuthorization?: {
    requestId: string;
    portion: "full" | "first_half" | "second_half";
    workMode: "remote" | "hybrid";
    remoteWorkPolicyVersionNumber?: number;
  } | null;
  actions: { canPunchIn: boolean; canPunchOut: boolean };
};

export async function fetchTodayAttendance() {
  const response = await axios.get("/attendance/today");
  return response.data?.data as TodayAttendance;
}

export async function fetchMyAttendance(params: Record<string, any>) {
  const response = await axios.get("/attendance/records", { params });
  return {
    items: (response.data?.data || []) as AttendanceRecord[],
    summary: (response.data?.summary || {}) as AttendanceHistorySummary,
    pagination: response.data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function punchIn(payload: Record<string, any> = {}) {
  const response = await axios.post("/attendance/punch-in", payload);
  return response.data?.data as AttendanceRecord;
}

export async function punchOut() {
  const response = await axios.post("/attendance/punch-out", {});
  return {
    record: response.data?.data as AttendanceRecord,
    message: String(response.data?.message || "Punched out"),
  };
}

export async function fetchMyAttendanceDay(attendanceDate: string, signal?: AbortSignal) {
  const response = await axios.get(`/attendance/records/${attendanceDate}`, { signal });
  return response.data?.data as any;
}

export async function downloadMyAttendanceStatement(month: string) {
  const response = await axios.get("/attendance/statements/monthly", {
    params: { month },
    responseType: "blob",
  });
  const disposition = String(response.headers?.["content-disposition"] || "");
  const encodedName = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  const regularName = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
  const filename = encodedName
    ? decodeURIComponent(encodedName)
    : regularName || `attendance-${month}.csv`;
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

