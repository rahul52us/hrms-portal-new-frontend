"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";

import { StatCard } from "@/app/component/common/StatCard/StatCard";
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
import { PageBanner } from "@/app/component/common/PageBanner/PageBanner";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiInbox,
  FiMapPin,
  FiPieChart,
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

const Section = ({ title, helper, children, action }: any) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const shadow = useColorModeValue("0 4px 24px -6px rgba(0,0,0,0.06)", "0 4px 24px -6px rgba(0,0,0,0.5)");
  const muted = useColorModeValue("gray.500", "gray.400");
  const brandColor = useColorModeValue("blue.500", "blue.400");

  return (
    <Box
      bg={cardBg}
      borderRadius="2xl"
      p={{ base: 5, md: 7 }}
      boxShadow={shadow}
      transition="all 0.3s ease"
    >
      <Flex align="flex-start" justify="space-between" gap={4} mb={6}>
        <Box minW={0}>
          <HStack spacing={3} align="center" mb={1.5}>
            <Box w="5px" h="20px" bg={brandColor} borderRadius="full" />
            <Text fontSize="xl" fontWeight="900" letterSpacing="-0.5px">
              <Box as="span" color={useColorModeValue("gray.900", "white")}>
                {title.split(" ")[0]}{" "}
              </Box>
              <Box as="span" bgGradient={useColorModeValue("linear(to-r, blue.600, blue.800)", "linear(to-r, blue.200, blue.400)")} bgClip="text">
                {title.split(" ").slice(1).join(" ")}
              </Box>
            </Text>
          </HStack>
          {helper ? (
            <Text fontSize="sm" color={muted} fontWeight="500" pl={4}>
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

const BreakdownList = ({ items = [], total = 0, emptyText = "No data yet", colorScheme = "blue", icon = FiPieChart }: any) => {
  const muted = useColorModeValue("gray.500", "gray.400");

  if (!items.length) {
    return (
      <Center
        py={8}
        px={4}
        bg={useColorModeValue(`${colorScheme}.50`, `color-mix(in srgb, var(--chakra-colors-${colorScheme}-400) 15%, transparent)`)}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={useColorModeValue(`${colorScheme}.200`, `color-mix(in srgb, var(--chakra-colors-${colorScheme}-400) 30%, transparent)`)}
      >
        <VStack spacing={3}>
          <Center
            boxSize={12}
            bg={useColorModeValue("white", `color-mix(in srgb, var(--chakra-colors-${colorScheme}-400) 25%, transparent)`)}
            borderRadius="full"
            boxShadow="sm"
            color={useColorModeValue(`${colorScheme}.500`, `${colorScheme}.300`)}
            borderWidth="1px"
            borderColor={useColorModeValue(`${colorScheme}.100`, "transparent")}
          >
            <Icon as={icon} boxSize={5} />
          </Center>
          <Text fontSize="sm" fontWeight="700" color={useColorModeValue(`${colorScheme}.800`, `${colorScheme}.200`)}>
            {emptyText}
          </Text>
        </VStack>
      </Center>
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
      <Center
        py={8}
        px={4}
        bg={useColorModeValue("purple.50", "purple.900/20")}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={useColorModeValue("purple.100", "purple.800/50")}
      >
        <VStack spacing={3}>
          <Center
            boxSize={12}
            bg={useColorModeValue("white", "purple.800")}
            borderRadius="full"
            boxShadow="sm"
            color={useColorModeValue("purple.500", "purple.300")}
          >
            <Icon as={FiUsers} boxSize={5} />
          </Center>
          <Text fontSize="sm" fontWeight="700" color={useColorModeValue("purple.800", "purple.200")}>
            {emptyText}
          </Text>
        </VStack>
      </Center>
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
      href: "/dashboard/users?action=add",
      icon: FiPlus,
      show: hasPermission(auth.user, PERMISSION_KEYS.CREATE_USERS),
    },
    {
      label: "Bulk Upload",
      href: "/dashboard/users?action=bulk",
      icon: FiUsers,
      show: hasPermission(auth.user, PERMISSION_KEYS.CREATE_USERS),
    },
    {
      label: "Reporting Lines",
      href: "/dashboard/users?issue=missing_manager",
      icon: FiUserCheck,
      show: hasPermission(auth.user, PERMISSION_KEYS.ASSIGN_MANAGERS),
    },
    {
      label: "Add HR",
      href: "/dashboard/users?action=add&role=hr",
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
      <Box minH="100dvh">
        <Stack spacing={6} maxW="1400px" mx="auto">
          <PageBanner
            titlePrefix="HR"
            titleHighlight="DASHBOARD"
            subtitle={`${scope.companyName || "Selected company"} employee health, setup gaps, organization coverage, and recent HR activity.`}
            icon={FiUsers}
            showBackButton={false}
            colorScheme="blue"
          />

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
                        {(summary.pendingWork || []).map((item: any, index: number) => {
                          const hasWork = !!numberValue(item.count);
                          const pastelSchemes = ["red", "green", "blue", "cyan", "orange"];
                          const scheme = hasWork ? "orange" : pastelSchemes[index % pastelSchemes.length];

                          return (
                          <Button
                            key={item.key}
                            variant="unstyled"
                            height="auto"
                            p={4}
                            borderWidth="1px"
                            borderColor={useColorModeValue(
                              `${scheme}.200`,
                              `color-mix(in srgb, var(--chakra-colors-${scheme}-400) 40%, transparent)`
                            )}
                            bg={useColorModeValue(
                              `${scheme}.50`,
                              `color-mix(in srgb, var(--chakra-colors-${scheme}-400) 25%, transparent)`
                            )}
                            borderRadius="xl"
                            whiteSpace="normal"
                            display="block"
                            w="100%"
                            isDisabled={!hasWork}
                            onClick={() => router.push(item.href)}
                            _hover={hasWork ? {
                              transform: "translateY(-2px)",
                              boxShadow: "sm",
                              borderColor: useColorModeValue(`${scheme}.300`, `color-mix(in srgb, var(--chakra-colors-${scheme}-400) 60%, transparent)`),
                              bg: useColorModeValue(`${scheme}.100`, `color-mix(in srgb, var(--chakra-colors-${scheme}-400) 35%, transparent)`)
                            } : undefined}
                            transition="all 0.2s"
                            _disabled={{ opacity: 0.75, cursor: "not-allowed" }}
                          >
                            <Flex
                              align="center"
                              justify="space-between"
                              gap={3}
                              width="full"
                            >
                              <Box minW={0} textAlign="left">
                                <Text fontSize="sm" fontWeight="800" color={useColorModeValue(`${scheme}.800`, `${scheme}.100`)} noOfLines={1}>
                                  {item.label}
                                </Text>
                                <Text fontSize="xs" color={useColorModeValue(`${scheme}.700`, `${scheme}.300`)} mt={1}>
                                  {hasWork
                                    ? "Open employee work queue"
                                    : "No action required"}
                                </Text>
                              </Box>
                              <Badge
                                colorScheme={scheme}
                                borderRadius="full"
                                px={3}
                                py={1}
                                fontSize="xs"
                                variant={hasWork ? "solid" : "subtle"}
                              >
                                {numberValue(item.count)}
                              </Badge>
                            </Flex>
                          </Button>
                          );
                        })}
                      </SimpleGrid>
                    </Section>

                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                      <Section title="By Department" helper="Employee distribution across departments.">
                        <BreakdownList items={summary.breakdowns?.departments || []} total={totalEmployees} colorScheme="purple" icon={FiBriefcase} />
                      </Section>
                      <Section title="By Location" helper="Employee distribution across office locations.">
                        <BreakdownList items={summary.breakdowns?.locations || []} total={totalEmployees} colorScheme="teal" icon={FiMapPin} />
                      </Section>
                      <Section title="By Team" helper="Optional team coverage inside departments.">
                        <BreakdownList items={summary.breakdowns?.teams || []} total={totalEmployees} colorScheme="pink" icon={FiUsers} />
                      </Section>
                      <Section title="Account Status" helper="Active, pending, and inactive employees.">
                        <BreakdownList items={summary.breakdowns?.statuses || []} total={totalEmployees} colorScheme="orange" icon={FiUserCheck} />
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
                        {quickActions.map((action, index) => {
                          const schemes = ["red", "cyan", "yellow", "green", "pink", "orange"];
                          const scheme = schemes[index % schemes.length];

                          return (
                          <Button
                            key={action.label}
                            justifyContent="flex-start"
                            variant="unstyled"
                            size="lg"
                            height="auto"
                            py={3}
                            px={4}
                            borderRadius="xl"
                            borderWidth="1px"
                            borderColor={useColorModeValue(`${scheme}.200`, `color-mix(in srgb, var(--chakra-colors-${scheme}-400) 40%, transparent)`)}
                            bg={useColorModeValue(`${scheme}.50`, `color-mix(in srgb, var(--chakra-colors-${scheme}-400) 25%, transparent)`)}
                            leftIcon={
                              <Center boxSize={8} borderRadius="md" bg={useColorModeValue(`${scheme}.100`, `color-mix(in srgb, var(--chakra-colors-${scheme}-400) 35%, transparent)`)} color={useColorModeValue(`${scheme}.600`, `${scheme}.200`)} mr={2}>
                                <Icon as={action.icon} boxSize={4} />
                              </Center>
                            }
                            onClick={() => router.push(action.href)}
                            _hover={{
                              bg: useColorModeValue(`${scheme}.100`, `color-mix(in srgb, var(--chakra-colors-${scheme}-400) 35%, transparent)`),
                              transform: "translateX(4px)",
                              borderColor: useColorModeValue(`${scheme}.300`, `color-mix(in srgb, var(--chakra-colors-${scheme}-400) 60%, transparent)`),
                            }}
                            transition="all 0.2s"
                            fontWeight="700"
                            fontSize="sm"
                            display="flex"
                            alignItems="center"
                            color={useColorModeValue(`${scheme}.800`, `${scheme}.100`)}
                          >
                            {action.label}
                          </Button>
                          );
                        })}
                      </SimpleGrid>
                    </Section>

                    <Section title="Scope" helper={scope.mode === "scoped" ? "This HR user is limited to the scope below." : "This account can work across the company."}>
                      <Stack spacing={4}>
                        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                          <Box bg={useColorModeValue("purple.50", "color-mix(in srgb, var(--chakra-colors-purple-400) 15%, transparent)")} p={3} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue("purple.200", "color-mix(in srgb, var(--chakra-colors-purple-400) 30%, transparent)")}>
                            <Text fontSize="xs" fontWeight="800" color={useColorModeValue("purple.600", "purple.300")} textTransform="uppercase">Depts</Text>
                            <Text fontSize="xl" fontWeight="900" mt={1} color={useColorModeValue("purple.900", "purple.100")}>{numberValue(stats.departments)}</Text>
                          </Box>
                          <Box bg={useColorModeValue("teal.50", "color-mix(in srgb, var(--chakra-colors-teal-400) 15%, transparent)")} p={3} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue("teal.200", "color-mix(in srgb, var(--chakra-colors-teal-400) 30%, transparent)")}>
                            <Text fontSize="xs" fontWeight="800" color={useColorModeValue("teal.600", "teal.300")} textTransform="uppercase">Teams</Text>
                            <Text fontSize="xl" fontWeight="900" mt={1} color={useColorModeValue("teal.900", "teal.100")}>{numberValue(stats.teams)}</Text>
                          </Box>
                          <Box bg={useColorModeValue("blue.50", "color-mix(in srgb, var(--chakra-colors-blue-400) 15%, transparent)")} p={3} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue("blue.200", "color-mix(in srgb, var(--chakra-colors-blue-400) 30%, transparent)")}>
                            <Text fontSize="xs" fontWeight="800" color={useColorModeValue("blue.600", "blue.300")} textTransform="uppercase">Locations</Text>
                            <Text fontSize="xl" fontWeight="900" mt={1} color={useColorModeValue("blue.900", "blue.100")}>{numberValue(stats.locations)}</Text>
                          </Box>
                        </SimpleGrid>
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
                      <Stack spacing={5}>
                        <Box pl={4} py={1} borderLeftWidth="3px" borderLeftColor="green.400">
                          <HStack mb={2}>
                            <Icon as={FiTrendingUp} color="green.500" />
                            <Text fontSize="sm" fontWeight="800" color={useColorModeValue("gray.800", "white")}>New Joiners</Text>
                          </HStack>
                          {(summary.upcoming?.newJoiners || []).length ? (
                            <Stack spacing={1}>
                              {(summary.upcoming.newJoiners || []).slice(0, 3).map((user: any) => (
                                <Text key={`join-${user._id}`} fontSize="sm" color={muted}>
                                  <Text as="span" fontWeight="600">{user.name}</Text> • {formatDate(user.joiningDate)}
                                </Text>
                              ))}
                            </Stack>
                          ) : (
                            <Text fontSize="sm" color={muted} fontStyle="italic">No new joiners this month.</Text>
                          )}
                        </Box>
                        <Box pl={4} py={1} borderLeftWidth="3px" borderLeftColor="purple.400">
                          <HStack mb={2}>
                            <Icon as={FiCalendar} color="purple.500" />
                            <Text fontSize="sm" fontWeight="800" color={useColorModeValue("gray.800", "white")}>Birthdays</Text>
                          </HStack>
                          {(summary.upcoming?.birthdays || []).length ? (
                            <Stack spacing={1}>
                              {(summary.upcoming.birthdays || []).slice(0, 3).map((user: any) => (
                                <Text key={`birth-${user._id}`} fontSize="sm" color={muted}>
                                  <Text as="span" fontWeight="600">{user.name}</Text> • {formatDate(user.dateOfBirth)}
                                </Text>
                              ))}
                            </Stack>
                          ) : (
                            <Text fontSize="sm" color={muted} fontStyle="italic">No birthdays this month.</Text>
                          )}
                        </Box>
                        <Box pl={4} py={1} borderLeftWidth="3px" borderLeftColor="orange.400">
                          <HStack mb={2}>
                            <Icon as={FiClock} color="orange.500" />
                            <Text fontSize="sm" fontWeight="800" color={useColorModeValue("gray.800", "white")}>Anniversaries</Text>
                          </HStack>
                          {(summary.upcoming?.anniversaries || []).length ? (
                            <Stack spacing={1}>
                              {(summary.upcoming.anniversaries || []).slice(0, 3).map((user: any) => (
                                <Text key={`ann-${user._id}`} fontSize="sm" color={muted}>
                                  <Text as="span" fontWeight="600">{user.name}</Text> • {formatDate(user.joiningDate)}
                                </Text>
                              ))}
                            </Stack>
                          ) : (
                            <Text fontSize="sm" color={muted} fontStyle="italic">No anniversaries this month.</Text>
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
