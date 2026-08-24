"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  TodayAttendance,
  fetchTodayAttendance,
  punchIn,
  punchOut,
} from "./attendanceApi";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FiClock, FiLogIn, FiLogOut, FiRefreshCw } from "react-icons/fi";

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

const titleCase = (value: string) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatMinutes = (value: number) => {
  const minutes = Math.max(0, Number(value || 0));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));

const formatTime = (value: string | null | undefined, timezone: string) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: timezone,
      }).format(new Date(value))
    : "Not recorded";

async function browserLocation() {
  if (typeof navigator === "undefined" || !navigator.geolocation) return {};

  return new Promise<Record<string, number>>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve({}),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 }
    );
  });
}

type TodayPunchCardProps = {
  dashboard?: boolean;
  onAttendanceChanged?: () => void | Promise<void>;
  refreshKey?: number;
};

export default function TodayPunchCard({
  dashboard = false,
  onAttendanceChanged,
  refreshKey = 0,
}: TodayPunchCardProps) {
  const toast = useToast();
  const surface = useColorModeValue("white", "gray.800");
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const [today, setToday] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setToday(await fetchTodayAttendance());
    } catch (requestError: any) {
      setError(
        getApiErrorMessage(
          requestError?.response?.data || requestError,
          "Could not load today's attendance"
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const act = async (action: "in" | "out") => {
    setPunching(true);
    try {
      if (action === "in") {
        await punchIn(await browserLocation());
        toast({ title: "Punched in", status: "success" });
      } else {
        await punchOut();
        toast({ title: "Punched out", status: "success" });
      }

      await load();
      if (onAttendanceChanged) {
        void Promise.resolve(onAttendanceChanged()).catch(() => undefined);
      }
    } catch (requestError: any) {
      toast({
        title: getApiErrorMessage(
          requestError?.response?.data || requestError,
          `Could not punch ${action}`
        ),
        status: "error",
        duration: 5000,
      });
    } finally {
      setPunching(false);
    }
  };

  if (loading && !today) {
    return <Skeleton h="230px" borderRadius={dashboard ? "14px" : "md"} />;
  }

  if (!today) {
    return (
      <Alert status="error" borderRadius={dashboard ? "14px" : "md"}>
        <AlertIcon />
        <AlertDescription>{error || "Today's attendance is unavailable."}</AlertDescription>
        <Button ml="auto" size="sm" variant="outline" onClick={load} isLoading={loading}>
          Retry
        </Button>
      </Alert>
    );
  }

  const record = today.record || null;
  const activeSession = record?.punchSessions?.find(
    (session) => session.punchIn && !session.punchOut
  );
  const lastSession = record?.punchSessions?.[record.punchSessions.length - 1];

  return (
    <Stack spacing={3}>
      {error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Box
        bg={surface}
        borderWidth="1px"
        borderColor={border}
        borderRadius={dashboard ? "14px" : "md"}
        boxShadow={dashboard ? "0 10px 28px rgba(15, 23, 42, 0.06)" : undefined}
        overflow="hidden"
      >
        <Flex direction={{ base: "column", lg: "row" }}>
          <Stack flex="1" spacing={4} p={{ base: 4, md: dashboard ? 6 : 5 }}>
            <Flex justify="space-between" align="flex-start" gap={3}>
              <Box>
                <Text fontSize="xs" color={muted} fontWeight="700">
                  TODAY'S ATTENDANCE
                </Text>
                <Text mt={1} fontSize="xl" fontWeight="800">
                  {formatDate(today.attendanceDate)}
                </Text>
                <HStack mt={2} color={muted} fontSize="sm" flexWrap="wrap">
                  <Icon as={FiClock} />
                  <Text>
                    {today.context.schedule.startTime || "--:--"} to{" "}
                    {today.context.schedule.endTime || "--:--"}
                  </Text>
                  <Text>({today.timezone})</Text>
                </HStack>
              </Box>
              <HStack align="flex-start">
                <Badge
                  colorScheme={statusColor(
                    record?.status || today.context.defaultAttendanceStatus
                  )}
                  px={3}
                  py={1.5}
                  borderRadius="full"
                >
                  {titleCase(record?.status || today.context.defaultAttendanceStatus)}
                </Badge>
                <Button
                  size="xs"
                  variant="ghost"
                  aria-label="Refresh today's attendance"
                  title="Refresh today's attendance"
                  onClick={load}
                  isLoading={loading}
                >
                  <FiRefreshCw />
                </Button>
              </HStack>
            </Flex>

            {today.context.holiday ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  {today.context.holiday.name}
                  {today.context.holiday.isHalfDay ? " (half day)" : ""}
                </AlertDescription>
              </Alert>
            ) : null}
            {today.remoteWorkAuthorization ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  Approved{" "}
                  {today.remoteWorkAuthorization.portion === "full"
                    ? "WFH"
                    : "half-day WFH"}{" "}
                  applies today. Punch in normally; attendance will use{" "}
                  {today.remoteWorkAuthorization.workMode} work mode.
                </AlertDescription>
              </Alert>
            ) : null}
            {today.context.missingPolicies.length ? (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  Attendance setup is incomplete:{" "}
                  {today.context.missingPolicies.map(titleCase).join(", ")}.
                </AlertDescription>
              </Alert>
            ) : null}

            <HStack spacing={5} flexWrap="wrap" fontSize="sm">
              <Box>
                <Text color={muted} fontSize="xs">Work mode</Text>
                <Text fontWeight="700">
                  {titleCase(
                    record?.workMode ||
                      today.remoteWorkAuthorization?.workMode ||
                      "office"
                  )}
                </Text>
              </Box>
              <Box>
                <Text color={muted} fontSize="xs">Worked</Text>
                <Text fontWeight="700">{formatMinutes(record?.workedMinutes || 0)}</Text>
              </Box>
              <Box>
                <Text color={muted} fontSize="xs">Expected</Text>
                <Text fontWeight="700">
                  {formatMinutes(today.context.expectedWorkMinutes || 0)}
                </Text>
              </Box>
              <Box>
                <Text color={muted} fontSize="xs">Sessions</Text>
                <Text fontWeight="700">{record?.punchSessions?.length || 0}</Text>
              </Box>
            </HStack>
          </Stack>

          <Stack
            minW={{ lg: dashboard ? "285px" : "340px" }}
            justify="center"
            align="center"
            p={{ base: 5, md: dashboard ? 6 : 7 }}
            borderTopWidth={{ base: "1px", lg: 0 }}
            borderLeftWidth={{ base: 0, lg: "1px" }}
            borderColor={border}
            bg={pageBg}
          >
            <Box textAlign="center">
              <Text fontSize="xs" color={muted}>
                {activeSession
                  ? "Punched in at"
                  : record?.punchSessions?.length
                    ? "Last punch-out"
                    : "Not punched in"}
              </Text>
              <Text mt={1} fontSize="xl" fontWeight="800">
                {activeSession
                  ? formatTime(activeSession.punchIn, record?.timezone || today.timezone)
                  : formatTime(lastSession?.punchOut, record?.timezone || today.timezone)}
              </Text>
              {record && record.attendanceDate !== today.attendanceDate ? (
                <Text mt={1} color={muted} fontSize="xs">
                  Open session from {formatDate(record.attendanceDate)}
                </Text>
              ) : null}
            </Box>
            {today.actions.canPunchOut ? (
              <Button
                colorScheme="red"
                size="lg"
                minW="190px"
                leftIcon={<FiLogOut />}
                onClick={() => act("out")}
                isLoading={punching}
              >
                Punch out
              </Button>
            ) : (
              <Button
                colorScheme="blue"
                size="lg"
                minW="190px"
                leftIcon={<FiLogIn />}
                onClick={() => act("in")}
                isLoading={punching}
                isDisabled={!today.actions.canPunchIn}
              >
                Punch in
              </Button>
            )}
            {!today.actions.canPunchIn && !today.actions.canPunchOut ? (
              <Text color={muted} fontSize="xs" textAlign="center">
                Punching is unavailable for this attendance day.
              </Text>
            ) : null}
          </Stack>
        </Flex>
      </Box>
    </Stack>
  );
}
