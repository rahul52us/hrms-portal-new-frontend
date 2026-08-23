import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import { authStore } from "../authStore/authStore";
class UserStore {
  assignmentHistory: any[] = [];
  assignmentHistoryLoading = false;
  assignmentHistoryError: string | null = null;
  users: any[] = [];
  availableRoles: string[] = [];
  pagination = {
    page: 1,
    totalPages: 1,
    total: 0,
  };
  employeeStats = {
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    passwordReady: 0,
  };
  loading: boolean = false;
  submitting: boolean = false;
  uploadLoading: boolean = false;
  permissionLoading: boolean = false;
  permissionSaving: boolean = false;
  bulkPreview: any[] = [];
  permissionConfig: any = {
    companyId: "",
    companyName: "",
    catalog: [],
    roles: [],
    rolePermissions: {},
  };
  user: any = {
    loading : false,
    data : [],
    totalPages : 1
  }
  userSettings: any = {};
  userPreferences: any = {};
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  fetchUserSettings = async () => {
    this.isLoading = true;
    try {
      const response = await axios.get("/user/settings");

      this.userSettings = response.data?.settings || {};
    } catch (err: any) {
      this.error = err?.response?.data?.message || "Failed to fetch settings.";
      throw err;
    } finally {
      this.isLoading = false;
    }
  };

  createUser = async (payload: any) => {
    this.isLoading = true;
    try {
      const company = payload.company || payload.companyId || authStore.company;
      const response = await axios.post("/user/create", {
        ...payload,
        company,
      });
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.isLoading = false;
    }
  };

  createAdmin = async (payload: any) => {
    this.isLoading = true;
    try {
      const company = payload.company || payload.companyId || authStore.company;
      const response = await axios.post("/user/admin/create", {
        ...payload,
        company,
      });
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.isLoading = false;
    }
  };

  deleteUser = async (payload: any) => {
    try {
      const response = await axios.delete(`/user/profile/${payload?._id}`);
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
    }
  };

  updateUser = async (payload: any) => {
    this.isLoading = true;
    try {
      const company = payload.company || payload.companyId || authStore.company;
      const response = await axios.put(`/user/profile/${payload._id}`, {
        ...payload,
        company,
      });
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.isLoading = false;
    }
  };

  updateUserDocuments = async (id: string, payload: any) => {
    this.isLoading = true;
    try {
      const response = await axios.put(`/user/updateDocuments/${id}`, payload);
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.isLoading = false;
    }
  };

  fetchUserDocuments = async (id: string) => {
    try {
      const response = await axios.get(`/user/updateDocuments/${id}`);
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  toggleUserStatus = async (id: string, isEnabled?: boolean) => {
    this.isLoading = true;
    try {
      const response = await axios.put(`/user/status/${id}`, {
        isEnabled,
      });
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
        this.isLoading = false;
    }
  };

  updateManagedUserStatus = async (id: string, isEnabled: boolean) => {
    this.submitting = true;
    try {
      const response = await axios.put(`/admin/users/${id}/status`, {
        isEnabled,
      });
      this.users = this.users.map((user: any) =>
        user?._id === id
          ? {
              ...user,
              ...(response?.data?.data?.user || {}),
            }
          : user
      );
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.submitting = false;
    }
  };

  getUserByName = async (payload: any) => {
    try {
      const response = await axios.get(`/user/${payload.name}`);
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  getUserById = async (id: string) => {
    try {
      const response = await axios.get(`/user/details/${id}`);
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  getAllUsers = async (payload: any) => {
    this.user.loading = true;
    try {
      const company = payload.company || payload.companyId || authStore.company;
      const response : any = await axios.post("/user", {
        ...payload,
        company,
      });
      this.user.data = response?.data?.data?.data || []
      this.user.totalPages = response?.data?.data?.totalPages || 1
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.user.loading = false;
    }
  };

  fetchUsers = async (params: any = {}) => {
    this.loading = true;
    try {
      const response: any = await axios.get("/admin/users", { params });
      this.users = response?.data?.data?.users || [];
      this.availableRoles = response?.data?.data?.availableRoles || [];
      this.pagination = {
        page: response?.data?.data?.page || 1,
        totalPages: response?.data?.data?.totalPages || 1,
        total: response?.data?.data?.total || 0,
      };
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.loading = false;
    }
  };

  fetchEmployeeStats = async (params: any = {}) => {
    try {
      const response: any = await axios.get("/dashboard/hr-employee-stats", { params });
      this.employeeStats = response?.data?.data || { total: 0, active: 0, inactive: 0, pending: 0, passwordReady: 0 };
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  fetchNotificationUsers = async (companyId: string) => {
    this.loading = true;
    try {
      const response: any = await axios.get("/notification/users", {
        params: { companyId },
      });
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.loading = false;
    }
  };

  sendCompanyNotification = async (payload: any) => {
    this.submitting = true;
    try {
      const response: any = await axios.post("/notification/send", payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.submitting = false;
    }
  };

  createManagedUser = async (payload: any) => {
    this.submitting = true;
    try {
      const response = await axios.post("/admin/users", payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.submitting = false;
    }
  };

  createCompanyAdmin = async (payload: any) => {
    this.submitting = true;
    try {
      const response = await axios.post("/admin/users/company-admin", payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.submitting = false;
    }
  };

  updateManagedUser = async (id: string, payload: any) => {
    this.submitting = true;
    try {
      const response = await axios.put(`/admin/users/${id}`, payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.submitting = false;
    }
  };

  getManagedUserProfileDetails = async (id: string) => {
    try {
      const response = await axios.get(`/admin/users/${id}/profile-details`);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };



  fetchEmployeeAssignmentHistory = async (id: string) => {
    this.assignmentHistoryLoading = true;
    this.assignmentHistoryError = null;

    try {
      const response = await axios.get(
        `/admin/users/${id}/assignment-history`
      );
      runInAction(() => {
        this.assignmentHistory = response.data?.data?.history || [];
      });
      return response.data;
    } catch (err: any) {
      runInAction(() => {
        this.assignmentHistory = [];
        this.assignmentHistoryError =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load employment history";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.assignmentHistoryLoading = false;
      });
    }
  };

  clearEmployeeAssignmentHistory = () => {
    this.assignmentHistory = [];
    this.assignmentHistoryError = null;
    this.assignmentHistoryLoading = false;
  };

  deleteManagedUser = async (id: string) => {
    this.submitting = true;
    try {
      const response = await axios.delete(`/admin/users/${id}`);
      this.users = this.users.filter((user: any) => user?._id !== id);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.submitting = false;
    }
  };

  previewUploadUsers = async (file: File, options: any = {}) => {
    this.uploadLoading = true;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dryRun", "true");
      Object.entries(options || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && `${value}` !== "") {
          formData.append(key, String(value));
        }
      });
      const response = await axios.post("/admin/users/bulk", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      this.bulkPreview = response?.data?.data?.preview || [];
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.uploadLoading = false;
    }
  };

  uploadUsers = async (file: File, options: any = {}) => {
    this.uploadLoading = true;
    try {
      const formData = new FormData();
      formData.append("file", file);
      Object.entries(options || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && `${value}` !== "") {
          formData.append(key, String(value));
        }
      });
      const response = await axios.post("/admin/users/bulk", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.uploadLoading = false;
    }
  };

  downloadBulkUploadTemplate = async (options: any = {}) => {
    try {
      const response = await axios.get("/admin/users/bulk/template", {
        params: options,
        responseType: "blob",
      });

      const disposition = response.headers?.["content-disposition"] || "";
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const fileName = match?.[1] || `bulk-upload-template.xlsx`;
      const blob = new Blob([response.data], {
        type:
          response.data?.type ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      return true;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  checkManagedUserExists = async (email: string) => {
    try {
      const response: any = await axios.get("/admin/users", {
        params: {
          search: email,
          page: 1,
          limit: 10,
        },
      });
      const users = response?.data?.data?.users || [];
      const normalizedEmail = String(email || "").trim().toLowerCase();
      return users.some((user: any) => String(user?.username || "").trim().toLowerCase() === normalizedEmail);
    } catch {
      return false;
    }
  };

  setPassword = async (payload: { token: string; password: string }) => {
    this.submitting = true;
    try {
      const response = await axios.post("/auth/set-password", payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.submitting = false;
    }
  };

  fetchPermissionConfig = async (companyId?: string) => {
    this.permissionLoading = true;
    try {
      const response = await axios.get("/admin/users/permissions/config", {
        params: companyId ? { companyId } : undefined,
      });
      this.permissionConfig = response?.data?.data || this.permissionConfig;
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.permissionLoading = false;
    }
  };

  updateRolePermissions = async (
    role: string,
    permissions: Record<string, boolean>,
    companyId?: string
  ) => {
    this.permissionSaving = true;
    try {
      const response = await axios.put(`/admin/users/permissions/roles/${role}`, {
        companyId,
        permissions,
      });
      if (response?.data?.data?.rolePermissions) {
        this.permissionConfig = {
          ...this.permissionConfig,
          companyId: response.data.data.companyId || this.permissionConfig.companyId,
          rolePermissions: response.data.data.rolePermissions,
        };
      }
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.permissionSaving = false;
    }
  };

  updateUserPermissions = async (id: string, permissions: Record<string, boolean>) => {
    this.permissionSaving = true;
    try {
      const response = await axios.put(`/admin/users/${id}/permissions`, {
        permissions,
      });
      const updatedUser = response?.data?.data?.user;
      if (updatedUser?._id) {
        this.users = this.users.map((user) => (user._id === updatedUser._id ? updatedUser : user));
      }
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.permissionSaving = false;
    }
  };

  fetchCourseUsers = async (courseId: string, params: any = {}) => {
    this.loading = true;
    try {
      const response = await axios.get(`/admin/users/courses/${courseId}/users`, { params });
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.loading = false;
    }
  };

  getAdminCompanySettings = async () => {
    this.isLoading = true;
    try {
      const response = await axios.get("/admin/users/company/settings");
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.isLoading = false;
    }
  };

  updateUserSettings = async (settings: any) => {
    this.isLoading = true;
    try {
      const response = await axios.put("/user/settings", settings);

      this.userSettings = response.data?.settings || {};
    } catch (err: any) {
      this.error = err?.response?.data?.message || "Failed to update settings.";
      throw err;
    } finally {
      this.isLoading = false;
    }
  };

  // Update user preferences
  updateUserPreferences = async (preferences: any) => {
    this.isLoading = true;
    try {
      const response = await axios.put("/user/preferences", preferences);

      this.userPreferences = response.data?.preferences || {};
    } catch (err: any) {
      this.error =
        err?.response?.data?.message || "Failed to update preferences.";
      throw err;
    } finally {
      this.isLoading = false;
    }
  };


  updatePersonalDetails = async (id: string, payload: any) => {
    try {
      const response = await axios.put(`/admin/users/${id}/profile/personal`, payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  updateFamilyContacts = async (id: string, payload: any) => {
    try {
      const response = await axios.put(`/admin/users/${id}/profile/family`, payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  getMyProfileDetails = async () => {
    try {
      const response = await axios.get(`/User/me/profile-details`);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  updateMyPersonalDetails = async (payload: any) => {
    try {
      const response = await axios.put(`/User/me/profile/personal`, payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  updateMyFamilyContacts = async (payload: any) => {
    try {
      const response = await axios.put(`/User/me/profile/family`, payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  updateMySkills = async (payload: any) => {
    try {
      const response = await axios.put(`/User/me/profile/skills`, payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  updateMyStatutoryDetails = async (payload: any) => {
    try {
      const response = await axios.put(`/User/me/profile/statutory`, payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  updateMyEmployeeDocuments = async (payload: any) => {
    try {
      const response = await axios.put(`/User/me/profile/documents`, payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  updateSkills = async (id: string, payload: any) => {
    try {
      const response = await axios.put(`/admin/users/${id}/profile/skills`, payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  updateStatutoryDetails = async (id: string, payload: any) => {
    try {
      const response = await axios.put(`/admin/users/${id}/profile/statutory`, payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  updateEmployeeDocuments = async (id: string, payload: any) => {
    try {
      const response = await axios.put(`/admin/users/${id}/profile/documents`, payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    }
  };

  updateReportingManager = async (id: string, reportingManager: string | null) => {
    this.submitting = true;
    try {
      const response = await axios.put(`/admin/users/${id}/manager`, { reportingManager });
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.submitting = false;
    }
  };
}

export const userStore = new UserStore();
