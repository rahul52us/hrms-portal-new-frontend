"use client";
import { Alert, AlertIcon, Badge, Box, Button, Input, Select, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetGet, emptyPage, Page, ServiceOrder, serviceCostLabel, serviceStates } from "./assetApi";

export default function AssetServicesList({ reload, onOpen, assetId }: { reload: number; onOpen: (id: string) => void; assetId?: string }) {
  const [rows, setRows] = useState<Page<ServiceOrder>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [status, setStatus] = useState(assetId ? "all" : "active"), [search, setSearch] = useState(""), [query, setQuery] = useState(""), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setRows({ data: [], pagination: emptyPage });
    assetGet<Page<ServiceOrder>>("/service-orders", { status, assetId, search: query || undefined, page, limit: 20 }, controller.signal).then((value) => { if (!controller.signal.aborted) setRows(value); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [status, assetId, page, query, reload]);
  return <Stack spacing={4} minW={0}><Box display="grid" gridTemplateColumns={{ base: "minmax(0, 1fr)", sm: "minmax(0, 2fr) minmax(160px, 1fr)" }} gap={3}><Input aria-label="Search service orders" value={search} placeholder="Asset, service reference or provider" onChange={(event) => setSearch(event.target.value)} /><Select aria-label="Service order status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="active">Active orders</option><option value="all">All orders</option>{Object.entries(serviceStates).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Box>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    <TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr><Th>Asset / order</Th><Th>Provider</Th><Th>Expected completion</Th><Th>Current cycle cost</Th><Th>Status</Th><Th /></Tr></Thead><Tbody>
      {!rows.data.length && <Tr><Td colSpan={6}>{loading ? "Loading service orders..." : "No service orders in this view."}</Td></Tr>}
      {rows.data.map((row) => <Tr key={row._id}><Td whiteSpace="normal" minW="180px"><Text fontWeight="600" overflowWrap="anywhere">{row.assetSnapshot.name}</Text><Text fontSize="xs">{row.assetSnapshot.tag} | {row.reference}</Text></Td><Td whiteSpace="normal">{row.providerName || "Internal team"}</Td><Td>{row.expectedCompletionDate || "Not set"}</Td><Td>{serviceCostLabel(row.actualCostMinor, row.currency)}</Td><Td><Badge colorScheme={row.status === "completed" ? "green" : row.status === "unrepairable" ? "red" : "blue"}>{serviceStates[row.status]}</Badge></Td><Td><Button size="sm" variant="outline" onClick={() => onOpen(row._id)}>Open</Button></Td></Tr>)}
    </Tbody></Table></TableContainer>{rows.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={rows.pagination.totalPages} onPageChange={setPage} />}
  </Stack>;
}
