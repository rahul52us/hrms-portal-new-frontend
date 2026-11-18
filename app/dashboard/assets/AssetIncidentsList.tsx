"use client";
import { Alert, AlertIcon, Badge, Box, Button, Input, Select, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetGet, dateTime, emptyPage, Incident, incidentKinds, Page, statusLabel } from "./assetApi";

export default function AssetIncidentsList({ scope, reload, onOpen }: { scope: "mine" | "company"; reload: number; onOpen: (id: string) => void }) {
  const [rows, setRows] = useState<Page<Incident>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [status, setStatus] = useState("active"), [kind, setKind] = useState("all"), [search, setSearch] = useState(""), [query, setQuery] = useState(""), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setRows({ data: [], pagination: emptyPage });
    assetGet<Page<Incident>>("/incidents", { scope, status, kind, search: query || undefined, page, limit: 20 }, controller.signal).then((value) => { if (!controller.signal.aborted) setRows(value); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [scope, page, status, kind, query, reload]);
  return <Stack spacing={4} minW={0}><Box display="grid" gridTemplateColumns={{ base: "minmax(0, 1fr)", md: "minmax(200px, 2fr) repeat(2, minmax(160px, 1fr))" }} gap={3}>
    <Input aria-label="Search incidents" value={search} placeholder="Asset, incident reference or employee" onChange={(event) => setSearch(event.target.value)} />
    <Select aria-label="Incident status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{["active", "open", "under_review", "resolved", "dismissed", "written_off", "all"].map((value) => <option key={value} value={value}>{value === "active" ? "Open cases" : statusLabel(value)}</option>)}</Select>
    <Select aria-label="Incident type" value={kind} onChange={(event) => { setKind(event.target.value); setPage(1); }}><option value="all">All incident types</option>{Object.entries(incidentKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select>
  </Box>{error && <Alert status="error"><AlertIcon />{error}</Alert>}
    <TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr><Th>Asset / reference</Th><Th>Employee</Th><Th>Incident</Th><Th>Reported</Th><Th>Status</Th><Th /></Tr></Thead><Tbody>
      {!rows.data.length && <Tr><Td colSpan={6}>{loading ? "Loading incidents..." : "No incidents in this view."}</Td></Tr>}
      {rows.data.map((row) => <Tr key={row._id}><Td whiteSpace="normal" minW="180px"><Text fontWeight="600" overflowWrap="anywhere">{row.assetSnapshot.name}</Text><Text fontSize="xs">{row.assetSnapshot.tag} | {row.reference}</Text></Td><Td whiteSpace="normal"><Text>{row.employeeName || "Not issued"}</Text><Text fontSize="xs">{row.employeeCode}</Text></Td><Td whiteSpace="normal">{incidentKinds[row.kind]}</Td><Td>{dateTime(row.createdAt)}</Td><Td><Badge colorScheme={row.active ? "red" : "green"}>{statusLabel(row.status)}</Badge></Td><Td><Button size="sm" variant="outline" onClick={() => onOpen(row._id)}>Open</Button></Td></Tr>)}
    </Tbody></Table></TableContainer>
    {rows.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={rows.pagination.totalPages} onPageChange={setPage} />}
  </Stack>;
}
