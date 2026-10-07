"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import axios from "axios";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableContainer,
  Tabs,
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
import { FiRefreshCw, FiSearch } from "react-icons/fi";

type Employee = {
  _id: string;
  name?: string;
  username: string;
  code?: string;
  designation?: string;
  role: string;
  pic?: string;
  statutorySetup?: {
    assignmentId: string;
    effectiveFrom: string;
    countryCode: string;
    identifierPreview: string;
  } | null;
  currentTaxYear?: string;
  taxDeclaration?: { _id: string; versionNumber: number; status: string; taxRegime: string } | null;
};

type Provider = {
  key: string;
  label: string;
  countryCode: string;
  currencyCode: string;
  currencyMinorUnits: number;
  employeeIdentifierFields: Array<{
    key: string;
    label: string;
    maxLength: number;
    placeholder: string;
    helpText: string;
    sensitive?: boolean;
    requiredForModule?: string;
    requiredWhenApplicable?: string;
  }>;
  employeeApplicability: Array<{ key: string; label: string; moduleKey: string; helpText: string }>;
  taxRegimes: Array<{ key: string; label: string; description: string }>;
  taxDeclarationFields: Array<{ key: string; label: string; helpText: string; type: "currency" }>;
};

type Assignment = {
  _id: string;
  status: "assigned" | "cancelled";
  effectiveFrom: string;
  effectiveTo?: string | null;
  isCurrent?: boolean;
  isUpcoming?: boolean;
  countryCode: string;
  providerImplementationVersion: string;
  statutoryProfileVersionNumber: number;
  identifiers: Record<string, string>;
  applicability: Record<string, boolean>;
  assignmentReason: string;
  cancellationReason?: string;
};

type Declaration = {
  _id: string;
  taxYear: string;
  versionNumber: number;
  status: "draft" | "submitted" | "verified" | "returned" | "superseded" | "cancelled";
  revision: number;
  currency: string;
  currencyMinorUnits: number;
  taxRegime: string;
  declarations: Record<string, number>;
  changeReason: string;
  reviewReason?: string;
};

type Detail = {
  employee: Employee;
  provider: Provider | null;
  enabledModules: string[];
  assignments: Assignment[];
  declarations: Declaration[];
  currentTaxYear: string;
  legacyIdentifiers?: Record<string, string> | null;
};

type Props = { companyId: string; canManage: boolean };

const localToday = () => {
  const date = new Date();
  return String(date.getFullYear()) + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
};

function errorMessage(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || "Request failed";
}

function employeeName(employee?: Employee | null) {
  return employee?.name || employee?.username || "Employee";
}

function statusScheme(status?: string) {
  if (status === "verified" || status === "assigned") return "green";
  if (status === "submitted") return "blue";
  if (status === "returned") return "orange";
  if (status === "cancelled" || status === "superseded") return "gray";
  return "yellow";
}

function minorToInput(value: number | undefined, units: number) {
  if (!value) return "";
  return (value / 10 ** units).toFixed(units).replace(/\.?0+$/, "");
}

function toMinor(value: string, units: number) {
  const normalized = value.trim();
  if (!normalized) return 0;
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error("Enter non-negative amounts only");
  const parts = normalized.split(".");
  const fraction = parts[1] || "";
  if (fraction.length > units) throw new Error("Use at most " + units + " decimal places");
  const amount = Number(parts[0]) * 10 ** units + Number(fraction.padEnd(units, "0") || "0");
  if (!Number.isSafeInteger(amount)) throw new Error("Amount is too large");
  return amount;
}

export default function EmployeeStatutoryWorkspace({ companyId, canManage }: Props) {
  const toast = useToast();
  const drawer = useDisclosure();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [setup, setSetup] = useState("all");
  const [effectiveFrom, setEffectiveFrom] = useState(localToday());
  const [identifiers, setIdentifiers] = useState<Record<string, string>>({});
  const [applicability, setApplicability] = useState<Record<string, boolean>>({});
  const [assignmentReason, setAssignmentReason] = useState("");
  const [futureCancelReason, setFutureCancelReason] = useState("");
  const [taxYear, setTaxYear] = useState("");
  const [taxRegime, setTaxRegime] = useState("");
  const [declarationValues, setDeclarationValues] = useState<Record<string, string>>({});
  const [declarationReason, setDeclarationReason] = useState("");
  const [reviewReason, setReviewReason] = useState("");

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
      const response = await axios.get("/payroll/statutory/employees", {
        params: { companyId, page, limit: 20, search, setup },
      });
      setEmployees(response.data?.data || []);
      setTotal(response.data?.pagination?.total || 0);
      setTotalPages(response.data?.pagination?.totalPages || 0);
    } catch (error) {
      toast({ title: "Unable to load employee statutory data", description: errorMessage(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [canManage, companyId, page, search, setup, toast]);

  useEffect(() => { void loadEmployees(); }, [loadEmployees]);

  const hydrateDetail = (next: Detail) => {
    const current = next.assignments.find((item) => item.isCurrent) || next.assignments.find((item) => item.status === "assigned");
    setIdentifiers(current?.identifiers || next.legacyIdentifiers || {});
    setApplicability(current?.applicability || {});
    setEffectiveFrom(localToday());
    setAssignmentReason("");
    setFutureCancelReason("");
    setTaxYear(next.currentTaxYear);
    setReviewReason("");
  };

  const loadDetail = useCallback(async (employee: Employee) => {
    setDetailLoading(true);
    try {
      const response = await axios.get("/payroll/statutory/employees/" + employee._id, { params: { companyId } });
      const next = response.data?.data as Detail;
      setDetail(next);
      setSelectedEmployee((current) => current ? { ...current, ...next.employee } : next.employee);
      hydrateDetail(next);
    } catch (error) {
      toast({ title: "Unable to load statutory history", description: errorMessage(error), status: "error" });
    } finally {
      setDetailLoading(false);
    }
  }, [companyId, toast]);

  const openEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetail(null);
    drawer.onOpen();
    void loadDetail(employee);
  };

  const selectedDeclaration = useMemo(() => {
    const matches = (detail?.declarations || []).filter((item) => item.taxYear === taxYear);
    return matches.find((item) => item.status === "draft") || matches[0] || null;
  }, [detail?.declarations, taxYear]);

  useEffect(() => {
    const provider = detail?.provider;
    if (!provider) return;
    setTaxRegime(selectedDeclaration?.taxRegime || "");
    setDeclarationValues(Object.fromEntries(
      provider.taxDeclarationFields.map((field) => [
        field.key,
        minorToInput(selectedDeclaration?.declarations?.[field.key], selectedDeclaration?.currencyMinorUnits ?? provider.currencyMinorUnits),
      ])
    ));
    setDeclarationReason(selectedDeclaration?.changeReason || "");
  }, [detail?.provider, selectedDeclaration]);

  const refresh = async () => {
    if (!selectedEmployee) return;
    await Promise.all([loadDetail(selectedEmployee), loadEmployees()]);
  };

  const assignIdentifiers = async () => {
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      await axios.post("/payroll/statutory/employee-assignments", {
        companyId,
        employeeId: selectedEmployee._id,
        effectiveFrom,
        identifiers,
        applicability,
        assignmentReason,
      });
      toast({ title: "Statutory identifiers assigned", status: "success" });
      await refresh();
    } catch (error) {
      toast({ title: "Unable to assign identifiers", description: errorMessage(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelFutureAssignment = async (assignment: Assignment) => {
    setSubmitting(true);
    try {
      await axios.post("/payroll/statutory/employee-assignments/" + assignment._id + "/cancel", {
        companyId,
        reason: futureCancelReason,
      });
      toast({ title: "Future statutory record cancelled", status: "success" });
      setFutureCancelReason("");
      await refresh();
    } catch (error) {
      toast({ title: "Unable to cancel future record", description: errorMessage(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const declarationPayload = () => {
    if (!detail?.provider) throw new Error("Statutory provider is unavailable");
    return Object.fromEntries(
      detail.provider.taxDeclarationFields.map((field) => [
        field.key,
        toMinor(declarationValues[field.key] || "", detail.provider?.currencyMinorUnits || 2),
      ])
    );
  };

  const saveDeclaration = async () => {
    if (!selectedEmployee || !detail?.provider) return;
    setSubmitting(true);
    try {
      const payload = {
        companyId,
        employeeId: selectedEmployee._id,
        taxYear,
        taxRegime,
        declarations: declarationPayload(),
        changeReason: declarationReason,
      };
      if (selectedDeclaration?.status === "draft") {
        await axios.patch("/payroll/statutory/tax-declarations/" + selectedDeclaration._id, {
          ...payload,
          expectedRevision: selectedDeclaration.revision,
        });
      } else {
        await axios.post("/payroll/statutory/tax-declarations", payload);
      }
      toast({ title: "Tax declaration draft saved", status: "success" });
      await refresh();
    } catch (error) {
      toast({ title: "Unable to save declaration", description: errorMessage(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const declarationAction = async (action: "submit" | "verify" | "return" | "cancel") => {
    if (!selectedDeclaration) return;
    setSubmitting(true);
    try {
      if (action === "submit") {
        await axios.post("/payroll/statutory/tax-declarations/" + selectedDeclaration._id + "/submit", {
          companyId,
          expectedRevision: selectedDeclaration.revision,
          reason: declarationReason,
        });
      } else if (action === "cancel") {
        await axios.post("/payroll/statutory/tax-declarations/" + selectedDeclaration._id + "/cancel", {
          companyId,
          expectedRevision: selectedDeclaration.revision,
          reason: declarationReason,
        });
      } else {
        await axios.post("/payroll/statutory/tax-declarations/" + selectedDeclaration._id + "/review", {
          companyId,
          expectedRevision: selectedDeclaration.revision,
          decision: action,
          reason: reviewReason,
        });
      }
      toast({ title: action === "verify" ? "Tax declaration verified" : action === "return" ? "Tax declaration returned" : action === "submit" ? "Tax declaration submitted" : "Tax declaration draft cancelled", status: "success" });
      await refresh();
    } catch (error) {
      toast({ title: "Unable to update declaration", description: errorMessage(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const enabledModules = new Set(detail?.enabledModules || []);
  const taxEnabled = enabledModules.has("income_tax_withholding");

  return (
    <Stack spacing={4}>
      <Flex gap={3} align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }}>
        <Box position="relative" flex="1" maxW="420px">
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color={muted}><FiSearch /></Box>
          <Input pl={9} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search employee name, code or email" />
        </Box>
        <Select maxW={{ base: "full", md: "220px" }} value={setup} onChange={(event) => { setSetup(event.target.value); setPage(1); }}>
          <option value="all">All setup states</option>
          <option value="configured">Identifiers configured</option>
          <option value="missing">Identifiers missing</option>
        </Select>
        <Button leftIcon={<FiRefreshCw />} variant="outline" onClick={() => void loadEmployees()} isLoading={loading}>Refresh</Button>
      </Flex>

      <Box borderWidth="1px" borderColor={border} borderRadius="md" bg={surface} overflow="hidden">
        <TableContainer>
          <Table size="sm">
            <Thead bg={subtle}><Tr><Th>Employee</Th><Th>Statutory identifiers</Th><Th>Current tax year</Th><Th textAlign="right">Action</Th></Tr></Thead>
            <Tbody>
              {loading ? [1, 2, 3, 4].map((item) => <Tr key={item}><Td colSpan={4}><Skeleton h="42px" /></Td></Tr>) : employees.map((employee) => (
                <Tr key={employee._id}>
                  <Td><HStack><Avatar size="sm" name={employeeName(employee)} src={employee.pic} /><Box><Text fontWeight="700">{employeeName(employee)}</Text><Text fontSize="xs" color={muted}>{employee.code || employee.username}{employee.designation ? " | " + employee.designation : ""}</Text></Box></HStack></Td>
                  <Td>{employee.statutorySetup ? <Box><Badge colorScheme="green">Configured</Badge><Text mt={1} fontSize="xs" color={muted}>{employee.statutorySetup.countryCode} from {employee.statutorySetup.effectiveFrom}{employee.statutorySetup.identifierPreview ? " | " + employee.statutorySetup.identifierPreview : ""}</Text></Box> : <Badge colorScheme="orange">Missing</Badge>}</Td>
                  <Td>{employee.taxDeclaration ? <HStack><Badge colorScheme={statusScheme(employee.taxDeclaration.status)}>{employee.taxDeclaration.status}</Badge><Text fontSize="xs">{employee.currentTaxYear} v{employee.taxDeclaration.versionNumber}</Text></HStack> : <Text fontSize="sm" color={muted}>No declaration for {employee.currentTaxYear}</Text>}</Td>
                  <Td textAlign="right"><Button size="sm" variant="outline" onClick={() => openEmployee(employee)}>Manage</Button></Td>
                </Tr>
              ))}
              {!loading && employees.length === 0 ? <Tr><Td colSpan={4}><Text py={8} textAlign="center" color={muted}>No employees match these filters.</Text></Td></Tr> : null}
            </Tbody>
          </Table>
        </TableContainer>
        <Flex px={4} py={3} borderTopWidth="1px" borderColor={border} justify="space-between" align="center">
          <Text fontSize="sm" color={muted}>{total} matching employees</Text>
          <HStack><Button size="sm" variant="outline" isDisabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {Math.max(totalPages, 1)}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack>
        </Flex>
      </Box>

      <DashboardDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.onClose}
        titlePrefix="Employee"
        titleSuffix="statutory data"
        subtitle={selectedEmployee ? employeeName(selectedEmployee) + " | " + (selectedEmployee.code || selectedEmployee.username) : "Identifiers and tax declarations"}
        maxW={{ base: "100%", md: "88%" }}
        footerContent={<Flex w="full" justify="flex-end"><Button variant="ghost" onClick={drawer.onClose}>Close</Button></Flex>}
      >
        {detailLoading || !detail ? <Stack>{[1, 2, 3].map((item) => <Skeleton key={item} h="110px" />)}</Stack> : !detail.provider ? (
          <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}><Text fontWeight="800">Company statutory setup is incomplete</Text><Text mt={1} color={muted}>Publish a company statutory profile before maintaining employee statutory data.</Text></Box>
        ) : (
          <Tabs colorScheme="blue" isLazy>
            <TabList><Tab>Identifiers</Tab><Tab>Tax declarations</Tab></TabList>
            <TabPanels>
              <TabPanel px={0}>
                <Stack spacing={5}>
                  <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
                    <HStack justify="space-between"><Box><Text fontWeight="800">New effective-dated record</Text><Text fontSize="sm" color={muted}>Creates a new history edge. Earlier records remain unchanged.</Text></Box><Badge>{detail.provider.countryCode}</Badge></HStack>
                    <SimpleGrid mt={4} columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                      <FormControl isRequired><FormLabel>Effective from</FormLabel><Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></FormControl>
                      {detail.provider.employeeIdentifierFields.map((field) => {
                        const required = Boolean(field.requiredForModule && enabledModules.has(field.requiredForModule)) || Boolean(field.requiredWhenApplicable && applicability[field.requiredWhenApplicable]);
                        return <FormControl key={field.key} isRequired={required}><FormLabel>{field.label}</FormLabel><Input type={field.sensitive ? "password" : "text"} autoComplete="off" maxLength={field.maxLength} value={identifiers[field.key] || ""} placeholder={field.placeholder} onChange={(event) => setIdentifiers((current) => ({ ...current, [field.key]: event.target.value }))} /><FormHelperText>{field.helpText}</FormHelperText></FormControl>;
                      })}
                    </SimpleGrid>
                    {detail.provider.employeeApplicability.length ? <Box mt={5}><Text fontWeight="700">Applicable company modules</Text><SimpleGrid mt={3} columns={{ base: 1, md: 2 }} spacing={3}>{detail.provider.employeeApplicability.map((item) => {
                      const requiresPf = ["providentFundHigherWages", "employeesPensionScheme"].includes(item.key);
                      const disabled = !enabledModules.has(item.moduleKey) || (requiresPf && !applicability.providentFund);
                      return <Checkbox key={item.key} isChecked={Boolean(applicability[item.key])} isDisabled={disabled} onChange={(event) => setApplicability((current) => ({
                        ...current,
                        [item.key]: event.target.checked,
                        ...(item.key === "providentFund" && !event.target.checked ? { providentFundHigherWages: false, employeesPensionScheme: false } : {}),
                      }))}><Text fontWeight="600">{item.label}</Text><Text fontSize="xs" color={muted}>{!enabledModules.has(item.moduleKey) ? "This module is not enabled in the company statutory profile." : requiresPf && !applicability.providentFund ? "Enable provident fund applicability first." : item.helpText}</Text></Checkbox>;
                    })}</SimpleGrid></Box> : null}
                    <FormControl mt={5} isRequired><FormLabel>Change reason</FormLabel><Textarea value={assignmentReason} onChange={(event) => setAssignmentReason(event.target.value)} placeholder="Example: Initial statutory onboarding or corrected UAN" /><FormHelperText>Stored in immutable history and payroll audit.</FormHelperText></FormControl>
                    <Flex mt={4} justify="flex-end"><Button colorScheme="blue" isLoading={submitting} isDisabled={assignmentReason.trim().length < 3} onClick={() => void assignIdentifiers()}>Create effective record</Button></Flex>
                  </Box>
                  <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
                    <Box px={5} py={4}><Text fontWeight="800">Identifier history</Text>{detail.assignments.some((item) => item.isUpcoming) ? <FormControl mt={3}><FormLabel fontSize="sm">Reason for cancelling a future record</FormLabel><Input value={futureCancelReason} onChange={(event) => setFutureCancelReason(event.target.value)} placeholder="Required only when cancelling an upcoming record" /></FormControl> : null}</Box>
                    <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Period</Th><Th>Profile</Th><Th>Applicability</Th><Th>Status</Th><Th textAlign="right">Action</Th></Tr></Thead><Tbody>{detail.assignments.map((item) => <Tr key={item._id}><Td><Text fontWeight="600">{item.effectiveFrom} to {item.effectiveTo || "Current"}</Text><Text fontSize="xs" color={muted}>{item.assignmentReason}</Text></Td><Td>{item.countryCode} | Company profile v{item.statutoryProfileVersionNumber}<Text fontSize="xs" color={muted}>Provider {item.providerImplementationVersion}</Text></Td><Td>{Object.entries(item.applicability || {}).filter(([, value]) => value).map(([key]) => key).join(", ") || "None"}</Td><Td><Badge colorScheme={statusScheme(item.status)}>{item.isCurrent ? "current" : item.isUpcoming ? "upcoming" : item.status}</Badge></Td><Td textAlign="right">{item.isUpcoming ? <Button size="xs" colorScheme="red" variant="outline" isLoading={submitting} isDisabled={futureCancelReason.trim().length < 3} onClick={() => void cancelFutureAssignment(item)}>Cancel</Button> : null}</Td></Tr>)}{detail.assignments.length === 0 ? <Tr><Td colSpan={5}><Text py={6} textAlign="center" color={muted}>No effective-dated records yet.</Text></Td></Tr> : null}</Tbody></Table></TableContainer>
                  </Box>
                </Stack>
              </TabPanel>
              <TabPanel px={0}>
                {!taxEnabled ? <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}><Text fontWeight="800">Income-tax withholding is not enabled</Text><Text mt={1} color={muted}>Enable and publish that company statutory module before creating tax declarations.</Text></Box> : <Stack spacing={5}>
                  <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
                    <HStack justify="space-between" align="start"><Box><Text fontWeight="800">Tax declaration</Text><Text fontSize="sm" color={muted}>Draft values are not used by payroll until the declaration is submitted and verified.</Text></Box>{selectedDeclaration ? <Badge colorScheme={statusScheme(selectedDeclaration.status)}>{selectedDeclaration.status} v{selectedDeclaration.versionNumber}</Badge> : null}</HStack>
                    <SimpleGrid mt={4} columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired><FormLabel>Financial year</FormLabel><Input value={taxYear} onChange={(event) => setTaxYear(event.target.value)} placeholder="2026-27" isDisabled={selectedDeclaration?.status === "draft"} /><FormHelperText>Use YYYY-YY.</FormHelperText></FormControl>
                      <FormControl isRequired><FormLabel>Tax regime</FormLabel><Select value={taxRegime} onChange={(event) => setTaxRegime(event.target.value)} isDisabled={Boolean(selectedDeclaration && selectedDeclaration.status !== "draft")}><option value="">Select regime</option>{detail.provider.taxRegimes.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</Select></FormControl>
                      {detail.provider.taxDeclarationFields.map((field) => <FormControl key={field.key}><FormLabel>{field.label}</FormLabel><Input inputMode="decimal" value={declarationValues[field.key] || ""} placeholder={"0.00 " + detail.provider?.currencyCode} isDisabled={Boolean(selectedDeclaration && selectedDeclaration.status !== "draft")} onChange={(event) => setDeclarationValues((current) => ({ ...current, [field.key]: event.target.value }))} /><FormHelperText>{field.helpText}</FormHelperText></FormControl>)}
                    </SimpleGrid>
                    <FormControl mt={5} isRequired><FormLabel>{selectedDeclaration?.status === "submitted" ? "Review reason" : "Change reason"}</FormLabel><Textarea value={selectedDeclaration?.status === "submitted" ? reviewReason : declarationReason} onChange={(event) => selectedDeclaration?.status === "submitted" ? setReviewReason(event.target.value) : setDeclarationReason(event.target.value)} placeholder={selectedDeclaration?.status === "submitted" ? "Reason for verifying or returning this declaration" : "Why this declaration is being created or changed"} /></FormControl>
                    <Flex mt={4} gap={2} justify="flex-end" wrap="wrap">
                      {selectedDeclaration?.status === "draft" ? <Button variant="outline" colorScheme="red" isLoading={submitting} isDisabled={declarationReason.trim().length < 3} onClick={() => void declarationAction("cancel")}>Cancel draft</Button> : null}
                      {selectedDeclaration?.status === "submitted" ? <><Button variant="outline" colorScheme="orange" isLoading={submitting} isDisabled={reviewReason.trim().length < 3} onClick={() => void declarationAction("return")}>Return</Button><Button colorScheme="green" isLoading={submitting} isDisabled={reviewReason.trim().length < 3} onClick={() => void declarationAction("verify")}>Verify</Button></> : null}
                      {selectedDeclaration && ["returned", "verified", "superseded", "cancelled"].includes(selectedDeclaration.status) ? <Button colorScheme="blue" isLoading={submitting} isDisabled={declarationReason.trim().length < 3 || !taxRegime} onClick={() => void saveDeclaration()}>Create next draft</Button> : null}
                      {selectedDeclaration?.status === "draft" ? <><Button variant="outline" isLoading={submitting} isDisabled={declarationReason.trim().length < 3} onClick={() => void saveDeclaration()}>Save draft</Button><Button colorScheme="blue" isLoading={submitting} isDisabled={declarationReason.trim().length < 3 || !taxRegime} onClick={() => void declarationAction("submit")}>Submit for review</Button></> : null}
                      {!selectedDeclaration ? <Button colorScheme="blue" isLoading={submitting} isDisabled={declarationReason.trim().length < 3 || !taxRegime} onClick={() => void saveDeclaration()}>Create draft</Button> : null}
                    </Flex>
                  </Box>
                  <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
                    <Box px={5} py={4}><Text fontWeight="800">Declaration history</Text></Box>
                    <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Financial year</Th><Th>Version</Th><Th>Regime</Th><Th>Status</Th><Th>Reason</Th></Tr></Thead><Tbody>{detail.declarations.map((item) => <Tr key={item._id}><Td>{item.taxYear}</Td><Td>v{item.versionNumber}</Td><Td>{item.taxRegime || "-"}</Td><Td><Badge colorScheme={statusScheme(item.status)}>{item.status}</Badge></Td><Td><Text maxW="320px" noOfLines={2}>{item.reviewReason || item.changeReason}</Text></Td></Tr>)}{detail.declarations.length === 0 ? <Tr><Td colSpan={5}><Text py={6} textAlign="center" color={muted}>No declarations yet.</Text></Td></Tr> : null}</Tbody></Table></TableContainer>
                  </Box>
                </Stack>}
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </DashboardDrawer>
    </Stack>
  );
}
