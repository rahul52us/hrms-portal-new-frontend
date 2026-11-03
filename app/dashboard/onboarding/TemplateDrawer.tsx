"use client";

import { Alert, AlertIcon, Badge, Box, Button, Divider, Flex, FormControl, FormLabel, Heading, HStack, Input, Skeleton, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Textarea, useToast } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FiEdit2, FiPlus, FiSave } from "react-icons/fi";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import ConfirmationModal from "@/app/component/common/ConfirmationModal/ConfirmationModal";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { dueLabel, emptyPage, History, onboardingGet, onboardingSave, ownerLabels, Page, Template, TemplateContent } from "./onboardingApi";
import TemplateTaskEditor, { taskForm, TaskForm, taskPayload } from "./TemplateTaskEditor";

function Checklist({ content }: { content: TemplateContent }) {
  return <Stack spacing={4}><Text whiteSpace="pre-wrap" overflowWrap="anywhere" color="gray.500">{content.description}</Text>{!content.tasks.length && <Text color="gray.500">No tasks added.</Text>}{content.tasks.map((task, index) => <Box key={task._id || index} borderBottomWidth="1px" pb={4} minW={0}>
    <Flex gap={2} align="start" wrap="wrap"><Text fontWeight="700" overflowWrap="anywhere">{index + 1}. {task.title}</Text>{task.required && <Badge colorScheme="blue">Required</Badge>}{task.requiresDocument && <Badge colorScheme="cyan">Document</Badge>}</Flex>
    <Text fontSize="sm" mt={1}>{ownerLabels[task.owner]}{task.owner === "specific_user" ? `: ${task.ownerNameSnapshot || "Previously selected person"}` : ""} | {dueLabel(task.dueDays)}</Text>
    {task.instructions && <Text fontSize="sm" mt={2} whiteSpace="pre-wrap" overflowWrap="anywhere">{task.instructions}</Text>}
  </Box>)}</Stack>;
}
const actionLabels = { publish: "Publish version", "discard-draft": "Discard draft", archive: "Archive template", restore: "Restore template" };
type Action = keyof typeof actionLabels;
export default function TemplateDrawer({ templateId, canManage, onClose, onChanged }: { templateId?: string; canManage: boolean; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [template, setTemplate] = useState<Template | null>(null), [loading, setLoading] = useState(Boolean(templateId)), [saving, setSaving] = useState(false), [error, setError] = useState("");
  const [editing, setEditing] = useState(!templateId), [name, setName] = useState(""), [description, setDescription] = useState(""), [tasks, setTasks] = useState<TaskForm[]>([]), [reason, setReason] = useState("");
  const [tab, setTab] = useState(0), [history, setHistory] = useState<History[]>([]), [pagination, setPagination] = useState(emptyPage), [historyLoading, setHistoryLoading] = useState(false), [historyError, setHistoryError] = useState(""), [page, setPage] = useState(1);
  const [historyFor, setHistoryFor] = useState("");
  const historyKey = JSON.stringify([template?._id, template?.revision, tab, page]);
  const historyPending = historyLoading || historyFor !== historyKey;
  const [action, setAction] = useState<Action | null>(null), [confirm, setConfirm] = useState(false), [closeConfirm, setCloseConfirm] = useState(false);
  const [dirty, setDirty] = useState(false), [reload, setReload] = useState(0);
  const lookupId = templateId || template?._id;
  const attempt = useRef<{ signature: string; requestId: string } | null>(null);
  const requestId = (signature: string) => { if (attempt.current?.signature !== signature) attempt.current = { signature, requestId: crypto.randomUUID() }; return attempt.current.requestId; };
  useEffect(() => {
    if (!lookupId) return;
    const controller = new AbortController(); setLoading(true); setError("");
    onboardingGet<{ data: Template }>(`/templates/${lookupId}`, undefined, controller.signal)
      .then(({ data }) => { if (!controller.signal.aborted) setTemplate(data); })
      .catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Unable to load template")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [lookupId, reload]);
  useEffect(() => {
    if (!template || editing || tab === 0) return;
    const controller = new AbortController(); setHistory([]); setHistoryLoading(true); setHistoryError(""); setHistoryFor(historyKey);
    onboardingGet<Page<History>>(`/templates/${template._id}/${tab === 1 ? "versions" : "audit"}`, { page, limit: 10 }, controller.signal)
      .then((data) => { if (!controller.signal.aborted) { setHistory(data.data); setPagination(data.pagination); } })
      .catch((err) => { if (!controller.signal.aborted) setHistoryError(getApiErrorMessage(err?.response?.data || err, "Unable to load history")); })
      .finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [historyKey, editing]);
  const edit = () => { if (!template) return; setName(template.name); setDescription(template.description); setTasks(template.tasks.map(taskForm)); setReason(""); setAction(null); setError(""); setEditing(true); setDirty(false); };
  const changed = (fn: () => void) => { fn(); setDirty(true); };
  const save = async () => {
    setError("");
    try {
      if (name.trim().length < 2) throw new Error("Enter a template name with at least 2 characters.");
      if (template && reason.trim().length < 3) throw new Error("Enter a change reason with at least 3 characters.");
      const payload = { name: name.trim(), description: description.trim(), tasks: tasks.map(taskPayload), ...(template ? { revision: template.revision, reason: reason.trim() } : {}) };
      setSaving(true);
      const response = await onboardingSave(template ? `/templates/${template._id}` : "/templates", { ...payload, requestId: requestId(JSON.stringify(payload)) }, template ? "put" : "post");
      setTemplate(response.data); setEditing(false); setDirty(false); setReason(""); setTab(0); onChanged(); attempt.current = null;
      toast({ title: "Checklist draft saved", status: "success" });
    } catch (err: any) { const message = getApiErrorMessage(err?.response?.data || err, "Unable to save template"); setError(message); toast({ title: "Could not save draft", description: message, status: "error" }); } finally { setSaving(false); }
  };
  const runAction = async () => {
    if (!template || !action) return;
    setSaving(true); setError("");
    try {
      const payload = { revision: template.revision, reason: reason.trim() };
      const response = await onboardingSave(`/templates/${template._id}/${action}`, { ...payload, requestId: requestId(JSON.stringify({ action, ...payload })) });
      setTemplate(response.data); setAction(null); setConfirm(false); setReason(""); onChanged(); attempt.current = null;
      toast({ title: "Checklist template updated", status: "success" });
    } catch (err: any) { setConfirm(false); setError(getApiErrorMessage(err?.response?.data || err, "Unable to update template")); } finally { setSaving(false); }
  };
  const close = () => { if (saving) return; if (dirty) setCloseConfirm(true); else onClose(); };
  return <><DashboardDrawer isOpen onClose={close} maxW={{ base: "100%", lg: "850px" }} titlePrefix={editing ? template ? "Edit checklist" : "New checklist template" : "Checklist template"}
    footerContent={editing ? <Flex justify="space-between" w="100%" gap={3} wrap="wrap"><Button variant="ghost" isDisabled={saving} onClick={() => { if (dirty) setCloseConfirm(true); else if (template) setEditing(false); else onClose(); }}>Cancel</Button><Button colorScheme="blue" leftIcon={<FiSave />} isLoading={saving} onClick={save}>Save draft</Button></Flex> : undefined}>
    <Stack spacing={5} minW={0}>
      {error && <Alert status="error"><AlertIcon /><Text overflowWrap="anywhere">{error}</Text></Alert>}
      {loading ? <><Skeleton h="40px" /><Skeleton h="200px" /></> : editing ? <>
        <FormControl isRequired><FormLabel htmlFor="checklist-name">Template name</FormLabel><Input id="checklist-name" maxLength={120} value={name} isDisabled={saving} placeholder="Engineering new joiner" onChange={(e) => changed(() => setName(e.target.value))} /></FormControl>
        <FormControl><FormLabel htmlFor="checklist-description">Description</FormLabel><Textarea id="checklist-description" maxLength={2000} value={description} isDisabled={saving} onChange={(e) => changed(() => setDescription(e.target.value))} /></FormControl>
        <Divider /><Heading size="sm">Checklist tasks ({tasks.length}/100)</Heading>
        {tasks.map((task, index) => <TemplateTaskEditor key={task.key} task={task} index={index} count={tasks.length} disabled={saving} onChange={(value) => changed(() => setTasks((current) => current.map((item, i) => i === index ? value : item)))} onRemove={() => changed(() => setTasks((current) => current.filter((_, i) => i !== index)))} onMove={(offset) => changed(() => setTasks((current) => { const result = [...current]; [result[index], result[index + offset]] = [result[index + offset], result[index]]; return result; }))} />)}
        {!tasks.length && <Text color="gray.500">No tasks added.</Text>}
        <Button variant="outline" leftIcon={<FiPlus />} alignSelf="start" isDisabled={saving || tasks.length >= 100} onClick={() => changed(() => setTasks((current) => [...current, taskForm()]))}>Add task</Button>
        {template && <FormControl isRequired><FormLabel htmlFor="checklist-save-reason">Change reason</FormLabel><Textarea id="checklist-save-reason" minLength={3} maxLength={500} value={reason} isDisabled={saving} onChange={(e) => changed(() => setReason(e.target.value))} /></FormControl>}
      </> : template ? <>
        <Heading size="md" overflowWrap="anywhere">{template.name}</Heading><HStack wrap="wrap"><Badge colorScheme={template.status === "published" ? "green" : template.status === "draft" ? "yellow" : "gray"}>{template.status}</Badge><Text fontSize="sm">{template.publishedVersion ? `Published v${template.publishedVersion}` : "Not published"}</Text>{template.publishedVersion > 0 && template.hasDraft && <Badge colorScheme="yellow">Unpublished changes</Badge>}</HStack>
        {canManage && <HStack wrap="wrap">
          {template.status !== "archived" ? <><Button size="sm" variant="outline" leftIcon={<FiEdit2 />} onClick={edit} isDisabled={saving}>{template.hasDraft ? "Edit draft" : "Create new version"}</Button>{template.hasDraft && <Button size="sm" colorScheme="blue" isDisabled={saving || !template.tasks.length} onClick={() => { setAction("publish"); setReason(""); }}>Publish version</Button>}{template.hasDraft && template.publishedVersion > 0 && <Button size="sm" variant="outline" onClick={() => { setAction("discard-draft"); setReason(""); }}>Discard draft</Button>}<Button size="sm" variant="outline" onClick={() => { setAction("archive"); setReason(""); }}>Archive</Button></> : <Button size="sm" variant="outline" onClick={() => { setAction("restore"); setReason(""); }}>Restore</Button>}
          <Button size="sm" variant="ghost" isDisabled={saving} onClick={() => { setAction(null); setReload((n) => n + 1); }}>Reload</Button>
        </HStack>}
        {action && <Box borderTopWidth="1px" borderBottomWidth="1px" py={4}><Stack spacing={3}><Text fontWeight="700">{actionLabels[action]}</Text><FormControl isRequired><FormLabel htmlFor="checklist-action-reason">Reason</FormLabel><Textarea id="checklist-action-reason" maxLength={500} value={reason} isDisabled={saving} onChange={(e) => setReason(e.target.value)} /></FormControl><HStack><Button size="sm" variant="ghost" isDisabled={saving} onClick={() => setAction(null)}>Cancel</Button><Button size="sm" colorScheme="blue" isDisabled={reason.trim().length < 3 || saving} onClick={() => setConfirm(true)}>{actionLabels[action]}</Button></HStack></Stack></Box>}
        <Tabs index={tab} onChange={(value) => { setTab(value); setPage(1); }} isLazy><TabList overflowX="auto"><Tab flexShrink={0}>Checklist</Tab><Tab flexShrink={0}>Published versions</Tab><Tab flexShrink={0}>Activity</Tab></TabList><TabPanels>
          <TabPanel px={0}><Checklist content={template} /></TabPanel>
          {[1, 2].map((value) => <TabPanel key={value} px={0}>{historyError && !historyPending && <Alert status="error"><AlertIcon />{historyError}</Alert>}{historyPending ? <Skeleton h="120px" /> : <Stack spacing={5}>{history.map((entry) => <Box key={entry._id} borderBottomWidth="1px" pb={4}><Text fontWeight="700">{value === 1 ? `Version ${entry.version}` : ({ created: "Created", updated: "Draft updated", published: "Published", discarded: "Draft discarded", archived: "Archived", restored: "Restored" }[entry.action || ""] || entry.action)}</Text><Text fontSize="sm" color="gray.500">{new Date(entry.createdAt).toLocaleString("en-GB")} | {entry.actor?.name || entry.publishedBy?.name || "Former user"}</Text><Text mt={2} whiteSpace="pre-wrap" overflowWrap="anywhere">{entry.reason}</Text>{value === 1 && entry.content && <Box mt={4}><Heading size="sm" mb={3}>{entry.content.name}</Heading><Checklist content={entry.content} /></Box>}</Box>)}{!history.length && !historyError && <Text color="gray.500">{value === 1 ? "No published versions yet." : "No activity yet."}</Text>}{pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />}</Stack>}</TabPanel>)}
        </TabPanels></Tabs>
      </> : <Button onClick={() => setReload((n) => n + 1)}>Retry loading template</Button>}
    </Stack>
  </DashboardDrawer>
  <ConfirmationModal isOpen={confirm} onClose={() => { if (!saving) setConfirm(false); }} onConfirm={runAction} title={action ? actionLabels[action] : "Confirm change"} description={action === "publish" ? "Publish this saved draft as a new, read-only version? Existing versions remain unchanged." : action === "archive" ? "Archive this template? Its draft, published versions and history will be retained." : action === "discard-draft" ? "Replace the unpublished changes with the latest published checklist?" : "Make this template available again?"} isLoading={saving} confirmText="Confirm" />
  <ConfirmationModal isOpen={closeConfirm} onClose={() => setCloseConfirm(false)} onConfirm={() => { setCloseConfirm(false); onClose(); }} title="Discard unsaved changes?" description="Your unsaved checklist changes will be lost." confirmText="Discard changes" tone="warning" />
  </>;
}
