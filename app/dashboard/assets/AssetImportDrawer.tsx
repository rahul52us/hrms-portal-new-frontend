"use client";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, FormControl, FormHelperText, FormLabel, HStack, Input, Select, SimpleGrid, Skeleton, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Textarea } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { FiDownload, FiUpload } from "react-icons/fi";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import Pagination from "@/app/component/common/pagination/Pagination";
import AssetImportHistory from "./AssetImportHistory";
import { assetDownload, assetFailure, assetGet, AssetImportBatch, AssetImportRow, assetSave, dateTime, emptyPage, Page, statusLabel } from "./assetApi";

type Command = { kind: "preview"; file: File; requestId: string } | { kind: "mutation"; path: string; body: Record<string, unknown> };
type Event = { _id: string; actorName: string; action: string; reason: string; createdAt: string };
function Rows({ batchId, reload, onAsset }: { batchId: string; reload: number; onAsset: (id: string) => void }) {
  const [data, setData] = useState<Page<AssetImportRow>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [state, setState] = useState("all"), [loading, setLoading] = useState(true), [error, setError] = useState(""), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setData({ data: [], pagination: emptyPage });
    assetGet<Page<AssetImportRow>>(`/imports/${batchId}/rows`, { page, limit: 10, state }, controller.signal).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((err) => { if (!controller.signal.aborted) setError(assetFailure(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [batchId, page, state, reload, attempt]);
  return <Stack spacing={3}><HStack flexWrap="wrap" justify="space-between"><Text fontWeight="600">Preview rows</Text><Select aria-label="Import row validation" size="sm" maxW="180px" value={state} onChange={(event) => { setState(event.target.value); setPage(1); }}><option value="all">All rows</option><option value="invalid">Rows with errors</option><option value="valid">Valid rows</option></Select></HStack>
    {error && <Alert status="error"><AlertIcon /><Stack><Text>{error}</Text><Button size="sm" onClick={() => setAttempt((value) => value + 1)}>Reload rows</Button></Stack></Alert>}
    {loading ? <Skeleton h="120px" /> : !data.data.length ? <Text fontSize="sm">No rows in this view.</Text> : data.data.map((row) => <Box key={row._id} borderWidth="1px" borderRadius="md" p={3}><Stack spacing={2}><HStack justify="space-between" flexWrap="wrap" gap={3}><Text fontSize="sm" fontWeight="600" overflowWrap="anywhere">Row {row.rowNumber}: {row.content?.name || row.source.name}</Text><Badge colorScheme={row.validationStatus === "valid" ? "green" : "red"}>{row.validationStatus}</Badge></HStack>
      <Text fontSize="sm" overflowWrap="anywhere">Tag: {row.content?.tag || row.source.tag || "Not set"}{!row.source.tag && row.content?.tag ? " (generated)" : ""}</Text>
      <Text fontSize="xs" overflowWrap="anywhere">{row.content?.categoryName || row.content?.category || row.source.category} | {row.content?.condition || row.source.condition} | Serial: {row.content?.serialNumber || row.source.serialNumber || "Not recorded"}</Text>
      <Text fontSize="xs" overflowWrap="anywhere">Location: {row.locationName || row.locationCode || "Not assigned"}{row.content ? ` | Initial status: ${row.content.condition === "damaged" ? "Maintenance" : "Available"}` : ""}</Text>
      {row.errors.map((message, index) => <Text key={index} color="red.600" fontSize="sm" overflowWrap="anywhere">{message}</Text>)}
      {(row.source.brand || row.source.model || row.source.internalNotes) && <Box as="details"><Box as="summary" cursor="pointer" fontSize="sm">Inventory details</Box><Text fontSize="sm" overflowWrap="anywhere">{row.source.brand} {row.source.model}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{row.source.internalNotes}</Text></Box>}
      {row.asset && <Button alignSelf="start" size="sm" variant="outline" onClick={() => onAsset(row.asset!)}>Open registered asset</Button>}
    </Stack></Box>)}
    {data.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
  </Stack>;
}
function Events({ batchId, reload }: { batchId: string; reload: number }) {
  const [data, setData] = useState<Page<Event>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [error, setError] = useState(""), [loading, setLoading] = useState(true), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError(""); setLoading(true);
    assetGet<Page<Event>>(`/imports/${batchId}/events`, { page, limit: 10 }, controller.signal).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((err) => { if (!controller.signal.aborted) setError(assetFailure(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [batchId, page, reload, attempt]);
  return <Stack spacing={3}><Text fontWeight="600">Import history</Text>{error && <Alert status="error"><AlertIcon /><Stack><Text>{error}</Text><Button size="sm" onClick={() => setAttempt((value) => value + 1)}>Reload events</Button></Stack></Alert>}{loading ? <Skeleton h="80px" /> : data.data.map((event) => <Box key={event._id}><Text fontSize="sm" fontWeight="600">{statusLabel(event.action)}</Text><Text fontSize="xs">{event.actorName} | {dateTime(event.createdAt)}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{event.reason}</Text></Box>)}{data.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}</Stack>;
}
export default function AssetImportDrawer({ importId, canImport, onClose, onChanged, onAsset }: { importId?: string; canImport: boolean; onClose: () => void; onChanged: () => void; onAsset: (id: string, importId: string) => void }) {
  const [target, setTarget] = useState(importId || ""), [data, setData] = useState<AssetImportBatch | null>(null), [file, setFile] = useState<File | null>(null), [tab, setTab] = useState(canImport ? 0 : 1), [reload, setReload] = useState(0), [loading, setLoading] = useState(Boolean(importId)), [busy, setBusy] = useState(false), [downloading, setDownloading] = useState(false), [error, setError] = useState("");
  const [retry, setRetry] = useState<Command | null>(null), [action, setAction] = useState<"apply" | "cancel" | null>(null), [reason, setReason] = useState(""), [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    if (!target) { setData(null); return; }
    const controller = new AbortController(); setLoading(true); setError("");
    assetGet<{ data: AssetImportBatch }>(`/imports/${target}`, undefined, controller.signal).then((result) => { if (!controller.signal.aborted) { setData(result.data); setConfirmed(false); } }).catch((err) => { if (!controller.signal.aborted) { setError(assetFailure(err)); setData(null); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [target, reload]);
  const execute = async (command: Command) => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      let result: { data: AssetImportBatch };
      if (command.kind === "preview") { const form = new FormData(); form.append("file", command.file); form.append("requestId", command.requestId); result = (await axios.post("/assets/imports/preview", form)).data; }
      else result = await assetSave<AssetImportBatch>(command.path, command.body);
      setRetry(null); setTarget(result.data._id); setData(result.data); setAction(null); setReason(""); setConfirmed(false); setReload((value) => value + 1); if (result.data.status === "applied") onChanged();
    } catch (err: any) { setError(assetFailure(err)); setRetry(!err?.response || err.response.status >= 500 ? command : null); }
    finally { setBusy(false); }
  };
  const disabled = busy || Boolean(retry), back = () => { if (disabled) return; setTarget(""); setData(null); setAction(null); setError(""); setFile(null); setTab(1); };
  const template = async () => { setDownloading(true); setError(""); try { await assetDownload("/imports/template", "asset-inventory-template.csv"); } catch (err) { setError(assetFailure(err)); } finally { setDownloading(false); } };
  return <DashboardDrawer isOpen onClose={() => { if (!busy) onClose(); }} titlePrefix="Inventory imports" maxW={{ base: "100%", lg: "950px" }}><Stack spacing={5} minW={0}>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {retry && <Alert status="warning"><AlertIcon /><Stack><Text>The result is uncertain. Retry the same file or confirmation before starting another import.</Text><Button size="sm" alignSelf="start" isDisabled={busy} onClick={() => void execute(retry)}>Retry same request</Button></Stack></Alert>}
    {!target ? <Tabs index={tab} onChange={setTab} isLazy><TabList><Tab isDisabled={!canImport || disabled}>Upload CSV</Tab><Tab isDisabled={disabled}>Import history</Tab></TabList><TabPanels><TabPanel px={0}><Stack spacing={4}>
      <Button size="sm" alignSelf="start" variant="outline" leftIcon={<FiDownload />} isLoading={downloading} isDisabled={disabled} onClick={() => void template()}>Download CSV template</Button>
      <FormControl isRequired><FormLabel htmlFor="asset-import-file">Inventory CSV</FormLabel><Input id="asset-import-file" type="file" accept=".csv,text/csv" p={1} isDisabled={disabled} onChange={(event) => { const selected = event.target.files?.[0] || null; setError(""); if (selected && (selected.size > 1024 * 1024 || !selected.name.toLowerCase().endsWith(".csv"))) { setFile(null); setError("Choose a CSV up to 1 MB."); event.target.value = ""; } else setFile(selected); }} /><FormHelperText>UTF-8 CSV, up to 200 equipment rows and 1 MB. Location code is optional.</FormHelperText></FormControl>
      <Box fontSize="sm"><Text>Each row needs an asset name, category code, condition, and either a tag or serial number.</Text><Text mt={1} color="gray.500">Use a code from Categories, or a built-in: laptop, desktop, monitor, phone, tablet, accessory, other.</Text><Text color="gray.500">Conditions: new, good, fair, damaged.</Text></Box>
      <Alert status="info"><AlertIcon />Preview does not create equipment. Imports create new inventory only; no employee handovers or existing-record updates.</Alert>
      <Button alignSelf="start" colorScheme="blue" leftIcon={<FiUpload />} isLoading={busy} isDisabled={disabled || !file} onClick={() => file && void execute({ kind: "preview", file, requestId: crypto.randomUUID() })}>Preview import</Button>
    </Stack></TabPanel><TabPanel px={0}><AssetImportHistory reload={reload} onOpen={(id) => { if (!disabled) setTarget(id); }} /></TabPanel></TabPanels></Tabs> : <>
      <HStack justify="space-between" flexWrap="wrap" gap={3}><Button size="sm" variant="outline" isDisabled={disabled} onClick={back}>Back to imports</Button><Button size="sm" variant="ghost" isDisabled={disabled || loading} onClick={() => { setAction(null); setReload((value) => value + 1); }}>Reload</Button></HStack>
      {loading ? <Skeleton h="180px" /> : data && <>
        <HStack justify="space-between" flexWrap="wrap" gap={3}><Text fontSize="lg" fontWeight="600" overflowWrap="anywhere">{data.fileName}</Text><Badge colorScheme={data.status === "applied" ? "green" : data.status === "invalid" ? "red" : "gray"}>{data.status === "ready" && data.isExpired ? "Expired preview" : statusLabel(data.status)}</Badge></HStack>
        <Text fontSize="sm">Prepared by {data.creatorName} | {dateTime(data.createdAt)}</Text>
        <SimpleGrid columns={{ base: 2, sm: 4 }} gap={3}>{[["Rows", data.totalRows], ["Valid", data.validRows], ["With errors", data.invalidRows], ["Imported", data.appliedRows]].map(([label, count]) => <Box key={label}><Text fontSize="xs" color="gray.500">{label}</Text><Text fontWeight="600">{count}</Text></Box>)}</SimpleGrid>
        {data.status === "invalid" && <Alert status="error"><AlertIcon />Correct every error in the CSV and create a new preview. No equipment has been registered.</Alert>}
        {data.status === "ready" && <Alert status={data.isExpired ? "warning" : "info"}><AlertIcon />{data.isExpired ? "This preview expired. Upload the CSV again for a new review." : `Review all rows before confirming. This preview expires ${dateTime(data.validUntil)}. Tags, serials and locations will be checked again.`}</Alert>}
        {data.status === "applied" && <Box><Text fontSize="sm">Imported by {data.appliedByName} | {dateTime(data.appliedAt)}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.applyReason}</Text></Box>}
        {data.status === "cancelled" && <Box><Text fontSize="sm">Cancelled by {data.cancellerName} | {dateTime(data.cancelledAt)}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.cancellationReason}</Text></Box>}
        <HStack flexWrap="wrap" gap={3}>{data.canApply && <Button size="sm" colorScheme="blue" isDisabled={disabled} onClick={() => { setAction("apply"); setReason(""); setConfirmed(false); }}>Import {data.totalRows} new assets</Button>}{data.canCancel && <Button size="sm" variant="outline" isDisabled={disabled} onClick={() => { setAction("cancel"); setReason(""); setConfirmed(false); }}>Cancel preview</Button>}</HStack>
        {action && <Box borderTopWidth="1px" pt={4}><Stack spacing={4}><FormControl isRequired><FormLabel htmlFor="asset-import-reason">{action === "apply" ? "Reason for importing" : "Cancellation reason"}</FormLabel><Textarea id="asset-import-reason" value={reason} maxLength={1000} isDisabled={disabled} onChange={(event) => setReason(event.target.value)} /></FormControl>
          {action === "apply" && <Checkbox id="asset-import-create-only-confirmation" isChecked={confirmed} isDisabled={disabled} onChange={(event) => setConfirmed(event.target.checked)}>I reviewed all rows. Register these as new unissued equipment, without overwriting inventory or creating employee custody.</Checkbox>}
          <HStack flexWrap="wrap"><Button size="sm" variant="ghost" isDisabled={disabled} onClick={() => setAction(null)}>Back</Button><Button size="sm" colorScheme={action === "apply" ? "blue" : "red"} isLoading={busy} isDisabled={disabled || reason.trim().length < 3 || action === "apply" && !confirmed} onClick={() => void execute({ kind: "mutation", path: `/imports/${target}/${action}`, body: { revision: data.revision, reason: reason.trim(), ...(action === "apply" ? { confirmCreateOnly: confirmed } : {}), requestId: crypto.randomUUID() } })}>{action === "apply" ? "Confirm import" : "Confirm cancellation"}</Button></HStack>
        </Stack></Box>}
        {!disabled && <Box borderTopWidth="1px" pt={4}><Rows key={target} batchId={target} reload={reload} onAsset={(id) => onAsset(id, target)} /></Box>}
        <Box borderTopWidth="1px" pt={4}><Events key={target} batchId={target} reload={reload} /></Box>
      </>}
    </>}
  </Stack></DashboardDrawer>;
}
