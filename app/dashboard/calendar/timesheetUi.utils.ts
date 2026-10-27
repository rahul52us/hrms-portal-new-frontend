import type { EntryPayload, TimesheetDay, TimesheetState } from "./timesheetApi";

export const timesheetLabels: Record<TimesheetState, string> = {
  required: "Required", missing: "Missing", draft: "Draft", submitted: "Submitted", approved: "Approved",
  returned: "Returned", rejected: "Rejected", not_required: "Not required", setup_incomplete: "Setup incomplete", upcoming: "Upcoming",
};
export const timesheetColors: Record<TimesheetState, string> = {
  required: "blue", missing: "red", draft: "blue", submitted: "cyan", approved: "green",
  returned: "orange", rejected: "red", not_required: "gray", setup_incomplete: "orange", upcoming: "gray",
};
export function formatMinutes(minutes: number | null | undefined) {
  if (minutes == null || !Number.isFinite(minutes)) return "--:--";
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(Math.round(minutes % 60)).padStart(2, "0")}`;
}
export function nextTimesheetDate(date: string) {
  const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}
export function localWorkInstant(date: string, time: string, timezone: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const desired = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(desired) || new Date(desired).toISOString().slice(0, 10) !== date) return null;
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    const scalar = (instant: number) => {
      const parts = formatter.formatToParts(new Date(instant));
      const part = (key: string) => Number(parts.find((p) => p.type === key)!.value);
      return Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"));
    };
    let candidate = desired;
    for (let i = 0; i < 4; i++) candidate += desired - scalar(candidate);
    return scalar(candidate) === desired ? candidate : null;
  } catch { return null; }
}
export function entryDuration(entry: EntryPayload, timezone: string | null) {
  if (!timezone) return null;
  const start = localWorkInstant(entry.startDate, entry.startTime, timezone), end = localWorkInstant(entry.endDate, entry.endTime, timezone);
  return start == null || end == null || end <= start ? null : (end - start) / 60000;
}
export function validateDraft(entries: EntryPayload[], day: TimesheetDay, now: number) {
  const rules = day.context.rules, timezone = day.context.timezone;
  if (!rules || !timezone) return "A timesheet policy and work schedule are required.";
  if (entries.length > rules.maximumDailyEntries) return `Only ${rules.maximumDailyEntries} entries are allowed per day.`;
  const intervals: Array<{ start: number; end: number }> = [];
  const lastDate = day.context.schedule.endTime! <= day.context.schedule.startTime! ? nextTimesheetDate(day.attendanceDate) : day.attendanceDate;
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    const label = `Entry ${index + 1}`;
    if (!entry.projectId || !entry.workTypeId) return `${label}: select a project and work type.`;
    const start = localWorkInstant(entry.startDate, entry.startTime, timezone), end = localWorkInstant(entry.endDate, entry.endTime, timezone);
    if (start == null || end == null || end <= start) return `${label}: enter valid start/end dates and a positive time range.`;
    if (entry.startDate < day.attendanceDate || entry.endDate > lastDate) return `${label}: use this shift's work date${lastDate !== day.attendanceDate ? " or the next day" : ""}.`;
    if (end > now) return `${label}: future work cannot be logged.`;
    const minutes = (end - start) / 60000;
    if (minutes < rules.minimumEntryMinutes || minutes % rules.minuteIncrement) return `${label}: use at least ${rules.minimumEntryMinutes} minutes in ${rules.minuteIncrement}-minute increments.`;
    if (rules.notesRequired && entry.notes.trim().length < rules.minimumNotesLength) return `${label}: add at least ${rules.minimumNotesLength} characters of notes.`;
    if (entry.notes.length > 2000) return `${label}: notes cannot exceed 2000 characters.`;
    const fitsPunch = day.context.attendance?.punchSessions.some((session) => session.punchIn && start >= Date.parse(session.punchIn) && end <= (session.punchOut ? Date.parse(session.punchOut) : now));
    if (!fitsPunch) return `${label}: work must fit a punched attendance interval. Correct attendance if punches are missing or incorrect.`;
    intervals.push({ start, end });
  }
  intervals.sort((a, b) => a.start - b.start);
  if (intervals.some((entry, i) => i > 0 && entry.start < intervals[i - 1].end)) return "Time entries overlap. The same time cannot be logged twice.";
  return "";
}
export function requirementReason(day: TimesheetDay) {
  if (day.eligibility.saveIssues.some((issue) => issue.code === "OUTSIDE_EMPLOYMENT")) return "This date is outside active employment.";
  if (day.requiredMinutes == null) return "Required hours cannot be calculated until the work schedule and timesheet policy are configured.";
  if (day.eligibility.setupIssues.length) return "Timesheet setup is incomplete. Review the issues before logging work.";
  if (!day.eligibility.required) {
    if (["weekly_off", "mandatory_holiday"].includes(day.context.dayType)) return day.context.dayType === "weekly_off" ? "Weekly off: no mandatory timesheet." : "Holiday: no mandatory timesheet.";
    if (day.context.rules?.required === false) return "Timesheets are optional under the effective policy.";
    return "No working time is required after approved leave or other day exemptions.";
  }
  return "Required hours use the effective shift, excluding unpaid breaks and approved leave.";
}
