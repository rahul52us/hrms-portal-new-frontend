import type { ApprovalRequestType } from "@/app/store/workforcePolicyStore/workforcePolicyStore";

export const APPROVAL_REQUEST_LABELS: Record<ApprovalRequestType, string> = {
  leave_request: "Leave",
  leave_encashment_request: "Leave Encashment",
  remote_work_request: "WFH",
  comp_off_claim: "Comp-Off",
  attendance_regularization_request: "Attendance Correction",
  attendance_overtime_review: "Overtime Review",
  timesheet_submission: "Timesheet",
};

export function formatApprovalRequestType(value: string) {
  const key = String(value || "").trim().toLowerCase();
  const label = APPROVAL_REQUEST_LABELS[key as ApprovalRequestType];
  if (typeof label === "string") return label;
  return key.replace(/_/g, " ").replace(/(^|[\s-])\S/g, (part) => part.toUpperCase()) || "Request";
}
