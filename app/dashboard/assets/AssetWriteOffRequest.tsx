"use client";
import { Alert, AlertIcon, Box, Button, Checkbox, FormControl, FormLabel, HStack, Input, Select, SimpleGrid, Stack, Text, Textarea } from "@chakra-ui/react";
import { useState } from "react";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetSave, parseAssetAmount, serviceCurrencies, WriteOff } from "./assetApi";

export default function AssetWriteOffRequest({ incidentId, revision, assetRevision, kind, busy, setBusy, onCancel, onSaved }: { incidentId: string; revision: number; assetRevision?: number; kind: string; busy: boolean; setBusy: (value: boolean) => void; onCancel: () => void; onSaved: (value: WriteOff) => void }) {
  const [lossKind, setLossKind] = useState(kind === "theft" ? "theft" : "loss"), [amount, setAmount] = useState(""), [currency, setCurrency] = useState("INR"), [reference, setReference] = useState(""), [reason, setReason] = useState(""), [confirmed, setConfirmed] = useState(false), [error, setError] = useState(""), [retry, setRetry] = useState<Record<string, unknown> | null>(null);
  const execute = async (body: Record<string, unknown>) => {
    if (busy) return;
    setBusy(true); setError("");
    try { const response = await assetSave<WriteOff>("/write-offs", body); setRetry(null); onSaved(response.data); }
    catch (err: any) { setError(getApiErrorMessage(err)); setRetry(!err?.response || err.response.status >= 500 ? body : null); }
    finally { setBusy(false); }
  };
  const save = () => {
    try { void execute({ incidentId, revision, assetRevision, lossKind, amountMinor: parseAssetAmount(amount), currency, evidenceReference: reference.trim(), reason: reason.trim(), confirmUnrecovered: confirmed, requestId: crypto.randomUUID() }); }
    catch (err: any) { setError(err.message); }
  };
  const disabled = busy || Boolean(retry);
  return <Box borderTopWidth="1px" pt={4}><Stack spacing={4}><Text fontWeight="600">Request confirmed-loss write-off</Text>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {retry && <Alert status="warning"><AlertIcon /><Stack><Text fontSize="sm">The result is uncertain. Retry this exact request before starting another.</Text><Button size="sm" alignSelf="start" isDisabled={busy} onClick={() => void execute(retry)}>Retry same request</Button></Stack></Alert>}
    <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}><FormControl isRequired><FormLabel htmlFor="writeoff-loss-kind">Confirmed loss type</FormLabel><Select id="writeoff-loss-kind" value={lossKind} isDisabled={disabled} onChange={(event) => setLossKind(event.target.value)}><option value="loss">Lost / unrecovered</option><option value="theft">Theft</option></Select></FormControl><FormControl><FormLabel htmlFor="writeoff-value">Recorded loss value (optional)</FormLabel><Input id="writeoff-value" inputMode="decimal" value={amount} placeholder="Not recorded" isDisabled={disabled} onChange={(event) => setAmount(event.target.value)} /></FormControl><FormControl isRequired><FormLabel htmlFor="writeoff-currency">Currency</FormLabel><Select id="writeoff-currency" value={currency} isDisabled={disabled} onChange={(event) => setCurrency(event.target.value)}>{serviceCurrencies.map((value) => <option key={value} value={value}>{value}</option>)}</Select></FormControl><FormControl><FormLabel htmlFor="writeoff-reference">Investigation / supporting reference</FormLabel><Input id="writeoff-reference" value={reference} maxLength={200} isDisabled={disabled} onChange={(event) => setReference(event.target.value)} /></FormControl></SimpleGrid>
    <FormControl isRequired><FormLabel htmlFor="writeoff-request-reason">Investigation findings and reason</FormLabel><Textarea id="writeoff-request-reason" value={reason} maxLength={2000} isDisabled={disabled} onChange={(event) => setReason(event.target.value)} /><Text mt={1} fontSize="xs" color="gray.500">At least 10 characters. A different authorised approver decides this request.</Text></FormControl>
    <Checkbox id="writeoff-request-confirm" alignItems="start" isChecked={confirmed} isDisabled={disabled} onChange={(event) => setConfirmed(event.target.checked)}>I confirm the unit is still unrecovered. This is not disposal of equipment already physically held by the company.</Checkbox>
    <HStack><Button size="sm" variant="ghost" isDisabled={disabled} onClick={onCancel}>Cancel</Button><Button size="sm" colorScheme="red" isDisabled={disabled || !confirmed || reason.trim().length < 10} isLoading={busy} onClick={save}>Submit for independent approval</Button></HStack>
  </Stack></Box>;
}
