import axios from "axios";
import { makeAutoObservable, runInAction } from "mobx";

const COURSE_ASSET_CHUNK_SIZE_BYTES = 3.5 * 1024 * 1024;
const COURSE_UPLOAD_PROGRESS_MAX = 82;

export interface CourseVisibilityConfig {
  type: "private" | "public";
}

export interface CourseAssessmentConfig {
  totalMarks: number | null;
  passingMarks: number | null;
}

export interface CourseAssessmentCriteriaInput {
  passingMarks: number | null;
}

export interface CourseAssessmentSummary extends CourseAssessmentConfig {
  earnedMarks: number | null;
  scorePercentage: number | null;
  outcome: "passed" | "failed" | "pending" | "not_configured";
}

export interface CourseCertificateSummary {
  enabled: boolean;
  status: "disabled" | "not_eligible" | "eligible" | "issued";
  canIssue: boolean;
  reason: string;
  certificateNo?: string;
  issuedAt?: string | null;
  downloadUrl?: string;
  templateId?: string;
  templateName?: string;
}

export interface CourseMetrics {
  averageRating: number | null;
  popularityScore: number;
  totalEnrollments: number;
}

export interface CourseInstructor {
  name?: string;
  designation?: string;
  companyName?: string;
  avatarUrl?: string;
}

export interface CourseHighlights {
  learningOutcomes?: string[];
}

export interface CourseListItem {
  _id: string;
  courseCode?: string;
  title: string;
  slug: string;
  thumbnailUrl?: string;
  scormFilePath?: string;
  status: string;
  highlights?: CourseHighlights;
  instructor?: CourseInstructor;
  taxonomy?: {
    categories?: string[];
    languages?: string[];
    level?: string;
  };
  progression?: {
    completionWindowDays?: number | null;
    dripEnabled?: boolean;
    certificateEnabled?: boolean;
    certificateTemplateId?: string | null;
    mandatoryModules?: boolean;
  };
  curriculum: {
    totalModules: number;
    totalSections: number;
  };
  commerce: {
    pricingModel: string;
    amountInRupees: number | null;
    currency?: string;
    accessDurationDays?: number | null;
  };
  company?: {
    _id?: string;
    company_name?: string;
    companyCode?: string;
  } | string | null;
  visibility?: CourseVisibilityConfig;
  assessment?: CourseAssessmentConfig;
  metrics?: CourseMetrics;
  price?: number;
  courseType?: "standard" | "scorm";
  enrollmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseAccessScopeSummary {
  _id: string;
  accessLevel: "company" | "department" | "user";
  allowFurtherAssignment: boolean;
  label: string;
  validityStatus?: "active" | "expired" | "expiring_soon";
  validFrom?: string | null;
  validTill?: string | null;
  grantedBy?: {
    _id?: string;
    name?: string;
    email?: string;
    username?: string;
    role?: string;
  } | null;
  company?: {
    _id?: string;
    company_name?: string;
  } | null;
  department?: {
    _id?: string;
    title?: string;
    code?: string;
  } | null;
  grantedAt?: string;
}

export interface AccessibleCourseItem extends CourseListItem {
  description?: {
    text?: string;
    html?: string;
  };
  taxonomy?: {
    categories?: string[];
    languages?: string[];
    level?: string;
  };
  access: {
    canAssign: boolean;
    matchedScopes: CourseAccessScopeSummary[];
  };
  enrollment?: {
    _id: string;
    status: "not_started" | "in_progress" | "completed";
    dueDate?: string | null;
    assignedAt?: string;
    assignedBy?: {
      _id?: string;
      name?: string;
      email?: string;
      username?: string;
      role?: string;
    } | null;
  } | null;
}

export interface AssignedCourseAccessItem {
  _id: string;
  courseId: string;
  courseName: string;
  assignedTo: string;
  assignmentType: "company" | "department" | "user";
  validFrom?: string | null;
  validTill?: string | null;
  status: "active" | "expired" | "expiring_soon";
  allowFurtherAssignment: boolean;
  assignedBy?: {
    _id?: string;
    name?: string;
    email?: string;
    username?: string;
    role?: string;
  } | null;
  company?: {
    _id?: string;
    company_name?: string;
  } | null;
  department?: {
    _id?: string;
    title?: string;
    code?: string;
  } | null;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    username?: string;
    department?: string;
  } | null;
}

export interface MyCourseSourceItem {
  type: "direct" | "batch" | "self";
  batchId?: string | null;
  batchName?: string | null;
  label: string;
  validFrom?: string | null;
  validTill?: string | null;
  dueDate?: string | null;
  assignedAt?: string | null;
  isExpired?: boolean;
  status?: "active" | "expired" | "expiring_soon";
}

export interface MyCourseItem {
  _id?: string;
  courseId: string;
  title: string;
  description?: {
    text?: string;
    html?: string;
  };
  thumbnailUrl?: string;
  curriculum?: {
    totalModules?: number;
    totalSections?: number;
  };
  commerce?: {
    pricingModel?: string;
    amountInRupees?: number | null;
  };
  progress: number;
  sources: MyCourseSourceItem[];
  status: "not_started" | "in_progress" | "completed";
  validTill?: string | null;
  isExpired: boolean;
  visibilityStatus: "active" | "expired" | "expiring_soon";
  taxonomy?: {
    categories?: string[];
    languages?: string[];
    level?: string;
  };
  highlights?: CourseHighlights;
  instructor?: CourseInstructor;
  progression?: {
    completionWindowDays?: number | null;
    dripEnabled?: boolean;
    certificateEnabled?: boolean;
    certificateTemplateId?: string | null;
    mandatoryModules?: boolean;
  };
  visibility?: CourseVisibilityConfig;
  assessment?: CourseAssessmentConfig;
  assessmentSummary?: CourseAssessmentSummary;
  certificate?: CourseCertificateSummary;
}

export interface MyCourseSectionProgressItem {
  sectionId: string;
  title: string;
  progress: number;
  score: number | null;
  attempts: number;
  lessonStatus: string;
  totalTime: string;
  lastAccessed?: string | null;
  contentType?: "scorm" | "video" | "document" | "other";
  completedAt?: string | null;
  currentTime?: number;
  duration?: number;
}

export interface MyCourseModuleProgressItem {
  moduleId: string;
  title: string;
  progress: number;
  score: number | null;
  attempts: number;
  lessonStatus: string;
  totalTime: string;
  lastAccessed?: string | null;
  sectionsCompleted: number;
  sectionCount: number;
  sections: MyCourseSectionProgressItem[];
}

export interface MyCourseDetailItem extends CourseListItem {
  courseId?: string;
  description?: {
    text?: string;
    html?: string;
  };
  taxonomy?: {
    categories?: string[];
    languages?: string[];
    level?: string;
  };
  progression?: {
    completionWindowDays?: number | null;
    dripEnabled?: boolean;
    certificateEnabled?: boolean;
    certificateTemplateId?: string | null;
    mandatoryModules?: boolean;
  };
  highlights?: CourseHighlights;
  instructor?: CourseInstructor;
  sources: MyCourseSourceItem[];
  progress: number;
  validTill?: string | null;
  isExpired: boolean;
  visibilityStatus: "active" | "expired" | "expiring_soon";
  assessmentSummary?: CourseAssessmentSummary;
  certificate?: CourseCertificateSummary;
  progressModules?: MyCourseModuleProgressItem[];
}

export interface PublicCourseItem extends CourseListItem {
  description?: {
    text?: string;
    html?: string;
  };
}

export interface CourseAssignmentAuditItem {
  _id: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    username?: string;
    department?: string;
  } | null;
  course?: {
    _id?: string;
    title?: string;
    status?: string;
  } | null;
  source: "direct" | "batch";
  batchId?: string | null;
  batchName?: string | null;
  assignedBy?: {
    _id?: string;
    name?: string;
    email?: string;
    username?: string;
    role?: string;
  } | null;
  validTill?: string | null;
  isExpired: boolean;
  status: "active" | "expired" | "expiring_soon";
  courseStatus?: "not_started" | "in_progress" | "completed";
}

export interface CourseQuizOption {
  optionId: string;
  label: string;
  text: string;
}

export interface CourseQuizQuestion {
  questionId: string;
  sn: number;
  question: string;
  marks: number;
  options: CourseQuizOption[];
}

export interface CourseQuizAttemptAnswer {
  questionId: string;
  question: string;
  selectedOptionId: string;
  selectedOptionLabel: string;
  selectedAnswerText: string;
  correctOptionId: string;
  correctOptionLabel: string;
  correctAnswerText: string;
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks: number;
}

export interface CourseQuizAttempt {
  _id: string;
  quizId: string;
  quizTitle: string;
  scope: "module" | "final";
  moduleId: string;
  moduleTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  questionCount: number;
  attemptNumber: number;
  submittedAt?: string | null;
  answers: CourseQuizAttemptAnswer[];
}

export interface CourseQuizForLearner {
  quizId: string;
  title: string;
  scope: "module" | "final";
  moduleId: string;
  moduleTitle: string;
  questionCount: number;
  totalMarks: number;
  questions: CourseQuizQuestion[];
  attempt?: CourseQuizAttempt | null;
}

interface CreateCourseInput {
  payload: Record<string, unknown>;
  thumbnailFile?: File | null;
  scormFiles: File[];
  contentFiles: File[];
  studyMaterialFiles: File[];
}

interface ChunkedCourseUpload {
  uploadId: string;
  fileName: string;
  totalChunks: number;
  contentType: string;
  sizeInBytes: number;
}

type ChunkUploadFieldName = "scormChunkUploads" | "contentChunkUploads" | "studyMaterialChunkUploads";

type ChunkedCourseUploadMap = Record<ChunkUploadFieldName, ChunkedCourseUpload[]>;

const multipartRequestConfig = {
  headers: {
    "Content-Type": undefined,
  },
} as const;

function clampProgressValue(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function isCompletedLessonStatus(value: unknown) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return normalizedValue === "completed" || normalizedValue === "passed";
}

function deriveEnrollmentStatusFromLessonStatus(
  lessonStatus: unknown,
  progress: number
): MyCourseItem["status"] {
  const normalizedValue = String(lessonStatus || "").trim().toLowerCase();
  if (progress >= 100) {
    return "completed";
  }

  if (isCompletedLessonStatus(normalizedValue)) {
    return "completed";
  }

  if (progress > 0 || normalizedValue === "incomplete" || normalizedValue === "failed" || normalizedValue === "browsed") {
    return "in_progress";
  }

  return "not_started";
}

function deriveAggregateLessonStatus(statuses: unknown[]) {
  const normalizedStatuses = statuses
    .map((status) => String(status || "").trim().toLowerCase())
    .filter(Boolean);

  if (!normalizedStatuses.length) {
    return "not_attempted";
  }

  if (normalizedStatuses.every((status) => status === "completed" || status === "passed")) {
    return normalizedStatuses.some((status) => status === "passed") ? "passed" : "completed";
  }

  if (
    normalizedStatuses.every((status) => status === "completed" || status === "passed" || status === "failed") &&
    normalizedStatuses.some((status) => status === "failed")
  ) {
    return "failed";
  }

  if (normalizedStatuses.some((status) => status !== "not_attempted")) {
    return "incomplete";
  }

  return "not_attempted";
}

function averageNullableNumbers(values: Array<number | null | undefined>) {
  const finiteValues = values.filter((value): value is number => Number.isFinite(value));
  if (!finiteValues.length) {
    return null;
  }

  const total = finiteValues.reduce((sum, value) => sum + value, 0);
  return Math.round((total / finiteValues.length) * 100) / 100;
}

function parseScormDuration(value: string | null | undefined) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return 0;
  }

  const scorm12Match = normalizedValue.match(/^(\d{1,4}):([0-5]?\d):([0-5]?\d)(?:\.(\d{1,2}))?$/);
  if (scorm12Match) {
    const hours = Number(scorm12Match[1]);
    const minutes = Number(scorm12Match[2]);
    const seconds = Number(scorm12Match[3]);
    const centiseconds = Number((scorm12Match[4] || "").padEnd(2, "0").slice(0, 2) || "0");
    return ((((hours * 60) + minutes) * 60) + seconds) * 100 + centiseconds;
  }

  const scorm2004Match = normalizedValue.toUpperCase().match(
    /^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
  );
  if (!scorm2004Match) {
    return 0;
  }

  const hours = Number(scorm2004Match[1] || 0);
  const minutes = Number(scorm2004Match[2] || 0);
  const seconds = Number(scorm2004Match[3] || 0);
  return Math.round((((hours * 60) + minutes) * 60 + seconds) * 100);
}

function formatScormDuration(totalCentiseconds: number) {
  const safeValue = Math.max(0, Math.floor(totalCentiseconds || 0));
  const hours = Math.floor(safeValue / 360000);
  const remainderAfterHours = safeValue % 360000;
  const minutes = Math.floor(remainderAfterHours / 6000);
  const remainderAfterMinutes = remainderAfterHours % 6000;
  const seconds = Math.floor(remainderAfterMinutes / 100);
  const centiseconds = remainderAfterMinutes % 100;
  const baseValue = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return centiseconds > 0 ? `${baseValue}.${String(centiseconds).padStart(2, "0")}` : baseValue;
}

function normalizeDateValue(value: unknown) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue || null;
}

function recalculateModuleProgress(moduleRecord: MyCourseModuleProgressItem): MyCourseModuleProgressItem {
  const sections = Array.isArray(moduleRecord.sections) ? moduleRecord.sections : [];
  const completedCount = sections.filter((sectionRecord) => {
    return isCompletedLessonStatus(sectionRecord.lessonStatus) || Boolean(sectionRecord.completedAt) || Number(sectionRecord.progress || 0) >= 100;
  }).length;
  const latestAccessValue = sections.reduce((latest, sectionRecord) => {
    const currentValue = sectionRecord.lastAccessed ? new Date(sectionRecord.lastAccessed).getTime() : 0;
    return Math.max(latest, currentValue);
  }, 0);
  const averageProgress = sections.length
    ? Math.round(
        sections.reduce((total, sectionRecord) => total + clampProgressValue(sectionRecord.progress), 0) / sections.length
      )
    : 0;

  return {
    ...moduleRecord,
    progress: averageProgress,
    score: averageNullableNumbers(sections.map((sectionRecord) => sectionRecord.score)),
    attempts: sections.reduce((highest, sectionRecord) => Math.max(highest, Number(sectionRecord.attempts || 0)), 0),
    lessonStatus: deriveAggregateLessonStatus(sections.map((sectionRecord) => sectionRecord.lessonStatus)),
    totalTime: formatScormDuration(
      sections.reduce((total, sectionRecord) => total + parseScormDuration(sectionRecord.totalTime), 0)
    ),
    lastAccessed: latestAccessValue ? new Date(latestAccessValue).toISOString() : null,
    sectionsCompleted: completedCount,
    sectionCount: sections.length,
  };
}

function createClientUploadId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

class CourseStoreClass {
  courses: CourseListItem[] = [];
  publicCourses: PublicCourseItem[] = [];
  accessibleCourses: AccessibleCourseItem[] = [];
  assignedCourseAccesses: AssignedCourseAccessItem[] = [];
  myCourses: MyCourseItem[] = [];
  courseAssignmentAudit: CourseAssignmentAuditItem[] = [];
  currentCourse: MyCourseDetailItem | null = null;
  courseQuizzes: CourseQuizForLearner[] = [];
  isLoading: boolean = false;
  isPublicCoursesLoading: boolean = false;
  isAccessLoading: boolean = false;
  isAssignedCoursesLoading: boolean = false;
  isMyCoursesLoading: boolean = false;
  isMyCourseDetailLoading: boolean = false;
  isCourseQuizzesLoading: boolean = false;
  certificateDownloadCourseId: string | null = null;
  isQuizSubmitting: boolean = false;
  isCourseAssignmentAuditLoading: boolean = false;
  isSubmitting: boolean = false;
  isAccessSubmitting: boolean = false;
  enrollmentCourseId: string | null = null;
  isAssignmentSubmitting: boolean = false;
  submissionProgress: number = 0;
  submissionStage: string = "";
  submissionDetail: string = "";
  error: string | null = null;
  accessError: string | null = null;
  draftCourseCode: string = "";

  constructor() {
    makeAutoObservable(this);
  }

  fetchCourses = async (params: Record<string, unknown> = {}) => {
    this.isLoading = true;
    this.error = null;
    try {
      const { data } = await axios.get("/course", { params });
      runInAction(() => {
        this.courses = data.data || [];
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.error || "Failed to fetch courses";
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  fetchCourse = async (id: string) => {
    this.isLoading = true;
    this.error = null;
    try {
      const { data } = await axios.get(`/course/${id}`);
      runInAction(() => {
        this.currentCourse = data.data;
      });
      return data.data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.error || "Failed to fetch course";
      });
      return null;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  fetchAccessibleCourses = async () => {
    this.isAccessLoading = true;
    this.accessError = null;
    try {
      const { data } = await axios.get("/courses/accessible");
      runInAction(() => {
        this.accessibleCourses = data.data || [];
      });
      return data.data || [];
    } catch (err: any) {
      runInAction(() => {
        this.accessError = err?.response?.data?.message || err?.response?.data?.error || "Failed to fetch accessible courses";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isAccessLoading = false;
      });
    }
  };

  createCourseAccess = async (payload: {
    courseId: string;
    accessLevel: "company" | "department" | "user";
    companyId?: string;
    departmentId?: string;
    departmentName?: string;
    userIds?: string[];
    passingMarks?: number | null;
    allowFurtherAssignment?: boolean;
    assignToAllUsers?: boolean;
  }) => {
    this.isAccessSubmitting = true;
    this.accessError = null;
    try {
      const { data } = await axios.post("/course-access", payload);
      return data;
    } catch (err: any) {
      runInAction(() => {
        this.accessError = err?.response?.data?.message || err?.response?.data?.error || "Failed to create course access";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isAccessSubmitting = false;
      });
    }
  };

  assignCourse = async (payload: {
    courseId: string;
    assignmentType: "users" | "department";
    userIds?: string[];
    departmentId?: string;
    departmentName?: string;
    dueDate?: string | null;
  }) => {
    this.isAssignmentSubmitting = true;
    this.accessError = null;
    try {
      const { data } = await axios.post("/course-assign", payload);
      return data;
    } catch (err: any) {
      runInAction(() => {
        this.accessError = err?.response?.data?.message || err?.response?.data?.error || "Failed to assign course";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isAssignmentSubmitting = false;
      });
    }
  };

  assignCourseByCsv = async (payload: {
    courseId: string;
    file: File;
    dueDate?: string | null;
  }) => {
    this.isAssignmentSubmitting = true;
    this.accessError = null;
    try {
      const formData = new FormData();
      formData.append("courseId", payload.courseId);
      formData.append("assignmentType", "csv");
      formData.append("file", payload.file);

      if (payload.dueDate) {
        formData.append("dueDate", payload.dueDate);
      }

      const { data } = await axios.post("/course-assign", formData, multipartRequestConfig);
      return data;
    } catch (err: any) {
      runInAction(() => {
        this.accessError = err?.response?.data?.message || err?.response?.data?.error || "Failed to assign course by CSV";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isAssignmentSubmitting = false;
      });
    }
  };

  fetchAssignedCourseAccesses = async (params: {
    companyId?: string;
    courseId?: string;
    department?: string;
    userId?: string;
    assignmentType?: "company" | "department" | "user";
  } = {}) => {
    this.isAssignedCoursesLoading = true;
    this.accessError = null;
    try {
      const { data } = await axios.get("/courses/assigned", { params });
      runInAction(() => {
        this.assignedCourseAccesses = data.data || [];
      });
      return data.data || [];
    } catch (err: any) {
      runInAction(() => {
        this.accessError = err?.response?.data?.message || err?.response?.data?.error || "Failed to fetch assigned courses";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isAssignedCoursesLoading = false;
      });
    }
  };

  fetchMyCourses = async () => {
    this.isMyCoursesLoading = true;
    this.accessError = null;
    try {
      const { data } = await axios.get("/my-courses");
      runInAction(() => {
        this.myCourses = data.data || [];
      });
      return data.data || [];
    } catch (err: any) {
      runInAction(() => {
        this.accessError = err?.response?.data?.message || err?.response?.data?.error || "Failed to fetch my courses";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isMyCoursesLoading = false;
      });
    }
  };

  enrollInPublishedCourse = async (courseId: string) => {
    const normalizedCourseId = String(courseId || "").trim();
    if (!normalizedCourseId) {
      return Promise.reject({ message: "Course is required" });
    }

    this.enrollmentCourseId = normalizedCourseId;
    this.accessError = null;
    try {
      const { data } = await axios.post(`/courses/${normalizedCourseId}/enroll`);
      await Promise.all([
        this.fetchMyCourses(),
        this.fetchPublicCourses(),
      ]);
      return data;
    } catch (err: any) {
      runInAction(() => {
        this.accessError =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to enroll in this course";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.enrollmentCourseId = null;
      });
    }
  };

  fetchMyCourseDetail = async (courseId: string) => {
    this.isMyCourseDetailLoading = true;
    this.accessError = null;
    try {
      const { data } = await axios.get(`/my-courses/${courseId}`);
      runInAction(() => {
        this.currentCourse = data.data || null;
      });
      return data.data || null;
    } catch (err: any) {
      runInAction(() => {
        this.currentCourse = null;
        this.accessError = err?.response?.data?.message || err?.response?.data?.error || "Failed to fetch course details";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isMyCourseDetailLoading = false;
      });
    }
  };

  clearCurrentCourse = () => {
    this.currentCourse = null;
    this.courseQuizzes = [];
  };

  applyCertificateSnapshot = (courseId: string, certificate: CourseCertificateSummary) => {
    const normalizedCourseId = String(courseId || "").trim();
    if (!normalizedCourseId) {
      return;
    }

    this.myCourses = this.myCourses.map((course) =>
      String(course.courseId || "").trim() === normalizedCourseId
        ? {
            ...course,
            certificate,
          }
        : course
    );

    const currentCourseId = String(this.currentCourse?._id || this.currentCourse?.courseId || "").trim();
    if (this.currentCourse && currentCourseId === normalizedCourseId) {
      this.currentCourse = {
        ...this.currentCourse,
        certificate,
      };
    }
  };

  fetchMyCertificate = async (courseId: string) => {
    try {
      const { data } = await axios.get(`/certificates/my/${courseId}`);
      const certificate = data?.data || null;
      if (certificate) {
        runInAction(() => {
          this.applyCertificateSnapshot(courseId, certificate);
        });
      }
      return certificate;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    }
  };

  issueMyCertificate = async (courseId: string) => {
    try {
      const { data } = await axios.post(`/certificates/my/${courseId}/issue`);
      const certificate = data?.data || null;
      if (certificate) {
        runInAction(() => {
          this.applyCertificateSnapshot(courseId, certificate);
        });
      }
      return certificate;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    }
  };

  parseCertificateDownloadError = async (err: any) => {
    const responseData = err?.response?.data;
    if (responseData instanceof Blob) {
      const text = await responseData.text().catch(() => "");
      if (text) {
        try {
          const parsed = JSON.parse(text);
          return parsed?.message || parsed?.error || text;
        } catch {
          return text;
        }
      }
    }

    return responseData?.message || responseData?.error || err?.message || "Please try again.";
  };

  downloadMyCertificate = async (courseId: string) => {
    this.certificateDownloadCourseId = courseId;
    try {
      const response = await axios.get(`/certificates/my/${courseId}/download`, {
        responseType: "blob",
      });
      const disposition = response.headers?.["content-disposition"] || "";
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const fileName = match?.[1] || "certificate.pdf";
      const blob = new Blob([response.data], {
        type: response.data?.type || "application/pdf",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      await this.fetchMyCertificate(courseId).catch(() => undefined);
      return true;
    } catch (err: any) {
      return Promise.reject(new Error(await this.parseCertificateDownloadError(err)));
    } finally {
      runInAction(() => {
        this.certificateDownloadCourseId = null;
      });
    }
  };

  clearCourseQuizzes = () => {
    this.courseQuizzes = [];
  };

  previewQuizExcel = async (file: File) => {
    const formData = new FormData();
    formData.append("quizExcel", file);

    try {
      const { data } = await axios.post("/course/quiz/preview-excel", formData, multipartRequestConfig);
      return data.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    }
  };

  fetchCourseQuizzes = async (courseId: string) => {
    this.isCourseQuizzesLoading = true;
    try {
      const { data } = await axios.get(`/course/${courseId}/quizzes`);
      runInAction(() => {
        this.courseQuizzes = data.data || [];
      });
      return data.data || [];
    } catch (err: any) {
      runInAction(() => {
        this.courseQuizzes = [];
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isCourseQuizzesLoading = false;
      });
    }
  };

  submitCourseQuiz = async (
    courseId: string,
    quizId: string,
    answers: Array<{ questionId: string; selectedOptionId: string }>
  ) => {
    this.isQuizSubmitting = true;
    try {
      const { data } = await axios.post(`/course/${courseId}/quizzes/${quizId}/submit`, { answers });
      await this.fetchCourseQuizzes(courseId).catch(() => undefined);
      return data.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isQuizSubmitting = false;
      });
    }
  };

  applyRealtimeSectionProgressUpdate = (options: {
    courseId: string;
    moduleId: string;
    sectionId: string;
    data: any;
  }) => {
    const normalizedCourseId = String(options.courseId || "").trim();
    if (!normalizedCourseId) {
      return;
    }

    const sectionProgress = options.data?.sectionProgress || options.data || null;
    const courseProgress = options.data?.courseProgress || sectionProgress?.courseProgress || null;

    runInAction(() => {
      let derivedCourseProgress = courseProgress ? clampProgressValue(courseProgress.progress) : 0;
      let derivedCourseStatus = courseProgress
        ? deriveEnrollmentStatusFromLessonStatus(courseProgress.lessonStatus, derivedCourseProgress)
        : "not_started";

      const currentCourseId = String(this.currentCourse?._id || this.currentCourse?.courseId || "").trim();
      if (this.currentCourse && currentCourseId === normalizedCourseId && Array.isArray(this.currentCourse.progressModules)) {
        const nextModules = this.currentCourse.progressModules.map((moduleRecord) => {
          if (moduleRecord.moduleId !== options.moduleId) {
            return moduleRecord;
          }

          const nextSections = (moduleRecord.sections || []).map((sectionRecord) => {
            if (sectionRecord.sectionId !== options.sectionId) {
              return sectionRecord;
            }

            return {
              ...sectionRecord,
              progress: clampProgressValue(sectionProgress?.progress ?? sectionRecord.progress),
              score: sectionProgress?.score ?? sectionRecord.score ?? null,
              attempts: Number(sectionProgress?.attempts ?? sectionRecord.attempts ?? 0),
              lessonStatus: String(sectionProgress?.lessonStatus || sectionRecord.lessonStatus || "not_attempted"),
              totalTime: String(sectionProgress?.totalTime || sectionRecord.totalTime || "00:00:00"),
              lastAccessed: Object.prototype.hasOwnProperty.call(sectionProgress || {}, "lastAccessed")
                ? normalizeDateValue(sectionProgress?.lastAccessed)
                : sectionRecord.lastAccessed ?? null,
              contentType: sectionProgress?.contentType || sectionRecord.contentType || "other",
              completedAt: Object.prototype.hasOwnProperty.call(sectionProgress || {}, "completedAt")
                ? normalizeDateValue(sectionProgress?.completedAt)
                : sectionRecord.completedAt ?? null,
              currentTime: Number(sectionProgress?.currentTime ?? sectionRecord.currentTime ?? 0),
              duration: Number(sectionProgress?.duration ?? sectionRecord.duration ?? 0),
            };
          });

          return recalculateModuleProgress({
            ...moduleRecord,
            sections: nextSections,
          });
        });

        const allSections = nextModules.flatMap((moduleRecord) => moduleRecord.sections || []);

        if (!courseProgress) {
          derivedCourseProgress = allSections.length
            ? Math.round(
                allSections.reduce((total, sectionRecord) => total + clampProgressValue(sectionRecord.progress), 0) /
                  allSections.length
              )
            : 0;
          derivedCourseStatus = deriveEnrollmentStatusFromLessonStatus(
            deriveAggregateLessonStatus(nextModules.map((moduleRecord) => moduleRecord.lessonStatus)),
            derivedCourseProgress
          );
        }

        this.currentCourse = {
          ...this.currentCourse,
          progressModules: nextModules,
          progress: courseProgress ? clampProgressValue(courseProgress.progress) : derivedCourseProgress,
        };
      }

      this.myCourses = this.myCourses.map((courseRecord) => {
        if (courseRecord.courseId !== normalizedCourseId) {
          return courseRecord;
        }

        const nextProgress = courseProgress ? clampProgressValue(courseProgress.progress) : clampProgressValue(derivedCourseProgress);
        const nextStatus = courseProgress
          ? deriveEnrollmentStatusFromLessonStatus(courseProgress.lessonStatus, nextProgress)
          : derivedCourseStatus;

        return {
          ...courseRecord,
          progress: nextProgress,
          status: nextStatus,
        };
      });
    });
  };

  updateSectionProgress = async (payload: {
    courseId: string;
    moduleId: string;
    sectionId: string;
    status: "in_progress" | "completed";
    lessonLocation?: string;
    currentTime?: number;
    duration?: number;
    progress?: number;
    contentType?: string;
    startOver?: boolean;
  }) => {
    try {
      const { data } = await axios.post("/scorm/section-progress", payload);
      return data?.data || null;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    }
  };

  fetchPublicCourses = async (params: Record<string, unknown> = {}) => {
    this.isPublicCoursesLoading = true;
    this.error = null;
    try {
      const { data } = await axios.get("/course/public", { params });
      runInAction(() => {
        this.publicCourses = data.data || [];
      });
      return data.data || [];
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.error || "Failed to fetch public courses";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isPublicCoursesLoading = false;
      });
    }
  };

  fetchSectionProgress = async (params: {
    courseId: string;
    moduleId: string;
    sectionId: string;
  }) => {
    try {
      const { data } = await axios.get("/scorm/progress", { params });
      return data?.data || null;
    } catch (err: any) {
      return null;
    }
  };

  fetchCourseAssignmentAudit = async (params: {
    courseId?: string;
    userId?: string;
    companyId?: string;
  } = {}) => {
    this.isCourseAssignmentAuditLoading = true;
    this.accessError = null;
    try {
      const { data } = await axios.get("/course-assignments", { params });
      runInAction(() => {
        this.courseAssignmentAudit = data.data || [];
      });
      return data.data || [];
    } catch (err: any) {
      runInAction(() => {
        this.accessError = err?.response?.data?.message || err?.response?.data?.error || "Failed to fetch course assignment audit";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isCourseAssignmentAuditLoading = false;
      });
    }
  };

  assignCourseAccess = async (payload: {
    courseId: string;
    assignmentType: "company" | "department" | "users";
    companyId?: string;
    departmentId?: string;
    departmentName?: string;
    userIds?: string[];
    validFrom?: string | null;
    validTill?: string | null;
    allowFurtherAssignment?: boolean;
  }) => {
    this.isAssignmentSubmitting = true;
    this.accessError = null;
    try {
      const { data } = await axios.post("/course-assign", payload);
      return data;
    } catch (err: any) {
      runInAction(() => {
        this.accessError = err?.response?.data?.message || err?.response?.data?.error || "Failed to save course assignment";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isAssignmentSubmitting = false;
      });
    }
  };

  assignMultipleCourses = async (payload: {
    courseIds: string[];
    assignmentType: "company" | "department" | "users" | "csv";
    companyId?: string;
    departmentId?: string;
    departmentName?: string;
    userIds?: string[];
    validFrom?: string | null;
    validTill?: string | null;
    dueDate?: string | null;
    file?: File | null;
    assessmentCriteriaByCourse?: Record<string, CourseAssessmentCriteriaInput>;
    allowFurtherAssignment?: boolean;
  }) => {
    this.isAssignmentSubmitting = true;
    this.accessError = null;
    try {
      const hasFile = Boolean(payload.file);
      const body = hasFile ? new FormData() : ({} as any);

      const appendValue = (key: string, value: any) => {
        if (value === undefined || value === null || value === "") {
          return;
        }

        if (hasFile) {
          body.append(
            key,
            Array.isArray(value) || (typeof value === "object" && value !== null)
              ? JSON.stringify(value)
              : String(value)
          );
          return;
        }

        body[key] = value;
      };

      appendValue("courseIds", payload.courseIds);
      appendValue("assignmentType", payload.assignmentType);
      appendValue("companyId", payload.companyId);
      appendValue("departmentId", payload.departmentId);
      appendValue("departmentName", payload.departmentName);
      appendValue("userIds", payload.userIds || []);
      appendValue("validFrom", payload.validFrom);
      appendValue("validTill", payload.validTill);
      appendValue("dueDate", payload.dueDate);
      appendValue("assessmentCriteriaByCourse", payload.assessmentCriteriaByCourse);
      appendValue("allowFurtherAssignment", payload.allowFurtherAssignment);

      if (hasFile && payload.file) {
        body.append("file", payload.file);
      }

      const { data } = await axios.post(
        "/course-assign",
        body,
        hasFile ? multipartRequestConfig : undefined
      );
      return data;
    } catch (err: any) {
      runInAction(() => {
        this.accessError = err?.response?.data?.message || err?.response?.data?.error || "Failed to assign courses";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isAssignmentSubmitting = false;
      });
    }
  };

  resetSubmissionState = () => {
    this.submissionProgress = 0;
    this.submissionStage = "";
    this.submissionDetail = "";
  };

  private uploadCourseFilesInChunks = async (
    input: Pick<CreateCourseInput, "scormFiles" | "contentFiles" | "studyMaterialFiles">
  ) => {
    const uploadGroups: Array<{
      key: ChunkUploadFieldName;
      files: File[];
      stageLabel: string;
      assetLabel: string;
    }> = [
      {
        key: "scormChunkUploads",
        files: input.scormFiles,
        stageLabel: "Uploading SCORM files",
        assetLabel: "SCORM package",
      },
      {
        key: "contentChunkUploads",
        files: input.contentFiles,
        stageLabel: "Uploading lesson media",
        assetLabel: "lesson media",
      },
      {
        key: "studyMaterialChunkUploads",
        files: input.studyMaterialFiles,
        stageLabel: "Uploading study materials",
        assetLabel: "study material",
      },
    ];
    const uploads: ChunkedCourseUploadMap = {
      scormChunkUploads: [],
      contentChunkUploads: [],
      studyMaterialChunkUploads: [],
    };
    const totalBytes = uploadGroups.reduce(
      (sum, group) => sum + group.files.reduce((fileSum, file) => fileSum + file.size, 0),
      0
    );
    let uploadedBytes = 0;

    if (totalBytes === 0) {
      return uploads;
    }

    for (const group of uploadGroups) {
      for (const file of group.files) {
        const uploadId = createClientUploadId();
        const totalChunks = Math.max(1, Math.ceil(file.size / COURSE_ASSET_CHUNK_SIZE_BYTES));

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
          const start = chunkIndex * COURSE_ASSET_CHUNK_SIZE_BYTES;
          const end = Math.min(file.size, start + COURSE_ASSET_CHUNK_SIZE_BYTES);
          const chunk = file.slice(start, end);
          const chunkFormData = new FormData();

          chunkFormData.append("uploadId", uploadId);
          chunkFormData.append("chunkIndex", String(chunkIndex));
          chunkFormData.append("totalChunks", String(totalChunks));
          chunkFormData.append("fileName", file.name);
          chunkFormData.append("chunk", chunk, `${file.name}.part-${chunkIndex}`);

          await axios.post("/course/upload-chunk", chunkFormData, multipartRequestConfig);

          uploadedBytes += chunk.size;
          const uploadRatio = uploadedBytes / totalBytes;
          const progress = Math.min(
            COURSE_UPLOAD_PROGRESS_MAX,
            Math.max(8, Math.round(uploadRatio * COURSE_UPLOAD_PROGRESS_MAX))
          );

          runInAction(() => {
            this.submissionProgress = progress;
            this.submissionStage = group.stageLabel;
            this.submissionDetail = `${Math.round(uploadRatio * 100)}% complete. Uploading ${group.assetLabel}: ${file.name}`;
          });
        }

        uploads[group.key].push({
          uploadId,
          fileName: file.name,
          totalChunks,
          contentType: file.type || "application/octet-stream",
          sizeInBytes: file.size,
        });
      }
    }

    return uploads;
  };

  previewAssignmentUsers = async (payload: {
    file: File;
    companyId?: string;
  }) => {
    this.isAssignmentSubmitting = true;
    this.accessError = null;
    try {
      const formData = new FormData();
      formData.append("file", payload.file);
      if (payload.companyId) {
        formData.append("companyId", payload.companyId);
      }

      const { data } = await axios.post("/course-assign/preview", formData, multipartRequestConfig);
      return data;
    } catch (err: any) {
      runInAction(() => {
        this.accessError =
          err?.response?.data?.message || err?.response?.data?.error || "Failed to preview uploaded users";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isAssignmentSubmitting = false;
      });
    }
  };

  fetchNextCourseCode = async () => {
    try {
      const { data } = await axios.get("/course/next-course-code");
      runInAction(() => {
        this.draftCourseCode = data?.data?.courseCode || "";
      });
      return data?.data?.courseCode || "";
    } catch (err: any) {
      runInAction(() => {
        this.draftCourseCode = "";
      });
      return Promise.reject(err?.response?.data || err);
    }
  };

  createCourse = async (
    input: CreateCourseInput,
    options?: {
      action: "draft" | "publish";
      fileCount?: number;
    }
  ) => {
    this.isSubmitting = true;
    this.submissionProgress = 4;
    this.submissionStage = options?.action === "publish" ? "Publishing course" : "Saving draft";
    this.submissionDetail =
      (options?.fileCount || 0) > 0
        ? `Uploading ${options?.fileCount} file${options?.fileCount === 1 ? "" : "s"} and preparing your course assets.`
        : "Saving your course details.";
    this.error = null;

    let uploadCompleted = false;
    try {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(input.payload));
      const chunkUploads = await this.uploadCourseFilesInChunks(input);
      const hasChunkedUploads = Object.values(chunkUploads).some((uploads) => uploads.length > 0);

      if (input.thumbnailFile) {
        formData.append("thumbnail", input.thumbnailFile);
      }

      if (chunkUploads.scormChunkUploads.length > 0) {
        formData.append("scormChunkUploads", JSON.stringify(chunkUploads.scormChunkUploads));
      }

      if (chunkUploads.contentChunkUploads.length > 0) {
        formData.append("contentChunkUploads", JSON.stringify(chunkUploads.contentChunkUploads));
      }

      if (chunkUploads.studyMaterialChunkUploads.length > 0) {
        formData.append("studyMaterialChunkUploads", JSON.stringify(chunkUploads.studyMaterialChunkUploads));
      }

      if (hasChunkedUploads) {
        runInAction(() => {
          this.submissionProgress = 86;
          this.submissionStage = "Creating course";
          this.submissionDetail = "Finalizing uploaded assets, extracting SCORM packages, and saving the course.";
        });
      }

      const { data } = await axios.post("/course/create", formData, {
        ...multipartRequestConfig,
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) {
            runInAction(() => {
              this.submissionStage = hasChunkedUploads ? "Creating course" : "Uploading course files";
              this.submissionDetail = hasChunkedUploads
                ? "Finishing the course setup on the server..."
                : "Sending your course thumbnail and details to the server...";
            });
            return;
          }

          const ratio = progressEvent.loaded / progressEvent.total;
          const progressFloor = hasChunkedUploads ? 86 : 8;
          const progressCeiling = hasChunkedUploads ? 94 : 88;
          const progress = Math.min(
            progressCeiling,
            Math.max(progressFloor, Math.round(progressFloor + ratio * (progressCeiling - progressFloor)))
          );
          uploadCompleted = ratio >= 1;

          runInAction(() => {
            this.submissionProgress = progress;
            this.submissionStage = uploadCompleted ? "Processing course assets" : "Uploading files";
            this.submissionDetail = uploadCompleted
              ? "Saving uploaded assets and creating the course record..."
              : hasChunkedUploads
                ? "Sending the final course request..."
                : `Uploaded ${Math.round(ratio * 100)}% of your course files.`;
          });
        },
      });
      runInAction(() => {
        this.submissionProgress = 100;
        this.submissionStage = options?.action === "publish" ? "Course published" : "Draft saved";
        this.submissionDetail = "Everything is ready.";
        this.courses.unshift(data.data);
      });
      return data.data;
    } catch (err: any) {
      runInAction(() => {
        this.submissionStage = "Submission failed";
        this.submissionDetail = "We couldn't finish creating the course. Please try again.";
        this.error = err?.response?.data?.error || "Failed to create course";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };

  updateCourse = async (
    id: string,
    input: CreateCourseInput,
    options?: {
      action: "draft" | "publish";
      fileCount?: number;
    }
  ) => {
    this.isSubmitting = true;
    this.submissionProgress = 4;
    this.submissionStage = options?.action === "publish" ? "Publishing updates" : "Saving draft updates";
    this.submissionDetail =
      (options?.fileCount || 0) > 0
        ? `Uploading ${options?.fileCount} replacement file${options?.fileCount === 1 ? "" : "s"} and preparing course assets.`
        : "Saving updated course details.";
    this.error = null;

    let uploadCompleted = false;
    try {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(input.payload));
      const chunkUploads = await this.uploadCourseFilesInChunks(input);
      const hasChunkedUploads = Object.values(chunkUploads).some((uploads) => uploads.length > 0);

      if (input.thumbnailFile) {
        formData.append("thumbnail", input.thumbnailFile);
      }

      if (chunkUploads.scormChunkUploads.length > 0) {
        formData.append("scormChunkUploads", JSON.stringify(chunkUploads.scormChunkUploads));
      }

      if (chunkUploads.contentChunkUploads.length > 0) {
        formData.append("contentChunkUploads", JSON.stringify(chunkUploads.contentChunkUploads));
      }

      if (chunkUploads.studyMaterialChunkUploads.length > 0) {
        formData.append("studyMaterialChunkUploads", JSON.stringify(chunkUploads.studyMaterialChunkUploads));
      }

      if (hasChunkedUploads) {
        runInAction(() => {
          this.submissionProgress = 86;
          this.submissionStage = "Updating course";
          this.submissionDetail = "Finalizing uploaded assets, extracting SCORM packages, and saving the updates.";
        });
      }

      const { data } = await axios.put(`/course/${id}`, formData, {
        ...multipartRequestConfig,
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) {
            runInAction(() => {
              this.submissionStage = hasChunkedUploads ? "Updating course" : "Uploading course files";
              this.submissionDetail = hasChunkedUploads
                ? "Finishing the course update on the server..."
                : "Sending your updated course details to the server...";
            });
            return;
          }

          const ratio = progressEvent.loaded / progressEvent.total;
          const progressFloor = hasChunkedUploads ? 86 : 8;
          const progressCeiling = hasChunkedUploads ? 94 : 88;
          const progress = Math.min(
            progressCeiling,
            Math.max(progressFloor, Math.round(progressFloor + ratio * (progressCeiling - progressFloor)))
          );
          uploadCompleted = ratio >= 1;

          runInAction(() => {
            this.submissionProgress = progress;
            this.submissionStage = uploadCompleted ? "Processing course assets" : "Uploading files";
            this.submissionDetail = uploadCompleted
              ? "Saving uploaded assets and updating the course record..."
              : hasChunkedUploads
                ? "Sending the final course update..."
                : `Uploaded ${Math.round(ratio * 100)}% of your course files.`;
          });
        },
      });

      runInAction(() => {
        this.submissionProgress = 100;
        this.submissionStage = options?.action === "publish" ? "Course published" : "Draft updated";
        this.submissionDetail = "Everything is ready.";
        this.courses = this.courses.map((course) => (course._id === id ? data.data : course));
        this.currentCourse = data.data;
      });
      return data.data;
    } catch (err: any) {
      runInAction(() => {
        this.submissionStage = "Update failed";
        this.submissionDetail = "We couldn't finish updating the course. Please try again.";
        this.error = err?.response?.data?.error || "Failed to update course";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };

  deleteCourse = async (id: string) => {
    try {
      await axios.delete(`/course/${id}`);
      runInAction(() => {
        this.courses = this.courses.filter((c) => c._id !== id);
      });
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    }
  };
}

export const courseStore = new CourseStoreClass();
