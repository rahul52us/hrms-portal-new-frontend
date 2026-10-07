"use client";

import axios from "axios";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
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
import { FiPlus, FiSave, FiSend, FiXCircle } from "react-icons/fi";

type ProviderField = {
  key: string;
  label: string;
  required: boolean;
  maxLength: number;
  placeholder: string;
  helpText: string;
  transform?: "uppercase";
  defaultValue?: string;
  options?: Array<{ value: string; label: string }>;
};

type ProviderModule = { key: string; label: string; description: string };
type Provider = {
  key: string;
  implementationVersion: string;
  countryCode: string;
  countryName: string;
  label: string;
  description: string;
  fields: ProviderField[];
  modules: ProviderModule[];
};

type Version = {
  _id: string;
  versionNumber: number;
  status: "draft" | "published" | "cancelled";
  revision: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  providerImplementationVersion: string;
  enabledModules: string[];
  configuration: Record<string, string>;
  changeReason?: string;
  publishedAt?: string;
  cancelReason?: string;
};

type Profile = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  countryCode: string;
  providerKey: string;
  latestVersionNumber: number;
  latestPublishedVersion?: Version | null;
};

type Detail = { profile: Profile; versions: Version[]; draftVersion?: Version | null };
type Props = { companyId: string; canManage: boolean };

function message(error: any) {
  return error?.response?.data?.message || error?.response?.data?.error || "Request failed";
}

function effectiveDateDefault() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function displayDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Open ended";
}

export default function StatutoryProfilesWorkspace({ companyId, canManage }: Props) {
  const toast = useToast();
  const createDialog = useDisclosure();
  const publishDialog = useDisclosure();
  const cancelDialog = useDisclosure();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [providerKey, setProviderKey] = useState("");
  const [configuration, setConfiguration] = useState<Record<string, string>>({});
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [changeReason, setChangeReason] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(effectiveDateDefault());
  const [actionReason, setActionReason] = useState("");
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const subtle = useColorModeValue("gray.50", "whiteAlpha.50");

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.key === (detail?.profile.providerKey || providerKey)) || null,
    [detail?.profile.providerKey, providerKey, providers]
  );

  const applyDetail = useCallback((value: Detail | null) => {
    setDetail(value);
    const draft = value?.draftVersion;
    setConfiguration(draft?.configuration || {});
    setEnabledModules(draft?.enabledModules || []);
    setChangeReason(draft?.changeReason || "");
  }, []);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [{ data: providerResponse }, { data: profileResponse }] = await Promise.all([
        axios.get("/payroll/statutory/providers", { params: { companyId } }),
        axios.get("/payroll/statutory/profiles", { params: { companyId } }),
      ]);
      const nextProviders = providerResponse.data || [];
      const nextProfiles = profileResponse.data || [];
      setProviders(nextProviders);
      setProviderKey((value) => value || nextProviders[0]?.key || "");
      if (nextProfiles[0]?._id) {
        const { data } = await axios.get(`/payroll/statutory/profiles/${nextProfiles[0]._id}`, { params: { companyId } });
        applyDetail(data.data || null);
      } else {
        applyDetail(null);
      }
    } catch (error) {
      toast({ title: "Unable to load statutory profiles", description: message(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [applyDetail, companyId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetCreate = () => {
    const first = providers[0];
    setProviderKey(first?.key || "");
    setConfiguration({});
    setEnabledModules([]);
    setChangeReason("Initial statutory setup");
    createDialog.onOpen();
  };

  const updateField = (field: ProviderField, value: string) => {
    const normalized = field.transform === "uppercase" ? value.toUpperCase() : value;
    setConfiguration((current) => ({ ...current, [field.key]: normalized }));
  };

  const toggleModule = (moduleKey: string, checked: boolean) => {
    setEnabledModules((current) => checked
      ? Array.from(new Set([...current, moduleKey]))
      : current.filter((value) => value !== moduleKey));
  };

  const createProfile = async () => {
    if (!selectedProvider) return;
    setSaving(true);
    try {
      const { data } = await axios.post("/payroll/statutory/profiles", {
        companyId,
        name: `${selectedProvider.countryName} statutory profile`,
        code: `STATUTORY_${selectedProvider.countryCode}`,
        description: selectedProvider.description,
        providerKey: selectedProvider.key,
        configuration,
        enabledModules,
        changeReason: changeReason.trim(),
      });
      applyDetail(data.data || null);
      createDialog.onClose();
      toast({ title: data.message || "Statutory profile created", status: "success" });
    } catch (error) {
      toast({ title: "Unable to create statutory profile", description: message(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    const draft = detail?.draftVersion;
    if (!detail || !draft) return;
    setSaving(true);
    try {
      const { data } = await axios.patch(`/payroll/statutory/profiles/${detail.profile._id}/versions/${draft._id}`, {
        companyId,
        expectedRevision: draft.revision,
        configuration,
        enabledModules,
        changeReason: changeReason.trim(),
      });
      applyDetail(data.data || null);
      toast({ title: data.message || "Statutory profile draft saved", status: "success" });
    } catch (error) {
      toast({ title: "Unable to save statutory profile", description: message(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const createVersion = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const { data } = await axios.post(`/payroll/statutory/profiles/${detail.profile._id}/versions`, {
        companyId,
        changeReason: "Prepare the next statutory profile version",
      });
      applyDetail(data.data || null);
      toast({ title: data.message || "New statutory draft created", status: "success" });
    } catch (error) {
      toast({ title: "Unable to create statutory version", description: message(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const publishDraft = async () => {
    const draft = detail?.draftVersion;
    if (!detail || !draft) return;
    setSaving(true);
    try {
      const { data } = await axios.post(`/payroll/statutory/profiles/${detail.profile._id}/versions/${draft._id}/publish`, {
        companyId,
        expectedRevision: draft.revision,
        effectiveFrom,
        reason: actionReason.trim(),
      });
      applyDetail(data.data || null);
      publishDialog.onClose();
      toast({ title: data.message || "Statutory profile published", status: "success" });
    } catch (error) {
      toast({ title: "Unable to publish statutory profile", description: message(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const cancelDraft = async () => {
    const draft = detail?.draftVersion;
    if (!detail || !draft) return;
    setSaving(true);
    try {
      const { data } = await axios.post(`/payroll/statutory/profiles/${detail.profile._id}/versions/${draft._id}/cancel`, {
        companyId,
        expectedRevision: draft.revision,
        reason: actionReason.trim(),
      });
      applyDetail(data.data || null);
      cancelDialog.onClose();
      toast({ title: data.message || "Statutory profile draft cancelled", status: "success" });
    } catch (error) {
      toast({ title: "Unable to cancel statutory draft", description: message(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const openPublish = () => {
    setEffectiveFrom(effectiveDateDefault());
    setActionReason("");
    publishDialog.onOpen();
  };

  const openCancel = () => {
    setActionReason("");
    cancelDialog.onOpen();
  };

  const requiredFieldsComplete = Boolean(selectedProvider?.fields
    .filter((field) => field.required)
    .every((field) => String(configuration[field.key] || "").trim()));

  if (loading) return <Stack><Skeleton h="120px" /><Skeleton h="360px" /></Stack>;

  if (!detail) {
    return <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" py={16} px={6} textAlign="center">
      <Text fontSize="lg" fontWeight="800">No statutory profile configured</Text>
      <Text mt={2} fontSize="sm" color={muted}>Create the company-level country profile before statutory contribution calculations are enabled.</Text>
      {canManage ? <Button mt={5} leftIcon={<FiPlus />} colorScheme="blue" onClick={resetCreate}>Create statutory profile</Button> : null}
      <Modal isOpen={createDialog.isOpen} onClose={createDialog.onClose} size="2xl" scrollBehavior="inside"><ModalOverlay /><ModalContent><ModalHeader>Create statutory profile</ModalHeader><ModalCloseButton /><ModalBody><Stack spacing={5} textAlign="left">
        <FormControl isRequired><FormLabel>Country rules provider</FormLabel><Select value={providerKey} onChange={(event) => { setProviderKey(event.target.value); setConfiguration({}); setEnabledModules([]); }}><option value="">Select provider</option>{providers.map((provider) => <option key={provider.key} value={provider.key}>{provider.label}</option>)}</Select><FormHelperText>{selectedProvider?.description}</FormHelperText></FormControl>
        {selectedProvider ? <><SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>{selectedProvider.fields.map((field) => <FormControl key={field.key} isRequired={field.required}><FormLabel>{field.label}</FormLabel>{field.options?.length ? <Select value={configuration[field.key] ?? field.defaultValue ?? ""} onChange={(event) => updateField(field, event.target.value)}>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select> : <Input value={configuration[field.key] || ""} maxLength={field.maxLength} placeholder={field.placeholder} onChange={(event) => updateField(field, event.target.value)} />}<FormHelperText>{field.helpText}</FormHelperText></FormControl>)}</SimpleGrid>
        <Box><Text fontWeight="700">Enabled statutory modules</Text><SimpleGrid mt={3} columns={{ base: 1, md: 2 }} spacing={3}>{selectedProvider.modules.map((module) => <Checkbox key={module.key} isChecked={enabledModules.includes(module.key)} onChange={(event) => toggleModule(module.key, event.target.checked)}><Text fontWeight="600">{module.label}</Text><Text fontSize="xs" color={muted}>{module.description}</Text></Checkbox>)}</SimpleGrid></Box></> : null}
        <FormControl><FormLabel>Setup reason</FormLabel><Textarea value={changeReason} maxLength={500} onChange={(event) => setChangeReason(event.target.value)} /></FormControl>
      </Stack></ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={createDialog.onClose}>Cancel</Button><Button colorScheme="blue" isLoading={saving} isDisabled={!selectedProvider || !requiredFieldsComplete} onClick={() => void createProfile()}>Create draft</Button></ModalFooter></ModalContent></Modal>
    </Box>;
  }

  const draft = detail.draftVersion;
  const published = detail.versions.filter((version) => version.status === "published");

  return <Stack spacing={5}>
    <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={5}>
      <Stack direction={{ base: "column", md: "row" }} justify="space-between" spacing={4}>
        <Box><HStack><Text fontSize="lg" fontWeight="800">{detail.profile.name}</Text><Badge colorScheme="blue">{detail.profile.countryCode}</Badge></HStack><Text mt={1} fontSize="sm" color={muted}>{selectedProvider?.label} | Versioned company statutory configuration</Text></Box>
        {canManage && !draft ? <Button leftIcon={<FiPlus />} colorScheme="blue" isLoading={saving} onClick={() => void createVersion()}>New version</Button> : null}
      </Stack>
    </Box>

    {draft ? <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={{ base: 4, md: 6 }}>
      <Stack spacing={6}>
        <HStack justify="space-between"><Box><Text fontWeight="800">Draft version {draft.versionNumber}</Text><Text fontSize="sm" color={muted}>Provider implementation {draft.providerImplementationVersion}</Text></Box><Badge colorScheme="orange">Draft</Badge></HStack>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>{selectedProvider?.fields.map((field) => <FormControl key={field.key} isRequired={field.required}><FormLabel>{field.label}</FormLabel>{field.options?.length ? <Select value={configuration[field.key] ?? field.defaultValue ?? ""} isDisabled={!canManage} onChange={(event) => updateField(field, event.target.value)}>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select> : <Input value={configuration[field.key] || ""} maxLength={field.maxLength} placeholder={field.placeholder} isDisabled={!canManage} onChange={(event) => updateField(field, event.target.value)} />}<FormHelperText>{field.helpText}</FormHelperText></FormControl>)}</SimpleGrid>
        <Box><Text fontWeight="700">Enabled statutory modules</Text><SimpleGrid mt={3} columns={{ base: 1, md: 2 }} spacing={3}>{selectedProvider?.modules.map((module) => <Checkbox key={module.key} isChecked={enabledModules.includes(module.key)} isDisabled={!canManage} onChange={(event) => toggleModule(module.key, event.target.checked)}><Text fontWeight="600">{module.label}</Text><Text fontSize="xs" color={muted}>{module.description}</Text></Checkbox>)}</SimpleGrid></Box>
        <FormControl><FormLabel>Change reason</FormLabel><Textarea value={changeReason} maxLength={500} isDisabled={!canManage} placeholder="Why this statutory configuration is changing" onChange={(event) => setChangeReason(event.target.value)} /></FormControl>
        {canManage ? <HStack wrap="wrap"><Button leftIcon={<FiSave />} colorScheme="blue" variant="outline" isLoading={saving} isDisabled={!requiredFieldsComplete} onClick={() => void saveDraft()}>Save draft</Button><Button leftIcon={<FiSend />} colorScheme="green" isDisabled={!requiredFieldsComplete || enabledModules.length === 0} onClick={openPublish}>Publish</Button><Button leftIcon={<FiXCircle />} colorScheme="red" variant="ghost" onClick={openCancel}>Cancel draft</Button></HStack> : null}
      </Stack>
    </Box> : <Alert status="info" borderRadius="md"><AlertIcon /><AlertDescription>No editable draft exists. Published versions remain immutable except for their derived effective end date.</AlertDescription></Alert>}

    <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
      <Box p={4}><Text fontWeight="800">Version history</Text><Text fontSize="sm" color={muted}>Payroll runs snapshot the version effective on their cycle end date.</Text></Box>
      <TableContainer><Table size="sm"><Thead bg={subtle}><Tr><Th>Version</Th><Th>Status</Th><Th>Effective range</Th><Th>Provider</Th><Th>Modules</Th><Th>Reason</Th></Tr></Thead><Tbody>{detail.versions.map((version) => <Tr key={version._id}><Td fontWeight="700">v{version.versionNumber}</Td><Td><Badge colorScheme={version.status === "published" ? "green" : version.status === "draft" ? "orange" : "gray"}>{version.status}</Badge></Td><Td>{version.status === "published" ? `${displayDate(version.effectiveFrom)} to ${displayDate(version.effectiveTo)}` : "-"}</Td><Td>{version.providerImplementationVersion}</Td><Td>{version.enabledModules.length || 0}</Td><Td maxW="320px" whiteSpace="normal">{version.cancelReason || version.changeReason || "-"}</Td></Tr>)}</Tbody></Table></TableContainer>
      {published.length === 0 ? <Text p={4} color={muted}>Publish the first version before new payroll runs can snapshot statutory configuration.</Text> : null}
    </Box>

    <Modal isOpen={publishDialog.isOpen} onClose={publishDialog.onClose} isCentered><ModalOverlay /><ModalContent><ModalHeader>Publish statutory profile</ModalHeader><ModalCloseButton /><ModalBody><Stack spacing={4}><Alert status="info"><AlertIcon /><AlertDescription>New payroll runs whose cycle ends on or after this date will snapshot this version.</AlertDescription></Alert><FormControl isRequired><FormLabel>Effective from</FormLabel><Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></FormControl><FormControl isRequired><FormLabel>Publication reason</FormLabel><Textarea value={actionReason} maxLength={500} onChange={(event) => setActionReason(event.target.value)} /></FormControl></Stack></ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={publishDialog.onClose}>Cancel</Button><Button colorScheme="green" isLoading={saving} isDisabled={!effectiveFrom || actionReason.trim().length < 3} onClick={() => void publishDraft()}>Publish version</Button></ModalFooter></ModalContent></Modal>
    <Modal isOpen={cancelDialog.isOpen} onClose={cancelDialog.onClose} isCentered><ModalOverlay /><ModalContent><ModalHeader>Cancel statutory draft</ModalHeader><ModalCloseButton /><ModalBody><FormControl isRequired><FormLabel>Cancellation reason</FormLabel><Textarea value={actionReason} maxLength={500} onChange={(event) => setActionReason(event.target.value)} /></FormControl></ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={cancelDialog.onClose}>Keep draft</Button><Button colorScheme="red" isLoading={saving} isDisabled={actionReason.trim().length < 3} onClick={() => void cancelDraft()}>Cancel draft</Button></ModalFooter></ModalContent></Modal>
  </Stack>;
}
