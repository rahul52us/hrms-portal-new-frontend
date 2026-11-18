"use client";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, FormControl, FormLabel, Heading, HStack, IconButton, Input, Select, SimpleGrid, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Textarea, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { emptyPage, onboardingGet, onboardingSave, Page } from "./onboardingApi";

type Policy = { enabled: boolean; retentionDays: number; revision: number };
type File = { _id: string; name: string; size: number; provider: string; status: string; removedAt: string | null; eligibleAt: string | null; revision: number; linked: boolean; eligible: boolean; issues: string[]; employeeName: string; employeeCode: string; hold: { active: boolean; reason?: string }; canStartClock: boolean; canChangeHold: boolean };
type Erasure = { _id: string; status: string; revision: number; requesterName: string; reason: string; retentionDays: number; approverName?: string; approvedAt?: string; approvalExpiresAt?: string; expiresAt: string; createdAt: string; erasedCount: number; skippedCount: number; itemCount: number; error?: string; decisionReason?: string; canApprove: boolean; canReject: boolean; canWithdraw: boolean; canRetry: boolean; items?: { documentId: string; name: string; status: string; removedAt: string; detail: string }[] };
type Audit = { _id: string; action: string; actorName: string; reason: string; createdAt: string };
type Editor = { kind: "policy" } | { kind: "create" } | { kind: "file"; file: File } | { kind: "request"; id: string };
const date = (value?: string | null) => value ? new Date(value).toLocaleString() : "Not started";
const label = (value: string) => value.replace(/_/g, " ");
function Pager({ page, total, loading, onChange }: { page: number; total: number; loading: boolean; onChange: (page: number) => void }) {
  return <HStack justify="end" mt={3}><IconButton aria-label="Previous page" title="Previous page" size="sm" icon={<FiChevronLeft />} isDisabled={loading || page <= 1} onClick={() => onChange(page - 1)} /><Text fontSize="sm">{page}/{total}</Text><IconButton aria-label="Next page" title="Next page" size="sm" icon={<FiChevronRight />} isDisabled={loading || page >= total} onClick={() => onChange(page + 1)} /></HStack>;
}

export default function OnboardingRetentionPanel({ accountKey }: { accountKey: string }) {
  const [policy, setPolicy] = useState<Policy | null>(null), [enabled, setEnabled] = useState(false), [days, setDays] = useState("");
  const [scope, setScope] = useState("eligible"), [page, setPage] = useState(1), [requestPage, setRequestPage] = useState(1), [auditPage, setAuditPage] = useState(1);
  const [files, setFiles] = useState<Page<File>>({ data: [], pagination: emptyPage }), [requests, setRequests] = useState<Page<Erasure>>({ data: [], pagination: emptyPage }), [audit, setAudit] = useState<Page<Audit>>({ data: [], pagination: emptyPage });
  const [selected, setSelected] = useState<File[]>([]), [reload, setReload] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null), [detail, setDetail] = useState<Erasure | null>(null), [detailLoading, setDetailLoading] = useState(false), [reason, setReason] = useState(""), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [editError, setEditError] = useState("");
  // Keep the exact body and key on an uncertain-response retry; changed inputs create a new intent.
  const intent = useRef<{ signature: string; requestId: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController(); setPolicy(null);
    onboardingGet<{ data: Policy }>("/retention/policy", undefined, controller.signal).then(({ data }) => { if (!controller.signal.aborted) setPolicy(data); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); });
    return () => controller.abort();
  }, [accountKey, reload]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setSelected([]);
    const load = async () => {
      try {
        const inventory = await onboardingGet<Page<File>>("/retention/documents", { scope, page, limit: 20 }, controller.signal);
        const erasures = await onboardingGet<Page<Erasure>>("/retention/requests", { page: requestPage, limit: 10 }, controller.signal);
        const history = await onboardingGet<Page<Audit>>("/retention/audit", { page: auditPage, limit: 10 }, controller.signal);
        if (!controller.signal.aborted) { setFiles(inventory); setRequests(erasures); setAudit(history); }
      } catch (err) { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [accountKey, scope, page, requestPage, auditPage, reload]);
  const requestId = editor?.kind === "request" ? editor.id : "";
  useEffect(() => {
    if (!requestId) { setDetail(null); return; }
    const controller = new AbortController(); setDetailLoading(true);
    onboardingGet<{ data: Erasure }>(`/retention/requests/${requestId}`, undefined, controller.signal).then(({ data }) => { if (!controller.signal.aborted) setDetail(data); }).catch((err) => { if (!controller.signal.aborted) setEditError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [requestId, reload]);
  const active = requests.data.some((request) => ["approved", "running"].includes(request.status)) || Boolean(detail && ["approved", "running"].includes(detail.status));
  useEffect(() => { if (!active || busy || editor && editor.kind !== "request") return; const timer = setInterval(() => setReload((n) => n + 1), 10000); return () => clearInterval(timer); }, [active, busy, editor]);
  const open = (next: Editor) => { setEditor(next); setReason(""); setConfirmed(false); setEditError(""); setDetail(null); intent.current = null; if (policy) { setEnabled(policy.enabled); setDays(String(policy.retentionDays)); } };
  const close = () => { if (!busy) setEditor(null); };
  const mutate = async (path: string, fields: Record<string, unknown>, method: "post" | "put" = "post") => {
    if (busy || reason.trim().length < 3) return;
    const body = { ...fields, reason: reason.trim() }, signature = JSON.stringify({ path, body });
    if (intent.current?.signature !== signature) intent.current = { signature, requestId: crypto.randomUUID() };
    setBusy(true); setEditError("");
    try { await onboardingSave(path, { ...body, requestId: intent.current.requestId }, method); setEditor(null); setSelected([]); setReload((n) => n + 1); }
    catch (err) { setEditError(getApiErrorMessage(err)); }
    finally { setBusy(false); }
  };
  const actionDisabled = busy || reason.trim().length < 3;
  return <Stack borderTopWidth="1px" pt={6} spacing={6} minW={0}>
    <Box><HStack justify="space-between" flexWrap="wrap" gap={3} mb={3}><Heading size="sm">Document retention and erasure</Heading><IconButton aria-label="Reload retention" title="Reload retention" size="sm" isLoading={loading} icon={<FiRefreshCw />} onClick={() => setReload((n) => n + 1)} /></HStack>
      {error && <Alert status="error" mb={3}><AlertIcon />{error}</Alert>}
      {!policy ? !error && <Skeleton h="70px" /> : <HStack gap={4} flexWrap="wrap"><Badge colorScheme={policy.enabled ? "green" : "gray"}>{policy.enabled ? "Enabled" : "Disabled"}</Badge><Text fontSize="sm">Retain removed onboarding files for {policy.retentionDays} days</Text><Button size="sm" variant="outline" onClick={() => open({ kind: "policy" })}>Edit retention</Button></HStack>}
      <Text fontSize="sm" mt={3}>Only removed onboarding files are eligible. Linked documents remain protected. Erasure requires approval by another administrator.</Text>
    </Box>
    <Box><HStack justify="space-between" flexWrap="wrap" gap={3} mb={3}><Heading size="sm">Document inventory</Heading><HStack flexWrap="wrap"><Select aria-label="Document inventory scope" size="sm" w="210px" value={scope} onChange={(event) => { setScope(event.target.value); setPage(1); setSelected([]); }}><option value="eligible">Eligible for erasure</option><option value="removed">Removed documents</option><option value="held">On legal hold</option><option value="all">All onboarding files</option></Select><Button size="sm" colorScheme="red" variant="outline" isDisabled={loading || Boolean(error) || !policy?.enabled || !selected.length} onClick={() => open({ kind: "create" })}>Request erasure ({selected.length})</Button></HStack></HStack>
      <TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr><Th w="35px" /><Th>Document / employee</Th><Th>Removed on</Th><Th>Eligible from</Th><Th>Status</Th><Th /></Tr></Thead><Tbody>
        {!files.data.length && <Tr><Td colSpan={6}>{loading ? "Loading documents..." : "No documents in this view."}</Td></Tr>}
        {files.data.map((file) => <Tr key={file._id}><Td><Checkbox aria-label={`Select ${file.name}`} isChecked={selected.some((entry) => entry._id === file._id)} isDisabled={!file.eligible || loading || Boolean(error)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, file] : current.filter((entry) => entry._id !== file._id))} /></Td><Td whiteSpace="normal" minW="170px"><Text fontWeight="600">{file.name}</Text><Text fontSize="xs">{file.employeeName} {file.employeeCode}</Text></Td><Td>{date(file.removedAt)}</Td><Td>{file.eligibleAt ? date(file.eligibleAt) : "Not started"}</Td><Td whiteSpace="normal" minW="180px"><Badge colorScheme={file.hold.active ? "orange" : file.eligible ? "green" : "gray"}>{file.hold.active ? "Legal hold" : file.eligible ? "Eligible" : label(file.status)}</Badge>{file.issues.map((issue) => <Text key={issue} fontSize="xs">{issue}</Text>)}</Td><Td><Button size="xs" variant="outline" onClick={() => open({ kind: "file", file })}>Review</Button></Td></Tr>)}
      </Tbody></Table></TableContainer><Pager page={page} total={files.pagination.totalPages} loading={loading} onChange={setPage} />
    </Box>
    <Box><Heading size="sm" mb={3}>Erasure requests</Heading><TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr><Th>Requested</Th><Th>Requested by</Th><Th>Files</Th><Th>Status</Th><Th>Erased / skipped</Th><Th /></Tr></Thead><Tbody>
      {!requests.data.length && <Tr><Td colSpan={6}>{loading ? "Loading requests..." : "No erasure requests."}</Td></Tr>}
      {requests.data.map((request) => <Tr key={request._id}><Td>{date(request.createdAt)}</Td><Td>{request.requesterName}</Td><Td>{request.itemCount}</Td><Td><Badge colorScheme={request.status === "failed" ? "red" : request.status === "completed" ? "green" : "blue"}>{label(request.status)}</Badge></Td><Td>{request.erasedCount} / {request.skippedCount}</Td><Td><Button size="xs" variant="outline" onClick={() => open({ kind: "request", id: request._id })}>Review</Button></Td></Tr>)}
    </Tbody></Table></TableContainer><Pager page={requestPage} total={requests.pagination.totalPages} loading={loading} onChange={setRequestPage} /></Box>
    <Box><Heading size="sm" mb={3}>Retention audit history</Heading><TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr><Th>Time</Th><Th>Action</Th><Th>By</Th><Th>Reason</Th></Tr></Thead><Tbody>
      {!audit.data.length && <Tr><Td colSpan={4}>{loading ? "Loading audit history..." : "No retention changes recorded."}</Td></Tr>}
      {audit.data.map((entry) => <Tr key={entry._id}><Td>{date(entry.createdAt)}</Td><Td>{label(entry.action)}</Td><Td>{entry.actorName}</Td><Td whiteSpace="normal" maxW="500px">{entry.reason}</Td></Tr>)}
    </Tbody></Table></TableContainer><Pager page={auditPage} total={audit.pagination.totalPages} loading={loading} onChange={setAuditPage} /></Box>
    <DashboardDrawer isOpen={Boolean(editor)} onClose={close} titlePrefix={editor?.kind === "policy" ? "Retention policy" : editor?.kind === "file" ? "Document protection" : editor?.kind === "create" ? "Request content erasure" : "Review content erasure"} maxW={{ base: "100%", md: "760px" }}>
      <Stack spacing={5} py={3}>
        {editError && <Alert status="error"><AlertIcon />{editError}</Alert>}
        {editor?.kind === "policy" && policy && <>
          <Checkbox isChecked={enabled} isDisabled={busy} onChange={(event) => setEnabled(event.target.checked)}>Enable approved content erasure</Checkbox>
          <FormControl><FormLabel htmlFor="onboarding-retention-days">Retain for (days after removal)</FormLabel><Input id="onboarding-retention-days" type="number" min={1} max={36500} value={days} isDisabled={busy} onChange={(event) => setDays(event.target.value)} /></FormControl>
          <Text fontSize="sm">Your company must choose a suitable retention period. This setting does not automatically approve or erase files.</Text>
        </>}
        {editor?.kind === "create" && <><Alert status="warning"><AlertIcon />This requests approval only. Another authorized administrator must review it.</Alert><Text>{selected.length} selected document(s), retained for at least {policy?.retentionDays} days after removal.</Text>{selected.map((file) => <Text key={file._id} fontSize="sm">{file.name} - {file.employeeName}</Text>)}</>}
        {editor?.kind === "file" && <><Heading size="sm">{editor.file.name}</Heading><Text>{editor.file.employeeName} {editor.file.employeeCode}</Text><Text fontSize="sm">Removed: {date(editor.file.removedAt)}</Text><Text fontSize="sm">{editor.file.linked ? "Linked to a checklist" : "Not linked to a checklist"}</Text>{editor.file.hold.active && <Alert status="warning"><AlertIcon />Legal hold: {editor.file.hold.reason}</Alert>}{!editor.file.canChangeHold && <Alert status="info"><AlertIcon />Erasure has already started or completed. Protection changes cannot restore the file.</Alert>}{editor.file.canStartClock && <Text fontSize="sm">Older removed files without a removal timestamp are protected. Start their retention clock from now; it cannot be backdated.</Text>}</>}
        {editor?.kind === "request" && (detailLoading && !detail ? <Skeleton h="160px" /> : detail && <>
          <Badge alignSelf="start">{label(detail.status)}</Badge><Text>Requested by {detail.requesterName}</Text><Text>{detail.reason}</Text>
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}><Text fontSize="sm">Approval request expires: {date(detail.expiresAt)}</Text><Text fontSize="sm">Erased: {detail.erasedCount} | Skipped: {detail.skippedCount}</Text></SimpleGrid>
          {detail.approverName && <Text fontSize="sm">Approved by {detail.approverName} on {date(detail.approvedAt)}. Unstarted files must be claimed by {date(detail.approvalExpiresAt)}.</Text>}
          {detail.decisionReason && <Text fontSize="sm">Decision / retry reason: {detail.decisionReason}</Text>}
          {detail.error && <Alert status="error"><AlertIcon />{detail.error}</Alert>}
          <TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr><Th>Document</Th><Th>Removed</Th><Th>Result</Th></Tr></Thead><Tbody>{detail.items?.map((item) => <Tr key={item.documentId}><Td whiteSpace="normal">{item.name}</Td><Td>{date(item.removedAt)}</Td><Td whiteSpace="normal">{label(item.status)}{item.detail && <Text fontSize="xs">{item.detail}</Text>}</Td></Tr>)}</Tbody></Table></TableContainer>
          {(detail.canApprove || detail.canRetry) && <><Alert status="warning"><AlertIcon />Erasure may begin after approval. Once a file is claimed, its content cannot be restored in HRMS. Disabling the policy or adding a hold later will not undo a started erasure.</Alert><Checkbox isChecked={confirmed} isDisabled={busy} onChange={(event) => setConfirmed(event.target.checked)}>I confirm irreversible removal of stored file contents.</Checkbox></>}
        </>)}
        {(editor?.kind !== "request" || detail && (detail.canApprove || detail.canReject || detail.canWithdraw || detail.canRetry)) && <FormControl isRequired><FormLabel htmlFor="onboarding-retention-reason">Reason</FormLabel><Textarea id="onboarding-retention-reason" value={reason} isDisabled={busy} maxLength={1000} onChange={(event) => setReason(event.target.value)} /></FormControl>}
        <HStack flexWrap="wrap" gap={3} justify="end"><Button variant="ghost" isDisabled={busy} onClick={close}>Close</Button>
          {editor?.kind === "policy" && policy && <Button colorScheme="blue" isLoading={busy} isDisabled={actionDisabled || !days || !Number.isInteger(Number(days)) || Number(days) < 1 || Number(days) > 36500} onClick={() => void mutate("/retention/policy", { revision: policy.revision, enabled, retentionDays: Number(days) }, "put")}>Save retention</Button>}
          {editor?.kind === "create" && policy && <Button colorScheme="red" isLoading={busy} isDisabled={actionDisabled || !selected.length} onClick={() => void mutate("/retention/requests", { policyRevision: policy.revision, documents: selected.map((file) => ({ documentId: file._id, revision: file.revision })) })}>Request approval</Button>}
          {editor?.kind === "file" && <>{editor.file.canStartClock && <Button isDisabled={actionDisabled} onClick={() => void mutate(`/retention/documents/${editor.file._id}/start-clock`, { revision: editor.file.revision })}>Start clock now</Button>}{editor.file.canChangeHold && <Button colorScheme={editor.file.hold.active ? "orange" : "blue"} isDisabled={actionDisabled} onClick={() => void mutate(`/retention/documents/${editor.file._id}/hold`, { revision: editor.file.revision, active: !editor.file.hold.active }, "put")}>{editor.file.hold.active ? "Release hold" : "Place legal hold"}</Button>}</>}
          {editor?.kind === "request" && detail && <>
            {detail.canWithdraw && <Button isDisabled={actionDisabled} onClick={() => void mutate(`/retention/requests/${detail._id}/withdraw`, { revision: detail.revision })}>Withdraw request</Button>}
            {detail.canReject && <Button variant="outline" colorScheme="red" isDisabled={actionDisabled} onClick={() => void mutate(`/retention/requests/${detail._id}/decision`, { revision: detail.revision, decision: "reject" })}>Reject</Button>}
            {detail.canApprove && <Button colorScheme="red" isLoading={busy} isDisabled={actionDisabled || !confirmed || detailLoading} onClick={() => void mutate(`/retention/requests/${detail._id}/decision`, { revision: detail.revision, decision: "approve", confirmErasure: true })}>Approve content erasure</Button>}
            {detail.canRetry && <Button colorScheme="red" isDisabled={actionDisabled || !confirmed || detailLoading} onClick={() => void mutate(`/retention/requests/${detail._id}/retry`, { revision: detail.revision, confirmErasure: true })}>Retry approved erasure</Button>}
          </>}
        </HStack>
      </Stack>
    </DashboardDrawer>
  </Stack>;
}
