"use client";

import axios from "axios";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import stores from "@/app/store/stores";
import {
  fetchLeaveYearEndClosures,
  fetchLeaveYearEndRuns,
  LeaveYearEndClosure,
  LeaveYearEndRun,
  runLeaveYearEnd,
} from "@/app/component/leave/leaveApi";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiPlay, FiRefreshCw } from "react-icons/fi";

const today = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
};

const statusColor = (status: string) => {
  if (status === "completed") return "green";
  if (status === "partial") return "orange";
  if (status === "configuration_error" || status === "failed") return "red";
  return "gray";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export default function LeaveYearEndPanel({
  companyId,
  borderColor,
  muted,
}: {
  companyId: string;
  borderColor: string;
  muted: string;
}) {
  const toast = useToast();
  const confirm = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const role = String(stores.auth.role || stores.auth.user?.role || "").toLowerCase();
  const canRunCompany = ["superadmin", "admin", "hradmin"].includes(role);
  const [asOf, setAsOf] = useState(today());
  const [search, setSearch] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [runs, setRuns] = useState<LeaveYearEndRun[]>([]);
  const [closures, setClosures] = useState<LeaveYearEndClosure[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    const timer = window.setTimeout(() => {
      axios
        .get("/admin/users", {
          params: { companyId, page: 1, limit: 25, search: search.trim() || undefined },
        })
        .then((response) => setEmployees(response.data?.data?.users || []))
        .catch(() => setEmployees([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [companyId, search]);

  const load = useCallback(async () => {
    if (!companyId || (!canRunCompany && !employeeId)) {
      setRuns([]);
      setClosures([]);
      return;
    }
    setLoading(true);
    try {
      const params = {
        companyId,
        page: 1,
        limit: 20,
        employeeId: employeeId || undefined,
      };
      const [runData, closureData] = await Promise.all([
        fetchLeaveYearEndRuns(params),
        fetchLeaveYearEndClosures(params),
      ]);
      setRuns(runData.items);
      setClosures(closureData.items);
    } catch (error: any) {
      toast({
        title: getApiErrorMessage(error?.response?.data || error, "Could not load year-end history"),
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [canRunCompany, companyId, employeeId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const execute = async () => {
    confirm.onClose();
    setRunning(true);
    try {
      const result = await runLeaveYearEnd({
        companyId,
        asOf,
        employeeId: employeeId || undefined,
      });
      toast({
        title: result.status === "completed"
          ? "Year-end processing completed"
          : "Year-end processing needs attention",
        description: `${result.carriedUnits || 0} carried, ${result.lapsedUnits || 0} lapsed, ${result.expiredUnits || 0} expired`,
        status: result.status === "completed" ? "success" : "warning",
        duration: 6000,
      });
      await load();
    } catch (error: any) {
      toast({
        title: getApiErrorMessage(error?.response?.data || error, "Could not run year-end processing"),
        status: "error",
        duration: 6000,
      });
    } finally {
      setRunning(false);
    }
  };

  const latest = runs[0];

  return (
    <Stack spacing={5}>
      <Box>
        <Text fontWeight="800">Year-end carry-forward and lapse</Text>
        <Text fontSize="sm" color={muted}>
          Close ended leave years using the policy effective on each year&apos;s final day. Every movement is posted to the leave ledger.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} maxW="1100px">
        <FormControl>
          <FormLabel fontSize="sm">Search employees</FormLabel>
          <Input size="sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or employee code" />
        </FormControl>
        <FormControl isRequired={!canRunCompany}>
          <FormLabel fontSize="sm">Processing scope</FormLabel>
          <Select size="sm" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
            {canRunCompany ? <option value="">Entire company</option> : <option value="">Select employee</option>}
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name} ({employee.code || employee.username})
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontSize="sm">Process ended years as of</FormLabel>
          <HStack>
            <Input size="sm" type="date" max={today()} value={asOf} onChange={(event) => setAsOf(event.target.value)} />
            <Button
              size="sm"
              colorScheme="blue"
              leftIcon={<FiPlay />}
              onClick={confirm.onOpen}
              isLoading={running}
              isDisabled={!companyId || !asOf || (!canRunCompany && !employeeId)}
            >
              Run
            </Button>
          </HStack>
        </FormControl>
      </SimpleGrid>

      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <AlertDescription fontSize="sm">
          Pending leave or encashment requests keep their reserved units. Those closures remain partial and finish automatically on a later run after the requests are decided.
        </AlertDescription>
      </Alert>

      {latest ? (
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          {[
            ["Carried", latest.carriedUnits || 0],
            ["Lapsed", latest.lapsedUnits || 0],
            ["Expired", latest.expiredUnits || 0],
            ["Needs attention", (latest.partialClosures || 0) + (latest.configurationErrors || 0) + (latest.deferredExpiryLots || 0) + (latest.failedItems || 0)],
          ].map(([label, value]) => (
            <Stat key={String(label)} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={3}>
              <StatLabel color={muted}>{label}</StatLabel>
              <StatNumber fontSize="xl">{value}</StatNumber>
            </Stat>
          ))}
        </SimpleGrid>
      ) : null}

      <Box>
        <HStack justify="space-between" mb={3}>
          <Text fontWeight="800">Closure history</Text>
          <Button size="xs" variant="ghost" leftIcon={<FiRefreshCw />} onClick={load} isLoading={loading}>
            Refresh
          </Button>
        </HStack>
        {loading ? (
          <Stack><Skeleton h="44px" /><Skeleton h="44px" /></Stack>
        ) : closures.length === 0 ? (
          <Box py={10} textAlign="center" borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md">
            <Text color={muted}>No ended leave-year balances have been processed.</Text>
          </Box>
        ) : (
          <TableContainer borderWidth="1px" borderColor={borderColor} borderRadius="md">
            <Table size="sm">
              <Thead><Tr><Th>Employee</Th><Th>Leave type</Th><Th>Source year</Th><Th isNumeric>Carried</Th><Th isNumeric>Lapsed</Th><Th isNumeric>Pending</Th><Th>Status</Th></Tr></Thead>
              <Tbody>
                {closures.map((item) => (
                  <Tr key={item._id}>
                    <Td><Text fontWeight="600">{item.employee?.name || "Employee"}</Text><Text fontSize="xs" color={muted}>{item.employee?.code || item.employee?.username}</Text></Td>
                    <Td>{item.leaveType?.name || "Leave"} <Badge ml={1}>{item.leaveType?.code}</Badge></Td>
                    <Td><Text>{item.sourceLeaveYearStart}</Text><Text fontSize="xs" color={muted}>to {item.sourceLeaveYearEnd}</Text></Td>
                    <Td isNumeric>{item.carriedUnits || 0}</Td>
                    <Td isNumeric>{item.lapsedUnits || 0}</Td>
                    <Td isNumeric>{item.pendingUnits || 0}</Td>
                    <Td><Badge colorScheme={statusColor(item.status)}>{item.status.replaceAll("_", " ")}</Badge>{item.message ? <Text mt={1} maxW="260px" whiteSpace="normal" fontSize="xs" color={muted}>{item.message}</Text> : null}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Box>
        <Text fontWeight="800" mb={3}>Processing runs</Text>
        <Stack spacing={0} borderWidth={runs.length ? "1px" : 0} borderColor={borderColor} borderRadius="md" overflow="hidden">
          {runs.length === 0 ? <Text py={8} textAlign="center" color={muted}>No year-end runs yet.</Text> : runs.map((run, index) => (
            <HStack key={run._id} p={3} justify="space-between" align="start" borderBottomWidth={index === runs.length - 1 ? 0 : "1px"}>
              <Box>
                <HStack><Badge colorScheme={statusColor(run.status)}>{run.status}</Badge><Text fontWeight="600">{run.trigger === "scheduler" ? "Scheduled run" : "Manual run"}</Text></HStack>
                <Text mt={1} fontSize="xs" color={muted}>{formatDateTime(run.startedAt)} · as of {run.asOf}{run.employee ? ` · ${run.employee.name || run.employee.code}` : " · entire company"}</Text>
                {run.failures?.length ? <Text mt={1} fontSize="xs" color="red.500">{run.failures[0].message}</Text> : null}
              </Box>
              <Text fontSize="sm" color={muted}>{run.processedBalances || 0} balances</Text>
            </HStack>
          ))}
        </Stack>
      </Box>

      <AlertDialog isOpen={confirm.isOpen} leastDestructiveRef={cancelRef} onClose={confirm.onClose} isCentered>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>Run leave year-end processing?</AlertDialogHeader>
          <AlertDialogBody>
            This will post carry-forward, lapse, and due-expiry entries for {employeeId ? "the selected employee" : "the entire company"} through {asOf}. Completed entries cannot be edited, but the process can be rerun safely.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={confirm.onClose}>Cancel</Button>
            <Button colorScheme="blue" ml={3} onClick={execute}>Run processing</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Stack>
  );
}
