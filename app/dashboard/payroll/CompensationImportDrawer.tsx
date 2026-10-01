"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import axios from "axios";
import {
  Alert, AlertDescription, AlertIcon, Badge, Box, Button, Flex, FormControl,
  FormHelperText, FormLabel, HStack, Input, Select, SimpleGrid, Stack, Table,
  TableContainer, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue, useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FiCheckCircle, FiDownload, FiEye, FiUploadCloud } from "react-icons/fi";

type ImportRow = {
  _id: string;
  rowNumber: number;
  employeeCode: string;
  employeeName?: string | null;
  salaryStructureCode: string;
  structureVersionNumber?: number | null;
  effectiveFrom: string;
  overrideInputs: Array<{ componentCode: string; amount: string }>;
  status: "valid" | "invalid" | "committed";
  errors: string[];
  currency?: string | null;
  currencyMinorUnits?: number | null;
  previewTotals?: { monthlyGrossMinor?: number; monthlyNetMinor?: number };
};

type ImportBatch = {
  _id: string;
  status: "previewed" | "completed" | "failed";
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  committedRows?: number;
  createdAt?: string;
  createdBy?: { name?: string; username?: string } | null;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };
type Props = { companyId: string; isOpen: boolean; onClose: () => void; onCommitted: () => void };

function errorMessage(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || "Request failed";
}

function formatMoney(value: number | undefined, currency = "INR", minorUnits = 2) {
  const amount = Number(value || 0) / 10 ** minorUnits;
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: minorUnits }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(minorUnits)}`;
  }
}

export default function CompensationImportDrawer({ companyId, isOpen, onClose, onCommitted }: Props) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [recentBatches, setRecentBatches] = useState<ImportBatch[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewing, setPreviewing] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const subtle = useColorModeValue("gray.50", "whiteAlpha.50");

  const reset = () => {
    setFile(null);
    setBatch(null);
    setRows([]);
    setPagination({ page: 1, limit: 50, total: 0, totalPages: 0 });
    setStatusFilter("all");
  };

  const close = () => {
    reset();
    onClose();
  };

  const loadBatches = useCallback(async () => {
    if (!companyId || !isOpen) return;
    setLoadingBatches(true);
    try {
      const { data } = await axios.get("/payroll/compensation/import", {
        params: { companyId, page: 1, limit: 10, status: "all" },
      });
      setRecentBatches(data.data || []);
    } catch (error) {
      toast({ title: "Unable to load compensation import history", description: errorMessage(error), status: "error" });
    } finally {
      setLoadingBatches(false);
    }
  }, [companyId, isOpen, toast]);

  useEffect(() => { void loadBatches(); }, [loadBatches]);

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      const response = await axios.get("/payroll/compensation/import/template", {
        params: { companyId },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "compensation-import-template.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Unable to download compensation template", description: errorMessage(error), status: "error" });
    } finally {
      setDownloading(false);
    }
  };

  const previewFile = async () => {
    if (!file) return;
    setPreviewing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("companyId", companyId);
      const { data } = await axios.post("/payroll/compensation/import/preview", form);
      setBatch(data.data?.batch || null);
      setRows(data.data?.rows || []);
      setPagination(data.data?.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      setStatusFilter("all");
      void loadBatches();
      toast({ title: data.message || "Compensation preview created", status: data.data?.batch?.invalidRows ? "warning" : "success" });
    } catch (error) {
      toast({ title: "Unable to preview compensation import", description: errorMessage(error), status: "error" });
    } finally {
      setPreviewing(false);
    }
  };

  const loadRows = async (page: number, status = statusFilter, targetBatchId = batch?._id) => {
    if (!targetBatchId) return;
    setLoadingRows(true);
    try {
      const { data } = await axios.get(`/payroll/compensation/import/${targetBatchId}`, {
        params: { companyId, page, limit: 50, status },
      });
      setBatch(data.data?.batch || batch);
      setRows(data.data?.rows || []);
      setPagination(data.pagination || { page, limit: 50, total: 0, totalPages: 0 });
    } catch (error) {
      toast({ title: "Unable to load import rows", description: errorMessage(error), status: "error" });
    } finally {
      setLoadingRows(false);
    }
  };

  const openBatch = async (selected: ImportBatch) => {
    setBatch(selected);
    setRows([]);
    setStatusFilter("all");
    await loadRows(1, "all", selected._id);
  };

  const commit = async () => {
    if (!batch) return;
    setCommitting(true);
    try {
      const { data } = await axios.post(`/payroll/compensation/import/${batch._id}/commit`, { companyId });
      setBatch((current) => current ? { ...current, status: "completed", committedRows: data.data?.committedRows || current.totalRows } : current);
      toast({ title: "Compensation import committed", description: `${data.data?.committedRows || batch.totalRows} assignments created.`, status: "success" });
      await loadRows(1, "committed");
      setStatusFilter("committed");
      void loadBatches();
      onCommitted();
    } catch (error) {
      toast({ title: "Unable to commit compensation import", description: errorMessage(error), status: "error" });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={close}
      titlePrefix="Bulk"
      titleSuffix="compensation import"
      subtitle="Preview every row before creating effective-dated salary assignments"
      maxW={{ base: "100%", md: "90%" }}
      footerContent={<Flex w="full" justify="space-between" gap={3} wrap="wrap"><Button variant="ghost" onClick={close}>Close</Button>{batch?.status === "previewed" ? <Button colorScheme="blue" leftIcon={<FiCheckCircle />} isLoading={committing} isDisabled={batch.invalidRows > 0 || batch.validRows !== batch.totalRows} onClick={() => void commit()}>Commit {batch.validRows} assignments</Button> : null}</Flex>}
    >
      <Stack spacing={5}>
        <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
          <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
            <Box><Text fontWeight="800">Import file</Text><Text mt={1} fontSize="sm" color={muted}>Use the generated template. Files may contain up to 1,000 rows and must be CSV or XLSX.</Text></Box>
            <Button leftIcon={<FiDownload />} variant="outline" isLoading={downloading} onClick={() => void downloadTemplate()}>Download template</Button>
          </Flex>
          <FormControl mt={4}><FormLabel>Compensation file</FormLabel><Input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" p={1} isDisabled={previewing || committing} onChange={(event) => { setFile(event.target.files?.[0] || null); setBatch(null); setRows([]); }} /><FormHelperText>Override columns contain normal currency amounts such as 60000.00. Leave them blank to use structure values.</FormHelperText></FormControl>
          <Flex mt={4} justify="flex-end"><Button leftIcon={<FiUploadCloud />} colorScheme="blue" isDisabled={!file} isLoading={previewing} onClick={() => void previewFile()}>Validate and preview</Button></Flex>
        </Box>

        {!batch ? <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          <Flex p={4} justify="space-between" align="center"><Box><Text fontWeight="800">Recent imports</Text><Text fontSize="sm" color={muted}>Reopen previous previews and committed audit results.</Text></Box>{loadingBatches ? <Badge colorScheme="blue">Loading</Badge> : null}</Flex>
          {recentBatches.length ? <Stack spacing={0}>{recentBatches.map((item) => <Flex key={item._id} px={4} py={3} borderTopWidth="1px" borderColor={border} justify="space-between" align="center" gap={4}><Box><HStack><Text fontWeight="700">{item.fileName}</Text><Badge colorScheme={item.status === "completed" ? "green" : item.invalidRows ? "red" : "blue"}>{item.status}</Badge></HStack><Text fontSize="xs" color={muted}>{item.totalRows} rows | {item.validRows} valid | {item.invalidRows} invalid{item.createdAt ? ` | ${new Date(item.createdAt).toLocaleString()}` : ""}</Text></Box><Button size="sm" variant="ghost" leftIcon={<FiEye />} onClick={() => void openBatch(item)}>View</Button></Flex>)}</Stack> : <Box px={4} py={8} borderTopWidth="1px" borderColor={border} textAlign="center"><Text color={muted}>No import history yet.</Text></Box>}
        </Box> : null}

        {batch ? <>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>Rows</Text><Text fontSize="xl" fontWeight="800">{batch.totalRows}</Text></Box>
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>Valid</Text><Text fontSize="xl" fontWeight="800" color="green.500">{batch.validRows}</Text></Box>
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>Invalid</Text><Text fontSize="xl" fontWeight="800" color={batch.invalidRows ? "red.500" : undefined}>{batch.invalidRows}</Text></Box>
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>Status</Text><Badge mt={1} colorScheme={batch.status === "completed" ? "green" : batch.invalidRows ? "red" : "blue"}>{batch.status}</Badge></Box>
          </SimpleGrid>

          {batch.invalidRows > 0 ? <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>Nothing has been imported. Correct every invalid row in the file, then create a new preview.</AlertDescription></Alert> : batch.status === "previewed" ? <Alert status="success" borderRadius="md"><AlertIcon /><AlertDescription>All rows passed validation. Commit will create every assignment atomically.</AlertDescription></Alert> : <Alert status="success" borderRadius="md"><AlertIcon /><AlertDescription>{batch.committedRows || batch.totalRows} compensation assignments were committed.</AlertDescription></Alert>}

          <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
            <Flex p={4} justify="space-between" align="center" gap={3} wrap="wrap"><Box><Text fontWeight="800">Row validation</Text><Text fontSize="sm" color={muted}>Batch {batch._id}</Text></Box><HStack><Button size="sm" variant="ghost" onClick={() => { setBatch(null); setRows([]); setStatusFilter("all"); }}>Import history</Button><Select maxW="180px" value={statusFilter} onChange={(event) => { const status = event.target.value; setStatusFilter(status); void loadRows(1, status); }}><option value="all">All rows</option><option value="invalid">Invalid rows</option><option value="valid">Valid rows</option><option value="committed">Committed rows</option></Select></HStack></Flex>
            <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Row</Th><Th>Employee</Th><Th>Structure</Th><Th>Effective date</Th><Th>Monthly preview</Th><Th>Validation</Th></Tr></Thead><Tbody>{rows.map((row) => <Tr key={row._id}><Td>{row.rowNumber}</Td><Td><Text fontWeight="700">{row.employeeCode || "Missing"}</Text><Text fontSize="xs" color={muted}>{row.employeeName || "-"}</Text></Td><Td><Text>{row.salaryStructureCode || "Missing"}</Text><Text fontSize="xs" color={muted}>{row.structureVersionNumber ? `Version ${row.structureVersionNumber}` : "-"}{row.overrideInputs.length ? ` | ${row.overrideInputs.length} override${row.overrideInputs.length === 1 ? "" : "s"}` : ""}</Text></Td><Td>{row.effectiveFrom || "-"}</Td><Td>{row.status !== "invalid" ? <Box><Text>{formatMoney(row.previewTotals?.monthlyGrossMinor, row.currency || "INR", row.currencyMinorUnits ?? 2)} gross</Text><Text fontSize="xs" color={muted}>{formatMoney(row.previewTotals?.monthlyNetMinor, row.currency || "INR", row.currencyMinorUnits ?? 2)} net</Text></Box> : "-"}</Td><Td><Badge colorScheme={row.status === "invalid" ? "red" : row.status === "committed" ? "green" : "blue"}>{row.status}</Badge>{row.errors.map((error, index) => <Text key={`${row._id}-${index}`} mt={1} fontSize="xs" color="red.500">{error}</Text>)}</Td></Tr>)}</Tbody></Table></TableContainer>
            {rows.length === 0 ? <Box py={10} textAlign="center"><Text color={muted}>No rows match this status.</Text></Box> : null}
            <Flex p={4} borderTopWidth="1px" borderColor={border} justify="space-between" align="center"><Text fontSize="sm" color={muted}>{pagination.total} row{pagination.total === 1 ? "" : "s"}</Text><HStack><Button size="sm" variant="outline" isDisabled={pagination.page <= 1 || loadingRows} onClick={() => void loadRows(pagination.page - 1)}>Previous</Button><Text fontSize="sm">{pagination.page} / {Math.max(1, pagination.totalPages)}</Text><Button size="sm" variant="outline" isDisabled={pagination.page >= pagination.totalPages || loadingRows} onClick={() => void loadRows(pagination.page + 1)}>Next</Button></HStack></Flex>
          </Box>
        </> : null}
      </Stack>
    </DashboardDrawer>
  );
}
