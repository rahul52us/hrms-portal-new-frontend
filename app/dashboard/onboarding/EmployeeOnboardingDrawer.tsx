"use client";
import axios from "axios";
import { Alert, AlertIcon, Badge, Box, Button, Divider, Flex, FormControl, FormLabel, HStack, Input, Skeleton, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Textarea, useToast } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import { FiDownload, FiRefreshCw } from "react-icons/fi";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import ConfirmationModal from "@/app/component/common/ConfirmationModal/ConfirmationModal";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { emptyPage, onboardingGet, onboardingSave, Page, Person } from "./onboardingApi";
import { EmployeeOnboarding, OnboardingTask } from "./employeeOnboardingApi";
import OnboardingTimezoneSelect from "./OnboardingTimezoneSelect";

const labels: Record<string, string> = { complete: "Complete task", approve: "Approve documents", return: "Return for correction", waive: "Waive task", reopen: "Reopen task", reassign: "Reassign task", cancel: "Cancel onboarding", reschedule: "Update joining deadlines", remove_document: "Remove document" };
export default function EmployeeOnboardingDrawer({ instanceId, onClose, onChanged }: { instanceId: string; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [instance, setInstance] = useState<EmployeeOnboarding | null>(null), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(""), [reload, setReload] = useState(0);
  const [tab, setTab] = useState(0), [history, setHistory] = useState<{ _id: string; action: string; actorName: string; reason: string; createdAt: string }[]>([]), [pagination, setPagination] = useState(emptyPage), [page, setPage] = useState(1), [historyFor, setHistoryFor] = useState("");
  const [action, setAction] = useState<{ name: string; task?: OnboardingTask; documentId?: string } | null>(null), [reason, setReason] = useState(""), [assignees, setAssignees] = useState<{ value: string; label: string }[]>([]), [timezone, setTimezone] = useState(""), [confirm, setConfirm] = useState(false);
  const attempt = useRef<{ signature: string; id: string } | null>(null);
  const actionEditor = useRef<HTMLDivElement>(null);
  const success = (title: string) => {
    const options = { title, status: "success" as const, duration: 2000 };
    if (toast.isActive("employee-onboarding-result")) toast.update("employee-onboarding-result", options);
    else toast({ ...options, id: "employee-onboarding-result" });
  };
  useEffect(() => { if (action) actionEditor.current?.scrollIntoView({ block: "start", behavior: "smooth" }); }, [action?.name, action?.task?._id, action?.documentId]);
  const historyKey = `${instance?.revision}:${page}:${tab}`;
  const requestId = (signature: string) => { if (attempt.current?.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() }; return attempt.current.id; };
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    onboardingGet<{ data: EmployeeOnboarding }>(`/instances/${instanceId}`, undefined, controller.signal).then(({ data }) => { if (!controller.signal.aborted) setInstance(data); })
      .catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Unable to load onboarding checklist")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [instanceId, reload]);
  useEffect(() => {
    if (!instance || tab !== 1) return;
    const controller = new AbortController();
    onboardingGet<Page<typeof history[number]>>(`/instances/${instanceId}/audit`, { page, limit: 10 }, controller.signal).then((data) => { if (!controller.signal.aborted) { setHistory(data.data); setPagination(data.pagination); setHistoryFor(historyKey); } })
      .catch((err) => { if (!controller.signal.aborted) { setHistory([]); setHistoryFor(historyKey); setError(getApiErrorMessage(err)); } });
    return () => controller.abort();
  }, [instanceId, historyKey]);
  const choose = (name: string, task?: OnboardingTask) => { setAction({ name, task }); setReason(""); setAssignees([]); setTimezone(instance?.timezone || ""); setError(""); };
  const execute = async () => {
    if (!instance || !action) return;
    setSaving(true); setError("");
    const payload = { action: action.name, reason: reason.trim(), revision: instance.revision, ...(action.documentId ? { documentId: action.documentId } : {}), ...(action.name === "reassign" ? { assigneeIds: assignees.map((person) => person.value) } : {}), ...(action.name === "reschedule" ? { timezone } : {}) };
    const path = `/instances/${instanceId}${action.task ? `/tasks/${action.task._id}` : ""}/actions`;
    try {
      const response = await onboardingSave<EmployeeOnboarding>(path, { ...payload, requestId: requestId(JSON.stringify({ path, ...payload })) });
      setInstance(response.data); setAction(null); setConfirm(false); attempt.current = null; onChanged(); success("Onboarding updated");
    } catch (err: any) { setConfirm(false); setError(getApiErrorMessage(err?.response?.data || err, "Unable to update onboarding")); } finally { setSaving(false); }
  };
  const upload = async (task: OnboardingTask, file?: File) => {
    if (!file || !instance) return;
    if (file.size > 5 * 1024 * 1024) { setError("Document must be 5 MB or smaller."); return; }
    setSaving(true); setError("");
    const form = new FormData(), path = `/instances/${instanceId}/tasks/${task._id}/documents`;
    form.append("file", file); form.append("revision", String(instance.revision)); form.append("requestId", requestId(`${path}:${instance.revision}:${file.name}:${file.size}:${file.lastModified}`));
    try { const response = await axios.post(`/onboarding${path}`, form, { headers: { "Content-Type": "multipart/form-data" } }); setInstance(response.data.data); attempt.current = null; onChanged(); success("Document uploaded"); }
    catch (err: any) { setError(getApiErrorMessage(err?.response?.data || err, "Unable to upload document")); } finally { setSaving(false); }
  };
  const download = async (task: OnboardingTask, document: OnboardingTask["documents"][number]) => {
    try {
      const response = await axios.get(`/onboarding/instances/${instanceId}/tasks/${task._id}/documents/${document.document}`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data), link = window.document.createElement("a"); link.href = url; link.download = document.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError("Could not download this document. Reload and check your access."); }
  };
  const people = async (search: string) => (await onboardingGet<Page<Person>>("/owners", { employeeId: instance?.employee._id, search: search || undefined, limit: 20 })).data.map((person) => ({ value: person._id, label: `${person.name} (${person.code})` }));
  return <><DashboardDrawer isOpen onClose={() => { if (!saving) onClose(); }} titlePrefix="Employee onboarding" maxW={{ base: "100%", lg: "900px" }}><Stack spacing={5} minW={0}>
    {error && <Alert status="error"><AlertIcon /><Text overflowWrap="anywhere">{error}</Text></Alert>}
    {loading ? <><Skeleton h="40px" /><Skeleton h="200px" /></> : instance ? <>
      <Flex justify="space-between" wrap="wrap" gap={3}><Box minW={0}><Text fontSize="lg" fontWeight="700" overflowWrap="anywhere">{instance.employee.name}</Text><Text fontSize="sm" color="gray.500">{instance.employee.code}</Text></Box><HStack flexWrap="wrap"><Badge colorScheme={instance.status === "completed" ? "green" : instance.status === "cancelled" ? "gray" : "blue"}>{instance.status}</Badge><Button size="sm" variant="outline" leftIcon={<FiRefreshCw />} isDisabled={saving} onClick={() => { setAction(null); setReload((n) => n + 1); }}>Reload checklist</Button></HStack></Flex>
      <Box><Text fontWeight="600" overflowWrap="anywhere">{instance.templateName} | v{instance.versionNumber}</Text><Text fontSize="sm" mt={1}>Joining {instance.joiningDate} | {instance.timezone}</Text><Text fontSize="sm" mt={1}>Required tasks: {instance.progress.requiredDone}/{instance.progress.required} | All tasks: {instance.progress.done}/{instance.progress.total}</Text></Box>
      {instance.joiningDateChanged && <Alert status="warning"><AlertIcon />The employee's joining date changed. HR can update unfinished task deadlines.</Alert>}
      {instance.status === "completed" && <Text fontSize="sm" color="green.600">Required onboarding work is complete. Optional tasks may remain.</Text>}
      {instance.canManage && <HStack wrap="wrap">{instance.canReschedule && <Button size="sm" variant="outline" isDisabled={saving} onClick={() => choose("reschedule")}>Update joining deadlines</Button>}{instance.canCancel && <Button size="sm" variant="outline" colorScheme="red" isDisabled={saving} onClick={() => choose("cancel")}>Cancel onboarding</Button>}</HStack>}
      {action && <Box ref={actionEditor} data-onboarding-action borderWidth="1px" borderRadius="md" p={4}><Stack spacing={4}><Text fontWeight="700">{labels[action.name]}{action.task ? `: ${action.task.title}` : ""}</Text>
        {action.name === "reassign" && <FormControl isRequired><FormLabel htmlFor="onboarding-action-owners">New task owners</FormLabel><AsyncSelect inputId="onboarding-action-owners" isMulti defaultOptions loadOptions={people} value={assignees} onChange={(value) => setAssignees([...value])} isDisabled={saving} /></FormControl>}
        {action.name === "reschedule" && <><Text fontSize="sm">Uses the employee's current joining date: {instance.employee.joiningDate?.slice(0, 10) || "Not set"}. Completed and waived task dates are retained.</Text><FormControl isRequired><FormLabel htmlFor="onboarding-action-timezone">Deadline timezone</FormLabel><OnboardingTimezoneSelect id="onboarding-action-timezone" value={timezone} disabled={saving} onChange={setTimezone} /></FormControl></>}
        <FormControl isRequired><FormLabel htmlFor="onboarding-action-reason">{action.name === "complete" ? "Completion note" : "Reason"}</FormLabel><Textarea id="onboarding-action-reason" maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} isDisabled={saving} /></FormControl>
        <HStack><Button size="sm" variant="ghost" isDisabled={saving} onClick={() => setAction(null)}>Cancel action</Button><Button size="sm" colorScheme="blue" isDisabled={saving || reason.trim().length < 3 || action.name === "reassign" && (!assignees.length || assignees.length > 20)} onClick={() => setConfirm(true)}>{labels[action.name]}</Button></HStack>
      </Stack></Box>}
      <Tabs index={tab} onChange={(value) => { setTab(value); setPage(1); }} isLazy><TabList><Tab>Tasks</Tab><Tab>Activity</Tab></TabList><TabPanels><TabPanel px={0}><Stack spacing={5}>
        {!instance.tasks.length && <Text color="gray.500">No tasks in this checklist are assigned to you. Overall progress is shown above.</Text>}
        {instance.tasks.map((task) => <Box key={task._id} borderBottomWidth="1px" pb={5} minW={0} data-task-title={task.title}><Stack spacing={3}>
          <Flex gap={2} wrap="wrap" align="start"><Text fontWeight="700" overflowWrap="anywhere">{task.title}</Text><Badge colorScheme={task.status === "completed" ? "green" : task.status === "blocked" ? "red" : "gray"}>{task.status.replaceAll("_", " ")}</Badge>{task.required && <Badge colorScheme="blue">Required</Badge>}{task.requiresDocument && <Badge colorScheme="cyan">Document</Badge>}{task.overdue && instance.status !== "cancelled" && <Badge colorScheme="yellow">Overdue</Badge>}</Flex>
          <Text fontSize="sm">Owner: {task.assignees.map((person) => person.name).join(", ") || "Unassigned"} | Due {task.dueDate}</Text>
          {task.instructions && <Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{task.instructions}</Text>}
          {task.ownerIssue && <Alert status="warning"><AlertIcon />{task.ownerIssue}</Alert>}
          {task.completionNote && <Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">Completion note: {task.completionNote}</Text>}
          {task.documents.map((document) => <Flex key={document.document} gap={2} wrap="wrap" justify="space-between" align="center"><Text fontSize="sm" minW={0} overflowWrap="anywhere">{document.name} ({Math.ceil(document.size / 1024)} KB)</Text><HStack><Button size="xs" variant="outline" leftIcon={<FiDownload />} onClick={() => void download(task, document)}>Download document</Button>{task.canRemoveDocument && <Button size="xs" variant="ghost" colorScheme="red" isDisabled={saving} onClick={() => { choose("remove_document", task); setAction({ name: "remove_document", task, documentId: document.document }); }}>Remove document</Button>}</HStack></Flex>)}
          {task.canUpload && <FormControl><FormLabel htmlFor={`onboarding-document-${task._id}`}>Supporting document</FormLabel><Input id={`onboarding-document-${task._id}`} type="file" accept="application/pdf,image/jpeg,image/png" p={1} isDisabled={saving} onChange={(e) => { void upload(task, e.target.files?.[0]); e.target.value = ""; }} /><Text mt={1} fontSize="xs" color="gray.500">PDF, JPG or PNG, up to 5 MB. {task.documents.length}/5 files.</Text></FormControl>}
          <Flex gap={2} wrap="wrap">{task.canComplete && <Button size="sm" colorScheme="blue" isDisabled={saving || task.requiresDocument && !task.documents.length} onClick={() => choose("complete", task)}>{task.requiresDocument ? "Submit for review" : "Complete task"}</Button>}{task.canReview && <><Button size="sm" colorScheme="green" isDisabled={saving} onClick={() => choose("approve", task)}>Approve documents</Button><Button size="sm" variant="outline" isDisabled={saving} onClick={() => choose("return", task)}>Return for correction</Button></>}{task.canReassign && <Button size="sm" variant="outline" isDisabled={saving} onClick={() => choose("reassign", task)}>Reassign</Button>}{task.canWaive && <Button size="sm" variant="outline" isDisabled={saving} onClick={() => choose("waive", task)}>Waive</Button>}{task.canReopen && <Button size="sm" variant="outline" isDisabled={saving} onClick={() => choose("reopen", task)}>Reopen</Button>}</Flex>
        </Stack></Box>)}
      </Stack></TabPanel><TabPanel px={0}>{historyFor !== historyKey ? <Skeleton h="120px" /> : <Stack spacing={4}>{history.map((event) => <Box key={event._id}><Text fontWeight="600">{event.action.replaceAll("_", " ")}</Text><Text fontSize="xs" color="gray.500">{event.actorName} | {new Date(event.createdAt).toLocaleString("en-GB")}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{event.reason}</Text><Divider mt={3} /></Box>)}{pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />}</Stack>}</TabPanel></TabPanels></Tabs>
    </> : <Button onClick={() => setReload((n) => n + 1)}>Retry loading checklist</Button>}
  </Stack></DashboardDrawer>
  <ConfirmationModal isOpen={confirm} onClose={() => { if (!saving) setConfirm(false); }} onConfirm={execute} isLoading={saving} title={action ? labels[action.name] : "Confirm action"} description={action?.name === "cancel" ? "Cancel this employee's checklist? Existing tasks, documents and history are retained." : action?.name === "waive" ? "Waive this task with the recorded reason? This counts toward required-task completion." : "Apply this change and record it in onboarding history?"} confirmText="Confirm" />
  </>;
}
