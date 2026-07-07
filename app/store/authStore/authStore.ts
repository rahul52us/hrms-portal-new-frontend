// stores/authStore.ts
import { makeAutoObservable } from "mobx";
import axios from "axios";
import { AUTH_TOKEN, BACKEND_URL, ENCRYPT_SECRET_KEY, USER_SESSION_DATA } from "../../config/utils/variables";
import stores from "../stores";
import CryptoJS from "crypto-js";
import { hasPermission as checkUserPermission } from "../../config/utils/permissions";

interface Notification {
  title?: any;
  message: string;
  type?: any;
  placement?: string;
  action?: any;
  duration?:number
}

export interface LearnerRegistrationPayload {
  name: string;
  phone: string;
  email?: string;
  verificationToken: string;
  invitationToken?: string;
  courseId?: string;
  location?: RegistrationLocationPayload;
}

export interface AdminRegistrationPayload {
  name: string;
  phone: string;
  email?: string;
  verificationToken: string;
  companyName: string;
  companyEmail?: string;
  location?: RegistrationLocationPayload;
}

export interface RegistrationLocationPayload {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  formattedAddress?: string;
  placeId?: string;
  lat?: number | null;
  lng?: number | null;
}

export interface GlobalLoginPayload {
  phone: string;
  otp: string;
  token?: string;
}

export interface OtpRequestPayload {
  phone: string;
  purpose: "login" | "register";
}

export interface OtpVerifyPayload {
  phone: string;
  otp: string;
  purpose: "login" | "register";
  token?: string;
}

class AuthStore {
  user: any = null;
  userType : any = null
  token: string | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  notification: Notification | null = null;
  company: any = undefined
  memberships: any[] = [];
  activeMembership: any = null;
  sessionReady = false;

  constructor() {
    makeAutoObservable(this);
    axios.defaults.baseURL = BACKEND_URL
    axios.defaults.timeout = 0;

    // Attach token automatically for all requests
    axios.interceptors.request.use(
      (config) => {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem(AUTH_TOKEN);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          this.logout(); // Logout on 401
        }
        return Promise.reject(error);
      }
    );

    if (typeof window !== "undefined") {
      this.initializeUser().catch(() => undefined);
    }
  }

  changePassword = async (sendData: any) => {
    try {
      const { data } = await axios.post("/auth/change-password", {...sendData,company : stores.auth.company});
      return data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    }
  };


  // Initialize User Session
  initializeUser = async () => {
    if (typeof window === "undefined") {
      return;
    }

    this.isLoading = true;
    try {
      const savedToken = localStorage.getItem(AUTH_TOKEN);
      if (savedToken) {
        this.token = savedToken;
        await this.fetchUser();
      }
    } finally {
      this.isLoading = false;
      this.sessionReady = true;
    }
  };

   forgotPasswordStore = async (value: any) => {
    try {
      const { data } = await axios.post("/auth/forgot-password", value);
      return data.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err?.message);
    }
  };

  openNotification = (data: {
    title: any;
    message: string;
    type?: string;
    placement?: string;
    action?: any;
    duration?:number
  }) => {
    this.notification = {
      title: data.title,
      message: data.message,
      type: data.type ? data.type : "success",
      placement: data.placement ? data.placement : "bottom",
      action: data.action ? data.action : null,
    };
  };

  closeNotication = () => {
    this.notification = null;
  };

  requestOtp = async (payload: OtpRequestPayload) => {
    try {
      const response = await axios.post("/auth/otp/request", payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    }
  };

  verifyOtp = async (payload: OtpVerifyPayload) => {
    try {
      const response = await axios.post("/auth/otp/verify", payload);
      return response?.data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    }
  };

  registerLearner = async (payload: LearnerRegistrationPayload) => {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await axios.post("/auth/register/learner", payload);
      const responseToken =
        response?.data?.data?.authorization_token ||
        response?.data?.data?.accessToken ||
        response?.data?.data?.token ||
        response?.data?.accessToken ||
        response?.data?.token ||
        null;

      if (responseToken) {
        this.token = responseToken;
        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_TOKEN, responseToken);
        }
        await this.fetchUser();
      }

      return response?.data;
    } catch (err: any) {
      this.error = err?.response?.data?.message || err?.response?.data?.error || "Registration failed.";
      return Promise.reject(err?.response?.data || err);
    } finally {
      this.isLoading = false;
    }
  };

  registerAdmin = async (payload: AdminRegistrationPayload) => {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await axios.post("/auth/register/admin", payload);
      const responseToken =
        response?.data?.data?.authorization_token ||
        response?.data?.data?.accessToken ||
        response?.data?.data?.token ||
        response?.data?.accessToken ||
        response?.data?.token ||
        null;

      if (responseToken) {
        this.token = responseToken;
        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_TOKEN, responseToken);
        }
        await this.fetchUser();
      }

      return response?.data;
    } catch (err: any) {
      this.error = err?.response?.data?.message || err?.response?.data?.error || "Registration failed.";
      return Promise.reject(err?.response?.data || err);
    } finally {
      this.isLoading = false;
    }
  };

  restoreUser = () => {
    try {
      const authorization_token = AUTH_TOKEN;
      if (authorization_token) {
        const storedData = sessionStorage.getItem(
          USER_SESSION_DATA!
        );
        if (storedData) {
          return this.getUserFromSessionStorage()
        } else {
          this.doLogout();
          return false;
        }
      } else {
        this.doLogout();
        return false;
      }
    } catch ({}) {
      this.user = null;
      this.doLogout();
    }
  };

  doLogout = () => {
    this.user = null;
    this.clearLocalStorage();
  };

  clearLocalStorage = () => {
    localStorage.removeItem(
      AUTH_TOKEN as string
    );
    sessionStorage.removeItem(USER_SESSION_DATA!);
  };
  // Login user
  login = async (payload: GlobalLoginPayload) => {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await axios.post("/auth/otp/verify", {
        ...payload,
        purpose: "login",
      });
      this.token =
        response?.data?.data?.authorization_token ||
        response?.data?.data?.accessToken ||
        response?.data?.data?.token ||
        response?.data?.accessToken ||
        response?.data?.token ||
        null;

      if (this.token && typeof window !== "undefined") {
        localStorage.setItem(AUTH_TOKEN, this.token);
      }

      await this.fetchUser();
      this.sessionReady = true;
      return response?.data
    } catch (err: any) {
      this.error = err?.response?.data?.message || "Login failed.";
      return Promise.reject(err?.response?.data || err);
    } finally {
      this.isLoading = false;
    }
  };


  uploadFile = async (sendData: any) => {
    try {
      const { data } = await axios.post("/file/upload", {...sendData,company : stores.auth.company});
      return data;
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    }
  };

  saveUserToSessionStorage(user: any) {
    if (typeof window !== "undefined" && user) {
      const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(user),
        ENCRYPT_SECRET_KEY
      ).toString();
      sessionStorage.setItem(USER_SESSION_DATA, encryptedData);
    }
  }

  // Fetch User Info
  fetchUser = async () => {
    if (!this.token) return;

    try {
      const response = await axios.post(
        "/auth/me",
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      const responseData = response?.data?.data || {};
      const memberships = Array.isArray(responseData?.memberships) ? responseData.memberships : [];
      const activeMembership = responseData?.activeMembership || null;
      const activeCompany = responseData?.activeCompany || activeMembership?.company || null;
      const resolvedUserType =
        responseData?.effectiveRole ||
        activeMembership?.role ||
        responseData?.userType ||
        responseData?.role ||
        "user";

      const { memberships: _m, activeMembership: _am, activeCompany: _ac, effectiveRole: _er, ...identity } = responseData;

      this.user = {
        ...identity,
        company: activeCompany?._id || activeMembership?.companyId || identity?.company,
        companyDetails: activeCompany || identity?.companyDetails,
        userType: resolvedUserType,
      };
      this.memberships = memberships;
      this.activeMembership = activeMembership;
      this.company = this.user.company;
      this.userType = resolvedUserType
      this.saveUserToSessionStorage(this.user);

      // If there's a company field
      // this.company = this.user?.company;
    } catch (err: any) {
      this.error = err?.response?.data?.message || "Failed to fetch user info.";
    }
  };

  getUserFromSessionStorage() {
    if (typeof window === "undefined") return false;

    const storedData = sessionStorage.getItem(USER_SESSION_DATA);
    if (!storedData) return false;

    try {
      const decryptedBytes = CryptoJS.AES.decrypt(storedData, ENCRYPT_SECRET_KEY);
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
      return decryptedData ? JSON.parse(decryptedData) : false;
    } catch ({}) {
      return false;
    }
  }

  getCompanyUsers = async (sendData : any = {}) => {
    try {
      const { data } = await axios.post(`auth/get/users`,{},{params : {...sendData}});
      return data.data?.map((item : any) => ({user : {...item}})) || [];
    } catch (err: any) {
      return Promise.reject(err?.response?.data || err);
    }
  };

  hasPermission = (permissionKey: string) => {
    return checkUserPermission(this.user, permissionKey);
  };

  // Logout user
  logout = () => {
    this.token = null;
    this.user = null;
    this.userType = null;
    this.company = undefined;
    this.memberships = [];
    this.activeMembership = null;
    this.error = null;
    this.sessionReady = true;

    if (typeof window !== "undefined") {
      this.clearLocalStorage();
    }
  };
}

export const authStore = new AuthStore();
