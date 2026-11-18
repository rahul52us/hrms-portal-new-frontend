"use client";
import { Alert, AlertIcon, Box, Button, Checkbox, FormControl, FormLabel, HStack, Input, Select, SimpleGrid, Stack, Text, Textarea } from "@chakra-ui/react";
import { useState } from "react";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetSave, ServiceOrder, serviceKinds } from "./assetApi";

export default function AssetServiceCreate({ assetId, revision, busy, setBusy, onCancel, onSaved }: { assetId: string; revision: number; busy: boolean; setBusy: (value: boolean) => void; onCancel: () => void; onSaved: (value: ServiceOrder) => void }) {
  const [kind, setKind] = useState("repair"), [providerType, setProviderType] = useState("internal"), [providerName, setProviderName] = useState(""), [providerReference, setProviderReference] = useState(""), [expectedDate, setExpectedDate] = useState(""), [description, setDescription] = useState(""), [confirmed, setConfirmed] = useState(false), [error, setError] = useState(""), [retry, setRetry] = useState<Record<string, unknown> | null>(null);
  const execute = async (body: Record<string, unknown>) => {
    if (busy) return;
    setBusy(true); setError("");
    try { const response = await assetSave<ServiceOrder>("/service-orders", body); setRetry(null); onSaved(response.data); }
    catch (err: any) { setError(getApiErrorMessage(err)); setRetry(!err?.response || err.response.status >= 500 ? body : null); }
    finally { setBusy(false); }
  };
  const disabled = busy || Boolean(retry);
  return <Box borderTopWidth="1px" pt={4}><Stack spacing={4}><Text fontWeight="600">Open service order</Text>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {retry && <Alert status="warning"><AlertIcon /><Stack><Text fontSize="sm">The result is uncertain. Retry the original order before creating another.</Text><Button size="sm" alignSelf="start" isDisabled={busy} onClick={() => void execute(retry)}>Retry same order</Button></Stack></Alert>}
    <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
      <FormControl isRequired><FormLabel htmlFor="service-create-kind">Service type</FormLabel><Select id="service-create-kind" value={kind} isDisabled={disabled} onChange={(event) => setKind(event.target.value)}>{Object.entries(serviceKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></FormControl>
      <FormControl isRequired><FormLabel htmlFor="service-create-provider-type">Handled by</FormLabel><Select id="service-create-provider-type" value={providerType} isDisabled={disabled} onChange={(event) => setProviderType(event.target.value)}><option value="internal">Internal team</option><option value="external">External provider</option></Select></FormControl>
      <FormControl isRequired={providerType === "external"}><FormLabel htmlFor="service-create-provider">{providerType === "external" ? "Provider name" : "Team name (optional)"}</FormLabel><Input id="service-create-provider" value={providerName} maxLength={150} isDisabled={disabled} onChange={(event) => setProviderName(event.target.value)} /></FormControl>
      <FormControl><FormLabel htmlFor="service-create-reference">Provider ticket / reference</FormLabel><Input id="service-create-reference" value={providerReference} maxLength={100} isDisabled={disabled} onChange={(event) => setProviderReference(event.target.value)} /></FormControl>
      <FormControl><FormLabel htmlFor="service-create-expected">Expected completion date</FormLabel><Input id="service-create-expected" type="date" value={expectedDate} isDisabled={disabled} onChange={(event) => setExpectedDate(event.target.value)} /></FormControl>
    </SimpleGrid>
    <FormControl isRequired><FormLabel htmlFor="service-create-description">Issue / service required</FormLabel><Textarea id="service-create-description" value={description} maxLength={2000} isDisabled={disabled} onChange={(event) => setDescription(event.target.value)} /><Text mt={1} fontSize="xs" color="gray.500">At least 10 characters.</Text></FormControl>
    <Checkbox id="service-create-confirm-custody" alignItems="start" isChecked={confirmed} isDisabled={disabled} onChange={(event) => setConfirmed(event.target.checked)}>I confirm this unit is physically in company custody, not with an employee or service provider.</Checkbox>
    <HStack><Button size="sm" variant="ghost" isDisabled={disabled} onClick={onCancel}>Cancel</Button><Button size="sm" colorScheme="blue" isLoading={busy} isDisabled={disabled || !confirmed || description.trim().length < 10 || providerType === "external" && providerName.trim().length < 2} onClick={() => void execute({ assetId, revision, kind, providerType, providerName: providerName.trim(), providerReference: providerReference.trim(), expectedCompletionDate: expectedDate, issueDescription: description.trim(), confirmCompanyCustody: true, requestId: crypto.randomUUID() })}>Create service order</Button></HStack>
  </Stack></Box>;
}
