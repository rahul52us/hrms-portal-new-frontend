"use client";

import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
  SimpleGrid,
  Grid,
  GridItem,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Wrap,
  WrapItem,
  Avatar,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  Tag,
  Tooltip as ChakraTooltip
} from "@chakra-ui/react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Building2,
  Globe,
  GraduationCap,
  TrendingUp,
  Users,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  Zap,
  Activity,
  PieChart,
  TrendingDown
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import stores from "../../../store/stores";
import BatchesAnalytics from "./components/superadmincomponent/BatchesAnalytics";
import CompaniesAnalytics from "./components/superadmincomponent/CompaniesAnalytics";
import CoursesAnalytics from "./components/superadmincomponent/CoursesAnalytics";
import OverviewTab from "./components/superadmincomponent/OverviewTab";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
);

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionSimpleGrid = motion(SimpleGrid);

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  growth?: string;
  color: string;
  isLoading?: boolean;
  size?: "sm" | "md";
  trend?: "up" | "down" | "neutral";
}

const StatCard = ({ label, value, icon: StatIcon, growth, color, isLoading, size = "md", trend = "up" }: StatCardProps) => {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const iconBg = useColorModeValue(`${color}.50`, `${color}.900`);
  const iconColor = useColorModeValue(`${color}.600`, `${color}.200`);
  const gradientBg = useColorModeValue(
    `linear-gradient(135deg, ${color}.50 0%, white 100%)`,
    `linear-gradient(135deg, ${color}.900 0%, gray.800 100%)`
  );

  const isSmall = size === "sm";
  const trendColor = trend === "up" ? "green.500" : trend === "down" ? "red.500" : "gray.500";
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? TrendingDown : Activity;

  return (
    <MotionBox
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
      bg={bg}
      p={isSmall ? 4 : 6}
      rounded="xl"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="md"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        right: 0,
        width: "100px",
        height: "100px",
        background: gradientBg,
        borderRadius: "full",
        opacity: 0.1,
        transform: "translate(30px, -30px)",
      }}
    >
      <VStack align="start" spacing={isSmall ? 3 : 4} h="full" position="relative" zIndex={1}>
        <Flex
          p={isSmall ? 2.5 : 3}
          bg={iconBg}
          color={iconColor}
          rounded="xl"
          align="center"
          justify="center"
          shadow="sm"
        >
          <Icon as={StatIcon} boxSize={isSmall ? 5 : 6} />
        </Flex>

        <Box flex={1}>
          <Text color="gray.500" fontSize={isSmall ? "xs" : "sm"} fontWeight="600" textTransform="uppercase" letterSpacing="wide">
            {label}
          </Text>
          {isLoading ? (
            <Spinner size={isSmall ? "sm" : "md"} mt={2} />
          ) : (
            <Text fontSize={isSmall ? "2xl" : "3xl"} fontWeight="800" mt={2} lineHeight="1.2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
          )}
        </Box>

        {growth && !isSmall && (
          <HStack spacing={2} bg={`${trendColor.replace('.500', '')}.50`} px={3} py={1.5} rounded="full" w="full" justify="center">
            <Icon as={TrendIcon} color={trendColor} boxSize={3.5} />
            <Text fontSize="sm" color={trendColor} fontWeight="bold">
              {growth}
            </Text>
          </HStack>
        )}
      </VStack>
    </MotionBox>
  );
};

const SuperAdminLMS = observer(() => {
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const sectionBg = useColorModeValue("white", "gray.800");
  const headerBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const textSecondary = useColorModeValue("gray.600", "gray.400");

  // State for dynamic data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisView, setAnalysisView] = useState<"overview" | "courses" | "companies" | "batches">("overview");
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalBatches: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    activeInstructors: 0,
  });

  // State for course assignment stats
  const [courseAssignmentStats, setCourseAssignmentStats] = useState<any[]>([]);
  const [courseDistributionData, setCourseDistributionData] = useState<any>(null);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [isLoadingCourseStats, setIsLoadingCourseStats] = useState(true);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [batchStatusStats, setBatchStatusStats] = useState({
    active: 0,
    completed: 0,
    expired: 0,
  });
  const [assignmentTypeStats, setAssignmentTypeStats] = useState({
    company: 0,
    department: 0,
    user: 0,
    other: 0,
  });
  const [topCompaniesByAssignments, setTopCompaniesByAssignments] = useState<any[]>([]);
  const [topCompaniesByBatches, setTopCompaniesByBatches] = useState<any[]>([]);
  const [unassignedCourseCount, setUnassignedCourseCount] = useState(0);
  const [averageBatchSize, setAverageBatchSize] = useState(0);
  const [activeInstructorCount, setActiveInstructorCount] = useState(0);

  // Helper function to get consistent colors for categories
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'Programming': 'rgba(124, 58, 237, 0.8)',
      'Design': 'rgba(59, 130, 246, 0.8)',
      'Marketing': 'rgba(16, 185, 129, 0.8)',
      'Business': 'rgba(245, 158, 11, 0.8)',
      'Data Science': 'rgba(236, 72, 153, 0.8)',
      'Development': 'rgba(139, 92, 246, 0.8)',
      'Uncategorized': 'rgba(156, 163, 175, 0.8)',
    };
    return colorMap[category] || `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.8)`;
  };

  // Fetch course stats - FIXED VERSION with proper batch count calculation
  const fetchCourseStats = async () => {
    setIsLoadingCourseStats(true);

    try {
      // Fetch all courses first
      const allCourses = stores.courseStore.courses || [];
      
      if (allCourses.length === 0) {
        setCourseAssignmentStats([]);
        setCategoryStats([]);
        setIsLoadingCourseStats(false);
        return;
      }

      // Fetch assigned courses data
      let assignedCourses: any[] = [];
      try {
        await stores.courseStore.fetchAssignedCourseAccesses();
        assignedCourses = stores.courseStore.assignedCourseAccesses || [];
      } catch (err) {
        console.log("No assignment data available");
      }

      // Get batches to calculate batch counts
      const batches = stores.batchStore.batches || [];

      // Create a map for course assignments and batch counts
      const courseAssignmentsMap = new Map();

      // Initialize with all courses
      allCourses.forEach((course: any) => {
        courseAssignmentsMap.set(course._id, {
          courseId: course._id,
          title: course.title || 'Untitled Course',
          assignmentCount: 0,
          companyCount: 0,
          batchCount: 0,
          createdAt: course.createdAt,
          status: course.status || 'draft',
          rating: course.rating || 4.5,
        });
      });

      // Calculate assignment counts from assignedCourses
      if (assignedCourses.length > 0) {
        assignedCourses.forEach((assignment: any) => {
          const courseId = assignment.courseId;
          if (courseAssignmentsMap.has(courseId)) {
            const courseData = courseAssignmentsMap.get(courseId);
            courseData.assignmentCount += 1;
            
            if (assignment.company?._id) {
              courseData.companyCount += 1;
            }
          }
        });
      }

      // Calculate batch counts from batches - FIXED
      if (batches.length > 0) {
        batches.forEach((batch: any) => {
          // Check different possible field names for courses in batch
          const batchCourses = batch.courses || batch.courseIds || [];
          
          batchCourses.forEach((courseId: string) => {
            if (courseAssignmentsMap.has(courseId)) {
              const courseData = courseAssignmentsMap.get(courseId);
              courseData.batchCount += 1;
            }
          });
        });
      }

      // Convert to array and sort by assignment count
      const sortedCourses = Array.from(courseAssignmentsMap.values())
        .sort((a, b) => b.assignmentCount - a.assignmentCount);

      setCourseAssignmentStats(sortedCourses);

      // Calculate unassigned course count and top companies by assignments
      const assignedCourseIds = new Set(assignedCourses.map((assignment: any) => assignment.courseId));
      setUnassignedCourseCount(allCourses.filter((course: any) => !assignedCourseIds.has(course._id)).length);

      const companyAssignmentMap = new Map();
      const instructors = new Set<string>();
      const assignmentTypeCounts = {
        company: 0,
        department: 0,
        user: 0,
        other: 0,
      };

      assignedCourses.forEach((assignment: any) => {
        const accessType = String(assignment.assignmentType || '').toLowerCase();
        if (accessType === 'company' || accessType === 'department' || accessType === 'user') {
          assignmentTypeCounts[accessType as keyof typeof assignmentTypeCounts] += 1;
        } else {
          assignmentTypeCounts.other += 1;
        }

        const companyName = assignment.company?.company_name || 'Unassigned Company';
        if (!companyAssignmentMap.has(companyName)) {
          companyAssignmentMap.set(companyName, {
            name: companyName,
            assignments: 0,
          });
        }
        companyAssignmentMap.get(companyName).assignments += 1;

        if (assignment.assignedBy?._id) {
          instructors.add(assignment.assignedBy._id);
        }
      });

      const topCompaniesByAssignments = Array.from(companyAssignmentMap.values())
        .sort((a, b) => b.assignments - a.assignments)
        .slice(0, 3);

      setTopCompaniesByAssignments(topCompaniesByAssignments);
      setAssignmentTypeStats(assignmentTypeCounts);

      const batchCompanyMap = new Map();
      let totalUsers = 0;

      batches.forEach((batch: any) => {
        const companyName = batch.company?.company_name || 'Unknown Company';
        if (!batchCompanyMap.has(companyName)) {
          batchCompanyMap.set(companyName, {
            name: companyName,
            batches: 0,
            users: 0,
          });
        }
        const item = batchCompanyMap.get(companyName);
        item.batches += 1;
        item.users += batch.userCount || 0;

        totalUsers += batch.userCount || 0;

        if (batch.createdBy?._id) {
          instructors.add(batch.createdBy._id);
        }
      });

      const topCompaniesByBatches = Array.from(batchCompanyMap.values())
        .sort((a, b) => b.batches - a.batches)
        .slice(0, 3);

      setTopCompaniesByBatches(topCompaniesByBatches);
      setAverageBatchSize(batches.length ? Math.round(totalUsers / batches.length) : 0);
      setActiveInstructorCount(instructors.size);

      // Calculate course distribution by category
      const categoryMap = new Map();

      allCourses.forEach((course: any) => {
        const categories = course.taxonomy?.categories || ['Uncategorized'];
        const primaryCategory = categories[0] || 'Uncategorized';

        if (!categoryMap.has(primaryCategory)) {
          categoryMap.set(primaryCategory, {
            name: primaryCategory,
            count: 0,
            color: getCategoryColor(primaryCategory),
          });
        }

        categoryMap.get(primaryCategory).count += 1;
      });

      const categoryStatsArray = Array.from(categoryMap.values())
        .sort((a, b) => b.count - a.count);

      const totalCourses = allCourses.length;
      const categoriesWithPercentage = categoryStatsArray.map(cat => ({
        ...cat,
        percentage: totalCourses > 0 ? Math.round((cat.count / totalCourses) * 100) : 0,
      }));

      setCategoryStats(categoriesWithPercentage);

      // Prepare chart data
      setCourseDistributionData({
        labels: categoriesWithPercentage.map(cat => cat.name),
        datasets: [
          {
            data: categoriesWithPercentage.map(cat => cat.count),
            backgroundColor: categoriesWithPercentage.map(cat => cat.color),
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      });

    } catch (error) {
      console.error("Error fetching course stats:", error);
      setCourseAssignmentStats([]);
      setCategoryStats([]);
    } finally {
      setIsLoadingCourseStats(false);
    }
  };

  // Fetch batch status stats
  const fetchBatchStats = async () => {
    try {
      const batches = stores.batchStore.batches || [];
      const active = batches.filter((b: any) => b.status === 'active').length;
      const completed = batches.filter((b: any) => b.status === 'completed').length;
      const expired = batches.filter((b: any) => b.status === 'expired' || b.isExpired).length;

      setBatchStatusStats({ active, completed, expired });
    } catch (error) {
      console.error("Error fetching batch stats:", error);
    }
  };

  // Generate revenue data from course prices
  const generateRevenueData = () => {
    const courses = stores.courseStore.courses || [];
    const monthlyRevenue = [0, 0, 0, 0, 0, 0, 0];

    courses.forEach((course: any) => {
      const price = course.commerce?.amountInRupees || 0;
      const createdAt = course.createdAt ? new Date(course.createdAt) : new Date();
      const month = createdAt.getMonth();
      if (month < 7) {
        monthlyRevenue[month] += price;
      }
    });

    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      datasets: [
        {
          fill: true,
          label: "Revenue",
          data: monthlyRevenue,
          borderColor: "rgb(124, 58, 237)",
          backgroundColor: "rgba(124, 58, 237, 0.1)",
          tension: 0.4,
          pointRadius: 4,
        },
      ],
    };
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all data in parallel
        const [companiesRes, batchesRes, coursesRes] = await Promise.allSettled([
          stores.companyStore.getManagedCompanies(),
          stores.batchStore.fetchBatches(),
          stores.courseStore.fetchCourses(),
        ]);

        // Process companies data
        let totalCompanies = 0;
        if (companiesRes.status === 'fulfilled') {
          totalCompanies = stores.companyStore.companies.data?.length || 0;
        } else {
          console.error("Failed to fetch companies:", companiesRes.reason);
        }

        // Process batches data
        let totalBatches = 0;
        if (batchesRes.status === 'fulfilled') {
          totalBatches = stores.batchStore.batches?.length || 0;
          await fetchBatchStats();
        } else {
          console.error("Failed to fetch batches:", batchesRes.reason);
        }

        // Process courses data
        let totalCourses = 0;
        if (coursesRes.status === 'fulfilled') {
          totalCourses = stores.courseStore.courses?.length || 0;
          setRevenueData(generateRevenueData());
          // Pass batches to fetchCourseStats
          await fetchCourseStats();
        } else {
          console.error("Failed to fetch courses:", coursesRes.reason);
        }

        // Calculate additional stats from the data
        let totalEnrollments = 0;
        let totalRevenue = 0;

        if (batchesRes.status === 'fulfilled' && stores.batchStore.batches) {
          totalEnrollments = stores.batchStore.batches.reduce(
            (sum, batch: any) => sum + (batch.userCount || 0),
            0
          );
        }

        if (coursesRes.status === 'fulfilled' && stores.courseStore.courses) {
          totalRevenue = stores.courseStore.courses.reduce((sum, course: any) => {
            return sum + (course.commerce?.amountInRupees || 0);
          }, 0);
        }

        setStats({
          totalCompanies,
          totalBatches,
          totalCourses,
          totalEnrollments,
          totalRevenue,
          activeInstructors: 1450,
        });

      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err?.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { display: false },
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8" }
      },
    },
  };

  const getAnalysisSummary = () => {
    switch (analysisView) {
      case "courses":
        return `Focus on course performance, assignment reach and category distribution to discover which content is driving demand.`;
      case "companies":
        return `Compare company adoption across batches and assignments to identify the strongest clients and engagement gaps.`;
      case "batches":
        return `Analyze batch health, average batch size, and active batches to plan new cohort launches more effectively.`;
      default:
        return `View the full SuperAdmin dashboard overview with revenue, enrollment, course and batch analytics.`;
    }
  };

  // Dynamic activities from real data
  const getActivities = () => {
    const activities = [];

    if (stores.batchStore.batches?.length > 0) {
      const recentBatch = stores.batchStore.batches[0];
      activities.push({
        type: "Batch",
        name: `New batch created: ${recentBatch.name}`,
        time: recentBatch.createdAt ? new Date(recentBatch.createdAt).toLocaleString() : "Recently",
        status: "Success",
        statusColor: "green"
      });
    }

    if (stores.courseStore.courses?.length > 0) {
      const recentCourse = stores.courseStore.courses[0];
      activities.push({
        type: "Course",
        name: `New course added: ${recentCourse.title}`,
        time: recentCourse.createdAt ? new Date(recentCourse.createdAt).toLocaleString() : "Recently",
        status: "Active",
        statusColor: "blue"
      });
    }

    if (courseAssignmentStats.length > 0) {
      activities.push({
        type: "Assignment",
        name: `${courseAssignmentStats[0].title} assigned to ${courseAssignmentStats[0].companyCount} companies`,
        time: "Recently",
        status: "Success",
        statusColor: "green"
      });
    }

    if (activities.length === 0) {
      activities.push(
        { type: "System", name: "System health check completed", time: "Just now", status: "Success", statusColor: "green" },
        { type: "Info", name: "Waiting for data synchronization", time: "Recently", status: "Pending", statusColor: "yellow" }
      );
    }

    return activities;
  };

  // Dynamic top courses from real data - UPDATED to include batchCount
  const getTopCourses = () => {
    if (courseAssignmentStats.length > 0) {
      // Sort by assignment count to get truly top courses
      const sortedByAssignments = [...courseAssignmentStats].sort((a, b) => b.assignmentCount - a.assignmentCount);
      
      return sortedByAssignments.slice(0, 5).map((course, index) => ({
        title: course.title,
        enrollments: course.assignmentCount,
        rating: course.rating || (4.5 + (index * 0.1)),
        revenue: `₹${(course.assignmentCount * 1500).toLocaleString()}`,
        batchCount: course.batchCount || 0,
      }));
    }

    if (stores.courseStore.courses?.length > 0) {
      return stores.courseStore.courses.slice(0, 5).map((course: any, index: number) => ({
        title: course.title,
        enrollments: 0,
        rating: 4.5 + (index * 0.1),
        revenue: course.commerce?.amountInRupees 
          ? `₹${course.commerce.amountInRupees.toLocaleString()}`
          : `₹${(Math.random() * 50000 + 10000).toFixed(0)}`,
        batchCount: 0,
      }));
    }

    return [
      { title: "No courses available", enrollments: 0, rating: 0, revenue: "₹0", batchCount: 0 },
    ];
  };

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error" borderRadius="2xl" shadow="lg">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 3, md: 6 }} px={{ base: 3, md: 4 }}>
      <VStack spacing={{ base: 4, md: 8 }} align="stretch" maxW="1400px" mx="auto">
        {/* Main Header - Enhanced */}
        <MotionFlex
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={{ base: 3, md: 4 }}
          bg={sectionBg}
          p={{ base: 4, md: 6 }}
          rounded={{ base: "xl", md: "2xl" }}
          shadow="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <VStack align="start" spacing={2}>
            <HStack spacing={3}>
              <Box p={{ base: 2, md: 2.5 }} bg="purple.100" rounded="xl" color="purple.600">
                <Icon as={Globe} boxSize={{ base: 5, md: 7 }} />
              </Box>
              <Box>
                <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" bgGradient="linear(to-r, purple.600, pink.600)" bgClip="text">
                  LMS Analytics
                </Text>
                <Text fontSize="sm" color={textSecondary} display={{ base: "none", sm: "block" }}>
                  Real-time insights & performance metrics
                </Text>
              </Box>
            </HStack>
            <HStack spacing={2} flexWrap="wrap">
              <Badge colorScheme="green" variant="solid" rounded="full" px={3} py={1}>
                <HStack spacing={1}>
                  <Box w={2} h={2} rounded="full" bg="green.400" />
                  <Text fontSize="xs">System Online</Text>
                </HStack>
              </Badge>
              <Badge colorScheme="purple" variant="outline" rounded="full" px={3} py={1}>
                v2.0.1
              </Badge>
            </HStack>
          </VStack>
          
          <HStack spacing={3} w={{ base: "full", md: "auto" }}>
            <Box bg={headerBg} p={{ base: 3, md: 4 }} rounded="xl" textAlign="center" minW={{ base: "0", md: "100px" }} flex="1" shadow="sm">
              <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                Active Batches
              </Text>
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color="purple.600">
                {batchStatusStats.active}
              </Text>
            </Box>
            <Box bg={headerBg} p={{ base: 3, md: 4 }} rounded="xl" textAlign="center" minW={{ base: "0", md: "100px" }} flex="1" shadow="sm">
              <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                Uptime
              </Text>
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color="green.600">
                99.98%
              </Text>
            </Box>
          </HStack>
        </MotionFlex>

        {/* Tab Navigation - Enhanced */}
        <MotionBox
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          bg={sectionBg}
          p={{ base: 4, md: 5 }}
          rounded={{ base: "xl", md: "2xl" }}
          borderWidth="1px"
          borderColor={borderColor}
          shadow="md"
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Box>
              <Heading size="sm" mb={1}>Analysis Dashboard</Heading>
              <Text fontSize="sm" color={textSecondary} display={{ base: "none", sm: "block" }}>Select a focused analytics view</Text>
            </Box>
            <Wrap spacing={3}>
              {[
                { key: "overview", label: "Overview", icon: BarChart3, color: "purple" },
                { key: "courses", label: "Courses", icon: BookOpen, color: "blue" },
                { key: "companies", label: "Companies", icon: Building2, color: "teal" },
                { key: "batches", label: "Batches", icon: GraduationCap, color: "orange" },
              ].map((option) => (
                <WrapItem key={option.key}>
                  <Button
                    variant={analysisView === option.key ? "solid" : "ghost"}
                    colorScheme={option.color}
                    onClick={() => setAnalysisView(option.key as any)}
                    leftIcon={<Icon as={option.icon} boxSize={4} />}
                    size={{ base: "sm", md: "md" }}
                    rounded="full"
                    px={{ base: 4, md: 6 }}
                    shadow={analysisView === option.key ? "md" : "none"}
                  >
                    {option.label}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
          </Flex>
        </MotionBox>

        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          <MotionBox
            key={analysisView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {analysisView === "overview" && (
              <OverviewTab
                isLoading={isLoading}
                stats={stats}
                batchStatusStats={batchStatusStats}
                courseAssignmentStats={courseAssignmentStats}
                categoryStats={categoryStats}
                courseDistributionData={courseDistributionData}
                isLoadingCourseStats={isLoadingCourseStats}
                unassignedCourseCount={unassignedCourseCount}
                averageBatchSize={averageBatchSize}
                activeInstructorCount={activeInstructorCount}
                assignmentTypeStats={assignmentTypeStats}
                topCompaniesByBatches={topCompaniesByBatches}
                topCompaniesByAssignments={topCompaniesByAssignments}
                getActivities={getActivities}
                getTopCourses={getTopCourses}
              />
            )}

            {analysisView === "courses" && <CoursesAnalytics />}
            {analysisView === "companies" && <CompaniesAnalytics />}
            {analysisView === "batches" && <BatchesAnalytics />}
          </MotionBox>
        </AnimatePresence>
      </VStack>
    </Box>
  );
});

export default SuperAdminLMS;
