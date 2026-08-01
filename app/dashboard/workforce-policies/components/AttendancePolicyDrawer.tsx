"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
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
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import {
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
  allowMultiplePunches: false,
  missingPunchTreatment: "flag_incomplete",
  overtimeEnabled: false,
  overtimeStartsAfterMinutes: 0,
};

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
    setRules({
      ...DEFAULT_RULES,
      ...sourceRules,
    });
  }, [isOpen, mode, resource, version]);

  const title =
    mode === "create"
      ? "New attendance policy"
      : mode === "new_version"
        ? `New version of ${resource?.name || "policy"}`
        : `Edit ${resource?.name || "policy"} draft`;
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
    return "";
  }, [changeReason, code, effectiveFrom, mode, name, rules]);

  const setRule = (key: keyof AttendanceRules, value: any) => {
    setRules((current) => ({ ...current, [key]: value }));
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
        rules,
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

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          <Text fontSize="lg" fontWeight="800">{title}</Text>
          <Text mt={1} fontSize="sm" fontWeight="400" color="gray.500">
            Published versions preserve the attendance-evaluation rules used for historical records.
          </Text>
        </DrawerHeader>

        <DrawerBody py={5}>
          <Stack spacing={6}>
            {mode !== "create" ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  This draft will become version {version?.versionNumber || (resource?.latestVersionNumber || 0) + 1}.
                </AlertDescription>
              </Alert>
            ) : null}

            <Box>
              <Text mb={3} fontSize="sm" fontWeight="800">Policy identity</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired isDisabled={mode !== "create"}>
                  <FormLabel fontSize="sm">Name</FormLabel>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="General attendance policy" />
                </FormControl>
                <FormControl isRequired isDisabled={mode !== "create"}>
                  <FormLabel fontSize="sm">Code</FormLabel>
                  <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="ATT-GENERAL" />
                </FormControl>
              </SimpleGrid>
              {mode === "create" ? (
                <FormControl mt={4}>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
                </FormControl>
              ) : null}
            </Box>

            <Box>
              <Text mb={3} fontSize="sm" fontWeight="800">Validity</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Effective from</FormLabel>
                  <Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} />
                </FormControl>
              </SimpleGrid>
            </Box>

            <Box>
              <Text mb={3} fontSize="sm" fontWeight="800">Attendance thresholds</Text>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                <FormControl><FormLabel fontSize="sm">Late grace (minutes)</FormLabel><NumberInput min={0} value={rules.gracePeriodMinutesLate} onChange={(_, value) => setRule("gracePeriodMinutesLate", value || 0)}><NumberInputField /></NumberInput></FormControl>
                <FormControl><FormLabel fontSize="sm">Early-exit grace</FormLabel><NumberInput min={0} value={rules.gracePeriodMinutesEarly} onChange={(_, value) => setRule("gracePeriodMinutesEarly", value || 0)}><NumberInputField /></NumberInput></FormControl>
                <FormControl><FormLabel fontSize="sm">Full-day minutes</FormLabel><NumberInput min={1} value={rules.minimumFullDayMinutes} onChange={(_, value) => setRule("minimumFullDayMinutes", value || 0)}><NumberInputField /></NumberInput></FormControl>
                <FormControl><FormLabel fontSize="sm">Half-day minutes</FormLabel><NumberInput min={1} value={rules.minimumHalfDayMinutes} onChange={(_, value) => setRule("minimumHalfDayMinutes", value || 0)}><NumberInputField /></NumberInput></FormControl>
              </SimpleGrid>
            </Box>

            <Box>
              <Text mb={3} fontSize="sm" fontWeight="800">Punch evaluation</Text>
              <Stack spacing={3}>
                <HStack justify="space-between"><Text fontSize="sm">Require punch-out</Text><Switch isChecked={rules.requirePunchOut} onChange={(event) => setRule("requirePunchOut", event.target.checked)} /></HStack>
                <HStack justify="space-between"><Text fontSize="sm">Allow multiple punch sessions</Text><Switch isChecked={rules.allowMultiplePunches} onChange={(event) => setRule("allowMultiplePunches", event.target.checked)} /></HStack>
                <FormControl>
                  <FormLabel fontSize="sm">Missing punch treatment</FormLabel>
                  <Select value={rules.missingPunchTreatment} onChange={(event) => setRule("missingPunchTreatment", event.target.value)}>
                    <option value="flag_incomplete">Flag for regularization</option>
                    <option value="half_day">Mark half day</option>
                    <option value="absent">Mark absent</option>
                  </Select>
                </FormControl>
                <HStack justify="space-between"><Text fontSize="sm">Calculate overtime</Text><Switch isChecked={rules.overtimeEnabled} onChange={(event) => setRule("overtimeEnabled", event.target.checked)} /></HStack>
                {rules.overtimeEnabled ? (
                  <FormControl>
                    <FormLabel fontSize="sm">Overtime starts after worked minutes</FormLabel>
                    <NumberInput min={0} value={rules.overtimeStartsAfterMinutes} onChange={(_, value) => setRule("overtimeStartsAfterMinutes", value || 0)}><NumberInputField /></NumberInput>
                  </FormControl>
                ) : null}
              </Stack>
            </Box>

            <FormControl isRequired={mode !== "create"}>
              <FormLabel fontSize="sm">Change reason</FormLabel>
              <Textarea value={changeReason} onChange={(event) => setChangeReason(event.target.value)} rows={2} placeholder="Why these rules are effective from this date" />
            </FormControl>
          </Stack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" gap={3} flexDirection={{ base: "column-reverse", sm: "row" }}>
          <Button w={{ base: "full", sm: "auto" }} variant="ghost" onClick={onClose}>Cancel</Button>
          <Button w={{ base: "full", sm: "auto" }} variant="outline" onClick={() => save(false)} isLoading={workforcePolicyStore.submitting}>Save draft</Button>
          <Button w={{ base: "full", sm: "auto" }} colorScheme="blue" onClick={() => save(true)} isLoading={workforcePolicyStore.submitting} isDisabled={Boolean(validationError)}>Save and publish</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
