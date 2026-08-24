"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  AttendanceRecord,
  TodayAttendance,
  fetchMyAttendance,
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
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCalendar, FiClock, FiLogIn, FiLogOut, FiMapPin, FiRefreshCw } from "react-icons/fi";

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

function monthRange(value: Date) {
  const year = value.getFullYear();
  const month = value.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const key = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { from: key(1), to: key(lastDay) };
}

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

function Metric({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  return (
    <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
      <Text fontSize="xs" color={muted} fontWeight="700">{label}</Text>
      <Text mt={1} fontSize="2xl" fontWeight="800">{value}</Text>
      {helper ? <Text mt={1} fontSize="xs" color={muted}>{helper}</Text> : null}
    </Box>
  );
}

export default function MyAttendanceWorkspace() {
  const toast = useToast();
  const surface = useColorModeValue("white", "gray.800");
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const [today, setToday] = useState<TodayAttendance | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(() => new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const range = monthRange(month);
      const [todayData, history] = await Promise.all([
        fetchTodayAttendance(),
        fetchMyAttendance({ ...range, page: 1, limit: 100 }),
      ]);
      setToday(todayData);
      setRecords(history.items || []);
    } catch (requestError: any) {
      setError(getApiErrorMessage(requestError?.response?.data || requestError, "Could not load attendance"));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const record = today?.record || null;
  const activeSession = record?.punchSessions?.find((session) => session.punchIn && !session.punchOut);
  const summary = useMemo(() => ({
    recordedDays: records.length,
    presentDays: records.filter((item) => item.status === "present").length,
    workedMinutes: records.reduce((total, item) => total + Number(item.workedMinutes || 0), 0),
    lateDays: records.filter((item) => item.isLate).length,
  }), [records]);

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
    } catch (requestError: any) {
      toast({
        title: getApiErrorMessage(requestError?.response?.data || requestError, `Could not punch ${action}`),
        status: "error",
        duration: 5000,
      });
    } finally {
      setPunching(false);
    }
  };

  const moveMonth = (offset: number) =>
    setMonth((value) => new Date(value.getFullYear(), value.getMonth() + offset, 1));

  return (
    <Box minH="100dvh" bg={pageBg} px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
      <Stack maxW="1400px" mx="auto" spacing={5}>
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap={3}>
          <Box>
            <Heading size="lg">My attendance</Heading>
            <Text mt={1} color={muted} fontSize="sm">Punch sessions and calculated daily attendance.</Text>
          </Box>
          <Button variant="outline" leftIcon={<FiRefreshCw />} onClick={load} isLoading={loading}>Refresh</Button>
        </Flex>

        {error ? <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert> : null}

        {loading && !today ? (
          <Skeleton h="230px" borderRadius="md" />
        ) : today ? (
          <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
            <Flex direction={{ base: "column", lg: "row" }}>
              <Stack flex="1" spacing={4} p={{ base: 4, md: 5 }}>
                <Flex justify="space-between" align="flex-start" gap={3}>
                  <Box>
                    <Text fontSize="xs" color={muted} fontWeight="700">TODAY</Text>
                    <Text mt={1} fontSize="xl" fontWeight="800">{formatDate(today.attendanceDate)}</Text>
                    <HStack mt={2} color={muted} fontSize="sm" flexWrap="wrap">
                      <Icon as={FiClock} />
                      <Text>{today.context.schedule.startTime || "--:--"} to {today.context.schedule.endTime || "--:--"}</Text>
                      <Text>({today.timezone})</Text>
                    </HStack>
                  </Box>
                  <Badge colorScheme={statusColor(record?.status || today.context.defaultAttendanceStatus)} px={3} py={1.5} borderRadius="full">
                    {titleCase(record?.status || today.context.defaultAttendanceStatus)}
                  </Badge>
                </Flex>

                {today.context.holiday ? (
                  <Alert status="info" borderRadius="md"><AlertIcon /><AlertDescription>{today.context.holiday.name}{today.context.holiday.isHalfDay ? " (half day)" : ""}</AlertDescription></Alert>
                ) : null}
                {today.context.missingPolicies.length ? (
                  <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>Attendance setup is incomplete: {today.context.missingPolicies.map(titleCase).join(", ")}.</AlertDescription></Alert>
                ) : null}

                <HStack spacing={5} flexWrap="wrap" fontSize="sm">
                  <Box><Text color={muted} fontSize="xs">Work mode</Text><Text fontWeight="700">{titleCase(record?.workMode || "office")}</Text></Box>
                  <Box><Text color={muted} fontSize="xs">Worked</Text><Text fontWeight="700">{formatMinutes(record?.workedMinutes || 0)}</Text></Box>
                  <Box><Text color={muted} fontSize="xs">Expected</Text><Text fontWeight="700">{formatMinutes(today.context.expectedWorkMinutes || 0)}</Text></Box>
                  <Box><Text color={muted} fontSize="xs">Sessions</Text><Text fontWeight="700">{record?.punchSessions?.length || 0}</Text></Box>
                </HStack>
              </Stack>

              <Stack minW={{ lg: "340px" }} justify="center" align="center" p={{ base: 5, md: 7 }} borderTopWidth={{ base: "1px", lg: 0 }} borderLeftWidth={{ base: 0, lg: "1px" }} borderColor={border} bg={pageBg}>
                <Box textAlign="center">
                  <Text fontSize="xs" color={muted}>{activeSession ? "Punched in at" : record?.punchSessions?.length ? "Last punch-out" : "Not punched in"}</Text>
                  <Text mt={1} fontSize="xl" fontWeight="800">
                    {activeSession
                      ? formatTime(activeSession.punchIn, record?.timezone || today.timezone)
                      : formatTime(record?.punchSessions?.[record.punchSessions.length - 1]?.punchOut, record?.timezone || today.timezone)}
                  </Text>
                  {record && record.attendanceDate !== today.attendanceDate ? <Text mt={1} color={muted} fontSize="xs">Open session from {formatDate(record.attendanceDate)}</Text> : null}
                </Box>
                {today.actions.canPunchOut ? (
                  <Button colorScheme="red" size="lg" minW="190px" leftIcon={<FiLogOut />} onClick={() => act("out")} isLoading={punching}>Punch out</Button>
                ) : (
                  <Button colorScheme="blue" size="lg" minW="190px" leftIcon={<FiLogIn />} onClick={() => act("in")} isLoading={punching} isDisabled={!today.actions.canPunchIn}>Punch in</Button>
                )}
                {!today.actions.canPunchIn && !today.actions.canPunchOut ? <Text color={muted} fontSize="xs" textAlign="center">Punching is unavailable for this attendance day.</Text> : null}
              </Stack>
            </Flex>
          </Box>
        ) : null}

        <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3}>
          <Metric label="RECORDED DAYS" value={summary.recordedDays} helper="Days with attendance activity" />
          <Metric label="PRESENT DAYS" value={summary.presentDays} helper="Calculated as full day" />
          <Metric label="WORKED TIME" value={formatMinutes(summary.workedMinutes)} helper="For selected month" />
          <Metric label="LATE ARRIVALS" value={summary.lateDays} helper="After policy grace" />
        </SimpleGrid>

        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          <Flex p={4} justify="space-between" align="center" gap={3} borderBottomWidth="1px" borderColor={border}>
            <HStack>
              <Icon as={FiCalendar} color="blue.500" />
              <Text fontWeight="800">{new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(month)}</Text>
            </HStack>
            <HStack><Button size="sm" variant="outline" onClick={() => moveMonth(-1)}>Previous</Button><Button size="sm" variant="outline" onClick={() => moveMonth(1)}>Next</Button></HStack>
          </Flex>
          {loading ? (
            <Stack p={4}><Skeleton h="72px" /><Skeleton h="72px" /><Skeleton h="72px" /></Stack>
          ) : records.length === 0 ? (
            <Box py={14} textAlign="center"><Icon as={FiClock} boxSize={6} color={muted} /><Text mt={2} color={muted}>No attendance records for this month.</Text></Box>
          ) : (
            <Stack spacing={0}>
              {records.map((item, index) => (
                <Flex key={item._id} direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap={3} px={4} py={3.5} borderBottomWidth={index === records.length - 1 ? 0 : "1px"} borderColor={border}>
                  <HStack minW={{ md: "220px" }}>
                    <Box boxSize="38px" display="grid" placeItems="center" borderRadius="md" bg={pageBg}><FiCalendar /></Box>
                    <Box><Text fontWeight="700">{formatDate(item.attendanceDate)}</Text><Text fontSize="xs" color={muted}>{titleCase(item.workMode)} work</Text></Box>
                  </HStack>
                  <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={{ base: 3, md: 8 }} flex="1">
                    <Box><Text fontSize="xs" color={muted}>First in</Text><Text fontSize="sm" fontWeight="600">{formatTime(item.punchSessions?.[0]?.punchIn, item.timezone)}</Text></Box>
                    <Box><Text fontSize="xs" color={muted}>Last out</Text><Text fontSize="sm" fontWeight="600">{formatTime(item.punchSessions?.[item.punchSessions.length - 1]?.punchOut, item.timezone)}</Text></Box>
                    <Box><Text fontSize="xs" color={muted}>Worked</Text><Text fontSize="sm" fontWeight="600">{formatMinutes(item.workedMinutes)}</Text></Box>
                    <Box><Text fontSize="xs" color={muted}>Location</Text><HStack spacing={1}><FiMapPin /><Text fontSize="sm" fontWeight="600" noOfLines={1}>{item.officeLocationNameSnapshot || "Not assigned"}</Text></HStack></Box>
                  </SimpleGrid>
                  <Badge alignSelf={{ base: "flex-start", md: "center" }} colorScheme={statusColor(item.status)}>{titleCase(item.status)}</Badge>
                </Flex>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

