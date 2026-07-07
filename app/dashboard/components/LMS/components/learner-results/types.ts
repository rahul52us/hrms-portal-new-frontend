import { ScormAnswerSectionRecord } from "@/app/dashboard/course/scorm/quizReviewTypes";

export type LearnerResultsFilters = {
  companyId: string;
  departmentId: string;
  courseId: string;
  batchId: string;
  userId: string;
  search: string;
  completionStatus: string;
  courseStatus: string;
  scoreMin: string;
  scoreMax: string;
  passFail: string;
  from: string;
  to: string;
  activityStatus: string;
};

export type LearnerResultOption = {
  value: string;
  label: string;
};

export type LearnerResultRow = {
  _id: string;
  enrollmentId: string;
  learner: {
    _id: string;
    name: string;
    email: string;
    mobileNumber: string;
    department: string;
    isActive: boolean;
  };
  company: {
    _id: string;
    name: string;
  };
  course: {
    _id: string;
    title: string;
    status: string;
    totalSections: number;
  };
  batches: Array<{ _id: string; name: string }>;
  progressPercent: number;
  status: string;
  lessonStatus: string;
  completedSections: number;
  totalSections: number;
  timeSpent: string;
  attempts: number;
  answerCount: number;
  score: number | null;
  passThreshold: number | null;
  passStatus: string;
  lastActivity?: string | null;
  submissionDate?: string | null;
  completionDate?: string | null;
  quizAttempts: number;
  scormAttempts: number;
  manualQuizResults: Array<{
    _id: string;
    quizId: string;
    title: string;
    type: "Module Quiz" | "Course Quiz";
    moduleTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    attemptNumber: number;
    submittedAt?: string | null;
  }>;
};

export type LearnerResultsResponse = {
  scope?: Record<string, any>;
  summary: {
    totalResults: number;
    completed: number;
    pending: number;
    averageProgress: number | null;
    averageScore: number | null;
    passed: number;
    failed: number;
    recentSubmissions?: LearnerResultRow[];
    lowScoreLearners?: LearnerResultRow[];
    recentlyCompleted?: LearnerResultRow[];
  };
  filterOptions: {
    companies?: LearnerResultOption[];
    departments?: LearnerResultOption[];
    courses?: LearnerResultOption[];
    batches?: LearnerResultOption[];
    users?: LearnerResultOption[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  results: LearnerResultRow[];
};

export type LearnerResultDetail = LearnerResultRow & {
  modules?: Array<{
    moduleId: string;
    title: string;
    progress: number;
    score: number | null;
    lessonStatus: string;
    totalTime: string;
    sectionsCompleted: number;
    sectionCount: number;
    sections: Array<{
      sectionId: string;
      title: string;
      progress: number;
      score: number | null;
      lessonStatus: string;
      totalTime: string;
      completedAt?: string | null;
    }>;
  }>;
  answerSections?: ScormAnswerSectionRecord[];
};

export const EMPTY_LEARNER_RESULTS_FILTERS: LearnerResultsFilters = {
  companyId: "",
  departmentId: "",
  courseId: "",
  batchId: "",
  userId: "",
  search: "",
  completionStatus: "",
  courseStatus: "",
  scoreMin: "",
  scoreMax: "",
  passFail: "",
  from: "",
  to: "",
  activityStatus: "",
};
