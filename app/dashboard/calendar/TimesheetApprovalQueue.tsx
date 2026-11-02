"use client";

import { Alert, AlertIcon, Badge, Box, Button, Flex, Skeleton, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { listTimesheetSubmissions, TimesheetSubmission } from "./timesheetApi";
import { formatMinutes } from "./timesheetUi.utils";
import TimesheetReviewDrawer from "./TimesheetReviewDrawer";

export default function TimesheetApprovalQueue({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [page, setPage] = useState(1), [pages, setPages] = useState(1), [total, setTotal] = useState(0), [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<TimesheetSubmission[]>([]), [error, setError] = useState(""), [loading, setLoading] = useState(true), [selected, setSelected] = useState("");
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    listTimesheetSubmissions({ scope: "approvals", page, limit: 20 }, controller.signal).then((result) => { if (!controller.signal.aborted) { setData(result.data); setPages(result.pagination.totalPages); setTotal(result.pagination.total); } }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Could not load timesheet approvals")); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, refresh]);
  const changed = () => { setRefresh((r) => r + 1); onChanged(); };
  return <><DashboardDrawer isOpen={!selected} onClose={onClose} titlePrefix="Timesheet approvals" maxW={{ base: "100%", md: "800px" }}>
    {error ? <Alert status="error"><AlertIcon />{error}<Button ml="auto" onClick={() => setRefresh((r) => r + 1)}>Retry</Button></Alert> : loading ? <Skeleton h="250px" /> : <Stack spacing={0}>{data.map((item) => <Flex key={item._id} py={4} gap={3} align="center" justify="space-between" borderBottomWidth="1px"><Box minW={0}><Text fontWeight="600" overflowWrap="anywhere">{item.employeeNameSnapshot}</Text><Text fontSize="sm">{item.attendanceDate} | {formatMinutes(item.loggedMinutes)} logged | {formatMinutes(item.shortfallMinutes)} short</Text>{item.approvalOverdue ? <Badge mt={1} colorScheme="red">Approval overdue</Badge> : null}</Box><Button size="sm" onClick={() => setSelected(item._id)}>Review timesheet</Button></Flex>)}{!data.length ? <Text py={10}>No timesheets await your approval.</Text> : null}</Stack>}
    <Flex mt={5} justify="space-between" align="center" gap={2}><Text fontSize="sm">{total} pending</Text><Flex gap={2} align="center"><Button size="sm" isDisabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button><Text fontSize="sm">{page}/{pages}</Text><Button size="sm" isDisabled={loading || page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button></Flex></Flex>
  </DashboardDrawer>{selected ? <TimesheetReviewDrawer submissionId={selected} onClose={() => setSelected("")} onChanged={changed} /> : null}</>;
}
