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
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { workforcePolicyStore } from "@/app/store/workforcePolicyStore/workforcePolicyStore";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

const formatLabel = (value: string) =>
  String(value || "activity")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PolicyAuditPanel = observer(({
  companyId,
  borderColor,
  muted,
}: {
  companyId: string;
  borderColor: string;
  muted: string;
}) => {
  const [entityType, setEntityType] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reload, setReload] = useState(0);
  const [page, setPage] = useState(1);
  const dateError = fromDate && toDate && fromDate > toDate ? "From date must be on or before To date." : "";
  const searchPending = searchInput.trim() !== search;
  const hasFilters = Boolean(entityType || searchInput.trim() || fromDate || toDate);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!companyId || dateError || searchPending) return;
    workforcePolicyStore
      .fetchAudit(companyId, { page, limit: 20, entityType, search: search || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" })
      .catch(() => undefined);
  }, [companyId, entityType, page, search, fromDate, toDate, dateError, searchPending, reload]);

  const clearFilters = () => {
    setEntityType(""); setSearchInput(""); setSearch(""); setFromDate(""); setToDate(""); setPage(1);
  };

  const pagination = workforcePolicyStore.auditPagination;

  return (
    <Stack spacing={4}>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={3}>
        <FormControl minW={0}>
          <FormLabel fontSize="sm" htmlFor="policy-audit-search">Search</FormLabel>
          <Input id="policy-audit-search" size="sm" type="search" placeholder="Person or reason" maxLength={100} value={searchInput} onChange={(event) => { setSearchInput(event.target.value); setPage(1); }} />
        </FormControl>
        <FormControl minW={0}>
          <FormLabel fontSize="sm" htmlFor="policy-audit-entity">Entity type</FormLabel>
          <Select
            id="policy-audit-entity"
            size="sm"
            value={entityType}
            onChange={(event) => { setEntityType(event.target.value); setPage(1); }}
            aria-label="Filter audit entity"
          >
            <option value="">All activity</option>
            <option value="attendance_policy">Attendance policies</option>
            <option value="attendance_version">Attendance versions</option>
            <option value="work_schedule">Work schedules</option>
            <option value="work_schedule_version">Schedule versions</option>
            <option value="holiday_calendar">Holiday calendars</option>
            <option value="holiday_version">Holiday versions</option>
            <option value="leave_type">Leave types</option>
            <option value="leave_policy">Leave policies</option>
            <option value="remote_work_policy">WFH policies</option>
            <option value="timesheet_policy">Timesheet policies</option>
            <option value="timesheet_version">Timesheet policy versions</option>
            <option value="remote_work_version">WFH policy versions</option>
            <option value="leave_version">Leave versions</option>
            <option value="approval_workflow">Approval workflows</option>
            <option value="approval_workflow_version">Approval workflow versions</option>
            <option value="assignment">Assignments</option>
          </Select>
        </FormControl>
        <FormControl minW={0}>
          <FormLabel fontSize="sm" htmlFor="policy-audit-from">From date</FormLabel>
          <Input id="policy-audit-from" size="sm" type="date" max={toDate || undefined} value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1); }} />
        </FormControl>
        <FormControl minW={0} isInvalid={Boolean(dateError)}>
          <FormLabel fontSize="sm" htmlFor="policy-audit-to">To date</FormLabel>
          <Input id="policy-audit-to" size="sm" type="date" min={fromDate || undefined} value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1); }} />
        </FormControl>
      </SimpleGrid>
      <Flex justify="flex-end"><Button size="sm" variant="ghost" isDisabled={!hasFilters} onClick={clearFilters}>Clear filters</Button></Flex>

      {dateError ? <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{dateError}</AlertDescription></Alert> : null}

      {!dateError && !searchPending && workforcePolicyStore.auditError ? (
        <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription flex="1">{workforcePolicyStore.auditError}</AlertDescription><Button size="sm" onClick={() => setReload((value) => value + 1)}>Retry</Button></Alert>
      ) : null}

      {dateError ? null : workforcePolicyStore.auditLoading || searchPending ? (
        <Stack><Skeleton h="80px" /><Skeleton h="80px" /><Skeleton h="80px" /></Stack>
      ) : workforcePolicyStore.auditError ? null : workforcePolicyStore.auditLogs.length === 0 ? (
        <Box borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md" py={12} textAlign="center">
          <Text color={muted}>{hasFilters ? "No activity matches your filters." : "No policy activity has been recorded."}</Text>
        </Box>
      ) : (
        <Stack spacing={0} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
          {workforcePolicyStore.auditLogs.map((log, index) => {
            const actor = log.actor?.name || log.actor?.username || "System";
            const detailText = [
              log.details?.scopeType ? `Scope: ${log.details.scopeType}` : "",
              log.details?.versionNumber ? `Version: ${log.details.versionNumber}` : "",
              log.details?.reason || log.details?.cancellationReason || log.details?.endReason || log.details?.archiveReason || log.details?.after?.cancellationReason || log.details?.changeReason || log.details?.after?.changeReason || "",
            ].filter(Boolean).join(" | ");
            return (
              <Flex
                key={log._id}
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                gap={3}
                p={4}
                borderBottomWidth={index === workforcePolicyStore.auditLogs.length - 1 ? "0" : "1px"}
              >
                <Box minW={0} overflowWrap="anywhere">
                  <HStack flexWrap="wrap">
                    <Text fontWeight="800">{formatLabel(log.action)}</Text>
                    <Badge colorScheme="blue">{formatLabel(log.entityType)}</Badge>
                  </HStack>
                  <Text mt={1} fontSize="sm" color={muted}>{actor}{log.actor?.code ? ` (${log.actor.code})` : ""}</Text>
                  {detailText ? <Text mt={2} fontSize="sm">{detailText}</Text> : null}
                </Box>
                <Text fontSize="xs" color={muted} whiteSpace="nowrap">{formatDateTime(log.createdAt)}</Text>
              </Flex>
            );
          })}
        </Stack>
      )}

      <Flex justify="space-between" align="center" gap={3} wrap="wrap">
        <Text fontSize="sm" color={muted}>{dateError ? "--" : workforcePolicyStore.auditLoading || searchPending ? "Loading events..." : `${pagination.total} events`}</Text>
        <HStack>
          <Button size="sm" variant="outline" isDisabled={page <= 1 || Boolean(dateError) || searchPending || workforcePolicyStore.auditLoading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
          <Text fontSize="sm">{page} / {pagination.totalPages}</Text>
          <Button size="sm" variant="outline" isDisabled={page >= pagination.totalPages || Boolean(dateError) || searchPending || workforcePolicyStore.auditLoading} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </HStack>
      </Flex>
    </Stack>
  );
});

export default PolicyAuditPanel;
