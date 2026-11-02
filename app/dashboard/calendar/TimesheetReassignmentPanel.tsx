"use client";
import { Alert, AlertIcon, Box, Button, FormControl, FormHelperText, FormLabel, Select, Stack, Text, Textarea } from "@chakra-ui/react";
import ChoiceSelect from "react-select";
import { useEffect, useRef, useState } from "react";
import ConfirmationModal from "@/app/component/common/ConfirmationModal/ConfirmationModal";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { getReassignmentChoices, ReassignmentChoice, ReassignmentPayload, TimesheetSubmission } from "./timesheetApi";

export default function TimesheetReassignmentPanel({ submission, busy, onConfirm }: { submission: TimesheetSubmission; busy: boolean; onConfirm: (payload: ReassignmentPayload) => Promise<void> }) {
  const step = submission.approvalInstance.steps.find((s) => s.order === submission.approvalInstance.currentStepOrder && s.status === "pending");
  const pendingApprovers: any[] = step?.approvers.filter((a: any) => a.status === "pending") || [];
  const [from, setFrom] = useState(""), [choice, setChoice] = useState<ReassignmentChoice | null>(null), [reason, setReason] = useState(""), [confirm, setConfirm] = useState(false), [error, setError] = useState("");
  const [search, setSearch] = useState(""), [query, setQuery] = useState(""), [page, setPage] = useState(1), [opened, setOpened] = useState(false), [choices, setChoices] = useState<ReassignmentChoice[]>([]), [more, setMore] = useState(false), [loading, setLoading] = useState(false), [lookupRetry, setLookupRetry] = useState(0);
  const retry = useRef<{ signature: string; payload: ReassignmentPayload } | null>(null), flight = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setFrom(pendingApprovers[0]?.user || ""); setChoice(null); setReason(""); setSearch(""); setQuery(""); setPage(1); setChoices([]); setOpened(false); setError(""); retry.current = null; }, [submission._id, submission.sheetRevision]);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1); setChoices([]); }, 250); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    if (!opened || !submission.reassignment?.canReassign || busy) return;
    const controller = new AbortController(); setLoading(true); setError("");
    getReassignmentChoices(submission._id, query, page, controller.signal).then((result) => { if (!controller.signal.aborted) { setChoices((old) => page === 1 ? result.data : [...old, ...result.data.filter((next) => !old.some((o) => o._id === next._id))]); setMore(result.pagination.hasMore); } }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Could not load replacement approvers")); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [opened, submission._id, submission.sheetRevision, submission.reassignment?.canReassign, query, page, lookupRetry, busy]);
  async function apply() {
    if (!choice || !from || !step || busy || flight.current) return;
    const values = { revision: submission.sheetRevision, stepOrder: step.order, fromUserId: from, toUserId: choice._id, reason: reason.trim() };
    const signature = JSON.stringify(values); if (retry.current?.signature !== signature) retry.current = { signature, payload: { ...values, requestId: crypto.randomUUID() } };
    flight.current = true; setConfirm(false); setError("");
    try { await onConfirm(retry.current.payload); }
    catch (err: any) { if (mounted.current) setError(getApiErrorMessage(err?.response?.data || err, "Could not reassign. Retry safely or reload the submission.")); }
    finally { flight.current = false; }
  }
  if (!submission.reassignment?.authorized) return null;
  return <Box borderTopWidth="1px" pt={4} minW={0}><Stack spacing={3}>
    <Text fontWeight="700">Reassign current approval</Text>
    {!submission.reassignment.canReassign ? <Alert status="info"><AlertIcon />{submission.reassignment.blockedReason}</Alert> : <>
      <Text fontSize="sm">{step?.nameSnapshot} | {step?.approvalRule === "all" ? "All pending reviewers must approve" : "Any pending reviewer can approve"}</Text>
      <FormControl isRequired><FormLabel htmlFor="timesheet-reassign-from">Approver to replace</FormLabel><Select id="timesheet-reassign-from" aria-label="Approver to replace" value={from} isDisabled={busy} onChange={(e) => setFrom(e.target.value)}>{pendingApprovers.map((a) => <option key={a.user} value={a.user}>{a.nameSnapshot}</option>)}</Select></FormControl>
      <FormControl isRequired><FormLabel htmlFor="timesheet-reassign-to">Replacement approver</FormLabel><ChoiceSelect inputId="timesheet-reassign-to" instanceId="timesheet-reassign-to" aria-label="Replacement approver" value={choice} options={choices} getOptionValue={(p) => p._id} getOptionLabel={(p) => `${p.name}${p.code ? ` (${p.code})` : ""}`} isClearable isDisabled={busy} isLoading={loading} filterOption={null} placeholder="Search employee name or code" onChange={setChoice} onMenuOpen={() => setOpened(true)} onInputChange={(value, meta) => { if (meta.action === "input-change") setSearch(value); }} onMenuScrollToBottom={() => { if (more && !loading) setPage((p) => p + 1); }} menuPlacement="auto" maxMenuHeight={180} styles={{ control: (base) => ({ ...base, minHeight: 40 }), menu: (base) => ({ ...base, zIndex: 30 }) }} /></FormControl>
      <FormControl isRequired><FormLabel htmlFor="timesheet-reassign-reason">Reassignment reason</FormLabel><Textarea id="timesheet-reassign-reason" aria-label="Reassignment reason" value={reason} maxLength={500} rows={2} isDisabled={busy} onChange={(e) => setReason(e.target.value)} /><FormHelperText>Recorded in history and shared with the employee and both reviewers.</FormHelperText></FormControl>
      <Text fontSize="xs" color="gray.500">Completed decisions and other approval levels stay unchanged. Reporting manager and role permissions do not change.</Text>
      {error ? <Alert status="error"><AlertIcon /><Box minW={0}><Text overflowWrap="anywhere">{error}</Text><Button type="button" size="xs" variant="link" onClick={() => setLookupRetry((r) => r + 1)}>Retry approver search</Button></Box></Alert> : null}
      <Button type="button" alignSelf="start" colorScheme="blue" isLoading={busy} isDisabled={!from || !choice || reason.trim().length < 3} onClick={() => setConfirm(true)}>Reassign approval</Button>
    </>}
    <ConfirmationModal isOpen={confirm} onClose={() => setConfirm(false)} onConfirm={apply} title="Reassign this approval?" description={`Move ${pendingApprovers.find((a) => a.user === from)?.nameSnapshot || "the pending reviewer"}'s approval to ${choice?.name || "the selected reviewer"}. Previous decisions remain unchanged.`} confirmText="Confirm reassignment" cancelText="Keep current approver" tone="warning" />
  </Stack></Box>;
}
