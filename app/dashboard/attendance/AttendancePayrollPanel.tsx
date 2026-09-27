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
  FormControl,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FiDownload, FiLock, FiRefreshCw } from "react-icons/fi";
import {
  AttendancePayrollView,
  downloadAttendancePayroll,
  fetchAttendancePayroll,
  lockAttendancePayroll,
  updateAttendancePayrollSettings,
} from "./attendanceAdminApi";

const currentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};
const formatMinutes = (value: number) => `${Math.floor(Number(value || 0) / 60)}h ${Number(value || 0) % 60}m`;

export default function AttendancePayrollPanel() {
  const toast = useToast();
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const [periodKey, setPeriodKey] = useState(currentPeriod);
  const [view, setView] = useState<AttendancePayrollView | null>(null);
  const [cutoffDay, setCutoffDay] = useState("31");
  const [page, setPage] = useState(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const load = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchAttendancePayroll(periodKey, page, controller.signal)
      .then((result) => {
        setView(result);
        setCutoffDay(String(result.settings.attendanceCutoffDay));
      })
      .catch((requestError: any) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(requestError?.response?.data || requestError, "Could not load payroll attendance"));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, periodKey]);
  useEffect(() => load(), [load, revision]);
  useEffect(() => setPage(1), [periodKey]);

  const lockInput = async () => {
    if (!view || reason.trim().length < 3) return;
    setSaving(true);
    try {
      const result = await lockAttendancePayroll(periodKey, reason.trim(), view.period.version);
      setView(result);
      setReason("");
      toast({ title: "Payroll attendance input locked", status: "success" });
    } catch (requestError: any) {
      toast({ title: "Payroll input was not locked", description: getApiErrorMessage(requestError?.response?.data || requestError), status: "error", duration: 7000 });
      setRevision((value) => value + 1);
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    const value = Number(cutoffDay);
    if (!Number.isInteger(value) || value < 1 || value > 31) return;
    setSavingSettings(true);
    try {
      await updateAttendancePayrollSettings(value);
      setPage(1);
      setRevision((current) => current + 1);
      toast({ title: "Attendance cutoff updated", status: "success" });
    } catch (requestError: any) {
      toast({
        title: "Attendance cutoff was not updated",
        description: getApiErrorMessage(requestError?.response?.data || requestError),
        status: "error",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const exportInput = async (format: "csv" | "xlsx") => {
    setExporting(true);
    try {
      await downloadAttendancePayroll(periodKey, format, view?.latestInput?.version);
    } catch (requestError: any) {
      toast({ title: "Payroll file could not be downloaded", description: getApiErrorMessage(requestError?.response?.data || requestError), status: "error" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Stack spacing={5}>
      <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3} direction={{ base: "column", md: "row" }}>
        <Box><Text fontSize="2xl" fontWeight="800">Payroll attendance</Text><Text fontSize="sm" color={muted}>Prepare attendance by company cutoff, lock immutable inputs, and carry later corrections forward.</Text></Box>
        <HStack><Input type="month" value={periodKey} onChange={(event) => setPeriodKey(event.target.value)} maxW="180px" /><Button leftIcon={<FiRefreshCw />} variant="outline" onClick={() => setRevision((value) => value + 1)}>Refresh</Button></HStack>
      </Flex>

      {loading && !view ? <Stack><Skeleton h="100px" /><Skeleton h="240px" /></Stack> : null}
      {error ? <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert> : null}
      {view ? <>
        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
          <Flex gap={4} align={{ base: "stretch", md: "flex-end" }} direction={{ base: "column", md: "row" }}>
            <FormControl maxW={{ md: "240px" }}>
              <FormLabel>Attendance cutoff day</FormLabel>
              <Input
                type="number"
                min={1}
                max={31}
                value={cutoffDay}
                onChange={(event) => setCutoffDay(event.target.value)}
              />
            </FormControl>
            <Button
              colorScheme="blue"
              variant="outline"
              onClick={saveSettings}
              isLoading={savingSettings}
              isDisabled={
                !Number.isInteger(Number(cutoffDay)) ||
                Number(cutoffDay) < 1 ||
                Number(cutoffDay) > 31 ||
                Number(cutoffDay) === view.settings.attendanceCutoffDay
              }
            >
              Save cutoff
            </Button>
            <Box>
              <Text fontSize="sm" fontWeight="700">{periodKey} payroll cycle</Text>
              <Text fontSize="sm" color={muted}>{view.cycle.startDate} to {view.cycle.endDate}</Text>
            </Box>
          </Flex>
          <Text mt={2} fontSize="xs" color={muted}>Use 31 for the last calendar day. A cutoff of 25 creates a cycle from the day after the previous cutoff through the 25th.</Text>
        </Box>

        <Alert status={view.period.status === "locked" ? "success" : "warning"} borderRadius="md">
          <AlertIcon /><AlertDescription>{view.period.status === "locked" ? `Attendance cycle ${view.cycle.startDate} to ${view.cycle.endDate} is locked at version ${view.period.version}. ${view.canLock ? "It is ready for payroll handoff." : "This cycle has already been handed off or has no summaries. Later corrections are carried to a future payroll run."}` : `Process and finalize attendance from ${view.cycle.startDate} through ${view.cycle.endDate}, then lock that attendance cycle before creating payroll input.`}</AlertDescription>
        </Alert>

        <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3}>
          {[
            ["Employees", view.pagination.total],
            ["Snapshot", view.summaryVersion ? `v${view.summaryVersion}` : "None"],
            ["Payroll input", view.latestInput ? `v${view.latestInput.version}` : "Not locked"],
            ["Pending adjustments", view.pendingAdjustments.length],
          ].map(([label, value]) => <Box key={String(label)} bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted} fontWeight="700">{label}</Text><Text fontSize="xl" fontWeight="800">{value}</Text></Box>)}
        </SimpleGrid>

        {view.latestInput ? (
          <Flex bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4} justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3} direction={{ base: "column", md: "row" }}>
            <Box><HStack><Text fontWeight="750">Locked payroll input v{view.latestInput.version}</Text><Badge colorScheme="green">Immutable</Badge></HStack><Text fontSize="sm" color={muted}>{view.latestInput.cycleStartDate || view.cycle.startDate} to {view.latestInput.cycleEndDate || view.cycle.endDate} | {new Date(view.latestInput.lockedAt).toLocaleString()} by {view.latestInput.lockedBy?.name || "User"} | Attendance snapshot v{view.latestInput.attendancePeriodVersion}</Text><Text fontSize="sm" mt={1}>{view.latestInput.reason}</Text></Box>
            <HStack><Button leftIcon={<FiDownload />} variant="outline" isLoading={exporting} onClick={() => exportInput("csv")}>CSV</Button><Button leftIcon={<FiDownload />} colorScheme="blue" isLoading={exporting} onClick={() => exportInput("xlsx")}>XLSX</Button></HStack>
          </Flex>
        ) : null}

        {view.canLock ? (
          <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
            <FormControl isRequired><FormLabel>Payroll handoff reason</FormLabel><Textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} placeholder="Confirm attendance review and payroll handoff" /><Text mt={1} fontSize="xs" color={muted}>This locks a new immutable payroll input for the displayed cycle. Later attendance corrections become adjustments in the next unlocked payroll cycle.</Text></FormControl>
            <Flex justify="flex-end" mt={3}><Button leftIcon={<FiLock />} colorScheme="blue" isLoading={saving} isDisabled={reason.trim().length < 3} onClick={lockInput}>Lock payroll input</Button></Flex>
          </Box>
        ) : null}

        {view.pendingAdjustments.length ? (
          <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontWeight="750" mb={2}>Corrections carried into this payroll run</Text><Stack spacing={2}>{view.pendingAdjustments.slice(0, 10).map((item) => <Flex key={item._id} justify="space-between" gap={3}><Box><Text fontSize="sm" fontWeight="700">{item.employeeNameSnapshot} ({item.employeeCodeSnapshot})</Text><Text fontSize="xs" color={muted}>Corrected attendance from {item.sourcePeriodKey}</Text></Box><Text fontSize="sm">Paid {Number(item.deltas.paidDays || 0) >= 0 ? "+" : ""}{item.deltas.paidDays || 0} | OT {Number(item.deltas.approvedOvertimeMinutes || 0) >= 0 ? "+" : ""}{item.deltas.approvedOvertimeMinutes || 0}m</Text></Flex>)}</Stack></Box>
        ) : null}

        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          <Box overflowX="auto"><Table size="sm" minW="1000px"><Thead><Tr><Th>Employee</Th><Th>Work assignment</Th><Th isNumeric>Payable days</Th><Th isNumeric>LOP days</Th><Th isNumeric>Absent</Th><Th>Worked</Th><Th>Approved OT</Th><Th isNumeric>Exceptions</Th></Tr></Thead><Tbody>{view.summaries.map((item) => <Tr key={item._id || item.employee}><Td><Text fontWeight="700">{item.employeeNameSnapshot}</Text><Text fontSize="xs" color={muted}>{item.employeeCodeSnapshot}</Text></Td><Td><Text>{item.departmentNameSnapshot || "Not assigned"}</Text><Text fontSize="xs" color={muted}>{[item.teamNameSnapshot, item.officeLocationNameSnapshot].filter(Boolean).join(" | ")}</Text></Td><Td isNumeric>{item.paidDays}</Td><Td isNumeric>{item.unpaidDays}</Td><Td isNumeric>{item.absentDays}</Td><Td>{formatMinutes(item.workedMinutes)}</Td><Td>{formatMinutes(item.approvedOvertimeMinutes)}</Td><Td isNumeric><Badge colorScheme={item.exceptionCount ? "orange" : "green"}>{item.exceptionCount}</Badge></Td></Tr>)}</Tbody></Table></Box>
          {!view.summaries.length ? <Box py={12} textAlign="center"><Text fontWeight="700">No locked attendance-cycle summaries are available.</Text></Box> : null}
          <Flex px={4} py={3} borderTopWidth="1px" borderColor={border} justify="space-between"><Text fontSize="sm" color={muted}>{view.pagination.total} employees</Text><HStack><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {view.pagination.totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= view.pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack></Flex>
        </Box>

        {view.history.length ? <Box><Text fontWeight="750" mb={2}>Payroll handoff history</Text><Stack spacing={0} borderWidth="1px" borderColor={border} borderRadius="md">{view.history.map((item) => <Flex key={item._id} px={4} py={3} borderBottomWidth="1px" borderColor={border} justify="space-between"><Box><Text fontSize="sm" fontWeight="700">Payroll v{item.version} from attendance v{item.attendancePeriodVersion}</Text><Text fontSize="xs" color={muted}>{item.reason}</Text></Box><Text fontSize="xs" color={muted}>{new Date(item.lockedAt).toLocaleString()}</Text></Flex>)}</Stack></Box> : null}
      </> : null}
    </Stack>
  );
}
