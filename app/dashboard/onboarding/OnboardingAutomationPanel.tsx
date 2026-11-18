"use client";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, FormControl, FormHelperText, FormLabel, Heading, HStack, IconButton, Input, SimpleGrid, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Textarea, Th, Thead, Tr, useToast } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPlay, FiRefreshCw } from "react-icons/fi";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { emptyPage, onboardingGet, onboardingSave, Page } from "./onboardingApi";

type Settings = { revision: number; enabled: boolean; remindBeforeHours: number; reminderEveryDays: number; escalateAfterDays: number; escalationEveryDays: number; updatedAt: string | null };
type Job = { _id: string; status: string; active: boolean; source: string; createdAt: string; completedAt?: string; failures: number; error?: string; metrics: { checklists: number; tasks: number; notifications: number; escalations: number; ownerIssues: number; skipped: number } };
type Audit = { _id: string; actorName: string; reason: string; createdAt: string; after: Settings };
const numberFields = [
  { key: "remindBeforeHours", label: "Remind before deadline (hours)", min: 0, max: 168, hint: "0 = overdue reminders only." },
  { key: "reminderEveryDays", label: "Repeat owner/review reminders (days)", min: 1, max: 30 },
  { key: "escalateAfterDays", label: "Escalate after overdue days", min: 0, max: 30, hint: "0 = alert HR as soon as overdue." },
  { key: "escalationEveryDays", label: "Repeat HR alerts (days)", min: 1, max: 30 },
] as const;
const draftOf = (settings: Settings): Record<string, any> => ({ ...settings, ...Object.fromEntries(numberFields.map(({ key }) => [key, String(settings[key])])) });
const date = (value: string) => new Date(value).toLocaleString();
function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  return <HStack justify="end"><IconButton aria-label="Previous page" title="Previous page" size="sm" icon={<FiChevronLeft />} isDisabled={page <= 1} onClick={() => onChange(page - 1)} /><Text fontSize="sm">{page}/{pages}</Text><IconButton aria-label="Next page" title="Next page" size="sm" icon={<FiChevronRight />} isDisabled={page >= pages} onClick={() => onChange(page + 1)} /></HStack>;
}
export default function OnboardingAutomationPanel({ accountKey }: { accountKey: string }) {
  const toast = useToast();
  const [settings, setSettings] = useState<Settings | null>(null), [draft, setDraft] = useState<Record<string, any>>({});
  const [reason, setReason] = useState(""), [error, setError] = useState(""), [saving, setSaving] = useState(false), [running, setRunning] = useState(false), [retrying, setRetrying] = useState("");
  const [reload, setReload] = useState(0), [jobPage, setJobPage] = useState(1), [auditPage, setAuditPage] = useState(1), [jobReload, setJobReload] = useState(0), [auditReload, setAuditReload] = useState(0);
  const [jobs, setJobs] = useState<Page<Job>>({ data: [], pagination: emptyPage }), [audit, setAudit] = useState<Page<Audit>>({ data: [], pagination: emptyPage });
  const [jobsError, setJobsError] = useState(""), [auditError, setAuditError] = useState("");
  const [jobsLoading, setJobsLoading] = useState(true), [auditLoading, setAuditLoading] = useState(true);
  const attempt = useRef<{ signature: string; requestId: string } | null>(null), runAttempt = useRef<string | null>(null);
  useEffect(() => {
    const controller = new AbortController(); setSettings(null); setError(""); attempt.current = null; runAttempt.current = null;
    onboardingGet<{ data: Settings }>("/automation/settings", undefined, controller.signal).then(({ data }) => { if (!controller.signal.aborted) { setSettings(data); setDraft(draftOf(data)); setReason(""); } }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); });
    return () => controller.abort();
  }, [accountKey, reload]);
  const activeJobs = jobs.data.some((job) => job.active && (job.status !== "failed" || job.failures < 5));
  const dirty = Boolean(settings && (draft.enabled !== settings.enabled || numberFields.some(({ key }) => String(draft[key]) !== String(settings[key]))));
  useEffect(() => {
    const controller = new AbortController(); setJobsLoading(true);
    const load = () => { void onboardingGet<Page<Job>>("/automation/jobs", { page: jobPage, limit: 20 }, controller.signal).then((data) => { if (!controller.signal.aborted) { setJobs(data); setJobsError(""); } }).catch((err) => { if (!controller.signal.aborted) setJobsError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setJobsLoading(false); }); };
    load(); const timer = activeJobs ? setInterval(load, 10000) : null;
    return () => { controller.abort(); if (timer) clearInterval(timer); };
  }, [accountKey, jobPage, jobReload, activeJobs]);
  useEffect(() => {
    const controller = new AbortController(); setAuditLoading(true);
    onboardingGet<Page<Audit>>("/automation/audit", { page: auditPage, limit: 20 }, controller.signal).then((data) => { if (!controller.signal.aborted) { setAudit(data); setAuditError(""); } }).catch((err) => { if (!controller.signal.aborted) setAuditError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setAuditLoading(false); });
    return () => controller.abort();
  }, [accountKey, auditPage, auditReload]);
  const save = async () => {
    if (!settings) return;
    setError(""); setSaving(true);
    try {
      if (reason.trim().length < 3) throw new Error("Enter a change reason with at least 3 characters.");
      const values: Record<string, number | boolean> = { enabled: draft.enabled };
      for (const field of numberFields) {
        const value = Number(draft[field.key]);
        if (String(draft[field.key]).trim() === "" || !Number.isSafeInteger(value) || value < field.min || value > field.max) throw new Error(`${field.label}: enter ${field.min}-${field.max}.`);
        values[field.key] = value;
      }
      const body = { revision: settings.revision, settings: values, reason: reason.trim() }, signature = JSON.stringify(body);
      if (attempt.current?.signature !== signature) attempt.current = { signature, requestId: crypto.randomUUID() };
      const response = await onboardingSave<Settings>("/automation/settings", { ...body, requestId: attempt.current.requestId }, "put");
      setSettings(response.data); setDraft(draftOf(response.data)); setReason(""); attempt.current = null;
      setAuditPage(1); setAuditReload((n) => n + 1); toast({ title: "Reminder settings saved", status: "success" });
    } catch (err) { setError(getApiErrorMessage(err)); } finally { setSaving(false); }
  };
  const run = async () => {
    setRunning(true); setJobsError("");
    try {
      runAttempt.current ||= crypto.randomUUID();
      const response = await onboardingSave<Job>("/automation/jobs", { requestId: runAttempt.current });
      runAttempt.current = null; setJobPage(1); setJobReload((n) => n + 1);
      const status = response.data.status;
      toast({ title: status === "failed" ? "Existing reminder check needs retry" : status === "complete" ? "Reminder check already completed" : status === "running" ? "Reminder check is running" : "Reminder check queued", status: status === "failed" ? "warning" : "success" });
    } catch (err) { setJobsError(getApiErrorMessage(err)); } finally { setRunning(false); }
  };
  const retry = async (jobId: string) => {
    setRetrying(jobId); setJobsError("");
    try { await onboardingSave(`/automation/jobs/${jobId}/retry`, {}); setJobReload((n) => n + 1); }
    catch (err) { setJobsError(getApiErrorMessage(err)); } finally { setRetrying(""); }
  };
  return <Stack spacing={7} minW={0}>
    <Box><HStack justify="space-between" mb={4}><Heading size="sm">Reminders and escalation</Heading><Button size="sm" variant="outline" isDisabled={saving} onClick={() => setReload((n) => n + 1)}>Reload settings</Button></HStack>
      {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}
      {!settings ? !error && <Skeleton h="150px" /> : <Stack spacing={4}>
        <Checkbox isChecked={draft.enabled} isDisabled={saving} onChange={(event) => setDraft((previous) => ({ ...previous, enabled: event.target.checked }))}>Enable reminders and escalation</Checkbox>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>{numberFields.map((field) => <FormControl key={field.key} isRequired><FormLabel htmlFor={`onboarding-automation-${field.key}`}>{field.label}</FormLabel><Input id={`onboarding-automation-${field.key}`} type="number" min={field.min} max={field.max} value={draft[field.key] ?? ""} isDisabled={saving} onChange={(event) => setDraft((previous) => ({ ...previous, [field.key]: event.target.value }))} />{"hint" in field && <FormHelperText>{field.hint}</FormHelperText>}</FormControl>)}</SimpleGrid>
        <FormControl isRequired><FormLabel htmlFor="onboarding-automation-reason">Change reason</FormLabel><Textarea id="onboarding-automation-reason" maxLength={1000} value={reason} isDisabled={saving} onChange={(event) => setReason(event.target.value)} /></FormControl>
        <Button alignSelf="end" colorScheme="blue" isLoading={saving} onClick={save}>Save settings</Button>
      </Stack>}
    </Box>
    <Box borderTopWidth="1px" pt={5}><HStack justify="space-between" flexWrap="wrap" gap={2} mb={4}><Heading size="sm">Reminder checks</Heading><HStack flexWrap="wrap"><IconButton aria-label="Refresh reminder checks" title="Refresh reminder checks" size="sm" isLoading={jobsLoading} icon={<FiRefreshCw />} onClick={() => setJobReload((n) => n + 1)} /><Button size="sm" leftIcon={<FiPlay />} isLoading={running} title={dirty ? "Save or reload settings before running" : "Run with saved settings"} isDisabled={!settings?.enabled || saving || dirty} onClick={run}>Run reminder check</Button></HStack></HStack>
      {jobsError && <Alert status="error" mb={3}><AlertIcon />{jobsError}</Alert>}
      <TableContainer borderWidth="1px" borderRadius="md" mb={3}><Table size="sm"><Thead><Tr><Th>Started</Th><Th>Source</Th><Th>Status</Th><Th isNumeric>Checklists</Th><Th isNumeric>Notifications</Th><Th isNumeric>HR alerts</Th><Th>Details</Th><Th /></Tr></Thead><Tbody>
        {!jobs.data.length && <Tr><Td colSpan={8}>{jobsLoading ? "Loading reminder checks..." : "No reminder checks yet."}</Td></Tr>}
        {jobs.data.map((job) => <Tr key={job._id}><Td>{date(job.createdAt)}</Td><Td>{job.source}</Td><Td><Badge colorScheme={job.status === "failed" ? "red" : job.status === "complete" ? "green" : "blue"}>{job.status}</Badge></Td><Td isNumeric>{job.metrics.checklists}</Td><Td isNumeric>{job.metrics.notifications}</Td><Td isNumeric>{job.metrics.escalations}</Td><Td whiteSpace="normal" minW="180px" maxW="320px"><Text fontSize="xs">{job.error || `${job.metrics.ownerIssues} owner/reviewer issues | ${job.metrics.skipped} inactive/moved employees skipped`}</Text></Td><Td>{job.active && job.status === "failed" && <Button size="xs" variant="outline" isLoading={retrying === job._id} isDisabled={!settings?.enabled} onClick={() => retry(job._id)}>Retry</Button>}</Td></Tr>)}
      </Tbody></Table></TableContainer><Pager page={jobPage} pages={jobs.pagination.totalPages} onChange={setJobPage} />
    </Box>
    <Box borderTopWidth="1px" pt={5}><Heading size="sm" mb={4}>Settings history</Heading>{auditError && <Alert status="error" mb={3}><AlertIcon />{auditError}</Alert>}
      <TableContainer borderWidth="1px" borderRadius="md" mb={3}><Table size="sm"><Thead><Tr><Th>Changed</Th><Th>Changed by</Th><Th>Revision</Th><Th>Reason</Th></Tr></Thead><Tbody>{!audit.data.length && <Tr><Td colSpan={4}>{auditLoading ? "Loading settings history..." : "No settings changes yet."}</Td></Tr>}{audit.data.map((entry) => <Tr key={entry._id}><Td>{date(entry.createdAt)}</Td><Td>{entry.actorName}</Td><Td>{entry.after.revision}</Td><Td whiteSpace="normal" maxW="500px">{entry.reason}</Td></Tr>)}</Tbody></Table></TableContainer><Pager page={auditPage} pages={audit.pagination.totalPages} onChange={setAuditPage} />
    </Box>
  </Stack>;
}
