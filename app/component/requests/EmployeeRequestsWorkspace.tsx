"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  EligibleLeaveItem,
  LeaveAttachment,
  actOnLeaveRequest,
  fetchEligibleLeave,
  fetchLeaveRequests,
  fetchLeaveTransactions,
  previewLeaveRequest,
  submitLeaveRequest,
  uploadLeaveAttachment,
} from "@/app/component/leave/leaveApi";
import {
  actOnRemoteWorkRequest,
  fetchRemoteWorkEligibility,
  fetchRemoteWorkRequests,
  previewRemoteWorkRequest,
  submitRemoteWorkRequest,
} from "@/app/component/remote-work/remoteWorkApi";
import {
  CompOffEligibility,
  actOnCompOffClaim,
  fetchCompOffClaims,
  fetchCompOffEligibility,
  submitCompOffClaim,
} from "@/app/component/comp-off/compOffApi";
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
  Icon,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiFile,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiWifi,
} from "react-icons/fi";

const WFH_OPTION = "__work_from_home__";
const COMP_OFF_CLAIM_OPTION = "__comp_off_claim__";

const localToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const initialForm = () => ({
  leaveTypeId: "",
  compOffLeaveTypeId: "",
  fromDate: localToday(),
  toDate: localToday(),
  startPortion: "full",
  endPortion: "full",
  requestedHours: "",
  reason: "",
});

const statusColor = (status: string) => ({
  submitted: "orange",
  manager_approved: "purple",
  approved: "green",
  rejected: "red",
  withdrawn: "gray",
  cancelled: "gray",
  revoked: "gray",
}[status] || "gray");

const formatStatus = (value: string) =>
  String(value || "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));

type RequestKind = "leave" | "wfh" | "comp_off";
type UnifiedRequest = { kind: RequestKind; request: any; submittedAt: string };

function requestTitle(item: UnifiedRequest) {
  if (item.kind === "wfh") return "Work from home";
  if (item.kind === "comp_off") return `${item.request.leaveType?.name || "Comp-off"} claim`;
  return item.request.leaveTypeNameSnapshot || "Leave";
}

function requestDateText(item: UnifiedRequest) {
  if (item.kind === "comp_off") return `Worked ${formatDate(item.request.attendanceDate)}`;
  const from = formatDate(item.request.fromDate);
  return item.request.fromDate === item.request.toDate
    ? from
    : `${from} to ${formatDate(item.request.toDate)}`;
}

function requestDetail(item: UnifiedRequest) {
  const approver = item.request.approver?.name || item.request.approverNameSnapshot || "Awaiting next level";
  if (item.kind === "wfh") {
    return `${item.request.requestedUnits} remote-work ${item.request.requestedUnits === 1 ? "day" : "days"} | Approver: ${approver}`;
  }
  if (item.kind === "comp_off") {
    return `${item.request.requestedUnits} ${item.request.requestedUnits === 1 ? "day" : "days"} credit | Approver: ${approver}`;
  }
  return `${item.request.chargedUnits} ${item.request.leaveUnit} charged | Approver: ${approver}`;
}

export default function EmployeeRequestsWorkspace() {
  const toast = useToast();
  const drawer = useDisclosure();
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const [eligible, setEligible] = useState<EligibleLeaveItem[]>([]);
  const [requestEligible, setRequestEligible] = useState<EligibleLeaveItem[]>([]);
  const [eligibleError, setEligibleError] = useState("");
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [remoteWorkRequests, setRemoteWorkRequests] = useState<any[]>([]);
  const [compOffClaims, setCompOffClaims] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [form, setForm] = useState(initialForm);
  const [attachments, setAttachments] = useState<LeaveAttachment[]>([]);
  const [remoteEligibility, setRemoteEligibility] = useState<any>(null);
  const [compOffEligibility, setCompOffEligibility] = useState<CompOffEligibility | null>(null);
  const [eligibilityErrorMessage, setEligibilityErrorMessage] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isWfh = form.leaveTypeId === WFH_OPTION;
  const isCompOffClaim = form.leaveTypeId === COMP_OFF_CLAIM_OPTION;
  const isLeave = !isWfh && !isCompOffClaim;

  const selectedLeave = useMemo(
    () => requestEligible.find((item) => item.leaveType._id === form.leaveTypeId) || null,
    [form.leaveTypeId, requestEligible]
  );
  const selectedCompOff = useMemo(
    () => compOffEligibility?.items?.find(
      (item) => String(item.leaveType?._id) === form.compOffLeaveTypeId
    ) || null,
    [compOffEligibility, form.compOffLeaveTypeId]
  );
  const requests = useMemo<UnifiedRequest[]>(() => [
    ...leaveRequests.map((request) => ({ kind: "leave" as const, request, submittedAt: request.submittedAt })),
    ...remoteWorkRequests.map((request) => ({ kind: "wfh" as const, request, submittedAt: request.submittedAt })),
    ...compOffClaims.map((request) => ({ kind: "comp_off" as const, request, submittedAt: request.submittedAt })),
  ].sort(
    (left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
  ), [compOffClaims, leaveRequests, remoteWorkRequests]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eligibleResult, leaveResult, transactionResult, remoteResult, compOffResult] = await Promise.all([
        fetchEligibleLeave({ at: localToday() })
          .then((data) => ({ data, error: "" }))
          .catch((error) => ({
            data: { items: [] as EligibleLeaveItem[] } as any,
            error: getApiErrorMessage(error?.response?.data || error, "No effective leave policy is assigned"),
          })),
        fetchLeaveRequests({ scope: "mine", page: 1, limit: 50 }),
        fetchLeaveTransactions({ page: 1, limit: 50 }),
        fetchRemoteWorkRequests({ scope: "mine", page: 1, limit: 50 }),
        fetchCompOffClaims({ scope: "self", page: 1, limit: 50 }),
      ]);
      setEligible(eligibleResult.data.items || []);
      setEligibleError(eligibleResult.error);
      setLeaveRequests(leaveResult.items || []);
      setTransactions(transactionResult.items || []);
      setRemoteWorkRequests(remoteResult.items || []);
      setCompOffClaims(compOffResult.items || []);
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not load requests"), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const loadRemoteEligibility = async (date: string) => {
    setChecking(true);
    setRemoteEligibility(null);
    setEligibilityErrorMessage("");
    try {
      setRemoteEligibility(await fetchRemoteWorkEligibility({ date }));
    } catch (error: any) {
      setEligibilityErrorMessage(getApiErrorMessage(error?.response?.data || error, "No WFH policy is assigned"));
    } finally {
      setChecking(false);
    }
  };

  const checkCompOffEligibility = async () => {
    setChecking(true);
    setCompOffEligibility(null);
    setEligibilityErrorMessage("");
    try {
      const result = await fetchCompOffEligibility({ attendanceDate: form.fromDate });
      setCompOffEligibility(result);
      setForm((current) => ({ ...current, compOffLeaveTypeId: String(result.items?.[0]?.leaveType?._id || "") }));
    } catch (error: any) {
      setEligibilityErrorMessage(getApiErrorMessage(error?.response?.data || error, "This date is not eligible for comp-off"));
    } finally {
      setChecking(false);
    }
  };

  const refreshLeaveEligibility = async (date: string) => {
    try {
      const data = await fetchEligibleLeave({ at: date });
      setRequestEligible(data.items || []);
      setForm((current) => {
        if ([WFH_OPTION, COMP_OFF_CLAIM_OPTION].includes(current.leaveTypeId)) return current;
        const stillEligible = (data.items || []).some((item: EligibleLeaveItem) => item.leaveType._id === current.leaveTypeId);
        return { ...current, leaveTypeId: stillEligible ? current.leaveTypeId : data.items?.[0]?.leaveType._id || "" };
      });
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error), status: "error" });
    }
  };

  const openRequest = () => {
    const next = initialForm();
    next.leaveTypeId = eligible[0]?.leaveType._id || WFH_OPTION;
    setRequestEligible(eligible);
    setForm(next);
    setAttachments([]);
    setRemoteEligibility(null);
    setCompOffEligibility(null);
    setEligibilityErrorMessage("");
    setPreview(null);
    drawer.onOpen();
    if (next.leaveTypeId === WFH_OPTION) void loadRemoteEligibility(next.fromDate);
  };

  const selectRequestOption = (value: string) => {
    setForm((current) => ({
      ...current,
      leaveTypeId: value,
      compOffLeaveTypeId: "",
      startPortion: "full",
      endPortion: "full",
      requestedHours: "",
    }));
    setPreview(null);
    setRemoteEligibility(null);
    setCompOffEligibility(null);
    setEligibilityErrorMessage("");
    if (value !== WFH_OPTION && value !== COMP_OFF_CLAIM_OPTION) return;
    setAttachments([]);
    if (value === WFH_OPTION) void loadRemoteEligibility(form.fromDate);
  };

  const updateFromDate = (value: string) => {
    setForm((current) => ({
      ...current,
      fromDate: value,
      toDate: current.toDate < value ? value : current.toDate,
      startPortion: "full",
      endPortion: "full",
    }));
    setPreview(null);
    setCompOffEligibility(null);
    setEligibilityErrorMessage("");
    if (isLeave) void refreshLeaveEligibility(value);
    if (isWfh) void loadRemoteEligibility(value);
  };

  const leavePayload = () => ({
    leaveTypeId: form.leaveTypeId,
    fromDate: form.fromDate,
    toDate: form.toDate,
    startPortion: selectedLeave?.leaveType.unit === "hours" ? "full" : form.startPortion,
    endPortion: selectedLeave?.leaveType.unit === "hours" ? "full" : form.endPortion,
    requestedHours: selectedLeave?.leaveType.unit === "hours" && form.requestedHours !== "" ? Number(form.requestedHours) : undefined,
    reason: form.reason.trim(),
    attachments,
  });

  const wfhPayload = () => ({
    fromDate: form.fromDate,
    toDate: form.toDate,
    portion: form.fromDate === form.toDate ? form.startPortion : "full",
    reason: form.reason.trim(),
  });

  const review = async () => {
    if (isCompOffClaim) {
      await checkCompOffEligibility();
      return;
    }
    setSubmitting(true);
    try {
      setPreview(isWfh ? await previewRemoteWorkRequest(wfhPayload()) : await previewLeaveRequest(leavePayload()));
    } catch (error: any) {
      setPreview(null);
      toast({
        title: getApiErrorMessage(error?.response?.data || error, isWfh ? "Could not validate WFH request" : "Could not calculate leave"),
        status: "error",
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      if (isWfh) {
        await submitRemoteWorkRequest(wfhPayload());
        toast({ title: "WFH request submitted", status: "success" });
      } else if (isCompOffClaim) {
        if (!selectedCompOff) return;
        await submitCompOffClaim({
          attendanceDate: form.fromDate,
          leaveTypeId: form.compOffLeaveTypeId,
          requestedUnits: selectedCompOff.eligibleUnits,
          reason: form.reason.trim(),
        });
        toast({ title: "Comp-off claim submitted", status: "success" });
      } else {
        await submitLeaveRequest(leavePayload());
        toast({ title: "Leave request submitted", status: "success" });
      }
      drawer.onClose();
      await load();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not submit request"), status: "error", duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const attachment = await uploadLeaveAttachment(file);
      setAttachments((current) => [...current, attachment]);
      setPreview(null);
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not upload document"), status: "error" });
    } finally {
      setUploading(false);
    }
  };

  const withdraw = async (item: UnifiedRequest) => {
    try {
      if (item.kind === "wfh") {
        await actOnRemoteWorkRequest(item.request._id, "withdraw", { comment: "Withdrawn by employee" });
      } else if (item.kind === "comp_off") {
        await actOnCompOffClaim(item.request._id, "withdraw", { comment: "Withdrawn by employee" });
      } else {
        await actOnLeaveRequest(item.request._id, "withdraw", { comment: "Withdrawn by employee" });
      }
      toast({ title: "Request withdrawn", status: "success" });
      await load();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error), status: "error" });
    }
  };

  const wfhRules = remoteEligibility?.policy?.version?.rules;
  const wfhMinimumReason = Number(wfhRules?.minimumReasonLength || 0);
  const wfhReasonValid = wfhRules?.requireReason === false || form.reason.trim().length >= wfhMinimumReason;
  const canReview = isWfh
    ? Boolean(form.fromDate && form.toDate && remoteEligibility?.eligible && wfhReasonValid)
    : isCompOffClaim
      ? Boolean(form.fromDate)
      : Boolean(selectedLeave && form.reason.trim());
  const canSubmitCompOff = Boolean(
    selectedCompOff && selectedCompOff.eligibleUnits > 0 && !selectedCompOff.existingClaim && form.reason.trim().length >= 3
  );

  return (
    <Box minH="100dvh" bg={pageBg} px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
      <Stack maxW="1400px" mx="auto" spacing={5}>
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap={3}>
          <Box>
            <Heading size="lg">My requests</Heading>
            <Text mt={1} color={muted} fontSize="sm">Apply and track leave, work-from-home, and comp-off requests.</Text>
          </Box>
          <HStack>
            <Button variant="outline" leftIcon={<FiRefreshCw />} onClick={load} isLoading={loading}>Refresh</Button>
            <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={openRequest} isDisabled={loading}>New request</Button>
          </HStack>
        </Flex>

        <Box>
          <Text mb={3} fontSize="sm" fontWeight="800">Leave balances</Text>
          {loading ? (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}><Skeleton h="118px" /><Skeleton h="118px" /><Skeleton h="118px" /></SimpleGrid>
          ) : eligible.length === 0 ? (
            <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>{eligibleError || "No effective leave policy is assigned for today."}</AlertDescription></Alert>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={3}>
              {eligible.map((item) => (
                <Box key={item.leaveType._id} bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
                  <Flex justify="space-between" gap={3}>
                    <HStack><Box boxSize="10px" borderRadius="sm" bg={item.leaveType.color} /><Text fontWeight="800">{item.leaveType.name}</Text></HStack>
                    <Badge>{item.leaveType.code}</Badge>
                  </Flex>
                  <Text mt={4} fontSize="2xl" fontWeight="800">{Number(item.balance.availableUnits || 0).toFixed(2).replace(/\.00$/, "")}</Text>
                  <Text fontSize="xs" color={muted}>Available {item.leaveType.unit}</Text>
                  <HStack mt={3} fontSize="xs" color={muted} justify="space-between"><Text>{item.balance.pendingUnits || 0} pending</Text><Text>{item.balance.balanceUnits || 0} posted</Text></HStack>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>

        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          <Tabs colorScheme="blue" isLazy>
            <TabList px={4}><Tab>Requests</Tab><Tab>Balance history</Tab></TabList>
            <TabPanels>
              <TabPanel p={{ base: 3, md: 4 }}>
                <Stack spacing={0} borderWidth={requests.length ? "1px" : "0"} borderColor={border} borderRadius="md" overflow="hidden">
                  {requests.length === 0 ? <Text py={12} textAlign="center" color={muted}>No requests yet.</Text> : requests.map((item, index) => {
                    const canWithdraw = item.kind === "wfh"
                      ? ["submitted", "manager_approved"].includes(item.request.status)
                      : item.request.status === "submitted";
                    return (
                      <Flex key={`${item.kind}-${item.request._id}`} direction={{ base: "column", lg: "row" }} justify="space-between" gap={3} p={4} borderBottomWidth={index === requests.length - 1 ? "0" : "1px"}>
                        <Box>
                          <HStack flexWrap="wrap">
                            <Text fontWeight="800">{requestTitle(item)}</Text>
                            <Badge variant="outline">{item.kind === "wfh" ? "WFH" : item.kind === "comp_off" ? "Comp-off claim" : item.request.leaveTypeCodeSnapshot}</Badge>
                            <Badge colorScheme={statusColor(item.request.status)}>{formatStatus(item.request.status)}</Badge>
                          </HStack>
                          <Text mt={1} fontSize="sm">{requestDateText(item)}</Text>
                          <Text mt={1} fontSize="xs" color={muted}>{requestDetail(item)}</Text>
                        </Box>
                        {canWithdraw ? <Button size="sm" variant="outline" colorScheme="red" alignSelf={{ lg: "center" }} onClick={() => withdraw(item)}>Withdraw</Button> : null}
                      </Flex>
                    );
                  })}
                </Stack>
              </TabPanel>
              <TabPanel p={{ base: 3, md: 4 }}>
                <Stack spacing={0} borderWidth={transactions.length ? "1px" : "0"} borderColor={border} borderRadius="md" overflow="hidden">
                  {transactions.length === 0 ? <Text py={12} textAlign="center" color={muted}>No posted balance transactions yet.</Text> : transactions.map((transaction, index) => (
                    <Flex key={transaction._id} justify="space-between" gap={3} p={4} borderBottomWidth={index === transactions.length - 1 ? "0" : "1px"}>
                      <Box><Text fontWeight="700">{transaction.leaveType?.name || "Leave"}</Text><Text fontSize="xs" color={muted}>{transaction.reason} | {formatDate(transaction.effectiveDate)}</Text></Box>
                      <Text fontWeight="800" color={transaction.units > 0 ? "green.500" : "red.500"}>{transaction.units > 0 ? "+" : ""}{transaction.units}</Text>
                    </Flex>
                  ))}
                </Stack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Stack>

      <Drawer isOpen={drawer.isOpen} placement="right" size="lg" onClose={drawer.onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">New request</DrawerHeader>
          <DrawerBody py={5}>
            <Stack spacing={5}>
              <FormControl isRequired>
                <FormLabel>Leave type</FormLabel>
                <Select value={form.leaveTypeId} onChange={(event) => selectRequestOption(event.target.value)}>
                  {requestEligible.length ? (
                    <optgroup label="Leave types">
                      {requestEligible.map((item) => (
                        <option key={item.leaveType._id} value={item.leaveType._id}>{item.leaveType.name} ({item.leaveType.code}) | {item.balance.availableUnits || 0} available</option>
                      ))}
                    </optgroup>
                  ) : null}
                  <optgroup label="Other requests">
                    <option value={WFH_OPTION}>Work from home</option>
                    <option value={COMP_OFF_CLAIM_OPTION}>Comp-off claim (earn credit)</option>
                  </optgroup>
                </Select>
                <FormHelperText>An available Comp Off leave type uses earned credit. Comp-off claim earns that credit from off-day work.</FormHelperText>
              </FormControl>

              {isWfh && eligibilityErrorMessage ? <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{eligibilityErrorMessage}</AlertDescription></Alert> : null}
              {isWfh && remoteEligibility && !remoteEligibility.eligible ? (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon /><AlertDescription>WFH is not available for the selected date.</AlertDescription>
                </Alert>
              ) : null}

              {isCompOffClaim ? (
                <FormControl isRequired>
                  <FormLabel>Worked on</FormLabel>
                  <Input type="date" max={localToday()} value={form.fromDate} onChange={(event) => updateFromDate(event.target.value)} />
                  <FormHelperText>Select the weekly off or mandatory holiday on which you worked.</FormHelperText>
                </FormControl>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired><FormLabel>From date</FormLabel><Input type="date" min={isWfh ? localToday() : undefined} value={form.fromDate} onChange={(event) => updateFromDate(event.target.value)} /></FormControl>
                  <FormControl isRequired><FormLabel>To date</FormLabel><Input type="date" min={form.fromDate} value={form.toDate} onChange={(event) => { setForm((current) => ({ ...current, toDate: event.target.value, startPortion: event.target.value === current.fromDate ? current.startPortion : "full" })); setPreview(null); }} /></FormControl>
                </SimpleGrid>
              )}

              {isLeave && selectedLeave?.leaveType.unit === "hours" ? (
                <FormControl isRequired><FormLabel>Hours requested</FormLabel><Input type="number" min="0.25" step="0.25" value={form.requestedHours} placeholder="For example, 2.5" onChange={(event) => { setForm((current) => ({ ...current, requestedHours: event.target.value })); setPreview(null); }} /></FormControl>
              ) : isLeave && selectedLeave?.rule?.allowHalfDay ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl><FormLabel>{form.fromDate === form.toDate ? "Day duration" : "First day"}</FormLabel><Select value={form.startPortion} onChange={(event) => { setForm((current) => ({ ...current, startPortion: event.target.value })); setPreview(null); }}><option value="full">Full day</option><option value="first_half">First half</option><option value="second_half">Second half</option></Select></FormControl>
                  {form.fromDate !== form.toDate ? <FormControl><FormLabel>Last day</FormLabel><Select value={form.endPortion} onChange={(event) => { setForm((current) => ({ ...current, endPortion: event.target.value })); setPreview(null); }}><option value="full">Full day</option><option value="first_half">First half</option><option value="second_half">Second half</option></Select></FormControl> : null}
                </SimpleGrid>
              ) : isWfh && form.fromDate === form.toDate && wfhRules?.allowHalfDay !== false ? (
                <FormControl><FormLabel>Day duration</FormLabel><Select value={form.startPortion} onChange={(event) => { setForm((current) => ({ ...current, startPortion: event.target.value })); setPreview(null); }}><option value="full">Full day</option><option value="first_half">First half</option><option value="second_half">Second half</option></Select></FormControl>
              ) : null}

              {isCompOffClaim && compOffEligibility ? (
                <Stack spacing={4}>
                  <Alert status={selectedCompOff && selectedCompOff.eligibleUnits > 0 && !selectedCompOff.existingClaim ? "success" : "warning"} borderRadius="md">
                    <AlertIcon /><AlertDescription>{formatStatus(compOffEligibility.dayType)} | {compOffEligibility.workedMinutes} worked minutes{selectedCompOff ? ` | ${selectedCompOff.eligibleUnits} day eligible` : ""}</AlertDescription>
                  </Alert>
                  {compOffEligibility.items.length > 1 ? (
                    <FormControl isRequired><FormLabel>Comp-off credit type</FormLabel><Select value={form.compOffLeaveTypeId} onChange={(event) => setForm((current) => ({ ...current, compOffLeaveTypeId: event.target.value }))}>{compOffEligibility.items.map((item) => <option key={item.leaveType._id} value={item.leaveType._id}>{item.leaveType.name} ({item.leaveType.code})</option>)}</Select></FormControl>
                  ) : selectedCompOff ? <Text fontSize="sm"><strong>Credit type:</strong> {selectedCompOff.leaveType.name} ({selectedCompOff.leaveType.code})</Text> : null}
                  {selectedCompOff?.existingClaim ? <Alert status="info" borderRadius="md"><AlertIcon /><AlertDescription>A {selectedCompOff.existingClaim.status} claim already exists for this date.</AlertDescription></Alert> : null}
                </Stack>
              ) : null}
              {isCompOffClaim && eligibilityErrorMessage ? <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>{eligibilityErrorMessage}</AlertDescription></Alert> : null}

              <FormControl isRequired={isLeave || isCompOffClaim || wfhRules?.requireReason !== false}>
                <FormLabel>Reason</FormLabel>
                <Textarea value={form.reason} placeholder={isWfh ? "Why do you need to work remotely?" : isCompOffClaim ? "Describe the off-day work completed" : "Enter the reason for leave"} onChange={(event) => { setForm((current) => ({ ...current, reason: event.target.value })); setPreview(null); }} />
                {isWfh ? <FormHelperText>{wfhMinimumReason ? `At least ${wfhMinimumReason} characters.` : "Provide enough context for the approver."}</FormHelperText> : null}
              </FormControl>

              {isLeave ? (
                <Box>
                  <FormLabel>Supporting documents</FormLabel>
                  <Input type="file" accept="application/pdf,image/jpeg,image/png" p={1} isDisabled={uploading || attachments.length >= 5} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
                  <Text mt={1} fontSize="xs" color={muted}>PDF, JPG or PNG, up to 5 MB each.</Text>
                  {attachments.map((attachment, index) => (
                    <Flex key={`${attachment.url}-${index}`} mt={2} p={2} borderWidth="1px" borderColor={border} borderRadius="md" justify="space-between" align="center">
                      <HStack minW={0}><FiFile /><Text fontSize="sm" noOfLines={1}>{attachment.name}</Text></HStack>
                      <Button size="xs" variant="ghost" colorScheme="red" aria-label="Remove attachment" leftIcon={<FiTrash2 />} onClick={() => { setAttachments((items) => items.filter((_, itemIndex) => itemIndex !== index)); setPreview(null); }}>Remove</Button>
                    </Flex>
                  ))}
                </Box>
              ) : null}

              {preview && isLeave ? (
                <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
                  <Flex p={4} justify="space-between" bg={pageBg}><Box><Text fontSize="xs" color={muted}>Policy calculation</Text><Text fontWeight="800">{preview.chargedUnits} {selectedLeave?.leaveType.unit} will be charged</Text></Box><Icon as={selectedLeave?.leaveType.unit === "hours" ? FiClock : FiCalendar} color="blue.500" boxSize={5} /></Flex>
                  <Divider /><Stack spacing={0}>{(preview.dayBreakdown || []).map((day: any) => <Flex key={day.attendanceDate} px={4} py={2.5} justify="space-between" borderBottomWidth="1px" _last={{ borderBottomWidth: 0 }}><Box><Text fontSize="sm" fontWeight="600">{formatDate(day.attendanceDate)}</Text><Text fontSize="xs" color={muted}>{formatStatus(day.chargeReason)}</Text></Box><Text fontWeight="700">{day.chargedUnits}</Text></Flex>)}</Stack>
                </Box>
              ) : null}

              {preview && isWfh ? (
                <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
                  <Flex p={4} bg={pageBg} justify="space-between"><Box><Text fontSize="xs" color={muted}>Request calculation</Text><Text fontWeight="800">{preview.requestedUnits} remote-work days</Text><Text fontSize="xs" color={muted}>{preview.policy?.name || "WFH policy"} via {preview.policy?.scopeName || "assigned scope"}</Text></Box><FiWifi /></Flex>
                  <Divider />{(preview.dates || []).map((day: any) => <Flex key={day.attendanceDate} px={4} py={2.5} justify="space-between" borderBottomWidth="1px" _last={{ borderBottomWidth: 0 }}><Text fontSize="sm" fontWeight="600">{formatDate(day.attendanceDate)}</Text><Text fontSize="sm">{formatStatus(day.portion)} ({day.units})</Text></Flex>)}
                </Box>
              ) : null}
            </Stack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" gap={3}>
            <Button variant="outline" onClick={drawer.onClose}>Cancel</Button>
            {isCompOffClaim && compOffEligibility ? (
              <Button colorScheme="blue" onClick={submit} isLoading={submitting} isDisabled={!canSubmitCompOff}>Submit request</Button>
            ) : preview ? (
              <Button colorScheme="blue" onClick={submit} isLoading={submitting}>Submit request</Button>
            ) : (
              <Button colorScheme="blue" onClick={review} isLoading={submitting || checking || uploading} isDisabled={!canReview}>{isCompOffClaim ? "Check eligibility" : "Review request"}</Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
