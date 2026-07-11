import { makeAutoObservable } from "mobx";
import axios from "axios";
import { authStore } from "../authStore/authStore";

const COMPANY_CONTEXT_KEY = "hrms:selected-company-context";

class CompanyStores {
  fetchCompanies(params: any = {}) {
    return this.getManagedCompanies(params);
  }
  companies: any = {
    loading: false,
    data: [],
  }
  companyDetails: any = {}
  selectedCompanyId: string = "";
  userSettings: any = {};
  userPreferences: any = {};
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);

    if (typeof window !== "undefined") {
      this.selectedCompanyId = localStorage.getItem(COMPANY_CONTEXT_KEY) || "";
    }
  }

  setSelectedCompanyId = (companyId: string) => {
    this.selectedCompanyId = companyId;

    if (typeof window !== "undefined") {
      if (companyId) {
        localStorage.setItem(COMPANY_CONTEXT_KEY, companyId);
      } else {
        localStorage.removeItem(COMPANY_CONTEXT_KEY);
      }
    }
  };

  getActiveCompanyId = () => {
    const role = String(authStore.userType || authStore.user?.role || "").toLowerCase();
    if (role === "superadmin") {
      return this.selectedCompanyId || this.companies.data?.[0]?._id || "";
    }

    return authStore.company || "";
  };

  initializeCompanyContext = () => {
    const role = String(authStore.userType || authStore.user?.role || "").toLowerCase();

    if (role !== "superadmin") {
      this.setSelectedCompanyId(authStore.company || "");
      return;
    }

    const availableCompanies = this.companies.data || [];
    const hasSelectedCompany = availableCompanies.some(
      (company: any) => company?._id === this.selectedCompanyId
    );

    if (this.selectedCompanyId && hasSelectedCompany) {
      return;
    }

    const fallbackCompanyId = availableCompanies?.[0]?._id || authStore.company || "";
    if (fallbackCompanyId) {
      this.setSelectedCompanyId(fallbackCompanyId);
      return;
    }

    if (this.selectedCompanyId) {
      this.setSelectedCompanyId("");
    }
  };

  fetchCompanyDetails = async () => {
    this.isLoading = true;
    try {
      const response = await axios.get("/user/settings");
      this.userSettings = response.data?.settings || {};
    } catch (err: any) {
      this.error = err?.response?.data?.message || "Failed to fetch settings.";
      throw err;
    } finally {
      this.isLoading = false;
    }
  };

  updateCompanyDetails = async (payload: any) => {
    this.isLoading = true;
    try {
      const response = await axios.post("/company/update", {
        ...payload,
        company: authStore.company
      });
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.isLoading = false;
    }
  };
  updateCompanyPreferences = async (payload: any) => {
    this.isLoading = true;
    try {
      const response = await axios.post("/company/updateOperatingHours", {
        ...payload,
        company: authStore.company
      });
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.isLoading = false;
    }
  };

  createCompany = async (payload: any) => {
    this.isLoading = true;
    try {
      const response = await axios.post("/company/manage", payload);
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.isLoading = false;
    }
  };

  updateManagedCompany = async (companyId: string, payload: any) => {
    this.isLoading = true;
    try {
      const response = await axios.put(`/company/${companyId}`, payload);
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.isLoading = false;
    }
  };

  deleteManagedCompany = async (companyId: string) => {
    this.isLoading = true;
    try {
      const response = await axios.delete(`/company/${companyId}`);
      this.companies.data = (this.companies.data || []).filter(
        (company: any) => company?._id !== companyId
      );

      if (this.selectedCompanyId === companyId) {
        this.setSelectedCompanyId("");
      }

      this.initializeCompanyContext();
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.isLoading = false;
    }
  };

  updateManagedCompanyStatus = async (
    companyId: string,
    isActive: boolean,
    scope: "company_admin" | "all_users" = "company_admin"
  ) => {
    this.isLoading = true;
    try {
      const response = await axios.put(`/company/${companyId}/status`, {
        isActive,
        scope,
      });
      this.companies.data = (this.companies.data || []).map((company: any) =>
        company?._id === companyId
          ? {
              ...company,
              ...(response.data?.data?.company || response.data?.data || {}),
            }
          : company
      );
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.isLoading = false;
    }
  };

  getManagedCompanies = async (params: any = {}) => {
    this.companies.loading = true;
    try {
      const response = await axios.get("/company/manage", { params });
      this.companies.data = response.data?.data || [];
      this.initializeCompanyContext();
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.companies.loading = false;
    }
  };

  getPageContent = (name : string) => {
    if(Object.keys(this.companyDetails || {}).length){
      const dt = this.companyDetails.details?.filter((it : any) => it.name === name)
      if(dt?.length > 0){
        return dt[0]?.fields || {}
      }
      else {
        return {}
      }
    }
  }

  getCompanyDetails = async () => {
    this.isLoading = true;
    try {
      const response = await axios.get(`/company/${authStore.company}`);
      this.companyDetails = response.data?.data
      return response;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err.message);
    } finally {
      this.isLoading = false;
    }
  };

}

export const CompanyStore = new CompanyStores();
