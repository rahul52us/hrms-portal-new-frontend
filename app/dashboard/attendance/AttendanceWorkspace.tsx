"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { hasPermission, PERMISSION_KEYS } from "@/app/config/utils/permissions";
import stores from "@/app/store/stores";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Collapse,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBreakpointValue,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFilter,
  FiEdit3,
  FiRefreshCw,
  FiSearch,
  FiUpload,
  FiUsers,
} from "react-icons/fi";
import AttendanceDayDrawer from "./AttendanceDayDrawer";
import AttendanceBulkActionDrawer from "./AttendanceBulkActionDrawer";
import AttendanceImportDrawer from "./AttendanceImportDrawer";
import {
  AttendanceOverviewOptions,
  AttendanceOverviewRow,
  AttendanceOverviewSummary,
  fetchAttendanceOverview,
  fetchAttendanceOverviewOptions,
} from "./attendanceAdminApi";

const EMPTY_SUMMARY: AttendanceOverviewSummary = {
  employees: 0,
  expected: 0,
  exceptions: 0,
  punchedIn: 0,
  present: 0,
  absent: 0,
  halfDay: 0,
  onLeave: 0,
  wfh: 0,
  holiday: 0,
  weeklyOff: 0,
  late: 0,
  incomplete: 0,
  pending: 0,
  notMarked: 0,
  unconfigured: 0,
};

const EMPTY_OPTIONS: AttendanceOverviewOptions = {
  departments: [],
  locations: [],
  managers: [],
  managersTruncated: false,
};

const emptyFilters = {
  search: "",
  departmentId: "",
  teamId: "",
  officeLocationId: "",
  managerId: "",
  status: "all",
  workMode: "all",
  exception: "all",
};

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const moveDate = (value: string, offset: number) => {
  const [year, month, day] = value.split("-").map(Number);
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + offset);
  return dateKey(next);
};

const displayDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));

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

const formatTime = (value: string | null | undefined, timezone: string) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: timezone || "Asia/Kolkata",
      }).format(new Date(value))
    : "-";

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

function Metric({
  label,
  value,
  helper,
  icon,
  color,
}: {
  label: string;
  value: number;
  helper: string;
  icon: any;
  color: string;
}) {
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  return (
    <HStack bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4} spacing={3}>
      <Flex boxSize="40px" borderRadius="md" bg={`${color}.50`} color={`${color}.600`} align="center" justify="center" flexShrink={0}>
        <Icon as={icon} boxSize={5} />
      </Flex>
      <Box minW={0}>
        <Text fontSize="xs" color="gray.500" fontWeight="700" noOfLines={1}>
          {label}
        </Text>
        <Text fontSize="xl" fontWeight="800" lineHeight="1.2">
          {value}
        </Text>
        <Text fontSize="xs" color="gray.500" noOfLines={1}>
          {helper}
        </Text>
      </Box>
    </HStack>
  );
}

function EmployeeIdentity({ row }: { row: AttendanceOverviewRow }) {
  return (
    <HStack align="flex-start" spacing={3} minW={0}>
      <Avatar size="sm" name={row.employee.name} src={row.employee.picture || undefined} />
      <Box minW={0}>
        <Text fontWeight="700" fontSize="sm" overflowWrap="anywhere">
          {row.employee.name}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {[row.employee.code, row.employee.designation].filter(Boolean).join(" | ")}
        </Text>
      </Box>
    </HStack>
  );
}

const AttendanceWorkspace = observer(function AttendanceWorkspace() {
  const canView = hasPermission(stores.auth.user, PERMISSION_KEYS.VIEW_ATTENDANCE);
  const canAdjust = hasPermission(stores.auth.user, PERMISSION_KEYS.ADJUST_ATTENDANCE);
  const canFinalize = hasPermission(stores.auth.user, PERMISSION_KEYS.FINALIZE_ATTENDANCE);
  const canReopen = hasPermission(stores.auth.user, PERMISSION_KEYS.REOPEN_ATTENDANCE);
  const canImport = hasPermission(stores.auth.user, PERMISSION_KEYS.IMPORT_ATTENDANCE);
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const rowHover = useColorModeValue("gray.50", "gray.700");
  const [attendanceDate, setAttendanceDate] = useState(() => dateKey(new Date()));
  const [filters, setFilters] = useState(emptyFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [items, setItems] = useState<AttendanceOverviewRow[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selectedRow, setSelectedRow] = useState<AttendanceOverviewRow | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const filterDisclosure = useDisclosure();
  const filtersVisible =
    useBreakpointValue({ base: filterDisclosure.isOpen, lg: true }) ?? false;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
    setSelectedEmployeeIds(new Set());
  }, [attendanceDate, debouncedSearch, filters.departmentId, filters.teamId, filters.officeLocationId, filters.managerId, filters.status, filters.workMode, filters.exception]);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();
    setOptionsLoading(true);
    fetchAttendanceOverviewOptions(attendanceDate, controller.signal)
      .then((result) => setOptions(result || EMPTY_OPTIONS))
      .catch(() => {
        if (!controller.signal.aborted) setOptions(EMPTY_OPTIONS);
      })
      .finally(() => {
        if (!controller.signal.aborted) setOptionsLoading(false);
      });
    return () => controller.abort();
  }, [attendanceDate, canView]);

  const params = useMemo(
    () => ({
      date: attendanceDate,
      page,
      limit: 25,
      search: debouncedSearch || undefined,
      departmentId: filters.departmentId || undefined,
      teamId: filters.teamId || undefined,
      officeLocationId: filters.officeLocationId || undefined,
      managerId: filters.managerId || undefined,
      status: filters.status,
      workMode: filters.workMode,
      exception: filters.exception,
    }),
    [attendanceDate, debouncedSearch, filters, page]
  );

  const load = useCallback(() => {
    if (!canView) return () => undefined;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchAttendanceOverview(params, controller.signal)
      .then((result) => {
        setSummary(result.summary || EMPTY_SUMMARY);
        setItems(result.items || []);
        setDiagnostics(result.diagnostics || {});
        setPagination(result.pagination);
      })
      .catch((requestError: any) => {
        if (!controller.signal.aborted) {
          setError(
            getApiErrorMessage(
              requestError?.response?.data || requestError,
              "Could not load organization attendance"
            )
          );
          setItems([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [canView, params]);

  useEffect(() => load(), [load, revision]);

  const selectedDepartment = options.departments.find(
    (department) => department.id === filters.departmentId
  );
  const hasFilters = Object.entries(filters).some(
    ([key, value]) =>
      value && !(["status", "workMode", "exception"].includes(key) && value === "all")
  );
  const historyWarnings =
    Number(diagnostics.currentAssignmentFallbackEmployees || 0) +
    Number(diagnostics.missingHistoryEmployees || 0);
  const selectedRows = items.filter((row) => selectedEmployeeIds.has(row.employee.id));
  const allPageSelected = Boolean(items.length) && selectedRows.length === items.length;

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  const togglePage = () => {
    setSelectedEmployeeIds(
      allPageSelected ? new Set() : new Set(items.map((row) => row.employee.id))
    );
  };

  const refresh = () => setRevision((value) => value + 1);

  const setFilter = (key: keyof typeof emptyFilters, value: string) =>
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "departmentId" ? { teamId: "" } : {}),
    }));

  const renderMobileRow = (row: AttendanceOverviewRow) => (
    <Box
      key={row.employee.id}
      borderBottomWidth="1px"
      borderColor={border}
      px={4}
      py={4}
      cursor="pointer"
      onClick={() => setSelectedRow(row)}
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <HStack align="flex-start">
          {(canAdjust || canFinalize || canReopen) ? (
            <Checkbox
              mt={2}
              isChecked={selectedEmployeeIds.has(row.employee.id)}
              onClick={(event) => event.stopPropagation()}
              onChange={() => toggleEmployee(row.employee.id)}
              aria-label={`Select ${row.employee.name}`}
            />
          ) : null}
          <EmployeeIdentity row={row} />
        </HStack>
        <Badge colorScheme={statusColor(row.status)}>{titleCase(row.status)}</Badge>
      </Flex>
      <SimpleGrid columns={2} spacing={3} mt={4}>
        <Box>
          <Text fontSize="xs" color={muted}>Organization</Text>
          <Text fontSize="sm" fontWeight="600">{[row.organization.department, row.organization.team].filter(Boolean).join(" | ") || "Not assigned"}</Text>
        </Box>
        <Box>
          <Text fontSize="xs" color={muted}>Shift</Text>
          <Text fontSize="sm" fontWeight="600">{row.schedule.startTime && row.schedule.endTime ? `${row.schedule.startTime} - ${row.schedule.endTime}` : "Not configured"}</Text>
        </Box>
        <Box>
          <Text fontSize="xs" color={muted}>Setup</Text>
          {row.setupGaps?.length ? (
            <Text fontSize="sm" fontWeight="600" color="red.500">Missing {row.setupGaps.map(titleCase).join(", ")}</Text>
          ) : (
            <Text fontSize="sm" fontWeight="600" color="green.600">Complete</Text>
          )}
        </Box>
        <Box>
          <Text fontSize="xs" color={muted}>First in / Final out</Text>
          <Text fontSize="sm" fontWeight="600">{formatTime(row.firstIn, row.timezone)} / {formatTime(row.lastOut, row.timezone)}</Text>
        </Box>
        <Box>
          <Text fontSize="xs" color={muted}>Worked</Text>
          <Text fontSize="sm" fontWeight="600">{formatMinutes(row.workedMinutes)} | {titleCase(row.workMode)}</Text>
        </Box>
      </SimpleGrid>
    </Box>
  );

  return (
    <PermissionGate
      allowed={canView}
      title="Attendance access required"
      description="Your role does not have permission to view organization attendance."
    >
      <Stack maxW="1500px" mx="auto" spacing={5}>
        <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
          <Box>
            <Text fontSize="2xl" fontWeight="800">Attendance</Text>
            <Text fontSize="sm" color={muted}>Organization attendance, exceptions, and recorded work for {displayDate(attendanceDate)}.</Text>
          </Box>
          <HStack w={{ base: "100%", md: "auto" }}>
            <Tooltip label="Previous day"><IconButton aria-label="Previous day" icon={<FiChevronLeft />} variant="outline" onClick={() => setAttendanceDate((value) => moveDate(value, -1))} /></Tooltip>
            <Input aria-label="Attendance date" type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} maxW={{ base: "100%", md: "170px" }} />
            <Tooltip label="Next day"><IconButton aria-label="Next day" icon={<FiChevronRight />} variant="outline" onClick={() => setAttendanceDate((value) => moveDate(value, 1))} /></Tooltip>
            <Button variant="outline" onClick={() => setAttendanceDate(dateKey(new Date()))}>Today</Button>
          </HStack>
        </Flex>

        {canAdjust || canFinalize || canReopen || canImport ? (
          <Flex justify="flex-end" gap={2} flexWrap="wrap">
            {canAdjust || canFinalize || canReopen ? (
              <Button
                leftIcon={<FiEdit3 />}
                colorScheme="blue"
                variant="outline"
                isDisabled={!selectedRows.length}
                onClick={() => setBulkOpen(true)}
              >
                Bulk action{selectedRows.length ? ` (${selectedRows.length})` : ""}
              </Button>
            ) : null}
            {canImport ? (
              <Button leftIcon={<FiUpload />} colorScheme="blue" onClick={() => setImportOpen(true)}>
                Import attendance
              </Button>
            ) : null}
          </Flex>
        ) : null}

        <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3}>
          <Metric label="EMPLOYEES" value={summary.employees} helper={`${summary.expected} expected`} icon={FiUsers} color="blue" />
          <Metric label="PRESENT" value={summary.present} helper={`${summary.punchedIn} punched in`} icon={FiCheckCircle} color="green" />
          <Metric label="NOT MARKED" value={summary.notMarked} helper="Not finalized as absent" icon={FiClock} color="yellow" />
          <Metric label="EXCEPTIONS" value={summary.exceptions} helper={`${summary.late} late | ${summary.incomplete} incomplete`} icon={FiAlertCircle} color="red" />
        </SimpleGrid>

        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          <Flex px={4} py={3} borderBottomWidth="1px" borderColor={border} justify="space-between" align="center" gap={3} flexWrap="wrap">
            <HStack spacing={2} flexWrap="wrap">
              <Icon as={FiFilter} color="blue.500" />
              <Text fontWeight="750" display={{ base: "none", lg: "block" }}>Filters</Text>
              <Button display={{ base: "inline-flex", lg: "none" }} size="sm" variant="ghost" px={1} onClick={filterDisclosure.onToggle}>
                {filterDisclosure.isOpen ? "Hide filters" : "Show filters"}
              </Button>
              {[
                ["Half day", summary.halfDay],
                ["Leave", summary.onLeave],
                ["WFH", summary.wfh],
                ["Holiday", summary.holiday],
                ["Weekly off", summary.weeklyOff],
              ].map(([label, value]) => <Badge key={String(label)} variant="subtle" colorScheme="gray">{label}: {value}</Badge>)}
            </HStack>
            <HStack>
              {hasFilters ? <Button size="sm" variant="ghost" onClick={() => setFilters(emptyFilters)}>Clear</Button> : null}
              <Tooltip label="Refresh attendance"><IconButton aria-label="Refresh attendance" size="sm" variant="outline" icon={<FiRefreshCw />} isLoading={loading} onClick={refresh} /></Tooltip>
            </HStack>
          </Flex>
          <Collapse in={filtersVisible} animateOpacity>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4, xl: 8 }} spacing={3} p={4}>
            <InputGroup>
              <InputLeftElement pointerEvents="none"><FiSearch color="gray" /></InputLeftElement>
              <Input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Employee name or code" />
            </InputGroup>
            <Select value={filters.departmentId} onChange={(event) => setFilter("departmentId", event.target.value)} isDisabled={optionsLoading}>
              <option value="">All departments</option>
              {options.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </Select>
            <Select value={filters.teamId} onChange={(event) => setFilter("teamId", event.target.value)} isDisabled={!selectedDepartment || optionsLoading}>
              <option value="">All teams</option>
              {(selectedDepartment?.teams || []).map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </Select>
            <Select value={filters.officeLocationId} onChange={(event) => setFilter("officeLocationId", event.target.value)} isDisabled={optionsLoading}>
              <option value="">All locations</option>
              {options.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </Select>
            <Select value={filters.managerId} onChange={(event) => setFilter("managerId", event.target.value)} isDisabled={optionsLoading}>
              <option value="">All managers</option>
              {options.managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}{manager.code ? ` (${manager.code})` : ""}</option>)}
            </Select>
            <Select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
              <option value="all">All statuses</option>
              <option value="not_marked">Not marked</option>
              <option value="pending">Punched in</option>
              <option value="present">Present</option>
              <option value="half_day">Half day</option>
              <option value="absent">Absent</option>
              <option value="incomplete">Incomplete</option>
              <option value="leave">Leave</option>
              <option value="holiday">Holiday</option>
              <option value="weekly_off">Weekly off</option>
            </Select>
            <Select value={filters.workMode} onChange={(event) => setFilter("workMode", event.target.value)}>
              <option value="all">All work modes</option>
              <option value="office">Office</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="field">Field</option>
            </Select>
            <Select value={filters.exception} onChange={(event) => setFilter("exception", event.target.value)}>
              <option value="all">All exception types</option>
              <option value="missing_punch">Missing punch</option>
              <option value="late_arrival">Late arrival</option>
              <option value="early_exit">Early exit</option>
              <option value="absence">Absence</option>
              <option value="overtime">Overtime</option>
              <option value="setup_gap">Setup gap</option>
            </Select>
          </SimpleGrid>
          </Collapse>
        </Box>

        {error ? <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert> : null}
        {historyWarnings ? <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>{historyWarnings} employee record(s) are using fallback or missing assignment history. Historical scope may be incomplete until assignment history is repaired.</AlertDescription></Alert> : null}

        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          {loading ? <Stack p={4}><Skeleton h="58px" /><Skeleton h="58px" /><Skeleton h="58px" /><Skeleton h="58px" /></Stack> : items.length === 0 ? (
            <Box py={16} px={4} textAlign="center"><Icon as={FiCalendar} boxSize={7} color="gray.400" /><Text mt={3} fontWeight="700">No attendance rows match these filters.</Text><Text fontSize="sm" color={muted}>Try another date or clear the active filters.</Text></Box>
          ) : <>
            <Box display={{ base: "none", lg: "block" }} overflowX="auto">
              <Table size="sm" minW="1300px">
                <Thead><Tr>
                  {canAdjust || canFinalize || canReopen ? (
                    <Th w="44px"><Checkbox isChecked={allPageSelected} isIndeterminate={selectedRows.length > 0 && !allPageSelected} onChange={togglePage} aria-label="Select employees on this page" /></Th>
                  ) : null}
                  <Th>Employee</Th><Th>Organization</Th><Th>Shift</Th><Th>Setup</Th><Th>First in</Th><Th>Final out</Th><Th>Worked</Th><Th>Late / Early</Th><Th>Mode</Th><Th>Status</Th>
                </Tr></Thead>
                <Tbody>{items.map((row) => <Tr key={row.employee.id} cursor="pointer" _hover={{ bg: rowHover }} onClick={() => setSelectedRow(row)}>
                  {canAdjust || canFinalize || canReopen ? (
                    <Td onClick={(event) => event.stopPropagation()}><Checkbox isChecked={selectedEmployeeIds.has(row.employee.id)} onChange={() => toggleEmployee(row.employee.id)} aria-label={`Select ${row.employee.name}`} /></Td>
                  ) : null}
                  <Td><EmployeeIdentity row={row} /></Td>
                  <Td><Text fontSize="sm" fontWeight="600">{row.organization.department || "Not assigned"}</Text><Text fontSize="xs" color={muted}>{[row.organization.team, row.organization.officeLocation].filter(Boolean).join(" | ")}</Text></Td>
                  <Td><Text fontSize="sm">{row.schedule.startTime && row.schedule.endTime ? `${row.schedule.startTime} - ${row.schedule.endTime}` : "Not configured"}</Text><Text fontSize="xs" color={muted}>{row.timezone}</Text></Td>
                  <Td>{row.setupGaps?.length ? <Text fontSize="xs" fontWeight="650" color="red.500">Missing {row.setupGaps.map(titleCase).join(", ")}</Text> : <Badge colorScheme="green" variant="subtle">Complete</Badge>}</Td>
                  <Td>{formatTime(row.firstIn, row.timezone)}</Td><Td>{formatTime(row.lastOut, row.timezone)}</Td><Td>{formatMinutes(row.workedMinutes)}</Td>
                  <Td><Text fontSize="sm">{formatMinutes(row.lateMinutes)} / {formatMinutes(row.earlyExitMinutes)}</Text>{row.overtimeMinutes ? <Text fontSize="xs" color="green.600">OT {formatMinutes(row.overtimeMinutes)}</Text> : null}</Td>
                  <Td><Badge variant="outline">{titleCase(row.workMode)}</Badge></Td><Td><Badge colorScheme={statusColor(row.status)}>{titleCase(row.status)}</Badge></Td>
                </Tr>)}</Tbody>
              </Table>
            </Box>
            <Box display={{ base: "block", lg: "none" }}>{items.map(renderMobileRow)}</Box>
          </>}
          <Flex borderTopWidth="1px" borderColor={border} px={4} py={3} justify="space-between" align="center" gap={3} flexWrap="wrap">
            <Text fontSize="sm" color={muted}>{pagination.total} matching {pagination.total === 1 ? "employee" : "employees"}</Text>
            <HStack><IconButton aria-label="Previous page" icon={<FiChevronLeft />} size="sm" variant="outline" isDisabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)} /><Text fontSize="sm" minW="72px" textAlign="center">{page} / {pagination.totalPages}</Text><IconButton aria-label="Next page" icon={<FiChevronRight />} size="sm" variant="outline" isDisabled={loading || page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)} /></HStack>
          </Flex>
        </Box>
      </Stack>
      <AttendanceDayDrawer row={selectedRow} onClose={() => setSelectedRow(null)} onChanged={refresh} />
      <AttendanceBulkActionDrawer
        isOpen={bulkOpen}
        rows={selectedRows}
        attendanceDate={attendanceDate}
        canAdjust={canAdjust}
        canFinalize={canFinalize}
        canReopen={canReopen}
        onClose={() => {
          setBulkOpen(false);
          setSelectedEmployeeIds(new Set());
        }}
        onSaved={refresh}
      />
      <AttendanceImportDrawer
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onApplied={refresh}
      />
    </PermissionGate>
  );
});

export default AttendanceWorkspace;
