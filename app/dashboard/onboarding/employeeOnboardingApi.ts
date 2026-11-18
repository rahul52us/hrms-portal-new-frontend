import { Task } from "./onboardingApi";
export type OnboardingTask = Omit<Task, "_id"> & {
  _id: string; status: "blocked" | "pending" | "pending_review" | "completed" | "waived"; dueDate: string; dueAt: string;
  assignees: { user: string; name: string }[]; ownerIssue: string; completionNote: string; overdue: boolean;
  documents: { document: string; name: string; type: string; size: number; uploadedBy: string; uploadedAt: string; scan?: { status: "clean" | "not_scanned"; provider: "clamav" | "disabled"; sha256: string; scannedAt: string | null } }[];
  canComplete: boolean; canUpload: boolean; canRemoveDocument: boolean; canReview: boolean; canWaive: boolean; canReopen: boolean; canReassign: boolean;
  canAcknowledge: boolean; acknowledgementCycle?: number;
  policySnapshot?: { policy: string; policyVersion: string; name: string; version: number; contentHash: string; acknowledgementText: string } | null;
  acknowledgement?: { receipt: string; employeeName: string; acknowledgedAt: string; cycle: number } | null;
  assetCycle?: number; assetProvision?: { linked: number; issued: number; acknowledged: number; fulfilled: number; required: number; receiptRequired: boolean; evaluatedAt: string } | null;
};
export type EmployeeOnboarding = {
  _id: string; employee: { _id: string; name: string; code: string; joiningDate?: string }; templateName: string; templateDescription: string;
  templateVersion: string; versionNumber: number; joiningDate: string; timezone: string; joiningDateChanged: boolean;
  status: "active" | "completed" | "cancelled"; revision: number; tasks: OnboardingTask[]; createdAt: string;
  progress: { total: number; done: number; required: number; requiredDone: number; blocked: number; overdue: number };
  canManage: boolean; canCancel: boolean; canReschedule: boolean; assignedTaskCount?: number;
};
