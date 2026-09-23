"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Select,
  Stack,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import type { AttendanceOperation, AttendanceOverviewRow } from "./attendanceAdminApi";
import { runBulkAttendanceOperation } from "./attendanceAdminApi";

export default function AttendanceBulkActionDrawer({
  isOpen,
  rows,
  attendanceDate,
  canAdjust,
  canFinalize,
  canReopen = false,
  initialOperation,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  rows: AttendanceOverviewRow[];
  attendanceDate: string;
  canAdjust: boolean;
  canFinalize: boolean;
  canReopen?: boolean;
  initialOperation?: AttendanceOperation;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [operation, setOperation] = useState<AttendanceOperation>(
    initialOperation || (canAdjust ? "set_status" : canFinalize ? "finalize" : "reopen")
  );
  const [status, setStatus] = useState("present");
  const [workMode, setWorkMode] = useState("office");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;
    setOperation(initialOperation || (canAdjust ? "set_status" : canFinalize ? "finalize" : "reopen"));
    setStatus("present");
    setWorkMode("office");
    setReason("");
    setResult(null);
  }, [canAdjust, canFinalize, initialOperation, isOpen]);

  const unavailable = useMemo(
    () => operation === "finalize" ? rows.filter((row) => row.state === "finalized").length : 0,
    [operation, rows]
  );

  const submit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const response = await runBulkAttendanceOperation({
        employeeIds: rows.map((row) => row.employee.id),
        attendanceDate,
        operation,
        reason,
        ...(operation === "set_status" ? { status } : {}),
        ...(operation === "set_work_mode" ? { workMode } : {}),
      });
      setResult(response.data);
      onSaved();
      toast({
        title: response.message || "Attendance operation complete",
        status: response.data?.failed ? "warning" : "success",
        duration: 4000,
      });
    } catch (error: any) {
      toast({
        title: "Attendance operation failed",
        description: getApiErrorMessage(error?.response?.data || error, "Could not update attendance"),
        status: "error",
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      titlePrefix="Bulk attendance"
      titleSuffix={attendanceDate}
      subtitle={`${rows.length} selected employee${rows.length === 1 ? "" : "s"}`}
      maxW={{ base: "100%", md: "640px" }}
      footerContent={
        <HStack justify="flex-end" w="100%">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button colorScheme="blue" onClick={submit} isLoading={submitting} isDisabled={!rows.length || reason.trim().length < 3}>
            Apply to {rows.length}
          </Button>
        </HStack>
      }
    >
      <Stack spacing={5}>
        <FormControl>
          <FormLabel>Action</FormLabel>
          <Select value={operation} onChange={(event) => setOperation(event.target.value as AttendanceOperation)}>
            {canAdjust ? <option value="set_status">Mark attendance status</option> : null}
            {canAdjust ? <option value="set_work_mode">Assign work mode</option> : null}
            {canAdjust ? <option value="recalculate">Recalculate from punches</option> : null}
            {canFinalize ? <option value="finalize">Finalize attendance</option> : null}
            {canReopen ? <option value="reopen">Reopen finalized attendance</option> : null}
          </Select>
        </FormControl>

        {operation === "set_status" ? (
          <FormControl>
            <FormLabel>Status</FormLabel>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="present">Present</option>
              <option value="half_day">Half day</option>
              <option value="absent">Absent</option>
              <option value="incomplete">Incomplete</option>
              <option value="holiday">Holiday</option>
              <option value="weekly_off">Weekly off</option>
            </Select>
          </FormControl>
        ) : null}

        {operation === "set_work_mode" ? (
          <FormControl>
            <FormLabel>Work mode</FormLabel>
            <Select value={workMode} onChange={(event) => setWorkMode(event.target.value)}>
              <option value="office">Office</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="field">Field</option>
            </Select>
          </FormControl>
        ) : null}

        {operation === "finalize" ? (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              Finalized records cannot be edited until a permitted user reopens them.
              {unavailable ? ` ${unavailable} selected record(s) are already finalized.` : ""}
            </AlertDescription>
          </Alert>
        ) : null}

        {operation === "reopen" ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <AlertDescription>Reopening restores the record for controlled corrections and is recorded in its audit history.</AlertDescription>
          </Alert>
        ) : null}

        <FormControl isRequired>
          <FormLabel>Reason</FormLabel>
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason applied to every selected employee" maxLength={500} />
          <FormHelperText>Each successful record gets its own audit revision.</FormHelperText>
        </FormControl>

        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Text fontSize="sm" fontWeight="800" mb={3}>Selected employees</Text>
          <Stack spacing={2} maxH="220px" overflowY="auto">
            {rows.map((row) => (
              <HStack key={row.employee.id} justify="space-between" gap={3}>
                <Box minW={0}>
                  <Text fontSize="sm" fontWeight="650" noOfLines={1}>{row.employee.name}</Text>
                  <Text fontSize="xs" color="gray.500">{row.employee.code}</Text>
                </Box>
                <Badge variant="subtle">{row.status.replace(/_/g, " ")}</Badge>
              </HStack>
            ))}
          </Stack>
        </Box>

        {result ? (
          <Alert status={result.failed ? "warning" : "success"} borderRadius="md">
            <AlertIcon />
            <AlertDescription>{result.applied} updated, {result.failed} failed.</AlertDescription>
          </Alert>
        ) : null}
      </Stack>
    </DashboardDrawer>
  );
}
