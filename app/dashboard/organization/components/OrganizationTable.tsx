"use client";

import {
  OrganizationNode,
  OrganizationPageInfo,
} from "@/app/store/organizationStore/organizationStore";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  HStack,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Spinner,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import { Eye } from "lucide-react";

type Props = {
  nodes: OrganizationNode[];
  emptyTitle: string;
  emptyDescription: string;
  onSelect: (_node: OrganizationNode) => void;
  pageInfo?: OrganizationPageInfo;
  isLoading?: boolean;
  onLoadMore?: () => void;
};

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    user: "Employee",
    departmenthead: "Department Head",
    hradmin: "HR Admin",
    hr: "HR",
  };

  return labels[role] || role || "Employee";
}

const OrganizationTable = ({
  nodes,
  emptyTitle,
  emptyDescription,
  onSelect,
  pageInfo,
  isLoading = false,
  onLoadMore,
}: Props) => {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  if (isLoading && nodes.length === 0) {
    return (
      <Center py={12}>
        <HStack color={muted}>
          <Spinner size="sm" />
          <Text fontSize="sm">Loading organization records...</Text>
        </HStack>
      </Center>
    );
  }

  if (nodes.length === 0) {
    return (
      <Box py={12} textAlign="center">
        <Text fontWeight="700">{emptyTitle}</Text>
        <Text mt={1} fontSize="sm" color={muted}>
          {emptyDescription}
        </Text>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Employee</Th>
            <Th>Organization</Th>
            <Th>Reports</Th>
            <Th>Reports To</Th>
            <Th>Status</Th>
            <Th textAlign="right">Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {nodes.map((node) => (
            <Tr key={node._id} _hover={{ bg: hoverBg }}>
              <Td borderColor={borderColor}>
                <HStack spacing={3} minW="220px">
                  <Avatar size="sm" name={node.name} src={node.pic?.url || undefined} />
                  <Box minW={0}>
                    <HStack spacing={2}>
                      <Text fontWeight="700" noOfLines={1}>
                        {node.name}
                      </Text>
                      {node.isContextOnly ? (
                        <Badge colorScheme="gray" variant="subtle">
                          Context
                        </Badge>
                      ) : null}
                    </HStack>
                    <Text fontSize="xs" color={muted} noOfLines={1}>
                      {node.email || node.designation || roleLabel(node.role)}
                    </Text>
                  </Box>
                </HStack>
              </Td>
              <Td borderColor={borderColor}>
                <Text fontWeight="600">{node.department || "No department"}</Text>
                <Text fontSize="xs" color={muted}>
                  {[node.team, node.officeLocation?.name].filter(Boolean).join(" - ") ||
                    roleLabel(node.role)}
                </Text>
              </Td>
              <Td borderColor={borderColor}>
                <Text fontWeight="700">{node.directReportCount} direct</Text>
                <Text fontSize="xs" color={muted}>
                  {node.totalReportCount === null
                    ? "Load details for total"
                    : `${node.totalReportCount} total`}
                </Text>
              </Td>
              <Td borderColor={borderColor}>
                <Text fontWeight="600">{node.reportingManager?.name || "Top level"}</Text>
                <Text fontSize="xs" color={muted}>
                  {node.reportingManager?.designation || "No reporting manager"}
                </Text>
              </Td>
              <Td borderColor={borderColor}>
                <Badge
                  colorScheme={
                    node.status === "active"
                      ? "green"
                      : node.status === "inactive"
                        ? "red"
                        : "orange"
                  }
                  variant="subtle"
                >
                  {node.status}
                </Badge>
              </Td>
              <Td borderColor={borderColor} textAlign="right">
                <Tooltip label={`View ${node.name}`}>
                  <IconButton
                    aria-label={`View ${node.name}`}
                    icon={<Eye size={17} />}
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelect(node)}
                  />
                </Tooltip>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {pageInfo?.hasNextPage && onLoadMore ? (
        <Center py={4}>
          <Button size="sm" variant="outline" isLoading={isLoading} onClick={onLoadMore}>
            Load more
          </Button>
        </Center>
      ) : null}
    </TableContainer>
  );
};

export default OrganizationTable;
