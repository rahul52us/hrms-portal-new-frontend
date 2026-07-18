import axios from "axios";
import { makeAutoObservable, runInAction } from "mobx";

export interface OfficeLocationItem {
  _id: string;
  company?: string;
  name: string;
  code: string;
  address?: string;
  city: string;
  state?: string;
  country?: string;
  pinCode?: string;
  is_active?: boolean;
}

class LocationStore {
  locations: OfficeLocationItem[] = [];
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  pagination: { page: number; limit: number; total: number; totalPages?: number } | null = null;
  activeCompanyId = "";

  constructor() {
    makeAutoObservable(this);
  }

  clearLocations = () => {
    this.locations = [];
    this.pagination = null;
    this.activeCompanyId = "";
  };

  fetchLocations = async (companyId?: string, page = 1, limit = 20, search = "") => {
    const selectedCompanyId = String(companyId || "").trim();

    if (!selectedCompanyId) {
      runInAction(() => {
        this.clearLocations();
        this.isLoading = false;
      });
      return;
    }

    runInAction(() => {
      this.error = null;
      this.isLoading = true;

      if (this.activeCompanyId !== selectedCompanyId) {
        this.locations = [];
        this.pagination = null;
      }

      this.activeCompanyId = selectedCompanyId;
    });

    try {
      const { data } = await axios.get("/locations/list", {
        params: {
          companyId: selectedCompanyId,
          page,
          limit,
          search,
        },
      });

      runInAction(() => {
        this.locations = data.data || [];
        this.pagination = data.pagination || {
          page,
          limit,
          total: Array.isArray(data.data) ? data.data.length : 0,
          totalPages: 1,
        };
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || err?.response?.data?.error || "Failed to fetch locations";
        this.locations = [];
        this.pagination = null;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  createLocation = async (payload: {
    companyId?: string;
    name: string;
    code: string;
    address?: string;
    city: string;
    state?: string;
    country?: string;
    pinCode?: string;
    is_active?: boolean;
  }) => {
    this.isSubmitting = true;
    this.error = null;

    try {
      const { data } = await axios.post("/locations/create", payload);
      return data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || err?.response?.data?.error || "Create failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };

  updateLocation = async (id: string, payload: Partial<OfficeLocationItem>) => {
    this.isSubmitting = true;
    this.error = null;

    try {
      const { data } = await axios.put(`/locations/update/${id}`, payload);

      runInAction(() => {
        this.locations = this.locations.map((location) =>
          location._id === id ? data.data : location
        );
      });

      return data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || err?.response?.data?.error || "Update failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };

  deleteLocation = async (id: string) => {
    this.isSubmitting = true;
    this.error = null;

    try {
      await axios.delete(`/locations/delete/${id}`);

      runInAction(() => {
        this.locations = this.locations.filter((location) => location._id !== id);
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err?.response?.data?.message || err?.response?.data?.error || "Delete failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };
}

export const locationStore = new LocationStore();
