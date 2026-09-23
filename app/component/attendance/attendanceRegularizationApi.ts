import axios from "axios";

export type AttendanceRegularizationType =
  | "missing_punch_in"
  | "missing_punch_out"
  | "time_correction"
  | "work_mode_correction"
  | "full_day_correction";

export type AttendanceRegularizationRequest = {
  _id: string;
  employee: any;
  attendanceDate: string;
  correctionType: AttendanceRegularizationType;
  reason: string;
  status: "submitted" | "approved" | "rejected" | "withdrawn";
  originalSnapshot?: any;
  requestedChanges: any;
  attachments?: any[];
  approver?: any;
  currentApprovers?: any[];
  approvalInstance?: any;
  approverNameSnapshot?: string;
  submittedAt: string;
  decisionComment?: string;
  appliedRevisionNumber?: number | null;
};

export type AttendanceRegularizationEligibility = {
  attendanceDate: string;
  timezone: string;
  record: any | null;
  rules: {
    allowedTypes: AttendanceRegularizationType[];
    requestStartDays: number;
    maxBackdateDays: number;
    monthlyRequestLimit: number;
    minimumReasonLength: number;
    documentMode: "none" | "optional" | "required";
  };
  allowedTypes: AttendanceRegularizationType[];
  usedThisMonth: number;
  remainingThisMonth: number | null;
};

export async function fetchAttendanceRegularizationEligibility(attendanceDate: string) {
  const response = await axios.get("/attendance/regularization/eligibility", {
    params: { attendanceDate },
  });
  return response.data?.data as AttendanceRegularizationEligibility;
}

export async function fetchAttendanceRegularizationRequests(params: Record<string, any>) {
  const response = await axios.get("/attendance/regularization/requests", { params });
  return {
    items: (response.data?.data || []) as AttendanceRegularizationRequest[],
    pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function submitAttendanceRegularizationRequest(payload: Record<string, any>) {
  const response = await axios.post("/attendance/regularization/requests", payload);
  return response.data?.data as AttendanceRegularizationRequest;
}

export async function actOnAttendanceRegularizationRequest(
  requestId: string,
  action: "approve" | "reject" | "withdraw",
  payload: Record<string, any> = {}
) {
  const response = await axios.post(
    `/attendance/regularization/requests/${requestId}/${action}`,
    payload
  );
  return response.data?.data as AttendanceRegularizationRequest;
}
