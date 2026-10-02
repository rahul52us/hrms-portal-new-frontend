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
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

type PayrollRun = {
  _id: string;
  status: string;
  version: number;
  currency: string;
  currencyMinorUnits: number;
  employeeSnapshotStatus?: "pending" | "prepared";
  employeeSnapshotVersion?: number;
  employeeSnapshotCount?: number;
  employeeSnapshotIssueCount?: number;
  employeeSnapshotErrorCount?: number;
  employeeSnapshotWarningCount?: number;
  employeeSnapshotCompensationTotals?: Record<string, number>;
  employeeSnapshotsPreparedAt?: string;
};

type SnapshotIssue = {
  code: string;
  severity: "error" | "warning";
  category: string;
  message: string;
};

type PayrollEmployeeSnapshot = {
  _id: string;
  identity: {
    name: string;
    code: string;
    username?: string;
    mobileNumberMasked?: string;
  };
  organization: {
    designation?: string;
    departmentName?: string;
    teamName?: string;
    officeLocationName?: string;
    reportingManagerName?: string;
  };
  bank: {
    bankName?: string;
    accountHolderName?: string;
    accountNumberMasked?: string;
    branch?: string;
    ifsc?: string;
  };
  statutory: {
    panNumberMasked?: string;
    aadharNumberMasked?: string;
    nationality?: string;
  };
  compensation: {
    assigned: boolean;
    structureName?: string;
    structureCode?: string;
    structureVersionNumber?: number | null;
    componentCount?: number;
    currency?: string;
    currencyMinorUnits?: number;
    totals?: Record<string, number>;
  };
  issues: SnapshotIssue[];
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

function displayParts(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" | ") || "Not available";
}

export default function PayrollEmployeeSnapshotsPanel({ companyId, run, onRunChanged }: Props) {
  const toast = useToast();
  const [items, setItems] = useState<PayrollEmployeeSnapshot[]>([]);
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

  const prepared = run.employeeSnapshotStatus === "prepared";
  const minorUnits = Number(run.currencyMinorUnits ?? 2);
  const compensationTotals = run.employeeSnapshotCompensationTotals || {};

  const loadSnapshots = useCallback(async () => {
    if (!prepared) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(`/payroll/runs/${run._id}/employee-snapshots`, {
        params: { companyId, page, limit: 25, search: search.trim(), issues },
      });
      setItems(data.data?.items || []);
      if (data.data?.run && Number(data.data.run.version) !== Number(run.version)) {
        onRunChanged(data.data.run);
      }
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      toast({ title: "Unable to load employee payroll snapshots", description: message(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, issues, onRunChanged, page, prepared, run._id, run.version, search, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSnapshots(), 250);
    return () => window.clearTimeout(timer);
  }, [loadSnapshots]);

  const prepareSnapshots = async () => {
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/payroll/runs/${run._id}/prepare-employee-snapshots`, {
        companyId,
        expectedVersion: run.version,
        reason: reason.trim(),
        refresh: prepared,
      });
      onRunChanged(data.data);
      setReason("");
      setPage(1);
      toast({ title: data.message || (prepared ? "Employee snapshots refreshed" : "Employee snapshots prepared"), status: "success" });
    } catch (error) {
      toast({ title: prepared ? "Unable to refresh employee snapshots" : "Unable to prepare employee snapshots", description: message(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={4}>
      <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
        <Box>
          <Text fontWeight="800">Employee payroll snapshots</Text>
          <Text fontSize="sm" color={muted}>Identity, period organization, payment details, statutory identifiers, and effective compensation frozen for this run.</Text>
        </Box>
        {prepared ? <Badge alignSelf={{ base: "flex-start", md: "center" }} colorScheme="green">Snapshot v{run.employeeSnapshotVersion || 0}</Badge> : <Badge alignSelf={{ base: "flex-start", md: "center" }} colorScheme="orange">Preparation pending</Badge>}
      </Flex>

      <SimpleGrid columns={{ base: 2, lg: 5 }} spacing={3}>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>EMPLOYEES</Text><Text fontSize="xl" fontWeight="800">{run.employeeSnapshotCount || 0}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>WITH ERRORS</Text><Text fontSize="xl" fontWeight="800" color={run.employeeSnapshotErrorCount ? "red.500" : undefined}>{run.employeeSnapshotErrorCount || 0}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>WITH WARNINGS</Text><Text fontSize="xl" fontWeight="800" color={run.employeeSnapshotWarningCount ? "orange.500" : undefined}>{run.employeeSnapshotWarningCount || 0}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>MONTHLY GROSS</Text><Text fontWeight="800">{formatMoney(compensationTotals.monthlyGrossMinor, run.currency, minorUnits)}</Text></Box>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={3}><Text fontSize="xs" color={muted}>MONTHLY NET</Text><Text fontWeight="800">{formatMoney(compensationTotals.monthlyNetMinor, run.currency, minorUnits)}</Text></Box>
      </SimpleGrid>

      <Alert status={prepared ? "info" : "warning"} borderRadius="md" alignItems="flex-start">
        <AlertIcon mt={1} />
        <Box flex="1">
          <Text fontWeight="700">{prepared ? "Refresh only when payroll source data was corrected" : "Prepare employee data before calculating payroll"}</Text>
          <AlertDescription display="block" mt={1}>
            {prepared
              ? "A refresh creates a new immutable snapshot version. Earlier versions remain available for audit."
              : "The snapshot uses period organization data and compensation effective on the cycle end date. Missing data is reported instead of guessed."}
          </AlertDescription>
          <FormControl mt={3} isRequired>
            <FormLabel fontSize="sm">{prepared ? "Refresh reason" : "Preparation reason"}</FormLabel>
            <Textarea value={reason} maxLength={500} rows={2} placeholder={prepared ? "Example: Bank and compensation data corrected before calculation" : "Example: Freeze employee payroll data for calculation"} onChange={(event) => setReason(event.target.value)} />
            <FormHelperText>Minimum 3 characters. Stored in payroll audit history.</FormHelperText>
          </FormControl>
        </Box>
        <Button ml={4} mt={1} leftIcon={prepared ? <FiRefreshCw /> : undefined} colorScheme="blue" variant={prepared ? "outline" : "solid"} isLoading={submitting} isDisabled={run.status !== "draft" || reason.trim().length < 3} onClick={() => void prepareSnapshots()}>{prepared ? "Refresh snapshots" : "Prepare snapshots"}</Button>
      </Alert>

      {prepared ? <Stack spacing={3}>
        <Flex gap={3} direction={{ base: "column", md: "row" }} justify="space-between">
          <Input maxW={{ md: "340px" }} value={search} placeholder="Search employee, organization, or structure" onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          <HStack>
            <Select value={issues} maxW="190px" onChange={(event) => { setIssues(event.target.value); setPage(1); }}><option value="all">All employees</option><option value="errors">With errors</option><option value="warnings">With warnings</option><option value="clean">Ready</option></Select>
            <IconButton aria-label="Refresh employee snapshots" icon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={() => void loadSnapshots()} />
          </HStack>
        </Flex>

        <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          {loading ? <Stack p={4}>{[1, 2, 3].map((item) => <Skeleton key={item} h="72px" />)}</Stack> : items.length === 0 ? <Box py={12} textAlign="center"><Text fontWeight="700">No employee snapshots match</Text><Text mt={1} fontSize="sm" color={muted}>Change the search or issue filter.</Text></Box> : (
            <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Employee</Th><Th>Organization</Th><Th>Bank / statutory</Th><Th>Compensation</Th><Th>Validation</Th></Tr></Thead><Tbody>{items.map((item) => {
              const totals = item.compensation.totals || {};
              const currency = item.compensation.currency || run.currency;
              const rowMinorUnits = Number(item.compensation.currencyMinorUnits ?? minorUnits);
              return <Tr key={item._id}>
                <Td verticalAlign="top"><Text fontWeight="700">{item.identity.name}</Text><Text fontSize="xs" color={muted}>{displayParts([item.identity.code, item.identity.username])}</Text><Text fontSize="xs" color={muted}>{item.identity.mobileNumberMasked || "No mobile"}</Text></Td>
                <Td verticalAlign="top"><Text>{item.organization.designation || "No designation"}</Text><Text maxW="250px" whiteSpace="normal" fontSize="xs" color={muted}>{displayParts([item.organization.departmentName, item.organization.teamName, item.organization.officeLocationName])}</Text><Text fontSize="xs" color={muted}>{item.organization.reportingManagerName ? `Manager: ${item.organization.reportingManagerName}` : "No reporting manager"}</Text></Td>
                <Td verticalAlign="top"><Text>{item.bank.bankName || "No bank"}{item.bank.accountNumberMasked ? ` | ${item.bank.accountNumberMasked}` : ""}</Text><Text fontSize="xs" color={muted}>{item.bank.ifsc || "No IFSC"}</Text><Text fontSize="xs" color={muted}>PAN {item.statutory.panNumberMasked || "-"} | Aadhaar {item.statutory.aadharNumberMasked || "-"}</Text></Td>
                <Td verticalAlign="top">{item.compensation.assigned ? <><Text fontWeight="700">{item.compensation.structureName} v{item.compensation.structureVersionNumber}</Text><Text fontSize="xs" color={muted}>{item.compensation.structureCode} | {item.compensation.componentCount || 0} components</Text><Text fontSize="xs">Gross {formatMoney(totals.monthlyGrossMinor, currency, rowMinorUnits)} | Net {formatMoney(totals.monthlyNetMinor, currency, rowMinorUnits)}</Text></> : <Badge colorScheme="red">Not assigned</Badge>}</Td>
                <Td verticalAlign="top">{item.issues.length ? <Stack align="start" spacing={1}>{item.issues.map((issue) => <Box key={issue.code}><Badge colorScheme={issue.severity === "error" ? "red" : "orange"}>{issue.category} {issue.severity}</Badge><Text mt={1} maxW="260px" whiteSpace="normal" fontSize="xs">{issue.message}</Text></Box>)}</Stack> : <Badge colorScheme="green">Ready</Badge>}</Td>
              </Tr>;
            })}</Tbody></Table></TableContainer>
          )}
          <Flex p={4} borderTopWidth="1px" borderColor={border} justify="space-between" align="center"><Text fontSize="sm" color={muted}>{total} employee snapshot{total === 1 ? "" : "s"}</Text><HStack><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack></Flex>
        </Box>
      </Stack> : null}
    </Stack>
  );
}
