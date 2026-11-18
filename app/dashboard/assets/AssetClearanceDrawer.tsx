"use client";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, FormControl, FormLabel, HStack, Input, Select, SimpleGrid, Skeleton, Stack, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetGet, AssetClearance, assetSave, ClearanceCustody, ClearanceEvent, ClearanceSummary, dateTime, emptyPage, Page, statusLabel } from "./assetApi";

type Command = { path: string; body: Record<string, unknown> };
type Action = "clear" | "reopen" | "cancel" | "reschedule" | "note";
type Review = { _id: string; reference: string; assetSnapshot: { name: string; tag: string }; kind?: string; status: string };
const actionLabels: Record<Action, string> = { clear: "Record asset clearance", reopen: "Reopen clearance", cancel: "Cancel clearance", reschedule: "Change expected last working date", note: "Add shared note" };
function Summary({ value }: { value: ClearanceSummary }) {
  return <SimpleGrid columns={{ base: 2, sm: 3 }} gap={4}>{[["Outstanding custody", value.outstanding], ["Return requested", value.returnRequested], ["Pending loss decisions", value.pendingWriteOffs], ["Inventory inconsistencies", value.integrityFindings], ["Open incidents", value.openIncidents], ["Physically returned", value.returned], ["Voided corrections", value.voided], ["Written off (not returned)", value.writtenOff]].map(([label, count]) => <Box key={label} minW={0}><Text fontSize="xs" color="gray.500">{label}</Text><Text fontWeight="600">{count}</Text></Box>)}</SimpleGrid>;
}
/** Each source list is separately paginated; the drawer never downloads the employee's full custody history. */
function Custody({ clearanceId, current, historical, reload, onOpen }: { clearanceId: string; current: boolean; historical: boolean; reload: number; onOpen: (id: string) => void }) {
  const [rows, setRows] = useState<Page<ClearanceCustody>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [scope, setScope] = useState("case"), [error, setError] = useState(""), [loading, setLoading] = useState(true), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError(""); setLoading(true); setRows({ data: [], pagination: emptyPage });
    assetGet<Page<ClearanceCustody>>(`/clearances/${clearanceId}/custody`, { scope, page, limit: 10 }, controller.signal).then((result) => { if (!controller.signal.aborted) setRows(result); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [clearanceId, scope, page, reload, attempt]);
  return <Stack spacing={3}><HStack flexWrap="wrap" justify="space-between"><Text fontWeight="600">Equipment handovers</Text>{current && <Select maxW="230px" size="sm" aria-label="Clearance custody scope" value={scope} onChange={(event) => { setScope(event.target.value); setPage(1); }}><option value="case">This clearance</option><option value="outstanding">Currently outstanding</option></Select>}</HStack>
    {error && <Alert status="error"><AlertIcon /><Stack><Text>{error}</Text><Button size="sm" onClick={() => setAttempt((value) => value + 1)}>Reload handovers</Button></Stack></Alert>}
    {loading ? <Skeleton h="80px" /> : !rows.data.length ? <Text fontSize="sm" color="gray.500">No handovers in this view.</Text> : rows.data.map((row) => <Box key={row._id} borderBottomWidth="1px" pb={3}><HStack justify="space-between" flexWrap="wrap" gap={3}><Box minW={0}><Text fontSize="sm" fontWeight="600" overflowWrap="anywhere">{row.assetSnapshot.name}</Text><Text fontSize="xs" overflowWrap="anywhere">{row.assetSnapshot.tag} | Issued {dateTime(row.issuedAt)}</Text><Text fontSize="sm">Now: {statusLabel(row.status)}</Text>{historical && row.statusAtDecision && <Text fontSize="xs">At recorded decision: {statusLabel(row.statusAtDecision)}</Text>}</Box><Button size="sm" variant="outline" onClick={() => onOpen(row._id)}>{row.canReturn ? "Inspect / receive return" : "Handover details"}</Button></HStack></Box>)}
    {rows.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={rows.pagination.totalPages} onPageChange={setPage} />}
  </Stack>;
}
function Reviews({ clearanceId, company, reload, onOpen }: { clearanceId: string; company: boolean; reload: number; onOpen: (kind: string, id: string) => void }) {
  const [kind, setKind] = useState("incidents"), [page, setPage] = useState(1), [rows, setRows] = useState<Page<Review>>({ data: [], pagination: emptyPage }), [loading, setLoading] = useState(true), [error, setError] = useState(""), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setRows({ data: [], pagination: emptyPage });
    assetGet<Page<Review>>(`/clearances/${clearanceId}/reviews`, { kind, page, limit: 10 }, controller.signal).then((result) => { if (!controller.signal.aborted) setRows(result); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [clearanceId, kind, page, reload, attempt]);
  return <Stack spacing={3}>{company && <Select aria-label="Administrative review type" maxW="260px" size="sm" value={kind} onChange={(event) => { setKind(event.target.value); setPage(1); }}><option value="incidents">Open incidents</option><option value="writeoffs">Pending loss decisions</option></Select>}
    {error && <Alert status="error"><AlertIcon /><Stack><Text>{error}</Text><Button size="sm" onClick={() => setAttempt((value) => value + 1)}>Reload reviews</Button></Stack></Alert>}
    {loading ? <Skeleton h="60px" /> : !rows.data.length ? <Text fontSize="sm">No {kind === "incidents" ? "open incidents" : "pending loss decisions"}.</Text> : rows.data.map((row) => <HStack key={row._id} justify="space-between" gap={3} flexWrap="wrap"><Box minW={0}><Text fontSize="sm" overflowWrap="anywhere">{row.reference} | {row.assetSnapshot.name}</Text><Text fontSize="xs">{statusLabel(row.status)}</Text></Box><Button size="sm" variant="outline" onClick={() => onOpen(kind, row._id)}>Review</Button></HStack>)}
    {rows.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={rows.pagination.totalPages} onPageChange={setPage} />}
  </Stack>;
}
function History({ clearanceId, reload }: { clearanceId: string; reload: number }) {
  const [rows, setRows] = useState<Page<ClearanceEvent>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [error, setError] = useState(""), [loading, setLoading] = useState(true), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError(""); setLoading(true); setRows({ data: [], pagination: emptyPage });
    assetGet<Page<ClearanceEvent>>(`/clearances/${clearanceId}/events`, { page, limit: 10 }, controller.signal).then((result) => { if (!controller.signal.aborted) setRows(result); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [clearanceId, page, reload, attempt]);
  return <Stack spacing={3}><Text fontWeight="600">Clearance history</Text>{error && <Alert status="error"><AlertIcon /><Stack><Text>{error}</Text><Button size="sm" onClick={() => setAttempt((value) => value + 1)}>Reload history</Button></Stack></Alert>}{loading ? <Skeleton h="80px" /> : rows.data.map((event) => <Box key={event._id} borderBottomWidth="1px" pb={3}><Text fontWeight="600" fontSize="sm">{event.action === "created" ? "Opened" : actionLabels[event.action as Action] || statusLabel(event.action)}</Text><Text fontSize="xs" color="gray.500">{event.actorName} | {dateTime(event.createdAt)}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{event.reason}</Text><Text fontSize="xs">{statusLabel(event.after.status)} | Expected last working date: {event.after.lastWorkingDate}</Text>{event.action === "clear" && event.after.clearanceEvidence && <Text fontSize="xs">Returned: {event.after.clearanceEvidence.returned} | Written off: {event.after.clearanceEvidence.writtenOff} | Corrected: {event.after.clearanceEvidence.voided} | Open incidents reviewed: {event.after.clearanceEvidence.openIncidents}</Text>}</Box>)}{rows.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={rows.pagination.totalPages} onPageChange={setPage} />}</Stack>;
}
export default function AssetClearanceDrawer({ clearanceId, onClose, onChanged, onAssignment, onIncident, onWriteOff }: { clearanceId: string; onClose: () => void; onChanged: () => void; onAssignment: (id: string) => void; onIncident: (id: string) => void; onWriteOff: (id: string) => void }) {
  const [data, setData] = useState<AssetClearance | null>(null), [reload, setReload] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState(""), [busy, setBusy] = useState(false), [retry, setRetry] = useState<Command | null>(null);
  const [action, setAction] = useState<Action | null>(null), [reason, setReason] = useState(""), [date, setDate] = useState(""), [confirmed, setConfirmed] = useState(false), [reviewed, setReviewed] = useState(false), [showReviews, setShowReviews] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    assetGet<{ data: AssetClearance }>(`/clearances/${clearanceId}`, undefined, controller.signal).then((result) => { if (!controller.signal.aborted) { setData(result.data); setConfirmed(false); setReviewed(false); } }).catch((err) => { if (!controller.signal.aborted) { setError(getApiErrorMessage(err)); setData(null); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [clearanceId, reload]);
  const choose = (value: Action) => { setAction(value); setReason(""); setDate(data?.lastWorkingDate || ""); setConfirmed(false); setReviewed(false); setError(""); };
  const execute = async (command: Command) => {
    if (busy) return;
    setBusy(true); setError("");
    try { const result = await assetSave<AssetClearance>(command.path, command.body); setData(result.data); setRetry(null); setAction(null); setReload((value) => value + 1); onChanged(); }
    catch (err: any) { setError(getApiErrorMessage(err)); setRetry(!err?.response || err.response.status >= 500 ? command : null); }
    finally { setBusy(false); }
  };
  const save = () => {
    if (!data || !action || busy || retry) return;
    // Freeze both case and source revisions so retries cannot acknowledge newly changed custody.
    const body = { revision: data.revision, reason: reason.trim(), requestId: crypto.randomUUID(), ...(action === "reschedule" ? { lastWorkingDate: date } : {}), ...(action === "cancel" ? { confirmReleaseIssueHold: confirmed } : {}), ...(action === "clear" ? { evidenceRevision: data.summary.evidenceRevision, confirmNoOutstandingCustody: confirmed, confirmReviewedIncidents: reviewed } : {}) };
    void execute({ path: `/clearances/${clearanceId}/${action === "note" ? "notes" : action}`, body });
  };
  const disabled = busy || loading || Boolean(retry), confirmationRequired = action === "clear" || action === "cancel";
  return <DashboardDrawer isOpen onClose={() => { if (!busy) onClose(); }} titlePrefix="Asset clearance" maxW={{ base: "100%", lg: "900px" }}><Stack spacing={5} minW={0}>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {retry && <Alert status="warning"><AlertIcon /><Stack><Text>The result is uncertain. Retry this exact action before another decision.</Text><Button size="sm" isDisabled={busy} onClick={() => void execute(retry)}>Retry same request</Button></Stack></Alert>}
    {loading ? <Skeleton h="220px" /> : data && <>
      <HStack justify="space-between" flexWrap="wrap" gap={3}><Box minW={0}><Text fontSize="lg" fontWeight="700" overflowWrap="anywhere">{data.employeeName}</Text><Text fontSize="sm">{data.employeeCode} | {data.reference}</Text></Box><Badge colorScheme={data.status === "cleared" ? "green" : data.status === "open" ? "orange" : "gray"}>{statusLabel(data.status)}</Badge></HStack>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}><Box><Text fontSize="xs" color="gray.500">Expected last working date</Text><Text>{data.lastWorkingDate}</Text></Box><Box><Text fontSize="xs" color="gray.500">Opened by / on</Text><Text fontSize="sm">{data.creatorName} | {dateTime(data.openedAt)}</Text></Box></SimpleGrid>
      <Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.openingReason}</Text>
      {data.issueBlocked && <Alert status="info"><AlertIcon />New equipment issues are blocked, including after clearance. Only cancelling this case releases the hold. Employment, login and payroll are unchanged.</Alert>}
      {data.status === "cleared" && data.isCurrent && !data.isCurrentlyClear && <Alert status="warning"><AlertIcon />The source records changed after clearance. The earlier decision is retained; reopen and review current readiness before relying on it.</Alert>}
      {data.status === "cancelled" && <Alert status="info"><AlertIcon />Cancelled case: the summary below is historical. Actual returns and write-offs were not reversed.</Alert>}
      <Box borderTopWidth="1px" pt={4}><HStack justify="space-between" flexWrap="wrap" mb={3}><Text fontWeight="600">{data.isCurrent ? "Current readiness" : "Readiness at cancellation"}</Text><Button size="sm" variant="outline" isDisabled={disabled} onClick={() => { setAction(null); setReload((value) => value + 1); }}>Reload readiness</Button></HStack><Summary value={data.summary} /><Text mt={3} fontSize="xs" color="gray.500">Checked {dateTime(data.summary.evaluatedAt)}</Text>
        {data.isCurrent && !data.summary.ready && <Alert status="warning" mt={3}><AlertIcon />Resolve outstanding custody, pending loss decisions and inventory inconsistencies before clearance. A return request is not a physical return.</Alert>}
        {data.isCurrent && data.summary.openIncidents > 0 && <Text fontSize="sm" mt={3}>Open incidents must be explicitly reviewed before clearance. This does not close an incident or settle a financial claim.</Text>}
      </Box>
      {data.clearanceEvidence && <Box borderTopWidth="1px" pt={4}><Text fontWeight="600" mb={2}>Recorded clearance decision</Text><Text fontSize="sm">{data.clearerName} | {dateTime(data.clearedAt)}</Text><Text fontSize="sm" mb={3} whiteSpace="pre-wrap" overflowWrap="anywhere">{data.clearanceReason}</Text><Summary value={data.clearanceEvidence} /></Box>}
      {data.status === "cancelled" && <Box><Text fontSize="sm">Cancelled by {data.cancellerName} | {dateTime(data.cancelledAt)}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.cancellationReason}</Text></Box>}
      <HStack flexWrap="wrap" gap={3}>{data.canClear && <Button size="sm" colorScheme="blue" isDisabled={disabled} onClick={() => choose("clear")}>Record clearance</Button>}{data.canReopen && <Button size="sm" variant="outline" isDisabled={disabled} onClick={() => choose("reopen")}>Reopen</Button>}{data.canReschedule && <Button size="sm" variant="outline" isDisabled={disabled} onClick={() => choose("reschedule")}>Change last working date</Button>}{data.canAddNote && <Button size="sm" variant="outline" isDisabled={disabled} onClick={() => choose("note")}>Add shared note</Button>}{data.canCancel && <Button size="sm" variant="ghost" colorScheme="red" isDisabled={disabled} onClick={() => choose("cancel")}>Cancel clearance</Button>}</HStack>
      {action && <Box borderTopWidth="1px" pt={4}><Stack spacing={4}><Text fontWeight="600">{actionLabels[action]}</Text>{action === "reschedule" && <FormControl isRequired><FormLabel htmlFor="clearance-change-date">Expected last working date</FormLabel><Input id="clearance-change-date" type="date" value={date} isDisabled={disabled} onChange={(event) => setDate(event.target.value)} /></FormControl>}
        <FormControl isRequired><FormLabel htmlFor="clearance-action-reason">{action === "note" ? "Shared note" : "Reason (shared with employee)"}</FormLabel><Textarea id="clearance-action-reason" value={reason} maxLength={1000} isDisabled={disabled} onChange={(event) => setReason(event.target.value)} /></FormControl>
        {confirmationRequired && <Checkbox id="clearance-outcome-confirmation" isChecked={confirmed} isDisabled={disabled} onChange={(event) => setConfirmed(event.target.checked)}>{action === "clear" ? "I verified there is no outstanding custody. Physical returns, approved write-offs and corrected records remain distinct outcomes." : "Release the equipment-issue hold. Actual returns and write-offs will remain unchanged."}</Checkbox>}
        {action === "clear" && data.summary.openIncidents > 0 && <Checkbox id="clearance-reviewed-incidents" isChecked={reviewed} isDisabled={disabled} onChange={(event) => setReviewed(event.target.checked)}>I reviewed the remaining incidents on returned equipment. They remain open and are not financially settled by this clearance.</Checkbox>}
        <HStack flexWrap="wrap"><Button size="sm" variant="ghost" isDisabled={disabled} onClick={() => setAction(null)}>Cancel action</Button><Button size="sm" colorScheme={action === "cancel" ? "red" : "blue"} isLoading={busy} isDisabled={disabled || reason.trim().length < 3 || confirmationRequired && !confirmed || action === "reschedule" && !date || action === "clear" && data.summary.openIncidents > 0 && !reviewed} onClick={save}>{actionLabels[action]}</Button></HStack>
      </Stack></Box>}
      {!busy && !retry && <Box borderTopWidth="1px" pt={4}><Custody key={`${clearanceId}:${data.isCurrent}`} clearanceId={clearanceId} current={data.isCurrent} historical={data.status !== "open"} reload={reload} onOpen={onAssignment} /></Box>}
      {data.isCurrent && !busy && !retry && <Box borderTopWidth="1px" pt={4}><Button size="sm" variant="outline" onClick={() => setShowReviews((value) => !value)}>{showReviews ? "Hide" : "Show"} administrative reviews</Button>{showReviews && <Box mt={4}><Reviews clearanceId={clearanceId} company={data.canViewCompany} reload={reload} onOpen={(kind, id) => kind === "incidents" ? onIncident(id) : onWriteOff(id)} /></Box>}</Box>}
      <Box borderTopWidth="1px" pt={4}><History clearanceId={clearanceId} reload={reload} /></Box>
    </>}
    {!loading && !data && <Button alignSelf="start" onClick={() => setReload((value) => value + 1)}>Reload clearance</Button>}
  </Stack></DashboardDrawer>;
}
