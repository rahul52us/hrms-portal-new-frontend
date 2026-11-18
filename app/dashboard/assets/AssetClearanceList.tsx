"use client";
import { Alert, AlertIcon, Badge, Button, HStack, Input, Select, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetGet, AssetClearance, dateTime, emptyPage, Page, statusLabel } from "./assetApi";

export default function AssetClearanceList({ scope, canManage, reload, onOpen, onCreate }: { scope: "company" | "mine"; canManage: boolean; reload: number; onOpen: (id: string) => void; onCreate: () => void }) {
  const [rows, setRows] = useState<Page<AssetClearance>>({ data: [], pagination: emptyPage }), [search, setSearch] = useState(""), [query, setQuery] = useState(""), [status, setStatus] = useState("all"), [page, setPage] = useState(1), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setRows({ data: [], pagination: emptyPage });
    assetGet<Page<AssetClearance>>("/clearances", { scope, status, page, limit: 20, search: query || undefined }, controller.signal).then((result) => { if (!controller.signal.aborted) setRows(result); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [scope, status, page, query, reload]);
  return <Stack spacing={4} minW={0}><HStack justify="space-between" gap={3} flexWrap="wrap"><Text fontSize="sm">{rows.pagination.total} matching clearances</Text>{canManage && <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={onCreate}>Open clearance</Button>}</HStack>
    <HStack flexWrap="wrap" gap={3}><Input maxW="420px" aria-label="Search clearances" placeholder="Employee name, code or clearance reference" value={search} onChange={(event) => setSearch(event.target.value)} /><Select maxW="220px" aria-label="Clearance status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">All statuses</option>{["open", "cleared", "cancelled"].map((state) => <option key={state} value={state}>{statusLabel(state)}</option>)}</Select></HStack>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    <TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr><Th>Employee / case</Th><Th>Expected last working date</Th><Th>Opened</Th><Th>Status</Th><Th /></Tr></Thead><Tbody>{!rows.data.length && <Tr><Td colSpan={5}>{loading ? "Loading clearances..." : "No asset clearances found."}</Td></Tr>}{rows.data.map((row) => <Tr key={row._id}><Td whiteSpace="normal"><Text fontWeight="600">{row.employeeName}</Text><Text fontSize="xs">{row.employeeCode} | {row.reference}</Text></Td><Td>{row.lastWorkingDate}</Td><Td>{dateTime(row.openedAt)}</Td><Td><Badge colorScheme={row.status === "cleared" ? "green" : row.status === "open" ? "orange" : "gray"}>{statusLabel(row.status)}</Badge></Td><Td><Button size="sm" variant="outline" onClick={() => onOpen(row._id)}>Open</Button></Td></Tr>)}</Tbody></Table></TableContainer>
    {rows.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={rows.pagination.totalPages} onPageChange={setPage} />}
  </Stack>;
}
