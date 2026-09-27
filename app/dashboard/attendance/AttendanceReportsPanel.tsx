"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
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
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiDownload } from "react-icons/fi";
import {
  AttendanceMonthlySummary,
  AttendanceOverviewOptions,
  AttendanceReportRecord,
  AttendanceReportsDashboard,
  downloadAttendanceReport,
  fetchAttendanceExceptionsReport,
  fetchAttendanceOverviewOptions,
  fetchAttendanceReportsDashboard,
  fetchDailyAttendanceReport,
  fetchMonthlyAttendanceReport,
} from "./attendanceAdminApi";

type ReportType = "daily" | "monthly" | "exceptions";

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const currentPeriod = () => dateKey(new Date()).slice(0, 7);
const periodRange = (periodKey: string) => {
  const [year, month] = periodKey.split("-").map(Number);
  const finalDay = new Date(year, month, 0).getDate();
  return { fromDate: `${periodKey}-01`, toDate: `${periodKey}-${String(finalDay).padStart(2, "0")}` };
};
const formatMinutes = (value: number) => {
  const minutes = Number(value || 0);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
const titleCase = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const EMPTY_OPTIONS: AttendanceOverviewOptions = { departments: [], locations: [], managers: [], managersTruncated: false };

export default function AttendanceReportsPanel({ canExport }: { canExport: boolean }) {
  const toast = useToast();
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const track = useColorModeValue("gray.100", "gray.700");
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [periodKey, setPeriodKey] = useState(currentPeriod);
  const [date, setDate] = useState(dateKey(new Date()));
  const [range, setRange] = useState(() => periodRange(currentPeriod()));
  const [exceptionType, setExceptionType] = useState("all");
  const [filters, setFilters] = useState({ search: "", departmentId: "", teamId: "", officeLocationId: "", managerId: "" });
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [dashboard, setDashboard] = useState<AttendanceReportsDashboard | null>(null);
  const [records, setRecords] = useState<AttendanceReportRecord[]>([]);
  const [summaries, setSummaries] = useState<AttendanceMonthlySummary[]>([]);
  const [source, setSource] = useState<"live" | "locked">("live");
  const [sourceVersion, setSourceVersion] = useState(0);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const selectedDepartment = options.departments.find((item) => item.id === filters.departmentId);
  const params = useMemo(() => ({
    page,
    limit: 25,
    search: filters.search.trim() || undefined,
    departmentId: filters.departmentId || undefined,
    teamId: filters.teamId || undefined,
    officeLocationId: filters.officeLocationId || undefined,
    managerId: filters.managerId || undefined,
  }), [filters, page]);

  useEffect(() => {
    const controller = new AbortController();
    const optionDate = reportType === "daily" ? date : `${periodKey}-01`;
    fetchAttendanceOverviewOptions(optionDate, controller.signal)
      .then((result) => setOptions(result || EMPTY_OPTIONS))
      .catch(() => { if (!controller.signal.aborted) setOptions(EMPTY_OPTIONS); });
    return () => controller.abort();
  }, [date, periodKey, reportType]);

  const load = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const reportRequest = reportType === "monthly"
      ? fetchMonthlyAttendanceReport({ ...params, periodKey }, controller.signal)
      : reportType === "daily"
        ? fetchDailyAttendanceReport({ ...params, date }, controller.signal)
        : fetchAttendanceExceptionsReport({ ...params, ...range, type: exceptionType }, controller.signal);
    Promise.all([fetchAttendanceReportsDashboard(periodKey, params, controller.signal), reportRequest])
      .then(([dashboardResult, reportResult]: any[]) => {
        setDashboard(dashboardResult);
        setPagination(reportResult.pagination);
        if (reportType === "monthly") {
          setSummaries(reportResult.items || []);
          setRecords([]);
          setSource(reportResult.source || "live");
          setSourceVersion(Number(reportResult.attendancePeriodVersion || 0));
        } else {
          setRecords(reportResult.items || []);
          setSummaries([]);
        }
      })
      .catch((requestError: any) => {
        if (!controller.signal.aborted) {
          setError(getApiErrorMessage(requestError?.response?.data || requestError, "Could not load attendance report"));
          setRecords([]);
          setSummaries([]);
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, exceptionType, params, periodKey, range, reportType]);

  useEffect(() => load(), [load]);
  useEffect(() => setPage(1), [date, exceptionType, periodKey, range.fromDate, range.toDate, reportType]);

  const exportReport = async (format: "csv" | "xlsx") => {
    setExporting(true);
    try {
      await downloadAttendanceReport({
        report: reportType,
        format,
        ...(reportType === "daily" ? { date } : {}),
        ...(reportType === "monthly" ? { periodKey } : {}),
        ...(reportType === "exceptions" ? { ...range, type: exceptionType } : {}),
        ...params,
        page: undefined,
        limit: undefined,
      });
    } catch (requestError: any) {
      toast({ title: "Report could not be downloaded", description: getApiErrorMessage(requestError?.response?.data || requestError), status: "error" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Stack spacing={5}>
      <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3} direction={{ base: "column", md: "row" }}>
        <Box>
          <Text fontSize="2xl" fontWeight="800">Attendance reports</Text>
          <Text fontSize="sm" color={muted}>Daily registers, monthly muster, exceptions, trends, and approval workload.</Text>
        </Box>
        {canExport ? (
          <HStack>
            <Button leftIcon={<FiDownload />} variant="outline" isLoading={exporting} onClick={() => exportReport("csv")}>CSV</Button>
            <Button leftIcon={<FiDownload />} colorScheme="blue" isLoading={exporting} onClick={() => exportReport("xlsx")}>XLSX</Button>
          </HStack>
        ) : null}
      </Flex>

      <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3}>
        {[
          ["Records", dashboard?.totals.records || 0, "Stored days"],
          ["Present", dashboard?.totals.present || 0, `${dashboard?.totals.wfh || 0} WFH`],
          ["Exceptions", (dashboard?.totals.late || 0) + (dashboard?.totals.missingPunch || 0) + (dashboard?.totals.absent || 0), `${dashboard?.totals.late || 0} late`],
          ["My approvals", dashboard?.pendingApprovals.total || 0, `${dashboard?.pendingApprovals.regularizations || 0} corrections`],
        ].map(([label, value, helper]) => (
          <Box key={String(label)} bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
            <Text fontSize="xs" color={muted} fontWeight="700">{label}</Text>
            <Text fontSize="2xl" fontWeight="800">{value}</Text>
            <Text fontSize="xs" color={muted}>{helper}</Text>
          </Box>
        ))}
      </SimpleGrid>

      <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
        <Flex gap={3} wrap="wrap" align="flex-end">
          <Box minW="170px"><Text fontSize="xs" fontWeight="700" mb={1}>Report</Text><Select value={reportType} onChange={(event) => setReportType(event.target.value as ReportType)}><option value="daily">Daily register</option><option value="monthly">Monthly muster</option><option value="exceptions">Exception report</option></Select></Box>
          {reportType === "daily" ? <Box><Text fontSize="xs" fontWeight="700" mb={1}>Date</Text><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Box> : null}
          {reportType === "monthly" ? <Box><Text fontSize="xs" fontWeight="700" mb={1}>Month</Text><Input type="month" value={periodKey} onChange={(event) => { setPeriodKey(event.target.value); setRange(periodRange(event.target.value)); }} /></Box> : null}
          {reportType === "exceptions" ? <><Box><Text fontSize="xs" fontWeight="700" mb={1}>From</Text><Input type="date" value={range.fromDate} onChange={(event) => setRange((current) => ({ ...current, fromDate: event.target.value }))} /></Box><Box><Text fontSize="xs" fontWeight="700" mb={1}>To</Text><Input type="date" value={range.toDate} onChange={(event) => setRange((current) => ({ ...current, toDate: event.target.value }))} /></Box><Box minW="180px"><Text fontSize="xs" fontWeight="700" mb={1}>Exception</Text><Select value={exceptionType} onChange={(event) => setExceptionType(event.target.value)}><option value="all">All exceptions</option><option value="late_arrival">Late arrival</option><option value="early_exit">Early exit</option><option value="absence">Absence</option><option value="missing_punch">Missing punch</option><option value="overtime">Overtime</option><option value="wfh">WFH</option><option value="regularization">Regularization</option></Select></Box></> : null}
          <Input maxW="210px" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Employee name or code" />
          <Select maxW="190px" value={filters.departmentId} onChange={(event) => setFilters((current) => ({ ...current, departmentId: event.target.value, teamId: "" }))}><option value="">All departments</option>{options.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select maxW="170px" value={filters.teamId} isDisabled={!selectedDepartment} onChange={(event) => setFilters((current) => ({ ...current, teamId: event.target.value }))}><option value="">All teams</option>{(selectedDepartment?.teams || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select maxW="170px" value={filters.officeLocationId} onChange={(event) => setFilters((current) => ({ ...current, officeLocationId: event.target.value }))}><option value="">All locations</option>{options.locations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select maxW="180px" value={filters.managerId} onChange={(event) => setFilters((current) => ({ ...current, managerId: event.target.value }))}><option value="">All managers</option>{options.managers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
        </Flex>
      </Box>

      {reportType === "monthly" ? (
        <Alert status={source === "locked" ? "success" : "info"} borderRadius="md">
          <AlertIcon />
          <AlertDescription>{source === "locked" ? `Immutable calendar-month attendance snapshot version ${sourceVersion}.` : "Live calendar-month preview. Cutoff-based immutable inputs are managed in the Payroll tab."}</AlertDescription>
        </Alert>
      ) : null}
      {error ? <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert> : null}

      <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
        {loading ? <Stack p={4}><Skeleton h="48px" /><Skeleton h="48px" /><Skeleton h="48px" /></Stack> : (
          <Box overflowX="auto">
            {reportType === "monthly" ? (
              <Table size="sm" minW="1150px"><Thead><Tr><Th>Employee</Th><Th>Work assignment</Th><Th isNumeric>Payable days</Th><Th isNumeric>LOP days</Th><Th isNumeric>Present</Th><Th isNumeric>Absent</Th><Th isNumeric>Leave</Th><Th isNumeric>WFH</Th><Th>Worked</Th><Th>Approved OT</Th><Th isNumeric>Exceptions</Th></Tr></Thead><Tbody>{summaries.map((item) => <Tr key={item._id || item.employee}><Td><Text fontWeight="700">{item.employeeNameSnapshot}</Text><Text fontSize="xs" color={muted}>{item.employeeCodeSnapshot}</Text></Td><Td><Text>{item.departmentNameSnapshot || "Not assigned"}</Text><Text fontSize="xs" color={muted}>{[item.teamNameSnapshot, item.officeLocationNameSnapshot].filter(Boolean).join(" | ")}</Text></Td><Td isNumeric>{item.paidDays}</Td><Td isNumeric>{item.unpaidDays}</Td><Td isNumeric>{item.presentDays}</Td><Td isNumeric>{item.absentDays}</Td><Td isNumeric>{item.paidLeaveDays + item.unpaidLeaveDays}</Td><Td isNumeric>{item.wfhDays}</Td><Td>{formatMinutes(item.workedMinutes)}</Td><Td>{formatMinutes(item.approvedOvertimeMinutes)}</Td><Td isNumeric><Badge colorScheme={item.exceptionCount ? "orange" : "green"}>{item.exceptionCount}</Badge></Td></Tr>)}</Tbody></Table>
            ) : (
              <Table size="sm" minW="1200px"><Thead><Tr><Th>Date</Th><Th>Employee</Th><Th>Work assignment</Th><Th>Status</Th><Th>Mode</Th><Th>First in</Th><Th>Final out</Th><Th>Worked</Th><Th>Late / Early</Th><Th>Approved OT</Th></Tr></Thead><Tbody>{records.map((item) => <Tr key={item.id}><Td>{item.attendanceDate}</Td><Td><Text fontWeight="700">{item.employee.name}</Text><Text fontSize="xs" color={muted}>{item.employee.code}</Text></Td><Td><Text>{item.organization.department || "Not assigned"}</Text><Text fontSize="xs" color={muted}>{[item.organization.team, item.organization.location].filter(Boolean).join(" | ")}</Text></Td><Td><Badge>{titleCase(item.status)}</Badge></Td><Td>{titleCase(item.workMode)}</Td><Td>{item.firstIn ? new Date(item.firstIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</Td><Td>{item.finalOut ? new Date(item.finalOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</Td><Td>{formatMinutes(item.workedMinutes)}</Td><Td>{formatMinutes(item.lateMinutes)} / {formatMinutes(item.earlyExitMinutes)}</Td><Td>{formatMinutes(item.approvedOvertimeMinutes)}</Td></Tr>)}</Tbody></Table>
            )}
            {!summaries.length && !records.length ? <Box py={12} textAlign="center"><Text fontWeight="700">No report rows match these filters.</Text></Box> : null}
          </Box>
        )}
        <Flex px={4} py={3} borderTopWidth="1px" borderColor={border} justify="space-between" align="center">
          <Text fontSize="sm" color={muted}>{pagination.total} rows</Text>
          <HStack><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {pagination.totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack>
        </Flex>
      </Box>

      <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
        <Text fontWeight="750" mb={3}>Daily trend for {periodKey}</Text>
        <Stack spacing={2} maxH="320px" overflowY="auto">
          {(dashboard?.trend || []).map((item) => {
            const percentage = item.employees ? Math.round((item.present / item.employees) * 100) : 0;
            return <Flex key={item.date} align="center" gap={3}><Text fontSize="xs" w="84px">{item.date.slice(5)}</Text><Box flex="1" h="8px" bg={track} borderRadius="sm" overflow="hidden"><Box h="100%" bg="green.400" w={`${percentage}%`} /></Box><Text fontSize="xs" w="150px" textAlign="right">{item.present}/{item.employees} present | {item.exceptions} issues</Text></Flex>;
          })}
          {!dashboard?.trend?.length ? <Text fontSize="sm" color={muted}>No attendance trend is available for this month.</Text> : null}
        </Stack>
      </Box>
    </Stack>
  );
}
