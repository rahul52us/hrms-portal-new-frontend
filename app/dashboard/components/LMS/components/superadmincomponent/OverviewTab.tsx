"use client";

import React, { useEffect, useState } from "react";
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
  Progress,
} from "@chakra-ui/react";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Activity,
  Globe,
  Award,
  ArrowUpRight,
  Star,
  Building2,
  GraduationCap,
  Clock,
  CheckCircle,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import stores from "../../../../../store/stores";

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  growth?: string;
  color: string;
  isLoading?: boolean;
  size?: "sm" | "md";
}

const StatCard = ({ label, value, icon: StatIcon, growth, color, isLoading, size = "md" }: StatCardProps) => {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const iconBg = useColorModeValue(`${color}.50`, `${color}.900`);
  const iconColor = useColorModeValue(`${color}.600`, `${color}.200`);

  const isSmall = size === "sm";

  return (
    <MotionBox
      whileHover={{ y: -4, shadow: "lg" }}
      transition={{ duration: 0.2 }}
      bg={bg}
      p={isSmall ? 4 : 5}
      rounded="xl"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
    >
      <VStack align="start" spacing={isSmall ? 2 : 3} h="full">
        <Flex
          p={isSmall ? 2 : 2.5}
          bg={iconBg}
          color={iconColor}
          rounded="lg"
          align="center"
          justify="center"
        >
          <Icon as={StatIcon} boxSize={isSmall ? 4 : 5} />
        </Flex>

        <Box flex={1}>
          <Text color="gray.500" fontSize={isSmall ? "xs" : "sm"} fontWeight="medium">
            {label}
          </Text>
          {isLoading ? (
            <Spinner size="sm" mt={1} />
          ) : (
            <Text fontSize={isSmall ? "lg" : "xl"} fontWeight="bold" mt={1} lineHeight="tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
          )}
        </Box>

        {growth && !isSmall && (
          <HStack spacing={1} bg="green.50" px={2} py={1} rounded="md" w="full">
            <Icon as={ArrowUpRight} color="green.500" boxSize={3} />
            <Text fontSize="xs" color="green.600" fontWeight="bold">
              {growth}
            </Text>
          </HStack>
        )}
      </VStack>
    </MotionBox>
  );
};

interface OverviewTabProps {
  isLoading: boolean;
  stats: {
    totalCompanies: number;
    totalBatches: number;
    totalCourses: number;
    totalEnrollments: number;
    totalRevenue: number;
    activeInstructors: number;
  };
  batchStatusStats: {
    active: number;
    completed: number;
    expired: number;
  };
  courseAssignmentStats: any[];
  categoryStats: any[];
  courseDistributionData: any;
  isLoadingCourseStats: boolean;
  unassignedCourseCount: number;
  averageBatchSize: number;
  activeInstructorCount: number;
  assignmentTypeStats: Record<string, number>;
  topCompaniesByBatches: any[];
  topCompaniesByAssignments: any[];
  getActivities: () => any[];
  getTopCourses: () => any[];
}

const OverviewTab = observer((props: OverviewTabProps) => {
  const sectionBg = useColorModeValue("white", "gray.800");
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textSecondary = useColorModeValue("gray.600", "gray.400");

  const maxAssignments = props.courseAssignmentStats[0]?.assignmentCount || 1;

  return (
    <VStack spacing={{ base: 4, md: 6 }} align="stretch">
      {/* Compact Header */}
      <MotionFlex
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={{ base: 3, md: 4 }}
      >
        <VStack align="start" spacing={1}>
          <HStack spacing={2}>
            <Icon as={Globe} boxSize={{ base: 5, md: 6 }} color="purple.600" />
            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold">Dashboard Overview</Text>
          </HStack>
          <Text fontSize="sm" color={textSecondary} display={{ base: "none", sm: "block" }}>
            System Status: <Badge colorScheme="green" size="sm" ml={2}>● Online</Badge>
          </Text>
        </VStack>
        
        <HStack spacing={3} w={{ base: "full", md: "auto" }}>
          <Box bg={headerBg} p={3} rounded="lg" textAlign="center" flex="1">
            <Text fontSize="xs" color="gray.500" fontWeight="medium">ACTIVE BATCHES</Text>
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">{props.batchStatusStats.active}</Text>
          </Box>
          <Box bg={headerBg} p={3} rounded="lg" textAlign="center" flex="1">
            <Text fontSize="xs" color="gray.500" fontWeight="medium">UPTIME</Text>
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">99.98%</Text>
          </Box>
        </HStack>
      </MotionFlex>

      {/* Primary KPIs */}
      <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={{ base: 3, md: 4 }}>
        <StatCard
          label="Companies"
          value={props.stats.totalCompanies}
          icon={Building2}
          color="purple"
          size="sm"
          isLoading={props.isLoading}
        />
        <StatCard
          label="Batches"
          value={props.stats.totalBatches}
          icon={GraduationCap}
          color="blue"
          size="sm"
          isLoading={props.isLoading}
        />
        <StatCard
          label="Courses"
          value={props.stats.totalCourses}
          icon={BookOpen}
          color="green"
          size="sm"
          isLoading={props.isLoading}
        />
        <StatCard
          label="Enrollments"
          value={props.stats.totalEnrollments}
          icon={Users}
          color="orange"
          size="sm"
          isLoading={props.isLoading}
        />
        <StatCard
          label="Revenue"
          value={`₹${(props.stats.totalRevenue / 100000).toFixed(1)}L`}
          icon={DollarSign}
          color="teal"
          size="sm"
          isLoading={props.isLoading}
        />
        <StatCard
          label="Facilitators"
          value={props.activeInstructorCount}
          icon={Activity}
          color="cyan"
          size="sm"
          isLoading={props.isLoading}
        />
      </SimpleGrid>

      {/* Secondary KPIs */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }}>
        <Box
          bg={sectionBg}
          p={4}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="xs" fontWeight="medium" color="gray.500">UNASSIGNED</Text>
              <Icon as={BookOpen} boxSize={4} color="yellow.600" />
            </HStack>
            <Text fontSize="lg" fontWeight="bold">{props.unassignedCourseCount}</Text>
            <Text fontSize="xs" color="gray.500">Courses</Text>
          </VStack>
        </Box>

        <Box
          bg={sectionBg}
          p={4}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="xs" fontWeight="medium" color="gray.500">AVG BATCH SIZE</Text>
              <Icon as={TrendingUp} boxSize={4} color="pink.600" />
            </HStack>
            <Text fontSize="lg" fontWeight="bold">{props.averageBatchSize}</Text>
            <Text fontSize="xs" color="gray.500">Users</Text>
          </VStack>
        </Box>

        <Box
          bg={sectionBg}
          p={4}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="xs" fontWeight="medium" color="gray.500">ACTIVE</Text>
              <Icon as={CheckCircle} boxSize={4} color="green.600" />
            </HStack>
            <Text fontSize="lg" fontWeight="bold">{props.batchStatusStats.active}</Text>
            <Text fontSize="xs" color="gray.500">Batches</Text>
          </VStack>
        </Box>

        <Box
          bg={sectionBg}
          p={4}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="xs" fontWeight="medium" color="gray.500">COMPLETED</Text>
              <Icon as={Award} boxSize={4} color="blue.600" />
            </HStack>
            <Text fontSize="lg" fontWeight="bold">{props.batchStatusStats.completed}</Text>
            <Text fontSize="xs" color="gray.500">Batches</Text>
          </VStack>
        </Box>
      </SimpleGrid>

      {/* Key Metrics Grid */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 5 }}>
        <MotionBox
          whileHover={{ y: -2 }}
          bg={sectionBg}
          p={5}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="bold" fontSize="md">Assignment Mix</Text>
            <Icon as={PieChartIcon} boxSize={4} color="purple.600" />
          </Flex>
          <VStack align="stretch" spacing={2}>
            {Object.entries(props.assignmentTypeStats).map(([key, count]: [string, number]) => (
              <Flex key={key} justify="space-between" align="center" p={2} bg={headerBg} rounded="md">
                <Text fontSize="sm" fontWeight="medium" textTransform="capitalize">{key}</Text>
                <Badge colorScheme={count > 0 ? 'purple' : 'gray'} variant="solid" fontSize="xs">
                  {count as number}
                </Badge>
              </Flex>
            ))}
          </VStack>
        </MotionBox>

        <MotionBox
          whileHover={{ y: -2 }}
          bg={sectionBg}
          p={5}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="bold" fontSize="md">Top by Batches</Text>
            <Icon as={GraduationCap} boxSize={4} color="blue.600" />
          </Flex>
          <VStack align="stretch" spacing={2}>
            {props.topCompaniesByBatches.length === 0 ? (
              <Text fontSize="xs" color={textSecondary}>No data</Text>
            ) : (
              props.topCompaniesByBatches.map((company, idx) => (
                <Box key={company.name} p={2} bg={headerBg} rounded="md">
                  <Text fontSize="sm" fontWeight="bold">{idx + 1}. {company.name}</Text>
                  <Text fontSize="xs" color={textSecondary}>{company.batches} batches • {company.users} users</Text>
                </Box>
              ))
            )}
          </VStack>
        </MotionBox>

        <MotionBox
          whileHover={{ y: -2 }}
          bg={sectionBg}
          p={5}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="bold" fontSize="md">Top by Assignments</Text>
            <Icon as={BookOpen} boxSize={4} color="green.600" />
          </Flex>
          <VStack align="stretch" spacing={2}>
            {props.topCompaniesByAssignments.length === 0 ? (
              <Text fontSize="xs" color={textSecondary}>No data</Text>
            ) : (
              props.topCompaniesByAssignments.map((company, idx) => (
                <Box key={company.name} p={2} bg={headerBg} rounded="md">
                  <Text fontSize="sm" fontWeight="bold">{idx + 1}. {company.name}</Text>
                  <Text fontSize="xs" color={textSecondary}>{company.assignments} assignments</Text>
                </Box>
              ))
            )}
          </VStack>
        </MotionBox>
      </SimpleGrid>

      {/* Charts Section */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 5 }}>
        {/* Course Analytics */}
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
              <Text fontWeight="bold" fontSize="md">Course Analytics</Text>
              <Text fontSize="xs" color={textSecondary}>{props.courseAssignmentStats.length} total</Text>
            </Box>
            <Badge colorScheme="purple" variant="subtle" fontSize="xs">
              TOP {Math.min(5, props.courseAssignmentStats.length)}
            </Badge>
          </Flex>

          <VStack spacing={3} align="stretch" maxH="350px" overflowY="auto" pr={2}>
            {props.isLoadingCourseStats ? (
              <Flex justify="center" py={8}>
                <Spinner size="sm" />
              </Flex>
            ) : props.courseAssignmentStats.length === 0 ? (
              <Flex justify="center" py={8} direction="column" align="center">
                <Icon as={BookOpen} boxSize={10} color="gray.300" mb={2} />
                <Text fontSize="sm" color={textSecondary}>No courses</Text>
              </Flex>
            ) : (
              props.courseAssignmentStats.slice(0, 5).map((course, idx) => (
                <MotionBox
                  key={course.courseId || idx}
                  whileHover={{ x: 4 }}
                  p={3}
                  bg={headerBg}
                  rounded="md"
                >
                  <Flex justify="space-between" align="start" mb={2}>
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontSize="sm" fontWeight="bold" noOfLines={1}>{course.title}</Text>
                      <HStack spacing={2} flexWrap="wrap">
                        <Badge colorScheme="purple" variant="subtle" size="sm" fontSize="xs">
                          {course.assignmentCount} Assign
                        </Badge>
                        <Badge colorScheme="blue" variant="subtle" size="sm" fontSize="xs">
                          {course.batchCount} Batch
                        </Badge>
                      </HStack>
                    </VStack>
                    <Text fontSize="xs" color="purple.600" fontWeight="bold">#{idx + 1}</Text>
                  </Flex>
                  <Box>
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="xs" color={textSecondary}>Utilization</Text>
                      <Text fontSize="xs" fontWeight="bold">{Math.round((course.assignmentCount / (maxAssignments || 1)) * 100)}%</Text>
                    </Flex>
                    <Progress value={(course.assignmentCount / (maxAssignments || 1)) * 100} size="xs" colorScheme="purple" rounded="full" />
                  </Box>
                </MotionBox>
              ))
            )}
          </VStack>
        </MotionBox>

        {/* Category Distribution */}
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
              <Text fontWeight="bold" fontSize="md">Categories</Text>
              <Text fontSize="xs" color={textSecondary}>Distribution</Text>
            </Box>
            <Box
              w={10}
              h={10}
              rounded="lg"
              bg="blue.50"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={PieChartIcon} boxSize={5} color="blue.600" />
            </Box>
          </Flex>

          {props.isLoadingCourseStats ? (
            <Flex justify="center" py={6}>
              <Spinner size="sm" />
            </Flex>
          ) : props.courseDistributionData && props.categoryStats.length > 0 ? (
            <>
              <Box h="180px" position="relative" mb={4}>
                <Doughnut
                  data={props.courseDistributionData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { font: { size: 10 }, padding: 8 }
                      }
                    }
                  }}
                />
              </Box>
              <VStack spacing={2} align="stretch">
                {props.categoryStats.slice(0, 4).map((cat) => (
                  <Flex key={cat.name} justify="space-between" align="center" p={2} bg={headerBg} rounded="md">
                    <HStack spacing={2}>
                      <Box w={2} h={2} bg={cat.color} rounded="full" />
                      <Text fontSize="xs" fontWeight="medium">{cat.name}</Text>
                    </HStack>
                    <Badge variant="subtle" colorScheme="purple">{cat.percentage}%</Badge>
                  </Flex>
                ))}
              </VStack>
            </>
          ) : (
            <Flex justify="center" py={8} direction="column" align="center">
              <Icon as={BookOpen} boxSize={10} color="gray.300" mb={2} />
              <Text fontSize="sm" color={textSecondary}>No data</Text>
            </Flex>
          )}
        </MotionBox>
      </SimpleGrid>

      {/* Activity & Top Course */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 5 }}>
        {/* Activity Feed */}
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
              <Text fontWeight="bold" fontSize="md">Recent Activity</Text>
              <Text fontSize="xs" color={textSecondary}>Latest system updates</Text>
            </Box>
            <Icon as={Zap} boxSize={4} color="orange.600" />
          </Flex>
          <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
            {props.getActivities().slice(0, 5).map((activity, idx) => (
              <Flex
                key={idx}
                p={3}
                bg={headerBg}
                rounded="md"
                align="start"
                gap={3}
              >
                <Box pt={1}>
                  <Icon
                    as={activity.status === 'Success' ? CheckCircle : activity.status === 'Active' ? Activity : Clock}
                    color={`${activity.statusColor}.500`}
                    boxSize={4}
                  />
                </Box>
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontSize="sm" fontWeight="medium" noOfLines={2}>{activity.name}</Text>
                  <Text fontSize="xs" color={textSecondary}>{activity.time}</Text>
                </VStack>
                <Badge size="sm" colorScheme={activity.statusColor}>{activity.status}</Badge>
              </Flex>
            ))}
          </VStack>
        </MotionBox>

        {/* Top Course */}
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
              <Text fontWeight="bold" fontSize="md">Top Course</Text>
              <Text fontSize="xs" color={textSecondary}>Most popular</Text>
            </Box>
            <Icon as={Award} boxSize={4} color="yellow.600" />
          </Flex>

          {props.isLoading || props.isLoadingCourseStats ? (
            <Flex justify="center" py={6}>
              <Spinner size="sm" />
            </Flex>
          ) : props.getTopCourses().length > 0 && props.getTopCourses()[0].title !== "No courses available" ? (
            (() => {
              const topCourse = props.getTopCourses()[0];
              const courseBatchCount = topCourse.batchCount || 0;
              
              return (
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Badge colorScheme="yellow" size="sm" mb={2}>⭐ Most Popular</Badge>
                    <Text fontWeight="bold" fontSize="sm" noOfLines={2}>{topCourse.title}</Text>
                  </Box>
                  <SimpleGrid columns={2} spacing={2}>
                    <Box p={2} bg={headerBg} rounded="md" textAlign="center">
                      <Text fontSize="sm" fontWeight="bold" color="purple.600">{topCourse.enrollments}</Text>
                      <Text fontSize="xs" color={textSecondary}>Assignments</Text>
                    </Box>
                    <Box p={2} bg={headerBg} rounded="md" textAlign="center">
                      <Text fontSize="sm" fontWeight="bold" color="blue.600">{courseBatchCount}</Text>
                      <Text fontSize="xs" color={textSecondary}>Batches</Text>
                    </Box>
                    <Box p={2} bg={headerBg} rounded="md" textAlign="center">
                      <HStack justify="center">
                        <Text fontSize="sm" fontWeight="bold">{topCourse.rating}</Text>
                        <Icon as={Star} boxSize={3} color="yellow.400" />
                      </HStack>
                      <Text fontSize="xs" color={textSecondary}>Rating</Text>
                    </Box>
                    <Box p={2} bg={headerBg} rounded="md" textAlign="center">
                      <Text fontSize="sm" fontWeight="bold" color="green.600">{topCourse.revenue}</Text>
                      <Text fontSize="xs" color={textSecondary}>Revenue</Text>
                    </Box>
                  </SimpleGrid>
                  <HStack pt={2} spacing={1} color={courseBatchCount > 0 ? "green.500" : "yellow.500"}>
                    <Box w={1.5} h={1.5} bg="currentColor" rounded="full" />
                    <Text fontSize="xs" fontWeight="medium">
                      {courseBatchCount > 0 ? "Active" : "Awaiting batches"}
                    </Text>
                  </HStack>
                </VStack>
              );
            })()
          ) : (
            <Flex justify="center" py={6} direction="column" align="center">
              <Icon as={BookOpen} boxSize={8} color="gray.300" mb={2} />
              <Text fontSize="xs" color={textSecondary}>No courses yet</Text>
            </Flex>
          )}
        </MotionBox>
      </SimpleGrid>

      {/* Recent Batches */}
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
            <Text fontWeight="bold" fontSize="md">Recent Batches</Text>
            <Text fontSize="xs" color={textSecondary}>Latest {Math.min(5, stores.batchStore.batches?.length || 0)} batches</Text>
          </Box>
          <Badge colorScheme="purple" variant="subtle" fontSize="xs">
            {stores.batchStore.batches?.length || 0} total
          </Badge>
        </Flex>

        <TableContainer display={{ base: "none", md: "block" }}>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr bg={headerBg}>
                <Th fontSize="xs" fontWeight="bold">Batch</Th>
                <Th fontSize="xs" fontWeight="bold">Company</Th>
                <Th fontSize="xs" fontWeight="bold">Users</Th>
                <Th fontSize="xs" fontWeight="bold">Start</Th>
                <Th fontSize="xs" fontWeight="bold">Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {props.isLoading ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={6}>
                    <Spinner size="sm" />
                  </Td>
                </Tr>
              ) : stores.batchStore.batches?.length === 0 ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={6}>
                    <Text fontSize="xs" color={textSecondary}>No batches yet</Text>
                  </Td>
                </Tr>
              ) : (
                stores.batchStore.batches.slice(0, 5).map((batch: any) => (
                  <Tr key={batch._id} _hover={{ bg: headerBg }}>
                    <Td>
                      <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                        {batch.name}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme="purple" variant="subtle" size="sm" fontSize="xs">
                        {batch.company?.company_name || 'N/A'}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="green" variant="subtle" size="sm" fontSize="xs">
                        {batch.userCount || 0}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="xs" color={textSecondary}>
                        {batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </Text>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          batch.status === 'active' ? 'green' :
                          batch.status === 'completed' ? 'blue' :
                          batch.status === 'expired' ? 'red' : 'yellow'
                        }
                        variant="solid"
                        size="sm"
                        fontSize="xs"
                        px={2}
                        py={0.5}
                      >
                        {batch.status === 'active' ? '● Active' :
                         batch.status === 'completed' ? '✓ Done' :
                         batch.status === 'expired' ? '✗ Exp' : '⚠ Soon'}
                      </Badge>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
        <VStack display={{ base: "flex", md: "none" }} spacing={3} align="stretch">
          {props.isLoading ? (
            <Flex justify="center" py={6}>
              <Spinner size="sm" />
            </Flex>
          ) : stores.batchStore.batches?.length === 0 ? (
            <Text fontSize="xs" color={textSecondary} textAlign="center" py={4}>No batches yet</Text>
          ) : (
            stores.batchStore.batches.slice(0, 5).map((batch: any) => (
              <Box key={batch._id} p={3} bg={headerBg} rounded="lg" borderWidth="1px" borderColor={borderColor}>
                <HStack justify="space-between" align="start" mb={2}>
                  <Text fontWeight="semibold" fontSize="sm" noOfLines={2}>{batch.name}</Text>
                  <Badge
                    colorScheme={
                      batch.status === 'active' ? 'green' :
                      batch.status === 'completed' ? 'blue' :
                      batch.status === 'expired' ? 'red' : 'yellow'
                    }
                    variant="subtle"
                    fontSize="0.65rem"
                  >
                    {batch.status || "upcoming"}
                  </Badge>
                </HStack>
                <SimpleGrid columns={2} spacing={2}>
                  <Box>
                    <Text fontSize="10px" color={textSecondary} textTransform="uppercase">Company</Text>
                    <Text fontSize="xs" fontWeight="medium" noOfLines={1}>{batch.company?.company_name || "N/A"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="10px" color={textSecondary} textTransform="uppercase">Users</Text>
                    <Text fontSize="xs" fontWeight="medium">{batch.userCount || 0}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="10px" color={textSecondary} textTransform="uppercase">Start</Text>
                    <Text fontSize="xs" fontWeight="medium">
                      {batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>
            ))
          )}
        </VStack>
      </MotionBox>
    </VStack>
  );
});

export default OverviewTab;
