"use client";
import { Alert, AlertIcon, Badge, Box, Button, FormControl, FormHelperText, FormLabel, HStack, Progress, Select, SimpleGrid, Skeleton, Stack, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FiDownload, FiPlus } from "react-icons/fi";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import Pagination from "@/app/component/common/pagination/Pagination";
import { assetExportBlob, AssetExportFilters, AssetExportJob, assetFailure, assetGet, assetSave, dateTime, emptyPage, Page, statusLabel } from "./assetApi";

type Command = { path: string; body: Record<string, unknown> };
type ExportEvent = { _id: string; actorName: string; action: string; reason: string; rows: number; createdAt: string };
function History({ id, revision }: { id: string; revision: number }) {
  const [data, setData] = useState<Page<ExportEvent>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [error, setError] = useState(""), [loading, setLoading] = useState(true), [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    assetGet<Page<ExportEvent>>(`/exports/${id}/events`, { page, limit: 10 }, controller.signal).then(value => { if (!controller.signal.aborted) setData(value); }).catch(err => { if (!controller.signal.aborted) setError(assetFailure(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, revision, page, reload]);
  return <Stack spacing={3}><Text fontWeight="600">History</Text>{error && <Alert status="error"><AlertIcon /><Stack><Text>{error}</Text><Button size="sm" onClick={() => setReload(value => value + 1)}>Reload history</Button></Stack></Alert>}{loading ? <Skeleton h="90px" /> : data.data.map(event => <Box key={event._id} borderBottomWidth="1px" pb={3}><Text fontSize="sm" fontWeight="600">{statusLabel(event.action)} | {event.rows.toLocaleString()} rows</Text><Text fontSize="xs">{event.actorName} | {dateTime(event.createdAt)}</Text><Text fontSize="sm" overflowWrap="anywhere">{event.reason}</Text></Box>)}{data.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}</Stack>;
}
export default function AssetExportsDrawer({ filters, filterSummary, createInitially, onClose }: { filters: AssetExportFilters; filterSummary: string; createInitially: boolean; onClose: () => void }) {
  const [list, setList] = useState<Page<AssetExportJob>>({ data: [], pagination: emptyPage }), [selected, setSelected] = useState(""), [record, setRecord] = useState<AssetExportJob | null>(null), [page, setPage] = useState(1), [state, setState] = useState("all"), [loading, setLoading] = useState(true), [reload, setReload] = useState(0), [error, setError] = useState("");
  const [action, setAction] = useState<"create" | "cancel" | "retry" | null>(createInitially ? "create" : null), [reason, setReason] = useState(""), [actionRevision, setActionRevision] = useState(0), [busy, setBusy] = useState(false), [retry, setRetry] = useState<Command | null>(null), [downloading, setDownloading] = useState(false);
  const transfer = useRef<AbortController | null>(null);
  useEffect(() => () => { transfer.current?.abort(); }, []);
  useEffect(() => {
    if (busy || retry) return;
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined; setLoading(true);
    const poll = () => { if (document.visibilityState === "visible") void load(); else timer = setTimeout(poll, 30000); };
    const load = async () => {
      try {
        let active = false;
        if (selected) { const response = await assetGet<{ data: AssetExportJob }>(`/exports/${selected}`, undefined, controller.signal); if (!controller.signal.aborted) { setRecord(response.data); active = ["queued", "running"].includes(response.data.state); } }
        else { const response = await assetGet<Page<AssetExportJob>>("/exports", { state, page, limit: 10 }, controller.signal); if (!controller.signal.aborted) { setList(response); active = response.data.some(job => ["queued", "running"].includes(job.state)); } }
        if (!controller.signal.aborted) timer = setTimeout(poll, active ? 5000 : 30000);
      } catch (err) { if (!controller.signal.aborted) setError(assetFailure(err)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => { controller.abort(); if (timer) clearTimeout(timer); };
  }, [selected, state, page, reload, busy, retry]);
  const choose = (value: NonNullable<typeof action>) => { setAction(value); setReason(""); setActionRevision(record?.revision || 0); setError(""); };
  const execute = async (command: Command) => {
    if (busy) return; setBusy(true); setError("");
    try { const result = await assetSave<AssetExportJob>(command.path, command.body); setRecord(result.data); setSelected(result.data._id); setAction(null); setRetry(null); setReload(value => value + 1); }
    catch (err: any) { setError(assetFailure(err)); setRetry(!err?.response || err.response.status >= 500 ? command : null); }
    finally { setBusy(false); }
  };
  const save = () => { if (!action || busy || retry) return; void execute({ path: action === "create" ? "/exports" : `/exports/${selected}/${action}`, body: { ...(action === "create" ? { format: "csv", filters } : { revision: actionRevision }), reason: reason.trim(), requestId: crypto.randomUUID() } }); };
  const download = async () => {
    if (!record || downloading) return; const controller = new AbortController(); transfer.current = controller; setDownloading(true); setError("");
    try { const bytes = await assetExportBlob(record, controller.signal); if (controller.signal.aborted) return; const url = URL.createObjectURL(bytes), link = document.createElement("a"); link.href = url; link.download = "asset-inventory-export.csv"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    catch (err) { if (!controller.signal.aborted) setError(assetFailure(err)); }
    finally { setDownloading(false); }
  };
  const disabled = busy || Boolean(retry) || downloading;
  return <DashboardDrawer isOpen onClose={() => { if (!busy && !retry) onClose(); }} titlePrefix="My inventory exports" maxW={{ base: "100%", lg: "820px" }}>
    <Stack spacing={5} minW={0}>
      {error && <Alert status="error"><AlertIcon />{error}</Alert>}
      {retry && <Alert status="warning"><AlertIcon /><Stack><Text>The result is uncertain. Retry the original export command before starting another.</Text><Button size="sm" alignSelf="start" isLoading={busy} onClick={() => void execute(retry)}>Retry same request</Button></Stack></Alert>}
      <HStack justify="space-between" flexWrap="wrap" gap={3}><Text fontSize="sm">CSV | Up to 100,000 assets / 128 MB | Downloads last 24 hours</Text><HStack>{!action && <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} isDisabled={disabled} onClick={() => choose("create")}>Queue CSV</Button>}<Button size="sm" variant="outline" isDisabled={disabled || loading} onClick={() => { setError(""); setReload(value => value + 1); }}>Reload</Button></HStack></HStack>
      {action && <Stack spacing={4} borderBottomWidth="1px" pb={5}><Text fontWeight="600">{action === "create" ? "New background export" : action === "retry" ? "Retry export" : record?.state === "ready" ? "Remove download" : "Cancel export"}</Text>{action === "create" && <Text fontSize="sm" overflowWrap="anywhere">{filterSummary}</Text>}{action === "create" && <Text fontSize="xs">One active job and five new jobs per account in 24 hours. Data is captured when the worker starts, not when queued.</Text>}{action === "cancel" && record?.state === "ready" && <Text fontSize="sm">New downloads will be blocked; the private file is queued for cleanup.</Text>}<FormControl isRequired><FormLabel htmlFor="asset-export-reason">Reason</FormLabel><Textarea id="asset-export-reason" value={reason} maxLength={1000} isDisabled={disabled} onChange={event => setReason(event.target.value)} /><FormHelperText>At least 3 characters. Kept in export history.</FormHelperText></FormControl><HStack><Button size="sm" variant="ghost" isDisabled={disabled} onClick={() => setAction(null)}>Back</Button><Button size="sm" colorScheme={action === "cancel" ? "red" : "blue"} isLoading={busy} isDisabled={disabled || reason.trim().length < 3} onClick={save}>{action === "create" ? "Queue export" : `Confirm ${action}`}</Button></HStack></Stack>}
      {selected ? <><Button size="sm" variant="outline" alignSelf="start" isDisabled={disabled} onClick={() => { setSelected(""); setRecord(null); setAction(null); }}>Back to exports</Button>{!record && loading ? <Skeleton h="140px" /> : record && <>
        <HStack justify="space-between" flexWrap="wrap"><Text fontWeight="600">Inventory CSV</Text><Badge colorScheme={record.state === "ready" ? "green" : record.state === "failed" ? "red" : "blue"}>{record.state}</Badge></HStack>
        {["queued", "running"].includes(record.state) && <Progress size="xs" isIndeterminate colorScheme="blue" />}
        <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}><Box><Text fontSize="xs">Rows prepared</Text><Text fontWeight="600">{record.rows.toLocaleString()}</Text></Box><Box><Text fontSize="xs">File size</Text><Text fontWeight="600">{(record.bytes / 1024 / 1024).toFixed(1)} MB</Text></Box><Box><Text fontSize="xs">Attempt</Text><Text fontWeight="600">{record.attempts}/3</Text></Box></SimpleGrid>
        <Text fontSize="sm">{record.filters.status === "all" ? "All statuses" : statusLabel(record.filters.status)} | {record.filterLabels.category} | {record.filterLabels.location}{record.filters.search ? ` | Search: ${record.filters.search}` : ""}</Text>
        <Text fontSize="xs">Requested {dateTime(record.createdAt)} | Started {dateTime(record.startedAt)}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{record.reason}</Text>
        {record.error && <Alert status="error"><AlertIcon />{record.error}</Alert>}{record.canDownload && <Text fontSize="xs">Download expires {dateTime(record.expiresAt)}</Text>}
        {!action && <HStack flexWrap="wrap">{record.canDownload && <Button size="sm" colorScheme="blue" leftIcon={<FiDownload />} isLoading={downloading} isDisabled={busy || Boolean(retry)} onClick={() => void download()}>Download CSV</Button>}{downloading && <Button size="sm" variant="outline" onClick={() => transfer.current?.abort()}>Stop download</Button>}{record.canRetry && <Button size="sm" variant="outline" isDisabled={disabled} onClick={() => choose("retry")}>Retry export</Button>}{record.canCancel && <Button size="sm" variant="outline" colorScheme="red" isDisabled={disabled} onClick={() => choose("cancel")}>{record.state === "ready" ? "Remove download" : "Cancel export"}</Button>}</HStack>}
        <History key={record._id} id={record._id} revision={record.revision} />
      </>}</> : <>
        <Select aria-label="Export status" maxW="240px" value={state} isDisabled={disabled} onChange={event => { setState(event.target.value); setPage(1); }}><option value="all">All exports</option>{["queued", "running", "ready", "failed", "cancelled", "expired"].map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</Select>
        {loading && !list.data.length ? <Skeleton h="150px" /> : !list.data.length ? <Text fontSize="sm">No export jobs in this view.</Text> : list.data.map(job => <Box key={job._id} borderBottomWidth="1px" pb={4}><HStack justify="space-between" flexWrap="wrap" gap={3}><Box minW={0}><HStack><Text fontWeight="600" fontSize="sm">{dateTime(job.createdAt)}</Text><Badge colorScheme={job.state === "ready" ? "green" : job.state === "failed" ? "red" : "gray"}>{job.state}</Badge></HStack><Text fontSize="xs">{job.rows.toLocaleString()} rows | {(job.bytes / 1024 / 1024).toFixed(1)} MB</Text><Text fontSize="sm" overflowWrap="anywhere">{job.reason}</Text></Box><Button size="sm" variant="outline" isDisabled={disabled} onClick={() => { setSelected(job._id); setRecord(null); setAction(null); }}>Open</Button></HStack></Box>)}
        {list.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={list.pagination.totalPages} onPageChange={setPage} />}
      </>}
    </Stack>
  </DashboardDrawer>;
}
