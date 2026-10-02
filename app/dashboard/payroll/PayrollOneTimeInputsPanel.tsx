"use client";

import axios from "axios";
import {
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
import { FiPlus, FiRefreshCw, FiXCircle } from "react-icons/fi";

type InputType = "earning" | "deduction" | "reimbursement" | "arrear" | "recovery";

type PayrollRun = {
  _id: string;
  periodKey: string;
  status: string;
  version: number;
  currency: string;
  currencyMinorUnits: number;
  oneTimeInputCount?: number;
  oneTimeInputTotals?: Record<string, number>;
};

type OneTimeInput = {
  _id: string;
  employeeNameSnapshot: string;
  employeeCodeSnapshot: string;
  componentNameSnapshot: string;
  componentCodeSnapshot: string;
  componentCategorySnapshot: string;
  inputType: InputType;
  amountMinor: number;
  currency: string;
  currencyMinorUnits: number;
  reason: string;
  reference?: string;
  status: "active" | "cancelled";
  createdBy?: { name?: string; username?: string; code?: string };
  cancelledBy?: { name?: string; username?: string; code?: string };
  cancellationReason?: string;
  createdAt?: string;
};

type EmployeeOption = {
  employee: string;
  employeeNameSnapshot: string;
  employeeCodeSnapshot: string;
  designationSnapshot?: string;
};

type ComponentOption = {
  _id: string;
  name: string;
  code: string;
  category: "earning" | "deduction" | "employer_contribution" | "reimbursement";
  taxable: boolean;
};

type Props = {
  companyId: string;
  run: PayrollRun;
  onRunChanged: (run: any) => void;
};

const INPUT_TYPES: Array<{ value: InputType; label: string; category: ComponentOption["category"] }> = [
  { value: "earning", label: "One-time earning", category: "earning" },
  { value: "arrear", label: "Salary arrear", category: "earning" },
  { value: "deduction", label: "One-time deduction", category: "deduction" },
  { value: "recovery", label: "Recovery", category: "deduction" },
  { value: "reimbursement", label: "Reimbursement", category: "reimbursement" },
];

function message(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || "Request failed";
}

function inputLabel(value: InputType) {
  return INPUT_TYPES.find((item) => item.value === value)?.label || value;
}

function expectedCategory(value: InputType) {
  return INPUT_TYPES.find((item) => item.value === value)?.category || "earning";
}

function formatMoney(amountMinor: unknown, currency: string, minorUnits: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: minorUnits,
    maximumFractionDigits: minorUnits,
  }).format(Number(amountMinor || 0) / 10 ** minorUnits);
}

function actorName(actor?: { name?: string; username?: string; code?: string }) {
  return actor?.name || actor?.code || actor?.username || "Unknown";
}

function requestKey() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function PayrollOneTimeInputsPanel({ companyId, run, onRunChanged }: Props) {
  const toast = useToast();
  const createDialog = useDisclosure();
  const cancelDialog = useDisclosure();
  const [items, setItems] = useState<OneTimeInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [componentOptions, setComponentOptions] = useState<ComponentOption[]>([]);
  const [employeeOptionsLoading, setEmployeeOptionsLoading] = useState(false);
  const [componentOptionsLoading, setComponentOptionsLoading] = useState(false);
  const [componentSearch, setComponentSearch] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [inputType, setInputType] = useState<InputType>("earning");
  const [componentId, setComponentId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [selectedInput, setSelectedInput] = useState<OneTimeInput | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const subtle = useColorModeValue("gray.50", "whiteAlpha.50");

  const loadInputs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/payroll/runs/${run._id}/one-time-inputs`, {
        params: { companyId, page, limit: 20, search: search.trim(), status, inputType: typeFilter },
      });
      setItems(data.data?.items || []);
      if (data.data?.run && Number(data.data.run.version) !== Number(run.version)) {
        onRunChanged(data.data.run);
      }
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      toast({ title: "Unable to load one-time payroll inputs", description: message(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, onRunChanged, page, run._id, run.version, search, status, typeFilter, toast]);

  const loadEmployeeOptions = useCallback(async () => {
    if (!createDialog.isOpen) return;
    setEmployeeOptionsLoading(true);
    try {
      const { data } = await axios.get(`/payroll/runs/${run._id}/employee-inputs`, {
        params: { companyId, page: 1, limit: 50, search: employeeSearch.trim(), issues: "all" },
      });
      setEmployeeOptions(data.data?.items || []);
    } catch (error) {
      toast({ title: "Unable to load payroll employees", description: message(error), status: "error" });
    } finally {
      setEmployeeOptionsLoading(false);
    }
  }, [companyId, createDialog.isOpen, employeeSearch, run._id, toast]);

  const loadComponentOptions = useCallback(async () => {
    if (!createDialog.isOpen) return;
    setComponentOptionsLoading(true);
    try {
      const { data } = await axios.get("/payroll/components", {
        params: {
          companyId,
          status: "active",
          category: expectedCategory(inputType),
          search: componentSearch.trim(),
          page: 1,
          limit: 50,
        },
      });
      setComponentOptions(data.data || []);
    } catch (error) {
      toast({ title: "Unable to load salary components", description: message(error), status: "error" });
    } finally {
      setComponentOptionsLoading(false);
    }
  }, [companyId, componentSearch, createDialog.isOpen, inputType, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadInputs(), 250);
    return () => window.clearTimeout(timer);
  }, [loadInputs]);

  useEffect(() => {
    if (!createDialog.isOpen) return;
    const timer = window.setTimeout(() => void loadEmployeeOptions(), 250);
    return () => window.clearTimeout(timer);
  }, [createDialog.isOpen, loadEmployeeOptions]);

  useEffect(() => {
    if (!createDialog.isOpen) return;
    const timer = window.setTimeout(() => void loadComponentOptions(), 250);
    return () => window.clearTimeout(timer);
  }, [createDialog.isOpen, loadComponentOptions]);

  const compatibleComponents = useMemo(
    () => componentOptions.filter((component) => component.category === expectedCategory(inputType)),
    [componentOptions, inputType]
  );

  const totals = run.oneTimeInputTotals || {};
  const minorUnits = Number(run.currencyMinorUnits ?? 2);
  const openCreate = () => {
    setEmployeeSearch("");
    setEmployeeOptions([]);
    setEmployeeId("");
    setInputType("earning");
    setComponentId("");
    setComponentSearch("");
    setComponentOptions([]);
    setAmount("");
    setReason("");
    setReference("");
    setIdempotencyKey(requestKey());
    createDialog.onOpen();
  };

  const createInput = async () => {
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/payroll/runs/${run._id}/one-time-inputs`, {
        companyId,
        expectedVersion: run.version,
        employeeId,
        salaryComponentId: componentId,
        inputType,
        amount,
        reason: reason.trim(),
        reference: reference.trim(),
        idempotencyKey,
      });
      onRunChanged(data.data.run);
      toast({ title: data.message || "One-time payroll input added", status: "success" });
      createDialog.onClose();
      setPage(1);
      await loadInputs();
    } catch (error) {
      toast({ title: "Unable to add one-time payroll input", description: message(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const openCancellation = (input: OneTimeInput) => {
    setSelectedInput(input);
    setCancellationReason("");
    cancelDialog.onOpen();
  };

  const cancelInput = async () => {
    if (!selectedInput) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/payroll/runs/${run._id}/one-time-inputs/${selectedInput._id}/cancel`, {
        companyId,
        expectedVersion: run.version,
        reason: cancellationReason.trim(),
      });
      onRunChanged(data.data.run);
      toast({ title: data.message || "One-time payroll input cancelled", status: "success" });
      cancelDialog.onClose();
      await loadInputs();
    } catch (error) {
      toast({ title: "Unable to cancel one-time payroll input", description: message(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = employeeId && componentId && amount && reason.trim().length >= 3;

  return (
    <Stack spacing={4}>
      <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
        <Box><Text fontWeight="800">One-time payroll inputs</Text><Text fontSize="sm" color={muted}>Bonuses, arrears, deductions, recoveries, and reimbursements for this run only.</Text></Box>
        <Button leftIcon={<FiPlus />} colorScheme="blue" isDisabled={run.status !== "draft"} onClick={openCreate}>Add input</Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={3}>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>ACTIVE INPUTS</Text><Text fontWeight="800">{run.oneTimeInputCount || 0}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>EARNINGS + ARREARS</Text><Text fontWeight="800">{formatMoney(Number(totals.earningsMinor || 0) + Number(totals.arrearsMinor || 0), run.currency, minorUnits)}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>DEDUCTIONS + RECOVERIES</Text><Text fontWeight="800">{formatMoney(Number(totals.deductionsMinor || 0) + Number(totals.recoveriesMinor || 0), run.currency, minorUnits)}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>REIMBURSEMENTS</Text><Text fontWeight="800">{formatMoney(totals.reimbursementsMinor, run.currency, minorUnits)}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>NET IMPACT</Text><Text fontWeight="800" color={Number(totals.netImpactMinor || 0) < 0 ? "red.500" : "green.500"}>{formatMoney(totals.netImpactMinor, run.currency, minorUnits)}</Text></Box>
      </SimpleGrid>

      <Flex gap={3} direction={{ base: "column", lg: "row" }} justify="space-between">
        <Input maxW={{ lg: "330px" }} value={search} placeholder="Search employee, component, or reference" onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
        <HStack align="stretch"><Select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }}><option value="all">All types</option>{INPUT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select><Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">All statuses</option><option value="active">Active</option><option value="cancelled">Cancelled</option></Select><IconButton aria-label="Refresh one-time payroll inputs" icon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={() => void loadInputs()} /></HStack>
      </Flex>

      <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
        {loading ? <Stack p={4}>{[1, 2, 3].map((item) => <Skeleton key={item} h="58px" />)}</Stack> : items.length === 0 ? <Box py={12} textAlign="center"><Text fontWeight="700">No one-time inputs found</Text><Text mt={1} fontSize="sm" color={muted}>Add an input or change the current filters.</Text></Box> : (
          <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Employee</Th><Th>Type</Th><Th>Component</Th><Th isNumeric>Amount</Th><Th>Reason / reference</Th><Th>Status</Th><Th textAlign="right">Action</Th></Tr></Thead><Tbody>{items.map((input) => <Tr key={input._id} opacity={input.status === "cancelled" ? 0.65 : 1}>
            <Td><Text fontWeight="700">{input.employeeNameSnapshot}</Text><Text fontSize="xs" color={muted}>{input.employeeCodeSnapshot}</Text></Td>
            <Td><Badge colorScheme={["deduction", "recovery"].includes(input.inputType) ? "red" : input.inputType === "reimbursement" ? "purple" : "green"}>{inputLabel(input.inputType)}</Badge></Td>
            <Td><Text>{input.componentNameSnapshot}</Text><Text fontSize="xs" color={muted}>{input.componentCodeSnapshot}</Text></Td>
            <Td isNumeric fontWeight="700">{formatMoney(input.amountMinor, input.currency, input.currencyMinorUnits)}</Td>
            <Td><Text maxW="320px" whiteSpace="normal">{input.reason}</Text><Text fontSize="xs" color={muted}>{input.reference || "No reference"} | Added by {actorName(input.createdBy)}</Text>{input.cancellationReason ? <Text fontSize="xs" color="red.500">Cancelled: {input.cancellationReason}</Text> : null}</Td>
            <Td><Badge colorScheme={input.status === "active" ? "green" : "gray"}>{input.status}</Badge></Td>
            <Td textAlign="right">{input.status === "active" && run.status === "draft" ? <IconButton aria-label={`Cancel ${inputLabel(input.inputType)} for ${input.employeeNameSnapshot}`} title="Cancel input" icon={<FiXCircle />} size="sm" variant="ghost" colorScheme="red" onClick={() => openCancellation(input)} /> : "-"}</Td>
          </Tr>)}</Tbody></Table></TableContainer>
        )}
        <Flex p={4} borderTopWidth="1px" borderColor={border} justify="space-between" align="center"><Text fontSize="sm" color={muted}>{total} matching input{total === 1 ? "" : "s"}</Text><HStack><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack></Flex>
      </Box>

      <Modal isOpen={createDialog.isOpen} onClose={createDialog.onClose} isCentered size="xl">
        <ModalOverlay /><ModalContent><ModalHeader>Add one-time payroll input</ModalHeader><ModalCloseButton />
          <ModalBody><Stack spacing={4}>
            <FormControl><FormLabel>Find employee</FormLabel><Input value={employeeSearch} placeholder="Search the payroll run by employee name or code" onChange={(event) => { setEmployeeSearch(event.target.value); setEmployeeId(""); }} /><FormHelperText>Only employees imported into this payroll run can be selected.</FormHelperText></FormControl>
            <FormControl isRequired><FormLabel>Employee</FormLabel><Select value={employeeId} isDisabled={employeeOptionsLoading} onChange={(event) => setEmployeeId(event.target.value)}><option value="">Select employee</option>{employeeOptions.map((employee) => <option key={employee.employee} value={employee.employee}>{employee.employeeNameSnapshot} ({employee.employeeCodeSnapshot})</option>)}</Select></FormControl>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired><FormLabel>Input type</FormLabel><Select value={inputType} onChange={(event) => { setInputType(event.target.value as InputType); setComponentId(""); }}>{INPUT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></FormControl>
              <FormControl><FormLabel>Find component</FormLabel><Input value={componentSearch} placeholder={`Search ${expectedCategory(inputType).replace("_", " ")} components`} onChange={(event) => { setComponentSearch(event.target.value); setComponentId(""); }} /><FormHelperText>Results are limited to components compatible with the selected type.</FormHelperText></FormControl>
              <FormControl isRequired><FormLabel>Salary component</FormLabel><Select value={componentId} isDisabled={componentOptionsLoading} onChange={(event) => setComponentId(event.target.value)}><option value="">Select {expectedCategory(inputType).replace("_", " ")} component</option>{compatibleComponents.map((component) => <option key={component._id} value={component._id}>{component.name} ({component.code})</option>)}</Select><FormHelperText>The component controls category and tax treatment.</FormHelperText></FormControl>
              <FormControl isRequired><FormLabel>Amount ({run.currency})</FormLabel><Input inputMode="decimal" value={amount} placeholder={`Example: ${minorUnits ? "1500.00" : "1500"}`} onChange={(event) => setAmount(event.target.value)} /><FormHelperText>Enter a positive amount. Deduction and recovery types reduce net pay automatically.</FormHelperText></FormControl>
              <FormControl><FormLabel>Reference</FormLabel><Input value={reference} maxLength={100} placeholder="Invoice, approval, or adjustment reference" onChange={(event) => setReference(event.target.value)} /></FormControl>
            </SimpleGrid>
            <FormControl isRequired><FormLabel>Reason</FormLabel><Textarea value={reason} maxLength={500} placeholder="Why this one-time amount belongs in this payroll run" onChange={(event) => setReason(event.target.value)} /></FormControl>
          </Stack></ModalBody>
          <ModalFooter gap={3}><Button variant="ghost" onClick={createDialog.onClose}>Cancel</Button><Button colorScheme="blue" isLoading={submitting} isDisabled={!canCreate} onClick={() => void createInput()}>Add to payroll run</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={cancelDialog.isOpen} onClose={cancelDialog.onClose} isCentered>
        <ModalOverlay /><ModalContent><ModalHeader>Cancel one-time input</ModalHeader><ModalCloseButton />
          <ModalBody><Stack spacing={4}><Text>This reverses the amount from the draft run totals and keeps the original entry in audit history.</Text>{selectedInput ? <Box bg={subtle} borderRadius="md" p={3}><Text fontWeight="700">{selectedInput.employeeNameSnapshot} | {inputLabel(selectedInput.inputType)}</Text><Text fontSize="sm">{selectedInput.componentNameSnapshot} | {formatMoney(selectedInput.amountMinor, selectedInput.currency, selectedInput.currencyMinorUnits)}</Text></Box> : null}<FormControl isRequired><FormLabel>Cancellation reason</FormLabel><Textarea value={cancellationReason} maxLength={500} onChange={(event) => setCancellationReason(event.target.value)} /></FormControl></Stack></ModalBody>
          <ModalFooter gap={3}><Button variant="ghost" onClick={cancelDialog.onClose}>Keep input</Button><Button colorScheme="red" isLoading={submitting} isDisabled={cancellationReason.trim().length < 3} onClick={() => void cancelInput()}>Cancel input</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
