"use client";

import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Tab,
  TabList,
  Tabs,
  Text,
  Tooltip,
  VStack,
  Avatar,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Stack,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { 
  FiBriefcase, 
  FiMapPin, 
  FiUser, 
  FiUsers, 
  FiMail, 
  FiShield,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiAward,
  FiSearch
} from "react-icons/fi";
import CustomTable from "../../../component/config/component/CustomTable/CustomTable";

const COLORS = ["blue", "purple", "orange", "green", "pink", "cyan", "teal", "red"];

type Props = {
  users: any[];
  loading: boolean;
  pagination: any;
  search: string;
  setSearch: (v: string) => void;
  page: number;
  setPage: (v: number) => void;
  listTabs: any[];
  listTab: string;
  setListTab: (v: string) => void;
  activeTabIndex: number;
  activeTabLabel: string;
  tableHeadBg: string;
  borderColor: string;
  muted: string;
  onEdit: (user: any) => void;
  onView: (user: any) => void;
  onDelete?: (user: any) => void;
  onToggleStatus?: (user: any) => void;
  statusUpdatingId?: string | null;
  formatRoleLabel: (role: string) => string;
  canEdit?: boolean;
  canDelete?: boolean;
  canToggleStatus?: boolean;
  // User source separation for admin-created vs externally linked accounts.
  showUserSourceTabs?: boolean;
  userSourceTab?: "all" | "manual" | "public_enrolled";
  setUserSourceTab?: (v: "all" | "manual" | "public_enrolled") => void;
  isPublicEnrolledUser?: (user: any) => boolean;
};

const getUserStatusMeta = (user: any) => {
  if (user?.status === "INACTIVE" || user?.isEnabled === false || user?.is_enabled === false) {
    return {
      label: "Inactive",
      colorScheme: "red",
      dotColor: "red.500",
      helperText: "Login blocked",
    };
  }

  if (user?.status === "ACTIVE" || user?.isActive) {
    return {
      label: "Active",
      colorScheme: "green",
      dotColor: "green.500",
      helperText: "Can access portal",
    };
  }

  return {
    label: "Pending",
    colorScheme: "orange",
    dotColor: "orange.500",
    helperText: "Setup incomplete",
  };
};

const UsersTable = ({
  users,
  loading,
  pagination,
  search,
  setSearch,
  page,
  setPage,
  listTabs,
  setListTab,
  activeTabIndex,
  activeTabLabel,
  muted,
  onEdit,
  onView,
  onDelete,
  onToggleStatus,
  statusUpdatingId,
  formatRoleLabel,
  canEdit = true,
  canDelete = false,
  canToggleStatus = false,
  showUserSourceTabs = false,
  userSourceTab = "all",
  setUserSourceTab,
  isPublicEnrolledUser,
}: Props) => {
  // Statistics calculations
  const stats = {
    total: pagination.total || 0,
    active: users.filter((u: any) => getUserStatusMeta(u).label === "Active").length,
    inactive: users.filter((u: any) => getUserStatusMeta(u).label === "Inactive").length,
    pending: users.filter((u: any) => getUserStatusMeta(u).label === "Pending").length,
    passwordReady: users.filter((u: any) => u.passwordStatus === "SET").length,
  };

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColorLight = useColorModeValue("gray.100", "gray.700");
  const statNumberColor = useColorModeValue("gray.800", "white");
  const activeNumberColor = useColorModeValue("green.600", "green.400");
  const pendingNumberColor = useColorModeValue("orange.600", "orange.400");
  const secureNumberColor = useColorModeValue("purple.600", "purple.400");
  const iconBoxBg = useColorModeValue("purple.50", "gray.700");
  const iconBoxDarkBg = useColorModeValue("purple.50", "purple.900");
  const tabListBg = useColorModeValue("gray.50", "gray.700");
  const statsBg = useColorModeValue("blue.50", "blue.900");
  const statsTextColor = useColorModeValue("blue.700", "blue.200");
  const tooltipBg = useColorModeValue("gray.900", "gray.700");
  const tooltipColor = useColorModeValue("white", "white");
  const isCompact = useBreakpointValue({ base: true, lg: false }) ?? false;

  const columns = [
    {
      headerName: "Employee",
      key: "name",
      type: "component",
      width: "280px",
      metaData: {
        component: (user: any) => (
          <HStack spacing={3}>
            <Avatar
              size="sm"
              name={user.name || "Employee"}
              bgGradient="linear(to-br, blue.400, purple.500)"
              color="white"
              fontWeight="bold"
              fontSize="sm"
            >
              {user.name?.charAt(0) || "U"}
            </Avatar>
            <VStack align="start" spacing={0}>
              <Text fontWeight="semibold" fontSize="sm" color={useColorModeValue("gray.800", "white")}>
                {user.name || "--"}
              </Text>
              <HStack spacing={1}>
                <Icon as={FiMail} boxSize={3} color={muted} />
                <Text fontSize="xs" color={muted}>
                  {user.email || "No email"}
                </Text>
              </HStack>
            </VStack>
          </HStack>
        ),
      },
    },
    {
      headerName: "Location",
      key: "department",
      type: "component",
      width: "200px",
      metaData: {
        component: (user: any) => (
          <VStack align="start" spacing={0.5}>
            <HStack spacing={1} fontSize="sm">
              <Icon as={FiBriefcase} boxSize={3} color="purple.500" />
              <Text fontWeight="medium" color={useColorModeValue("gray.700", "gray.200")}>
                {user.department || "--"}
              </Text>
            </HStack>
            <HStack spacing={1}>
              <Icon as={FiMapPin} boxSize={3} color={muted} />
              <Text fontSize="xs" color={muted}>
                {[user.city, user.state].filter(Boolean).join(", ") || "No location"}
              </Text>
            </HStack>
          </VStack>
        ),
      },
    },

    {
      headerName: "Role",
      key: "role",
      type: "component",
      width: "140px",
      metaData: {
        component: (user: any) => (
          <Badge
            variant="solid"
            bgGradient="linear(to-r, blue.500, purple.600)"
            color="white"
            px={3}
            py={1.5}
            borderRadius="full"
            fontWeight="medium"
            fontSize="xs"
            textTransform="capitalize"
          >
            {formatRoleLabel(user.role)}
          </Badge>
        ),
      },
    },
    {
      headerName: "Manager Hierarchy",
      key: "managers",
      type: "component",
      width: "200px",
      metaData: {
        component: (user: any) => {
          const managers = user.managers || [];
          const visibleManagers = managers.slice(0, 3);
          const extraCount = managers.length - 3;

          if (managers.length === 0) {
            return (
              <HStack spacing={1}>
                <Icon as={FiUsers} boxSize={3} color={muted} />
                <Text fontSize="xs" color={muted} fontStyle="italic">
                  No managers assigned
                </Text>
              </HStack>
            );
          }

          return (
            <Tooltip
              hasArrow
              placement="top-start"
              bg={tooltipBg}
              color={tooltipColor}
              p={3}
              borderRadius="xl"
              boxShadow="xl"
              label={
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    <Icon as={FiAward} size={16} />
                    <Text fontWeight="bold" fontSize="sm">
                      Reporting Hierarchy
                    </Text>
                  </HStack>
                  <Divider borderColor="gray.700" />
                  {managers.map((manager: any, index: number) => (
                    <Flex
                      key={`${user._id}-${manager.level}`}
                      justify="space-between"
                      align="center"
                      gap={3}
                    >
                      <HStack spacing={2}>
                        <Badge
                          colorScheme={COLORS[index % COLORS.length]}
                          borderRadius="full"
                          variant="solid"
                          fontSize="xs"
                          px={2}
                        >
                          L{manager.level}
                        </Badge>
                        <Text fontSize="sm">{manager.managerEmail}</Text>
                      </HStack>
                      <Badge
                        size="sm"
                        variant="subtle"
                        colorScheme={manager.status === "ASSIGNED" ? "green" : "orange"}
                      >
                        {manager.status}
                      </Badge>
                    </Flex>
                  ))}
                </VStack>
              }
            >
              <HStack spacing={1.5} cursor="pointer">
                {visibleManagers.map((manager: any, index: number) => (
                  <Badge
                    key={`${user._id}-${manager.level}`}
                    colorScheme={COLORS[index % COLORS.length]}
                    borderRadius="full"
                    px={2.5}
                    py={1}
                    fontSize="xs"
                    variant="subtle"
                  >
                    L{manager.level}
                  </Badge>
                ))}
                {extraCount > 0 && (
                  <Badge
                    variant="solid"
                    colorScheme="gray"
                    borderRadius="full"
                    px={2}
                    fontSize="xs"
                  >
                    +{extraCount}
                  </Badge>
                )}
              </HStack>
            </Tooltip>
          );
        },
      },
    },
    {
      headerName: "Status",
      key: "status",
      type: "component",
      width: "120px",
      metaData: {
        component: (user: any) => {
          const statusMeta = getUserStatusMeta(user);
          const shadowColor =
            statusMeta.colorScheme === "green"
              ? "rgba(72, 187, 120, 0.2)"
              : statusMeta.colorScheme === "red"
                ? "rgba(245, 101, 101, 0.2)"
                : "rgba(237, 137, 54, 0.2)";

          return (
            <VStack align="start" spacing={1}>
              <HStack spacing={1}>
                <Box
                  w="2"
                  h="2"
                  borderRadius="full"
                  bg={statusMeta.dotColor}
                  boxShadow={`0 0 0 2px ${shadowColor}`}
                />
                <Badge
                  variant="subtle"
                  colorScheme={statusMeta.colorScheme}
                  px={2.5}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                >
                  {statusMeta.label}
                </Badge>
              </HStack>
              <Text fontSize="10px" color={muted}>
                {statusMeta.helperText}
              </Text>
            </VStack>
          );
        },
      },
    },

    {
      headerName: "Security",
      key: "passwordStatus",
      type: "component",
      width: "120px",
      metaData: {
        component: (user: any) => {
          const isPasswordSet = user?.passwordStatus === "SET";
          return (
          <Tooltip
            label={isPasswordSet ? "Email and password login is ready" : "Password setup is pending"}
            hasArrow
          >
            <Badge
              variant="solid"
              colorScheme={isPasswordSet ? "green" : "orange"}
              px={2.5}
              py={1}
              borderRadius="full"
              fontSize="xs"
            >
              <HStack spacing={1}>
                <Icon as={FiShield} boxSize={3} />
                <Text>{isPasswordSet ? "Password" : "Setup Pending"}</Text>
              </HStack>
            </Badge>
          </Tooltip>
        );
        },
      },
    },
    {
      headerName: "Actions",
      key: "table-actions",
      type: "table-actions",
      width: "100px",
      props: {
        row: { minW: 100, textAlign: "center" },
        column: { textAlign: "center" },
      },
    },
  ];

  return (
    <VStack spacing={{ base: 4, md: 6 }} align="stretch">
      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }}>
        <Box
          bg={cardBg}
          p={4}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={borderColorLight}
          boxShadow="sm"
          transition="all 0.2s"
          _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
        >
          <Stat>
            <StatLabel color={muted} fontSize="sm">
              Total Employees
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color={statNumberColor}>
              {stats.total}
            </StatNumber>
            <StatHelpText fontSize="xs" color={muted}>
              <Icon as={FiTrendingUp} mr={1} />
              Across all roles
            </StatHelpText>
          </Stat>
        </Box>

        <Box
          bg={cardBg}
          p={4}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={borderColorLight}
          boxShadow="sm"
          transition="all 0.2s"
          _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
        >
          <Stat>
            <StatLabel color={muted} fontSize="sm">
              Active Employees
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color={activeNumberColor}>
              {stats.active}
            </StatNumber>
            <StatHelpText fontSize="xs" color={muted}>
              <Icon as={FiCheckCircle} mr={1} />
              {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : "0"}% active rate
            </StatHelpText>
          </Stat>
        </Box>

        <Box
          bg={cardBg}
          p={4}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={borderColorLight}
          boxShadow="sm"
          transition="all 0.2s"
          _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
        >
          <Stat>
            <StatLabel color={muted} fontSize="sm">
              Pending / Inactive
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color={pendingNumberColor}>
              {stats.pending + stats.inactive}
            </StatNumber>
            <StatHelpText fontSize="xs" color={muted}>
              <Icon as={FiClock} mr={1} />
              {stats.inactive > 0 ? `${stats.inactive} deactivated, ${stats.pending} pending` : "Awaiting activation"}
            </StatHelpText>
          </Stat>
        </Box>

        <Box
          bg={cardBg}
          p={4}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={borderColorLight}
          boxShadow="sm"
          transition="all 0.2s"
          _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
        >
          <Stat>
            <StatLabel color={muted} fontSize="sm">
              Password Ready
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color={secureNumberColor}>
              {stats.passwordReady}
            </StatNumber>
            <StatHelpText fontSize="xs" color={muted}>
              <Icon as={FiShield} mr={1} />
              {stats.total > 0 ? ((stats.passwordReady / stats.total) * 100).toFixed(1) : "0"}% ready
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* Tabs Section */}
      <Box>
        <Flex
          justify="space-between"
          align="center"
          mb={{ base: 4, md: 6 }}
          flexWrap="wrap"
          gap={4}
        >
          <Tabs
            variant="soft-rounded"
            colorScheme="blue"
            size="sm"
            index={activeTabIndex}
            onChange={(index) => {
              setListTab(listTabs[index]?.value || "user");
              setPage(1);
            }}
          >
            <TabList gap={2} flexWrap="nowrap" overflowX="auto" bg={tabListBg} p={1} borderRadius="full">
              {listTabs.map((tab, idx) => (
                <Tab
                  key={tab.value}
                  _selected={{
                    bgGradient: "linear(to-r, blue.500, purple.600)",
                    color: "white",
                    boxShadow: "md",
                  }}
                  borderRadius="full"
                  px={{ base: 4, md: 6 }}
                  fontSize="sm"
                  fontWeight="medium"
                  transition="all 0.2s"
                  color={useColorModeValue("gray.600", "gray.300")}
                  whiteSpace="nowrap"
                >
                  {tab.label}
                </Tab>
              ))}
            </TabList>
          </Tabs>

          <Box
            bg={statsBg}
            px={4}
            py={2}
            borderRadius="full"
          >
            <Text fontSize="sm" fontWeight="semibold" color={statsTextColor}>
              {pagination.total} total {activeTabLabel.toLowerCase()}
              {pagination.total !== 1 ? "s" : ""}
            </Text>
          </Box>
        </Flex>

        {/* Employee source filter for admin-created vs externally linked accounts. */}
        {showUserSourceTabs && (
          <Box mb={4}>
            <HStack spacing={2} flexWrap="wrap">
              <Text fontSize="xs" color={muted} fontWeight="medium" mr={1}>
                Show:
              </Text>
              {([
                { value: "all", label: "All Employees" },
                { value: "manual", label: "Manually Created" },
                { value: "public_enrolled", label: "Externally Linked" },
              ] as const).map((opt) => (
                <Button
                  key={opt.value}
                  size="xs"
                  borderRadius="full"
                  variant={userSourceTab === opt.value ? "solid" : "outline"}
                  colorScheme={opt.value === "public_enrolled" ? "purple" : "blue"}
                  onClick={() => {
                    setUserSourceTab?.(opt.value);
                    setPage(1);
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </HStack>
            {userSourceTab === "public_enrolled" && (
              <Box
                mt={2}
                px={3}
                py={2}
                bg={useColorModeValue("purple.50", "purple.900")}
                borderRadius="xl"
                borderLeft="3px solid"
                borderColor="purple.400"
              >
                <Text fontSize="xs" color={useColorModeValue("purple.700", "purple.200")}>
                  ⚠️ These employees self-enrolled via public course access. You can view their profiles but cannot edit or delete them.
                </Text>
              </Box>
            )}
          </Box>
        )}

        {!isCompact ? (
          <CustomTable
            title="Employee Directory"
            data={users}
            columns={columns}
            loading={loading}
            actions={{
              actionBtn: {
                addKey: {
                  showAddButton: false,
                },
                editKey: {
                  showEditButton: canEdit,
                  title: "Edit Employee",
                  function: (user: any) => {
                    // Block edit for public-enrolled employees
                    if (isPublicEnrolledUser?.(user)) return;
                    onEdit(user);
                  },
                },
                viewKey: {
                  showViewButton: true,
                  title: "View Employee",
                  function: (user: any) => onView(user),
                },
                deleteKey: {
                  showDeleteButton: canDelete,
                  title: "Delete Employee",
                  function: (user: any) => {
                    // Block delete for public-enrolled employees
                    if (isPublicEnrolledUser?.(user)) return;
                    onDelete?.(user);
                  },
                },
              },
              search: {
                show: true,
                placeholder: "Search by name, email, role, or creator...",
                searchValue: search,
                onSearchChange: (event: any) => {
                  setSearch(event.target.value);
                  setPage(1);
                },
              },
              resetData: {
                show: true,
                text: "Clear Filters",
                function: () => {
                  setSearch("");
                  setPage(1);
                },
              },
              pagination: {
                show: true,
                currentPage: page,
                totalPages: pagination.totalPages || 1,
                onClick: (nextPage: number) => setPage(nextPage),
              },
            }}
          />
        ) : (
          <Stack spacing={3}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color={muted} />
              </InputLeftElement>
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search employees"
                bg={cardBg}
                borderColor={borderColorLight}
                borderRadius="xl"
              />
            </InputGroup>

            {loading ? (
              <Box bg={cardBg} borderWidth="1px" borderColor={borderColorLight} borderRadius="xl" p={5}>
                <Text fontSize="sm" color={muted}>Loading employees...</Text>
              </Box>
            ) : users.length === 0 ? (
              <Box bg={cardBg} borderWidth="1px" borderColor={borderColorLight} borderRadius="xl" p={5}>
                <Text fontSize="sm" color={muted}>No employees found for this filter.</Text>
              </Box>
            ) : (
              users.map((user: any) => {
                const statusMeta = getUserStatusMeta(user);
                const managers = user.managers || [];
                return (
                  <Box key={user._id} bg={cardBg} borderWidth="1px" borderColor={borderColorLight} borderRadius="xl" p={4} boxShadow="sm">
                    <HStack align="start" spacing={3} mb={3}>
                      <Avatar
                        size="sm"
                        name={user.name || "Employee"}
                        bgGradient="linear(to-br, blue.400, purple.500)"
                        color="white"
                      />
                      <Box flex="1" minW={0}>
                        <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>{user.name || "--"}</Text>
                        <Text fontSize="xs" color={muted} noOfLines={1}>{user.email || "No email"}</Text>
                      </Box>
                      <Badge colorScheme={statusMeta.colorScheme} variant="subtle" borderRadius="full">
                        {statusMeta.label}
                      </Badge>
                    </HStack>

                    <SimpleGrid columns={2} spacing={3} mb={3}>
                      <Box>
                        <Text fontSize="10px" textTransform="uppercase" color={muted}>Role</Text>
                        <Text fontSize="xs" fontWeight="medium">{formatRoleLabel(user.role)}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="10px" textTransform="uppercase" color={muted}>Company</Text>
                        <Text fontSize="xs" fontWeight="medium" noOfLines={1}>{user.company?.name || user.company?.company_name || "Unassigned"}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="10px" textTransform="uppercase" color={muted}>Department</Text>
                        <Text fontSize="xs" fontWeight="medium" noOfLines={1}>{user.department || "--"}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="10px" textTransform="uppercase" color={muted}>Security</Text>
                        <Text fontSize="xs" fontWeight="medium">
                          {user.passwordStatus === "SET" ? "Password" : "Setup Pending"}
                        </Text>
                      </Box>
                    </SimpleGrid>

                    {managers.length > 0 ? (
                      <HStack spacing={1.5} flexWrap="wrap" mb={3}>
                        {managers.slice(0, 3).map((manager: any, index: number) => (
                          <Badge key={`${user._id}-${manager.level}`} colorScheme={COLORS[index % COLORS.length]} variant="subtle" borderRadius="full">
                            L{manager.level}
                          </Badge>
                        ))}
                        {managers.length > 3 ? <Badge borderRadius="full">+{managers.length - 3}</Badge> : null}
                      </HStack>
                    ) : null}

                    <HStack spacing={2} flexWrap="wrap">
                      <Button size="sm" variant="outline" onClick={() => onView(user)}>View</Button>
                      {canEdit ? <Button size="sm" variant="outline" colorScheme="blue" onClick={() => onEdit(user)}>Edit</Button> : null}
                      {canToggleStatus ? (
                        <Button
                          size="sm"
                          borderRadius="full"
                          colorScheme={statusMeta.label !== "Inactive" ? "red" : "green"}
                          variant={statusMeta.label !== "Inactive" ? "outline" : "solid"}
                          onClick={() => onToggleStatus?.(user)}
                          isLoading={statusUpdatingId === user._id}
                        >
                          {statusMeta.label !== "Inactive" ? "Deactivate" : "Activate"}
                        </Button>
                      ) : null}
                      {canDelete ? <Button size="sm" variant="ghost" colorScheme="red" onClick={() => onDelete?.(user)}>Delete</Button> : null}
                    </HStack>
                  </Box>
                );
              })
            )}

            <HStack justify="space-between">
              <Button size="sm" variant="outline" onClick={() => setPage(Math.max(1, page - 1))} isDisabled={page <= 1}>
                Prev
              </Button>
              <Text fontSize="xs" color={muted}>
                Page {page} of {pagination.totalPages || 1}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(Math.min(pagination.totalPages || 1, page + 1))}
                isDisabled={page >= (pagination.totalPages || 1)}
              >
                Next
              </Button>
            </HStack>
          </Stack>
        )}
      </Box>
    </VStack>
  );
};

export default UsersTable;
