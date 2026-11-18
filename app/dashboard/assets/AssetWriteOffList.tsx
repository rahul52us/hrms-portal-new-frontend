"use client";
import { Alert, AlertIcon, Badge, Box, Button, Input, Select, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetGet, assetMoneyLabel, emptyPage, Page, statusLabel, WriteOff } from "./assetApi";

export default function AssetWriteOffList({ reload, onOpen }: { reload: number; onOpen: (id: string) => void }) {
  const [rows, setRows] = useState<Page<WriteOff>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [status, setStatus] = useState("pending"), [search, setSearch] = useState(""), [query, setQuery] = useState(""), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setRows({ data: [], pagination: emptyPage });
    assetGet<Page<WriteOff>>("/write-offs", { status, search: query || undefined, page, limit: 20 }, controller.signal).then((value) => { if (!controller.signal.aborted) setRows(value); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [status, page, query, reload]);
  return <Stack spacing={4}><Box display="grid" gridTemplateColumns={{ base: "minmax(0, 1fr)", sm: "minmax(0, 2fr) minmax(160px, 1fr)" }} gap={3}><Input aria-label="Search asset write-offs" value={search} placeholder="Asset, incident, write-off or employee" onChange={(event) => setSearch(event.target.value)} /><Select aria-label="Write-off status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{["pending", "approved", "recovered", "rejected", "withdrawn", "all"].map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</Select></Box>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    <TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr><Th>Asset / request</Th><Th>Last known custody</Th><Th>Recorded loss</Th><Th>Net recovery receipts</Th><Th>Status</Th><Th /></Tr></Thead><Tbody>{!rows.data.length && <Tr><Td colSpan={6}>{loading ? "Loading write-offs..." : "No write-offs in this view."}</Td></Tr>}{rows.data.map((row) => <Tr key={row._id}><Td whiteSpace="normal" minW="180px"><Text fontWeight="600" overflowWrap="anywhere">{row.assetSnapshot.name}</Text><Text fontSize="xs">{row.assetSnapshot.tag} | {row.reference}</Text></Td><Td whiteSpace="normal">{row.lastKnownCustody === "employee" ? row.employeeName : row.lastKnownCustody === "service_provider" ? row.providerName || "Service provider" : "Company"}</Td><Td>{assetMoneyLabel(row.amountMinor, row.currency)}</Td><Td>{assetMoneyLabel(row.recoveredAmountMinor, row.currency)}</Td><Td><Badge colorScheme={row.status === "pending" ? "orange" : row.status === "recovered" ? "green" : "gray"}>{statusLabel(row.status)}</Badge></Td><Td><Button size="sm" variant="outline" onClick={() => onOpen(row._id)}>Open</Button></Td></Tr>)}</Tbody></Table></TableContainer>
    {rows.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={rows.pagination.totalPages} onPageChange={setPage} />}
  </Stack>;
}
