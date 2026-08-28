"use client";

import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  Skeleton,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { ApprovalWorkflowItem, ApprovalWorkflowVersion, workforcePolicyStore } from "@/app/store/workforcePolicyStore/workforcePolicyStore";

const REQUEST_LABELS: Record<string, string> = {
  leave_request: "Leave",
  remote_work_request: "WFH",
  comp_off_claim: "Comp-off",
};

type Props = {
  canManage: boolean;
  borderColor: string;
  muted: string;
  tableHeadBg: string;
  onEdit: (
    mode: "create" | "edit_draft" | "new_version",
    workflow?: ApprovalWorkflowItem | null,
    version?: ApprovalWorkflowVersion | null
  ) => void;
  onHistory: (workflow: ApprovalWorkflowItem) => void;
};

export default function ApprovalWorkflowsPanel({ canManage, borderColor, muted, tableHeadBg, onEdit, onHistory }: Props) {
  const items = workforcePolicyStore.approvalWorkflows;
  if (workforcePolicyStore.loading) {
    return <Stack spacing={3}><Skeleton h="72px" /><Skeleton h="72px" /><Skeleton h="72px" /></Stack>;
  }
  if (!items.length) {
    return (
      <Center borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md" py={12}>
        <Stack align="center" spacing={3}>
          <Text color={muted}>No approval workflows found.</Text>
          {canManage ? <Button size="sm" onClick={() => onEdit("create")}>Create first workflow</Button> : null}
        </Stack>
      </Center>
    );
  }

  return (
    <>
      <TableContainer display={{ base: "none", md: "block" }} borderWidth="1px" borderColor={borderColor} borderRadius="md">
        <Table size="sm">
          <Thead bg={tableHeadBg}><Tr><Th>Workflow</Th><Th>Request types</Th><Th>Published flow</Th><Th>Status</Th><Th textAlign="right">Actions</Th></Tr></Thead>
          <Tbody>
            {items.map((item) => {
              const published = item.latestPublishedVersion;
              return (
                <Tr key={item._id}>
                  <Td><Text fontWeight="700">{item.name}</Text><Text fontSize="xs" color={muted}>{item.code}</Text></Td>
                  <Td><HStack spacing={1} flexWrap="wrap">{item.applicableTo.map((type) => <Badge key={type} colorScheme="blue">{REQUEST_LABELS[type] || type}</Badge>)}</HStack></Td>
                  <Td>
                    {published ? (
                      <><Text fontWeight="600">v{published.versionNumber}</Text><Text fontSize="xs" color={muted}>{published.autoApprove ? "Automatic approval" : `${published.steps.length} approval level${published.steps.length === 1 ? "" : "s"}`}</Text></>
                    ) : <Badge colorScheme="orange">Draft only</Badge>}
                    {item.draftVersion ? <Badge ml={2} colorScheme="yellow">Draft v{item.draftVersion.versionNumber}</Badge> : null}
                  </Td>
                  <Td><Badge colorScheme={item.status === "active" ? "green" : "gray"}>{item.status}</Badge></Td>
                  <Td><HStack justify="flex-end">
                    <Button size="xs" variant="ghost" onClick={() => onHistory(item)}>History</Button>
                    {canManage && item.status === "active" ? item.draftVersion ? (
                      <Button size="xs" onClick={() => onEdit("edit_draft", item, item.draftVersion)}>Edit draft</Button>
                    ) : (
                      <Button size="xs" onClick={() => onEdit("new_version", item, published || null)}>New version</Button>
                    ) : null}
                  </HStack></Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
      <Stack display={{ base: "flex", md: "none" }} spacing={3}>
        {items.map((item) => (
          <Box key={item._id} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
            <HStack justify="space-between" align="start"><Box><Text fontWeight="800">{item.name}</Text><Text fontSize="xs" color={muted}>{item.code}</Text></Box><Badge colorScheme={item.status === "active" ? "green" : "gray"}>{item.status}</Badge></HStack>
            <HStack mt={3} spacing={1} flexWrap="wrap">{item.applicableTo.map((type) => <Badge key={type} colorScheme="blue">{REQUEST_LABELS[type] || type}</Badge>)}</HStack>
            <Text mt={3} fontSize="sm">{item.latestPublishedVersion ? `Published v${item.latestPublishedVersion.versionNumber}` : "No published version"}</Text>
            <HStack mt={3}><Button size="xs" variant="outline" onClick={() => onHistory(item)}>History</Button>{canManage && item.status === "active" ? <Button size="xs" onClick={() => item.draftVersion ? onEdit("edit_draft", item, item.draftVersion) : onEdit("new_version", item, item.latestPublishedVersion || null)}>{item.draftVersion ? "Edit draft" : "New version"}</Button> : null}</HStack>
          </Box>
        ))}
      </Stack>
    </>
  );
}
