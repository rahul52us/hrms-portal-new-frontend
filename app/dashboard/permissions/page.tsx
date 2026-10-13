"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import {
  PERMISSION_KEYS,
  hasPermission,
} from "@/app/config/utils/permissions";
import stores from "@/app/store/stores";
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Tabs,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  FiBarChart2,
  FiDatabase,
  FiGrid,
  FiShield,
  FiSearch,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";

function buildPermissionDraft(
  catalog: any[],
  source: Record<string, boolean> = {}
) {
  return catalog.reduce<Record<string, boolean>>((acc, item) => {
    acc[item.key] = Boolean(source?.[item.key]);
    return acc;
  }, {});
}

const getCategoryStyle = (category: string) => {
  switch (category) {
    case "Navigation":
      return {
        Icon: FiGrid,
        gradient: "linear(to-r, teal.400, cyan.500)",
      };
    case "Users":
      return {
        Icon: FiUsers,
        gradient: "linear(to-r, purple.400, pink.500)",
      };
    case "Courses":
      return {
        Icon: FiBarChart2,
        gradient: "linear(to-r, blue.400, indigo.500)",
      };
    case "Batches":
      return {
        Icon: FiDatabase,
        gradient: "linear(to-r, pink.400, red.500)",
      };
    case "Permissions":
      return {
        Icon: FiShield,
        gradient: "linear(to-r, yellow.400, orange.500)",
      };
    default:
      return {
        Icon: FiGrid,
        gradient: "linear(to-r, teal.400, cyan.500)",
      };
  }
};

const PermissionsPage = observer(() => {
  const toast = useToast();
  const { auth, companyStore, userStore } = stores;

  const role = String(auth.role || auth.user?.role || "").toLowerCase();
  const canManagePermissions =
    ["superadmin", "admin", "hradmin"].includes(role) &&
    hasPermission(auth.user, PERMISSION_KEYS.MANAGE_PERMISSIONS);
  const canEditRoleDefaults = canManagePermissions && ["superadmin", "admin"].includes(role);
  const companyId = companyStore.getActiveCompanyId();

  const [selectedRole, setSelectedRole] = useState("admin");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedAssignmentUserId, setSelectedAssignmentUserId] = useState("");
  const [assignmentRole, setAssignmentRole] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [roleDraft, setRoleDraft] = useState<Record<string, boolean>>({});
  const [userDraft, setUserDraft] = useState<Record<string, boolean | undefined>>({});

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBgColor = useColorModeValue("white", "gray.800");
  const softCardBg = useColorModeValue("gray.50", "gray.750");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const subtleBorderColor = useColorModeValue("gray.100", "gray.700");

  const headerBgGradient = useColorModeValue(
    "linear(to-r, violet.50, teal.50)",
    "linear(to-r, gray.800, gray.700)"
  );
  const headerBorderColor = useColorModeValue("violet.100", "gray.700");

  const textColor = useColorModeValue("gray.900", "white");
  const textSecondaryColor = useColorModeValue("gray.600", "gray.400");
  const textMutedColor = useColorModeValue("gray.500", "gray.500");

  const tableHeaderBg = useColorModeValue("gray.50", "gray.700");
  const tableRowHoverBg = useColorModeValue("gray.50", "gray.700");
  const categoryHeaderBg = useColorModeValue("gray.50", "gray.700");

  const infoBoxBgGradient = useColorModeValue(
    "linear(to-r, amber.50, yellow.50)",
    "linear(to-r, gray.700, gray.600)"
  );
  const infoBoxBorderColor = useColorModeValue("amber.100", "gray.600");
  const infoBoxTextColor = useColorModeValue("amber.700", "amber.300");

  const badgeBgColor = useColorModeValue("teal.100", "teal.900");
  const badgeTextColor = useColorModeValue("teal.700", "teal.300");
  const userBadgeBgColor = useColorModeValue("orange.100", "orange.900");
  const userBadgeTextColor = useColorModeValue("orange.700", "orange.300");

  const selectBgColor = useColorModeValue("white", "gray.700");
  const selectBorderColor = useColorModeValue("gray.200", "gray.600");

  const dashedBorderColor = useColorModeValue("gray.200", "gray.700");
  const emptyStateBgColor = useColorModeValue("gray.50", "gray.800");
  const emptyStateTextColor = useColorModeValue("gray.400", "gray.500");

  const switchOffBg = useColorModeValue("gray.200", "gray.600");
  const switchKnobBg = useColorModeValue("white", "gray.50");

  useEffect(() => {
    if (!canManagePermissions) return;

    if (role === "superadmin") {
      companyStore.getManagedCompanies().catch(() => undefined);
      return;
    }

    companyStore.initializeCompanyContext();
  }, [canManagePermissions, companyStore, role]);

  useEffect(() => {
    if (!companyId || !canManagePermissions) return;

    userStore.fetchPermissionConfig(companyId).catch(() => undefined);
    userStore
      .fetchUsers({
        page: 1,
        limit: 100,
        companyId,
      })
      .catch(() => undefined);
  }, [canManagePermissions, companyId, userStore]);

  const config = userStore.permissionConfig;
  const catalog = config?.catalog || [];
  const permissionDependencies = config?.permissionDependencies || {};
  const roles = config?.roles || [];
  const assignmentRoles = config?.assignmentRoles || [];
  const individualOverridePermissionKeys = config?.individualOverridePermissionKeys || [];

  const roleLabels = useMemo(
    () =>
      new Map(
        [...roles, ...assignmentRoles].map((item: any) => [item.value, item.label])
      ),
    [assignmentRoles, roles]
  );

  const assignmentUsers = useMemo(
    () =>
      userStore.users.filter(
        (user: any) =>
          ["user", "hr", "departmenthead"].includes(
            String(user?.role || "").toLowerCase()
          )
      ),
    [userStore.users]
  );

  const selectedAssignmentUser = useMemo(
    () =>
      assignmentUsers.find((user: any) => user._id === selectedAssignmentUserId) ||
      null,
    [assignmentUsers, selectedAssignmentUserId]
  );

  const configurableUsers = useMemo(
    () =>
      userStore.users.filter((user: any) => {
        const targetRole = String(user?.role || "").toLowerCase();
        if (targetRole === "superadmin") return false;
        if (role === "hradmin" && targetRole === "admin") return false;
        return true;
      }),
    [role, userStore.users]
  );

  const selectedUser = useMemo(
    () =>
      configurableUsers.find((user: any) => user._id === selectedUserId) ||
      null,
    [configurableUsers, selectedUserId]
  );

  const groupedCatalog = useMemo(() => {
    return catalog.reduce((acc: Record<string, any[]>, item: any) => {
      const category = item.category || "Miscellaneous";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [catalog]);

  const roleGroupedCatalog = useMemo(() => {
    const selectedRoleOption = roles.find((item: any) => item.value === selectedRole);
    const allowed = new Set(selectedRoleOption?.allowedPermissionKeys || []);
    return Object.entries(groupedCatalog).reduce<Record<string, any[]>>(
      (acc, [category, permissions]) => {
        const filtered = (permissions as any[]).filter((permission) =>
          allowed.has(permission.key)
        );
        if (filtered.length) acc[category] = filtered;
        return acc;
      },
      {}
    );
  }, [groupedCatalog, roles, selectedRole]);

  const userGroupedCatalog = useMemo(() => {
    const permissionRoles = [selectedUser?.role, selectedUser?.accessRole].filter(Boolean);
    const allowed = new Set(individualOverridePermissionKeys);
    permissionRoles.forEach((permissionRole) => {
      const roleOption = [...roles, ...assignmentRoles].find(
        (item: any) => item.value === permissionRole
      );
      (roleOption?.allowedPermissionKeys || []).forEach((key: string) => allowed.add(key));
    });
    return Object.entries(groupedCatalog).reduce<Record<string, any[]>>(
      (acc, [category, permissions]) => {
        const filtered = (permissions as any[]).filter((permission) =>
          allowed.has(permission.key)
        );
        if (filtered.length) acc[category] = filtered;
        return acc;
      },
      {}
    );
  }, [assignmentRoles, groupedCatalog, individualOverridePermissionKeys, roles, selectedUser]);

  const userEffectiveDraft = useMemo(() => {
    const next: Record<string, boolean> = {
      ...(selectedUser?.rolePermissionDefaults || {}),
    };
    Object.entries(userDraft).forEach(([key, value]) => {
      if (typeof value === "boolean") next[key] = value;
    });

    let changed = true;
    while (changed) {
      changed = false;
      Object.entries(permissionDependencies).forEach(([permissionKey, dependencies]) => {
        if (!next[permissionKey]) return;
        if ((dependencies as string[]).some((dependencyKey) => !next[dependencyKey])) {
          next[permissionKey] = false;
          changed = true;
        }
      });
    }
    return next;
  }, [permissionDependencies, selectedUser, userDraft]);

  useEffect(() => {
    if (!selectedRole && roles[0]?.value) {
      setSelectedRole(roles[0].value);
    }
  }, [roles, selectedRole]);

  useEffect(() => {
    setRoleDraft(
      buildPermissionDraft(catalog, config?.rolePermissions?.[selectedRole] || {})
    );
  }, [catalog, config?.rolePermissions, selectedRole]);

  useEffect(() => {
    const explicitOverrides = Object.entries(
      selectedUser?.permissionOverrides || {}
    ).reduce<Record<string, boolean>>((acc, [key, value]) => {
      if (typeof value === "boolean") acc[key] = value;
      return acc;
    }, {});
    setUserDraft(explicitOverrides);
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUserId && !selectedUser) {
      setSelectedUserId("");
    }
  }, [selectedUser, selectedUserId]);

  useEffect(() => {
    setAssignmentRole(String(selectedAssignmentUser?.accessRole || ""));
  }, [selectedAssignmentUser]);

  useEffect(() => {
    if (selectedAssignmentUserId && !selectedAssignmentUser) {
      setSelectedAssignmentUserId("");
    }
  }, [selectedAssignmentUser, selectedAssignmentUserId]);

  const handleRoleToggle = (key: string, value: boolean) => {
    setRoleDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleUserOverride = (key: string, value: string) => {
    setUserDraft((prev) => {
      const next = { ...prev };
      if (value === "inherit") {
        delete next[key];
      } else {
        next[key] = value === "allow";
      }
      return next;
    });
  };

  const saveRolePermissions = async () => {
    try {
      await userStore.updateRolePermissions(selectedRole, roleDraft, companyId);
      await auth.fetchUser();

      toast({
        title: "Role permissions updated",
        status: "success",
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: "Unable to update role permissions",
        description: error?.error || error?.message || "Please try again.",
        status: "error",
        duration: 4000,
      });
    }
  };

  const saveUserPermissions = async () => {
    if (!selectedUserId) return;

    try {
      const explicitOverrides = Object.entries(userDraft).reduce<Record<string, boolean>>(
        (acc, [key, value]) => {
          if (typeof value === "boolean") acc[key] = value;
          return acc;
        },
        {}
      );
      await userStore.updateUserPermissions(selectedUserId, explicitOverrides);

      if (selectedUserId === auth.user?._id) {
        await auth.fetchUser();
      }

      toast({
        title: "User overrides updated",
        status: "success",
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: "Unable to update user overrides",
        description: error?.error || error?.message || "Please try again.",
        status: "error",
        duration: 4000,
      });
    }
  };

  const saveRoleAssignment = async () => {
    if (!selectedAssignmentUserId) return;

    try {
      await userStore.updateUserAccessRole(
        selectedAssignmentUserId,
        assignmentRole,
        companyId
      );
      setSelectedUserId("");
      toast({
        title: assignmentRole ? "Access role assigned" : "Access role removed",
        description: "Individual permission overrides were reset for this employee.",
        status: "success",
        duration: 3500,
      });
    } catch (error: any) {
      toast({
        title: "Unable to update role assignment",
        description: error?.error || error?.message || "Please try again.",
        status: "error",
        duration: 4000,
      });
    }
  };

  const searchAssignmentUsers = async () => {
    if (!companyId) return;
    setSelectedAssignmentUserId("");
    await userStore.fetchUsers({
      page: 1,
      limit: 100,
      companyId,
      search: assignmentSearch.trim(),
    }).catch((error: any) => {
      toast({
        title: "Unable to search employees",
        description: error?.error || error?.message || "Please try again.",
        status: "error",
      });
    });
  };

  const CustomSwitch = ({
    checked,
    onChange,
    gradient,
    ariaLabel,
    compact = false,
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
    gradient: string;
    ariaLabel: string;
    compact?: boolean;
  }) => {
    const trackW = compact ? "42px" : "48px";
    const trackH = compact ? "24px" : "28px";
    const knobSize = compact ? "18px" : "20px";
    const knobTranslate = compact ? "18px" : "20px";

    return (
      <Box
        as="label"
        position="relative"
        display="inline-flex"
        alignItems="center"
        cursor="pointer"
        flexShrink={0}
        rounded="full"
        _focusWithin={{
          boxShadow: "0 0 0 3px rgba(20, 184, 166, 0.35)",
        }}
      >
        <Box
          as="input"
          type="checkbox"
          checked={checked}
          aria-label={ariaLabel}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.checked)
          }
          position="absolute"
          opacity={0}
          w="1px"
          h="1px"
        />

        <Box
          w={trackW}
          h={trackH}
          rounded="full"
          bg={checked ? undefined : switchOffBg}
          bgGradient={checked ? gradient : undefined}
          transition="all 0.2s ease"
          boxShadow={checked ? "inner" : "none"}
        />

        <Box
          position="absolute"
          left="3px"
          top="3px"
          w={knobSize}
          h={knobSize}
          rounded="full"
          bg={switchKnobBg}
          shadow="sm"
          transform={checked ? `translateX(${knobTranslate})` : "translateX(0)"}
          transition="all 0.2s ease"
        />
      </Box>
    );
  };

  const PermissionStatus = ({ checked }: { checked: boolean }) => (
    <Text
      minW="72px"
      fontSize="xs"
      fontWeight="700"
      textAlign="left"
      color={checked ? "green.500" : textMutedColor}
    >
      {checked ? "Allowed" : "Not allowed"}
    </Text>
  );

  const renderDesktopPermissionTable = (
    draft: Record<string, boolean>,
    onToggle: (key: string, value: boolean) => void,
    permissionGroups: Record<string, any[]> = groupedCatalog
  ) => (
    <Box display={{ base: "none", md: "block" }}>
      <TableContainer borderWidth="1px" borderColor={subtleBorderColor} rounded="2xl">
        <Table variant="simple">
          <Thead>
            <Tr bg={tableHeaderBg}>
              <Th width="30%" color={textColor} borderColor={borderColor}>
                Permission
              </Th>
              <Th width="50%" color={textColor} borderColor={borderColor}>
                Description
              </Th>
              <Th
                width="20%"
                textAlign="center"
                color={textColor}
                borderColor={borderColor}
              >
                Status
              </Th>
            </Tr>
          </Thead>

          <Tbody>
            {Object.entries(permissionGroups).map(([category, permissions]) => {
              const { Icon: CategoryIcon, gradient } = getCategoryStyle(category);
              const permissionItems = permissions as any[];

              return (
                <Fragment key={category}>
                  <Tr bg={categoryHeaderBg}>
                    <Td colSpan={3} p={3} borderColor={borderColor}>
                      <HStack spacing={3}>
                        <Box
                          display="flex"
                          h="8"
                          w="8"
                          flexShrink={0}
                          alignItems="center"
                          justifyContent="center"
                          rounded="xl"
                          bgGradient={gradient}
                          color="white"
                        >
                          <Icon as={CategoryIcon} boxSize={4} />
                        </Box>

                        <Box>
                          <Text fontWeight="bold" fontSize="md" color={textColor}>
                            {category}
                          </Text>
                          <Text fontSize="xs" color={textMutedColor}>
                            {permissionItems.length} permission
                            {permissionItems.length !== 1 ? "s" : ""}
                          </Text>
                        </Box>
                      </HStack>
                    </Td>
                  </Tr>

                  {permissionItems.map((permission: any) => (
                    <Tr key={permission.key} _hover={{ bg: tableRowHoverBg }}>
                      <Td borderColor={borderColor}>
                        <Text fontWeight="semibold" color={textColor}>
                          {permission.label}
                        </Text>
                      </Td>

                      <Td borderColor={borderColor}>
                        <Text fontSize="sm" color={textSecondaryColor}>
                          {permission.description}
                        </Text>
                      </Td>

                      <Td textAlign="center" borderColor={borderColor}>
                        <HStack justify="center" spacing={3}>
                          <PermissionStatus
                            checked={Boolean(draft?.[permission.key])}
                          />
                          <CustomSwitch
                            checked={Boolean(draft?.[permission.key])}
                            onChange={(value) => onToggle(permission.key, value)}
                            gradient={gradient}
                            ariaLabel={`Toggle ${permission.label}`}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Fragment>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderMobilePermissionCards = (
    draft: Record<string, boolean>,
    onToggle: (key: string, value: boolean) => void,
    permissionGroups: Record<string, any[]> = groupedCatalog
  ) => (
    <VStack display={{ base: "flex", md: "none" }} spacing={3} align="stretch">
      {Object.entries(permissionGroups).map(([category, permissions]) => {
        const { Icon: CategoryIcon, gradient } = getCategoryStyle(category);
        const permissionItems = permissions as any[];

        return (
          <Box
            key={category}
            bg={cardBgColor}
            borderWidth="1px"
            borderColor={borderColor}
            rounded="2xl"
            overflow="hidden"
          >
            <HStack
              spacing={3}
              px={3}
              py={3}
              bg={softCardBg}
              borderBottomWidth="1px"
              borderBottomColor={subtleBorderColor}
            >
              <Box
                display="flex"
                h="8"
                w="8"
                flexShrink={0}
                alignItems="center"
                justifyContent="center"
                rounded="xl"
                bgGradient={gradient}
                color="white"
              >
                <Icon as={CategoryIcon} boxSize={4} />
              </Box>

              <Box flex="1" minW={0}>
                <Text fontSize="sm" fontWeight="800" color={textColor} noOfLines={1}>
                  {category}
                </Text>
                <Text fontSize="xs" color={textMutedColor}>
                  {permissionItems.length} permission
                  {permissionItems.length !== 1 ? "s" : ""}
                </Text>
              </Box>
            </HStack>

            <VStack spacing={0} align="stretch">
              {permissionItems.map((permission: any, index: number) => (
                <Fragment key={permission.key}>
                  <HStack align="flex-start" spacing={3} px={3} py={3}>
                    <Box flex="1" minW={0}>
                      <Text
                        fontSize="sm"
                        fontWeight="700"
                        color={textColor}
                        lineHeight="1.25"
                      >
                        {permission.label}
                      </Text>

                      {permission.description ? (
                        <Text
                          mt={1}
                          fontSize="xs"
                          color={textSecondaryColor}
                          lineHeight="1.35"
                        >
                          {permission.description}
                        </Text>
                      ) : null}
                    </Box>

                    <VStack spacing={1} align="end" flexShrink={0}>
                      <PermissionStatus
                        checked={Boolean(draft?.[permission.key])}
                      />
                      <CustomSwitch
                        compact
                        checked={Boolean(draft?.[permission.key])}
                        onChange={(value) => onToggle(permission.key, value)}
                        gradient={gradient}
                        ariaLabel={`Toggle ${permission.label}`}
                      />
                    </VStack>
                  </HStack>

                  {index < permissionItems.length - 1 ? (
                    <Divider borderColor={subtleBorderColor} />
                  ) : null}
                </Fragment>
              ))}
            </VStack>
          </Box>
        );
      })}
    </VStack>
  );

  const renderPermissions = (
    draft: Record<string, boolean>,
    onToggle: (key: string, value: boolean) => void,
    permissionGroups: Record<string, any[]> = groupedCatalog
  ) => (
    <>
      {renderMobilePermissionCards(draft, onToggle, permissionGroups)}
      {renderDesktopPermissionTable(draft, onToggle, permissionGroups)}
    </>
  );

  const getUserOverrideState = (permissionKey: string) => {
    const explicitValue = userDraft[permissionKey];
    const inheritedValue = Boolean(
      selectedUser?.rolePermissionDefaults?.[permissionKey]
    );
    return {
      selection:
        typeof explicitValue === "boolean"
          ? explicitValue
            ? "allow"
            : "deny"
          : "inherit",
      inheritedValue,
      effectiveValue: Boolean(userEffectiveDraft[permissionKey]),
    };
  };

  const renderUserOverrideControl = (permission: any) => {
    const state = getUserOverrideState(permission.key);
    return (
      <VStack spacing={1} align={{ base: "stretch", md: "end" }} minW={{ md: "220px" }}>
        <Select
          size="sm"
          value={state.selection}
          aria-label={`Override ${permission.label}`}
          bg={selectBgColor}
          borderColor={selectBorderColor}
          onChange={(event) =>
            handleUserOverride(permission.key, event.target.value)
          }
        >
          <option value="inherit">
            Inherit ({state.inheritedValue ? "Allowed" : "Not allowed"})
          </option>
          <option value="allow">Allow</option>
          <option value="deny">Deny</option>
        </Select>
        <Text
          fontSize="xs"
          fontWeight="700"
          color={state.effectiveValue ? "green.500" : textMutedColor}
        >
          Effective: {state.effectiveValue ? "Allowed" : "Not allowed"}
        </Text>
      </VStack>
    );
  };

  const renderUserOverrides = () => (
    <VStack spacing={4} align="stretch">
      {Object.entries(userGroupedCatalog).map(([category, permissions]) => {
        const { Icon: CategoryIcon, gradient } = getCategoryStyle(category);
        const permissionItems = permissions as any[];
        return (
          <Box
            key={category}
            borderWidth="1px"
            borderColor={subtleBorderColor}
            rounded="xl"
            overflow="hidden"
          >
            <HStack spacing={3} px={4} py={3} bg={categoryHeaderBg}>
              <Box
                display="flex"
                h="8"
                w="8"
                alignItems="center"
                justifyContent="center"
                rounded="md"
                bgGradient={gradient}
                color="white"
              >
                <Icon as={CategoryIcon} boxSize={4} />
              </Box>
              <Text fontWeight="bold" color={textColor}>
                {category}
              </Text>
            </HStack>
            <VStack spacing={0} align="stretch">
              {permissionItems.map((permission: any, index: number) => (
                <Fragment key={permission.key}>
                  <Stack
                    direction={{ base: "column", md: "row" }}
                    align={{ base: "stretch", md: "center" }}
                    justify="space-between"
                    spacing={4}
                    px={4}
                    py={3}
                    _hover={{ bg: tableRowHoverBg }}
                  >
                    <Box flex="1" minW={0}>
                      <Text fontWeight="semibold" color={textColor}>
                        {permission.label}
                      </Text>
                      <Text mt={1} fontSize="sm" color={textSecondaryColor}>
                        {permission.description}
                      </Text>
                    </Box>
                    {renderUserOverrideControl(permission)}
                  </Stack>
                  {index < permissionItems.length - 1 ? (
                    <Divider borderColor={subtleBorderColor} />
                  ) : null}
                </Fragment>
              ))}
            </VStack>
          </Box>
        );
      })}
    </VStack>
  );

  return (
    <PermissionGate
      allowed={canManagePermissions}
      title="Permissions access is disabled"
      description="You do not have permission to manage access roles or user permission overrides."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100dvh" bg={bgColor} py={{ base: 2, md: 0 }}>
        <Box px={{ base: 1, md: 2 }}>
          <Stack spacing={{ base: 4, md: 6 }}>
            <Box
              rounded={{ base: "2xl", md: "3xl" }}
              bgGradient={headerBgGradient}
              borderWidth="1px"
              borderColor={headerBorderColor}
              p={{ base: 4, md: 6 }}
            >
              <HStack align="center" justify="space-between" spacing={3}>
                <Box minW={0}>
                  <Heading
                    size={{ base: "md", md: "xl" }}
                    letterSpacing="0"
                    color={textColor}
                  >
                    Permissions
                  </Heading>

                  <Text
                    mt={{ base: 0.5, md: 1 }}
                    fontSize={{ base: "xs", md: "base" }}
                    color={textSecondaryColor}
                  >
                    Role defaults, assignments, and user overrides
                  </Text>
                </Box>

                <HStack
                  display={{ base: "none", md: "flex" }}
                  spacing={2}
                  rounded="full"
                  bg={cardBgColor}
                  px={4}
                  py={1.5}
                  fontSize="xs"
                  fontWeight="700"
                  color="teal.500"
                  shadow="sm"
                >
                  <Box h="2" w="2" rounded="full" bg="teal.400" />
                  <Text>LIVE SYNC</Text>
                </HStack>
              </HStack>
            </Box>

            <Tabs isLazy variant="enclosed" colorScheme="teal">
              <TabList overflowX="auto" borderColor={borderColor}>
                {canEditRoleDefaults ? (
                  <Tab whiteSpace="nowrap">Role permissions</Tab>
                ) : null}
                <Tab whiteSpace="nowrap">Role assignment</Tab>
                <Tab whiteSpace="nowrap">User overrides</Tab>
              </TabList>
              <TabPanels>
                {canEditRoleDefaults ? (
                  <TabPanel px={0} pb={0}>
            <Box
              borderRadius={{ base: "2xl", md: "3xl" }}
              bg={cardBgColor}
              borderWidth="1px"
              borderColor={borderColor}
              p={{ base: 4, md: 6 }}
              shadow="sm"
            >
              <Stack spacing={{ base: 4, md: 7 }}>
                <HStack align="center" justify="space-between" spacing={3}>
                  <Heading size={{ base: "sm", md: "md" }} color={textColor}>
                    Role Defaults
                  </Heading>

                  <Box
                    display={{ base: "none", sm: "inline-flex" }}
                    rounded="full"
                    bg={badgeBgColor}
                    px={3}
                    py={1}
                  >
                    <Text fontSize="xs" fontWeight="700" color={badgeTextColor}>
                      COMPANY-WIDE
                    </Text>
                  </Box>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 3, md: 5 }}>
                  <FormControl>
                    <FormLabel
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="700"
                      color={textMutedColor}
                    >
                      Role
                    </FormLabel>

                    <Select
                      value={selectedRole}
                      onChange={(event) => setSelectedRole(event.target.value)}
                      bg={selectBgColor}
                      borderColor={selectBorderColor}
                      color={textColor}
                      rounded="full"
                      h={{ base: 10, md: 12 }}
                      fontSize={{ base: "sm", md: "base" }}
                      _hover={{ borderColor: "teal.300" }}
                      _focus={{ borderColor: "teal.300", boxShadow: "0 0 0 1px teal" }}
                    >
                      {roles.map((role: any) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                {userStore.permissionLoading ? (
                  <Box
                    display="flex"
                    minH={{ base: "140px", md: "256px" }}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Spinner size={{ base: "md", md: "xl" }} color="teal.400" />
                  </Box>
                ) : (
                  renderPermissions(roleDraft, handleRoleToggle, roleGroupedCatalog)
                )}

                <Button
                  alignSelf={{ base: "stretch", md: "flex-start" }}
                  colorScheme="teal"
                  size={{ base: "md", md: "lg" }}
                  h={{ base: 10, md: 12 }}
                  px={{ base: 5, md: 8 }}
                  fontSize={{ base: "sm", md: "md" }}
                  rounded="full"
                  onClick={saveRolePermissions}
                  isLoading={userStore.permissionSaving}
                >
                  Save Role Defaults
                </Button>
              </Stack>
            </Box>
                  </TabPanel>
                ) : null}

                <TabPanel px={0} pb={0}>
                  <Box
                    borderRadius={{ base: "2xl", md: "3xl" }}
                    bg={cardBgColor}
                    borderWidth="1px"
                    borderColor={borderColor}
                    p={{ base: 4, md: 6 }}
                    shadow="sm"
                  >
                    <Stack spacing={{ base: 4, md: 6 }}>
                      <HStack justify="space-between" align="start" spacing={3}>
                        <Box>
                          <HStack spacing={2}>
                            <Icon as={FiUserCheck} color="teal.500" />
                            <Heading size={{ base: "sm", md: "md" }} color={textColor}>
                              Role Assignment
                            </Heading>
                          </HStack>
                          <Text mt={1} fontSize="sm" color={textSecondaryColor}>
                            Grant operational access without changing the user&apos;s organizational role or reporting hierarchy.
                          </Text>
                        </Box>
                        <Box
                          display={{ base: "none", sm: "inline-flex" }}
                          rounded="full"
                          bg={badgeBgColor}
                          px={3}
                          py={1}
                        >
                          <Text fontSize="xs" fontWeight="700" color={badgeTextColor}>
                            ACCESS ROLE
                          </Text>
                        </Box>
                      </HStack>

                      <FormControl maxW="620px">
                        <FormLabel fontSize="sm" fontWeight="700" color={textMutedColor}>
                          Find user
                        </FormLabel>
                        <HStack align="stretch">
                          <Input
                            value={assignmentSearch}
                            placeholder="Search by name, email, or employee code"
                            bg={selectBgColor}
                            borderColor={selectBorderColor}
                            onChange={(event) => setAssignmentSearch(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") void searchAssignmentUsers();
                            }}
                          />
                          <Button
                            leftIcon={<FiSearch />}
                            variant="outline"
                            isLoading={userStore.loading}
                            onClick={() => void searchAssignmentUsers()}
                          >
                            Search
                          </Button>
                        </HStack>
                      </FormControl>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel fontSize="sm" fontWeight="700" color={textMutedColor}>
                            User
                          </FormLabel>
                          <Select
                            placeholder="Select a user"
                            value={selectedAssignmentUserId}
                            onChange={(event) => setSelectedAssignmentUserId(event.target.value)}
                            bg={selectBgColor}
                            borderColor={selectBorderColor}
                          >
                            {assignmentUsers.map((user: any) => (
                              <option key={user._id} value={user._id}>
                                {user.name} ({user.username}){user.code ? ` - ${user.code}` : ""}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl isDisabled={!selectedAssignmentUser}>
                          <FormLabel fontSize="sm" fontWeight="700" color={textMutedColor}>
                            Access role
                          </FormLabel>
                          <Select
                            value={assignmentRole}
                            onChange={(event) => setAssignmentRole(event.target.value)}
                            bg={selectBgColor}
                            borderColor={selectBorderColor}
                          >
                            <option value="">No additional access role</option>
                            {assignmentRoles.map((roleOption: any) => (
                              <option key={roleOption.value} value={roleOption.value}>
                                {roleOption.label}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </SimpleGrid>

                      {selectedAssignmentUser ? (
                        <Box
                          borderWidth="1px"
                          borderColor={subtleBorderColor}
                          borderRadius="md"
                          bg={softCardBg}
                          p={4}
                        >
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                            <Box>
                              <Text fontSize="xs" color={textMutedColor}>ORGANIZATIONAL ROLE</Text>
                              <Text fontWeight="700">
                                {roleLabels.get(selectedAssignmentUser.role) || selectedAssignmentUser.role}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color={textMutedColor}>CURRENT ACCESS ROLE</Text>
                              <Text fontWeight="700">
                                {selectedAssignmentUser.accessRole
                                  ? roleLabels.get(selectedAssignmentUser.accessRole) || selectedAssignmentUser.accessRole
                                  : "None"}
                              </Text>
                            </Box>
                          </SimpleGrid>
                          <Text mt={3} fontSize="xs" color={textSecondaryColor}>
                            Changing or removing the access role resets this user&apos;s individual permission overrides so old grants cannot reactivate later.
                          </Text>
                        </Box>
                      ) : null}

                      <Button
                        alignSelf={{ base: "stretch", md: "flex-start" }}
                        colorScheme="teal"
                        isDisabled={
                          !selectedAssignmentUser ||
                          assignmentRole === String(selectedAssignmentUser?.accessRole || "")
                        }
                        isLoading={userStore.permissionSaving}
                        onClick={saveRoleAssignment}
                      >
                        Save Role Assignment
                      </Button>
                    </Stack>
                  </Box>
                </TabPanel>

                <TabPanel px={0} pb={0}>

            <Box
              borderRadius={{ base: "2xl", md: "3xl" }}
              bg={cardBgColor}
              borderWidth="1px"
              borderColor={borderColor}
              p={{ base: 4, md: 7 }}
              shadow="sm"
            >
              <Stack spacing={{ base: 4, md: 7 }}>
                <HStack align="center" justify="space-between" spacing={3}>
                  <HStack spacing={{ base: 2, md: 3 }}>
                    <Icon as={FiUsers} display={{ base: "none", md: "block" }} boxSize={6} color="teal.500" />

                    <Heading size={{ base: "sm", md: "lg" }} color={textColor}>
                      User Overrides
                    </Heading>
                  </HStack>

                  <Box
                    display={{ base: "none", sm: "inline-flex" }}
                    rounded="full"
                    bg={userBadgeBgColor}
                    px={3}
                    py={1}
                  >
                    <Text fontSize="xs" fontWeight="700" color={userBadgeTextColor}>
                      INDIVIDUAL
                    </Text>
                  </Box>
                </HStack>

                <FormControl w={{md:"50%"}}>
                  <FormLabel
                    fontSize={{ base: "xs", md: "sm" }}
                    fontWeight="700"
                    color={textMutedColor}
                  >
                    User
                  </FormLabel>

                  <Select
                    placeholder="Select a user to override"
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                    bg={selectBgColor}
                    borderColor={selectBorderColor}
                    color={textColor}
                    rounded="full"
                    h={{ base: 10, md: 12 }}
                    fontSize={{ base: "sm", md: "base" }}
                    _hover={{ borderColor: "teal.300" }}
                    _focus={{ borderColor: "teal.300", boxShadow: "0 0 0 1px teal" }}
                  >
                    {configurableUsers.map((user: any) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.username}) - {user.role}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {selectedUser ? (
                  <>
                    <HStack
                      rounded="2xl"
                      bgGradient={infoBoxBgGradient}
                      p={{ base: 3, md: 4 }}
                      spacing={3}
                      borderWidth="1px"
                      borderColor={infoBoxBorderColor}
                      align="flex-start"
                    >
                      <Icon as={FiShield} boxSize={5} color="amber.500" />

                      <Text
                        fontSize={{ base: "xs", md: "sm" }}
                        color={infoBoxTextColor}
                        lineHeight="1.5"
                      >
                        Choose Inherit to follow the role or access-role default. Use Allow or Deny only when this user needs an exception.
                      </Text>
                    </HStack>

                    {renderUserOverrides()}

                    <Button
                      alignSelf={{ base: "stretch", md: "flex-start" }}
                      colorScheme="teal"
                      size={{ base: "md", md: "lg" }}
                      h={{ base: 10, md: 12 }}
                      px={{ base: 5, md: 8 }}
                      fontSize={{ base: "sm", md: "md" }}
                      rounded="full"
                      onClick={saveUserPermissions}
                      isLoading={userStore.permissionSaving}
                    >
                      Save User Overrides
                    </Button>
                  </>
                ) : (
                  <Box
                    display="flex"
                    minH={{ base: "120px", md: "224px" }}
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    rounded="2xl"
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderColor={dashedBorderColor}
                    bg={emptyStateBgColor}
                    textAlign="center"
                    px={4}
                  >
                    <Text
                      color={emptyStateTextColor}
                      fontSize={{ base: "sm", md: "lg" }}
                      fontWeight="600"
                    >
                      Select a user above to edit overrides
                    </Text>
                  </Box>
                )}
              </Stack>
            </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Stack>
        </Box>
      </Box>
    </PermissionGate>
  );
});

export default PermissionsPage;
