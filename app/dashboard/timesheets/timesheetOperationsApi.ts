import axios from "axios";
import type { TimesheetDay, TimesheetState } from "../calendar/timesheetApi";
export type Scope = "organization" | "reportees" | "projects";
export type ReportView = "register" | "monthly" | "effort";
export type Choice = { _id: string; name: string; code?: string };
export type DayRow = { attendanceDate: string; state: TimesheetState; requiredMinutes: number | null; loggedMinutes: number; approvedMinutes: number; shortfallMinutes: number | null; shortHours: boolean; overdue: boolean; stale: boolean; currentSubmission: string | null; hrExemption: boolean; exemptMinutes: number; deadlineExtended: boolean; employee: Choice; organization: { departmentNameSnapshot?: string; teamNameSnapshot?: string; officeLocationNameSnapshot?: string } };
export type MonthRow = { employee: Choice; rows: number; requiredMinutes: number; loggedMinutes: number; approvedMinutes: number; shortfallMinutes: number; missing: number; submitted: number; setup_incomplete: number; stale: number; days: Pick<DayRow, "attendanceDate" | "state" | "requiredMinutes" | "loggedMinutes" | "shortfallMinutes" | "shortHours" | "overdue" | "stale">[] };
export type EffortRow = { projectId: string; workTypeId: string; projectName: string; projectCode: string; workTypeName: string; employees: number; employeeDays: number; loggedMinutes: number; approvedMinutes: number };
export type ReportData = { data: Array<DayRow | MonthRow | EffortRow>; summary: Record<string, number>; summaryScope?: "page"; pagination: { page: number; limit: number; total: number; totalPages: number } };
export type OperationsDay = TimesheetDay & { employee: Choice; organization: DayRow["organization"] };
export const operationsBase = "/timesheets/operations";
export async function operationsOptions(signal?: AbortSignal) { return (await axios.get(`${operationsBase}/options`, { signal, timeout: 30000 })).data.data as { scopes: Scope[]; canExport: boolean; today: string }; }
export async function operationsReport(view: ReportView, params: Record<string, any>, signal?: AbortSignal) { return (await axios.get(`${operationsBase}/${view}`, { params, signal, timeout: 60000 })).data as ReportData; }
export async function operationsLookup(kind: string, params: Record<string, any>, signal?: AbortSignal) { return (await axios.get(`${operationsBase}/lookups`, { params: { ...params, kind, limit: 20 }, signal, timeout: 30000 })).data as { data: Choice[]; pagination: { hasMore: boolean } }; }
export async function operationsDay(employeeId: string, date: string, scope: Scope, signal?: AbortSignal) { return (await axios.get(`${operationsBase}/employees/${employeeId}/day/${date}`, { params: { scope }, signal, timeout: 30000 })).data.data as OperationsDay; }
export async function operationsExport(view: ReportView, format: string, params: Record<string, any>) {
  try { return (await axios.get(`${operationsBase}/export`, { params: { ...params, view, format }, responseType: "blob", timeout: 120000 })).data as Blob; }
  catch (error: any) { if (error.response?.data instanceof Blob) { try { throw new Error(JSON.parse(await error.response.data.text()).message); } catch (parsed: any) { if (parsed instanceof SyntaxError) throw error; throw parsed; } } throw error; }
}
