"use client";

import axios from "axios";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
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
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FiPlay, FiRefreshCw, FiRotateCcw } from "react-icons/fi";

type Props = { companyId: string };

function errorMessage(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || "Request failed";
}

function statusColor(status: string) {
  if (status === "succeeded") return "green";
  if (status === "running" || status === "queued") return "blue";
  if (status === "failed" || status === "exhausted") return "red";
  return "gray";
}

export default function PayrollOperationsWorkspace({ companyId }: Props) {
  const toast = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [retrying, setRetrying] = useState("");
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [metricsResponse, jobsResponse, accessResponse] = await Promise.all([
        axios.get("/payroll/operations/metrics", { params: { companyId } }),
        axios.get("/payroll/operations/jobs", { params: { companyId, page: 1, limit: 20 } }),
        axios.get("/payroll/operations/access-logs", { params: { companyId, page: 1, limit: 20 } }),
      ]);
      setMetrics(metricsResponse.data.data);
      setJobs(jobsResponse.data.data || []);
      setAccessLogs(accessResponse.data.data || []);
    } catch (error) {
      toast({ title: "Unable to load payroll operations", description: errorMessage(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => { void load(); }, [load]);

  const runReminders = async () => {
    const referenceDate = new Date().toISOString().slice(0, 10);
    setRunning(true);
    try {
      const { data } = await axios.post("/payroll/operations/reminders/run", { companyId, referenceDate }, {
        headers: { "Idempotency-Key": `manual-reminders:${referenceDate}` },
      });
      toast({ title: "Payroll reminder check completed", description: `${data.data?.metrics?.notificationsCreated || 0} new notification(s) created.`, status: "success" });
      await load();
    } catch (error) {
      toast({ title: "Payroll reminder check failed", description: errorMessage(error), status: "error" });
    } finally {
      setRunning(false);
    }
  };

  const retry = async (jobId: string) => {
    setRetrying(jobId);
    try {
      await axios.post(`/payroll/operations/jobs/${jobId}/retry`, { companyId, referenceDate: new Date().toISOString().slice(0, 10) });
      toast({ title: "Payroll job retried", status: "success" });
      await load();
    } catch (error) {
      toast({ title: "Unable to retry payroll job", description: errorMessage(error), status: "error" });
    } finally {
      setRetrying("");
    }
  };

  if (loading && !metrics) return <Skeleton h="380px" borderRadius="md" />;

  return <Stack spacing={5}>
    <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
      <Flex justify="space-between" align={{ base: "stretch", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
        <Box><Text fontSize="lg" fontWeight="800">Payroll operations</Text><Text mt={1} fontSize="sm" color={muted}>Daily reminders are idempotent. Failed jobs use bounded retries and expiring worker locks.</Text></Box>
        <Flex gap={3}><Button leftIcon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={() => void load()}>Refresh</Button><Button leftIcon={<FiPlay />} colorScheme="blue" isLoading={running} onClick={() => void runReminders()}>Run reminder check</Button></Flex>
      </Flex>
    </Box>

    <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
      <Stat bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}><StatLabel>Jobs in 30 days</StatLabel><StatNumber>{metrics?.totalJobs || 0}</StatNumber></Stat>
      <Stat bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}><StatLabel>Success rate</StatLabel><StatNumber>{metrics?.successRatePercent ?? 100}%</StatNumber></Stat>
      <Stat bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}><StatLabel>Retries</StatLabel><StatNumber>{metrics?.retryCount || 0}</StatNumber></Stat>
      <Stat bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}><StatLabel>Notifications created</StatLabel><StatNumber>{metrics?.notificationsCreated || 0}</StatNumber></Stat>
    </SimpleGrid>

    {metrics?.staleLocks ? <Alert status="warning"><AlertIcon /><AlertDescription>{metrics.staleLocks} expired payroll worker lock(s) need recovery.</AlertDescription></Alert> : null}

    <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
      <Box p={4}><Text fontWeight="800">Recent reminder jobs</Text><Text fontSize="sm" color={muted}>Idempotency keys prevent duplicate processing; notification keys prevent duplicate employee alerts.</Text></Box>
      <TableContainer><Table size="sm"><Thead><Tr><Th>Created</Th><Th>Status</Th><Th>Trigger</Th><Th>Attempts</Th><Th>Result</Th><Th></Th></Tr></Thead><Tbody>
        {jobs.map((job) => <Tr key={job._id}><Td>{job.createdAt ? new Date(job.createdAt).toLocaleString() : "-"}</Td><Td><Badge colorScheme={statusColor(job.status)}>{job.status}</Badge></Td><Td>{job.trigger}</Td><Td>{job.attempts} / {job.maxAttempts}</Td><Td><Text fontSize="sm">{job.metrics?.notificationsCreated ?? 0} notification(s)</Text>{job.lastError?.message ? <Text fontSize="xs" color="red.500">{job.lastError.message}</Text> : null}</Td><Td>{["failed", "exhausted"].includes(job.status) ? <Button size="xs" leftIcon={<FiRotateCcw />} isLoading={retrying === job._id} onClick={() => void retry(job._id)}>Retry</Button> : null}</Td></Tr>)}
        {!jobs.length ? <Tr><Td colSpan={6}><Text py={5} textAlign="center" color={muted}>No payroll operations jobs yet.</Text></Td></Tr> : null}
      </Tbody></Table></TableContainer>
    </Box>

    <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
      <Box p={4}><Text fontWeight="800">Sensitive access history</Text><Text fontSize="sm" color={muted}>Report views, exports, operations access, and payslip downloads. Network details are stored only as a non-reversible fingerprint.</Text></Box>
      <TableContainer><Table size="sm"><Thead><Tr><Th>Time</Th><Th>User</Th><Th>Action</Th><Th>Resource</Th><Th>Purpose</Th></Tr></Thead><Tbody>
        {accessLogs.map((log) => <Tr key={log._id}><Td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</Td><Td><Text fontWeight="700">{log.actor?.name || "User"}</Text><Text fontSize="xs" color={muted}>{log.actor?.code || log.actor?.username || "-"}</Text></Td><Td><Badge>{String(log.action || "").replaceAll("_", " ")}</Badge></Td><Td>{log.resourceType}<Text fontSize="xs" color={muted}>{log.resourceId}</Text></Td><Td>{log.purpose || "-"}</Td></Tr>)}
        {!accessLogs.length ? <Tr><Td colSpan={5}><Text py={5} textAlign="center" color={muted}>No sensitive payroll access events yet.</Text></Td></Tr> : null}
      </Tbody></Table></TableContainer>
    </Box>
  </Stack>;
}
