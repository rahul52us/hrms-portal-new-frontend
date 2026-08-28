import axios from "axios";

export type CompOffClaim = {
  _id: string;
  employee: any;
  leaveType: any;
  attendanceDate: string;
  dayTypeSnapshot: string;
  workedMinutesSnapshot: number;
  requestedUnits: number;
  eligibleUnitsSnapshot: number;
  approvedUnits: number;
  expiresOn?: string | null;
  reason: string;
  status: "submitted" | "approved" | "rejected" | "withdrawn" | "revoked";
  approver?: any;
  currentApprovers?: any[];
  approvalInstance?: any;
  approverNameSnapshot?: string;
  policyScopeNameSnapshot?: string;
  history?: any[];
  submittedAt: string;
  decisionComment?: string;
};

export type CompOffEligibility = {
  employee: any;
  attendanceDate: string;
  dayType: string;
  workedMinutes: number;
  attendanceState: string;
  items: Array<{
    leaveType: any;
    rule: any;
    eligibleUnits: number;
    existingClaim?: CompOffClaim | null;
  }>;
};

export async function fetchCompOffEligibility(params: Record<string, any>) {
  const response = await axios.get("/comp-off/eligibility", { params });
  return response.data?.data as CompOffEligibility;
}

export async function fetchCompOffClaims(params: Record<string, any>) {
  const response = await axios.get("/comp-off/claims", { params });
  return {
    items: (response.data?.data || []) as CompOffClaim[],
    pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function fetchCompOffCredits(params: Record<string, any> = {}) {
  const response = await axios.get("/comp-off/credits", { params });
  return response.data?.data as {
    summary: { availableUnits: number; reservedUnits: number; consumedUnits: number; expiredUnits: number; revokedUnits: number };
    lots: any[];
  };
}

export async function submitCompOffClaim(payload: Record<string, any>) {
  const response = await axios.post("/comp-off/claims", payload);
  return response.data?.data as CompOffClaim;
}

export async function actOnCompOffClaim(
  claimId: string,
  action: "approve" | "reject" | "withdraw" | "revoke",
  payload: Record<string, any> = {}
) {
  const response = await axios.post(`/comp-off/claims/${claimId}/${action}`, payload);
  return response.data?.data as CompOffClaim;
}
