import axios from "axios";

export type RemoteWorkRequest = {
  _id: string;
  employee: any;
  employeeNameSnapshot: string;
  employeeCodeSnapshot?: string;
  fromDate: string;
  toDate: string;
  requestedUnits: number;
  dates: Array<{ attendanceDate: string; portion: string; units: number; dayTypeSnapshot: string }>;
  reason?: string;
  status: string;
  approvalModeSnapshot: string;
  approver?: any;
  approverNameSnapshot?: string;
  reportingManager?: any;
  reportingManagerNameSnapshot?: string;
  remoteWorkPolicy?: any;
  policyScopeNameSnapshot?: string;
  history?: any[];
  submittedAt: string;
  decisionComment?: string;
};

export async function fetchRemoteWorkEligibility(params: Record<string, any>) {
  const response = await axios.get("/remote-work/eligibility", { params });
  return response.data?.data;
}

export async function fetchRemoteWorkRequests(params: Record<string, any>) {
  const response = await axios.get("/remote-work/requests", { params });
  return {
    items: (response.data?.data || []) as RemoteWorkRequest[],
    pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function previewRemoteWorkRequest(payload: Record<string, any>) {
  const response = await axios.post("/remote-work/requests/preview", payload);
  return response.data?.data;
}

export async function submitRemoteWorkRequest(payload: Record<string, any>) {
  const response = await axios.post("/remote-work/requests", payload);
  return response.data?.data as RemoteWorkRequest;
}

export async function actOnRemoteWorkRequest(
  requestId: string,
  action: "approve" | "reject" | "withdraw" | "cancel",
  payload: Record<string, any> = {}
) {
  const response = await axios.post(`/remote-work/requests/${requestId}/${action}`, payload);
  return response.data?.data as RemoteWorkRequest;
}
