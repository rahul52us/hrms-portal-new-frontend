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
  Flex,
  HStack,
  IconButton,
  Spinner,
  Stack,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronDown, ChevronRight, Eye, Users } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  nodes: OrganizationNode[];
  roots: string[];
  rootPageInfo: OrganizationPageInfo;
  childrenPageInfo: Record<string, OrganizationPageInfo>;
  loadingChildrenIds: string[];
  isLoadingRoots: boolean;
  onLoadChildren: (_managerId: string, _append?: boolean) => Promise<void>;
  onLoadMoreRoots: () => Promise<void>;
  onSelect: (_node: OrganizationNode) => void;
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

const OrganizationTree = ({
  nodes,
  roots,
  rootPageInfo,
  childrenPageInfo,
  loadingChildrenIds,
  isLoadingRoots,
  onLoadChildren,
  onLoadMoreRoots,
  onSelect,
}: Props) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const rowBg = useColorModeValue("white", "gray.800");
  const contextBg = useColorModeValue("gray.50", "gray.750");
  const muted = useColorModeValue("gray.600", "gray.400");
  const connectorColor = useColorModeValue("gray.200", "gray.600");

  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node._id, node])),
    [nodes]
  );

  const toggleNode = (node: OrganizationNode) => {
    if (expandedIds.has(node._id)) {
      setExpandedIds((current) => {
        const next = new Set(current);
        next.delete(node._id);
        return next;
      });
      return;
    }

    setExpandedIds((current) => new Set(current).add(node._id));
    if (node.directReportCount > 0 && !childrenPageInfo[node._id]) {
      onLoadChildren(node._id).catch(() => undefined);
    }
  };

  const renderNode = (nodeId: string, path = new Set<string>()): React.ReactNode => {
    const node = nodeById.get(nodeId);
    if (!node || path.has(nodeId)) {
      return null;
    }

    const nextPath = new Set(path);
    nextPath.add(nodeId);
    const childIds = node.directReportIds.filter((id) => nodeById.has(id));
    const isExpanded = expandedIds.has(nodeId);
    const isLoadingChildren = loadingChildrenIds.includes(nodeId);
    const childPage = childrenPageInfo[nodeId];

    return (
      <Box key={nodeId}>
        <Flex
          align={{ base: "flex-start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={3}
          bg={node.isContextOnly ? contextBg : rowBg}
          borderWidth="1px"
          borderColor={node.hasHierarchyIssue ? "orange.300" : borderColor}
          borderRadius="md"
          px={{ base: 3, md: 4 }}
          py={3}
        >
          <HStack spacing={3} flex="1" minW={0} w="full">
            {node.directReportCount > 0 ? (
              <Tooltip label={isExpanded ? "Collapse reports" : "Load direct reports"}>
                <IconButton
                  aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
                  icon={
                    isLoadingChildren ? (
                      <Spinner size="xs" />
                    ) : isExpanded ? (
                      <ChevronDown size={17} />
                    ) : (
                      <ChevronRight size={17} />
                    )
                  }
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleNode(node)}
                />
              </Tooltip>
            ) : (
              <Box w="32px" flexShrink={0} />
            )}

            <Avatar size="sm" name={node.name} src={node.pic?.url || undefined} />
            <Box minW={0}>
              <HStack spacing={2} flexWrap="wrap">
                <Text fontWeight="700" noOfLines={1}>
                  {node.name}
                </Text>
                {node.isContextOnly ? (
                  <Badge colorScheme="gray" variant="subtle">
                    Context
                  </Badge>
                ) : null}
                {node.hasHierarchyIssue ? (
                  <Badge colorScheme="orange" variant="subtle">
                    Review hierarchy
                  </Badge>
                ) : null}
              </HStack>
              <Text fontSize="sm" color={muted} noOfLines={1}>
                {[node.designation, node.department, node.team].filter(Boolean).join(" - ") ||
                  roleLabel(node.role)}
              </Text>
            </Box>
          </HStack>

          <HStack
            spacing={2}
            flexWrap="wrap"
            justify={{ base: "space-between", md: "flex-end" }}
            w={{ base: "full", md: "auto" }}
          >
            <Badge colorScheme="blue" variant="subtle">
              {roleLabel(node.role)}
            </Badge>
            {node.isManager ? (
              <HStack spacing={1} color={muted}>
                <Users size={15} />
                <Text fontSize="sm" fontWeight="700">
                  {node.directReportCount} direct
                </Text>
              </HStack>
            ) : null}
            <Tooltip label={`View ${node.name}`}>
              <IconButton
                aria-label={`View ${node.name}`}
                icon={<Eye size={17} />}
                variant="ghost"
                size="sm"
                onClick={() => onSelect(node)}
              />
            </Tooltip>
          </HStack>
        </Flex>

        {isExpanded ? (
          <Stack
            spacing={2}
            mt={2}
            ml={{ base: 4, md: 8 }}
            pl={{ base: 3, md: 5 }}
            borderLeftWidth="2px"
            borderColor={connectorColor}
          >
            {childIds.map((childId) => renderNode(childId, nextPath))}
            {isLoadingChildren && childIds.length === 0 ? (
              <HStack py={3} color={muted}>
                <Spinner size="sm" />
                <Text fontSize="sm">Loading direct reports...</Text>
              </HStack>
            ) : null}
            {childPage?.hasNextPage ? (
              <Button
                alignSelf="flex-start"
                size="sm"
                variant="outline"
                isLoading={isLoadingChildren}
                onClick={() => onLoadChildren(nodeId, true).catch(() => undefined)}
              >
                Load more direct reports
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Box>
    );
  };

  if (roots.length === 0) {
    return (
      <Box py={12} textAlign="center">
        <Text fontWeight="700">No organization roots found</Text>
        <Text mt={1} fontSize="sm" color={muted}>
          Assign reporting managers or review hierarchy issues to build the chart.
        </Text>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {roots.map((rootId) => renderNode(rootId))}
      {rootPageInfo.hasNextPage ? (
        <Center pt={2}>
          <Button variant="outline" isLoading={isLoadingRoots} onClick={onLoadMoreRoots}>
            Load more top-level employees
          </Button>
        </Center>
      ) : null}
    </Stack>
  );
};

export default OrganizationTree;
