import type { LeavePolicyRule, LeaveTypeItem } from "@/app/store/workforcePolicyStore/workforcePolicyStore";

export function leaveTypeFieldErrors(values: { name: string; code: string; color: string }) {
  const errors: Record<string, string> = {};
  if (!values.name.trim()) errors.name = "Leave type name is required.";
  if (!values.code.trim()) errors.code = "Leave type code is required.";
  if (!/^#[0-9a-fA-F]{6}$/.test(values.color)) errors.color = "Choose a valid six-digit color.";
  return errors;
}

export function leavePolicyFieldErrors(values: {
  mode: "create" | "edit_draft" | "new_version";
  name: string;
  code: string;
  effectiveFrom: string;
  ruleCount: number;
  changeReason: string;
}) {
  const errors: Record<string, string> = {};
  if (values.mode === "create" && !values.name.trim()) errors.name = "Policy name is required.";
  if (values.mode === "create" && !values.code.trim()) errors.code = "Policy code is required.";
  if (!values.effectiveFrom) errors.effectiveFrom = "Effective-from date is required.";
  if (!values.ruleCount) errors.rules = "Add at least one leave type rule.";
  if (values.mode === "new_version" && values.changeReason.trim().length < 3) errors.changeReason = "Enter a reason for the new version (at least 3 characters).";
  return errors;
}

// Drafts can remain incomplete; these field errors block publication only.
export function leavePolicyRuleFieldErrors(rule: LeavePolicyRule, leaveType?: LeaveTypeItem) {
  const errors: Record<string, string> = {};
  const code = leaveType?.code || rule.leaveTypeCodeSnapshot || "Leave type";
  const balanceTracked = leaveType?.balanceTracked ?? rule.balanceTracked !== false;
  if (balanceTracked && rule.entitlementMode === "fixed" && rule.annualEntitlement <= 0) errors.annualEntitlement = `${code} annual entitlement must be greater than zero.`;
  if (!rule.requestApprovalWorkflow) errors.requestApprovalWorkflow = `${code} must select a published leave-request approval workflow.`;
  if (rule.entitlementMode === "fixed") {
    rule.creditComponents.forEach((component, index) => {
      if (component.amount <= 0) errors[`creditComponents.${index}.amount`] = `${code} automatic credit amounts must be greater than zero.`;
    });
  }
  if (rule.entitlementMode === "earned") {
    if (!rule.compOffClaimApprovalWorkflow) errors.compOffClaimApprovalWorkflow = `${code} must select a published comp-off claim approval workflow.`;
    if (rule.compOffValidityDays < 1 || rule.compOffValidityDays > 730) errors.compOffValidityDays = `${code} credit validity must be between 1 and 730 days.`;
    if (rule.compOffFullDayMinutes < 1) errors.compOffFullDayMinutes = `${code} earning thresholds must be greater than zero.`;
    if (rule.compOffHalfDayMinutes < 1) errors.compOffHalfDayMinutes = `${code} earning thresholds must be greater than zero.`;
    else if (rule.compOffHalfDayMinutes > rule.compOffFullDayMinutes) errors.compOffHalfDayMinutes = `${code} half-day threshold cannot exceed the full-day threshold.`;
  }
  if (rule.documentRequiredFromUnits !== null && rule.documentRequiredFromUnits !== undefined) {
    const step = leaveType?.unit === "hours" ? 0.25 : rule.allowHalfDay ? 0.5 : 1;
    if (rule.documentRequiredFromUnits <= 0) errors.documentRequiredFromUnits = `${code} document threshold must be greater than zero.`;
    else if (!Number.isInteger(rule.documentRequiredFromUnits / step)) errors.documentRequiredFromUnits = `${code} document threshold must use valid ${leaveType?.unit || "day"} increments.`;
    if (rule.documentSubmissionMode === "allow_later" && (!Number.isInteger(rule.documentDueDaysAfterLeaveEnd) || rule.documentDueDaysAfterLeaveEnd < 0 || rule.documentDueDaysAfterLeaveEnd > 365)) errors.documentDueDaysAfterLeaveEnd = `${code} document due period must be a whole number from 0 to 365 days.`;
  }
  if (rule.carryForwardEnabled && rule.maxCarryForward <= 0) errors.maxCarryForward = `${code} maximum carry-forward must be greater than zero.`;
  if (rule.encashmentEnabled && rule.maxEncashmentPerYear <= 0) errors.maxEncashmentPerYear = `${code} annual encashment limit must be greater than zero.`;
  if (rule.encashmentEnabled && !rule.encashmentApprovalWorkflow) errors.encashmentApprovalWorkflow = `${code} must select a published leave-encashment approval workflow.`;
  if (rule.negativeBalanceAllowed && rule.maxNegativeBalance <= 0) errors.maxNegativeBalance = `${code} maximum negative balance must be greater than zero.`;
  if (leaveType?.unit === "hours") {
    if (!Number.isInteger(rule.minimumRequestDays * 4)) errors.minimumRequestDays = `${code} minimum request must use 15-minute increments.`;
    if (rule.maximumRequestDays !== null && rule.maximumRequestDays !== undefined && !Number.isInteger(rule.maximumRequestDays * 4)) errors.maximumRequestDays = `${code} maximum request must use 15-minute increments.`;
  } else if (rule.allowHalfDay) {
    if (rule.minimumRequestDays !== 0.5) errors.minimumRequestDays = `${code} minimum request must be 0.5 day when half-day leave is allowed.`;
    if (rule.maximumRequestDays !== null && rule.maximumRequestDays !== undefined && !Number.isInteger(rule.maximumRequestDays * 2)) errors.maximumRequestDays = `${code} maximum request must use half-day increments.`;
  } else {
    if (rule.minimumRequestDays < 1 || !Number.isInteger(rule.minimumRequestDays)) errors.minimumRequestDays = `${code} minimum request must be a whole day when half-day leave is disabled.`;
    if (rule.maximumRequestDays !== null && rule.maximumRequestDays !== undefined && !Number.isInteger(rule.maximumRequestDays)) errors.maximumRequestDays = `${code} maximum request must be a whole day when half-day leave is disabled.`;
  }
  return errors;
}
