"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import {
  approvalWorkflowSupportsRequestType,
  AttendanceRegularizationType,
  AttendanceRules,
  PolicyVersion,
  WorkforcePolicyItem,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";

const DEFAULT_RULES: AttendanceRules = {
  gracePeriodMinutesLate: 0,
  gracePeriodMinutesEarly: 0,
  minimumFullDayMinutes: 480,
  minimumHalfDayMinutes: 240,
  requirePunchOut: true,
  missingPunchTreatment: "flag_incomplete",
  overtimeEnabled: false,
  overtimeStartsAfterMinutes: 0,
  overtimeApproval: {
    required: false,
    approvalWorkflow: null,
    approvalWorkflowVersion: null,
    approvalWorkflowVersionNumber: null,
  },
  officeGeofence: {
    enabled: false,
    radiusMeters: 200,
    validateOn: "punch_in",
    unavailableAction: "block",
  },
  punchNetwork: {
    enabled: false,
    allowedNetworks: [],
    scope: "office_only",
  },
  trustedDevice: {
    enabled: false,
    scope: "all_punches",
  },
  autoFinalize: {
    enabled: false,
    graceMinutes: 1440,
    mode: "clean_only",
  },
  regularization: {
    enabled: false,
    allowedTypes: [
      "missing_punch_in",
      "missing_punch_out",
      "time_correction",
      "work_mode_correction",
      "full_day_correction",
    ],
    requestStartDays: 0,
    maxBackdateDays: 30,
    monthlyRequestLimit: 3,
    minimumReasonLength: 10,
    documentMode: "none",
    approvalWorkflow: null,
    approvalWorkflowVersion: null,
    approvalWorkflowVersionNumber: null,
  },
};

const REGULARIZATION_TYPES: Array<{ value: AttendanceRegularizationType; label: string }> = [
  { value: "missing_punch_in", label: "Missing punch-in" },
  { value: "missing_punch_out", label: "Missing punch-out" },
  { value: "time_correction", label: "Correct punch times" },
  { value: "work_mode_correction", label: "Correct work mode" },
  { value: "full_day_correction", label: "Add full-day attendance" },
];

type AttendanceDrawerMode = "create" | "edit_draft" | "new_version";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  mode: AttendanceDrawerMode;
  resource?: WorkforcePolicyItem | null;
  version?: PolicyVersion | null;
  onSaved: () => Promise<void> | void;
};

function dateValue(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function parseAllowedNetworks(value: string) {
  return Array.from(new Set(
    value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  ));
}

export default function AttendancePolicyDrawer({
  isOpen,
  onClose,
  companyId,
  mode,
  resource,
  version,
  onSaved,
}: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [rules, setRules] = useState<AttendanceRules>(DEFAULT_RULES);
  const [allowedNetworksText, setAllowedNetworksText] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const sourceRules = (version?.rules ||
      resource?.latestPublishedVersion?.rules ||
      DEFAULT_RULES) as AttendanceRules;
    setName(resource?.name || "");
    setCode(resource?.code || "");
    setDescription(resource?.description || "");
    setEffectiveFrom(mode === "new_version" ? "" : dateValue(version?.effectiveFrom));
    setChangeReason(
      mode === "create"
        ? "Initial policy configuration"
        : mode === "new_version"
          ? ""
          : version?.changeReason || ""
    );
    setAllowedNetworksText(
      (sourceRules?.punchNetwork?.allowedNetworks || DEFAULT_RULES.punchNetwork.allowedNetworks).join("\n")
    );
    setRules({
      ...DEFAULT_RULES,
      ...sourceRules,
      autoFinalize: {
        ...DEFAULT_RULES.autoFinalize,
        ...(sourceRules?.autoFinalize || {}),
      },
      overtimeApproval: {
        ...DEFAULT_RULES.overtimeApproval,
        ...(sourceRules?.overtimeApproval || {}),
      },
      officeGeofence: {
        ...DEFAULT_RULES.officeGeofence,
        ...(sourceRules?.officeGeofence || {}),
      },
      punchNetwork: {
        ...DEFAULT_RULES.punchNetwork,
        ...(sourceRules?.punchNetwork || {}),
      },
      trustedDevice: {
        ...DEFAULT_RULES.trustedDevice,
        ...(sourceRules?.trustedDevice || {}),
      },
      regularization: {
        ...DEFAULT_RULES.regularization,
        ...(sourceRules?.regularization || {}),
      },
    });
  }, [isOpen, mode, resource, version]);

  const allowedNetworks = useMemo(
    () => parseAllowedNetworks(allowedNetworksText),
    [allowedNetworksText]
  );

  const validationError = useMemo(() => {
    if (mode === "create" && (!name.trim() || !code.trim())) {
      return "Policy name and code are required.";
    }
    if (!effectiveFrom) return "Effective-from date is required before publishing.";
    if (Number(rules.minimumHalfDayMinutes) >= Number(rules.minimumFullDayMinutes)) {
      return "Half-day minutes must be less than full-day minutes.";
    }
    if (mode !== "create" && changeReason.trim().length < 3) {
      return "Describe why this version is changing.";
    }
    if (rules.regularization.enabled && !rules.regularization.allowedTypes.length) {
      return "Select at least one attendance correction type.";
    }
    if (rules.regularization.enabled && !rules.regularization.approvalWorkflowVersion) {
      return "Select a published approval workflow for attendance corrections.";
    }
    if (rules.overtimeApproval.required && !rules.overtimeEnabled) {
      return "Enable overtime calculation before requiring overtime approval.";
    }
    if (rules.overtimeApproval.required && !rules.overtimeApproval.approvalWorkflowVersion) {
      return "Select a published approval workflow for overtime reviews.";
    }
    if (rules.punchNetwork.enabled && !allowedNetworks.length) {
      return "Add at least one allowed IP address or CIDR for punch network restriction.";
    }
    return "";
  }, [allowedNetworks.length, changeReason, code, effectiveFrom, mode, name, rules]);

  const setRule = (key: keyof AttendanceRules, value: any) => {
    setRules((current) => ({ ...current, [key]: value }));
  };

  const setRegularizationRule = (key: keyof AttendanceRules["regularization"], value: any) => {
    setRules((current) => ({
      ...current,
      regularization: { ...current.regularization, [key]: value },
    }));
  };

  const setOvertimeApprovalRule = (key: keyof AttendanceRules["overtimeApproval"], value: any) => {
    setRules((current) => ({
      ...current,
      overtimeApproval: { ...current.overtimeApproval, [key]: value },
    }));
  };

  const setOfficeGeofenceRule = (key: keyof AttendanceRules["officeGeofence"], value: any) => {
    setRules((current) => ({
      ...current,
      officeGeofence: { ...current.officeGeofence, [key]: value },
    }));
  };

  const setPunchNetworkRule = (key: keyof AttendanceRules["punchNetwork"], value: any) => {
    setRules((current) => ({
      ...current,
      punchNetwork: { ...current.punchNetwork, [key]: value },
    }));
  };

  const setTrustedDeviceRule = (key: keyof AttendanceRules["trustedDevice"], value: any) => {
    setRules((current) => ({
      ...current,
      trustedDevice: { ...current.trustedDevice, [key]: value },
    }));
  };

  const toggleRegularizationType = (value: AttendanceRegularizationType, checked: boolean) => {
    setRules((current) => ({
      ...current,
      regularization: {
        ...current.regularization,
        allowedTypes: checked
          ? Array.from(new Set([...current.regularization.allowedTypes, value]))
          : current.regularization.allowedTypes.filter((item) => item !== value),
      },
    }));
  };

  const regularizationWorkflows = workforcePolicyStore.approvalWorkflows.filter((workflow) =>
    approvalWorkflowSupportsRequestType(workflow, "attendance_regularization_request")
  );
  const overtimeWorkflows = workforcePolicyStore.approvalWorkflows.filter((workflow) =>
    approvalWorkflowSupportsRequestType(workflow, "attendance_overtime_review")
  );

  const selectRegularizationWorkflow = (workflowId: string) => {
    const workflow = regularizationWorkflows.find((item) => item._id === workflowId);
    const version = workflow?.effectivePublishedVersion || workflow?.latestPublishedVersion;
    setRules((current) => ({
      ...current,
      regularization: {
        ...current.regularization,
        approvalWorkflow: workflow?._id || null,
        approvalWorkflowVersion: version?._id || null,
        approvalWorkflowVersionNumber: version?.versionNumber || null,
      },
    }));
  };

  const selectOvertimeWorkflow = (workflowId: string) => {
    const workflow = overtimeWorkflows.find((item) => item._id === workflowId);
    const version = workflow?.effectivePublishedVersion || workflow?.latestPublishedVersion;
    setRules((current) => ({
      ...current,
      overtimeApproval: {
        ...current.overtimeApproval,
        approvalWorkflow: workflow?._id || null,
        approvalWorkflowVersion: version?._id || null,
        approvalWorkflowVersionNumber: version?.versionNumber || null,
      },
    }));
  };

  const save = async (publish: boolean) => {
    if (validationError) {
      toast({ title: validationError, status: "warning", duration: 3500 });
      return;
    }

    try {
      const payload = {
        companyId,
        effectiveFrom,
        changeReason: changeReason.trim(),
        rules: {
          ...rules,
          punchNetwork: {
            ...rules.punchNetwork,
            allowedNetworks,
          },
        },
      };
      let policyId = resource?._id || "";
      let versionId = version?._id || "";

      if (mode === "create") {
        const created = await workforcePolicyStore.createAttendancePolicy({
          ...payload,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
        });
        policyId = created?.data?.policy?._id;
        versionId = created?.data?.version?._id;
      } else if (mode === "new_version") {
        const created = await workforcePolicyStore.createAttendanceVersion(policyId, payload);
        versionId = created?.data?._id;
      } else {
        await workforcePolicyStore.updateAttendanceDraft(policyId, versionId, payload);
      }

      if (publish) {
        await workforcePolicyStore.publishAttendanceVersion(policyId, versionId, {
          companyId,
          effectiveFrom,
          changeReason: changeReason.trim(),
        });
      }
      await onSaved();
      toast({
        title: publish ? "Attendance policy published" : "Attendance policy draft saved",
        status: "success",
        duration: 3000,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: error?.message || "Could not save attendance policy",
        status: "error",
        duration: 5000,
      });
    }
  };

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.900");

  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      titlePrefix={mode === "create" ? "New" : mode === "new_version" ? "New version of" : "Edit"}
      titleSuffix={mode === "create" ? "attendance policy" : `${resource?.name || "policy"}${mode === 'edit_draft' ? ' draft' : ''}`}
      subtitle="Published versions preserve the attendance-evaluation rules used for historical records."
      maxW={{ base: "100%", md: "70%" }}
      footerContent={
        <Flex w="full" justify="flex-end" gap={3}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={() => save(false)} isLoading={workforcePolicyStore.submitting}>Save draft</Button>
          <Button colorScheme="blue" onClick={() => save(true)} isLoading={workforcePolicyStore.submitting} isDisabled={Boolean(validationError)}>Save and publish</Button>
        </Flex>
      }
    >
      <Stack spacing={6}>
        {mode !== "create" ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <AlertDescription fontSize="sm">
              This draft will become version {version?.versionNumber || (resource?.latestVersionNumber || 0) + 1}.
            </AlertDescription>
          </Alert>
        ) : null}

        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5} shadow="sm">
          <Text mb={4} fontSize="sm" fontWeight="800" color="blue.600" textTransform="uppercase" letterSpacing="wide">Policy identity</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <FormControl isRequired isDisabled={mode !== "create"}>
              <FormLabel fontSize="sm" fontWeight="600">Name</FormLabel>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="General attendance policy" bg={inputBg} />
            </FormControl>
            <FormControl isRequired isDisabled={mode !== "create"}>
              <FormLabel fontSize="sm" fontWeight="600">Code</FormLabel>
              <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="ATT-GENERAL" bg={inputBg} />
            </FormControl>
          </SimpleGrid>
          {mode === "create" ? (
            <FormControl mt={5}>
              <FormLabel fontSize="sm" fontWeight="600">Description</FormLabel>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} bg={inputBg} />
            </FormControl>
          ) : null}
        </Box>

        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5} shadow="sm">
          <Text fontSize="sm" fontWeight="800" color="blue.600" textTransform="uppercase" letterSpacing="wide">Punch access controls</Text>
          <Text mt={1} fontSize="sm" color="gray.500">Optionally restrict attendance punches to approved networks and browsers.</Text>
          <Stack mt={5} spacing={6}>
            <Box>
              <HStack justify="space-between" align="start">
                <Box>
                  <Text fontSize="sm" fontWeight="700">Allowed office networks</Text>
                  <Text fontSize="xs" color="gray.500">Accepts individual IPv4/IPv6 addresses and CIDR ranges.</Text>
                </Box>
                <Switch
                  aria-label="Restrict punches to allowed networks"
                  isChecked={rules.punchNetwork.enabled}
                  onChange={(event) => setPunchNetworkRule("enabled", event.target.checked)}
                  colorScheme="blue"
                />
              </HStack>
              {rules.punchNetwork.enabled ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mt={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600">Allowed IP addresses or CIDRs</FormLabel>
                    <Textarea
                      value={allowedNetworksText}
                      onChange={(event) => setAllowedNetworksText(event.target.value)}
                      placeholder={"203.0.113.10\n10.20.0.0/16"}
                      rows={3}
                      bg={inputBg}
                    />
                    <FormHelperText>Enter one IP or CIDR per line. Commas also work. Use the address visible to this server.</FormHelperText>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600">Network restriction applies to</FormLabel>
                    <Select value={rules.punchNetwork.scope} onChange={(event) => setPunchNetworkRule("scope", event.target.value)} bg={inputBg}>
                      <option value="office_only">Office punches only</option>
                      <option value="all_punches">All punches, including WFH</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
              ) : null}
            </Box>

            <Box pt={5} borderTopWidth="1px" borderColor={borderColor}>
              <HStack justify="space-between" align="start">
                <Box>
                  <Text fontSize="sm" fontWeight="700">Require a trusted browser</Text>
                  <Text fontSize="xs" color="gray.500">Employees register a browser; HR/Admin must trust it before punches are accepted.</Text>
                </Box>
                <Switch
                  aria-label="Require a trusted attendance browser"
                  isChecked={rules.trustedDevice.enabled}
                  onChange={(event) => setTrustedDeviceRule("enabled", event.target.checked)}
                  colorScheme="blue"
                />
              </HStack>
              {rules.trustedDevice.enabled ? (
                <FormControl mt={4} maxW={{ md: "50%" }}>
                  <FormLabel fontSize="sm" fontWeight="600">Trusted browser applies to</FormLabel>
                  <Select value={rules.trustedDevice.scope} onChange={(event) => setTrustedDeviceRule("scope", event.target.value)} bg={inputBg}>
                    <option value="all_punches">All punches, including WFH</option>
                    <option value="office_only">Office punches only</option>
                  </Select>
                  <FormHelperText>The identifier is hashed on the server. It is not hardware attestation.</FormHelperText>
                </FormControl>
              ) : null}
            </Box>
          </Stack>
        </Box>

        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5} shadow="sm">
          <HStack justify="space-between" align="start">
            <Box>
              <Text fontSize="sm" fontWeight="800" color="blue.600" textTransform="uppercase" letterSpacing="wide">Office geofence</Text>
              <Text mt={1} fontSize="sm" color="gray.500">Validate browser punches against the employee&apos;s assigned office coordinates.</Text>
            </Box>
            <Switch
              aria-label="Enable office geofence"
              isChecked={rules.officeGeofence.enabled}
              onChange={(event) => setOfficeGeofenceRule("enabled", event.target.checked)}
              colorScheme="blue"
            />
          </HStack>
          {rules.officeGeofence.enabled ? (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mt={5}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="600">Allowed distance from office</FormLabel>
                <NumberInput
                  min={50}
                  max={10000}
                  value={rules.officeGeofence.radiusMeters}
                  onChange={(_, value) => setOfficeGeofenceRule("radiusMeters", Number.isFinite(value) ? value : 200)}
                >
                  <NumberInputField bg={inputBg} />
                </NumberInput>
                <FormHelperText>Radius in meters. Each office must have latitude and longitude.</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">Validate location on</FormLabel>
                <Select value={rules.officeGeofence.validateOn} onChange={(event) => setOfficeGeofenceRule("validateOn", event.target.value)} bg={inputBg}>
                  <option value="punch_in">Punch-in only</option>
                  <option value="punch_in_and_out">Punch-in and punch-out</option>
                </Select>
                <FormHelperText>Punch-in only avoids blocking punch-out if location access is later unavailable.</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">If browser location is unavailable</FormLabel>
                <Select value={rules.officeGeofence.unavailableAction} onChange={(event) => setOfficeGeofenceRule("unavailableAction", event.target.value)} bg={inputBg}>
                  <option value="block">Block the punch</option>
                  <option value="allow">Allow and record as unavailable</option>
                </Select>
                <FormHelperText>Approved WFH punches bypass the office geofence.</FormHelperText>
              </FormControl>
            </SimpleGrid>
          ) : null}
        </Box>

        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5} shadow="sm">
          <HStack justify="space-between" align="start">
            <Box>
              <Text fontSize="sm" fontWeight="800" color="blue.600" textTransform="uppercase" letterSpacing="wide">Daily finalization</Text>
              <Text mt={1} fontSize="sm" color="gray.500">Automatically lock calculated attendance after the review window.</Text>
            </Box>
            <Switch
              aria-label="Enable daily attendance auto-finalization"
              isChecked={rules.autoFinalize.enabled}
              onChange={(event) => setRule("autoFinalize", { ...rules.autoFinalize, enabled: event.target.checked })}
              colorScheme="blue"
            />
          </HStack>
          {rules.autoFinalize.enabled ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mt={5}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">Finalize after shift closes</FormLabel>
                <NumberInput
                  min={0}
                  max={48}
                  step={1}
                  value={Number(rules.autoFinalize.graceMinutes || 0) / 60}
                  onChange={(_, value) => setRule("autoFinalize", {
                    ...rules.autoFinalize,
                    graceMinutes: Number.isFinite(value) ? Math.round(value * 60) : 0,
                  })}
                >
                  <NumberInputField bg={inputBg} />
                </NumberInput>
                <FormHelperText>Hours available for HR review before locking. Use 0 for immediate finalization.</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">Records to finalize</FormLabel>
                <Select
                  value={rules.autoFinalize.mode}
                  onChange={(event) => setRule("autoFinalize", {
                    ...rules.autoFinalize,
                    mode: event.target.value as AttendanceRules["autoFinalize"]["mode"],
                  })}
                  bg={inputBg}
                >
                  <option value="clean_only">Clean days only</option>
                  <option value="all_calculated">All calculated days</option>
                </Select>
                <FormHelperText>
                  Clean days excludes absent, incomplete, and half-day records so HR can review them manually.
                </FormHelperText>
              </FormControl>
            </SimpleGrid>
          ) : null}
        </Box>

        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5} shadow="sm">
          <HStack justify="space-between" align="start">
            <Box>
              <Text fontSize="sm" fontWeight="800" color="blue.600" textTransform="uppercase" letterSpacing="wide">Attendance corrections</Text>
              <Text mt={1} fontSize="sm" color="gray.500">Control when employees can correct historical attendance and who approves it.</Text>
            </Box>
            <Switch
              aria-label="Enable attendance regularization"
              isChecked={rules.regularization.enabled}
              onChange={(event) => setRegularizationRule("enabled", event.target.checked)}
              colorScheme="blue"
            />
          </HStack>
          {rules.regularization.enabled ? (
            <Stack mt={5} spacing={5}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="600">Allowed correction types</FormLabel>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  {REGULARIZATION_TYPES.map((item) => (
                    <Checkbox
                      key={item.value}
                      id={`attendance-regularization-${item.value}`}
                      isChecked={rules.regularization.allowedTypes.includes(item.value)}
                      onChange={(event) => toggleRegularizationType(item.value, event.target.checked)}
                    >
                      {item.label}
                    </Checkbox>
                  ))}
                </SimpleGrid>
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">Request after day closes</FormLabel>
                  <NumberInput min={0} max={365} value={rules.regularization.requestStartDays} onChange={(_, value) => setRegularizationRule("requestStartDays", value || 0)}><NumberInputField bg={inputBg} /></NumberInput>
                  <FormHelperText>0 allows same-day requests.</FormHelperText>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">Maximum past days</FormLabel>
                  <NumberInput min={1} max={365} value={rules.regularization.maxBackdateDays} onChange={(_, value) => setRegularizationRule("maxBackdateDays", value || 1)}><NumberInputField bg={inputBg} /></NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">Requests per month</FormLabel>
                  <NumberInput min={0} max={100} value={rules.regularization.monthlyRequestLimit} onChange={(_, value) => setRegularizationRule("monthlyRequestLimit", value || 0)}><NumberInputField bg={inputBg} /></NumberInput>
                  <FormHelperText>0 means no monthly limit.</FormHelperText>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">Minimum reason length</FormLabel>
                  <NumberInput min={3} max={500} value={rules.regularization.minimumReasonLength} onChange={(_, value) => setRegularizationRule("minimumReasonLength", value || 3)}><NumberInputField bg={inputBg} /></NumberInput>
                </FormControl>
              </SimpleGrid>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">Supporting document</FormLabel>
                  <Select value={rules.regularization.documentMode} onChange={(event) => setRegularizationRule("documentMode", event.target.value)} bg={inputBg}>
                    <option value="none">Not shown</option>
                    <option value="optional">Optional</option>
                    <option value="required">Required with request</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600">Approval workflow</FormLabel>
                  <Select value={String(rules.regularization.approvalWorkflow || "")} onChange={(event) => selectRegularizationWorkflow(event.target.value)} bg={inputBg}>
                    <option value="">Select published workflow</option>
                    {regularizationWorkflows.map((workflow) => {
                      const published = workflow.effectivePublishedVersion || workflow.latestPublishedVersion;
                      return <option key={workflow._id} value={workflow._id}>{workflow.name} (v{published?.versionNumber})</option>;
                    })}
                  </Select>
                  {!regularizationWorkflows.length ? <FormHelperText>Create and publish an approval workflow enabled for Attendance corrections first.</FormHelperText> : null}
                </FormControl>
              </SimpleGrid>
            </Stack>
          ) : null}
        </Box>

        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5} shadow="sm">
          <Text mb={4} fontSize="sm" fontWeight="800" color="blue.600" textTransform="uppercase" letterSpacing="wide">Validity</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600">Effective from</FormLabel>
              <Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} bg={inputBg} />
            </FormControl>
          </SimpleGrid>
        </Box>

        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5} shadow="sm">
          <Text mb={4} fontSize="sm" fontWeight="800" color="blue.600" textTransform="uppercase" letterSpacing="wide">Attendance thresholds</Text>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={5}>
            <FormControl><FormLabel fontSize="sm" fontWeight="600">Late grace (minutes)</FormLabel><NumberInput min={0} value={rules.gracePeriodMinutesLate} onChange={(_, value) => setRule("gracePeriodMinutesLate", value || 0)}><NumberInputField bg={inputBg} /></NumberInput></FormControl>
            <FormControl><FormLabel fontSize="sm" fontWeight="600">Early-exit grace</FormLabel><NumberInput min={0} value={rules.gracePeriodMinutesEarly} onChange={(_, value) => setRule("gracePeriodMinutesEarly", value || 0)}><NumberInputField bg={inputBg} /></NumberInput></FormControl>
            <FormControl><FormLabel fontSize="sm" fontWeight="600">Full-day minutes</FormLabel><NumberInput min={1} value={rules.minimumFullDayMinutes} onChange={(_, value) => setRule("minimumFullDayMinutes", value || 0)}><NumberInputField bg={inputBg} /></NumberInput></FormControl>
            <FormControl><FormLabel fontSize="sm" fontWeight="600">Half-day minutes</FormLabel><NumberInput min={1} value={rules.minimumHalfDayMinutes} onChange={(_, value) => setRule("minimumHalfDayMinutes", value || 0)}><NumberInputField bg={inputBg} /></NumberInput></FormControl>
          </SimpleGrid>
        </Box>

        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5} shadow="sm">
          <Text mb={4} fontSize="sm" fontWeight="800" color="blue.600" textTransform="uppercase" letterSpacing="wide">Punch evaluation</Text>
          <Stack spacing={4}>
            <HStack justify="space-between"><Text fontSize="sm" fontWeight="600">Require punch-out</Text><Switch isChecked={rules.requirePunchOut} onChange={(event) => setRule("requirePunchOut", event.target.checked)} colorScheme="blue" /></HStack>
            <FormControl mt={2}>
              <FormLabel fontSize="sm" fontWeight="600">Missing punch treatment</FormLabel>
              <Select value={rules.missingPunchTreatment} onChange={(event) => setRule("missingPunchTreatment", event.target.value)} bg={inputBg}>
                <option value="flag_incomplete">Flag for regularization</option>
                <option value="half_day">Mark half day</option>
                <option value="absent">Mark absent</option>
              </Select>
            </FormControl>
            <HStack justify="space-between" mt={2}><Text fontSize="sm" fontWeight="600">Calculate overtime</Text><Switch isChecked={rules.overtimeEnabled} onChange={(event) => setRules((current) => ({ ...current, overtimeEnabled: event.target.checked, overtimeApproval: event.target.checked ? current.overtimeApproval : { ...current.overtimeApproval, required: false } }))} colorScheme="blue" /></HStack>
            {rules.overtimeEnabled ? (
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">Overtime starts after worked minutes</FormLabel>
                  <NumberInput min={0} value={rules.overtimeStartsAfterMinutes} onChange={(_, value) => setRule("overtimeStartsAfterMinutes", value || 0)}><NumberInputField bg={inputBg} /></NumberInput>
                </FormControl>
                <HStack justify="space-between" align="start">
                  <Box>
                    <Text fontSize="sm" fontWeight="600">Require overtime approval</Text>
                    <Text fontSize="xs" color="gray.500">Approved overtime is required before payroll or comp-off can use it. Off-day work reviews the full worked time.</Text>
                  </Box>
                  <Switch
                    aria-label="Require overtime approval"
                    isChecked={rules.overtimeApproval.required}
                    onChange={(event) => setOvertimeApprovalRule("required", event.target.checked)}
                    colorScheme="blue"
                  />
                </HStack>
                {rules.overtimeApproval.required ? (
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600">Overtime approval workflow</FormLabel>
                    <Select value={String(rules.overtimeApproval.approvalWorkflow || "")} onChange={(event) => selectOvertimeWorkflow(event.target.value)} bg={inputBg}>
                      <option value="">Select published workflow</option>
                      {overtimeWorkflows.map((workflow) => {
                        const published = workflow.effectivePublishedVersion || workflow.latestPublishedVersion;
                        return <option key={workflow._id} value={workflow._id}>{workflow.name} (v{published?.versionNumber})</option>;
                      })}
                    </Select>
                    {!overtimeWorkflows.length ? <FormHelperText>Create and publish an approval workflow enabled for Overtime reviews first.</FormHelperText> : null}
                  </FormControl>
                ) : null}
              </Stack>
            ) : null}
          </Stack>
        </Box>

        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={5} shadow="sm">
          <FormControl isRequired={mode !== "create"}>
            <FormLabel fontSize="sm" fontWeight="600">Change reason</FormLabel>
            <Textarea value={changeReason} onChange={(event) => setChangeReason(event.target.value)} rows={2} placeholder="Why these rules are effective from this date" bg={inputBg} />
          </FormControl>
        </Box>
      </Stack>
    </DashboardDrawer>
  );
}
