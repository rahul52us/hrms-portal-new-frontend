"use client";
import { Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormHelperText, FormLabel, Input, Select, SimpleGrid, Skeleton, Stack, Text, Textarea, useToast } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { changeTimesheetControls, ControlAction, ControlHistory, ControlPayload, getTimesheetControls, TimesheetControl } from "./timesheetApi";
import { formatMinutes } from "./timesheetUi.utils";

const actionLabels: Record<ControlAction, string> = { grant_exemption: "Grant exemption", extend_deadline: "Extend deadline", revoke_exemption: "Revoke exemption", revoke_extension: "Revoke extension" };
export default function TimesheetControlsPanel({ date, timezone, target, onChanged }: { date: string; timezone: string | null; target?: { employeeId: string; scope: string }; onChanged?: () => void }) {
  const [data, setData] = useState<ControlHistory | null>(null), [page, setPage] = useState(1), [refresh, setRefresh] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [action, setAction] = useState<ControlAction>("grant_exemption"), [mode, setMode] = useState("full_day"), [minutes, setMinutes] = useState(""), [untilDate, setUntilDate] = useState(""), [untilTime, setUntilTime] = useState("23:59"), [reason, setReason] = useState(""), [saving, setSaving] = useState(false);
  const pending = useRef<{ signature: string; payload: ControlPayload } | null>(null), inFlight = useRef(false), mounted = useRef(true), toast = useToast();
  const employeeId = target?.employeeId, scope = target?.scope;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    getTimesheetControls(date, page, employeeId && scope ? { employeeId, scope } : undefined, controller.signal).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Could not load timesheet controls")); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, page, refresh, employeeId, scope]);
  const time = (value: string) => new Intl.DateTimeFormat("en-GB", { timeZone: timezone || "UTC", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const describe = (control: TimesheetControl) => [control.exemption ? control.exemption.mode === "full_day" ? "Full-day exemption" : `${formatMinutes(control.exemption.minutes)} exempt` : "No HR exemption", control.extension ? `Deadline ${time(control.extension.until)}` : "Policy deadline"].join(" | ");
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!data?.capabilities.canManage || !target || inFlight.current) return;
    const values: Omit<ControlPayload, "requestId"> = { action, revision: data.control.revision, reason: reason.trim(), ...(action === "grant_exemption" ? { mode: mode as "full_day" | "minutes", ...(mode === "minutes" ? { minutes: Number(minutes) } : {}) } : action === "extend_deadline" ? { untilDate, untilTime } : {}) };
    const signature = JSON.stringify(values); if (pending.current?.signature !== signature) pending.current = { signature, payload: { ...values, requestId: crypto.randomUUID() } };
    inFlight.current = true; setSaving(true); setError("");
    try {
      await changeTimesheetControls(date, target, pending.current.payload);
      if (!mounted.current) return; pending.current = null; setReason(""); setAction("grant_exemption"); setPage(1); setRefresh((r) => r + 1);
      const notice = { title: "Timesheet control updated", status: "success" as const, duration: 2500, isClosable: true };
      if (toast.isActive("timesheet-control-updated")) toast.update("timesheet-control-updated", notice);
      else toast({ id: "timesheet-control-updated", ...notice });
      onChanged?.();
    } catch (err: any) { if (mounted.current) setError(getApiErrorMessage(err?.response?.data || err, "Update failed. Retry safely or reload current controls.")); }
    finally { inFlight.current = false; if (mounted.current) setSaving(false); }
  }
  const invalid = reason.trim().length < 3 || action === "grant_exemption" && mode === "minutes" && (!minutes || !Number.isSafeInteger(Number(minutes)) || Number(minutes) < 1 || Number(minutes) > 1440) || action === "extend_deadline" && (!untilDate || !untilTime);
  return <Stack spacing={3} borderTopWidth="1px" pt={4} minW={0}>
    <Flex gap={3} justify="space-between" align="center" wrap="wrap"><Text fontWeight="700">HR exemptions and extensions</Text><Button type="button" size="xs" variant="outline" isDisabled={saving} onClick={() => setRefresh((r) => r + 1)}>Reload controls</Button></Flex>
    {error ? <Alert status="error"><AlertIcon />{error}</Alert> : null}
    {loading ? <Skeleton h="60px" /> : data ? <>
      {data.control.exemption ? <Box><Badge colorScheme="teal">HR exemption</Badge><Text mt={1} fontSize="sm">{data.control.exemption.mode === "full_day" ? "Full timesheet requirement waived" : `${formatMinutes(data.control.exemption.minutes)} of the timesheet requirement waived`}</Text><Text fontSize="sm" overflowWrap="anywhere">{data.control.exemption.reason}</Text></Box> : null}
      {data.control.extension ? <Box><Badge colorScheme="blue">Deadline extended</Badge><Text fontSize="sm" mt={1}>Until {time(data.control.extension.until)} ({data.control.extension.timezone})</Text><Text fontSize="sm" overflowWrap="anywhere">{data.control.extension.reason}</Text></Box> : null}
      {data.capabilities.authorized && !data.capabilities.canManage ? <Alert status="info"><AlertIcon />{data.capabilities.blockedReason}</Alert> : null}
      {data.capabilities.canManage && target ? <Box as="form" onSubmit={save}>
        <Stack spacing={3}>
          <FormControl><FormLabel htmlFor="timesheet-control-action">HR action</FormLabel><Select id="timesheet-control-action" value={action} isDisabled={saving} onChange={(e) => setAction(e.target.value as ControlAction)}><option value="grant_exemption">Grant exemption</option><option value="extend_deadline">Extend deadline</option>{data.control.exemption ? <option value="revoke_exemption">Revoke exemption</option> : null}{data.control.extension ? <option value="revoke_extension">Revoke extension</option> : null}</Select></FormControl>
          {action === "grant_exemption" ? <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}><FormControl><FormLabel htmlFor="timesheet-exemption-mode">Exemption amount</FormLabel><Select id="timesheet-exemption-mode" value={mode} isDisabled={saving} onChange={(e) => setMode(e.target.value)}><option value="full_day">Full day</option><option value="minutes">Number of minutes</option></Select></FormControl>{mode === "minutes" ? <FormControl isRequired><FormLabel htmlFor="timesheet-exempt-minutes">Minutes to waive</FormLabel><Input id="timesheet-exempt-minutes" aria-label="Minutes to waive" type="number" min={1} max={1440} step={1} value={minutes} placeholder="e.g. 120" isDisabled={saving} onChange={(e) => setMinutes(e.target.value)} /><FormHelperText>120 minutes = 2 hours. Remaining work still needs entries.</FormHelperText></FormControl> : null}</SimpleGrid> : action === "extend_deadline" ? <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}><FormControl isRequired><FormLabel htmlFor="timesheet-extension-date">Allow until date</FormLabel><Input id="timesheet-extension-date" aria-label="Allow until date" type="date" value={untilDate} isDisabled={saving} onChange={(e) => setUntilDate(e.target.value)} /></FormControl><FormControl isRequired><FormLabel htmlFor="timesheet-extension-time">Allow until time ({timezone || "UTC"})</FormLabel><Input id="timesheet-extension-time" aria-label={`Allow until time (${timezone || "UTC"})`} type="time" value={untilTime} isDisabled={saving} onChange={(e) => setUntilTime(e.target.value)} /></FormControl></SimpleGrid> : null}
          <FormControl isRequired><FormLabel htmlFor="timesheet-control-reason">Reason</FormLabel><Textarea id="timesheet-control-reason" aria-label="Reason" value={reason} rows={2} maxLength={500} isDisabled={saving} onChange={(e) => setReason(e.target.value)} /><FormHelperText>Visible to the employee and kept in audit history.</FormHelperText></FormControl>
          <Text fontSize="xs" color="gray.500">This changes timesheet requirements or timing only, not attendance or salary.</Text>
          <Button type="submit" alignSelf="start" colorScheme={action.startsWith("revoke") ? "red" : "blue"} isLoading={saving} isDisabled={invalid}>{actionLabels[action]}</Button>
        </Stack>
      </Box> : null}
      <Text fontSize="sm" fontWeight="600">Audit history</Text>
      {!data.data.length ? <Text fontSize="sm" color="gray.500">No HR changes for this day.</Text> : data.data.map((row) => <Box key={row._id} borderTopWidth="1px" pt={3}><Text fontSize="sm" fontWeight="600">{actionLabels[row.action]}</Text><Text fontSize="xs" color="gray.500">{row.actorNameSnapshot} | {time(row.createdAt)}</Text><Text fontSize="sm" mt={1} whiteSpace="pre-wrap" overflowWrap="anywhere">{row.reason}</Text><Text fontSize="xs" mt={1}>{describe(row.before)} to {describe(row.after)}</Text></Box>)}
      {data.pagination.totalPages > 1 ? <Flex gap={3} justify="end" align="center"><Button size="xs" isDisabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous controls</Button><Text fontSize="xs">{page}/{data.pagination.totalPages}</Text><Button size="xs" isDisabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next controls</Button></Flex> : null}
    </> : null}
  </Stack>;
}
