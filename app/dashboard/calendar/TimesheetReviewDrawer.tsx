"use client";

import { Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormLabel, SimpleGrid, Skeleton, Stack, Text, Textarea, useToast } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import stores from "@/app/store/stores";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { actOnTimesheetSubmission, getTimesheetSubmission, reassignTimesheetApproval, ReassignmentPayload, TimesheetActionPayload, TimesheetSubmission } from "./timesheetApi";
import TimesheetReassignmentPanel from "./TimesheetReassignmentPanel";
import { formatMinutes } from "./timesheetUi.utils";

export default function TimesheetReviewDrawer({ submissionId, onClose, onChanged }: { submissionId: string; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = useState<TimesheetSubmission | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [comment, setComment] = useState(""), [busy, setBusy] = useState(false), [refresh, setRefresh] = useState(0);
  const flight = useRef(false), retry = useRef<{ signature: string; payload: TimesheetActionPayload } | null>(null);
  const toast = useToast();
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setData(null); setComment(""); retry.current = null;
    getTimesheetSubmission(submissionId, controller.signal).then((value) => { if (!controller.signal.aborted) setData(value); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Could not load submission")); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [submissionId, refresh]);
  const own = data?.employee._id === stores.auth.user?._id;
  const approver = data?.status === "submitted" && !own && data.currentApprovers.includes(stores.auth.user?._id || "");
  const canWithdraw = own && data?.status === "submitted" && !data.approvalInstance.history.some((h) => h.action === "step_approved");
  const canReopen = data?.status === "approved" && ["admin", "hradmin"].includes(String(stores.auth.user?.role));
  async function act(action: "approve" | "return" | "reject" | "withdraw" | "reopen") {
    if (!data || flight.current) return;
    if (["return", "reject", "reopen"].includes(action) && comment.trim().length < 3) { setError("Enter a reason of at least 3 characters."); return; }
    const signature = JSON.stringify({ action, revision: data.sheetRevision, comment: comment.trim() });
    if (retry.current?.signature !== signature) retry.current = { signature, payload: { revision: data.sheetRevision, requestId: crypto.randomUUID(), comment: comment.trim() } };
    flight.current = true; setBusy(true); setError("");
    try {
      const saved = await actOnTimesheetSubmission(data._id, action, retry.current.payload);
      toast({ title: action === "approve" && saved.status === "submitted" ? "Approval recorded; awaiting the next approver" : `Timesheet ${saved.status}`, status: "success" });
      retry.current = null; onChanged(); onClose();
    } catch (err: any) { setError(getApiErrorMessage(err?.response?.data || err, "Could not update timesheet")); }
    finally { flight.current = false; setBusy(false); }
  }
  async function reassign(payload: ReassignmentPayload) {
    if (flight.current) throw new Error("Another timesheet action is running");
    flight.current = true; setBusy(true);
    try { await reassignTimesheetApproval(submissionId, payload); toast({ title: "Pending approval reassigned", status: "success" }); setRefresh((r) => r + 1); onChanged(); }
    finally { flight.current = false; setBusy(false); }
  }
  return <DashboardDrawer isOpen onClose={() => { if (!busy) onClose(); }} titlePrefix="Timesheet" titleSuffix={data?.attendanceDate || "submission"} maxW={{ base: "100%", md: "840px" }}
    footerContent={<Flex w="full" justify="end" gap={2} wrap="wrap"><Button variant="outline" onClick={() => setRefresh((r) => r + 1)} isDisabled={busy}>Reload submission</Button>{canWithdraw ? <Button variant="outline" onClick={() => act("withdraw")} isLoading={busy}>Withdraw submission</Button> : null}{canReopen ? <Button variant="outline" onClick={() => act("reopen")} isLoading={busy}>Reopen for correction</Button> : null}{approver ? <><Button variant="outline" onClick={() => act("return")} isLoading={busy}>Return for correction</Button><Button variant="outline" colorScheme="red" onClick={() => act("reject")} isLoading={busy}>Reject timesheet</Button><Button colorScheme="green" onClick={() => act("approve")} isLoading={busy}>Approve timesheet</Button></> : null}</Flex>}>
    {error ? <Alert status="error" mb={4}><AlertIcon />{error}</Alert> : null}
    {loading ? <Skeleton h="300px" /> : data?.snapshot ? <Stack spacing={5}>
      <Flex justify="space-between" gap={3} wrap="wrap"><Box><Text fontSize="lg" fontWeight="700">{data.employeeNameSnapshot}</Text><Text fontSize="sm" color="gray.500">{data.employeeCodeSnapshot} | Submission {data.submissionNumber}</Text></Box><Badge alignSelf="start" colorScheme={data.status === "approved" ? "green" : "blue"}>{data.status}</Badge></Flex>
      <SimpleGrid columns={3} spacing={3}>{[["Required", data.requiredMinutes], ["Logged", data.loggedMinutes], ["Shortfall", data.shortfallMinutes]].map(([label, minutes]) => <Box key={label as string}><Text fontSize="xs" color="gray.500">{label}</Text><Text fontWeight="700">{formatMinutes(minutes as number)}</Text></Box>)}</SimpleGrid>
      <TimesheetReassignmentPanel submission={data} busy={busy} onConfirm={reassign} />
      <Box fontSize="sm">
        <Text>Shift: {data.snapshot.contextSnapshot.schedule.startTime} - {data.snapshot.contextSnapshot.schedule.endTime} | {data.snapshot.timezone}</Text>
        <Text mt={1}>Work mode: {data.snapshot.contextSnapshot.attendance?.workMode === "remote" ? "Work from home" : "Office"}</Text>
        {data.snapshot.contextSnapshot.attendance?.punchSessions.map((session, index) => <Text key={index} mt={1}>Punches: {[session.punchIn, session.punchOut].map((value) => value ? new Intl.DateTimeFormat("en-GB", { timeZone: data.snapshot!.timezone, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "Not recorded").join(" - ")}</Text>)}
        <Text mt={1}>Approval flow: {data.approvalInstance.workflowNameSnapshot}</Text>
        {data.approvalDeadlineAt ? <Text mt={1} color={data.approvalOverdue ? "red.500" : undefined}>Approval {data.approvalOverdue ? "overdue" : "due"}: {new Intl.DateTimeFormat("en-GB", { timeZone: data.snapshot.timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(data.approvalDeadlineAt))}</Text> : null}
        {data.approvalInstance.steps.map((step) => <Text key={step.order} mt={1}>{step.nameSnapshot}: {step.status} | {step.approvers.map((a: any) => `${a.nameSnapshot} (${a.reassignedTo ? "reassigned" : a.status})`).join(", ")}</Text>)}
      </Box>
      <Stack spacing={0}>{data.snapshot.entries.map((entry) => <Box key={entry.entryId} py={4} borderTopWidth="1px"><Text fontWeight="600">{entry.projectNameSnapshot} / {entry.workTypeNameSnapshot}</Text><Text mt={1} fontSize="sm">{entry.startDate} {entry.startTime} - {entry.endDate} {entry.endTime} | {formatMinutes(entry.minutes)}</Text><Text mt={2} fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{entry.notes}</Text></Box>)}</Stack>
      {approver || canReopen ? <FormControl id="timesheet-decision-comment"><FormLabel>Decision reason</FormLabel><Textarea aria-label="Timesheet decision reason" value={comment} maxLength={500} onChange={(event) => setComment(event.target.value)} placeholder="Required for return, rejection or reopening" isDisabled={busy} /></FormControl> : null}
      <Box borderTopWidth="1px" pt={4}><Text fontWeight="700">Submission history</Text>{data.history.map((item) => <Box key={item._id} mt={3}><Text fontSize="sm">{item.action.replace(/_/g, " ")} | {item.actorNameSnapshot} | {new Date(item.at).toLocaleString()}</Text>{item.reassignment ? <Text fontSize="sm" mt={1} overflowWrap="anywhere">{item.reassignment.stepName}: {item.reassignment.from.name} to {item.reassignment.to.name}</Text> : null}{item.comment ? <Text mt={1} fontSize="sm" whiteSpace="pre-wrap">{item.comment}</Text> : null}</Box>)}</Box>
    </Stack> : null}
  </DashboardDrawer>;
}
