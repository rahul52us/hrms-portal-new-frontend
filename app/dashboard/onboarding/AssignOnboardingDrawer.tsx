"use client";
import { Alert, AlertIcon, Button, FormControl, FormHelperText, FormLabel, HStack, Stack, Textarea } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { onboardingGet, onboardingSave, Page, Person } from "./onboardingApi";
import OnboardingTimezoneSelect from "./OnboardingTimezoneSelect";

type Choice = { value: string; label: string };
export default function AssignOnboardingDrawer({ employeeId, onClose, onAssigned }: { employeeId?: string; onClose: () => void; onAssigned: (id: string) => void }) {
  const [employee, setEmployee] = useState<Choice | null>(null), [template, setTemplate] = useState<Choice | null>(null);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone), [reason, setReason] = useState(""), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const attempt = useRef<{ signature: string; id: string } | null>(null);
  const employees = async (search: string) => (await onboardingGet<Page<Person & { joiningDate?: string }>>("/employees", { search: search || undefined, limit: 20 })).data.map((person) => ({ value: person._id, label: `${person.name} (${person.code || "No code"})${person.joiningDate ? ` | ${person.joiningDate.slice(0, 10)}` : " | Joining date missing"}` }));
  const templates = async (search: string) => (await onboardingGet<Page<{ templateVersion: string; name: string; version: number; taskCount: number }>>("/assignment-templates", { search: search || undefined, limit: 20 })).data.map((value) => ({ value: value.templateVersion, label: `${value.name} | v${value.version} | ${value.taskCount} tasks` }));
  useEffect(() => {
    if (!employeeId) return;
    const controller = new AbortController();
    onboardingGet<Page<Person>>("/employees", { employeeId, limit: 1 }, controller.signal).then(({ data }) => { if (!controller.signal.aborted && data[0]) setEmployee({ value: data[0]._id, label: `${data[0].name} (${data[0].code})` }); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); });
    return () => controller.abort();
  }, [employeeId]);
  const save = async () => {
    if (!employee || !template || reason.trim().length < 3) { setError("Choose an employee and a published checklist, and enter a reason."); return; }
    setSaving(true); setError("");
    const body = { employeeId: employee.value, templateVersionId: template.value, timezone, reason: reason.trim() }, signature = JSON.stringify(body);
    if (attempt.current?.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() };
    try { const response = await onboardingSave("/instances", { ...body, requestId: attempt.current.id }); onAssigned(response.data._id); }
    catch (err: any) { setError(getApiErrorMessage(err?.response?.data || err, "Unable to assign checklist")); } finally { setSaving(false); }
  };
  return <DashboardDrawer isOpen onClose={() => { if (!saving) onClose(); }} titlePrefix="Assign onboarding checklist" maxW={{ base: "100%", lg: "720px" }} footerContent={<HStack justify="end" w="100%"><Button variant="ghost" isDisabled={saving} onClick={onClose}>Cancel</Button><Button colorScheme="blue" isLoading={saving} onClick={save}>Assign checklist</Button></HStack>}><Stack spacing={5}>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    <FormControl isRequired><FormLabel htmlFor="onboarding-assign-employee">Employee</FormLabel><AsyncSelect inputId="onboarding-assign-employee" defaultOptions loadOptions={employees} value={employee} onChange={(value) => setEmployee(value)} isDisabled={saving} placeholder="Search employee name or code" /></FormControl>
    <FormControl isRequired><FormLabel htmlFor="onboarding-assign-template">Published checklist</FormLabel><AsyncSelect inputId="onboarding-assign-template" defaultOptions loadOptions={templates} value={template} onChange={(value) => setTemplate(value)} isDisabled={saving} placeholder="Search checklist templates" /><FormHelperText>The published version is copied; later template changes do not change this checklist.</FormHelperText></FormControl>
    <FormControl isRequired><FormLabel htmlFor="onboarding-assign-timezone">Deadline timezone</FormLabel><OnboardingTimezoneSelect id="onboarding-assign-timezone" value={timezone} disabled={saving} onChange={setTimezone} /><FormHelperText>Dates use the employee's joining date.</FormHelperText></FormControl>
    <FormControl isRequired><FormLabel htmlFor="onboarding-assign-reason">Reason</FormLabel><Textarea id="onboarding-assign-reason" maxLength={1000} value={reason} isDisabled={saving} onChange={(e) => setReason(e.target.value)} /></FormControl>
  </Stack></DashboardDrawer>;
}
