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
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiBookOpen,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiGrid,
  FiLayers,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import stores from "@/app/store/stores";
import { SuperadminDashboard } from "./components/superadmin-dashboard/SuperadminDashboard";
import { SuperadminDashboardSummary } from "./components/superadmin-dashboard/types";
import { DashboardCharts } from "./components/scoped-dashboard/DashboardCharts";
import { DashboardFilters } from "./components/scoped-dashboard/DashboardFilters";
import {
  EMPTY_SCOPED_FILTERS,
  ScopedDashboardFilters,
  ScopedDashboardSummary,
} from "./components/scoped-dashboard/types";

type StatCardProps = {
  label: string;
  value: number | string;
  helper: string;
  icon: any;
  colorScheme: string;
};

function StatCard({ label, value, helper, icon, colorScheme }: StatCardProps) {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={{ base: 3.5, md: 4 }}
      boxShadow="sm"
      transition="transform .18s ease, box-shadow .18s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
      minW={0}
    >
      <Flex justify="space-between" gap={3}>
        <Stat minW={0}>
          <StatLabel color="gray.500" fontSize="xs" noOfLines={1}>
            {label}
          </StatLabel>
          <StatNumber mt={1} fontSize={{ base: "xl", md: "2xl" }} lineHeight="1.15">
            {typeof value === "number" ? value.toLocaleString() : value}
          </StatNumber>
          <Text mt={1.5} fontSize="xs" color="gray.500" noOfLines={1}>
            {helper}
          </Text>
        </Stat>
        <Flex
          align="center"
          justify="center"
          w="36px"
          h="36px"
          flexShrink={0}
          borderRadius="lg"
          bg={`${colorScheme}.50`}
          color={`${colorScheme}.600`}
        >
          <Icon as={icon} boxSize={4.5} />
        </Flex>
      </Flex>
    </Box>
  );
}

function DashboardSkeleton() {
  return (
    <Stack spacing={4} p={{ base: 3, md: 5 }}>
      <Skeleton h="132px" borderRadius="2xl" />
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} h="112px" borderRadius="xl" />
        ))}
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
        <Skeleton h="300px" borderRadius="xl" />
        <Skeleton h="300px" borderRadius="xl" />
      </SimpleGrid>
    </Stack>
  );
}

const ScopedDashboard = observer(() => {
  const {
    dashboardStore: { fetchScopedSummary, scopedSummary, scopedSummaryError, scopedSummaryLoading },
  } = stores;
  const [draftFilters, setDraftFilters] =
    useState<ScopedDashboardFilters>(EMPTY_SCOPED_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<ScopedDashboardFilters>(EMPTY_SCOPED_FILTERS);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const heroBg = useColorModeValue("white", "gray.800");
  const heroBorder = useColorModeValue("gray.200", "gray.700");
  const summary = scopedSummary as ScopedDashboardSummary | SuperadminDashboardSummary | null;
  const role = String(summary?.role || "").toLowerCase();

  useEffect(() => {
    const params = Object.fromEntries(
      Object.entries(appliedFilters).filter(([, value]) => Boolean(value))
    );
    fetchScopedSummary(params).catch(() => undefined);
  }, [appliedFilters, fetchScopedSummary]);

  if (scopedSummaryLoading && !summary) {
    return <DashboardSkeleton />;
  }

  if (scopedSummaryError && !summary) {
    return (
      <Box p={{ base: 3, md: 6 }}>
        <Alert status="error" borderRadius="xl">
          <AlertIcon />
          <Box flex={1}>
            <AlertTitle>Unable to load dashboard</AlertTitle>
            <AlertDescription>{scopedSummaryError}</AlertDescription>
          </Box>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<FiRefreshCw />}
            onClick={() => fetchScopedSummary().catch(() => undefined)}
          >
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  if (role === "superadmin" && summary) {
    return (
      <SuperadminDashboard
        summary={summary as SuperadminDashboardSummary}
        isLoading={scopedSummaryLoading}
        error={scopedSummaryError}
        onRefresh={fetchScopedSummary}
      />
    );
  }

  if (!summary || !["admin", "departmenthead"].includes(role)) {
    return <DashboardSkeleton />;
  }

  const scoped = summary as ScopedDashboardSummary;
  const scope = scoped.scope || {};
  const stats = scoped.stats || {};
  const isAdmin = role === "admin";
  const completionRate =
    typeof stats.completionRate === "number" ? `${stats.completionRate}%` : "No data";
  const averageProgress =
    typeof stats.averageProgress === "number" ? `${stats.averageProgress}%` : "No data";
  const averageQuizScore =
    typeof stats.averageQuizScore === "number" ? `${stats.averageQuizScore}%` : "No data";

  const statCards: StatCardProps[] = isAdmin
    ? [
        {
          label: "Company users",
          value: stats.totalUsers || 0,
          helper: `${stats.activeUsers || 0} active`,
          icon: FiUsers,
          colorScheme: "purple",
        },
        {
          label: "Departments",
          value: stats.totalDepartments || 0,
          helper: "Company structure",
          icon: FiLayers,
          colorScheme: "blue",
        },
        {
          label: "Courses",
          value: stats.totalCourses || 0,
          helper: `${stats.publishedCourses || 0} published`,
          icon: FiBookOpen,
          colorScheme: "teal",
        },
        {
          label: "Completion rate",
          value: completionRate,
          helper: `${stats.completedEnrollments || 0} completions`,
          icon: FiCheckCircle,
          colorScheme: "green",
        },
        {
          label: "Average progress",
          value: averageProgress,
          helper: `${stats.totalEnrollments || 0} enrollments`,
          icon: FiTrendingUp,
          colorScheme: "purple",
        },
        {
          label: "Active batches",
          value: stats.activeBatches || 0,
          helper: `${stats.totalBatches || 0} total batches`,
          icon: FiGrid,
          colorScheme: "orange",
        },
        {
          label: "Quiz average",
          value: averageQuizScore,
          helper: `${stats.quizAttempts || 0} attempts`,
          icon: FiTarget,
          colorScheme: "pink",
        },
        {
          label: "Needs attention",
          value: stats.lowEngagementUsers || 0,
          helper: `${stats.pendingCompletions || 0} pending`,
          icon: FiAlertCircle,
          colorScheme: "red",
        },
      ]
    : [
        {
          label: "Department users",
          value: stats.totalUsers || 0,
          helper: `${stats.activeUsers || 0} active`,
          icon: FiUsers,
          colorScheme: "teal",
        },
        {
          label: "Assigned courses",
          value: stats.totalCourses || 0,
          helper: `${stats.publishedCourses || 0} published`,
          icon: FiBookOpen,
          colorScheme: "blue",
        },
        {
          label: "Completion rate",
          value: completionRate,
          helper: `${stats.completedEnrollments || 0} complete`,
          icon: FiCheckCircle,
          colorScheme: "green",
        },
        {
          label: "Pending courses",
          value: stats.pendingCompletions || 0,
          helper: "Still to complete",
          icon: FiClock,
          colorScheme: "orange",
        },
        {
          label: "Average progress",
          value: averageProgress,
          helper: `${stats.totalEnrollments || 0} enrollments`,
          icon: FiTrendingUp,
          colorScheme: "purple",
        },
        {
          label: "Quiz average",
          value: averageQuizScore,
          helper: `${stats.quizAttempts || 0} attempts`,
          icon: FiTarget,
          colorScheme: "pink",
        },
        {
          label: "Learners at risk",
          value: stats.lowEngagementUsers || 0,
          helper: "Inactive for 30+ days",
          icon: FiAlertCircle,
          colorScheme: "red",
        },
        {
          label: "Upcoming deadlines",
          value: stats.expiringItems || 0,
          helper: "Within 30 days",
          icon: FiActivity,
          colorScheme: "orange",
        },
      ];

  return (
    <Box minH="100vh" bg={pageBg} p={{ base: 3, md: 5 }}>
      <Stack spacing={4} maxW="1600px" mx="auto">
        <Box
          bg={heroBg}
          borderWidth="1px"
          borderColor={heroBorder}
          borderRadius="2xl"
          p={{ base: 4, md: 5 }}
          boxShadow="sm"
          overflow="hidden"
          position="relative"
        >
          <Box
            position="absolute"
            insetY={0}
            right={0}
            w={{ base: "35%", md: "28%" }}
            bgGradient={isAdmin ? "linear(to-l, purple.100, transparent)" : "linear(to-l, teal.100, transparent)"}
            opacity={useColorModeValue(0.8, 0.08)}
            pointerEvents="none"
          />
          <Flex justify="space-between" align="flex-start" gap={4} position="relative">
            <Box minW={0}>
              <HStack spacing={2} mb={2}>
                <Badge
                  colorScheme={isAdmin ? "purple" : "teal"}
                  borderRadius="full"
                  px={2.5}
                  py={0.5}
                  fontSize="0.65rem"
                >
                  {isAdmin ? "Company scope" : "Department scope"}
                </Badge>
                {scopedSummaryLoading ? (
                  <Badge variant="subtle" borderRadius="full">
                    Refreshing
                  </Badge>
                ) : null}
              </HStack>
              <Heading size={{ base: "md", md: "lg" }} noOfLines={1}>
                {isAdmin
                  ? scope.companyName || "Company dashboard"
                  : scope.departmentName || "Department dashboard"}
              </Heading>
              <Text mt={1.5} color="gray.500" fontSize={{ base: "sm", md: "md" }}>
                {isAdmin
                  ? "Company learning health, people activity, and course performance."
                  : `Learning progress and engagement inside ${scope.companyName || "your company"}.`}
              </Text>
            </Box>
            <HStack display={{ base: "none", md: "flex" }} color={isAdmin ? "purple.500" : "teal.500"}>
              <Icon as={isAdmin ? FiBriefcase : FiLayers} boxSize={5} />
              <Text fontSize="sm" fontWeight="semibold">
                Live scoped analytics
              </Text>
            </HStack>
          </Flex>
        </Box>

        <Flex justify="flex-end" w={'100%'}>
          <DashboardFilters
            role={role as "admin" | "departmenthead"}
            value={draftFilters}
            options={scoped.filterOptions}
            isLoading={scopedSummaryLoading}
            onChange={setDraftFilters}
            onApply={() => setAppliedFilters(draftFilters)}
            onClear={() => {
              setDraftFilters(EMPTY_SCOPED_FILTERS);
              setAppliedFilters(EMPTY_SCOPED_FILTERS);
            }}
          />
        </Flex>

        {scopedSummaryError ? (
          <Alert status="warning" borderRadius="xl" py={2}>
            <AlertIcon />
            <Text fontSize="sm">{scopedSummaryError}. Showing the last available result.</Text>
          </Alert>
        ) : null}

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </SimpleGrid>

        <DashboardCharts
          role={role as "admin" | "departmenthead"}
          charts={scoped.charts}
        />
      </Stack>
    </Box>
  );
});

export default ScopedDashboard;
