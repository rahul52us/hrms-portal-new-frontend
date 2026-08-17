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
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!companyId) return;
    workforcePolicyStore
      .fetchAudit(companyId, { page, limit: 20, entityType })
      .catch(() => undefined);
  }, [companyId, entityType, page]);

  const pagination = workforcePolicyStore.auditPagination;

  return (
    <Stack spacing={4}>
      <Select
        size="sm"
        maxW="280px"
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
        <option value="assignment">Assignments</option>
      </Select>

      {workforcePolicyStore.auditError ? (
        <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{workforcePolicyStore.auditError}</AlertDescription></Alert>
      ) : null}

      {workforcePolicyStore.auditLoading ? (
        <Stack><Skeleton h="80px" /><Skeleton h="80px" /><Skeleton h="80px" /></Stack>
      ) : workforcePolicyStore.auditLogs.length === 0 ? (
        <Box borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md" py={12} textAlign="center">
          <Text color={muted}>No policy activity has been recorded.</Text>
        </Box>
      ) : (
        <Stack spacing={0} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
          {workforcePolicyStore.auditLogs.map((log, index) => {
            const actor = log.actor?.name || log.actor?.username || "System";
            const detailText = [
              log.details?.scopeType ? `Scope: ${log.details.scopeType}` : "",
              log.details?.versionNumber ? `Version: ${log.details.versionNumber}` : "",
              log.details?.changeReason || log.details?.reason || "",
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
                <Box>
                  <HStack flexWrap="wrap">
                    <Text fontWeight="800">{formatLabel(log.action)}</Text>
                    <Badge colorScheme="blue">{formatLabel(log.entityType)}</Badge>
                  </HStack>
                  <Text mt={1} fontSize="sm" color={muted}>{actor}</Text>
                  {detailText ? <Text mt={2} fontSize="sm">{detailText}</Text> : null}
                </Box>
                <Text fontSize="xs" color={muted} whiteSpace="nowrap">{formatDateTime(log.createdAt)}</Text>
              </Flex>
            );
          })}
        </Stack>
      )}

      <Flex justify="space-between" align="center" gap={3}>
        <Text fontSize="sm" color={muted}>{pagination.total} events</Text>
        <HStack>
          <Button size="sm" variant="outline" isDisabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
          <Text fontSize="sm">{page} / {pagination.totalPages}</Text>
          <Button size="sm" variant="outline" isDisabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </HStack>
      </Flex>
    </Stack>
  );
});

export default PolicyAuditPanel;
