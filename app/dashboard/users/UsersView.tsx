"use client";

import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  VStack,
  useColorModeValue,
  useToast,
  SimpleGrid
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useDebounce from "../../component/config/component/customHooks/useDebounce";
import { getApiErrorMessage } from "../../config/utils/apiError";
import { readFileAsBase64 } from "../../config/utils/utils";
import stores from "../../store/stores";
import PermissionGate from "../../component/common/PermissionGate";
import ConfirmationModal from "../../component/common/ConfirmationModal/ConfirmationModal";
import { PERMISSION_KEYS, hasPermission } from "../../config/utils/permissions";
import BulkUploadResultModal from "./components/BulkUploadResultModal";
import BulkUploadModal from "./components/BulkUploadModal";
import UserDetailsModal from "./components/UserDetailsModal";
import UserDrawer from "./components/UserDrawer";
import UsersHeader from "./components/UsersHeader";
import UsersTable from "./components/UsersTable";
import ProfileDetailsDrawer from "./components/ProfileDetailsDrawer";
import { StatCard } from "../../component/common/StatCard/StatCard";
import { FiUsers, FiFilter } from "react-icons/fi";

type UsersViewProps = {
  scopedCompanyId?: string;
  embedded?: boolean;
};

type UserFormState = {
  id?: string;
  employeeNumber: string;
  profileId: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  sendInvite: boolean;
  pic: any;
  mobileNumber: string;
  department: string;
  team: string;
  officeLocationId: string;
  city: string;
  state: string;
  designation: string;
  joiningDate: string;
  dateOfBirth: string;
  gender: number | "";
  role: string;
  companyId: string;
  companyName: string;
  companyManagerLevels: number;
  createCompany: boolean;
  resendSetupEmail: boolean;
  hrScope: {
    departments: string[];
    teams: string[];
    officeLocationIds: string[];
  };
  reportingManager: any | null;
  changeReason: string;
  statutoryDetails: {
    aadharNumber?: string;
    panNumber?: string;
    nationality?: string;
  };
  skills: {
    coreDomainArea?: string;
    additionalDomainAreas?: string[];
    totalYearsOfExperience?: number;
  };
  familyContacts: any[];
  employeeDocuments: any[];
};

type BulkFormState = {
  companyId: string;
  companyName: string;
  companyManagerLevels: number;
  createCompany: boolean;
  uploadRole: string;
};

const normalizeRole = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^department[-\s]?head$/i, "departmenthead")
    .replace(/^head[-\s]?hr$/i, "hradmin")
    .replace(/^hr[-\s]?admin$/i, "hradmin")
    .replace(/^hr[-\s]?executive$/i, "hr")
    .replace(/^l\s*\d+\s*[-\s]?manager$/i, "user")
    .replace(/\s+/g, "-");
const normalizeEmail = (value: unknown) => String(value || "").trim().toLowerCase();

const getCompanyManagerLevels = (company: any) => Math.max(1, Number(company?.managerLevels) || 3);

const formatRoleLabel = (role: string) => {
  if (!role) {
    return "Role";
  }

  if (role === "user") {
    return "Employee";
  }

  if (role === "admin") {
    return "Admin";
  }

  if (role === "hradmin") {
    return "HR Admin";
  }

  if (role === "hr") {
    return "HR";
  }

  if (role === "departmenthead") {
    return "Department Head";
  }

  return role
    .split("-")
    .map((part) =>
      part.startsWith("l") && /\d+/.test(part.slice(1))
        ? part.toUpperCase()
        : `${part.charAt(0).toUpperCase()}${part.slice(1)}`
    )
    .join(" ");
};

const getBulkUploadRoleOptions = () => [
  {
    value: "user",
    label: "Employees",
    description: "Upload employees. Reporting manager can be set from the employee form.",
  },
];

const EMPLOYEE_ISSUE_FILTERS: Record<string, string> = {
  missing_department: "Employees without department",
  missing_manager: "Employees without reporting manager",
  missing_location: "Employees without office location",
  pending_setup: "Employees with password setup pending",
  incomplete_profiles: "Employees with incomplete profiles",
};

const optionFromManager = (manager: any) => {
  const email = manager?.email || manager?.username || manager?.managerEmail || "";
  if (!email && !manager?._id && !manager?.managerId) {
    return null;
  }

  const managerId =
    manager?._id ||
    manager?.managerId ||
    (manager?.manager?._id ? manager.manager._id : null);
  const status = manager?.status || (managerId ? "ASSIGNED" : "PENDING");

  return {
    label: `${manager?.name || email} (${email})`,
    value: managerId || `pending:${email}`,
    email,
    username: manager?.username || email,
    name: manager?.name || email,
    role: manager?.role,
    status,
  };
};

const getUserOfficeLocationId = (user: any) => {
  const location = user?.officeLocation;
  return String(
    user?.officeLocationId ||
      (location && typeof location === "object" ? location._id : location) ||
      ""
  );
};

const initialForm = (): UserFormState => ({
  employeeNumber: "",
  profileId: "",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  sendInvite: true,
  pic: { file: null, isAdd: 0, isDeleted: 0, url: "" },
  mobileNumber: "",
  department: "",
  team: "",
  officeLocationId: "",
  city: "",
  state: "",
  designation: "",
  joiningDate: "",
  dateOfBirth: "",
  gender: "",
  role: "user",
  companyId: "",
  companyName: "",
  companyManagerLevels: 3,
  createCompany: false,
  resendSetupEmail: true,
  hrScope: {
    departments: [],
    teams: [],
    officeLocationIds: [],
  },
  reportingManager: null,
  changeReason: "",
  statutoryDetails: {
    aadharNumber: "",
    panNumber: "",
    nationality: "",
  },
  skills: {
    coreDomainArea: "",
    additionalDomainAreas: [],
    totalYearsOfExperience: 0,
  },
  familyContacts: [],
  employeeDocuments: [],
});

const UsersView = observer(({ scopedCompanyId: scopedCompanyIdProp, embedded = false }: UsersViewProps) => {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userStore, companyStore, auth, locationStore, departmentStore } = stores;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [listTab, setListTab] = useState("user");
  const [locationFilter, setLocationFilter] = useState("");
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<any | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ user: any; nextIsEnabled: boolean } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<any | null>(null);
  const [uploadResults, setUploadResults] = useState<any | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [setupNotice, setSetupNotice] = useState<any | null>(null);
  const handledDeepLinkRef = useRef("");
  const [userForm, setUserForm] = useState<UserFormState>(initialForm());
  const [bulkForm, setBulkForm] = useState<BulkFormState>({
    companyId: "",
    companyName: "",
    companyManagerLevels: 3,
    createCompany: false,
    uploadRole: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const muted = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableHeadBg = useColorModeValue("gray.50", "gray.900");
  const role = normalizeRole(auth.userType || auth.user?.role);
  const canViewUsers = hasPermission(auth.user, PERMISSION_KEYS.VIEW_USERS);
  const canCreateUsers = hasPermission(auth.user, PERMISSION_KEYS.CREATE_USERS);
  const canCreateHrUsers = hasPermission(auth.user, PERMISSION_KEYS.CREATE_HR_USERS);
  const canCreateDepartmentHeads = hasPermission(auth.user, PERMISSION_KEYS.CREATE_DEPARTMENT_HEADS);
  const canEditUsers = hasPermission(auth.user, PERMISSION_KEYS.EDIT_USERS);
  const canAssignManagers = hasPermission(auth.user, PERMISSION_KEYS.ASSIGN_MANAGERS);
  const canDeleteUsers = canEditUsers;
  const canOpenCreate = canCreateUsers || canCreateHrUsers || canCreateDepartmentHeads;
  const canOpenBulk = canOpenCreate || canEditUsers;
  const requestedIssue = embedded
    ? ""
    : String(searchParams.get("issue") || "").trim().toLowerCase();
  const issueFilter = Object.prototype.hasOwnProperty.call(
    EMPLOYEE_ISSUE_FILTERS,
    requestedIssue
  )
    ? requestedIssue
    : "";
  const issueFilterLabel = issueFilter
    ? EMPLOYEE_ISSUE_FILTERS[issueFilter]
    : "";
  const showToast = useCallback(
    (options: any) =>
      toast({
        position: "top-right",
        isClosable: true,
        ...options,
      }),
    [toast]
  );
  const isSuperadmin = role === "superadmin";
  const isDepartmentHead = role === "departmenthead";
  const scopedCompanyId = scopedCompanyIdProp || companyStore.getActiveCompanyId();
  const managedCompanies = companyStore.companies.data || [];
  const currentCompanyName =
    auth.user?.companyDetails?.company_name ||
    managedCompanies.find((company: any) => company?._id === auth.company)?.company_name ||
    "Current company";
  const scopedCompany =
    isSuperadmin
      ? managedCompanies.find((company: any) => company?._id === scopedCompanyId) || null
      : auth.user?.companyDetails || managedCompanies.find((company: any) => company?._id === auth.company) || null;
  const isManagementBlocked = Boolean(scopedCompany && scopedCompany.is_active === false);
  const managementBlockedMessage = scopedCompany?.company_name
    ? `${scopedCompany.company_name} is inactive. New user creation, bulk uploads, and other management actions are unavailable until the company is reactivated.`
    : "This company is inactive. New user creation, bulk uploads, and other management actions are unavailable until the company is reactivated.";
  const currentCompanyManagerLevels = getCompanyManagerLevels(
    auth.user?.companyDetails ||
      managedCompanies.find((company: any) => company?._id === auth.company)
  );
  const currentCompanyDepartments =
    auth.user?.companyDetails?.departments ||
    managedCompanies.find((company: any) => company?._id === auth.company)?.departments ||
    [];
  const managerCompanyId = isSuperadmin ? userForm.companyId : auth.company;
  const selectedUserCompany = isSuperadmin
    ? managedCompanies.find((company: any) => company?._id === userForm.companyId)
    : auth.user?.companyDetails;
  const selectedUserCompanyCode = String(
    selectedUserCompany?.companyCode || scopedCompany?.companyCode || ""
  )
    .trim()
    .toUpperCase();
  const selectedBulkCompany = isSuperadmin
    ? managedCompanies.find((company: any) => company?._id === bulkForm.companyId)
    : auth.user?.companyDetails;
  const selectedUserManagerLevels = userForm.createCompany
    ? Math.max(1, Number(userForm.companyManagerLevels) || 3)
    : getCompanyManagerLevels(selectedUserCompany || { managerLevels: currentCompanyManagerLevels });
  const selectedBulkManagerLevels = bulkForm.createCompany
    ? Math.max(1, Number(bulkForm.companyManagerLevels) || 3)
    : getCompanyManagerLevels(selectedBulkCompany || { managerLevels: currentCompanyManagerLevels });
  const userDepartmentCompanyId = isSuperadmin ? userForm.companyId || scopedCompanyId : auth.company;
  const departmentRecords =
    departmentStore.activeCompanyId === (userDepartmentCompanyId || "")
      ? departmentStore.departments
      : [];
  const bulkUploadRoleOptions = useMemo(
    () => getBulkUploadRoleOptions(),
    []
  );

  const roleOptions = useMemo(() => {
    const baseRoles = [
      ...(canCreateUsers ? ["user"] : []),
      ...(canCreateHrUsers && (isSuperadmin || role === "admin") ? ["hradmin"] : []),
      ...(canCreateHrUsers ? ["hr"] : []),
      ...(canCreateDepartmentHeads ? ["departmenthead"] : []),
    ];
    const roleSet = new Set(baseRoles);
    if (userForm.role) {
      roleSet.add(userForm.role);
    }

    return Array.from(roleSet).map((item) => ({
      value: item,
      label: formatRoleLabel(item),
    }));
  }, [
    canCreateDepartmentHeads,
    canCreateHrUsers,
    canCreateUsers,
    isSuperadmin,
    role,
    userForm.role,
  ]);

  const listTabs = useMemo(() => {
    const tabs = [{ label: "Employees", value: "user" }];

    if (isSuperadmin) {
      tabs.push({ label: "Admins", value: "admin" });
    }

    if (isSuperadmin || role === "admin") {
      tabs.push({ label: "Department Heads", value: "departmenthead" });
    }

    if (isSuperadmin || role === "admin" || role === "hradmin") {
      tabs.push({ label: "HR Admins", value: "hradmin" });
      tabs.push({ label: "HR", value: "hr" });
    }

    return tabs;
  }, [isSuperadmin, role]);

  const activeTabIndex = Math.max(0, listTabs.findIndex((item) => item.value === listTab));

  const fetchUsers = useCallback(async () => {
    try {
      await userStore.fetchUsers({
        page,
        limit: 10,
        search: debouncedSearch,
        ...(!issueFilter ? { role: listTab } : {}),
        ...(issueFilter ? { issue: issueFilter } : {}),
        ...(locationFilter ? { officeLocationId: locationFilter } : {}),
        ...(isSuperadmin && scopedCompanyId ? { companyId: scopedCompanyId } : {}),
      });
    } catch (err: any) {
      showToast({
        title: "Unable to load users",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 3500,
      });
    }
  }, [debouncedSearch, isSuperadmin, issueFilter, listTab, locationFilter, page, scopedCompanyId, showToast, userStore]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [issueFilter]);

  useEffect(() => {
    if (isSuperadmin) {
      companyStore.getManagedCompanies().catch(() => undefined);
    }
  }, [companyStore, isSuperadmin]);

  useEffect(() => {
    const locationCompanyId = isSuperadmin ? scopedCompanyId : auth.company;
    setLocationFilter("");

    if (!locationCompanyId) {
      locationStore.clearLocations();
      return;
    }

    locationStore.fetchLocations(locationCompanyId, 1, 100).catch(() => undefined);
  }, [auth.company, isSuperadmin, locationStore, scopedCompanyId]);

  useEffect(() => {
    if (!userDepartmentCompanyId) {
      return;
    }

    departmentStore.fetchDepartments(userDepartmentCompanyId, 1, 100).catch(() => undefined);
  }, [departmentStore, userDepartmentCompanyId]);

  useEffect(() => {
    setBulkForm((prev) =>
      prev.companyId === (scopedCompanyId || auth.company || "")
        ? prev
        : { ...prev, companyId: scopedCompanyId || auth.company || "" }
    );
  }, [auth.company, scopedCompanyId]);

  useEffect(() => {
    const validRoles = new Set(bulkUploadRoleOptions.map((option) => option.value));

    setBulkForm((prev) =>
      validRoles.has(prev.uploadRole)
        ? prev
        : {
            ...prev,
            uploadRole: "",
          }
    );
  }, [bulkUploadRoleOptions, selectedBulkManagerLevels]);

  useEffect(() => {
    if (!isBulkModalOpen) {
      return;
    }

    setSelectedFile(null);
    userStore.bulkPreview = [];
  }, [bulkForm.companyId, bulkForm.uploadRole, isBulkModalOpen, userStore]);

  useEffect(() => {
    if (!listTabs.some((item) => item.value === listTab)) {
      setListTab("user");
      setPage(1);
    }
  }, [listTab, listTabs]);

  const replaceQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
      if (embedded) return;

      const nextParams = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          nextParams.set(key, value);
        } else {
          nextParams.delete(key);
        }
      });
      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [embedded, pathname, router, searchParams]
  );

  const clearIssueFilter = useCallback(() => {
    replaceQueryParams({ issue: null });
    setPage(1);
  }, [replaceQueryParams]);

  const handleListTabChange = (nextTab: string) => {
    setListTab(nextTab);
    setPage(1);
    if (issueFilter) {
      clearIssueFilter();
    }
  };

  const resetForm = useCallback(
    (initialRole = "user") =>
      setUserForm({
        ...initialForm(),
        role: initialRole,
        companyId: isSuperadmin ? scopedCompanyId : auth.company || "",
        companyManagerLevels: isSuperadmin ? 3 : currentCompanyManagerLevels,
        reportingManager: null,
        changeReason: "",
        statutoryDetails: { aadharNumber: "", panNumber: "", nationality: "" },
        skills: { coreDomainArea: "", additionalDomainAreas: [], totalYearsOfExperience: 0 },
        familyContacts: [],
        employeeDocuments: [],
      }),
    [
      auth.company,
      currentCompanyManagerLevels,
      isSuperadmin,
      scopedCompanyId,
    ]
  );

  const resetBulkUploadState = useCallback(() => {
    setSelectedFile(null);
    userStore.bulkPreview = [];
    setBulkForm((prev) => ({
      ...prev,
      companyId: isSuperadmin ? scopedCompanyId || prev.companyId : auth.company || prev.companyId,
      companyManagerLevels: isSuperadmin ? prev.companyManagerLevels : currentCompanyManagerLevels,
      uploadRole: "",
    }));
  }, [auth.company, currentCompanyManagerLevels, isSuperadmin, scopedCompanyId, userStore]);

  const openBulkUpload = useCallback(() => {
    if (isManagementBlocked) {
      showToast({
        title: "Company is inactive",
        description: managementBlockedMessage,
        status: "warning",
        duration: 4000,
      });
      return;
    }
    resetBulkUploadState();
    setIsBulkModalOpen(true);
  }, [
    isManagementBlocked,
    managementBlockedMessage,
    resetBulkUploadState,
    showToast,
  ]);

  const closeBulkUpload = () => {
    resetBulkUploadState();
    setIsBulkModalOpen(false);
  };

  const openCreate = useCallback((initialRole = "user") => {
    if (isManagementBlocked) {
      showToast({
        title: "Company is inactive",
        description: managementBlockedMessage,
        status: "warning",
        duration: 4000,
      });
      return;
    }

    if (!canOpenCreate) {
      showToast({
        title: "Permission required",
        description: "Your account cannot create employees with the current permission set.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (isSuperadmin && !scopedCompanyId) {
      showToast({
        title: "Company is required",
        description: "Select a company before creating an employee.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const normalizedInitialRole = normalizeRole(initialRole);
    const canUseInitialRole = roleOptions.some(
      (option) => option.value === normalizedInitialRole
    );
    resetForm(canUseInitialRole ? normalizedInitialRole : "user");
    setIsUserDrawerOpen(true);
  }, [
    canOpenCreate,
    isManagementBlocked,
    isSuperadmin,
    managementBlockedMessage,
    resetForm,
    roleOptions,
    scopedCompanyId,
    showToast,
  ]);

  useEffect(() => {
    if (embedded || !auth.sessionReady || !auth.user) {
      return;
    }

    const action = String(searchParams.get("action") || "")
      .trim()
      .toLowerCase();
    const requestedRole = String(searchParams.get("role") || "")
      .trim()
      .toLowerCase();
    if (!action) {
      return;
    }

    const actionKey = `${action}:${requestedRole}:${scopedCompanyId || auth.company || ""}`;
    if (handledDeepLinkRef.current === actionKey) {
      return;
    }
    handledDeepLinkRef.current = actionKey;

    if (action === "add" && canOpenCreate) {
      openCreate(requestedRole || "user");
    } else if (action === "bulk" && canOpenBulk) {
      openBulkUpload();
    }

    replaceQueryParams({ action: null, role: null });
  }, [
    auth.company,
    auth.sessionReady,
    auth.user,
    canOpenBulk,
    canOpenCreate,
    embedded,
    openBulkUpload,
    openCreate,
    replaceQueryParams,
    scopedCompanyId,
    searchParams,
  ]);

  const openEdit = (user: any) => {
    if (!canEditUsers) {
      showToast({
        title: "Permission required",
        description: "Your account cannot edit employees.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const roleValue = normalizeRole(user.role || "user");
    const reportingManager = optionFromManager(user.reportingManager);

    setUserForm({
      id: user._id,
      employeeNumber: user.employeeNumber || user.code || "",
      profileId: user.profileId || "",
      name: user.name || "",
      email: user.email || user.username || "",
      password: "",
      confirmPassword: "",
      sendInvite: false,
      pic: user.pic ? { ...user.pic, file: null, isAdd: 0, isDeleted: 0, url: user.pic.url || "" } : { file: null, isAdd: 0, isDeleted: 0, url: "" },
      mobileNumber: user.mobileNumber || "",
      department: user.department || "",
      team: user.team || "",
      officeLocationId: getUserOfficeLocationId(user),
      city: user.city || "",
      state: user.state || "",
      designation: user.designation || "",
      joiningDate: user.joiningDate ? String(user.joiningDate).slice(0, 10) : "",
      dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "",
      gender: typeof user.gender === "number" ? user.gender : "",
      role: roleValue,
      companyId: user.companyId || user.company?._id || "",
      companyName: user.company?.name || user.company?.company_name || "",
      companyManagerLevels: user.company?.managerLevels || selectedUserManagerLevels,
      createCompany: false,
      resendSetupEmail: false,
      hrScope: {
        departments: Array.isArray(user.hrScope?.departments) ? user.hrScope.departments : [],
        teams: Array.isArray(user.hrScope?.teams) ? user.hrScope.teams : [],
        officeLocationIds: Array.isArray(user.hrScope?.officeLocationIds)
          ? user.hrScope.officeLocationIds
          : Array.isArray(user.hrScope?.officeLocations)
            ? user.hrScope.officeLocations
            : [],
      },
      reportingManager,
      changeReason: "",
      statutoryDetails: user.profileDetails?.statutoryDetails || { aadharNumber: "", panNumber: "", nationality: "" },
      skills: user.profileDetails?.skills || { coreDomainArea: "", additionalDomainAreas: [], totalYearsOfExperience: 0 },
      familyContacts: user.profileDetails?.familyContacts || [],
      employeeDocuments: user.profileDetails?.employeeDocuments || [],
    });
    setIsUserDrawerOpen(true);
  };

  const openView = (user: any) => setSelectedUser(user);
  
  const openProfileDetails = (user: any) => {
    setSelectedProfileUser(user);
    setIsProfileDrawerOpen(true);
  };

  const openDelete = (user: any) => {
    if (!canDeleteUsers) {
      showToast({
        title: "Permission required",
        description: "Your account cannot delete employees.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setDeleteDialog(user);
  };

  const updateRole = (nextRole: string) => {
    const normalizedNextRole = normalizeRole(nextRole);
    const isHrRole = normalizedNextRole === "hradmin" || normalizedNextRole === "hr";
    setUserForm((prev) => ({
      ...prev,
      role: normalizedNextRole,
      department: isHrRole ? "" : prev.department,
      team: isHrRole ? "" : prev.team,
      officeLocationId: isHrRole ? "" : prev.officeLocationId,
      hrScope: normalizedNextRole === "hr"
        ? prev.hrScope
        : {
            departments: [],
            teams: [],
            officeLocationIds: [],
          },
    }));
  };

  const setManagerSelection = (selectedManager: any) =>
    setUserForm((prev) => ({
      ...prev,
      reportingManager: selectedManager || null,
    }));

  const submitUser = async () => {
    const employeeNumber = userForm.employeeNumber.trim();
    const name = userForm.name.trim();
    const email = normalizeEmail(userForm.email);
    const roleValue = normalizeRole(userForm.role);
    const mobileNumber = userForm.mobileNumber.trim();
    const department = userForm.department.trim();
    const team = userForm.team.trim();
    const officeLocationId = userForm.officeLocationId.trim();
    const city = userForm.city.trim();
    const state = userForm.state.trim();
    const designation = userForm.designation.trim();
    const joiningDate = userForm.joiningDate;
    const dateOfBirth = userForm.dateOfBirth;
    const gender = userForm.gender;
    const selectedReportingManager = userForm.reportingManager;
    const reportingManagerValue = String(selectedReportingManager?.value || "");
    const reportingManagerId = reportingManagerValue;
    const reportingManagerEmail = normalizeEmail(
      selectedReportingManager?.email ||
        selectedReportingManager?.username
    );

    const isDepartmentRequired = roleValue === "departmenthead";

    if (
      (roleValue !== "admin" && !employeeNumber) ||
      !name ||
      !email ||
      !roleValue ||
      (isDepartmentRequired && !department)
    ) {
      showToast({
        title: "Missing details",
        description: `${roleValue === "admin" ? "Full name" : "Employee number, full name"}, email, ${isDepartmentRequired ? "department, " : ""}and role are required.`,
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (roleValue === "hr" && (userForm.hrScope?.departments || []).length === 0) {
      showToast({
        title: "HR scope required",
        description: "Select at least one department for this HR account.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast({
        title: "Invalid email address",
        description: "Enter a valid email address.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (mobileNumber && !/^[0-9+()\-\s]{7,20}$/.test(mobileNumber)) {
      showToast({
        title: "Invalid mobile number",
        description: "Enter a valid mobile number before saving.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (dateOfBirth) {
      const selectedDate = new Date(`${dateOfBirth}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate.getTime() > today.getTime()) {
        showToast({
          title: "Invalid date of birth",
          description: "Date of birth cannot be in the future.",
          status: "warning",
          duration: 3000,
        });
        return;
      }
    }

    if (!userForm.id) {
      const password = String(userForm.password || "");
      const confirmPassword = String(userForm.confirmPassword || "");

      if (password && password !== confirmPassword) {
        showToast({
          title: "Password mismatch",
          description: "Initial password and confirmation password must match.",
          status: "warning",
          duration: 3000,
        });
        return;
      }

      if (!password && userForm.sendInvite === false) {
        showToast({
          title: "Authentication required",
          description: "Enter an initial password or keep setup invite enabled.",
          status: "warning",
          duration: 3000,
        });
        return;
      }
    }

    const selfManagerIdentifiers = [email, mobileNumber].filter(Boolean);
    if (reportingManagerEmail && selfManagerIdentifiers.includes(reportingManagerEmail)) {
      showToast({
        title: "Invalid hierarchy",
        description: "An employee cannot be their own reporting manager.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (!userForm.id) {
      if (["hr", "hradmin"].includes(roleValue) && !canCreateHrUsers) {
        showToast({
          title: "Permission required",
          description: "Your account cannot create HR users.",
          status: "warning",
          duration: 3000,
        });
        return;
      }

      if (roleValue === "user" && !canCreateUsers) {
        showToast({
          title: "Permission required",
          description: "Your account cannot create employees.",
          status: "warning",
          duration: 3000,
        });
        return;
      }

    } else if (!canEditUsers) {
      showToast({
        title: "Permission required",
        description: "Your account cannot edit employees.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if ((reportingManagerId || reportingManagerEmail) && !canAssignManagers) {
      showToast({
        title: "Permission required",
        description: "Your account cannot assign managers.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const isHrRole = roleValue === "hradmin" || roleValue === "hr";
    const payload: any = {
      employeeNumber,
      name,
      email: email || undefined,
      mobileNumber,
      department: isHrRole ? "" : department,
      team: isHrRole ? "" : team,
      officeLocationId: isHrRole ? undefined : officeLocationId || undefined,
      city,
      state,
      designation,
      joiningDate,
      dateOfBirth,
      gender: gender ? Number(gender) : undefined,
      role: roleValue,
      reportingManagerId,
      reportingManagerEmail: reportingManagerId ? undefined : reportingManagerEmail || undefined,
      assignmentChangeReason: userForm.changeReason.trim() || undefined,
    };

    if (roleValue === "hr") {
      payload.hrScope = {
        departments: userForm.hrScope?.departments || [],
        teams: userForm.hrScope?.teams || [],
        officeLocationIds: userForm.hrScope?.officeLocationIds || [],
      };
    }

    if (!userForm.id) {
      const password = String(userForm.password || "");
      if (password) {
        payload.password = password;
      } else {
        payload.sendInvite = userForm.sendInvite !== false;
      }
    }

    if (userForm.pic?.isDeleted) {
      payload.pic = {
        isDeleted: 1,
        isAdd: 0,
      };
    }

    if (userForm.pic?.file instanceof File) {
      const buffer = await readFileAsBase64(userForm.pic.file);
      payload.pic = {
        buffer,
        filename: userForm.pic.file.name,
        type: userForm.pic.file.type,
        isAdd: 1,
        isDeleted: userForm.pic?.isDeleted || 0,
      };
    }

    if (isSuperadmin) {
      if (userForm.createCompany) {
        if (!userForm.companyName.trim()) {
          showToast({
            title: "Company is required",
            description: "Enter a company name or choose an existing company.",
            status: "warning",
            duration: 3000,
          });
          return;
        }
        payload.companyName = userForm.companyName.trim();
        payload.companyManagerLevels = userForm.companyManagerLevels;
      } else if (userForm.companyId) {
        payload.companyId = userForm.companyId;
      } else {
        showToast({
          title: "Company is required",
          description: "Select a company or create a new one.",
          status: "warning",
          duration: 3000,
        });
        return;
      }
    } else {
      payload.companyId = auth.company;
    }

    if (isDepartmentHead) {
      payload.department = auth.user?.department || "";
    }

    try {
      const response = userForm.id
        ? await userStore.updateManagedUser(userForm.id, payload)
        : await userStore.createManagedUser(payload);
      const setup = response?.data?.setup;
      const setupLinkCopied =
        setup?.emailSent === false &&
        setup?.setupUrl &&
        typeof navigator !== "undefined"
          ? await navigator.clipboard.writeText(setup.setupUrl).then(() => true).catch(() => false)
          : false;

      if (setup?.emailSent === false && setup?.setupUrl) {
        setSetupNotice({
          name,
          email,
          setupUrl: setup.setupUrl,
          emailError: setup.emailError,
          copied: setupLinkCopied,
        });
      } else {
        setSetupNotice(null);
      }

      showToast({
        title: userForm.id ? "Employee updated" : "Employee created",
        description:
          setup?.emailSent === false && setup?.setupUrl
            ? setupLinkCopied
              ? "SMTP did not send the email, so the setup link was copied to clipboard."
              : `Setup link: ${setup.setupUrl}`
            : response?.message || "Saved successfully.",
        status: "success",
        duration: setup?.emailSent === false ? 9000 : 3500,
      });
      setIsUserDrawerOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      showToast({
        title: "Unable to save employee",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 4000,
      });
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        return;
      }

      if (isSuperadmin && bulkForm.createCompany && !bulkForm.companyName.trim()) {
        showToast({
          title: "Company is required",
          description: "Enter a company name before previewing the upload.",
          status: "warning",
          duration: 3000,
        });
        return;
      }

      if (isSuperadmin && !bulkForm.createCompany && !bulkForm.companyId) {
        showToast({
          title: "Company is required",
          description: "Select a company before previewing the upload.",
          status: "warning",
          duration: 3000,
        });
        return;
      }

      if (!bulkForm.uploadRole) {
        showToast({
          title: "Upload type is required",
          description: "Choose the employee import type.",
          status: "warning",
          duration: 3000,
        });
        return;
      }

      setSelectedFile(file);
      try {
        const bulkUploadOptions = isSuperadmin
          ? bulkForm.createCompany
            ? {
                companyName: bulkForm.companyName.trim(),
                companyManagerLevels: bulkForm.companyManagerLevels,
                uploadRole: bulkForm.uploadRole,
              }
            : {
                companyId: bulkForm.companyId,
                companyManagerLevels: selectedBulkManagerLevels,
                uploadRole: bulkForm.uploadRole,
              }
        : {
            companyId: bulkForm.companyId,
            companyManagerLevels: selectedBulkManagerLevels,
            uploadRole: bulkForm.uploadRole,
          };

        await userStore.previewUploadUsers(file, bulkUploadOptions);
      } catch (err: any) {
        showToast({
          title: "Preview failed",
          description: getApiErrorMessage(err, "We could not read that Excel file."),
          status: "error",
          duration: 4000,
        });
      }
    },
    [
      bulkForm.companyId,
      bulkForm.companyManagerLevels,
      bulkForm.companyName,
      bulkForm.createCompany,
      bulkForm.uploadRole,
      isSuperadmin,
      selectedBulkManagerLevels,
      toast,
      userStore,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      showToast({
        title: "No file selected",
        description: "Choose an Excel file before uploading.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (isSuperadmin && bulkForm.createCompany && !bulkForm.companyName.trim()) {
      showToast({
        title: "Company is required",
        description: "Enter a company name for this bulk upload.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (isSuperadmin && !bulkForm.createCompany && !bulkForm.companyId) {
      showToast({
        title: "Company is required",
        description: "Select a company before uploading this file.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (!bulkForm.uploadRole) {
      showToast({
        title: "Upload type is required",
        description: "Choose the employee import type.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      const bulkUploadOptions = isSuperadmin
          ? bulkForm.createCompany
            ? {
                companyName: bulkForm.companyName.trim(),
                companyManagerLevels: bulkForm.companyManagerLevels,
                uploadRole: bulkForm.uploadRole,
              }
            : {
                companyId: bulkForm.companyId,
                companyManagerLevels: selectedBulkManagerLevels,
                uploadRole: bulkForm.uploadRole,
              }
          : {
              companyId: bulkForm.companyId,
              companyManagerLevels: selectedBulkManagerLevels,
              uploadRole: bulkForm.uploadRole,
            };

      const response = await userStore.uploadUsers(selectedFile, bulkUploadOptions);
      const createdCount = response?.data?.createdCount || 0;
      const failedCount = response?.data?.failedCount || 0;

      setUploadResults(response?.data);
      setIsResultModalOpen(true);

      showToast({
        title: failedCount > 0 ? "Partial success" : "Bulk upload complete",
        description:
          response?.message ||
          `${createdCount} created and ${failedCount} skipped/failed.`,
        status: failedCount > 0 ? "info" : "success",
        duration: 4500,
      });
      setIsBulkModalOpen(false);
      setSelectedFile(null);
      userStore.bulkPreview = [];
      setBulkForm({
        companyId: scopedCompanyId,
        companyName: "",
        companyManagerLevels: 3,
        createCompany: false,
        uploadRole: "",
      });
      fetchUsers();
    } catch (err: any) {
      showToast({
        title: "Bulk upload failed",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleDownloadTemplate = async () => {
    if (isSuperadmin && !bulkForm.companyId) {
      showToast({
        title: "Company is required",
        description: "Select a company before downloading the template.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (!bulkForm.uploadRole) {
      showToast({
        title: "Employee type is required",
        description: "Select the employee type you want to create first.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      await userStore.downloadBulkUploadTemplate({
        companyId: bulkForm.companyId,
        companyManagerLevels: selectedBulkManagerLevels,
        uploadRole: bulkForm.uploadRole,
      });
    } catch (err: any) {
      showToast({
        title: "Template download failed",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 4000,
      });
    }
  };

  const filteredCompanies = useMemo(
    () => (isSuperadmin ? managedCompanies : []),
    [isSuperadmin, managedCompanies]
  );
  const officeLocationOptions = useMemo(
    () =>
      locationStore.locations.map((location: any) => ({
        label: `${location.name}${location.city ? ` - ${location.city}` : ""}`,
        value: location._id,
        isDisabled: location.is_active === false,
      })),
    [locationStore.locations]
  );

  const cancelStatusRef = useRef<HTMLButtonElement | null>(null);

  const handleOpenStatusDialog = (user: any) => {
    const currentlyEnabled = user?.isEnabled !== false && user?.status !== "INACTIVE";
    setStatusDialog({
      user,
      nextIsEnabled: !currentlyEnabled,
    });
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteDialog?._id) {
      return;
    }

    try {
      const response = await userStore.deleteManagedUser(deleteDialog._id);
      showToast({
        title: "Employee deleted",
        description: response?.message || "Employee deleted successfully.",
        status: "success",
        duration: 3500,
      });
      if (selectedUser?._id === deleteDialog._id) {
        setSelectedUser(null);
      }
      setDeleteDialog(null);
      fetchUsers();
    } catch (err: any) {
      showToast({
        title: "Unable to delete employee",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!statusDialog?.user?._id) {
      return;
    }

    try {
      const response = await userStore.updateManagedUserStatus(
        statusDialog.user._id,
        statusDialog.nextIsEnabled
      );
      showToast({
        title: statusDialog.nextIsEnabled ? "Employee activated" : "Employee deactivated",
        description: response?.message || "Employee status updated successfully.",
        status: "success",
        duration: 3500,
      });
      setStatusDialog(null);
      fetchUsers();
    } catch (err: any) {
      showToast({
        title: "Unable to update employee status",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 4000,
      });
    }
  };

  const activeTabLabel =
    listTabs.find((item) => item.value === listTab)?.label || "Employees";

  const copySetupLink = async () => {
    if (!setupNotice?.setupUrl || typeof navigator === "undefined") {
      return;
    }

    const copied = await navigator.clipboard
      .writeText(setupNotice.setupUrl)
      .then(() => true)
      .catch(() => false);

    showToast({
      title: copied ? "Setup link copied" : "Unable to copy setup link",
      description: copied ? "Share this link with the employee." : setupNotice.setupUrl,
      status: copied ? "success" : "warning",
      duration: 3500,
    });

    if (copied) {
      setSetupNotice((prev: any) => (prev ? { ...prev, copied: true } : prev));
    }
  };

  return (
    <PermissionGate
      allowed={canViewUsers}
      title="Employees module is disabled"
      description="This account does not currently have access to the employees workspace."
      fallbackHref="/dashboard/profile"
    >
    <Box minH={embedded ? "auto" : "100vh"}>
      <VStack align="stretch" spacing={6}>

        {isManagementBlocked ? (
          <Alert status="warning" borderRadius="2xl" alignItems="start">
            <AlertIcon mt={1} />
            <Box>
              <AlertTitle>Company is inactive</AlertTitle>
              <AlertDescription>{managementBlockedMessage}</AlertDescription>
            </Box>
          </Alert>
        ) : null}

        {setupNotice?.setupUrl ? (
          <Alert status="warning" borderRadius="2xl" alignItems="start">
            <AlertIcon mt={1} />
            <Box flex="1" minW={0}>
              <AlertTitle>Setup email was not sent</AlertTitle>
              <AlertDescription>
                Share this setup link with {setupNotice.name || setupNotice.email || "the employee"} so they can set their password.
                {setupNotice.emailError ? ` ${setupNotice.emailError}` : ""}
              </AlertDescription>
              <Box
                mt={3}
                p={3}
                borderWidth="1px"
                borderColor="orange.200"
                borderRadius="lg"
                bg="orange.50"
                color="orange.900"
                wordBreak="break-all"
                fontSize="sm"
              >
                {setupNotice.setupUrl}
              </Box>
              <Button mt={3} size="sm" colorScheme="orange" onClick={copySetupLink}>
                {setupNotice.copied ? "Copy Again" : "Copy Setup Link"}
              </Button>
            </Box>
          </Alert>
        ) : null}

        {issueFilter ? (
          <Alert
            status="info"
            borderRadius="lg"
            alignItems={{ base: "stretch", sm: "center" }}
            flexDirection={{ base: "column", sm: "row" }}
            gap={3}
          >
            <AlertIcon display={{ base: "none", sm: "block" }} />
            <Box flex="1">
              <AlertTitle fontSize="sm">Dashboard work queue</AlertTitle>
              <AlertDescription fontSize="sm">
                Showing {issueFilterLabel.toLowerCase()}.
              </AlertDescription>
            </Box>
            <Button size="sm" variant="outline" onClick={clearIssueFilter}>
              Clear Filter
            </Button>
          </Alert>
        ) : null}

        <UsersHeader
  onOpenBulk={openBulkUpload}
  onOpenCreate={openCreate}
  borderColor={borderColor}
  muted={muted}
  canOpenBulk={canOpenBulk}
  canOpenCreate={canOpenCreate}
/>

<UsersTable
  users={userStore.users}
  loading={userStore.loading}
  pagination={userStore.pagination}
  search={search}
  setSearch={setSearch}
  page={page}
  setPage={setPage}
  listTabs={listTabs}
  listTab={listTab}
  setListTab={handleListTabChange}
  activeTabIndex={activeTabIndex}
  activeTabLabel={activeTabLabel}
  tableHeadBg={tableHeadBg}
  borderColor={borderColor}
  muted={muted}
  onEdit={openEdit}
  onView={openView}
  onDelete={openDelete}
  onToggleStatus={handleOpenStatusDialog}
  statusUpdatingId={statusDialog?.user?._id}
  formatRoleLabel={formatRoleLabel}
  canEdit={canEditUsers}
  canDelete={canDeleteUsers}
  canToggleStatus={isSuperadmin}
  officeLocationOptions={officeLocationOptions}
  locationFilter={locationFilter}
  setLocationFilter={setLocationFilter}
  onResetFilters={clearIssueFilter}
  onProfileDetails={openProfileDetails}
/>

      </VStack>

<UserDrawer
  isOpen={isUserDrawerOpen}
  onClose={() => setIsUserDrawerOpen(false)}
  userForm={userForm}
  setUserForm={setUserForm}
  roleOptions={roleOptions}
  isSuperadmin={isSuperadmin}
  managedCompanies={managedCompanies}
  filteredCompanies={filteredCompanies}
  borderColor={borderColor}
  muted={muted}
  currentCompanyName={currentCompanyName}
  currentCompanyDepartments={currentCompanyDepartments}
  departmentRecords={departmentRecords}
  officeLocationOptions={officeLocationOptions}
  managerCompanyId={managerCompanyId}
  updateRole={updateRole}
  setManagerSelection={setManagerSelection}
  onSubmit={submitUser}
  loading={userStore.submitting}
  canAssignManagers={canAssignManagers}
  companyCode={selectedUserCompanyCode}
/>

<BulkUploadModal
  isOpen={isBulkModalOpen}
  onClose={closeBulkUpload}
  bulkForm={bulkForm}
  setBulkForm={setBulkForm}
  isSuperadmin={isSuperadmin}
  managedCompanies={managedCompanies}
  filteredCompanies={filteredCompanies}
  borderColor={borderColor}
  tableHeadBg={tableHeadBg}
  muted={muted}
  uploadRoleOptions={bulkUploadRoleOptions}
  getRootProps={getRootProps}
  getInputProps={getInputProps}
  isDragActive={isDragActive}
  selectedFile={selectedFile}
  setSelectedFile={setSelectedFile}
  preview={userStore.bulkPreview}
  loading={userStore.uploadLoading}
  onDownloadTemplate={handleDownloadTemplate}
  onUpload={handleBulkUpload}
/>

<UserDetailsModal
  isOpen={!!selectedUser}
  onClose={() => setSelectedUser(null)}
  user={selectedUser}
  formatRoleLabel={formatRoleLabel}
  canEditReportingManager={canEditUsers && canAssignManagers}
  onEditReportingManager={openEdit}
/>

<ProfileDetailsDrawer
  isOpen={isProfileDrawerOpen}
  onClose={() => {
    setIsProfileDrawerOpen(false);
    setSelectedProfileUser(null);
  }}
  user={selectedProfileUser}
/>

<BulkUploadResultModal
  isOpen={isResultModalOpen}
  onClose={() => setIsResultModalOpen(false)}
  results={uploadResults}
  borderColor={borderColor}
  tableHeadBg={tableHeadBg}
  muted={muted}
/>

<ConfirmationModal
  isOpen={Boolean(deleteDialog)}
  onClose={() => setDeleteDialog(null)}
  onConfirm={handleConfirmDeleteUser}
  title="Delete employee?"
  description={`${deleteDialog?.name || "This employee"} will be removed from active management and hidden from the application.`}
  // note="This is a soft delete for audit purposes. The record remains in the database, but it will no longer be fetched or shown in the UI."
  confirmText="Delete Employee"
  isLoading={userStore.submitting}
  tone="danger"
/>

<AlertDialog
  isOpen={Boolean(statusDialog)}
  leastDestructiveRef={cancelStatusRef}
  onClose={() => setStatusDialog(null)}
  isCentered
>
  <AlertDialogOverlay />
  <AlertDialogContent borderRadius="2xl">
    <AlertDialogHeader fontSize="lg" fontWeight="bold">
      {statusDialog?.nextIsEnabled ? "Activate employee?" : "Deactivate employee?"}
    </AlertDialogHeader>

    <AlertDialogBody>
      {statusDialog?.nextIsEnabled
        ? statusDialog?.user?.passwordStatus === "SET"
          ? `${statusDialog?.user?.name || "This employee"} will be able to log in again immediately.`
          : `${statusDialog?.user?.name || "This employee"}'s account will be enabled, but password setup is still required before login.`
        : `${statusDialog?.user?.name || "This employee"} will no longer be able to log in. They’ll see a deactivation message and need an administrator to reactivate the account.`}
    </AlertDialogBody>

    <AlertDialogFooter>
      <Button ref={cancelStatusRef} onClick={() => setStatusDialog(null)}>
        Cancel
      </Button>
      <Button
        colorScheme={statusDialog?.nextIsEnabled ? "green" : "red"}
        onClick={handleConfirmStatusChange}
        ml={3}
        isLoading={userStore.submitting}
      >
        {statusDialog?.nextIsEnabled ? "Activate" : "Deactivate"}
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </Box>
    </PermissionGate>
  );
});

export default UsersView;
