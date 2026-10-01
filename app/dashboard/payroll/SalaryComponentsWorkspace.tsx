"use client";

import axios from "axios";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
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
import {
  FiArchive,
  FiClock,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
} from "react-icons/fi";

type ComponentCategory = "earning" | "deduction" | "employer_contribution" | "reimbursement";
type ComponentStatus = "active" | "archived";

type SalaryComponent = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  category: ComponentCategory;
  taxable: boolean;
  prorateOnUnpaidDays: boolean;
  status: ComponentStatus;
  displayOrder: number;
  archiveReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AuditEntry = {
  _id: string;
  action: string;
  reason?: string;
  actor?: { name?: string; username?: string; employeeCode?: string };
  details?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  createdAt?: string;
};

const emptyForm = {
  name: "",
  code: "",
  description: "",
  category: "earning" as ComponentCategory,
  taxable: true,
  prorateOnUnpaidDays: true,
  displayOrder: 0,
};

const categoryLabels: Record<ComponentCategory, string> = {
  earning: "Earning",
  deduction: "Deduction",
  employer_contribution: "Employer contribution",
  reimbursement: "Reimbursement",
};

const categorySchemes: Record<ComponentCategory, string> = {
  earning: "green",
  deduction: "red",
  employer_contribution: "purple",
  reimbursement: "blue",
};

const payImpact: Record<ComponentCategory, string> = {
  earning: "Adds to gross and net pay",
  deduction: "Reduces net pay",
  employer_contribution: "Employer cost only",
  reimbursement: "Adds to net pay, outside gross",
};

function generateComponentCode(name: string) {
  let code = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!code) return "";
  if (!/^[A-Z]/.test(code)) code = `COMP_${code}`;
  if (code.length < 2) code = `${code}_COMPONENT`;
  return code.slice(0, 30).replace(/_+$/g, "");
}

function errorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

type Props = { companyId: string; canManage: boolean };

export default function SalaryComponentsWorkspace({ companyId, canManage }: Props) {
  const toast = useToast();
  const componentDrawer = useDisclosure();
  const archiveDrawer = useDisclosure();
  const historyDrawer = useDisclosure();
  const [items, setItems] = useState<SalaryComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "archived" | "all">("active");
  const [category, setCategory] = useState<ComponentCategory | "">("");
  const [selected, setSelected] = useState<SalaryComponent | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [archiveReason, setArchiveReason] = useState("");
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const subtle = useColorModeValue("gray.50", "whiteAlpha.50");
  const effectiveCode = selected ? form.code : generateComponentCode(form.name);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadComponents = useCallback(async () => {
    if (!companyId) {
      setItems([]);
      setTotal(0);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get("/payroll/components", {
        params: { companyId, page, limit: 20, search, status, category: category || undefined },
      });
      setItems(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (error) {
      toast({ title: "Unable to load salary components", description: errorMessage(error, "Request failed"), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [category, companyId, page, search, status, toast]);

  useEffect(() => {
    void loadComponents();
  }, [loadComponents]);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    componentDrawer.onOpen();
  };

  const openEdit = (component: SalaryComponent) => {
    setSelected(component);
    setForm({
      name: component.name,
      code: component.code,
      description: component.description || "",
      category: component.category,
      taxable: component.taxable,
      prorateOnUnpaidDays: component.prorateOnUnpaidDays,
      displayOrder: component.displayOrder || 0,
    });
    componentDrawer.onOpen();
  };

  const saveComponent = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        companyId,
        name: form.name.trim(),
        code: effectiveCode,
        description: form.description.trim(),
        taxable: ["earning", "reimbursement"].includes(form.category) ? form.taxable : false,
      };
      if (selected) {
        await axios.patch(`/payroll/components/${selected._id}`, payload);
      } else {
        await axios.post("/payroll/components", payload);
      }
      toast({ title: selected ? "Salary component updated" : "Salary component created", status: "success" });
      componentDrawer.onClose();
      await loadComponents();
    } catch (error) {
      toast({ title: "Unable to save component", description: errorMessage(error, "Request failed"), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const openArchive = (component: SalaryComponent) => {
    setSelected(component);
    setArchiveReason("");
    archiveDrawer.onOpen();
  };

  const archiveComponent = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await axios.post(`/payroll/components/${selected._id}/archive`, { reason: archiveReason.trim() });
      toast({ title: "Salary component archived", status: "success" });
      archiveDrawer.onClose();
      await loadComponents();
    } catch (error) {
      toast({ title: "Unable to archive component", description: errorMessage(error, "Request failed"), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const restoreComponent = async (component: SalaryComponent) => {
    setSubmitting(true);
    try {
      await axios.post(`/payroll/components/${component._id}/restore`);
      toast({ title: "Salary component restored", status: "success" });
      await loadComponents();
    } catch (error) {
      toast({ title: "Unable to restore component", description: errorMessage(error, "Request failed"), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const openHistory = async (component: SalaryComponent) => {
    setSelected(component);
    setAuditEntries([]);
    historyDrawer.onOpen();
    setAuditLoading(true);
    try {
      const { data } = await axios.get("/payroll/audit", { params: { companyId, entityId: component._id } });
      setAuditEntries(data.data || []);
    } catch (error) {
      toast({ title: "Unable to load component history", description: errorMessage(error, "Request failed"), status: "error" });
    } finally {
      setAuditLoading(false);
    }
  };

  const validForm = useMemo(
    () => form.name.trim().length >= 2 && /^[A-Z][A-Z0-9_]{1,29}$/.test(effectiveCode),
    [effectiveCode, form.name]
  );

  return (
    <Stack spacing={4}>
      <Flex
        bg={surface}
        borderWidth="1px"
        borderColor={border}
        borderRadius="md"
        p={4}
        gap={3}
        direction={{ base: "column", lg: "row" }}
        align={{ base: "stretch", lg: "center" }}
        justify="space-between"
      >
        <Box>
          <Text fontSize="lg" fontWeight="800">Salary components</Text>
          <Text fontSize="sm" color={muted}>Reusable earning and deduction definitions. Calculation rules are added in salary structures.</Text>
        </Box>
        {canManage ? <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={openCreate}>New component</Button> : null}
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
          <Text fontSize="xs" fontWeight="700" color={muted} textTransform="uppercase">Matching components</Text>
          <Text mt={1} fontSize="2xl" fontWeight="800">{total}</Text>
        </Box>
        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
          <Text fontSize="xs" fontWeight="700" color={muted} textTransform="uppercase">Configuration stage</Text>
          <Text mt={1} fontWeight="700">Component master</Text>
        </Box>
        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
          <Text fontSize="xs" fontWeight="700" color={muted} textTransform="uppercase">Next dependency</Text>
          <Text mt={1} fontWeight="700">Versioned salary structures</Text>
        </Box>
      </SimpleGrid>

      <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
        <Flex p={4} gap={3} direction={{ base: "column", md: "row" }} borderBottomWidth="1px" borderColor={border}>
          <HStack flex="1" minW={{ md: "260px" }}>
            <Icon as={FiSearch} color={muted} />
            <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name or code" />
          </HStack>
          <Select value={category} onChange={(event) => { setCategory(event.target.value as ComponentCategory | ""); setPage(1); }} maxW={{ md: "230px" }}>
            <option value="">All categories</option>
            {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }} maxW={{ md: "180px" }}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All statuses</option>
          </Select>
          <IconButton aria-label="Refresh components" icon={<FiRefreshCw />} variant="outline" onClick={() => void loadComponents()} isLoading={loading} />
        </Flex>

        {loading ? (
          <Stack p={4} spacing={3}>{[1, 2, 3].map((value) => <Skeleton key={value} h="52px" />)}</Stack>
        ) : items.length === 0 ? (
          <Box py={14} px={4} textAlign="center">
            <Text fontWeight="700">No salary components found</Text>
            <Text mt={1} fontSize="sm" color={muted}>Create the component definitions used by salary structures.</Text>
          </Box>
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead bg={subtle}>
                <Tr>
                  <Th>Component</Th><Th>Category</Th><Th>Payroll impact</Th><Th>Behavior</Th><Th>Status</Th><Th textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((component) => (
                  <Tr key={component._id}>
                    <Td>
                      <Text fontWeight="700">{component.name}</Text>
                      <Text fontSize="xs" color={muted}>{component.code}{component.description ? ` | ${component.description}` : ""}</Text>
                    </Td>
                    <Td><Badge colorScheme={categorySchemes[component.category]}>{categoryLabels[component.category]}</Badge></Td>
                    <Td fontSize="sm">{payImpact[component.category]}</Td>
                    <Td>
                      <HStack spacing={1} wrap="wrap">
                        {component.taxable ? <Badge variant="outline">Taxable</Badge> : null}
                        {component.prorateOnUnpaidDays ? <Badge variant="outline">Prorated for LOP</Badge> : <Badge variant="outline">Not prorated</Badge>}
                      </HStack>
                    </Td>
                    <Td><Badge colorScheme={component.status === "active" ? "green" : "gray"}>{component.status}</Badge></Td>
                    <Td>
                      <HStack justify="flex-end">
                        <IconButton aria-label={`View ${component.name} history`} title="History" icon={<FiClock />} size="sm" variant="ghost" onClick={() => void openHistory(component)} />
                        {canManage && component.status === "active" ? (
                          <>
                            <IconButton aria-label={`Edit ${component.name}`} title="Edit" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => openEdit(component)} />
                            <IconButton aria-label={`Archive ${component.name}`} title="Archive" icon={<FiArchive />} size="sm" variant="ghost" colorScheme="red" onClick={() => openArchive(component)} />
                          </>
                        ) : null}
                        {canManage && component.status === "archived" ? <IconButton aria-label={`Restore ${component.name}`} title="Restore" icon={<FiRotateCcw />} size="sm" variant="ghost" colorScheme="blue" isDisabled={submitting} onClick={() => void restoreComponent(component)} /> : null}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}

        <Flex px={4} py={3} borderTopWidth="1px" borderColor={border} justify="space-between" align="center">
          <Text fontSize="sm" color={muted}>{total} matching component{total === 1 ? "" : "s"}</Text>
          <HStack>
            <Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button>
            <Text fontSize="sm">{page} / {Math.max(totalPages, 1)}</Text>
            <Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button>
          </HStack>
        </Flex>
      </Box>

      <Drawer isOpen={componentDrawer.isOpen} placement="right" onClose={componentDrawer.onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">{selected ? "Edit salary component" : "New salary component"}</DrawerHeader>
          <DrawerBody py={5}>
            <Stack spacing={5}>
              <FormControl isRequired>
                <FormLabel>Component name</FormLabel>
                <Input
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setForm((value) => ({ ...value, name }));
                  }}
                  placeholder="e.g. Basic Salary"
                />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>System code</FormLabel>
                  <Input value={effectiveCode} isReadOnly bg={subtle} placeholder="Generated from the component name" />
                  <FormHelperText>Generated automatically for imports and payroll rules. You do not need to enter it.</FormHelperText>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select value={form.category} isDisabled={Boolean(selected)} onChange={(event) => {
                    const nextCategory = event.target.value as ComponentCategory;
                    setForm((value) => ({ ...value, category: nextCategory, taxable: ["earning", "reimbursement"].includes(nextCategory) ? value.taxable : false }));
                  }}>
                    {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </Select>
                  <FormHelperText>{payImpact[form.category]}</FormHelperText>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea value={form.description} maxLength={500} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} placeholder="What this component represents" />
              </FormControl>
              <FormControl>
                <FormLabel>Display order</FormLabel>
                <NumberInput min={0} precision={0} value={form.displayOrder} onChange={(_, numberValue) => setForm((value) => ({ ...value, displayOrder: Number.isFinite(numberValue) ? numberValue : 0 }))}>
                  <NumberInputField />
                </NumberInput>
                <FormHelperText>Lower numbers appear first in structures and payslips.</FormHelperText>
              </FormControl>
              <Box borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
                <Stack spacing={4}>
                  <Checkbox isChecked={form.taxable} isDisabled={!["earning", "reimbursement"].includes(form.category)} onChange={(event) => setForm((value) => ({ ...value, taxable: event.target.checked }))}>
                    Include in taxable income
                  </Checkbox>
                  <Checkbox isChecked={form.prorateOnUnpaidDays} onChange={(event) => setForm((value) => ({ ...value, prorateOnUnpaidDays: event.target.checked }))}>
                    Prorate when the employee has loss-of-pay days
                  </Checkbox>
                </Stack>
              </Box>
            </Stack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" gap={3}>
            <Button variant="ghost" onClick={componentDrawer.onClose}>Cancel</Button>
            <Button colorScheme="blue" isDisabled={!validForm} isLoading={submitting} onClick={() => void saveComponent()}>{selected ? "Save changes" : "Create component"}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer isOpen={archiveDrawer.isOpen} placement="right" onClose={archiveDrawer.onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Archive salary component</DrawerHeader>
          <DrawerBody py={5}>
            <Stack spacing={4}>
              <Text>Archive <Text as="span" fontWeight="700">{selected?.name}</Text>? Existing historical references will remain valid.</Text>
              <FormControl isRequired>
                <FormLabel>Reason</FormLabel>
                <Textarea value={archiveReason} maxLength={500} onChange={(event) => setArchiveReason(event.target.value)} placeholder="Why this component is no longer used" />
                <FormHelperText>Minimum 3 characters. Stored in payroll audit history.</FormHelperText>
              </FormControl>
            </Stack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" gap={3}>
            <Button variant="ghost" onClick={archiveDrawer.onClose}>Cancel</Button>
            <Button colorScheme="red" isDisabled={archiveReason.trim().length < 3} isLoading={submitting} onClick={() => void archiveComponent()}>Archive</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer isOpen={historyDrawer.isOpen} placement="right" onClose={historyDrawer.onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">{selected?.name} history</DrawerHeader>
          <DrawerBody py={5}>
            {auditLoading ? <Stack>{[1, 2, 3].map((value) => <Skeleton key={value} h="88px" />)}</Stack> : auditEntries.length === 0 ? <Text color={muted}>No audit events found.</Text> : (
              <Stack spacing={3}>
                {auditEntries.map((entry) => (
                  <Box key={entry._id} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
                    <HStack justify="space-between" align="start">
                      <Badge colorScheme={entry.action === "archived" ? "red" : entry.action === "restored" ? "blue" : "green"}>{entry.action}</Badge>
                      <Text fontSize="xs" color={muted}>{formatDateTime(entry.createdAt)}</Text>
                    </HStack>
                    <Text mt={2} fontSize="sm" fontWeight="600">{entry.actor?.name || entry.actor?.username || "Payroll administrator"}</Text>
                    {entry.reason ? <Text mt={1} fontSize="sm" color={muted}>{entry.reason}</Text> : null}
                  </Box>
                ))}
              </Stack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Stack>
  );
}

