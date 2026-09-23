"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  LeaveCancellationRequest,
  LeaveEncashmentRequest,
  LeaveRequest,
  actOnLeaveCancellationRequest,
  actOnLeaveEncashmentRequest,
  actOnLeaveRequest,
  fetchLeaveCancellationRequests,
  fetchLeaveEncashmentRequests,
  fetchLeaveRequests,
} from "@/app/component/leave/leaveApi";
import {
  RemoteWorkRequest,
  actOnRemoteWorkRequest,
  fetchRemoteWorkRequests,
} from "@/app/component/remote-work/remoteWorkApi";
import {
  CompOffClaim,
  actOnCompOffClaim,
  fetchCompOffClaims,
} from "@/app/component/comp-off/compOffApi";
import {
  AttendanceRegularizationRequest,
  actOnAttendanceRegularizationRequest,
  fetchAttendanceRegularizationRequests,
} from "@/app/component/attendance/attendanceRegularizationApi";
import {
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
  Heading,
  HStack,
  Skeleton,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheck, FiClock, FiEye, FiRefreshCw, FiX } from "react-icons/fi";

type ApprovalItem =
  | { kind: "leave"; request: LeaveRequest }
  | { kind: "leave_cancellation"; request: LeaveCancellationRequest }
  | { kind: "leave_encashment"; request: LeaveEncashmentRequest }
  | { kind: "remote_work"; request: RemoteWorkRequest }
  | { kind: "comp_off"; request: CompOffClaim }
  | { kind: "attendance_regularization"; request: AttendanceRegularizationRequest };

const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));

function requestEmployee(item: ApprovalItem) {
  const employee = item.request.employee;
  return {
    name: employee?.name || (item.kind === "remote_work" ? item.request.employeeNameSnapshot : "Employee"),
    code: employee?.code || employee?.username || (item.kind === "remote_work" ? item.request.employeeCodeSnapshot : ""),
  };
}

function requestTitle(item: ApprovalItem) {
  if (item.kind === "leave_cancellation") {
    return `Cancel ${item.request.leaveRequest?.leaveTypeNameSnapshot || "approved leave"}`;
  }
  if (item.kind === "leave_encashment") {
    return `${item.request.leaveTypeNameSnapshot} (${item.request.leaveTypeCodeSnapshot}) encashment`;
  }
  if (item.kind === "leave") {
    return `${item.request.leaveTypeNameSnapshot} (${item.request.leaveTypeCodeSnapshot})`;
  }
  if (item.kind === "comp_off") {
    return `${item.request.leaveType?.name || "Comp-off"} (${item.request.leaveType?.code || "CO"})`;
  }
  if (item.kind === "attendance_regularization") {
    return item.request.correctionType.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  return "Work from home";
}

function requestUnits(item: ApprovalItem) {
  if (item.kind === "leave_cancellation") {
    const leave = item.request.leaveRequest;
    const unit = Number(leave?.chargedUnits) === 1
      ? String(leave?.leaveUnit || "days").replace(/s$/, "")
      : leave?.leaveUnit || "days";
    return `${leave?.chargedUnits || 0} ${unit}`;
  }
  if (item.kind === "leave_encashment") {
    const unit = item.request.requestedUnits === 1
      ? item.request.leaveUnit.replace(/s$/, "")
      : item.request.leaveUnit;
    return `${item.request.requestedUnits} ${unit}`;
  }
  if (item.kind === "leave") {
    const unit = item.request.chargedUnits === 1
      ? item.request.leaveUnit.replace(/s$/, "")
      : item.request.leaveUnit;
    return `${item.request.chargedUnits} ${unit}`;
  }
  if (item.kind === "comp_off") {
    return `${item.request.requestedUnits} ${item.request.requestedUnits === 1 ? "day" : "days"} credit`;
  }
  if (item.kind === "attendance_regularization") return "Attendance record correction";
  return `${item.request.requestedUnits} ${item.request.requestedUnits === 1 ? "day" : "days"}`;
}

function requestDates(item: ApprovalItem) {
  if (item.kind === "leave_cancellation") {
    return {
      from: item.request.leaveRequest?.fromDate,
      to: item.request.leaveRequest?.toDate,
    };
  }
  if (item.kind === "leave_encashment") {
    const requestedDate = item.request.requestedAt.slice(0, 10);
    return { from: requestedDate, to: requestedDate };
  }
  if (item.kind === "comp_off") {
    return { from: item.request.attendanceDate, to: item.request.attendanceDate };
  }
  if (item.kind === "attendance_regularization") {
    return { from: item.request.attendanceDate, to: item.request.attendanceDate };
  }
  return { from: item.request.fromDate, to: item.request.toDate };
}

function approvalStage(item: ApprovalItem) {
  const instance = item.request.approvalInstance;
  if (!instance?.steps?.length) return "";
  return instance.steps.find((step: any) => step.order === instance.currentStepOrder)?.nameSnapshot || "";
}

const kindLabel = (kind: ApprovalItem["kind"]) =>
  kind === "leave"
    ? "Leave"
    : kind === "leave_cancellation"
      ? "Leave cancellation"
      : kind === "leave_encashment"
        ? "Leave encashment"
        : kind === "remote_work"
          ? "WFH"
          : kind === "attendance_regularization"
            ? "Attendance correction"
            : "Comp-off";

const kindColor = (kind: ApprovalItem["kind"]) =>
  kind === "leave"
    ? "blue"
    : kind === "leave_cancellation"
      ? "red"
      : kind === "leave_encashment"
        ? "cyan"
        : kind === "remote_work"
          ? "purple"
          : kind === "attendance_regularization"
            ? "orange"
            : "teal";

const requestSubmittedAt = (item: ApprovalItem) =>
  item.kind === "leave_cancellation" || item.kind === "leave_encashment"
    ? item.request.requestedAt
    : item.request.submittedAt;

export default function ManagerApprovalInbox() {
  const toast = useToast();
  const details = useDisclosure();
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.400");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveCancellations, setLeaveCancellations] = useState<LeaveCancellationRequest[]>([]);
  const [leaveEncashments, setLeaveEncashments] = useState<LeaveEncashmentRequest[]>([]);
  const [remoteWorkRequests, setRemoteWorkRequests] = useState<RemoteWorkRequest[]>([]);
  const [compOffClaims, setCompOffClaims] = useState<CompOffClaim[]>([]);
  const [regularizationRequests, setRegularizationRequests] = useState<AttendanceRegularizationRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<ApprovalItem | null>(null);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leaveResult, cancellationResult, encashmentResult, remoteWorkResult, compOffResult, regularizationResult] = await Promise.all([
        fetchLeaveRequests({ scope: "approvals", status: "submitted", page: 1, limit: 20 }),
        fetchLeaveCancellationRequests({ scope: "approvals", status: "submitted", page: 1, limit: 20 }),
        fetchLeaveEncashmentRequests({ scope: "approvals", status: "submitted", page: 1, limit: 20 }),
        fetchRemoteWorkRequests({ scope: "approvals", page: 1, limit: 20 }),
        fetchCompOffClaims({ scope: "approvals", status: "submitted", page: 1, limit: 20 }),
        fetchAttendanceRegularizationRequests({ scope: "approvals", status: "submitted", page: 1, limit: 20 }),
      ]);
      setLeaveRequests(leaveResult.items || []);
      setLeaveCancellations(cancellationResult.items || []);
      setLeaveEncashments(encashmentResult.items || []);
      setRemoteWorkRequests(remoteWorkResult.items || []);
      setCompOffClaims(compOffResult.items || []);
      setRegularizationRequests(regularizationResult.items || []);
      setTotal(
        Number(leaveResult.pagination?.total || 0) +
        Number(cancellationResult.pagination?.total || 0) +
        Number(encashmentResult.pagination?.total || 0) +
        Number(remoteWorkResult.pagination?.total || 0) +
        Number(compOffResult.pagination?.total || 0) +
        Number(regularizationResult.pagination?.total || 0)
      );
    } catch (error: any) {
      toast({
        title: getApiErrorMessage(error?.response?.data || error, "Could not load assigned approvals"),
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo<ApprovalItem[]>(() => [
    ...leaveRequests.map((request) => ({ kind: "leave" as const, request })),
    ...leaveCancellations.map((request) => ({ kind: "leave_cancellation" as const, request })),
    ...leaveEncashments.map((request) => ({ kind: "leave_encashment" as const, request })),
    ...remoteWorkRequests.map((request) => ({ kind: "remote_work" as const, request })),
    ...compOffClaims.map((request) => ({ kind: "comp_off" as const, request })),
    ...regularizationRequests.map((request) => ({ kind: "attendance_regularization" as const, request })),
  ].sort((left, right) => (
    new Date(requestSubmittedAt(right)).getTime() - new Date(requestSubmittedAt(left)).getTime()
  )), [compOffClaims, leaveCancellations, leaveEncashments, leaveRequests, regularizationRequests, remoteWorkRequests]);

  const open = (item: ApprovalItem) => {
    setSelected(item);
    setComment("");
    details.onOpen();
  };

  const decide = async (action: "approve" | "reject") => {
    if (!selected) return;
    if (action === "reject" && comment.trim().length < 3) {
      toast({ title: "Add a rejection reason of at least 3 characters", status: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      let updated: LeaveRequest | LeaveCancellationRequest | LeaveEncashmentRequest | RemoteWorkRequest | CompOffClaim | AttendanceRegularizationRequest;
      if (selected.kind === "leave") {
        updated = await actOnLeaveRequest(selected.request._id, action, { comment: comment.trim() || undefined });
      } else if (selected.kind === "leave_cancellation") {
        updated = await actOnLeaveCancellationRequest(selected.request._id, action, { comment: comment.trim() || undefined });
      } else if (selected.kind === "leave_encashment") {
        updated = await actOnLeaveEncashmentRequest(selected.request._id, action, { comment: comment.trim() || undefined });
      } else if (selected.kind === "remote_work") {
        updated = await actOnRemoteWorkRequest(selected.request._id, action, { comment: comment.trim() || undefined });
      } else if (selected.kind === "attendance_regularization") {
        updated = await actOnAttendanceRegularizationRequest(selected.request._id, action, { comment: comment.trim() || undefined });
      } else {
        updated = await actOnCompOffClaim(selected.request._id, action, { comment: comment.trim() || undefined });
      }
      const movedToNextLevel = action === "approve" && ["submitted", "manager_approved"].includes(updated.status);
      toast({
        title: action === "reject"
          ? "Request rejected"
          : movedToNextLevel
            ? "Approval recorded; request moved to the next level"
            : "Request approved",
        status: "success",
      });
      details.onClose();
      setSelected(null);
      await load();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, `Could not ${action} request`), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Skeleton h="160px" borderRadius="14px" />;
  }

  if (!items.length) {
    return null;
  }

  return (
    <>
      <Box
        bg={surface}
        borderWidth="1px"
        borderColor={border}
        borderRadius="14px"
        boxShadow="0 10px 28px rgba(15, 23, 42, 0.06)"
        overflow="hidden"
      >
        <Flex px={{ base: 4, md: 5 }} py={4} justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3} direction={{ base: "column", md: "row" }}>
          <Box>
            <HStack>
              <Heading size="md">Needs your approval</Heading>
              <Badge colorScheme="orange" borderRadius="full" px={2.5}>{total}</Badge>
            </HStack>
            <Text mt={1} fontSize="sm" color={muted}>Leave, cancellation, encashment, work-from-home, comp-off, and attendance requests assigned to you.</Text>
          </Box>
          <Button size="sm" variant="outline" leftIcon={<FiRefreshCw />} onClick={load}>Refresh</Button>
        </Flex>
        <Divider />
        <Stack spacing={0}>
          {items.slice(0, 6).map((item, index) => {
            const employee = requestEmployee(item);
            return (
              <Flex
                key={`${item.kind}-${item.request._id}`}
                px={{ base: 4, md: 5 }}
                py={4}
                gap={4}
                justify="space-between"
                align={{ base: "flex-start", md: "center" }}
                direction={{ base: "column", md: "row" }}
                borderBottomWidth={index === Math.min(items.length, 6) - 1 ? 0 : "1px"}
                borderColor={border}
              >
                <Box minW={0}>
                  <HStack flexWrap="wrap">
                    <Text fontWeight="800">{employee.name}</Text>
                    {employee.code ? <Text fontSize="xs" color={muted}>{employee.code}</Text> : null}
                    <Badge colorScheme={kindColor(item.kind)} textTransform="none">
                      {kindLabel(item.kind)}
                    </Badge>
                    {approvalStage(item) ? <Badge colorScheme="orange" textTransform="none">{approvalStage(item)}</Badge> : null}
                  </HStack>
                  <Text mt={1} fontSize="sm" fontWeight="700">{requestTitle(item)}</Text>
                  <HStack mt={1} color={muted} fontSize="xs" flexWrap="wrap">
                    <FiClock />
                    <Text>{formatDate(requestDates(item).from)}{requestDates(item).from !== requestDates(item).to ? ` to ${formatDate(requestDates(item).to)}` : ""}</Text>
                    <Text>|</Text>
                    <Text>{requestUnits(item)}</Text>
                  </HStack>
                </Box>
                <Button size="sm" variant="outline" leftIcon={<FiEye />} onClick={() => open(item)}>Review</Button>
              </Flex>
            );
          })}
        </Stack>
        {items.length > 6 ? <Text px={5} py={3} borderTopWidth="1px" borderColor={border} fontSize="xs" color={muted}>Showing the 6 most recent of {total} pending requests.</Text> : null}
      </Box>

      <Drawer isOpen={details.isOpen} placement="right" size="md" onClose={details.onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Review request</DrawerHeader>
          <DrawerBody py={5}>
            {selected ? (
              <Stack spacing={5}>
                <Box>
                  <HStack flexWrap="wrap">
                    <Heading size="md">{requestEmployee(selected).name}</Heading>
                    <Badge colorScheme={kindColor(selected.kind)}>{kindLabel(selected.kind)}</Badge>
                  </HStack>
                  <Text mt={1} color={muted} fontSize="sm">{requestEmployee(selected).code}</Text>
                </Box>
                <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
                  <Text fontWeight="800">{requestTitle(selected)}</Text>
                  <Text mt={1}>{formatDate(requestDates(selected).from)}{requestDates(selected).from !== requestDates(selected).to ? ` to ${formatDate(requestDates(selected).to)}` : ""}</Text>
                  <Text mt={1} color={muted} fontSize="sm">{requestUnits(selected)}</Text>
                  {approvalStage(selected) ? <Text mt={2} fontSize="xs" fontWeight="700" color="orange.600">Current level: {approvalStage(selected)}</Text> : null}
                  {selected.kind === "comp_off" ? <Text mt={1} color={muted} fontSize="sm">{selected.request.workedMinutesSnapshot} worked minutes on {selected.request.dayTypeSnapshot.replace(/_/g, " ")}</Text> : null}
                  {selected.kind === "attendance_regularization" ? (
                    <Stack mt={3} spacing={1} fontSize="sm">
                      <Text color={muted}>Requested correction: {requestTitle(selected)}</Text>
                      {selected.request.requestedChanges?.punchIn ? <Text>New punch-in: {new Date(selected.request.requestedChanges.punchIn).toLocaleString()}</Text> : null}
                      {selected.request.requestedChanges?.punchOut ? <Text>New punch-out: {new Date(selected.request.requestedChanges.punchOut).toLocaleString()}</Text> : null}
                      {selected.request.requestedChanges?.workMode ? <Text>New work mode: {selected.request.requestedChanges.workMode}</Text> : null}
                    </Stack>
                  ) : null}
                </Box>
                <Box>
                  <Text fontSize="xs" color={muted}>Reason</Text>
                  <Text mt={1}>{selected.request.reason || "No reason provided"}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="700" mb={2}>Decision comment</Text>
                  <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Required when rejecting" />
                </Box>
              </Stack>
            ) : null}
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" gap={2}>
            <Button variant="outline" onClick={details.onClose}>Close</Button>
            <Button colorScheme="red" variant="outline" leftIcon={<FiX />} onClick={() => decide("reject")} isLoading={submitting}>Reject</Button>
            <Button colorScheme="green" leftIcon={<FiCheck />} onClick={() => decide("approve")} isLoading={submitting}>Approve</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
