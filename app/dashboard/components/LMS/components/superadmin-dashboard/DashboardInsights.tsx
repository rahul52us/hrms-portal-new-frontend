"use client";

import {
  Avatar,
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Progress,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Clock3,
  GraduationCap,
  UserRound,
} from "lucide-react";
import { SuperadminDashboardSummary } from "./types";

type DashboardInsightsProps = {
  highlights: NonNullable<SuperadminDashboardSummary["highlights"]>;
};

function Panel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      p={{ base: 4, md: 5 }}
      boxShadow="sm"
      minW={0}
    >
      <Flex justify="space-between" align="flex-start" gap={3} mb={4}>
        <Box>
          <Heading size="sm">{title}</Heading>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {subtitle}
          </Text>
        </Box>
        <Flex
          align="center"
          justify="center"
          boxSize="34px"
          borderRadius="xl"
          bg="purple.50"
          color="purple.600"
          flexShrink={0}
        >
          <Icon as={icon} boxSize={4} />
        </Flex>
      </Flex>
      {children}
    </Box>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "Date unavailable";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardInsights({ highlights }: DashboardInsightsProps) {
  const surface = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const activity = highlights.recentActivity || [];
  const recentUsers = highlights.recentUsers || [];
  const lowEngagementCompanies = highlights.lowEngagementCompanies || [];
  const expiringBatches = highlights.expiringBatches || [];
  const expiringEnrollments = highlights.expiringEnrollments || [];

  return (
    <Grid templateColumns={{ base: "1fr", xl: "repeat(2, minmax(0, 1fr))" }} gap={4}>
      <Panel title="Recent portal activity" subtitle="Latest companies, users, courses, and batches" icon={Clock3}>
        <Stack spacing={2}>
          {activity.length ? (
            activity.slice(0, 6).map((item) => (
              <Flex
                key={item.id}
                p={3}
                bg={surface}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="xl"
                align="center"
                gap={3}
              >
                <Flex
                  boxSize="32px"
                  align="center"
                  justify="center"
                  borderRadius="lg"
                  bg="whiteAlpha.700"
                  color="purple.600"
                  flexShrink={0}
                >
                  <Icon
                    as={
                      item.type === "company"
                        ? Building2
                        : item.type === "batch"
                          ? GraduationCap
                          : UserRound
                    }
                    boxSize={4}
                  />
                </Flex>
                <Box minW={0} flex={1}>
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
            ))
          ) : (
            <Text fontSize="sm" color="gray.500">
              No recent activity matches the current filters.
            </Text>
          )}
        </Stack>
      </Panel>

      <Panel title="Recently added users" subtitle="Newest accounts in the selected scope" icon={UserRound}>
        <Stack spacing={2}>
          {recentUsers.length ? (
            recentUsers.slice(0, 6).map((user) => (
              <Flex
                key={user._id}
                p={3}
                bg={surface}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="xl"
                align="center"
                gap={3}
              >
                <Avatar size="sm" name={user.name} />
                <Box minW={0} flex={1}>
                  <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                    {user.name}
                  </Text>
                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                    {user.role} · {user.companyName}
                  </Text>
                </Box>
                <Badge colorScheme={user.isActive ? "green" : "gray"} variant="subtle">
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </Flex>
            ))
          ) : (
            <Text fontSize="sm" color="gray.500">
              No users were found for the selected filters.
            </Text>
          )}
        </Stack>
      </Panel>

      <Panel title="Engagement watchlist" subtitle="Learners and companies without recent progress activity" icon={AlertTriangle}>
        <Stack spacing={4}>
          <Box>
            <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase" mb={2}>
              Companies
            </Text>
            <Stack spacing={2}>
              {lowEngagementCompanies.length ? (
                lowEngagementCompanies.slice(0, 4).map((company) => (
                  <Box key={company.companyId} p={3} bg={surface} borderRadius="xl">
                    <Flex justify="space-between" gap={3} mb={2}>
                      <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                        {company.name}
                      </Text>
                      <Text fontSize="xs" color="orange.500" fontWeight="bold">
                        {company.engagementRate}% active
                      </Text>
                    </Flex>
                    <Progress
                      value={company.engagementRate}
                      colorScheme={company.engagementRate < 30 ? "red" : "orange"}
                      size="xs"
                      borderRadius="full"
                    />
                  </Box>
                ))
              ) : (
                <Text fontSize="sm" color="gray.500">
                  No company engagement risks detected.
                </Text>
              )}
            </Stack>
          </Box>
        </Stack>
      </Panel>

      <Panel title="Expiring soon" subtitle="Batches and course access ending within 30 days" icon={CalendarClock}>
        <Stack spacing={3}>
          {expiringBatches.map((batch) => (
            <Flex
              key={batch._id}
              p={3}
              bg={surface}
              borderRadius="xl"
              justify="space-between"
              gap={3}
            >
              <Box minW={0}>
                <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                  {batch.name}
                </Text>
                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                  {batch.companyName} · {batch.userCount} learners
                </Text>
              </Box>
              <Badge colorScheme="orange" variant="subtle" alignSelf="center">
                {formatDate(batch.endDate)}
              </Badge>
            </Flex>
          ))}
          {expiringEnrollments.map((item) => (
            <Flex
              key={item._id}
              p={3}
              bg={surface}
              borderRadius="xl"
              justify="space-between"
              gap={3}
            >
              <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                {item.courseTitle}
              </Text>
              <Badge colorScheme="yellow" variant="subtle" alignSelf="center">
                {formatDate(item.validTill)}
              </Badge>
            </Flex>
          ))}
          {!expiringBatches.length && !expiringEnrollments.length ? (
            <Text fontSize="sm" color="gray.500">
              Nothing is due to expire in the next 30 days.
            </Text>
          ) : null}
        </Stack>
      </Panel>
    </Grid>
  );
}
