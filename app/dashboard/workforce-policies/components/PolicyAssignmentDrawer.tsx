"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
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
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import {
  PolicyResourceType,
  PolicyScopeType,
  WorkforcePolicyAssignment,
  WorkforcePolicyItem,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";

const ALL_POLICY_RESOURCE_TYPES: PolicyResourceType[] = [
  "attendance_policy",
  "work_schedule",
  "holiday_calendar",
  "leave_policy",
  "remote_work_policy",
];

export type AssignmentScopeOption = {
  id: string;
  label: string;
  type: Exclude<PolicyScopeType, "company">;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  attendancePolicies: WorkforcePolicyItem[];
  workSchedules: WorkforcePolicyItem[];
  holidayCalendars: WorkforcePolicyItem[];
  leavePolicies?: WorkforcePolicyItem[];
  remoteWorkPolicies?: WorkforcePolicyItem[];
  allowedResourceTypes?: PolicyResourceType[];
  initialResourceType?: PolicyResourceType;
  initialResourceId?: string;
  scopeOptions: AssignmentScopeOption[];
  assignment?: WorkforcePolicyAssignment | null;
  onSaved: () => Promise<void> | void;
};

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function PolicyAssignmentDrawer({
  isOpen,
  onClose,
  companyId,
  attendancePolicies,
  workSchedules,
  holidayCalendars,
  leavePolicies = [],
  remoteWorkPolicies = [],
  allowedResourceTypes = ALL_POLICY_RESOURCE_TYPES,
  initialResourceType = "attendance_policy",
  initialResourceId = "",
  scopeOptions,
  assignment,
  onSaved,
}: Props) {
  const toast = useToast();
  const isEnding = Boolean(assignment?._id);
  const [resourceType, setResourceType] = useState<PolicyResourceType>(initialResourceType);
  const [resourceId, setResourceId] = useState("");
  const [scopeType, setScopeType] = useState<PolicyScopeType>("company");
  const [scopeId, setScopeId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayValue());
  const [effectiveTo, setEffectiveTo] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setResourceType(
      allowedResourceTypes.includes(initialResourceType)
        ? initialResourceType
        : allowedResourceTypes[0] || "attendance_policy"
    );
    setResourceId(isEnding ? "" : initialResourceId);
    setScopeType("company");
    setScopeId("");
    setEffectiveFrom(todayValue());
    setEffectiveTo(isEnding ? todayValue() : "");
    setReason("");
  }, [allowedResourceTypes, initialResourceId, initialResourceType, isEnding, isOpen]);

  const resources =
    resourceType === "attendance_policy"
      ? attendancePolicies
      : resourceType === "work_schedule"
        ? workSchedules
        : resourceType === "holiday_calendar"
          ? holidayCalendars
          : resourceType === "leave_policy"
            ? leavePolicies
            : remoteWorkPolicies;
  const availableResources = resources.filter((resource) => resource.latestPublishedVersion);
  const availableScopes = scopeOptions.filter((option) => option.type === scopeType);
  const validationError = useMemo(() => {
    if (isEnding) {
      if (!effectiveTo) return "Effective-to date is required.";
      if (reason.trim().length < 3) return "Enter a reason for ending the assignment.";
      return "";
    }
    if (!resourceId) return "Select a published configuration.";
    if (scopeType !== "company" && !scopeId) return `Select a ${scopeType}.`;
    if (!effectiveFrom) return "Effective-from date is required.";
    if (effectiveTo && effectiveTo <= effectiveFrom) return "Effective-to date must be after the start date.";
    if (reason.trim().length < 3) return "Enter an assignment reason.";
    return "";
  }, [effectiveFrom, effectiveTo, isEnding, reason, resourceId, scopeId, scopeType]);

  const save = async () => {
    if (validationError) {
      toast({ title: validationError, status: "warning", duration: 3500 });
      return;
    }
    try {
      if (isEnding && assignment) {
        await workforcePolicyStore.endAssignment(assignment._id, {
          companyId,
          effectiveTo,
          reason: reason.trim(),
        });
      } else {
        await workforcePolicyStore.createAssignment({
          companyId,
          resourceType,
          resourceId,
          scopeType,
          scopeId: scopeType === "company" ? null : scopeId,
          effectiveFrom,
          effectiveTo: effectiveTo || null,
          changeReason: reason.trim(),
        });
      }
      await onSaved();
      toast({
        title: isEnding ? "Policy assignment ended" : "Policy assignment created",
        status: "success",
        duration: 3000,
      });
      onClose();
    } catch (error: any) {
      toast({ title: error?.message || "Could not save assignment", status: "error", duration: 5000 });
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          <Text fontSize="lg" fontWeight="800">
            {isEnding ? "End policy assignment" : "Assign workforce policy"}
          </Text>
          <Text mt={1} fontSize="sm" fontWeight="400" color="gray.500">
            Assignments are effective-dated and remain available in employee history.
          </Text>
        </DrawerHeader>
        <DrawerBody py={5}>
          <Stack spacing={5}>
            {isEnding && assignment ? (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  Ending {typeof assignment.resource === "object" ? assignment.resource.name : "this policy"} for {assignment.scopeNameSnapshot} does not delete its historical use.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    A scope can have one overlapping assignment per configuration type. More specific employee, team, department, or location assignments override the company default.
                  </AlertDescription>
                </Alert>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Configuration type</FormLabel>
                  <Select
                    value={resourceType}
                    onChange={(event) => {
                      setResourceType(event.target.value as PolicyResourceType);
                      setResourceId("");
                    }}
                  >
                    {allowedResourceTypes.includes("attendance_policy") ? (
                      <option value="attendance_policy">Attendance policy</option>
                    ) : null}
                    {allowedResourceTypes.includes("work_schedule") ? (
                      <option value="work_schedule">Work schedule</option>
                    ) : null}
                    {allowedResourceTypes.includes("holiday_calendar") ? (
                      <option value="holiday_calendar">Holiday calendar</option>
                    ) : null}
                    {allowedResourceTypes.includes("leave_policy") ? (
                      <option value="leave_policy">Leave policy</option>
                    ) : null}
                    {allowedResourceTypes.includes("remote_work_policy") ? (
                      <option value="remote_work_policy">WFH policy</option>
                    ) : null}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Published configuration</FormLabel>
                  <Select value={resourceId} onChange={(event) => setResourceId(event.target.value)} placeholder="Select configuration">
                    {availableResources.map((resource) => (
                      <option key={resource._id} value={resource._id}>{resource.name} ({resource.code})</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Assignment scope</FormLabel>
                  <Select
                    value={scopeType}
                    onChange={(event) => {
                      setScopeType(event.target.value as PolicyScopeType);
                      setScopeId("");
                    }}
                  >
                    <option value="company">Company default</option>
                    <option value="location">Office location</option>
                    <option value="department">Department</option>
                    <option value="team">Team</option>
                    <option value="employee">Specific employee</option>
                  </Select>
                </FormControl>
                {scopeType !== "company" ? (
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">{scopeType.charAt(0).toUpperCase() + scopeType.slice(1)}</FormLabel>
                    <Select value={scopeId} onChange={(event) => setScopeId(event.target.value)} placeholder={`Select ${scopeType}`}>
                      {availableScopes.map((option) => <option key={`${option.type}-${option.id}`} value={option.id}>{option.label}</option>)}
                    </Select>
                  </FormControl>
                ) : null}
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Effective from</FormLabel>
                  <Input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} />
                </FormControl>
              </>
            )}

            <FormControl>
              <FormLabel fontSize="sm">{isEnding ? "Effective to" : "Effective to (optional)"}</FormLabel>
              <Input type="date" value={effectiveTo} onChange={(event) => setEffectiveTo(event.target.value)} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Reason</FormLabel>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder={isEnding ? "Why this assignment is ending" : "Why this configuration applies to this scope"} />
            </FormControl>
          </Stack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" gap={3}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button colorScheme={isEnding ? "orange" : "blue"} onClick={save} isLoading={workforcePolicyStore.submitting} isDisabled={Boolean(validationError)}>
            {isEnding ? "End assignment" : "Create assignment"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
