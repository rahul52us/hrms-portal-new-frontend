"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiUser,
  FiUsers,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiTrash2,
  FiInfo,
  FiGrid,
  FiHash,
} from "react-icons/fi";
import stores from "@/app/store/stores";
import { courseStore } from "@/app/store/courseStore/courseStore";
import PermissionGate from "@/app/component/common/PermissionGate";
import { hasAnyCourseViewPermission } from "@/app/config/utils/permissions";

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

function getStatusColor(status: string) {
  if (status === "expired") {
    return "red";
  }

  if (status === "expiring_soon") {
    return "orange";
  }

  return "green";
}

function getStatusIcon(status: string, isExpired?: boolean) {
  if (isExpired || status === "expired") return FiXCircle;
  if (status === "expiring_soon") return FiClock;
  return FiCheckCircle;
}

const CourseAssignmentsAuditPage = observer(() => {
  const { auth, companyStore } = stores;
  const role = String(auth.userType || auth.user?.role || "").toLowerCase();
  const isSuperadmin = role === "superadmin";
  const canViewCourses = hasAnyCourseViewPermission(auth.user);
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const surfaceBg = useColorModeValue("gray.50", "gray.700");
  const companyId = isSuperadmin ? companyStore.getActiveCompanyId() : auth.company;
  const [courseFilter, setCourseFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    if (isSuperadmin) {
      companyStore.getManagedCompanies().catch(() => undefined);
    }
  }, [companyStore, isSuperadmin]);

  useEffect(() => {
    if (!canViewCourses) {
      return;
    }

    if (!companyId && isSuperadmin) {
      return;
    }

    courseStore.fetchCourseAssignmentAudit({
      companyId: companyId || undefined,
      courseId: courseFilter || undefined,
      userId: userFilter || undefined,
    }).catch(() => undefined);
  }, [canViewCourses, companyId, courseFilter, isSuperadmin, userFilter]);

  const rows = courseStore.courseAssignmentAudit || [];
  
  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      if (row.course?._id && row.course?.title) {
        map.set(row.course._id, row.course.title);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [rows]);

  const userOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      if (row.user?._id) {
        map.set(row.user._id, row.user.name || row.user.email || row.user.username || "User");
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [rows]);

  const resetFilters = () => {
    setCourseFilter("");
    setUserFilter("");
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAssignments = rows.length;
    const directAssignments = rows.filter(r => r.source === "direct").length;
    const batchAssignments = rows.filter(r => r.source === "batch").length;
    const activeAssignments = rows.filter(r => !r.isExpired && r.status !== "expired").length;
    const expiringSoon = rows.filter(r => r.status === "expiring_soon").length;
    
    return {
      totalAssignments,
      directAssignments,
      batchAssignments,
      activeAssignments,
      expiringSoon,
    };
  }, [rows]);

  return (
    <PermissionGate
      allowed={canViewCourses}
      title="Assignments audit is disabled"
      description="This account does not currently have access to course assignment records."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100vh" bg={pageBg} p={{ base: 4, md: 6 }}>
        <Stack spacing={6}>
          {/* Header Card */}
          <Box bg={cardBg} borderWidth="1px" borderRadius="2xl" p={{ base: 5, md: 6 }} boxShadow="sm">
            <HStack spacing={3} mb={3}>
              <Icon as={FiHash} boxSize={7} color="blue.500" />
              <Heading size="md">Assignment Audit</Heading>
            </HStack>
            <Text mt={2} color={textColor}>
              Trace direct and batch-based course assignments for the active scope.
            </Text>
          </Box>

          {!companyId && isSuperadmin ? (
            <Alert status="info" borderRadius="xl">
              <AlertIcon />
              <Box>
                <AlertTitle>Select a company</AlertTitle>
                <AlertDescription>
                  Use the header company selector to load assignment activity for a company.
                </AlertDescription>
              </Box>
            </Alert>
          ) : (
            <>
              {/* Statistics Cards */}
              {rows.length > 0 && (
                <Stack spacing={4}>
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 5 }} spacing={4}>
                    <Card bg={cardBg} borderWidth="1px" borderRadius="xl">
                      <CardBody>
                        <HStack justify="space-between">
                          <Stat>
                            <StatLabel color={textColor}>Total Assignments</StatLabel>
                            <StatNumber fontSize="2xl">{stats.totalAssignments}</StatNumber>
                            <StatHelpText>
                              <HStack spacing={1}>
                                <Icon as={FiCheckCircle} boxSize={3} />
                                <Text>{stats.activeAssignments} active</Text>
                              </HStack>
                            </StatHelpText>
                          </Stat>
                          <Box p={2} bg="blue.50" borderRadius="lg" color="blue.500">
                            <Icon as={FiHash} boxSize={6} />
                          </Box>
                        </HStack>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg} borderWidth="1px" borderRadius="xl">
                      <CardBody>
                        <HStack justify="space-between">
                          <Stat>
                            <StatLabel color={textColor}>Direct Assignments</StatLabel>
                            <StatNumber fontSize="2xl" color="green.500">
                              {stats.directAssignments}
                            </StatNumber>
                            <StatHelpText>Individual assignments</StatHelpText>
                          </Stat>
                          <Box p={2} bg="green.50" borderRadius="lg" color="green.500">
                            <Icon as={FiUser} boxSize={6} />
                          </Box>
                        </HStack>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg} borderWidth="1px" borderRadius="xl">
                      <CardBody>
                        <HStack justify="space-between">
                          <Stat>
                            <StatLabel color={textColor}>Batch Assignments</StatLabel>
                            <StatNumber fontSize="2xl" color="purple.500">
                              {stats.batchAssignments}
                            </StatNumber>
                            <StatHelpText>Bulk assignments</StatHelpText>
                          </Stat>
                          <Box p={2} bg="purple.50" borderRadius="lg" color="purple.500">
                            <Icon as={FiUsers} boxSize={6} />
                          </Box>
                        </HStack>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg} borderWidth="1px" borderRadius="xl">
                      <CardBody>
                        <HStack justify="space-between">
                          <Stat>
                            <StatLabel color={textColor}>Expiring Soon</StatLabel>
                            <StatNumber fontSize="2xl" color={stats.expiringSoon > 0 ? "orange.500" : "green.500"}>
                              {stats.expiringSoon}
                            </StatNumber>
                            <StatHelpText>Need attention</StatHelpText>
                          </Stat>
                          <Box p={2} bg="orange.50" borderRadius="lg" color="orange.500">
                            <Icon as={FiClock} boxSize={6} />
                          </Box>
                        </HStack>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg} borderWidth="1px" borderRadius="xl">
                      <CardBody>
                        <HStack justify="space-between">
                          <Stat>
                            <StatLabel color={textColor}>Assignment Rate</StatLabel>
                            <StatNumber fontSize="2xl">
                              {stats.totalAssignments > 0 
                                ? Math.round((stats.directAssignments / stats.totalAssignments) * 100)
                                : 0}%
                            </StatNumber>
                            <StatHelpText>Direct vs Batch</StatHelpText>
                          </Stat>
                          <Box p={2} bg="teal.50" borderRadius="lg" color="teal.500">
                            <Icon as={FiGrid} boxSize={6} />
                          </Box>
                        </HStack>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                </Stack>
              )}

              {/* Filters Section */}
              <Box bg={cardBg} borderWidth="1px" borderRadius="2xl" p={{ base: 5, md: 6 }} boxShadow="sm">
                <Flex justify="space-between" align="center" wrap="wrap" gap={4} mb={4}>
                  <HStack spacing={2}>
                    <Icon as={FiFilter} />
                    <Text fontWeight="semibold">Filters</Text>
                  </HStack>
                  {(courseFilter || userFilter) && (
                    <Button
                      leftIcon={<Icon as={FiTrash2} />}
                      onClick={resetFilters}
                      variant="ghost"
                      size="sm"
                      colorScheme="red"
                    >
                      Clear Filters
                    </Button>
                  )}
                </Flex>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>
                      <HStack spacing={2}>
                        <Icon as={FiBookOpen} boxSize={4} />
                        <Text>Course</Text>
                      </HStack>
                    </FormLabel>
                    <Select 
                      value={courseFilter} 
                      onChange={(event) => setCourseFilter(event.target.value)}
                      bg={surfaceBg}
                    >
                      <option value="">All courses</option>
                      {courseOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>
                      <HStack spacing={2}>
                        <Icon as={FiUser} boxSize={4} />
                        <Text>User</Text>
                      </HStack>
                    </FormLabel>
                    <Select 
                      value={userFilter} 
                      onChange={(event) => setUserFilter(event.target.value)}
                      bg={surfaceBg}
                    >
                      <option value="">All users</option>
                      {userOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* Audit Table */}
              <Box bg={cardBg} borderWidth="1px" borderRadius="2xl" p={{ base: 4, md: 5 }} boxShadow="sm" overflowX="auto">
                {courseStore.isCourseAssignmentAuditLoading ? (
                  <HStack justify="center" py={16}>
                    <Spinner size="xl" colorScheme="blue" />
                    <Text color={textColor}>Loading assignment audit...</Text>
                  </HStack>
                ) : rows.length === 0 ? (
                  <Alert status="info" borderRadius="xl">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>No assignment records found</AlertTitle>
                      <AlertDescription>
                        Adjust the filters or assign courses to start building the audit trail.
                      </AlertDescription>
                    </Box>
                  </Alert>
                ) : (
                  <Table variant="striped">
                    <Thead bg={surfaceBg}>
                      <Tr>
                        <Th>
                          <HStack spacing={2}>
                            <Icon as={FiUser} boxSize={4} />
                            <Text>User</Text>
                          </HStack>
                        </Th>
                        <Th>
                          <HStack spacing={2}>
                            <Icon as={FiBookOpen} boxSize={4} />
                            <Text>Course</Text>
                          </HStack>
                        </Th>
                        <Th>Source</Th>
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
                      {rows.map((row) => {
                        const StatusIcon = getStatusIcon(row.status, row.isExpired);
                        const displayStatus = row.isExpired ? "expired" : row.status;
                        const statusText = row.status === "expiring_soon" 
                          ? "Expiring soon" 
                          : row.isExpired 
                            ? "Expired" 
                            : "Active";
                        
                        return (
                          <Tr key={row._id} _hover={{ bg: surfaceBg }}>
                            <Td>
                              <Stack spacing={1}>
                                <HStack spacing={2}>
                                  <Icon as={FiUser} boxSize={4} color="blue.500" />
                                  <Text fontWeight="semibold">
                                    {row.user?.name || row.user?.email || row.user?.username || "User"}
                                  </Text>
                                </HStack>
                                {row.user?.department && (
                                  <HStack spacing={2} ml={6}>
                                    <Icon as={FiGrid} boxSize={3} color="gray.400" />
                                    <Text color="gray.500" fontSize="sm">
                                      {row.user.department}
                                    </Text>
                                  </HStack>
                                )}
                              </Stack>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Icon as={FiBookOpen} boxSize={4} color="green.500" />
                                <Text fontWeight="semibold">{row.course?.title || "Course"}</Text>
                              </HStack>
                            </Td>
                            <Td>
                              <Badge 
                                colorScheme={row.source === "batch" ? "purple" : "green"} 
                                borderRadius="full" 
                                px={3} 
                                py={1}
                              >
                                <HStack spacing={1}>
                                  <Icon as={row.source === "batch" ? FiUsers : FiUser} boxSize={3} />
                                  <Text>
                                    {row.source === "batch" 
                                      ? `From Batch${row.batchName ? `: ${row.batchName}` : ""}` 
                                      : "Direct Assignment"}
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
                              <Badge 
                                colorScheme={getStatusColor(displayStatus)} 
                                borderRadius="full" 
                                px={3} 
                                py={1}
                              >
                                <HStack spacing={1}>
                                  <Icon as={StatusIcon} boxSize={3} />
                                  <Text>{statusText}</Text>
                                </HStack>
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Icon as={FiUser} boxSize={3} color="gray.400" />
                                <Text>
                                  {row.assignedBy?.name || row.assignedBy?.email || row.assignedBy?.username || "System"}
                                </Text>
                              </HStack>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                )}
              </Box>
            </>
          )}
        </Stack>
      </Box>
    </PermissionGate>
  );
});

export default CourseAssignmentsAuditPage;
