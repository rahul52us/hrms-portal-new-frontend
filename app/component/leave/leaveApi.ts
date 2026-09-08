import axios from "axios";

export type LeaveAttachment = {
  _id: string;
  name: string;
  url: string;
  type: string;
  size: number;
};

export type LeaveDocumentStatus =
  | "not_required"
  | "pending"
  | "submitted"
  | "verified"
  | "waived";

export type LeaveDocumentRequirement = {
  required: boolean;
  thresholdUnits?: number | null;
  submissionMode?: "with_request" | "allow_later" | null;
  dueDaysAfterLeaveEnd?: number | null;
  dueDate?: string | null;
  provided?: boolean;
};

export type LeaveBalance = {
  _id?: string;
  creditedUnits: number;
  debitedUnits: number;
  pendingUnits: number;
  balanceUnits: number;
  availableUnits: number;
  leaveYearKey?: string;
  leaveYearStart?: string;
  leaveYearEnd?: string;
  leaveType?: any;
};

export type EligibleLeaveItem = {
  leaveType: {
    _id: string;
    name: string;
    code: string;
    color: string;
    unit: "days" | "hours";
    paid: boolean;
    balanceTracked: boolean;
    allowHalfDay: boolean;
  };
  rule: any;
  leaveYear: { leaveYearKey: string; leaveYearStart: string; leaveYearEnd: string };
  balance: LeaveBalance;
};

export type LeaveRequest = {
  _id: string;
  employee: any;
  leaveType: any;
  leaveTypeCodeSnapshot: string;
  leaveTypeNameSnapshot: string;
  leaveUnit: "days" | "hours";
  fromDate: string;
  toDate: string;
  requestedUnits: number;
  chargedUnits: number;
  reason: string;
  status: string;
  approver?: any;
  currentApprovers?: any[];
  approvalInstance?: any;
  approverNameSnapshot?: string;
  dayBreakdown?: any[];
  attachments?: LeaveAttachment[];
  documentRequirementSnapshot?: LeaveDocumentRequirement;
  documentStatus?: LeaveDocumentStatus;
  documentSubmittedAt?: string | null;
  documentVerifiedAt?: string | null;
  documentVerifiedBy?: any;
  documentWaivedAt?: string | null;
  documentWaivedBy?: any;
  documentDecisionComment?: string;
  history?: any[];
  submittedAt: string;
  decisionComment?: string;
  cancellationRequest?: LeaveCancellationRequest | string | null;
  cancellationStatus?: "none" | "submitted" | "approved" | "rejected" | "withdrawn";
  cancellationReason?: string;
};

export type LeaveCancellationRequest = {
  _id: string;
  leaveRequest: LeaveRequest | any;
  employee: any;
  reason: string;
  status: "submitted" | "approved" | "rejected" | "withdrawn";
  approver?: any;
  currentApprovers?: any[];
  approvalInstance?: any;
  approverNameSnapshot?: string;
  requestedAt: string;
  decidedAt?: string | null;
  decidedBy?: any;
  decisionComment?: string;
  history?: any[];
};

export type LeaveEncashmentRequest = {
  _id: string;
  employee: any;
  leaveType: any;
  leaveTypeCodeSnapshot: string;
  leaveTypeNameSnapshot: string;
  leaveUnit: "days" | "hours";
  leaveYearKey: string;
  leaveYearStart: string;
  leaveYearEnd: string;
  requestedUnits: number;
  maxEncashmentPerYearSnapshot: number;
  availableBalanceSnapshot: number;
  reason: string;
  status: "submitted" | "approved" | "rejected" | "withdrawn" | "cancelled";
  payoutStatus: "not_ready" | "pending" | "paid" | "cancelled";
  payoutAmount?: number | null;
  payoutCurrency?: string;
  payoutDate?: string | null;
  payoutReference?: string;
  payoutNotes?: string;
  approver?: any;
  currentApprovers?: any[];
  approvalInstance?: any;
  approverNameSnapshot?: string;
  requestedAt: string;
  decidedAt?: string | null;
  settledAt?: string | null;
  settledBy?: any;
  cancellationReason?: string;
  history?: any[];
};

export type LeaveEncashmentEligibilityItem = {
  leaveType: EligibleLeaveItem["leaveType"];
  rule: any;
  leaveYear: EligibleLeaveItem["leaveYear"];
  balance: LeaveBalance;
  usedUnits: number;
  remainingAnnualUnits: number;
  maximumRequestableUnits: number;
  increment: number;
  pendingRequest?: Pick<LeaveEncashmentRequest, "_id" | "requestedUnits" | "requestedAt"> | null;
  canRequest: boolean;
};

export type LeaveYearEndRun = {
  _id: string;
  asOf: string;
  trigger: "manual" | "scheduler";
  employee?: any;
  status: "running" | "completed" | "partial" | "failed";
  processedBalances: number;
  completedClosures: number;
  partialClosures: number;
  configurationErrors: number;
  carriedUnits: number;
  lapsedUnits: number;
  expiredUnits: number;
  deferredExpiryLots: number;
  failedItems: number;
  failures?: Array<{ employee?: string; leaveType?: string; message: string }>;
  startedAt: string;
  completedAt?: string | null;
  triggeredBy?: any;
};

export type LeaveYearEndClosure = {
  _id: string;
  employee: any;
  leaveType: any;
  sourceLeaveYearKey: string;
  sourceLeaveYearStart: string;
  sourceLeaveYearEnd: string;
  destinationLeaveYearKey?: string;
  carriedUnits: number;
  lapsedUnits: number;
  pendingUnits: number;
  remainingBalanceUnits: number;
  status: "partial" | "completed" | "not_applicable" | "configuration_error";
  message?: string;
  lastProcessedAt: string;
  updatedBy?: any;
};

export async function fetchEligibleLeave(params: Record<string, any> = {}) {
  const response = await axios.get("/leave/eligible", { params });
  return response.data?.data as { employee: any; at: string; items: EligibleLeaveItem[] };
}

export async function fetchLeaveRequests(params: Record<string, any>) {
  const response = await axios.get("/leave/requests", { params });
  return {
    items: (response.data?.data || []) as LeaveRequest[],
    pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function fetchLeaveTransactions(params: Record<string, any>) {
  const response = await axios.get("/leave/transactions", { params });
  return {
    employee: response.data?.data?.employee,
    items: response.data?.data?.items || [],
    pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function previewLeaveRequest(payload: Record<string, any>) {
  const response = await axios.post("/leave/requests/preview", payload);
  return response.data?.data;
}

export async function submitLeaveRequest(payload: Record<string, any>) {
  const response = await axios.post("/leave/requests", payload);
  return response.data?.data as LeaveRequest;
}

export async function uploadLeaveAttachment(file: File, companyId?: string) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read attachment"));
    reader.readAsDataURL(file);
  });
  const response = await axios.post("/leave/attachments", {
    companyId: companyId || undefined,
    name: file.name,
    type: file.type,
    size: file.size,
    data,
  });
  return response.data?.data as LeaveAttachment;
}

export async function addLeaveRequestDocuments(
  requestId: string,
  attachments: LeaveAttachment[],
  companyId?: string
) {
  const response = await axios.post(`/leave/requests/${requestId}/documents`, {
    companyId: companyId || undefined,
    attachments: attachments.map((attachment) => ({ _id: attachment._id })),
  });
  return response.data?.data as LeaveRequest;
}

export async function manageLeaveRequestDocuments(
  requestId: string,
  action: "verify" | "waive",
  payload: Record<string, any> = {}
) {
  const response = await axios.post(`/leave/requests/${requestId}/documents/${action}`, payload);
  return response.data?.data as LeaveRequest;
}

export async function actOnLeaveRequest(
  requestId: string,
  action: "approve" | "reject" | "withdraw" | "cancel",
  payload: Record<string, any> = {}
) {
  const response = await axios.post(`/leave/requests/${requestId}/${action}`, payload);
  return response.data?.data as LeaveRequest;
}

export async function submitLeaveCancellationRequest(
  leaveRequestId: string,
  payload: Record<string, any>
) {
  const response = await axios.post(
    `/leave/requests/${leaveRequestId}/cancellation-requests`,
    payload
  );
  return response.data?.data as LeaveCancellationRequest;
}

export async function fetchLeaveCancellationRequests(params: Record<string, any>) {
  const response = await axios.get("/leave/cancellation-requests", { params });
  return {
    items: (response.data?.data || []) as LeaveCancellationRequest[],
    pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function actOnLeaveCancellationRequest(
  cancellationRequestId: string,
  action: "approve" | "reject" | "withdraw",
  payload: Record<string, any> = {}
) {
  const response = await axios.post(
    `/leave/cancellation-requests/${cancellationRequestId}/${action}`,
    payload
  );
  return response.data?.data as LeaveCancellationRequest;
}

export async function fetchLeaveEncashmentEligibility(params: Record<string, any> = {}) {
  const response = await axios.get("/leave/encashments/eligible", { params });
  return response.data?.data as {
    employee: any;
    at: string;
    leaveYear: EligibleLeaveItem["leaveYear"];
    items: LeaveEncashmentEligibilityItem[];
  };
}

export async function submitLeaveEncashmentRequest(payload: Record<string, any>) {
  const response = await axios.post("/leave/encashments", payload);
  return response.data?.data as LeaveEncashmentRequest;
}

export async function fetchLeaveEncashmentRequests(params: Record<string, any>) {
  const response = await axios.get("/leave/encashments", { params });
  return {
    items: (response.data?.data || []) as LeaveEncashmentRequest[],
    pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function actOnLeaveEncashmentRequest(
  encashmentRequestId: string,
  action: "approve" | "reject" | "withdraw",
  payload: Record<string, any> = {}
) {
  const response = await axios.post(
    `/leave/encashments/${encashmentRequestId}/${action}`,
    payload
  );
  return response.data?.data as LeaveEncashmentRequest;
}

export async function settleLeaveEncashmentRequest(
  encashmentRequestId: string,
  payload: Record<string, any>
) {
  const response = await axios.post(
    `/leave/encashments/${encashmentRequestId}/settle`,
    payload
  );
  return response.data?.data as LeaveEncashmentRequest;
}

export async function cancelApprovedLeaveEncashmentRequest(
  encashmentRequestId: string,
  payload: Record<string, any>
) {
  const response = await axios.post(
    `/leave/encashments/${encashmentRequestId}/cancel`,
    payload
  );
  return response.data?.data as LeaveEncashmentRequest;
}

export async function adjustLeaveBalance(payload: Record<string, any>) {
  const response = await axios.post("/leave/balances/adjustments", payload);
  return response.data?.data;
}

export async function rebuildLeaveBalance(payload: Record<string, any>) {
  const response = await axios.post("/leave/balances/rebuild", payload);
  return response.data?.data;
}

export async function runLeaveYearEnd(payload: Record<string, any>) {
  const response = await axios.post("/leave/year-end/run", payload);
  return response.data?.data as LeaveYearEndRun;
}

export async function fetchLeaveYearEndRuns(params: Record<string, any>) {
  const response = await axios.get("/leave/year-end/runs", { params });
  return {
    items: (response.data?.data || []) as LeaveYearEndRun[],
    pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function fetchLeaveYearEndClosures(params: Record<string, any>) {
  const response = await axios.get("/leave/year-end/closures", { params });
  return {
    items: (response.data?.data || []) as LeaveYearEndClosure[],
    pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}
