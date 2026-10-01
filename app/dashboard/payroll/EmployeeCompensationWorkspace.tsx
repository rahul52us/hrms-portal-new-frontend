"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import axios from "axios";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiRefreshCw, FiSearch, FiUploadCloud, FiXCircle } from "react-icons/fi";
import CompensationImportDrawer from "./CompensationImportDrawer";

type Totals = {
  monthlyGrossMinor?: number;
  monthlyDeductionsMinor?: number;
  monthlyNetMinor?: number;
  monthlyEmployerCostMinor?: number;
  annualGrossMinor?: number;
  annualNetMinor?: number;
  annualEmployerCostMinor?: number;
};

type ComponentAmount = {
  salaryComponent: string;
  componentCodeSnapshot: string;
  componentNameSnapshot: string;
  categorySnapshot: string;
  monthlyAmountMinor: number;
  annualAmountMinor: number;
  overridden: boolean;
};

type Assignment = {
  _id: string;
  status: "assigned" | "cancelled";
  structureNameSnapshot: string;
  structureCodeSnapshot: string;
  structureVersionNumber: number;
  currency: string;
  currencyMinorUnits: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  assignmentReason: string;
  cancellationReason?: string;
  isCurrent?: boolean;
  isUpcoming?: boolean;
  overrides?: Array<{ salaryComponent: string; componentNameSnapshot: string; monthlyAmountMinor: number }>;
  componentAmounts?: ComponentAmount[];
  totals: Totals;
  createdBy?: { name?: string; username?: string } | null;
  createdAt?: string;
};

type Employee = {
  _id: string;
  name?: string;
  username: string;
  code?: string;
  designation?: string;
  role: string;
  pic?: string;
  is_enabled?: boolean;
  currentAssignment?: Assignment | null;
  upcomingAssignment?: Assignment | null;
};

type VersionRule = {
  salaryComponent: string;
  componentCodeSnapshot: string;
  componentNameSnapshot: string;
  categorySnapshot: string;
  allowEmployeeOverride: boolean;
};

type Version = {
  _id: string;
  versionNumber: number;
  status: "draft" | "published" | "cancelled";
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  currency: string;
  currencyMinorUnits: number;
  rules: VersionRule[];
};

type Structure = {
  _id: string;
  name: string;
  code: string;
  status: "active" | "archived";
  latestPublishedVersion?: Version | null;
};

type Preview = {
  version: Pick<Version, "_id" | "versionNumber" | "currency" | "currencyMinorUnits">;
  componentAmounts: ComponentAmount[];
  totals: Totals;
};

type Props = { companyId: string; canManage: boolean };

const localToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function errorMessage(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || "Request failed";
}

function dateKey(value?: string | null) {
  return value ? String(value).slice(0, 10) : "";
}

function formatMoney(value: number | undefined, currency = "INR", minorUnits = 2) {
  const amount = Number(value || 0) / 10 ** minorUnits;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: minorUnits,
      maximumFractionDigits: minorUnits,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(minorUnits)}`;
  }
}

function toMinor(value: string, minorUnits: number) {
  const normalized = value.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error("Enter a valid non-negative amount");
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > minorUnits) throw new Error(`Use at most ${minorUnits} decimal places`);
  const amount = Number(whole) * 10 ** minorUnits + Number(fraction.padEnd(minorUnits, "0") || "0");
  if (!Number.isSafeInteger(amount)) throw new Error("Amount is too large");
  return amount;
}

function employeeName(employee?: Employee | null) {
  return employee?.name || employee?.username || "Employee";
}

export default function EmployeeCompensationWorkspace({ companyId, canManage }: Props) {
  const toast = useToast();
  const drawer = useDisclosure();
  const cancelDialog = useDisclosure();
  const importDrawer = useDisclosure();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [history, setHistory] = useState<Assignment[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("all");
  const [effectiveFrom, setEffectiveFrom] = useState(localToday());
  const [structureId, setStructureId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [assignmentReason, setAssignmentReason] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const subtle = useColorModeValue("gray.50", "whiteAlpha.50");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadEmployees = useCallback(async () => {
    if (!companyId || !canManage) return;
    setLoading(true);
    try {
      const { data } = await axios.get("/payroll/compensation/employees", {
        params: { companyId, page, limit: 20, search, assignmentStatus },
      });
      setEmployees(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (error) {
      toast({ title: "Unable to load employee compensation", description: errorMessage(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [assignmentStatus, canManage, companyId, page, search, toast]);

  const loadStructures = useCallback(async () => {
    if (!companyId || !canManage) return;
    try {
      const { data } = await axios.get("/payroll/structures", {
        params: { companyId, status: "active", page: 1, limit: 100 },
      });
      setStructures((data.data || []).filter((item: Structure) => item.latestPublishedVersion));
    } catch (error) {
      toast({ title: "Unable to load salary structures", description: errorMessage(error), status: "error" });
    }
  }, [canManage, companyId, toast]);

  useEffect(() => { void loadEmployees(); }, [loadEmployees]);
  useEffect(() => { void loadStructures(); }, [loadStructures]);

  const loadHistory = useCallback(async (employee: Employee) => {
    setDetailLoading(true);
    try {
      const { data } = await axios.get(`/payroll/compensation/employees/${employee._id}`, { params: { companyId } });
      setHistory(data.data?.assignments || []);
      setSelectedEmployee((current) => current ? { ...current, ...data.data?.employee } : employee);
    } catch (error) {
      toast({ title: "Unable to load compensation history", description: errorMessage(error), status: "error" });
    } finally {
      setDetailLoading(false);
    }
  }, [companyId, toast]);

  const openEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setHistory([]);
    setEffectiveFrom(localToday());
    setStructureId("");
    setVersionId("");
    setVersions([]);
    setOverrides({});
    setAssignmentReason("");
    setPreview(null);
    drawer.onOpen();
    void loadHistory(employee);
  };

  useEffect(() => {
    if (!structureId || !companyId) {
      setVersions([]);
      setVersionId("");
      setOverrides({});
      setPreview(null);
      return;
    }
    let active = true;
    axios.get(`/payroll/structures/${structureId}`, { params: { companyId } })
      .then(({ data }) => {
        if (!active) return;
        setVersions((data.data?.versions || []).filter((version: Version) => version.status === "published"));
      })
      .catch((error) => {
        if (active) toast({ title: "Unable to load structure versions", description: errorMessage(error), status: "error" });
      });
    return () => { active = false; };
  }, [companyId, structureId, toast]);

  useEffect(() => {
    const resolved = versions.find((version) => {
      const starts = dateKey(version.effectiveFrom);
      const ends = dateKey(version.effectiveTo);
      return starts && starts <= effectiveFrom && (!ends || ends >= effectiveFrom);
    });
    setVersionId(resolved?._id || "");
    setOverrides({});
    setPreview(null);
  }, [effectiveFrom, versions]);

  const selectedVersion = useMemo(
    () => versions.find((version) => version._id === versionId) || null,
    [versionId, versions]
  );
  const overrideableRules = useMemo(
    () => selectedVersion?.rules?.filter((rule) => rule.allowEmployeeOverride) || [],
    [selectedVersion]
  );

  const overridePayload = () => {
    if (!selectedVersion) return [];
    return overrideableRules
      .filter((rule) => String(overrides[String(rule.salaryComponent)] || "").trim() !== "")
      .map((rule) => ({
        salaryComponentId: String(rule.salaryComponent),
        monthlyAmountMinor: toMinor(overrides[String(rule.salaryComponent)], selectedVersion.currencyMinorUnits),
      }));
  };

  const calculatePreview = async () => {
    if (!versionId || !effectiveFrom) return;
    setPreviewLoading(true);
    try {
      const { data } = await axios.post("/payroll/compensation/preview", {
        companyId,
        salaryStructureVersionId: versionId,
        effectiveFrom,
        overrides: overridePayload(),
      });
      setPreview(data.data);
    } catch (error) {
      setPreview(null);
      toast({ title: "Unable to calculate compensation", description: errorMessage(error), status: "error" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const assignCompensation = async () => {
    if (!selectedEmployee || !versionId) return;
    setSubmitting(true);
    try {
      await axios.post("/payroll/compensation/assignments", {
        companyId,
        employeeId: selectedEmployee._id,
        salaryStructureVersionId: versionId,
        effectiveFrom,
        assignmentReason: assignmentReason.trim(),
        overrides: overridePayload(),
      });
      toast({ title: "Compensation assigned", status: "success" });
      setAssignmentReason("");
      setOverrides({});
      setPreview(null);
      await Promise.all([loadHistory(selectedEmployee), loadEmployees()]);
    } catch (error) {
      toast({ title: "Unable to assign compensation", description: errorMessage(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const openCancellation = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setCancelReason("");
    cancelDialog.onOpen();
  };

  const cancelFutureAssignment = async () => {
    if (!selectedAssignment || !selectedEmployee) return;
    setSubmitting(true);
    try {
      await axios.post(`/payroll/compensation/assignments/${selectedAssignment._id}/cancel`, {
        companyId,
        reason: cancelReason.trim(),
      });
      toast({ title: "Future assignment cancelled", status: "success" });
      cancelDialog.onClose();
      await Promise.all([loadHistory(selectedEmployee), loadEmployees()]);
    } catch (error) {
      toast({ title: "Unable to cancel assignment", description: errorMessage(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={8}>
        <Text fontWeight="700">Employee compensation access is restricted</Text>
        <Text mt={1} fontSize="sm" color={muted}>A separate compensation permission is required because this screen contains sensitive salary data.</Text>
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
        <Flex p={4} gap={3} direction={{ base: "column", md: "row" }} borderBottomWidth="1px" borderColor={border}>
          <HStack flex="1"><FiSearch /><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search employee name, code, username, or designation" /></HStack>
          <Select maxW={{ md: "210px" }} value={assignmentStatus} onChange={(event) => { setAssignmentStatus(event.target.value); setPage(1); }}>
            <option value="all">All employees</option>
            <option value="assigned">Currently assigned</option>
            <option value="scheduled">Future change scheduled</option>
            <option value="unassigned">Not assigned</option>
          </Select>
          <Button leftIcon={<FiUploadCloud />} variant="outline" onClick={importDrawer.onOpen}>Bulk import</Button>
          <IconButton aria-label="Refresh compensation" icon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={() => void loadEmployees()} />
        </Flex>

        {loading ? <Stack p={4}>{[1, 2, 3, 4].map((item) => <Skeleton key={item} h="58px" />)}</Stack> : employees.length === 0 ? (
          <Box py={14} textAlign="center"><Text fontWeight="700">No employees match this view</Text><Text mt={1} fontSize="sm" color={muted}>Change the search or assignment filter.</Text></Box>
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead bg={subtle}><Tr><Th>Employee</Th><Th>Current compensation</Th><Th>Monthly gross / net</Th><Th>Upcoming change</Th><Th textAlign="right">Action</Th></Tr></Thead>
              <Tbody>{employees.map((employee) => {
                const current = employee.currentAssignment;
                const upcoming = employee.upcomingAssignment;
                return <Tr key={employee._id}>
                  <Td><HStack><Avatar size="sm" name={employeeName(employee)} src={employee.pic} /><Box><Text fontWeight="700">{employeeName(employee)}</Text><Text fontSize="xs" color={muted}>{employee.code || employee.username}{employee.designation ? ` | ${employee.designation}` : ""}</Text></Box></HStack></Td>
                  <Td>{current ? <Box><Text fontWeight="600">{current.structureNameSnapshot}</Text><Text fontSize="xs" color={muted}>v{current.structureVersionNumber} since {dateKey(current.effectiveFrom)}</Text></Box> : <Badge colorScheme="orange">Not assigned</Badge>}</Td>
                  <Td>{current ? <Box><Text>{formatMoney(current.totals?.monthlyGrossMinor, current.currency, current.currencyMinorUnits)}</Text><Text fontSize="xs" color={muted}>Net {formatMoney(current.totals?.monthlyNetMinor, current.currency, current.currencyMinorUnits)}</Text></Box> : "-"}</Td>
                  <Td>{upcoming ? <Box><Badge colorScheme="blue">{dateKey(upcoming.effectiveFrom)}</Badge><Text mt={1} fontSize="xs">{upcoming.structureNameSnapshot} v{upcoming.structureVersionNumber}</Text></Box> : "-"}</Td>
                  <Td textAlign="right"><IconButton aria-label={`Manage compensation for ${employeeName(employee)}`} title="Assign compensation and view history" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => openEmployee(employee)} /></Td>
                </Tr>;
              })}</Tbody>
            </Table>
          </TableContainer>
        )}
        <Flex p={4} borderTopWidth="1px" borderColor={border} justify="space-between" align="center"><Text fontSize="sm" color={muted}>{total} matching employee{total === 1 ? "" : "s"}</Text><HStack><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {Math.max(1, totalPages)}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack></Flex>
      </Box>

      <DashboardDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.onClose}
        titlePrefix="Employee"
        titleSuffix="compensation"
        subtitle={selectedEmployee ? `${employeeName(selectedEmployee)} | ${selectedEmployee.code || selectedEmployee.username}` : "Assignment and salary history"}
        maxW={{ base: "100%", md: "86%" }}
        footerContent={<Flex w="full" justify="flex-end"><Button variant="ghost" onClick={drawer.onClose}>Close</Button></Flex>}
      >
        {detailLoading ? <Stack>{[1, 2, 3].map((item) => <Skeleton key={item} h="90px" />)}</Stack> : (
          <Stack spacing={6}>
            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
              <Text fontWeight="800">Assign salary structure</Text>
              <Text mt={1} fontSize="sm" color={muted}>A new effective-dated assignment closes the previous period automatically. Existing history is never edited.</Text>
              <SimpleGrid mt={4} columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl isRequired><FormLabel>Effective from</FormLabel><Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></FormControl>
                <FormControl isRequired><FormLabel>Salary structure</FormLabel><Select value={structureId} onChange={(event) => setStructureId(event.target.value)}><option value="">Select published structure</option>{structures.map((structure) => <option key={structure._id} value={structure._id}>{structure.name} ({structure.code})</option>)}</Select></FormControl>
                <FormControl isInvalid={Boolean(structureId && !versionId)}><FormLabel>Effective version</FormLabel><Input value={selectedVersion ? `Version ${selectedVersion.versionNumber}` : structureId ? "No published version covers this date" : "Select a structure"} isReadOnly /><FormHelperText>Resolved from the assignment date.</FormHelperText></FormControl>
              </SimpleGrid>

              {overrideableRules.length > 0 ? <Box mt={5}><Text fontWeight="700">Employee-specific values</Text><Text fontSize="sm" color={muted}>Leave a field empty to use the structure value. Dependent percentage components are recalculated.</Text><SimpleGrid mt={3} columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>{overrideableRules.map((rule) => <FormControl key={String(rule.salaryComponent)}><FormLabel>{rule.componentNameSnapshot} ({rule.componentCodeSnapshot})</FormLabel><Input inputMode="decimal" value={overrides[String(rule.salaryComponent)] || ""} placeholder={`Monthly amount in ${selectedVersion?.currency || "currency"}`} onChange={(event) => { setOverrides((current) => ({ ...current, [String(rule.salaryComponent)]: event.target.value })); setPreview(null); }} /></FormControl>)}</SimpleGrid></Box> : selectedVersion ? <Text mt={4} fontSize="sm" color={muted}>This structure does not permit employee-specific component values.</Text> : null}

              <FormControl mt={5} isRequired><FormLabel>Assignment reason</FormLabel><Textarea value={assignmentReason} onChange={(event) => setAssignmentReason(event.target.value)} placeholder="Example: New hire compensation approved on offer" /><FormHelperText>Stored permanently in the salary history and payroll audit.</FormHelperText></FormControl>
              <HStack mt={4} justify="flex-end"><Button variant="outline" isLoading={previewLoading} isDisabled={!versionId} onClick={() => void calculatePreview()}>Calculate preview</Button><Button colorScheme="blue" isLoading={submitting} isDisabled={!preview || assignmentReason.trim().length < 3 || !selectedEmployee} onClick={() => void assignCompensation()}>Assign compensation</Button></HStack>
            </Box>

            {preview ? <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
              <Flex justify="space-between" align="center" gap={3}><Text fontWeight="800">Assignment preview</Text><Badge colorScheme="blue">Version {preview.version.versionNumber}</Badge></Flex>
              <SimpleGrid mt={4} columns={{ base: 2, md: 4 }} spacing={4}>
                <Box><Text fontSize="xs" color={muted}>Monthly gross</Text><Text fontWeight="800">{formatMoney(preview.totals.monthlyGrossMinor, preview.version.currency, preview.version.currencyMinorUnits)}</Text></Box>
                <Box><Text fontSize="xs" color={muted}>Monthly deductions</Text><Text fontWeight="800">{formatMoney(preview.totals.monthlyDeductionsMinor, preview.version.currency, preview.version.currencyMinorUnits)}</Text></Box>
                <Box><Text fontSize="xs" color={muted}>Monthly net</Text><Text fontWeight="800">{formatMoney(preview.totals.monthlyNetMinor, preview.version.currency, preview.version.currencyMinorUnits)}</Text></Box>
                <Box><Text fontSize="xs" color={muted}>Employer cost</Text><Text fontWeight="800">{formatMoney(preview.totals.monthlyEmployerCostMinor, preview.version.currency, preview.version.currencyMinorUnits)}</Text></Box>
              </SimpleGrid>
              <Divider my={4} />
              <TableContainer><Table size="sm"><Thead><Tr><Th>Component</Th><Th>Category</Th><Th isNumeric>Monthly</Th></Tr></Thead><Tbody>{preview.componentAmounts.map((amount) => <Tr key={String(amount.salaryComponent)}><Td><HStack><Text>{amount.componentNameSnapshot}</Text>{amount.overridden ? <Badge colorScheme="purple">Override</Badge> : null}</HStack><Text fontSize="xs" color={muted}>{amount.componentCodeSnapshot}</Text></Td><Td textTransform="capitalize">{amount.categorySnapshot.replace("_", " ")}</Td><Td isNumeric>{formatMoney(amount.monthlyAmountMinor, preview.version.currency, preview.version.currencyMinorUnits)}</Td></Tr>)}</Tbody></Table></TableContainer>
            </Box> : null}

            <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
              <Text fontWeight="800">Salary history</Text>
              <Text mt={1} fontSize="sm" color={muted}>Effective periods are derived from the next active assignment. Cancelled future entries remain visible for audit.</Text>
              {history.length === 0 ? <Text mt={5} color={muted}>No compensation has been assigned.</Text> : <Stack mt={4} spacing={3}>{history.map((assignment) => <Box key={assignment._id} bg={subtle} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
                <Flex justify="space-between" gap={4} wrap="wrap">
                  <Box><HStack><Text fontWeight="700">{assignment.structureNameSnapshot}</Text><Badge colorScheme={assignment.status === "cancelled" ? "gray" : assignment.isCurrent ? "green" : assignment.isUpcoming ? "blue" : "purple"}>{assignment.status === "cancelled" ? "Cancelled" : assignment.isCurrent ? "Current" : assignment.isUpcoming ? "Upcoming" : "Historical"}</Badge></HStack><Text fontSize="sm" color={muted}>{assignment.structureCodeSnapshot} | Version {assignment.structureVersionNumber} | {dateKey(assignment.effectiveFrom)}{assignment.effectiveTo ? ` to ${dateKey(assignment.effectiveTo)}` : assignment.status === "assigned" ? " onward" : ""}</Text></Box>
                  <Box textAlign={{ base: "left", md: "right" }}><Text fontWeight="700">{formatMoney(assignment.totals?.monthlyGrossMinor, assignment.currency, assignment.currencyMinorUnits)} gross</Text><Text fontSize="xs" color={muted}>{formatMoney(assignment.totals?.monthlyNetMinor, assignment.currency, assignment.currencyMinorUnits)} net monthly</Text></Box>
                </Flex>
                <Text mt={3} fontSize="sm"><Text as="span" fontWeight="600">Reason:</Text> {assignment.assignmentReason}</Text>
                {assignment.cancellationReason ? <Text mt={1} fontSize="sm"><Text as="span" fontWeight="600">Cancellation:</Text> {assignment.cancellationReason}</Text> : null}
                {assignment.overrides?.length ? <Text mt={1} fontSize="xs" color={muted}>{assignment.overrides.length} employee-specific component value{assignment.overrides.length === 1 ? "" : "s"}</Text> : null}
                {assignment.isUpcoming && assignment.status === "assigned" ? <Flex mt={3} justify="flex-end"><Button size="sm" variant="ghost" colorScheme="red" leftIcon={<FiXCircle />} onClick={() => openCancellation(assignment)}>Cancel future assignment</Button></Flex> : null}
              </Box>)}</Stack>}
            </Box>
          </Stack>
        )}
      </DashboardDrawer>

      <CompensationImportDrawer
        companyId={companyId}
        isOpen={importDrawer.isOpen}
        onClose={importDrawer.onClose}
        onCommitted={() => void loadEmployees()}
      />

      <Modal isOpen={cancelDialog.isOpen} onClose={cancelDialog.onClose} isCentered><ModalOverlay /><ModalContent><ModalHeader>Cancel future compensation</ModalHeader><ModalCloseButton /><ModalBody><Text mb={4}>This keeps the assignment in audit history but prevents it from becoming effective.</Text><FormControl isRequired><FormLabel>Cancellation reason</FormLabel><Textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></FormControl></ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={cancelDialog.onClose}>Keep assignment</Button><Button colorScheme="red" isLoading={submitting} isDisabled={cancelReason.trim().length < 3} onClick={() => void cancelFutureAssignment()}>Cancel assignment</Button></ModalFooter></ModalContent></Modal>
    </Stack>
  );
}
