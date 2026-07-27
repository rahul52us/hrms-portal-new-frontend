"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import {
  OrganizationNode,
} from "@/app/store/organizationStore/organizationStore";
import stores from "@/app/store/stores";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import {
  AlertTriangle,
  Building2,
  Network,
  RefreshCw,
  Search,
  UserRoundSearch,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import OrganizationPersonDrawer from "./components/OrganizationPersonDrawer";
import OrganizationTable from "./components/OrganizationTable";
import OrganizationTree from "./components/OrganizationTree";

type Filters = {
  search: string;
  department: string;
  team: string;
  locationId: string;
};

const emptyFilters: Filters = {
  search: "",
  department: "",
  team: "",
  locationId: "",
};

function nodeMatchesFilters(node: OrganizationNode, filters: Filters) {
  const search = filters.search.trim().toLowerCase();
  const matchesSearch =
    !search ||
    [
      node.name,
      node.email,
      node.code,
      node.profileId,
      node.designation,
      node.department,
      node.team,
      node.officeLocation?.name,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));

  return (
    matchesSearch &&
    (!filters.department || node.department === filters.department) &&
    (!filters.team || node.team === filters.team) &&
    (!filters.locationId || node.officeLocation?._id === filters.locationId)
  );
}

const OrganizationWorkspace = observer(() => {
  const { auth, companyStore, organizationStore } = stores;
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [selectedNode, setSelectedNode] = useState<OrganizationNode | null>(null);
  const drawer = useDisclosure();
  const role = String(auth.userType || auth.user?.role || "").toLowerCase();
  const isSuperadmin = role === "superadmin";
  const canViewOrganization = hasPermission(auth.user, PERMISSION_KEYS.VIEW_USERS);
  const canAssignManagers = hasPermission(auth.user, PERMISSION_KEYS.ASSIGN_MANAGERS);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const panelBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.600", "gray.400");

  useEffect(() => {
    if (isSuperadmin) {
      companyStore.getManagedCompanies().catch(() => undefined);
      return;
    }

    companyStore.initializeCompanyContext();
  }, [companyStore, isSuperadmin]);

  const companyId = companyStore.getActiveCompanyId();

  useEffect(() => {
    setFilters(emptyFilters);
    setSelectedNode(null);

    if (companyId && canViewOrganization) {
      organizationStore.fetchOrganization(companyId).catch(() => undefined);
    } else {
      organizationStore.clear();
    }
  }, [canViewOrganization, companyId, organizationStore]);

  const data = organizationStore.data;
  const hasActiveFilters = Boolean(
    filters.search || filters.department || filters.team || filters.locationId
  );
  const filteredPrimaryNodes = useMemo(
    () =>
      data.nodes.filter(
        (node) => !node.isContextOnly && nodeMatchesFilters(node, filters)
      ),
    [data.nodes, filters]
  );
  const visibleTreeIds = useMemo(() => {
    if (!hasActiveFilters) {
      return new Set(data.nodes.map((node) => node._id));
    }

    const ids = new Set<string>();
    const nodeById = new Map(data.nodes.map((node) => [node._id, node]));

    filteredPrimaryNodes.forEach((node) => {
      ids.add(node._id);
      let managerId = node.reportingManagerId;
      const visited = new Set<string>();

      while (managerId && !visited.has(managerId)) {
        visited.add(managerId);
        const manager = nodeById.get(managerId);
        if (!manager) {
          break;
        }

        ids.add(managerId);
        managerId = manager.reportingManagerId;
      }
    });

    return ids;
  }, [data.nodes, filteredPrimaryNodes, hasActiveFilters]);
  const managerNodes = useMemo(
    () =>
      data.nodes
        .filter((node) => node.isManager && nodeMatchesFilters(node, filters))
        .sort(
          (left, right) =>
            right.directReportCount - left.directReportCount ||
            left.name.localeCompare(right.name)
        ),
    [data.nodes, filters]
  );
  const unassignedNodes = useMemo(
    () =>
      filteredPrimaryNodes
        .filter((node) => node.isUnassigned)
        .sort((left, right) => left.name.localeCompare(right.name)),
    [filteredPrimaryNodes]
  );

  const openNode = (node: OrganizationNode) => {
    setSelectedNode(node);
    drawer.onOpen();
  };

  const refreshOrganization = async () => {
    if (!companyId) {
      return;
    }

    const nextData = await organizationStore.fetchOrganization(companyId);
    if (selectedNode && nextData?.nodes) {
      const refreshedNode =
        nextData.nodes.find((node: OrganizationNode) => node._id === selectedNode._id) ||
        null;
      setSelectedNode(refreshedNode);
    }
  };

  const StatCard = ({
    icon,
    label,
    value,
    tone,
  }: {
    icon: any;
    label: string;
    value: number;
    tone: "blue" | "green" | "orange" | "gray";
  }) => (
    <Flex
      align="center"
      gap={3}
      bg={panelBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
    >
      <Center
        w={10}
        h={10}
        borderRadius="md"
        bg={`${tone}.50`}
        color={`${tone}.600`}
        flexShrink={0}
      >
        <Icon as={icon} boxSize={5} />
      </Center>
      <Box minW={0}>
        <Text fontSize="xs" fontWeight="700" color={muted} textTransform="uppercase">
          {label}
        </Text>
        <Text fontSize="xl" fontWeight="800" color={headingColor}>
          {value}
        </Text>
      </Box>
    </Flex>
  );

  return (
    <PermissionGate
      allowed={canViewOrganization}
      title="Organization module is disabled"
      description="This account does not currently have access to employee organization data."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100dvh" bg={pageBg} px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
        <Stack spacing={5}>
          <Flex
            direction={{ base: "column", lg: "row" }}
            justify="space-between"
            align={{ base: "stretch", lg: "center" }}
            gap={4}
          >
            <Box>
              <HStack spacing={2} mb={1}>
                <Heading size="lg" color={headingColor}>
                  Organization
                </Heading>
                {data.scope?.mode && data.scope.mode !== "company" ? (
                  <Badge colorScheme="blue" variant="subtle">
                    Scoped view
                  </Badge>
                ) : null}
              </HStack>
              <Text color={muted}>
                Reporting structure for {data.company?.name || "the selected company"}
              </Text>
            </Box>

            <Button
              leftIcon={<RefreshCw size={17} />}
              variant="outline"
              isLoading={organizationStore.isLoading}
              isDisabled={!companyId}
              onClick={() => refreshOrganization().catch(() => undefined)}
            >
              Refresh
            </Button>
          </Flex>

          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={3}>
            <StatCard icon={Users} label="People" value={data.summary.totalPeople} tone="blue" />
            <StatCard icon={Network} label="Managers" value={data.summary.managerCount} tone="green" />
            <StatCard
              icon={UserRoundSearch}
              label="Top-level / unassigned"
              value={data.summary.unassignedCount}
              tone="orange"
            />
            <StatCard
              icon={AlertTriangle}
              label="Hierarchy issues"
              value={data.summary.hierarchyIssueCount}
              tone="gray"
            />
          </SimpleGrid>

          <Box
            bg={panelBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
            p={{ base: 3, md: 4 }}
          >
            <Stack spacing={3}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Search size={17} color="currentColor" />
                </InputLeftElement>
                <Input
                  value={filters.search}
                  placeholder="Search name, designation, department, team, or location"
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                />
              </InputGroup>

              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
                <Select
                  value={filters.department}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      department: event.target.value,
                    }))
                  }
                >
                  <option value="">All departments</option>
                  {data.filters.departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </Select>
                <Select
                  value={filters.team}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      team: event.target.value,
                    }))
                  }
                >
                  <option value="">All teams</option>
                  {data.filters.teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </Select>
                <Select
                  value={filters.locationId}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      locationId: event.target.value,
                    }))
                  }
                >
                  <option value="">All locations</option>
                  {data.filters.locations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="outline"
                  isDisabled={!hasActiveFilters}
                  onClick={() => setFilters(emptyFilters)}
                >
                  Reset filters
                </Button>
              </SimpleGrid>
            </Stack>
          </Box>

          {organizationStore.error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Organization data could not be loaded</AlertTitle>
                <AlertDescription>{organizationStore.error}</AlertDescription>
              </Box>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refreshOrganization().catch(() => undefined)}
              >
                Retry
              </Button>
            </Alert>
          ) : null}

          {!companyId ? (
            <Box
              bg={panelBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              py={16}
              textAlign="center"
            >
              <Icon as={Building2} boxSize={8} color={muted} />
              <Text mt={3} fontWeight="800">
                Select a company
              </Text>
              <Text mt={1} fontSize="sm" color={muted}>
                Choose a company from the header to view its organization.
              </Text>
            </Box>
          ) : organizationStore.isLoading && data.nodes.length === 0 ? (
            <Center
              minH="320px"
              bg={panelBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
            >
              <Stack align="center" spacing={3}>
                <Spinner color="blue.500" />
                <Text color={muted}>Loading organization structure...</Text>
              </Stack>
            </Center>
          ) : (
            <Box
              bg={panelBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              overflow="hidden"
            >
              <Tabs colorScheme="blue" isLazy>
                <TabList px={{ base: 2, md: 4 }} overflowX="auto" overflowY="hidden">
                  <Tab whiteSpace="nowrap">Org Chart</Tab>
                  <Tab whiteSpace="nowrap">Managers ({managerNodes.length})</Tab>
                  <Tab whiteSpace="nowrap">
                    Top-level / Unassigned ({unassignedNodes.length})
                  </Tab>
                </TabList>
                <TabPanels>
                  <TabPanel p={{ base: 3, md: 5 }}>
                    <OrganizationTree
                      nodes={data.nodes}
                      roots={data.roots}
                      visibleIds={visibleTreeIds}
                      onSelect={openNode}
                    />
                  </TabPanel>
                  <TabPanel p={0}>
                    <OrganizationTable
                      nodes={managerNodes}
                      emptyTitle="No matching managers"
                      emptyDescription="Managers appear automatically when employees report to them."
                      onSelect={openNode}
                    />
                  </TabPanel>
                  <TabPanel p={0}>
                    <OrganizationTable
                      nodes={unassignedNodes}
                      emptyTitle="Everyone has a reporting manager"
                      emptyDescription="No top-level or unassigned employees match the current filters."
                      onSelect={openNode}
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          )}
        </Stack>
      </Box>

      <OrganizationPersonDrawer
        node={selectedNode}
        nodes={data.nodes}
        companyId={companyId || ""}
        isOpen={drawer.isOpen}
        canAssignManagers={canAssignManagers}
        onClose={() => {
          drawer.onClose();
          setSelectedNode(null);
        }}
        onHierarchyUpdated={refreshOrganization}
      />
    </PermissionGate>
  );
});

export default OrganizationWorkspace;

