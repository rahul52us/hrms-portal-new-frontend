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
  Grid,
  HStack,
  Icon,
  Input,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  PolicyCoverageItem,
  PolicyResourceType,
  ResolvedPolicyResource,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";
import { observer } from "mobx-react-lite";
import { FormEvent, useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiSettings } from "react-icons/fi";

const POLICY_LABELS: Record<PolicyResourceType, string> = {
  attendance_policy: "Attendance policy",
  work_schedule: "Work schedule",
  holiday_calendar: "Holiday calendar",
};

const getLocalDateValue = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const resolvedLabel = (resolved: ResolvedPolicyResource | null) => {
  if (!resolved) return null;
  const resource = typeof resolved.assignment.resource === "object"
    ? resolved.assignment.resource
    : null;
  const scopeName = resolved.assignment.scopeNameSnapshot;
  const scope = resolved.assignment.scopeType === "company"
    ? "Company wide"
    : scopeName || resolved.assignment.scopeType;

  return {
    name: resource?.name || "Policy configuration",
    version: resolved.version.versionNumber,
    scope,
  };
};

const CoverageValue = ({
  label,
  resolved,
  muted,
}: {
  label: string;
  resolved: ResolvedPolicyResource | null;
  muted: string;
}) => {
  const value = resolvedLabel(resolved);
  const assignedIconBg = useColorModeValue("green.50", "green.900");
  const assignedIconColor = useColorModeValue("green.600", "green.200");
  const missingIconBg = useColorModeValue("orange.50", "orange.900");
  const missingIconColor = useColorModeValue("orange.600", "orange.200");
  const missingTextColor = useColorModeValue("orange.700", "orange.200");

  return (
    <Box minW={0}>
      <Text
        display={{ base: "block", lg: "none" }}
        mb={2}
        fontSize="xs"
        fontWeight="700"
        color={muted}
        textTransform="uppercase"
      >
        {label}
      </Text>
      {value ? (
        <HStack align="start" spacing={2.5}>
          <Flex
            align="center"
            justify="center"
            flexShrink={0}
            boxSize="28px"
            borderRadius="full"
            bg={assignedIconBg}
            color={assignedIconColor}
          >
            <Icon as={FiCheckCircle} boxSize={4} />
          </Flex>
          <Box minW={0}>
            <Text fontSize="sm" fontWeight="700" noOfLines={2}>{value.name}</Text>
            <Text mt={0.5} fontSize="xs" color={muted}>
              Version {value.version} | {value.scope}
            </Text>
          </Box>
        </HStack>
      ) : (
        <HStack align="start" spacing={2.5}>
          <Flex
            align="center"
            justify="center"
            flexShrink={0}
            boxSize="28px"
            borderRadius="full"
            bg={missingIconBg}
            color={missingIconColor}
          >
            <Icon as={FiAlertCircle} boxSize={4} />
          </Flex>
          <Box>
            <Text fontSize="sm" fontWeight="700" color={missingTextColor}>Not assigned</Text>
            <Text mt={0.5} fontSize="xs" color={muted}>{label} is missing</Text>
          </Box>
        </HStack>
      )}
    </Box>
  );
};

const missingLabel = (missing: PolicyResourceType[]) =>
  missing.map((type) => POLICY_LABELS[type]).join(", ");

const EmployeeCoverageRow = ({
  item,
  borderColor,
  muted,
}: {
  item: PolicyCoverageItem;
  borderColor: string;
  muted: string;
}) => {
  const missingCount = item.missing.length;
  const employeeMeta = [item.employee.code, item.employee.email].filter(Boolean).join(" | ");

  return (
    <Grid
      templateColumns={{
        base: "minmax(0, 1fr)",
        lg: "minmax(190px, 1.1fr) repeat(3, minmax(170px, 1fr)) minmax(135px, 0.75fr)",
      }}
      borderTopWidth="1px"
      borderColor={borderColor}
    >
      <Flex p={4} minW={0} align="start" justify="space-between" gap={3}>
        <Box minW={0}>
          <Text fontWeight="800" noOfLines={1}>{item.employee.name || item.employee.email}</Text>
          <Text mt={0.5} fontSize="xs" color={muted} noOfLines={1}>{employeeMeta || "No employee code"}</Text>
        </Box>
        <Badge
          display={{ base: "inline-flex", lg: "none" }}
          flexShrink={0}
          colorScheme={item.complete ? "green" : "orange"}
          borderRadius="full"
          px={2.5}
          py={1}
          textTransform="none"
        >
          {item.complete ? "Ready" : `${missingCount} missing`}
        </Badge>
      </Flex>

      {[
        { label: POLICY_LABELS.attendance_policy, resolved: item.attendancePolicy },
        { label: POLICY_LABELS.work_schedule, resolved: item.workSchedule },
        { label: POLICY_LABELS.holiday_calendar, resolved: item.holidayCalendar },
      ].map(({ label, resolved }) => (
        <Box
          key={label}
          p={4}
          minW={0}
          borderTopWidth={{ base: "1px", lg: "0" }}
          borderLeftWidth={{ base: "0", lg: "1px" }}
          borderColor={borderColor}
        >
          <CoverageValue label={label} resolved={resolved} muted={muted} />
        </Box>
      ))}

      <Flex
        display={{ base: "none", lg: "flex" }}
        p={4}
        minW={0}
        direction="column"
        align="start"
        borderLeftWidth="1px"
        borderColor={borderColor}
      >
        <Badge
          colorScheme={item.complete ? "green" : "orange"}
          borderRadius="full"
          px={2.5}
          py={1}
          textTransform="none"
        >
          {item.complete ? "Ready" : `${missingCount} ${missingCount === 1 ? "policy" : "policies"} missing`}
        </Badge>
        <Text mt={2} fontSize="xs" color={muted} noOfLines={2}>
          {item.complete ? "All policies assigned" : missingLabel(item.missing)}
        </Text>
      </Flex>
    </Grid>
  );
};

const PolicyCoveragePanel = observer(({
  companyId,
  borderColor,
  muted,
  onManageAssignments,
}: {
  companyId: string;
  borderColor: string;
  muted: string;
  onManageAssignments: () => void;
}) => {
  const [asOfDate, setAsOfDate] = useState(getLocalDateValue());
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!companyId || !asOfDate) return;
    workforcePolicyStore
      .fetchCoverage(companyId, { at: asOfDate, page, limit: 20, search: appliedSearch })
      .catch(() => undefined);
  }, [appliedSearch, asOfDate, companyId, page]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };
  const pagination = workforcePolicyStore.coveragePagination;
  const summary = workforcePolicyStore.coverageSummary;
  const tableHeadBg = useColorModeValue("gray.50", "whiteAlpha.100");

  return (
    <Stack spacing={4}>
      <Flex
        as="form"
        onSubmit={submitSearch}
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "end" }}
        gap={3}
      >
        <FormControl maxW={{ md: "220px" }}>
          <FormLabel fontSize="sm" mb={1.5}>Effective date</FormLabel>
          <Input type="date" value={asOfDate} onChange={(event) => { setAsOfDate(event.target.value); setPage(1); }} />
        </FormControl>
        <FormControl flex="1">
          <FormLabel fontSize="sm" mb={1.5}>Find employee</FormLabel>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, code, department or team" />
        </FormControl>
        <Button type="submit" colorScheme="blue">Search</Button>
      </Flex>

      <Flex
        p={4}
        gap={4}
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        justify="space-between"
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
      >
        <Box>
          <Text fontWeight="800">Coverage result</Text>
          <Text mt={0.5} fontSize="sm" color={muted}>
            Checks attendance policy, work schedule and holiday calendar effective on the selected date.
          </Text>
        </Box>
        <Flex align={{ base: "stretch", sm: "center" }} direction={{ base: "column", sm: "row" }} gap={2} flexShrink={0}>
          <HStack spacing={2}>
            <Badge borderRadius="full" px={3} py={1.5} colorScheme="gray" textTransform="none">
              {summary.employeesOnPage} checked
            </Badge>
            <Badge borderRadius="full" px={3} py={1.5} colorScheme="green" textTransform="none">
              {summary.completeOnPage} ready
            </Badge>
            <Badge borderRadius="full" px={3} py={1.5} colorScheme="orange" textTransform="none">
              {summary.incompleteOnPage} need setup
            </Badge>
          </HStack>
          <Button size="sm" variant="outline" leftIcon={<FiSettings />} onClick={onManageAssignments}>
            Manage assignments
          </Button>
        </Flex>
      </Flex>

      {workforcePolicyStore.coverageError ? (
        <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{workforcePolicyStore.coverageError}</AlertDescription></Alert>
      ) : null}

      {workforcePolicyStore.coverageLoading ? (
        <Stack><Skeleton h="96px" /><Skeleton h="96px" /></Stack>
      ) : workforcePolicyStore.coverageItems.length === 0 ? (
        <Box borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md" py={12} textAlign="center">
          <Text color={muted}>No employees match this search.</Text>
        </Box>
      ) : (
        <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
          <Grid
            display={{ base: "none", lg: "grid" }}
            templateColumns="minmax(190px, 1.1fr) repeat(3, minmax(170px, 1fr)) minmax(135px, 0.75fr)"
            bg={tableHeadBg}
          >
            {["Employee", "Attendance policy", "Work schedule", "Holiday calendar", "Status"].map((label, index) => (
              <Box key={label} px={4} py={3} borderLeftWidth={index === 0 ? "0" : "1px"} borderColor={borderColor}>
                <Text fontSize="xs" fontWeight="800" color={muted} textTransform="uppercase">{label}</Text>
              </Box>
            ))}
          </Grid>
          {workforcePolicyStore.coverageItems.map((item) => (
            <EmployeeCoverageRow key={item.employee._id} item={item} borderColor={borderColor} muted={muted} />
          ))}
        </Box>
      )}

      <Flex justify="space-between" align="center" gap={3}>
        <Text fontSize="sm" color={muted}>{pagination.total} employees</Text>
        <HStack>
          <Button size="sm" variant="outline" isDisabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
          <Text fontSize="sm">{page} / {pagination.totalPages}</Text>
          <Button size="sm" variant="outline" isDisabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </HStack>
      </Flex>
    </Stack>
  );
});

export default PolicyCoveragePanel;
