"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Divider,
  Flex,
  HStack,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AttendanceOverviewRow,
  fetchAttendanceEmployeeDay,
} from "./attendanceAdminApi";

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
    not_marked: "yellow",
  })[status] || "gray";

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box minW={0}>
      <Text fontSize="xs" color="gray.500" mb={1}>
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="650" overflowWrap="anywhere">
        {value || "Not available"}
      </Text>
    </Box>
  );
}

function PolicyRow({ label, value }: { label: string; value: any }) {
  return (
    <Flex gap={4} justify="space-between" py={3} align="flex-start">
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
      <Box textAlign="right" minW={0}>
        <Text fontSize="sm" fontWeight="700" overflowWrap="anywhere">
          {value ? `${value.name} (${value.code})` : "Not configured"}
        </Text>
        {value ? (
          <Text fontSize="xs" color="gray.500">
            Version {value.versionNumber || "-"}
            {value.scopeType ? ` via ${titleCase(value.scopeType)}` : ""}
          </Text>
        ) : null}
      </Box>
    </Flex>
  );
}

export default function AttendanceDayDrawer({
  row,
  onClose,
}: {
  row: AttendanceOverviewRow | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const panel = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (!row) {
      setData(null);
      setError("");
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchAttendanceEmployeeDay(row.employee.id, row.attendanceDate, controller.signal)
      .then(setData)
      .catch((requestError: any) => {
        if (!controller.signal.aborted) {
          setError(
            getApiErrorMessage(
              requestError?.response?.data || requestError,
              "Could not load attendance details"
            )
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [row]);

  const record = data?.record || null;
  const timezone = record?.timezone || data?.context?.timezone || row?.timezone || "Asia/Kolkata";

  return (
    <DashboardDrawer
      isOpen={Boolean(row)}
      onClose={onClose}
      titlePrefix="Attendance"
      titleSuffix={row ? displayDate(row.attendanceDate) : ""}
      subtitle={row ? `${row.employee.name} | ${row.employee.code}` : ""}
      maxW={{ base: "100%", lg: "720px" }}
      badgeContent={
        row ? (
          <Badge colorScheme={statusColor(row.status)} px={3} py={1.5} borderRadius="md">
            {titleCase(row.status)}
          </Badge>
        ) : undefined
      }
    >
      {loading ? (
        <Stack spacing={4}>
          <Skeleton h="90px" />
          <Skeleton h="180px" />
          <Skeleton h="160px" />
        </Stack>
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : data && row ? (
        <Stack spacing={6}>
          <HStack align="flex-start" spacing={4}>
            <Avatar name={data.employee.name} src={data.employee.picture || undefined} />
            <Box minW={0}>
              <Text fontWeight="800" fontSize="lg" overflowWrap="anywhere">
                {data.employee.name}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {[data.employee.code, data.employee.designation].filter(Boolean).join(" | ")}
              </Text>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {[data.organization.department, data.organization.team, data.organization.officeLocation]
                  .filter(Boolean)
                  .join(" | ") || "Organization assignment unavailable"}
              </Text>
            </Box>
          </HStack>

          {data.context?.missingPolicies?.length ? (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <AlertDescription>
                Missing setup: {data.context.missingPolicies.map(titleCase).join(", ")}.
              </AlertDescription>
            </Alert>
          ) : null}

          <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
            <Text fontSize="sm" fontWeight="800" mb={4}>
              Day and schedule
            </Text>
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
              <Field label="Day type" value={titleCase(data.context.dayType)} />
              <Field
                label="Shift"
                value={
                  data.context.schedule?.startTime && data.context.schedule?.endTime
                    ? `${data.context.schedule.startTime} - ${data.context.schedule.endTime}`
                    : "Not configured"
                }
              />
              <Field label="Expected" value={formatMinutes(data.context.expectedWorkMinutes)} />
              <Field label="Timezone" value={timezone} />
              <Field label="Manager" value={data.organization.manager} />
              <Field
                label="Work mode"
                value={titleCase(record?.workMode || row.workMode)}
              />
            </SimpleGrid>
            {data.context.holiday ? (
              <Alert status="info" borderRadius="md" mt={4}>
                <AlertIcon />
                <AlertDescription>
                  {data.context.holiday.name}
                  {data.context.holiday.isHalfDay ? " (half day)" : ""}
                </AlertDescription>
              </Alert>
            ) : null}
          </Box>

          <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
            <Text fontSize="sm" fontWeight="800" mb={4}>
              Punches and calculation
            </Text>
            {record ? (
              <Stack spacing={4}>
                {(record.punchSessions || []).length ? (
                  (record.punchSessions || []).map((session: any, index: number) => (
                    <Flex
                      key={session._id || index}
                      bg={panel}
                      borderRadius="md"
                      px={3}
                      py={3}
                      justify="space-between"
                      gap={4}
                      flexWrap="wrap"
                    >
                      <Field label="Punch in" value={formatTime(session.punchIn, timezone)} />
                      <Field label="Final punch out" value={formatTime(session.punchOut, timezone)} />
                      <Field label="Source" value={titleCase(session.source)} />
                    </Flex>
                  ))
                ) : (
                  <Text fontSize="sm" color="gray.500">
                    This attendance record has no punches.
                  </Text>
                )}
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                  <Field label="Worked" value={formatMinutes(record.workedMinutes)} />
                  <Field label="Break" value={formatMinutes(record.breakMinutes)} />
                  <Field label="Late" value={formatMinutes(record.lateMinutes)} />
                  <Field label="Early exit" value={formatMinutes(record.earlyExitMinutes)} />
                  <Field label="Overtime" value={formatMinutes(record.overtimeMinutes)} />
                  <Field label="Record state" value={titleCase(record.state)} />
                </SimpleGrid>
              </Stack>
            ) : (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  {row.status === "holiday"
                    ? "No punch record is required for this mandatory holiday."
                    : row.status === "weekly_off"
                      ? "No punch record is required for this weekly off."
                      : row.status === "leave"
                        ? "No punch record is expected because approved leave applies."
                        : "No attendance record exists. The day remains Not marked until attendance is processed or recorded."}
                </AlertDescription>
              </Alert>
            )}
          </Box>

          {data.leaveRequest || data.remoteWorkRequest ? (
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
              <Text fontSize="sm" fontWeight="800" mb={3}>
                Authorized request
              </Text>
              {data.leaveRequest ? (
                <Stack spacing={1}>
                  <Text fontWeight="700">
                    {data.leaveRequest.leaveTypeNameSnapshot || "Leave"}
                    {data.leaveRequest.leaveTypeCodeSnapshot
                      ? ` (${data.leaveRequest.leaveTypeCodeSnapshot})`
                      : ""}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Approved leave | {data.leaveRequest.fromDate} to {data.leaveRequest.toDate}
                  </Text>
                  {data.leaveRequest.reason ? (
                    <Text fontSize="sm" mt={2}>
                      {data.leaveRequest.reason}
                    </Text>
                  ) : null}
                </Stack>
              ) : null}
              {data.remoteWorkRequest ? (
                <Stack spacing={1} mt={data.leaveRequest ? 4 : 0}>
                  <Text fontWeight="700">Work from home</Text>
                  <Text fontSize="sm" color="gray.500">
                    Approved | {data.remoteWorkRequest.fromDate} to {data.remoteWorkRequest.toDate}
                  </Text>
                  {data.remoteWorkRequest.reason ? (
                    <Text fontSize="sm" mt={2}>
                      {data.remoteWorkRequest.reason}
                    </Text>
                  ) : null}
                </Stack>
              ) : null}
            </Box>
          ) : null}

          <Box borderWidth="1px" borderColor={border} borderRadius="md" px={4}>
            <Text fontSize="sm" fontWeight="800" pt={4} pb={2}>
              Configuration used
            </Text>
            <Stack spacing={0} divider={<Divider />}>
              <PolicyRow label="Attendance policy" value={data.policies.attendancePolicy} />
              <PolicyRow label="Work schedule" value={data.policies.workSchedule} />
              <PolicyRow label="Holiday calendar" value={data.policies.holidayCalendar} />
            </Stack>
          </Box>

          <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
            <Text fontSize="sm" fontWeight="800" mb={3}>
              Revision history
            </Text>
            {data.revisions?.length ? (
              <Stack spacing={3} divider={<Divider />}>
                {data.revisions.map((revision: any) => (
                  <Box key={revision._id} pb={3}>
                    <Flex justify="space-between" gap={3} flexWrap="wrap">
                      <Text fontSize="sm" fontWeight="700">
                        {titleCase(revision.action)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {new Intl.DateTimeFormat("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(revision.createdAt))}
                      </Text>
                    </Flex>
                    <Text fontSize="sm" mt={1}>
                      {revision.reason || "Attendance record updated"}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {revision.actor?.name || "System"} | Revision {revision.revisionNumber}
                    </Text>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Text fontSize="sm" color="gray.500">
                No revisions have been recorded.
              </Text>
            )}
          </Box>
        </Stack>
      ) : null}
    </DashboardDrawer>
  );
}
