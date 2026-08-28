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
  InputGroup,
  InputLeftElement,
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
import { FiAlertCircle, FiCheckCircle, FiSettings, FiSearch, FiCalendar } from "react-icons/fi";

const POLICY_LABELS: Record<PolicyResourceType, string> = {
  attendance_policy: "Attendance policy",
  work_schedule: "Work schedule",
  holiday_calendar: "Holiday calendar",
  leave_policy: "Leave policy",
  remote_work_policy: "WFH policy",
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
  const missingIconBg = useColorModeValue("red.100", "red.900");
  const missingIconColor = useColorModeValue("red.600", "red.200");
  const missingTextColor = useColorModeValue("red.700", "red.200");

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
  const employeeMeta = [item.employee.code, item.employee.username].filter(Boolean).join(" | ");

  return (
    <Grid
      minW={{ base: 0, lg: "1050px" }}
      templateColumns={{
        base: "minmax(0, 1fr)",
        lg: "minmax(190px, 1.1fr) repeat(5, minmax(165px, 1fr)) minmax(135px, 0.75fr)",
      }}
      borderTopWidth="1px"
      borderColor={borderColor}
      _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }}
      transition="background 0.2s"
    >
      <Flex p={4} minW={0} align="start" justify="space-between" gap={3}>
        <Box minW={0}>
          <Text fontWeight="800" noOfLines={1}>{item.employee.name || item.employee.username}</Text>
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
        { label: POLICY_LABELS.leave_policy, resolved: item.leavePolicy },
        { label: POLICY_LABELS.remote_work_policy, resolved: item.remoteWorkPolicy },
      ].map(({ label, resolved }) => (
        <Box
          key={label}
          p={4}
          minW={0}
          borderTopWidth={{ base: "1px", lg: "0" }}
          borderLeftWidth={{ base: "0", lg: "1px" }}
          borderColor={borderColor}
          bg={!resolved ? useColorModeValue("red.50", "rgba(229, 62, 62, 0.1)") : "transparent"}
          transition="background 0.2s"
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
        bg={item.complete ? "transparent" : useColorModeValue("orange.50", "rgba(221, 107, 32, 0.1)")}
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
  const surface = useColorModeValue("white", "gray.800");

  return (
    <Stack spacing={5}>
      <Flex justify="space-between" align={{ base: "start", lg: "end" }} direction={{ base: "column", lg: "row" }} gap={4}>
        <Box>
          <Text fontWeight="800" fontSize="lg">Coverage result</Text>
          <Text mt={1} fontSize="sm" color={muted}>
            Checks attendance, schedule, holiday, leave, and WFH policies effective on the selected date.
          </Text>
        </Box>
        <Flex as="form" onSubmit={submitSearch} align="center" gap={3} w={{ base: "full", lg: "auto" }}>
          <Input 
            type="date" 
            size="sm" 
            w="160px"
            value={asOfDate} 
            onChange={(e) => { setAsOfDate(e.target.value); setPage(1); }} 
            borderRadius="md" 
            bg={surface} 
          />
          <InputGroup size="sm" w={{ base: "full", lg: "250px" }}>
            <InputLeftElement pointerEvents="none"><FiSearch color="gray.400" /></InputLeftElement>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." borderRadius="md" bg={surface} />
          </InputGroup>
          <Button size="sm" type="submit" colorScheme="blue" borderRadius="md" px={6}>Search</Button>
        </Flex>
      </Flex>
      
      <Flex justify="space-between" align="center" direction={{ base: "column", sm: "row" }} gap={3}>
         <HStack spacing={2}>
            <Badge borderRadius="full" px={3} py={1.5} colorScheme="gray" textTransform="none">{summary.employeesOnPage} checked</Badge>
            <Badge borderRadius="full" px={3} py={1.5} colorScheme="green" textTransform="none">{summary.completeOnPage} ready</Badge>
            <Badge borderRadius="full" px={3} py={1.5} colorScheme="orange" textTransform="none">{summary.incompleteOnPage} need setup</Badge>
         </HStack>
         <Button size="sm" variant="outline" leftIcon={<FiSettings />} onClick={onManageAssignments} borderRadius="md" bg={surface}>
           Manage assignments
         </Button>
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
        <Box borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" shadow="sm">
          <Grid
            display={{ base: "none", lg: "grid" }}
            minW="1050px"
            templateColumns="minmax(190px, 1.1fr) repeat(5, minmax(165px, 1fr)) minmax(135px, 0.75fr)"
            bg={tableHeadBg}
          >
            {["Employee", "Attendance policy", "Work schedule", "Holiday calendar", "Leave policy", "WFH policy", "Status"].map((label, index) => (
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
