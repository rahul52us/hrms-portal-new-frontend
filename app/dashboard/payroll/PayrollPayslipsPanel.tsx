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
import { FiDownload, FiFileText, FiRefreshCw } from "react-icons/fi";

type PayrollRun = {
  _id: string;
  status: string;
  periodKey: string;
  currency: string;
  currencyMinorUnits: number;
  finalizationVersion?: number;
  finalizedResultCount?: number;
};

type Payslip = {
  _id: string;
  payslipNumber: string;
  periodKey: string;
  finalizationVersion: number;
  currency: string;
  currencyMinorUnits: number;
  employeeSnapshot: {
    name: string;
    code: string;
    designation?: string;
    departmentName?: string;
    teamName?: string;
    officeLocationName?: string;
  };
  amountsSnapshot: {
    grossEarningsMinor: number;
    totalDeductionsMinor: number;
    totalReimbursementsMinor: number;
    netPayMinor: number;
  };
  contentHash: string;
  issuedAt: string;
  issuedBy?: { name?: string; code?: string; username?: string };
};

type Props = { companyId: string; run: PayrollRun };

const errorMessage = (error: any) => error?.response?.data?.message || error?.response?.data?.error || "Request failed";

function formatMoney(amountMinor: unknown, currency: string, minorUnits: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: minorUnits,
    maximumFractionDigits: minorUnits,
  }).format(Number(amountMinor || 0) / 10 ** minorUnits);
}

function filenameFromDisposition(value: string, fallback: string) {
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(value)?.[1];
  const regular = /filename="?([^";]+)"?/i.exec(value)?.[1];
  return encoded ? decodeURIComponent(encoded) : regular || fallback;
}

export default function PayrollPayslipsPanel({ companyId, run }: Props) {
  const toast = useToast();
  const issueDialog = useDisclosure();
  const [items, setItems] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [downloadingId, setDownloadingId] = useState("");
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expected, setExpected] = useState(Number(run.finalizedResultCount || 0));
  const [totalPages, setTotalPages] = useState(1);
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const subtle = useColorModeValue("gray.50", "whiteAlpha.50");
  const minorUnits = Number(run.currencyMinorUnits ?? 2);

  const load = useCallback(async () => {
    if (!run.finalizationVersion) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/payroll/runs/${run._id}/payslips`, {
        params: { companyId, finalizationVersion: run.finalizationVersion, page, limit: 25, search: search.trim() },
      });
      setItems(data.data?.items || []);
      setExpected(Number(data.data?.expectedCount || 0));
      setTotal(Number(data.pagination?.total || 0));
      setTotalPages(Number(data.pagination?.totalPages || 1));
    } catch (error) {
      toast({ title: "Unable to load payslips", description: errorMessage(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, page, run._id, run.finalizationVersion, search, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const issue = async () => {
    setIssuing(true);
    try {
      const { data } = await axios.post(`/payroll/runs/${run._id}/payslips/issue`, {
        companyId,
        reason: reason.trim(),
      });
      toast({ title: data.message || "Payslips issued", status: "success" });
      issueDialog.onClose();
      setReason("");
      setPage(1);
      await load();
    } catch (error) {
      toast({ title: "Unable to issue payslips", description: errorMessage(error), status: "error" });
    } finally {
      setIssuing(false);
    }
  };

  const download = async (item: Payslip) => {
    setDownloadingId(item._id);
    try {
      const response = await axios.get(`/payroll/runs/${run._id}/payslips/${item._id}/download`, {
        params: { companyId },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFromDisposition(String(response.headers["content-disposition"] || ""), `${item.payslipNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Unable to download payslip", description: errorMessage(error), status: "error" });
    } finally {
      setDownloadingId("");
    }
  };

  const complete = expected > 0 && total === expected;

  return <Stack spacing={4}>
    <Flex justify="space-between" gap={3} direction={{ base: "column", md: "row" }} align={{ md: "center" }}>
      <Box>
        <Text fontWeight="800">Issued payslips</Text>
        <Text fontSize="sm" color={muted}>Generate employee PDFs only from finalization v{run.finalizationVersion}. Reissuing the same version is idempotent.</Text>
      </Box>
      <HStack alignSelf={{ base: "flex-start", md: "center" }}>
        <Badge colorScheme={complete ? "green" : total ? "orange" : "gray"}>{total} / {expected} issued</Badge>
        <Button leftIcon={<FiFileText />} colorScheme="blue" isDisabled={run.status !== "finalized" || !expected} onClick={issueDialog.onOpen}>
          {total ? "Complete issuance" : "Issue payslips"}
        </Button>
      </HStack>
    </Flex>

    <Alert status={complete ? "success" : "info"} borderRadius="md">
      <AlertIcon />
      <AlertDescription>{complete ? "Every finalized employee result has an issued payslip. Employees can now download their own PDF." : "Employees cannot see a payslip until it is issued. Issuance freezes company identity, employee identity, finalization version, template version, and integrity evidence."}</AlertDescription>
    </Alert>

    <Flex gap={3} justify="space-between" direction={{ base: "column", md: "row" }}>
      <Input maxW={{ md: "360px" }} placeholder="Search employee or organization" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      <IconButton aria-label="Refresh payslips" icon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={() => void load()} />
    </Flex>

    <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
      {loading ? <Stack p={4}>{[1, 2, 3].map((value) => <Skeleton key={value} h="64px" />)}</Stack> : items.length === 0 ? (
        <Box py={12} textAlign="center"><Text fontWeight="700">No payslips issued</Text><Text mt={1} fontSize="sm" color={muted}>Issue this finalized payroll to make payslips available to employees.</Text></Box>
      ) : <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Employee</Th><Th>Organization</Th><Th>Gross</Th><Th>Deductions</Th><Th>Net pay</Th><Th>Issued</Th><Th>Integrity</Th><Th /></Tr></Thead><Tbody>{items.map((item) => <Tr key={item._id}>
        <Td><Text fontWeight="700">{item.employeeSnapshot.name}</Text><Text fontSize="xs" color={muted}>{item.employeeSnapshot.code}{item.employeeSnapshot.designation ? ` | ${item.employeeSnapshot.designation}` : ""}</Text></Td>
        <Td><Text maxW="250px" whiteSpace="normal">{[item.employeeSnapshot.departmentName, item.employeeSnapshot.teamName, item.employeeSnapshot.officeLocationName].filter(Boolean).join(" | ") || "Not assigned"}</Text></Td>
        <Td>{formatMoney(item.amountsSnapshot.grossEarningsMinor, item.currency || run.currency, Number(item.currencyMinorUnits ?? minorUnits))}</Td>
        <Td>{formatMoney(item.amountsSnapshot.totalDeductionsMinor, item.currency || run.currency, Number(item.currencyMinorUnits ?? minorUnits))}</Td>
        <Td fontWeight="800">{formatMoney(item.amountsSnapshot.netPayMinor, item.currency || run.currency, Number(item.currencyMinorUnits ?? minorUnits))}</Td>
        <Td><Text fontSize="sm">{new Date(item.issuedAt).toLocaleDateString()}</Text><Text fontSize="xs" color={muted}>v{item.finalizationVersion}</Text></Td>
        <Td><Badge colorScheme="green">{item.contentHash.slice(0, 10)}</Badge></Td>
        <Td><IconButton aria-label={`Download ${item.employeeSnapshot.name} payslip`} title="Download PDF" icon={<FiDownload />} size="sm" variant="ghost" isLoading={downloadingId === item._id} onClick={() => void download(item)} /></Td>
      </Tr>)}</Tbody></Table></TableContainer>}
      <Flex p={4} borderTopWidth="1px" borderColor={border} justify="space-between" align="center"><Text fontSize="sm" color={muted}>{total} issued payslip{total === 1 ? "" : "s"}</Text><HStack><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack></Flex>
    </Box>

    <Modal isOpen={issueDialog.isOpen} onClose={issueDialog.onClose} isCentered size="lg">
      <ModalOverlay /><ModalContent><ModalHeader>Issue employee payslips</ModalHeader><ModalCloseButton />
        <ModalBody><Stack spacing={4}>
          <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>This publishes finalization v{run.finalizationVersion} to employees. Existing payslips are never overwritten; a later payroll finalization creates a separate version.</AlertDescription></Alert>
          <FormControl isRequired><FormLabel>Issuance reason</FormLabel><Textarea value={reason} maxLength={500} placeholder="Example: Final payroll approved and ready for employee release" onChange={(event) => setReason(event.target.value)} /><FormHelperText>Minimum 3 characters. Stored in payroll audit history.</FormHelperText></FormControl>
        </Stack></ModalBody>
        <ModalFooter gap={3}><Button variant="ghost" onClick={issueDialog.onClose}>Cancel</Button><Button colorScheme="blue" isLoading={issuing} isDisabled={reason.trim().length < 3} onClick={() => void issue()}>Issue payslips</Button></ModalFooter>
      </ModalContent>
    </Modal>
  </Stack>;
}
