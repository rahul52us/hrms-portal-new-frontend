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
  FormControl,
  FormLabel,
  HStack,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import {
  AttendancePeriodView,
  fetchAttendancePeriod,
  lockAttendancePeriod,
  prepareAttendancePeriod,
  reopenAttendancePeriod,
} from "./attendanceAdminApi";

function preparationKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `attendance-cycle-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const periodLabel = (periodKey: string) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${periodKey}-01T00:00:00Z`));

const titleCase = (value: string) =>
  String(value || "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AttendancePeriodDrawer({
  isOpen,
  periodKey,
  canLock,
  canPrepare,
  canReopen,
  onClose,
  onChanged,
}: {
  isOpen: boolean;
  periodKey: string;
  canLock: boolean;
  canPrepare: boolean;
  canReopen: boolean;
  onClose: () => void;
  onChanged: (_view: AttendancePeriodView) => void;
}) {
  const toast = useToast();
  const [view, setView] = useState<AttendancePeriodView | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    try {
      const result = await fetchAttendancePeriod(periodKey, controller.signal);
      setView(result);
      return result;
    } catch (requestError: any) {
      if (!controller.signal.aborted) {
        setError(getApiErrorMessage(requestError?.response?.data || requestError, "Could not load attendance period"));
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
    return null;
  }, [periodKey]);

  useEffect(() => {
    if (!isOpen) return;
    setReason("");
    void load();
  }, [isOpen, load]);

  useEffect(() => {
    if (!isOpen || !view?.readiness.activeProcessorRuns) return;
    const timer = window.setTimeout(async () => {
      const result = await load();
      if (result && result.readiness.activeProcessorRuns === 0) onChanged(result);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [isOpen, load, onChanged, view?.readiness.activeProcessorRuns]);

  const prepare = async () => {
    if (!view || reason.trim().length < 3) return;
    setPreparing(true);
    try {
      const result = await prepareAttendancePeriod(periodKey, reason.trim(), preparationKey());
      toast({
        title: result.data.queuedRuns ? "Attendance cycle preparation started" : "Attendance cycle is already prepared",
        description: result.message,
        status: result.data.queuedRuns ? "info" : "success",
        duration: 6000,
      });
      const refreshed = await load();
      if (refreshed) onChanged(refreshed);
    } catch (requestError: any) {
      toast({
        title: "Attendance cycle preparation failed",
        description: getApiErrorMessage(requestError?.response?.data || requestError, "Could not prepare attendance cycle"),
        status: "error",
        duration: 7000,
      });
    } finally {
      setPreparing(false);
    }
  };

  const transition = async () => {
    if (!view || reason.trim().length < 3) return;
    setSaving(true);
    try {
      const result = view.period.status === "locked"
        ? await reopenAttendancePeriod(periodKey, reason.trim(), view.period.version)
        : await lockAttendancePeriod(periodKey, reason.trim(), view.period.version);
      setView(result);
      setReason("");
      onChanged(result);
      toast({
        title: result.period.status === "locked" ? "Attendance cycle locked" : "Attendance cycle reopened",
        status: "success",
      });
    } catch (requestError: any) {
      toast({
        title: "Attendance period was not changed",
        description: getApiErrorMessage(requestError?.response?.data || requestError, "Could not update attendance period"),
        status: "error",
        duration: 7000,
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const locked = view?.period.status === "locked";
  const canTransition = locked ? canReopen : canLock;
  const transitionDisabled =
    !view ||
    !canTransition ||
    reason.trim().length < 3 ||
    (!locked && !view.readiness.readyToLock);

  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      titlePrefix="Attendance cycle"
      titleSuffix={periodLabel(periodKey)}
      subtitle={view ? `${view.period.startDate} to ${view.period.endDate} | Review readiness, lock, or reopen for corrections` : "Review cycle readiness"}
      maxW={{ base: "100%", lg: "760px" }}
      badgeContent={view ? <Badge colorScheme={locked ? "red" : "green"}>{locked ? "Locked" : "Open"}</Badge> : undefined}
      footerContent={
        <HStack justify="flex-end" w="100%">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {!locked && canPrepare && view?.readiness.periodEnded && !view.readiness.readyToLock ? (
            <Button
              variant="outline"
              colorScheme="blue"
              onClick={prepare}
              isLoading={preparing || view.readiness.activeProcessorRuns > 0}
              loadingText={view.readiness.activeProcessorRuns > 0 ? "Preparing" : undefined}
              isDisabled={reason.trim().length < 3 || view.readiness.activeImportBatches > 0}
            >
              Prepare cycle
            </Button>
          ) : null}
          {canTransition ? (
            <Button
              colorScheme={locked ? "orange" : "blue"}
              onClick={transition}
              isLoading={saving}
              isDisabled={transitionDisabled}
            >
              {locked ? "Reopen cycle" : "Lock cycle"}
            </Button>
          ) : null}
        </HStack>
      }
    >
      {loading ? (
        <Stack><Skeleton h="90px" /><Skeleton h="180px" /><Skeleton h="120px" /></Stack>
      ) : error ? (
        <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert>
      ) : view ? (
        <Stack spacing={5}>
          {locked ? (
            <Alert status="warning" borderRadius="md" alignItems="flex-start">
              <AlertIcon mt={1} />
              <AlertDescription>
                Attendance-changing operations are blocked only for dates from {view.period.startDate} through {view.period.endDate}. Reopening requires permission and an audited reason.
              </AlertDescription>
            </Alert>
          ) : view.readiness.readyToLock ? (
            <Alert status="success" borderRadius="md"><AlertIcon /><AlertDescription>This attendance cycle is ready to lock.</AlertDescription></Alert>
          ) : (
            <Alert status="warning" borderRadius="md" alignItems="flex-start">
              <AlertIcon mt={1} />
              <AlertDescription>
                <Text fontWeight="700" mb={1}>Resolve these items before locking:</Text>
                {view.readiness.blockers.map((blocker) => <Text key={blocker}>- {blocker}</Text>)}
                {view.readiness.missingProcessorDates.length ? (
                  <Text mt={2} fontSize="xs">
                    Not processed: {view.readiness.missingProcessorDates.join(", ")}
                  </Text>
                ) : null}
                {view.readiness.problemProcessorDates.length ? (
                  <Text mt={1} fontSize="xs">
                    Reprocess after resolving issues: {view.readiness.problemProcessorDates.join(", ")}
                  </Text>
                ) : null}
                {view.readiness.upcomingDays ? (
                  <Text mt={2} fontSize="xs">
                    Upcoming: {view.readiness.upcomingDays} date(s) are not due for processing yet.
                  </Text>
                ) : null}
              </AlertDescription>
            </Alert>
          )}

          <Box borderWidth="1px" borderRadius="md" overflow="hidden">
            <Text px={4} py={3} fontWeight="750">Readiness</Text>
            <Divider />
            <SimpleGrid columns={{ base: 2, sm: 3 }}>
              {[
                ["Records", view.readiness.totalRecords],
                ["Finalized", view.readiness.finalizedRecords],
                ["Not finalized", view.readiness.unfinalizedRecords],
                ["Processed closed dates", `${view.readiness.processedDays}/${view.readiness.closedCalendarDays}`],
                ["Upcoming dates", view.readiness.upcomingDays],
                ["Pending corrections", view.readiness.pendingRegularizations],
                ["Pending overtime", view.readiness.pendingOvertimeReviews],
                ["Pending leave", view.readiness.pendingLeaveRequests + view.readiness.pendingLeaveCancellations],
                ["Pending WFH", view.readiness.pendingRemoteWorkRequests],
              ].map(([label, value]) => (
                <Box key={String(label)} px={4} py={3} borderRightWidth="1px" borderBottomWidth="1px">
                  <Text fontSize="xs" color="gray.500">{label}</Text>
                  <Text fontSize="lg" fontWeight="800">{value}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>

          {canTransition ? (
            <FormControl isRequired>
              <FormLabel>{locked ? "Reason for reopening" : "Reason for preparation or locking"}</FormLabel>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={1000}
                placeholder={locked ? "Explain why this cycle needs corrections" : "Explain why this cycle is being prepared or locked"}
              />
              <Text mt={1} fontSize="xs" color="gray.500">Minimum 3 characters. This is stored in the audit history.</Text>
            </FormControl>
          ) : null}

          <Box>
            <Text fontWeight="750" mb={2}>Audit history</Text>
            {view.history.length ? (
              <Stack spacing={0} borderWidth="1px" borderRadius="md" divider={<Divider />}>
                {view.history.map((event) => (
                  <Box key={event._id} px={4} py={3}>
                    <HStack justify="space-between" align="flex-start">
                      <Box>
                        <Text fontSize="sm" fontWeight="700">{titleCase(event.action)} by {event.actor?.name || "User"}</Text>
                        <Text fontSize="xs" color="gray.500">Version {event.version} | {new Date(event.createdAt).toLocaleString()}</Text>
                      </Box>
                      <Badge colorScheme={event.action === "locked" ? "red" : "orange"}>{titleCase(event.action)}</Badge>
                    </HStack>
                    <Text mt={2} fontSize="sm">{event.reason}</Text>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Text fontSize="sm" color="gray.500">No lock or reopen events yet.</Text>
            )}
          </Box>
        </Stack>
      ) : null}
    </DashboardDrawer>
  );
}
