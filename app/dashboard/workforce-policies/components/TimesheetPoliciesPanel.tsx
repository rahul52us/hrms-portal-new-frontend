"use client";

import axios from "axios";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { approvalWorkflowSupportsRequestType, PolicyVersion, TimesheetRules, WorkforcePolicyItem, workforcePolicyStore } from "@/app/store/workforcePolicyStore/workforcePolicyStore";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, Flex, FormControl, FormHelperText, FormLabel, Input, Select, SimpleGrid, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Textarea, Th, Thead, Tr, useColorModeValue } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import PolicyHistoryDrawer from "./PolicyHistoryDrawer";
import PolicyCoveragePanel from "./PolicyCoveragePanel";
import TimesheetImpactPreview from "./TimesheetImpactPreview";

const base = "/workforce-policies/timesheet-policies";
const defaults: TimesheetRules = { required: true, deadlineDaysAfterShift: 1, deadlineTime: "23:59", maxBackdateDays: 31,
  remindersEnabled: true, remindBeforeHours: 24, reminderEveryDays: 1, approverEscalationDays: 2,
  deadlineMode: "after_shift", payrollCutoffEnabled: false, payrollSubmissionDaysAfterCycleEnd: 1, payrollSubmissionTime: "10:00", payrollApprovalDaysAfterCycleEnd: 1, payrollApprovalTime: "14:00",
  minimumEntryMinutes: 1, maximumDailyEntries: 50, notesRequired: true,
  minimumNotesLength: 5, allowExtraHours: false, maximumExtraMinutes: 0, payrollMode: "report_only", approvalWorkflowId: null };
type RuleForm = { [K in keyof TimesheetRules]: TimesheetRules[K] extends number ? string : TimesheetRules[K] };
const formRules = (rules: TimesheetRules) => Object.fromEntries(Object.entries(rules).filter(([key]) => key in defaults).map(([key, value]) => [key, typeof value === "number" ? String(value) : value])) as RuleForm;
const message = (error: any) => error?.response?.data?.message || error?.message || "Unable to save timesheet policy";

function PolicyEditor({ companyId, selection, onClose, onSaved }: {
  companyId: string; selection: { policy: WorkforcePolicyItem | null; mode: "create" | "edit" | "version" };
  onClose: () => void; onSaved: () => Promise<void>;
}) {
  const { policy, mode } = selection;
  const source = mode === "edit" ? policy?.draftVersion : policy?.latestPublishedVersion;
  const [name, setName] = useState(policy?.name || "");
  const [code, setCode] = useState(policy?.code || "");
  const [codeEdited, setCodeEdited] = useState(false);
  const [date, setDate] = useState(mode === "edit" ? source?.effectiveFrom?.slice(0, 10) || "" : "");
  const [reason, setReason] = useState(mode === "edit" ? source?.changeReason || "" : mode === "create" ? "Initial timesheet policy" : "");
  const [rules, setRules] = useState<RuleForm>(formRules({ ...defaults, ...(source?.rules as TimesheetRules || {}) }));
  const [savedDraft, setSavedDraft] = useState<{ policyId: string; version: PolicyVersion } | null>(mode === "edit" && source && policy ? { policyId: policy._id, version: source } : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const setRule = <K extends keyof RuleForm>(key: K, value: RuleForm[K]) => setRules((current) => ({ ...current, [key]: value }));
  async function save(publish: boolean) {
    setError(""); setBusy(true);
    try {
      const parsed: any = { ...rules };
      for (const [key, value] of Object.entries(defaults)) {
        if (typeof value === "number") {
          if (String(rules[key as keyof RuleForm]).trim() === "") {
            const hidden = rules.deadlineMode === "payroll_cycle" && ["deadlineDaysAfterShift", "maxBackdateDays"].includes(key) || !rules.payrollCutoffEnabled && ["payrollSubmissionDaysAfterCycleEnd", "payrollApprovalDaysAfterCycleEnd"].includes(key);
            if (hidden) { parsed[key] = value; continue; }
            throw new Error("Complete all numeric limits; enter 0 only where it is allowed.");
          }
          parsed[key] = Number(rules[key as keyof RuleForm]);
        }
      }
      const payload = { companyId, name, code, effectiveFrom: date, changeReason: reason, rules: parsed };
      let draft = savedDraft;
      if (draft) {
        const response = await axios.put(`${base}/${draft.policyId}/versions/${draft.version._id}`, { ...payload, revision: draft.version.revision });
        draft = { ...draft, version: response.data.data };
      } else if (mode === "create") {
        const response = await axios.post(base, payload);
        draft = { policyId: response.data.data.policy._id, version: response.data.data.version };
      } else {
        const response = await axios.post(`${base}/${policy!._id}/versions`, payload);
        draft = { policyId: policy!._id, version: response.data.data };
      }
      setSavedDraft(draft);
      if (publish) await axios.post(`${base}/${draft.policyId}/versions/${draft.version._id}/publish`, { companyId, revision: draft.version.revision });
      await onSaved(); onClose();
    } catch (err) { setError(message(err)); } finally { setBusy(false); }
  }
  async function cancelDraft() {
    if (!savedDraft) return;
    setError(""); setBusy(true);
    try {
      await axios.post(`${base}/${savedDraft.policyId}/versions/${savedDraft.version._id}/cancel`, { companyId, revision: savedDraft.version.revision, reason });
      await onSaved(); onClose();
    } catch (err) { setError(message(err)); } finally { setBusy(false); }
  }
  const numberField = (key: keyof RuleForm, label: string, min: number, max: number, help?: string) => (
    <FormControl id={`timesheet-${key}`} isRequired>
      <FormLabel>{label}</FormLabel><Input aria-label={label} type="number" min={min} max={max} step={1} value={String(rules[key])} onChange={(e) => setRule(key, e.target.value as never)} />
      {help ? <FormHelperText>{help}</FormHelperText> : null}
    </FormControl>
  );
  return <DashboardDrawer isOpen onClose={() => { if (!busy) onClose(); }} titlePrefix={mode === "create" ? "New" : mode === "version" ? "New version of" : "Edit draft of"}
    titleSuffix={policy?.name || "timesheet policy"} maxW={{ base: "100%", md: "760px" }}
    footerContent={<Flex gap={2} wrap="wrap" justify="flex-end" w="full">
      {savedDraft ? <Button colorScheme="red" variant="ghost" onClick={cancelDraft} isDisabled={busy || reason.trim().length < 3}>Cancel draft</Button> : null}
      <Button variant="outline" onClick={() => save(false)} isDisabled={busy}>Save draft</Button>
      <Button colorScheme="blue" onClick={() => save(true)} isLoading={busy}>Save and publish</Button>
    </Flex>}>
    <Stack spacing={6}>
      {error ? <Alert status="error"><AlertIcon />{error}</Alert> : null}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl id="timesheet-policy-name" isRequired><FormLabel>Policy name</FormLabel><Input value={name} isDisabled={mode !== "create" || Boolean(savedDraft)} onChange={(e) => { setName(e.target.value); if (!codeEdited) setCode(e.target.value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").slice(0, 30)); }} /></FormControl>
        <FormControl id="timesheet-policy-code" isRequired><FormLabel>Code</FormLabel><Input value={code} isDisabled={mode !== "create" || Boolean(savedDraft)} onChange={(e) => { setCodeEdited(true); setCode(e.target.value.toUpperCase()); }} /></FormControl>
        <FormControl id="timesheet-policy-effective" isRequired><FormLabel>Effective from</FormLabel><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormControl>
        <FormControl id="timesheet-policy-required"><FormLabel>Working-day requirement</FormLabel><Select value={rules.required ? "required" : "optional"} onChange={(e) => setRule("required", e.target.value === "required")}><option value="required">Required</option><option value="optional">Optional</option></Select></FormControl>
      </SimpleGrid>
      <Box><Text fontWeight="700" mb={3}>Deadlines and editing</Text><SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl id="timesheet-deadline-mode"><FormLabel>Submission deadline</FormLabel><Select aria-label="Submission deadline" value={rules.deadlineMode} onChange={(e) => setRules((r) => ({ ...r, deadlineMode: e.target.value as TimesheetRules["deadlineMode"], payrollCutoffEnabled: e.target.value === "payroll_cycle" || r.payrollCutoffEnabled }))}><option value="after_shift">After each shift</option><option value="payroll_cycle">Payroll-cycle cutoff</option></Select>{rules.payrollCutoffEnabled ? <FormHelperText>Uses the company's attendance-cycle end date, not payroll draft creation.</FormHelperText> : null}</FormControl>
        {rules.deadlineMode === "after_shift" ? <>
          {numberField("deadlineDaysAfterShift", "Submit within (days after shift)", 0, 31, "0 means the date the shift ends.")}
          <FormControl id="timesheet-deadline-time" isRequired><FormLabel>Deadline time</FormLabel><Input aria-label="Deadline time" type="time" value={rules.deadlineTime} onChange={(e) => setRule("deadlineTime", e.target.value)} /><FormHelperText>Uses the employee's shift timezone.</FormHelperText></FormControl>
          {numberField("maxBackdateDays", "Backdated edit window (days)", 0, 366)}
        </> : null}
      </SimpleGrid>
        {rules.deadlineMode === "after_shift" ? <Checkbox id="timesheet-payroll-cutoff-enabled" mt={4} isChecked={rules.payrollCutoffEnabled} onChange={(e) => setRule("payrollCutoffEnabled", e.target.checked)}>Also close submissions at the payroll-cycle cutoff</Checkbox> : null}
        {rules.payrollCutoffEnabled ? <SimpleGrid mt={4} columns={{ base: 1, md: 2 }} spacing={4}>
          {numberField("payrollSubmissionDaysAfterCycleEnd", "Employee cutoff: days after cycle end", 0, 31, "0 = cycle end date; 1 = the next date.")}
          <FormControl id="timesheet-payroll-submission-time" isRequired><FormLabel>Employee cutoff time</FormLabel><Input aria-label="Employee cutoff time" type="time" value={rules.payrollSubmissionTime} onChange={(e) => setRule("payrollSubmissionTime", e.target.value)} /></FormControl>
          {numberField("payrollApprovalDaysAfterCycleEnd", "Approval due: days after cycle end", 0, 31)}
          <FormControl id="timesheet-payroll-approval-time" isRequired><FormLabel>Approval deadline time</FormLabel><Input aria-label="Approval deadline time" type="time" value={rules.payrollApprovalTime} onChange={(e) => setRule("payrollApprovalTime", e.target.value)} /><FormHelperText>Uses each employee's shift timezone.</FormHelperText></FormControl>
        </SimpleGrid> : null}
      </Box>
      <Box><Text fontWeight="700" mb={3}>Work entries</Text><SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {numberField("minimumEntryMinutes", "Minimum entry duration (minutes)", 1, 480)}
        {numberField("maximumDailyEntries", "Maximum entries per day", 1, 100)}
        <FormControl id="timesheet-notes-required"><FormLabel>Entry notes</FormLabel><Select value={rules.notesRequired ? "required" : "optional"} onChange={(e) => setRules((r) => ({ ...r, notesRequired: e.target.value === "required", minimumNotesLength: e.target.value === "required" ? "5" : "0" }))}><option value="required">Required</option><option value="optional">Optional</option></Select></FormControl>
        {rules.notesRequired ? numberField("minimumNotesLength", "Minimum notes length (characters)", 0, 500) : null}
      </SimpleGrid></Box>
      <Checkbox id="timesheet-extra-hours" isChecked={rules.allowExtraHours} onChange={(e) => setRules((r) => ({ ...r, allowExtraHours: e.target.checked, maximumExtraMinutes: e.target.checked ? "120" : "0" }))}>Allow logging beyond required hours</Checkbox>
      {rules.allowExtraHours ? numberField("maximumExtraMinutes", "Maximum extra minutes per day", 1, 720, "This does not approve overtime or award comp-off.") : null}
      <FormControl id="timesheet-approval-flow"><FormLabel>Approval flow</FormLabel><Select value={rules.approvalWorkflowId || ""} onChange={(e) => setRule("approvalWorkflowId", e.target.value || null)}><option value="">Reporting manager</option>{workforcePolicyStore.approvalWorkflows.filter((workflow) => approvalWorkflowSupportsRequestType(workflow, "timesheet_submission")).map((workflow) => <option key={workflow._id} value={workflow._id}>{workflow.name}</option>)}</Select><FormHelperText>Choose a published Daily timesheets workflow for multiple levels. Existing submissions retain their resolved approvers.</FormHelperText></FormControl>
      <Checkbox id="timesheet-reminders-enabled" isChecked={rules.remindersEnabled} onChange={(e) => setRule("remindersEnabled", e.target.checked)}>Send timesheet reminders</Checkbox>
      {rules.remindersEnabled ? <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>{numberField("remindBeforeHours", "Remind before due (hours)", 0, 168)}{numberField("reminderEveryDays", "Repeat reminders every (days)", 1, 7)}{numberField("approverEscalationDays", "Approval follow-up after (days)", 1, 31, "Used when there is no payroll-cycle approval deadline.")}</SimpleGrid> : null}
      <FormControl id="timesheet-payroll-mode"><FormLabel>Payroll treatment</FormLabel><Select value={rules.payrollMode} onChange={(e) => setRule("payrollMode", e.target.value as TimesheetRules["payrollMode"])}><option value="report_only">Report only</option><option value="block">Block payroll until resolved</option><option value="shortfall">Additional loss of pay for short hours</option></Select><FormHelperText>Salary impact requires an audited Timesheet payroll-cycle lock. Pending approvals block locking; attendance LOP is not charged twice.</FormHelperText></FormControl>
      <FormControl id="timesheet-policy-reason" isRequired><FormLabel>Change reason</FormLabel><Textarea value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} /></FormControl>
      <TimesheetImpactPreview companyId={companyId} policyId={policy?._id || savedDraft?.policyId} at={date} rules={Object.fromEntries(Object.entries(rules).map(([key, value]) => [key, typeof defaults[key as keyof TimesheetRules] === "number" ? Number(value) : value]))} scopeType={mode === "create" ? "company" : undefined} />
    </Stack>
  </DashboardDrawer>;
}

export default function TimesheetPoliciesPanel({ companyId, canManage, onAssignments, onChanged }: { companyId: string; canManage: boolean; onAssignments: () => void; onChanged: () => Promise<void> }) {
  const [items, setItems] = useState<WorkforcePolicyItem[]>([]);
  const [page, setPage] = useState(1), [search, setSearch] = useState("");
  const [pages, setPages] = useState(1), [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [coverage, setCoverage] = useState(false);
  const [selection, setSelection] = useState<{ policy: WorkforcePolicyItem | null; mode: "create" | "edit" | "version" } | null>(null);
  const [history, setHistory] = useState<WorkforcePolicyItem | null>(null);
  const requestSequence = useRef(0);
  const border = useColorModeValue("gray.200", "gray.700"), muted = useColorModeValue("gray.600", "gray.400");
  const load = useCallback(async () => {
    if (!companyId) return;
    const sequence = ++requestSequence.current;
    setLoading(true); setError("");
    try { const response = await axios.get(base, { params: { companyId, page, limit: 20, search } }); if (sequence === requestSequence.current) { setItems(response.data.data); setPages(response.data.pagination.totalPages); setTotal(response.data.pagination.total); } }
    catch (err) { if (sequence === requestSequence.current) setError(message(err)); } finally { if (sequence === requestSequence.current) setLoading(false); }
  }, [companyId, page, search]);
  useEffect(() => { void load(); }, [load]);
  const saved = async () => { await load(); await onChanged(); };
  return <Stack spacing={4}>
    <Flex gap={2} wrap="wrap" justify="space-between">
      <Input aria-label="Search timesheet policies" maxW="280px" value={search} placeholder="Search timesheet policies" onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      <Flex gap={2} wrap="wrap"><Button variant="outline" onClick={() => setCoverage((v) => !v)}>{coverage ? "Policy list" : "View coverage"}</Button><Button variant="outline" onClick={onAssignments}>Assignments</Button>{canManage ? <Button colorScheme="blue" onClick={() => setSelection({ policy: null, mode: "create" })}>New timesheet policy</Button> : null}</Flex>
    </Flex>
    {error ? <Alert status="error"><AlertIcon />{error}<Button ml="auto" size="sm" onClick={load}>Retry</Button></Alert> : null}
    {coverage ? <PolicyCoveragePanel companyId={companyId} borderColor={border} muted={muted} onManageAssignments={onAssignments} timesheetOnly /> : loading ? <Skeleton h="100px" /> : !items.length ? <Text py={8} color={muted}>No timesheet policies found.</Text> : <>
      <TableContainer><Table size="sm"><Thead><Tr><Th>Policy</Th><Th>Published</Th><Th>Draft</Th><Th>Status</Th><Th>Actions</Th></Tr></Thead><Tbody>
        {items.map((policy) => <Tr key={policy._id}><Td><Text fontWeight="600">{policy.name}</Text><Text fontSize="xs" color={muted}>{policy.code}</Text></Td><Td>{policy.latestPublishedVersion ? `v${policy.latestPublishedVersion.versionNumber} from ${policy.latestPublishedVersion.effectiveFrom?.slice(0, 10)}` : "Not published"}</Td><Td>{policy.draftVersion ? `v${policy.draftVersion.versionNumber}` : "None"}</Td><Td><Badge>{policy.status}</Badge></Td><Td><Flex gap={2}>
          <Button size="xs" variant="outline" onClick={() => { setHistory(policy); void workforcePolicyStore.fetchResourceDetail("timesheet_policy", policy._id, companyId).catch(() => undefined); }}>History</Button>
          {canManage && policy.status === "active" ? <Button size="xs" onClick={() => setSelection({ policy, mode: policy.draftVersion ? "edit" : "version" })}>{policy.draftVersion ? "Edit draft" : "New version"}</Button> : null}
        </Flex></Td></Tr>)}
      </Tbody></Table></TableContainer>
      <Flex justify="space-between" align="center"><Text fontSize="sm">{total} policies</Text><Flex gap={2} align="center"><Button size="sm" isDisabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button><Text fontSize="sm">{page}/{pages}</Text><Button size="sm" isDisabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button></Flex></Flex>
    </>}
    {selection ? <PolicyEditor companyId={companyId} selection={selection} onClose={() => setSelection(null)} onSaved={saved} /> : null}
    <PolicyHistoryDrawer isOpen={Boolean(history)} onClose={() => setHistory(null)} resourceType="timesheet_policy" resource={history} />
  </Stack>;
}
