"use client";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { emptyPage, onboardingGet, onboardingSave, Page } from "./onboardingApi";
import { EmployeeOnboarding, OnboardingTask } from "./employeeOnboardingApi";

type Policy = { policyVersionId: string; name: string; description: string; body: string; version: number; contentHash: string; acknowledgementText: string; canAcknowledge: boolean };
type Receipt = { _id: string; employeeName: string; version: number; statement: string; cycle: number; acknowledgedAt: string };
export default function OnboardingPolicyReader({ instanceId, revision, task, busy, setBusy, onSaved }: { instanceId: string; revision: number; task: OnboardingTask; busy: boolean; setBusy: (value: boolean) => void; onSaved: (value: EmployeeOnboarding) => void }) {
  const [open, setOpen] = useState(false), [policy, setPolicy] = useState<Policy | null>(null), [error, setError] = useState(""), [loading, setLoading] = useState(false), [confirmed, setConfirmed] = useState(false), [reload, setReload] = useState(0), [page, setPage] = useState(1);
  const [receipts, setReceipts] = useState<Page<Receipt>>({ data: [], pagination: emptyPage });
  const attempt = useRef<{ signature: string; requestId: string } | null>(null);
  const path = `/instances/${instanceId}/tasks/${task._id}`;
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController(); setLoading(true); setError(""); setConfirmed(false);
    const load = async () => {
      try {
        const current = await onboardingGet<{ data: Policy }>(`${path}/policy`, undefined, controller.signal);
        const history = await onboardingGet<Page<Receipt>>(`${path}/acknowledgements`, { page, limit: 10 }, controller.signal);
        if (!controller.signal.aborted) { setPolicy(current.data); setReceipts(history); }
      } catch (err) { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [open, path, revision, page, reload]);
  const acknowledge = async () => {
    if (!policy || busy || !confirmed || !task.canAcknowledge || loading) return;
    const payload = { action: "acknowledge", revision, policyVersionId: policy.policyVersionId, contentHash: policy.contentHash, confirmAcknowledgement: true };
    const signature = JSON.stringify(payload);
    if (attempt.current?.signature !== signature) attempt.current = { signature, requestId: crypto.randomUUID() };
    setBusy(true); setError("");
    try { const response = await onboardingSave<EmployeeOnboarding>(`${path}/actions`, { ...payload, requestId: attempt.current.requestId }); attempt.current = null; setConfirmed(false); onSaved(response.data); }
    catch (err) { setError(getApiErrorMessage(err)); }
    finally { setBusy(false); }
  };
  return <Stack spacing={3}>
    <HStack flexWrap="wrap"><Badge colorScheme="blue">Policy acknowledgement</Badge><Text fontSize="sm">{task.policySnapshot?.name} | v{task.policySnapshot?.version}</Text><Button size="sm" variant="outline" isDisabled={busy} onClick={() => setOpen((value) => !value)}>{open ? "Hide policy" : task.canAcknowledge ? "Read and acknowledge" : "Read policy and receipts"}</Button></HStack>
    {task.acknowledgement && <Text fontSize="sm" color="green.600">Acknowledged by {task.acknowledgement.employeeName} on {new Date(task.acknowledgement.acknowledgedAt).toLocaleString()}</Text>}
    {task.status === "waived" && <Text fontSize="sm">Task waived by HR. This is not an employee acknowledgement.</Text>}
    {open && <Box borderLeftWidth="3px" pl={4}><Stack spacing={4}>
      {error && <Alert status="error"><AlertIcon />{error}<Button ml="auto" flexShrink={0} size="xs" isDisabled={busy} onClick={() => setReload((value) => value + 1)}>Reload</Button></Alert>}
      {loading ? <Skeleton h="180px" /> : policy && <>
        <Text fontWeight="700">{policy.name} | v{policy.version}</Text>
        {policy.description && <Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{policy.description}</Text>}
        <Text whiteSpace="pre-wrap" overflowWrap="anywhere" fontSize="sm">{policy.body}</Text>
        {task.canAcknowledge && policy.canAcknowledge && <><Checkbox alignItems="start" isChecked={confirmed} isDisabled={busy || Boolean(error)} onChange={(event) => setConfirmed(event.target.checked)}><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{policy.acknowledgementText}</Text></Checkbox><Button alignSelf="start" colorScheme="blue" size="sm" isLoading={busy} isDisabled={!confirmed || Boolean(error)} onClick={() => void acknowledge()}>Acknowledge policy</Button></>}
        <Text fontWeight="600" fontSize="sm">Acknowledgement receipts</Text>
        {!receipts.data.length && <Text fontSize="sm" color="gray.500">No employee acknowledgement recorded.</Text>}
        {receipts.data.map((receipt) => <Box key={receipt._id} borderTopWidth="1px" pt={2}><Text fontSize="sm">{receipt.employeeName} | v{receipt.version} | {new Date(receipt.acknowledgedAt).toLocaleString()}</Text><Text fontSize="xs" whiteSpace="pre-wrap" overflowWrap="anywhere">{receipt.statement}</Text></Box>)}
        {receipts.pagination.totalPages > 1 && <HStack><Button size="xs" isDisabled={page <= 1 || busy} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="xs">{page}/{receipts.pagination.totalPages}</Text><Button size="xs" isDisabled={page >= receipts.pagination.totalPages || busy} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack>}
      </>}
    </Stack></Box>}
  </Stack>;
}
