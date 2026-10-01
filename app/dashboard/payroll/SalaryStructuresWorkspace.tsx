"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import axios from "axios";
import {
  Badge,
  Box,
  Button,
  Checkbox,
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
import { FiArchive, FiEdit2, FiPlus, FiRefreshCw, FiRotateCcw, FiSearch, FiTrash2 } from "react-icons/fi";

type Category = "earning" | "deduction" | "employer_contribution" | "reimbursement";
type CalculationType = "fixed" | "percentage" | "variable";

type ComponentOption = {
  _id: string;
  name: string;
  code: string;
  category: Category;
  status: "active" | "archived";
};

type Rule = {
  salaryComponent: string;
  componentNameSnapshot?: string;
  componentCodeSnapshot?: string;
  calculationType: CalculationType;
  amount: string;
  percentage: string;
  percentageOfComponent: string;
  allowEmployeeOverride: boolean;
  displayOrder: number;
};

type Preview = {
  monthlyGrossMinor: number;
  monthlyDeductionsMinor: number;
  monthlyReimbursementsMinor: number;
  monthlyEmployerContributionsMinor: number;
  monthlyNetMinor: number;
  monthlyEmployerCostMinor: number;
  annualGrossMinor: number;
  annualNetMinor: number;
  annualEmployerCostMinor: number;
};

type Version = {
  _id: string;
  versionNumber: number;
  status: "draft" | "published" | "cancelled";
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  currency: string;
  currencyMinorUnits: number;
  roundingMode: "nearest" | "floor" | "ceil";
  rules: Array<{
    salaryComponent: string;
    componentNameSnapshot: string;
    componentCodeSnapshot: string;
    calculationType: CalculationType;
    monthlyAmountMinor?: number | null;
    percentageBps?: number | null;
    percentageOfComponent?: string | null;
    allowEmployeeOverride: boolean;
    displayOrder: number;
  }>;
  preview?: Preview;
  changeReason?: string;
  cancelReason?: string;
  createdAt?: string;
};

type Structure = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "archived";
  latestVersionNumber: number;
  draftVersion?: Version | null;
  latestPublishedVersion?: Version | null;
};

type Settings = {
  currency: string;
  currencyMinorUnits: number;
  roundingMode: "nearest" | "floor" | "ceil";
};

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const categoryLabel: Record<Category, string> = {
  earning: "Earning",
  deduction: "Deduction",
  employer_contribution: "Employer contribution",
  reimbursement: "Reimbursement",
};

function errorMessage(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || "Request failed";
}

function toMinor(value: string, minorUnits: number) {
  const normalized = value.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error("Enter a valid non-negative amount");
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > minorUnits) throw new Error(`Use at most ${minorUnits} decimal places`);
  const factor = 10 ** minorUnits;
  const amount = Number(whole) * factor + Number(fraction.padEnd(minorUnits, "0") || "0");
  if (!Number.isSafeInteger(amount)) throw new Error("Amount is too large");
  return amount;
}

function fromMinor(value: number | null | undefined, minorUnits: number) {
  const factor = 10 ** minorUnits;
  return (Number(value || 0) / factor).toFixed(minorUnits);
}

function toBasisPoints(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new Error("Percentage must use at most two decimals");
  const basisPoints = Math.round(Number(value) * 100);
  if (basisPoints < 1 || basisPoints > 10000) throw new Error("Percentage must be between 0.01 and 100");
  return basisPoints;
}

function formatMoney(value: number | undefined, settings: Pick<Settings, "currency" | "currencyMinorUnits">) {
  const amount = Number(value || 0) / 10 ** settings.currencyMinorUnits;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: settings.currency,
      minimumFractionDigits: settings.currencyMinorUnits,
      maximumFractionDigits: settings.currencyMinorUnits,
    }).format(amount);
  } catch {
    return `${settings.currency} ${amount.toFixed(settings.currencyMinorUnits)}`;
  }
}

function versionRule(rule: Version["rules"][number], minorUnits: number): Rule {
  return {
    salaryComponent: String(rule.salaryComponent),
    componentNameSnapshot: rule.componentNameSnapshot,
    componentCodeSnapshot: rule.componentCodeSnapshot,
    calculationType: rule.calculationType,
    amount: fromMinor(rule.monthlyAmountMinor, minorUnits),
    percentage: rule.percentageBps ? String(rule.percentageBps / 100) : "",
    percentageOfComponent: String(rule.percentageOfComponent || ""),
    allowEmployeeOverride: Boolean(rule.allowEmployeeOverride),
    displayOrder: rule.displayOrder || 0,
  };
}

type Props = { companyId: string; canManage: boolean };

export default function SalaryStructuresWorkspace({ companyId, canManage }: Props) {
  const toast = useToast();
  const editor = useDisclosure();
  const archiveDialog = useDisclosure();
  const [items, setItems] = useState<Structure[]>([]);
  const [components, setComponents] = useState<ComponentOption[]>([]);
  const [settings, setSettings] = useState<Settings>({ currency: "INR", currencyMinorUnits: 2, roundingMode: "nearest" });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "archived" | "all">("active");
  const [selected, setSelected] = useState<Structure | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [draft, setDraft] = useState<Version | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [minorUnits, setMinorUnits] = useState(2);
  const [roundingMode, setRoundingMode] = useState<"nearest" | "floor" | "ceil">("nearest");
  const [rules, setRules] = useState<Rule[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState(today());
  const [changeReason, setChangeReason] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");

  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const subtle = useColorModeValue("gray.50", "whiteAlpha.50");

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadReferenceData = useCallback(async () => {
    if (!companyId) return;
    try {
      const [componentResponse, settingsResponse] = await Promise.all([
        axios.get("/payroll/components", { params: { companyId, status: "active", page: 1, limit: 100 } }),
        axios.get("/payroll/settings", { params: { companyId } }),
      ]);
      setComponents(componentResponse.data?.data || []);
      setSettings(settingsResponse.data?.data || settings);
    } catch (error) {
      toast({ title: "Unable to load salary structure options", description: errorMessage(error), status: "error" });
    }
  }, [companyId, toast]);

  const loadStructures = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data } = await axios.get("/payroll/structures", { params: { companyId, page, limit: 20, search, status } });
      setItems(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (error) {
      toast({ title: "Unable to load salary structures", description: errorMessage(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, page, search, status, toast]);

  useEffect(() => { void loadReferenceData(); }, [loadReferenceData]);
  useEffect(() => { void loadStructures(); }, [loadStructures]);

  const payloadRules = useCallback(() => rules.map((rule, index) => ({
    salaryComponentId: rule.salaryComponent,
    calculationType: rule.calculationType,
    monthlyAmountMinor: rule.calculationType === "percentage" ? null : toMinor(rule.amount || "0", minorUnits),
    percentageBps: rule.calculationType === "percentage" ? toBasisPoints(rule.percentage) : null,
    percentageOfComponentId: rule.calculationType === "percentage" ? rule.percentageOfComponent : null,
    allowEmployeeOverride: rule.allowEmployeeOverride,
    displayOrder: index,
  })), [minorUnits, rules]);

  const editable = creating || Boolean(draft);

  useEffect(() => {
    if (!editor.isOpen || !editable || !canManage || !companyId || rules.length === 0) return;
    const timer = window.setTimeout(async () => {
      try {
        const normalizedRules = payloadRules();
        if (normalizedRules.some((rule) => !rule.salaryComponentId)) return;
        setPreviewLoading(true);
        setPreviewError("");
        const { data } = await axios.post("/payroll/structures/preview", {
          companyId,
          currency,
          currencyMinorUnits: minorUnits,
          roundingMode,
          rules: normalizedRules,
        });
        setPreview(data.data?.preview || null);
      } catch (error) {
        setPreview(null);
        setPreviewError(errorMessage(error));
      } finally {
        setPreviewLoading(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [canManage, companyId, currency, editable, editor.isOpen, minorUnits, payloadRules, roundingMode, rules.length]);

  const applyVersion = (structure: Structure, version: Version | null, history: Version[]) => {
    setSelected(structure);
    setVersions(history);
    setDraft(version?.status === "draft" ? version : null);
    const source = version || history.find((item) => item.status === "published") || null;
    setName(structure.name);
    setCode(structure.code);
    setDescription(structure.description || "");
    setCurrency(source?.currency || settings.currency);
    setMinorUnits(source?.currencyMinorUnits ?? settings.currencyMinorUnits);
    setRoundingMode(source?.roundingMode || settings.roundingMode);
    setRules(source?.rules?.map((rule) => versionRule(rule, source.currencyMinorUnits)) || []);
    setPreview(source?.preview || null);
    setEffectiveFrom(source?.status === "draft" ? today() : String(source?.effectiveFrom || today()).slice(0, 10));
    setChangeReason(source?.status === "draft" ? source.changeReason || "" : "");
  };

  const openCreate = () => {
    setCreating(true);
    setSelected(null);
    setVersions([]);
    setDraft(null);
    setName(""); setCode(""); setDescription("");
    setCurrency(settings.currency); setMinorUnits(settings.currencyMinorUnits); setRoundingMode(settings.roundingMode);
    setRules([]); setPreview(null); setPreviewError(""); setEffectiveFrom(today()); setChangeReason("Initial salary structure");
    editor.onOpen();
  };

  const loadDetail = async (structure: Structure, open = true) => {
    setSubmitting(true);
    try {
      const { data } = await axios.get(`/payroll/structures/${structure._id}`, { params: { companyId } });
      const history: Version[] = data.data?.versions || [];
      const structureDetail: Structure = data.data?.structure;
      const currentDraft = history.find((item) => item.status === "draft") || null;
      applyVersion(structureDetail, currentDraft || history.find((item) => item.status === "published") || null, history);
      setCreating(false);
      if (open) editor.onOpen();
    } catch (error) {
      toast({ title: "Unable to open salary structure", description: errorMessage(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const addRule = () => {
    const used = new Set(rules.map((rule) => rule.salaryComponent));
    const component = components.find((item) => !used.has(item._id));
    if (!component) {
      toast({ title: "No unused active salary components are available", status: "warning" });
      return;
    }
    setRules((current) => [...current, {
      salaryComponent: component._id,
      componentNameSnapshot: component.name,
      componentCodeSnapshot: component.code,
      calculationType: "fixed",
      amount: fromMinor(0, minorUnits),
      percentage: "",
      percentageOfComponent: "",
      allowEmployeeOverride: false,
      displayOrder: current.length,
    }]);
  };

  const updateRule = (index: number, patch: Partial<Rule>) => {
    setRules((current) => current.map((rule, itemIndex) => itemIndex === index ? { ...rule, ...patch } : rule));
  };

  const basePayload = () => ({
    companyId,
    name: name.trim(),
    code: code.trim().toUpperCase(),
    description: description.trim(),
    currency,
    currencyMinorUnits: minorUnits,
    roundingMode,
    rules: payloadRules(),
    changeReason: changeReason.trim(),
  });

  const save = async (publish: boolean) => {
    if (name.trim().length < 2 || !/^[A-Z][A-Z0-9_]{1,29}$/.test(code.trim().toUpperCase())) {
      toast({ title: "Enter a valid structure name and code", status: "warning" }); return;
    }
    if (!rules.length) { toast({ title: "Add at least one salary component", status: "warning" }); return; }
    if (publish && (!effectiveFrom || changeReason.trim().length < 3)) {
      toast({ title: "Effective date and a change reason are required for publishing", status: "warning" }); return;
    }
    setSubmitting(true);
    try {
      let structureId = selected?._id || "";
      let versionId = draft?._id || "";
      if (creating) {
        const { data } = await axios.post("/payroll/structures", basePayload());
        structureId = data.data?.structure?._id;
        versionId = data.data?.version?._id;
      } else if (draft && selected) {
        await axios.patch(`/payroll/structures/${selected._id}/versions/${draft._id}`, basePayload());
      }
      if (publish) {
        await axios.post(`/payroll/structures/${structureId}/versions/${versionId}/publish`, {
          companyId,
          effectiveFrom,
          changeReason: changeReason.trim(),
        });
      }
      toast({ title: publish ? "Salary structure published" : "Salary structure draft saved", status: "success" });
      editor.onClose();
      await loadStructures();
    } catch (error) {
      toast({ title: "Unable to save salary structure", description: errorMessage(error), status: "error" });
      await loadStructures();
    } finally {
      setSubmitting(false);
    }
  };

  const createVersion = async () => {
    if (!selected || changeReason.trim().length < 3) {
      toast({ title: "Enter a change reason before creating the new version", status: "warning" }); return;
    }
    setSubmitting(true);
    try {
      await axios.post(`/payroll/structures/${selected._id}/versions`, { companyId, changeReason: changeReason.trim() });
      toast({ title: "New salary structure draft created", status: "success" });
      await loadDetail(selected, false);
      await loadStructures();
    } catch (error) {
      toast({ title: "Unable to create structure version", description: errorMessage(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelDraft = async () => {
    if (!selected || !draft || changeReason.trim().length < 3) {
      toast({ title: "Enter a cancellation reason", status: "warning" }); return;
    }
    setSubmitting(true);
    try {
      await axios.post(`/payroll/structures/${selected._id}/versions/${draft._id}/cancel`, { companyId, reason: changeReason.trim() });
      toast({ title: "Salary structure draft cancelled", status: "success" });
      await loadDetail(selected, false);
      await loadStructures();
    } catch (error) {
      toast({ title: "Unable to cancel draft", description: errorMessage(error), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const archive = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await axios.post(`/payroll/structures/${selected._id}/archive`, { companyId, reason: archiveReason.trim() });
      toast({ title: "Salary structure archived", status: "success" });
      archiveDialog.onClose();
      await loadStructures();
    } catch (error) {
      toast({ title: "Unable to archive structure", description: errorMessage(error), status: "error" });
    } finally { setSubmitting(false); }
  };

  const restore = async (structure: Structure) => {
    setSubmitting(true);
    try {
      await axios.post(`/payroll/structures/${structure._id}/restore`, { companyId });
      toast({ title: "Salary structure restored", status: "success" });
      await loadStructures();
    } catch (error) {
      toast({ title: "Unable to restore structure", description: errorMessage(error), status: "error" });
    } finally { setSubmitting(false); }
  };

  const knownComponents = useMemo(() => {
    const values = [...components];
    rules.forEach((rule) => {
      if (!values.some((item) => item._id === rule.salaryComponent)) {
        values.push({
          _id: rule.salaryComponent,
          name: rule.componentNameSnapshot || "Archived component",
          code: rule.componentCodeSnapshot || "ARCHIVED",
          category: "earning",
          status: "archived",
        });
      }
    });
    return values;
  }, [components, rules]);

  return (
    <Stack spacing={4}>
      <Flex bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4} gap={3} direction={{ base: "column", lg: "row" }} align={{ base: "stretch", lg: "center" }} justify="space-between">
        <Box><Text fontSize="lg" fontWeight="800">Salary structures</Text><Text fontSize="sm" color={muted}>Effective-dated templates with immutable published versions and exact calculation snapshots.</Text></Box>
        {canManage ? <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={openCreate}>New structure</Button> : null}
      </Flex>

      <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
        <Flex p={4} gap={3} direction={{ base: "column", md: "row" }} borderBottomWidth="1px" borderColor={border}>
          <HStack flex="1"><FiSearch /><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search structure name or code" /></HStack>
          <Select maxW={{ md: "180px" }} value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }}><option value="active">Active</option><option value="archived">Archived</option><option value="all">All statuses</option></Select>
          <IconButton aria-label="Refresh salary structures" icon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={() => void loadStructures()} />
        </Flex>
        {loading ? <Stack p={4}>{[1, 2, 3].map((item) => <Skeleton key={item} h="56px" />)}</Stack> : items.length === 0 ? (
          <Box py={14} textAlign="center"><Text fontWeight="700">No salary structures found</Text><Text mt={1} fontSize="sm" color={muted}>Create a draft using the active salary components.</Text></Box>
        ) : (
          <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Structure</Th><Th>Version state</Th><Th>Effective period</Th><Th>Monthly preview</Th><Th>Status</Th><Th textAlign="right">Actions</Th></Tr></Thead><Tbody>
            {items.map((structure) => {
              const version = structure.draftVersion || structure.latestPublishedVersion;
              return <Tr key={structure._id}>
                <Td><Text fontWeight="700">{structure.name}</Text><Text fontSize="xs" color={muted}>{structure.code}</Text></Td>
                <Td>{structure.draftVersion ? <Badge colorScheme="orange">Draft v{structure.draftVersion.versionNumber}</Badge> : structure.latestPublishedVersion ? <Badge colorScheme="green">Published v{structure.latestPublishedVersion.versionNumber}</Badge> : <Badge>Not published</Badge>}</Td>
                <Td fontSize="sm">{structure.latestPublishedVersion?.effectiveFrom ? `${String(structure.latestPublishedVersion.effectiveFrom).slice(0, 10)}${structure.latestPublishedVersion.effectiveTo ? ` to ${String(structure.latestPublishedVersion.effectiveTo).slice(0, 10)}` : " onward"}` : "-"}</Td>
                <Td><Text fontSize="sm">Gross {formatMoney(version?.preview?.monthlyGrossMinor, { currency: version?.currency || settings.currency, currencyMinorUnits: version?.currencyMinorUnits ?? settings.currencyMinorUnits })}</Text><Text fontSize="xs" color={muted}>Net {formatMoney(version?.preview?.monthlyNetMinor, { currency: version?.currency || settings.currency, currencyMinorUnits: version?.currencyMinorUnits ?? settings.currencyMinorUnits })}</Text></Td>
                <Td><Badge colorScheme={structure.status === "active" ? "green" : "gray"}>{structure.status}</Badge></Td>
                <Td><HStack justify="flex-end"><IconButton aria-label={`Open ${structure.name}`} title="Open structure" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => void loadDetail(structure)} />
                  {canManage && structure.status === "active" ? <IconButton aria-label={`Archive ${structure.name}`} title={structure.draftVersion ? "Cancel the draft before archiving" : "Archive"} icon={<FiArchive />} size="sm" variant="ghost" colorScheme="red" isDisabled={Boolean(structure.draftVersion)} onClick={() => { setSelected(structure); setArchiveReason(""); archiveDialog.onOpen(); }} /> : null}
                  {canManage && structure.status === "archived" ? <IconButton aria-label={`Restore ${structure.name}`} title="Restore" icon={<FiRotateCcw />} size="sm" variant="ghost" onClick={() => void restore(structure)} /> : null}
                </HStack></Td>
              </Tr>;
            })}
          </Tbody></Table></TableContainer>
        )}
        <Flex p={4} borderTopWidth="1px" borderColor={border} justify="space-between" align="center"><Text fontSize="sm" color={muted}>{total} matching structure{total === 1 ? "" : "s"}</Text><HStack><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {Math.max(1, totalPages)}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack></Flex>
      </Box>

      <DashboardDrawer
        isOpen={editor.isOpen}
        onClose={editor.onClose}
        titlePrefix={creating ? "New" : draft ? "Edit" : "View"}
        titleSuffix={creating ? "salary structure" : selected?.name || "salary structure"}
        subtitle="Draft changes affect no employees until this version is published and assigned."
        maxW={{ base: "100%", md: "82%" }}
        footerContent={editable && canManage ? <Flex w="full" justify="space-between" gap={3} wrap="wrap">
          <Box>{draft ? <Button colorScheme="red" variant="ghost" isDisabled={changeReason.trim().length < 3} isLoading={submitting} onClick={() => void cancelDraft()}>Cancel draft</Button> : null}</Box>
          <HStack><Button variant="ghost" onClick={editor.onClose}>Close</Button><Button variant="outline" isLoading={submitting} onClick={() => void save(false)}>Save draft</Button><Button colorScheme="blue" isLoading={submitting} isDisabled={Boolean(previewError) || !preview} onClick={() => void save(true)}>Save and publish</Button></HStack>
        </Flex> : <Flex w="full" justify="flex-end" gap={3}><Button variant="ghost" onClick={editor.onClose}>Close</Button>{canManage && selected?.status === "active" ? <Button colorScheme="blue" isLoading={submitting} isDisabled={changeReason.trim().length < 3} onClick={() => void createVersion()}>Create new version</Button> : null}</Flex>}
      >
        <Stack spacing={5}>
          <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
            <Text mb={4} fontWeight="800">Structure identity</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired><FormLabel>Name</FormLabel><Input value={name} isDisabled={!editable} onChange={(event) => setName(event.target.value)} /></FormControl>
              <FormControl isRequired><FormLabel>Code</FormLabel><Input value={code} isDisabled={!creating} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))} /><FormHelperText>Permanent identifier after creation.</FormHelperText></FormControl>
            </SimpleGrid>
            <FormControl mt={4}><FormLabel>Description</FormLabel><Textarea value={description} isDisabled={!editable} onChange={(event) => setDescription(event.target.value)} /></FormControl>
          </Box>

          <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
            <Text mb={4} fontWeight="800">Version settings</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl><FormLabel>Currency</FormLabel><Input value={currency} isDisabled={!editable} maxLength={3} onChange={(event) => setCurrency(event.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} /></FormControl>
              <FormControl><FormLabel>Decimal places</FormLabel><Select value={minorUnits} isDisabled={!editable} onChange={(event) => setMinorUnits(Number(event.target.value))}><option value={0}>0</option><option value={2}>2</option><option value={3}>3</option></Select></FormControl>
              <FormControl><FormLabel>Percentage rounding</FormLabel><Select value={roundingMode} isDisabled={!editable} onChange={(event) => setRoundingMode(event.target.value as typeof roundingMode)}><option value="nearest">Nearest</option><option value="floor">Round down</option><option value="ceil">Round up</option></Select></FormControl>
            </SimpleGrid>
          </Box>

          <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
            <Flex justify="space-between" align="center" mb={4}><Box><Text fontWeight="800">Component rules</Text><Text fontSize="sm" color={muted}>Percentage rules may reference another component in this version. Circular references are rejected.</Text></Box>{editable ? <Button size="sm" leftIcon={<FiPlus />} variant="outline" onClick={addRule}>Add component</Button> : null}</Flex>
            <Stack spacing={4}>
              {rules.length === 0 ? <Text color={muted}>No component rules yet.</Text> : rules.map((rule, index) => {
                const selectedComponent = knownComponents.find((item) => item._id === rule.salaryComponent);
                return <Box key={`${rule.salaryComponent}-${index}`} bg={subtle} borderWidth="1px" borderColor={border} borderRadius="md" p={4}>
                  <Flex justify="space-between" align="center" mb={3}><HStack><Text fontWeight="700">Component {index + 1}</Text>{selectedComponent ? <Badge>{categoryLabel[selectedComponent.category]}</Badge> : null}</HStack>{editable ? <IconButton aria-label="Remove component rule" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => setRules((current) => current.filter((_, itemIndex) => itemIndex !== index))} /> : null}</Flex>
                  <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
                    <FormControl isRequired><FormLabel>Salary component</FormLabel><Select value={rule.salaryComponent} isDisabled={!editable} onChange={(event) => {
                      const option = knownComponents.find((item) => item._id === event.target.value);
                      updateRule(index, { salaryComponent: event.target.value, componentNameSnapshot: option?.name, componentCodeSnapshot: option?.code, percentageOfComponent: "" });
                    }}>{knownComponents.map((option) => <option key={option._id} value={option._id} disabled={option.status === "archived" || rules.some((item, itemIndex) => itemIndex !== index && item.salaryComponent === option._id)}>{option.code} - {option.name}{option.status === "archived" ? " (archived)" : ""}</option>)}</Select></FormControl>
                    <FormControl isRequired><FormLabel>Calculation</FormLabel><Select value={rule.calculationType} isDisabled={!editable} onChange={(event) => updateRule(index, { calculationType: event.target.value as CalculationType, percentage: "", percentageOfComponent: "" })}><option value="fixed">Fixed monthly amount</option><option value="percentage">Percentage of component</option><option value="variable">Variable with default</option></Select></FormControl>
                    {rule.calculationType === "percentage" ? <FormControl isRequired><FormLabel>Percentage</FormLabel><Input value={rule.percentage} isDisabled={!editable} inputMode="decimal" placeholder="e.g. 40" onChange={(event) => updateRule(index, { percentage: event.target.value })} /></FormControl> : <FormControl isRequired><FormLabel>{rule.calculationType === "variable" ? "Default monthly amount" : "Monthly amount"} ({currency})</FormLabel><Input value={rule.amount} isDisabled={!editable} inputMode="decimal" onChange={(event) => updateRule(index, { amount: event.target.value })} /></FormControl>}
                  </SimpleGrid>
                  {rule.calculationType === "percentage" ? <FormControl mt={4} maxW="420px" isRequired><FormLabel>Percentage of</FormLabel><Select value={rule.percentageOfComponent} isDisabled={!editable} onChange={(event) => updateRule(index, { percentageOfComponent: event.target.value })}><option value="">Select basis component</option>{rules.filter((_, itemIndex) => itemIndex !== index).map((basis) => <option key={basis.salaryComponent} value={basis.salaryComponent}>{basis.componentCodeSnapshot || knownComponents.find((item) => item._id === basis.salaryComponent)?.code}</option>)}</Select></FormControl> : null}
                  <Checkbox mt={4} isChecked={rule.allowEmployeeOverride} isDisabled={!editable} onChange={(event) => updateRule(index, { allowEmployeeOverride: event.target.checked })}>Allow an employee-specific value when this structure is assigned</Checkbox>
                </Box>;
              })}
            </Stack>
          </Box>

          <Box borderWidth="1px" borderColor={previewError ? "red.300" : border} borderRadius="md" p={5}>
            <Flex justify="space-between" align="center" mb={4}><Text fontWeight="800">Calculated preview</Text>{previewLoading ? <Badge colorScheme="blue">Calculating</Badge> : null}</Flex>
            {previewError ? <Text color="red.500" fontSize="sm">{previewError}</Text> : preview ? <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
              <Box><Text fontSize="xs" color={muted}>Monthly gross</Text><Text fontWeight="800">{formatMoney(preview.monthlyGrossMinor, { currency, currencyMinorUnits: minorUnits })}</Text></Box>
              <Box><Text fontSize="xs" color={muted}>Monthly deductions</Text><Text fontWeight="800">{formatMoney(preview.monthlyDeductionsMinor, { currency, currencyMinorUnits: minorUnits })}</Text></Box>
              <Box><Text fontSize="xs" color={muted}>Monthly net</Text><Text fontWeight="800">{formatMoney(preview.monthlyNetMinor, { currency, currencyMinorUnits: minorUnits })}</Text></Box>
              <Box><Text fontSize="xs" color={muted}>Monthly employer cost</Text><Text fontWeight="800">{formatMoney(preview.monthlyEmployerCostMinor, { currency, currencyMinorUnits: minorUnits })}</Text></Box>
              <Box><Text fontSize="xs" color={muted}>Annual gross</Text><Text fontWeight="800">{formatMoney(preview.annualGrossMinor, { currency, currencyMinorUnits: minorUnits })}</Text></Box>
              <Box><Text fontSize="xs" color={muted}>Annual employer cost</Text><Text fontWeight="800">{formatMoney(preview.annualEmployerCostMinor, { currency, currencyMinorUnits: minorUnits })}</Text></Box>
            </SimpleGrid> : <Text color={muted} fontSize="sm">Add valid rules to calculate the structure.</Text>}
          </Box>

          <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
            <Text mb={4} fontWeight="800">Version control</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired={editable}><FormLabel>Effective from</FormLabel><Input type="date" value={effectiveFrom} isDisabled={!editable} onChange={(event) => setEffectiveFrom(event.target.value)} /><FormHelperText>The previous published version ends one day before this date.</FormHelperText></FormControl>
              <FormControl isRequired><FormLabel>{draft ? "Change or cancellation reason" : "Change reason"}</FormLabel><Textarea value={changeReason} isDisabled={!canManage || creating === false && Boolean(draft) === false && selected?.status !== "active"} onChange={(event) => setChangeReason(event.target.value)} placeholder="Why this version is changing" /></FormControl>
            </SimpleGrid>
          </Box>

          {!creating ? <Box borderWidth="1px" borderColor={border} borderRadius="md" p={5}><Text mb={4} fontWeight="800">Version history</Text><Stack spacing={2}>{versions.map((version) => <Flex key={version._id} p={3} bg={subtle} borderRadius="md" justify="space-between" gap={3} wrap="wrap"><HStack><Badge colorScheme={version.status === "published" ? "green" : version.status === "draft" ? "orange" : "gray"}>v{version.versionNumber} {version.status}</Badge><Text fontSize="sm">{version.changeReason || version.cancelReason || "No reason recorded"}</Text></HStack><Text fontSize="xs" color={muted}>{version.effectiveFrom ? `${String(version.effectiveFrom).slice(0, 10)}${version.effectiveTo ? ` to ${String(version.effectiveTo).slice(0, 10)}` : " onward"}` : "Not effective"}</Text></Flex>)}</Stack></Box> : null}
        </Stack>
      </DashboardDrawer>

      <Modal isOpen={archiveDialog.isOpen} onClose={archiveDialog.onClose} isCentered><ModalOverlay /><ModalContent><ModalHeader>Archive salary structure</ModalHeader><ModalCloseButton /><ModalBody><Text mb={4}>Archive <Text as="span" fontWeight="700">{selected?.name}</Text>? Published versions remain available for historical assignments.</Text><FormControl isRequired><FormLabel>Reason</FormLabel><Textarea value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} /></FormControl></ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={archiveDialog.onClose}>Cancel</Button><Button colorScheme="red" isDisabled={archiveReason.trim().length < 3} isLoading={submitting} onClick={() => void archive()}>Archive</Button></ModalFooter></ModalContent></Modal>
    </Stack>
  );
}
