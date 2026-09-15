"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { actOnLeaveRequest } from "@/app/component/leave/leaveApi";
import { actOnRemoteWorkRequest } from "@/app/component/remote-work/remoteWorkApi";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormLabel, HStack, IconButton, Select, Skeleton, Stack, Text, Textarea, Tooltip, useToast } from "@chakra-ui/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiCheck, FiChevronLeft, FiChevronRight, FiPlus, FiX } from "react-icons/fi";
import { CalendarCategory, CalendarEvent, CalendarRow, fetchCalendarDay } from "./calendarApi";

export const displayDate = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const label = (value: string) => ({ full: "Full day", first_half: "First half", second_half: "Second half" }[value] || value.replace(/_/g, " "));

export default function CalendarDayDrawer({ date, params, initialCategory, onClose, onChanged }: {
  date: string | null; params: Record<string, any>; initialCategory: CalendarCategory; onClose: () => void; onChanged: () => void;
}) {
  const toast = useToast();
  const [category, setCategory] = useState<CalendarCategory>(initialCategory);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CalendarRow[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => { setCategory(initialCategory); setPage(1); setSelected(null); setComment(""); }, [date, initialCategory]);
  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    setLoading(true); setError(""); setItems([]);
    fetchCalendarDay({ ...params, date, category, page, limit: 20 }, controller.signal)
      .then((result) => { setItems(result.items); setPagination(result.pagination); })
      .catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Could not load this day")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, category, page, params, revision]);
  const act = async (action: "approve" | "reject" | "withdraw") => {
    if (!selected) return;
    if (action === "reject" && comment.trim().length < 3) { toast({ title: "Enter a rejection reason", status: "warning" }); return; }
    setSubmitting(true);
    try {
      const api = selected.kind === "leave" ? actOnLeaveRequest : actOnRemoteWorkRequest;
      const updated = await api(selected.id, action, { comment: comment.trim() || undefined });
      toast({ title: action === "approve" && updated.status !== "approved" ? "Approval recorded; awaiting the next approver" : action === "approve" ? "Request approved" : action === "reject" ? "Request rejected" : "Request withdrawn", status: "success" });
      setSelected(null); setComment(""); setRevision((value) => value + 1); onChanged();
    } catch (err: any) { toast({ title: getApiErrorMessage(err?.response?.data || err, "Could not update request"), status: "error" }); }
    finally { setSubmitting(false); }
  };
  return <DashboardDrawer isOpen={Boolean(date)} onClose={onClose} titlePrefix={selected ? "Request" : "Calendar"}
    titleSuffix={date ? displayDate(date) : ""} maxW={{ base: "100%", md: "640px" }}
    footerContent={selected && (selected.canWithdraw || selected.canApprove) ? <Flex w="full" justify="end" gap={2} flexWrap="wrap">
      {selected.canWithdraw && <Button variant="outline" isLoading={submitting} onClick={() => act("withdraw")}>Withdraw request</Button>}
      {selected.canApprove && <><Button variant="outline" colorScheme="red" leftIcon={<FiX />} isLoading={submitting} onClick={() => act("reject")}>Reject</Button><Button colorScheme="green" leftIcon={<FiCheck />} isLoading={submitting} onClick={() => act("approve")}>Approve</Button></>}
    </Flex> : undefined}>
    {selected ? <Stack spacing={5}>
      <Button alignSelf="start" size="sm" variant="ghost" leftIcon={<FiArrowLeft />} onClick={() => setSelected(null)}>Back to day</Button>
      <Box><Text fontSize="lg" fontWeight="700">{selected.employee.name}</Text><Text fontSize="sm" color="gray.500">{selected.employee.code}</Text></Box>
      <HStack flexWrap="wrap"><Text fontWeight="700">{selected.title}{selected.code ? ` (${selected.code})` : ""}</Text><Badge colorScheme={selected.status === "approved" ? "green" : "yellow"}>{selected.status === "approved" ? "Approved" : "Pending approval"}</Badge></HStack>
      <Box><Text>{displayDate(selected.fromDate)}{selected.fromDate !== selected.toDate ? ` to ${displayDate(selected.toDate)}` : ""}</Text><Text mt={2} fontSize="sm">{label(selected.portion)} | {selected.units} {selected.units === 1 ? selected.unit.replace(/s$/, "") : selected.unit} on {date ? displayDate(date) : ""}</Text></Box>
      {selected.reason && <Box><Text fontSize="sm" color="gray.500" mb={1}>Reason</Text><Text whiteSpace="pre-wrap">{selected.reason}</Text></Box>}
      {selected.cancellationPending && <Alert status="info"><AlertIcon />A cancellation request is pending. This leave is still approved.</Alert>}
      {selected.canApprove && <FormControl><FormLabel>Decision note</FormLabel><Textarea placeholder="Required when rejecting" value={comment} onChange={(event) => setComment(event.target.value)} /></FormControl>}
    </Stack> : <Stack spacing={4}>
      <Flex gap={3} justify="space-between" flexWrap="wrap">
        <Select aria-label="Day category" size="sm" maxW="230px" value={category} onChange={(event) => { setCategory(event.target.value as CalendarCategory); setPage(1); }}>
          <option value="all">All calendar items</option><option value="leave">Leave</option><option value="wfh">Work from home</option><option value="holiday">Holidays</option><option value="weekly_off">Weekly offs</option>
        </Select>
        <Button as={Link} href={`/dashboard/requests?applyDate=${date || ""}`} size="sm" colorScheme="blue" leftIcon={<FiPlus />}>Apply</Button>
      </Flex>
      {error ? <Alert status="error"><AlertIcon />{error}</Alert> : loading ? <Stack><Skeleton h="90px" /><Skeleton h="90px" /><Skeleton h="90px" /></Stack> : items.length ? <Stack spacing={0} divider={<Box borderBottomWidth="1px" />}>
        {items.map((row) => <Box key={row.employee.id} py={4}>
          <HStack justify="space-between" align="start"><Box minW={0}><Text fontWeight="700" overflowWrap="anywhere">{row.employee.name}</Text><Text fontSize="xs" color="gray.500">{[row.employee.code, row.department, row.team, row.officeLocation].filter(Boolean).join(" | ")}</Text></Box></HStack>
          {row.holiday && <Text mt={2} fontSize="sm" color="pink.600">{row.holiday.name}{row.holiday.type === "optional" ? " | Optional holiday" : ""}{row.holiday.isHalfDay ? " | Half day" : ""}</Text>}
          {row.dayType === "weekly_off" && <Text mt={2} fontSize="sm" color="gray.500">Weekly off</Text>}
          {row.schedule.isWorkingDay && <Text mt={2} fontSize="sm" color="gray.500">Work schedule: {row.schedule.startTime} - {row.schedule.endTime}{row.schedule.startTime && row.schedule.endTime && row.schedule.endTime < row.schedule.startTime ? " (next day)" : ""}{row.timezone ? ` | ${row.timezone}` : ""}</Text>}
          {row.dayType === "unconfigured" && <Text mt={2} fontSize="sm" color="red.600">Work schedule is not configured for this date.</Text>}
          {row.events.map((event) => <Button key={`${event.kind}:${event.id}`} mt={2} mr={2} size="sm" variant="outline" h="auto" minH={8} whiteSpace="normal" textAlign="left" onClick={() => { setSelected(event); setComment(""); }}>
            {event.title} | {label(event.portion)}{event.status === "approved" ? "" : " | Pending"}
          </Button>)}
          {row.assignmentSource !== "history" && <Text mt={2} fontSize="xs" color="gray.500">{row.assignmentSource === "missing_history" ? "Historical assignment unavailable" : "Using current assignment; historical assignment unavailable"}</Text>}
        </Box>)}
      </Stack> : <Text py={10} textAlign="center" color="gray.500">No calendar items match this filter.</Text>}
      <HStack justify="space-between"><Text fontSize="sm" color="gray.500">{pagination.total} {pagination.total === 1 ? "employee" : "employees"}</Text><HStack>
        <Tooltip label="Previous page"><IconButton aria-label="Previous day page" icon={<FiChevronLeft />} size="sm" variant="outline" isDisabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)} /></Tooltip>
        <Text fontSize="sm">{page} / {pagination.totalPages}</Text>
        <Tooltip label="Next page"><IconButton aria-label="Next day page" icon={<FiChevronRight />} size="sm" variant="outline" isDisabled={loading || page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)} /></Tooltip>
      </HStack></HStack>
    </Stack>}
  </DashboardDrawer>;
}
