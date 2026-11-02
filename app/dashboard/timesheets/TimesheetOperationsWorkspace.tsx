"use client";
import { Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormLabel, Heading, HStack, IconButton, Input, Select, SimpleGrid, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr, useColorModeValue } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiDownload, FiRefreshCw } from "react-icons/fi";
import { format } from "date-fns";
import stores from "@/app/store/stores";
import { observer } from "mobx-react-lite";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { formatMinutes, timesheetColors, timesheetLabels } from "../calendar/timesheetUi.utils";
import OperationsLookup from "./OperationsLookup";
import OperationsDayDrawer from "./OperationsDayDrawer";
import { Choice, DayRow, EffortRow, MonthRow, operationsExport, operationsOptions, operationsReport, ReportData, ReportView, Scope } from "./timesheetOperationsApi";

const labels: Record<Scope, string> = { organization: "Organization", reportees: "Direct reports", projects: "Managed projects" };
const filterKinds = ["department", "team", "location", "employee", "manager", "project", "work_type"] as const;
const filterKeys: Record<string, string> = { department: "departmentId", team: "teamId", location: "officeLocationId", employee: "employeeId", manager: "managerId", project: "projectId", work_type: "workTypeId" };
const filterLabels: Record<string, string> = { department: "Department", team: "Team", location: "Location", employee: "Employee", manager: "Reporting manager", project: "Project", work_type: "Work type" };
const statuses: Record<string, string> = { all: "All statuses", required: "Required", missing: "Missing", draft: "Draft", submitted: "Pending approval", approved: "Approved", returned: "Returned", rejected: "Rejected", not_required: "Not required", setup_incomplete: "Setup incomplete", short_hours: "Short hours", overdue: "Overdue", stale: "Changed context", upcoming: "Upcoming", exempt: "HR exemption" };

function Workspace() {
  const border = useColorModeValue("gray.200", "gray.700"), muted = useColorModeValue("gray.600", "gray.400"), head = useColorModeValue("gray.50", "gray.800");
  const [options, setOptions] = useState<{ scopes: Scope[]; canExport: boolean } | null>(null), [scope, setScope] = useState<Scope>("organization"), [view, setView] = useState<ReportView>("register");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd")), [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [from, setFrom] = useState(() => format(new Date(), "yyyy-MM-01")), [to, setTo] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [search, setSearch] = useState(""), [query, setQuery] = useState(""), [status, setStatus] = useState("all"), [filters, setFilters] = useState<Record<string, Choice | null>>({});
  const [page, setPage] = useState(1), [limit, setLimit] = useState(25), [revision, setRevision] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [result, setResult] = useState<ReportData | null>(null), [exportFormat, setExportFormat] = useState("csv"), [exporting, setExporting] = useState(false), [exportError, setExportError] = useState("");
  const [day, setDay] = useState<{ employeeId: string; date: string } | null>(null), [monthlyDetail, setMonthlyDetail] = useState<MonthRow | null>(null);
  const ready = stores.auth.sessionReady && Boolean(stores.auth.user), actorId = stores.auth.user?._id;
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1); }, 250); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController(); setLoading(true); setError(""); setOptions(null);
    operationsOptions(controller.signal).then((data) => { if (!controller.signal.aborted) { setOptions(data); setScope(data.scopes[0]); if (data.scopes[0] === "projects") setView("effort"); } }).catch((err) => { if (!controller.signal.aborted) { setError(getApiErrorMessage(err?.response?.data || err, "Timesheet access is not available")); setLoading(false); } });
    return () => controller.abort();
  }, [ready, actorId]);
  const params = useMemo(() => {
    const values: Record<string, any> = { scope, page, limit, search: scope === "projects" ? undefined : query };
    if (view === "register") { values.date = date; values.status = status; }
    else if (view === "monthly") values.month = month;
    else { values.from = from; values.to = to; values.status = ["all", "draft", "submitted", "approved", "returned", "rejected"].includes(status) ? status : "all"; }
    for (const kind of filterKinds) if (filters[kind] && !(view === "monthly" && ["project", "work_type"].includes(kind)) && !(scope === "projects" && !["project", "work_type"].includes(kind))) values[filterKeys[kind]] = filters[kind]!._id;
    return values;
  }, [scope, view, page, limit, query, date, month, status, from, to, filters]);
  useEffect(() => {
    if (!options || !options.scopes.includes(scope)) return;
    if (scope === "projects" && view !== "effort") return;
    const controller = new AbortController(); setLoading(true); setError(""); setResult(null);
    operationsReport(view, params, controller.signal).then((data) => { if (!controller.signal.aborted) setResult(data); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Could not load timesheets")); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [options, scope, view, params, revision]);
  const chooseView = (value: ReportView) => { setView(value); setPage(1); setStatus("all"); setDay(null); setMonthlyDetail(null); };
  const changeFilter = (kind: string, value: Choice | null) => { setFilters((old) => ({ ...old, [kind]: value, ...(kind === "department" ? { team: null } : {}), ...(kind === "project" ? { work_type: null } : {}) })); setPage(1); };
  const lookupParams = (kind: string) => {
    const values = { ...params, date: view === "register" ? date : view === "monthly" ? `${month}-01` : to, status: "all", search: undefined, page: undefined, limit: undefined };
    delete values[filterKeys[kind]];
    return values;
  };
  async function download() {
    if (exporting) return; setExporting(true); setExportError("");
    try { const blob = await operationsExport(view, exportFormat, params), url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = `timesheets-${view}-${view === "monthly" ? month : view === "effort" ? from : date}.${exportFormat}`; anchor.click(); URL.revokeObjectURL(url); }
    catch (err: any) { setExportError(getApiErrorMessage(err?.response?.data || err, err?.message || "Could not export timesheets")); }
    finally { setExporting(false); }
  }
  const summary = result?.summary || {}, total = result?.pagination.total || 0, pages = result?.pagination.totalPages || 1;
  const columns = view === "effort" ? ["Project / work type", "Employees", "Employee-days", "Logged", "Approved"] : view === "monthly" ? ["Employee", "Required", "Logged", "Approved", "Shortfall", "Missing", "Pending", "Setup", ""] : ["Employee", "Department / team", "Required", "Daily logged", "Shortfall", "Status", ""];
  return <Box p={{ base: 3, md: 6 }} minW={0}><Stack spacing={5} maxW="1600px" mx="auto">
    <Flex justify="space-between" gap={3} align="center" wrap="wrap"><Heading size="lg">Timesheets</Heading><HStack><Tooltip label="Refresh timesheets"><IconButton aria-label="Refresh timesheets" icon={<FiRefreshCw />} variant="outline" isDisabled={!options} isLoading={loading && Boolean(options)} onClick={() => setRevision((r) => r + 1)} /></Tooltip>{options?.canExport ? <><Select aria-label="Timesheet export format" w="100px" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}><option value="csv">CSV</option><option value="xlsx">XLSX</option></Select><Tooltip label={total > 5000 ? "Narrow filters to at most 5,000 rows" : "Export filtered report"}><IconButton aria-label="Export timesheet report" icon={<FiDownload />} isLoading={exporting} isDisabled={loading || !result || !total || total > 5000} onClick={download} /></Tooltip></> : null}</HStack></Flex>
    {options ? <>
      <Flex gap={3} wrap="wrap" align="end"><FormControl w={{ base: "100%", sm: "210px" }}><FormLabel>Scope</FormLabel><Select aria-label="Timesheet scope" value={scope} onChange={(e) => { const scope = e.target.value as Scope; setScope(scope); setFilters({}); setSearch(""); setQuery(""); setStatus("all"); setPage(1); if (scope === "projects") setView("effort"); }}>{options.scopes.map((s) => <option key={s} value={s}>{labels[s]}</option>)}</Select></FormControl><FormControl w={{ base: "100%", sm: "210px" }}><FormLabel>Report</FormLabel><Select aria-label="Timesheet report" value={view} onChange={(e) => chooseView(e.target.value as ReportView)}>{scope !== "projects" ? <><option value="register">Daily register</option><option value="monthly">Monthly summary</option></> : null}<option value="effort">Project effort</option></Select></FormControl>
      {view === "monthly" ? <FormControl w={{ base: "100%", sm: "180px" }}><FormLabel>Month</FormLabel><Input aria-label="Timesheet month" type="month" value={month} onChange={(e) => { if (e.target.value) { setMonth(e.target.value); setPage(1); } }} /></FormControl> : view === "register" ? <FormControl w={{ base: "100%", sm: "180px" }}><FormLabel>Work date</FormLabel><Input aria-label="Timesheet work date" type="date" value={date} onChange={(e) => { if (e.target.value) { setDate(e.target.value); setPage(1); } }} /></FormControl> : <>{[["From", from, setFrom], ["To", to, setTo]].map(([label, value, setter]) => <FormControl key={label as string} w={{ base: "100%", sm: "180px" }}><FormLabel>{label as string}</FormLabel><Input aria-label={`Timesheet ${String(label).toLowerCase()} date`} type="date" value={value as string} onChange={(e) => { if (e.target.value) { (setter as (value: string) => void)(e.target.value); setPage(1); } }} /></FormControl>)}</>}
      </Flex>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3} borderTopWidth="1px" borderBottomWidth="1px" borderColor={border} py={4}>
        {scope !== "projects" ? <FormControl><FormLabel>Employee search</FormLabel><Input aria-label="Timesheet employee search" placeholder="Name or employee code" value={search} onChange={(e) => setSearch(e.target.value)} /></FormControl> : null}
        {filterKinds.filter((kind) => !(scope === "projects" && !["project", "work_type"].includes(kind)) && !(view === "monthly" && ["project", "work_type"].includes(kind)) && !(scope === "reportees" && kind === "manager")).map((kind) => <FormControl key={kind}><FormLabel htmlFor={`timesheet-filter-${kind}`}>{filterLabels[kind]}</FormLabel><OperationsLookup kind={kind} label={filterLabels[kind]} params={lookupParams(kind)} value={filters[kind] || null} onChange={(value) => changeFilter(kind, value)} disabled={kind === "work_type" && !filters.project} /></FormControl>)}
        {view !== "monthly" ? <FormControl><FormLabel>Status</FormLabel><Select aria-label="Timesheet status" value={view === "effort" && !["all", "draft", "submitted", "approved", "returned", "rejected"].includes(status) ? "all" : status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>{Object.entries(statuses).filter(([key]) => view !== "effort" || ["all", "draft", "submitted", "approved", "returned", "rejected"].includes(key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></FormControl> : null}
      </SimpleGrid>
      {result ? <Box><Text fontSize="xs" color={muted} mb={2}>{result.summaryScope === "page" ? "Page totals" : "Filtered totals"}</Text><SimpleGrid columns={{ base: 2, md: 4, xl: 6 }} spacing={4}>{(view === "effort" ? [["Logged", formatMinutes(summary.loggedMinutes)], ["Approved", formatMinutes(summary.approvedMinutes)], ["Employee-days", summary.employeeDays], ["Work groups", summary.rows]] : [["Required", formatMinutes(summary.requiredMinutes)], ["Logged", formatMinutes(summary.loggedMinutes)], ["Shortfall", formatMinutes(summary.shortfallMinutes)], ["Missing", summary.missing], ["Pending", summary.submitted], ["Setup issues", summary.setup_incomplete]]).map(([label, value]) => <Box key={label as string}><Text fontSize="xs" color={muted}>{label}</Text><Text fontSize="xl" fontWeight="700">{value ?? 0}</Text></Box>)}</SimpleGrid></Box> : null}
    </> : null}
    {error ? <Alert status="error"><AlertIcon />{error}</Alert> : null}{exportError ? <Alert status="error"><AlertIcon />{exportError}</Alert> : null}
    {loading ? <Skeleton h="350px" /> : result ? <Box minW={0} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden"><TableContainer overflowX="auto"><Table size="sm"><Thead bg={head}><Tr>{columns.map((label, index) => <Th key={`${label}:${index}`} whiteSpace="nowrap">{label}</Th>)}</Tr></Thead><Tbody>
      {view === "register" ? (result.data as DayRow[]).map((row) => <Tr key={`${row.employee._id}:${row.attendanceDate}`}><Td><Text fontWeight="600" maxW="230px" whiteSpace="normal" overflowWrap="anywhere">{row.employee.name}</Text><Text fontSize="xs" color={muted}>{row.employee.code}</Text></Td><Td><Text>{row.organization.departmentNameSnapshot || "Not assigned"}</Text><Text fontSize="xs" color={muted}>{[row.organization.teamNameSnapshot, row.organization.officeLocationNameSnapshot].filter(Boolean).join(" | ")}</Text></Td><Td>{formatMinutes(row.requiredMinutes)}</Td><Td>{formatMinutes(row.loggedMinutes)}</Td><Td>{formatMinutes(row.shortfallMinutes)}</Td><Td><Stack spacing={1} align="start"><Badge colorScheme={timesheetColors[row.state]}>{timesheetLabels[row.state]}</Badge>{row.shortHours ? <Badge colorScheme="orange">Short hours</Badge> : null}{row.overdue ? <Badge colorScheme="red">Overdue</Badge> : null}{row.stale ? <Badge colorScheme="orange">Changed context</Badge> : null}{row.hrExemption ? <Badge colorScheme="teal">HR exemption</Badge> : null}{row.deadlineExtended ? <Badge colorScheme="blue">Deadline extended</Badge> : null}</Stack></Td><Td><Button size="sm" variant="outline" onClick={() => setDay({ employeeId: row.employee._id, date: row.attendanceDate })}>View day</Button></Td></Tr>) : view === "monthly" ? (result.data as MonthRow[]).map((row) => <Tr key={row.employee._id}><Td><Text fontWeight="600" maxW="230px" whiteSpace="normal">{row.employee.name}</Text><Text fontSize="xs" color={muted}>{row.employee.code}</Text></Td>{[row.requiredMinutes, row.loggedMinutes, row.approvedMinutes, row.shortfallMinutes].map((minutes, i) => <Td key={i}>{formatMinutes(minutes)}</Td>)}<Td>{row.missing}</Td><Td>{row.submitted}</Td><Td>{row.setup_incomplete}</Td><Td><Button size="sm" variant="outline" onClick={() => setMonthlyDetail(row)}>View month</Button></Td></Tr>) : (result.data as EffortRow[]).map((row) => <Tr key={`${row.projectId}:${row.workTypeId}`}><Td><Text fontWeight="600" whiteSpace="normal">{row.projectName}</Text><Text fontSize="xs" color={muted}>{row.workTypeName}</Text></Td><Td>{row.employees}</Td><Td>{row.employeeDays}</Td><Td>{formatMinutes(row.loggedMinutes)}</Td><Td>{formatMinutes(row.approvedMinutes)}</Td></Tr>)}
      {!result.data.length ? <Tr><Td colSpan={columns.length}><Text py={10} textAlign="center" color={muted}>No timesheets match these filters.</Text></Td></Tr> : null}
    </Tbody></Table></TableContainer><Flex px={4} py={3} justify="space-between" align="center" gap={3} wrap="wrap"><Text fontSize="sm" color={muted}>{total} {view === "monthly" ? "employees" : view === "effort" ? "work groups" : "employee-days"}</Text><HStack><Select aria-label="Timesheet page size" value={limit} w="90px" size="sm" onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>{[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</Select><Tooltip label="Previous page"><IconButton aria-label="Previous timesheet page" icon={<FiChevronLeft />} size="sm" variant="outline" isDisabled={page <= 1} onClick={() => setPage((p) => p - 1)} /></Tooltip><Text fontSize="sm">{page}/{pages}</Text><Tooltip label="Next page"><IconButton aria-label="Next timesheet page" icon={<FiChevronRight />} size="sm" variant="outline" isDisabled={page >= pages} onClick={() => setPage((p) => p + 1)} /></Tooltip></HStack></Flex></Box> : null}
  </Stack>{monthlyDetail ? <DashboardDrawer isOpen={!day} onClose={() => setMonthlyDetail(null)} titlePrefix={monthlyDetail.employee.name} titleSuffix={month} maxW={{ base: "100%", md: "720px" }}><Stack spacing={0}>{monthlyDetail.days.map((row) => <Flex key={row.attendanceDate} py={3} borderBottomWidth="1px" align="center" justify="space-between" gap={3}><Box><Text fontWeight="600">{row.attendanceDate}</Text><Badge colorScheme={timesheetColors[row.state]}>{timesheetLabels[row.state]}</Badge><Text fontSize="sm" mt={1}>{formatMinutes(row.loggedMinutes)} / {formatMinutes(row.requiredMinutes)} logged</Text></Box><Button size="sm" onClick={() => setDay({ employeeId: monthlyDetail.employee._id, date: row.attendanceDate })}>View day</Button></Flex>)}</Stack></DashboardDrawer> : null}{day ? <OperationsDayDrawer employeeId={day.employeeId} date={day.date} scope={scope} onClose={() => setDay(null)} onChanged={() => setRevision((r) => r + 1)} /> : null}</Box>;
}
export default observer(Workspace);
