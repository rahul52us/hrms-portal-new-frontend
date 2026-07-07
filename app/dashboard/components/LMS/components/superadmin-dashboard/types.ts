export type ChartEntry = {
  label: string;
  value: number;
};

export type FilterOption = {
  label: string;
  value: string;
};

export type DashboardFiltersValue = {
  from: string;
  to: string;
  companyId: string;
  role: string;
  courseId: string;
  batchStatus: string;
  activityStatus: string;
};

export type SuperadminDashboardSummary = {
  role: "superadmin";
  scope?: {
    companyId?: string | null;
    companyName?: string | null;
  };
  appliedFilters?: Partial<DashboardFiltersValue>;
  filterOptions?: {
    companies?: FilterOption[];
    roles?: FilterOption[];
    courses?: FilterOption[];
  };
  stats?: Record<string, number | null>;
  charts?: {
    usersByRole?: ChartEntry[];
    userActivity?: ChartEntry[];
    coursesByStatus?: ChartEntry[];
    batchesByStatus?: ChartEntry[];
    enrollmentsByStatus?: ChartEntry[];
    companyUserDistribution?: ChartEntry[];
    quizPerformance?: ChartEntry[];
    userGrowth?: ChartEntry[];
    completionTrend?: ChartEntry[];
  };
  highlights?: {
    topCourses?: Array<{
      _id: string;
      title: string;
      status: string;
      enrollmentCount: number;
    }>;
    recentUsers?: Array<{
      _id: string;
      name: string;
      email: string;
      role: string;
      companyName: string;
      isActive: boolean;
      createdAt?: string;
    }>;
    recentCompanies?: Array<{
      _id: string;
      name: string;
      email: string;
      isActive: boolean;
      createdAt?: string;
    }>;
    recentActivity?: Array<{
      id: string;
      type: string;
      title: string;
      detail: string;
      createdAt?: string;
    }>;
    lowEngagementUsers?: Array<{
      _id: string;
      name: string;
      email: string;
      companyName: string;
      lastActivity?: string | null;
    }>;
    lowEngagementCompanies?: Array<{
      companyId: string;
      name: string;
      learners: number;
      activeLearners: number;
      engagementRate: number;
    }>;
    expiringBatches?: Array<{
      _id: string;
      name: string;
      companyName: string;
      endDate?: string;
      userCount: number;
    }>;
    expiringEnrollments?: Array<{
      _id: string;
      courseTitle: string;
      validTill?: string;
    }>;
  };
  availability?: {
    learnerProgress?: boolean;
    quizPerformance?: boolean;
    pendingReviews?: boolean;
  };
};
