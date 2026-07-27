import axios from "axios";
import { makeAutoObservable, runInAction } from "mobx";

export interface OrganizationPersonReference {
  _id: string;
  name: string;
  email?: string;
  role: string;
  designation?: string;
  department?: string;
  level?: number;
}

export interface OrganizationLocation {
  _id: string;
  name: string;
  code?: string;
  city?: string;
  state?: string;
}

export interface OrganizationNode {
  _id: string;
  code: string;
  profileId: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  department: string;
  team: string;
  officeLocation: OrganizationLocation | null;
  pic: { url?: string } | null;
  status: "active" | "pending" | "inactive";
  isActive: boolean;
  isEnabled: boolean;
  reportingManagerId: string;
  reportingManager: OrganizationPersonReference | null;
  managerChain: OrganizationPersonReference[];
  directReportIds: string[];
  directReportCount: number;
  totalReportCount: number;
  depth: number;
  isManager: boolean;
  isUnassigned: boolean;
  isContextOnly: boolean;
  hasHierarchyIssue: boolean;
}

export interface OrganizationData {
  company: {
    _id: string;
    name: string;
  } | null;
  scope: {
    mode: "company" | "hr-scope" | "department";
    role: string;
    departments: string[];
    teams: string[];
    officeLocationIds: string[];
  } | null;
  nodes: OrganizationNode[];
  roots: string[];
  summary: {
    totalPeople: number;
    managerCount: number;
    unassignedCount: number;
    contextPeopleCount: number;
    maxDepth: number;
    hierarchyIssueCount: number;
  };
  filters: {
    departments: string[];
    teams: string[];
    locations: OrganizationLocation[];
  };
}

const emptyData: OrganizationData = {
  company: null,
  scope: null,
  nodes: [],
  roots: [],
  summary: {
    totalPeople: 0,
    managerCount: 0,
    unassignedCount: 0,
    contextPeopleCount: 0,
    maxDepth: 0,
    hierarchyIssueCount: 0,
  },
  filters: {
    departments: [],
    teams: [],
    locations: [],
  },
};

class OrganizationStore {
  data: OrganizationData = emptyData;
  isLoading = false;
  error: string | null = null;
  activeCompanyId = "";

  constructor() {
    makeAutoObservable(this);
  }

  clear = () => {
    this.data = emptyData;
    this.error = null;
    this.activeCompanyId = "";
  };

  fetchOrganization = async (companyId?: string) => {
    const selectedCompanyId = String(companyId || "").trim();

    if (!selectedCompanyId) {
      runInAction(() => {
        this.clear();
      });
      return null;
    }

    runInAction(() => {
      this.isLoading = true;
      this.error = null;
      if (this.activeCompanyId !== selectedCompanyId) {
        this.data = emptyData;
      }
      this.activeCompanyId = selectedCompanyId;
    });

    try {
      const response = await axios.get("/admin/organization", {
        params: { companyId: selectedCompanyId },
      });
      const nextData = response?.data?.data || emptyData;

      runInAction(() => {
        this.data = nextData;
      });

      return nextData;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load organization data";

      runInAction(() => {
        this.error = message;
        this.data = emptyData;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };
}

export const organizationStore = new OrganizationStore();

