"use client";

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Divider,
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
  Stack,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import {
  LeaveCreditComponent,
  LeavePolicyRule,
  LeaveTypeItem,
  PolicyVersion,
  WorkforcePolicyItem,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";

type EditorMode = "create" | "edit_draft" | "new_version";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  mode: EditorMode;
  resource?: WorkforcePolicyItem | null;
  version?: PolicyVersion | null;
  leaveTypes: LeaveTypeItem[];
  onSaved: () => Promise<void> | void;
  onPublished?: (policyId: string) => void;
};

function localDateValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calculateAccrualAmount(
  annualEntitlement: number,
  frequency: LeavePolicyRule["accrualFrequency"]
) {
  const periods = frequency === "monthly" ? 12 : frequency === "quarterly" ? 4 : 1;
  if (frequency === "none" || annualEntitlement <= 0) return 0;
  return Math.round((annualEntitlement / periods) * 10000) / 10000;
}

function createCreditComponentId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `credit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function scheduledAnnualCredit(components: LeaveCreditComponent[]) {
  return Math.round(
    (components.reduce((total, component) => {
      const periods = component.frequency === "monthly" ? 12 : component.frequency === "quarterly" ? 4 : 1;
      return total + component.amount * periods;
    }, 0) + Number.EPSILON) * 10000
  ) / 10000;
}

function componentSummary(component: LeaveCreditComponent) {
  const amount = formatCreditNumber(component.amount);
  if (component.frequency === "monthly") return `${amount}/month`;
  if (component.frequency === "quarterly") return `${amount}/quarter`;
  return component.upfrontTiming === "first_eligibility"
    ? `${amount} once when first eligible`
    : `${amount} at leave-year start`;
}

function formatCreditNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 4 }).format(value);
}

function leaveUnitLabel(unit: LeaveTypeItem["unit"] | undefined, value: number) {
  if (unit === "hours") return value === 1 ? "hour" : "hours";
  return value === 1 ? "day" : "days";
}

function OptionalPositiveNumberInput({
  value,
  onValueChange,
  min = 0.25,
  max,
  step = 0.25,
  placeholder,
  isDisabled = false,
}: {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder: string;
  isDisabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState(value > 0 ? String(value) : "");

  useEffect(() => {
    setInputValue(value > 0 ? String(value) : "");
  }, [value]);

  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      value={inputValue}
      placeholder={placeholder}
      isDisabled={isDisabled}
      onChange={(event) => {
        const nextValue = event.target.value;
        setInputValue(nextValue);
        if (!nextValue) {
          onValueChange(0);
          return;
        }
        const parsedValue = Number(nextValue);
        if (Number.isFinite(parsedValue) && parsedValue >= 0) onValueChange(parsedValue);
      }}
      onBlur={() => {
        const parsedValue = Number(inputValue);
        if (!inputValue || !Number.isFinite(parsedValue) || parsedValue <= 0) {
          setInputValue("");
          onValueChange(0);
          return;
        }
        setInputValue(String(parsedValue));
      }}
    />
  );
}

function accrualSummary(rule: LeavePolicyRule, leaveType?: LeaveTypeItem) {
  if (leaveType?.balanceTracked === false || rule.balanceTracked === false) {
    return "Balance is not tracked";
  }
  const unit = leaveType?.unit;
  const entitlement = `${formatCreditNumber(rule.annualEntitlement)} ${leaveUnitLabel(unit, rule.annualEntitlement)}/year`;
  if (rule.creditComponents.length) {
    return `${entitlement} / ${rule.creditComponents.map(componentSummary).join(" + ")}`;
  }
  const creditAmount = calculateAccrualAmount(rule.annualEntitlement, rule.accrualFrequency);
  if (rule.accrualFrequency === "monthly") {
    return `${entitlement} / ${formatCreditNumber(creditAmount)} ${leaveUnitLabel(unit, creditAmount)}/month`;
  }
  if (rule.accrualFrequency === "quarterly") {
    return `${entitlement} / ${formatCreditNumber(creditAmount)} ${leaveUnitLabel(unit, creditAmount)}/quarter`;
  }
  if (rule.accrualFrequency === "upfront") return `${entitlement} / credited upfront`;
  return `${entitlement} / no automatic credit`;
}

function emptyRule(leaveType: LeaveTypeItem): LeavePolicyRule {
  return {
    leaveType: leaveType._id,
    leaveTypeCodeSnapshot: leaveType.code,
    leaveTypeNameSnapshot: leaveType.name,
    paid: leaveType.paid,
    balanceTracked: leaveType.balanceTracked,
    annualEntitlement: 0,
    accrualFrequency: leaveType.balanceTracked ? "upfront" : "none",
    accrualAmount: 0,
    creditComponents: leaveType.balanceTracked
      ? [{
          componentId: createCreditComponentId(),
          frequency: "upfront",
          amount: 0,
          upfrontTiming: "leave_year_start",
          prorateOnJoining: true,
          prorateOnExit: true,
        }]
      : [],
    prorateOnJoining: true,
    prorateOnExit: true,
    carryForwardEnabled: false,
    maxCarryForward: 0,
    carryForwardExpiryMonths: 0,
    encashmentEnabled: false,
    maxEncashmentPerYear: 0,
    negativeBalanceAllowed: false,
    maxNegativeBalance: 0,
    allowHalfDay: leaveType.unit === "days" && leaveType.allowHalfDay,
    minimumRequestDays:
      leaveType.unit === "hours" ? 0.25 : leaveType.allowHalfDay ? 0.5 : 1,
    maximumRequestDays: null,
    minimumNoticeDays: 0,
    documentRequiredAfterDays: null,
    probationEligibility: "allowed",
    sandwichRuleEnabled: false,
  };
}

function normalizeSourceRule(rule: any): LeavePolicyRule {
  const storedAnnualEntitlement = Number(rule.annualEntitlement || 0);
  const storedAccrualFrequency = rule.accrualFrequency || "upfront";
  const storedComponents = Array.isArray(rule.creditComponents) ? rule.creditComponents : [];
  const creditComponents: LeaveCreditComponent[] = storedComponents.length
    ? storedComponents.map((component: any) => ({
        componentId: String(component.componentId || createCreditComponentId()),
        frequency: component.frequency || "monthly",
        amount: Number(component.amount || 0),
        upfrontTiming: component.upfrontTiming || "leave_year_start",
        prorateOnJoining: component.prorateOnJoining !== false,
        prorateOnExit: component.prorateOnExit !== false,
      }))
    : storedAccrualFrequency !== "none" && rule.balanceTracked !== false
      ? [{
          componentId: `legacy-${storedAccrualFrequency}`,
          frequency: storedAccrualFrequency,
          amount: Number(
            rule.accrualAmount || calculateAccrualAmount(storedAnnualEntitlement, storedAccrualFrequency)
          ),
          upfrontTiming: "leave_year_start",
          prorateOnJoining: rule.prorateOnJoining !== false,
          prorateOnExit: rule.prorateOnExit !== false,
        }]
      : [];
  const annualEntitlement = creditComponents.length
    ? scheduledAnnualCredit(creditComponents)
    : storedAnnualEntitlement;
  const accrualFrequency = creditComponents.length === 1
    ? creditComponents[0].frequency
    : creditComponents.length > 1
      ? "none"
      : storedAccrualFrequency;
  return {
    ...rule,
    leaveType: String(rule.leaveType?._id || rule.leaveType || ""),
    annualEntitlement,
    accrualFrequency,
    accrualAmount: creditComponents.length === 1
      ? creditComponents[0].amount
      : calculateAccrualAmount(annualEntitlement, accrualFrequency),
    creditComponents,
    maxCarryForward: Number(rule.maxCarryForward || 0),
    carryForwardExpiryMonths: Number(rule.carryForwardExpiryMonths || 0),
    maxEncashmentPerYear: Number(rule.maxEncashmentPerYear || 0),
    maxNegativeBalance: Number(rule.maxNegativeBalance || 0),
    minimumRequestDays: Number(rule.minimumRequestDays || 1),
    maximumRequestDays: rule.maximumRequestDays ?? null,
    minimumNoticeDays: Number(rule.minimumNoticeDays || 0),
    documentRequiredAfterDays: rule.documentRequiredAfterDays ?? null,
  };
}

export default function LeavePolicyDrawer({
  isOpen,
  onClose,
  companyId,
  mode,
  resource,
  version,
  leaveTypes,
  onSaved,
  onPublished,
}: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(localDateValue());
  const [leaveYearStartMonth, setLeaveYearStartMonth] = useState("1");
  const [leaveYearStartDay, setLeaveYearStartDay] = useState("1");
  const [changeReason, setChangeReason] = useState("");
  const [rules, setRules] = useState<LeavePolicyRule[]>([]);
  const [leaveTypeToAdd, setLeaveTypeToAdd] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(mode === "create" ? "" : resource?.name || "");
    setCode(mode === "create" ? "" : resource?.code || "");
    setDescription(mode === "create" ? "" : resource?.description || "");
    setEffectiveFrom(String(version?.effectiveFrom || "").slice(0, 10) || localDateValue());
    setLeaveYearStartMonth(String(version?.leaveYearStartMonth || 1));
    setLeaveYearStartDay(String(version?.leaveYearStartDay || 1));
    setChangeReason(mode === "create" ? "Initial leave policy configuration" : "");
    setRules(Array.isArray(version?.rules) ? version.rules.map(normalizeSourceRule) : []);
    setLeaveTypeToAdd("");
  }, [isOpen, mode, resource, version]);

  const activeLeaveTypes = leaveTypes.filter((item) => item.status === "active");
  const leaveTypeById = new Map(leaveTypes.map((item) => [item._id, item]));
  const availableLeaveTypes = activeLeaveTypes.filter(
    (item) => !rules.some((rule) => rule.leaveType === item._id)
  );

  const validationError = useMemo(() => {
    if (mode === "create" && !name.trim()) return "Policy name is required.";
    if (mode === "create" && !code.trim()) return "Policy code is required.";
    if (!effectiveFrom) return "Effective-from date is required.";
    if (!rules.length) return "Add at least one leave type rule.";
    if (mode === "new_version" && changeReason.trim().length < 3) {
      return "Enter a reason for the new version.";
    }
    return "";
  }, [changeReason, code, effectiveFrom, mode, name, rules.length]);

  const publishValidationError = useMemo(() => {
    if (validationError) return validationError;
    const emptyEntitlementRule = rules.find((rule) => {
      const leaveType = leaveTypeById.get(rule.leaveType);
      const balanceTracked = leaveType?.balanceTracked ?? rule.balanceTracked !== false;
      return balanceTracked && rule.annualEntitlement <= 0;
    });
    if (emptyEntitlementRule) {
      const leaveType = leaveTypeById.get(emptyEntitlementRule.leaveType);
      return `${leaveType?.code || emptyEntitlementRule.leaveTypeCodeSnapshot || "Leave type"} annual entitlement must be greater than zero.`;
    }
    for (const rule of rules) {
      const leaveType = leaveTypeById.get(rule.leaveType);
      const code = leaveType?.code || rule.leaveTypeCodeSnapshot || "Leave type";
      if (rule.creditComponents.some((component) => component.amount <= 0)) {
        return `${code} automatic credit amounts must be greater than zero.`;
      }
      if (rule.carryForwardEnabled && rule.maxCarryForward <= 0) {
        return `${code} maximum carry-forward must be greater than zero.`;
      }
      if (rule.encashmentEnabled && rule.maxEncashmentPerYear <= 0) {
        return `${code} annual encashment limit must be greater than zero.`;
      }
      if (rule.negativeBalanceAllowed && rule.maxNegativeBalance <= 0) {
        return `${code} maximum negative balance must be greater than zero.`;
      }
      if (leaveType?.unit === "hours") {
        if (!Number.isInteger(rule.minimumRequestDays * 4)) {
          return `${code} minimum request must use 15-minute increments.`;
        }
        if (
          rule.maximumRequestDays !== null &&
          rule.maximumRequestDays !== undefined &&
          !Number.isInteger(rule.maximumRequestDays * 4)
        ) {
          return `${code} maximum request must use 15-minute increments.`;
        }
      } else if (rule.allowHalfDay) {
        if (rule.minimumRequestDays !== 0.5) {
          return `${code} minimum request must be 0.5 day when half-day leave is allowed.`;
        }
        if (
          rule.maximumRequestDays !== null &&
          rule.maximumRequestDays !== undefined &&
          !Number.isInteger(rule.maximumRequestDays * 2)
        ) {
          return `${code} maximum request must use half-day increments.`;
        }
      } else {
        if (rule.minimumRequestDays < 1 || !Number.isInteger(rule.minimumRequestDays)) {
          return `${code} minimum request must be a whole day when half-day leave is disabled.`;
        }
        if (
          rule.maximumRequestDays !== null &&
          rule.maximumRequestDays !== undefined &&
          !Number.isInteger(rule.maximumRequestDays)
        ) {
          return `${code} maximum request must be a whole day when half-day leave is disabled.`;
        }
      }
    }
    return "";
  }, [leaveTypes, rules, validationError]);

  const updateRule = (index: number, patch: Partial<LeavePolicyRule>) => {
    setRules((current) =>
      current.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patch } : rule))
    );
  };

  const setCreditComponents = (ruleIndex: number, creditComponents: LeaveCreditComponent[]) => {
    setRules((current) =>
      current.map((rule, index) => {
        if (index !== ruleIndex) return rule;
        const annualEntitlement = creditComponents.length
          ? scheduledAnnualCredit(creditComponents)
          : rule.annualEntitlement;
        const accrualFrequency = creditComponents.length === 1
          ? creditComponents[0].frequency
          : "none";
        return {
          ...rule,
          annualEntitlement,
          accrualFrequency,
          accrualAmount: creditComponents.length === 1 ? creditComponents[0].amount : 0,
          creditComponents,
        };
      })
    );
  };

  const addCreditComponent = (ruleIndex: number) => {
    const rule = rules[ruleIndex];
    if (!rule || rule.creditComponents.length >= 20) return;
    setCreditComponents(ruleIndex, [
      ...rule.creditComponents,
      {
        componentId: createCreditComponentId(),
        frequency: "monthly",
        amount: 0,
        upfrontTiming: "leave_year_start",
        prorateOnJoining: true,
        prorateOnExit: true,
      },
    ]);
  };

  const updateCreditComponent = (
    ruleIndex: number,
    componentIndex: number,
    patch: Partial<LeaveCreditComponent>
  ) => {
    const rule = rules[ruleIndex];
    if (!rule) return;
    setCreditComponents(
      ruleIndex,
      rule.creditComponents.map((component, index) =>
        index === componentIndex ? { ...component, ...patch } : component
      )
    );
  };

  const addLeaveType = () => {
    const leaveType = leaveTypeById.get(leaveTypeToAdd);
    if (!leaveType) return;
    setRules((current) => [...current, emptyRule(leaveType)]);
    setLeaveTypeToAdd("");
  };

  const buildPayload = () => ({
    companyId,
    name: name.trim(),
    code: code.trim().toUpperCase(),
    description: description.trim(),
    effectiveFrom,
    leaveYearStartMonth: Number(leaveYearStartMonth),
    leaveYearStartDay: Number(leaveYearStartDay),
    changeReason: changeReason.trim(),
    rules: rules.map(({ accrualAmount: _derivedAccrualAmount, ...rule }) => rule),
  });

  const persistDraft = async () => {
    const payload = buildPayload();
    if (mode === "create") {
      const response = await workforcePolicyStore.createLeavePolicy(payload);
      return {
        policyId: String(response?.data?.policy?._id || ""),
        versionId: String(response?.data?.version?._id || ""),
      };
    }
    if (!resource?._id) throw new Error("Leave policy is missing");
    if (mode === "edit_draft") {
      if (!version?._id) throw new Error("Leave policy draft is missing");
      await workforcePolicyStore.updateLeavePolicyDraft(resource._id, version._id, payload);
      return { policyId: resource._id, versionId: version._id };
    }
    const response = await workforcePolicyStore.createLeavePolicyVersion(resource._id, payload);
    return {
      policyId: resource._id,
      versionId: String(response?.data?._id || response?.data?.version?._id || ""),
    };
  };

  const saveDraft = async () => {
    if (validationError) {
      toast({ title: validationError, status: "warning", duration: 3500 });
      return;
    }
    try {
      await persistDraft();
      await onSaved();
      toast({ title: "Leave policy draft saved", status: "success" });
      onClose();
    } catch (error: any) {
      toast({ title: error?.message || "Could not save leave policy", status: "error", duration: 5000 });
    }
  };

  const publish = async () => {
    if (publishValidationError) {
      toast({ title: publishValidationError, status: "warning", duration: 3500 });
      return;
    }
    setPublishing(true);
    try {
      const { policyId, versionId } = await persistDraft();
      if (!policyId || !versionId) throw new Error("Created policy identifiers are missing");
      await workforcePolicyStore.publishLeavePolicyVersion(policyId, versionId, {
        companyId,
        effectiveFrom,
        changeReason: changeReason.trim(),
      });
      await onSaved();
      toast({ title: "Leave policy published", status: "success" });
      onClose();
      if (mode !== "new_version" && !resource?.assignmentCount) onPublished?.(policyId);
    } catch (error: any) {
      toast({ title: error?.message || "Could not publish leave policy", status: "error", duration: 5000 });
    } finally {
      setPublishing(false);
    }
  };

  const title = mode === "create" ? "Create leave policy" : mode === "new_version" ? "Create policy version" : "Edit leave policy draft";

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          <Text fontSize="lg" fontWeight="800">{title}</Text>
          <Text mt={1} fontSize="sm" fontWeight="400" color="gray.500">
            Published versions are immutable and remain available for historical leave calculations.
          </Text>
        </DrawerHeader>
        <DrawerBody py={5}>
          <Stack spacing={6}>
            {mode !== "create" ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription>{resource?.name} ({resource?.code})</AlertDescription>
              </Alert>
            ) : (
              <>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Policy name</FormLabel>
                    <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="India Standard Leave Policy" />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Policy code</FormLabel>
                    <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="IND-LEAVE" />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
                </FormControl>
              </>
            )}

            <Box>
              <Text fontWeight="800">Effective period</Text>
              <SimpleGrid mt={3} columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Effective from</FormLabel>
                  <Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Leave year starts in</FormLabel>
                  <Select value={leaveYearStartMonth} onChange={(event) => setLeaveYearStartMonth(event.target.value)}>
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, index) => (
                      <option key={month} value={index + 1}>{month}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Start day</FormLabel>
                  <Input type="number" min={1} max={31} value={leaveYearStartDay} onChange={(event) => setLeaveYearStartDay(event.target.value)} />
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            <Box>
              <Flex direction={{ base: "column", sm: "row" }} justify="space-between" gap={3} align={{ sm: "end" }}>
                <Box>
                  <Text fontWeight="800">Leave allowances and rules</Text>
                  <Text mt={1} fontSize="sm" color="gray.500">Add each leave type once, then configure how it is credited and requested.</Text>
                </Box>
                <HStack align="end">
                  <Select size="sm" value={leaveTypeToAdd} onChange={(event) => setLeaveTypeToAdd(event.target.value)} placeholder="Select leave type" minW="190px">
                    {availableLeaveTypes.map((item) => <option key={item._id} value={item._id}>{item.name} ({item.code})</option>)}
                  </Select>
                  <Button size="sm" leftIcon={<FiPlus />} onClick={addLeaveType} isDisabled={!leaveTypeToAdd}>Add</Button>
                </HStack>
              </Flex>

              {rules.length === 0 ? (
                <Box mt={4} borderWidth="1px" borderStyle="dashed" borderRadius="md" py={8} textAlign="center">
                  <Text color="gray.500">Add a leave type to configure its allowance.</Text>
                </Box>
              ) : (
                <Accordion mt={4} allowMultiple defaultIndex={[0]}>
                  {rules.map((rule, index) => {
                    const leaveType = leaveTypeById.get(rule.leaveType);
                    const balanceTracked = leaveType?.balanceTracked ?? rule.balanceTracked !== false;
                    const ruleUnit = leaveType?.unit === "hours" ? "hours" : "days";
                    const requestStep = ruleUnit === "hours" ? 0.25 : rule.allowHalfDay ? 0.5 : 1;
                    return (
                      <AccordionItem key={rule.leaveType} borderWidth="1px" borderRadius="md" mb={3} overflow="hidden">
                        <AccordionButton py={3}>
                          <Box flex="1" textAlign="left">
                            <Text fontWeight="800">{leaveType?.name || rule.leaveTypeNameSnapshot} ({leaveType?.code || rule.leaveTypeCodeSnapshot})</Text>
                            <Text fontSize="xs" color="gray.500">{accrualSummary(rule, leaveType)}</Text>
                          </Box>
                          <Button as="span" size="xs" variant="ghost" colorScheme="red" mr={2} aria-label="Remove leave type" onClick={(event) => { event.stopPropagation(); setRules((current) => current.filter((_, ruleIndex) => ruleIndex !== index)); }}>
                            <FiTrash2 />
                          </Button>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel borderTopWidth="1px" py={5}>
                          <Stack spacing={5}>
                            {balanceTracked ? (
                              <Stack spacing={4}>
                                <FormControl maxW={{ md: "280px" }}>
                                  <FormLabel fontSize="sm">
                                    {rule.creditComponents.length ? "Scheduled annual credit" : "Annual allowance"} ({ruleUnit})
                                  </FormLabel>
                                  {rule.creditComponents.length ? (
                                    <Input
                                      isReadOnly
                                      variant="filled"
                                      value={formatCreditNumber(rule.annualEntitlement)}
                                    />
                                  ) : (
                                    <OptionalPositiveNumberInput
                                      value={rule.annualEntitlement}
                                      placeholder="e.g. 12"
                                      onValueChange={(annualEntitlement) => updateRule(index, {
                                        annualEntitlement,
                                        accrualFrequency: "none",
                                        accrualAmount: 0,
                                      })}
                                    />
                                  )}
                                  <Text mt={1} fontSize="xs" color="gray.500">
                                    {rule.creditComponents.length
                                      ? "Calculated from all automatic credits below."
                                      : "No automatic credits. HR posts opening balances and adjustments manually."}
                                  </Text>
                                </FormControl>

                                <Box>
                                  <Flex justify="space-between" align="center" gap={3} mb={3}>
                                    <Box>
                                      <Text fontSize="sm" fontWeight="700">Automatic credit schedule</Text>
                                      <Text fontSize="xs" color="gray.500">Combine upfront, monthly, or quarterly credits.</Text>
                                    </Box>
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      leftIcon={<FiPlus />}
                                      onClick={() => addCreditComponent(index)}
                                      isDisabled={rule.creditComponents.length >= 20}
                                    >
                                      Add credit
                                    </Button>
                                  </Flex>

                                  {rule.creditComponents.length === 0 ? (
                                    <Box borderWidth="1px" borderStyle="dashed" borderRadius="md" p={4}>
                                      <Text fontSize="sm" color="gray.500">Automatic credit is disabled for this leave type.</Text>
                                    </Box>
                                  ) : (
                                    <Stack spacing={3}>
                                      {rule.creditComponents.map((component, componentIndex) => (
                                        <Box key={component.componentId} borderWidth="1px" borderRadius="md" p={3}>
                                          <Flex justify="space-between" align="start" gap={3}>
                                            <SimpleGrid
                                              flex="1"
                                              columns={{ base: 1, md: component.frequency === "upfront" ? 3 : 2 }}
                                              spacing={3}
                                            >
                                              <FormControl>
                                                <FormLabel mb={1} fontSize="xs">Credit frequency</FormLabel>
                                                <Select
                                                  size="sm"
                                                  value={component.frequency}
                                                  onChange={(event) => {
                                                    const frequency = event.target.value as LeaveCreditComponent["frequency"];
                                                    updateCreditComponent(index, componentIndex, {
                                                      componentId: component.componentId.startsWith("legacy-")
                                                        ? createCreditComponentId()
                                                        : component.componentId,
                                                      frequency,
                                                      upfrontTiming: "leave_year_start",
                                                    });
                                                  }}
                                                >
                                                  <option value="upfront">Upfront</option>
                                                  <option value="monthly">Monthly</option>
                                                  <option value="quarterly">Quarterly</option>
                                                </Select>
                                              </FormControl>
                                              <FormControl isRequired>
                                                <FormLabel mb={1} fontSize="xs">
                                                  {component.frequency === "monthly"
                                                    ? `Amount each month (${ruleUnit})`
                                                    : component.frequency === "quarterly"
                                                      ? `Amount each quarter (${ruleUnit})`
                                                      : `Amount credited (${ruleUnit})`}
                                                </FormLabel>
                                                <OptionalPositiveNumberInput
                                                  min={0.0001}
                                                  step={0.0001}
                                                  value={component.amount}
                                                  onValueChange={(amount) => updateCreditComponent(index, componentIndex, { amount })}
                                                  placeholder={component.frequency === "monthly" ? "e.g. 0.25" : "e.g. 10"}
                                                />
                                              </FormControl>
                                              {component.frequency === "upfront" ? (
                                                <FormControl>
                                                  <FormLabel mb={1} fontSize="xs">When to credit</FormLabel>
                                                  <Select
                                                    size="sm"
                                                    value={component.upfrontTiming}
                                                    onChange={(event) => updateCreditComponent(index, componentIndex, {
                                                      upfrontTiming: event.target.value as LeaveCreditComponent["upfrontTiming"],
                                                    })}
                                                  >
                                                    <option value="leave_year_start">At each leave-year start</option>
                                                    <option value="first_eligibility">Once, when first eligible</option>
                                                  </Select>
                                                </FormControl>
                                              ) : null}
                                            </SimpleGrid>
                                            <Button
                                              size="xs"
                                              variant="ghost"
                                              colorScheme="red"
                                              aria-label="Remove automatic credit"
                                              onClick={() => setCreditComponents(
                                                index,
                                                rule.creditComponents.filter((_, itemIndex) => itemIndex !== componentIndex)
                                              )}
                                            >
                                              <FiTrash2 />
                                            </Button>
                                          </Flex>
                                          <HStack mt={3} spacing={5} align="start" flexWrap="wrap">
                                            <Checkbox
                                              size="sm"
                                              isChecked={component.prorateOnJoining}
                                              onChange={(event) => updateCreditComponent(index, componentIndex, {
                                                prorateOnJoining: event.target.checked,
                                              })}
                                            >
                                              Prorate the joining period
                                            </Checkbox>
                                            <Checkbox
                                              size="sm"
                                              isChecked={component.prorateOnExit}
                                              onChange={(event) => updateCreditComponent(index, componentIndex, {
                                                prorateOnExit: event.target.checked,
                                              })}
                                            >
                                              Prorate the exit period
                                            </Checkbox>
                                          </HStack>
                                        </Box>
                                      ))}
                                    </Stack>
                                  )}
                                </Box>
                              </Stack>
                            ) : (
                              <Alert status="info" borderRadius="md">
                                <AlertIcon />
                                <AlertDescription>This leave type does not track a balance or automatic credits.</AlertDescription>
                              </Alert>
                            )}

                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                              <FormControl isRequired>
                                <FormLabel fontSize="sm">Minimum leave per request ({ruleUnit})</FormLabel>
                                <OptionalPositiveNumberInput
                                  min={requestStep}
                                  step={requestStep}
                                  value={rule.minimumRequestDays}
                                  onValueChange={(value) => updateRule(index, { minimumRequestDays: value })}
                                  placeholder={ruleUnit === "hours" ? "e.g. 1" : rule.allowHalfDay ? "0.5" : "1"}
                                />
                                <Text mt={1} fontSize="xs" color="gray.500">
                                  {ruleUnit === "hours"
                                    ? "Smallest request allowed, in 15-minute increments."
                                    : rule.allowHalfDay
                                      ? "Half-day requests are allowed, so the minimum is 0.5 day."
                                      : "Half-day requests are disabled, so use whole days."}
                                </Text>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="sm">Maximum leave per request ({ruleUnit})</FormLabel>
                                <OptionalPositiveNumberInput
                                  min={requestStep}
                                  step={requestStep}
                                  value={rule.maximumRequestDays || 0}
                                  onValueChange={(value) => updateRule(index, { maximumRequestDays: value > 0 ? value : null })}
                                  placeholder="No limit"
                                />
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="sm">Advance notice days</FormLabel>
                                <Input type="number" min={0} value={rule.minimumNoticeDays} onChange={(event) => updateRule(index, { minimumNoticeDays: Number(event.target.value || 0) })} />
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="sm">Document required after</FormLabel>
                                <Input type="number" min={0.25} step="0.25" value={rule.documentRequiredAfterDays ?? ""} onChange={(event) => updateRule(index, { documentRequiredAfterDays: event.target.value ? Number(event.target.value) : null })} placeholder="Not required" />
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="sm">Probation eligibility</FormLabel>
                                <Select value={rule.probationEligibility} onChange={(event) => updateRule(index, { probationEligibility: event.target.value as LeavePolicyRule["probationEligibility"] })}>
                                  <option value="allowed">Allowed</option>
                                  <option value="after_confirmation">After confirmation</option>
                                  <option value="not_allowed">Not allowed</option>
                                </Select>
                              </FormControl>
                            </SimpleGrid>

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                              <Checkbox
                                isChecked={rule.allowHalfDay}
                                isDisabled={leaveType?.unit !== "days" || !leaveType?.allowHalfDay}
                                onChange={(event) => {
                                  const allowHalfDay = event.target.checked;
                                  updateRule(index, {
                                    allowHalfDay,
                                    minimumRequestDays: allowHalfDay
                                      ? 0.5
                                      : Math.max(1, Math.ceil(rule.minimumRequestDays)),
                                    maximumRequestDays:
                                      rule.maximumRequestDays === null || rule.maximumRequestDays === undefined
                                        ? null
                                        : allowHalfDay
                                          ? Math.ceil(rule.maximumRequestDays * 2) / 2
                                          : Math.ceil(rule.maximumRequestDays),
                                  });
                                }}
                              >
                                Allow half day
                              </Checkbox>
                              <Checkbox isChecked={rule.sandwichRuleEnabled} onChange={(event) => updateRule(index, { sandwichRuleEnabled: event.target.checked })}>Count sandwich days</Checkbox>
                            </SimpleGrid>

                            {balanceTracked ? (
                              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                <Box borderWidth="1px" borderRadius="md" p={3}>
                                  <Checkbox isChecked={rule.carryForwardEnabled} onChange={(event) => updateRule(index, { carryForwardEnabled: event.target.checked })}>Carry forward unused balance</Checkbox>
                                  {rule.carryForwardEnabled ? (
                                    <Stack mt={4} spacing={4}>
                                      <FormControl isRequired>
                                        <FormLabel mb={1} fontSize="xs">Maximum carry-forward ({ruleUnit})</FormLabel>
                                        <OptionalPositiveNumberInput
                                          value={rule.maxCarryForward}
                                          onValueChange={(value) => updateRule(index, { maxCarryForward: value })}
                                          placeholder="e.g. 5"
                                        />
                                        <Text mt={1} fontSize="xs" color="gray.500">Largest unused balance moved into the next leave year.</Text>
                                      </FormControl>
                                      <FormControl>
                                        <FormLabel mb={1} fontSize="xs">Expires after (months)</FormLabel>
                                        <OptionalPositiveNumberInput
                                          min={1}
                                          max={120}
                                          step={1}
                                          value={rule.carryForwardExpiryMonths}
                                          onValueChange={(value) => updateRule(index, { carryForwardExpiryMonths: value })}
                                          placeholder="Never expires"
                                        />
                                        <Text mt={1} fontSize="xs" color="gray.500">Leave blank when the carried balance should not expire.</Text>
                                      </FormControl>
                                    </Stack>
                                  ) : null}
                                </Box>
                                <Box borderWidth="1px" borderRadius="md" p={3}>
                                  <Checkbox isChecked={rule.encashmentEnabled} isDisabled={leaveType?.paid === false} onChange={(event) => updateRule(index, { encashmentEnabled: event.target.checked })}>Allow encashment</Checkbox>
                                  {rule.encashmentEnabled ? (
                                    <FormControl mt={4} isRequired>
                                      <FormLabel mb={1} fontSize="xs">Annual encashment limit ({ruleUnit})</FormLabel>
                                      <OptionalPositiveNumberInput
                                        value={rule.maxEncashmentPerYear}
                                        onValueChange={(value) => updateRule(index, { maxEncashmentPerYear: value })}
                                        placeholder="e.g. 10"
                                      />
                                      <Text mt={1} fontSize="xs" color="gray.500">Maximum unused balance that can be converted to pay each leave year.</Text>
                                    </FormControl>
                                  ) : null}
                                </Box>
                                <Box borderWidth="1px" borderRadius="md" p={3}>
                                  <Checkbox isChecked={rule.negativeBalanceAllowed} onChange={(event) => updateRule(index, { negativeBalanceAllowed: event.target.checked })}>Allow negative balance</Checkbox>
                                  {rule.negativeBalanceAllowed ? (
                                    <FormControl mt={4} isRequired>
                                      <FormLabel mb={1} fontSize="xs">Maximum negative balance ({ruleUnit})</FormLabel>
                                      <OptionalPositiveNumberInput
                                        value={rule.maxNegativeBalance}
                                        onValueChange={(value) => updateRule(index, { maxNegativeBalance: value })}
                                        placeholder="e.g. 2"
                                      />
                                      <Text mt={1} fontSize="xs" color="gray.500">
                                        {rule.maxNegativeBalance > 0
                                          ? `The employee balance may fall as low as -${formatCreditNumber(rule.maxNegativeBalance)} ${ruleUnit}.`
                                          : "Enter how far below zero the leave balance may fall."}
                                      </Text>
                                    </FormControl>
                                  ) : null}
                                </Box>
                              </SimpleGrid>
                            ) : null}
                          </Stack>
                        </AccordionPanel>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </Box>

            <FormControl isRequired={mode === "new_version"}>
              <FormLabel fontSize="sm">Change reason</FormLabel>
              <Textarea value={changeReason} onChange={(event) => setChangeReason(event.target.value)} rows={3} placeholder="Why this configuration is being introduced or changed" />
            </FormControl>
          </Stack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" gap={3} flexWrap="wrap">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={saveDraft} isLoading={workforcePolicyStore.submitting && !publishing} isDisabled={Boolean(validationError)}>Save draft</Button>
          <Button colorScheme="blue" onClick={publish} isLoading={publishing} isDisabled={Boolean(publishValidationError)}>
            {mode === "new_version" || resource?.assignmentCount ? "Publish version" : "Publish and assign"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
