"use client";

import axios from "axios";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { hasPermission, PERMISSION_KEYS } from "@/app/config/utils/permissions";
import stores from "@/app/store/stores";
import {
  EligibleLeaveItem,
  adjustLeaveBalance,
  fetchEligibleLeave,
  fetchLeaveTransactions,
  rebuildLeaveBalance,
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
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FiEdit2, FiRefreshCw, FiSearch } from "react-icons/fi";

const today = () => new Date().toISOString().slice(0, 10);

export default function LeaveBalancesPanel({ companyId, borderColor, muted }: { companyId: string; borderColor: string; muted: string }) {
  const toast = useToast();
  const adjustment = useDisclosure();
  const canManage = hasPermission(stores.auth.user, PERMISSION_KEYS.MANAGE_LEAVE_BALANCES);
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [eligible, setEligible] = useState<EligibleLeaveItem[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<EligibleLeaveItem | null>(null);
  const [form, setForm] = useState({ transactionType: "manual_adjustment", units: "", effectiveDate: today(), reason: "" });

  useEffect(() => {
    if (!companyId) return;
    const timer = window.setTimeout(() => {
      axios.get("/admin/users", { params: { companyId, page: 1, limit: 25, search: search.trim() || undefined } })
        .then((response) => setEmployees(response.data?.data?.users || []))
        .catch(() => setEmployees([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [companyId, search]);

  const loadEmployee = useCallback(async () => {
    if (!companyId || !employeeId) { setEligible([]); setTransactions([]); return; }
    setLoading(true);
    try {
      const [eligibleData, transactionData] = await Promise.all([
        fetchEligibleLeave({ companyId, employeeId, at: today() }),
        fetchLeaveTransactions({ companyId, employeeId, page: 1, limit: 30 }),
      ]);
      setEligible(eligibleData.items || []);
      setTransactions(transactionData.items || []);
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not load employee balances"), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, employeeId, toast]);

  useEffect(() => { loadEmployee(); }, [loadEmployee]);

  const openAdjustment = (item: EligibleLeaveItem) => {
    setSelectedType(item);
    setForm({ transactionType: "manual_adjustment", units: "", effectiveDate: today(), reason: "" });
    adjustment.onOpen();
  };

  const submit = async () => {
    if (!selectedType) return;
    setSubmitting(true);
    try {
      await adjustLeaveBalance({
        companyId,
        employeeId,
        leaveTypeId: selectedType.leaveType._id,
        transactionType: form.transactionType,
        units: Number(form.units),
        effectiveDate: form.effectiveDate,
        reason: form.reason.trim(),
        idempotencyKey: `ui:${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`,
      });
      toast({ title: "Leave balance adjusted", status: "success" });
      adjustment.onClose();
      await loadEmployee();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error), status: "error", duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  const rebuild = async (item: EligibleLeaveItem) => {
    try {
      await rebuildLeaveBalance({ companyId, employeeId, leaveTypeId: item.leaveType._id, effectiveDate: today() });
      toast({ title: `${item.leaveType.name} balance rebuilt from ledger`, status: "success" });
      await loadEmployee();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error), status: "error" });
    }
  };

  return (
    <Stack spacing={5}>
      <Box><Text fontWeight="800">Employee balances</Text><Text fontSize="sm" color={muted}>Search and select one employee. Adjustments create immutable ledger entries.</Text></Box>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} maxW="900px">
        <FormControl><FormLabel fontSize="sm">Search employees</FormLabel><HStack><FiSearch /><Input size="sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, employee code or email" /></HStack></FormControl>
        <FormControl><FormLabel fontSize="sm">Employee</FormLabel><Select size="sm" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}><option value="">Select employee</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name} ({employee.code || employee.username})</option>)}</Select></FormControl>
      </SimpleGrid>
      {!employeeId ? <Box py={12} textAlign="center" borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md"><Text color={muted}>Select an employee to view balances.</Text></Box> : loading ? <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}><Skeleton h="130px" /><Skeleton h="130px" /><Skeleton h="130px" /></SimpleGrid> : eligible.length === 0 ? <Box py={12} textAlign="center" borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md"><Text color={muted}>No effective leave policy for this employee.</Text></Box> : <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>{eligible.map((item) => <Box key={item.leaveType._id} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}><Flex justify="space-between"><HStack><Box boxSize="10px" borderRadius="sm" bg={item.leaveType.color} /><Text fontWeight="800">{item.leaveType.name}</Text></HStack><Badge>{item.leaveType.code}</Badge></Flex><Text mt={4} fontSize="2xl" fontWeight="800">{item.balance.availableUnits || 0}</Text><Text fontSize="xs" color={muted}>Available {item.leaveType.unit}</Text><HStack mt={3} fontSize="xs" color={muted} justify="space-between"><Text>{item.balance.balanceUnits || 0} posted</Text><Text>{item.balance.pendingUnits || 0} pending</Text></HStack>{canManage ? <HStack mt={4}><Button size="xs" colorScheme="blue" leftIcon={<FiEdit2 />} onClick={() => openAdjustment(item)}>Adjust</Button><Button size="xs" variant="ghost" leftIcon={<FiRefreshCw />} onClick={() => rebuild(item)}>Rebuild</Button></HStack> : null}</Box>)}</SimpleGrid>}
      {employeeId ? <Box><Text fontWeight="800" mb={3}>Posted transaction history</Text><Stack spacing={0} borderWidth={transactions.length ? "1px" : 0} borderColor={borderColor} borderRadius="md" overflow="hidden">{transactions.length === 0 ? <Text py={8} textAlign="center" color={muted}>No transactions.</Text> : transactions.map((entry, index) => <Flex key={entry._id} p={3} justify="space-between" borderBottomWidth={index === transactions.length - 1 ? 0 : "1px"}><Box><Text fontWeight="600">{entry.leaveType?.name || "Leave"}</Text><Text fontSize="xs" color={muted}>{entry.reason} · {entry.effectiveDate}</Text></Box><Text fontWeight="800" color={entry.units > 0 ? "green.500" : "red.500"}>{entry.units > 0 ? "+" : ""}{entry.units}</Text></Flex>)}</Stack></Box> : null}

      <Drawer isOpen={adjustment.isOpen} onClose={adjustment.onClose} placement="right" size="md"><DrawerOverlay /><DrawerContent><DrawerCloseButton /><DrawerHeader borderBottomWidth="1px">Adjust {selectedType?.leaveType.name || "leave"} balance</DrawerHeader><DrawerBody py={5}><Stack spacing={4}><FormControl isRequired><FormLabel>Adjustment type</FormLabel><Select value={form.transactionType} onChange={(event) => setForm((p) => ({ ...p, transactionType: event.target.value }))}><option value="manual_adjustment">Manual adjustment</option><option value="opening_balance">Opening balance</option></Select></FormControl><FormControl isRequired><FormLabel>Units</FormLabel><Input type="number" step="0.25" value={form.units} placeholder="Use a negative value to deduct" onChange={(event) => setForm((p) => ({ ...p, units: event.target.value }))} /><Text mt={1} fontSize="xs" color={muted}>Positive values add balance. Negative values deduct balance.</Text></FormControl><FormControl isRequired><FormLabel>Effective date</FormLabel><Input type="date" value={form.effectiveDate} onChange={(event) => setForm((p) => ({ ...p, effectiveDate: event.target.value }))} /></FormControl><FormControl isRequired><FormLabel>Audit reason</FormLabel><Textarea value={form.reason} placeholder="Explain why this adjustment is required" onChange={(event) => setForm((p) => ({ ...p, reason: event.target.value }))} /></FormControl></Stack></DrawerBody><DrawerFooter borderTopWidth="1px" gap={3}><Button variant="outline" onClick={adjustment.onClose}>Cancel</Button><Button colorScheme="blue" onClick={submit} isLoading={submitting} isDisabled={!form.units || form.reason.trim().length < 3}>Post adjustment</Button></DrawerFooter></DrawerContent></Drawer>
    </Stack>
  );
}
