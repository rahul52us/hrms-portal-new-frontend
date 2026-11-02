"use client";

import { Alert, AlertDescription, AlertIcon, Badge, Box, Button, Flex, FormControl, FormHelperText, FormLabel, HStack, IconButton, Input, SimpleGrid, Skeleton, Stack, Text, Textarea, Tooltip, useColorModeValue, useToast } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FiClock, FiPlus, FiTrash2 } from "react-icons/fi";
import ConfirmationModal from "@/app/component/common/ConfirmationModal/ConfirmationModal";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { DraftPayload, EntryPayload, getTimesheetDay, getTimesheetHistory, saveTimesheetDay, submitTimesheetDay, TimesheetActionPayload, TimesheetDay, TimesheetDocument, TimesheetRevision } from "./timesheetApi";
import { entryDuration, formatMinutes, nextTimesheetDate, requirementReason, validateDraft } from "./timesheetUi.utils";
import TimesheetChoiceSelect from "./TimesheetChoiceSelect";
import TimesheetReviewDrawer from "./TimesheetReviewDrawer";
import TimesheetControlsPanel from "./TimesheetControlsPanel";
import TimesheetContextHistory from "./TimesheetContextHistory";

type EntryRow = EntryPayload & { key: string; projectName: string; projectCode: string; workTypeName: string; workTypeCode: string };
const key = () => crypto.randomUUID();
const payloadEntries = (rows: EntryRow[]): EntryPayload[] => rows.map((row) => ({ ...(row.entryId ? { entryId: row.entryId } : {}), projectId: row.projectId, workTypeId: row.workTypeId, startDate: row.startDate, startTime: row.startTime, endDate: row.endDate, endTime: row.endTime, notes: row.notes }));
const fromDocument = (sheet: TimesheetDocument | null): EntryRow[] => (sheet?.entries || []).map((entry) => ({ key: entry.entryId, entryId: entry.entryId,
  projectId: entry.project, workTypeId: entry.workType, projectName: entry.projectNameSnapshot, projectCode: entry.projectCodeSnapshot,
  workTypeName: entry.workTypeNameSnapshot, workTypeCode: entry.workTypeCodeSnapshot, startDate: entry.startDate, startTime: entry.startTime, endDate: entry.endDate, endTime: entry.endTime, notes: entry.notes }));
const timeLabel = (value: string | null | undefined, timezone: string | null) => value && timezone ? new Intl.DateTimeFormat("en-GB", { timeZone: timezone, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value)) : "Not recorded";

function TimesheetHistory({ date, timezone, onBack }: { date: string; timezone: string | null; onBack: () => void }) {
  const [page, setPage] = useState(1), [pages, setPages] = useState(1), [total, setTotal] = useState(0);
  const [rows, setRows] = useState<TimesheetRevision[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setRows([]);
    getTimesheetHistory(date, page, controller.signal).then((result) => {
      if (!controller.signal.aborted) { setRows(result.data); setPages(result.pagination.totalPages); setTotal(result.pagination.total); }
    }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Could not load timesheet history")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, page, retry]);
  return <Stack spacing={4}>
    <Button variant="outline" alignSelf="start" size="sm" onClick={onBack}>Back to timesheet</Button>
    <Text fontSize="lg" fontWeight="700">Timesheet history</Text>
    {error ? <Alert status="error"><AlertIcon />{error}<Button ml="auto" size="sm" onClick={() => setRetry((r) => r + 1)}>Retry</Button></Alert> : loading ? <Skeleton h="160px" /> : !rows.length ? <Text color="gray.500">No saved revisions yet.</Text> : rows.map((revision) => <Box key={revision._id} py={4} borderBottomWidth="1px">
      <Flex justify="space-between" gap={3} wrap="wrap"><Text fontWeight="700">Revision {revision.revision}</Text><Badge>{revision.snapshot.status}</Badge></Flex>
      <Text mt={1} fontSize="sm" color="gray.500">{(revision.action || "draft_saved").replace(/_/g, " ")} | {timeLabel(revision.createdAt, timezone)} | {formatMinutes(revision.snapshot.loggedMinutes)} logged</Text>
      <Stack mt={3} spacing={3}>{revision.snapshot.entries.map((entry) => <Box key={entry.entryId}>
        <Text fontSize="sm" fontWeight="600">{entry.projectNameSnapshot} / {entry.workTypeNameSnapshot}</Text>
        <Text fontSize="sm">{entry.startDate} {entry.startTime} - {entry.endDate} {entry.endTime} | {formatMinutes(entry.minutes)}</Text>
        {entry.notes ? <Text fontSize="sm" color="gray.500" overflowWrap="anywhere" whiteSpace="pre-wrap">{entry.notes}</Text> : null}
      </Box>)}</Stack>
    </Box>)}
    <Flex justify="space-between" align="center" gap={2}><Text fontSize="sm">{total} saved revisions</Text><HStack><Button size="sm" isDisabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button><Text fontSize="sm">{page}/{pages}</Text><Button size="sm" isDisabled={loading || page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button></HStack></Flex>
  </Stack>;
}

export default function TimesheetDayPanel({ date, editing, onEdit, onSaved, onDirtyChange, onSavingChange }: {
  date: string; editing: boolean; onEdit: () => void; onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void; onSavingChange: (saving: boolean) => void;
}) {
  const [day, setDay] = useState<TimesheetDay | null>(null), [rows, setRows] = useState<EntryRow[]>([]);
  const [baseline, setBaseline] = useState("[]"), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [error, setError] = useState(""), [conflict, setConflict] = useState(false), [history, setHistory] = useState(false);
  const [refresh, setRefresh] = useState(0), [reloadConfirm, setReloadConfirm] = useState(false);
  const [submitConfirm, setSubmitConfirm] = useState(false), [submissionDetails, setSubmissionDetails] = useState(false);
  const pendingSubmission = useRef<{ signature: string; payload: TimesheetActionPayload } | null>(null);
  const pendingSave = useRef<{ signature: string; payload: DraftPayload } | null>(null);
  const inFlight = useRef(false), serverOffset = useRef(0), mounted = useRef(true);
  const toast = useToast();
  const border = useColorModeValue("gray.200", "gray.700"), muted = useColorModeValue("gray.600", "gray.400");
  const surface = useColorModeValue("white", "gray.800");
  const signature = JSON.stringify(payloadEntries(rows)), dirty = signature !== baseline;
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => { onSavingChange(saving); }, [saving, onSavingChange]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; onDirtyChange(false); onSavingChange(false); }; }, [onDirtyChange, onSavingChange]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", handler); return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setDay(null); setRows([]); setBaseline("[]"); setHistory(false); setConflict(false); pendingSave.current = null;
    getTimesheetDay(date, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      serverOffset.current = Date.parse(result.serverNow) - Date.now();
      const next = fromDocument(result.timesheet); setDay(result); setRows(next); setBaseline(JSON.stringify(payloadEntries(next)));
    }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Could not load timesheet")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, refresh]);
  const reload = () => { if (dirty) setReloadConfirm(true); else setRefresh((r) => r + 1); };
  const canEdit = Boolean(day?.eligibility.canSave && (!day.timesheet || ["draft", "returned", "rejected"].includes(day.timesheet.status)));
  async function submit() {
    if (!day?.timesheet || !day.eligibility.canSubmit || dirty || inFlight.current) return;
    const signature = String(day.timesheet.revision);
    if (pendingSubmission.current?.signature !== signature) pendingSubmission.current = { signature, payload: { revision: day.timesheet.revision, requestId: key(), acknowledgeShortfall: true } };
    inFlight.current = true; setSaving(true); setError(""); setSubmitConfirm(false);
    try {
      const saved = await submitTimesheetDay(date, pendingSubmission.current.payload);
      if (!mounted.current) return;
      pendingSubmission.current = null; onSaved(); setRefresh((r) => r + 1);
      toast({ title: saved.status === "approved" ? "Timesheet auto-approved" : "Timesheet submitted for approval", status: "success" });
    } catch (err: any) { if (mounted.current) { setError(getApiErrorMessage(err?.response?.data || err, "Could not submit. Retry safely with the same request.")); setConflict(err?.response?.status === 409); } }
    finally { inFlight.current = false; if (mounted.current) setSaving(false); }
  }
  const update = (rowKey: string, changes: Partial<EntryRow>) => setRows((current) => current.map((row) => row.key === rowKey ? { ...row, ...changes } : row));
  const add = () => {
    if (!day) return;
    const last = rows[rows.length - 1], firstIn = day.context.attendance?.punchSessions.find((session) => session.punchIn)?.punchIn;
    let startDate = last?.endDate || date, startTime = last?.endTime || "";
    if (!last && firstIn && day.context.timezone) {
      const parts = new Intl.DateTimeFormat("en-CA", { timeZone: day.context.timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(firstIn));
      const part = (type: string) => parts.find((p) => p.type === type)!.value;
      startDate = `${part("year")}-${part("month")}-${part("day")}`; startTime = `${part("hour")}:${part("minute")}`;
    }
    setRows((current) => [...current, { key: key(), projectId: "", workTypeId: "", projectName: "", projectCode: "", workTypeName: "", workTypeCode: "", startDate, startTime, endDate: startDate, endTime: "", notes: "" }]);
  };
  async function save() {
    if (!day || !canEdit || inFlight.current) return;
    const entries = payloadEntries(rows), validation = validateDraft(entries, day, Date.now() + serverOffset.current);
    if (validation) { setError(validation); return; }
    const requestSignature = JSON.stringify({ revision: day.timesheet?.revision || 0, entries });
    if (pendingSave.current?.signature !== requestSignature) pendingSave.current = { signature: requestSignature, payload: { revision: day.timesheet?.revision || 0, requestId: key(), entries } };
    inFlight.current = true; setSaving(true); setError(""); setConflict(false);
    try {
      const saved = await saveTimesheetDay(date, pendingSave.current.payload);
      if (!mounted.current) return;
      const next = fromDocument(saved); setRows(next); setBaseline(JSON.stringify(payloadEntries(next))); pendingSave.current = null;
      setDay((current) => current ? { ...current, timesheet: saved, loggedMinutes: saved.loggedMinutes } : current);
      onSaved(); toast({ title: "Timesheet draft saved", status: "success", duration: 2500 });
      try {
        const fresh = await getTimesheetDay(date);
        if (mounted.current) {
          setDay(fresh); serverOffset.current = Date.parse(fresh.serverNow) - Date.now();
          const currentRows = fromDocument(fresh.timesheet); setRows(currentRows); setBaseline(JSON.stringify(payloadEntries(currentRows)));
        }
      } catch { if (mounted.current) setError("Draft saved, but its latest attendance context could not be refreshed. Reload before your next edit."); }
    } catch (err: any) {
      if (mounted.current) { setError(getApiErrorMessage(err?.response?.data || err, "Could not save draft. Retry to safely resend the same request.")); setConflict(err?.response?.status === 409); }
    } finally { inFlight.current = false; if (mounted.current) setSaving(false); }
  }
  if (loading) return <Stack aria-label="Loading timesheet"><Skeleton h="100px" /><Skeleton h={editing ? "200px" : "45px"} /></Stack>;
  if (!day) return <Alert status="error"><AlertIcon />{error || "Timesheet could not be loaded."}<Button ml="auto" size="sm" onClick={reload}>Retry</Button></Alert>;
  const timezone = day.context.timezone, logged = editing ? rows.reduce((sum, row) => sum + (entryDuration(row, timezone) || 0), 0) : day.loggedMinutes;
  const shortfall = day.requiredMinutes == null ? null : Math.max(0, day.requiredMinutes - logged);
  const issues = [...day.eligibility.setupIssues, ...day.eligibility.saveIssues];
  const overnight = Boolean(day.context.schedule.startTime && day.context.schedule.endTime && day.context.schedule.endTime <= day.context.schedule.startTime);
  if (editing && history) return <TimesheetHistory date={date} timezone={timezone} onBack={() => setHistory(false)} />;
  return <Stack spacing={4} as={editing ? "form" : "section"} onSubmit={editing ? (event) => { event.preventDefault(); void save(); } : undefined}>
    <Flex justify="space-between" align="center" gap={2} wrap="wrap"><HStack><Text fontWeight="700" fontSize="lg">Timesheet</Text><Badge colorScheme="blue">{day.timesheet?.status || (day.eligibility.required ? "Required" : "Not required")}</Badge>{dirty ? <Badge colorScheme="yellow">Unsaved</Badge> : null}</HStack>
      {editing ? <HStack flexWrap="wrap"><Button type="button" size="sm" variant="outline" isDisabled={saving} onClick={reload}>Reload</Button><Button type="button" size="sm" variant="outline" leftIcon={<FiClock />} isDisabled={saving || !day.timesheet} onClick={() => setHistory(true)}>History</Button>{day.timesheet?.currentSubmission ? <Button type="button" size="sm" variant="outline" isDisabled={saving || dirty} onClick={() => setSubmissionDetails(true)}>Submission details</Button> : null}</HStack> : <Button size="sm" onClick={onEdit}>{day.timesheet ? "View / edit timesheet" : "Fill timesheet"}</Button>}
    </Flex>
    <SimpleGrid columns={3} spacing={3}><Box minW={0}><Text fontSize="xs" color={muted}>Required</Text><Text fontWeight="700" data-testid="timesheet-required">{formatMinutes(day.requiredMinutes)}</Text></Box><Box minW={0}><Text fontSize="xs" color={muted}>Logged</Text><Text fontWeight="700" data-testid="timesheet-logged">{formatMinutes(logged)}</Text></Box><Box minW={0}><Text fontSize="xs" color={muted}>Shortfall</Text><Text fontWeight="700" color={shortfall ? "orange.600" : undefined} data-testid="timesheet-shortfall">{formatMinutes(shortfall)}</Text></Box></SimpleGrid>
    <Text fontSize="sm" color={muted}>{requirementReason(day)}</Text>
    <TimesheetControlsPanel date={date} timezone={timezone} />
    <TimesheetContextHistory date={date} />
    {editing ? <>
      <Box py={3} borderTopWidth="1px" borderBottomWidth="1px" borderColor={border}>
        <Text fontSize="sm">Shift: {day.context.schedule.startTime || "Not configured"} - {day.context.schedule.endTime || "--:--"}{overnight ? " (next day)" : ""}{timezone ? ` | ${timezone}` : ""}</Text>
        <Text mt={1} fontSize="sm">Punches: {day.context.attendance?.punchSessions.length ? day.context.attendance.punchSessions.map((session) => `${timeLabel(session.punchIn, timezone)} - ${timeLabel(session.punchOut, timezone)}`).join("; ") : "Not recorded"}</Text>
        {day.eligibility.deadlineAt ? <Text mt={1} fontSize="xs" color={muted}>Due {timeLabel(day.eligibility.deadlineAt, timezone)} | Editable through {day.eligibility.editableUntilAt ? timeLabel(day.eligibility.editableUntilAt, timezone) : day.eligibility.editableUntilDate}</Text> : null}
        {day.eligibility.payrollCycle ? <Text mt={1} fontSize="xs" color={muted}>Payroll cycle: {day.eligibility.payrollCycle.startDate} to {day.eligibility.payrollCycle.endDate} | Submission cutoff: {timeLabel(day.eligibility.payrollCycle.submissionAt, timezone)} | Approval due: {timeLabel(day.eligibility.payrollCycle.approvalAt, timezone)}</Text> : null}
      </Box>
      {issues.length ? <Alert status="warning" alignItems="start"><AlertIcon /><Stack spacing={1}>{issues.map((issue) => <Text key={issue.code} fontSize="sm">{issue.message}</Text>)}</Stack></Alert> : null}
      {day.eligibility.submissionIssues.length ? <Alert status="info"><AlertIcon /><AlertDescription fontSize="sm">{day.eligibility.submissionIssues.map((issue) => issue.message).join(". ")}</AlertDescription></Alert> : null}
      {day.contextChanged ? <Alert status="info"><AlertIcon /><AlertDescription fontSize="sm">Attendance, leave, or policy context has changed since this draft was saved. Saving revalidates the entries.</AlertDescription></Alert> : null}
      {error ? <Alert status="error" alignItems="start"><AlertIcon /><Box minW={0}><Text fontSize="sm" overflowWrap="anywhere">{error}</Text>{conflict ? <Button type="button" size="sm" mt={2} onClick={reload}>Reload current draft</Button> : null}</Box></Alert> : null}
      {rows.map((row, index) => {
        const id = `timesheet-${row.key}`;
        return <Box key={row.key} borderWidth="1px" borderColor={border} borderRadius="md" p={4} minW={0}>
          <Flex justify="space-between" align="center" mb={3}><Text fontWeight="600">Entry {index + 1}</Text><HStack><Text fontSize="sm" fontWeight="600">{formatMinutes(entryDuration(row, timezone))}</Text><Tooltip label="Remove entry"><IconButton type="button" size="sm" variant="ghost" aria-label={`Remove entry ${index + 1}`} icon={<FiTrash2 />} isDisabled={!canEdit || saving} onClick={() => setRows((current) => current.filter((entry) => entry.key !== row.key))} /></Tooltip></HStack></Flex>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired><FormLabel htmlFor={`${id}-project`}>Project</FormLabel><TimesheetChoiceSelect id={`${id}-project`} label={`Project, entry ${index + 1}`} date={date} kind="projects" disabled={!canEdit || saving} value={row.projectId ? { value: row.projectId, label: `${row.projectName} (${row.projectCode})`, name: row.projectName, code: row.projectCode } : null} onChange={(choice) => update(row.key, { projectId: choice?.value || "", projectName: choice?.name || "", projectCode: choice?.code || "", workTypeId: "", workTypeName: "", workTypeCode: "" })} /></FormControl>
            <FormControl isRequired><FormLabel htmlFor={`${id}-work-type`}>Work type</FormLabel><TimesheetChoiceSelect id={`${id}-work-type`} label={`Work type, entry ${index + 1}`} date={date} kind="work-types" projectId={row.projectId} disabled={!canEdit || saving} value={row.workTypeId ? { value: row.workTypeId, label: `${row.workTypeName} (${row.workTypeCode})`, name: row.workTypeName, code: row.workTypeCode } : null} onChange={(choice) => update(row.key, { workTypeId: choice?.value || "", workTypeName: choice?.name || "", workTypeCode: choice?.code || "" })} /></FormControl>
            {(["start", "end"] as const).map((part) => <Box key={part} minW={0}><SimpleGrid columns={overnight ? 2 : 1} spacing={2}>
              {overnight ? <FormControl isRequired><FormLabel htmlFor={`${id}-${part}-date`}>{part === "start" ? "Start date" : "End date"}</FormLabel><Input id={`${id}-${part}-date`} aria-label={`${part === "start" ? "Start" : "End"} date, entry ${index + 1}`} type="date" min={date} max={nextTimesheetDate(date)} value={row[`${part}Date`]} isDisabled={!canEdit || saving} onChange={(e) => update(row.key, { [`${part}Date`]: e.target.value })} /></FormControl> : null}
              <FormControl isRequired><FormLabel htmlFor={`${id}-${part}-time`}>{part === "start" ? "Start time" : "End time"}</FormLabel><Input id={`${id}-${part}-time`} aria-label={`${part === "start" ? "Start" : "End"} time, entry ${index + 1}`} type="time" step={60} value={row[`${part}Time`]} isDisabled={!canEdit || saving} onChange={(e) => update(row.key, { [`${part}Time`]: e.target.value })} /></FormControl>
            </SimpleGrid></Box>)}
          </SimpleGrid>
          <FormControl mt={4} isRequired={day.context.rules?.notesRequired}><FormLabel htmlFor={`${id}-notes`}>Notes{day.context.rules?.notesRequired ? "" : " (optional)"}</FormLabel><Textarea id={`${id}-notes`} aria-label={`Notes, entry ${index + 1}`} value={row.notes} maxLength={2000} rows={2} isDisabled={!canEdit || saving} onChange={(e) => update(row.key, { notes: e.target.value })} />{day.context.rules?.notesRequired ? <FormHelperText>At least {day.context.rules.minimumNotesLength} characters.</FormHelperText> : null}</FormControl>
        </Box>;
      })}
      {!rows.length ? <Text py={5} color={muted}>No work entries for this day.</Text> : null}
      {canEdit ? <Flex justify="space-between" gap={3} wrap="wrap" position="sticky" bottom={0} bg={surface} py={3} borderTopWidth="1px" borderColor={border} zIndex={1}>
        {canEdit ? <Button type="button" variant="outline" leftIcon={<FiPlus />} isDisabled={saving || rows.length >= (day.context.rules?.maximumDailyEntries || 0)} onClick={add}>Add entry</Button> : <Text fontSize="sm" color={muted}>This day is read-only.</Text>}
        <HStack flexWrap="wrap"><Button type="submit" colorScheme="blue" variant="outline" isLoading={saving} isDisabled={!canEdit || !dirty}>Save draft</Button>{canEdit ? <Tooltip label={dirty ? "Save your changes before submitting" : !day.eligibility.canSubmit ? "Resolve attendance or setup issues before submitting" : "Submit the entire day for approval"}><Button type="button" colorScheme="blue" isDisabled={saving || dirty || !day.eligibility.canSubmit} onClick={() => setSubmitConfirm(true)}>Submit day</Button></Tooltip> : null}</HStack>
      </Flex> : <Text fontSize="sm" color={muted}>This day is read-only.</Text>}
    </> : null}
    <ConfirmationModal isOpen={reloadConfirm} onClose={() => setReloadConfirm(false)} onConfirm={() => { setReloadConfirm(false); setRefresh((r) => r + 1); }} title="Discard unsaved changes?" description="Reloading replaces your changes with the latest saved draft." confirmText="Discard and reload" cancelText="Keep editing" tone="danger" />
    <ConfirmationModal isOpen={submitConfirm} onClose={() => setSubmitConfirm(false)} onConfirm={submit} title="Submit this timesheet?" description={`${formatMinutes(logged)} logged against ${formatMinutes(day.requiredMinutes)} required.${shortfall ? ` This day is ${formatMinutes(shortfall)} short.` : ""} Entries become read-only while approval is pending. ${day.context.rules?.payrollMode === "shortfall" ? "Approved shortfalls may add loss of pay when HR locks this payroll cycle." : day.context.rules?.payrollMode === "block" ? "This policy blocks payroll until required work is approved or HR-exempt." : "This policy is report-only and does not deduct salary."}`} confirmText="Submit for approval" cancelText="Keep draft" tone={shortfall ? "warning" : "primary"} />
    {submissionDetails && day.timesheet?.currentSubmission ? <TimesheetReviewDrawer submissionId={day.timesheet.currentSubmission} onClose={() => setSubmissionDetails(false)} onChanged={() => { setSubmissionDetails(false); setRefresh((r) => r + 1); onSaved(); }} /> : null}
  </Stack>;
}
