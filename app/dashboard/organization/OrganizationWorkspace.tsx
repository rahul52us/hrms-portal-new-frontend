"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import {
  OrganizationFilters,
  OrganizationListView,
  OrganizationNode,
  OrganizationPageInfo,
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
import { useEffect, useRef, useState } from "react";
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

const OrganizationWorkspace = observer(() => {
  const { auth, companyStore, organizationStore } = stores;
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<Filters>(emptyFilters);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedNode, setSelectedNode] = useState<OrganizationNode | null>(null);
  const [selectedDirectReports, setSelectedDirectReports] = useState<OrganizationNode[]>([]);
  const [selectedDirectReportsPageInfo, setSelectedDirectReportsPageInfo] =
    useState<OrganizationPageInfo | null>(null);
  const [isLoadingPerson, setIsLoadingPerson] = useState(false);
  const [isLoadingMoreDirectReports, setIsLoadingMoreDirectReports] = useState(false);
  const personRequestRef = useRef(0);
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

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedFilters(filters), 300);
    return () => window.clearTimeout(timer);
  }, [filters]);

  const data = organizationStore.data;
  const hasActiveFilters = Boolean(
    debouncedFilters.search ||
      debouncedFilters.department ||
      debouncedFilters.team ||
      debouncedFilters.locationId
  );
  const activeListView: OrganizationListView | null =
    activeTab === 1 ? "managers" : activeTab === 2 ? "unassigned" : hasActiveFilters ? "search" : null;

  useEffect(() => {
    if (!companyId || !canViewOrganization || !activeListView) {
      return;
    }
    organizationStore
      .fetchList(activeListView, debouncedFilters as OrganizationFilters)
      .catch(() => undefined);
  }, [activeListView, canViewOrganization, companyId, debouncedFilters, organizationStore]);

  const openNode = (node: OrganizationNode) => {
    const requestId = personRequestRef.current + 1;
    personRequestRef.current = requestId;
    setSelectedNode(node);
    setSelectedDirectReports([]);
    setSelectedDirectReportsPageInfo(null);
    setIsLoadingPerson(true);
    drawer.onOpen();
    organizationStore
      .fetchPerson(node._id)
      .then((person) => {
        if (!person || personRequestRef.current !== requestId) {
          return;
        }
        setSelectedNode(person.node);
        setSelectedDirectReports(person.directReports || []);
        setSelectedDirectReportsPageInfo(person.directReportsPageInfo || null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (personRequestRef.current === requestId) {
          setIsLoadingPerson(false);
        }
      });
  };

  const refreshOrganization = async () => {
    if (!companyId) {
      return;
    }

    await organizationStore.fetchOrganization(companyId);
    if (selectedNode) {
      const person = await organizationStore.fetchPerson(selectedNode._id);
      if (person) {
        setSelectedNode(person.node);
        setSelectedDirectReports(person.directReports || []);
        setSelectedDirectReportsPageInfo(person.directReportsPageInfo || null);
      }
    }
  };

  const loadMoreDrawerDirectReports = async () => {
    if (!selectedNode || !selectedDirectReportsPageInfo?.hasNextPage) {
      return;
    }

    setIsLoadingMoreDirectReports(true);
    try {
      const page = await organizationStore.fetchDirectReportsPage(
        selectedNode._id,
        selectedDirectReportsPageInfo.nextCursor,
        selectedDirectReportsPageInfo.limit
      );
      if (!page) {
        return;
      }
      setSelectedDirectReports((current) => {
        const reportById = new Map(current.map((report) => [report._id, report]));
        page.nodes.forEach((report) => reportById.set(report._id, report));
        return Array.from(reportById.values());
      });
      setSelectedDirectReportsPageInfo(page.pageInfo);
    } finally {
      setIsLoadingMoreDirectReports(false);
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
    tone: "blue" | "green" | "orange" | "gray" | "teal" | "pink";
  }) => (
    <Flex
      align="center"
      gap={4}
      bg={panelBg}
      p={5}
      h="100%"
    >
      <Center
        w={12}
        h={12}
        borderRadius="xl"
        bg={useColorModeValue(`${tone}.50`, `${tone}.900`)}
        color={useColorModeValue(`${tone}.600`, `${tone}.200`)}
        flexShrink={0}
      >
        <Icon as={icon} boxSize={6} />
      </Center>
      <Box minW={0}>
        <Text fontSize="xs" fontWeight="700" color={muted} textTransform="uppercase" letterSpacing="wider" mb={1}>
          {label}
        </Text>
        <Text fontSize="2xl" fontWeight="800" color={headingColor} lineHeight="1">
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
      <Box minH="100dvh" bg={pageBg}>
        {/* MAIN LAYOUT */}
        <Flex direction={{ base: "column", lg: "row" }} minH="100vh">
          
          {/* LEFT FILTER SIDEBAR */}
          <Box 
            w={{ base: "full", lg: "280px" }} 
            bg={useColorModeValue("gray.50", "gray.900")}
            p={5} 
            borderRightWidth="1px"
            borderColor={useColorModeValue("gray.200", "gray.700")}
            flexShrink={0}
          >
            <Stack spacing={4}>
              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.700" mb={1}>Search by Name</Text>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Search size={14} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    bg="white"
                    borderColor="gray.200"
                    _hover={{ borderColor: "gray.300" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                    value={filters.search}
                    placeholder="Type a name..."
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        search: event.target.value,
                      }))
                    }
                    borderRadius="sm"
                  />
                </InputGroup>
              </Box>

              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.700" mb={1}>Department</Text>
                <Select
                  size="sm"
                  bg="white"
                  borderColor="gray.200"
                  borderRadius="sm"
                  _hover={{ borderColor: "gray.300" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                  value={filters.department}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      department: event.target.value,
                    }))
                  }
                >
                  <option value="">All</option>
                  {data.filters.departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.700" mb={1}>Team</Text>
                <Select
                  size="sm"
                  bg="white"
                  borderColor="gray.200"
                  borderRadius="sm"
                  _hover={{ borderColor: "gray.300" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                  value={filters.team}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      team: event.target.value,
                    }))
                  }
                >
                  <option value="">All</option>
                  {data.filters.teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.700" mb={1}>Location</Text>
                <Select
                  size="sm"
                  bg="white"
                  borderColor="gray.200"
                  borderRadius="sm"
                  _hover={{ borderColor: "gray.300" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                  value={filters.locationId}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      locationId: event.target.value,
                    }))
                  }
                >
                  <option value="">All</option>
                  {data.filters.locations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
                </Select>
              </Box>

              <Button
                w="full"
                colorScheme="blue"
                size="sm"
                isDisabled={!hasActiveFilters}
                onClick={() => setFilters(emptyFilters)}
                mt={4}
                borderRadius="sm"
              >
                Clear Filters
              </Button>
            </Stack>
          </Box>

          {/* RIGHT MAIN AREA */}
          <Box flex="1" minW={0} w="full" bg={useColorModeValue("white", "gray.900")}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4} 
              bg={useColorModeValue("white", "gray.800")}
              p={5} 
              borderBottomWidth="1px"
              borderColor={useColorModeValue("gray.100", "gray.700")}
            >
              <Box>
                <Heading size="md" color="gray.700" fontWeight="700">
                  Organisation Chart
                </Heading>
                <Text color="gray.500" mt={1} fontSize="xs">
                  Check your company's organisation chart
                </Text>
              </Box>
              <Flex align="center" gap={3} borderWidth="1px" borderColor="gray.200" p={2} px={4} borderRadius="md" bg="white" boxShadow="sm">
                 <Icon as={Users} boxSize={5} color="blue.500" />
                 <Box>
                    <Text fontSize="2xs" color="gray.500" fontWeight="600" textTransform="uppercase">Total Employee</Text>
                    <Text fontSize="xl" fontWeight="700" color="gray.800" lineHeight={1}>{data.summary.totalPeople}</Text>
                 </Box>
              </Flex>
            </Flex>

            {organizationStore.error ? (
              <Alert status="error" borderRadius="md" mb={6}>
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
                borderColor={useColorModeValue("gray.100", "gray.700")}
                borderRadius="xl"
                py={16}
                textAlign="center"
                boxShadow="sm"
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
                borderColor={useColorModeValue("gray.100", "gray.700")}
                borderRadius="xl"
                boxShadow="sm"
              >
                <Stack align="center" spacing={3}>
                  <Spinner color="blue.500" />
                  <Text color={muted}>Loading organization structure...</Text>
                </Stack>
              </Center>
            ) : (
              <Box bg={useColorModeValue("white", "gray.900")}>
                <Box p={6} overflowX="auto" minH="calc(100vh - 100px)">
                   {hasActiveFilters ? (
                      <OrganizationTable
                        nodes={organizationStore.listPages.search.nodes}
                        pageInfo={organizationStore.listPages.search.pageInfo}
                        isLoading={organizationStore.listLoading.search}
                        emptyTitle="No matching employees"
                        emptyDescription="No employees match the current organization filters."
                        onSelect={openNode}
                        onLoadMore={() =>
                          organizationStore
                            .fetchList("search", debouncedFilters, true)
                            .catch(() => undefined)
                        }
                      />
                    ) : (
                      <OrganizationTree
                        key={companyId}
                        nodes={data.nodes}
                        roots={data.roots}
                        rootPageInfo={data.rootPageInfo}
                        childrenPageInfo={organizationStore.childrenPageInfo}
                        loadingChildrenIds={organizationStore.loadingChildrenIds}
                        isLoadingRoots={organizationStore.isLoadingRoots}
                        onLoadChildren={organizationStore.fetchChildren}
                        onLoadMoreRoots={organizationStore.loadMoreRoots}
                        onSelect={openNode}
                      />
                    )}
                </Box>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>

      <OrganizationPersonDrawer
        node={selectedNode}
        directReports={selectedDirectReports}
        directReportsPageInfo={selectedDirectReportsPageInfo}
        isLoadingDetails={isLoadingPerson}
        isLoadingMoreDirectReports={isLoadingMoreDirectReports}
        companyId={companyId || ""}
        isOpen={drawer.isOpen}
        canAssignManagers={canAssignManagers}
        onClose={() => {
          drawer.onClose();
          personRequestRef.current += 1;
          setSelectedNode(null);
          setSelectedDirectReports([]);
          setSelectedDirectReportsPageInfo(null);
        }}
        onHierarchyUpdated={refreshOrganization}
        onLoadMoreDirectReports={() =>
          loadMoreDrawerDirectReports().catch(() => undefined)
        }
      />
    </PermissionGate>
  );
});

export default OrganizationWorkspace;
