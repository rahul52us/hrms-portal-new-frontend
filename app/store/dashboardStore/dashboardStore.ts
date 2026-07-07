import { makeAutoObservable } from "mobx";
import axios from "axios";
import { authStore } from "../authStore/authStore";
import { ScopedDashboardSummary } from "@/app/dashboard/components/LMS/components/scoped-dashboard/types";
import {
  LearnerResultDetail,
  LearnerResultsResponse,
} from "@/app/dashboard/components/LMS/components/learner-results/types";

class DashboardStore {
  scopedSummary: ScopedDashboardSummary | any = null;
  scopedSummaryLoading = false;
  scopedSummaryError: string | null = null;
  learnerResults: LearnerResultsResponse | null = null;
  learnerResultsLoading = false;
  learnerResultsError: string | null = null;
  learnerResultDetail: LearnerResultDetail | null = null;
  learnerResultDetailLoading = false;

  count : any = {
    data: {},
    loading: false,
  };

  workflowUserCount: any = {
    data: {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    },
    loading: false,
  };

  workflowAdminSummary: any = {
    data: {
      total: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
    },
    loading: false,
  };

  workflowAdminLevelCount: any = {
    data: [],
    loading: false,
  };

  masterData : any = {
    data: {},
    loading: false,
  };

  patientCount : any = {
    data : {
      appointments : 0,
      orders : 0
    },
    loading : false
  }


  notification : any = {
    data : [],
    loading : false,
    totalPages : 0
  }

  constructor() {
    makeAutoObservable(this);
  }

  fetchScopedSummary = async (params: Record<string, string> = {}) => {
    this.scopedSummaryLoading = true;
    this.scopedSummaryError = null;
    try {
      const { data } = await axios.get(`/dashboard/summary`, { params });
      this.scopedSummary = data?.data || null;
      return this.scopedSummary;
    } catch (err: any) {
      this.scopedSummaryError =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load dashboard summary";
      return Promise.reject(err?.response?.data || err);
    } finally {
      this.scopedSummaryLoading = false;
    }
  };

  fetchLearnerResults = async (params: Record<string, string> = {}) => {
    this.learnerResultsLoading = true;
    this.learnerResultsError = null;
    try {
      const { data } = await axios.get("/dashboard/learner-results", { params });
      this.learnerResults = data?.data || null;
      return this.learnerResults;
    } catch (err: any) {
      this.learnerResultsError =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load learner results";
      return Promise.reject(err?.response?.data || err);
    } finally {
      this.learnerResultsLoading = false;
    }
  };

  fetchLearnerResultDetail = async (enrollmentId: string) => {
    this.learnerResultDetailLoading = true;
    try {
      const { data } = await axios.get(`/dashboard/learner-results/${enrollmentId}`);
      this.learnerResultDetail = data?.data || null;
      return this.learnerResultDetail;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    } finally {
      this.learnerResultDetailLoading = false;
    }
  };

  clearLearnerResultDetail = () => {
    this.learnerResultDetail = null;
  };

  getNotifications = async (type?: string | boolean, page: number = 1, limit: number = 10) => {
    this.notification.loading = true;
    try {
      const params: Record<string, any> = {
        page,
        limit,
      };

      if (type !== undefined && type !== "All") {
        params.read = type;
      }

      const { data } = await axios.get("/notification", { params });

      this.notification.data = data?.data || [];
      this.notification.totalPages = data?.totalPages || 0;

      return data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    } finally {
      this.notification.loading = false;
    }
  };


  markAsReadNotifications = async (id : any) => {
    try {
      const { data } = await axios.put(`/notification`, {_id : id});
      return data.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    } finally {
    }
  };

  getDashboardCount = async () => {
    this.count.loading = true;
    try {
      const { data } = await axios.get(`/dashboard/counts`);

      this.count.data = data?.data || {};
      return data.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    } finally {
      this.count.loading = false;
    }
  };

  getWorkflowUserCount = async (workflowId: string) => {
    this.workflowUserCount.loading = true;
    try {
      const { data } = await axios.get(`/dashboard/user-count`, {
        params: { workflowId },
      });

      this.workflowUserCount.data = data?.data || {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
      };

      return data?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    } finally {
      this.workflowUserCount.loading = false;
    }
  };

  getWorkflowAdminSummary = async (workflowId: string) => {
    this.workflowAdminSummary.loading = true;
    try {
      const { data } = await axios.get(`/dashboard/admin-summary`, {
        params: { workflowId },
      });

      this.workflowAdminSummary.data = data?.data || {
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
      };

      return data?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    } finally {
      this.workflowAdminSummary.loading = false;
    }
  };

  getWorkflowAdminLevelCount = async (workflowId: string) => {
    this.workflowAdminLevelCount.loading = true;
    try {
      const { data } = await axios.get(`/dashboard/admin-level-count`, {
        params: { workflowId },
      });

      this.workflowAdminLevelCount.data = data?.data || [];
      return data?.data || [];
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    } finally {
      this.workflowAdminLevelCount.loading = false;
    }
  };

  getMasterData = async () => {
    this.masterData.loading = true;
    try {
      const { data } = await axios.post(`/masters`,{company : authStore.company});
      this.masterData.data = data?.data?.masters || [];
      return data.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    } finally {
      this.masterData.loading = false;
    }
  };

  createOrUpdateMasterData = async (sendData : any) => {
    try {
      const { data } = await axios.put(`/masters`, {...sendData,company : authStore.company});
      return data.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    } finally {
    }
  };

  getMasterOptions = (category: string): any=> {
  const masters = this.masterData.data || [];
  const cat = masters.find((c: any) => c.category === category);

  if (!cat) return [];
  return cat.options.map((o: any) => ({
    label: o.optionName || o.label,
    value: o.code || o.value,
  }));
};


// patient counts

getPatientDashboardCount = async(sendData : any = {}) => {
  try {
      const { data } = await axios.post(`/dashboard/getPatientDashboardCount`, {...sendData,company : authStore.company});
      const results = data?.data || {}
      this.patientCount.data = {...results}
      return data.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    } finally {
    }
}
}

export const dashboardStore = new DashboardStore();
