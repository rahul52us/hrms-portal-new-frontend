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
  Divider,
  Flex,
  HStack,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AttendanceProcessorRun,
  fetchAttendanceProcessorRuns,
  processAttendanceDay,
  resumeAttendanceProcessorRun,
} from "./attendanceAdminApi";

function runKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `attendance-process-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function statusColor(status: AttendanceProcessorRun["status"]) {
  if (status === "completed") return "green";
  if (status === "completed_with_errors") return "orange";
  if (status === "failed") return "red";
  return "blue";
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AttendanceProcessorDrawer({
  isOpen,
  attendanceDate,
  onClose,
  onProcessed,
}: {
  isOpen: boolean;
  attendanceDate: string;
  onClose: () => void;
  onProcessed: () => void;
}) {
  const toast = useToast();
  const [runs, setRuns] = useState<AttendanceProcessorRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resumingId, setResumingId] = useState("");
  const activeRunId = useRef("");

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const nextRuns = await fetchAttendanceProcessorRuns(attendanceDate);
      setRuns(nextRuns);
      if (!activeRunId.current) {
        activeRunId.current = nextRuns.find((run) =>
          ["pending", "running"].includes(run.status)
        )?._id || "";
      }
      const tracked = nextRuns.find((run) => run._id === activeRunId.current);
      if (
        tracked &&
        !["pending", "running"].includes(tracked.status)
      ) {
        activeRunId.current = "";
        onProcessed();
      }
    } catch (error: any) {
      toast({
        title: "Unable to load processor runs",
        description: getApiErrorMessage(error?.response?.data || error, "Could not load attendance processing history"),
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [attendanceDate, onProcessed, toast]);

  useEffect(() => {
    if (isOpen) void loadRuns();
  }, [isOpen, loadRuns]);

  useEffect(() => {
    if (!isOpen || !runs.some((run) => ["pending", "running"].includes(run.status))) return;
    const timer = window.setTimeout(() => void loadRuns(), 2000);
    return () => window.clearTimeout(timer);
  }, [isOpen, loadRuns, runs]);

  const processDay = async () => {
    setProcessing(true);
    try {
      const run = await processAttendanceDay({
        attendanceDate,
        idempotencyKey: runKey(),
        batchSize: 100,
      });
      activeRunId.current = run._id;
      toast({
        title: "Attendance processing started",
        description: "Progress and setup issues will appear in this drawer.",
        status: "info",
        duration: 5000,
      });
      await loadRuns();
    } catch (error: any) {
      toast({
        title: "Attendance processing failed",
        description: getApiErrorMessage(error?.response?.data || error, "Could not process this attendance day"),
        status: "error",
        duration: 5000,
      });
    } finally {
      setProcessing(false);
    }
  };

  const resumeRun = async (runId: string) => {
    setResumingId(runId);
    try {
      const run = await resumeAttendanceProcessorRun(runId);
      activeRunId.current = run._id;
      await loadRuns();
    } catch (error: any) {
      toast({
        title: "Unable to resume processing",
        description: getApiErrorMessage(error?.response?.data || error, "Could not resume this processor run"),
        status: "error",
      });
    } finally {
      setResumingId("");
    }
  };

  const latest = runs[0];
  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      titlePrefix="Process attendance day"
      titleSuffix={attendanceDate}
      subtitle="Materialize closed attendance and apply policy finalization"
      maxW={{ base: "100%", lg: "760px" }}
      footerContent={
        <HStack justify="flex-end" w="100%">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button
            colorScheme="blue"
            onClick={processDay}
            isLoading={processing}
            isDisabled={runs.some((run) => ["pending", "running"].includes(run.status))}
          >
            Process day
          </Button>
        </HStack>
      }
    >
      <Stack spacing={5}>
        <Alert status="info" borderRadius="md" alignItems="flex-start">
          <AlertIcon mt={1} />
          <AlertDescription>
            Only employees whose shift end time has passed are processed. Overnight shifts close on the next date. Records are finalized only when their attendance policy enables it and the configured grace period has elapsed.
          </AlertDescription>
        </Alert>

        {loading ? (
          <Stack><Skeleton h="90px" /><Skeleton h="130px" /></Stack>
        ) : latest ? (
          <Box borderWidth="1px" borderRadius="md" overflow="hidden">
            <Flex px={4} py={3} justify="space-between" align="center" gap={3}>
              <Box>
                <Text fontWeight="750">Latest run</Text>
                <Text fontSize="xs" color="gray.500">
                  {new Date(latest.createdAt).toLocaleString()} | {Math.round(Number(latest.durationMs || 0) / 1000)}s
                </Text>
              </Box>
              <Badge colorScheme={statusColor(latest.status)}>{formatStatus(latest.status)}</Badge>
            </Flex>
            <Divider />
            <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={0}>
              {[
                ["Scanned", latest.counts.scanned],
                ["Created", latest.counts.created],
                ["Updated", latest.counts.updated],
                ["Still open", latest.counts.notClosed],
                ["Waiting to lock", latest.counts.awaitingFinalization],
                ["Auto-finalized", latest.counts.autoFinalized],
                ["Needs review", latest.counts.reviewRequired],
                ["Skipped", latest.counts.skipped],
                ["Setup gaps", latest.counts.setupGaps],
                ["Failures", latest.counts.failures],
              ].map(([label, value]) => (
                <Box key={String(label)} px={4} py={3} borderRightWidth="1px" borderBottomWidth="1px">
                  <Text fontSize="xs" color="gray.500">{label}</Text>
                  <Text fontSize="lg" fontWeight="800">{value}</Text>
                </Box>
              ))}
            </SimpleGrid>
            {latest.lastError ? <Text px={4} py={3} color="red.600" fontSize="sm">{latest.lastError}</Text> : null}
            {latest.failures?.length ? (
              <Stack px={4} py={3} spacing={2} borderTopWidth="1px" maxH="220px" overflowY="auto">
                <Text fontSize="sm" fontWeight="700">Items needing attention</Text>
                {latest.failures.map((failure, index) => (
                  <Box key={`${failure.employee || failure.employeeCode}-${index}`}>
                    <Text fontSize="sm" fontWeight="650">{failure.employeeCode || "Employee"}</Text>
                    <Text fontSize="xs" color="gray.600">{failure.message}</Text>
                  </Box>
                ))}
              </Stack>
            ) : null}
          </Box>
        ) : (
          <Box borderWidth="1px" borderRadius="md" p={5}>
            <Text fontWeight="700">No processing run exists for this date.</Text>
            <Text mt={1} fontSize="sm" color="gray.600">Run it after employee shifts have closed.</Text>
          </Box>
        )}

        {runs.some((run) => run.status === "failed") ? (
          <Stack spacing={2}>
            <Text fontSize="sm" fontWeight="700">Failed runs</Text>
            {runs.filter((run) => run.status === "failed").map((run) => (
              <Flex key={run._id} borderWidth="1px" borderRadius="md" p={3} justify="space-between" align="center" gap={3}>
                <Box>
                  <Text fontSize="sm" fontWeight="650">{new Date(run.createdAt).toLocaleString()}</Text>
                  <Text fontSize="xs" color="red.600">{run.lastError || "Processing stopped before completion"}</Text>
                </Box>
                <Button size="sm" variant="outline" onClick={() => resumeRun(run._id)} isLoading={resumingId === run._id}>
                  Resume
                </Button>
              </Flex>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </DashboardDrawer>
  );
}
