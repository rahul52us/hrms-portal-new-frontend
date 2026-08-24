"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  LeaveRequest,
  actOnLeaveRequest,
  fetchLeaveRequests,
} from "@/app/component/leave/leaveApi";
import {
  RemoteWorkRequest,
  actOnRemoteWorkRequest,
  fetchRemoteWorkRequests,
} from "@/app/component/remote-work/remoteWorkApi";
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
  | { kind: "remote_work"; request: RemoteWorkRequest };

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
  return item.kind === "leave"
    ? `${item.request.leaveTypeNameSnapshot} (${item.request.leaveTypeCodeSnapshot})`
    : "Work from home";
}

function requestUnits(item: ApprovalItem) {
  if (item.kind === "leave") {
    const unit = item.request.chargedUnits === 1
      ? item.request.leaveUnit.replace(/s$/, "")
      : item.request.leaveUnit;
    return `${item.request.chargedUnits} ${unit}`;
  }
  return `${item.request.requestedUnits} ${item.request.requestedUnits === 1 ? "day" : "days"}`;
}

export default function ManagerApprovalInbox() {
  const toast = useToast();
  const details = useDisclosure();
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.400");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [remoteWorkRequests, setRemoteWorkRequests] = useState<RemoteWorkRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<ApprovalItem | null>(null);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leaveResult, remoteWorkResult] = await Promise.all([
        fetchLeaveRequests({ scope: "approvals", status: "submitted", page: 1, limit: 20 }),
        fetchRemoteWorkRequests({ scope: "approvals", page: 1, limit: 20 }),
      ]);
      setLeaveRequests(leaveResult.items || []);
      setRemoteWorkRequests(remoteWorkResult.items || []);
      setTotal(Number(leaveResult.pagination?.total || 0) + Number(remoteWorkResult.pagination?.total || 0));
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
    ...remoteWorkRequests.map((request) => ({ kind: "remote_work" as const, request })),
  ].sort((left, right) => (
    new Date(right.request.submittedAt).getTime() - new Date(left.request.submittedAt).getTime()
  )), [leaveRequests, remoteWorkRequests]);

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
      if (selected.kind === "leave") {
        await actOnLeaveRequest(selected.request._id, action, { comment: comment.trim() || undefined });
      } else {
        await actOnRemoteWorkRequest(selected.request._id, action, { comment: comment.trim() || undefined });
      }
      toast({ title: action === "approve" ? "Request approved" : "Request rejected", status: "success" });
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
            <Text mt={1} fontSize="sm" color={muted}>Leave and work-from-home requests assigned to you.</Text>
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
                    <Badge colorScheme={item.kind === "leave" ? "blue" : "purple"} textTransform="none">
                      {item.kind === "leave" ? "Leave" : "WFH"}
                    </Badge>
                  </HStack>
                  <Text mt={1} fontSize="sm" fontWeight="700">{requestTitle(item)}</Text>
                  <HStack mt={1} color={muted} fontSize="xs" flexWrap="wrap">
                    <FiClock />
                    <Text>{formatDate(item.request.fromDate)}{item.request.fromDate !== item.request.toDate ? ` to ${formatDate(item.request.toDate)}` : ""}</Text>
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
                    <Badge colorScheme={selected.kind === "leave" ? "blue" : "purple"}>{selected.kind === "leave" ? "Leave" : "WFH"}</Badge>
                  </HStack>
                  <Text mt={1} color={muted} fontSize="sm">{requestEmployee(selected).code}</Text>
                </Box>
                <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
                  <Text fontWeight="800">{requestTitle(selected)}</Text>
                  <Text mt={1}>{formatDate(selected.request.fromDate)}{selected.request.fromDate !== selected.request.toDate ? ` to ${formatDate(selected.request.toDate)}` : ""}</Text>
                  <Text mt={1} color={muted} fontSize="sm">{requestUnits(selected)}</Text>
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
