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
  HStack,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
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

type PayrollRun = {
  _id: string;
  periodKey: string;
  cycleStartDate: string;
  cycleEndDate: string;
  status: string;
  currency: string;
  currencyMinorUnits: number;
  finalizationVersion: number;
  finalizedAt?: string;
  statutoryEnabledModules?: string[];
};

type ReportModule = {
  key: string;
  label: string;
  employeeCount: number;
  employeeDeductionMinor: number;
  employerContributionMinor: number;
  registrationConfigured: boolean;
  missingIdentifierCount: number;
  registerReady: boolean;
  blockers: string[];
};

type ReportLine = {
  moduleKey: string;
  code: string;
  name: string;
  side: string;
  employeeCount: number;
  wageBaseMinor: number;
  amountMinor: number;
  ruleVersion: string;
  ruleEffectiveFrom: string;
};

type Report = {
  source: { finalizationVersion: number; finalizedAt?: string; providerKey: string; providerImplementationVersion: string; statutoryProfileVersionNumber: number };
  scope: string;
  employeeCount: number;
  employeeDeductionMinor: number;
  employerContributionMinor: number;
  modules: ReportModule[];
  lines: ReportLine[];
};

type ReportEmployee = {
  _id: string;
  identity: { name?: string; code?: string; username?: string };
  organization: { departmentName?: string; teamName?: string; officeLocationName?: string; officeLocationState?: string };
  identifiers: { panMasked?: string; uanMasked?: string; pfMemberIdMasked?: string; esiInsuranceNumberMasked?: string };
  contributions: Array<{ code: string; name: string; side: string; amountMinor: number; ruleVersion: string }>;
};

type EpfoEcrFiling = {
  adapter: { key: string; version: string; fieldCount: number };
  source: { periodKey: string; finalizationVersion: number; providerImplementationVersion: string; providentFundEstablishmentCode: string; contributionRate: string };
  ready: boolean;
  employeeCount: number;
  blockers: Array<{ code: string; message: string; employeeCode?: string; employeeName?: string }>;
  rows: Array<{ employeeCode: string; employeeName: string; uanMasked: string; grossWages: number; epfWages: number; epsWages: number; employeePfContribution: number; employerEpsContribution: number; employerPfContribution: number; ncpDays: number }>;
};

type EsicMonthlyRow = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  insuranceNumberMasked: string;
  paidDays: number;
  totalMonthlyWages: number;
  reasonCode: number | null;
  reasonLabel: string;
  lastWorkingDay: string;
  reasonSource: "none" | "employment_exit" | "manual" | "missing";
  employeeContribution: number;
  employerContribution: number;
  inputRevision: number | null;
};

type EsicMonthlyFiling = {
  adapter: { key: string; version: string; fieldCount: number };
  source: { periodKey: string; finalizationVersion: number; providerImplementationVersion: string; employeeStateInsuranceCode: string };
  ready: boolean;
  employeeCount: number;
  zeroWageEmployeeCount: number;
  employeeContributionTotal: number;
  employerContributionTotal: number;
  reasonCodes: Array<{ code: number; label: string; requiresLastWorkingDay: boolean }>;
  blockers: Array<{ code: string; message: string; employeeCode?: string; employeeName?: string }>;
  rows: EsicMonthlyRow[];
};

const MODULES = [
  { value: "all", label: "All statutory modules" },
  { value: "provident_fund", label: "Provident fund" },
  { value: "employee_state_insurance", label: "Employee State Insurance" },
  { value: "professional_tax", label: "Professional tax" },
  { value: "labour_welfare_fund", label: "Labour welfare fund" },
  { value: "income_tax_withholding", label: "Income-tax withholding" },
];

function errorMessage(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || "Request failed";
}

function formatMoney(value: unknown, currency = "INR", minorUnits = 2) {
  const amount = Number(value || 0) / 10 ** minorUnits;
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: minorUnits }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(minorUnits)}`;
  }
}

function organization(employee: ReportEmployee) {
  return [employee.organization.departmentName, employee.organization.teamName, employee.organization.officeLocationName]
    .filter(Boolean)
    .join(" | ") || "Not assigned";
}

function maskedIdentifiers(employee: ReportEmployee) {
  return [
    employee.identifiers.panMasked && `PAN ${employee.identifiers.panMasked}`,
    employee.identifiers.uanMasked && `UAN ${employee.identifiers.uanMasked}`,
    employee.identifiers.esiInsuranceNumberMasked && `ESI ${employee.identifiers.esiInsuranceNumberMasked}`,
  ].filter(Boolean).join(" | ") || "No filing identifiers";
}

export default function StatutoryReportsWorkspace({ companyId }: { companyId: string }) {
  const toast = useToast();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [runId, setRunId] = useState("");
  const [version, setVersion] = useState(1);
  const [module, setModule] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [items, setItems] = useState<ReportEmployee[]>([]);
  const [epfoEcr, setEpfoEcr] = useState<EpfoEcrFiling | null>(null);
  const [esicMonthly, setEsicMonthly] = useState<EsicMonthlyFiling | null>(null);
  const [esicDrafts, setEsicDrafts] = useState<Record<string, { reasonCode: string; lastWorkingDay: string }>>({});
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loadingEcr, setLoadingEcr] = useState(false);
  const [downloadingEcr, setDownloadingEcr] = useState(false);
  const [loadingEsic, setLoadingEsic] = useState(false);
  const [downloadingEsic, setDownloadingEsic] = useState(false);
  const [savingEsicEmployeeId, setSavingEsicEmployeeId] = useState("");
  const border = useColorModeValue("gray.200", "gray.700");
  const subtle = useColorModeValue("gray.50", "whiteAlpha.50");
  const muted = useColorModeValue("gray.600", "gray.400");
  const selectedRun = useMemo(() => runs.find((run) => run._id === runId) || null, [runId, runs]);
  const moduleOptions = useMemo(() => {
    const enabled = new Set(selectedRun?.statutoryEnabledModules || []);
    return MODULES.filter((item) => item.value === "all" || enabled.has(item.value));
  }, [selectedRun]);
  const currency = selectedRun?.currency || "INR";
  const minorUnits = Number(selectedRun?.currencyMinorUnits ?? 2);

  const loadRuns = useCallback(async () => {
    if (!companyId) return;
    setLoadingRuns(true);
    try {
      const { data } = await axios.get("/payroll/runs", { params: { companyId, status: "all", page: 1, limit: 100 } });
      const finalized = (data.data || []).filter((run: PayrollRun) => Number(run.finalizationVersion || 0) > 0);
      setRuns(finalized);
      setRunId((current) => current && finalized.some((run: PayrollRun) => run._id === current) ? current : finalized[0]?._id || "");
    } catch (error) {
      toast({ title: "Unable to load finalized payroll runs", description: errorMessage(error), status: "error" });
    } finally {
      setLoadingRuns(false);
    }
  }, [companyId, toast]);

  useEffect(() => { void loadRuns(); }, [loadRuns]);

  useEffect(() => {
    if (!selectedRun) return;
    setVersion(Number(selectedRun.finalizationVersion || 1));
    setModule((current) => current === "all" || selectedRun.statutoryEnabledModules?.includes(current) ? current : "all");
    setPage(1);
  }, [selectedRun]);

  const loadReport = useCallback(async () => {
    if (!companyId || !runId) {
      setReport(null);
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(`/payroll/runs/${runId}/statutory-report`, {
        params: { companyId, finalizationVersion: version, module, page, limit: 25, search: search.trim() },
      });
      setReport(data.data?.report || null);
      setItems(data.data?.items || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      setReport(null);
      setItems([]);
      toast({ title: "Unable to load statutory report", description: errorMessage(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, module, page, runId, search, toast, version]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReport(), 250);
    return () => window.clearTimeout(timer);
  }, [loadReport]);

  const loadEpfoEcr = useCallback(async () => {
    if (!companyId || !runId || !selectedRun?.statutoryEnabledModules?.includes("provident_fund")) {
      setEpfoEcr(null);
      return;
    }
    setLoadingEcr(true);
    try {
      const { data } = await axios.get(`/payroll/runs/${runId}/statutory-filings/epfo-ecr`, {
        params: { companyId, finalizationVersion: version },
      });
      setEpfoEcr(data.data || null);
    } catch (error) {
      setEpfoEcr(null);
      toast({ title: "Unable to check EPFO ECR readiness", description: errorMessage(error), status: "error" });
    } finally {
      setLoadingEcr(false);
    }
  }, [companyId, runId, selectedRun, toast, version]);

  useEffect(() => { void loadEpfoEcr(); }, [loadEpfoEcr]);

  const loadEsicMonthly = useCallback(async () => {
    if (!companyId || !runId || !selectedRun?.statutoryEnabledModules?.includes("employee_state_insurance")) {
      setEsicMonthly(null);
      setEsicDrafts({});
      return;
    }
    setLoadingEsic(true);
    try {
      const { data } = await axios.get(`/payroll/runs/${runId}/statutory-filings/esic-monthly`, {
        params: { companyId, finalizationVersion: version },
      });
      const filing = data.data as EsicMonthlyFiling;
      setEsicMonthly(filing || null);
      setEsicDrafts(Object.fromEntries((filing?.rows || []).map((row) => [row.employeeId, {
        reasonCode: row.reasonCode ? String(row.reasonCode) : "",
        lastWorkingDay: row.lastWorkingDay || "",
      }])));
    } catch (error) {
      setEsicMonthly(null);
      setEsicDrafts({});
      toast({ title: "Unable to check ESIC filing readiness", description: errorMessage(error), status: "error" });
    } finally {
      setLoadingEsic(false);
    }
  }, [companyId, runId, selectedRun, toast, version]);

  useEffect(() => { void loadEsicMonthly(); }, [loadEsicMonthly]);

  const download = async () => {
    if (!selectedRun) return;
    setDownloading(true);
    try {
      const response = await axios.get(`/payroll/runs/${selectedRun._id}/statutory-report/export`, {
        params: { companyId, finalizationVersion: version, module },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `statutory-report-${selectedRun.periodKey}-v${version}-${module}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Unable to download statutory workbook", description: errorMessage(error), status: "error" });
    } finally {
      setDownloading(false);
    }
  };

  const downloadEpfoEcr = async () => {
    if (!selectedRun || !epfoEcr?.ready) return;
    setDownloadingEcr(true);
    try {
      const response = await axios.get(`/payroll/runs/${selectedRun._id}/statutory-filings/epfo-ecr/export`, {
        params: { companyId, finalizationVersion: version },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `EPFO-ECR-${selectedRun.periodKey}-v${version}.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Unable to download EPFO ECR", description: errorMessage(error), status: "error" });
    } finally {
      setDownloadingEcr(false);
    }
  };

  const downloadEsicMonthly = async () => {
    if (!selectedRun || !esicMonthly?.ready) return;
    setDownloadingEsic(true);
    try {
      const response = await axios.get(`/payroll/runs/${selectedRun._id}/statutory-filings/esic-monthly/export`, {
        params: { companyId, finalizationVersion: version },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ESIC-MC-${selectedRun.periodKey}-v${version}.xls`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Unable to download ESIC contribution file", description: errorMessage(error), status: "error" });
    } finally {
      setDownloadingEsic(false);
    }
  };

  const saveEsicInput = async (row: EsicMonthlyRow) => {
    if (!selectedRun || !esicMonthly) return;
    const draft = esicDrafts[row.employeeId];
    const reasonCode = Number(draft?.reasonCode);
    const definition = esicMonthly.reasonCodes.find((item) => item.code === reasonCode);
    if (!definition) return;
    setSavingEsicEmployeeId(row.employeeId);
    try {
      await axios.post(`/payroll/runs/${selectedRun._id}/statutory-filings/esic-monthly/employee-inputs`, {
        companyId,
        finalizationVersion: version,
        employeeId: row.employeeId,
        reasonCode,
        lastWorkingDay: definition.requiresLastWorkingDay ? draft.lastWorkingDay : "",
        changeReason: `ESIC monthly filing reason set to ${definition.label}`,
      });
      toast({ title: "ESIC filing input saved", status: "success" });
      await loadEsicMonthly();
    } catch (error) {
      toast({ title: "Unable to save ESIC filing input", description: errorMessage(error), status: "error" });
    } finally {
      setSavingEsicEmployeeId("");
    }
  };

  const blockers = report?.modules.flatMap((item) => item.blockers.map((blocker) => `${item.label}: ${blocker}`)) || [];

  return (
    <Stack spacing={5}>
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <AlertDescription>Reports use immutable finalized payroll data. The workbook is for statutory review and filing preparation; validate the current authority upload format before submission.</AlertDescription>
      </Alert>

      <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
        <Flex gap={4} align={{ base: "stretch", lg: "end" }} direction={{ base: "column", lg: "row" }}>
          <FormControl maxW={{ lg: "320px" }}>
            <FormLabel>Finalized payroll run</FormLabel>
            <Select value={runId} isDisabled={loadingRuns || !runs.length} onChange={(event) => setRunId(event.target.value)}>
              {!runs.length ? <option value="">No finalized payroll runs</option> : null}
              {runs.map((run) => <option key={run._id} value={run._id}>{run.periodKey} | {run.cycleStartDate} to {run.cycleEndDate}</option>)}
            </Select>
          </FormControl>
          {Number(selectedRun?.finalizationVersion || 0) > 1 ? (
            <FormControl maxW={{ lg: "190px" }}>
              <FormLabel>Finalization version</FormLabel>
              <Select value={version} onChange={(event) => { setVersion(Number(event.target.value)); setPage(1); }}>
                {Array.from({ length: Number(selectedRun?.finalizationVersion || 0) }, (_, index) => index + 1).reverse().map((item) => <option key={item} value={item}>Version {item}</option>)}
              </Select>
            </FormControl>
          ) : null}
          <FormControl maxW={{ lg: "260px" }}>
            <FormLabel>Report module</FormLabel>
            <Select value={module} onChange={(event) => { setModule(event.target.value); setPage(1); }}>
              {moduleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </Select>
          </FormControl>
          <Button leftIcon={<FiRefreshCw />} variant="outline" isLoading={loading || loadingEcr || loadingEsic} onClick={() => { void loadReport(); void loadEpfoEcr(); void loadEsicMonthly(); }}>Refresh</Button>
          <Button leftIcon={<FiDownload />} colorScheme="blue" isDisabled={!report} isLoading={downloading} onClick={() => void download()}>Download workbook</Button>
        </Flex>
      </Box>

      {loading && !report ? <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>{[1, 2, 3].map((item) => <Skeleton key={item} height="110px" borderRadius="md" />)}</SimpleGrid> : null}

      {report ? (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted} fontWeight="700">EMPLOYEES WITH CONTRIBUTIONS</Text><Text mt={1} fontSize="2xl" fontWeight="800">{report.employeeCount}</Text></Box>
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted} fontWeight="700">EMPLOYEE DEDUCTIONS</Text><Text mt={1} fontSize="2xl" fontWeight="800">{formatMoney(report.employeeDeductionMinor, currency, minorUnits)}</Text></Box>
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted} fontWeight="700">EMPLOYER CONTRIBUTIONS</Text><Text mt={1} fontSize="2xl" fontWeight="800">{formatMoney(report.employerContributionMinor, currency, minorUnits)}</Text></Box>
          </SimpleGrid>

          {blockers.length ? <Alert status="warning" alignItems="start"><AlertIcon mt={1} /><AlertDescription><Text fontWeight="700">Resolve before preparing authority files</Text>{blockers.map((blocker) => <Text key={blocker} fontSize="sm">{blocker}</Text>)}</AlertDescription></Alert> : null}

          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
            {report.modules.map((item) => (
              <Box key={item.key} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
                <HStack justify="space-between" align="start"><Text fontWeight="800">{item.label}</Text><Badge colorScheme={item.registerReady ? "green" : "orange"}>{item.registerReady ? "Register ready" : "Needs setup"}</Badge></HStack>
                <SimpleGrid columns={3} spacing={3} mt={4}>
                  <Box><Text fontSize="xs" color={muted}>EMPLOYEES</Text><Text fontWeight="700">{item.employeeCount}</Text></Box>
                  <Box><Text fontSize="xs" color={muted}>DEDUCTIONS</Text><Text fontWeight="700">{formatMoney(item.employeeDeductionMinor, currency, minorUnits)}</Text></Box>
                  <Box><Text fontSize="xs" color={muted}>EMPLOYER</Text><Text fontWeight="700">{formatMoney(item.employerContributionMinor, currency, minorUnits)}</Text></Box>
                </SimpleGrid>
              </Box>
            ))}
          </SimpleGrid>

          {selectedRun?.statutoryEnabledModules?.includes("provident_fund") ? (
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
              <Flex justify="space-between" align={{ base: "stretch", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
                <Box>
                  <HStack><Text fontWeight="800">EPFO ECR regular return</Text>{epfoEcr ? <Badge colorScheme={epfoEcr.ready ? "green" : "orange"}>{epfoEcr.ready ? "Ready" : "Blocked"}</Badge> : null}</HStack>
                  <Text mt={1} fontSize="sm" color={muted}>11-field EPFO text return from finalization version {version}. Contribution rate is selected separately in the EPFO portal.</Text>
                </Box>
                <Button leftIcon={<FiDownload />} colorScheme="blue" isDisabled={!epfoEcr?.ready} isLoading={downloadingEcr || loadingEcr} onClick={() => void downloadEpfoEcr()}>Download ECR text</Button>
              </Flex>
              {epfoEcr ? <SimpleGrid mt={4} columns={{ base: 2, md: 4 }} spacing={4}>
                <Box><Text fontSize="xs" color={muted}>EMPLOYEES</Text><Text fontWeight="700">{epfoEcr.employeeCount}</Text></Box>
                <Box><Text fontSize="xs" color={muted}>FORMAT</Text><Text fontWeight="700">{epfoEcr.adapter.fieldCount} fields</Text></Box>
                <Box><Text fontSize="xs" color={muted}>PF RATE</Text><Text fontWeight="700">{epfoEcr.source.contributionRate}%</Text></Box>
                <Box><Text fontSize="xs" color={muted}>PROVIDER</Text><Text fontWeight="700">v{epfoEcr.source.providerImplementationVersion}</Text></Box>
              </SimpleGrid> : null}
              {epfoEcr?.blockers.length ? <Alert mt={4} status="warning" alignItems="start"><AlertIcon mt={1} /><AlertDescription><Text fontWeight="700">Resolve {epfoEcr.blockers.length} ECR blocker(s)</Text>{epfoEcr.blockers.slice(0, 8).map((item, index) => <Text key={`${item.code}-${item.employeeCode || "run"}-${index}`} fontSize="sm">{item.employeeCode ? `${item.employeeCode}: ` : ""}{item.message}</Text>)}{epfoEcr.blockers.length > 8 ? <Text fontSize="sm">And {epfoEcr.blockers.length - 8} more.</Text> : null}</AlertDescription></Alert> : null}
            </Box>
          ) : null}

          {selectedRun?.statutoryEnabledModules?.includes("employee_state_insurance") ? (
            <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
              <Flex p={4} justify="space-between" align={{ base: "stretch", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
                <Box>
                  <HStack><Text fontWeight="800">ESIC monthly contribution</Text>{esicMonthly ? <Badge colorScheme={esicMonthly.ready ? "green" : "orange"}>{esicMonthly.ready ? "Ready" : "Blocked"}</Badge> : null}</HStack>
                  <Text mt={1} fontSize="sm" color={muted}>Six-column ESIC portal workbook from finalization version {version}. Fractional paid days are rounded up as required by the portal.</Text>
                </Box>
                <Button leftIcon={<FiDownload />} colorScheme="blue" isDisabled={!esicMonthly?.ready} isLoading={downloadingEsic || loadingEsic} onClick={() => void downloadEsicMonthly()}>Download ESIC Excel</Button>
              </Flex>
              {esicMonthly ? <SimpleGrid px={4} pb={4} columns={{ base: 2, md: 4 }} spacing={4}>
                <Box><Text fontSize="xs" color={muted}>EMPLOYEES</Text><Text fontWeight="700">{esicMonthly.employeeCount}</Text></Box>
                <Box><Text fontSize="xs" color={muted}>ZERO WAGE</Text><Text fontWeight="700">{esicMonthly.zeroWageEmployeeCount}</Text></Box>
                <Box><Text fontSize="xs" color={muted}>FORMAT</Text><Text fontWeight="700">{esicMonthly.adapter.fieldCount} fields | .xls</Text></Box>
                <Box><Text fontSize="xs" color={muted}>PROVIDER</Text><Text fontWeight="700">v{esicMonthly.source.providerImplementationVersion}</Text></Box>
              </SimpleGrid> : null}
              {esicMonthly?.blockers.length ? <Alert status="warning" alignItems="start" borderRadius="0"><AlertIcon mt={1} /><AlertDescription><Text fontWeight="700">Resolve {esicMonthly.blockers.length} ESIC blocker(s)</Text>{esicMonthly.blockers.slice(0, 8).map((item, index) => <Text key={`${item.code}-${item.employeeCode || "run"}-${index}`} fontSize="sm">{item.employeeCode ? `${item.employeeCode}: ` : ""}{item.message}</Text>)}{esicMonthly.blockers.length > 8 ? <Text fontSize="sm">And {esicMonthly.blockers.length - 8} more.</Text> : null}</AlertDescription></Alert> : null}
              {esicMonthly?.rows.some((row) => row.totalMonthlyWages === 0 || row.reasonSource === "employment_exit" || row.reasonSource === "manual") ? (
                <TableContainer borderTopWidth="1px" borderColor={border}>
                  <Table size="sm">
                    <Thead><Tr><Th>Employee</Th><Th>Paid days / wages</Th><Th>ESIC reason</Th><Th>Last working day</Th><Th></Th></Tr></Thead>
                    <Tbody>
                      {esicMonthly.rows.filter((row) => row.totalMonthlyWages === 0 || row.reasonSource === "employment_exit" || row.reasonSource === "manual").map((row) => {
                        const draft = esicDrafts[row.employeeId] || { reasonCode: "", lastWorkingDay: "" };
                        const reason = esicMonthly.reasonCodes.find((item) => String(item.code) === draft.reasonCode);
                        return <Tr key={row.employeeId}>
                          <Td><Text fontWeight="700">{row.employeeName}</Text><Text fontSize="xs" color={muted}>{row.employeeCode} | ESI {row.insuranceNumberMasked}</Text></Td>
                          <Td><Text>{row.paidDays} days</Text><Text fontSize="xs" color={muted}>INR {row.totalMonthlyWages.toLocaleString("en-IN")}</Text></Td>
                          <Td minW="250px"><Select size="sm" value={draft.reasonCode} placeholder="Select reason" onChange={(event) => setEsicDrafts((current) => ({ ...current, [row.employeeId]: { reasonCode: event.target.value, lastWorkingDay: current[row.employeeId]?.lastWorkingDay || "" } }))}>{esicMonthly.reasonCodes.map((item) => <option key={item.code} value={item.code}>{item.code} - {item.label}</option>)}</Select><Text mt={1} fontSize="xs" color={muted}>{row.reasonSource === "employment_exit" ? "Derived from employment end date" : row.inputRevision ? `Saved revision ${row.inputRevision}` : "Monthly filing input"}</Text></Td>
                          <Td minW="180px"><Input size="sm" type="date" value={draft.lastWorkingDay} isDisabled={!reason?.requiresLastWorkingDay} onChange={(event) => setEsicDrafts((current) => ({ ...current, [row.employeeId]: { reasonCode: current[row.employeeId]?.reasonCode || "", lastWorkingDay: event.target.value } }))} /></Td>
                          <Td><Button size="sm" variant="outline" isDisabled={!reason || (reason.requiresLastWorkingDay && !draft.lastWorkingDay)} isLoading={savingEsicEmployeeId === row.employeeId} onClick={() => void saveEsicInput(row)}>Save</Button></Td>
                        </Tr>;
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : null}
            </Box>
          ) : null}

          <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
            <Flex p={4} bg={subtle} justify="space-between" align={{ base: "stretch", md: "center" }} gap={3} direction={{ base: "column", md: "row" }}>
              <Box><Text fontWeight="800">Contribution register</Text><Text fontSize="sm" color={muted}>Frozen rule and amount totals for finalization version {report.source.finalizationVersion}.</Text></Box>
            </Flex>
            <TableContainer><Table size="sm"><Thead><Tr><Th>Contribution</Th><Th>Side</Th><Th isNumeric>Employees</Th><Th isNumeric>Wage base</Th><Th isNumeric>Amount</Th><Th>Rule</Th></Tr></Thead><Tbody>
              {report.lines.map((line) => <Tr key={`${line.moduleKey}-${line.code}-${line.side}-${line.ruleVersion}`}><Td><Text fontWeight="700">{line.name}</Text><Text fontSize="xs" color={muted}>{line.code}</Text></Td><Td>{line.side === "employee_deduction" ? "Employee deduction" : "Employer contribution"}</Td><Td isNumeric>{line.employeeCount}</Td><Td isNumeric>{formatMoney(line.wageBaseMinor, currency, minorUnits)}</Td><Td isNumeric fontWeight="700">{formatMoney(line.amountMinor, currency, minorUnits)}</Td><Td>{line.ruleVersion}<Text fontSize="xs" color={muted}>from {line.ruleEffectiveFrom}</Text></Td></Tr>)}
              {!report.lines.length ? <Tr><Td colSpan={6}><Text py={4} textAlign="center" color={muted}>No statutory contribution lines were frozen for this scope.</Text></Td></Tr> : null}
            </Tbody></Table></TableContainer>
          </Box>

          <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
            <Flex p={4} bg={subtle} justify="space-between" align={{ base: "stretch", md: "center" }} gap={3} direction={{ base: "column", md: "row" }}>
              <Box><Text fontWeight="800">Employee register</Text><Text fontSize="sm" color={muted}>{total} employees match this report.</Text></Box>
              <Input maxW={{ md: "300px" }} value={search} placeholder="Search employee" onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
            </Flex>
            <TableContainer><Table size="sm"><Thead><Tr><Th>Employee</Th><Th>Work assignment</Th><Th>Identifiers</Th><Th>Contributions</Th></Tr></Thead><Tbody>
              {items.map((employee) => <Tr key={employee._id}><Td><Text fontWeight="700">{employee.identity.name || "Employee"}</Text><Text fontSize="xs" color={muted}>{employee.identity.code || "-"} | {employee.identity.username || "-"}</Text></Td><Td>{organization(employee)}<Text fontSize="xs" color={muted}>{employee.organization.officeLocationState || "State not set"}</Text></Td><Td><Text fontSize="sm">{maskedIdentifiers(employee)}</Text></Td><Td>{employee.contributions.map((line) => <Text key={`${line.code}-${line.side}`} fontSize="sm"><strong>{line.code}</strong> {formatMoney(line.amountMinor, currency, minorUnits)}</Text>)}</Td></Tr>)}
              {!items.length ? <Tr><Td colSpan={4}><Text py={4} textAlign="center" color={muted}>No employees match this report.</Text></Td></Tr> : null}
            </Tbody></Table></TableContainer>
            <Flex p={3} borderTopWidth="1px" borderColor={border} justify="flex-end" align="center" gap={3}><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></Flex>
          </Box>
        </>
      ) : !loading && runId ? <Alert status="warning"><AlertIcon /><AlertDescription>No statutory report is available for this finalized run.</AlertDescription></Alert> : null}
    </Stack>
  );
}
