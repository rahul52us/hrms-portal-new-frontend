import axios from "axios";

export type LeaveAttachment = {
  _id: string;
  name: string;
  url: string;
  type: string;
  size: number;
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
  approverNameSnapshot?: string;
  dayBreakdown?: any[];
  attachments?: LeaveAttachment[];
  history?: any[];
  submittedAt: string;
  decisionComment?: string;
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

export async function actOnLeaveRequest(
  requestId: string,
  action: "approve" | "reject" | "withdraw" | "cancel",
  payload: Record<string, any> = {}
) {
  const response = await axios.post(`/leave/requests/${requestId}/${action}`, payload);
  return response.data?.data as LeaveRequest;
}

export async function adjustLeaveBalance(payload: Record<string, any>) {
  const response = await axios.post("/leave/balances/adjustments", payload);
  return response.data?.data;
}

export async function rebuildLeaveBalance(payload: Record<string, any>) {
  const response = await axios.post("/leave/balances/rebuild", payload);
  return response.data?.data;
}
