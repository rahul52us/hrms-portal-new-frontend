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
import { useCallback, useEffect, useState } from "react";
import { FiEye, FiRefreshCw } from "react-icons/fi";

type PayrollRun = {
  _id: string;
  status: string;
  version: number;
  currency: string;
  currencyMinorUnits: number;
  employeeSnapshotStatus?: "pending" | "prepared";
  employeeSnapshotVersion?: number;
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
};

type ResultIssue = {
  code: string;
  severity: "error" | "warning";
  category: string;
  message: string;
};

type RecurringComponent = {
  salaryComponent: string;
  componentCode: string;
  componentName: string;
  category: string;
  taxable: boolean;
  prorateOnUnpaidDays: boolean;
  overridden: boolean;
  scheduledAmountMinor: number;
  payableAmountMinor: number;
  prorationReductionMinor: number;
};

type OneTimeInput = {
  payrollOneTimeInput: string;
  componentCode: string;
  componentName: string;
  inputType: string;
  amountMinor: number;
  reason: string;
  reference?: string;
};

type PayrollResult = {
  _id: string;
  identity: { name: string; code: string; username?: string };
  organization: {
    designation?: string;
    departmentName?: string;
    teamName?: string;
    officeLocationName?: string;
  };
  payrollDays: {
    paidDays: number;
    unpaidDays: number;
    totalDays: number;
    approvedOvertimeMinutes: number;
  };
  recurringComponents: RecurringComponent[];
  oneTimeInputs: OneTimeInput[];
  totals: Record<string, number>;
  issues: ResultIssue[];
  hasErrors: boolean;
  hasWarnings: boolean;
};

type Props = {
  companyId: string;
  run: PayrollRun;
  onRunChanged: (run: any) => void;
};

function message(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || "Request failed";
}

function formatMoney(amountMinor: unknown, currency: string, minorUnits: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: minorUnits,
    maximumFractionDigits: minorUnits,
  }).format(Number(amountMinor || 0) / 10 ** minorUnits);
}

function formatDays(value: unknown) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function organization(result: PayrollResult) {
  return [result.organization.departmentName, result.organization.teamName, result.organization.officeLocationName]
    .filter(Boolean)
    .join(" | ") || "Not assigned";
}

export default function PayrollDraftResultsPanel({ companyId, run, onRunChanged }: Props) {
  const toast = useToast();
  const detailDialog = useDisclosure();
  const [items, setItems] = useState<PayrollResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<PayrollResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [issues, setIssues] = useState("all");
  const [reason, setReason] = useState("");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const subtle = useColorModeValue("gray.50", "whiteAlpha.50");

  const calculationVersion = Number(run.calculationVersion || 0);
  const hasResults = calculationVersion > 0;
  const isStale = run.calculationStatus === "stale";
  const minorUnits = Number(run.currencyMinorUnits ?? 2);
  const totals = run.payrollResultTotals || {};

  const loadResults = useCallback(async () => {
    if (!hasResults) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(`/payroll/runs/${run._id}/results`, {
        params: { companyId, page, limit: 25, search: search.trim(), issues },
      });
      setItems(data.data?.items || []);
      if (data.data?.run && Number(data.data.run.version) !== Number(run.version)) onRunChanged(data.data.run);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      toast({ title: "Unable to load draft payroll results", description: message(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, hasResults, issues, onRunChanged, page, run._id, run.version, search, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadResults(), 250);
    return () => window.clearTimeout(timer);
  }, [loadResults]);

  const calculate = async () => {
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/payroll/runs/${run._id}/calculate`, {
        companyId,
        expectedVersion: run.version,
        reason: reason.trim(),
      });
      onRunChanged(data.data);
      setReason("");
      setPage(1);
      toast({ title: data.message || "Draft payroll calculated", status: "success" });
    } catch (error) {
      toast({ title: "Unable to calculate draft payroll", description: message(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const openDetails = (result: PayrollResult) => {
    setSelectedResult(result);
    detailDialog.onOpen();
  };

  return (
    <Stack spacing={4}>
      <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
        <Box><Text fontWeight="800">Draft payroll results</Text><Text fontSize="sm" color={muted}>Calculated from the frozen employee snapshot, payroll days, and active one-time inputs.</Text></Box>
        {hasResults ? <Badge alignSelf={{ base: "flex-start", md: "center" }} colorScheme={isStale ? "orange" : "green"}>{isStale ? "Recalculation required" : `Calculation v${calculationVersion}`}</Badge> : <Badge alignSelf={{ base: "flex-start", md: "center" }} colorScheme="orange">Not calculated</Badge>}
      </Flex>

      <SimpleGrid columns={{ base: 2, lg: 5 }} spacing={3}>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>EMPLOYEES</Text><Text fontSize="xl" fontWeight="800">{run.payrollResultCount || 0}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>WITH ERRORS</Text><Text fontSize="xl" fontWeight="800" color={run.payrollResultErrorCount ? "red.500" : undefined}>{run.payrollResultErrorCount || 0}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>WITH WARNINGS</Text><Text fontSize="xl" fontWeight="800" color={run.payrollResultWarningCount ? "orange.500" : undefined}>{run.payrollResultWarningCount || 0}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>GROSS EARNINGS</Text><Text fontWeight="800">{formatMoney(totals.grossEarningsMinor, run.currency, minorUnits)}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>NET PAY</Text><Text fontWeight="800">{formatMoney(totals.netPayMinor, run.currency, minorUnits)}</Text></Box>
      </SimpleGrid>

      {run.employeeSnapshotStatus !== "prepared" ? <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>Prepare employee payroll snapshots before calculating.</AlertDescription></Alert> : (
        <Alert status={isStale ? "warning" : hasResults ? "info" : "warning"} borderRadius="md" alignItems="flex-start">
          <AlertIcon mt={1} />
          <Box flex="1">
            <Text fontWeight="700">{isStale ? "Payroll inputs changed after the last calculation" : hasResults ? "Recalculate to create a new immutable version" : "Calculate the first draft"}</Text>
            <AlertDescription display="block" mt={1}>{isStale ? "The visible results are the previous version. Recalculate before review or finalization." : "Only components marked for LOP proration use paid days divided by paid plus unpaid days. Overtime is not assigned a monetary rate automatically."}</AlertDescription>
            <FormControl mt={3} isRequired><FormLabel fontSize="sm">Calculation reason</FormLabel><Textarea value={reason} maxLength={500} rows={2} placeholder={hasResults ? "Example: Recalculate after approved payroll input corrections" : "Example: Calculate the first payroll draft for review"} onChange={(event) => setReason(event.target.value)} /><FormHelperText>Minimum 3 characters. Every calculation version is retained in the audit trail.</FormHelperText></FormControl>
          </Box>
          <Button ml={4} mt={1} leftIcon={hasResults ? <FiRefreshCw /> : undefined} colorScheme="blue" isLoading={submitting} isDisabled={run.status !== "draft" || reason.trim().length < 3} onClick={() => void calculate()}>{hasResults ? "Recalculate" : "Calculate payroll"}</Button>
        </Alert>
      )}

      {hasResults ? <Stack spacing={3}>
        <Flex gap={3} direction={{ base: "column", md: "row" }} justify="space-between">
          <Input maxW={{ md: "340px" }} value={search} placeholder="Search employee or organization" onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          <HStack><Select value={issues} maxW="190px" onChange={(event) => { setIssues(event.target.value); setPage(1); }}><option value="all">All results</option><option value="errors">With errors</option><option value="warnings">With warnings</option><option value="clean">Ready</option></Select><IconButton aria-label="Refresh payroll results" icon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={() => void loadResults()} /></HStack>
        </Flex>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          {loading ? <Stack p={4}>{[1, 2, 3].map((item) => <Skeleton key={item} h="70px" />)}</Stack> : items.length === 0 ? <Box py={12} textAlign="center"><Text fontWeight="700">No payroll results match</Text><Text mt={1} fontSize="sm" color={muted}>Change the search or issue filter.</Text></Box> : (
            <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Employee</Th><Th>Organization</Th><Th>Payroll days</Th><Th>Gross</Th><Th>Deductions</Th><Th>Net pay</Th><Th>Validation</Th><Th /></Tr></Thead><Tbody>{items.map((result) => <Tr key={result._id}>
              <Td><Text fontWeight="700">{result.identity.name}</Text><Text fontSize="xs" color={muted}>{result.identity.code}{result.organization.designation ? ` | ${result.organization.designation}` : ""}</Text></Td>
              <Td><Text maxW="240px" whiteSpace="normal">{organization(result)}</Text></Td>
              <Td><Text>{formatDays(result.payrollDays.paidDays)} paid | {formatDays(result.payrollDays.unpaidDays)} LOP</Text><Text fontSize="xs" color={muted}>{result.payrollDays.approvedOvertimeMinutes || 0} approved OT minutes</Text></Td>
              <Td><Text fontWeight="700">{formatMoney(result.totals.grossEarningsMinor, run.currency, minorUnits)}</Text><Text fontSize="xs" color={muted}>LOP reduction {formatMoney(result.totals.earningProrationReductionMinor, run.currency, minorUnits)}</Text></Td>
              <Td>{formatMoney(result.totals.totalDeductionsMinor, run.currency, minorUnits)}</Td>
              <Td><Text fontWeight="800">{formatMoney(result.totals.netPayMinor, run.currency, minorUnits)}</Text></Td>
              <Td>{result.hasErrors ? <Badge colorScheme="red">{result.issues.filter((issue) => issue.severity === "error").length} error(s)</Badge> : result.hasWarnings ? <Badge colorScheme="orange">{result.issues.filter((issue) => issue.severity === "warning").length} warning(s)</Badge> : <Badge colorScheme="green">Ready</Badge>}</Td>
              <Td textAlign="right"><IconButton aria-label={`View ${result.identity.name} payroll breakdown`} icon={<FiEye />} size="sm" variant="ghost" onClick={() => openDetails(result)} /></Td>
            </Tr>)}</Tbody></Table></TableContainer>
          )}
          <Flex p={4} borderTopWidth="1px" borderColor={border} justify="space-between" align="center"><Text fontSize="sm" color={muted}>{total} payroll result{total === 1 ? "" : "s"}</Text><HStack><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack></Flex>
        </Box>
      </Stack> : null}

      <Modal isOpen={detailDialog.isOpen} onClose={detailDialog.onClose} size="5xl" scrollBehavior="inside">
        <ModalOverlay /><ModalContent><ModalHeader>{selectedResult ? `${selectedResult.identity.name} payroll breakdown` : "Payroll breakdown"}</ModalHeader><ModalCloseButton />
          <ModalBody>{selectedResult ? <Stack spacing={5}>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}><Box><Text fontSize="xs" color={muted}>SCHEDULED EARNINGS</Text><Text fontWeight="800">{formatMoney(selectedResult.totals.scheduledEarningsMinor, run.currency, minorUnits)}</Text></Box><Box><Text fontSize="xs" color={muted}>LOP REDUCTION</Text><Text fontWeight="800">{formatMoney(selectedResult.totals.earningProrationReductionMinor, run.currency, minorUnits)}</Text></Box><Box><Text fontSize="xs" color={muted}>TOTAL DEDUCTIONS</Text><Text fontWeight="800">{formatMoney(selectedResult.totals.totalDeductionsMinor, run.currency, minorUnits)}</Text></Box><Box><Text fontSize="xs" color={muted}>NET PAY</Text><Text fontWeight="800">{formatMoney(selectedResult.totals.netPayMinor, run.currency, minorUnits)}</Text></Box></SimpleGrid>
            <Box><Text mb={2} fontWeight="800">Recurring components</Text><TableContainer borderWidth="1px" borderColor={border} borderRadius="md"><Table size="sm"><Thead bg={subtle}><Tr><Th>Component</Th><Th>Category</Th><Th>Monthly</Th><Th>LOP treatment</Th><Th>Payable</Th></Tr></Thead><Tbody>{selectedResult.recurringComponents.map((component) => <Tr key={component.salaryComponent}><Td><Text fontWeight="700">{component.componentName}</Text><Text fontSize="xs" color={muted}>{component.componentCode}</Text></Td><Td>{component.category.replaceAll("_", " ")}</Td><Td>{formatMoney(component.scheduledAmountMinor, run.currency, minorUnits)}</Td><Td>{component.prorateOnUnpaidDays ? `Prorated (-${formatMoney(component.prorationReductionMinor, run.currency, minorUnits)})` : "Not prorated"}</Td><Td fontWeight="700">{formatMoney(component.payableAmountMinor, run.currency, minorUnits)}</Td></Tr>)}</Tbody></Table></TableContainer></Box>
            <Box><Text mb={2} fontWeight="800">One-time inputs</Text>{selectedResult.oneTimeInputs.length ? <TableContainer borderWidth="1px" borderColor={border} borderRadius="md"><Table size="sm"><Thead bg={subtle}><Tr><Th>Component</Th><Th>Type</Th><Th>Reason</Th><Th>Amount</Th></Tr></Thead><Tbody>{selectedResult.oneTimeInputs.map((input) => <Tr key={input.payrollOneTimeInput}><Td><Text fontWeight="700">{input.componentName}</Text><Text fontSize="xs" color={muted}>{input.componentCode}</Text></Td><Td>{input.inputType}</Td><Td><Text maxW="340px" whiteSpace="normal">{input.reason}</Text>{input.reference ? <Text fontSize="xs" color={muted}>{input.reference}</Text> : null}</Td><Td fontWeight="700">{formatMoney(input.amountMinor, run.currency, minorUnits)}</Td></Tr>)}</Tbody></Table></TableContainer> : <Text fontSize="sm" color={muted}>No one-time inputs for this employee.</Text>}</Box>
            <Box><Text mb={2} fontWeight="800">Validation</Text>{selectedResult.issues.length ? <Stack spacing={2}>{selectedResult.issues.map((issue) => <Alert key={`${issue.category}-${issue.code}`} status={issue.severity === "error" ? "error" : "warning"} borderRadius="md"><AlertIcon /><Box><Text fontWeight="700">{issue.category.replaceAll("_", " ")}</Text><AlertDescription>{issue.message}</AlertDescription></Box></Alert>)}</Stack> : <Badge colorScheme="green">No validation issues</Badge>}</Box>
          </Stack> : null}</ModalBody>
          <ModalFooter><Button onClick={detailDialog.onClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
