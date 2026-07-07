import axios from "axios";
import { makeAutoObservable, runInAction } from "mobx";
import { ScormAnswerSectionRecord } from "@/app/dashboard/course/scorm/quizReviewTypes";

export interface ManagedLearnerSummary {
  _id: string;
  name: string;
  email?: string;
  username?: string;
  role?: string;
  department?: string;
  overallProgress: number;
  avgScore: number | null;
  courseCount: number;
  completedCourses: number;
}

export interface LearnerCourseSectionProgress {
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

export interface LearnerCourseModuleProgress {
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
  sections: LearnerCourseSectionProgress[];
}

export interface LearnerCourseProgress {
  courseId: string;
  title: string;
  thumbnailUrl?: string;
  progress: number;
  score: number | null;
  attempts: number;
  lessonStatus: string;
  totalTime: string;
  lastAccessed?: string | null;
  status: string;
  validTill?: string | null;
  visibilityStatus?: string;
  answerSummary?: {
    total: number;
    pending: number;
    reviewed: number;
  };
  modules: LearnerCourseModuleProgress[];
}

export interface LearnerProgressDetail {
  learner: {
    _id: string;
    name: string;
    email?: string;
    username?: string;
    role?: string;
    department?: string;
  };
  summary: {
    overallProgress: number;
    avgScore: number | null;
    courseCount: number;
  };
  courses: LearnerCourseProgress[];
}

class ManagerStore {
  learners: ManagedLearnerSummary[] = [];
  learnerProgress: LearnerProgressDetail | null = null;
  learnerAnswers: ScormAnswerSectionRecord[] = [];
  myCourseAnswers: ScormAnswerSectionRecord[] = [];
  isLearnersLoading = false;
  isLearnerProgressLoading = false;
  isLearnerAnswersLoading = false;
  isMyCourseAnswersLoading = false;
  isSubmittingReview = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  fetchManagedLearners = async () => {
    this.isLearnersLoading = true;
    this.error = null;
    try {
      const { data } = await axios.get("/manager/learners");
      runInAction(() => {
        this.learners = data.data || [];
      });
      return data.data || [];
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || err?.response?.data?.error || "Failed to fetch learners";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isLearnersLoading = false;
      });
    }
  };

  fetchLearnerProgress = async (learnerId: string) => {
    this.isLearnerProgressLoading = true;
    this.error = null;
    try {
      const { data } = await axios.get("/manager/learner-progress", {
        params: { learnerId },
      });
      runInAction(() => {
        this.learnerProgress = data.data || null;
      });
      return data.data || null;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || err?.response?.data?.error || "Failed to fetch learner progress";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isLearnerProgressLoading = false;
      });
    }
  };

  fetchLearnerAnswers = async (learnerId: string, courseId?: string) => {
    this.isLearnerAnswersLoading = true;
    this.error = null;
    try {
      const { data } = await axios.get("/manager/learner-answers", {
        params: {
          learnerId,
          ...(courseId ? { courseId } : {}),
        },
      });
      runInAction(() => {
        this.learnerAnswers = data.data || [];
      });
      return data.data || [];
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || err?.response?.data?.error || "Failed to fetch learner answers";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isLearnerAnswersLoading = false;
      });
    }
  };

  reviewAnswer = async (payload: {
    trackingId: string;
    interactionId: string;
    marks: number;
  }) => {
    this.isSubmittingReview = true;
    this.error = null;
    try {
      const { data } = await axios.post("/manager/review-answer", payload);

      runInAction(() => {
        const updatedTrackingRecord = data.data as ScormAnswerSectionRecord;
        this.learnerAnswers = this.learnerAnswers.map((entry) =>
          entry._id === updatedTrackingRecord?._id ? updatedTrackingRecord : entry
        );
        this.myCourseAnswers = this.myCourseAnswers.map((entry) =>
          entry._id === updatedTrackingRecord?._id ? updatedTrackingRecord : entry
        );
      });

      return data.data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || err?.response?.data?.error || "Failed to review answer";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isSubmittingReview = false;
      });
    }
  };

  fetchMyCourseAnswers = async (courseId: string) => {
    this.isMyCourseAnswersLoading = true;
    this.error = null;
    try {
      const { data } = await axios.get("/scorm/answers", {
        params: { courseId },
      });
      runInAction(() => {
        this.myCourseAnswers = data.data || [];
      });
      return data.data || [];
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || err?.response?.data?.error || "Failed to fetch quiz answers";
      });
      return Promise.reject(err?.response?.data || err);
    } finally {
      runInAction(() => {
        this.isMyCourseAnswersLoading = false;
      });
    }
  };

  clearLearnerState = () => {
    this.learnerProgress = null;
    this.learnerAnswers = [];
  };

  clearMyCourseAnswers = () => {
    this.myCourseAnswers = [];
  };
}

export const managerStore = new ManagerStore();
