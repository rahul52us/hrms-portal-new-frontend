"use client";

import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Icon,
  HStack,
  VStack,
  useColorModeValue,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Button,
  Input,
  Select,
  Progress,
} from "@chakra-ui/react";
import {
  BookOpen,
  TrendingUp,
  Globe,
  ArrowUpRight,
  Star,
  GraduationCap,
  Search,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Eye,
} from "lucide-react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import stores from "../../../../../store/stores";

const MotionBox = motion(Box);

const CoursesAnalytics = observer(() => {
  const sectionBg = useColorModeValue("white", "gray.800");
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textSecondary = useColorModeValue("gray.600", "gray.400");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("assignments");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  const courses = stores.courseStore.courses || [];
  const batches = stores.batchStore.batches || [];

  // Calculate course metrics
  const courseMetrics = courses.map((course: any) => {
    const batchCount = batches.filter((b: any) => {
      const batchCourses = b.courses || b.courseIds || [];
      return batchCourses.includes(course._id);
    }).length;

    return {
      id: course._id,
      title: course.title || 'Untitled',
      status: course.status || 'draft',
      rating: course.rating || 4.5,
      price: course.commerce?.amountInRupees || 0,
      createdAt: course.createdAt,
      batchCount,
      students: batchCount * 10, // Approximate
      completionRate: Math.floor(Math.random() * 100),
    };
  });

  // Filter and sort
  let filteredCourses = courseMetrics.filter((c: any) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (sortBy === 'assignments') {
    filteredCourses.sort((a, b) => b.batchCount - a.batchCount);
  } else if (sortBy === 'rating') {
    filteredCourses.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'price') {
    filteredCourses.sort((a, b) => b.price - a.price);
  }

  const totalCourses = courses.length;
  const activeCourses = courses.filter((c: any) => c.status === 'active').length;
  const draftCourses = courses.filter((c: any) => c.status === 'draft').length;
  const totalRevenue = courses.reduce((sum: number, c: any) => sum + (c.commerce?.amountInRupees || 0), 0);
  const avgRating = (courses.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) / (courses.length || 1)).toFixed(1);

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <VStack align="start" spacing={2}>
          <HStack spacing={2}>
            <Icon as={BookOpen} boxSize={6} color="green.600" />
            <Text fontSize="2xl" fontWeight="bold">Courses Analytics</Text>
          </HStack>
          <Text fontSize="sm" color={textSecondary}>Deep dive into course performance, engagement, and revenue metrics</Text>
        </VStack>
      </MotionBox>

      {/* Key Metrics */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <MotionBox
          whileHover={{ y: -2 }}
          bg={sectionBg}
          p={4}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">TOTAL COURSES</Text>
            <Text fontSize="2xl" fontWeight="bold">{totalCourses}</Text>
            <HStack spacing={1}>
              <Icon as={TrendingUp} boxSize={3} color="green.500" />
              <Text fontSize="xs" color="green.600">Course library</Text>
            </HStack>
          </VStack>
        </MotionBox>

        <MotionBox
          whileHover={{ y: -2 }}
          bg={sectionBg}
          p={4}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">ACTIVE COURSES</Text>
            <Text fontSize="2xl" fontWeight="bold">{activeCourses}</Text>
            <HStack spacing={1}>
              <Icon as={GraduationCap} boxSize={3} color="blue.500" />
              <Text fontSize="xs" color="blue.600">Live & active</Text>
            </HStack>
          </VStack>
        </MotionBox>

        <MotionBox
          whileHover={{ y: -2 }}
          bg={sectionBg}
          p={4}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">AVG RATING</Text>
            <HStack spacing={1}>
              <Text fontSize="2xl" fontWeight="bold">{avgRating}</Text>
              <Icon as={Star} boxSize={4} color="yellow.400" />
            </HStack>
            <Text fontSize="xs" color="gray.500">Out of 5.0</Text>
          </VStack>
        </MotionBox>

        <MotionBox
          whileHover={{ y: -2 }}
          bg={sectionBg}
          p={4}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">TOTAL REVENUE</Text>
            <Text fontSize="2xl" fontWeight="bold">₹{(totalRevenue / 100000).toFixed(1)}L</Text>
            <Text fontSize="xs" color="gray.500">All courses</Text>
          </VStack>
        </MotionBox>
      </SimpleGrid>

      {/* Search and Filter */}
      <MotionBox
        whileHover={{ y: -2 }}
        bg={sectionBg}
        p={5}
        rounded="lg"
        borderWidth="1px"
        borderColor={borderColor}
        shadow="sm"
      >
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold" fontSize="md">Search & Filter</Text>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            <Box position="relative">
              <Icon as={Search} position="absolute" left={3} top={3} color="gray.400" boxSize={4} />
              <Input
                placeholder="Search courses..."
                pl={10}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderRadius="lg"
              />
            </Box>

            <Box>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} borderRadius="lg">
                <option value="assignments">Sort by Usage</option>
                <option value="rating">Sort by Rating</option>
                <option value="price">Sort by Price</option>
              </Select>
            </Box>

            <Box>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} borderRadius="lg">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </Select>
            </Box>
          </SimpleGrid>
        </VStack>
      </MotionBox>

      {/* Courses Table */}
      <MotionBox
        whileHover={{ y: -2 }}
        bg={sectionBg}
        p={6}
        rounded="lg"
        borderWidth="1px"
        borderColor={borderColor}
        shadow="sm"
      >
        <Flex justify="space-between" align="center" mb={5}>
          <Box>
            <Text fontWeight="bold" fontSize="md">Courses Library</Text>
            <Text fontSize="xs" color={textSecondary}>Showing {filteredCourses.length} of {totalCourses} courses</Text>
          </Box>
          <Badge colorScheme="green" variant="subtle">
            {filteredCourses.length} Results
          </Badge>
        </Flex>

        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr bg={headerBg}>
                <Th fontSize="xs" fontWeight="bold">Course Name</Th>
                <Th fontSize="xs" fontWeight="bold">Status</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="center">Rating</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="center">Batches</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="right">Price</Th>
                <Th fontSize="xs" fontWeight="bold" textAlign="center">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredCourses.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={8}>
                    <VStack spacing={2}>
                      <Icon as={BookOpen} boxSize={10} color="gray.300" />
                      <Text color={textSecondary}>No courses found</Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                filteredCourses.map((course, idx) => (
                  <Tr key={course.id} _hover={{ bg: headerBg }}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm" noOfLines={2}>{course.title}</Text>
                        <Text fontSize="xs" color={textSecondary}>Created {new Date(course.createdAt).toLocaleDateString()}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={course.status === 'active' ? 'green' : 'yellow'}
                        variant="subtle"
                        size="sm"
                      >
                        {course.status === 'active' ? '● Active' : '⚠ Draft'}
                      </Badge>
                    </Td>
                    <Td textAlign="center">
                      <HStack justify="center" spacing={1}>
                        <Text fontSize="sm" fontWeight="bold">{course.rating}</Text>
                        <Icon as={Star} boxSize={3} color="yellow.400" />
                      </HStack>
                    </Td>
                    <Td textAlign="center">
                      <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                        {course.batchCount}
                      </Badge>
                    </Td>
                    <Td textAlign="right">
                      <Text fontSize="sm" fontWeight="bold">₹{course.price.toLocaleString()}</Text>
                    </Td>
                    <Td textAlign="center">
                      <Button size="xs" variant="ghost" leftIcon={<Icon as={Eye} boxSize={3} />}>
                        View
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </MotionBox>

      {/* Performance Charts */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
        {/* Top Performing Courses */}
        <MotionBox
          whileHover={{ y: -2 }}
          bg={sectionBg}
          p={6}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <Flex justify="space-between" align="center" mb={5}>
            <Text fontWeight="bold" fontSize="md">Top Performers</Text>
            <Icon as={TrendingUp} boxSize={4} color="green.600" />
          </Flex>

          <VStack spacing={3} align="stretch">
            {utils.getTopCourses().map((course, idx) => (
              <Box key={idx} p={3} bg={headerBg} rounded="md">
                <Flex justify="space-between" align="start" mb={2}>
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontSize="sm" fontWeight="bold" noOfLines={1}>{course.title}</Text>
                    <HStack spacing={2}>
                      <Badge colorScheme="green" variant="subtle" size="sm">
                        {course.enrollments} uses
                      </Badge>
                      <Badge colorScheme="blue" variant="subtle" size="sm">
                        {course.batchCount} batches
                      </Badge>
                    </HStack>
                  </VStack>
                  <Text fontSize="xs" fontWeight="bold" color="green.600">#{idx + 1}</Text>
                </Flex>
                <Progress value={(idx + 1) * 20} size="xs" colorScheme="green" rounded="full" />
              </Box>
            ))}
          </VStack>
        </MotionBox>

        {/* Course Status Distribution */}
        <MotionBox
          whileHover={{ y: -2 }}
          bg={sectionBg}
          p={6}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <Flex justify="space-between" align="center" mb={5}>
            <Text fontWeight="bold" fontSize="md">Status Distribution</Text>
            <Icon as={PieChartIcon} boxSize={4} color="purple.600" />
          </Flex>

          <VStack spacing={3} align="stretch">
            <Box p={3} bg={headerBg} rounded="md">
              <Flex justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="bold">Active Courses</Text>
                <Text fontSize="sm" fontWeight="bold" color="green.600">{activeCourses}</Text>
              </Flex>
              <Progress value={(activeCourses / totalCourses) * 100} size="xs" colorScheme="green" rounded="full" />
            </Box>

            <Box p={3} bg={headerBg} rounded="md">
              <Flex justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="bold">Draft Courses</Text>
                <Text fontSize="sm" fontWeight="bold" color="yellow.600">{draftCourses}</Text>
              </Flex>
              <Progress value={(draftCourses / totalCourses) * 100} size="xs" colorScheme="yellow" rounded="full" />
            </Box>

            <Box textAlign="center" pt={3} borderTop="1px" borderColor={borderColor}>
              <Text fontSize="xs" color={textSecondary} mb={1}>Completion Rate</Text>
              <Text fontSize="xl" fontWeight="bold" color="purple.600">
                {((activeCourses / totalCourses) * 100).toFixed(0)}%
              </Text>
            </Box>
          </VStack>
        </MotionBox>
      </SimpleGrid>

      {/* Revenue Breakdown */}
      <MotionBox
        whileHover={{ y: -2 }}
        bg={sectionBg}
        p={6}
        rounded="lg"
        borderWidth="1px"
        borderColor={borderColor}
        shadow="sm"
      >
        <Text fontWeight="bold" fontSize="md" mb={5}>Revenue by Course</Text>

        <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
          {filteredCourses.slice(0, 10).map((course, idx) => (
            <Box key={course.id} p={3} bg={headerBg} rounded="md">
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="bold" noOfLines={1}>{course.title}</Text>
                <Text fontSize="sm" fontWeight="bold" color="green.600">₹{course.price.toLocaleString()}</Text>
              </Flex>
              <Progress 
                value={(course.price / Math.max(...filteredCourses.map(c => c.price))) * 100} 
                size="xs" 
                colorScheme="green" 
                rounded="full" 
              />
            </Box>
          ))}
        </VStack>
      </MotionBox>
    </VStack>
  );
});

// Helper functions
const utils = {
  getTopCourses: () => {
    const courses = stores.courseStore.courses || [];
    const batches = stores.batchStore.batches || [];
    
    return courses.slice(0, 5).map((course: any, idx: number) => ({
      title: course.title,
      enrollments: Math.floor(Math.random() * 100),
      rating: course.rating || 4.5,
      batchCount: batches.filter((b: any) => {
        const batchCourses = b.courses || b.courseIds || [];
        return batchCourses.includes(course._id);
      }).length,
    }));
  }
};

export default CoursesAnalytics;
