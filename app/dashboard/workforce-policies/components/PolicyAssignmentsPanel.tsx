"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  WorkforcePolicyAssignment,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

const formatDate = (value?: string | null) => {
  if (!value) return "Open ended";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
};

const getResourceName = (assignment: WorkforcePolicyAssignment) =>
  typeof assignment.resource === "object"
    ? assignment.resource.name
    : "Policy configuration";

const getResourceTypeLabel = (type: string) => {
  if (type === "attendance_policy") return "Attendance";
  if (type === "work_schedule") return "Schedule";
  if (type === "holiday_calendar") return "Holiday";
  return "Leave";
};

const PolicyAssignmentsPanel = observer(({
  companyId,
  canManage,
  borderColor,
  muted,
  onEndAssignment,
  lockedResourceType,
}: {
  companyId: string;
  canManage: boolean;
  borderColor: string;
  muted: string;
  onEndAssignment: (assignment: WorkforcePolicyAssignment) => void;
  lockedResourceType?: string;
}) => {
  const [resourceType, setResourceType] = useState(lockedResourceType || "");
  const [scopeType, setScopeType] = useState("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setError(null);
    workforcePolicyStore
      .fetchAssignments(companyId, {
        page,
        limit: 20,
        resourceType,
        scopeType,
        state,
      })
      .catch((requestError: any) => setError(requestError?.message || "Failed to load assignments"));
  }, [companyId, page, resourceType, scopeType, state]);

  useEffect(() => {
    setResourceType(lockedResourceType || "");
    setPage(1);
  }, [lockedResourceType]);

  const pagination = workforcePolicyStore.assignmentsPagination;

  return (
    <Stack spacing={4}>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
        {lockedResourceType ? (
          <Box borderWidth="1px" borderRadius="md" px={3} py={1.5} fontSize="sm">
            {getResourceTypeLabel(lockedResourceType)} policies
          </Box>
        ) : (
          <Select
            size="sm"
            value={resourceType}
            onChange={(event) => { setResourceType(event.target.value); setPage(1); }}
            aria-label="Filter assignment category"
          >
            <option value="">All categories</option>
            <option value="attendance_policy">Attendance policies</option>
            <option value="work_schedule">Work schedules</option>
            <option value="holiday_calendar">Holiday calendars</option>
            <option value="leave_policy">Leave policies</option>
          </Select>
        )}
        <Select
          size="sm"
          value={scopeType}
          onChange={(event) => { setScopeType(event.target.value); setPage(1); }}
          aria-label="Filter assignment scope"
        >
          <option value="">All scopes</option>
          <option value="company">Company</option>
          <option value="location">Location</option>
          <option value="department">Department</option>
          <option value="team">Team</option>
          <option value="employee">Employee</option>
        </Select>
        <Select
          size="sm"
          value={state}
          onChange={(event) => { setState(event.target.value); setPage(1); }}
          aria-label="Filter assignment status"
        >
          <option value="">All states</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="ended">Ended</option>
        </Select>
      </SimpleGrid>

      {error ? (
        <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert>
      ) : null}

      {workforcePolicyStore.assignmentsLoading ? (
        <Stack><Skeleton h="88px" /><Skeleton h="88px" /></Stack>
      ) : workforcePolicyStore.assignments.length === 0 ? (
        <Box borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md" py={12} textAlign="center">
          <Text color={muted}>No assignments match these filters.</Text>
        </Box>
      ) : (
        <Stack spacing={0} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
          {workforcePolicyStore.assignments.map((assignment, index) => {
            const createdBy = typeof assignment.createdBy === "object"
              ? assignment.createdBy?.name || assignment.createdBy?.username
              : "";
            const endedBy = typeof assignment.endedBy === "object"
              ? assignment.endedBy?.name || assignment.endedBy?.username
              : "";
            return (
              <Flex
                key={assignment._id}
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                gap={3}
                p={4}
                borderBottomWidth={index === workforcePolicyStore.assignments.length - 1 ? "0" : "1px"}
              >
                <Box minW={0}>
                  <HStack flexWrap="wrap">
                    <Text fontWeight="800">{getResourceName(assignment)}</Text>
                    <Badge colorScheme={assignment.resourceType === "attendance_policy" ? "blue" : assignment.resourceType === "work_schedule" ? "cyan" : assignment.resourceType === "holiday_calendar" ? "purple" : "green"}>
                      {getResourceTypeLabel(assignment.resourceType)}
                    </Badge>
                    <Badge colorScheme={assignment.state === "active" ? "green" : assignment.state === "scheduled" ? "orange" : "gray"}>
                      {assignment.state}
                    </Badge>
                  </HStack>
                  <Text mt={1} fontSize="sm" color={muted}>
                    {assignment.scopeType}: {assignment.scopeNameSnapshot}
                  </Text>
                  <Text mt={1} fontSize="xs" color={muted}>
                    {formatDate(assignment.effectiveFrom)} to {formatDate(assignment.effectiveTo)}
                    {createdBy ? ` | Assigned by ${createdBy}` : ""}
                  </Text>
                  <Text mt={2} fontSize="sm">{assignment.changeReason}</Text>
                  {assignment.endReason ? (
                    <Text mt={1} fontSize="xs" color={muted}>
                      Ended{endedBy ? ` by ${endedBy}` : ""}: {assignment.endReason}
                    </Text>
                  ) : null}
                </Box>
                {canManage && assignment.state !== "ended" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="orange"
                    alignSelf={{ base: "stretch", md: "center" }}
                    onClick={() => onEndAssignment(assignment)}
                  >
                    End assignment
                  </Button>
                ) : null}
              </Flex>
            );
          })}
        </Stack>
      )}

      <Flex justify="space-between" align="center" gap={3}>
        <Text fontSize="sm" color={muted}>
          {pagination.total} assignment{pagination.total === 1 ? "" : "s"}
        </Text>
        <HStack>
          <Button size="sm" variant="outline" isDisabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
          <Text fontSize="sm">{page} / {pagination.totalPages}</Text>
          <Button size="sm" variant="outline" isDisabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </HStack>
      </Flex>
    </Stack>
  );
});

export default PolicyAssignmentsPanel;
