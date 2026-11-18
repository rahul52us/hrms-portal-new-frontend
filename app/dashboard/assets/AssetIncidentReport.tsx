"use client";
import { Alert, AlertIcon, Box, Button, FormControl, FormLabel, HStack, Input, Select, Stack, Text, Textarea } from "@chakra-ui/react";
import { useState } from "react";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetSave, Incident, incidentKinds } from "./assetApi";

export default function AssetIncidentReport({ target, busy, setBusy, onCancel, onSaved }: { target: { assignmentId?: string; assetId?: string; revision: number }; busy: boolean; setBusy: (value: boolean) => void; onCancel: () => void; onSaved: (value: Incident) => void }) {
  const [kind, setKind] = useState("damage"), [description, setDescription] = useState(""), [occurredAt, setOccurredAt] = useState(() => { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); });
  const [error, setError] = useState(""), [retry, setRetry] = useState<Record<string, unknown> | null>(null);
  const execute = async (body: Record<string, unknown>) => {
    if (busy) return;
    setBusy(true); setError("");
    try { const response = await assetSave<Incident>("/incidents", body); setRetry(null); onSaved(response.data); }
    catch (err: any) { setError(getApiErrorMessage(err)); setRetry(!err?.response || err.response.status >= 500 ? body : null); }
    finally { setBusy(false); }
  };
  const save = () => {
    const date = new Date(occurredAt);
    if (!Number.isFinite(date.getTime())) { setError("Enter a valid incident date and time."); return; }
    void execute({ ...target, kind, description: description.trim(), occurredAt: date.toISOString(), requestId: crypto.randomUUID() });
  };
  const disabled = busy || Boolean(retry);
  return <Box borderTopWidth="1px" pt={4}><Stack spacing={4}>
    <Text fontWeight="600">Report an equipment incident</Text>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {retry && <Alert status="warning"><AlertIcon /><Stack><Text fontSize="sm">The outcome is uncertain. Retry the same report before creating another.</Text><Button size="sm" alignSelf="start" isDisabled={busy} onClick={() => void execute(retry)}>Retry same report</Button></Stack></Alert>}
    <FormControl isRequired><FormLabel htmlFor="asset-incident-kind">What happened?</FormLabel><Select id="asset-incident-kind" value={kind} onChange={(event) => setKind(event.target.value)} isDisabled={disabled}>{Object.entries(incidentKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></FormControl>
    <FormControl isRequired><FormLabel htmlFor="asset-incident-occurred">When did it happen?</FormLabel><Input id="asset-incident-occurred" type="datetime-local" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} isDisabled={disabled} /><Text fontSize="xs" color="gray.500" mt={1}>{Intl.DateTimeFormat().resolvedOptions().timeZone}</Text></FormControl>
    <FormControl isRequired><FormLabel htmlFor="asset-incident-description">Describe the incident</FormLabel><Textarea id="asset-incident-description" value={description} maxLength={2000} onChange={(event) => setDescription(event.target.value)} isDisabled={disabled} /><Text fontSize="xs" color="gray.500" mt={1}>At least 10 characters. Shared with HR and the employee involved.</Text></FormControl>
    <HStack flexWrap="wrap"><Button size="sm" variant="ghost" isDisabled={disabled} onClick={onCancel}>Cancel</Button><Button size="sm" colorScheme="red" isLoading={busy} isDisabled={disabled || description.trim().length < 10 || !occurredAt} onClick={save}>Report incident</Button></HStack>
  </Stack></Box>;
}
