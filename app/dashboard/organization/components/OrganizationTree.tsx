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
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { Tree, TreeNode } from "react-organizational-chart";

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

function getDepartmentColor(dept?: string, role?: string) {
  const str = (dept || role || "").toLowerCase();
  if (str.includes("hr") || str.includes("human")) return "purple";
  if (str.includes("sale")) return "yellow";
  if (str.includes("admin")) return "green";
  if (str.includes("finance")) return "yellow";
  if (str.includes("tech") || str.includes("dev") || str.includes("soft")) return "blue";
  return "gray";
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
  
  // Use CSS variables for the line color so it adapts to light/dark mode in the library
  const connectorColor = useColorModeValue("var(--chakra-colors-blue-300)", "var(--chakra-colors-blue-700)");
  
  const hoverShadow = useColorModeValue(
    "0 10px 20px -5px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)",
    "0 10px 20px -5px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)"
  );
  const hoverBorder = useColorModeValue("blue.200", "blue.600");

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

    const deptColor = getDepartmentColor(node.department, node.role);

    const labelContent = (
      <Flex direction="column" align="center" display="inline-flex" m={2} position="relative" maxW="260px">
        {/* Department Badge above the card */}
        {node.department && (
          <Box
            mb={6}
            px={4}
            py={1}
            borderRadius="full"
            borderWidth="2px"
            borderColor={useColorModeValue(`${deptColor}.400`, `${deptColor}.300`)}
            bg="white"
            color={useColorModeValue(`${deptColor}.600`, `${deptColor}.200`)}
            fontWeight="bold"
            fontSize="xs"
            boxShadow="sm"
            whiteSpace="nowrap"
            position="relative"
            zIndex={2}
          >
            {node.department}
            {/* Small line connecting badge to card */}
            <Box position="absolute" bottom="-24px" left="50%" transform="translateX(-50%)" w="2px" h="24px" bg={connectorColor} borderStyle="dashed" zIndex={1} />
          </Box>
        )}

        {/* The White Card */}
        <Box
          w="260px"
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderBottomWidth="4px"
          borderBottomColor={useColorModeValue(`${deptColor === 'gray' ? 'blue' : deptColor}.500`, `${deptColor === 'gray' ? 'blue' : deptColor}.300`)}
          borderRadius="lg"
          p={3}
          pb={1}
          boxShadow="sm"
          position="relative"
          zIndex={2}
          transition="all 0.2s"
          _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
          cursor="pointer"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node);
          }}
        >
          <Flex align="flex-start" gap={3}>
            <Avatar size="md" name={node.name} src={node.pic?.url || undefined} borderRadius="md" bg="white" color="gray.400" border="1px solid" borderColor="gray.200" />
            <Box textAlign="left" minW={0} flex={1}>
              <Text fontSize="sm" fontWeight="700" color="gray.800" noOfLines={1} lineHeight={1.2} mb={1}>
                {node.name}
              </Text>
              <Text fontSize="xs" color="gray.600" noOfLines={1}>
                {node.designation || roleLabel(node.role)}
              </Text>
              <Text fontSize="10px" color="gray.500" noOfLines={1}>
                3 Years 11 Months
              </Text>
            </Box>
          </Flex>

          {node.directReportCount > 0 && (
            <Center mt={1}>
              <Box
                as="button"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  toggleNode(node);
                }}
                color="gray.400"
                _hover={{ color: "gray.600" }}
                transition="all 0.2s"
              >
                {isLoadingChildren ? <Spinner size="xs" /> : isExpanded ? <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /> : <ChevronDown size={14} />}
              </Box>
            </Center>
          )}
        </Box>
      </Flex>
    );

    if (!isExpanded || childIds.length === 0) {
      return <TreeNode key={nodeId} label={labelContent} />;
    }

    return (
      <TreeNode key={nodeId} label={labelContent}>
        {childIds.map((childId) => renderNode(childId, nextPath))}
        
        {isLoadingChildren && childIds.length === 0 && (
          <TreeNode label={<Spinner size="md" color="blue.500" m={4} />} />
        )}
        
        {childPage?.hasNextPage && (
          <TreeNode label={
            <Button
              size="sm"
              variant="outline"
              m={4}
              isLoading={isLoadingChildren}
              onClick={() => onLoadChildren(nodeId, true).catch(() => undefined)}
            >
              Load more reports
            </Button>
          } />
        )}
      </TreeNode>
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
    <Box overflowX="auto" pb={8} pt={4} className="customScrollBar" minH="500px">
      <Center minW="min-content">
        <Tree
          lineWidth="2px"
          lineColor={connectorColor}
          lineBorderRadius="8px"
          lineStyle="dashed"
          label={
          <Box px={6} py={1.5} borderRadius="full" borderWidth="1.5px" borderColor="purple.400" bg="white" color="purple.500" fontWeight="600" fontSize="sm" mb={4} boxShadow="sm">
              Company Organization
            </Box>
          }
        >
          {roots.map((rootId) => renderNode(rootId))}
          
          {rootPageInfo.hasNextPage && (
            <TreeNode label={
              <Button mt={4} variant="outline" isLoading={isLoadingRoots} onClick={onLoadMoreRoots}>
                Load more top-level employees
              </Button>
            } />
          )}
        </Tree>
      </Center>
    </Box>
  );
};

export default OrganizationTree;
