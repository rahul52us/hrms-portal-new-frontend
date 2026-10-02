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
import { FiCheck, FiRefreshCw, FiRotateCcw } from "react-icons/fi";

type PayrollRun = {
  _id: string;
  status: string;
  version: number;
  calculationStatus?: "pending" | "calculated" | "stale";
  calculationVersion?: number;
};

type ValidationSummary = {
  totalIssues: number;
  errorIssues: number;
  warningIssues: number;
  openWarnings: number;
  acknowledgedWarnings: number;
  ready: boolean;
};

type ValidationItem = {
  employeePayrollResult: string;
  employee: string;
  identity: { name: string; code: string; username?: string };
  organization: {
    designation?: string;
    departmentName?: string;
    teamName?: string;
    officeLocationName?: string;
  };
  issue: {
    code: string;
    severity: "error" | "warning";
    category: string;
    message: string;
  };
  resolutionStatus: "open" | "acknowledged";
  latestDecision?: {
    action?: "acknowledge" | "reopen";
    reason?: string;
    actorName?: string;
    actorCode?: string;
    createdAt?: string;
  };
  recommendedAction: string;
  canDecide: boolean;
};

type Props = {
  companyId: string;
  run: PayrollRun;
  onRunChanged: (run: any) => void;
};

const EMPTY_SUMMARY: ValidationSummary = {
  totalIssues: 0,
  errorIssues: 0,
  warningIssues: 0,
  openWarnings: 0,
  acknowledgedWarnings: 0,
  ready: false,
};

const CATEGORIES = [
  "identity",
  "organization",
  "bank",
  "statutory",
  "attendance",
  "compensation",
  "one_time_input",
  "calculation",
];

function message(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || "Request failed";
}

function organization(item: ValidationItem) {
  return [item.organization.departmentName, item.organization.teamName, item.organization.officeLocationName]
    .filter(Boolean)
    .join(" | ") || "Not assigned";
}

export default function PayrollValidationPanel({ companyId, run, onRunChanged }: Props) {
  const toast = useToast();
  const decisionDialog = useDisclosure();
  const [items, setItems] = useState<ValidationItem[]>([]);
  const [summary, setSummary] = useState<ValidationSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [category, setCategory] = useState("all");
  const [resolution, setResolution] = useState("all");
  const [selectedIssue, setSelectedIssue] = useState<ValidationItem | null>(null);
  const [decisionAction, setDecisionAction] = useState<"acknowledge" | "reopen">("acknowledge");
  const [reason, setReason] = useState("");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const subtle = useColorModeValue("gray.50", "whiteAlpha.50");

  const hasCalculation = Number(run.calculationVersion || 0) > 0;
  const isStale = run.calculationStatus === "stale";

  const loadValidation = useCallback(async () => {
    if (!hasCalculation) {
      setItems([]);
      setSummary(EMPTY_SUMMARY);
      setTotal(0);
      setTotalPages(1);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(`/payroll/runs/${run._id}/validation`, {
        params: { companyId, page, limit: 25, search: search.trim(), severity, category, resolution },
      });
      setItems(data.data?.items || []);
      setSummary(data.data?.summary || EMPTY_SUMMARY);
      if (data.data?.run && Number(data.data.run.version) !== Number(run.version)) onRunChanged(data.data.run);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      toast({ title: "Unable to load payroll validation", description: message(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [category, companyId, hasCalculation, onRunChanged, page, resolution, run._id, run.version, search, severity, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadValidation(), 250);
    return () => window.clearTimeout(timer);
  }, [loadValidation]);

  const openDecision = (item: ValidationItem) => {
    const action = item.resolutionStatus === "acknowledged" ? "reopen" : "acknowledge";
    setSelectedIssue(item);
    setDecisionAction(action);
    setReason("");
    decisionDialog.onOpen();
  };

  const submitDecision = async () => {
    if (!selectedIssue) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `/payroll/runs/${run._id}/validation/${selectedIssue.employeePayrollResult}/issues/${encodeURIComponent(selectedIssue.issue.code)}/decision`,
        {
          companyId,
          expectedVersion: run.version,
          issueCategory: selectedIssue.issue.category,
          action: decisionAction,
          reason: reason.trim(),
        }
      );
      onRunChanged(data.data);
      toast({ title: data.message || "Payroll validation decision saved", status: "success" });
      decisionDialog.onClose();
      await loadValidation();
    } catch (error) {
      toast({ title: "Unable to save validation decision", description: message(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={4}>
      <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
        <Box><Text fontWeight="800">Payroll validation</Text><Text fontSize="sm" color={muted}>Resolve blocking source errors and explicitly review every non-blocking warning before approval.</Text></Box>
        {summary.ready ? <Badge alignSelf={{ base: "flex-start", md: "center" }} colorScheme="green">Validation ready</Badge> : <Badge alignSelf={{ base: "flex-start", md: "center" }} colorScheme={isStale ? "orange" : "red"}>{isStale ? "Calculation stale" : "Action required"}</Badge>}
      </Flex>

      <SimpleGrid columns={{ base: 2, lg: 5 }} spacing={3}>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>TOTAL ISSUES</Text><Text fontSize="xl" fontWeight="800">{summary.totalIssues}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>BLOCKING ERRORS</Text><Text fontSize="xl" fontWeight="800" color={summary.errorIssues ? "red.500" : undefined}>{summary.errorIssues}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>OPEN WARNINGS</Text><Text fontSize="xl" fontWeight="800" color={summary.openWarnings ? "orange.500" : undefined}>{summary.openWarnings}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>ACKNOWLEDGED</Text><Text fontSize="xl" fontWeight="800">{summary.acknowledgedWarnings}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>CALCULATION</Text><Text fontWeight="800">{hasCalculation ? `Version ${run.calculationVersion}` : "Not calculated"}</Text></Box>
      </SimpleGrid>

      {!hasCalculation ? <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>Calculate draft payroll before reviewing validation issues.</AlertDescription></Alert> : isStale ? <Alert status="warning" borderRadius="md"><AlertIcon /><Box><Text fontWeight="700">Recalculation required</Text><AlertDescription>The displayed issues belong to the previous calculation. Warning decisions are disabled until payroll is recalculated.</AlertDescription></Box></Alert> : summary.ready ? <Alert status="success" borderRadius="md"><AlertIcon /><Box><Text fontWeight="700">Payroll validation is complete</Text><AlertDescription>There are no blocking errors and every warning has been acknowledged. The run is ready for the approval workflow.</AlertDescription></Box></Alert> : <Alert status="info" borderRadius="md"><AlertIcon /><Box><Text fontWeight="700">How resolution works</Text><AlertDescription>Errors cannot be waived. Correct their source, refresh snapshots if required, and recalculate. Warnings may be acknowledged with a reason and reopened later.</AlertDescription></Box></Alert>}

      {hasCalculation ? <Stack spacing={3}>
        <Flex gap={3} wrap="wrap" align="center">
          <Input flex="1" minW="220px" maxW="340px" value={search} placeholder="Search employee or issue" onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          <Select value={severity} maxW="160px" onChange={(event) => { setSeverity(event.target.value); setPage(1); }}><option value="all">All severity</option><option value="error">Errors</option><option value="warning">Warnings</option></Select>
          <Select value={category} maxW="190px" onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="all">All categories</option>{CATEGORIES.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</Select>
          <Select value={resolution} maxW="180px" onChange={(event) => { setResolution(event.target.value); setPage(1); }}><option value="all">All resolution</option><option value="open">Open</option><option value="acknowledged">Acknowledged</option></Select>
          <IconButton aria-label="Refresh payroll validation" icon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={() => void loadValidation()} />
        </Flex>

        <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          {loading ? <Stack p={4}>{[1, 2, 3].map((item) => <Skeleton key={item} h="76px" />)}</Stack> : items.length === 0 ? <Box py={12} textAlign="center"><Text fontWeight="700">No validation issues match</Text><Text mt={1} fontSize="sm" color={muted}>The current filters may exclude existing issues.</Text></Box> : (
            <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Employee</Th><Th>Severity</Th><Th>Issue</Th><Th>Recommended resolution</Th><Th>Status</Th><Th textAlign="right">Action</Th></Tr></Thead><Tbody>{items.map((item) => <Tr key={`${item.employeePayrollResult}-${item.issue.category}-${item.issue.code}`}>
              <Td verticalAlign="top"><Text fontWeight="700">{item.identity.name}</Text><Text fontSize="xs" color={muted}>{item.identity.code}{item.organization.designation ? ` | ${item.organization.designation}` : ""}</Text><Text maxW="220px" whiteSpace="normal" fontSize="xs" color={muted}>{organization(item)}</Text></Td>
              <Td verticalAlign="top"><Badge colorScheme={item.issue.severity === "error" ? "red" : "orange"}>{item.issue.severity}</Badge><Text mt={1} fontSize="xs" color={muted}>{item.issue.category.replaceAll("_", " ")}</Text></Td>
              <Td verticalAlign="top"><Text maxW="300px" whiteSpace="normal" fontWeight="700">{item.issue.message}</Text><Text mt={1} fontSize="xs" color={muted}>{item.issue.code.replaceAll("_", " ")}</Text></Td>
              <Td verticalAlign="top"><Text maxW="330px" whiteSpace="normal" fontSize="sm">{item.recommendedAction}</Text></Td>
              <Td verticalAlign="top">{item.issue.severity === "error" ? <Badge colorScheme="red">Blocking</Badge> : <><Badge colorScheme={item.resolutionStatus === "acknowledged" ? "green" : "orange"}>{item.resolutionStatus}</Badge>{item.latestDecision?.reason ? <Box mt={2}><Text maxW="260px" whiteSpace="normal" fontSize="xs">{item.latestDecision.reason}</Text><Text fontSize="xs" color={muted}>{item.latestDecision.actorName || "Payroll reviewer"}{item.latestDecision.createdAt ? ` | ${new Date(item.latestDecision.createdAt).toLocaleString()}` : ""}</Text></Box> : null}</>}</Td>
              <Td verticalAlign="top" textAlign="right">{item.issue.severity === "warning" ? <Button size="sm" variant={item.resolutionStatus === "acknowledged" ? "outline" : "solid"} colorScheme={item.resolutionStatus === "acknowledged" ? "gray" : "blue"} leftIcon={item.resolutionStatus === "acknowledged" ? <FiRotateCcw /> : <FiCheck />} isDisabled={!item.canDecide} onClick={() => openDecision(item)}>{item.resolutionStatus === "acknowledged" ? "Reopen" : "Acknowledge"}</Button> : <Text fontSize="xs" color={muted}>Correct source</Text>}</Td>
            </Tr>)}</Tbody></Table></TableContainer>
          )}
          <Flex p={4} borderTopWidth="1px" borderColor={border} justify="space-between" align="center"><Text fontSize="sm" color={muted}>{total} validation issue{total === 1 ? "" : "s"}</Text><HStack><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack></Flex>
        </Box>
      </Stack> : null}

      <Modal isOpen={decisionDialog.isOpen} onClose={decisionDialog.onClose} isCentered size="lg">
        <ModalOverlay /><ModalContent><ModalHeader>{decisionAction === "acknowledge" ? "Acknowledge payroll warning" : "Reopen payroll warning"}</ModalHeader><ModalCloseButton />
          <ModalBody><Stack spacing={4}>{selectedIssue ? <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontWeight="800">{selectedIssue.identity.name}</Text><Text mt={1} fontSize="sm">{selectedIssue.issue.message}</Text></Box> : null}<FormControl isRequired><FormLabel>Reason</FormLabel><Textarea value={reason} maxLength={500} rows={4} placeholder={decisionAction === "acknowledge" ? "Explain why payroll may proceed with this warning" : "Explain why this warning needs review again"} onChange={(event) => setReason(event.target.value)} /><FormHelperText>Minimum 3 characters. The decision and actor are stored permanently.</FormHelperText></FormControl></Stack></ModalBody>
          <ModalFooter gap={3}><Button variant="ghost" onClick={decisionDialog.onClose}>Cancel</Button><Button colorScheme="blue" isLoading={submitting} isDisabled={reason.trim().length < 3} onClick={() => void submitDecision()}>{decisionAction === "acknowledge" ? "Acknowledge warning" : "Reopen warning"}</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
