import axios from "axios";
import { makeAutoObservable, runInAction } from "mobx";

export interface DepartmentItem {
  _id: string;
  departmentName: string;
  code: string;
  company?: string;
  departmentHead?: {
    _id: string;
    name?: string;
    email?: string;
    username?: string;
    role?: string;
    department?: string;
  } | null;
  employeeCount?: number;
  activeEmployeeCount?: number;
  managerCount?: number;
}

class DepartmentStore {
  departments: DepartmentItem[] = [];
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  pagination: { page: number; limit: number; total: number } | null = null;
  activeCompanyId = "";

  constructor() {
    makeAutoObservable(this);
  }

  clearDepartments = () => {
    this.departments = [];
    this.pagination = null;
    this.activeCompanyId = "";
  };

  // ================= GET =================
  fetchDepartments = async (companyId?: string, page = 1, limit = 5) => {
    const selectedCompanyId = String(companyId || "").trim();

    if (!selectedCompanyId) {
      runInAction(() => {
        this.clearDepartments();
        this.isLoading = false;
      });
      return;
    }

    runInAction(() => {
      this.error = null;
      this.isLoading = true;

      if (this.activeCompanyId !== selectedCompanyId) {
        this.departments = [];
        this.pagination = null;
      }

      this.activeCompanyId = selectedCompanyId;
    });

    try {
      const { data } = await axios.get("/department/list", {
        params: {
          companyId: selectedCompanyId,
          page,
          limit,
        },
      });

      runInAction(() => {
        this.departments = data.data || [];
        this.pagination = data.pagination || {
          page,
          limit,
          total: Array.isArray(data.data) ? data.data.length : 0,
        };
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || "Failed to fetch departments";
        this.departments = [];
        this.pagination = null;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  // ================= CREATE =================
  createDepartment = async (payload: {
    departmentName: string;
    code: string;
    companyId?: string;
  }) => {
    this.isSubmitting = true;
    this.error = null;

    try {
      const { data } = await axios.post("/department/create", payload);
      return data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || "Create failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };

  // ================= UPDATE =================
  updateDepartment = async (
    id: string,
    payload: { departmentName?: string; code?: string }
  ) => {
    this.isSubmitting = true;
    this.error = null;

    try {
      const { data } = await axios.put(`/department/update/${id}`, payload);

      runInAction(() => {
        this.departments = this.departments.map((department) =>
          department._id === id ? data.data : department
        );
      });

      return data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || "Update failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };

  assignDepartmentHead = async (
    id: string,
    payload: { departmentHeadId?: string }
  ) => {
    this.isSubmitting = true;
    this.error = null;

    try {
      const { data } = await axios.put(`/department/head/${id}`, payload);

      runInAction(() => {
        this.departments = this.departments.map((department) =>
          department._id === id ? data.data : department
        );
      });

      return data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || err?.response?.data?.error || "Head assignment failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };

  // ================= DELETE =================
  deleteDepartment = async (id: string) => {
    this.isSubmitting = true;
    this.error = null;

    try {
      await axios.delete(`/department/delete/${id}`);

      runInAction(() => {
        this.departments = this.departments.filter(
          (department) => department._id !== id
        );
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || "Delete failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };
}

export const departmentStore = new DepartmentStore();
