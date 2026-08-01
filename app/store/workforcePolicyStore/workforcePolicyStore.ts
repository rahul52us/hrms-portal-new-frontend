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
}

class WorkforcePolicyStore {
  private detailRequestSequence = 0;
  attendancePolicies: WorkforcePolicyItem[] = [];
  workSchedules: WorkforcePolicyItem[] = [];
  holidayCalendars: WorkforcePolicyItem[] = [];
  assignments: WorkforcePolicyAssignment[] = [];
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
