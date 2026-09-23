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
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { FiEdit3 } from "react-icons/fi";
import { AttendanceRecord, fetchMyAttendanceDay } from "./attendanceApi";

const titleCase = (value: string) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const displayDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));

const localToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const formatMinutes = (value: number | null | undefined) => {
  const minutes = Math.max(0, Number(value || 0));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h${remainder ? ` ${remainder}m` : ""}` : `${remainder}m`;
};

const formatTime = (value: string | null | undefined, timezone: string) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: timezone || "Asia/Kolkata",
      }).format(new Date(value))
    : "Not recorded";

const statusColor = (status: string) =>
  ({
    present: "green",
    half_day: "orange",
    absent: "red",
    incomplete: "red",
    pending: "blue",
    holiday: "purple",
    weekly_off: "gray",
    leave: "cyan",
  })[status] || "gray";

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box minW={0}>
      <Text fontSize="xs" color="gray.500" mb={1}>{label}</Text>
      <Text fontSize="sm" fontWeight="650" overflowWrap="anywhere">{value || "Not available"}</Text>
    </Box>
  );
}

function PolicyRow({ label, value }: { label: string; value: any }) {
  return (
    <Flex justify="space-between" gap={4} py={3} align="flex-start">
      <Text fontSize="sm" color="gray.500">{label}</Text>
      <Box textAlign="right" minW={0}>
        <Text fontSize="sm" fontWeight="700" overflowWrap="anywhere">
          {value ? `${value.name} (${value.code})` : "Not configured"}
        </Text>
        {value ? <Text fontSize="xs" color="gray.500">Version {value.versionNumber || "-"}</Text> : null}
      </Box>
    </Flex>
  );
}

export default function MyAttendanceDayDrawer({
  attendanceDate,
  record,
  onClose,
}: {
  attendanceDate: string | null;
  record: AttendanceRecord | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const panel = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (!attendanceDate) {
      setData(null);
      setError("");
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchMyAttendanceDay(attendanceDate, controller.signal)
      .then(setData)
      .catch((requestError: any) => {
        if (!controller.signal.aborted) {
          setError(getApiErrorMessage(requestError?.response?.data || requestError, "Could not load attendance details"));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attendanceDate]);

  const detailRecord = data?.record || record;
  const timezone = detailRecord?.timezone || data?.context?.timezone || "Asia/Kolkata";
  const status = detailRecord?.status || record?.status || "not_marked";
  const correctionPending = data?.regularizationRequest?.status === "submitted";
  const canRequestCorrection = Boolean(attendanceDate && attendanceDate <= localToday());

  return (
    <DashboardDrawer
      isOpen={Boolean(attendanceDate)}
      onClose={onClose}
      titlePrefix="Attendance"
      titleSuffix={attendanceDate ? displayDate(attendanceDate) : ""}
      subtitle="Punches, calculation, and configuration used"
      maxW={{ base: "100%", lg: "680px" }}
      badgeContent={attendanceDate ? <Badge colorScheme={statusColor(status)}>{titleCase(status)}</Badge> : undefined}
      footerContent={canRequestCorrection ? (
        <Flex w="full" justify="flex-end">
          {correctionPending ? (
            <Button colorScheme="orange" isDisabled>Correction pending</Button>
          ) : (
            <Button
              as={Link}
              href={`/dashboard/requests?applyDate=${attendanceDate}&requestType=attendance_correction`}
              colorScheme="blue"
              leftIcon={<FiEdit3 />}
            >
              Request attendance correction
            </Button>
          )}
        </Flex>
      ) : undefined}
    >
      {loading ? (
        <Stack spacing={4}><Skeleton h="90px" /><Skeleton h="180px" /><Skeleton h="160px" /></Stack>
      ) : error ? (
        <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert>
      ) : data && attendanceDate ? (
        <Stack spacing={5}>
          <Alert status={status === "absent" || status === "incomplete" ? "warning" : "info"} borderRadius="md">
            <AlertIcon />
            <AlertDescription>{data.explanation}</AlertDescription>
          </Alert>

          {data.context?.missingPolicies?.length ? (
            <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>Missing setup: {data.context.missingPolicies.map(titleCase).join(", ")}.</AlertDescription></Alert>
          ) : null}

          <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
            <Text fontSize="sm" fontWeight="800" mb={4}>Day and schedule</Text>
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
              <Field label="Day type" value={titleCase(data.context.dayType)} />
              <Field label="Shift" value={data.context.schedule?.startTime && data.context.schedule?.endTime ? `${data.context.schedule.startTime} - ${data.context.schedule.endTime}` : "Not configured"} />
              <Field label="Expected" value={formatMinutes(data.context.expectedWorkMinutes)} />
              <Field label="Work mode" value={titleCase(detailRecord?.workMode)} />
              <Field label="Location" value={data.organization.officeLocation} />
              <Field label="Timezone" value={timezone} />
            </SimpleGrid>
            {data.context.holiday ? <Text mt={4} fontSize="sm" color="blue.600">{data.context.holiday.name}{data.context.holiday.isHalfDay ? " (half day)" : ""}</Text> : null}
          </Box>

          <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
            <Text fontSize="sm" fontWeight="800" mb={4}>Punches and calculation</Text>
            {detailRecord?.punchSessions?.length ? (
              <Stack spacing={3}>
                {detailRecord.punchSessions.map((session: any, index: number) => (
                  <SimpleGrid key={session._id || index} columns={{ base: 2, md: 3 }} spacing={3} bg={panel} borderRadius="md" p={3}>
                    <Field label="Punch in" value={formatTime(session.punchIn, timezone)} />
                    <Field label="Final punch out" value={formatTime(session.punchOut, timezone)} />
                    <Field label="Source" value={titleCase(session.source)} />
                  </SimpleGrid>
                ))}
              </Stack>
            ) : <Text fontSize="sm" color="gray.500">No punches were recorded.</Text>}
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mt={4}>
              <Field label="Worked" value={formatMinutes(detailRecord?.workedMinutes)} />
              <Field label="Late" value={formatMinutes(detailRecord?.lateMinutes)} />
              <Field label="Early exit" value={formatMinutes(detailRecord?.earlyExitMinutes)} />
              <Field label="Overtime" value={formatMinutes(detailRecord?.overtimeMinutes)} />
              <Field label="Missing punch" value={detailRecord?.hasMissingPunch ? "Yes" : "No"} />
              <Field label="Record state" value={titleCase(detailRecord?.state)} />
            </SimpleGrid>
          </Box>

          {data.leaveRequest || data.remoteWorkRequest ? (
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
              <Text fontSize="sm" fontWeight="800" mb={2}>Approved request</Text>
              <Text fontSize="sm">
                {data.leaveRequest
                  ? `${data.leaveRequest.leaveTypeNameSnapshot || "Leave"}: ${data.leaveRequest.reason || "No reason provided"}`
                  : `Work from home: ${data.remoteWorkRequest.reason || "No reason provided"}`}
              </Text>
            </Box>
          ) : null}

          {data.regularizationRequest ? (
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
              <Flex justify="space-between" gap={3} align="start">
                <Box>
                  <Text fontSize="sm" fontWeight="800">Attendance correction</Text>
                  <Text mt={1} fontSize="sm">{titleCase(data.regularizationRequest.correctionType)}</Text>
                  <Text mt={1} fontSize="xs" color="gray.500">{data.regularizationRequest.reason}</Text>
                  {data.regularizationRequest.status === "submitted" ? (
                    <Text mt={2} fontSize="xs" color="orange.600" fontWeight="700">
                      Awaiting {data.regularizationRequest.approvalInstance?.steps?.find((step: any) => step.order === data.regularizationRequest.approvalInstance?.currentStepOrder)?.nameSnapshot || data.regularizationRequest.approverNameSnapshot || "approval"}
                    </Text>
                  ) : null}
                </Box>
                <Badge colorScheme={data.regularizationRequest.status === "approved" ? "green" : data.regularizationRequest.status === "rejected" ? "red" : "orange"}>{titleCase(data.regularizationRequest.status)}</Badge>
              </Flex>
            </Box>
          ) : null}

          <Box borderWidth="1px" borderColor={border} borderRadius="md" px={4}>
            <Text fontSize="sm" fontWeight="800" pt={4} pb={2}>Configuration used</Text>
            <Stack spacing={0} divider={<Divider />}>
              <PolicyRow label="Attendance policy" value={data.policies.attendancePolicy} />
              <PolicyRow label="Work schedule" value={data.policies.workSchedule} />
              <PolicyRow label="Holiday calendar" value={data.policies.holidayCalendar} />
            </Stack>
          </Box>

          <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
            <Text fontSize="sm" fontWeight="800" mb={3}>Revision history</Text>
            {data.revisions?.length ? (
              <Stack spacing={3} divider={<Divider />}>
                {data.revisions.map((revision: any) => (
                  <Box key={revision._id} pb={3}>
                    <Flex justify="space-between" gap={3} flexWrap="wrap">
                      <Text fontSize="sm" fontWeight="700">{titleCase(revision.action)}</Text>
                      <Text fontSize="xs" color="gray.500">{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(revision.createdAt))}</Text>
                    </Flex>
                    <Text fontSize="sm" mt={1}>{revision.reason || "Attendance record updated"}</Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>{revision.actor?.name || "System"} | Revision {revision.revisionNumber}</Text>
                  </Box>
                ))}
              </Stack>
            ) : <Text fontSize="sm" color="gray.500">No revisions have been recorded.</Text>}
          </Box>
        </Stack>
      ) : null}
    </DashboardDrawer>
  );
}
