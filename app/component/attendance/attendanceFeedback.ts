import type { AttendanceRecord } from "./attendanceApi";

// Keep the calculated/payroll status intact while explaining a saved short punch.
export function hasInsufficientAttendanceHours(record: AttendanceRecord | null | undefined) {
  return Boolean(record?.status === "absent" && record.source !== "manual" && !record.hasMissingPunch &&
    record.punchSessions?.some((session) => session.punchIn && session.punchOut));
}
