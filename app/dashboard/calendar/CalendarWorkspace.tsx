"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import stores from "@/app/store/stores";
import { Alert, AlertDescription, AlertIcon, Badge, Box, Button, ButtonGroup, Checkbox, Flex, FormControl, FormLabel, Heading, HStack, IconButton, Input, Select, SimpleGrid, Skeleton, Stack, Text, Tooltip, useBreakpointValue, useColorModeValue } from "@chakra-ui/react";
import { addDays, addMonths, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { observer } from "mobx-react-lite";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import { FiChevronLeft, FiChevronRight, FiFilter, FiPlus, FiRefreshCw } from "react-icons/fi";
import CalendarDayDrawer, { displayDate } from "./CalendarDayDrawer";
import { CalendarCategory, CalendarDay, CalendarOptions, CalendarScope, PlannerCategory, fetchCalendarEmployees, fetchCalendarOptions, fetchCalendarSummary } from "./calendarApi";
import { getTimesheetPlanner, TimesheetPlanner } from "./timesheetApi";
import { formatMinutes, timesheetColors, timesheetLabels } from "./timesheetUi.utils";
import "./calendar.css";

const CalendarGrid = dynamic(() => import("./CalendarGrid"), { ssr: false, loading: () => <Skeleton h="560px" /> });
const scopeLabel: Record<CalendarScope, string> = { mine: "My planner", reportees: "Direct Reportees", organization: "Organization" };
const emptyOptions: CalendarOptions = { scopes: ["mine"], departments: [], locations: [] };
const today = () => format(new Date(), "yyyy-MM-dd");

function CalendarWorkspace() {
  const workDate = useSearchParams().get("workDate");
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const mobile = useBreakpointValue({ base: true, md: false });
  const [anchor, setAnchor] = useState(today);
  const [mode, setMode] = useState<"month" | "week" | "agenda">("month");
  const [scope, setScope] = useState<CalendarScope>("mine");
  const [options, setOptions] = useState<CalendarOptions>(emptyOptions);
  const [departmentId, setDepartmentId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [officeLocationId, setOfficeLocationId] = useState("");
  const [employee, setEmployee] = useState<{ value: string; label: string } | null>(null);
  const [category, setCategory] = useState<PlannerCategory>("all");
  const [includePending, setIncludePending] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [diagnostics, setDiagnostics] = useState({ currentAssignmentFallbackEmployees: 0, missingHistoryEmployees: 0 });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayCategory, setDayCategory] = useState<CalendarCategory>("all");
  const [initialPane, setInitialPane] = useState<"details" | "timesheet">("details");
  const [planner, setPlanner] = useState<{ key: string; data: TimesheetPlanner | null; error: string; loading: boolean }>({ key: "", data: null, error: "", loading: false });
  const resolvedAnchor = useRef(false), userNavigated = useRef(false);
  useEffect(() => {
    const date = workDate;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date) {
      resolvedAnchor.current = true; userNavigated.current = true; setScope("mine"); setDepartmentId(""); setTeamId(""); setOfficeLocationId(""); setEmployee(null); setAnchor(date); setSelectedDate(date); setInitialPane("timesheet");
    }
  }, [workDate]);
  const [revision, setRevision] = useState(0);
  const ready = stores.auth.sessionReady && Boolean(stores.auth.user);
  const role = String(stores.auth.user?.role || "").toLowerCase();
  const range = useMemo(() => {
    const date = parseISO(anchor);
    const from = mode === "week" ? startOfWeek(date, { weekStartsOn: 1 }) : startOfMonth(date);
    const to = mode === "week" ? endOfWeek(date, { weekStartsOn: 1 }) : endOfMonth(date);
    return { fromDate: format(from, "yyyy-MM-dd"), toDate: format(to, "yyyy-MM-dd") };
  }, [anchor, mode]);
  const params = useMemo(() => ({ scope, departmentId: departmentId || undefined, teamId: teamId || undefined, officeLocationId: officeLocationId || undefined, employeeId: employee?.value, includePending: String(includePending) }), [scope, departmentId, teamId, officeLocationId, employee, includePending]);
  const plannerKey = `${stores.auth.user?._id}:${scope}:${range.fromDate}:${range.toDate}:${revision}`;
  const ownPlanner = scope === "mine" && planner.key === plannerKey ? planner.data : null;
  const plannerLoading = scope === "mine" && (planner.key !== plannerKey || planner.loading);
  const plannerError = scope === "mine" && planner.key === plannerKey ? planner.error : "";
  const timesheetDays = useMemo(() => new Map(ownPlanner?.data.map((day) => [day.attendanceDate, day]) || []), [ownPlanner]);
  useEffect(() => {
    if (!ready || role === "superadmin") return;
    const controller = new AbortController();
    fetchCalendarOptions(range, controller.signal).then((data) => { if (!controller.signal.aborted) setOptions(data); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Could not load calendar access")); });
    return () => controller.abort();
  }, [range, ready, role]);
  useEffect(() => {
    if (!ready || role === "superadmin") return;
    const controller = new AbortController();
    setLoading(true); setError(""); setDays([]);
    fetchCalendarSummary({ ...range, ...params }, controller.signal).then((data) => { if (!controller.signal.aborted) { setDays(data.days); setDiagnostics(data.diagnostics); } })
      .catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Could not load calendar")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [range, params, revision, ready, role]);
  useEffect(() => {
    if (!ready || role === "superadmin" || scope !== "mine") return;
    const controller = new AbortController(); setPlanner({ key: plannerKey, data: null, error: "", loading: true });
    getTimesheetPlanner(range.fromDate, range.toDate, controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setPlanner({ key: plannerKey, data, error: "", loading: false });
      if (!resolvedAnchor.current) { resolvedAnchor.current = true; if (!userNavigated.current) setAnchor(data.today); }
    }).catch((err) => { if (!controller.signal.aborted) setPlanner({ key: plannerKey, data: null, error: getApiErrorMessage(err?.response?.data || err, "Could not load timesheets"), loading: false }); });
    return () => controller.abort();
  }, [plannerKey, ready, role, scope, range]);
  const onDay = useCallback((date: string, nextCategory?: PlannerCategory) => { const selected = nextCategory || category; setDayCategory(selected === "timesheet" ? "all" : selected); setInitialPane(selected === "timesheet" ? "timesheet" : "details"); setSelectedDate(date); }, [category]);
  const changeScope = (value: CalendarScope) => { setScope(value); setDepartmentId(""); setTeamId(""); setOfficeLocationId(""); setEmployee(null); setSelectedDate(null); if (category === "timesheet") setCategory("all"); };
  const navigate = (direction: number) => { userNavigated.current = true; setAnchor(format(mode === "week" ? addDays(parseISO(anchor), direction * 7) : addMonths(parseISO(anchor), direction), "yyyy-MM-dd")); };
  const loadEmployees = async (search: string) => {
    try {
      const employees = await fetchCalendarEmployees({ ...params, employeeId: undefined, date: anchor, search });
      setLookupError("");
      return employees.map((item) => ({ value: item.id, label: `${item.name}${item.code ? ` (${item.code})` : ""}` }));
    } catch (err: any) { setLookupError(getApiErrorMessage(err?.response?.data || err, "Employee search unavailable")); return []; }
  };
  const teams = departmentId ? options.departments.find((item) => item.id === departmentId)?.teams || [] : options.departments.flatMap((item) => item.teams.map((team) => ({ ...team, name: `${item.name} / ${team.name}` })));
  const agenda = mode === "agenda" || mobile;
  const shownDays = days.filter((day) => (mode === "week" || day.date >= format(startOfMonth(parseISO(anchor)), "yyyy-MM-dd") && day.date <= format(endOfMonth(parseISO(anchor)), "yyyy-MM-dd")) && ((scope === "mine" && (category === "all" || category === "timesheet")) || (category === "all" && (day.onLeave || day.wfh || day.pendingLeave || day.pendingWfh || day.weeklyOff || day.holidays.length)) ||
    (category === "leave" && (day.onLeave || day.pendingLeave)) || (category === "wfh" && (day.wfh || day.pendingWfh)) || (category === "holiday" && day.holidays.length) || (category === "weekly_off" && day.weeklyOff)));
  if (role === "superadmin") return <Box p={6}><Alert status="info"><AlertIcon />Calendar is available in company accounts.</Alert></Box>;
  return <Box p={{ base: 3, md: 6 }} minW={0} className="workforce-calendar">
    <Stack spacing={5} maxW="1600px" mx="auto">
      <Flex justify="space-between" align="center" gap={3} flexWrap="wrap"><Heading size="lg">Planner</Heading><HStack>
        <Tooltip label="Refresh planner"><IconButton size={mobile ? "sm" : "md"} aria-label="Refresh planner" icon={<FiRefreshCw />} variant="outline" isLoading={loading || plannerLoading} onClick={() => setRevision((value) => value + 1)} /></Tooltip>
        {scope === "mine" ? <Button size={mobile ? "sm" : "md"} as={Link} href={`/dashboard/requests?applyDate=${anchor}`} colorScheme="blue" leftIcon={<FiPlus />}>New request</Button> : null}
      </HStack></Flex>
      {scope === "mine" ? <SimpleGrid columns={3} spacing={3} borderBottomWidth="1px" borderColor={border} pb={4}>{[
        ["Today logged", ownPlanner?.totals.todayMinutes], ["This week logged", ownPlanner?.totals.weekMinutes], ["This month logged", ownPlanner?.totals.monthMinutes],
      ].map(([label, minutes]) => <Box key={label as string} minW={0}><Text fontSize="xs" color={muted}>{label}</Text><Text fontSize="xl" fontWeight="700" data-testid={String(label).startsWith("Today") ? "planner-today-total" : String(label).startsWith("This week") ? "planner-week-total" : "planner-month-total"}>{plannerLoading ? "--:--" : formatMinutes(minutes as number | undefined)}</Text></Box>)}</SimpleGrid> : null}
      <Flex align="end" gap={3} flexWrap="wrap">
        <FormControl w={mobile && scope !== "mine" ? "calc(100% - 100px)" : { base: "100%", sm: "200px" }} minW={0}><FormLabel fontSize="sm">Calendar view</FormLabel><Select aria-label="Calendar scope" value={scope} onChange={(event) => changeScope(event.target.value as CalendarScope)}>{options.scopes.map((value) => <option key={value} value={value}>{scopeLabel[value]}</option>)}</Select></FormControl>
        {mobile && scope !== "mine" && <Button variant="outline" leftIcon={<FiFilter />} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}>Filters{[departmentId, teamId, officeLocationId, employee?.value].filter(Boolean).length ? ` (${[departmentId, teamId, officeLocationId, employee?.value].filter(Boolean).length})` : ""}</Button>}
        {scope !== "mine" && (!mobile || filtersOpen) && <>
          <FormControl w={{ base: "100%", sm: "190px" }}><FormLabel fontSize="sm">Department</FormLabel><Select aria-label="Calendar department" value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); setTeamId(""); setEmployee(null); }}><option value="">All departments</option>{options.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></FormControl>
          <FormControl w={{ base: "100%", sm: "190px" }}><FormLabel fontSize="sm">Team</FormLabel><Select aria-label="Calendar team" value={teamId} onChange={(event) => { setTeamId(event.target.value); setEmployee(null); }}><option value="">All teams</option>{teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></FormControl>
          <FormControl w={{ base: "100%", sm: "190px" }}><FormLabel fontSize="sm">Location</FormLabel><Select aria-label="Calendar location" value={officeLocationId} onChange={(event) => { setOfficeLocationId(event.target.value); setEmployee(null); }}><option value="">All locations</option>{options.locations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></FormControl>
          <FormControl flex="1" minW={{ base: 0, sm: "240px" }}><FormLabel fontSize="sm">Employee</FormLabel><AsyncSelect key={`${scope}:${departmentId}:${teamId}:${officeLocationId}:${anchor}`} inputId="calendar-employee" aria-label="Calendar employee" isClearable defaultOptions loadOptions={loadEmployees} value={employee} onChange={(value) => setEmployee(value)} placeholder="Search employees" styles={{ control: (base) => ({ ...base, minHeight: 40, backgroundColor: surface === "white" ? "white" : "#1A202C", borderColor: border === "gray.200" ? "#E2E8F0" : "#4A5568" }), menu: (base) => ({ ...base, zIndex: 20 }), input: (base) => ({ ...base, color: "inherit" }), singleValue: (base) => ({ ...base, color: "inherit" }) }} /></FormControl>
        </>}
      </Flex>
      <Flex justify="space-between" gap={3} align="center" flexWrap="wrap">
        <HStack flexWrap="wrap"><Tooltip label="Previous period"><IconButton size="sm" aria-label="Previous calendar period" icon={<FiChevronLeft />} variant="outline" onClick={() => navigate(-1)} /></Tooltip><Button size="sm" variant="outline" onClick={() => { userNavigated.current = true; setAnchor(ownPlanner?.today || today()); }}>Today</Button><Tooltip label="Next period"><IconButton size="sm" aria-label="Next calendar period" icon={<FiChevronRight />} variant="outline" onClick={() => navigate(1)} /></Tooltip><Input aria-label="Calendar month" type="month" w="180px" size="sm" value={anchor.slice(0, 7)} onChange={(event) => { if (/^\d{4}-\d{2}$/.test(event.target.value)) { userNavigated.current = true; setAnchor(`${event.target.value}-01`); } }} /></HStack>
        <HStack flexWrap="wrap" gap={2}><Select aria-label="Calendar category" size="sm" w="165px" value={category} onChange={(event) => setCategory(event.target.value as PlannerCategory)}><option value="all">All items</option>{scope === "mine" ? <option value="timesheet">Timesheets</option> : null}<option value="leave">Leave</option><option value="wfh">Work from home</option><option value="holiday">Holidays</option><option value="weekly_off">Weekly offs</option></Select>
          <Checkbox id="calendar-include-pending" isChecked={includePending} onChange={(event) => setIncludePending(event.target.checked)}>Pending</Checkbox>
          {!mobile && <ButtonGroup size="sm" isAttached variant="outline">{(["month", "week", "agenda"] as const).map((value) => <Button key={value} aria-pressed={mode === value} bg={mode === value ? "blue.50" : undefined} color={mode === value ? "blue.700" : undefined} onClick={() => setMode(value)}>{value.charAt(0).toUpperCase() + value.slice(1)}</Button>)}</ButtonGroup>}
        </HStack>
      </Flex>
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}><Text fontWeight="700">{mode === "week" ? `${displayDate(range.fromDate)} - ${displayDate(range.toDate)}` : format(parseISO(anchor), "MMMM yyyy")}</Text><HStack spacing={4} color={muted} fontSize="xs" flexWrap="wrap"><Text><Box as="span" display="inline-block" boxSize="8px" bg="blue.500" mr={1} />Leave</Text><Text><Box as="span" display="inline-block" boxSize="8px" bg="teal.500" mr={1} />WFH</Text><Text><Box as="span" display="inline-block" boxSize="8px" bg="pink.500" mr={1} />Holiday</Text><Text><Box as="span" display="inline-block" boxSize="8px" bg="gray.400" mr={1} />Weekly off</Text></HStack></Flex>
      {error && <Alert status="error"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert>}
      {plannerError && <Alert status="error"><AlertIcon /><AlertDescription>{plannerError}</AlertDescription><Button ml="auto" size="sm" onClick={() => setRevision((r) => r + 1)}>Retry</Button></Alert>}
      {scope === "mine" ? <HStack fontSize="xs" color={muted} flexWrap="wrap" spacing={3} aria-label="Timesheet legend"><Text>Timesheet:</Text><Badge colorScheme="blue">Draft</Badge><Badge colorScheme="red">Missing</Badge><Badge colorScheme="orange">Short hours</Badge><Badge>Not required</Badge></HStack> : null}
      {lookupError && scope !== "mine" && <Alert status="error"><AlertIcon /><AlertDescription>{lookupError}</AlertDescription></Alert>}
      {!loading && (diagnostics.currentAssignmentFallbackEmployees > 0 || diagnostics.missingHistoryEmployees > 0) && <Alert status="warning"><AlertIcon /><AlertDescription fontSize="sm">Historical assignment data is incomplete for {diagnostics.currentAssignmentFallbackEmployees + diagnostics.missingHistoryEmployees} employees in this view.</AlertDescription></Alert>}
      {loading || plannerLoading ? <Skeleton h={{ base: "400px", md: "650px" }} /> : !error && (agenda ? <Stack spacing={0} divider={<Box borderBottomWidth="1px" />}>
        {shownDays.length ? shownDays.map((day) => <Flex key={day.date} as="button" aria-label={`Open planner day ${day.date}`} textAlign="left" w="full" py={4} gap={4} align="start" onClick={() => onDay(day.date)} _hover={{ bg: "blue.50" }} borderRadius="sm">
          <Box w="85px" flexShrink={0}><Text fontWeight="700">{format(parseISO(day.date), "EEE, d")}</Text><Text fontSize="xs" color={muted}>{format(parseISO(day.date), "MMM yyyy")}</Text></Box>
          <HStack flexWrap="wrap" gap={2} minW={0}>
            {scope === "mine" && (category === "all" || category === "timesheet") && timesheetDays.get(day.date) ? <Badge colorScheme={timesheetColors[timesheetDays.get(day.date)!.state]} textTransform="none">{timesheetLabels[timesheetDays.get(day.date)!.state]} | {formatMinutes(timesheetDays.get(day.date)!.loggedMinutes)}{timesheetDays.get(day.date)!.shortHours ? " | Short hours" : ""}{timesheetDays.get(day.date)!.hrExemption ? " | HR exemption" : ""}</Badge> : null}
            {(category === "all" || category === "leave") && day.onLeave > 0 && <Badge colorScheme="blue">{day.onLeave} on leave</Badge>}
            {(category === "all" || category === "wfh") && day.wfh > 0 && <Badge colorScheme="teal">{day.wfh} WFH</Badge>}
            {(category === "all" || category === "leave") && day.pendingLeave > 0 && <Badge colorScheme="yellow">{day.pendingLeave} pending leave</Badge>}
            {(category === "all" || category === "wfh") && day.pendingWfh > 0 && <Badge colorScheme="yellow">{day.pendingWfh} pending WFH</Badge>}
            {(category === "all" || category === "holiday") && day.holidays.map((holiday) => <Text key={`${holiday.name}:${holiday.type}:${holiday.isHalfDay}`} fontSize="sm" color="pink.600">{holiday.name}{holiday.type === "optional" ? " (optional)" : ""}{holiday.isHalfDay ? " (half day)" : ""}</Text>)}
            {(category === "all" || category === "weekly_off") && day.weeklyOff > 0 && <Badge>{day.weeklyOff} weekly off</Badge>}
          </HStack>
        </Flex>) : <Text py={12} textAlign="center" color={muted}>No calendar items in this period.</Text>}
      </Stack> : <Box bg={surface} minW={0}><CalendarGrid anchor={anchor} mode={mode === "week" ? "week" : "month"} days={days} category={category} timesheets={scope === "mine" ? timesheetDays : undefined} onDay={onDay} /></Box>)}
    </Stack>
    <CalendarDayDrawer date={selectedDate} initialCategory={dayCategory} initialPane={initialPane} params={params} canApplyForSelf={scope === "mine"} onClose={() => setSelectedDate(null)} onChanged={() => setRevision((value) => value + 1)} />
  </Box>;
}
export default observer(CalendarWorkspace);
export function CalendarLoading() { return <Box p={6}><Skeleton h="650px" /></Box>; }
