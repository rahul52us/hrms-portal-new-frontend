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
  useToast
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
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

type UsersViewProps = {
  scopedCompanyId?: string;
  embedded?: boolean;
};

type ManagerRow = {
  level: number;
  selectedManager: any | null;
};

type UserFormState = {
  id?: string;
  code: string;
  profileId: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  pic: any;
  mobileNumber: string;
  department: string;
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
  managers: ManagerRow[];
};

type BulkFormState = {
  companyId: string;
  companyName: string;
  companyManagerLevels: number;
  createCompany: boolean;
  uploadRole: string;
};

const COLORS = ["blue", "purple", "orange", "green", "pink", "cyan"];

const normalizeRole = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^l\s*(\d+)\s*manager$/i, "l$1-manager")
    .replace(/\s+/g, "-");
const normalizeEmail = (value: unknown) => String(value || "").trim().toLowerCase();
const emptyManager = (level: number): ManagerRow => ({ level, selectedManager: null });

const getCompanyManagerLevels = (company: any) => Math.max(1, Number(company?.managerLevels) || 3);

const formatRoleLabel = (role: string) => {
  if (!role) {
    return "Role";
  }

  if (role === "user") {
    return "User";
  }

  if (role === "admin") {
    return "Admin";
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

const parseManagerLevel = (role: string) => {
  const match = normalizeRole(role).match(/^l(\d+)-manager$/i);
  return match ? Number(match[1]) : null;
};

const getBulkUploadRoleOptions = (managerLevels: number) => {
  const totalLevels = Math.max(1, Number(managerLevels) || 3);
  const options = [];

  for (let level = totalLevels; level >= 1; level -= 1) {
    const requiredManagers = Array.from(
      { length: Math.max(0, totalLevels - level) },
      (_, index) => `L${level + index + 1}`
    );

    options.push({
      value: `l${level}-manager`,
      label: `Level ${level} Managers`,
      description:
        requiredManagers.length === 0
          ? "Top-level managers without any assigned manager."
          : `Optionally assign ${requiredManagers.join(", ")} manager phone number${requiredManagers.length > 1 ? "s" : ""}.`,
    });
  }

  options.push({
    value: "user",
    label: "Employees / Users",
    description: `Optionally assign L1 to L${totalLevels} manager phone numbers.`,
  });

  return options;
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

const getRequiredManagerLevels = (role: string, maxLevel: number) => {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole || normalizedRole === "admin" || normalizedRole === "superadmin") {
    return [];
  }

  const managerLevel = parseManagerLevel(normalizedRole);
  const startLevel = managerLevel ? managerLevel + 1 : 1;

  if (startLevel > maxLevel) {
    return [];
  }

  return Array.from({ length: maxLevel - startLevel + 1 }, (_, index) => startLevel + index);
};

const reconcileManagersForRole = (role: string, managers: ManagerRow[], maxLevel: number) => {
  const managerMap = new Map<number, ManagerRow>();
  managers.forEach((manager) => {
    managerMap.set(Number(manager.level), manager);
  });

  return getRequiredManagerLevels(role, maxLevel).map(
    (level) => managerMap.get(level) || emptyManager(level)
  );
};

const initialForm = (): UserFormState => ({
  code: "",
  profileId: "",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  pic: { file: null, isAdd: 0, isDeleted: 0, url: "" },
  mobileNumber: "",
  department: "",
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
  managers: reconcileManagersForRole("user", [], 3),
});

const UsersView = observer(({ scopedCompanyId: scopedCompanyIdProp, embedded = false }: UsersViewProps) => {
  const toast = useToast();
  const { userStore, companyStore, auth } = stores;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [listTab, setListTab] = useState("user");
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ user: any; nextIsEnabled: boolean } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<any | null>(null);
  const [uploadResults, setUploadResults] = useState<any | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
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
  const canCreateManagers = hasPermission(auth.user, PERMISSION_KEYS.CREATE_MANAGERS);
  const canCreateDepartmentHeads = hasPermission(auth.user, PERMISSION_KEYS.CREATE_DEPARTMENT_HEADS);
  const canEditUsers = hasPermission(auth.user, PERMISSION_KEYS.EDIT_USERS);
  const canAssignManagers = hasPermission(auth.user, PERMISSION_KEYS.ASSIGN_MANAGERS);
  const canDeleteUsers = canEditUsers;
  const canOpenCreate = canCreateUsers || canCreateManagers || canCreateDepartmentHeads;
  const canOpenBulk = canOpenCreate || canEditUsers;
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
  const selectedBulkCompany = isSuperadmin
    ? managedCompanies.find((company: any) => company?._id === bulkForm.companyId)
    : auth.user?.companyDetails;
  const selectedUserManagerLevels = userForm.createCompany
    ? Math.max(1, Number(userForm.companyManagerLevels) || 3)
    : getCompanyManagerLevels(selectedUserCompany || { managerLevels: currentCompanyManagerLevels });
  const selectedBulkManagerLevels = bulkForm.createCompany
    ? Math.max(1, Number(bulkForm.companyManagerLevels) || 3)
    : getCompanyManagerLevels(selectedBulkCompany || { managerLevels: currentCompanyManagerLevels });
  const bulkUploadRoleOptions = useMemo(
    () => getBulkUploadRoleOptions(selectedBulkManagerLevels),
    [selectedBulkManagerLevels]
  );

  const visibleManagerLevels = useMemo(() => {
    const companyLevels = isSuperadmin
      ? managedCompanies.map((company: any) => getCompanyManagerLevels(company))
      : [currentCompanyManagerLevels];
    const maxConfiguredLevel = Math.max(1, ...companyLevels, selectedUserManagerLevels, selectedBulkManagerLevels);
    return Array.from({ length: maxConfiguredLevel }, (_, index) => index + 1);
  }, [
    currentCompanyManagerLevels,
    isSuperadmin,
    managedCompanies,
    selectedBulkManagerLevels,
    selectedUserManagerLevels,
  ]);

  const roleOptions = useMemo(() => {
    const baseRoles = [
      ...(canCreateUsers ? ["user"] : []),
      ...(canCreateDepartmentHeads ? ["departmenthead"] : []),
      ...(canCreateManagers
        ? Array.from({ length: selectedUserManagerLevels }, (_, index) => `l${index + 1}-manager`)
        : []),
    ];
    const roleSet = new Set(baseRoles);
    if (userForm.role) {
      roleSet.add(userForm.role);
    }

    return Array.from(roleSet).map((item) => ({
      value: item,
      label: formatRoleLabel(item),
    }));
  }, [canCreateManagers, canCreateUsers, selectedUserManagerLevels, userForm.role]);

  const listTabs = useMemo(() => {
    const tabs = [{ label: "Users", value: "user" }];

    visibleManagerLevels.forEach((level) => {
      tabs.push({
        label: `L${level} Managers`,
        value: `l${level}-manager`,
      });
    });

    if (isSuperadmin) {
      tabs.push({ label: "Admins", value: "admin" });
    }

    if (isSuperadmin || role === "admin") {
      tabs.push({ label: "Department Heads", value: "departmenthead" });
    }

    return tabs;
  }, [isSuperadmin, role, visibleManagerLevels]);

  const activeTabIndex = Math.max(0, listTabs.findIndex((item) => item.value === listTab));

  const fetchUsers = useCallback(async () => {
    try {
      await userStore.fetchUsers({
        page,
        limit: 10,
        search: debouncedSearch,
        role: listTab,
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
  }, [debouncedSearch, isSuperadmin, listTab, page, scopedCompanyId, toast, userStore]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (isSuperadmin) {
      companyStore.getManagedCompanies().catch(() => undefined);
    }
  }, [companyStore, isSuperadmin]);

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
    if (!isUserDrawerOpen) {
      return;
    }

    setUserForm((prev) => {
      const nextManagers = reconcileManagersForRole(prev.role, prev.managers, selectedUserManagerLevels);
      const isSame =
        nextManagers.length === prev.managers.length &&
        nextManagers.every(
          (manager, index) =>
            manager.level === prev.managers[index]?.level &&
            manager.selectedManager?.value === prev.managers[index]?.selectedManager?.value &&
            manager.selectedManager?.email === prev.managers[index]?.selectedManager?.email
        );

      return isSame ? prev : { ...prev, managers: nextManagers };
    });
  }, [isUserDrawerOpen, selectedUserManagerLevels]);

  useEffect(() => {
    if (!listTabs.some((item) => item.value === listTab)) {
      setListTab("user");
      setPage(1);
    }
  }, [listTab, listTabs]);

  useEffect(() => {
    const currentRoleLevel = parseManagerLevel(userForm.role);
    if (currentRoleLevel && currentRoleLevel > selectedUserManagerLevels) {
      setUserForm((prev) => ({
        ...prev,
        role: "user",
        managers: reconcileManagersForRole("user", prev.managers, selectedUserManagerLevels),
      }));
    }
  }, [selectedUserManagerLevels, userForm.role]);

  const resetForm = () =>
    setUserForm({
      ...initialForm(),
      companyId: isSuperadmin ? scopedCompanyId : auth.company || "",
      companyManagerLevels: isSuperadmin ? 3 : currentCompanyManagerLevels,
      managers: reconcileManagersForRole("user", [], isSuperadmin ? 3 : currentCompanyManagerLevels),
    });

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

  const openBulkUpload = () => {
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
  };

  const closeBulkUpload = () => {
    resetBulkUploadState();
    setIsBulkModalOpen(false);
  };

  const openCreate = () => {
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
        description: "Your account cannot create users with the current permission set.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (isSuperadmin && !scopedCompanyId) {
      showToast({
        title: "Company is required",
        description: "Select a company before creating a user or manager.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    resetForm();
    setIsUserDrawerOpen(true);
  };

  const openEdit = (user: any) => {
    if (!canEditUsers) {
      showToast({
        title: "Permission required",
        description: "Your account cannot edit users.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const roleValue = normalizeRole(user.role || "user");
    const mappedManagers =
      Array.isArray(user.managers) && user.managers.length > 0
        ? user.managers.map((manager: any, index: number) => ({
            level: Number(manager.level) || index + 1,
            selectedManager: optionFromManager(manager.manager || manager),
          }))
        : [];
    const roleMaxLevel = getCompanyManagerLevels(user.company || { managerLevels: selectedUserManagerLevels });

    setUserForm({
      id: user._id,
      code: user.code || "",
      profileId: user.profileId || "",
      name: user.name || "",
      email: user.email || user.username || "",
      password: "",
      confirmPassword: "",
      pic: user.pic ? { ...user.pic, file: null, isAdd: 0, isDeleted: 0, url: user.pic.url || "" } : { file: null, isAdd: 0, isDeleted: 0, url: "" },
      mobileNumber: user.mobileNumber || "",
      department: user.department || "",
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
      managers: reconcileManagersForRole(roleValue, mappedManagers, roleMaxLevel),
    });
    setIsUserDrawerOpen(true);
  };

  const openView = (user: any) => {
    setSelectedUser(user);
  };

  const openDelete = (user: any) => {
    if (!canDeleteUsers) {
      showToast({
        title: "Permission required",
        description: "Your account cannot delete users.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setDeleteDialog(user);
  };

  const updateRole = (nextRole: string) => {
    setUserForm((prev) => ({
      ...prev,
      role: nextRole,
      managers: reconcileManagersForRole(nextRole, prev.managers, selectedUserManagerLevels),
    }));
  };

  const setManagerSelection = (index: number, selectedManager: any) =>
    setUserForm((prev) => ({
      ...prev,
      managers: prev.managers.map((manager, managerIndex) =>
        managerIndex === index ? { ...manager, selectedManager: selectedManager || null } : manager
      ),
    }));

  const submitUser = async () => {
    const code = userForm.code.trim();
    const name = userForm.name.trim();
    const email = normalizeEmail(userForm.email);
    const roleValue = normalizeRole(userForm.role);
    const mobileNumber = userForm.mobileNumber.trim();
    const department = userForm.department.trim();
    const city = userForm.city.trim();
    const state = userForm.state.trim();
    const designation = userForm.designation.trim();
    const joiningDate = userForm.joiningDate;
    const dateOfBirth = userForm.dateOfBirth;
    const gender = userForm.gender;
    const managers = userForm.managers
      .map((manager) => ({
        level: manager.level,
        managerEmail: normalizeEmail(
          manager.selectedManager?.email || manager.selectedManager?.username
        ),
      }))
      .filter((manager) => manager.managerEmail);

    const isDepartmentRequired = roleValue === "departmenthead";

    if (!code || !name || !roleValue || !designation || !mobileNumber || (!userForm.id && !gender) || (isDepartmentRequired && !department)) {
      showToast({
        title: "Missing details",
        description: `Employee code, full name, mobile number, designation, ${!userForm.id ? "gender, " : ""}${isDepartmentRequired ? "department, " : ""}and role are required.`,
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast({
        title: "Invalid email address",
        description: "Enter a valid email address or leave it empty.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (!/^[0-9+()\-\s]{7,20}$/.test(mobileNumber)) {
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

    const selfManagerIdentifiers = [email, mobileNumber].filter(Boolean);
    if (managers.some((manager) => selfManagerIdentifiers.includes(manager.managerEmail))) {
      showToast({
        title: "Invalid hierarchy",
        description: "A user cannot be their own manager.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (!userForm.id) {
      if (roleValue === "user" && !canCreateUsers) {
        showToast({
          title: "Permission required",
          description: "Your account cannot create users.",
          status: "warning",
          duration: 3000,
        });
        return;
      }

      if (parseManagerLevel(roleValue) && !canCreateManagers) {
        showToast({
          title: "Permission required",
          description: "Your account cannot create managers.",
          status: "warning",
          duration: 3000,
        });
        return;
      }
    } else if (!canEditUsers) {
      showToast({
        title: "Permission required",
        description: "Your account cannot edit users.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (managers.length > 0 && !canAssignManagers) {
      showToast({
        title: "Permission required",
        description: "Your account cannot assign managers.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const payload: any = {
      code,
      name,
      email: email || undefined,
      mobileNumber,
      department,
      city,
      state,
      designation,
      joiningDate,
      dateOfBirth,
      gender: gender ? Number(gender) : undefined,
      role: roleValue,
      managers,
    };

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
      showToast({
        title: userForm.id ? "User updated" : "User created",
        description: response?.message || "Saved successfully.",
        status: "success",
        duration: 3500,
      });
      setIsUserDrawerOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      showToast({
        title: "Unable to save user",
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
          description: "Choose which hierarchy level this Excel file belongs to.",
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
        description: "Choose which hierarchy level this Excel file belongs to.",
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
        title: "User type is required",
        description: "Select the user type you want to create first.",
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
        title: "User deleted",
        description: response?.message || "User deleted successfully.",
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
        title: "Unable to delete user",
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
        title: statusDialog.nextIsEnabled ? "User activated" : "User deactivated",
        description: response?.message || "User status updated successfully.",
        status: "success",
        duration: 3500,
      });
      setStatusDialog(null);
      fetchUsers();
    } catch (err: any) {
      showToast({
        title: "Unable to update user status",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 4000,
      });
    }
  };

  const activeTabLabel =
    listTabs.find((item) => item.value === listTab)?.label || "Users";

  return (
    <PermissionGate
      allowed={canViewUsers}
      title="Users module is disabled"
      description="This account does not currently have access to the users workspace."
      fallbackHref="/dashboard/profile"
    >
    <Box minH={embedded ? "auto" : "100vh"} p={embedded ? 0 : { base: 4, md: 6 }}>
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
  setListTab={setListTab}
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
  managerCompanyId={managerCompanyId}
  updateRole={updateRole}
  setManagerSelection={setManagerSelection}
  onSubmit={submitUser}
  loading={userStore.submitting}
  canAssignManagers={canAssignManagers}
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
  selectedBulkManagerLevels={selectedBulkManagerLevels}
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
  title="Delete user?"
  description={`${deleteDialog?.name || "This user"} will be removed from active management and hidden from the application.`}
  // note="This is a soft delete for audit purposes. The record remains in the database, but it will no longer be fetched or shown in the UI."
  confirmText="Delete User"
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
      {statusDialog?.nextIsEnabled ? "Activate user?" : "Deactivate user?"}
    </AlertDialogHeader>

    <AlertDialogBody>
      {statusDialog?.nextIsEnabled
        ? `${statusDialog?.user?.name || "This user"} will be able to log in again immediately.`
        : `${statusDialog?.user?.name || "This user"} will no longer be able to log in. They’ll see a deactivation message and need an administrator to reactivate the account.`}
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
