import axios from "axios";

export type Person = { _id: string; name: string; code: string };
export type Project = {
  _id: string; name: string; code: string; description: string; managers: Person[];
  startDate: string; endDate: string | null; status: "active" | "archived"; revision: number; canManage: boolean;
};
export type ProjectOptions = { canCreate: boolean; canAdmin: boolean; scopes: string[]; self: Person; today: string };
export type WorkType = { _id: string; name: string; code: string; status: string };
export type Assignment = {
  _id: string; employeeNameSnapshot: string; employeeCodeSnapshot: string;
  effectiveFrom: string; effectiveTo: string | null; status: string; changeReason: string;
};
export type PageResult<T> = { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
export const emptyPage = { page: 1, limit: 20, total: 0, totalPages: 1 };

export async function projectGet<T>(path: string, params?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  return (await axios.get(`/projects${path}`, { params, signal })).data;
}
export async function projectSave(path: string, payload: unknown, method: "post" | "put" = "post") {
  return (await axios[method](`/projects${path}`, payload)).data;
}
