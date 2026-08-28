"use client";

import axios from "axios";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Skeleton,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { ApprovalWorkflowItem, ApprovalWorkflowVersion, workforcePolicyStore } from "@/app/store/workforcePolicyStore/workforcePolicyStore";

const STEP_LABELS: Record<string, string> = {
  reporting_manager: "Reporting manager",
  manager_manager: "Manager's manager",
  department_head: "Department head",
  hr: "Scoped HR queue",
  specific_users: "Specific users",
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  workflow: ApprovalWorkflowItem | null;
  canManage: boolean;
  onSaved: () => Promise<void> | void;
};

export default function ApprovalWorkflowHistoryDrawer({ isOpen, onClose, companyId, workflow, canManage, onSaved }: Props) {
  const toast = useToast();
  const [versions, setVersions] = useState<ApprovalWorkflowVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [archiveReason, setArchiveReason] = useState("");

  useEffect(() => {
    if (!isOpen || !workflow?._id) return;
    setLoading(true);
    setError("");
    setArchiveReason("");
    axios
      .get(`/approval-workflows/${workflow._id}`, { params: { companyId } })
      .then((response) => setVersions(response.data?.data?.versions || []))
      .catch((requestError) => setError(requestError?.response?.data?.message || "Could not load workflow history"))
      .finally(() => setLoading(false));
  }, [companyId, isOpen, workflow?._id]);

  const archive = async () => {
    if (!workflow || archiveReason.trim().length < 3) {
      toast({ title: "Enter an archive reason", status: "warning" });
      return;
    }
    try {
      await workforcePolicyStore.archiveApprovalWorkflow(workflow._id, { companyId, reason: archiveReason.trim() });
      await onSaved();
      toast({ title: "Approval workflow archived", status: "success" });
      onClose();
    } catch (archiveError: any) {
      toast({ title: archiveError?.message || "Could not archive workflow", status: "error" });
    }
  };

  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      titlePrefix=""
      titleSuffix={workflow?.name || "Approval workflow"}
      subtitle={`${workflow?.code} version history`}
      maxW={{ base: "100%", md: "50%" }}
      footerContent={
        <Button variant="ghost" onClick={onClose}>Close</Button>
      }
    >
      {loading ? <Stack spacing={3}><Skeleton h="100px" /><Skeleton h="100px" /></Stack> : error ? <Alert status="error"><AlertIcon /><AlertDescription>{error}</AlertDescription></Alert> : (
        <Stack spacing={4}>
          {versions.map((version) => (
            <Box key={version._id} borderWidth="1px" borderRadius="md" p={4}>
              <HStack justify="space-between" align="start">
                <Box><Text fontWeight="800">Version {version.versionNumber}</Text><Text fontSize="xs" color="gray.500">{version.changeReason || "No change reason recorded"}</Text></Box>
                <Badge colorScheme={version.status === "published" ? "green" : version.status === "draft" ? "yellow" : "gray"}>{version.status}</Badge>
              </HStack>
              {version.autoApprove ? <Text mt={3} fontSize="sm">Automatic approval, no human levels.</Text> : (
                <Stack mt={3} spacing={2}>
                  {version.steps.map((step) => (
                    <HStack key={`${version._id}-${step.order}`} align="start">
                      <Badge colorScheme="blue">{step.order}</Badge>
                      <Box><Text fontSize="sm" fontWeight="700">{step.name}</Text><Text fontSize="xs" color="gray.500">{STEP_LABELS[step.approverType] || step.approverType} - {step.approvalRule === "all" ? "all must approve" : "any one can approve"}{step.fallbackToHr ? " - HR fallback" : ""}</Text></Box>
                    </HStack>
                  ))}
                </Stack>
              )}
            </Box>
          ))}
          {!versions.length ? <Text color="gray.500">No versions found.</Text> : null}
          {canManage && workflow?.status === "active" ? (
            <Box borderTopWidth="1px" pt={5}>
              <Text fontWeight="800" fontSize="sm">Archive workflow</Text>
              <Text mt={1} fontSize="xs" color="gray.500">Existing request snapshots remain unchanged. Archived workflows cannot be selected by newly published policies.</Text>
              <FormControl mt={3}><FormLabel>Archive reason</FormLabel><Input value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} placeholder="Why this flow is being retired" /></FormControl>
              <Button mt={3} size="sm" colorScheme="red" variant="outline" onClick={archive} isLoading={workforcePolicyStore.submitting}>Archive workflow</Button>
            </Box>
          ) : null}
        </Stack>
      )}
    </DashboardDrawer>
  );
}
