"use client";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, FormControl, FormLabel, HStack, Input, Select, SimpleGrid, Skeleton, Stack, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetGet, assetSave, conditionLabels, dateTime, emptyPage, Page, parseAssetAmount, ServiceOrder, serviceCostLabel, serviceCurrencies, serviceKinds, serviceStates, statusLabel } from "./assetApi";

type Event = { _id: string; actorName: string; action: string; reason: string; createdAt: string; before?: { workPerformed?: string; actualCostMinor?: number | null; currency?: string; cycle?: number }; after?: { workPerformed?: string; actualCostMinor?: number | null; currency?: string; cycle?: number; inspectionResult?: string } };
type Command = { path: string; body: Record<string, unknown> };
const labels: Record<string, string> = { start: "Start service", "work-complete": "Record completed work", "receive-unrepaired": "Receive without repair", inspection: "Record inspection", cancel: "Cancel order", notes: "Add note" };
export default function AssetServiceDrawer({ serviceOrderId, onClose, onChanged, onAsset, onIncident, onWriteOff }: { serviceOrderId: string; onClose: () => void; onChanged: () => void; onAsset: (id: string) => void; onIncident: (id: string) => void; onWriteOff: (id: string) => void }) {
  const [data, setData] = useState<ServiceOrder | null>(null), [history, setHistory] = useState<Page<Event>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [reload, setReload] = useState(0), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [action, setAction] = useState(""), [reason, setReason] = useState(""), [work, setWork] = useState(""), [amount, setAmount] = useState(""), [currency, setCurrency] = useState("INR"), [result, setResult] = useState("passed"), [condition, setCondition] = useState("good"), [confirmed, setConfirmed] = useState(false), [retry, setRetry] = useState<Command | null>(null);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    const load = async () => {
      try {
        const current = await assetGet<{ data: ServiceOrder }>(`/service-orders/${serviceOrderId}`, undefined, controller.signal);
        const events = await assetGet<Page<Event>>(`/service-orders/${serviceOrderId}/events`, { page, limit: 10 }, controller.signal);
        if (!controller.signal.aborted) { setData(current.data); setHistory(events); }
      } catch (err) { if (!controller.signal.aborted) { setData(null); setError(getApiErrorMessage(err)); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [serviceOrderId, page, reload]);
  const choose = (value: string) => { setAction(value); setReason(""); setWork(""); setAmount(""); setCurrency(data?.currency || "INR"); setResult("passed"); setCondition("good"); setConfirmed(false); setError(""); };
  const execute = async (command: Command) => {
    if (busy) return;
    setBusy(true); setError("");
    try { const response = await assetSave<ServiceOrder>(command.path, command.body); setData(response.data); setRetry(null); setAction(""); setPage(1); setReload((value) => value + 1); onChanged(); }
    catch (err: any) { setError(getApiErrorMessage(err)); setRetry(!err?.response || err.response.status >= 500 ? command : null); }
    finally { setBusy(false); }
  };
  const save = () => {
    if (!data || busy || retry) return;
    let minor: number | null = null;
    if (action === "work-complete" && amount !== "") {
      try { minor = parseAssetAmount(amount); } catch (err: any) { setError(err.message); return; }
    }
    const body = { revision: data.revision, assetRevision: data.assetRevision, reason: reason.trim(), requestId: crypto.randomUUID(),
      ...(action === "start" ? { confirmDispatch: confirmed } : {}), ...(action === "work-complete" ? { workPerformed: work.trim(), actualCostMinor: minor, currency, confirmReceivedFromProvider: confirmed } : {}),
      ...(action === "receive-unrepaired" ? { confirmReceivedFromProvider: confirmed } : {}), ...(action === "inspection" ? { result, condition: result === "passed" ? condition : "damaged", confirmInspection: confirmed } : {}), ...(action === "cancel" ? { confirmCompanyCustody: confirmed } : {}) };
    void execute({ path: `/service-orders/${serviceOrderId}/${action}`, body });
  };
  const needsConfirmation = action === "inspection" || action === "cancel" || action === "receive-unrepaired" || data?.providerType === "external" && ["start", "work-complete"].includes(action);
  const disabled = busy || loading || Boolean(retry);
  return <DashboardDrawer isOpen onClose={() => { if (!busy) onClose(); }} titlePrefix="Service order" maxW={{ base: "100%", lg: "850px" }}><Stack spacing={5} minW={0}>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {retry && <Alert status="warning"><AlertIcon /><Stack><Text fontSize="sm">The outcome is uncertain. Retry the same service action before another.</Text><Button size="sm" alignSelf="start" isDisabled={busy} onClick={() => void execute(retry)}>Retry same request</Button></Stack></Alert>}
    {loading ? <Skeleton h="220px" /> : data && <>
      <HStack flexWrap="wrap" justify="space-between"><Box minW={0}><Text fontSize="lg" fontWeight="700" overflowWrap="anywhere">{data.assetSnapshot.name}</Text><Text fontSize="sm">{data.assetSnapshot.tag} | {data.reference}</Text></Box><Badge colorScheme={data.status === "completed" ? "green" : data.status === "unrepairable" ? "red" : "blue"}>{serviceStates[data.status]}</Badge></HStack>
      <HStack flexWrap="wrap"><Button size="sm" variant="outline" isDisabled={busy} onClick={() => onAsset(data.asset)}>Asset details</Button>{data.openIncident && <Button size="sm" variant="outline" colorScheme="orange" isDisabled={busy} onClick={() => onIncident(data.openIncident!)}>Open incident</Button>}<Button size="sm" variant="ghost" isDisabled={busy} onClick={() => { setAction(""); setReload((value) => value + 1); }}>Reload</Button></HStack>
      {data.externalDispatched && data.status !== "written_off" && <Alert status="warning"><AlertIcon />Equipment is recorded with the external provider. Confirm its physical return before inspection or cancellation.</Alert>}
      {(data.openWriteOff || data.writeOffRecord) && <Alert status="warning"><AlertIcon /><Box><Text fontSize="sm">{data.status === "written_off" ? "Service closed as unrecovered loss, not provider receipt. Original work and dispatch history remain." : "Write-off review is pending. Withdraw it before recording new service custody or inspection actions."}</Text><Button mt={2} size="xs" isDisabled={busy} onClick={() => onWriteOff((data.openWriteOff || data.writeOffRecord)!)}>Open write-off</Button></Box></Alert>}
      {data.recoveredAfterWriteOffAt && <Text fontSize="sm">Unit later recovered on {dateTime(data.recoveredAfterWriteOffAt)}. This service order remains closed.</Text>}
      {data.openIncident && <Alert status="warning"><AlertIcon />An incident is still open. Passing inspection does not close that case or release the unit for issue.</Alert>}
      {data.status === "cancelled" || data.status === "unrepairable" ? <Alert status="warning"><AlertIcon />The unit remains unavailable. Start a new service order and pass inspection, or retire the unit.</Alert> : null}
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>{[["Service type", serviceKinds[data.kind]], ["Provider", data.providerType === "external" ? data.providerName : data.providerName || "Internal team"], ["Provider reference", data.providerReference || "Not recorded"], ["Expected completion", data.expectedCompletionDate || "Not set"], ["Opened by / on", `${data.creatorName} | ${dateTime(data.createdAt)}`], ["Work cycle", String(data.cycle)], ["Cost for current cycle", serviceCostLabel(data.actualCostMinor, data.currency)]].map(([label, value]) => <Box key={label} minW={0}><Text fontSize="xs" color="gray.500">{label}</Text><Text fontSize="sm" overflowWrap="anywhere">{value}</Text></Box>)}</SimpleGrid>
      <Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.issueDescription}</Text>
      {data.workPerformed && <Box borderTopWidth="1px" pt={3}><Text fontWeight="600">Work performed</Text><Text fontSize="xs">{data.workCompletedName} | {dateTime(data.workCompletedAt)}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.workPerformed}</Text></Box>}
      {data.inspectedAt && <Box borderTopWidth="1px" pt={3}><Text fontWeight="600">Last inspection: {statusLabel(data.inspectionResult || "")}</Text><Text fontSize="xs">{data.inspectorName} | {dateTime(data.inspectedAt)} | {conditionLabels[data.inspectionCondition || ""]}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.inspectionReason}</Text></Box>}
      {data.closedAt && <Text fontSize="sm">Closed by {data.closerName} on {dateTime(data.closedAt)}: {data.closeReason}</Text>}
      <HStack flexWrap="wrap">{data.canStart && <Button size="sm" colorScheme="blue" isDisabled={disabled} onClick={() => choose("start")}>{data.providerType === "external" ? "Dispatch to provider" : "Start service"}</Button>}{data.canCompleteWork && <Button size="sm" colorScheme="blue" isDisabled={disabled} onClick={() => choose("work-complete")}>Record completed work</Button>}{data.canReceiveUnrepaired && <Button size="sm" variant="outline" isDisabled={disabled} onClick={() => choose("receive-unrepaired")}>Receive without repair</Button>}{data.canInspect && <Button size="sm" colorScheme="green" isDisabled={disabled} onClick={() => choose("inspection")}>Inspect equipment</Button>}{data.canCancel && <Button size="sm" variant="outline" colorScheme="red" isDisabled={disabled} onClick={() => choose("cancel")}>Cancel order</Button>}{data.canAddNote && <Button size="sm" variant="outline" isDisabled={disabled} onClick={() => choose("notes")}>Add note</Button>}</HStack>
      {action && <Box borderTopWidth="1px" pt={4}><Stack spacing={4}><Text fontWeight="600">{labels[action]}</Text>
        {action === "work-complete" && <><FormControl isRequired><FormLabel htmlFor="service-work-performed">Work performed</FormLabel><Textarea id="service-work-performed" value={work} maxLength={2000} isDisabled={disabled} onChange={(event) => setWork(event.target.value)} /><Text mt={1} fontSize="xs" color="gray.500">At least 10 characters.</Text></FormControl><SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}><FormControl><FormLabel htmlFor="service-cost">Cost for this cycle (optional)</FormLabel><Input id="service-cost" inputMode="decimal" value={amount} placeholder="Not recorded" isDisabled={disabled} onChange={(event) => setAmount(event.target.value)} /></FormControl><FormControl><FormLabel htmlFor="service-currency">Currency</FormLabel><Select id="service-currency" value={currency} isDisabled={disabled} onChange={(event) => setCurrency(event.target.value)}>{serviceCurrencies.map((value) => <option key={value} value={value}>{value}</option>)}</Select></FormControl></SimpleGrid></>}
        {action === "inspection" && <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}><FormControl isRequired><FormLabel htmlFor="service-inspection-result">Inspection outcome</FormLabel><Select id="service-inspection-result" value={result} isDisabled={disabled} onChange={(event) => setResult(event.target.value)}><option value="passed">Passed - usable</option><option value="rework">Failed - needs more work</option><option value="unrepairable">Unrepairable</option></Select></FormControl><FormControl isRequired><FormLabel htmlFor="service-inspection-condition">Condition</FormLabel><Select id="service-inspection-condition" value={result === "passed" ? condition : "damaged"} isDisabled={disabled || result !== "passed"} onChange={(event) => setCondition(event.target.value)}>{Object.entries(conditionLabels).map(([key, label]) => <option key={key} value={key} disabled={result === "passed" && key === "damaged"}>{label}</option>)}</Select></FormControl></SimpleGrid>}
        {action === "cancel" && <Text fontSize="sm">Cancellation does not certify the unit is usable. It remains in maintenance until a new service order passes inspection.</Text>}
        <FormControl isRequired><FormLabel htmlFor="service-action-reason">{action === "notes" ? "Service note" : action === "inspection" ? "Inspection findings" : "Reason / notes"}</FormLabel><Textarea id="service-action-reason" value={reason} maxLength={1000} isDisabled={disabled} onChange={(event) => setReason(event.target.value)} /></FormControl>
        {needsConfirmation && <Checkbox id="service-action-confirmation" alignItems="start" isChecked={confirmed} isDisabled={disabled} onChange={(event) => setConfirmed(event.target.checked)}>{action === "start" ? `I physically dispatched this unit to ${data.providerName}.` : action === "inspection" ? "I physically inspected this unit and recorded its actual condition and outcome." : action === "cancel" ? "I confirm the unit is physically in company custody." : "I physically received this unit back from the service provider."}</Checkbox>}
        <HStack flexWrap="wrap"><Button size="sm" variant="ghost" isDisabled={disabled} onClick={() => setAction("")}>Cancel action</Button><Button size="sm" colorScheme="blue" isLoading={busy} isDisabled={disabled || reason.trim().length < 3 || action === "work-complete" && work.trim().length < 10 || Boolean(needsConfirmation && !confirmed)} onClick={save}>{labels[action]}</Button></HStack>
      </Stack></Box>}
      <Box borderTopWidth="1px" pt={4}><Text fontWeight="600" mb={3}>Service history</Text><Stack spacing={4}>{history.data.map((event) => <Box key={event._id} borderBottomWidth="1px" pb={3}><Text fontSize="sm" fontWeight="600">{statusLabel(event.action)} | Cycle {event.after?.cycle}</Text><Text fontSize="xs" color="gray.500">{event.actorName} | {dateTime(event.createdAt)}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{event.reason}</Text>{event.action === "work_complete" && <><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{event.after?.workPerformed}</Text><Text fontSize="xs">{serviceCostLabel(event.after?.actualCostMinor ?? null, event.after?.currency || "INR")}</Text></>}</Box>)}{history.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={history.pagination.totalPages} onPageChange={setPage} />}</Stack></Box>
    </>}
    {!loading && !data && <Button onClick={() => setReload((value) => value + 1)}>Reload service order</Button>}
  </Stack></DashboardDrawer>;
}
