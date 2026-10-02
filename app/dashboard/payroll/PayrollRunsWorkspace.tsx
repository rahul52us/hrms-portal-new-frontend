"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import PayrollDraftResultsPanel from "./PayrollDraftResultsPanel";
import PayrollEmployeeSnapshotsPanel from "./PayrollEmployeeSnapshotsPanel";
import PayrollOneTimeInputsPanel from "./PayrollOneTimeInputsPanel";
import PayrollValidationPanel from "./PayrollValidationPanel";
import axios from "axios";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEye, FiPlus, FiRefreshCw } from "react-icons/fi";

type PayrollRun = {
  _id: string;
  periodKey: string;
  cycleStartDate: string;
  cycleEndDate: string;
  attendancePayrollInputVersion: number;
  attendancePeriodVersion: number;
  attendanceSummaryCount: number;
  attendanceAdjustmentCount: number;
  attendanceTotals?: { payroll?: Record<string, number> };
  attendanceInputStatus?: "pending" | "prepared";
  employeeInputCount?: number;
  employeeInputIssueCount?: number;
  attendanceInputTotals?: Record<string, number>;
  attendanceInputsPreparedAt?: string;
  currency: string;
  currencyMinorUnits: number;
  oneTimeInputCount?: number;
  oneTimeInputTotals?: Record<string, number>;
  employeeSnapshotStatus?: "pending" | "prepared";
  employeeSnapshotVersion?: number;
  employeeSnapshotCount?: number;
  employeeSnapshotIssueCount?: number;
  employeeSnapshotErrorCount?: number;
  employeeSnapshotWarningCount?: number;
  employeeSnapshotCompensationTotals?: Record<string, number>;
  employeeSnapshotsPreparedAt?: string;
  calculationStatus?: "pending" | "calculated" | "stale";
  calculationVersion?: number;
  calculationEmployeeSnapshotVersion?: number;
  calculationOneTimeInputCount?: number;
  payrollResultCount?: number;
  payrollResultIssueCount?: number;
  payrollResultErrorCount?: number;
  payrollResultWarningCount?: number;
  payrollResultTotals?: Record<string, number>;
  calculatedAt?: string;
  status: string;
  version: number;
  preparationReason: string;
  createdBy?: { name?: string; username?: string; code?: string };
  createdAt?: string;
};

type PayrollEmployeeInput = {
  _id: string;
  employeeNameSnapshot: string;
  employeeCodeSnapshot: string;
  designationSnapshot?: string;
  departmentNameSnapshot?: string;
  teamNameSnapshot?: string;
  officeLocationNameSnapshot?: string;
  currentAttendance: Record<string, number>;
  attendanceAdjustments: Record<string, number>;
  payrollAttendance: Record<string, number>;
  adjustmentSourcePeriods?: string[];
  attendanceAdjustmentCount: number;
  inputIssues?: string[];
  hasIssues: boolean;
};

type PayrollSource = {
  periodKey: string;
  canCreate: boolean;
  blocker?: string | null;
  input?: {
    cycleStartDate: string;
    cycleEndDate: string;
    version: number;
    attendancePeriodVersion: number;
    summaryCount: number;
    adjustmentCount: number;
    totals?: { payroll?: Record<string, number> };
    lockedAt?: string;
    lockedBy?: { name?: string; username?: string; code?: string };
  } | null;
  existingRun?: { _id: string; status: string } | null;
};

type Props = { companyId: string; canManage: boolean };

function currentPeriodKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}`;
}

function message(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || "Request failed";
}

function formatNumber(value: unknown, maximumFractionDigits = 2) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(Number(value || 0));
}

function signedNumber(value: unknown) {
  const number = Number(value || 0);
  return `${number > 0 ? "+" : ""}${formatNumber(number)}`;
}

function creatorName(run: PayrollRun) {
  return run.createdBy?.name || run.createdBy?.code || run.createdBy?.username || "Unknown";
}

function organization(input: PayrollEmployeeInput) {
  return [input.departmentNameSnapshot, input.teamNameSnapshot, input.officeLocationNameSnapshot]
    .filter(Boolean)
    .join(" | ") || "Not assigned";
}

export default function PayrollRunsWorkspace({ companyId, canManage }: Props) {
  const toast = useToast();
  const createDialog = useDisclosure();
  const inputDrawer = useDisclosure();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("all");
  const [periodKey, setPeriodKey] = useState(currentPeriodKey());
  const [reason, setReason] = useState("");
  const [source, setSource] = useState<PayrollSource | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [employeeInputs, setEmployeeInputs] = useState<PayrollEmployeeInput[]>([]);
  const [inputsLoading, setInputsLoading] = useState(false);
  const [inputPage, setInputPage] = useState(1);
  const [inputTotal, setInputTotal] = useState(0);
  const [inputTotalPages, setInputTotalPages] = useState(1);
  const [inputSearch, setInputSearch] = useState("");
  const [issueFilter, setIssueFilter] = useState("all");
  const [runInputView, setRunInputView] = useState<"attendance" | "one_time" | "snapshots" | "results" | "validation">("attendance");
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const subtle = useColorModeValue("gray.50", "whiteAlpha.50");

  const loadRuns = useCallback(async () => {
    if (!companyId || !canManage) return;
    setLoading(true);
    try {
      const { data } = await axios.get("/payroll/runs", {
        params: { companyId, page, limit: 20, status },
      });
      setRuns(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      toast({ title: "Unable to load payroll runs", description: message(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [canManage, companyId, page, status, toast]);

  const loadEmployeeInputs = useCallback(async (runId: string) => {
    setInputsLoading(true);
    try {
      const { data } = await axios.get(`/payroll/runs/${runId}/employee-inputs`, {
        params: {
          companyId,
          page: inputPage,
          limit: 25,
          search: inputSearch.trim(),
          issues: issueFilter,
        },
      });
      setSelectedRun(data.data?.run || null);
      setEmployeeInputs(data.data?.items || []);
      setInputTotal(data.pagination?.total || 0);
      setInputTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      toast({ title: "Unable to load payroll attendance inputs", description: message(error), status: "error" });
    } finally {
      setInputsLoading(false);
    }
  }, [companyId, inputPage, inputSearch, issueFilter, toast]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    if (!inputDrawer.isOpen || !selectedRun?._id) return;
    const timer = window.setTimeout(() => void loadEmployeeInputs(selectedRun._id), 250);
    return () => window.clearTimeout(timer);
  }, [inputDrawer.isOpen, selectedRun?._id, loadEmployeeInputs]);

  useEffect(() => {
    if (!createDialog.isOpen || !companyId || !/^\d{4}-\d{2}$/.test(periodKey)) {
      setSource(null);
      return;
    }
    let active = true;
    setSourceLoading(true);
    axios.get(`/payroll/runs/source/${periodKey}`, { params: { companyId } })
      .then(({ data }) => { if (active) setSource(data.data || null); })
      .catch((error) => {
        if (active) setSource({ periodKey, canCreate: false, blocker: message(error), input: null, existingRun: null });
      })
      .finally(() => { if (active) setSourceLoading(false); });
    return () => { active = false; };
  }, [companyId, createDialog.isOpen, periodKey]);

  const openCreate = () => {
    setPeriodKey(currentPeriodKey());
    setReason("");
    setSource(null);
    createDialog.onOpen();
  };

  const openInputs = (run: PayrollRun) => {
    setSelectedRun(run);
    setEmployeeInputs([]);
    setInputPage(1);
    setInputSearch("");
    setIssueFilter("all");
    setRunInputView("attendance");
    inputDrawer.onOpen();
  };

  const createRun = async () => {
    setSubmitting(true);
    try {
      const { data } = await axios.post("/payroll/runs", {
        companyId,
        periodKey,
        preparationReason: reason.trim(),
      });
      toast({ title: data.message || "Payroll run created", status: data.data?.status === "draft" ? "success" : "info" });
      createDialog.onClose();
      setPage(1);
      await loadRuns();
    } catch (error) {
      toast({ title: "Unable to create payroll run", description: message(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const prepareAttendanceInputs = async () => {
    if (!selectedRun) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/payroll/runs/${selectedRun._id}/prepare-attendance-inputs`, {
        companyId,
        expectedVersion: selectedRun.version,
      });
      setSelectedRun(data.data);
      toast({ title: data.message || "Attendance inputs imported", status: "success" });
      await Promise.all([loadRuns(), loadEmployeeInputs(selectedRun._id)]);
    } catch (error) {
      toast({ title: "Unable to import attendance inputs", description: message(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunChanged = useCallback((run: PayrollRun) => {
    setSelectedRun(run);
    void loadRuns();
  }, [loadRuns]);

  const summary = useMemo(() => ({
    draft: runs.filter((run) => run.status === "draft").length,
    active: runs.filter((run) => ["calculating", "review", "approved"].includes(run.status)).length,
    finalized: runs.filter((run) => run.status === "finalized").length,
  }), [runs]);

  if (!canManage) {
    return <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>You do not have permission to manage payroll runs.</AlertDescription></Alert>;
  }

  return (
    <Stack spacing={4}>
      <Alert status="info" borderRadius="md" alignItems="flex-start">
        <AlertIcon mt={1} />
        <AlertDescription>Create a run only after the matching cycle is locked under Attendance &gt; Payroll. The run snapshots that immutable attendance handoff.</AlertDescription>
      </Alert>

      <Flex bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4} gap={3} direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "center" }}>
        <Box><Text fontSize="lg" fontWeight="800">Payroll runs</Text><Text fontSize="sm" color={muted}>One auditable run per company payroll period.</Text></Box>
        <HStack>
          <Select value={status} maxW="190px" onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="all">All statuses</option><option value="draft">Draft</option><option value="calculating">Calculating</option><option value="review">Review</option><option value="approved">Approved</option><option value="finalized">Finalized</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option>
          </Select>
          <IconButton aria-label="Refresh payroll runs" icon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={() => void loadRuns()} />
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={openCreate}>New payroll run</Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>DRAFT ON THIS PAGE</Text><Text mt={1} fontSize="2xl" fontWeight="800">{summary.draft}</Text></Box>
        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>IN PROCESS ON THIS PAGE</Text><Text mt={1} fontSize="2xl" fontWeight="800">{summary.active}</Text></Box>
        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>FINALIZED ON THIS PAGE</Text><Text mt={1} fontSize="2xl" fontWeight="800">{summary.finalized}</Text></Box>
      </SimpleGrid>

      <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
        {loading ? <Stack p={4}>{[1, 2, 3].map((item) => <Skeleton key={item} h="62px" />)}</Stack> : runs.length === 0 ? (
          <Box py={14} textAlign="center"><Text fontWeight="700">No payroll runs yet</Text><Text mt={1} fontSize="sm" color={muted}>Lock an attendance payroll input, then create the first draft run.</Text></Box>
        ) : (
          <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Period</Th><Th>Attendance source</Th><Th>Employees</Th><Th>Payroll units</Th><Th>Status</Th><Th>Created</Th><Th textAlign="right">Action</Th></Tr></Thead><Tbody>
            {runs.map((run) => {
              const totals = run.attendanceTotals?.payroll || {};
              return <Tr key={run._id}>
                <Td><Text fontWeight="800">{run.periodKey}</Text><Text fontSize="xs" color={muted}>Run v{run.version}</Text></Td>
                <Td><Text>{run.cycleStartDate} to {run.cycleEndDate}</Text><Text fontSize="xs" color={muted}>Input v{run.attendancePayrollInputVersion} | Attendance v{run.attendancePeriodVersion}</Text></Td>
                <Td><Text fontWeight="700">{run.attendanceInputStatus === "prepared" ? run.employeeInputCount : run.attendanceSummaryCount}</Text><HStack mt={1}><Badge colorScheme={run.attendanceInputStatus === "prepared" ? "green" : "orange"}>{run.attendanceInputStatus === "prepared" ? "Imported" : "Import pending"}</Badge>{run.employeeInputIssueCount ? <Badge colorScheme="red">{run.employeeInputIssueCount} issue{run.employeeInputIssueCount === 1 ? "" : "s"}</Badge> : null}</HStack></Td>
                <Td><Text>{formatNumber(totals.paidDays)} paid | {formatNumber(totals.unpaidDays)} unpaid</Text><Text fontSize="xs" color={muted}>{formatNumber(totals.approvedOvertimeMinutes, 0)} approved OT minutes</Text></Td>
                <Td><Badge colorScheme={run.status === "finalized" ? "green" : run.status === "failed" ? "red" : run.status === "draft" ? "orange" : "blue"}>{run.status}</Badge>{run.calculationVersion ? <Text mt={1} fontSize="xs" color={run.calculationStatus === "stale" ? "orange.500" : muted}>{run.calculationStatus === "stale" ? "Calculation stale" : `Calculated v${run.calculationVersion}`}</Text> : null}</Td>
                <Td><Text>{creatorName(run)}</Text><Text fontSize="xs" color={muted}>{run.createdAt ? new Date(run.createdAt).toLocaleString() : "-"}</Text></Td>
                <Td textAlign="right"><IconButton aria-label={`Inspect ${run.periodKey} payroll attendance inputs`} title="Inspect attendance inputs" icon={<FiEye />} size="sm" variant="ghost" onClick={() => openInputs(run)} /></Td>
              </Tr>;
            })}
          </Tbody></Table></TableContainer>
        )}
        <Flex p={4} borderTopWidth="1px" borderColor={border} justify="space-between" align="center"><Text fontSize="sm" color={muted}>{total} payroll run{total === 1 ? "" : "s"}</Text><HStack><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack></Flex>
      </Box>

      <DashboardDrawer
        isOpen={inputDrawer.isOpen}
        onClose={inputDrawer.onClose}
        titlePrefix="Payroll"
        titleSuffix="run workspace"
        subtitle={selectedRun ? `${selectedRun.periodKey} | ${selectedRun.cycleStartDate} to ${selectedRun.cycleEndDate}` : "Attendance, one-time, and employee payroll inputs"}
        badgeLabel={selectedRun?.attendanceInputStatus === "prepared" ? "Imported" : "Pending"}
        maxW={{ base: "100%", md: "92%" }}
        footerContent={<Flex w="full" justify="flex-end"><Button variant="ghost" onClick={inputDrawer.onClose}>Close</Button></Flex>}
      >
        {!selectedRun ? <Skeleton h="120px" /> : <Stack spacing={5}>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>LOCKED SOURCE</Text><Text fontWeight="800">Input v{selectedRun.attendancePayrollInputVersion}</Text><Text fontSize="xs" color={muted}>Attendance v{selectedRun.attendancePeriodVersion}</Text></Box>
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>EMPLOYEE INPUTS</Text><Text fontWeight="800">{selectedRun.employeeInputCount || 0}</Text><Text fontSize="xs" color={muted}>{selectedRun.attendanceSummaryCount} current summaries</Text></Box>
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>CARRIED ADJUSTMENTS</Text><Text fontWeight="800">{selectedRun.attendanceAdjustmentCount}</Text><Text fontSize="xs" color={muted}>From locked prior corrections</Text></Box>
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>INPUT ISSUES</Text><Text fontWeight="800" color={selectedRun.employeeInputIssueCount ? "red.500" : undefined}>{selectedRun.employeeInputIssueCount || 0}</Text><Text fontSize="xs" color={muted}>Must be reviewed before calculation</Text></Box>
          </SimpleGrid>

          {selectedRun.attendanceInputStatus !== "prepared" ? (
            <Alert status="warning" borderRadius="md" alignItems="flex-start">
              <AlertIcon mt={1} />
              <Box flex="1"><Text fontWeight="700">Employee inputs have not been imported</Text><AlertDescription display="block" mt={1}>Import the locked payable days, loss-of-pay days, approved overtime, and carried attendance corrections. This uses the run&apos;s immutable attendance handoff and does not read live attendance records.</AlertDescription></Box>
              <Button ml={4} colorScheme="blue" isLoading={submitting} isDisabled={selectedRun.status !== "draft"} onClick={() => void prepareAttendanceInputs()}>Import attendance inputs</Button>
            </Alert>
          ) : (
            <Stack spacing={4}>
              <Flex gap={2} wrap="wrap" borderBottomWidth="1px" borderColor={border} pb={3}>
                <Button size="sm" colorScheme="blue" variant={runInputView === "attendance" ? "solid" : "ghost"} onClick={() => setRunInputView("attendance")}>Attendance inputs</Button>
                <Button size="sm" colorScheme="blue" variant={runInputView === "one_time" ? "solid" : "ghost"} onClick={() => setRunInputView("one_time")}>One-time inputs{selectedRun.oneTimeInputCount ? ` (${selectedRun.oneTimeInputCount})` : ""}</Button>
                <Button size="sm" colorScheme="blue" variant={runInputView === "snapshots" ? "solid" : "ghost"} onClick={() => setRunInputView("snapshots")}>Employee snapshots{selectedRun.employeeSnapshotStatus === "prepared" ? ` (v${selectedRun.employeeSnapshotVersion || 1})` : ""}</Button>
                <Button size="sm" colorScheme="blue" variant={runInputView === "results" ? "solid" : "ghost"} onClick={() => setRunInputView("results")}>Draft results{selectedRun.calculationVersion ? ` (v${selectedRun.calculationVersion})` : ""}</Button>
                <Button size="sm" colorScheme="blue" variant={runInputView === "validation" ? "solid" : "ghost"} onClick={() => setRunInputView("validation")}>Validation</Button>
              </Flex>
              {runInputView === "attendance" ? <Stack spacing={3}>
              <Flex gap={3} direction={{ base: "column", md: "row" }} justify="space-between">
                <Input maxW={{ md: "340px" }} value={inputSearch} placeholder="Search employee name or code" onChange={(event) => { setInputSearch(event.target.value); setInputPage(1); }} />
                <HStack><Select value={issueFilter} maxW="190px" onChange={(event) => { setIssueFilter(event.target.value); setInputPage(1); }}><option value="all">All inputs</option><option value="with_issues">With issues</option><option value="clean">No issues</option></Select><IconButton aria-label="Refresh employee inputs" icon={<FiRefreshCw />} variant="outline" isLoading={inputsLoading} onClick={() => void loadEmployeeInputs(selectedRun._id)} /></HStack>
              </Flex>

              <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
                {inputsLoading ? <Stack p={4}>{[1, 2, 3].map((item) => <Skeleton key={item} h="64px" />)}</Stack> : employeeInputs.length === 0 ? <Box py={12} textAlign="center"><Text fontWeight="700">No employee inputs match</Text><Text mt={1} fontSize="sm" color={muted}>Change the search or issue filter.</Text></Box> : (
                  <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Employee</Th><Th>Department / team / location</Th><Th>Current attendance</Th><Th>Adjustments</Th><Th>Payroll input</Th><Th>Issues</Th></Tr></Thead><Tbody>{employeeInputs.map((input) => <Tr key={input._id}>
                    <Td><Text fontWeight="700">{input.employeeNameSnapshot}</Text><Text fontSize="xs" color={muted}>{input.employeeCodeSnapshot}{input.designationSnapshot ? ` | ${input.designationSnapshot}` : ""}</Text></Td>
                    <Td><Text maxW="260px" whiteSpace="normal">{organization(input)}</Text></Td>
                    <Td><Text>{formatNumber(input.currentAttendance.paidDays)} paid | {formatNumber(input.currentAttendance.unpaidDays)} LOP</Text><Text fontSize="xs" color={muted}>{formatNumber(input.currentAttendance.approvedOvertimeMinutes, 0)} approved OT minutes</Text></Td>
                    <Td><Text>{signedNumber(input.attendanceAdjustments.paidDays)} paid | {signedNumber(input.attendanceAdjustments.unpaidDays)} LOP</Text><Text fontSize="xs" color={muted}>{signedNumber(input.attendanceAdjustments.approvedOvertimeMinutes)} OT minutes{input.adjustmentSourcePeriods?.length ? ` | ${input.adjustmentSourcePeriods.join(", ")}` : ""}</Text></Td>
                    <Td><Text fontWeight="700">{formatNumber(input.payrollAttendance.paidDays)} paid | {formatNumber(input.payrollAttendance.unpaidDays)} LOP</Text><Text fontSize="xs" color={muted}>{formatNumber(input.payrollAttendance.approvedOvertimeMinutes, 0)} approved OT minutes</Text></Td>
                    <Td>{input.hasIssues ? <Stack align="start" spacing={1}>{input.inputIssues?.map((issue) => <Badge key={issue} colorScheme="red">{issue.replaceAll("_", " ")}</Badge>)}</Stack> : <Badge colorScheme="green">Ready</Badge>}</Td>
                  </Tr>)}</Tbody></Table></TableContainer>
                )}
                <Flex p={4} borderTopWidth="1px" borderColor={border} justify="space-between" align="center"><Text fontSize="sm" color={muted}>{inputTotal} employee input{inputTotal === 1 ? "" : "s"}</Text><HStack><Button size="sm" variant="outline" isDisabled={inputPage <= 1 || inputsLoading} onClick={() => setInputPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{inputPage} / {inputTotalPages}</Text><Button size="sm" variant="outline" isDisabled={inputPage >= inputTotalPages || inputsLoading} onClick={() => setInputPage((value) => value + 1)}>Next</Button></HStack></Flex>
              </Box>
              </Stack> : runInputView === "one_time" ? <PayrollOneTimeInputsPanel companyId={companyId} run={selectedRun} onRunChanged={handleRunChanged} /> : runInputView === "snapshots" ? <PayrollEmployeeSnapshotsPanel companyId={companyId} run={selectedRun} onRunChanged={handleRunChanged} /> : runInputView === "results" ? <PayrollDraftResultsPanel companyId={companyId} run={selectedRun} onRunChanged={handleRunChanged} /> : <PayrollValidationPanel companyId={companyId} run={selectedRun} onRunChanged={handleRunChanged} />}
            </Stack>
          )}
        </Stack>}
      </DashboardDrawer>

      <Modal isOpen={createDialog.isOpen} onClose={createDialog.onClose} isCentered size="lg">
        <ModalOverlay /><ModalContent><ModalHeader>New payroll run</ModalHeader><ModalCloseButton />
          <ModalBody><Stack spacing={5}>
            <FormControl isRequired><FormLabel>Payroll period</FormLabel><Input type="month" value={periodKey} onChange={(event) => setPeriodKey(event.target.value)} /><FormHelperText>Select the payroll label whose attendance input has been locked.</FormHelperText></FormControl>
            {sourceLoading ? <Skeleton h="105px" borderRadius="md" /> : source?.input ? (
              <Box borderWidth="1px" borderColor={source.canCreate ? "green.300" : border} borderRadius="md" p={4}>
                <HStack justify="space-between"><Text fontWeight="800">Locked attendance input</Text><Badge colorScheme={source.canCreate ? "green" : "orange"}>v{source.input.version}</Badge></HStack>
                <Text mt={2} fontSize="sm">{source.input.cycleStartDate} to {source.input.cycleEndDate} | {source.input.summaryCount} employees</Text>
                <Text mt={1} fontSize="xs" color={muted}>Attendance version {source.input.attendancePeriodVersion} | {source.input.adjustmentCount} carried adjustments</Text>
                {source.blocker ? <Text mt={2} fontSize="sm" color="orange.500">{source.blocker}</Text> : null}
              </Box>
            ) : source?.blocker ? <Alert status="warning"><AlertIcon /><AlertDescription>{source.blocker}</AlertDescription></Alert> : null}
            <FormControl isRequired><FormLabel>Preparation reason</FormLabel><Textarea value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="Example: Prepare the September 2026 monthly payroll" /><FormHelperText>Minimum 3 characters. Stored permanently in payroll audit history.</FormHelperText></FormControl>
          </Stack></ModalBody>
          <ModalFooter gap={3}><Button variant="ghost" onClick={createDialog.onClose}>Cancel</Button><Button colorScheme="blue" isLoading={submitting} isDisabled={!source?.canCreate || reason.trim().length < 3} onClick={() => void createRun()}>Create draft run</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
