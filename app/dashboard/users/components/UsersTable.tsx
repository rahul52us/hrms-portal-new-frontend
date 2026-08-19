"use client";

import {
  Badge,
  Box,
  Button,
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
  IconButton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Select,
  SimpleGrid,
  Stack,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { 
  FiBriefcase, 
  FiMapPin, 
  FiUsers, 
  FiMail, 
  FiShield,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiSearch
} from "react-icons/fi";
import CustomTable from "../../../component/config/component/CustomTable/CustomTable";
import { FiEdit2, FiTrash2, FiEye, FiFileText } from "react-icons/fi";

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
  officeLocationOptions?: { label: string; value: string; isDisabled?: boolean }[];
  locationFilter?: string;
  setLocationFilter?: (v: string) => void;
  onResetFilters?: () => void;
  onProfileDetails: (user: any) => void;
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

  if (user?.status === "ACTIVE") {
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

const getOfficeLocationDisplay = (user: any) =>
  user?.officeLocationName || user?.officeLocation?.name || "";

const getOfficeLocationPlace = (user: any) => {
  const location = user?.officeLocation || {};
  return [location.city || user?.city, location.state || user?.state]
    .filter(Boolean)
    .join(", ");
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
  officeLocationOptions = [],
  locationFilter = "",
  setLocationFilter,
  onResetFilters,
  onProfileDetails,
  showUserSourceTabs = false,
  userSourceTab = "all",
  setUserSourceTab,
  isPublicEnrolledUser,
}: Props) => {

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColorLight = useColorModeValue("gray.100", "gray.700");
  const tabListBg = useColorModeValue("gray.50", "gray.700");
  const tabTextColor = useColorModeValue("gray.600", "gray.300");
  const statsBg = useColorModeValue("blue.50", "blue.900");
  const statsTextColor = useColorModeValue("blue.700", "blue.200");
  const employeeNameColor = useColorModeValue("gray.800", "white");
  const departmentTextColor = useColorModeValue("gray.700", "gray.200");
  const externalNoticeBg = useColorModeValue("purple.50", "purple.900");
  const externalNoticeTextColor = useColorModeValue("purple.700", "purple.200");
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
              src={user?.pic?.url || (typeof user?.pic === 'string' ? user.pic : undefined)}
              bgGradient="linear(to-br, blue.400, purple.500)"
              color="white"
              fontWeight="bold"
              fontSize="sm"
            >
              {user.name?.charAt(0) || "U"}
            </Avatar>
            <VStack align="start" spacing={0}>
              <Text fontWeight="semibold" fontSize="sm" color={employeeNameColor}>
                {user.name || "--"}
              </Text>
              <HStack spacing={1}>
                <Icon as={FiMail} boxSize={3} color={muted} />
                <Text fontSize="xs" color={muted}>
                  {user.username || "No email"}
                </Text>
              </HStack>
            </VStack>
          </HStack>
        ),
      },
    },
    {
      headerName: "Department / Location",
      key: "department",
      type: "component",
      width: "230px",
      metaData: {
        component: (user: any) => {
          const officeLocation = getOfficeLocationDisplay(user);
          const place = getOfficeLocationPlace(user);

          return (
            <VStack align="start" spacing={0.5}>
              <HStack spacing={1} fontSize="sm">
                <Icon as={FiBriefcase} boxSize={3} color="purple.500" />
                <Text fontWeight="medium" color={departmentTextColor}>
                  {user.department || "--"}
                </Text>
              </HStack>
              {user.team ? (
                <Text fontSize="xs" color={muted}>
                  Team: {user.team}
                </Text>
              ) : null}
              <HStack spacing={1}>
                <Icon as={FiMapPin} boxSize={3} color={muted} />
                <Text fontSize="xs" color={muted}>
                  {officeLocation || place || "No office location"}
                </Text>
              </HStack>
              {officeLocation && place ? (
                <Text fontSize="10px" color={muted}>
                  {place}
                </Text>
              ) : null}
            </VStack>
          );
        },
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
      headerName: "Reporting Manager",
      key: "reportingManager",
      type: "component",
      width: "200px",
      metaData: {
        component: (user: any) => {
          const manager = user.reportingManager;
          if (!manager) {
            return (
              <HStack spacing={1}>
                <Icon as={FiUsers} boxSize={3} color={muted} />
                <Text fontSize="xs" color={muted} fontStyle="italic">
                  Not assigned
                </Text>
              </HStack>
            );
          }

          return (
            <Box minW={0}>
              <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                {manager.name || manager.username || "Manager"}
              </Text>
              <Text fontSize="xs" color={muted} noOfLines={1}>
                {manager.username || ""}
              </Text>
            </Box>
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
      key: "actions",
      type: "component",
      width: "160px",
      metaData: {
        component: (user: any) => (
          <HStack spacing={1} justify="center">
            <Tooltip label="Extended Profile" hasArrow>
              <IconButton
                aria-label="Profile"
                icon={<Icon as={FiFileText} />}
                size="sm"
                variant="ghost"
                colorScheme="purple"
                onClick={(e) => {
                  e.stopPropagation();
                  onProfileDetails(user);
                }}
              />
            </Tooltip>
            <Tooltip label="View" hasArrow>
              <IconButton
                aria-label="View"
                icon={<Icon as={FiBriefcase} />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(user);
                }}
              />
            </Tooltip>
            {canEdit && !isPublicEnrolledUser?.(user) && (
              <Tooltip label="Edit" hasArrow>
                <IconButton
                  aria-label="Edit"
                  icon={<Icon as={FiEdit2} />} 
                  size="sm"
                  variant="ghost"
                  colorScheme="green"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(user);
                  }}
                />
              </Tooltip>
            )}
            {canDelete && !isPublicEnrolledUser?.(user) && (
              <Tooltip label="Delete" hasArrow>
                <IconButton
                  aria-label="Delete"
                  icon={<Icon as={FiTrash2} />} 
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(user);
                  }}
                />
              </Tooltip>
            )}
          </HStack>
        ),
      },
    },
  ];

  return (
    <VStack spacing={{ base: 4, md: 6 }} align="stretch">
      {/* Tabs & Filters Section */}
      <Box mb={6}>
        <Flex
          justify="space-between"
          align={{ base: "start", lg: "center" }}
          direction={{ base: "column", lg: "row" }}
          gap={4}
        >
          <Box flex={1} w="100%" maxW="100%" overflowX="auto" css={{ "&::-webkit-scrollbar": { display: "none" } }}>
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
              <TabList gap={2} flexWrap="nowrap" w="max-content" bg={tabListBg} p={1} borderRadius="full">
                {listTabs.map((tab) => (
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
                    color={tabTextColor}
                    whiteSpace="nowrap"
                  >
                    {tab.label}
                  </Tab>
                ))}
              </TabList>
            </Tabs>
          </Box>

          <Flex 
            align="center" 
            gap={3} 
            wrap="wrap"
            w={{ base: "100%", lg: "auto" }}
            maxW="100%"
          >
            {showUserSourceTabs && (
              <Box w="100%" overflowX="auto" css={{ "&::-webkit-scrollbar": { display: "none" } }}>
                <HStack spacing={2} w="max-content" pb={1}>
                  {([
                    { value: "all", label: "All" },
                    { value: "manual", label: "Manual" },
                    { value: "public_enrolled", label: "Linked" },
                  ] as const).map((opt) => (
                  <Button
                    key={opt.value}
                    size="sm"
                    borderRadius="full"
                    variant={userSourceTab === opt.value ? "solid" : "outline"}
                    colorScheme={opt.value === "public_enrolled" ? "purple" : "blue"}
                    onClick={() => {
                      setUserSourceTab?.(opt.value);
                      setPage(1);
                    }}
                    px={4}
                    flexShrink={0}
                  >
                    {opt.label}
                  </Button>
                ))}
              </HStack>
            </Box>
            )}

            <Flex gap={3} w={{ base: "100%", sm: "auto" }} align="center">
              <Select
                size="sm"
                value={locationFilter}
                onChange={(event) => {
                  setLocationFilter?.(event.target.value);
                  setPage(1);
                }}
                borderRadius="full"
                isDisabled={officeLocationOptions.length === 0}
                minW="140px"
                flex={1}
                bg={cardBg}
                borderColor={borderColorLight}
              >
                <option value="">All Locations</option>
                {officeLocationOptions.map((location) => (
                  <option key={location.value} value={location.value} disabled={location.isDisabled}>
                    {location.label}
                  </option>
                ))}
              </Select>

              <Box
                bg={statsBg}
                px={4}
                py={1.5}
                borderRadius="full"
                whiteSpace="nowrap"
                textAlign="center"
                flexShrink={0}
              >
                <Text fontSize="sm" fontWeight="semibold" color={statsTextColor}>
                  {pagination.total} {activeTabLabel.toLowerCase()}
                  {pagination.total !== 1 && !activeTabLabel.toLowerCase().endsWith('s') ? "s" : ""}
                </Text>
              </Box>
            </Flex>
          </Flex>
        </Flex>

        {showUserSourceTabs && userSourceTab === "public_enrolled" && (
          <Box mt={3} px={4} py={2.5} bg={externalNoticeBg} borderRadius="xl" borderLeft="3px solid" borderColor="purple.400">
            <Text fontSize="xs" color={externalNoticeTextColor} fontWeight="500">
              ⚠️ These employees self-enrolled via public course access. You can view their profiles but cannot edit or delete them.
            </Text>
          </Box>
        )}
      </Box>

        {!isCompact ? (
          <CustomTable
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
                  setLocationFilter?.("");
                  onResetFilters?.();
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
                const reportingManager = user.reportingManager;
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
                        <Text fontSize="xs" color={muted} noOfLines={1}>{user.username || "No email"}</Text>
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
                        <Text fontSize="10px" textTransform="uppercase" color={muted}>Team</Text>
                        <Text fontSize="xs" fontWeight="medium" noOfLines={1}>{user.team || "--"}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="10px" textTransform="uppercase" color={muted}>Office Location</Text>
                        <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                          {getOfficeLocationDisplay(user) || getOfficeLocationPlace(user) || "--"}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="10px" textTransform="uppercase" color={muted}>Security</Text>
                        <Text fontSize="xs" fontWeight="medium">
                          {user.passwordStatus === "SET" ? "Password" : "Setup Pending"}
                        </Text>
                      </Box>
                    </SimpleGrid>

                    <Text fontSize="xs" color={muted} mb={3} noOfLines={1}>
                      Reporting manager: {reportingManager?.name || reportingManager?.username || "Not assigned"}
                    </Text>

                    <HStack spacing={2} flexWrap="wrap">
                      <Button size="sm" variant="outline" colorScheme="purple" onClick={() => onProfileDetails(user)}>Profile</Button>
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
    </VStack>
  );
};

export default UsersTable;
