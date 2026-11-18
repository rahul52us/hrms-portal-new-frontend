"use client";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, FormControl, FormLabel, HStack, Select, SimpleGrid, Skeleton, Stack, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetGet, assetSave, conditionLabels, dateTime, emptyPage, Incident, incidentKinds, Page, statusLabel } from "./assetApi";
import AssetWriteOffRequest from "./AssetWriteOffRequest";

type Event = { _id: string; actorName: string; action: string; reason: string; createdAt: string };
type Command = { path: string; body: Record<string, unknown> };
export default function AssetIncidentDrawer({ incidentId, onClose, onChanged, onService, onWriteOff }: { incidentId: string; onClose: () => void; onChanged: () => void; onService: (id: string) => void; onWriteOff: (id: string) => void }) {
  const [requestingWriteOff, setRequestingWriteOff] = useState(false);
  const [data, setData] = useState<Incident | null>(null), [history, setHistory] = useState<Page<Event>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [reload, setReload] = useState(0), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [action, setAction] = useState(""), [reason, setReason] = useState(""), [condition, setCondition] = useState("good"), [confirmed, setConfirmed] = useState(false), [retry, setRetry] = useState<Command | null>(null);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    const load = async () => {
      try {
        const current = await assetGet<{ data: Incident }>(`/incidents/${incidentId}`, undefined, controller.signal);
        const events = await assetGet<Page<Event>>(`/incidents/${incidentId}/events`, { page, limit: 10 }, controller.signal);
        if (!controller.signal.aborted) { setData(current.data); setHistory(events); }
      } catch (err) { if (!controller.signal.aborted) { setData(null); setError(getApiErrorMessage(err)); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [incidentId, page, reload]);
  const choose = (value: string) => { setRequestingWriteOff(false); setAction(value); setReason(""); setCondition("good"); setConfirmed(false); setError(""); };
  const execute = async (command: Command) => {
    if (busy) return;
    setBusy(true); setError("");
    try { const response = await assetSave<Incident>(command.path, command.body); setData(response.data); setRetry(null); setAction(""); setPage(1); setReload((value) => value + 1); onChanged(); }
    catch (err: any) { setError(getApiErrorMessage(err)); setRetry(!err?.response || err.response.status >= 500 ? command : null); }
    finally { setBusy(false); }
  };
  const save = () => {
    if (!data || busy || retry) return;
    void execute({ path: `/incidents/${incidentId}/${action}`, body: { revision: data.revision, assetRevision: data.assetRevision, reason: reason.trim(), requestId: crypto.randomUUID(), ...(action === "resolve" ? { condition, confirmLocatedAndInspected: confirmed } : action === "dismiss" ? { confirmReportInvalid: confirmed } : {}) } });
  };
  const disabled = busy || loading || Boolean(retry);
  return <DashboardDrawer isOpen onClose={() => { if (!busy) onClose(); }} titlePrefix="Asset incident" maxW={{ base: "100%", lg: "800px" }}><Stack spacing={5} minW={0}>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {retry && <Alert status="warning"><AlertIcon /><Stack><Text fontSize="sm">The result is uncertain. Retry the exact review request before another action.</Text><Button size="sm" alignSelf="start" isDisabled={busy} onClick={() => void execute(retry)}>Retry same request</Button></Stack></Alert>}
    {loading ? <Skeleton h="220px" /> : data && <>
      <HStack justify="space-between" flexWrap="wrap"><Box minW={0}><Text fontWeight="700" fontSize="lg" overflowWrap="anywhere">{data.assetSnapshot.name}</Text><Text fontSize="sm">{data.assetSnapshot.tag} | {data.reference}</Text></Box><Badge colorScheme={data.active ? "red" : "green"}>{statusLabel(data.status)}</Badge></HStack>
      {data.active && <Alert status="warning"><AlertIcon />This unit is on incident hold. Reporting does not return equipment or deduct salary.</Alert>}
      {data.openService && <Alert status="info"><AlertIcon /><Box><Text fontSize="sm">Complete the active service order before resolving this case by inspection.</Text><Button size="xs" mt={2} isDisabled={busy} onClick={() => onService(data.openService!)}>Open service order</Button></Box></Alert>}
      {data.openWriteOff && <Alert status="warning"><AlertIcon /><Box><Text fontSize="sm">A confirmed-loss write-off request is awaiting independent review. Withdraw it before case closure or service changes.</Text><Button mt={2} size="xs" isDisabled={busy} onClick={() => onWriteOff(data.openWriteOff!)}>Open write-off request</Button></Box></Alert>}
      {data.writeOffRecord && <Button size="sm" variant="outline" alignSelf="start" isDisabled={busy} onClick={() => onWriteOff(data.writeOffRecord!)}>Write-off and recovery register</Button>}
      {data.recoveredAfterWriteOffAt && <Text fontSize="sm">Unit later recovered on {dateTime(data.recoveredAfterWriteOffAt)}. Original loss closure is retained.</Text>}
      {data.canRequestWriteOff && <Button size="sm" variant="outline" colorScheme="red" alignSelf="start" isDisabled={disabled} onClick={() => { setAction(""); setRequestingWriteOff((value) => !value); }}>Request confirmed-loss write-off</Button>}
      {requestingWriteOff && data.canRequestWriteOff && <AssetWriteOffRequest incidentId={incidentId} revision={data.revision} assetRevision={data.assetRevision} kind={data.kind} busy={busy} setBusy={setBusy} onCancel={() => setRequestingWriteOff(false)} onSaved={(value) => { setRequestingWriteOff(false); onChanged(); onWriteOff(value._id); }} />}
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>{[["Incident", incidentKinds[data.kind]], ["Occurred", dateTime(data.occurredAt)], ["Reported by", data.reporterName], ["Reported on", dateTime(data.createdAt)], ["Employee at reporting", data.employeeName ? `${data.employeeName} (${data.employeeCode})` : "Not issued"], ["Serial number", data.assetSnapshot.serialNumber || "Not recorded"]].map(([label, value]) => <Box key={label} minW={0}><Text fontSize="xs" color="gray.500">{label}</Text><Text fontSize="sm" overflowWrap="anywhere">{value}</Text></Box>)}</SimpleGrid>
      <Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.description}</Text>
      {data.closedAt && <Box borderTopWidth="1px" pt={3}><Text fontWeight="600">{statusLabel(data.status)} by {data.closerName}</Text><Text fontSize="xs">{dateTime(data.closedAt)}{data.conditionAfter ? ` | ${conditionLabels[data.conditionAfter]}` : ""}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.resolutionReason}</Text></Box>}
      <HStack flexWrap="wrap">{data.canReview && <Button size="sm" variant="outline" isDisabled={disabled} onClick={() => choose("review")}>{data.status === "open" ? "Start review" : "Add review note"}</Button>}{data.canResolve && <Button size="sm" colorScheme="green" isDisabled={disabled} onClick={() => choose("resolve")}>Resolve after inspection</Button>}{data.canDismiss && <Button size="sm" variant="outline" isDisabled={disabled} onClick={() => choose("dismiss")}>Dismiss invalid report</Button>}<Button size="sm" variant="ghost" isDisabled={busy} onClick={() => { setAction(""); setReload((value) => value + 1); }}>Reload</Button></HStack>
      {action && <Box borderTopWidth="1px" pt={4}><Stack spacing={4}>
        <Text fontWeight="600">{action === "resolve" ? "Confirm equipment is located and usable" : action === "dismiss" ? "Dismiss an invalid incident report" : "Investigation / review note"}</Text>
        {action === "resolve" && <><Text fontSize="sm">A missing or unusable unit must stay under review. Resolution clears the incident hold only; maintenance release, physical custody and onboarding relinking remain separate.</Text><FormControl isRequired><FormLabel htmlFor="incident-resolved-condition">Condition after inspection</FormLabel><Select id="incident-resolved-condition" value={condition} isDisabled={disabled} onChange={(event) => setCondition(event.target.value)}>{Object.entries(conditionLabels).filter(([key]) => key !== "damaged").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></FormControl></>}
        <FormControl isRequired><FormLabel htmlFor="incident-review-reason">{action === "review" ? "Review note" : "Resolution reason"}</FormLabel><Textarea id="incident-review-reason" value={reason} maxLength={1000} isDisabled={disabled} onChange={(event) => setReason(event.target.value)} /><Text fontSize="xs" mt={1} color="gray.500">Shared with the employee and reporter.</Text></FormControl>
        {action === "resolve" && <Checkbox id="incident-confirm-inspection" isChecked={confirmed} isDisabled={disabled} onChange={(event) => setConfirmed(event.target.checked)}>I located and inspected this unit and confirm it is usable.</Checkbox>}
        {action === "dismiss" && <Checkbox id="incident-confirm-invalid" isChecked={confirmed} isDisabled={disabled} onChange={(event) => setConfirmed(event.target.checked)}>I verified that this report is invalid. This is not a write-off or a physical return.</Checkbox>}
        <HStack><Button size="sm" variant="ghost" isDisabled={disabled} onClick={() => setAction("")}>Cancel</Button><Button size="sm" colorScheme="blue" isLoading={busy} isDisabled={disabled || reason.trim().length < 3 || action !== "review" && !confirmed} onClick={save}>{action === "review" ? "Save review note" : action === "resolve" ? "Resolve incident" : "Dismiss report"}</Button></HStack>
      </Stack></Box>}
      <Box borderTopWidth="1px" pt={4}><Text fontWeight="600" mb={3}>Incident history</Text><Stack spacing={4}>{history.data.map((event) => <Box key={event._id}><Text fontSize="sm" fontWeight="600">{statusLabel(event.action)}</Text><Text fontSize="xs" color="gray.500">{event.actorName} | {dateTime(event.createdAt)}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{event.reason}</Text></Box>)}{history.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={history.pagination.totalPages} onPageChange={setPage} />}</Stack></Box>
    </>}
    {!loading && !data && <Button onClick={() => setReload((value) => value + 1)}>Reload incident</Button>}
  </Stack></DashboardDrawer>;
}
