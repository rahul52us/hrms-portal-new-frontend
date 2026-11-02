"use client";
import { Alert, AlertIcon, Badge, Box, Button, Flex, SimpleGrid, Skeleton, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import TimesheetReviewDrawer from "../calendar/TimesheetReviewDrawer";
import TimesheetControlsPanel from "../calendar/TimesheetControlsPanel";
import TimesheetContextHistory from "../calendar/TimesheetContextHistory";
import { formatMinutes } from "../calendar/timesheetUi.utils";
import { operationsDay, OperationsDay, Scope } from "./timesheetOperationsApi";
export default function OperationsDayDrawer({ employeeId, date, scope, onClose, onChanged }: { employeeId: string; date: string; scope: Scope; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = useState<OperationsDay | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(""), [revision, setRevision] = useState(0), [submission, setSubmission] = useState(false);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(""); setData(null); operationsDay(employeeId, date, scope, controller.signal).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Could not load employee day")); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [employeeId, date, scope, revision]);
  return <><DashboardDrawer isOpen={!submission} onClose={onClose} titlePrefix="Timesheet" titleSuffix={date} maxW={{ base: "100%", md: "840px" }}>
    {error ? <Alert status="error"><AlertIcon />{error}<Button ml="auto" onClick={() => setRevision((r) => r + 1)}>Retry</Button></Alert> : loading ? <Skeleton h="280px" /> : data ? <Stack spacing={5}>
      <Flex justify="space-between" gap={3} wrap="wrap"><Box><Text fontWeight="700" fontSize="lg">{data.employee.name}</Text><Text fontSize="sm" color="gray.500">{data.employee.code}</Text><Text fontSize="sm" mt={2}>{[data.organization.departmentNameSnapshot, data.organization.teamNameSnapshot, data.organization.officeLocationNameSnapshot].filter(Boolean).join(" | ")}</Text></Box><Badge alignSelf="start">{data.timesheet?.status || "No saved timesheet"}</Badge></Flex>
      <SimpleGrid columns={3} spacing={3}>{[["Required", data.requiredMinutes], ["Logged", data.loggedMinutes], ["Shortfall", data.shortfallMinutes]].map(([label, minutes]) => <Box key={label as string}><Text fontSize="xs" color="gray.500">{label}</Text><Text fontWeight="700">{formatMinutes(minutes as number | null)}</Text></Box>)}</SimpleGrid>
      <Text fontSize="sm">Shift: {data.context.schedule.startTime || "Not configured"} - {data.context.schedule.endTime || "--:--"} | {data.context.timezone || "Timezone not configured"}</Text>
      {data.eligibility.payrollCycle ? <Box fontSize="sm"><Text>Payroll cycle: {data.eligibility.payrollCycle.startDate} to {data.eligibility.payrollCycle.endDate}</Text><Text>Submission cutoff: {new Intl.DateTimeFormat("en-GB", { timeZone: data.context.timezone || "UTC", dateStyle: "medium", timeStyle: "short" }).format(new Date(data.eligibility.payrollCycle.submissionAt))}</Text><Text>Approval due: {new Intl.DateTimeFormat("en-GB", { timeZone: data.context.timezone || "UTC", dateStyle: "medium", timeStyle: "short" }).format(new Date(data.eligibility.payrollCycle.approvalAt))}</Text></Box> : null}
      <TimesheetControlsPanel date={date} timezone={data.context.timezone} target={{ employeeId, scope }} onChanged={() => { setRevision((r) => r + 1); onChanged(); }} />
      {data.contextChanged ? <Alert status="warning"><AlertIcon />Attendance, leave or policy context differs from the saved timesheet.</Alert> : null}
      <TimesheetContextHistory date={date} target={{ employeeId, scope }} />
      {[...data.eligibility.setupIssues, ...data.eligibility.saveIssues, ...data.eligibility.submissionIssues].map((issue) => <Text key={issue.code} fontSize="sm" color="orange.700">{issue.message}</Text>)}
      {data.timesheet?.entries.length ? data.timesheet.entries.map((entry) => <Box key={entry.entryId} borderTopWidth="1px" py={4}><Text fontWeight="600">{entry.projectNameSnapshot} / {entry.workTypeNameSnapshot}</Text><Text mt={1} fontSize="sm">{entry.startDate} {entry.startTime} - {entry.endDate} {entry.endTime} | {formatMinutes(entry.minutes)}</Text><Text mt={2} fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{entry.notes}</Text></Box>) : <Text color="gray.500">No work entries recorded for this date.</Text>}
      {data.timesheet?.currentSubmission ? <Button alignSelf="start" onClick={() => setSubmission(true)}>Approval details</Button> : null}
    </Stack> : null}
  </DashboardDrawer>{submission && data?.timesheet?.currentSubmission ? <TimesheetReviewDrawer submissionId={data.timesheet.currentSubmission} onClose={() => setSubmission(false)} onChanged={() => { setRevision((r) => r + 1); onChanged(); }} /> : null}</>;
}
