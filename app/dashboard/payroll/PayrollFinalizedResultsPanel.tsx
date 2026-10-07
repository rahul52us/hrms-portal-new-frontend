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
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiEye, FiRefreshCw } from "react-icons/fi";

type PayrollRun = {
  _id: string;
  status: string;
  version: number;
  periodKey: string;
  currency: string;
  currencyMinorUnits: number;
  finalizationVersion?: number;
  finalizedResultCount?: number;
  finalizedTotals?: Record<string, number>;
  finalizedAt?: string;
};

type FinalizedResult = {
  _id: string;
  identity: { name: string; code: string; username?: string };
  organization: { designation?: string; departmentName?: string; teamName?: string; officeLocationName?: string };
  payrollDays: { paidDays: number; unpaidDays: number; totalDays: number; approvedOvertimeMinutes: number };
  recurringComponents: Array<{ salaryComponent: string; componentCode: string; componentName: string; category: string; scheduledAmountMinor: number; payableAmountMinor: number; prorationReductionMinor: number }>;
  oneTimeInputs: Array<{ payrollOneTimeInput: string; componentCode: string; componentName: string; inputType: string; amountMinor: number; reason: string; sourceType?: string; sourcePeriodKey?: string; sourceFinalizationVersion?: number }>;
  statutoryContributions: Array<{ moduleKey: string; code: string; name: string; side: "employee_deduction" | "employer_contribution"; wageBaseMinor: number; rateBps: number; amountMinor: number; ruleVersion: string; ruleEffectiveFrom: string; metadata?: Record<string, string | number | boolean> }>;
  totals: Record<string, number>;
  issues: Array<{ code: string; severity: string; category: string; message: string }>;
  validationDecisions: Array<{ issueCode: string; issueCategory: string; action: string; reason: string; actorNameSnapshot: string; decidedAt: string }>;
  snapshotHash: string;
};

type AdjustmentTargetRun = {
  _id: string;
  periodKey: string;
  cycleStartDate: string;
  cycleEndDate: string;
  version: number;
  calculationStatus?: string;
};

type AdjustmentComponent = {
  _id: string;
  name: string;
  code: string;
  category: "earning" | "deduction";
  taxable: boolean;
};

type Props = { companyId: string; run: PayrollRun; onRunChanged: (run: any) => void };

const errorMessage = (error: any) => error?.response?.data?.message || error?.response?.data?.error || "Request failed";

function formatMoney(amountMinor: unknown, currency: string, minorUnits: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: minorUnits,
    maximumFractionDigits: minorUnits,
  }).format(Number(amountMinor || 0) / 10 ** minorUnits);
}

function TaxProjection({ line, currency, minorUnits }: { line?: FinalizedResult["statutoryContributions"][number]; currency: string; minorUnits: number }) {
  if (!line) return null;
  const metadata = line.metadata || {};
  return <Box borderWidth="1px" borderRadius="md" p={4}>
    <HStack justify="space-between" align="start"><Box><Text fontWeight="800">Frozen income-tax projection</Text><Text fontSize="sm" color="gray.500">{String(metadata.taxYear || "Tax year")} | {String(metadata.taxRegime || "new")} regime{metadata.defaultRegimeUsed ? " | company default" : ` | declaration v${metadata.declarationVersion || "-"}`}</Text></Box><Badge colorScheme="red">TDS {formatMoney(line.amountMinor, currency, minorUnits)}</Badge></HStack>
    <SimpleGrid mt={4} columns={{ base: 2, md: 4 }} spacing={4}>
      <Box><Text fontSize="xs" color="gray.500">PROJECTED EMPLOYER SALARY</Text><Text fontWeight="700">{formatMoney(metadata.currentEmployerSalaryMinor, currency, minorUnits)}</Text></Box>
      <Box><Text fontSize="xs" color="gray.500">ANNUAL TAXABLE INCOME</Text><Text fontWeight="700">{formatMoney(metadata.taxableIncomeMinor, currency, minorUnits)}</Text></Box>
      <Box><Text fontSize="xs" color="gray.500">ANNUAL TAX LIABILITY</Text><Text fontWeight="700">{formatMoney(metadata.annualTaxLiabilityMinor, currency, minorUnits)}</Text></Box>
      <Box><Text fontSize="xs" color="gray.500">ALREADY WITHHELD</Text><Text fontWeight="700">{formatMoney(Number(metadata.priorCurrentEmployerWithholdingMinor || 0) + Number(metadata.previousEmployerTaxWithheldMinor || 0), currency, minorUnits)}</Text></Box>
      <Box><Text fontSize="xs" color="gray.500">STANDARD DEDUCTION</Text><Text fontWeight="700">{formatMoney(metadata.standardDeductionMinor, currency, minorUnits)}</Text></Box>
      <Box><Text fontSize="xs" color="gray.500">OTHER VERIFIED DEDUCTIONS</Text><Text fontWeight="700">{formatMoney(Number(metadata.hraExemptionMinor || 0) + Number(metadata.oldRegimeDeductionsMinor || 0), currency, minorUnits)}</Text></Box>
      <Box><Text fontSize="xs" color="gray.500">TAX LEFT TO WITHHOLD</Text><Text fontWeight="700">{formatMoney(metadata.remainingAnnualTaxMinor, currency, minorUnits)}</Text></Box>
      <Box><Text fontSize="xs" color="gray.500">PAYROLLS INCLUDING THIS ONE</Text><Text fontWeight="700">{Number(metadata.remainingPayrollPeriods || 0)}</Text></Box>
    </SimpleGrid>
  </Box>;
}

function organization(result: FinalizedResult) {
  return [result.organization.departmentName, result.organization.teamName, result.organization.officeLocationName]
    .filter(Boolean).join(" | ") || "Not assigned";
}

function requestKey() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function PayrollFinalizedResultsPanel({ companyId, run, onRunChanged }: Props) {
  const toast = useToast();
  const details = useDisclosure();
  const adjustment = useDisclosure();
  const [items, setItems] = useState<FinalizedResult[]>([]);
  const [selected, setSelected] = useState<FinalizedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [adjustmentSource, setAdjustmentSource] = useState<FinalizedResult | null>(null);
  const [targetRuns, setTargetRuns] = useState<AdjustmentTargetRun[]>([]);
  const [components, setComponents] = useState<AdjustmentComponent[]>([]);
  const [targetRunId, setTargetRunId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"arrear" | "recovery">("arrear");
  const [componentId, setComponentId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [adjustmentSubmitting, setAdjustmentSubmitting] = useState(false);
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const subtle = useColorModeValue("gray.50", "whiteAlpha.50");
  const minorUnits = Number(run.currencyMinorUnits ?? 2);
  const totals = run.finalizedTotals || {};
  const selectedTargetRun = targetRuns.find((item) => item._id === targetRunId);
  const compatibleComponents = useMemo(
    () => components.filter((component) => component.category === (adjustmentType === "arrear" ? "earning" : "deduction")),
    [adjustmentType, components]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/payroll/runs/${run._id}/finalized-results`, {
        params: { companyId, finalizationVersion: run.finalizationVersion, page, limit: 25, search: search.trim() },
      });
      setItems(data.data?.items || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      if (data.data?.run && Number(data.data.run.version) !== Number(run.version)) onRunChanged(data.data.run);
    } catch (error) {
      toast({ title: "Unable to load finalized payroll results", description: errorMessage(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, onRunChanged, page, run._id, run.finalizationVersion, run.version, search, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openAdjustment = async (result: FinalizedResult) => {
    setAdjustmentSource(result);
    setTargetRuns([]);
    setComponents([]);
    setTargetRunId("");
    setAdjustmentType("arrear");
    setComponentId("");
    setAmount("");
    setReason("");
    setReference("");
    setIdempotencyKey(requestKey());
    details.onClose();
    adjustment.onOpen();
    setOptionsLoading(true);
    try {
      const { data } = await axios.get(`/payroll/runs/${run._id}/finalized-results/${result._id}/adjustment-options`, {
        params: { companyId },
      });
      setTargetRuns(data.data?.targetRuns || []);
      setComponents(data.data?.components || []);
    } catch (error) {
      toast({ title: "Unable to load future adjustment options", description: errorMessage(error), status: "error" });
    } finally {
      setOptionsLoading(false);
    }
  };

  const createAdjustment = async () => {
    if (!adjustmentSource || !selectedTargetRun) return;
    setAdjustmentSubmitting(true);
    try {
      const { data } = await axios.post(`/payroll/runs/${run._id}/finalized-results/${adjustmentSource._id}/adjustments`, {
        companyId,
        expectedSourceRunVersion: run.version,
        targetPayrollRunId: selectedTargetRun._id,
        expectedTargetRunVersion: selectedTargetRun.version,
        salaryComponentId: componentId,
        inputType: adjustmentType,
        amount,
        reason: reason.trim(),
        reference: reference.trim(),
        idempotencyKey,
      });
      if (data.data?.sourceRun) onRunChanged(data.data.sourceRun);
      toast({ title: data.message || "Correction routed to future payroll", status: "success" });
      adjustment.onClose();
    } catch (error) {
      toast({ title: "Unable to route payroll correction", description: errorMessage(error), status: "error" });
    } finally {
      setAdjustmentSubmitting(false);
    }
  };

  const canCreateAdjustment = Boolean(
    adjustmentSource && selectedTargetRun && componentId && amount && reason.trim().length >= 3
  );

  return <Stack spacing={4}>
    <Flex justify="space-between" gap={3} direction={{ base: "column", md: "row" }}>
      <Box><Text fontWeight="800">Finalized payroll results</Text><Text fontSize="sm" color={muted}>Immutable employee snapshots used by future payslips, payouts, and payroll reporting.</Text></Box>
      <Badge alignSelf={{ base: "flex-start", md: "center" }} colorScheme={run.status === "finalized" ? "green" : "orange"}>Finalization v{run.finalizationVersion}</Badge>
    </Flex>
    <Alert status={run.status === "finalized" ? "success" : "warning"} borderRadius="md"><AlertIcon /><AlertDescription>{run.status === "finalized" ? "These values cannot be edited. Corrections require the audited reopen workflow and a later finalization version." : "This is a retained historical finalization. The reopened draft must be reviewed, approved, and finalized again before it becomes the current payout source."}</AlertDescription></Alert>
    <SimpleGrid columns={{ base: 2, lg: 6 }} spacing={3}>
      <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>EMPLOYEES</Text><Text fontSize="xl" fontWeight="800">{run.finalizedResultCount || 0}</Text></Box>
      <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>GROSS</Text><Text fontWeight="800">{formatMoney(totals.grossEarningsMinor, run.currency, minorUnits)}</Text></Box>
      <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>DEDUCTIONS</Text><Text fontWeight="800">{formatMoney(totals.totalDeductionsMinor, run.currency, minorUnits)}</Text></Box>
      <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>INCOME TAX / TDS</Text><Text fontWeight="800">{formatMoney(totals.incomeTaxWithholdingMinor, run.currency, minorUnits)}</Text></Box>
      <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>EMPLOYER STATUTORY</Text><Text fontWeight="800">{formatMoney(totals.statutoryEmployerContributionsMinor, run.currency, minorUnits)}</Text></Box>
      <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>NET PAY</Text><Text fontWeight="800">{formatMoney(totals.netPayMinor, run.currency, minorUnits)}</Text></Box>
    </SimpleGrid>
    <Flex gap={3} justify="space-between" direction={{ base: "column", md: "row" }}><Input maxW={{ md: "360px" }} placeholder="Search employee or organization" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><IconButton aria-label="Refresh finalized payroll results" icon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={() => void load()} /></Flex>
    <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
      {loading ? <Stack p={4}>{[1, 2, 3].map((value) => <Skeleton key={value} h="68px" />)}</Stack> : items.length === 0 ? <Box py={12} textAlign="center"><Text fontWeight="700">No finalized results match</Text></Box> : <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Employee</Th><Th>Organization</Th><Th>Payroll days</Th><Th>Gross</Th><Th>Deductions</Th><Th>Net pay</Th><Th>Integrity</Th><Th /></Tr></Thead><Tbody>{items.map((item) => <Tr key={item._id}>
        <Td><Text fontWeight="700">{item.identity.name}</Text><Text fontSize="xs" color={muted}>{item.identity.code}{item.organization.designation ? ` | ${item.organization.designation}` : ""}</Text></Td>
        <Td><Text maxW="240px" whiteSpace="normal">{organization(item)}</Text></Td>
        <Td>{item.payrollDays.paidDays} paid | {item.payrollDays.unpaidDays} LOP</Td>
        <Td>{formatMoney(item.totals.grossEarningsMinor, run.currency, minorUnits)}</Td>
        <Td>{formatMoney(item.totals.totalDeductionsMinor, run.currency, minorUnits)}</Td>
        <Td fontWeight="800">{formatMoney(item.totals.netPayMinor, run.currency, minorUnits)}</Td>
        <Td><Badge colorScheme="green">{item.snapshotHash.slice(0, 10)}</Badge></Td>
        <Td><IconButton aria-label={`View ${item.identity.name} finalized payroll`} icon={<FiEye />} size="sm" variant="ghost" onClick={() => { setSelected(item); details.onOpen(); }} /></Td>
      </Tr>)}</Tbody></Table></TableContainer>}
      <Flex p={4} borderTopWidth="1px" borderColor={border} justify="space-between"><Text fontSize="sm" color={muted}>{total} finalized result{total === 1 ? "" : "s"}</Text><HStack><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack></Flex>
    </Box>
    <Modal isOpen={details.isOpen} onClose={details.onClose} size="5xl" scrollBehavior="inside"><ModalOverlay /><ModalContent><ModalHeader>{selected ? `${selected.identity.name} finalized payroll` : "Finalized payroll"}</ModalHeader><ModalCloseButton /><ModalBody>{selected ? <Stack spacing={5}>
      <SimpleGrid columns={{ base: 2, md: 6 }} spacing={3}><Box><Text fontSize="xs" color={muted}>GROSS</Text><Text fontWeight="800">{formatMoney(selected.totals.grossEarningsMinor, run.currency, minorUnits)}</Text></Box><Box><Text fontSize="xs" color={muted}>INCOME TAX / TDS</Text><Text fontWeight="800">{formatMoney(selected.totals.incomeTaxWithholdingMinor, run.currency, minorUnits)}</Text></Box><Box><Text fontSize="xs" color={muted}>STATUTORY DEDUCTIONS</Text><Text fontWeight="800">{formatMoney(selected.totals.statutoryEmployeeDeductionsMinor, run.currency, minorUnits)}</Text></Box><Box><Text fontSize="xs" color={muted}>EMPLOYER STATUTORY</Text><Text fontWeight="800">{formatMoney(selected.totals.statutoryEmployerContributionsMinor, run.currency, minorUnits)}</Text></Box><Box><Text fontSize="xs" color={muted}>REIMBURSEMENTS</Text><Text fontWeight="800">{formatMoney(selected.totals.totalReimbursementsMinor, run.currency, minorUnits)}</Text></Box><Box><Text fontSize="xs" color={muted}>NET PAY</Text><Text fontWeight="800">{formatMoney(selected.totals.netPayMinor, run.currency, minorUnits)}</Text></Box></SimpleGrid>
      <Box><Text mb={2} fontWeight="800">Recurring components</Text><TableContainer borderWidth="1px" borderColor={border} borderRadius="md"><Table size="sm"><Thead bg={subtle}><Tr><Th>Component</Th><Th>Category</Th><Th>Scheduled</Th><Th>Reduction</Th><Th>Payable</Th></Tr></Thead><Tbody>{selected.recurringComponents.map((component) => <Tr key={`${component.salaryComponent}-${component.componentCode}`}><Td>{component.componentName}<Text fontSize="xs" color={muted}>{component.componentCode}</Text></Td><Td>{component.category.replaceAll("_", " ")}</Td><Td>{formatMoney(component.scheduledAmountMinor, run.currency, minorUnits)}</Td><Td>{formatMoney(component.prorationReductionMinor, run.currency, minorUnits)}</Td><Td fontWeight="700">{formatMoney(component.payableAmountMinor, run.currency, minorUnits)}</Td></Tr>)}</Tbody></Table></TableContainer></Box>
      <Box><Text mb={2} fontWeight="800">Generated statutory contributions</Text>{selected.statutoryContributions?.length ? <TableContainer borderWidth="1px" borderColor={border} borderRadius="md"><Table size="sm"><Thead bg={subtle}><Tr><Th>Contribution</Th><Th>Impact</Th><Th isNumeric>Wage base</Th><Th isNumeric>Rate</Th><Th isNumeric>Amount</Th></Tr></Thead><Tbody>{selected.statutoryContributions.map((item) => <Tr key={`${item.code}-${item.side}`}><Td>{item.name}<Text fontSize="xs" color={muted}>{item.code} | {item.ruleVersion} from {item.ruleEffectiveFrom}</Text></Td><Td><Badge colorScheme={item.side === "employee_deduction" ? "red" : "purple"}>{item.side === "employee_deduction" ? "Employee deduction" : "Employer cost"}</Badge></Td><Td isNumeric>{formatMoney(item.wageBaseMinor, run.currency, minorUnits)}</Td><Td isNumeric>{item.rateBps ? `${item.rateBps / 100}%` : item.moduleKey === "professional_tax" ? "Slab" : item.moduleKey === "labour_welfare_fund" ? "Flat" : "Calculated"}</Td><Td isNumeric fontWeight="700">{formatMoney(item.amountMinor, run.currency, minorUnits)}</Td></Tr>)}</Tbody></Table></TableContainer> : <Text fontSize="sm" color={muted}>No generated statutory contribution was frozen for this employee.</Text>}</Box>
      <TaxProjection line={selected.statutoryContributions.find((item) => item.moduleKey === "income_tax_withholding")} currency={run.currency} minorUnits={minorUnits} />
      {selected.oneTimeInputs.length ? <Box><Text mb={2} fontWeight="800">One-time inputs</Text><TableContainer borderWidth="1px" borderColor={border} borderRadius="md"><Table size="sm"><Thead bg={subtle}><Tr><Th>Component</Th><Th>Type</Th><Th>Origin</Th><Th isNumeric>Amount</Th></Tr></Thead><Tbody>{selected.oneTimeInputs.map((input) => <Tr key={input.payrollOneTimeInput}><Td>{input.componentName}<Text fontSize="xs" color={muted}>{input.componentCode}</Text></Td><Td>{input.inputType.replaceAll("_", " ")}</Td><Td>{input.sourceType === "finalized_correction" ? `Finalized ${input.sourcePeriodKey} v${input.sourceFinalizationVersion}` : "Manual input"}</Td><Td isNumeric>{formatMoney(input.amountMinor, run.currency, minorUnits)}</Td></Tr>)}</Tbody></Table></TableContainer></Box> : null}
      <Box><Text mb={2} fontWeight="800">Validation evidence</Text>{selected.issues.length ? <Stack>{selected.issues.map((issue) => { const decision = selected.validationDecisions.find((item) => item.issueCode === issue.code && item.issueCategory === issue.category); return <Alert key={`${issue.category}-${issue.code}`} status={issue.severity === "error" ? "error" : "warning"} borderRadius="md"><AlertIcon /><Box><Text fontWeight="700">{issue.message}</Text>{decision ? <AlertDescription>Acknowledged by {decision.actorNameSnapshot}: {decision.reason}</AlertDescription> : null}</Box></Alert>; })}</Stack> : <Badge colorScheme="green">No validation issues</Badge>}</Box>
      <Box><Text fontSize="xs" color={muted}>SNAPSHOT SHA-256</Text><Text fontFamily="mono" fontSize="xs" wordBreak="break-all">{selected.snapshotHash}</Text></Box>
    </Stack> : null}</ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={details.onClose}>Close</Button>{selected && run.status === "finalized" ? <Button leftIcon={<FiArrowRight />} colorScheme="blue" onClick={() => void openAdjustment(selected)}>Route correction</Button> : null}</ModalFooter></ModalContent></Modal>
    <Modal isOpen={adjustment.isOpen} onClose={adjustment.onClose} size="xl" isCentered scrollBehavior="inside"><ModalOverlay /><ModalContent><ModalHeader>Route correction to future payroll</ModalHeader><ModalCloseButton /><ModalBody><Stack spacing={4}>
      <Alert status="info" borderRadius="md"><AlertIcon /><AlertDescription>This keeps the finalized period unchanged. The amount becomes a source-linked arrear or recovery in a later draft payroll run.</AlertDescription></Alert>
      {adjustmentSource ? <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontWeight="800">{adjustmentSource.identity.name}</Text><Text fontSize="sm" color={muted}>{adjustmentSource.identity.code} | Source {run.periodKey} finalization v{run.finalizationVersion} ({run.currency})</Text></Box> : null}
      {optionsLoading ? <Stack><Skeleton h="68px" /><Skeleton h="68px" /></Stack> : <>
        <FormControl isRequired><FormLabel>Future payroll run</FormLabel><Select value={targetRunId} onChange={(event) => setTargetRunId(event.target.value)}><option value="">Select a later draft run</option>{targetRuns.map((target) => <option key={target._id} value={target._id}>{target.periodKey} ({target.cycleStartDate} to {target.cycleEndDate})</option>)}</Select><FormHelperText>The employee must already be imported into that run. Adding the correction makes an existing calculation stale.</FormHelperText></FormControl>
        {targetRuns.length === 0 ? <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>No eligible future draft run exists. Create the later payroll run and import its attendance inputs first.</AlertDescription></Alert> : null}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired><FormLabel>Correction type</FormLabel><Select value={adjustmentType} onChange={(event) => { setAdjustmentType(event.target.value as "arrear" | "recovery"); setComponentId(""); }}><option value="arrear">Arrear - add pay</option><option value="recovery">Recovery - deduct pay</option></Select></FormControl>
          <FormControl isRequired><FormLabel>Payroll component</FormLabel><Select value={componentId} onChange={(event) => setComponentId(event.target.value)}><option value="">Select {adjustmentType === "arrear" ? "earning" : "deduction"} component</option>{compatibleComponents.map((component) => <option key={component._id} value={component._id}>{component.name} ({component.code})</option>)}</Select><FormHelperText>The component controls tax treatment and reporting.</FormHelperText></FormControl>
          <FormControl isRequired><FormLabel>Amount ({run.currency})</FormLabel><Input inputMode="decimal" value={amount} placeholder={minorUnits ? "Example: 1500.00" : "Example: 1500"} onChange={(event) => setAmount(event.target.value)} /><FormHelperText>Enter a positive amount. Recovery reduces net pay automatically.</FormHelperText></FormControl>
          <FormControl><FormLabel>Reference</FormLabel><Input value={reference} maxLength={100} placeholder="Ticket, approval, or correction reference" onChange={(event) => setReference(event.target.value)} /></FormControl>
        </SimpleGrid>
        <FormControl isRequired><FormLabel>Correction reason</FormLabel><Textarea value={reason} maxLength={500} placeholder="Explain the finalized-period error and why this amount belongs in the future run" onChange={(event) => setReason(event.target.value)} /></FormControl>
      </>}
    </Stack></ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={adjustment.onClose}>Cancel</Button><Button colorScheme="blue" isLoading={adjustmentSubmitting} isDisabled={!canCreateAdjustment || optionsLoading} onClick={() => void createAdjustment()}>Add to future payroll</Button></ModalFooter></ModalContent></Modal>
  </Stack>;
}
