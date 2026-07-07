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
  Grid,
  Heading,
  HStack,
  Icon,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  Activity,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { DashboardFilters } from "./DashboardFilters";
import { DashboardInsights } from "./DashboardInsights";
import {
  DashboardFiltersValue,
  SuperadminDashboardSummary,
} from "./types";

type SuperadminDashboardProps = {
  summary: SuperadminDashboardSummary;
  isLoading: boolean;
  error: string | null;
  onRefresh: (filters?: Record<string, string>) => Promise<unknown>;
};

const emptyFilters: DashboardFiltersValue = {
  from: "",
  to: "",
  companyId: "",
  role: "",
  courseId: "",
  batchStatus: "",
  activityStatus: "",
};

const statDefinitions = [
  { key: "totalCompanies", label: "Companies", detailKey: "activeCompanies", detail: "active", icon: Building2, color: "purple" },
  { key: "totalUsers", label: "Users", detailKey: "activeUsers", detail: "active", icon: Users, color: "blue" },
  { key: "totalCourses", label: "Courses", detailKey: "publishedCourses", detail: "published", icon: BookOpen, color: "teal" },
  { key: "totalBatches", label: "Batches", detailKey: "activeBatches", detail: "active", icon: GraduationCap, color: "orange" },
  { key: "completionRate", label: "Completion", suffix: "%", detailKey: "completedEnrollments", detail: "completed", icon: CheckCircle2, color: "green" },
  { key: "averageQuizScore", label: "Quiz average", suffix: "%", detailKey: "quizAttempts", detail: "attempts", icon: ClipboardCheck, color: "pink" },
] as const;

function asNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function MetricCard({
  label,
  value,
  suffix,
  detail,
  icon,
  color,
  isLoading,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  detail: string;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
}) {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const iconBg = useColorModeValue(`${color}.50`, `${color}.900`);
  const iconColor = useColorModeValue(`${color}.600`, `${color}.200`);

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      p={{ base: 3, md: 4 }}
      boxShadow="sm"
      transition="transform 0.18s ease, box-shadow 0.18s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
      minW={0}
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" color="gray.500" fontWeight="semibold">
            {label}
          </Text>
          <Skeleton isLoaded={!isLoading} mt={1} minH="34px">
            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" lineHeight="1.2">
              {value === null ? "N/A" : `${value.toLocaleString()}${suffix || ""}`}
            </Text>
          </Skeleton>
          <Text fontSize="xs" color="gray.500" mt={2} noOfLines={1}>
            {detail}
          </Text>
        </Box>
        <Flex
          boxSize={{ base: "34px", md: "38px" }}
          align="center"
          justify="center"
          borderRadius="xl"
          bg={iconBg}
          color={iconColor}
          flexShrink={0}
        >
          <Icon as={icon} boxSize={4} />
        </Flex>
      </Flex>
    </Box>
  );
}

export function SuperadminDashboard({
  summary,
  isLoading,
  error,
  onRefresh,
}: SuperadminDashboardProps) {
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const heroBg = useColorModeValue(
    "linear-gradient(135deg, #312E81 0%, #6D28D9 55%, #0F766E 125%)",
    "linear-gradient(135deg, #111827 0%, #312E81 60%, #134E4A 125%)"
  );
  const panelBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const [filters, setFilters] = useState<DashboardFiltersValue>(() => ({
    ...emptyFilters,
    ...summary.appliedFilters,
  }));

  const stats = summary.stats || {};
  const charts = summary.charts || {};
  const highlights = summary.highlights || {};
  const availability = summary.availability || {};
  const options = summary.filterOptions || {};

  const applyFilters = () => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => Boolean(value))
    );
    void onRefresh(params);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    void onRefresh({});
  };

  if (error && !summary.stats) {
    return (
      <Box bg={pageBg} minH="100vh" p={{ base: 3, md: 6 }}>
        <Alert status="error" borderRadius="2xl">
          <AlertIcon />
          <Box>
            <AlertTitle>Unable to load Superadmin analytics</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button
              mt={3}
              size="sm"
              leftIcon={<RefreshCw size={15} />}
              onClick={() => void onRefresh({})}
            >
              Try again
            </Button>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} minH="100vh" p={{ base: 3, md: 5 }}>
      <Stack spacing={4} maxW="1600px" mx="auto">
        <Box
          bgImage={heroBg}
          color="white"
          borderRadius={{ base: "2xl", md: "3xl" }}
          p={{ base: 4, md: 6 }}
          position="relative"
          overflow="hidden"
          boxShadow="lg"
        >
          <Box
            position="absolute"
            inset="-60% auto auto 55%"
            boxSize="360px"
            borderRadius="full"
            bg="whiteAlpha.100"
          />
          <Flex justify="space-between" align="center" gap={4} wrap="wrap" position="relative">
            <Box>
              <HStack spacing={2} mb={2}>
                <Badge colorScheme="purple" bg="whiteAlpha.200" color="white" borderRadius="full" px={3} py={1}>
                  Superadmin · platform scope
                </Badge>
                <Icon as={Sparkles} boxSize={4} color="purple.100" />
              </HStack>
              <Heading size={{ base: "md", md: "lg" }}>LMS intelligence center</Heading>
              <Text mt={2} color="whiteAlpha.800" fontSize={{ base: "sm", md: "md" }} maxW="720px">
                Portal health, learning performance, engagement risks, and operational work in one compact view.
              </Text>
            </Box>
            <Button
              size="sm"
              variant="outline"
              color="white"
              borderColor="whiteAlpha.500"
              _hover={{ bg: "whiteAlpha.200" }}
              leftIcon={<RefreshCw size={15} />}
              isLoading={isLoading}
              onClick={applyFilters}
            >
              Refresh
            </Button>
          </Flex>
        </Box>

        <DashboardFilters
          value={filters}
          companies={options.companies || []}
          roles={options.roles || []}
          courses={options.courses || []}
          isLoading={isLoading}
          onChange={setFilters}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        {error ? (
          <Alert status="warning" borderRadius="xl">
            <AlertIcon />
            <AlertDescription>
              The last refresh failed. Showing the most recently loaded dashboard data.
            </AlertDescription>
          </Alert>
        ) : null}

        <SimpleGrid columns={{ base: 2, md: 3, xl: 6 }} spacing={3}>
          {statDefinitions.map((definition) => {
            const value = asNumber(stats[definition.key]);
            const detailValue = asNumber(stats[definition.detailKey]);
            return (
              <MetricCard
                key={definition.key}
                label={definition.label}
                value={value}
                suffix={"suffix" in definition ? definition.suffix : undefined}
                detail={`${detailValue === null ? "N/A" : detailValue.toLocaleString()} ${definition.detail}`}
                icon={definition.icon}
                color={definition.color}
                isLoading={isLoading}
              />
            );
          })}
        </SimpleGrid>

        <Grid templateColumns={{ base: "1fr", lg: "1.25fr 0.75fr" }} gap={4}>
          <Box
            bg={panelBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="2xl"
            p={{ base: 4, md: 5 }}
            boxShadow="sm"
          >
            <Flex justify="space-between" align="center" mb={4}>
              <Box>
                <Heading size="sm">Learner progress</Heading>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Measured from enrollment and course progress records
                </Text>
              </Box>
              <Icon as={Activity} color="teal.500" />
            </Flex>
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
              <Box>
                <Text fontSize="xs" color="gray.500">Average progress</Text>
                <Text fontSize="2xl" fontWeight="800">
                  {asNumber(stats.averageProgress) === null ? "N/A" : `${stats.averageProgress}%`}
                </Text>
                <Progress
                  value={asNumber(stats.averageProgress) || 0}
                  colorScheme="teal"
                  size="sm"
                  borderRadius="full"
                  mt={2}
                />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">Enrollment completion</Text>
                <Text fontSize="2xl" fontWeight="800">
                  {asNumber(stats.completionRate) === null ? "N/A" : `${stats.completionRate}%`}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  {asNumber(stats.completedEnrollments) || 0} of {asNumber(stats.totalEnrollments) || 0} completed
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">Low engagement</Text>
                <Text fontSize="2xl" fontWeight="800" color="orange.500">
                  {asNumber(stats.lowEngagementUsers) || 0}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Enrolled learners without progress activity in 30 days
                </Text>
              </Box>
            </Grid>
          </Box>

          <Box
            bg={panelBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="2xl"
            p={{ base: 4, md: 5 }}
            boxShadow="sm"
          >
            <Heading size="sm">Operational attention</Heading>
            <Text fontSize="xs" color="gray.500" mt={1} mb={4}>
              Items that may need Superadmin follow-up
            </Text>
            <Stack spacing={3}>
              <Flex justify="space-between" p={3} bg={pageBg} borderRadius="xl">
                <Text fontSize="sm">Pending assessment reviews</Text>
                <Badge colorScheme={stats.pendingReviews ? "orange" : "green"}>
                  {asNumber(stats.pendingReviews) ?? "N/A"}
                </Badge>
              </Flex>
              <Flex justify="space-between" p={3} bg={pageBg} borderRadius="xl">
                <Text fontSize="sm">Expiring within 30 days</Text>
                <Badge colorScheme={stats.expiringItems ? "yellow" : "green"}>
                  {asNumber(stats.expiringItems) || 0}
                </Badge>
              </Flex>
              <Flex justify="space-between" p={3} bg={pageBg} borderRadius="xl">
                <Text fontSize="sm">Inactive companies</Text>
                <Badge colorScheme={stats.inactiveCompanies ? "gray" : "green"}>
                  {asNumber(stats.inactiveCompanies) || 0}
                </Badge>
              </Flex>
            </Stack>
          </Box>
        </Grid>

        <AnalyticsCharts charts={charts} availability={availability} />
        <DashboardInsights highlights={highlights} />
      </Stack>
    </Box>
  );
}
