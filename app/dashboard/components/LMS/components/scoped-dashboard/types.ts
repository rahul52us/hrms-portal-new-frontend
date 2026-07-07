export type DashboardChartEntry = {
  label: string;
  value: number;
  users?: number;
  completionRate?: number;
};

export type DashboardOption = {
  value: string;
  label: string;
};

export type ScopedDashboardFilters = {
  from: string;
  to: string;
  departmentId: string;
  role: string;
  userId: string;
  courseId: string;
  batchStatus: string;
  completionStatus: string;
  activityStatus: string;
};

export type ScopedDashboardSummary = {
  role: "admin" | "departmenthead";
  scope: {
    companyId?: string | null;
    companyName?: string | null;
    departmentId?: string | null;
    departmentName?: string | null;
  };
  appliedFilters?: Partial<ScopedDashboardFilters>;
  filterOptions?: {
    departments?: DashboardOption[];
    roles?: DashboardOption[];
    users?: DashboardOption[];
    courses?: DashboardOption[];
  };
  stats?: Record<string, number | null | undefined>;
  charts?: Record<string, DashboardChartEntry[] | undefined>;
  highlights?: Record<string, any[] | undefined>;
  availability?: Record<string, boolean | undefined>;
};

export const EMPTY_SCOPED_FILTERS: ScopedDashboardFilters = {
  from: "",
  to: "",
  departmentId: "",
  role: "",
  userId: "",
  courseId: "",
  batchStatus: "",
  completionStatus: "",
  activityStatus: "",
};
