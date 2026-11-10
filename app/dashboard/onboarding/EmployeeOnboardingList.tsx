"use client";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, Flex, FormControl, FormLabel, HStack, IconButton, Input, Select, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiPlus, FiRefreshCw, FiX } from "react-icons/fi";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { emptyPage, onboardingGet, Page } from "./onboardingApi";
import { EmployeeOnboarding } from "./employeeOnboardingApi";
import AssignOnboardingDrawer from "./AssignOnboardingDrawer";
import EmployeeOnboardingDrawer from "./EmployeeOnboardingDrawer";

export default function EmployeeOnboardingList({ scope, canManage, employeeId, initialInstanceId }: { scope: string; canManage: boolean; employeeId?: string; initialInstanceId?: string }) {
  const [search, setSearch] = useState(""), [query, setQuery] = useState(""), [status, setStatus] = useState("all"), [overdue, setOverdue] = useState(false), [page, setPage] = useState(1);
  const [rows, setRows] = useState<EmployeeOnboarding[]>([]), [pagination, setPagination] = useState(emptyPage), [loading, setLoading] = useState(true), [error, setError] = useState(""), [reload, setReload] = useState(0);
  const [assigning, setAssigning] = useState(false), [opened, setOpened] = useState(initialInstanceId || ""), [employee, setEmployee] = useState(employeeId);
  useEffect(() => { setOpened(initialInstanceId || ""); setEmployee(employeeId); }, [initialInstanceId, employeeId]);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    onboardingGet<Page<EmployeeOnboarding>>("/instances", { scope, page, limit: 20, search: query || undefined, status, overdue: String(overdue), employeeId: employee }, controller.signal)
      .then((data) => { if (!controller.signal.aborted) { setRows(data.data); setPagination(data.pagination); } })
      .catch((err) => { if (!controller.signal.aborted) { setError(getApiErrorMessage(err?.response?.data || err, "Unable to load employee onboarding")); setRows([]); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [scope, page, query, status, overdue, employee, reload]);
  return <Stack spacing={4} minW={0}>
    <Flex gap={3} justify="space-between" align="center" wrap="wrap"><HStack flexWrap="wrap">
      {employee && <Button size="sm" variant="outline" rightIcon={<FiX />} onClick={() => { setEmployee(undefined); setPage(1); }}>Clear employee filter</Button>}
      <Tooltip label="Refresh onboarding"><IconButton aria-label="Refresh onboarding" variant="outline" icon={<FiRefreshCw />} onClick={() => setReload((n) => n + 1)} /></Tooltip>
    </HStack>{canManage && <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => setAssigning(true)}>Assign checklist</Button>}</Flex>
    <Flex gap={4} align="end" wrap="wrap"><FormControl flex="1" minW={{ base: "100%", sm: "200px" }}><FormLabel htmlFor={`onboarding-employee-search-${scope}`}>Employee name or code</FormLabel><Input id={`onboarding-employee-search-${scope}`} value={search} maxLength={100} onChange={(e) => setSearch(e.target.value)} /></FormControl><FormControl w={{ base: "100%", sm: "180px" }}><FormLabel htmlFor={`onboarding-instance-status-${scope}`}>Checklist status</FormLabel><Select id={`onboarding-instance-status-${scope}`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="all">All statuses</option><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></Select></FormControl><Checkbox mb={2} isChecked={overdue} onChange={(e) => { setOverdue(e.target.checked); setPage(1); }}>Overdue tasks only</Checkbox></Flex>
    {error && <Alert status="error"><AlertIcon />{error}<Button ml="auto" size="sm" onClick={() => setReload((n) => n + 1)}>Retry</Button></Alert>}
    <Box borderWidth="1px" borderRadius="md" overflow="hidden" minW={0}>{loading ? <Stack p={5}><Skeleton h="50px" /><Skeleton h="50px" /></Stack> : <>
      <TableContainer><Table size="sm"><Thead><Tr><Th>Employee</Th><Th>Checklist</Th><Th>Joining date</Th><Th>Required tasks</Th><Th>Status</Th><Th>Issues</Th></Tr></Thead><Tbody>{rows.map((row) => <Tr key={row._id}><Td py={4} whiteSpace="normal"><Text fontWeight="600">{row.employee.name}</Text><Text fontSize="xs" color="gray.500">{row.employee.code}</Text></Td><Td whiteSpace="normal" maxW="300px"><Button variant="link" textAlign="left" whiteSpace="normal" overflowWrap="anywhere" onClick={() => setOpened(row._id)}>{row.templateName}</Button><Text fontSize="xs" color="gray.500">v{row.versionNumber}</Text></Td><Td>{row.joiningDate}</Td><Td>{row.progress.requiredDone} / {row.progress.required}<Text fontSize="xs" color="gray.500">{row.progress.done} / {row.progress.total} total</Text></Td><Td><Badge colorScheme={row.status === "completed" ? "green" : row.status === "active" ? "blue" : "gray"}>{row.status}</Badge></Td><Td><HStack flexWrap="wrap">{row.status !== "cancelled" && row.progress.blocked > 0 && <Badge colorScheme="red">{row.progress.blocked} blocked</Badge>}{row.status !== "cancelled" && row.progress.overdue > 0 && <Badge colorScheme="yellow">{row.progress.overdue} overdue</Badge>}{row.joiningDateChanged && <Badge colorScheme="yellow">Joining date changed</Badge>}</HStack></Td></Tr>)}</Tbody></Table></TableContainer>
      {!rows.length && <Text p={8} textAlign="center" color="gray.500">{scope === "tasks" ? "No onboarding tasks assigned to you." : "No onboarding checklists found."}</Text>}
      <Flex p={3} align="center" justify="space-between" wrap="wrap" gap={3}><Text fontSize="sm" color="gray.500">{pagination.total} {pagination.total === 1 ? "checklist" : "checklists"}</Text>{pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />}</Flex>
    </>}</Box>
    {assigning && <AssignOnboardingDrawer employeeId={employee} onClose={() => setAssigning(false)} onAssigned={(id) => { setAssigning(false); setOpened(id); setReload((n) => n + 1); }} />}
    {opened && <EmployeeOnboardingDrawer instanceId={opened} onClose={() => setOpened("")} onChanged={() => setReload((n) => n + 1)} />}
  </Stack>;
}
