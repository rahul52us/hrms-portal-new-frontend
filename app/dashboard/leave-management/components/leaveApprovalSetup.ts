import type { LeavePolicyRule } from "@/app/store/workforcePolicyStore/workforcePolicyStore";

export const APPROVAL_FLOWS_URL = "/dashboard/workforce-policies?tab=approval-flows";

export function requiredLeaveApprovalFlows(rules: LeavePolicyRule[]) {
  return [
    ...(rules.length ? ["leave requests"] : []),
    ...(rules.some((rule) => rule.encashmentEnabled) ? ["leave encashment"] : []),
    ...(rules.some((rule) => rule.entitlementMode === "earned") ? ["comp-off claims"] : []),
  ];
}

export function isApprovalWorkflowSetupError(message: string) {
  return /approval workflow setup is incomplete|configured approval workflow is unavailable|no published approval workflow version is effective|select a published approval workflow|selected approval workflow is not published/i.test(message);
}
