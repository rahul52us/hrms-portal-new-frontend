"use client";

import axios from "axios";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
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
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from "react-icons/fi";
import {
  ApprovalRequestType,
  ApprovalStepType,
  ApprovalWorkflowItem,
  ApprovalWorkflowStep,
  ApprovalWorkflowVersion,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";

type Mode = "create" | "edit_draft" | "new_version";
type UserOption = { _id: string; name?: string; username?: string; code?: string; role?: string };

const REQUEST_TYPES: Array<{ value: ApprovalRequestType; label: string }> = [
  { value: "leave_request", label: "Leave requests" },
  { value: "remote_work_request", label: "WFH requests" },
  { value: "comp_off_claim", label: "Comp-off claims" },
];

const STEP_TYPES: Array<{ value: ApprovalStepType; label: string }> = [
  { value: "reporting_manager", label: "Reporting manager" },
  { value: "manager_manager", label: "Reporting manager's manager" },
  { value: "department_head", label: "Department head" },
  { value: "hr", label: "HR queue in employee scope" },
  { value: "specific_users", label: "Specific users" },
];

function emptyStep(index: number): ApprovalWorkflowStep {
  return {
    order: index + 1,
    name: `Level ${index + 1}`,
    approverType: "reporting_manager",
    approvalRule: "any",
    approverUserIds: [],
    fallbackToHr: true,
  };
}

function normalizeSteps(steps: ApprovalWorkflowStep[] = []) {
  return steps.map((step, index) => ({
    ...step,
    order: index + 1,
    approverUserIds: (step.approverUserIds || []).map((item) =>
      typeof item === "string" ? item : item._id
    ),
  }));
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  mode: Mode;
  workflow?: ApprovalWorkflowItem | null;
  version?: ApprovalWorkflowVersion | null;
  onSaved: () => Promise<void> | void;
};

export default function ApprovalWorkflowDrawer({
  isOpen,
  onClose,
  companyId,
  mode,
  workflow,
  version,
  onSaved,
}: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [applicableTo, setApplicableTo] = useState<ApprovalRequestType[]>(["leave_request"]);
  const [autoApprove, setAutoApprove] = useState(false);
  const [steps, setSteps] = useState<ApprovalWorkflowStep[]>([emptyStep(0)]);
  const [changeReason, setChangeReason] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const source = version || workflow?.latestPublishedVersion || null;
    setName(workflow?.name || "");
    setCode(workflow?.code || "");
    setDescription(workflow?.description || "");
    setApplicableTo(workflow?.applicableTo?.length ? workflow.applicableTo : ["leave_request"]);
    setAutoApprove(Boolean(source?.autoApprove));
    setSteps(source?.steps?.length ? normalizeSteps(source.steps) : [emptyStep(0)]);
    setChangeReason(mode === "create" ? "Initial approval flow" : "");
    setUserSearch("");
  }, [isOpen, mode, version, workflow]);

  useEffect(() => {
    if (!isOpen || !companyId || !steps.some((step) => step.approverType === "specific_users")) return;
    const timer = window.setTimeout(() => {
      axios
        .get("/admin/users", { params: { companyId, page: 1, limit: 20, search: userSearch.trim() || undefined } })
        .then((response) => setUserOptions(response.data?.data?.users || []))
        .catch(() => setUserOptions([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [companyId, isOpen, steps, userSearch]);

  const validationError = useMemo(() => {
    if (mode === "create" && name.trim().length < 3) return "Workflow name must be at least 3 characters.";
    if (mode === "create" && code.trim().length < 2) return "Workflow code must be at least 2 characters.";
    if (!applicableTo.length) return "Select at least one request type.";
    if (!autoApprove && !steps.length) return "Add at least one approval level.";
    if (steps.some((step) => !step.name.trim())) return "Every approval level needs a name.";
    if (steps.some((step) => step.approverType === "specific_users" && !step.approverUserIds.length)) {
      return "Select at least one user for each specific-user level.";
    }
    if (mode !== "create" && changeReason.trim().length < 3) return "Describe why this version is changing.";
    return "";
  }, [applicableTo, autoApprove, changeReason, code, mode, name, steps]);

  const updateStep = (index: number, patch: Partial<ApprovalWorkflowStep>) => {
    setSteps((current) => normalizeSteps(current.map((step, itemIndex) =>
      itemIndex === index ? { ...step, ...patch } : step
    )));
  };

  const toggleRequestType = (requestType: ApprovalRequestType, checked: boolean) => {
    setApplicableTo((current) => checked
      ? Array.from(new Set([...current, requestType]))
      : current.filter((item) => item !== requestType));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    setSteps((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return normalizeSteps(next);
    });
  };

  const save = async (publish: boolean) => {
    if (validationError) {
      toast({ title: validationError, status: "warning", duration: 4000 });
      return;
    }
    const payload = {
      companyId,
      autoApprove,
      steps: autoApprove ? [] : normalizeSteps(steps),
      changeReason: changeReason.trim(),
    };
    try {
      let workflowId = workflow?._id || "";
      let versionId = version?._id || "";
      if (mode === "create") {
        const created = await workforcePolicyStore.createApprovalWorkflow({
          ...payload,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          applicableTo,
        });
        workflowId = created?.data?.workflow?._id;
        versionId = created?.data?.version?._id;
      } else if (mode === "new_version") {
        const created = await workforcePolicyStore.createApprovalWorkflowVersion(workflowId, payload);
        versionId = created?.data?._id;
      } else {
        await workforcePolicyStore.updateApprovalWorkflowDraft(workflowId, versionId, payload);
      }
      if (publish) {
        await workforcePolicyStore.publishApprovalWorkflowVersion(workflowId, versionId, {
          companyId,
          changeReason: changeReason.trim(),
        });
      }
      await onSaved();
      toast({ title: publish ? "Approval workflow published" : "Approval workflow draft saved", status: "success" });
      onClose();
    } catch (error: any) {
      toast({ title: error?.message || "Could not save approval workflow", status: "error", duration: 5000 });
    }
  };

  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      titlePrefix={mode === "create" ? "New" : mode === "new_version" ? "New version of" : "Edit"}
      titleSuffix={mode === "create" ? "approval workflow" : `${workflow?.name || "workflow"}${mode === 'edit_draft' ? ' draft' : ''}`}
      subtitle="Levels run in order. Request effects are applied only after the final level approves."
      maxW={{ base: "100%", md: "70%" }}
      footerContent={
        <Flex w="full" justify="flex-end" gap={3}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={() => save(false)} isLoading={workforcePolicyStore.submitting}>Save draft</Button>
          <Button colorScheme="blue" onClick={() => save(true)} isLoading={workforcePolicyStore.submitting} isDisabled={Boolean(validationError)}>Save and publish</Button>
        </Flex>
      }
    >
      <Stack spacing={6} maxW="900px" mx="auto">
        {mode !== "create" ? (
          <Alert status="info" borderRadius="md"><AlertIcon /><AlertDescription fontSize="sm">Published versions remain attached to historical requests.</AlertDescription></Alert>
        ) : null}
        <Box>
          <Text mb={3} fontSize="sm" fontWeight="800">Workflow identity</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired isDisabled={mode !== "create"}><FormLabel>Name</FormLabel><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Manager then HR" /></FormControl>
            <FormControl isRequired isDisabled={mode !== "create"}><FormLabel>Code</FormLabel><Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="MGR-HR" /></FormControl>
          </SimpleGrid>
          {mode === "create" ? <FormControl mt={4}><FormLabel>Description</FormLabel><Textarea value={description} onChange={(event) => setDescription(event.target.value)} /></FormControl> : null}
        </Box>
        <FormControl isDisabled={mode !== "create"}>
          <FormLabel>Used for</FormLabel>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            {REQUEST_TYPES.map((item) => (
              <Checkbox
                key={item.value}
                id={`approval-workflow-request-type-${item.value}`}
                name={`approval-workflow-request-type-${item.value}`}
                isChecked={applicableTo.includes(item.value)}
                isDisabled={mode !== "create"}
                onChange={(event) => toggleRequestType(item.value, event.target.checked)}
              >
                {item.label}
              </Checkbox>
            ))}
          </SimpleGrid>
        </FormControl>
        <FormControl display="flex" justifyContent="space-between" alignItems="center">
          <Box><FormLabel mb={0}>Auto approve</FormLabel><FormHelperText mt={0}>Use only when the request needs no human decision.</FormHelperText></Box>
          <Switch isChecked={autoApprove} onChange={(event) => setAutoApprove(event.target.checked)} />
        </FormControl>
        {!autoApprove ? (
          <Box>
            <Flex mb={3} justify="space-between" align="center">
              <Box><Text fontSize="sm" fontWeight="800">Approval levels</Text><Text fontSize="xs" color="gray.500">An approver cannot approve their own request.</Text></Box>
              <Button size="sm" leftIcon={<FiPlus />} onClick={() => setSteps((current) => [...current, emptyStep(current.length)])}>Add level</Button>
            </Flex>
            <Stack spacing={3}>
              {steps.map((step, index) => (
                <Box key={`${step.order}-${index}`} borderWidth="1px" borderRadius="md" p={4}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Text fontWeight="800">Level {index + 1}</Text>
                    <HStack spacing={1}>
                      <IconButton size="xs" variant="ghost" aria-label="Move level up" icon={<FiArrowUp />} isDisabled={index === 0} onClick={() => moveStep(index, -1)} />
                      <IconButton size="xs" variant="ghost" aria-label="Move level down" icon={<FiArrowDown />} isDisabled={index === steps.length - 1} onClick={() => moveStep(index, 1)} />
                      <IconButton size="xs" variant="ghost" colorScheme="red" aria-label="Remove level" icon={<FiTrash2 />} onClick={() => setSteps((current) => normalizeSteps(current.filter((_, itemIndex) => itemIndex !== index)))} />
                    </HStack>
                  </Flex>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired><FormLabel>Level name</FormLabel><Input value={step.name} onChange={(event) => updateStep(index, { name: event.target.value })} placeholder="Manager approval" /></FormControl>
                    <FormControl isRequired><FormLabel>Approver source</FormLabel><Select value={step.approverType} onChange={(event) => updateStep(index, { approverType: event.target.value as ApprovalStepType, approverUserIds: [] })}>{STEP_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></FormControl>
                  </SimpleGrid>
                  {step.approverType === "specific_users" ? (
                    <Box mt={4}>
                      <FormControl><FormLabel>Find users</FormLabel><Input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search by name, username, or code" /></FormControl>
                      <CheckboxGroup value={step.approverUserIds as string[]} onChange={(values) => updateStep(index, { approverUserIds: values as string[] })}>
                        <Stack mt={2} maxH="180px" overflowY="auto" borderWidth="1px" borderRadius="md" p={3}>
                          {userOptions.length ? userOptions.map((user) => <Checkbox key={user._id} value={user._id}>{user.name || user.username} <Text as="span" fontSize="xs" color="gray.500">{user.code || user.role}</Text></Checkbox>) : <Text fontSize="sm" color="gray.500">No matching users.</Text>}
                        </Stack>
                      </CheckboxGroup>
                    </Box>
                  ) : null}
                  <SimpleGrid mt={4} columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl><FormLabel>When multiple approvers resolve</FormLabel><Select value={step.approvalRule} onChange={(event) => updateStep(index, { approvalRule: event.target.value as "any" | "all" })}><option value="any">Any one can approve</option><option value="all">All must approve</option></Select></FormControl>
                    {step.approverType !== "hr" ? <FormControl display="flex" alignItems="center" pt={{ md: 8 }}><Checkbox isChecked={step.fallbackToHr} onChange={(event) => updateStep(index, { fallbackToHr: event.target.checked })}>Use scoped HR when this approver is missing</Checkbox></FormControl> : null}
                  </SimpleGrid>
                </Box>
              ))}
            </Stack>
          </Box>
        ) : null}
        <FormControl isRequired={mode !== "create"}><FormLabel>Change reason</FormLabel><Textarea value={changeReason} onChange={(event) => setChangeReason(event.target.value)} placeholder="Why this approval flow is changing" /></FormControl>
      </Stack>
    </DashboardDrawer>
  );
}
