import axios from "axios";
import { makeAutoObservable, runInAction } from "mobx";

export type PolicyVersionStatus = "draft" | "published" | "cancelled";
export type PolicyResourceType = "attendance_policy" | "work_schedule" | "holiday_calendar";
export type PolicyScopeType = "company" | "location" | "department" | "team" | "employee";

export interface AttendanceRules {
  gracePeriodMinutesLate: number;
  gracePeriodMinutesEarly: number;
  minimumFullDayMinutes: number;
  minimumHalfDayMinutes: number;
  requirePunchOut: boolean;
  allowMultiplePunches: boolean;
  missingPunchTreatment: string;
  overtimeEnabled: boolean;
  overtimeStartsAfterMinutes: number;
}

export interface WorkScheduleRules {
  timezone: string;
  workingDays: string[];
  saturdayRule: string;
  customSaturdayOffWeeks: number[];
  startTime: string;
  endTime: string;
  unpaidBreakMinutes: number;
}

export interface PolicyVersion {
  _id: string;
  versionNumber: number;
  status: PolicyVersionStatus;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  changeReason?: string;
  rules?: AttendanceRules | WorkScheduleRules;
  timezone?: string;
  holidays?: Array<{
    _id?: string;
    date: string;
    name: string;
    type: "mandatory" | "optional";
    isHalfDay?: boolean;
    description?: string;
  }>;
  publishedAt?: string | null;
}

export interface WorkforcePolicyItem {
  _id: string;
  company: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "archived";
  latestVersionNumber: number;
  draftVersion?: PolicyVersion | null;
  latestPublishedVersion?: PolicyVersion | null;
  assignmentCount?: number;
}

export interface WorkforcePolicyAssignment {
  _id: string;
  resourceType: PolicyResourceType;
  resource: WorkforcePolicyItem | string;
  scopeType: PolicyScopeType;
  scopeId?: string | null;
  scopeNameSnapshot: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  changeReason: string;
  state: "active" | "scheduled" | "ended";
  createdBy?: { _id: string; name?: string; username?: string } | string | null;
  endedBy?: { _id: string; name?: string; username?: string } | string | null;
  endReason?: string;
  createdAt?: string;
}

export interface ResolvedPolicyResource {
  assignment: WorkforcePolicyAssignment;
  version: PolicyVersion;
}

export interface EmployeePolicyResolution {
  employee: { _id: string; name?: string; username?: string; code?: string };
  at: string;
  organizationAssignment?: any;
  attendancePolicy: ResolvedPolicyResource | null;
  workSchedule: ResolvedPolicyResource | null;
  holidayCalendar: ResolvedPolicyResource | null;
  warnings: string[];
}

export interface PolicyCoverageItem extends EmployeePolicyResolution {
  complete: boolean;
  missing: PolicyResourceType[];
}

export interface PolicyAuditLog {
  _id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor?: { _id: string; name?: string; username?: string; role?: string } | null;
  details?: Record<string, any>;
  createdAt?: string;
}

type PaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const EMPTY_PAGINATION: PaginationState = { page: 1, limit: 20, total: 0, totalPages: 1 };

class WorkforcePolicyStore {
  private detailRequestSequence = 0;
  attendancePolicies: WorkforcePolicyItem[] = [];
  workSchedules: WorkforcePolicyItem[] = [];
  holidayCalendars: WorkforcePolicyItem[] = [];
  assignments: WorkforcePolicyAssignment[] = [];
  assignmentsPagination: PaginationState = { ...EMPTY_PAGINATION };
  assignmentsLoading = false;
  auditLogs: PolicyAuditLog[] = [];
  auditPagination: PaginationState = { ...EMPTY_PAGINATION };
  auditLoading = false;
  auditError: string | null = null;
  coverageItems: PolicyCoverageItem[] = [];
  coveragePagination: PaginationState = { ...EMPTY_PAGINATION };
  coverageSummary = { employeesOnPage: 0, completeOnPage: 0, incompleteOnPage: 0 };
  coverageLoading = false;
  coverageError: string | null = null;
  selectedResource: {
    policy?: WorkforcePolicyItem;
    schedule?: WorkforcePolicyItem;
    calendar?: WorkforcePolicyItem;
    versions: PolicyVersion[];
  } | null = null;
  activeCompanyId = "";
  loading = false;
  detailLoading = false;
  detailError: string | null = null;
  submitting = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  clear = () => {
    this.detailRequestSequence += 1;
    this.attendancePolicies = [];
    this.workSchedules = [];
    this.holidayCalendars = [];
    this.assignments = [];
    this.assignmentsPagination = { ...EMPTY_PAGINATION };
    this.auditLogs = [];
    this.auditPagination = { ...EMPTY_PAGINATION };
    this.auditError = null;
    this.coverageItems = [];
    this.coveragePagination = { ...EMPTY_PAGINATION };
    this.coverageSummary = { employeesOnPage: 0, completeOnPage: 0, incompleteOnPage: 0 };
    this.coverageError = null;
    this.selectedResource = null;
    this.detailError = null;
    this.activeCompanyId = "";
    this.error = null;
  };

  private getError(error: any, fallback: string) {
    return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
  }

  fetchWorkspace = async (companyId: string) => {
    if (!companyId) {
      this.clear();
      return;
    }
    this.loading = true;
    this.error = null;
    if (this.activeCompanyId !== companyId) {
      this.attendancePolicies = [];
      this.workSchedules = [];
      this.holidayCalendars = [];
      this.assignments = [];
      this.assignmentsPagination = { ...EMPTY_PAGINATION };
    }
    this.activeCompanyId = companyId;
    try {
      const [attendance, schedules, calendars, assignments] = await Promise.all([
        axios.get("/workforce-policies/attendance", { params: { companyId, limit: 100 } }),
        axios.get("/workforce-policies/work-schedules", { params: { companyId, limit: 100 } }),
        axios.get("/workforce-policies/holiday-calendars", { params: { companyId, limit: 100 } }),
        axios.get("/workforce-policies/assignments", { params: { companyId, limit: 100 } }),
      ]);
      runInAction(() => {
        this.attendancePolicies = attendance.data?.data || [];
        this.workSchedules = schedules.data?.data || [];
        this.holidayCalendars = calendars.data?.data || [];
        this.assignments = assignments.data?.data || [];
        this.assignmentsPagination = assignments.data?.pagination || { ...EMPTY_PAGINATION };
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = this.getError(error, "Failed to load workforce policies");
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  fetchAssignments = async (
    companyId: string,
    params: {
      page?: number;
      limit?: number;
      resourceType?: string;
      scopeType?: string;
      state?: string;
    } = {}
  ) => {
    this.assignmentsLoading = true;
    try {
      const response = await axios.get("/workforce-policies/assignments", {
        params: { companyId, page: 1, limit: 20, ...params },
      });
      runInAction(() => {
        this.assignments = response.data?.data || [];
        this.assignmentsPagination = response.data?.pagination || { ...EMPTY_PAGINATION };
      });
      return response.data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to load policy assignments"));
    } finally {
      runInAction(() => {
        this.assignmentsLoading = false;
      });
    }
  };

  resolveEmployeePolicy = async (employeeId: string, at: string) => {
    try {
      const response = await axios.get(`/workforce-policies/resolve/${employeeId}`, {
        params: { at },
      });
      return response.data?.data as EmployeePolicyResolution;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to resolve employee policies"));
    }
  };

  fetchCoverage = async (
    companyId: string,
    params: { at: string; page?: number; limit?: number; search?: string }
  ) => {
    this.coverageLoading = true;
    this.coverageError = null;
    try {
      const response = await axios.get("/workforce-policies/coverage", {
        params: { companyId, limit: 20, ...params },
      });
      runInAction(() => {
        this.coverageItems = response.data?.data || [];
        this.coverageSummary = response.data?.summary || {
          employeesOnPage: 0,
          completeOnPage: 0,
          incompleteOnPage: 0,
        };
        this.coveragePagination = response.data?.pagination || { ...EMPTY_PAGINATION };
      });
      return response.data;
    } catch (error: any) {
      const message = this.getError(error, "Failed to load policy coverage");
      runInAction(() => {
        this.coverageItems = [];
        this.coverageError = message;
      });
      throw new Error(message);
    } finally {
      runInAction(() => {
        this.coverageLoading = false;
      });
    }
  };

  fetchAudit = async (
    companyId: string,
    params: { page?: number; limit?: number; entityType?: string } = {}
  ) => {
    this.auditLoading = true;
    this.auditError = null;
    try {
      const response = await axios.get("/workforce-policies/audit", {
        params: { companyId, page: 1, limit: 20, ...params },
      });
      runInAction(() => {
        this.auditLogs = response.data?.data || [];
        this.auditPagination = response.data?.pagination || { ...EMPTY_PAGINATION };
      });
      return response.data;
    } catch (error: any) {
      const message = this.getError(error, "Failed to load policy audit history");
      runInAction(() => {
        this.auditLogs = [];
        this.auditError = message;
      });
      throw new Error(message);
    } finally {
      runInAction(() => {
        this.auditLoading = false;
      });
    }
  };

  fetchResourceDetail = async (
    resourceType: PolicyResourceType,
    resourceId: string,
    companyId: string
  ) => {
    const requestSequence = ++this.detailRequestSequence;
    this.detailLoading = true;
    this.detailError = null;
    this.selectedResource = null;
    try {
      const path =
        resourceType === "attendance_policy"
          ? `/workforce-policies/attendance/${resourceId}`
          : resourceType === "work_schedule"
            ? `/workforce-policies/work-schedules/${resourceId}`
            : `/workforce-policies/holiday-calendars/${resourceId}`;
      const response = await axios.get(path, { params: { companyId } });
      runInAction(() => {
        if (requestSequence === this.detailRequestSequence) {
          this.selectedResource = response.data?.data || null;
        }
      });
      return response.data?.data;
    } catch (error: any) {
      runInAction(() => {
        if (requestSequence === this.detailRequestSequence) {
          this.detailError = this.getError(error, "Failed to load policy history");
        }
      });
      throw error;
    } finally {
      runInAction(() => {
        if (requestSequence === this.detailRequestSequence) {
          this.detailLoading = false;
        }
      });
    }
  };

  createAttendancePolicy = async (payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post("/workforce-policies/attendance", payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create attendance policy"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  updateAttendanceDraft = async (policyId: string, versionId: string, payload: any) => {
    this.submitting = true;
    try {
      return (
        await axios.put(
          `/workforce-policies/attendance/${policyId}/versions/${versionId}`,
          payload
        )
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to update attendance policy draft"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  createAttendanceVersion = async (policyId: string, payload: any) => {
    this.submitting = true;
    try {
      return (
        await axios.post(`/workforce-policies/attendance/${policyId}/versions`, payload)
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create policy version"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  publishAttendanceVersion = async (
    policyId: string,
    versionId: string,
    payload: any
  ) => {
    this.submitting = true;
    try {
      return (
        await axios.post(
          `/workforce-policies/attendance/${policyId}/versions/${versionId}/publish`,
          payload
        )
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to publish attendance policy"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  createWorkSchedule = async (payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post("/workforce-policies/work-schedules", payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create work schedule"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  updateWorkScheduleDraft = async (scheduleId: string, versionId: string, payload: any) => {
    this.submitting = true;
    try {
      return (
        await axios.put(
          `/workforce-policies/work-schedules/${scheduleId}/versions/${versionId}`,
          payload
        )
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to update work schedule draft"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  createWorkScheduleVersion = async (scheduleId: string, payload: any) => {
    this.submitting = true;
    try {
      return (
        await axios.post(`/workforce-policies/work-schedules/${scheduleId}/versions`, payload)
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create work schedule version"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  publishWorkScheduleVersion = async (
    scheduleId: string,
    versionId: string,
    payload: any
  ) => {
    this.submitting = true;
    try {
      return (
        await axios.post(
          `/workforce-policies/work-schedules/${scheduleId}/versions/${versionId}/publish`,
          payload
        )
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to publish work schedule"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  createHolidayCalendar = async (payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post("/workforce-policies/holiday-calendars", payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create holiday calendar"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  updateHolidayDraft = async (calendarId: string, versionId: string, payload: any) => {
    this.submitting = true;
    try {
      return (
        await axios.put(
          `/workforce-policies/holiday-calendars/${calendarId}/versions/${versionId}`,
          payload
        )
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to update holiday calendar draft"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  createHolidayVersion = async (calendarId: string, payload: any) => {
    this.submitting = true;
    try {
      return (
        await axios.post(`/workforce-policies/holiday-calendars/${calendarId}/versions`, payload)
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create calendar version"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  publishHolidayVersion = async (
    calendarId: string,
    versionId: string,
    payload: any
  ) => {
    this.submitting = true;
    try {
      return (
        await axios.post(
          `/workforce-policies/holiday-calendars/${calendarId}/versions/${versionId}/publish`,
          payload
        )
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to publish holiday calendar"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  createAssignment = async (payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post("/workforce-policies/assignments", payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create policy assignment"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  endAssignment = async (assignmentId: string, payload: any) => {
    this.submitting = true;
    try {
      return (
        await axios.post(`/workforce-policies/assignments/${assignmentId}/end`, payload)
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to end policy assignment"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };
}

export const workforcePolicyStore = new WorkforcePolicyStore();
