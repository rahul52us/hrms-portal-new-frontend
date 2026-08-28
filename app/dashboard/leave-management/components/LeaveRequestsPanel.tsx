"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { hasPermission, PERMISSION_KEYS } from "@/app/config/utils/permissions";
import stores from "@/app/store/stores";
import {
  LeaveRequest,
  actOnLeaveRequest,
  fetchLeaveRequests,
} from "@/app/component/leave/leaveApi";
import {
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
  Select,
  Skeleton,
  Stack,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiEye, FiX } from "react-icons/fi";

const color = (status: string) => ({ submitted: "orange", approved: "green", rejected: "red", cancelled: "gray", withdrawn: "gray" }[status] || "gray");
const date = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));

export default function LeaveRequestsPanel({ companyId, borderColor, muted }: { companyId: string; borderColor: string; muted: string }) {
  const toast = useToast();
  const details = useDisclosure();
  const canApprove = hasPermission(stores.auth.user, PERMISSION_KEYS.APPROVE_LEAVE_REQUESTS);
  const actorId = String(stores.auth.user?._id || "");
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("submitted");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [comment, setComment] = useState("");
  const canDecideSelected = Boolean(
    selected && canApprove && (
      selected.approvalInstance
        ? (selected.currentApprovers || []).some((item) => String(item?._id || item) === actorId)
        : true
    )
  );

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const result = await fetchLeaveRequests({ companyId, scope: "company", status: status || undefined, page, limit: 20 });
      setItems(result.items);
      setTotalPages(result.pagination.totalPages || 1);
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not load leave requests"), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, page, status, toast]);

  useEffect(() => { load(); }, [load]);

  const open = (request: LeaveRequest) => {
    setSelected(request);
    setComment("");
    details.onOpen();
  };

  const act = async (action: "approve" | "reject" | "cancel") => {
    if (!selected) return;
    if (["reject", "cancel"].includes(action) && comment.trim().length < 3) {
      toast({ title: `${action === "reject" ? "Rejection" : "Cancellation"} reason is required`, status: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      const updated = await actOnLeaveRequest(selected._id, action, { companyId, comment: comment.trim() || undefined });
      const movedToNextLevel = action === "approve" && updated.status === "submitted";
      toast({ title: movedToNextLevel ? "Approval recorded; request moved to the next level" : `Leave request ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "cancelled"}`, status: "success" });
      details.onClose();
      await load();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error), status: "error", duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={4}>
      <Flex justify="space-between" direction={{ base: "column", md: "row" }} gap={3}>
        <Box><Text fontWeight="800">Employee leave requests</Text><Text fontSize="sm" color={muted}>Requests are limited to your current company and HR scope.</Text></Box>
        <Select size="sm" maxW="210px" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="submitted">Pending approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="withdrawn">Withdrawn</option><option value="cancelled">Cancelled</option><option value="">All statuses</option></Select>
      </Flex>
      {loading ? <Stack><Skeleton h="92px" /><Skeleton h="92px" /></Stack> : items.length === 0 ? <Box py={12} textAlign="center" borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md"><Text color={muted}>No requests match this filter.</Text></Box> : (
        <Stack spacing={0} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
          {items.map((request, index) => <Flex key={request._id} p={4} direction={{ base: "column", lg: "row" }} justify="space-between" gap={3} borderBottomWidth={index === items.length - 1 ? 0 : "1px"}><Box><HStack flexWrap="wrap"><Text fontWeight="800">{request.employee?.name || "Employee"}</Text><Text fontSize="sm" color={muted}>{request.employee?.code || request.employee?.username}</Text><Badge colorScheme={color(request.status)}>{request.status}</Badge></HStack><Text mt={1} fontSize="sm">{request.leaveTypeNameSnapshot} · {date(request.fromDate)}{request.toDate !== request.fromDate ? ` to ${date(request.toDate)}` : ""}</Text><Text mt={1} fontSize="xs" color={muted}>{request.chargedUnits} {request.leaveUnit} charged · {request.reason}</Text></Box><Button size="sm" variant="outline" leftIcon={<FiEye />} alignSelf={{ lg: "center" }} onClick={() => open(request)}>Review</Button></Flex>)}
        </Stack>
      )}
      <HStack justify="end"><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">Page {page} of {totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack>

      <Drawer isOpen={details.isOpen} onClose={details.onClose} placement="right" size="lg"><DrawerOverlay /><DrawerContent><DrawerCloseButton /><DrawerHeader borderBottomWidth="1px">Leave request</DrawerHeader><DrawerBody py={5}>{selected ? <Stack spacing={5}><Box><HStack><Text fontSize="lg" fontWeight="800">{selected.employee?.name}</Text><Badge colorScheme={color(selected.status)}>{selected.status}</Badge></HStack><Text color={muted} fontSize="sm">{selected.employee?.code || selected.employee?.username}</Text></Box><Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}><Text fontWeight="800">{selected.leaveTypeNameSnapshot} ({selected.leaveTypeCodeSnapshot})</Text><Text mt={1}>{date(selected.fromDate)}{selected.toDate !== selected.fromDate ? ` to ${date(selected.toDate)}` : ""}</Text><Text mt={1} color={muted} fontSize="sm">{selected.chargedUnits} {selected.leaveUnit} charged</Text></Box><Box><Text fontSize="sm" color={muted}>Reason</Text><Text>{selected.reason}</Text></Box><Box><Text fontSize="sm" fontWeight="700" mb={2}>Date calculation</Text><Stack spacing={0} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">{(selected.dayBreakdown || []).map((day) => <Flex key={day.attendanceDate} px={3} py={2} justify="space-between" borderBottomWidth="1px" _last={{ borderBottomWidth: 0 }}><Box><Text fontSize="sm" fontWeight="600">{date(day.attendanceDate)}</Text><Text fontSize="xs" color={muted}>{String(day.chargeReason).replace(/_/g, " ")}</Text></Box><Text fontWeight="700">{day.chargedUnits}</Text></Flex>)}</Stack></Box>{selected.attachments?.length ? <Box><Text fontSize="sm" fontWeight="700">Documents</Text>{selected.attachments.map((attachment) => <Button as="a" href={attachment.url} target="_blank" rel="noreferrer" key={attachment.url} mt={2} mr={2} size="sm" variant="outline">{attachment.name}</Button>)}</Box> : null}{((selected.status === "submitted" && canDecideSelected) || (selected.status === "approved" && canApprove)) ? <FormControl><FormLabel>{selected.status === "approved" ? "Cancellation reason" : "Decision comment"}</FormLabel><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={selected.status === "submitted" ? "Required when rejecting" : "Required when cancelling"} /></FormControl> : null}</Stack> : null}</DrawerBody><DrawerFooter borderTopWidth="1px" gap={3}><Button variant="outline" onClick={details.onClose}>Close</Button>{canDecideSelected && selected?.status === "submitted" ? <><Button colorScheme="red" variant="outline" leftIcon={<FiX />} onClick={() => act("reject")} isLoading={submitting}>Reject</Button><Button colorScheme="green" leftIcon={<FiCheck />} onClick={() => act("approve")} isLoading={submitting}>Approve</Button></> : null}{canApprove && selected?.status === "approved" ? <Button colorScheme="red" variant="outline" onClick={() => act("cancel")} isLoading={submitting}>Cancel approved leave</Button> : null}</DrawerFooter></DrawerContent></Drawer>
    </Stack>
  );
}
