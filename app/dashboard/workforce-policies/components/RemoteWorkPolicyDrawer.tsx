"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
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
  PolicyVersion,
  RemoteWorkRules,
  WorkforcePolicyItem,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_RULES: RemoteWorkRules = {
  approvalMode: "reporting_manager",
  approvalWorkflow: null,
  approvalWorkflowVersion: null,
  approvalWorkflowVersionNumber: null,
  allowedWeekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  maxDaysPerWeek: 0,
  maxDaysPerMonth: 0,
  maxConsecutiveDays: 0,
  minimumNoticeDays: 0,
  maximumAdvanceDays: 90,
  allowHalfDay: true,
  requireReason: true,
  minimumReasonLength: 10,
  probationEligibility: "allowed",
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  mode: "create" | "edit_draft" | "new_version";
  resource?: WorkforcePolicyItem | null;
  version?: PolicyVersion | null;
  onSaved: () => Promise<void> | void;
};

const dateValue = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 10) : "";

export default function RemoteWorkPolicyDrawer({ isOpen, onClose, companyId, mode, resource, version, onSaved }: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [rules, setRules] = useState<RemoteWorkRules>(DEFAULT_RULES);
  const approvalOptions = workforcePolicyStore.approvalWorkflows.filter(
    (workflow) => workflow.status === "active" && workflow.applicableTo.includes("remote_work_request") && workflow.latestPublishedVersion
  );

  useEffect(() => {
    if (!isOpen) return;
    const source = (version?.rules || resource?.latestPublishedVersion?.rules || DEFAULT_RULES) as RemoteWorkRules;
    setName(resource?.name || "");
    setCode(resource?.code || "");
    setDescription(resource?.description || "");
    setEffectiveFrom(mode === "new_version" ? "" : dateValue(version?.effectiveFrom));
    setChangeReason(mode === "create" ? "Initial WFH policy configuration" : mode === "new_version" ? "" : version?.changeReason || "");
    setRules({ ...DEFAULT_RULES, ...source });
  }, [isOpen, mode, resource, version]);

  const validationError = useMemo(() => {
    if (mode === "create" && (!name.trim() || !code.trim())) return "Policy name and code are required.";
    if (!effectiveFrom) return "Effective-from date is required before publishing.";
    if (!rules.allowedWeekdays.length) return "Select at least one allowed weekday.";
    if (!rules.approvalWorkflow || !rules.approvalWorkflowVersion) return "Select a published approval workflow.";
    if (rules.requireReason && rules.minimumReasonLength < 1) return "Set a minimum reason length.";
    if (mode !== "create" && changeReason.trim().length < 3) return "Describe why this version is changing.";
    return "";
  }, [changeReason, code, effectiveFrom, mode, name, rules]);

  const setRule = <K extends keyof RemoteWorkRules>(key: K, value: RemoteWorkRules[K]) =>
    setRules((current) => ({ ...current, [key]: value }));
  const numberValue = (key: keyof RemoteWorkRules) => Number(rules[key]) === 0 ? "" : String(rules[key]);
  const numberChange = (key: keyof RemoteWorkRules, value: string) => setRule(key, (value === "" ? 0 : Number(value)) as never);

  const save = async (publish: boolean) => {
    if (validationError) {
      toast({ title: validationError, status: "warning", duration: 3500 });
      return;
    }
    try {
      const payload = { companyId, effectiveFrom, changeReason: changeReason.trim(), rules };
      let policyId = resource?._id || "";
      let versionId = version?._id || "";
      if (mode === "create") {
        const created = await workforcePolicyStore.createRemoteWorkPolicy({
          ...payload,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
        });
        policyId = created?.data?.policy?._id;
        versionId = created?.data?.version?._id;
      } else if (mode === "new_version") {
        const created = await workforcePolicyStore.createRemoteWorkVersion(policyId, payload);
        versionId = created?.data?._id;
      } else {
        await workforcePolicyStore.updateRemoteWorkDraft(policyId, versionId, payload);
      }
      if (publish) {
        await workforcePolicyStore.publishRemoteWorkVersion(policyId, versionId, {
          companyId,
          effectiveFrom,
          changeReason: changeReason.trim(),
        });
      }
      await onSaved();
      toast({ title: publish ? "WFH policy published" : "WFH policy draft saved", status: "success" });
      onClose();
    } catch (error: any) {
      toast({ title: error?.message || "Could not save WFH policy", status: "error", duration: 5000 });
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          <Text fontSize="lg" fontWeight="800">{mode === "create" ? "New WFH policy" : mode === "new_version" ? `New version of ${resource?.name}` : `Edit ${resource?.name} draft`}</Text>
          <Text mt={1} fontSize="sm" fontWeight="400" color="gray.500">Controls eligibility and approval. Approved WFH still requires normal attendance punches.</Text>
        </DrawerHeader>
        <DrawerBody py={5}>
          <Stack spacing={6}>
            {mode !== "create" ? <Alert status="info" borderRadius="md"><AlertIcon /><AlertDescription fontSize="sm">Published versions remain immutable for historical requests.</AlertDescription></Alert> : null}
            <Box>
              <Text mb={3} fontWeight="800" fontSize="sm">Policy identity</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired isDisabled={mode !== "create"}><FormLabel>Name</FormLabel><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="General WFH policy" /></FormControl>
                <FormControl isRequired isDisabled={mode !== "create"}><FormLabel>Code</FormLabel><Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="WFH-GENERAL" /></FormControl>
              </SimpleGrid>
              {mode === "create" ? <FormControl mt={4}><FormLabel>Description</FormLabel><Textarea value={description} onChange={(event) => setDescription(event.target.value)} /></FormControl> : null}
            </Box>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired><FormLabel>Effective from</FormLabel><Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></FormControl>
              <FormControl isRequired>
                <FormLabel>Approval workflow</FormLabel>
                <Select
                  value={rules.approvalWorkflowVersion || ""}
                  placeholder="Select published workflow"
                  onChange={(event) => {
                    const selected = approvalOptions.find((item) => item.latestPublishedVersion?._id === event.target.value);
                    setRules((current) => ({
                      ...current,
                      approvalWorkflow: selected?._id || null,
                      approvalWorkflowVersion: selected?.latestPublishedVersion?._id || null,
                      approvalWorkflowVersionNumber: selected?.latestPublishedVersion?.versionNumber || null,
                    }));
                  }}
                >
                  {approvalOptions.map((item) => <option key={item._id} value={item.latestPublishedVersion!._id}>{item.name} (v{item.latestPublishedVersion!.versionNumber})</option>)}
                </Select>
                <FormHelperText>Configure levels in Workforce policies &gt; Approval flows.</FormHelperText>
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel>Allowed weekdays</FormLabel>
              <CheckboxGroup value={rules.allowedWeekdays} onChange={(values) => setRule("allowedWeekdays", values as string[])}>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>{WEEKDAYS.map((day) => <Checkbox key={day} value={day}>{day}</Checkbox>)}</SimpleGrid>
              </CheckboxGroup>
            </FormControl>
            <Box>
              <Text mb={3} fontWeight="800" fontSize="sm">Usage limits</Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl><FormLabel>Days per week</FormLabel><Input type="number" min={0} max={7} value={numberValue("maxDaysPerWeek")} placeholder="No limit" onChange={(event) => numberChange("maxDaysPerWeek", event.target.value)} /><FormHelperText>Blank means no limit.</FormHelperText></FormControl>
                <FormControl><FormLabel>Days per month</FormLabel><Input type="number" min={0} max={31} value={numberValue("maxDaysPerMonth")} placeholder="No limit" onChange={(event) => numberChange("maxDaysPerMonth", event.target.value)} /></FormControl>
                <FormControl><FormLabel>Consecutive days</FormLabel><Input type="number" min={0} max={31} value={numberValue("maxConsecutiveDays")} placeholder="No limit" onChange={(event) => numberChange("maxConsecutiveDays", event.target.value)} /></FormControl>
                <FormControl><FormLabel>Minimum notice days</FormLabel><Input type="number" min={0} value={numberValue("minimumNoticeDays")} placeholder="Same day" onChange={(event) => numberChange("minimumNoticeDays", event.target.value)} /></FormControl>
                <FormControl><FormLabel>Maximum advance days</FormLabel><Input type="number" min={0} value={numberValue("maximumAdvanceDays")} placeholder="No limit" onChange={(event) => numberChange("maximumAdvanceDays", event.target.value)} /></FormControl>
                <FormControl><FormLabel>Probation eligibility</FormLabel><Select value={rules.probationEligibility} onChange={(event) => setRule("probationEligibility", event.target.value as RemoteWorkRules["probationEligibility"])}><option value="allowed">Allowed</option><option value="after_confirmation">After confirmation</option><option value="not_allowed">Not allowed</option></Select></FormControl>
              </SimpleGrid>
            </Box>
            <Stack spacing={4}>
              <FormControl display="flex" justifyContent="space-between" alignItems="center"><Box><FormLabel mb={0}>Allow half-day WFH</FormLabel><FormHelperText mt={0}>Half day appears as hybrid work mode.</FormHelperText></Box><Switch isChecked={rules.allowHalfDay} onChange={(event) => setRule("allowHalfDay", event.target.checked)} /></FormControl>
              <FormControl display="flex" justifyContent="space-between" alignItems="center"><Box><FormLabel mb={0}>Require a reason</FormLabel><FormHelperText mt={0}>Employees must explain the remote-work need.</FormHelperText></Box><Switch isChecked={rules.requireReason} onChange={(event) => { setRule("requireReason", event.target.checked); if (!event.target.checked) setRule("minimumReasonLength", 0); }} /></FormControl>
              {rules.requireReason ? <FormControl><FormLabel>Minimum reason characters</FormLabel><Input type="number" min={1} max={500} value={numberValue("minimumReasonLength")} placeholder="10" onChange={(event) => numberChange("minimumReasonLength", event.target.value)} /></FormControl> : null}
            </Stack>
            <FormControl isRequired={mode !== "create"}><FormLabel>Change reason</FormLabel><Textarea value={changeReason} onChange={(event) => setChangeReason(event.target.value)} placeholder="Why these rules take effect on this date" /></FormControl>
          </Stack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" gap={3}><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="outline" onClick={() => save(false)} isLoading={workforcePolicyStore.submitting}>Save draft</Button><Button colorScheme="blue" onClick={() => save(true)} isLoading={workforcePolicyStore.submitting} isDisabled={Boolean(validationError)}>Save and publish</Button></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
