import { Task } from "./onboardingApi";
export type OnboardingTask = Omit<Task, "_id"> & {
  _id: string; status: "blocked" | "pending" | "pending_review" | "completed" | "waived"; dueDate: string; dueAt: string;
  assignees: { user: string; name: string }[]; ownerIssue: string; completionNote: string; overdue: boolean;
  documents: { document: string; name: string; type: string; size: number; uploadedBy: string; uploadedAt: string }[];
  canComplete: boolean; canUpload: boolean; canRemoveDocument: boolean; canReview: boolean; canWaive: boolean; canReopen: boolean; canReassign: boolean;
};
export type EmployeeOnboarding = {
  _id: string; employee: { _id: string; name: string; code: string; joiningDate?: string }; templateName: string; templateDescription: string;
  templateVersion: string; versionNumber: number; joiningDate: string; timezone: string; joiningDateChanged: boolean;
  status: "active" | "completed" | "cancelled"; revision: number; tasks: OnboardingTask[]; createdAt: string;
  progress: { total: number; done: number; required: number; requiredDone: number; blocked: number; overdue: number };
  canManage: boolean; canCancel: boolean; canReschedule: boolean; assignedTaskCount?: number;
};
