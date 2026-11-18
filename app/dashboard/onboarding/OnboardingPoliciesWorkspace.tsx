"use client";
import { Alert, AlertIcon, Badge, Box, Button, FormControl, FormLabel, Heading, HStack, Input, Select, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Textarea, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FiPlus, FiRefreshCw, FiSave } from "react-icons/fi";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import ConfirmationModal from "@/app/component/common/ConfirmationModal/ConfirmationModal";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { emptyPage, onboardingGet, onboardingSave, Page } from "./onboardingApi";

type Content = { name: string; description: string; body: string; acknowledgementText: string };
type Policy = Content & { _id: string; status: string; revision: number; publishedVersion: number; hasDraft: boolean };
type Version = { _id: string; version: number; content: Content; reason: string; createdAt: string };
type VersionSummary = Omit<Version, "content"> & { content: Pick<Content, "name"> };
type Activity = { _id: string; actorName: string; action: string; reason: string; createdAt: string };
const blank = (): Content => ({ name: "", description: "", body: "", acknowledgementText: "I confirm that I have read and understood this policy." });
const actions: Record<string, string> = { publish: "Publish version", "discard-draft": "Discard draft", archive: "Archive policy", restore: "Restore policy" };

function PolicyDrawer({ id, canManage, onClose, onChanged }: { id?: string; canManage: boolean; onClose: () => void; onChanged: () => void }) {
  const [policy, setPolicy] = useState<Policy | null>(null), [content, setContent] = useState<Content>(blank), [editing, setEditing] = useState(!id), [dirty, setDirty] = useState(false), [closeConfirm, setCloseConfirm] = useState(false);
  const [loading, setLoading] = useState(Boolean(id)), [busy, setBusy] = useState(false), [error, setError] = useState(""), [reload, setReload] = useState(0), [reason, setReason] = useState(""), [action, setAction] = useState("");
  const [versions, setVersions] = useState<Page<VersionSummary>>({ data: [], pagination: emptyPage }), [versionPage, setVersionPage] = useState(1), [audit, setAudit] = useState<Page<Activity>>({ data: [], pagination: emptyPage }), [auditPage, setAuditPage] = useState(1);
  const [published, setPublished] = useState<Version | null>(null), [reading, setReading] = useState(false), [historyLoading, setHistoryLoading] = useState(false);
  const intent = useRef<{ signature: string; requestId: string } | null>(null);
  const target = id || policy?._id;
  useEffect(() => {
    if (!target) return;
    const controller = new AbortController(); setLoading(true); setError("");
    onboardingGet<{ data: Policy }>(`/policies/${target}`, undefined, controller.signal).then(({ data }) => { if (!controller.signal.aborted) setPolicy(data); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [target, reload]);
  useEffect(() => {
    if (!target || editing) return;
    const controller = new AbortController(); setHistoryLoading(true);
    const load = async () => {
      try {
        const history = await onboardingGet<Page<VersionSummary>>(`/policies/${target}/versions`, { page: versionPage, limit: 10 }, controller.signal);
        const events = await onboardingGet<Page<Activity>>(`/policies/${target}/audit`, { page: auditPage, limit: 10 }, controller.signal);
        if (!controller.signal.aborted) { setVersions(history); setAudit(events); }
      } catch (err) { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }
      finally { if (!controller.signal.aborted) setHistoryLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [target, policy?.revision, editing, versionPage, auditPage]);
  const change = (key: keyof Content, value: string) => { setContent((current) => ({ ...current, [key]: value })); setDirty(true); };
  const edit = () => { if (!policy) return; setContent({ name: policy.name, description: policy.description, body: policy.body, acknowledgementText: policy.acknowledgementText }); setEditing(true); setReason(""); setAction(""); setError(""); };
  const close = () => { if (busy || reading) return; if (dirty) setCloseConfirm(true); else onClose(); };
  const save = async (command = "") => {
    if (busy || !canManage) return;
    const path = command ? `/policies/${target}/${command}` : target ? `/policies/${target}` : "/policies";
    const payload = { ...(!command ? content : {}), ...(policy ? { revision: policy.revision, reason: reason.trim() } : {}) };
    const signature = JSON.stringify({ path, payload });
    if (intent.current?.signature !== signature) intent.current = { signature, requestId: crypto.randomUUID() };
    setBusy(true); setError("");
    try {
      const response = await onboardingSave<Policy>(path, { ...payload, requestId: intent.current.requestId }, !command && target ? "put" : "post");
      setPolicy(response.data); setEditing(false); setDirty(false); setAction(""); setReason(""); setPublished(null); intent.current = null; onChanged();
    } catch (err) { setError(getApiErrorMessage(err)); }
    finally { setBusy(false); }
  };
  const readVersion = async (version: VersionSummary) => {
    setReading(true); setError("");
    try { setPublished((await onboardingGet<{ data: Version }>(`/policies/${target}/versions/${version._id}`)).data); }
    catch (err) { setError(getApiErrorMessage(err)); }
    finally { setReading(false); }
  };
  const valid = content.name.trim().length >= 2 && content.body.trim().length >= 20 && content.acknowledgementText.trim().length >= 10 && (!policy || reason.trim().length >= 3);
  return <><DashboardDrawer isOpen onClose={close} titlePrefix={editing ? policy ? "Edit policy draft" : "New onboarding policy" : "Onboarding policy"} maxW={{ base: "100%", lg: "850px" }} footerContent={editing ? <HStack w="100%" justify="end"><Button variant="ghost" isDisabled={busy} onClick={close}>Close</Button><Button colorScheme="blue" leftIcon={<FiSave />} isLoading={busy} isDisabled={!valid} onClick={() => void save()}>Save draft</Button></HStack> : undefined}>
    <Stack spacing={5} minW={0}>
      {error && <Alert status="error"><AlertIcon />{error}</Alert>}
      {loading ? <Skeleton h="200px" /> : editing ? <>
        <FormControl isRequired><FormLabel htmlFor="onboarding-policy-name">Policy name</FormLabel><Input id="onboarding-policy-name" value={content.name} maxLength={150} isDisabled={busy} onChange={(event) => change("name", event.target.value)} /></FormControl>
        <FormControl><FormLabel htmlFor="onboarding-policy-description">Summary</FormLabel><Textarea id="onboarding-policy-description" value={content.description} maxLength={2000} isDisabled={busy} onChange={(event) => change("description", event.target.value)} /></FormControl>
        <FormControl isRequired><FormLabel htmlFor="onboarding-policy-body">Policy text</FormLabel><Textarea id="onboarding-policy-body" value={content.body} rows={14} maxLength={40000} isDisabled={busy} onChange={(event) => change("body", event.target.value)} /></FormControl>
        <FormControl isRequired><FormLabel htmlFor="onboarding-policy-statement">Employee acknowledgement statement</FormLabel><Textarea id="onboarding-policy-statement" value={content.acknowledgementText} maxLength={1000} isDisabled={busy} onChange={(event) => change("acknowledgementText", event.target.value)} /></FormControl>
        {policy && <FormControl isRequired><FormLabel htmlFor="onboarding-policy-save-reason">Change reason</FormLabel><Textarea id="onboarding-policy-save-reason" value={reason} maxLength={1000} isDisabled={busy} onChange={(event) => { setReason(event.target.value); setDirty(true); }} /></FormControl>}
      </> : policy ? <>
        <Heading size="md" overflowWrap="anywhere">{policy.name}</Heading><HStack flexWrap="wrap"><Badge colorScheme={policy.status === "published" ? "green" : "gray"}>{policy.status}</Badge>{policy.publishedVersion > 0 && <Badge>Published v{policy.publishedVersion}</Badge>}{policy.hasDraft && <Badge colorScheme="yellow">Unpublished draft</Badge>}</HStack>
        <HStack flexWrap="wrap" gap={3}>{canManage && <>{policy.status === "archived" ? <Button size="sm" onClick={() => { setAction("restore"); setReason(""); }}>Restore</Button> : <><Button size="sm" variant="outline" isDisabled={busy || reading} onClick={edit}>{policy.hasDraft ? "Edit draft" : "Create new version"}</Button>{policy.hasDraft && <Button size="sm" colorScheme="blue" onClick={() => { setAction("publish"); setReason(""); }}>Publish version</Button>}{policy.hasDraft && policy.publishedVersion > 0 && <Button size="sm" variant="outline" onClick={() => { setAction("discard-draft"); setReason(""); }}>Discard draft</Button>}<Button size="sm" variant="outline" onClick={() => { setAction("archive"); setReason(""); }}>Archive</Button></>}</>}<Button size="sm" variant="ghost" isDisabled={busy || reading} onClick={() => { setPublished(null); setAction(""); setReload((value) => value + 1); }}>Reload</Button></HStack>
        {action && <Box borderTopWidth="1px" borderBottomWidth="1px" py={4}><Stack spacing={3}><Text fontWeight="700">{actions[action]}</Text>{action === "publish" && <Alert status="info"><AlertIcon />Existing checklist tasks keep their pinned version. Update and publish the checklist separately to use the new policy.</Alert>}<FormControl isRequired><FormLabel htmlFor="onboarding-policy-action-reason">Reason</FormLabel><Textarea id="onboarding-policy-action-reason" value={reason} isDisabled={busy} maxLength={1000} onChange={(event) => setReason(event.target.value)} /></FormControl><HStack><Button size="sm" variant="ghost" isDisabled={busy} onClick={() => setAction("")}>Cancel</Button><Button size="sm" colorScheme="blue" isLoading={busy} isDisabled={reason.trim().length < 3} onClick={() => void save(action)}>{actions[action]}</Button></HStack></Stack></Box>}
        <Box><Heading size="sm" mb={3}>{policy.hasDraft ? "Saved draft" : "Current policy text"}</Heading><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{policy.description}</Text><Text mt={3} fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{policy.body}</Text><Text fontWeight="600" fontSize="sm" mt={4}>Acknowledgement statement</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{policy.acknowledgementText}</Text></Box>
        <Box borderTopWidth="1px" pt={4}><Heading size="sm" mb={3}>Published versions</Heading>{historyLoading ? <Skeleton h="70px" /> : !versions.data.length ? <Text fontSize="sm">No published versions.</Text> : <Stack spacing={3}>{versions.data.map((version) => <HStack key={version._id} justify="space-between" flexWrap="wrap"><Box><Text fontWeight="600" fontSize="sm">{version.content.name} | v{version.version}</Text><Text fontSize="xs">{new Date(version.createdAt).toLocaleString()}</Text><Text fontSize="sm" overflowWrap="anywhere">{version.reason}</Text></Box><Button size="xs" variant="outline" isLoading={reading} isDisabled={busy} onClick={() => void readVersion(version)}>Read version</Button></HStack>)}</Stack>}{versions.pagination.totalPages > 1 && <Pagination currentPage={versionPage} totalPages={versions.pagination.totalPages} onPageChange={setVersionPage} />}</Box>
        {published && <Box borderTopWidth="1px" pt={4}><HStack justify="space-between"><Heading size="sm">{published.content.name} | v{published.version}</Heading><Button size="xs" variant="ghost" onClick={() => setPublished(null)}>Hide</Button></HStack><Text mt={3} fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{published.content.description}</Text><Text mt={3} fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{published.content.body}</Text><Text mt={4} fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{published.content.acknowledgementText}</Text></Box>}
        <Box borderTopWidth="1px" pt={4}><Heading size="sm" mb={3}>Activity</Heading>{historyLoading ? <Skeleton h="70px" /> : <Stack spacing={3}>{audit.data.map((event) => <Box key={event._id}><Text fontSize="sm" fontWeight="600">{event.action}</Text><Text fontSize="xs">{event.actorName} | {new Date(event.createdAt).toLocaleString()}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{event.reason}</Text></Box>)}</Stack>}{audit.pagination.totalPages > 1 && <Pagination currentPage={auditPage} totalPages={audit.pagination.totalPages} onPageChange={setAuditPage} />}</Box>
      </> : <Button onClick={() => setReload((value) => value + 1)}>Reload policy</Button>}
    </Stack>
  </DashboardDrawer><ConfirmationModal isOpen={closeConfirm} onClose={() => setCloseConfirm(false)} onConfirm={onClose} title="Discard unsaved policy changes?" description="Your unsaved policy text will be lost." confirmText="Discard changes" tone="warning" /></>;
}

export default function OnboardingPoliciesWorkspace() {
  const [rows, setRows] = useState<Page<Policy>>({ data: [], pagination: emptyPage }), [canManage, setCanManage] = useState(false), [page, setPage] = useState(1), [search, setSearch] = useState(""), [query, setQuery] = useState(""), [status, setStatus] = useState("all"), [reload, setReload] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [opened, setOpened] = useState<{ id?: string } | null>(null);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    onboardingGet<Page<Policy> & { canManage: boolean }>("/policies", { page, limit: 20, status, search: query || undefined }, controller.signal).then((response) => { if (!controller.signal.aborted) { setRows(response); setCanManage(response.canManage); } }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, status, query, reload]);
  return <Stack spacing={5} minW={0}><HStack justify="space-between" flexWrap="wrap" gap={3}><Heading size="md">Policy library</Heading><HStack><Button size="sm" variant="outline" leftIcon={<FiRefreshCw />} isLoading={loading} onClick={() => setReload((value) => value + 1)}>Reload</Button>{canManage && <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={() => setOpened({})}>New policy</Button>}</HStack></HStack>
    <HStack flexWrap="wrap" gap={3}><Input aria-label="Search onboarding policies" placeholder="Search policies" value={search} maxW="400px" onChange={(event) => setSearch(event.target.value)} /><Select aria-label="Policy status" value={status} maxW="200px" onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></HStack>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    <TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr><Th>Policy</Th><Th>Status</Th><Th>Published version</Th><Th /></Tr></Thead><Tbody>{!rows.data.length && <Tr><Td colSpan={4}>{loading ? "Loading policies..." : "No policies found."}</Td></Tr>}{rows.data.map((policy) => <Tr key={policy._id}><Td whiteSpace="normal" minW="180px"><Text fontWeight="600">{policy.name}</Text><Text fontSize="xs" overflowWrap="anywhere">{policy.description}</Text></Td><Td><Badge colorScheme={policy.status === "published" ? "green" : "gray"}>{policy.status}</Badge>{policy.hasDraft && <Text fontSize="xs">Unpublished draft</Text>}</Td><Td>{policy.publishedVersion ? `v${policy.publishedVersion}` : "Not published"}</Td><Td><Button size="sm" variant="outline" onClick={() => setOpened({ id: policy._id })}>Open</Button></Td></Tr>)}</Tbody></Table></TableContainer>
    {rows.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={rows.pagination.totalPages} onPageChange={setPage} />}
    {opened && <PolicyDrawer key={opened.id || "new"} id={opened.id} canManage={canManage} onClose={() => setOpened(null)} onChanged={() => setReload((value) => value + 1)} />}
  </Stack>;
}
