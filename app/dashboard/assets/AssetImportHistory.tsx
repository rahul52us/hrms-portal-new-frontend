"use client";
import { Alert, AlertIcon, Badge, Button, Select, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Pagination from "@/app/component/common/pagination/Pagination";
import { assetFailure, assetGet, AssetImportBatch, dateTime, emptyPage, Page, statusLabel } from "./assetApi";

export default function AssetImportHistory({ onOpen, reload }: { onOpen: (id: string) => void; reload: number }) {
  const [data, setData] = useState<Page<AssetImportBatch>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [status, setStatus] = useState("all"), [loading, setLoading] = useState(true), [error, setError] = useState(""), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setData({ data: [], pagination: emptyPage });
    assetGet<Page<AssetImportBatch>>("/imports", { page, limit: 20, status }, controller.signal).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((err) => { if (!controller.signal.aborted) setError(assetFailure(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, status, reload, attempt]);
  return <Stack spacing={4}><Select size="sm" maxW="220px" aria-label="Import history status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">All import statuses</option>{["ready", "invalid", "applied", "cancelled"].map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</Select>
    {error && <Alert status="error"><AlertIcon /><Stack><Text>{error}</Text><Button size="sm" onClick={() => setAttempt((value) => value + 1)}>Reload history</Button></Stack></Alert>}
    {loading ? <Skeleton h="180px" /> : <TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr><Th>File</Th><Th>Prepared by</Th><Th>Rows</Th><Th>Status</Th><Th /></Tr></Thead><Tbody>{!data.data.length && <Tr><Td colSpan={5}>No inventory imports yet.</Td></Tr>}{data.data.map((batch) => <Tr key={batch._id}><Td maxW="220px" whiteSpace="normal" overflowWrap="anywhere">{batch.fileName}</Td><Td whiteSpace="normal"><Text>{batch.creatorName}</Text><Text fontSize="xs">{dateTime(batch.createdAt)}</Text></Td><Td>{batch.totalRows}</Td><Td><Badge colorScheme={batch.status === "applied" ? "green" : batch.status === "invalid" || batch.isExpired && batch.status === "ready" ? "red" : "gray"}>{batch.status === "ready" && batch.isExpired ? "Expired preview" : statusLabel(batch.status)}</Badge></Td><Td><Button size="sm" variant="outline" onClick={() => onOpen(batch._id)}>Open</Button></Td></Tr>)}</Tbody></Table></TableContainer>}
    {data.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
  </Stack>;
}
