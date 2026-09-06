"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  LeaveEncashmentRequest,
  cancelApprovedLeaveEncashmentRequest,
  fetchLeaveEncashmentRequests,
  settleLeaveEncashmentRequest,
} from "@/app/component/leave/leaveApi";
import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
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
  HStack,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiDollarSign, FiEye, FiRefreshCw } from "react-icons/fi";

type Props = {
  companyId: string;
  canSettle: boolean;
  borderColor: string;
  muted: string;
};

const localToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
};

const label = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusColor = (status: string) => ({
  submitted: "orange",
  approved: "green",
  rejected: "red",
  withdrawn: "gray",
  cancelled: "gray",
}[status] || "gray");

export default function LeaveEncashmentsPanel({ companyId, canSettle, borderColor, muted }: Props) {
  const toast = useToast();
  const details = useDisclosure();
  const cancelDialog = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [items, setItems] = useState<LeaveEncashmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<LeaveEncashmentRequest | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [payoutDate, setPayoutDate] = useState(localToday());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const result = await fetchLeaveEncashmentRequests({
        companyId,
        scope: "company",
        status: status || undefined,
        page: 1,
        limit: 50,
      });
      setItems(result.items || []);
    } catch (error: any) {
      toast({
        title: getApiErrorMessage(error?.response?.data || error, "Could not load leave encashments"),
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, status, toast]);

  useEffect(() => { void load(); }, [load]);

  const open = (request: LeaveEncashmentRequest) => {
    setSelected(request);
    setAmount(request.payoutAmount ? String(request.payoutAmount) : "");
    setCurrency(request.payoutCurrency || "INR");
    setPayoutDate(request.payoutDate || localToday());
    setReference(request.payoutReference || "");
    setNotes(request.payoutNotes || "");
    setCancellationReason("");
    details.onOpen();
  };

  const settle = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await settleLeaveEncashmentRequest(selected._id, {
        companyId,
        amount: Number(amount),
        currency,
        payoutDate,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast({ title: "Leave encashment marked paid", status: "success" });
      details.onClose();
      await load();
    } catch (error: any) {
      toast({
        title: getApiErrorMessage(error?.response?.data || error, "Could not record payout"),
        status: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async () => {
    if (!selected || cancellationReason.trim().length < 3) return;
    setSubmitting(true);
    try {
      await cancelApprovedLeaveEncashmentRequest(selected._id, {
        companyId,
        reason: cancellationReason.trim(),
      });
      toast({ title: "Encashment cancelled and leave balance restored", status: "success" });
      cancelDialog.onClose();
      details.onClose();
      await load();
    } catch (error: any) {
      toast({
        title: getApiErrorMessage(error?.response?.data || error, "Could not cancel encashment"),
        status: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Stack><Skeleton h="88px" /><Skeleton h="88px" /></Stack>;

  return (
    <>
      <Flex mb={4} direction={{ base: "column", md: "row" }} justify="space-between" gap={3}>
        <Box>
          <Text fontWeight="800">Leave encashment</Text>
          <Text fontSize="sm" color={muted}>Track approvals and record payout after leave units have been debited.</Text>
        </Box>
        <HStack>
          <Select size="sm" value={status} onChange={(event) => setStatus(event.target.value)} maxW="180px">
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Button size="sm" variant="outline" leftIcon={<FiRefreshCw />} onClick={load}>Refresh</Button>
        </HStack>
      </Flex>

      {items.length === 0 ? (
        <Box py={12} borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md" textAlign="center">
          <Text color={muted}>No leave encashment requests found.</Text>
        </Box>
      ) : (
        <Stack spacing={0} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
          {items.map((request, index) => (
            <Flex
              key={request._id}
              p={4}
              direction={{ base: "column", lg: "row" }}
              justify="space-between"
              gap={4}
              borderBottomWidth={index === items.length - 1 ? "0" : "1px"}
              borderColor={borderColor}
            >
              <Box minW={0}>
                <HStack flexWrap="wrap">
                  <Text fontWeight="800">{request.employee?.name || request.employee?.username || "Employee"}</Text>
                  <Text fontSize="xs" color={muted}>{request.employee?.code || ""}</Text>
                  <Badge>{request.leaveTypeCodeSnapshot}</Badge>
                  <Badge colorScheme={statusColor(request.status)}>{label(request.status)}</Badge>
                  {request.status === "approved" ? (
                    <Badge colorScheme={request.payoutStatus === "paid" ? "green" : "orange"}>
                      Payout {label(request.payoutStatus)}
                    </Badge>
                  ) : null}
                </HStack>
                <Text mt={1} fontSize="sm" fontWeight="700">
                  {request.requestedUnits} {request.leaveUnit} of {request.leaveTypeNameSnapshot}
                </Text>
                <Text mt={1} fontSize="xs" color={muted}>Requested {formatDate(request.requestedAt)}</Text>
              </Box>
              <Button alignSelf={{ lg: "center" }} size="sm" variant="outline" leftIcon={<FiEye />} onClick={() => open(request)}>View</Button>
            </Flex>
          ))}
        </Stack>
      )}

      <Drawer isOpen={details.isOpen} placement="right" size="md" onClose={details.onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Encashment details</DrawerHeader>
          <DrawerBody py={5}>
            {selected ? (
              <Stack spacing={5}>
                <Box>
                  <Text fontWeight="800" fontSize="lg">{selected.employee?.name || selected.employee?.username}</Text>
                  <Text fontSize="sm" color={muted}>{selected.employee?.code || ""}</Text>
                </Box>
                <SimpleGrid columns={2} spacing={4} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
                  <Box><Text fontSize="xs" color={muted}>Leave type</Text><Text fontWeight="700">{selected.leaveTypeNameSnapshot} ({selected.leaveTypeCodeSnapshot})</Text></Box>
                  <Box><Text fontSize="xs" color={muted}>Units</Text><Text fontWeight="700">{selected.requestedUnits} {selected.leaveUnit}</Text></Box>
                  <Box><Text fontSize="xs" color={muted}>Request status</Text><Badge colorScheme={statusColor(selected.status)}>{label(selected.status)}</Badge></Box>
                  <Box><Text fontSize="xs" color={muted}>Payout status</Text><Text fontWeight="700">{label(selected.payoutStatus)}</Text></Box>
                </SimpleGrid>
                <Box><Text fontSize="xs" color={muted}>Reason</Text><Text mt={1}>{selected.reason}</Text></Box>
                {selected.payoutStatus === "paid" ? (
                  <Alert status="success" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>
                      Paid {selected.payoutCurrency} {selected.payoutAmount} on {formatDate(selected.payoutDate)}
                      {selected.payoutReference ? ` | Reference: ${selected.payoutReference}` : ""}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {canSettle && selected.status === "approved" && selected.payoutStatus === "pending" ? (
                  <Stack spacing={4} borderTopWidth="1px" borderColor={borderColor} pt={5}>
                    <HStack><FiDollarSign /><Text fontWeight="800">Record payout</Text></HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired><FormLabel>Amount</FormLabel><Input type="number" min="0.01" step="0.01" value={amount} placeholder="Enter paid amount" onChange={(event) => setAmount(event.target.value)} /></FormControl>
                      <FormControl isRequired><FormLabel>Currency</FormLabel><Input maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></FormControl>
                      <FormControl isRequired><FormLabel>Payout date</FormLabel><Input type="date" max={localToday()} value={payoutDate} onChange={(event) => setPayoutDate(event.target.value)} /></FormControl>
                      <FormControl><FormLabel>Payment reference</FormLabel><Input value={reference} placeholder="Payroll batch or bank reference" onChange={(event) => setReference(event.target.value)} /></FormControl>
                    </SimpleGrid>
                    <FormControl><FormLabel>Notes</FormLabel><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></FormControl>
                  </Stack>
                ) : null}
              </Stack>
            ) : null}
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" gap={2}>
            <Button variant="outline" onClick={details.onClose}>Close</Button>
            {canSettle && selected?.status === "approved" && selected.payoutStatus === "pending" ? (
              <>
                <Button colorScheme="red" variant="outline" onClick={() => { setCancellationReason(""); cancelDialog.onOpen(); }}>Cancel encashment</Button>
                <Button colorScheme="green" onClick={settle} isLoading={submitting} isDisabled={!amount || Number(amount) <= 0 || currency.length !== 3 || !payoutDate}>Mark paid</Button>
              </>
            ) : null}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog isOpen={cancelDialog.isOpen} leastDestructiveRef={cancelRef} onClose={cancelDialog.onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Cancel unpaid encashment</AlertDialogHeader>
            <AlertDialogBody>
              <Text fontSize="sm" color={muted}>This posts a compensating ledger entry and restores the approved units to the employee balance.</Text>
              <FormControl mt={4} isRequired>
                <FormLabel>Cancellation reason</FormLabel>
                <Textarea value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} />
              </FormControl>
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} variant="outline" onClick={cancelDialog.onClose}>Keep encashment</Button>
              <Button colorScheme="red" onClick={cancel} isLoading={submitting} isDisabled={cancellationReason.trim().length < 3}>Cancel and restore</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
