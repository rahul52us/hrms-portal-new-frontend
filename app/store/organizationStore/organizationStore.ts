import axios from "axios";
import { makeAutoObservable, runInAction } from "mobx";

export interface OrganizationPersonReference {
  _id: string;
  name: string;
  username?: string;
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
  name: string;
  username: string;
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
  totalReportCount: number | null;
  depth: number;
  isManager: boolean;
  isUnassigned: boolean;
  isContextOnly: boolean;
  hasHierarchyIssue: boolean;
}

export interface OrganizationPageInfo {
  limit: number;
  hasNextPage: boolean;
  nextCursor: string;
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
  rootPageInfo: OrganizationPageInfo;
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

export type OrganizationListView = "search" | "managers" | "unassigned";

export type OrganizationFilters = {
  search?: string;
  department?: string;
  team?: string;
  locationId?: string;
};

export interface OrganizationListPage {
  nodes: OrganizationNode[];
  pageInfo: OrganizationPageInfo;
}

export interface OrganizationPersonData {
  node: OrganizationNode;
  directReports: OrganizationNode[];
  directReportsPageInfo: OrganizationPageInfo;
}

const emptyPageInfo = (): OrganizationPageInfo => ({
  limit: 50,
  hasNextPage: false,
  nextCursor: "",
});

const emptyListPage = (): OrganizationListPage => ({
  nodes: [],
  pageInfo: emptyPageInfo(),
});

const emptyData = (): OrganizationData => ({
  company: null,
  scope: null,
  nodes: [],
  roots: [],
  rootPageInfo: emptyPageInfo(),
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
});

function mergeNodes(existing: OrganizationNode[], incoming: OrganizationNode[]) {
  const nodeById = new Map(existing.map((node) => [node._id, node]));

  incoming.forEach((node) => {
    const current = nodeById.get(node._id);
    nodeById.set(node._id, {
      ...current,
      ...node,
      directReportIds:
        node.directReportIds?.length > 0
          ? node.directReportIds
          : current?.directReportIds || [],
    });
  });

  return Array.from(nodeById.values());
}

class OrganizationStore {
  data: OrganizationData = emptyData();
  isLoading = false;
  isLoadingRoots = false;
  error: string | null = null;
  activeCompanyId = "";
  childrenPageInfo: Record<string, OrganizationPageInfo> = {};
  loadingChildrenIds: string[] = [];
  listPages: Record<OrganizationListView, OrganizationListPage> = {
    search: emptyListPage(),
    managers: emptyListPage(),
    unassigned: emptyListPage(),
  };
  listLoading: Record<OrganizationListView, boolean> = {
    search: false,
    managers: false,
    unassigned: false,
  };
  listErrors: Record<OrganizationListView, string | null> = {
    search: null,
    managers: null,
    unassigned: null,
  };
  private listRequestSequence: Record<OrganizationListView, number> = {
    search: 0,
    managers: 0,
    unassigned: 0,
  };

  constructor() {
    makeAutoObservable(this);
  }

  clear = () => {
    this.data = emptyData();
    this.error = null;
    this.activeCompanyId = "";
    this.childrenPageInfo = {};
    this.loadingChildrenIds = [];
    this.listPages = {
      search: emptyListPage(),
      managers: emptyListPage(),
      unassigned: emptyListPage(),
    };
    this.listErrors = { search: null, managers: null, unassigned: null };
  };

  fetchOrganization = async (companyId?: string) => {
    const selectedCompanyId = String(companyId || "").trim();

    if (!selectedCompanyId) {
      runInAction(() => this.clear());
      return null;
    }

    runInAction(() => {
      this.isLoading = true;
      this.error = null;
      if (this.activeCompanyId !== selectedCompanyId) {
        this.data = emptyData();
      }
      this.activeCompanyId = selectedCompanyId;
    });

    try {
      const response = await axios.get("/admin/organization", {
        params: { companyId: selectedCompanyId, limit: 50 },
      });
      const nextData = response?.data?.data || emptyData();

      runInAction(() => {
        if (this.activeCompanyId !== selectedCompanyId) {
          return;
        }
        this.data = {
          ...emptyData(),
          ...nextData,
          rootPageInfo: nextData.rootPageInfo || emptyPageInfo(),
        };
        this.childrenPageInfo = {};
        this.loadingChildrenIds = [];
        this.listPages = {
          search: emptyListPage(),
          managers: emptyListPage(),
          unassigned: emptyListPage(),
        };
      });

      return nextData as OrganizationData;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load organization data";

      runInAction(() => {
        this.error = message;
        this.data = emptyData();
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  loadMoreRoots = async () => {
    const companyId = this.activeCompanyId;
    const pageInfo = this.data.rootPageInfo;
    if (!companyId || this.isLoadingRoots || !pageInfo.hasNextPage) {
      return;
    }

    runInAction(() => {
      this.isLoadingRoots = true;
    });
    try {
      const response = await axios.get("/admin/organization/roots", {
        params: {
          companyId,
          cursor: pageInfo.nextCursor,
          limit: pageInfo.limit,
        },
      });
      const next = response?.data?.data;
      runInAction(() => {
        if (!next || this.activeCompanyId !== companyId) {
          return;
        }
        this.data = {
          ...this.data,
          nodes: mergeNodes(this.data.nodes, next.nodes || []),
          roots: Array.from(new Set([...this.data.roots, ...(next.roots || [])])),
          rootPageInfo: next.pageInfo || emptyPageInfo(),
        };
      });
    } finally {
      runInAction(() => {
        this.isLoadingRoots = false;
      });
    }
  };

  fetchChildren = async (managerId: string, append = false) => {
    const companyId = this.activeCompanyId;
    const normalizedManagerId = String(managerId || "").trim();
    if (!companyId || !normalizedManagerId || this.loadingChildrenIds.includes(normalizedManagerId)) {
      return;
    }

    const currentPage = this.childrenPageInfo[normalizedManagerId];
    if (append && currentPage && !currentPage.hasNextPage) {
      return;
    }

    runInAction(() => {
      this.loadingChildrenIds = [...this.loadingChildrenIds, normalizedManagerId];
    });
    try {
      const response = await axios.get("/admin/organization/children", {
        params: {
          companyId,
          managerId: normalizedManagerId,
          cursor: append ? currentPage?.nextCursor || "" : "",
          limit: currentPage?.limit || 50,
        },
      });
      const next = response?.data?.data;

      runInAction(() => {
        if (!next || this.activeCompanyId !== companyId) {
          return;
        }
        const parent = this.data.nodes.find((node) => node._id === normalizedManagerId);
        const childNodes = (next.nodes || []).map((node: OrganizationNode) => ({
          ...node,
          depth: (parent?.depth || 0) + 1,
        }));
        const existingChildIds = append ? parent?.directReportIds || [] : [];
        const childIds = Array.from(
          new Set([...existingChildIds, ...childNodes.map((node: OrganizationNode) => node._id)])
        );
        const nodes = mergeNodes(this.data.nodes, childNodes).map((node) =>
          node._id === normalizedManagerId ? { ...node, directReportIds: childIds } : node
        );

        this.data = { ...this.data, nodes };
        this.childrenPageInfo = {
          ...this.childrenPageInfo,
          [normalizedManagerId]: next.pageInfo || emptyPageInfo(),
        };
      });
    } finally {
      runInAction(() => {
        this.loadingChildrenIds = this.loadingChildrenIds.filter(
          (id) => id !== normalizedManagerId
        );
      });
    }
  };

  fetchList = async (
    view: OrganizationListView,
    filters: OrganizationFilters = {},
    append = false
  ) => {
    const companyId = this.activeCompanyId;
    if (!companyId) {
      return null;
    }

    const currentPage = this.listPages[view];
    if (append && !currentPage.pageInfo.hasNextPage) {
      return currentPage;
    }
    const requestId = this.listRequestSequence[view] + 1;
    this.listRequestSequence[view] = requestId;

    runInAction(() => {
      this.listLoading[view] = true;
      this.listErrors[view] = null;
      if (!append) {
        this.listPages[view] = emptyListPage();
      }
    });

    try {
      const response = await axios.get("/admin/organization/list", {
        params: {
          companyId,
          view,
          search: filters.search || "",
          department: filters.department || "",
          team: filters.team || "",
          locationId: filters.locationId || "",
          cursor: append ? currentPage.pageInfo.nextCursor : "",
          limit: currentPage.pageInfo.limit || 50,
        },
      });
      const next = response?.data?.data;

      runInAction(() => {
        if (
          !next ||
          this.activeCompanyId !== companyId ||
          this.listRequestSequence[view] !== requestId
        ) {
          return;
        }
        this.listPages[view] = {
          nodes: append
            ? mergeNodes(currentPage.nodes, next.nodes || [])
            : next.nodes || [],
          pageInfo: next.pageInfo || emptyPageInfo(),
        };
      });
      return next as OrganizationListPage;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load organization list";
      runInAction(() => {
        if (this.listRequestSequence[view] === requestId) {
          this.listErrors[view] = message;
        }
      });
      throw error;
    } finally {
      runInAction(() => {
        if (this.listRequestSequence[view] === requestId) {
          this.listLoading[view] = false;
        }
      });
    }
  };

  fetchPerson = async (userId: string) => {
    const companyId = this.activeCompanyId;
    const normalizedUserId = String(userId || "").trim();
    if (!companyId || !normalizedUserId) {
      return null;
    }

    const response = await axios.get(`/admin/organization/person/${normalizedUserId}`, {
      params: { companyId },
    });
    return response?.data?.data as OrganizationPersonData;
  };

  fetchDirectReportsPage = async (
    managerId: string,
    cursor = "",
    limit = 20
  ): Promise<OrganizationListPage | null> => {
    const companyId = this.activeCompanyId;
    const normalizedManagerId = String(managerId || "").trim();
    if (!companyId || !normalizedManagerId) {
      return null;
    }

    const response = await axios.get("/admin/organization/children", {
      params: { companyId, managerId: normalizedManagerId, cursor, limit },
    });
    const data = response?.data?.data;
    return data
      ? {
          nodes: data.nodes || [],
          pageInfo: data.pageInfo || emptyPageInfo(),
        }
      : null;
  };
}

export const organizationStore = new OrganizationStore();
