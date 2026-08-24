"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { hasPermission, PERMISSION_KEYS } from "@/app/config/utils/permissions";
import stores from "@/app/store/stores";
import {
  RemoteWorkRequest,
  actOnRemoteWorkRequest,
  fetchRemoteWorkEligibility,
  fetchRemoteWorkRequests,
  previewRemoteWorkRequest,
  submitRemoteWorkRequest,
} from "./remoteWorkApi";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheck, FiClock, FiPlus, FiRefreshCw, FiWifi, FiX } from "react-icons/fi";

const localToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const initialForm = () => ({ fromDate: localToday(), toDate: localToday(), portion: "full", reason: "" });
const statusColor = (status: string) => ({
  submitted: "orange",
  manager_approved: "purple",
  approved: "green",
  rejected: "red",
  withdrawn: "gray",
  cancelled: "gray",
}[status] || "gray");
const formatStatus = (value: string) => value.replaceAll("_", " ");
const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));

const RequestList = ({ items, mode, onOpen, onWithdraw, muted, border }: {
  items: RemoteWorkRequest[];
  mode: "mine" | "approvals" | "company";
  onOpen: (request: RemoteWorkRequest) => void;
  onWithdraw: (request: RemoteWorkRequest) => void;
  muted: string;
  border: string;
}) => (
  <Stack spacing={0} borderWidth={items.length ? "1px" : "0"} borderColor={border} borderRadius="md" overflow="hidden">
    {!items.length ? <Text py={12} textAlign="center" color={muted}>No WFH requests in this view.</Text> : items.map((request, index) => (
      <Flex key={request._id} direction={{ base: "column", lg: "row" }} justify="space-between" align={{ lg: "center" }} gap={3} p={4} borderBottomWidth={index === items.length - 1 ? "0" : "1px"}>
        <Box minW={0}>
          <HStack flexWrap="wrap">
            {mode !== "mine" ? <Text fontWeight="800">{request.employee?.name || request.employeeNameSnapshot}</Text> : <Text fontWeight="800">Work from home</Text>}
            <Badge colorScheme={statusColor(request.status)} textTransform="capitalize">{formatStatus(request.status)}</Badge>
            <Badge variant="outline">{request.requestedUnits} {request.requestedUnits === 1 ? "day" : "days"}</Badge>
          </HStack>
          <Text mt={1} fontSize="sm">{formatDate(request.fromDate)}{request.fromDate !== request.toDate ? ` to ${formatDate(request.toDate)}` : ""}</Text>
          <Text mt={1} fontSize="xs" color={muted} noOfLines={2}>{request.reason || "No reason"} | {request.remoteWorkPolicy?.name || "WFH policy"} via {request.policyScopeNameSnapshot || "assigned scope"}</Text>
        </Box>
        <HStack>
          {mode === "mine" && ["submitted", "manager_approved"].includes(request.status) ? <Button size="sm" variant="outline" colorScheme="red" onClick={() => onWithdraw(request)}>Withdraw</Button> : null}
          <Button size="sm" variant={mode === "approvals" ? "solid" : "outline"} colorScheme={mode === "approvals" ? "blue" : "gray"} onClick={() => onOpen(request)}>{mode === "approvals" ? "Review" : "Details"}</Button>
        </HStack>
      </Flex>
    ))}
  </Stack>
);

type RemoteWorkWorkspaceProps = {
  embedded?: boolean;
};

const RemoteWorkWorkspace = observer(function RemoteWorkWorkspace({ embedded = false }: RemoteWorkWorkspaceProps) {
  const { auth } = stores;
  const toast = useToast();
  const requestDrawer = useDisclosure();
  const detailDrawer = useDisclosure();
  const surface = useColorModeValue("white", "gray.800");
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const canViewCompany = hasPermission(auth.user, PERMISSION_KEYS.VIEW_REMOTE_WORK_REQUESTS);
  const canApprove = hasPermission(auth.user, PERMISSION_KEYS.APPROVE_REMOTE_WORK_REQUESTS);
  const canManage = hasPermission(auth.user, PERMISSION_KEYS.MANAGE_REMOTE_WORK_REQUESTS);
  const [mine, setMine] = useState<RemoteWorkRequest[]>([]);
  const [approvals, setApprovals] = useState<RemoteWorkRequest[]>([]);
  const [company, setCompany] = useState<RemoteWorkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [eligibility, setEligibility] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [selected, setSelected] = useState<RemoteWorkRequest | null>(null);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mineResult, approvalResult, companyResult] = await Promise.all([
        fetchRemoteWorkRequests({ scope: "mine", page: 1, limit: 50 }),
        fetchRemoteWorkRequests({ scope: "approvals", page: 1, limit: 50 }).catch(() => ({ items: [], pagination: null })),
        canViewCompany ? fetchRemoteWorkRequests({ scope: "company", page: 1, limit: 50 }) : Promise.resolve({ items: [], pagination: null }),
      ]);
      setMine(mineResult.items);
      setApprovals(approvalResult.items);
      setCompany(companyResult.items);
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not load WFH requests"), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [canViewCompany, toast]);

  useEffect(() => { load(); }, [load]);
  const showApprovals = canApprove || approvals.length > 0;
  const canReviewSelected = Boolean(
    selected &&
    String(selected.employee?._id || selected.employee || "") !== String(auth.user?._id || "") &&
    (canApprove || String(selected.approver?._id || selected.approver || "") === String(auth.user?._id || ""))
  );

  const openRequest = async () => {
    const next = initialForm();
    setForm(next);
    setPreview(null);
    setEligibility(null);
    requestDrawer.onOpen();
    try {
      setEligibility(await fetchRemoteWorkEligibility({ date: next.fromDate }));
    } catch (error: any) {
      setEligibility({ error: getApiErrorMessage(error?.response?.data || error, "No WFH policy is assigned") });
    }
  };

  const updateStartDate = async (value: string) => {
    setForm((current) => ({ ...current, fromDate: value, toDate: current.toDate < value ? value : current.toDate, portion: current.toDate !== value ? "full" : current.portion }));
    setPreview(null);
    setEligibility(null);
    try {
      setEligibility(await fetchRemoteWorkEligibility({ date: value }));
    } catch (error: any) {
      setEligibility({ error: getApiErrorMessage(error?.response?.data || error, "No WFH policy is assigned") });
    }
  };

  const payload = () => ({ ...form, reason: form.reason.trim() });
  const review = async () => {
    setSubmitting(true);
    try {
      setPreview(await previewRemoteWorkRequest(payload()));
    } catch (error: any) {
      setPreview(null);
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not validate WFH request"), status: "error", duration: 5000 });
    } finally { setSubmitting(false); }
  };
  const submit = async () => {
    setSubmitting(true);
    try {
      await submitRemoteWorkRequest(payload());
      toast({ title: "WFH request submitted", status: "success" });
      requestDrawer.onClose();
      await load();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not submit WFH request"), status: "error", duration: 5000 });
    } finally { setSubmitting(false); }
  };
  const openDetails = (request: RemoteWorkRequest) => { setSelected(request); setComment(""); detailDrawer.onOpen(); };
  const act = async (action: "approve" | "reject" | "withdraw" | "cancel", request = selected) => {
    if (!request) return;
    if (["reject", "cancel"].includes(action) && !comment.trim()) {
      toast({ title: `${action === "reject" ? "Rejection" : "Cancellation"} reason is required`, status: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      await actOnRemoteWorkRequest(request._id, action, { comment: comment.trim() || undefined });
      toast({ title: `WFH request ${action === "approve" ? "approved" : action === "withdraw" ? "withdrawn" : `${action}ed`}`, status: "success" });
      detailDrawer.onClose();
      await load();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error), status: "error", duration: 5000 });
    } finally { setSubmitting(false); }
  };

  const policyRules = eligibility?.policy?.version?.rules;
  const panels = useMemo(() => {
    const values: Array<{ key: string; label: string; items: RemoteWorkRequest[]; mode: "mine" | "approvals" | "company" }> = [{ key: "mine", label: "My requests", items: mine, mode: "mine" }];
    if (showApprovals) values.push({ key: "approvals", label: `Approvals${approvals.length ? ` (${approvals.length})` : ""}`, items: approvals, mode: "approvals" });
    if (canViewCompany) values.push({ key: "company", label: "Company requests", items: company, mode: "company" });
    return values;
  }, [approvals, canViewCompany, company, mine, showApprovals]);

  return (
    <Box
      minH={embedded ? undefined : "100dvh"}
      bg={embedded ? "transparent" : pageBg}
      px={embedded ? 0 : { base: 3, md: 6 }}
      py={embedded ? 0 : { base: 4, md: 6 }}
    >
      <Stack maxW={embedded ? undefined : "1400px"} mx={embedded ? undefined : "auto"} spacing={5}>
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap={3}>
          <Box><Heading size="lg">Work from home</Heading><Text mt={1} color={muted} fontSize="sm">Request remote work and track manager or HR approval.</Text></Box>
          <HStack><Button variant="outline" leftIcon={<FiRefreshCw />} onClick={load} isLoading={loading}>Refresh</Button><Button colorScheme="blue" leftIcon={<FiPlus />} onClick={openRequest}>Request WFH</Button></HStack>
        </Flex>
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
          {[{ label: "Pending mine", value: mine.filter((item) => ["submitted", "manager_approved"].includes(item.status)).length }, { label: "Approved mine", value: mine.filter((item) => item.status === "approved").length }, { label: "Waiting for review", value: approvals.length }].map((item) => <Box key={item.label} bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>{item.label}</Text><Text mt={1} fontSize="2xl" fontWeight="800">{item.value}</Text></Box>)}
        </SimpleGrid>
        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          {loading ? <Stack p={4}><Skeleton h="84px" /><Skeleton h="84px" /></Stack> : <Tabs colorScheme="blue" isLazy><TabList px={4} overflowX="auto" overflowY="hidden">{panels.map((panel) => <Tab key={panel.key} whiteSpace="nowrap">{panel.label}</Tab>)}</TabList><TabPanels>{panels.map((panel) => <TabPanel key={panel.key} p={{ base: 3, md: 4 }}><RequestList items={panel.items} mode={panel.mode} onOpen={openDetails} onWithdraw={(request) => act("withdraw", request)} muted={muted} border={border} /></TabPanel>)}</TabPanels></Tabs>}
        </Box>
      </Stack>

      <Drawer isOpen={requestDrawer.isOpen} placement="right" size="lg" onClose={requestDrawer.onClose}>
        <DrawerOverlay /><DrawerContent><DrawerCloseButton /><DrawerHeader borderBottomWidth="1px">Request work from home</DrawerHeader><DrawerBody py={5}><Stack spacing={5}>
          {eligibility?.error ? <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{eligibility.error}</AlertDescription></Alert> : eligibility ? <Alert status={eligibility.eligible ? "info" : "warning"} borderRadius="md"><AlertIcon /><AlertDescription>{eligibility.policy ? `${eligibility.policy.assignment.resource?.name || "WFH policy"} applies via ${eligibility.policy.assignment.scopeNameSnapshot}.` : "No WFH policy is assigned for this date."}</AlertDescription></Alert> : null}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}><FormControl isRequired><FormLabel>From date</FormLabel><Input type="date" min={localToday()} value={form.fromDate} onChange={(event) => updateStartDate(event.target.value)} /></FormControl><FormControl isRequired><FormLabel>To date</FormLabel><Input type="date" min={form.fromDate} value={form.toDate} onChange={(event) => { const value = event.target.value; setForm((current) => ({ ...current, toDate: value, portion: value === current.fromDate ? current.portion : "full" })); setPreview(null); }} /></FormControl></SimpleGrid>
          {form.fromDate === form.toDate && policyRules?.allowHalfDay !== false ? <FormControl><FormLabel>Duration</FormLabel><Select value={form.portion} onChange={(event) => { setForm((current) => ({ ...current, portion: event.target.value })); setPreview(null); }}><option value="full">Full day</option><option value="first_half">First half</option><option value="second_half">Second half</option></Select></FormControl> : null}
          <FormControl isRequired={policyRules?.requireReason !== false}><FormLabel>Reason</FormLabel><Textarea value={form.reason} onChange={(event) => { setForm((current) => ({ ...current, reason: event.target.value })); setPreview(null); }} placeholder="Why do you need to work remotely?" /><FormHelperText>{policyRules?.minimumReasonLength ? `At least ${policyRules.minimumReasonLength} characters.` : "Provide enough context for the approver."}</FormHelperText></FormControl>
          {preview ? <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden"><Flex p={4} bg={pageBg} justify="space-between"><Box><Text fontSize="xs" color={muted}>Request calculation</Text><Text fontWeight="800">{preview.requestedUnits} remote-work days</Text><Text fontSize="xs" color={muted}>{preview.policy?.name || "WFH policy"} via {preview.policy?.scopeName || "assigned scope"} | {formatStatus(preview.rules?.approvalMode || "approval")}</Text></Box><FiWifi /></Flex><Divider />{(preview.dates || []).map((day: any) => <Flex key={day.attendanceDate} px={4} py={2.5} justify="space-between" borderBottomWidth="1px" _last={{ borderBottomWidth: 0 }}><Text fontSize="sm" fontWeight="600">{formatDate(day.attendanceDate)}</Text><Text fontSize="sm">{formatStatus(day.portion)} ({day.units})</Text></Flex>)}</Box> : null}
        </Stack></DrawerBody><DrawerFooter borderTopWidth="1px" gap={3}><Button variant="outline" onClick={requestDrawer.onClose}>Cancel</Button>{preview ? <Button colorScheme="blue" onClick={submit} isLoading={submitting}>Submit request</Button> : <Button colorScheme="blue" onClick={review} isLoading={submitting} isDisabled={!form.fromDate || !form.toDate || Boolean(eligibility?.error)}>Review request</Button>}</DrawerFooter></DrawerContent>
      </Drawer>

      <Drawer isOpen={detailDrawer.isOpen} placement="right" size="md" onClose={detailDrawer.onClose}>
        <DrawerOverlay /><DrawerContent><DrawerCloseButton /><DrawerHeader borderBottomWidth="1px">WFH request</DrawerHeader><DrawerBody py={5}>{selected ? <Stack spacing={5}><Box><HStack><Text fontSize="lg" fontWeight="800">{selected.employee?.name || selected.employeeNameSnapshot}</Text><Badge colorScheme={statusColor(selected.status)} textTransform="capitalize">{formatStatus(selected.status)}</Badge></HStack><Text mt={1} color={muted}>{formatDate(selected.fromDate)}{selected.fromDate !== selected.toDate ? ` to ${formatDate(selected.toDate)}` : ""} | {selected.requestedUnits} days</Text></Box><Box><Text fontSize="xs" color={muted}>Reason</Text><Text mt={1}>{selected.reason || "No reason provided"}</Text></Box><Box><Text fontSize="xs" color={muted}>Approval flow</Text><Text mt={1}>{formatStatus(selected.approvalModeSnapshot)} | Approver: {selected.approver?.name || selected.approverNameSnapshot || "HR queue"}</Text></Box>{["submitted", "manager_approved"].includes(selected.status) && canReviewSelected ? <FormControl><FormLabel>Review comment</FormLabel><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Required when rejecting" /></FormControl> : null}{selected.status === "approved" && canManage ? <FormControl><FormLabel>Cancellation reason</FormLabel><Textarea value={comment} onChange={(event) => setComment(event.target.value)} /></FormControl> : null}<Divider /><Box><Text fontWeight="800" mb={2}>History</Text><Stack spacing={2}>{(selected.history || []).map((entry: any, index) => <Box key={entry._id || index} borderLeftWidth="2px" borderColor="blue.300" pl={3}><Text fontSize="sm" fontWeight="700">{formatStatus(entry.action)}</Text><Text fontSize="xs" color={muted}>{entry.actor?.name || entry.actorNameSnapshot || "System"}{entry.comment ? ` | ${entry.comment}` : ""}</Text></Box>)}</Stack></Box></Stack> : null}</DrawerBody><DrawerFooter borderTopWidth="1px" gap={2}>{selected && ["submitted", "manager_approved"].includes(selected.status) && canReviewSelected ? <><Button leftIcon={<FiX />} colorScheme="red" variant="outline" onClick={() => act("reject")} isLoading={submitting}>Reject</Button><Button leftIcon={<FiCheck />} colorScheme="blue" onClick={() => act("approve")} isLoading={submitting}>Approve</Button></> : selected?.status === "approved" && canManage ? <Button colorScheme="red" variant="outline" onClick={() => act("cancel")} isLoading={submitting}>Cancel approved WFH</Button> : <Button onClick={detailDrawer.onClose}>Close</Button>}</DrawerFooter></DrawerContent>
      </Drawer>
    </Box>
  );
});

export default RemoteWorkWorkspace;
