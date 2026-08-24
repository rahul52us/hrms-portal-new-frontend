"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  EligibleLeaveItem,
  LeaveAttachment,
  LeaveRequest,
  actOnLeaveRequest,
  fetchEligibleLeave,
  fetchLeaveRequests,
  fetchLeaveTransactions,
  previewLeaveRequest,
  submitLeaveRequest,
  uploadLeaveAttachment,
} from "./leaveApi";
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
import { FiCalendar, FiClock, FiFile, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";

const today = () => new Date().toISOString().slice(0, 10);
const initialForm = () => ({
  leaveTypeId: "",
  fromDate: today(),
  toDate: today(),
  startPortion: "full",
  endPortion: "full",
  requestedHours: "",
  reason: "",
});

const statusColor = (status: string) => ({
  submitted: "orange",
  approved: "green",
  rejected: "red",
  withdrawn: "gray",
  cancelled: "gray",
}[status] || "gray");

const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));

export default function MyLeaveWorkspace() {
  const toast = useToast();
  const drawer = useDisclosure();
  const surface = useColorModeValue("white", "gray.800");
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const [eligible, setEligible] = useState<EligibleLeaveItem[]>([]);
  const [requestEligible, setRequestEligible] = useState<EligibleLeaveItem[]>([]);
  const [eligibleError, setEligibleError] = useState("");
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [attachments, setAttachments] = useState<LeaveAttachment[]>([]);
  const [preview, setPreview] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eligibleResult, requestData, transactionData] = await Promise.all([
        fetchEligibleLeave({ at: today() })
          .then((data) => ({ data, error: "" }))
          .catch((error) => ({ data: { items: [] as EligibleLeaveItem[] } as any, error: getApiErrorMessage(error?.response?.data || error, "No effective leave policy is assigned") })),
        fetchLeaveRequests({ scope: "mine", page: 1, limit: 50 }),
        fetchLeaveTransactions({ page: 1, limit: 50 }),
      ]);
      setEligible(eligibleResult.data.items || []);
      setEligibleError(eligibleResult.error);
      setRequests(requestData.items || []);
      setTransactions(transactionData.items || []);
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not load leave data"), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const selected = useMemo(
    () => requestEligible.find((item) => item.leaveType._id === form.leaveTypeId) || null,
    [requestEligible, form.leaveTypeId]
  );

  const openRequest = () => {
    const next = initialForm();
    next.leaveTypeId = eligible[0]?.leaveType._id || "";
    setRequestEligible(eligible);
    setForm(next);
    setAttachments([]);
    setPreview(null);
    drawer.onOpen();
  };

  const refreshEligibility = async (at: string) => {
    try {
      const data = await fetchEligibleLeave({ at });
      setRequestEligible(data.items || []);
      setForm((previous) => ({
        ...previous,
        leaveTypeId: (data.items || []).some((item: EligibleLeaveItem) => item.leaveType._id === previous.leaveTypeId)
          ? previous.leaveTypeId
          : data.items?.[0]?.leaveType._id || "",
      }));
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error), status: "error" });
    }
  };

  const payload = () => ({
    leaveTypeId: form.leaveTypeId,
    fromDate: form.fromDate,
    toDate: form.toDate,
    startPortion: selected?.leaveType.unit === "hours" ? "full" : form.startPortion,
    endPortion: selected?.leaveType.unit === "hours" ? "full" : form.endPortion,
    requestedHours: selected?.leaveType.unit === "hours" && form.requestedHours !== ""
      ? Number(form.requestedHours)
      : undefined,
    reason: form.reason.trim(),
    attachments,
  });

  const review = async () => {
    setSubmitting(true);
    try {
      setPreview(await previewLeaveRequest(payload()));
    } catch (error: any) {
      setPreview(null);
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not calculate leave"), status: "error", duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (!preview) return;
    setSubmitting(true);
    try {
      await submitLeaveRequest(payload());
      toast({ title: "Leave request submitted", status: "success" });
      drawer.onClose();
      await load();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not submit leave"), status: "error", duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const attachment = await uploadLeaveAttachment(file);
      setAttachments((previous) => [...previous, attachment]);
      setPreview(null);
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not upload document"), status: "error" });
    } finally {
      setUploading(false);
    }
  };

  const withdraw = async (requestId: string) => {
    try {
      await actOnLeaveRequest(requestId, "withdraw", { comment: "Withdrawn by employee" });
      toast({ title: "Leave request withdrawn", status: "success" });
      await load();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error), status: "error" });
    }
  };

  return (
    <Box minH="100dvh" bg={pageBg} px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
      <Stack maxW="1400px" mx="auto" spacing={5}>
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap={3}>
          <Box>
            <Heading size="lg">My leave</Heading>
            <Text mt={1} color={muted} fontSize="sm">Balances, requests and posted balance history.</Text>
          </Box>
          <HStack>
            <Button variant="outline" leftIcon={<FiRefreshCw />} onClick={load} isLoading={loading}>Refresh</Button>
            <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={openRequest} isDisabled={loading || eligible.length === 0}>Request leave</Button>
          </HStack>
        </Flex>

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

        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          <Tabs colorScheme="blue" isLazy>
            <TabList px={4}><Tab>Requests</Tab><Tab>Balance history</Tab></TabList>
            <TabPanels>
              <TabPanel p={{ base: 3, md: 4 }}>
                <Stack spacing={0} borderWidth={requests.length ? "1px" : "0"} borderColor={border} borderRadius="md" overflow="hidden">
                  {requests.length === 0 ? <Text py={12} textAlign="center" color={muted}>No leave requests yet.</Text> : requests.map((request, index) => (
                    <Flex key={request._id} direction={{ base: "column", lg: "row" }} justify="space-between" gap={3} p={4} borderBottomWidth={index === requests.length - 1 ? "0" : "1px"}>
                      <Box>
                        <HStack flexWrap="wrap"><Text fontWeight="800">{request.leaveTypeNameSnapshot}</Text><Badge>{request.leaveTypeCodeSnapshot}</Badge><Badge colorScheme={statusColor(request.status)}>{request.status}</Badge></HStack>
                        <Text mt={1} fontSize="sm">{formatDate(request.fromDate)}{request.fromDate !== request.toDate ? ` to ${formatDate(request.toDate)}` : ""}</Text>
                        <Text mt={1} fontSize="xs" color={muted}>{request.chargedUnits} {request.leaveUnit} charged · Approver: {request.approver?.name || request.approverNameSnapshot || "HR queue"}</Text>
                      </Box>
                      {request.status === "submitted" ? <Button size="sm" variant="outline" colorScheme="red" alignSelf={{ lg: "center" }} onClick={() => withdraw(request._id)}>Withdraw</Button> : null}
                    </Flex>
                  ))}
                </Stack>
              </TabPanel>
              <TabPanel p={{ base: 3, md: 4 }}>
                <Stack spacing={0} borderWidth={transactions.length ? "1px" : "0"} borderColor={border} borderRadius="md" overflow="hidden">
                  {transactions.length === 0 ? <Text py={12} textAlign="center" color={muted}>No posted balance transactions yet.</Text> : transactions.map((transaction, index) => (
                    <Flex key={transaction._id} justify="space-between" gap={3} p={4} borderBottomWidth={index === transactions.length - 1 ? "0" : "1px"}>
                      <Box><Text fontWeight="700">{transaction.leaveType?.name || "Leave"}</Text><Text fontSize="xs" color={muted}>{transaction.reason} · {formatDate(transaction.effectiveDate)}</Text></Box>
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
          <DrawerHeader borderBottomWidth="1px">Request leave</DrawerHeader>
          <DrawerBody py={5}>
            <Stack spacing={5}>
              <FormControl isRequired><FormLabel>Leave type</FormLabel><Select value={form.leaveTypeId} onChange={(event) => { setForm((p) => ({ ...p, leaveTypeId: event.target.value })); setPreview(null); }}>{requestEligible.map((item) => <option key={item.leaveType._id} value={item.leaveType._id}>{item.leaveType.name} ({item.leaveType.code}) · {item.balance.availableUnits || 0} available</option>)}</Select></FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired><FormLabel>From date</FormLabel><Input type="date" value={form.fromDate} onChange={(event) => { const value = event.target.value; setForm((p) => ({ ...p, fromDate: value, toDate: p.toDate < value ? value : p.toDate })); setPreview(null); refreshEligibility(value); }} /></FormControl>
                <FormControl isRequired><FormLabel>To date</FormLabel><Input type="date" min={form.fromDate} value={form.toDate} onChange={(event) => { setForm((p) => ({ ...p, toDate: event.target.value })); setPreview(null); }} /></FormControl>
              </SimpleGrid>
              {selected?.leaveType.unit === "hours" ? (
                <FormControl isRequired><FormLabel>Hours requested</FormLabel><Input type="number" min="0.25" step="0.25" value={form.requestedHours} placeholder="For example, 2.5" onChange={(event) => { setForm((p) => ({ ...p, requestedHours: event.target.value })); setPreview(null); }} /></FormControl>
              ) : selected?.rule?.allowHalfDay ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl><FormLabel>{form.fromDate === form.toDate ? "Day duration" : "First day"}</FormLabel><Select value={form.startPortion} onChange={(event) => { setForm((p) => ({ ...p, startPortion: event.target.value })); setPreview(null); }}><option value="full">Full day</option><option value="first_half">First half</option><option value="second_half">Second half</option></Select></FormControl>
                  {form.fromDate !== form.toDate ? <FormControl><FormLabel>Last day</FormLabel><Select value={form.endPortion} onChange={(event) => { setForm((p) => ({ ...p, endPortion: event.target.value })); setPreview(null); }}><option value="full">Full day</option><option value="first_half">First half</option><option value="second_half">Second half</option></Select></FormControl> : null}
                </SimpleGrid>
              ) : null}
              <FormControl isRequired><FormLabel>Reason</FormLabel><Textarea value={form.reason} placeholder="Enter the reason for leave" onChange={(event) => { setForm((p) => ({ ...p, reason: event.target.value })); setPreview(null); }} /></FormControl>
              <Box><FormLabel>Supporting documents</FormLabel><Input type="file" accept="application/pdf,image/jpeg,image/png" p={1} isDisabled={uploading || attachments.length >= 5} onChange={(event) => { upload(event.target.files?.[0]); event.target.value = ""; }} /><Text mt={1} fontSize="xs" color={muted}>PDF, JPG or PNG, up to 5 MB each.</Text>{attachments.map((attachment, index) => <Flex key={`${attachment.url}-${index}`} mt={2} p={2} borderWidth="1px" borderColor={border} borderRadius="md" justify="space-between" align="center"><HStack minW={0}><FiFile /><Text fontSize="sm" noOfLines={1}>{attachment.name}</Text></HStack><Button size="xs" variant="ghost" colorScheme="red" aria-label="Remove attachment" leftIcon={<FiTrash2 />} onClick={() => { setAttachments((items) => items.filter((_, itemIndex) => itemIndex !== index)); setPreview(null); }}>Remove</Button></Flex>)}</Box>
              {preview ? (
                <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
                  <Flex p={4} justify="space-between" bg={pageBg}><Box><Text fontSize="xs" color={muted}>Policy calculation</Text><Text fontWeight="800">{preview.chargedUnits} {selected?.leaveType.unit} will be charged</Text></Box><Icon as={selected?.leaveType.unit === "hours" ? FiClock : FiCalendar} color="blue.500" boxSize={5} /></Flex>
                  <Divider />
                  <Stack spacing={0}>{(preview.dayBreakdown || []).map((day: any) => <Flex key={day.attendanceDate} px={4} py={2.5} justify="space-between" borderBottomWidth="1px" _last={{ borderBottomWidth: 0 }}><Box><Text fontSize="sm" fontWeight="600">{formatDate(day.attendanceDate)}</Text><Text fontSize="xs" color={muted}>{day.chargeReason.replace(/_/g, " ")}</Text></Box><Text fontWeight="700">{day.chargedUnits}</Text></Flex>)}</Stack>
                </Box>
              ) : null}
            </Stack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" gap={3}><Button variant="outline" onClick={drawer.onClose}>Cancel</Button>{preview ? <Button colorScheme="blue" onClick={submit} isLoading={submitting}>Submit request</Button> : <Button colorScheme="blue" onClick={review} isLoading={submitting || uploading} isDisabled={!form.leaveTypeId || !form.reason.trim()}>Review request</Button>}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
