"use client";

import { OrganizationNode } from "@/app/store/organizationStore/organizationStore";
import {
  Avatar,
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
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
  visibleIds: Set<string>;
  onSelect: (node: OrganizationNode) => void;
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

const OrganizationTree = ({ nodes, roots, visibleIds, onSelect }: Props) => {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const rowBg = useColorModeValue("white", "gray.800");
  const contextBg = useColorModeValue("gray.50", "gray.750");
  const muted = useColorModeValue("gray.600", "gray.400");
  const connectorColor = useColorModeValue("gray.200", "gray.600");

  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node._id, node])),
    [nodes]
  );
  const visibleRoots = useMemo(() => {
    const configuredRoots = roots.filter((rootId) => visibleIds.has(rootId));
    const additionalRoots = nodes
      .filter(
        (node) =>
          visibleIds.has(node._id) &&
          (!node.reportingManagerId || !visibleIds.has(node.reportingManagerId))
      )
      .map((node) => node._id);

    return Array.from(new Set([...configuredRoots, ...additionalRoots]));
  }, [nodes, roots, visibleIds]);

  const toggleNode = (nodeId: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (nodeId: string, path = new Set<string>()): React.ReactNode => {
    const node = nodeById.get(nodeId);
    if (!node || !visibleIds.has(nodeId) || path.has(nodeId)) {
      return null;
    }

    const nextPath = new Set(path);
    nextPath.add(nodeId);
    const childIds = node.directReportIds.filter((id) => visibleIds.has(id));
    const isCollapsed = collapsedIds.has(nodeId);

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
            {childIds.length > 0 ? (
              <Tooltip label={isCollapsed ? "Expand reports" : "Collapse reports"}>
                <IconButton
                  aria-label={isCollapsed ? `Expand ${node.name}` : `Collapse ${node.name}`}
                  icon={isCollapsed ? <ChevronRight size={17} /> : <ChevronDown size={17} />}
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleNode(nodeId)}
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

          <HStack spacing={2} flexWrap="wrap" justify={{ base: "space-between", md: "flex-end" }} w={{ base: "full", md: "auto" }}>
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

        {!isCollapsed && childIds.length > 0 ? (
          <Stack
            spacing={2}
            mt={2}
            ml={{ base: 4, md: 8 }}
            pl={{ base: 3, md: 5 }}
            borderLeftWidth="2px"
            borderColor={connectorColor}
          >
            {childIds.map((childId) => renderNode(childId, nextPath))}
          </Stack>
        ) : null}
      </Box>
    );
  };

  if (visibleRoots.length === 0) {
    return (
      <Box py={12} textAlign="center">
        <Text fontWeight="700">No matching organization records</Text>
        <Text mt={1} fontSize="sm" color={muted}>
          Adjust the search or filters to see reporting lines.
        </Text>
      </Box>
    );
  }

  return <Stack spacing={3}>{visibleRoots.map((rootId) => renderNode(rootId))}</Stack>;
};

export default OrganizationTree;

