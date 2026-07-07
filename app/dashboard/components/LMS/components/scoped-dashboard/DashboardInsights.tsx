"use client";

import {
  Avatar,
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Progress,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiActivity, FiAlertTriangle, FiAward, FiCalendar, FiUsers } from "react-icons/fi";
import { ScopedDashboardSummary } from "./types";

function formatDate(value?: string | null) {
  if (!value) {
    return "No recent activity";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={{ base: 4, md: 5 }}
      boxShadow="sm"
      minW={0}
    >
      <HStack mb={4}>
        <Box color="purple.500">{icon}</Box>
        <Heading size="sm">{title}</Heading>
      </HStack>
      {children}
    </Box>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <Box py={8} textAlign="center">
      <Text fontSize="sm" color="gray.500">
        {children}
      </Text>
    </Box>
  );
}

export function DashboardInsights({
  highlights,
}: {
  highlights: ScopedDashboardSummary["highlights"];
}) {
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const learnerProgress = highlights?.learnerProgress || [];
  const lowEngagement = highlights?.lowEngagementUsers || [];
  const topLearners = highlights?.topLearners || [];
  const recentActivity = highlights?.recentActivity || [];
  const expiringEnrollments = highlights?.expiringEnrollments || [];
  const expiringBatches = highlights?.expiringBatches || [];
  const batchProgress = highlights?.batchProgress || [];

  return (
    <Stack spacing={4}>
      <Panel title="Learner progress" icon={<FiUsers />}>
        {learnerProgress.length ? (
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th pl={0}>Learner</Th>
                  <Th display={{ base: "none", md: "table-cell" }}>Department</Th>
                  <Th>Progress</Th>
                  <Th isNumeric display={{ base: "none", lg: "table-cell" }}>
                    Pending
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {learnerProgress.map((learner: any) => (
                  <Tr key={learner._id}>
                    <Td pl={0}>
                      <HStack>
                        <Avatar size="xs" name={learner.name} />
                        <Box minW={0}>
                          <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                            {learner.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500" noOfLines={1}>
                            {formatDate(learner.lastActivity)}
                          </Text>
                        </Box>
                      </HStack>
                    </Td>
                    <Td display={{ base: "none", md: "table-cell" }}>
                      <Text fontSize="sm">{learner.department}</Text>
                    </Td>
                    <Td minW="130px">
                      <HStack>
                        <Progress
                          value={learner.progress || 0}
                          size="sm"
                          colorScheme={learner.progress >= 75 ? "teal" : learner.progress >= 40 ? "purple" : "orange"}
                          borderRadius="full"
                          flex={1}
                        />
                        <Text fontSize="xs" minW="34px">
                          {learner.progress || 0}%
                        </Text>
                      </HStack>
                    </Td>
                    <Td isNumeric display={{ base: "none", lg: "table-cell" }}>
                      {learner.pendingCourses || 0}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyState>No learner progress is available for this selection.</EmptyState>
        )}
      </Panel>

      <Grid templateColumns={{ base: "1fr", xl: "repeat(3, minmax(0, 1fr))" }} gap={4}>
        <Panel title="Learners at risk" icon={<FiAlertTriangle />}>
          {lowEngagement.length ? (
            <Stack spacing={3}>
              {lowEngagement.slice(0, 5).map((learner: any, index: number) => (
                <Flex
                  key={learner._id}
                  justify="space-between"
                  gap={3}
                  pb={index === Math.min(lowEngagement.length, 5) - 1 ? 0 : 3}
                  borderBottomWidth={index === Math.min(lowEngagement.length, 5) - 1 ? "0" : "1px"}
                  borderColor={borderColor}
                >
                  <Box minW={0}>
                    <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                      {learner.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                      {learner.department} · {formatDate(learner.lastActivity)}
                    </Text>
                  </Box>
                  <Badge colorScheme="orange" borderRadius="full">
                    {learner.progress || 0}%
                  </Badge>
                </Flex>
              ))}
            </Stack>
          ) : (
            <EmptyState>No low-engagement learners detected.</EmptyState>
          )}
        </Panel>

        <Panel title="Top performers" icon={<FiAward />}>
          {topLearners.length ? (
            <Stack spacing={3}>
              {topLearners.slice(0, 5).map((learner: any, index: number) => (
                <Flex
                  key={learner._id}
                  justify="space-between"
                  gap={3}
                  pb={index === Math.min(topLearners.length, 5) - 1 ? 0 : 3}
                  borderBottomWidth={index === Math.min(topLearners.length, 5) - 1 ? "0" : "1px"}
                  borderColor={borderColor}
                >
                  <Box minW={0}>
                    <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                      {learner.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {learner.completedCourses || 0} completed
                    </Text>
                  </Box>
                  <Badge colorScheme="teal" borderRadius="full">
                    {learner.progress || 0}%
                  </Badge>
                </Flex>
              ))}
            </Stack>
          ) : (
            <EmptyState>Performance rankings will appear after learners begin courses.</EmptyState>
          )}
        </Panel>

        <Panel title="Upcoming deadlines" icon={<FiCalendar />}>
          {expiringEnrollments.length || expiringBatches.length ? (
            <Stack spacing={3}>
              {expiringEnrollments.slice(0, 3).map((item: any) => (
                <Box key={item._id}>
                  <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                    {item.courseTitle}
                  </Text>
                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                    {item.learnerName} · due {formatDate(item.deadline)}
                  </Text>
                </Box>
              ))}
              {expiringBatches.slice(0, 2).map((item: any) => (
                <Box key={item._id}>
                  <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                    {item.name}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Batch ends {formatDate(item.endDate)}
                  </Text>
                </Box>
              ))}
            </Stack>
          ) : (
            <EmptyState>No courses or batches expire in the next 30 days.</EmptyState>
          )}
        </Panel>
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "repeat(2, minmax(0, 1fr))" }} gap={4}>
        <Panel title="Recent activity" icon={<FiActivity />}>
          {recentActivity.length ? (
            <Stack spacing={3}>
              {recentActivity.slice(0, 6).map((item: any, index: number) => (
                <Flex
                  key={item.id}
                  justify="space-between"
                  gap={3}
                  pb={index === Math.min(recentActivity.length, 6) - 1 ? 0 : 3}
                  borderBottomWidth={index === Math.min(recentActivity.length, 6) - 1 ? "0" : "1px"}
                  borderColor={borderColor}
                >
                  <Box minW={0}>
                    <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                      {item.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                      {item.detail}
                    </Text>
                  </Box>
                  <Text fontSize="xs" color="gray.400" whiteSpace="nowrap">
                    {formatDate(item.createdAt)}
                  </Text>
                </Flex>
              ))}
            </Stack>
          ) : (
            <EmptyState>No recent learner activity is available.</EmptyState>
          )}
        </Panel>

        <Panel title="Batch progress" icon={<FiUsers />}>
          {batchProgress.length ? (
            <Stack spacing={4}>
              {batchProgress.slice(0, 6).map((batch: any) => (
                <Box key={batch._id}>
                  <Flex justify="space-between" mb={1}>
                    <Box minW={0}>
                      <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                        {batch.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {batch.userCount || 0} learners · {batch.status}
                      </Text>
                    </Box>
                    <Text fontSize="sm" fontWeight="bold">
                      {batch.completionRate || 0}%
                    </Text>
                  </Flex>
                  <Progress
                    value={batch.completionRate || 0}
                    colorScheme="purple"
                    size="sm"
                    borderRadius="full"
                  />
                </Box>
              ))}
            </Stack>
          ) : (
            <EmptyState>No scoped batch progress is available.</EmptyState>
          )}
        </Panel>
      </Grid>
    </Stack>
  );
}
