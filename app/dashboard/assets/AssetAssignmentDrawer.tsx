"use client";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, FormControl, FormLabel, Heading, HStack, Select, SimpleGrid, Skeleton, Stack, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import AssetLookup from "./AssetLookup";
import AssetIncidentReport from "./AssetIncidentReport";
import { assetGet, assetSave, Assignment, conditionLabels, dateTime, Option, statusLabel } from "./assetApi";

export default function AssetAssignmentDrawer({ assignmentId, onClose, onChanged, onIncident }: { assignmentId: string; onClose: () => void; onChanged: () => void; onIncident: (id: string) => void }) {
  const [reporting, setReporting] = useState(false);
  const [data, setData] = useState<Assignment | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(""), [reload, setReload] = useState(0);
  const [action, setAction] = useState(""), [reason, setReason] = useState(""), [confirmed, setConfirmed] = useState(false), [condition, setCondition] = useState("good"), [disposition, setDisposition] = useState("available"), [location, setLocation] = useState<Option | null>(null);
  const intent = useRef<{ signature: string; requestId: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    assetGet<{ data: Assignment }>(`/assignments/${assignmentId}`, undefined, controller.signal).then(({ data }) => { if (!controller.signal.aborted) setData(data); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [assignmentId, reload]);
  const choose = (value: string) => { setReporting(false); setAction(value); setReason(""); setConfirmed(false); setCondition("good"); setDisposition("available"); setLocation(data?.officeLocation ? { value: data.officeLocation, label: data.locationName || "Current inventory location" } : null); intent.current = null; setError(""); };
  const submit = async () => {
    if (!data || busy) return;
    const path = `/assignments/${assignmentId}/${action}`;
    const body = { revision: data.revision, ...(action === "acknowledge" ? { confirmReceipt: confirmed, note: reason.trim() } : { reason: reason.trim() }),
      ...(action === "return" ? { assetRevision: data.assetRevision, confirmReturnReceived: confirmed, condition, disposition: condition === "damaged" ? "maintenance" : disposition, officeLocation: location?.value || null } : {}), ...(action === "void" ? { assetRevision: data.assetRevision, confirmNoHandover: confirmed } : {}) };
    const signature = JSON.stringify({ path, body });
    if (intent.current?.signature !== signature) intent.current = { signature, requestId: crypto.randomUUID() };
    setBusy(true); setError("");
    try { const response = await assetSave<{ assignment: Assignment }>(path, { ...body, requestId: intent.current.requestId }); setData(response.data.assignment); setAction(""); intent.current = null; onChanged(); }
    catch (err) { setError(getApiErrorMessage(err)); }
    finally { setBusy(false); }
  };
  const disabled = busy || (action === "acknowledge" ? !confirmed : reason.trim().length < 3) || ["return", "void"].includes(action) && !confirmed;
  return <DashboardDrawer isOpen onClose={() => { if (!busy) onClose(); }} titlePrefix="Asset handover" maxW={{ base: "100%", lg: "760px" }}><Stack spacing={5} minW={0}>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {loading ? <Skeleton h="220px" /> : data ? <>
      <HStack justify="space-between" flexWrap="wrap" gap={3}><Box><Heading size="md" overflowWrap="anywhere">{data.assetSnapshot.name}</Heading><Text fontSize="sm">{data.assetSnapshot.tag}</Text></Box><Badge colorScheme={data.status === "returned" ? "gray" : data.status === "return_requested" ? "orange" : "blue"}>{statusLabel(data.status)}</Badge></HStack>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}><Box><Text fontSize="xs" color="gray.500">EMPLOYEE</Text><Text fontWeight="600">{data.employeeName}</Text><Text fontSize="sm">{data.employeeCode}</Text></Box><Box><Text fontSize="xs" color="gray.500">SERIAL NUMBER</Text><Text overflowWrap="anywhere">{data.assetSnapshot.serialNumber || "Not recorded"}</Text></Box><Box><Text fontSize="xs" color="gray.500">ISSUED BY / ON</Text><Text>{data.issuerName}</Text><Text fontSize="sm">{dateTime(data.issuedAt)}</Text></Box><Box><Text fontSize="xs" color="gray.500">CONDITION AT HANDOVER</Text><Text>{conditionLabels[data.conditionOut]}</Text></Box></SimpleGrid>
      {data.expectedReturnDate && <Text fontSize="sm">Expected return: {data.expectedReturnDate}</Text>}
      {data.handoverNotes && <Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">Handover notes: {data.handoverNotes}</Text>}
      <Box borderTopWidth="1px" pt={4}><Text fontWeight="600">Receipt acknowledgement</Text><Text fontSize="sm">{data.acknowledgedAt ? `Confirmed by ${data.employeeName} on ${dateTime(data.acknowledgedAt)}` : "Not acknowledged by the employee"}</Text>{data.acknowledgementNote && <Text mt={2} fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.acknowledgementNote}</Text>}</Box>
      {data.returnRequestedAt && <Box borderTopWidth="1px" pt={4}><Text fontWeight="600">Return requested</Text><Text fontSize="sm">{dateTime(data.returnRequestedAt)}</Text><Text mt={2} fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.returnRequestReason}</Text></Box>}
      {data.returnedAt && <Box borderTopWidth="1px" pt={4}><Text fontWeight="600">Return received by {data.receiverName}</Text><Text fontSize="sm">{dateTime(data.returnedAt)} | {data.conditionIn ? conditionLabels[data.conditionIn] : ""}</Text><Text mt={2} fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.returnNotes}</Text></Box>}
      {data.voidedAt && <Alert status="warning"><AlertIcon /><Box><Text fontWeight="600">Incorrect handover record voided</Text><Text fontSize="sm">{data.voiderName} | {dateTime(data.voidedAt)}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.voidReason}</Text></Box></Alert>}
      {data.writtenOffAt && <Alert status="info"><AlertIcon /><Box><Text fontWeight="600">Unrecovered custody administratively closed</Text><Text fontSize="sm">{data.writtenOffByName} | {dateTime(data.writtenOffAt)}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{data.writtenOffReason}</Text>{data.writtenOffRecoveredAt && <Text fontSize="sm">The unit was later recovered on {dateTime(data.writtenOffRecoveredAt)}. This original handover remains closed.</Text>}</Box></Alert>}
      {data.openIncident && <Alert status="warning"><AlertIcon /><Box><Text fontSize="sm">This equipment is on incident hold. Physical return remains available and sends it to maintenance.</Text><Button mt={2} size="xs" onClick={() => onIncident(data.openIncident!)}>Open incident</Button></Box></Alert>}
      {data.canReportIncident && <Button size="sm" variant="outline" colorScheme="red" alignSelf="start" isDisabled={busy} onClick={() => { setAction(""); setReporting((value) => !value); }}>Report incident</Button>}
      {reporting && data.canReportIncident && <AssetIncidentReport target={{ assignmentId, revision: data.revision }} busy={busy} setBusy={setBusy} onCancel={() => setReporting(false)} onSaved={(value) => { setReporting(false); onChanged(); onIncident(value._id); }} />}
      <HStack flexWrap="wrap" gap={3}>{data.canAcknowledge && <Button size="sm" colorScheme="blue" isDisabled={busy} onClick={() => choose("acknowledge")}>Acknowledge receipt</Button>}{data.canRequestReturn && <Button size="sm" variant="outline" isDisabled={busy} onClick={() => choose("request-return")}>Request return</Button>}{data.canReturn && <Button size="sm" colorScheme="blue" isDisabled={busy} onClick={() => choose("return")}>Record physical return</Button>}<Button size="sm" variant="ghost" isDisabled={busy} onClick={() => { setAction(""); setReload((value) => value + 1); }}>Reload</Button></HStack>
      {data.canVoid && <Button size="sm" variant="outline" colorScheme="red" alignSelf="start" isDisabled={busy} onClick={() => choose("void")}>Correct incorrect handover</Button>}
      {action && <Box borderTopWidth="1px" pt={5}><Stack spacing={4}><Heading size="sm">{action === "acknowledge" ? "Confirm asset receipt" : action === "return" ? "Record physical return" : action === "void" ? "Void incorrect handover record" : "Request asset return"}</Heading>
        {action === "return" && <><FormControl isRequired><FormLabel htmlFor="asset-return-condition">Condition received</FormLabel><Select id="asset-return-condition" value={condition} isDisabled={busy} onChange={(event) => setCondition(event.target.value)}>{Object.entries(conditionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></FormControl><FormControl isRequired><FormLabel htmlFor="asset-return-disposition">After return</FormLabel><Select id="asset-return-disposition" value={condition === "damaged" ? "maintenance" : disposition} isDisabled={busy || condition === "damaged"} onChange={(event) => setDisposition(event.target.value)}><option value="available">Available for issue</option><option value="maintenance">Send to maintenance</option></Select></FormControl>{condition === "damaged" && <Alert status="warning"><AlertIcon />Damaged assets must be repaired before they can be issued again.</Alert>}<FormControl><FormLabel htmlFor="asset-return-location">Inventory location after return</FormLabel><AssetLookup inputId="asset-return-location" kind="locations" value={location} onChange={setLocation} disabled={busy} /></FormControl></>}
        <FormControl isRequired={action !== "acknowledge"}><FormLabel htmlFor="asset-custody-note">{action === "acknowledge" ? "Note (optional)" : action === "return" ? "Return inspection notes" : "Reason"}</FormLabel><Textarea id="asset-custody-note" value={reason} maxLength={1000} isDisabled={busy} onChange={(event) => setReason(event.target.value)} /></FormControl>
        {action === "acknowledge" && <Checkbox isChecked={confirmed} isDisabled={busy} onChange={(event) => setConfirmed(event.target.checked)}>I confirm that I physically received this asset.</Checkbox>}
        {action === "return" && <><Checkbox isChecked={confirmed} isDisabled={busy} onChange={(event) => setConfirmed(event.target.checked)}>I confirm that I physically received and inspected this returned asset.</Checkbox>{data.openIncident && <Text fontSize="sm" color="orange.600">The open incident forces maintenance even if Available is selected. The case must be reviewed separately.</Text>}</>}
        {action === "void" && <><Alert status="warning"><AlertIcon />Use only when the record was incorrect and custody never transferred. This preserves a voided history entry; it does not record a physical return.</Alert><Checkbox isChecked={confirmed} isDisabled={busy} onChange={(event) => setConfirmed(event.target.checked)}>I confirm the employee never received this asset.</Checkbox></>}
        {action === "request-return" && <Text fontSize="sm">The asset stays in your custody until an asset manager records its physical return.</Text>}
        <HStack justify="end"><Button variant="ghost" size="sm" isDisabled={busy} onClick={() => setAction("")}>Cancel</Button><Button size="sm" colorScheme={action === "void" ? "red" : "blue"} isDisabled={disabled} isLoading={busy} onClick={() => void submit()}>{action === "acknowledge" ? "Confirm receipt" : action === "return" ? "Record return" : action === "void" ? "Void incorrect record" : "Request return"}</Button></HStack>
      </Stack></Box>}
    </> : <Button onClick={() => setReload((value) => value + 1)}>Retry loading handover</Button>}
  </Stack></DashboardDrawer>;
}
