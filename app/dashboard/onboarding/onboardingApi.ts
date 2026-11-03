import axios from "axios";

export type Task = {
  _id?: string; title: string; instructions: string; owner: "employee" | "reporting_manager" | "hr" | "specific_user";
  ownerUser: string | null; ownerNameSnapshot: string; dueDays: number; required: boolean; requiresDocument: boolean;
};
export type TemplateContent = { name: string; description: string; tasks: Task[] };
export type Template = TemplateContent & {
  _id: string; status: "draft" | "published" | "archived"; hasDraft: boolean; publishedVersion: number; revision: number; updatedAt: string; taskCount?: number;
};
export type Person = { _id: string; name: string; code: string };
export type History = { _id: string; version?: number; content?: TemplateContent; action?: string; reason: string; actor?: Person; publishedBy?: Person; createdAt: string };
export type Page<T> = { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
export const emptyPage = { page: 1, limit: 20, total: 0, totalPages: 1 };
export const ownerLabels = { employee: "Employee", reporting_manager: "Reporting manager", hr: "HR team", specific_user: "Specific person" };
export const dueLabel = (days: number) => days === 0 ? "On joining day" : `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} ${days < 0 ? "before" : "after"} joining`;
export async function onboardingGet<T>(path: string, params?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  return (await axios.get(`/onboarding${path}`, { params, signal })).data;
}
export async function onboardingSave(path: string, body: unknown, method: "post" | "put" = "post"): Promise<{ data: Template; replayed: boolean }> {
  return (await axios[method](`/onboarding${path}`, body)).data;
}
