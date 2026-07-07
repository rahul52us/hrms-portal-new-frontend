"use client";

import {
  Avatar,
  Badge,
  Box,
  Flex,
  HStack,
  Icon,
  Progress,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  ArcElement,
} from "chart.js";
import { motion } from "framer-motion";
import {
  BookOpen,
  DollarSign,
  MoreVertical,
  Star,
  TrendingUp,
  Users,
  PieChart,
  Award,
} from "lucide-react";
import { Bar, Pie } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

const MotionBox = motion(Box);

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  growth?: string;
  color: string;
}

const StatCard = ({ label, value, icon: StatIcon, growth, color }: StatCardProps) => {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  return (
    <MotionBox
      whileHover={{ y: -5 }}
      bg={bg}
      p={6}
      rounded="2xl"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
    >
      <Flex justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <Text color="gray.500" fontSize="sm" fontWeight="medium">
            {label}
          </Text>
          <HStack align="baseline">
            <Text fontSize="2xl" fontWeight="bold">
              {value}
            </Text>
            {growth && (
              <Text fontSize="xs" color="green.500" fontWeight="bold">
                {growth}
              </Text>
            )}
          </HStack>
        </VStack>
        <Box p={3} bg={`${color}.50`} rounded="xl">
          <Icon as={StatIcon} color={`${color}.500`} boxSize={6} />
        </Box>
      </Flex>
    </MotionBox>
  );
};

const AdminLMS = () => {
  const sectionBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Minutes Spent",
        data: [120, 190, 150, 250, 320, 210, 180],
        backgroundColor: "rgba(124, 58, 237, 0.7)",
        borderRadius: 8,
        barThickness: 20,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const learners = [
    {
      name: "Alex Johnson",
      course: "Next.js Masterclass",
      progress: 85,
      status: "Active",
      avatar: "https://bit.ly/dan-abramov",
    },
    {
      name: "Sarah Williams",
      course: "UI Design Patterns",
      progress: 62,
      status: "In Progress",
      avatar: "https://bit.ly/sage-adebayo",
    },
    {
      name: "Michael Chen",
      course: "Node.js Backend",
      progress: 95,
      status: "Completing",
      avatar: "https://bit.ly/kent-c-dodds",
    },
    {
      name: "Emily Brown",
      course: "TypeScript Essentials",
      progress: 30,
      status: "Struggling",
      avatar: "https://bit.ly/prosper-baba",
    },
  ];

  const pieData = {
    labels: ["Web Development", "Design", "Data Science", "Marketing", "Business"],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          "rgba(124, 58, 237, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        cornerRadius: 10,
      },
    },
  };

  const topCourses = [
    {
      title: "Next.js Masterclass",
      enrollments: 245,
      rating: 4.9,
      revenue: "$12,450",
    },
    {
      title: "UI Design Patterns",
      enrollments: 189,
      rating: 4.7,
      revenue: "$9,230",
    },
    {
      title: "Node.js Backend",
      enrollments: 156,
      rating: 4.8,
      revenue: "$8,750",
    },
    {
      title: "TypeScript Essentials",
      enrollments: 134,
      rating: 4.6,
      revenue: "$6,890",
    },
    {
      title: "React Advanced",
      enrollments: 98,
      rating: 4.5,
      revenue: "$5,200",
    },
  ];

  return (
    <Box p={4}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="2xl" fontWeight="bold">
              Admin Dashboard
            </Text>
            <Text color="gray.500">Welcome back! Here's how your courses are performing today.</Text>
          </Box>
          <HStack spacing={4}>
            <Badge colorScheme="purple" p={2} rounded="lg" variant="subtle">
              Instructor Mode
            </Badge>
          </HStack>
        </Flex>

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            label="Total Students"
            value="1,284"
            icon={Users}
            growth="+12%"
            color="purple"
          />
          <StatCard
            label="Average Rating"
            value="4.8"
            icon={Star}
            growth="+0.2"
            color="yellow"
          />
          <StatCard
            label="Active Courses"
            value="12"
            icon={BookOpen}
            color="blue"
          />
          <StatCard
            label="Total Earnings"
            value="$42,850"
            icon={DollarSign}
            growth="+8%"
            color="green"
          />
        </SimpleGrid>

        {/* Main Section: Chart & Progress */}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
          {/* Engagement Chart */}
          <Box
            gridColumn={{ lg: "span 2" }}
            bg={sectionBg}
            p={6}
            rounded="2xl"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
          >
            <Flex justify="space-between" align="center" mb={6}>
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  Student Engagement
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Daily active minutes across all courses
                </Text>
              </Box>
              <Icon as={TrendingUp} color="purple.500" />
            </Flex>
            <Box h="300px">
              <Bar data={chartData} options={chartOptions} />
            </Box>
          </Box>

          {/* Quick Tasks / Notifications */}
          <Box
            bg={sectionBg}
            p={6}
            rounded="2xl"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
          >
            <Text fontWeight="bold" fontSize="lg" mb={6}>
              Insights & Tasks
            </Text>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between" p={3} bg="purple.50" rounded="xl">
                <HStack>
                  <Box p={2} bg="purple.100" rounded="lg">
                    <Icon as={BookOpen} color="purple.600" size={16} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="bold">New Review</Text>
                    <Text fontSize="xs" color="gray.500">"Great course!" - Ryan</Text>
                  </VStack>
                </HStack>
                <Badge colorScheme="purple">New</Badge>
              </HStack>

              <HStack justify="space-between" p={3} bg="blue.50" rounded="xl">
                <HStack>
                  <Box p={2} bg="blue.100" rounded="lg">
                    <Icon as={Users} color="blue.600" size={16} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="bold">15 New Enrollments</Text>
                    <Text fontSize="xs" color="gray.500">UI Design Patterns</Text>
                  </VStack>
                </HStack>
                <Badge colorScheme="blue">Hot</Badge>
              </HStack>
            </VStack>
          </Box>
        </SimpleGrid>

        {/* Recent Learners Table */}
        <Box
          bg={sectionBg}
          p={6}
          rounded="2xl"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <Flex justify="space-between" align="center" mb={6}>
            <Text fontWeight="bold" fontSize="lg">
              Recent Learner Activity
            </Text>
            <Icon as={MoreVertical} color="gray.400" cursor="pointer" />
          </Flex>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Learner</Th>
                  <Th>Course</Th>
                  <Th>Progress</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {learners.map((learner, idx) => (
                  <Tr key={idx}>
                    <Td border="none">
                      <HStack>
                        <Avatar size="sm" src={learner.avatar} name={learner.name} />
                        <Text fontWeight="medium">{learner.name}</Text>
                      </HStack>
                    </Td>
                    <Td border="none">{learner.course}</Td>
                    <Td border="none">
                      <HStack spacing={4}>
                        <Progress
                          value={learner.progress}
                          size="xs"
                          colorScheme="purple"
                          rounded="full"
                          flex={1}
                        />
                        <Text fontSize="xs" fontWeight="bold">{learner.progress}%</Text>
                      </HStack>
                    </Td>
                    <Td border="none">
                      <Badge
                        colorScheme={
                          learner.status === "Active" ? "green" :
                          learner.status === "Completing" ? "purple" :
                          learner.status === "Struggling" ? "red" : "gray"
                        }
                        rounded="md"
                        variant="subtle"
                      >
                        {learner.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        {/* Additional Analytics Section */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Course Category Distribution */}
          <Box
            bg={sectionBg}
            p={6}
            rounded="2xl"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
          >
            <Flex justify="space-between" align="center" mb={6}>
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  Course Categories
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Distribution of courses by category
                </Text>
              </Box>
              <Icon as={PieChart} color="purple.500" />
            </Flex>
            <Box h="300px">
              <Pie data={pieData} options={pieOptions} />
            </Box>
          </Box>

          {/* Top Performing Courses */}
          <Box
            bg={sectionBg}
            p={6}
            rounded="2xl"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
          >
            <Flex justify="space-between" align="center" mb={6}>
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  Top Performing Courses
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Based on enrollments and ratings
                </Text>
              </Box>
              <Icon as={Award} color="yellow.500" />
            </Flex>
            <VStack spacing={4} align="stretch">
              {topCourses.map((course, idx) => (
                <HStack key={idx} justify="space-between" p={4} bg="gray.50" rounded="xl">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" fontSize="sm">
                      {course.title}
                    </Text>
                    <HStack spacing={4}>
                      <Text fontSize="xs" color="gray.500">
                        {course.enrollments} students
                      </Text>
                      <HStack spacing={1}>
                        <Icon as={Star} color="yellow.400" boxSize={3} />
                        <Text fontSize="xs" color="gray.500">
                          {course.rating}
                        </Text>
                      </HStack>
                    </HStack>
                  </VStack>
                  <Text fontWeight="bold" color="green.500">
                    {course.revenue}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default AdminLMS;
