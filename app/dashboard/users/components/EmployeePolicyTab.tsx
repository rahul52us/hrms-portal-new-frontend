"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  EmployeePolicyResolution,
  ResolvedPolicyResource,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";
import { useEffect, useRef, useState } from "react";

const getLocalDateValue = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Open ended";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "--"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
};

const formatScope = (value?: string) =>
  String(value || "company")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getResource = (resolved: ResolvedPolicyResource | null) =>
  resolved && typeof resolved.assignment.resource === "object"
    ? resolved.assignment.resource
    : null;

const PolicyCard = ({
  title,
  resolved,
  kind,
}: {
  title: string;
  resolved: ResolvedPolicyResource | null;
  kind: "attendance" | "schedule" | "holiday" | "leave";
}) => {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  if (!resolved) {
    return (
      <Box borderWidth="1px" borderColor="red.200" borderRadius="md" p={4} minH={{ base: "auto", lg: "210px" }}>
        <HStack justify="space-between">
          <Text fontWeight="700">{title}</Text>
          <Badge colorScheme="red">Missing</Badge>
        </HStack>
        <Text mt={4} fontSize="sm" color={muted}>
          No published configuration is effective for this employee and date.
        </Text>
      </Box>
    );
  }

  const resource = getResource(resolved);
  const version = resolved.version;
  const attendanceRules = kind === "attendance" ? (version.rules as any) : null;
  const scheduleRules = kind === "schedule" ? (version.rules as any) : null;
  const holidays = kind === "holiday" && Array.isArray(version.holidays) ? version.holidays : [];
  const leaveRules = kind === "leave" && Array.isArray(version.rules) ? version.rules : [];

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4} minH={{ base: "auto", lg: "210px" }}>
      <Flex justify="space-between" align="start" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" color={muted} fontWeight="700">
            {title}
          </Text>
          <Text mt={1} fontWeight="800" noOfLines={2}>
            {resource?.name || "Policy configuration"}
          </Text>
          <Text fontSize="xs" color={muted}>
            {resource?.code || "--"}
          </Text>
        </Box>
        <Badge colorScheme="green" flexShrink={0}>
          v{version.versionNumber}
        </Badge>
      </Flex>

      <Stack mt={4} spacing={1.5} fontSize="sm">
        <Text>
          <strong>Assigned through:</strong> {formatScope(resolved.assignment.scopeType)}
        </Text>
        <Text color={muted}>{resolved.assignment.scopeNameSnapshot}</Text>
        <Text>
          <strong>Effective:</strong> {formatDate(version.effectiveFrom)} to {formatDate(version.effectiveTo)}
        </Text>
        {attendanceRules ? (
          <>
            <Text><strong>Full day:</strong> {attendanceRules.minimumFullDayMinutes} minutes</Text>
            <Text><strong>Late grace:</strong> {attendanceRules.gracePeriodMinutesLate} minutes</Text>
          </>
        ) : null}
        {scheduleRules ? (
          <>
            <Text><strong>Hours:</strong> {scheduleRules.startTime} - {scheduleRules.endTime}</Text>
            <Text><strong>Working days:</strong> {(scheduleRules.workingDays || []).join(", ") || "--"}</Text>
          </>
        ) : null}
        {kind === "holiday" ? (
          <Text><strong>Holidays:</strong> {holidays.length}</Text>
        ) : null}
        {kind === "leave" ? (
          <>
            <Text><strong>Leave year:</strong> starts {version.leaveYearStartDay || 1}/{version.leaveYearStartMonth || 1}</Text>
            <Text><strong>Leave types:</strong> {leaveRules.map((rule: any) => rule.leaveTypeCodeSnapshot).filter(Boolean).join(", ") || "--"}</Text>
          </>
        ) : null}
      </Stack>
    </Box>
  );
};

export default function EmployeePolicyTab({
  employeeId,
  assignmentHistory,
}: {
  employeeId: string;
  assignmentHistory: any[];
}) {
  const [asOfDate, setAsOfDate] = useState(getLocalDateValue());
  const [resolution, setResolution] = useState<EmployeePolicyResolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const muted = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (!employeeId || !asOfDate) return;
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(null);
    workforcePolicyStore
      .resolveEmployeePolicy(employeeId, asOfDate)
      .then((data) => {
        if (sequence === requestSequence.current) setResolution(data);
      })
      .catch((requestError: any) => {
        if (sequence === requestSequence.current) {
          setResolution(null);
          setError(requestError?.message || "Failed to load employee policies");
        }
      })
      .finally(() => {
        if (sequence === requestSequence.current) setLoading(false);
      });
  }, [asOfDate, employeeId]);

  return (
    <VStack align="stretch" spacing={5}>
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "end" }}
        gap={3}
      >
        <Box>
          <Text fontWeight="800">Effective workforce configuration</Text>
          <Text mt={1} fontSize="sm" color={muted}>
            Exact rules that apply to this employee on the selected date.
          </Text>
        </Box>
        <FormControl maxW={{ md: "220px" }}>
          <FormLabel fontSize="sm" mb={1.5}>As of date</FormLabel>
          <Input
            type="date"
            value={asOfDate}
            onChange={(event) => setAsOfDate(event.target.value)}
          />
        </FormControl>
      </Flex>

      {error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={4}>
          <Skeleton h="220px" borderRadius="md" />
          <Skeleton h="220px" borderRadius="md" />
          <Skeleton h="220px" borderRadius="md" />
        </SimpleGrid>
      ) : resolution ? (
        <>
          {resolution.warnings.length ? (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <AlertDescription>{resolution.warnings.join(". ")}</AlertDescription>
            </Alert>
          ) : null}

          <SimpleGrid columns={{ base: 1, lg: 2, xl: 4 }} spacing={4}>
            <PolicyCard title="Attendance policy" resolved={resolution.attendancePolicy} kind="attendance" />
            <PolicyCard title="Work schedule" resolved={resolution.workSchedule} kind="schedule" />
            <PolicyCard title="Holiday calendar" resolved={resolution.holidayCalendar} kind="holiday" />
            <PolicyCard title="Leave policy" resolved={resolution.leavePolicy} kind="leave" />
          </SimpleGrid>

          <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
            <Text fontWeight="700">Organization context on {formatDate(resolution.at)}</Text>
            <SimpleGrid mt={3} columns={{ base: 1, md: 3 }} spacing={3} fontSize="sm">
              <Text><strong>Department:</strong> {resolution.organizationAssignment?.departmentNameSnapshot || "--"}</Text>
              <Text><strong>Team:</strong> {resolution.organizationAssignment?.teamNameSnapshot || "--"}</Text>
              <Text><strong>Office:</strong> {resolution.organizationAssignment?.officeLocationNameSnapshot || "--"}</Text>
            </SimpleGrid>
          </Box>
        </>
      ) : null}

      <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
        <Text fontWeight="700">Employment periods</Text>
        <Text mt={1} fontSize="sm" color={muted}>
          Select a period to resolve the policies that applied when that assignment started.
        </Text>
        <Stack mt={4} spacing={2}>
          {assignmentHistory.length === 0 ? (
            <Text fontSize="sm" color={muted}>No employment periods are available.</Text>
          ) : assignmentHistory.slice(0, 8).map((assignment: any) => {
            const dateValue = String(assignment.effectiveFrom || "").slice(0, 10);
            return (
              <Flex
                key={assignment._id}
                justify="space-between"
                align={{ base: "start", md: "center" }}
                direction={{ base: "column", md: "row" }}
                gap={2}
                borderTopWidth="1px"
                borderColor={borderColor}
                pt={2}
              >
                <Box>
                  <HStack spacing={2} flexWrap="wrap">
                    <Text fontSize="sm" fontWeight="700">
                      {assignment.departmentNameSnapshot || "No department"}
                    </Text>
                    {assignment.teamNameSnapshot ? <Badge>{assignment.teamNameSnapshot}</Badge> : null}
                    {assignment.isCurrent ? <Badge colorScheme="green">Current</Badge> : null}
                  </HStack>
                  <Text fontSize="xs" color={muted}>
                    {formatDate(assignment.effectiveFrom)} to {formatDate(assignment.effectiveTo)}
                  </Text>
                </Box>
                <Button
                  size="xs"
                  variant="outline"
                  isDisabled={!dateValue}
                  onClick={() => setAsOfDate(dateValue)}
                >
                  View policies
                </Button>
              </Flex>
            );
          })}
        </Stack>
      </Box>
    </VStack>
  );
}
