import axios from "axios";

export type AttendanceOvertimeReview = {
  _id: string;
  status: "pending" | "approved" | "rejected" | "superseded";
  employee?: { _id: string; name?: string; username?: string; code?: string; role?: string };
  attendanceRecord: string;
  attendanceDate: string;
  attendanceRevisionNumber: number;
  overtimeMinutesSnapshot: number;
  workedMinutesSnapshot: number;
  dayTypeSnapshot: string;
  reason?: string;
  submittedAt: string;
  decidedAt?: string | null;
  decisionComment?: string;
  currentApprovers?: Array<{ _id: string; name?: string; username?: string; code?: string }>;
  approvalInstance?: {
    _id: string;
    status: string;
    currentStepOrder?: number | null;
    steps?: Array<{ order: number; nameSnapshot: string }>;
  } | null;
};

export async function fetchAttendanceOvertimeReviews(params: {
  scope?: "mine" | "approvals" | "company";
  status?: string;
  page?: number;
  limit?: number;
  companyId?: string;
}) {
  const response = await axios.get("/attendance/overtime/reviews", { params });
  return {
    items: (response.data?.data || []) as AttendanceOvertimeReview[],
    pagination: response.data?.pagination,
  };
}

export async function actOnAttendanceOvertimeReview(
  reviewId: string,
  action: "approve" | "reject",
  input: { comment?: string; companyId?: string } = {}
) {
  const response = await axios.post(`/attendance/overtime/reviews/${reviewId}/${action}`, input);
  return response.data?.data as AttendanceOvertimeReview;
}
