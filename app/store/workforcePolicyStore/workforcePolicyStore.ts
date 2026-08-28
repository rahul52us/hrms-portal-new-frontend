import axios from "axios";
import { makeAutoObservable, runInAction } from "mobx";

export type PolicyVersionStatus = "draft" | "published" | "cancelled";
export type PolicyResourceType =
  | "attendance_policy"
  | "work_schedule"
  | "holiday_calendar"
  | "leave_policy"
  | "remote_work_policy";
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

export interface RemoteWorkRules {
  approvalMode: "reporting_manager" | "hr" | "manager_then_hr" | "auto_approve";
  approvalWorkflow?: string | null;
  approvalWorkflowVersion?: string | null;
  approvalWorkflowVersionNumber?: number | null;
  allowedWeekdays: string[];
  maxDaysPerWeek: number;
  maxDaysPerMonth: number;
  maxConsecutiveDays: number;
  minimumNoticeDays: number;
  maximumAdvanceDays: number;
  allowHalfDay: boolean;
  requireReason: boolean;
  minimumReasonLength: number;
  probationEligibility: "allowed" | "after_confirmation" | "not_allowed";
}

export interface LeaveTypeItem {
  _id: string;
  company: string;
  name: string;
  code: string;
  description?: string;
  paid: boolean;
  balanceTracked: boolean;
  unit: "days" | "hours";
  allowHalfDay: boolean;
  color: string;
  status: "active" | "archived";
  displayOrder: number;
}

export interface LeaveCreditComponent {
  componentId: string;
  frequency: "upfront" | "monthly" | "quarterly";
  amount: number;
  upfrontTiming: "leave_year_start" | "first_eligibility";
  prorateOnJoining: boolean;
  prorateOnExit: boolean;
}

export interface LeavePolicyRule {
  _id?: string;
  leaveType: string;
  leaveTypeCodeSnapshot?: string;
  leaveTypeNameSnapshot?: string;
  paid?: boolean;
  balanceTracked?: boolean;
  entitlementMode: "fixed" | "earned" | "manual" | "untracked";
  annualEntitlement: number;
  accrualFrequency: "upfront" | "monthly" | "quarterly" | "none";
  accrualAmount: number;
  creditComponents: LeaveCreditComponent[];
  prorateOnJoining: boolean;
  prorateOnExit: boolean;
  carryForwardEnabled: boolean;
  maxCarryForward: number;
  carryForwardExpiryMonths: number;
  encashmentEnabled: boolean;
  maxEncashmentPerYear: number;
  negativeBalanceAllowed: boolean;
  maxNegativeBalance: number;
  allowHalfDay: boolean;
  minimumRequestDays: number;
  maximumRequestDays?: number | null;
  minimumNoticeDays: number;
  documentRequiredAfterDays?: number | null;
  probationEligibility: "allowed" | "after_confirmation" | "not_allowed";
  sandwichRuleEnabled: boolean;
  compOffValidityDays: number;
  compOffFullDayMinutes: number;
  compOffHalfDayMinutes: number;
  requestApprovalWorkflow?: string | null;
  requestApprovalWorkflowVersion?: string | null;
  requestApprovalWorkflowVersionNumber?: number | null;
  compOffClaimApprovalWorkflow?: string | null;
  compOffClaimApprovalWorkflowVersion?: string | null;
  compOffClaimApprovalWorkflowVersionNumber?: number | null;
}

export type ApprovalRequestType = "leave_request" | "remote_work_request" | "comp_off_claim";
export type ApprovalStepType =
  | "reporting_manager"
  | "manager_manager"
  | "department_head"
  | "hr"
  | "specific_users";

export interface ApprovalWorkflowStep {
  order: number;
  name: string;
  approverType: ApprovalStepType;
  approvalRule: "any" | "all";
  approverUserIds: Array<string | { _id: string; name?: string; username?: string; role?: string }>;
  fallbackToHr: boolean;
}

export interface ApprovalWorkflowVersion {
  _id: string;
  versionNumber: number;
  status: PolicyVersionStatus;
  autoApprove: boolean;
  steps: ApprovalWorkflowStep[];
  changeReason?: string;
  publishedAt?: string | null;
}

export interface ApprovalWorkflowItem {
  _id: string;
  company: string;
  name: string;
  code: string;
  description?: string;
  applicableTo: ApprovalRequestType[];
  status: "active" | "archived";
  latestVersionNumber: number;
  draftVersion?: ApprovalWorkflowVersion | null;
  latestPublishedVersion?: ApprovalWorkflowVersion | null;
}

export interface PolicyVersion {
  _id: string;
  versionNumber: number;
  status: PolicyVersionStatus;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  changeReason?: string;
  rules?: AttendanceRules | WorkScheduleRules | RemoteWorkRules | LeavePolicyRule[];
  leaveYearStartMonth?: number;
  leaveYearStartDay?: number;
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
  leavePolicy: ResolvedPolicyResource | null;
  remoteWorkPolicy: ResolvedPolicyResource | null;
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
  leaveTypes: LeaveTypeItem[] = [];
  leavePolicies: WorkforcePolicyItem[] = [];
  remoteWorkPolicies: WorkforcePolicyItem[] = [];
  approvalWorkflows: ApprovalWorkflowItem[] = [];
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
    leavePolicy?: WorkforcePolicyItem;
    remoteWorkPolicy?: WorkforcePolicyItem;
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
    this.leaveTypes = [];
    this.leavePolicies = [];
    this.remoteWorkPolicies = [];
    this.approvalWorkflows = [];
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
      this.leaveTypes = [];
      this.leavePolicies = [];
      this.remoteWorkPolicies = [];
      this.approvalWorkflows = [];
      this.assignments = [];
      this.assignmentsPagination = { ...EMPTY_PAGINATION };
    }
    this.activeCompanyId = companyId;
    try {
      const [attendance, schedules, calendars, leaveTypes, leavePolicies, remoteWorkPolicies, approvalWorkflows, assignments] = await Promise.all([
        axios.get("/workforce-policies/attendance", { params: { companyId, limit: 100 } }),
        axios.get("/workforce-policies/work-schedules", { params: { companyId, limit: 100 } }),
        axios.get("/workforce-policies/holiday-calendars", { params: { companyId, limit: 100 } }),
        axios.get("/workforce-policies/leave-types", { params: { companyId, limit: 100 } }),
        axios.get("/workforce-policies/leave-policies", { params: { companyId, limit: 100 } }),
        axios.get("/workforce-policies/remote-work-policies", { params: { companyId, limit: 100 } }),
        axios.get("/approval-workflows", { params: { companyId, limit: 100 } }),
        axios.get("/workforce-policies/assignments", { params: { companyId, limit: 100 } }),
      ]);
      runInAction(() => {
        this.attendancePolicies = attendance.data?.data || [];
        this.workSchedules = schedules.data?.data || [];
        this.holidayCalendars = calendars.data?.data || [];
        this.leaveTypes = leaveTypes.data?.data || [];
        this.leavePolicies = leavePolicies.data?.data || [];
        this.remoteWorkPolicies = remoteWorkPolicies.data?.data || [];
        this.approvalWorkflows = approvalWorkflows.data?.data || [];
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
    params: {
      at: string;
      page?: number;
      limit?: number;
      search?: string;
      resourceType?: PolicyResourceType;
    }
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
            : resourceType === "holiday_calendar"
            ? `/workforce-policies/holiday-calendars/${resourceId}`
              : resourceType === "leave_policy"
                ? `/workforce-policies/leave-policies/${resourceId}`
                : `/workforce-policies/remote-work-policies/${resourceId}`;
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

  createLeaveType = async (payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post("/workforce-policies/leave-types", payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create leave type"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  updateLeaveType = async (leaveTypeId: string, payload: any) => {
    this.submitting = true;
    try {
      return (await axios.put(`/workforce-policies/leave-types/${leaveTypeId}`, payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to update leave type"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  archiveLeaveType = async (leaveTypeId: string, payload: any) => {
    this.submitting = true;
    try {
      return (
        await axios.post(`/workforce-policies/leave-types/${leaveTypeId}/archive`, payload)
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to archive leave type"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  createLeavePolicy = async (payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post("/workforce-policies/leave-policies", payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create leave policy"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  updateLeavePolicyDraft = async (policyId: string, versionId: string, payload: any) => {
    this.submitting = true;
    try {
      return (
        await axios.put(
          `/workforce-policies/leave-policies/${policyId}/versions/${versionId}`,
          payload
        )
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to update leave policy draft"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  createLeavePolicyVersion = async (policyId: string, payload: any) => {
    this.submitting = true;
    try {
      return (
        await axios.post(`/workforce-policies/leave-policies/${policyId}/versions`, payload)
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create leave policy version"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  publishLeavePolicyVersion = async (policyId: string, versionId: string, payload: any) => {
    this.submitting = true;
    try {
      return (
        await axios.post(
          `/workforce-policies/leave-policies/${policyId}/versions/${versionId}/publish`,
          payload
        )
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to publish leave policy"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  archiveLeavePolicy = async (policyId: string, payload: any) => {
    this.submitting = true;
    try {
      return (
        await axios.post(`/workforce-policies/leave-policies/${policyId}/archive`, payload)
      ).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to archive leave policy"));
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  createRemoteWorkPolicy = async (payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post("/workforce-policies/remote-work-policies", payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create WFH policy"));
    } finally {
      runInAction(() => { this.submitting = false; });
    }
  };

  updateRemoteWorkDraft = async (policyId: string, versionId: string, payload: any) => {
    this.submitting = true;
    try {
      return (await axios.put(`/workforce-policies/remote-work-policies/${policyId}/versions/${versionId}`, payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to update WFH policy draft"));
    } finally {
      runInAction(() => { this.submitting = false; });
    }
  };

  createRemoteWorkVersion = async (policyId: string, payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post(`/workforce-policies/remote-work-policies/${policyId}/versions`, payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create WFH policy version"));
    } finally {
      runInAction(() => { this.submitting = false; });
    }
  };

  publishRemoteWorkVersion = async (policyId: string, versionId: string, payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post(`/workforce-policies/remote-work-policies/${policyId}/versions/${versionId}/publish`, payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to publish WFH policy"));
    } finally {
      runInAction(() => { this.submitting = false; });
    }
  };

  createApprovalWorkflow = async (payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post("/approval-workflows", payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create approval workflow"));
    } finally {
      runInAction(() => { this.submitting = false; });
    }
  };

  updateApprovalWorkflowDraft = async (workflowId: string, versionId: string, payload: any) => {
    this.submitting = true;
    try {
      return (await axios.put(`/approval-workflows/${workflowId}/versions/${versionId}`, payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to update approval workflow draft"));
    } finally {
      runInAction(() => { this.submitting = false; });
    }
  };

  createApprovalWorkflowVersion = async (workflowId: string, payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post(`/approval-workflows/${workflowId}/versions`, payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to create approval workflow version"));
    } finally {
      runInAction(() => { this.submitting = false; });
    }
  };

  publishApprovalWorkflowVersion = async (workflowId: string, versionId: string, payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post(`/approval-workflows/${workflowId}/versions/${versionId}/publish`, payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to publish approval workflow"));
    } finally {
      runInAction(() => { this.submitting = false; });
    }
  };

  archiveApprovalWorkflow = async (workflowId: string, payload: any) => {
    this.submitting = true;
    try {
      return (await axios.post(`/approval-workflows/${workflowId}/archive`, payload)).data;
    } catch (error: any) {
      throw new Error(this.getError(error, "Failed to archive approval workflow"));
    } finally {
      runInAction(() => { this.submitting = false; });
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
