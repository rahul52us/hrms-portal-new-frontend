"use client";

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Icon,
  Input,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { Building2, Image as ImageIcon, Layers, Lock, User } from "lucide-react";
import CustomInput from "../../../component/config/component/customInput/CustomInput";
import { genderOptions } from "../../../config/constant";
import ManagerHierarchy from "./ManagerHierarchy";

/* ================= SECTION CARD ================= */
const SectionCard = ({ title, icon, children, color }: any) => {
  const bg = useColorModeValue("white", "gray.800");

  const colorMap: any = {
    blue: { icon: "blue.500", text: "blue.600", bg: "blue.50" },
    green: { icon: "green.500", text: "green.600", bg: "green.50" },
    purple: { icon: "purple.500", text: "purple.600", bg: "purple.50" },
    orange: { icon: "orange.500", text: "orange.600", bg: "orange.50" },
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <Box
      p={5}
      borderRadius="xl"
      bg={bg}
      boxShadow="base"
      border="1px solid"
      borderColor="gray.200"
    >
      <Flex align="center" mb={4} gap={2}>
        <Box p={2} borderRadius="md" bg={theme.bg}>
          <Icon as={icon} color={theme.icon} />
        </Box>
        <Text fontSize="lg" fontWeight="bold" color={theme.text}>
          {title}
        </Text>
      </Flex>
      {children}
    </Box>
  );
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;

const getTodayDateValue = () => {
  const today = new Date();
  return today.toISOString().slice(0, 10);
};

const isFutureDate = (value?: string) => {
  if (!value) {
    return false;
  }

  const selectedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate.getTime() > today.getTime();
};

const buildUserFormErrors = ({
  userForm,
  isSuperadmin,
  availableDepartments,
  officeLocationOptions,
  teamOptions,
  isDepartmentRequired,
}: {
  userForm: any;
  isSuperadmin: boolean;
  availableDepartments: string[];
  officeLocationOptions: { label: string; value: string }[];
  teamOptions: { label: string; value: string }[];
  isDepartmentRequired: boolean;
}) => {
  const errors: Record<string, string> = {};
  const trimmedCode = String(userForm.code || "").trim();
  const trimmedName = String(userForm.name || "").trim();
  const trimmedEmail = String(userForm.email || "").trim().toLowerCase();
  const trimmedMobile = String(userForm.mobileNumber || "").trim();
  const trimmedDepartment = String(userForm.department || "").trim();
  const trimmedTeam = String(userForm.team || "").trim();
  const trimmedOfficeLocationId = String(userForm.officeLocationId || "").trim();
  const normalizedRole = String(userForm.role || "").trim().toLowerCase();
  const isCompanyAdminRole = normalizedRole === "admin";
  const isHrRole = normalizedRole === "hradmin" || normalizedRole === "hr";
  const hrScope = userForm.hrScope || {};
  const trimmedPassword = String(userForm.password || "");
  const trimmedConfirmPassword = String(userForm.confirmPassword || "");
  const requiresEmployeeCode = !isCompanyAdminRole;

  if (requiresEmployeeCode && !trimmedCode) {
    errors.code = "Employee code is required.";
  }

  if (!trimmedName) {
    errors.name = "Full name is required.";
  }

  if (!trimmedEmail) {
    errors.email = "Email is required for account access.";
  } else if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (trimmedMobile && !PHONE_PATTERN.test(trimmedMobile)) {
    errors.mobileNumber = "Enter a valid mobile number.";
  }

  if (!String(userForm.role || "").trim()) {
    errors.role = "Role is required.";
  }

  if (normalizedRole === "hr" && (!Array.isArray(hrScope.departments) || hrScope.departments.length === 0)) {
    errors.hrScopeDepartments = "Select at least one department for scoped HR.";
  }

  if (isSuperadmin && !String(userForm.companyId || "").trim()) {
    errors.companyId = "Company selection is required.";
  }

  if (isDepartmentRequired && !trimmedDepartment) {
    errors.department = "Department is required for this role.";
  } else if (
    !isHrRole &&
    trimmedDepartment &&
    availableDepartments.length > 0 &&
    !availableDepartments.includes(trimmedDepartment)
  ) {
    errors.department = "Select a valid department for the chosen company.";
  }

  if (!isHrRole && trimmedTeam && !trimmedDepartment) {
    errors.team = "Select a department before assigning a team.";
  } else if (
    !isHrRole &&
    trimmedTeam &&
    teamOptions.length > 0 &&
    !teamOptions.some((team) => team.value === trimmedTeam)
  ) {
    errors.team = "Select a valid team for the chosen department.";
  }

  if (
    !isHrRole &&
    trimmedOfficeLocationId &&
    officeLocationOptions.length > 0 &&
    !officeLocationOptions.some((location) => location.value === trimmedOfficeLocationId)
  ) {
    errors.officeLocationId = "Select a valid office location for the chosen company.";
  }

  if (trimmedPassword && !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(trimmedPassword)) {
    errors.password =
      "Password must be 8+ characters with uppercase, lowercase, and a number.";
  }

  if (trimmedPassword && trimmedPassword !== trimmedConfirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!userForm.id && !trimmedPassword && userForm.sendInvite === false) {
    errors.password = "Enter a password or send a setup invite.";
  }

  if (userForm.dateOfBirth && isFutureDate(userForm.dateOfBirth)) {
    errors.dateOfBirth = "Date of birth cannot be in the future.";
  }

  return errors;
};

/* ================= MAIN ================= */
const UserDrawer = ({
  isOpen,
  onClose,
  userForm,
  setUserForm,
  roleOptions,
  isSuperadmin,
  filteredCompanies,
  currentCompanyDepartments,
  departmentRecords = [],
  officeLocationOptions = [],
  borderColor,
  muted,
  currentCompanyName,
  managerCompanyId,
  updateRole,
  setManagerSelection,
  onSubmit,
  loading,
  canAssignManagers = true,
}: any) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const activeDepartmentRecords = Array.isArray(departmentRecords) ? departmentRecords : [];
  const departmentNamesFromRecords = activeDepartmentRecords
    .map((department: any) => department?.departmentName)
    .filter(Boolean);
  const availableDepartments = isSuperadmin
    ? departmentNamesFromRecords.length
      ? departmentNamesFromRecords
      : filteredCompanies.find((company: any) => company?._id === userForm.companyId)?.departments || []
    : departmentNamesFromRecords.length
      ? departmentNamesFromRecords
      : currentCompanyDepartments || [];
  const selectedDepartmentRecord = activeDepartmentRecords.find(
    (department: any) =>
      String(department?.departmentName || "").toLowerCase() ===
      String(userForm.department || "").toLowerCase()
  );
  const teamOptions = (Array.isArray(selectedDepartmentRecord?.teams) ? selectedDepartmentRecord.teams : [])
    .filter((team: any) => team?.isActive !== false)
    .map((team: any) => ({
      label: team.name,
      value: team.name,
    }));
  const hrScope = userForm.hrScope || {
    departments: [],
    teams: [],
    officeLocationIds: [],
  };
  const selectedHrScopeDepartments = Array.isArray(hrScope.departments) ? hrScope.departments : [];
  const hrScopeTeamOptions = activeDepartmentRecords
    .filter((department: any) =>
      selectedHrScopeDepartments.some(
        (name: string) =>
          String(name || "").toLowerCase() ===
          String(department?.departmentName || "").toLowerCase()
      )
    )
    .flatMap((department: any) =>
      (Array.isArray(department?.teams) ? department.teams : [])
        .filter((team: any) => team?.isActive !== false)
        .map((team: any) => ({
          label: `${team.name} (${department.departmentName})`,
          value: team.name,
        }))
    )
    .filter(
      (team: any, index: number, arr: any[]) =>
        arr.findIndex((item: any) => item.value.toLowerCase() === team.value.toLowerCase()) === index
    );
  const isHrAdminRole = String(userForm.role || "").trim().toLowerCase() === "hradmin";
  const isScopedHrRole = String(userForm.role || "").trim().toLowerCase() === "hr";
  const isHrRole = isHrAdminRole || isScopedHrRole;
  const isDepartmentRequired =
    userForm.role === "departmenthead" || /^l\d+-manager$/i.test(String(userForm.role || ""));
  const validationErrors = useMemo(
    () =>
      buildUserFormErrors({
        userForm,
        isSuperadmin,
        availableDepartments,
        officeLocationOptions,
        teamOptions,
        isDepartmentRequired,
      }),
    [
      availableDepartments,
      isDepartmentRequired,
      isSuperadmin,
      officeLocationOptions,
      teamOptions,
      userForm,
    ]
  );

  useEffect(() => {
    if (userForm?.pic?.file instanceof File) {
      const url = URL.createObjectURL(userForm.pic.file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }

    setPreview(userForm?.pic?.url || null);
  }, [userForm?.pic]);

  const todayDate = getTodayDateValue();
  const isCompanyAdminRole = String(userForm.role || "").trim().toLowerCase() === "admin";
  const roleTitle = isCompanyAdminRole
    ? "Company Admin"
    : isHrAdminRole
      ? "HR Admin"
      : isScopedHrRole
        ? "HR"
        : "Employee";
  const drawerTitle = userForm.id
    ? `Edit ${roleTitle}`
    : `Add ${roleTitle}`;
  const submitLabel = userForm.id
    ? `Update ${roleTitle}`
    : `Create ${roleTitle}`;
  const roleLabel =
    roleOptions.find((roleOption: any) => roleOption.value === userForm.role)?.label ||
    userForm.role;

  useEffect(() => {
    if (!isOpen) {
      setSubmitAttempted(false);
    }
  }, [isOpen]);

  const handleValidatedSubmit = async () => {
    setSubmitAttempted(true);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    await onSubmit();
  };

  return (
    <Drawer isOpen={isOpen} placement="right" size="xl" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent bg={useColorModeValue("gray.50", "gray.900")}>
        <DrawerCloseButton />

        {/* HEADER */}
        <DrawerHeader borderBottom="1px solid" borderColor="gray.200">
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">
              {drawerTitle}
            </Text>

            <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
              {roleLabel}
            </Badge>
          </Flex>
        </DrawerHeader>

        {/* BODY */}
        <DrawerBody>
          <VStack align="stretch" spacing={6}>
            {!isCompanyAdminRole && (
              <SectionCard title="Profile Image" icon={ImageIcon} color="purple">
                {preview ? (
                  <Flex direction="column" gap={4}>
                    <Box
                      borderRadius="lg"
                      overflow="hidden"
                      border="1px solid"
                      borderColor="gray.200"
                      maxW="200px"
                    >
                      <img
                        src={preview}
                        alt="preview"
                        style={{
                          width: "100%",
                          height: "150px",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() =>
                        setUserForm((p: any) => ({
                          ...p,
                          pic: {
                            ...p.pic,
                            file: null,
                            url: "",
                            isDeleted: 1,
                            isAdd: 0,
                          },
                        }))
                      }
                    >
                      Remove Image
                    </Button>
                  </Flex>
                ) : (
                  <CustomInput
                    type="file-drag"
                    name="pic"
                    accept="image/*"
                    onChange={(e: any) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        return;
                      }

                      setUserForm((p: any) => ({
                        ...p,
                        pic: {
                          ...p.pic,
                          file,
                          isAdd: 1,
                          isDeleted: 0,
                          url: "",
                        },
                      }));
                    }}
                  />
                )}
              </SectionCard>
            )}

            {/* EMPLOYEE */}
            <SectionCard title={`${roleTitle} Details`} icon={User} color="blue">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {!isCompanyAdminRole && (
                  <>
                    <CustomInput
                      label="Employee Code"
                      name="code"
                      placeholder="Enter employee code"
                      value={userForm.code}
                      error={validationErrors.code}
                      showError={submitAttempted}
                      onChange={(e: any) =>
                        setUserForm((p: any) => ({ ...p, code: e.target.value }))
                      }
                    />
                    <CustomInput
                      label="Profile ID"
                      name="profileId"
                      placeholder="Generated automatically after creation"
                      value={userForm.profileId || ""}
                      disabled
                      readOnly
                    />
                  </>
                )}
                <CustomInput
                  label="Full Name"
                  name="name"
                  placeholder="Enter full name"
                  value={userForm.name}
                  error={validationErrors.name}
                  showError={submitAttempted}
                  onChange={(e: any) =>
                    setUserForm((p: any) => ({ ...p, name: e.target.value }))
                  }
                />
                <CustomInput
                  label="Email"
                  name="email"
                  placeholder="Enter email address"
                  value={userForm.email}
                  error={validationErrors.email}
                  showError={submitAttempted}
                  onChange={(e: any) =>
                    setUserForm((p: any) => ({ ...p, email: e.target.value }))
                  }
                />
                {!isCompanyAdminRole && (
                  <>
                    <CustomInput
                      label="Phone Number (Optional)"
                      name="mobileNumber"
                      placeholder="Enter mobile number"
                      value={userForm.mobileNumber}
                      error={validationErrors.mobileNumber}
                      showError={submitAttempted}
                      onChange={(e: any) =>
                        setUserForm((p: any) => ({ ...p, mobileNumber: e.target.value }))
                      }
                    />
                    <CustomInput
                      label="Designation (Optional)"
                      name="designation"
                      placeholder="Enter designation"
                      value={userForm.designation}
                      error={validationErrors.designation}
                      showError={submitAttempted}
                      onChange={(e: any) =>
                        setUserForm((p: any) => ({ ...p, designation: e.target.value }))
                      }
                    />
                    <CustomInput
                      label="Date of Birth"
                      name="dateOfBirth"
                      type="date"
                      maxDate={todayDate}
                      value={userForm.dateOfBirth}
                      error={validationErrors.dateOfBirth}
                      showError={submitAttempted}
                      onChange={(e: any) =>
                        setUserForm((p: any) => ({ ...p, dateOfBirth: e.target.value }))
                      }
                    />
                    <CustomInput
                      type="select"
                      label="Gender"
                      name="gender"
                      placeholder="Select gender"
                      value={genderOptions.find((option: any) => option.value === userForm.gender) || null}
                      error={validationErrors.gender}
                      showError={submitAttempted}
                      onChange={(option: any) =>
                        setUserForm((p: any) => ({ ...p, gender: option?.value ?? "" }))
                      }
                      options={genderOptions}
                    />
                    <CustomInput
                      label="Joining Date"
                      name="joiningDate"
                      type="date"
                      value={userForm.joiningDate}
                      onChange={(e: any) =>
                        setUserForm((p: any) => ({ ...p, joiningDate: e.target.value }))
                      }
                    />
                  </>
                )}
                <CustomInput
                  type="select"
                  label="Role"
                  name="role"
                  placeholder="Select role"
                  value={roleOptions.find((r: any) => r.value === userForm.role) || null}
                  error={validationErrors.role}
                  showError={submitAttempted}
                  onChange={(option: any) => updateRole(option?.value || "user")}
                  options={roleOptions}
                />
                {!isCompanyAdminRole && (
                  <>
                    {!isHrRole ? (
                      <>
                        <CustomInput
                          type="select"
                          label="Department"
                          name="department"
                          required={isDepartmentRequired}
                          placeholder="Select department"
                          value={
                            userForm.department
                              ? { label: userForm.department, value: userForm.department }
                              : null
                          }
                          error={validationErrors.department}
                          showError={submitAttempted}
                          onChange={(option: any) =>
                            setUserForm((p: any) => ({
                              ...p,
                              department: option?.value || "",
                              team: "",
                            }))
                          }
                          options={availableDepartments.map((department: string) => ({
                            label: department,
                            value: department,
                          }))}
                        />
                        <CustomInput
                          type="select"
                          label="Team (Optional)"
                          name="team"
                          placeholder={
                            userForm.department
                              ? teamOptions.length
                                ? "Select team"
                                : "No teams in selected department"
                              : "Select department first"
                          }
                          value={
                            userForm.team
                              ? { label: userForm.team, value: userForm.team }
                              : null
                          }
                          error={validationErrors.team}
                          showError={submitAttempted}
                          isClear
                          disabled={!userForm.department || teamOptions.length === 0}
                          onChange={(option: any) =>
                            setUserForm((p: any) => ({ ...p, team: option?.value || "" }))
                          }
                          options={teamOptions}
                        />
                        <CustomInput
                          type="select"
                          label="Office Location"
                          name="officeLocationId"
                          placeholder="Select office location"
                          value={
                            officeLocationOptions.find(
                              (location: any) => location.value === userForm.officeLocationId
                            ) || null
                          }
                          error={validationErrors.officeLocationId}
                          showError={submitAttempted}
                          isClear
                          onChange={(option: any) =>
                            setUserForm((p: any) => ({ ...p, officeLocationId: option?.value || "" }))
                          }
                          options={officeLocationOptions}
                          isSearchable
                        />
                      </>
                    ) : null}
                    <CustomInput
                      label="City"
                      name="city"
                      placeholder="Enter city"
                      value={userForm.city}
                      onChange={(e: any) =>
                        setUserForm((p: any) => ({ ...p, city: e.target.value }))
                      }
                    />
                    <CustomInput
                      label="State"
                      name="state"
                      placeholder="Enter state"
                      value={userForm.state}
                      onChange={(e: any) =>
                        setUserForm((p: any) => ({ ...p, state: e.target.value }))
                      }
                    />
                  </>
                )}
              </SimpleGrid>

            </SectionCard>

            <SectionCard title="Authentication" icon={Lock} color="green">
              {userForm.id ? (
                <Text fontSize="sm" color={muted}>
                  Existing accounts use email and password access. Use status controls from the table to activate or deactivate access.
                </Text>
              ) : (
                <VStack align="stretch" spacing={4}>
                  <Text fontSize="sm" color={muted}>
                    {isCompanyAdminRole
                      ? "Leave password blank to generate a setup link for this company admin. If SMTP is unavailable, the setup link will be shown after saving."
                      : "Leave password blank to send a setup link. Enter a password only when you want to set initial access manually."}
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text mb={2} fontSize="sm" fontWeight="600">
                        Initial Password
                      </Text>
                      <Input
                        type="password"
                        value={userForm.password || ""}
                        placeholder="Optional"
                        onChange={(event) =>
                          setUserForm((p: any) => ({ ...p, password: event.target.value }))
                        }
                      />
                      {submitAttempted && validationErrors.password ? (
                        <Text mt={1} fontSize="xs" color="red.500">
                          {validationErrors.password}
                        </Text>
                      ) : null}
                    </Box>
                    <Box>
                      <Text mb={2} fontSize="sm" fontWeight="600">
                        Confirm Password
                      </Text>
                      <Input
                        type="password"
                        value={userForm.confirmPassword || ""}
                        placeholder="Confirm optional password"
                        onChange={(event) =>
                          setUserForm((p: any) => ({
                            ...p,
                            confirmPassword: event.target.value,
                          }))
                        }
                      />
                      {submitAttempted && validationErrors.confirmPassword ? (
                        <Text mt={1} fontSize="xs" color="red.500">
                          {validationErrors.confirmPassword}
                        </Text>
                      ) : null}
                    </Box>
                  </SimpleGrid>
                  <Checkbox
                    isChecked={userForm.sendInvite !== false}
                    onChange={(event) =>
                      setUserForm((p: any) => ({ ...p, sendInvite: event.target.checked }))
                    }
                    isDisabled={Boolean(userForm.password)}
                  >
                    {isCompanyAdminRole
                      ? "Send setup invite email when no password is provided"
                      : "Send setup invite email when no password is provided"}
                  </Checkbox>
                </VStack>
              )}
            </SectionCard>

            {/* COMPANY */}
            <SectionCard title="Company" icon={Building2} color="purple">
              {isSuperadmin ? (
                <VStack align="stretch" spacing={4}>
                  <CustomInput
                    type="select"
                    label="Select company"
                    name="companyId"
                    placeholder="Select company"
                    value={
                      filteredCompanies
                        .map((c: any) => ({ label: c.company_name, value: c._id }))
                        .find((option: any) => option.value === userForm.companyId) || null
                    }
                    error={validationErrors.companyId}
                    showError={submitAttempted}
                    onChange={(option: any) =>
                      setUserForm((p: any) => ({
                        ...p,
                        companyId: option?.value || "",
                        department: "",
                        team: "",
                        hrScope: {
                          departments: [],
                          teams: [],
                          officeLocationIds: [],
                        },
                        officeLocationId: "",
                      }))
                    }
                    options={filteredCompanies.map((c: any) => ({
                      label: c.company_name,
                      value: c._id,
                    }))}
                    isSearchable
                  />
                </VStack>
              ) : (
                <Box p={3} borderRadius="md" bg="gray.100">
                  {currentCompanyName}
                </Box>
              )}
            </SectionCard>

            {isScopedHrRole ? (
              <SectionCard title="HR Scope" icon={Building2} color="orange">
                <VStack align="stretch" spacing={4}>
                  <Text fontSize="sm" color={muted}>
                    This HR account can manage employees and managers only inside the selected scope.
                  </Text>
                  <CustomInput
                    type="select"
                    label="Departments"
                    name="hrScopeDepartments"
                    placeholder="Select departments"
                    value={selectedHrScopeDepartments.map((department: string) => ({
                      label: department,
                      value: department,
                    }))}
                    error={validationErrors.hrScopeDepartments}
                    showError={submitAttempted}
                    isMulti
                    onChange={(options: any) =>
                      setUserForm((p: any) => ({
                        ...p,
                        hrScope: {
                          ...(p.hrScope || {}),
                          departments: (Array.isArray(options) ? options : []).map((option: any) => option.value),
                          teams: [],
                        },
                      }))
                    }
                    options={availableDepartments.map((department: string) => ({
                      label: department,
                      value: department,
                    }))}
                  />
                  <CustomInput
                    type="select"
                    label="Teams (Optional)"
                    name="hrScopeTeams"
                    placeholder={
                      selectedHrScopeDepartments.length
                        ? "Select teams to narrow scope"
                        : "Select departments first"
                    }
                    value={(Array.isArray(hrScope.teams) ? hrScope.teams : []).map((team: string) => ({
                      label: team,
                      value: team,
                    }))}
                    isMulti
                    disabled={selectedHrScopeDepartments.length === 0 || hrScopeTeamOptions.length === 0}
                    onChange={(options: any) =>
                      setUserForm((p: any) => ({
                        ...p,
                        hrScope: {
                          ...(p.hrScope || {}),
                          teams: (Array.isArray(options) ? options : []).map((option: any) => option.value),
                        },
                      }))
                    }
                    options={hrScopeTeamOptions}
                  />
                  <CustomInput
                    type="select"
                    label="Office Locations (Optional)"
                    name="hrScopeOfficeLocations"
                    placeholder="Select locations to narrow scope"
                    value={officeLocationOptions.filter((location: any) =>
                      (Array.isArray(hrScope.officeLocationIds) ? hrScope.officeLocationIds : []).includes(location.value)
                    )}
                    isMulti
                    onChange={(options: any) =>
                      setUserForm((p: any) => ({
                        ...p,
                        hrScope: {
                          ...(p.hrScope || {}),
                          officeLocationIds: (Array.isArray(options) ? options : []).map((option: any) => option.value),
                        },
                      }))
                    }
                    options={officeLocationOptions}
                  />
                </VStack>
              </SectionCard>
            ) : null}

            {/* HIERARCHY */}
            {!isCompanyAdminRole && !isHrRole && (
              <SectionCard title="Manager Hierarchy" icon={Layers} color="orange">
                {!canAssignManagers ? (
                  <Text fontSize="sm" color={muted}>
                    Manager assignment is disabled for this account.
                  </Text>
                ) : null}
                <ManagerHierarchy
                  managers={userForm.managers}
                  role={userForm.role}
                  managerCompanyId={managerCompanyId}
                  createCompany={userForm.createCompany}
                  muted={muted}
                  borderColor={borderColor}
                  onChange={setManagerSelection}
                  isDisabled={!canAssignManagers}
                />
              </SectionCard>
            )}

          </VStack>
        </DrawerBody>

        {/* FOOTER */}
        <DrawerFooter borderTop="1px solid" borderColor="gray.200">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleValidatedSubmit} isLoading={loading}>
            {submitLabel}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default UserDrawer;
