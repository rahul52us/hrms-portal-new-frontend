"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiPlus,
  FiFilter,
  FiUser,
  FiUsers,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiGrid,
  FiDownload,
  FiAlertCircle,
} from "react-icons/fi";
import stores from "@/app/store/stores";
import { courseStore } from "@/app/store/courseStore/courseStore";
import AssignCourseModal from "../components/AssignCourseModal";
import PermissionGate from "@/app/component/common/PermissionGate";
import {
  PERMISSION_KEYS,
  hasAnyCourseViewPermission,
  hasPermission,
} from "@/app/config/utils/permissions";

function getStatusColor(status: string) {
  if (status === "expired") {
    return "red";
  }
  if (status === "expiring_soon") {
    return "orange";
  }
  return "green";
}

function getStatusIcon(status: string) {
  if (status === "expired") return FiXCircle;
  if (status === "expiring_soon") return FiClock;
  return FiCheckCircle;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "No expiry";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No expiry";
  }
  return date.toLocaleDateString();
}

const AssignedCoursesPage = observer(() => {
  const { auth, companyStore } = stores;
  const role = String(auth.userType || auth.user?.role || "").toLowerCase();
  const isSuperadmin = role === "superadmin";
  const canViewCourses = hasAnyCourseViewPermission(auth.user);
  const canAssignCourses = hasPermission(auth.user, PERMISSION_KEYS.ASSIGN_COURSES);
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const surfaceBg = useColorModeValue("gray.50", "gray.700");
  const [courseFilter, setCourseFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [defaultCourseId, setDefaultCourseId] = useState("");

  const companyId = companyStore.getActiveCompanyId();
  const companies = companyStore.companies.data || [];
  const activeCompany = companies.find((company: any) => company._id === companyId) || auth.user?.companyDetails || null;

  useEffect(() => {
    if (isSuperadmin) {
      companyStore.getManagedCompanies().catch(() => undefined);
    } else {
      companyStore.initializeCompanyContext();
    }
  }, [companyStore, isSuperadmin]);

  useEffect(() => {
    if (!canViewCourses) {
      return;
    }

    courseStore.fetchCourses().catch(() => undefined);
    courseStore.fetchAccessibleCourses().catch(() => undefined);
  }, [canViewCourses]);

  useEffect(() => {
    if (!canViewCourses) {
      return;
    }

    if (!companyId && isSuperadmin) {
      return;
    }
    courseStore.fetchAssignedCourseAccesses({
      companyId: companyId || undefined,
    }).catch(() => undefined);
  }, [canViewCourses, companyId, isSuperadmin]);

  const rows = courseStore.assignedCourseAccesses || [];
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (courseFilter && row.courseId !== courseFilter) {
        return false;
      }
      if (departmentFilter && row.department?._id !== departmentFilter) {
        return false;
      }
      if (userFilter && row.user?._id !== userFilter) {
        return false;
      }
      return true;
    });
  }, [courseFilter, departmentFilter, rows, userFilter]);

  const courseOptions = useMemo(() => {
    const uniqueMap = new Map<string, string>();
    rows.forEach((row) => {
      if (row.courseId && row.courseName) {
        uniqueMap.set(row.courseId, row.courseName);
      }
    });
    return Array.from(uniqueMap.entries()).map(([value, label]) => ({ value, label }));
  }, [rows]);

  const departmentOptions = useMemo(() => {
    const uniqueMap = new Map<string, string>();
    rows.forEach((row) => {
      if (row.department?._id) {
        uniqueMap.set(row.department._id, row.department.title || row.department.code || "Department");
      }
    });
    return Array.from(uniqueMap.entries()).map(([value, label]) => ({ value, label }));
  }, [rows]);

  const userOptions = useMemo(() => {
    const uniqueMap = new Map<string, string>();
    rows.forEach((row) => {
      if (row.user?._id) {
        uniqueMap.set(row.user._id, row.user.name || row.user.email || row.user.username || "User");
      }
    });
    return Array.from(uniqueMap.entries()).map(([value, label]) => ({ value, label }));
  }, [rows]);

  const companyAssignedCourseIds = useMemo(
    () =>
      new Set(
        rows
          .filter((row) => row.assignmentType === "company" && row.status !== "expired")
          .map((row) => row.courseId)
          .filter(Boolean)
      ),
    [rows]
  );

  const accessibleCourseMap = useMemo(
    () => new Map((courseStore.accessibleCourses || []).map((course) => [course._id, course])),
    [courseStore.accessibleCourses]
  );

  const filteredLibraryCourses = useMemo(() => {
    const query = librarySearch.trim().toLowerCase();
    return (courseStore.courses || []).filter((course) => {
      const matchesQuery =
        !query ||
        `${course.title} ${course.status} ${course.curriculum?.totalModules || ""}`.toLowerCase().includes(query);
      return matchesQuery;
    });
  }, [courseStore.courses, librarySearch]);

  const openAssignModal = (courseId = "") => {
    setDefaultCourseId(courseId);
    setIsAssignModalOpen(true);
  };

  return (
    <PermissionGate
      allowed={canViewCourses}
      title="Assigned courses view is disabled"
      description="This account does not currently have access to assigned course visibility."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100vh" bg={pageBg} p={{ base: 4, md: 6 }}>
        <Stack spacing={6}>
          {/* Header Card */}
          <Box bg={cardBg} borderWidth="1px" borderRadius="2xl" p={{ base: 5, md: 6 }} boxShadow="sm">
            <Flex justify="space-between" align={{ base: "start", md: "center" }} gap={4} wrap="wrap">
              <Box>
                <HStack spacing={3} mb={2}>
                  <Icon as={FiBookOpen} boxSize={6} color="blue.500" />
                  <Heading size="md">Assigned Courses</Heading>
                </HStack>
                <Text mt={2} color={textColor}>
                  Review what is already assigned to {activeCompany?.company_name || "the selected company"} and assign new courses from the scoped library without leaving this workspace.
                </Text>
              </Box>
              <Button
                leftIcon={<Icon as={FiPlus} />}
                colorScheme="blue"
                onClick={() => openAssignModal()}
                isDisabled={!canAssignCourses || (!companyId && isSuperadmin)}
              >
                Assign New Course
              </Button>
            </Flex>
          </Box>

          {!companyId && isSuperadmin ? (
            <Alert status="info" borderRadius="xl">
              <AlertIcon />
              <Box>
                <AlertTitle>Select a company</AlertTitle>
                <AlertDescription>
                  Use the header company selector to load assignments for a specific company.
                </AlertDescription>
              </Box>
            </Alert>
          ) : (
            <Tabs colorScheme="blue" variant="soft-rounded">
              <TabList>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FiGrid} />
                    <Text>Assigned</Text>
                    {filteredRows.length > 0 && (
                      <Badge ml={1} colorScheme="blue" borderRadius="full">
                        {filteredRows.length}
                      </Badge>
                    )}
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FiSearch} />
                    <Text>All Courses</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Assigned Courses Tab */}
                <TabPanel px={0} pt={6}>
                  <Stack spacing={6}>
                    {/* Filters */}
                    <Box bg={cardBg} borderWidth="1px" borderRadius="2xl" p={{ base: 5, md: 6 }} boxShadow="sm">
                      <Flex gap={4} wrap="wrap" align="flex-end">
                        <FormControl maxW={{ base: "full", md: "240px" }}>
                          <FormLabel>
                            <HStack spacing={2}>
                              <Icon as={FiBookOpen} boxSize={4} />
                              <Text>Course</Text>
                            </HStack>
                          </FormLabel>
                          <Select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
                            <option value="">All courses</option>
                            {courseOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl maxW={{ base: "full", md: "220px" }}>
                          <FormLabel>
                            <HStack spacing={2}>
                              <Icon as={FiUsers} boxSize={4} />
                              <Text>Department</Text>
                            </HStack>
                          </FormLabel>
                          <Select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                            <option value="">All departments</option>
                            {departmentOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl maxW={{ base: "full", md: "240px" }}>
                          <FormLabel>
                            <HStack spacing={2}>
                              <Icon as={FiUser} boxSize={4} />
                              <Text>User</Text>
                            </HStack>
                          </FormLabel>
                          <Select value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
                            <option value="">All users</option>
                            {userOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        {(courseFilter || departmentFilter || userFilter) && (
                          <Button
                            leftIcon={<Icon as={FiFilter} />}
                            onClick={() => {
                              setCourseFilter("");
                              setDepartmentFilter("");
                              setUserFilter("");
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </Flex>
                    </Box>

                    {/* Assignments Table */}
                    <Box bg={cardBg} borderWidth="1px" borderRadius="2xl" p={{ base: 4, md: 5 }} boxShadow="sm" overflowX="auto">
                      {courseStore.isAssignedCoursesLoading ? (
                        <HStack justify="center" py={16}>
                          <Spinner />
                          <Text color={textColor}>Loading assigned courses...</Text>
                        </HStack>
                      ) : filteredRows.length === 0 ? (
                        <Alert status="info" borderRadius="xl">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No assignments found</AlertTitle>
                            <AlertDescription>
                              Try a different filter or assign a new course for this company.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>
                                <HStack spacing={2}>
                                  <Icon as={FiBookOpen} boxSize={4} />
                                  <Text>Course Name</Text>
                                </HStack>
                              </Th>
                              <Th>
                                <HStack spacing={2}>
                                  <Icon as={FiUsers} boxSize={4} />
                                  <Text>Assigned To</Text>
                                </HStack>
                              </Th>
                              <Th>Assignment Type</Th>
                              <Th>
                                <HStack spacing={2}>
                                  <Icon as={FiCalendar} boxSize={4} />
                                  <Text>Valid Till</Text>
                                </HStack>
                              </Th>
                              <Th>Status</Th>
                              <Th>Assigned By</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {filteredRows.map((row) => {
                              const StatusIcon = getStatusIcon(row.status);
                              return (
                                <Tr key={row._id}>
                                  <Td fontWeight="semibold">
                                    <HStack spacing={2}>
                                      <Icon as={FiBookOpen} boxSize={4} color="blue.500" />
                                      <Text>{row.courseName}</Text>
                                    </HStack>
                                  </Td>
                                  <Td>
                                    <Stack spacing={1}>
                                      <HStack spacing={2}>
                                        <Icon as={FiUser} boxSize={3} color="gray.500" />
                                        <Text>{row.assignedTo}</Text>
                                      </HStack>
                                      {row.department?.title ? (
                                        <HStack spacing={2} ml={5}>
                                          <Icon as={FiUsers} boxSize={3} color="gray.400" />
                                          <Text fontSize="sm" color="gray.500">
                                            {row.department.title}
                                          </Text>
                                        </HStack>
                                      ) : null}
                                    </Stack>
                                  </Td>
                                  <Td>
                                    <Badge
                                      colorScheme={
                                        row.assignmentType === "company"
                                          ? "purple"
                                          : row.assignmentType === "department"
                                            ? "blue"
                                            : "orange"
                                      }
                                      borderRadius="full"
                                      px={3}
                                      py={1}
                                    >
                                      <HStack spacing={1}>
                                        <Icon
                                          as={
                                            row.assignmentType === "company"
                                              ? FiUsers
                                              : row.assignmentType === "department"
                                                ? FiGrid
                                                : FiUser
                                          }
                                          boxSize={3}
                                        />
                                        <Text>
                                          {row.assignmentType === "company"
                                            ? "Company-wide"
                                            : row.assignmentType === "department"
                                              ? "Department"
                                              : "User-specific"}
                                        </Text>
                                      </HStack>
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <HStack spacing={2}>
                                      <Icon as={FiCalendar} boxSize={4} color="gray.400" />
                                      <Text>{formatDate(row.validTill)}</Text>
                                    </HStack>
                                  </Td>
                                  <Td>
                                    <Badge colorScheme={getStatusColor(row.status)} borderRadius="full" px={3} py={1}>
                                      <HStack spacing={1}>
                                        <Icon as={StatusIcon} boxSize={3} />
                                        <Text>{row.status === "expiring_soon" ? "Expiring soon" : row.status}</Text>
                                      </HStack>
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <HStack spacing={2}>
                                      <Icon as={FiUser} boxSize={3} color="gray.400" />
                                      <Text>{row.assignedBy?.name || row.assignedBy?.email || row.assignedBy?.username || "System"}</Text>
                                    </HStack>
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      )}
                    </Box>
                  </Stack>
                </TabPanel>

                {/* All Courses Tab */}
                <TabPanel px={0} pt={6}>
                  <Stack spacing={6}>
                    {/* Search */}
                    <Box bg={cardBg} borderWidth="1px" borderRadius="2xl" p={{ base: 5, md: 6 }} boxShadow="sm">
                      <FormControl>
                        <FormLabel>
                          <HStack spacing={2}>
                            <Icon as={FiSearch} />
                            <Text>Search course library</Text>
                          </HStack>
                        </FormLabel>
                        <Input
                          value={librarySearch}
                          onChange={(event) => setLibrarySearch(event.target.value)}
                          placeholder="Search by course title or status"
                            
                        />
                      </FormControl>
                    </Box>

                    {/* Library Table */}
                    <Box bg={cardBg} borderWidth="1px" borderRadius="2xl" p={{ base: 4, md: 5 }} boxShadow="sm" overflowX="auto">
                      {courseStore.isLoading || courseStore.isAccessLoading ? (
                        <HStack justify="center" py={16}>
                          <Spinner />
                          <Text color={textColor}>Loading course library...</Text>
                        </HStack>
                      ) : filteredLibraryCourses.length === 0 ? (
                        <Alert status="info" borderRadius="xl">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No courses found</AlertTitle>
                            <AlertDescription>
                              Try a different search to browse the full library.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Course</Th>
                              <Th>Status</Th>
                              <Th>Company Access</Th>
                              <Th>Assignment Rights</Th>
                              <Th textAlign="right">Action</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {filteredLibraryCourses.map((course) => {
                              const accessibleCourse = accessibleCourseMap.get(course._id);
                              const canAssignBase = canAssignCourses && (isSuperadmin ? Boolean(companyId) : Boolean(accessibleCourse?.access?.canAssign));
                              const canAssign = canAssignBase && course.status === "published";
                              const isAssignedToCompany = companyAssignedCourseIds.has(course._id);

                              return (
                                <Tr key={course._id}>
                                  <Td>
                                    <Stack spacing={1}>
                                      <HStack spacing={2}>
                                        <Icon as={FiBookOpen} boxSize={4} color="blue.500" />
                                        <Text fontWeight="semibold">{course.title}</Text>
                                      </HStack>
                                      <HStack spacing={2} ml={6}>
                                        <Icon as={FiGrid} boxSize={3} color="gray.400" />
                                        <Text fontSize="sm" color="gray.500">
                                          {course.curriculum?.totalModules || 0} modules
                                        </Text>
                                      </HStack>
                                    </Stack>
                                  </Td>
                                  <Td>
                                    <Badge 
                                      colorScheme={course.status === "published" ? "green" : "gray"} 
                                      borderRadius="full" 
                                      px={3} 
                                      py={1}
                                    >
                                      <HStack spacing={1}>
                                        <Icon as={course.status === "published" ? FiCheckCircle : FiAlertCircle} boxSize={3} />
                                        <Text>{course.status}</Text>
                                      </HStack>
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <Badge 
                                      colorScheme={isAssignedToCompany ? "purple" : "gray"} 
                                      borderRadius="full" 
                                      px={3} 
                                      py={1}
                                    >
                                      <HStack spacing={1}>
                                        <Icon as={isAssignedToCompany ? FiCheckCircle : FiXCircle} boxSize={3} />
                                        <Text>{isAssignedToCompany ? "Assigned to company" : "Not assigned"}</Text>
                                      </HStack>
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <Badge 
                                      colorScheme={canAssign ? "blue" : "gray"} 
                                      borderRadius="full" 
                                      px={3} 
                                      py={1}
                                    >
                                      <HStack spacing={1}>
                                        <Icon as={canAssign ? FiCheckCircle : FiXCircle} boxSize={3} />
                                        <Text>{canAssign ? "Can assign" : "No assign access"}</Text>
                                      </HStack>
                                    </Badge>
                                  </Td>
                                  <Td textAlign="right">
                                    <Button
                                      size="sm"
                                      colorScheme="blue"
                                      onClick={() => openAssignModal(course._id)}
                                      isDisabled={!canAssign}
                                      leftIcon={<Icon as={FiPlus} />}
                                    >
                                      Assign course
                                    </Button>
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      )}
                    </Box>
                  </Stack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </Stack>

        <AssignCourseModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setDefaultCourseId("");
          }}
          defaultCourseId={defaultCourseId}
          fixedCompanyId={companyId}
          onAssigned={async () => {
            if (!companyId && isSuperadmin) {
              return;
            }
            await Promise.all([
              courseStore.fetchAssignedCourseAccesses({
                companyId: companyId || undefined,
              }),
              courseStore.fetchAccessibleCourses(),
            ]);
          }}
        />
      </Box>
    </PermissionGate>
  );
});

export default AssignedCoursesPage;
