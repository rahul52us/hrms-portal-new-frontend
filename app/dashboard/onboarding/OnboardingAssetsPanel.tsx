"use client";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, Divider, Flex, FormControl, FormLabel, HStack, Input, SimpleGrid, Skeleton, Stack, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetSave, categoryLabel, dateTime, statusLabel } from "../assets/assetApi";
import { emptyPage, onboardingGet, onboardingSave, Page } from "./onboardingApi";
import { EmployeeOnboarding, OnboardingTask } from "./employeeOnboardingApi";

type Link = { _id: string; cycle: number; active: boolean; status: string; assetSnapshot: { name: string; tag: string; serialNumber: string }; assignmentId: string; issuedAt: string; linkedAt: string; linkedByName: string; reason: string; endedAt?: string; endReason?: string; assignmentStatus: string; acknowledgedAt: string | null; assignmentRevision: number; qualifyingIssued: boolean; fulfilled: boolean; canAcknowledge: boolean; canDetach: boolean };
type Meta = { revision: number; cycle: number; cancelled: boolean; canLink: boolean; canDetach: boolean; progress: NonNullable<OnboardingTask["assetProvision"]> };
type Evidence = Page<Link> & { meta: Meta };
type Event = { _id: string; action: string; cycle: number; actorName: string; reason: string; createdAt: string };
type Candidate = { _id: string; revision: number; name: string; tag: string; serialNumber: string; acknowledgedAt?: string | null };
type Option = { value: string; label: string; revision: number };
type Action = { kind: "issue" | "link" | "detach" | "acknowledge"; link?: Link };
type Command = { path: string; body: Record<string, unknown>; asset: boolean };

export default function OnboardingAssetsPanel({ instanceId, employee, revision, task, busy, setBusy, onChanged }: {
  instanceId: string; employee: EmployeeOnboarding["employee"]; revision: number; task: OnboardingTask; busy: boolean; setBusy: (value: boolean) => void; onChanged: () => void;
}) {
  const [open, setOpen] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState(""), [reload, setReload] = useState(0);
  const [evidence, setEvidence] = useState<Evidence | null>(null), [events, setEvents] = useState<Page<Event>>({ data: [], pagination: emptyPage });
  const [page, setPage] = useState(1), [eventPage, setEventPage] = useState(1), [showHistory, setShowHistory] = useState(false);
  const [action, setAction] = useState<Action | null>(null), [selected, setSelected] = useState<Option | null>(null), [reason, setReason] = useState(""), [returnDate, setReturnDate] = useState(""), [confirmed, setConfirmed] = useState(false), [retry, setRetry] = useState<Command | null>(null);
  const editor = useRef<HTMLDivElement>(null);
  const path = `/instances/${instanceId}/tasks/${task._id}`;
  const counts = evidence?.meta.progress || task.assetProvision;
  useEffect(() => { if (action) editor.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [action]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController(); setLoading(true); setError("");
    const load = async () => {
      try {
        const links = await onboardingGet<Evidence>(`${path}/assets`, { page, limit: 10, history: showHistory }, controller.signal);
        const history = await onboardingGet<Page<Event>>(`${path}/asset-events`, { page: eventPage, limit: 10 }, controller.signal);
        if (!controller.signal.aborted) { setEvidence(links); setEvents(history); }
      } catch (err) { if (!controller.signal.aborted) { setEvidence(null); setError(getApiErrorMessage(err)); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [open, path, revision, reload, page, eventPage, showHistory]);
  const choose = (kind: Action["kind"], link?: Link) => { setAction({ kind, link }); setSelected(null); setReason(""); setReturnDate(""); setConfirmed(false); setError(""); };
  const candidates = async (search: string): Promise<Option[]> => {
    const result = await onboardingGet<Page<Candidate>>(`${path}/asset-options`, { source: action?.kind === "issue" ? "available" : "assigned", search: search || undefined, limit: 20 });
    return result.data.map((item) => ({ value: item._id, revision: item.revision, label: `${item.name} (${item.tag})${item.serialNumber ? ` | ${item.serialNumber}` : ""}${item.acknowledgedAt ? " | Receipt acknowledged" : ""}` }));
  };
  const execute = async (command: Command) => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (command.asset) await assetSave(command.path, command.body); else await onboardingSave(command.path, command.body);
      setRetry(null); setAction(null); setConfirmed(false); setPage(1); setEventPage(1); setReload((value) => value + 1); onChanged();
    } catch (err: any) {
      // An uncertain network/5xx outcome must replay the exact command, not issue another physical handover.
      setRetry(!err?.response || err.response.status >= 500 ? command : null);
      setError(getApiErrorMessage(err?.response?.data || err, "Unable to update onboarding equipment"));
    } finally { setBusy(false); }
  };
  const save = () => {
    if (!action || !evidence || busy || retry || loading) return;
    const requestId = crypto.randomUUID(), common = { reason: reason.trim(), requestId }, currentRevision = evidence.meta.revision;
    if (action.kind === "issue" && selected && confirmed) {
      void execute({ asset: true, path: `/inventory/${selected.value}/issue`, body: { ...common, revision: selected.revision, employeeId: employee._id, expectedReturnDate: returnDate, handoverNotes: reason.trim(), confirmHandover: true, onboardingReference: { instanceId, taskId: task._id, revision: currentRevision } } });
    } else if (action.kind === "link" && selected) {
      void execute({ asset: false, path: `${path}/assets`, body: { ...common, revision: currentRevision, assignmentId: selected.value, assignmentRevision: selected.revision } });
    } else if (action.kind === "detach" && action.link) {
      void execute({ asset: false, path: `${path}/assets/${action.link._id}/detach`, body: { ...common, revision: currentRevision } });
    } else if (action.kind === "acknowledge" && action.link && confirmed) {
      void execute({ asset: true, path: `/assignments/${action.link.assignmentId}/acknowledge`, body: { requestId, revision: action.link.assignmentRevision, confirmReceipt: true, note: reason.trim() } });
    }
  };
  const disabled = busy || loading || !evidence || Boolean(retry);
  const canSave = action?.kind === "acknowledge" ? confirmed : reason.trim().length >= 3 && (action?.kind === "detach" || Boolean(selected) && (action?.kind !== "issue" || confirmed));
  return <Stack spacing={3} minW={0}>
    <Flex gap={2} wrap="wrap" align="center"><Badge colorScheme="cyan">Equipment</Badge><Text fontSize="sm">{task.assetRequirement?.quantity} {categoryLabel(task.assetRequirement?.category || "", task.assetRequirement?.categoryName)} unit(s)</Text><Button size="sm" variant="outline" isDisabled={busy || Boolean(retry)} onClick={() => setOpen((value) => !value)}>{open ? "Hide equipment" : "View equipment"}</Button></Flex>
    <Text fontSize="sm">{counts?.fulfilled || 0}/{task.assetRequirement?.quantity} fulfilled | {counts?.issued || 0} issued | {counts?.acknowledged || 0} receipt acknowledged</Text>
    <Text fontSize="xs" color="gray.500">Complete after {task.assetRequirement?.receiptRequired ? "the employee acknowledges receipt" : "physical handover is recorded"}.</Text>
    {task.status === "waived" && <Text fontSize="sm">Requirement waived. Equipment custody is unchanged.</Text>}
    {open && <Box borderLeftWidth="3px" pl={{ base: 2, sm: 4 }} minW={0}><Stack spacing={4}>
      {error && <Alert status="error"><AlertIcon /><Text overflowWrap="anywhere">{error}</Text></Alert>}
      {retry && <Alert status="warning"><AlertIcon /><Stack spacing={2}><Text fontSize="sm">The result is uncertain. Retry the same request before starting another equipment action.</Text><Button alignSelf="start" size="sm" isDisabled={busy} onClick={() => void execute(retry)}>Retry same request</Button></Stack></Alert>}
      <Flex gap={3} wrap="wrap" justify="space-between"><Checkbox id={`onboarding-assets-history-${task._id}`} isChecked={showHistory} isDisabled={busy} onChange={(event) => { setShowHistory(event.target.checked); setPage(1); }}>Include previous links</Checkbox><Button size="xs" variant="outline" isDisabled={busy} onClick={() => setReload((value) => value + 1)}>Reload equipment</Button></Flex>
      {loading ? <Skeleton h="100px" /> : evidence && <>
        {evidence.meta.cancelled && <Text fontSize="sm">Cancelled checklist. Progress is retained as recorded at cancellation; custody continues in Assets.</Text>}
        {evidence.meta.canLink && <HStack flexWrap="wrap"><Button size="sm" colorScheme="blue" isDisabled={disabled} onClick={() => choose("issue")}>Issue equipment</Button><Button size="sm" variant="outline" isDisabled={disabled} onClick={() => choose("link")}>Link existing handover</Button></HStack>}
        {!evidence.data.length && <Text fontSize="sm" color="gray.500">No equipment linked{showHistory ? "." : " in this task cycle."}</Text>}
        {evidence.data.map((link) => <Box key={link._id} borderTopWidth="1px" pt={3} minW={0}>
          <Flex gap={2} wrap="wrap" align="start"><Text fontSize="sm" fontWeight="600" overflowWrap="anywhere">{link.assetSnapshot.name} ({link.assetSnapshot.tag})</Text><Badge colorScheme={link.fulfilled ? "green" : link.active ? "yellow" : "gray"}>{!link.active ? statusLabel(link.status) : link.fulfilled ? "Fulfilled" : link.qualifyingIssued ? "Awaiting receipt" : statusLabel(link.assignmentStatus)}</Badge></Flex>
          <Text fontSize="xs" color="gray.500">Issued {dateTime(link.issuedAt)} | Linked by {link.linkedByName} | Cycle {link.cycle}</Text>
          <Text fontSize="xs">Receipt: {link.acknowledgedAt ? dateTime(link.acknowledgedAt) : "Not acknowledged"}</Text>
          {link.endReason && <Text fontSize="xs" overflowWrap="anywhere">{link.endReason}</Text>}
          <HStack mt={2} flexWrap="wrap"><Button as="a" href={`/dashboard/assets?assignmentId=${link.assignmentId}`} size="xs" variant="outline">View handover</Button>{link.canAcknowledge && <Button size="xs" colorScheme="blue" isDisabled={disabled} onClick={() => choose("acknowledge", link)}>Acknowledge receipt</Button>}{link.canDetach && <Button size="xs" variant="ghost" colorScheme="red" isDisabled={disabled} onClick={() => choose("detach", link)}>Detach evidence</Button>}</HStack>
        </Box>)}
        {evidence.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={evidence.pagination.totalPages} onPageChange={setPage} />}
      </>}
      {action && <Box ref={editor} borderTopWidth="1px" pt={4}><Stack spacing={4}>
        <Text fontWeight="600">{action.kind === "issue" ? `Issue equipment to ${employee.name}` : action.kind === "link" ? "Link an existing handover" : action.kind === "detach" ? "Detach equipment evidence" : "Acknowledge physical receipt"}</Text>
        {["issue", "link"].includes(action.kind) && <FormControl isRequired><FormLabel htmlFor={`onboarding-asset-option-${task._id}`}>{action.kind === "issue" ? "Available equipment" : "Employee's issued equipment"}</FormLabel><AsyncSelect key={`${action.kind}:${evidence?.meta.revision}`} inputId={`onboarding-asset-option-${task._id}`} defaultOptions loadOptions={candidates} value={selected} onChange={setSelected} isDisabled={disabled} isClearable menuPortalTarget={typeof document !== "undefined" ? document.body : undefined} styles={{ menuPortal: (base) => ({ ...base, zIndex: 2000 }) }} /></FormControl>}
        {action.kind === "issue" && <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}><FormControl><FormLabel htmlFor={`onboarding-asset-return-${task._id}`}>Expected return date</FormLabel><Input id={`onboarding-asset-return-${task._id}`} type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} isDisabled={disabled} /></FormControl></SimpleGrid>}
        {action.kind === "detach" && <Text fontSize="sm">Detach {action.link?.assetSnapshot.tag} from this task? The task may reopen. This does not return, void or change custody of the equipment.</Text>}
        <FormControl isRequired={action.kind !== "acknowledge"}><FormLabel htmlFor={`onboarding-asset-reason-${task._id}`}>{action.kind === "acknowledge" ? "Receipt note (optional)" : "Reason / handover note"}</FormLabel><Textarea id={`onboarding-asset-reason-${task._id}`} value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} isDisabled={disabled} /></FormControl>
        {action.kind === "issue" && <Checkbox id={`onboarding-asset-confirm-issue-${task._id}`} alignItems="start" isChecked={confirmed} isDisabled={disabled} onChange={(event) => setConfirmed(event.target.checked)}>I confirm this equipment has been physically handed to {employee.name}.</Checkbox>}
        {action.kind === "acknowledge" && <Checkbox id={`onboarding-asset-confirm-receipt-${task._id}`} alignItems="start" isChecked={confirmed} isDisabled={disabled} onChange={(event) => setConfirmed(event.target.checked)}>I confirm I physically received {action.link?.assetSnapshot.name} ({action.link?.assetSnapshot.tag}).</Checkbox>}
        <HStack flexWrap="wrap"><Button size="sm" variant="ghost" isDisabled={busy || Boolean(retry)} onClick={() => setAction(null)}>Cancel</Button><Button size="sm" colorScheme="blue" isDisabled={disabled || !canSave} onClick={save}>{action.kind === "issue" ? "Record handover" : action.kind === "link" ? "Link handover" : action.kind === "detach" ? "Detach evidence" : "Confirm receipt"}</Button></HStack>
      </Stack></Box>}
      <Divider /><Text fontWeight="600" fontSize="sm">Equipment task history</Text>
      {!loading && events.data.map((item) => <Box key={item._id}><Text fontSize="sm">{statusLabel(item.action)} | Cycle {item.cycle}</Text><Text fontSize="xs" color="gray.500">{item.actorName} | {dateTime(item.createdAt)}</Text><Text fontSize="xs" whiteSpace="pre-wrap" overflowWrap="anywhere">{item.reason}</Text></Box>)}
      {!loading && !events.data.length && <Text fontSize="sm" color="gray.500">No equipment task events yet.</Text>}
      {events.pagination.totalPages > 1 && <Pagination currentPage={eventPage} totalPages={events.pagination.totalPages} onPageChange={setEventPage} />}
    </Stack></Box>}
  </Stack>;
}
