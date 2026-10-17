"use client";

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
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
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
import { FiDownload, FiRefreshCw } from "react-icons/fi";

type Props = { companyId: string };
type ReportType = "register" | "variance" | "cost" | "deductions" | "departments";

const REPORTS: Array<{ value: ReportType; label: string; description: string }> = [
  { value: "register", label: "Payroll register", description: "Employee-level finalized earnings, deductions, reimbursements, and net pay." },
  { value: "variance", label: "Variance", description: "Employee changes against the previous finalized payroll period." },
  { value: "cost", label: "Location cost", description: "Employer cost grouped by frozen office location." },
  { value: "deductions", label: "Deductions", description: "Recurring, one-time, and statutory employee deductions." },
  { value: "departments", label: "Department cost", description: "Payroll totals grouped by frozen department." },
];

function errorMessage(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || "Request failed";
}

function money(value: unknown, currency: string, minorUnits: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: minorUnits, maximumFractionDigits: minorUnits })
    .format(Number(value || 0) / 10 ** minorUnits);
}

function reportColumns(type: ReportType) {
  if (type === "register") return ["Employee", "Work assignment", "Paid / unpaid", "Gross", "Deductions", "Reimbursements", "Net pay", "Employer cost"];
  if (type === "variance") return ["Employee", "Previous period", "Gross change", "Deduction change", "Net change", "Cost change"];
  if (type === "deductions") return ["Deduction", "Source", "Employees", "Amount"];
  return [type === "cost" ? "Location" : "Department", "Employees", "Gross", "Deductions", "Net pay", "Employer contributions", "Employer cost"];
}

export default function PayrollReportsWorkspace({ companyId }: Props) {
  const toast = useToast();
  const [runs, setRuns] = useState<any[]>([]);
  const [runId, setRunId] = useState("");
  const [type, setType] = useState<ReportType>("register");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  useEffect(() => {
    if (!companyId) return;
    axios.get("/payroll/runs", { params: { companyId, status: "finalized", page: 1, limit: 100 } })
      .then(({ data }) => {
        const items = data.data || [];
        setRuns(items);
        setRunId((current) => current || items[0]?._id || "");
      })
      .catch((error) => toast({ title: "Unable to load finalized payroll runs", description: errorMessage(error), status: "error" }));
  }, [companyId, toast]);

  const load = useCallback(async () => {
    if (!companyId || !runId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/payroll/reports/${type}`, {
        params: { companyId, runId, page, limit: 25, search: ["register", "variance"].includes(type) ? search : undefined },
      });
      setReport(data.data);
    } catch (error) {
      setReport(null);
      toast({ title: "Unable to load payroll report", description: errorMessage(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, page, runId, search, toast, type]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const selectedDefinition = REPORTS.find((item) => item.value === type)!;
  const currency = report?.source?.currency || "INR";
  const minorUnits = Number(report?.source?.currencyMinorUnits ?? 2);
  const rows = report?.items || [];
  const pagination = report?.pagination || { page: 1, totalPages: 1, total: 0 };

  const summaryCards = useMemo(() => [
    { label: "Employees", value: Number(report?.summary?.employeeCount || 0).toLocaleString("en-IN") },
    { label: "Gross earnings", value: money(report?.summary?.grossEarningsMinor, currency, minorUnits) },
    { label: "Total deductions", value: money(report?.summary?.totalDeductionsMinor, currency, minorUnits) },
    { label: "Employer cost", value: money(report?.summary?.employerCostMinor, currency, minorUnits) },
  ], [currency, minorUnits, report]);

  const download = async () => {
    if (!runId) return;
    setExporting(true);
    try {
      const response = await axios.get(`/payroll/reports/${type}/export`, {
        params: { companyId, runId, search: ["register", "variance"].includes(type) ? search : undefined, purpose: "Payroll review" },
        responseType: "blob",
      });
      const disposition = String(response.headers["content-disposition"] || "");
      const matched = disposition.match(/filename="([^"]+)"/);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = matched?.[1] || `payroll-${type}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Unable to export payroll report", description: errorMessage(error), status: "error" });
    } finally {
      setExporting(false);
    }
  };

  const rowCells = (row: any) => {
    if (type === "register") return <>
      <Td><Text fontWeight="700">{row.employeeName}</Text><Text fontSize="xs" color={muted}>{row.employeeCode} | {row.designation || "No designation"}</Text></Td>
      <Td>{row.department}<Text fontSize="xs" color={muted}>{row.team} | {row.location}</Text></Td>
      <Td>{row.paidDays} / {row.unpaidDays}</Td>
      <Td isNumeric>{money(row.grossEarningsMinor, currency, minorUnits)}</Td>
      <Td isNumeric>{money(row.totalDeductionsMinor, currency, minorUnits)}</Td>
      <Td isNumeric>{money(row.totalReimbursementsMinor, currency, minorUnits)}</Td>
      <Td isNumeric fontWeight="700">{money(row.netPayMinor, currency, minorUnits)}</Td>
      <Td isNumeric>{money(row.employerCostMinor, currency, minorUnits)}</Td>
    </>;
    if (type === "variance") return <>
      <Td><Text fontWeight="700">{row.employeeName}</Text><Text fontSize="xs" color={muted}>{row.employeeCode}</Text></Td>
      <Td>{report?.source?.previousPeriodKey || "No prior payroll"}<Text fontSize="xs" color={muted}>{row.comparisonAvailable ? "Matched employee" : "New in this period"}</Text></Td>
      <Td isNumeric color={row.grossVarianceMinor < 0 ? "red.500" : undefined}>{money(row.grossVarianceMinor, currency, minorUnits)}</Td>
      <Td isNumeric>{money(row.deductionVarianceMinor, currency, minorUnits)}</Td>
      <Td isNumeric fontWeight="700" color={row.netVarianceMinor < 0 ? "red.500" : undefined}>{money(row.netVarianceMinor, currency, minorUnits)}</Td>
      <Td isNumeric>{money(row.employerCostVarianceMinor, currency, minorUnits)}</Td>
    </>;
    if (type === "deductions") return <>
      <Td><Text fontWeight="700">{row.name}</Text><Text fontSize="xs" color={muted}>{row.code}</Text></Td>
      <Td><Badge>{row.source}</Badge></Td><Td isNumeric>{row.employeeCount}</Td><Td isNumeric fontWeight="700">{money(row.amountMinor, currency, minorUnits)}</Td>
    </>;
    return <>
      <Td fontWeight="700">{row.label}</Td><Td isNumeric>{row.employeeCount}</Td>
      <Td isNumeric>{money(row.grossEarningsMinor, currency, minorUnits)}</Td><Td isNumeric>{money(row.totalDeductionsMinor, currency, minorUnits)}</Td>
      <Td isNumeric>{money(row.netPayMinor, currency, minorUnits)}</Td><Td isNumeric>{money(row.employerContributionsMinor, currency, minorUnits)}</Td>
      <Td isNumeric fontWeight="700">{money(row.employerCostMinor, currency, minorUnits)}</Td>
    </>;
  };

  return <Stack spacing={5}>
    <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
      <Flex gap={4} align={{ base: "stretch", lg: "end" }} direction={{ base: "column", lg: "row" }}>
        <FormControl maxW={{ lg: "260px" }}><FormLabel>Finalized payroll</FormLabel><Select value={runId} onChange={(event) => { setRunId(event.target.value); setPage(1); }}>{runs.map((run) => <option key={run._id} value={run._id}>{run.periodKey} | version {run.finalizationVersion}</option>)}</Select></FormControl>
        <FormControl maxW={{ lg: "260px" }}><FormLabel>Report</FormLabel><Select value={type} onChange={(event) => { setType(event.target.value as ReportType); setPage(1); }}>{REPORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></FormControl>
        {["register", "variance"].includes(type) ? <FormControl maxW={{ lg: "280px" }}><FormLabel>Employee search</FormLabel><Input value={search} placeholder="Name, code, department..." onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></FormControl> : null}
        <Button leftIcon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={() => void load()}>Refresh</Button>
        <Button leftIcon={<FiDownload />} colorScheme="blue" isLoading={exporting} isDisabled={!runId || !report} onClick={() => void download()}>Export CSV</Button>
      </Flex>
      <Text mt={3} fontSize="sm" color={muted}>{selectedDefinition.description} Reports always use the selected immutable finalization version.</Text>
    </Box>

    {!runs.length ? <Alert status="info"><AlertIcon /><AlertDescription>Finalize a payroll run before using payroll reports.</AlertDescription></Alert> : null}
    {loading && !report ? <Skeleton h="320px" borderRadius="md" /> : null}
    {report ? <>
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>{summaryCards.map((item) => <Stat key={item.label} bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}><StatLabel>{item.label}</StatLabel><StatNumber fontSize="xl">{item.value}</StatNumber></Stat>)}</SimpleGrid>
      <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
        <Flex p={4} justify="space-between" align="center"><Box><Text fontWeight="800">{selectedDefinition.label}</Text><Text fontSize="sm" color={muted}>{pagination.total} row(s) | {report.source.periodKey} | finalization v{report.source.finalizationVersion}</Text></Box></Flex>
        <TableContainer><Table size="sm"><Thead><Tr>{reportColumns(type).map((column, index) => <Th key={column} isNumeric={index >= (type === "register" ? 2 : type === "variance" ? 2 : type === "deductions" ? 2 : 1)}>{column}</Th>)}</Tr></Thead><Tbody>
          {rows.map((row: any, index: number) => <Tr key={row.employeeId || row.key || `${row.code}-${index}`}>{rowCells(row)}</Tr>)}
          {!rows.length ? <Tr><Td colSpan={reportColumns(type).length}><Text py={6} textAlign="center" color={muted}>No report rows match this scope.</Text></Td></Tr> : null}
        </Tbody></Table></TableContainer>
        <Flex p={3} borderTopWidth="1px" borderColor={border} justify="flex-end" align="center" gap={3}><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{pagination.page} / {pagination.totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></Flex>
      </Box>
    </> : null}
  </Stack>;
}
