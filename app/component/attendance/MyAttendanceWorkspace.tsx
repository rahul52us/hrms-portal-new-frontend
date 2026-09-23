"use client";

import { PageBanner } from "@/app/component/common/PageBanner/PageBanner";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckSquare,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiEye,
  FiGrid,
  FiList,
  FiMapPin,
  FiRefreshCw,
} from "react-icons/fi";
import {
  AttendanceHistorySummary,
  AttendanceRecord,
  downloadMyAttendanceStatement,
  fetchMyAttendance,
} from "./attendanceApi";
import MyAttendanceDayDrawer from "./MyAttendanceDayDrawer";
import TodayPunchCard from "./TodayPunchCard";

const EMPTY_SUMMARY: AttendanceHistorySummary = {
  recordedDays: 0,
  presentDays: 0,
  halfDayDays: 0,
  absentDays: 0,
  incompleteDays: 0,
  leaveDays: 0,
  holidayDays: 0,
  weeklyOffDays: 0,
  workedMinutes: 0,
  lateDays: 0,
};

const STATUS_OPTIONS = [
  ["all", "All statuses"],
  ["pending", "Pending"],
  ["present", "Present"],
  ["half_day", "Half day"],
  ["absent", "Absent"],
  ["incomplete", "Incomplete"],
  ["leave", "Leave"],
  ["holiday", "Holiday"],
  ["weekly_off", "Weekly off"],
];

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
  return hours ? `${hours}h${remainder ? ` ${remainder}m` : ""}` : `${remainder}m`;
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
        hour12: true,
        timeZone: timezone,
      }).format(new Date(value))
    : "Not recorded";

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function localToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

function moveMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(year, monthNumber - 1 + offset, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function Metric({ label, value, helper, icon }: { label: string; value: string | number; helper: string; icon: any }) {
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue("blue.50", "blue.900");
  return (
    <HStack bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4} minW={0}>
      <Center bg={iconBg} color="blue.500" w={11} h={11} borderRadius="md" flexShrink={0}><Icon as={icon} boxSize={5} /></Center>
      <Box minW={0}>
        <Text fontSize="xs" color={muted} fontWeight="700" textTransform="uppercase">{label}</Text>
        <Text fontWeight="800" fontSize="xl" lineHeight="1.2">{value}</Text>
        <Text fontSize="xs" color={muted}>{helper}</Text>
      </Box>
    </HStack>
  );
}

export default function MyAttendanceWorkspace() {
  const surface = useColorModeValue("white", "gray.800");
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceHistorySummary>(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(currentMonthKey);
  const [attendanceDate, setAttendanceDate] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const range = useMemo(
    () => attendanceDate ? { from: attendanceDate, to: attendanceDate } : monthRange(month),
    [attendanceDate, month]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const history = await fetchMyAttendance({
        ...range,
        status,
        page: view === "calendar" ? 1 : page,
        limit: view === "calendar" ? 31 : 10,
      });
      setRecords(history.items || []);
      setSummary({ ...EMPTY_SUMMARY, ...(history.summary || {}) });
      setPagination(history.pagination);
    } catch (requestError: any) {
      setError(getApiErrorMessage(requestError?.response?.data || requestError, "Could not load attendance history"));
    } finally {
      setLoading(false);
    }
  }, [page, range, status, view]);

  useEffect(() => { void load(); }, [load, refreshKey]);

  const refreshAll = () => setRefreshKey((value) => value + 1);
  const chooseMonth = (value: string) => {
    if (!value) return;
    setMonth(value);
    setAttendanceDate("");
    setPage(1);
  };
  const chooseDate = (value: string) => {
    setAttendanceDate(value);
    if (value) setMonth(value.slice(0, 7));
    setPage(1);
  };
  const chooseStatus = (value: string) => {
    setStatus(value);
    setPage(1);
  };
  const chooseView = (value: "list" | "calendar") => {
    setView(value);
    setPage(1);
  };
  const changeMonth = (offset: number) => chooseMonth(moveMonth(month, offset));

  const download = async () => {
    setDownloading(true);
    setError("");
    try {
      await downloadMyAttendanceStatement(month);
    } catch (requestError: any) {
      setError(getApiErrorMessage(requestError?.response?.data || requestError, "Could not download attendance statement"));
    } finally {
      setDownloading(false);
    }
  };

  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
    new Date(`${month}-01T00:00:00`)
  );
  const calendarDays = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
    const totalDays = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const recordByDate = new Map(records.map((record) => [record.attendanceDate, record]));
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: totalDays }, (_, index) => {
        const date = `${month}-${String(index + 1).padStart(2, "0")}`;
        return { date, day: index + 1, record: recordByDate.get(date) || null };
      }),
    ];
  }, [month, records]);

  return (
    <Box minH="100dvh">
      <Stack maxW="1400px" mx="auto" spacing={5}>
        <PageBanner
          titlePrefix="MY"
          titleHighlight="ATTENDANCE"
          subtitle="PUNCHES AND MONTHLY HISTORY."
          icon={FiClock}
          statLabel={`${summary.presentDays} PRESENT DAYS`}
          statIcon={FiCalendar}
          showBackButton={false}
          colorScheme="blue"
        >
          <Button variant="outline" size="sm" borderRadius="md" leftIcon={<FiRefreshCw />} onClick={refreshAll} isLoading={loading}>Refresh</Button>
        </PageBanner>

        <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3}>
          <Metric icon={FiCalendar} label="Recorded" value={summary.recordedDays} helper="Days with a record" />
          <Metric icon={FiCheckSquare} label="Present" value={summary.presentDays} helper="Full attendance days" />
          <Metric icon={FiClock} label="Worked" value={formatMinutes(summary.workedMinutes)} helper="Selected period" />
          <Metric icon={FiAlertCircle} label="Exceptions" value={summary.lateDays + summary.incompleteDays + summary.absentDays} helper="Late, incomplete, or absent" />
        </SimpleGrid>

        {error ? <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert> : null}

        <TodayPunchCard refreshKey={refreshKey} onAttendanceChanged={refreshAll} />

        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          <Stack p={4} spacing={4} borderBottomWidth="1px" borderColor={border}>
            <Flex justify="space-between" align={{ base: "stretch", lg: "center" }} direction={{ base: "column", lg: "row" }} gap={3}>
              <HStack justify={{ base: "space-between", lg: "flex-start" }}>
                <Tooltip label="Previous month"><IconButton aria-label="Previous month" size="sm" variant="outline" icon={<FiChevronLeft />} onClick={() => changeMonth(-1)} /></Tooltip>
                <Text fontWeight="800" minW={{ md: "150px" }} textAlign="center">{monthLabel}</Text>
                <Tooltip label="Next month"><IconButton aria-label="Next month" size="sm" variant="outline" icon={<FiChevronRight />} onClick={() => changeMonth(1)} /></Tooltip>
              </HStack>
              <HStack flexWrap="wrap">
                <ButtonGroup isAttached size="sm" variant="outline">
                  <Button leftIcon={<FiList />} colorScheme={view === "list" ? "blue" : undefined} variant={view === "list" ? "solid" : "outline"} onClick={() => chooseView("list")}>List</Button>
                  <Button leftIcon={<FiGrid />} colorScheme={view === "calendar" ? "blue" : undefined} variant={view === "calendar" ? "solid" : "outline"} onClick={() => chooseView("calendar")}>Calendar</Button>
                </ButtonGroup>
                <Button size="sm" variant="outline" leftIcon={<FiDownload />} onClick={download} isLoading={downloading}>Download CSV</Button>
              </HStack>
            </Flex>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
              <Box><Text fontSize="xs" color={muted} mb={1}>Month</Text><Input type="month" size="sm" value={month} onChange={(event) => chooseMonth(event.target.value)} /></Box>
              <Box><Text fontSize="xs" color={muted} mb={1}>Specific date</Text><Input type="date" size="sm" value={attendanceDate} onChange={(event) => chooseDate(event.target.value)} /></Box>
              <Box><Text fontSize="xs" color={muted} mb={1}>Status</Text><Select size="sm" value={status} onChange={(event) => chooseStatus(event.target.value)}>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Box>
            </SimpleGrid>
          </Stack>

          {loading ? (
            <Stack p={4}><Skeleton h="72px" /><Skeleton h="72px" /><Skeleton h="72px" /></Stack>
          ) : view === "calendar" ? (
            <Box p={{ base: 2, md: 4 }} overflowX="auto">
              <SimpleGrid columns={7} spacing={1} minW="620px">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <Text key={day} py={2} textAlign="center" fontSize="xs" fontWeight="800" color={muted}>{day}</Text>)}
                {calendarDays.map((item, index) => {
                  if (!item) return <Box key={`blank-${index}`} minH="92px" />;
                  const canOpen = item.date <= localToday();
                  return (
                    <Box
                      as={canOpen ? "button" : "div"}
                      key={item.date}
                      minH="92px"
                      p={2}
                      textAlign="left"
                      borderWidth="1px"
                      borderColor={border}
                      borderRadius="md"
                      bg={item.record ? surface : pageBg}
                      cursor={canOpen ? "pointer" : "default"}
                      _hover={canOpen ? { borderColor: "blue.300", bg: hoverBg } : undefined}
                      onClick={() => {
                        if (!canOpen) return;
                        setSelectedDate(item.date);
                        setSelectedRecord(item.record);
                      }}
                    >
                      <Text fontSize="sm" fontWeight="800">{item.day}</Text>
                      {item.record ? (
                        <Stack mt={2} spacing={1}>
                          <Badge alignSelf="flex-start" colorScheme={statusColor(item.record.status)} fontSize="10px">{titleCase(item.record.status)}</Badge>
                          {item.record.regularization ? <Badge alignSelf="flex-start" colorScheme={item.record.regularization.status === "approved" ? "green" : item.record.regularization.status === "rejected" ? "red" : "orange"} fontSize="9px">Correction {titleCase(item.record.regularization.status)}</Badge> : null}
                          <Text fontSize="xs" color={muted}>{formatMinutes(item.record.workedMinutes)}</Text>
                        </Stack>
                      ) : canOpen ? <Text mt={2} fontSize="xs" color={muted}>Review day</Text> : null}
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>
          ) : records.length === 0 ? (
            <Box py={14} textAlign="center"><Icon as={FiClock} boxSize={6} color={muted} /><Text mt={2} fontWeight="700">No attendance records match these filters.</Text><Text fontSize="sm" color={muted}>Try another month, date, or status.</Text></Box>
          ) : (
            <Stack spacing={0}>
              {records.map((item, index) => (
                <Flex key={item._id} direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap={3} px={4} py={3.5} borderBottomWidth={index === records.length - 1 ? 0 : "1px"} borderColor={border} _hover={{ bg: hoverBg }}>
                  <HStack minW={{ md: "220px" }}>
                    <Center boxSize="38px" borderRadius="md" bg={pageBg}><FiCalendar /></Center>
                    <Box><Text fontWeight="700">{formatDate(item.attendanceDate)}</Text><Text fontSize="xs" color={muted}>{titleCase(item.workMode)} work</Text></Box>
                  </HStack>
                  <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={{ base: 3, md: 7 }} flex="1">
                    <Box><Text fontSize="xs" color={muted}>First in</Text><Text fontSize="sm" fontWeight="600">{formatTime(item.punchSessions?.[0]?.punchIn, item.timezone)}</Text></Box>
                    <Box><Text fontSize="xs" color={muted}>Final out</Text><Text fontSize="sm" fontWeight="600">{formatTime(item.punchSessions?.[item.punchSessions.length - 1]?.punchOut, item.timezone)}</Text></Box>
                    <Box><Text fontSize="xs" color={muted}>Worked</Text><Text fontSize="sm" fontWeight="600">{formatMinutes(item.workedMinutes)}</Text></Box>
                    <Box><Text fontSize="xs" color={muted}>Location</Text><HStack spacing={1}><FiMapPin /><Text fontSize="sm" fontWeight="600" noOfLines={1}>{item.officeLocationNameSnapshot || "Not assigned"}</Text></HStack></Box>
                  </SimpleGrid>
                  <HStack justify={{ base: "space-between", md: "flex-end" }} minW={{ md: "155px" }}>
                    <Badge colorScheme={statusColor(item.status)}>{titleCase(item.status)}</Badge>
                    {item.regularization ? <Badge colorScheme={item.regularization.status === "approved" ? "green" : item.regularization.status === "rejected" ? "red" : "orange"}>Correction {titleCase(item.regularization.status)}</Badge> : null}
                    <Tooltip label="View attendance details"><IconButton aria-label={`View attendance for ${item.attendanceDate}`} size="sm" variant="ghost" icon={<FiEye />} onClick={() => { setSelectedDate(item.attendanceDate); setSelectedRecord(item); }} /></Tooltip>
                  </HStack>
                </Flex>
              ))}
            </Stack>
          )}

          {view === "list" && pagination.total > 0 ? (
            <Flex p={4} borderTopWidth="1px" borderColor={border} justify="space-between" align="center" gap={3}>
              <Text fontSize="sm" color={muted}>Page {pagination.page} of {pagination.totalPages} | {pagination.total} records</Text>
              <HStack><Button size="sm" variant="outline" isDisabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button><Button size="sm" variant="outline" isDisabled={page >= pagination.totalPages} onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))}>Next</Button></HStack>
            </Flex>
          ) : null}
        </Box>
      </Stack>

      <MyAttendanceDayDrawer
        attendanceDate={selectedDate}
        record={selectedRecord}
        onClose={() => { setSelectedDate(null); setSelectedRecord(null); }}
      />
    </Box>
  );
}
