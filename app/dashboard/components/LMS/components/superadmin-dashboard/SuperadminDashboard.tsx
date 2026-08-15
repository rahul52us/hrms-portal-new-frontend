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
  AlertCircle,
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

import { StatCard } from "../../../../../component/common/StatCard/StatCard";

export function SuperadminDashboard({
  summary,
  isLoading,
  error,
  onRefresh,
}: SuperadminDashboardProps) {
  
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
      <Box  minH="100vh" p={{ base: 3, md: 6 }}>
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
    <Box minH="100vh" p={{ base: 3, md: 0 }} bg="transparent">
      <Stack spacing={4}>
        <Box bg={panelBg} borderWidth="1px" borderColor={borderColor} rounded={{ base: "xl", md: "2xl" }} px={{ base: 4, md: 6 }} py={{ base: 4, md: 5 }} shadow="sm">
          <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4}>
            <HStack spacing={{ base: 3, md: 4 }} align="flex-start">
              <Box display={{ base: "none", md: "flex" }} p={{ base: 2.5, md: 3 }} bgGradient="linear(to-br, #6269FF, #8A2BE2)" rounded="full" alignItems="center" justifyContent="center" boxShadow="0 4px 15px rgba(98,105,255,0.4)" border="1px solid" borderColor="rgba(255,255,255,0.2)">
                <Icon as={Sparkles} boxSize={{ base: 4, md: 5 }} color="white" />
              </Box>
              <Box>
                <Heading size={{ base: "sm", md: "lg" }} fontWeight="900" letterSpacing="tight" lineHeight="1.2" textTransform="uppercase">
                  <Box as="span" color={useColorModeValue("gray.900", "white")}>
                    HRMS{" "}
                  </Box>
                  <Box as="span" bgGradient={useColorModeValue("linear(to-r, purple.500, purple.700)", "linear(to-r, purple.300, purple.500)")} bgClip="text">
                    INTELLIGENCE CENTER
                  </Box>
                </Heading>
                <Text mt={1} fontSize={{ base: "2xs", md: "xs" }} fontWeight="700" color={useColorModeValue("gray.500", "gray.400")} letterSpacing="0.1em" textTransform="uppercase" noOfLines={1}>
                  Portal health, learning performance, engagement risks, and operational work.
                </Text>
              </Box>
            </HStack>
            
            <HStack spacing={4} w={{ base: "100%", md: "auto" }} justify={{ base: "space-between", md: "flex-end" }}>
              <Badge bg={useColorModeValue("blue.50", "rgba(98,105,255,0.15)")} color="#6269FF" borderRadius="full" px={4} py={2} fontSize="xs" fontWeight="800">
                <Flex align="center" gap={1.5}>
                  <Icon as={Sparkles} boxSize={3.5} />
                  PLATFORM SCOPE
                </Flex>
              </Badge>
              <Button
                size="sm"
                variant="outline"
                color={useColorModeValue("gray.700", "gray.200")}
                borderColor={useColorModeValue("gray.300", "gray.600")}
                _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.100") }}
                leftIcon={<RefreshCw size={14} />}
                isLoading={isLoading}
                onClick={applyFilters}
                borderRadius="full"
                px={4}
              >
                Refresh
              </Button>
            </HStack>
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

        <SimpleGrid columns={{ base: 2, md: 3, xl: 6 }} spacing={4}>
          {statDefinitions.map((definition) => {
            const value = asNumber(stats[definition.key]);
            const detailValue = asNumber(stats[definition.detailKey]);
            return (
              <Skeleton isLoaded={!isLoading} key={definition.key} borderRadius="2xl">
                <StatCard
                  label={definition.label}
                  value={value === null ? "N/A" : `${value.toLocaleString()}${"suffix" in definition ? definition.suffix : ""}`}
                  helper={`${detailValue === null ? "N/A" : detailValue.toLocaleString()} ${definition.detail}`}
                  icon={definition.icon}
                  colorScheme={definition.color}
                />
              </Skeleton>
            );
          })}
        </SimpleGrid>

        <Grid templateColumns={{ base: "1fr", lg: "1.25fr 0.75fr" }} gap={4}>
          <Box
            bg={panelBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="2xl"
            p={{ base: 4, md: 6 }}
            boxShadow="sm"
            transition="all 0.2s"
            _hover={{ boxShadow: "md" }}
          >
            <Flex justify="space-between" align="center" mb={6}>
              <HStack spacing={3}>
                <Flex p={2.5} bg={useColorModeValue("teal.50", "teal.900")} color={useColorModeValue("teal.600", "teal.300")} borderRadius="xl">
                  <Icon as={Activity} boxSize={5} />
                </Flex>
                <Box>
                  <Heading size="sm" fontWeight="900" letterSpacing="tight" textTransform="uppercase">
                    <Box as="span" color={useColorModeValue("gray.900", "white")}>LEARNER </Box>
                    <Box as="span" bgGradient={useColorModeValue("linear(to-r, purple.500, purple.700)", "linear(to-r, purple.300, purple.500)")} bgClip="text">
                      PROGRESS
                    </Box>
                  </Heading>
                  <Text fontSize="10px" fontWeight="700" color="gray.500" mt={0.5} letterSpacing="wider" textTransform="uppercase">
                    Measured from enrollment and course progress records
                  </Text>
                </Box>
              </HStack>
            </Flex>
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
              <Box p={4} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}>
                <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">Average progress</Text>
                <Text fontSize="3xl" fontWeight="900" mt={1}>
                  {asNumber(stats.averageProgress) === null ? "N/A" : `${stats.averageProgress}%`}
                </Text>
                <Progress
                  value={asNumber(stats.averageProgress) || 0}
                  colorScheme="teal"
                  size="xs"
                  borderRadius="full"
                  mt={3}
                />
              </Box>
              <Box p={4} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}>
                <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">Enrollment completion</Text>
                <Text fontSize="3xl" fontWeight="900" mt={1}>
                  {asNumber(stats.completionRate) === null ? "N/A" : `${stats.completionRate}%`}
                </Text>
                <Text fontSize="xs" fontWeight="600" color="gray.500" mt={2}>
                  {asNumber(stats.completedEnrollments) || 0} of {asNumber(stats.totalEnrollments) || 0} completed
                </Text>
              </Box>
              <Box p={4} bg={useColorModeValue("orange.50", "rgba(221, 107, 32, 0.1)")} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue("orange.100", "rgba(221, 107, 32, 0.2)")}>
                <Text fontSize="xs" fontWeight="700" color={useColorModeValue("orange.600", "orange.300")} textTransform="uppercase" letterSpacing="wider">Low engagement</Text>
                <Text fontSize="3xl" fontWeight="900" color={useColorModeValue("orange.500", "orange.400")} mt={1}>
                  {asNumber(stats.lowEngagementUsers) || 0}
                </Text>
                <Text fontSize="xs" fontWeight="600" color={useColorModeValue("orange.600", "orange.300")} mt={2} lineHeight="1.4">
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
            p={{ base: 4, md: 6 }}
            boxShadow="sm"
            transition="all 0.2s"
            _hover={{ boxShadow: "md" }}
          >
            <Flex justify="space-between" align="center" mb={6}>
              <HStack spacing={3}>
                <Flex p={2.5} bg={useColorModeValue("orange.50", "orange.900")} color={useColorModeValue("orange.500", "orange.300")} borderRadius="xl">
                  <Icon as={AlertCircle} boxSize={5} />
                </Flex>
                <Box>
                  <Heading size="sm" fontWeight="900" letterSpacing="tight" textTransform="uppercase">
                    <Box as="span" color={useColorModeValue("gray.900", "white")}>OPERATIONAL </Box>
                    <Box as="span" bgGradient={useColorModeValue("linear(to-r, purple.500, purple.700)", "linear(to-r, purple.300, purple.500)")} bgClip="text">
                      ATTENTION
                    </Box>
                  </Heading>
                  <Text fontSize="10px" fontWeight="700" color="gray.500" mt={0.5} letterSpacing="wider" textTransform="uppercase">
                    Items that may need Superadmin follow-up
                  </Text>
                </Box>
              </HStack>
            </Flex>
            <Stack spacing={3}>
              <Flex justify="space-between" align="center" p={3} px={4} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}>
                <Text fontSize="sm" fontWeight="700" color={useColorModeValue("gray.700", "gray.200")}>Pending assessment reviews</Text>
                <Badge variant="subtle" colorScheme={stats.pendingReviews ? "orange" : "gray"} borderRadius="md" px={2} py={1}>
                  {asNumber(stats.pendingReviews) ?? "N/A"}
                </Badge>
              </Flex>
              <Flex justify="space-between" align="center" p={3} px={4} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}>
                <Text fontSize="sm" fontWeight="700" color={useColorModeValue("gray.700", "gray.200")}>Expiring within 30 days</Text>
                <Badge variant="subtle" colorScheme={stats.expiringItems ? "yellow" : "gray"} borderRadius="md" px={2} py={1}>
                  {asNumber(stats.expiringItems) || 0}
                </Badge>
              </Flex>
              <Flex justify="space-between" align="center" p={3} px={4} bg={useColorModeValue("gray.50", "whiteAlpha.50")} borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}>
                <Text fontSize="sm" fontWeight="700" color={useColorModeValue("gray.700", "gray.200")}>Inactive companies</Text>
                <Badge variant="subtle" colorScheme={stats.inactiveCompanies ? "purple" : "gray"} borderRadius="md" px={2} py={1}>
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
