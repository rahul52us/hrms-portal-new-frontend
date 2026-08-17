import axios from "axios";
import { makeAutoObservable, runInAction } from "mobx";

export interface DepartmentItem {
  _id: string;
  departmentName: string;
  code: string;
  company?: string;
  teams?: {
    _id: string;
    name: string;
    code?: string;
    description?: string;
    isActive?: boolean;
  }[];
  teamCount?: number;
  departmentHead?: {
    _id: string;
    name?: string;
    username?: string;
    role?: string;
    department?: string;
  } | null;
  employeeCount?: number;
  activeEmployeeCount?: number;
  managerCount?: number;
}

export interface DepartmentArchiveImpact {
  department: {
    _id: string;
    departmentName: string;
    code: string;
  };
  counts: {
    assignedEmployees: number;
    departmentHead: number;
    teams: number;
    activeTeams: number;
    hrScopes: number;
  };
  blockers: {
    key: "employees" | "departmentHead" | "hrScopes";
    count: number;
    label: string;
    resolution: string;
  }[];
  canArchive: boolean;
  effects: {
    teamsArchivedWithDepartment: number;
    reportingManagersChanged: number;
    historicalRecordsPreserved: boolean;
  };
}

export interface DepartmentTransferPreview {
  sourceDepartment: {
    _id: string;
    departmentName: string;
    code: string;
    departmentHeadId: string;
    teams: {
      _id: string;
      name: string;
      code?: string;
      isActive?: boolean;
    }[];
  };
  employees: {
    _id: string;
    name: string;
    username: string;
    code: string;
    role: string;
    team: string;
    designation: string;
    officeLocation?: any;
    reportingManager?: any;
    isActive: boolean;
    isDepartmentHead: boolean;
  }[];
  destinations: {
    _id: string;
    departmentName: string;
    code: string;
    teams: {
      _id: string;
      name: string;
      code?: string;
      isActive?: boolean;
    }[];
  }[];
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

  addDepartmentTeam = async (
    id: string,
    payload: { name: string; code?: string; description?: string; isActive?: boolean }
  ) => {
    this.isSubmitting = true;
    this.error = null;

    try {
      const { data } = await axios.post(`/department/${id}/teams`, payload);

      runInAction(() => {
        this.departments = this.departments.map((department) =>
          department._id === id ? data.data : department
        );
      });

      return data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || "Team creation failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };

  updateDepartmentTeam = async (
    id: string,
    teamId: string,
    payload: { name?: string; code?: string; description?: string; isActive?: boolean }
  ) => {
    this.isSubmitting = true;
    this.error = null;

    try {
      const { data } = await axios.put(`/department/${id}/teams/${teamId}`, payload);

      runInAction(() => {
        this.departments = this.departments.map((department) =>
          department._id === id ? data.data : department
        );
      });

      return data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || "Team update failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };

  deleteDepartmentTeam = async (id: string, teamId: string) => {
    this.isSubmitting = true;
    this.error = null;

    try {
      const { data } = await axios.delete(`/department/${id}/teams/${teamId}`);

      runInAction(() => {
        this.departments = this.departments.map((department) =>
          department._id === id ? data.data : department
        );
      });

      return data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || "Team deletion failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };

  getDepartmentArchiveImpact = async (id: string) => {
    this.error = null;

    try {
      const { data } = await axios.get(`/department/${id}/archive-impact`);
      return data.data as DepartmentArchiveImpact;
    } catch (err: any) {
      runInAction(() => {
        this.error =
          err?.response?.data?.message || "Failed to check department dependencies";
      });
      throw err;
    }
  };

  // ================= ARCHIVE =================
  archiveDepartment = async (id: string, reason: string) => {
    this.isSubmitting = true;
    this.error = null;

    try {
      const { data } = await axios.post(`/department/${id}/archive`, { reason });

      runInAction(() => {
        this.departments = this.departments.filter(
          (department) => department._id !== id
        );
      });

      return data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || "Archive failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };

  getDepartmentTransferPreview = async (id: string) => {
    this.error = null;

    try {
      const { data } = await axios.get(`/department/${id}/transfer-preview`);
      return data.data as DepartmentTransferPreview;
    } catch (err: any) {
      runInAction(() => {
        this.error =
          err?.response?.data?.message ||
          "Failed to load department transfer preview";
      });
      throw err;
    }
  };

  transferDepartmentEmployees = async (
    id: string,
    payload: {
      targetDepartmentId: string;
      reason: string;
      teamMappings?: {
        sourceTeamId?: string;
        sourceTeamName?: string;
        targetTeamId?: string;
      }[];
      employeeOverrides?: {
        employeeId: string;
        targetDepartmentId?: string;
        targetTeamId?: string;
      }[];
    }
  ) => {
    this.isSubmitting = true;
    this.error = null;

    try {
      const { data } = await axios.post(
        `/department/${id}/transfer-employees`,
        payload
      );
      return data;
    } catch (err: any) {
      runInAction(() => {
        this.error =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Employee transfer failed";
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
