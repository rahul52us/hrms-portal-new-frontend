"use client";
import { Alert, AlertIcon, Badge, Box, Button, Heading, HStack, IconButton, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiShield } from "react-icons/fi";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { emptyPage, onboardingGet, onboardingSave, Page } from "./onboardingApi";
import OnboardingRetentionPanel from "./OnboardingRetentionPanel";

type Security = { scanner: { provider: "clamav" | "disabled" | "misconfigured"; enabled: boolean; configured: boolean; failClosed: boolean; configurationOnly: boolean } };
type Event = { _id: string; uploadedBy?: { name?: string; code?: string } | null; purpose: string; provider: string; outcome: "blocked" | "unavailable"; createdAt: string };
const purpose: Record<string, string> = { onboarding: "Onboarding document", employee_document: "Employee document", request_attachment: "Leave / attendance attachment", company_logo: "Company logo", profile_photo: "Profile photo", asset_document: "Asset document" };

export default function OnboardingDocumentSecurityPanel({ accountKey }: { accountKey: string }) {
  const [data, setData] = useState<Security | null>(null), [error, setError] = useState(""), [reload, setReload] = useState(0);
  const [checking, setChecking] = useState(false), [health, setHealth] = useState<{ reachable: boolean; checkedAt: string } | null>(null), [healthError, setHealthError] = useState("");
  const [events, setEvents] = useState<Page<Event>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [eventReload, setEventReload] = useState(0), [eventsError, setEventsError] = useState(""), [loadingEvents, setLoadingEvents] = useState(true);
  useEffect(() => {
    const controller = new AbortController(); setData(null); setError(""); setHealth(null); setHealthError("");
    onboardingGet<{ data: Security }>("/document-security", undefined, controller.signal).then((response) => { if (!controller.signal.aborted) setData(response.data); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); });
    return () => controller.abort();
  }, [accountKey, reload]);
  useEffect(() => {
    const controller = new AbortController(); setLoadingEvents(true); setEventsError("");
    onboardingGet<Page<Event>>("/document-security/events", { page, limit: 20 }, controller.signal).then((response) => { if (!controller.signal.aborted) setEvents(response); }).catch((err) => { if (!controller.signal.aborted) setEventsError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoadingEvents(false); });
    return () => controller.abort();
  }, [accountKey, page, eventReload]);
  const check = async () => {
    setChecking(true); setHealth(null); setHealthError("");
    try { const response = await onboardingSave<{ reachable: boolean; checkedAt: string }>("/document-security/check-scanner", {}); setHealth(response.data); }
    catch (err) { setHealthError(getApiErrorMessage(err)); } finally { setChecking(false); }
  };
  return <Stack spacing={7} minW={0}>
    <Box><HStack justify="space-between" flexWrap="wrap" gap={3} mb={4}><Heading size="sm">Malware scanning</Heading><Button size="sm" variant="outline" isDisabled={checking} onClick={() => setReload((n) => n + 1)}>Reload configuration</Button></HStack>
      {error && <Alert status="error"><AlertIcon />{error}</Alert>}
      {!data ? !error && <Skeleton h="130px" /> : <Stack spacing={4}>
        <HStack gap={3} flexWrap="wrap"><Text fontWeight="600">Scanner</Text><Badge colorScheme={data.scanner.provider === "disabled" ? "yellow" : data.scanner.configured ? "blue" : "red"}>{data.scanner.provider === "clamav" ? "ClamAV configured" : data.scanner.provider === "disabled" ? "Disabled" : "Misconfigured"}</Badge>{health?.reachable && <Badge colorScheme="green">Connection available</Badge>}</HStack>
        {data.scanner.provider === "disabled" && <Alert status="warning"><AlertIcon />New uploads are not malware-scanned while the scanner is disabled.</Alert>}
        {data.scanner.enabled && !data.scanner.configured && <Alert status="error"><AlertIcon />Scanner configuration needs attention. New private uploads are blocked.</Alert>}
        <Text fontSize="sm">Applies to new private HRMS uploads. Existing files are not automatically rescanned.</Text>
        <HStack flexWrap="wrap" gap={3}><Button size="sm" leftIcon={<FiShield />} isLoading={checking} isDisabled={!data.scanner.configured || !data.scanner.enabled} onClick={check}>Check scanner connection</Button>{health && <Text fontSize="xs">Checked {new Date(health.checkedAt).toLocaleString()}</Text>}</HStack>
        <Text fontSize="xs" color="gray.500">A connection check does not scan files or verify signature freshness. Scanner settings are managed on the backend.</Text>
        {healthError && <Alert status="error"><AlertIcon />{healthError}</Alert>}
      </Stack>}
    </Box>
    <Box borderTopWidth="1px" pt={5}><HStack justify="space-between" mb={4}><Heading size="sm">Rejected upload history</Heading><IconButton aria-label="Refresh upload security history" title="Refresh upload security history" size="sm" isLoading={loadingEvents} icon={<FiRefreshCw />} onClick={() => setEventReload((n) => n + 1)} /></HStack>
      {eventsError && <Alert status="error" mb={3}><AlertIcon />{eventsError}</Alert>}
      <TableContainer borderWidth="1px" borderRadius="md" mb={3}><Table size="sm"><Thead><Tr><Th>Time</Th><Th>Uploaded by</Th><Th>Upload type</Th><Th>Result</Th></Tr></Thead><Tbody>
        {!events.data.length && <Tr><Td colSpan={4}>{loadingEvents ? "Loading security history..." : "No blocked or failed scans recorded."}</Td></Tr>}
        {events.data.map((event) => <Tr key={event._id}><Td>{new Date(event.createdAt).toLocaleString()}</Td><Td whiteSpace="normal" maxW="240px">{event.uploadedBy?.name || event.uploadedBy?.code || "Unknown user"}</Td><Td>{purpose[event.purpose] || event.purpose}</Td><Td><Badge colorScheme={event.outcome === "blocked" ? "red" : "orange"}>{event.outcome === "blocked" ? "Blocked" : "Scanner unavailable"}</Badge></Td></Tr>)}
      </Tbody></Table></TableContainer>
      <HStack justify="end"><IconButton aria-label="Previous security page" title="Previous security page" size="sm" icon={<FiChevronLeft />} isDisabled={page <= 1} onClick={() => setPage((n) => n - 1)} /><Text fontSize="sm">{page}/{events.pagination.totalPages}</Text><IconButton aria-label="Next security page" title="Next security page" size="sm" icon={<FiChevronRight />} isDisabled={page >= events.pagination.totalPages} onClick={() => setPage((n) => n + 1)} /></HStack>
    </Box>
    <OnboardingRetentionPanel key={accountKey} accountKey={accountKey} />
  </Stack>;
}
