import axios from "axios";

export type AttendancePunchSession = {
  _id?: string;
  punchIn?: string | null;
  punchOut?: string | null;
  source: string;
  punchInLocation?: AttendancePunchLocation | null;
  punchOutLocation?: AttendancePunchLocation | null;
  punchInAccess?: AttendancePunchAccess | null;
  punchOutAccess?: AttendancePunchAccess | null;
};

export type AttendancePunchAccess = {
  clientIp?: string;
  networkStatus: "not_required" | "allowed" | "remote_work_bypass";
  matchedNetworkSnapshot?: string;
  deviceStatus: "not_required" | "trusted" | "remote_work_bypass";
  deviceIdSuffix?: string;
  deviceNameSnapshot?: string;
};

export type AttendancePunchLocation = {
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  verificationStatus: "within_geofence" | "unavailable_allowed" | "remote_work_bypass" | "not_required";
  distanceMeters?: number | null;
  radiusMeters?: number | null;
  officeLocationNameSnapshot?: string;
  officeLatitudeSnapshot?: number | null;
  officeLongitudeSnapshot?: number | null;
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
  regularization?: {
    _id: string;
    correctionType: string;
    status: string;
    submittedAt: string;
    appliedRevisionNumber?: number | null;
  } | null;
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
  officeGeofence: {
    enabled: boolean;
    radiusMeters: number;
    validateOn: "punch_in" | "punch_in_and_out";
    unavailableAction: "block" | "allow";
    collectOnPunchIn: boolean;
    collectOnPunchOut: boolean;
    officeLocationName: string;
    setupError: string;
    remoteWorkBypass: boolean;
  };
  punchAccess: {
    network: {
      enabled: boolean;
      applies: boolean;
      allowed: boolean;
      scope: "office_only" | "all_punches";
      clientIp: string;
      reason: string;
    };
    trustedDevice: {
      enabled: boolean;
      applies: boolean;
      status: "missing" | "invalid" | "unregistered" | "pending" | "trusted" | "revoked" | "not_required";
      scope: "office_only" | "all_punches";
      reason: string;
    };
    blockedReason: string;
  };
  actions: { canPunchIn: boolean; canPunchOut: boolean };
};

export type AttendanceDeviceIdentity = {
  deviceId: string;
  deviceName: string;
  platform: string;
  userAgent: string;
};

const ATTENDANCE_DEVICE_KEY = "hrms_attendance_device_id";

export function getAttendanceDeviceIdentity(): AttendanceDeviceIdentity {
  if (typeof window === "undefined") {
    return { deviceId: "", deviceName: "Browser", platform: "", userAgent: "" };
  }
  let deviceId = window.localStorage.getItem(ATTENDANCE_DEVICE_KEY) || "";
  if (!deviceId) {
    deviceId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `browser_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(ATTENDANCE_DEVICE_KEY, deviceId);
  }
  const platform = String((navigator as any).userAgentData?.platform || navigator.platform || "").slice(0, 120);
  return {
    deviceId,
    deviceName: `${platform || "Browser"} browser`,
    platform,
    userAgent: String(navigator.userAgent || "").slice(0, 500),
  };
}

export async function fetchTodayAttendance(deviceId = "") {
  const response = await axios.get("/attendance/today", {
    headers: deviceId ? { "X-Attendance-Device-Id": deviceId } : undefined,
  });
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

export async function punchOut(payload: Record<string, any> = {}) {
  const response = await axios.post("/attendance/punch-out", payload);
  return {
    record: response.data?.data as AttendanceRecord,
    message: String(response.data?.message || "Punched out"),
  };
}

export async function registerAttendanceDevice(identity: AttendanceDeviceIdentity) {
  const response = await axios.post("/attendance/trusted-devices/register", identity, {
    headers: { "X-Attendance-Device-Id": identity.deviceId },
  });
  return {
    device: response.data?.data as any,
    message: String(response.data?.message || "Browser registration submitted"),
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

