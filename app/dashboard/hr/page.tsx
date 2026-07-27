"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import stores from "@/app/store/stores";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Grid,
  GridItem,
  HStack,
  Icon,
  Progress,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiPlus,
  FiShield,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";

const numberValue = (value: any) => Number(value || 0);

const formatRole = (role: string) => {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "hradmin") return "HR Admin";
  if (normalized === "hr") return "HR";
  if (normalized === "departmenthead") return "Department Head";
  if (/^l\d+[-\s]?manager$/i.test(normalized)) return "Employee";
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "User";
};

const formatDate = (value: any) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StatCard = ({ label, value, helper, icon, color }: any) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue(`${color}.50`, `${color}.900`);
  const iconColor = useColorModeValue(`${color}.600`, `${color}.200`);

  return (
    <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={4} minW={0}>
      <Flex align="flex-start" justify="space-between" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" fontWeight="800" color={muted} textTransform="uppercase">
            {label}
          </Text>
          <Text mt={1} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="900" lineHeight="1">
            {value}
          </Text>
          {helper ? (
            <Text mt={2} fontSize="sm" color={muted} noOfLines={2}>
              {helper}
            </Text>
          ) : null}
        </Box>
        <Center boxSize={10} borderRadius="lg" bg={iconBg} color={iconColor} flexShrink={0}>
          <Icon as={icon} boxSize={5} />
        </Center>
      </Flex>
    </Box>
  );
};

const Section = ({ title, helper, children, action }: any) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={4} minW={0}>
      <Flex align="flex-start" justify="space-between" gap={4} mb={4}>
        <Box minW={0}>
          <Text fontSize="lg" fontWeight="900">
            {title}
          </Text>
          {helper ? (
            <Text mt={1} fontSize="sm" color={muted}>
              {helper}
            </Text>
          ) : null}
        </Box>
        {action}
      </Flex>
      {children}
    </Box>
  );
};

const BreakdownList = ({ items = [], total = 0, emptyText = "No data yet" }: any) => {
  const muted = useColorModeValue("gray.500", "gray.400");

  if (!items.length) {
    return (
      <Text fontSize="sm" color={muted}>
        {emptyText}
      </Text>
    );
  }

  return (
    <Stack spacing={3}>
      {items.slice(0, 6).map((item: any) => {
        const value = numberValue(item.value);
        const percent = total ? Math.round((value / total) * 100) : 0;
        return (
          <Box key={item.label}>
            <Flex justify="space-between" gap={3} mb={1}>
              <Text fontSize="sm" fontWeight="700" noOfLines={1}>
                {item.label}
              </Text>
              <Text fontSize="sm" color={muted} flexShrink={0}>
                {value}
              </Text>
            </Flex>
            <Progress value={percent} size="sm" borderRadius="full" colorScheme="blue" />
          </Box>
        );
      })}
    </Stack>
  );
};

const PersonList = ({ items = [], emptyText }: any) => {
  const muted = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  if (!items.length) {
    return (
      <Text fontSize="sm" color={muted}>
        {emptyText}
      </Text>
    );
  }

  return (
    <Stack spacing={0} borderTopWidth="1px" borderColor={borderColor}>
      {items.slice(0, 8).map((user: any) => (
        <Flex key={user._id || `${user.email}-${user.name}`} py={3} borderBottomWidth="1px" borderColor={borderColor} gap={3} align="center">
          <Center boxSize={9} borderRadius="lg" bg="blue.50" color="blue.600" fontWeight="900" flexShrink={0}>
            {String(user.name || user.email || "U").charAt(0).toUpperCase()}
          </Center>
          <Box minW={0} flex="1">
            <Text fontSize="sm" fontWeight="800" noOfLines={1}>
              {user.name || "Unnamed user"}
            </Text>
            <Text fontSize="xs" color={muted} noOfLines={1}>
              {[formatRole(user.role), user.department, user.officeLocationName].filter(Boolean).join(" | ")}
            </Text>
          </Box>
          <Badge colorScheme={user.status === "active" ? "green" : user.status === "inactive" ? "red" : "orange"} borderRadius="full">
            {user.status}
          </Badge>
        </Flex>
      ))}
    </Stack>
  );
};

const HrDashboardPage = observer(() => {
  const { auth, dashboardStore } = stores;
  const router = useRouter();
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const role = String(auth.userType || auth.user?.role || "").toLowerCase();
  const canViewDashboard = hasPermission(auth.user, PERMISSION_KEYS.VIEW_DASHBOARD);
  const summary = dashboardStore.hrSummary || {};
  const stats = summary.summary || {};
  const scope = summary.scope || {};
  const loading = dashboardStore.hrSummaryLoading || auth.isLoading || !auth.sessionReady;
  const error = dashboardStore.hrSummaryError;
  const totalEmployees = numberValue(stats.totalEmployees);

  useEffect(() => {
    if (!auth.sessionReady || !auth.user || !canViewDashboard) {
      return;
    }

    dashboardStore.fetchHrSummary().catch(() => undefined);
  }, [auth.sessionReady, auth.user, canViewDashboard, dashboardStore]);

  const quickActions = [
    {
      label: "Add Employee",
      href: "/dashboard/users",
      icon: FiPlus,
      show: hasPermission(auth.user, PERMISSION_KEYS.CREATE_USERS),
    },
    {
      label: "Bulk Upload",
      href: "/dashboard/users",
      icon: FiUsers,
      show: hasPermission(auth.user, PERMISSION_KEYS.CREATE_USERS),
    },
    {
      label: "Reporting Lines",
      href: "/dashboard/users",
      icon: FiUserCheck,
      show: hasPermission(auth.user, PERMISSION_KEYS.ASSIGN_MANAGERS),
    },
    {
      label: "Add HR",
      href: "/dashboard/users",
      icon: FiShield,
      show: hasPermission(auth.user, PERMISSION_KEYS.CREATE_HR_USERS),
    },
    {
      label: "Departments",
      href: "/dashboard/departments",
      icon: FiBriefcase,
      show: hasPermission(auth.user, PERMISSION_KEYS.VIEW_DEPARTMENTS),
    },
    {
      label: "Locations",
      href: "/dashboard/locations",
      icon: FiMapPin,
      show: hasPermission(auth.user, PERMISSION_KEYS.VIEW_LOCATIONS),
    },
  ].filter((action) => action.show);

  return (
    <PermissionGate
      allowed={canViewDashboard}
      title="HR dashboard is disabled"
      description="This account does not currently have access to dashboard analytics."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100dvh" bg={pageBg} px={{ base: 3, md: 6 }} py={{ base: 3, md: 6 }}>
        <Stack spacing={5}>
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={{ base: 4, md: 5 }}>
            <Flex direction={{ base: "column", lg: "row" }} align={{ base: "stretch", lg: "center" }} justify="space-between" gap={4}>
              <Box minW={0}>
                <HStack spacing={2} mb={2} wrap="wrap">
                  <Badge colorScheme={scope.mode === "scoped" ? "orange" : "blue"} borderRadius="full" px={3} py={1}>
                    {scope.mode === "scoped" ? "Scoped HR" : "Company-wide HR"}
                  </Badge>
                  <Badge colorScheme="gray" borderRadius="full" px={3} py={1}>
                    {formatRole(role)}
                  </Badge>
                </HStack>
                <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="900" lineHeight="1.1">
                  HR Dashboard
                </Text>
                <Text mt={2} color={muted} fontSize="sm">
                  {scope.companyName || "Selected company"} employee health, setup gaps, organization coverage, and recent HR activity.
                </Text>
              </Box>
              <HStack spacing={2} wrap="wrap">
                <Button leftIcon={<FiUsers />} colorScheme="blue" onClick={() => router.push("/dashboard/users")}>
                  Employees
                </Button>
                {hasPermission(auth.user, PERMISSION_KEYS.CREATE_USERS) ? (
                  <Button variant="outline" leftIcon={<FiPlus />} onClick={() => router.push("/dashboard/users")}>
                    Add
                  </Button>
                ) : null}
              </HStack>
            </Flex>
          </Box>

          {loading ? (
            <Center minH="360px">
              <VStack spacing={3}>
                <Spinner size="xl" color="blue.500" thickness="4px" />
                <Text color={muted} fontWeight="700">
                  Loading HR dashboard...
                </Text>
              </VStack>
            </Center>
          ) : error ? (
            <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={6}>
              <HStack align="flex-start" spacing={3}>
                <Icon as={FiAlertCircle} color="red.500" boxSize={5} mt={1} />
                <Box>
                  <Text fontWeight="900">Could not load HR dashboard</Text>
                  <Text mt={1} color={muted} fontSize="sm">
                    {error}
                  </Text>
                  <Button mt={4} size="sm" onClick={() => dashboardStore.fetchHrSummary().catch(() => undefined)}>
                    Retry
                  </Button>
                </Box>
              </HStack>
            </Box>
          ) : (
            <>
              <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
                <StatCard label="Employees" value={totalEmployees} helper="Employees and department heads in scope" icon={FiUsers} color="blue" />
                <StatCard label="Active" value={numberValue(stats.activeEmployees)} helper={`${numberValue(stats.pendingEmployees)} pending setup`} icon={FiCheckCircle} color="green" />
                <StatCard label="Managers" value={numberValue(stats.managers)} helper={`${numberValue(stats.departmentHeads)} department heads`} icon={FiUserCheck} color="purple" />
                <StatCard label="Pending Work" value={numberValue(stats.incompleteProfiles)} helper="Profiles missing core HR data" icon={FiAlertCircle} color="orange" />
              </SimpleGrid>

              <Grid templateColumns={{ base: "1fr", xl: "1.35fr 0.65fr" }} gap={5} alignItems="start">
                <GridItem>
                  <Stack spacing={5}>
                    <Section title="Pending HR Work" helper="Operational gaps to clean up before employee records are reliable.">
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        {(summary.pendingWork || []).map((item: any) => (
                          <Flex
                            key={item.key}
                            align="center"
                            justify="space-between"
                            gap={3}
                            borderWidth="1px"
                            borderColor={borderColor}
                            borderRadius="lg"
                            p={3}
                          >
                            <Box minW={0}>
                              <Text fontSize="sm" fontWeight="800" noOfLines={1}>
                                {item.label}
                              </Text>
                              <Text fontSize="xs" color={muted}>
                                Needs HR review
                              </Text>
                            </Box>
                            <Badge colorScheme={numberValue(item.count) ? "orange" : "green"} borderRadius="full" px={3} py={1}>
                              {numberValue(item.count)}
                            </Badge>
                          </Flex>
                        ))}
                      </SimpleGrid>
                    </Section>

                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                      <Section title="By Department" helper="Employee distribution across departments.">
                        <BreakdownList items={summary.breakdowns?.departments || []} total={totalEmployees} />
                      </Section>
                      <Section title="By Location" helper="Employee distribution across office locations.">
                        <BreakdownList items={summary.breakdowns?.locations || []} total={totalEmployees} />
                      </Section>
                      <Section title="By Team" helper="Optional team coverage inside departments.">
                        <BreakdownList items={summary.breakdowns?.teams || []} total={totalEmployees} />
                      </Section>
                      <Section title="Account Status" helper="Active, pending, and inactive employees.">
                        <BreakdownList items={summary.breakdowns?.statuses || []} total={totalEmployees} />
                      </Section>
                    </SimpleGrid>

                    <Section title="Recent Employees" helper="Latest employee records created in this scope.">
                      <PersonList items={summary.recentEmployees || []} emptyText="No employees found in this scope." />
                    </Section>
                  </Stack>
                </GridItem>

                <GridItem>
                  <Stack spacing={5}>
                    <Section title="Quick Actions" helper="Shortcuts based on this account's permissions.">
                      <SimpleGrid columns={{ base: 1, sm: 2, xl: 1 }} spacing={3}>
                        {quickActions.map((action) => (
                          <Button
                            key={action.label}
                            justifyContent="flex-start"
                            variant="outline"
                            leftIcon={<Icon as={action.icon} />}
                            onClick={() => router.push(action.href)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </SimpleGrid>
                    </Section>

                    <Section title="Scope" helper={scope.mode === "scoped" ? "This HR user is limited to the scope below." : "This account can work across the company."}>
                      <Stack spacing={3}>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color={muted}>Departments</Text>
                          <Badge borderRadius="full">{numberValue(stats.departments)}</Badge>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color={muted}>Teams</Text>
                          <Badge borderRadius="full">{numberValue(stats.teams)}</Badge>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color={muted}>Locations</Text>
                          <Badge borderRadius="full">{numberValue(stats.locations)}</Badge>
                        </HStack>
                        {scope.mode === "scoped" ? (
                          <Stack spacing={2} pt={2}>
                            <Text fontSize="xs" fontWeight="900" color={muted} textTransform="uppercase">
                              Assigned Departments
                            </Text>
                            <HStack wrap="wrap">
                              {(scope.departments || []).length ? (
                                scope.departments.map((department: string) => (
                                  <Badge key={department} colorScheme="orange" borderRadius="full" px={3} py={1}>
                                    {department}
                                  </Badge>
                                ))
                              ) : (
                                <Text fontSize="sm" color={muted}>No department scope</Text>
                              )}
                            </HStack>
                          </Stack>
                        ) : null}
                      </Stack>
                    </Section>

                    <Section title="Upcoming" helper="Useful dates from employee records.">
                      <Stack spacing={4}>
                        <Box>
                          <HStack mb={2}>
                            <Icon as={FiTrendingUp} color="green.500" />
                            <Text fontSize="sm" fontWeight="900">New Joiners</Text>
                          </HStack>
                          {(summary.upcoming?.newJoiners || []).length ? (
                            (summary.upcoming.newJoiners || []).slice(0, 3).map((user: any) => (
                              <Text key={`join-${user._id}`} fontSize="sm" color={muted}>
                                {user.name} | {formatDate(user.joiningDate)}
                              </Text>
                            ))
                          ) : (
                            <Text fontSize="sm" color={muted}>No new joiners this month.</Text>
                          )}
                        </Box>
                        <Box>
                          <HStack mb={2}>
                            <Icon as={FiCalendar} color="purple.500" />
                            <Text fontSize="sm" fontWeight="900">Birthdays</Text>
                          </HStack>
                          {(summary.upcoming?.birthdays || []).length ? (
                            (summary.upcoming.birthdays || []).slice(0, 3).map((user: any) => (
                              <Text key={`birth-${user._id}`} fontSize="sm" color={muted}>
                                {user.name} | {formatDate(user.dateOfBirth)}
                              </Text>
                            ))
                          ) : (
                            <Text fontSize="sm" color={muted}>No birthdays this month.</Text>
                          )}
                        </Box>
                        <Box>
                          <HStack mb={2}>
                            <Icon as={FiClock} color="orange.500" />
                            <Text fontSize="sm" fontWeight="900">Anniversaries</Text>
                          </HStack>
                          {(summary.upcoming?.anniversaries || []).length ? (
                            (summary.upcoming.anniversaries || []).slice(0, 3).map((user: any) => (
                              <Text key={`ann-${user._id}`} fontSize="sm" color={muted}>
                                {user.name} | {formatDate(user.joiningDate)}
                              </Text>
                            ))
                          ) : (
                            <Text fontSize="sm" color={muted}>No anniversaries this month.</Text>
                          )}
                        </Box>
                      </Stack>
                    </Section>
                  </Stack>
                </GridItem>
              </Grid>
            </>
          )}
        </Stack>
      </Box>
    </PermissionGate>
  );
});

export default HrDashboardPage;
