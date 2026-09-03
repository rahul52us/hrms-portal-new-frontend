"use client";

import axios from "axios";
import PermissionGate from "@/app/component/common/PermissionGate";
import { PageBanner } from "@/app/component/common/PageBanner/PageBanner";
import { hasPermission, PERMISSION_KEYS } from "@/app/config/utils/permissions";
import { departmentStore } from "@/app/store/departmentStore/departmentStore";
import { locationStore } from "@/app/store/locationStore/locationStore";
import stores from "@/app/store/stores";
import {
  LeaveTypeItem,
  PolicyVersion,
  WorkforcePolicyAssignment,
  WorkforcePolicyItem,
  workforcePolicyStore,
} from "@/app/store/workforcePolicyStore/workforcePolicyStore";
import {
  Alert,
  AlertDescription,
  AlertIcon,
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
  SimpleGrid,
  Skeleton,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { FiArchive, FiCalendar, FiEdit2, FiGitBranch, FiLink, FiPlus, FiSearch, FiTag, FiTrash2 } from "react-icons/fi";
import PolicyAssignmentDrawer, {
  AssignmentScopeOption,
} from "../workforce-policies/components/PolicyAssignmentDrawer";
import PolicyAssignmentsPanel from "../workforce-policies/components/PolicyAssignmentsPanel";
import PolicyHistoryDrawer from "../workforce-policies/components/PolicyHistoryDrawer";
import ArchiveLeaveDialog from "./components/ArchiveLeaveDialog";
import LeaveCoveragePanel from "./components/LeaveCoveragePanel";
import LeavePolicyDrawer from "./components/LeavePolicyDrawer";
import LeaveTypeDrawer from "./components/LeaveTypeDrawer";
import LeaveRequestsPanel from "./components/LeaveRequestsPanel";
import LeaveBalancesPanel from "./components/LeaveBalancesPanel";
import CompOffClaimsPanel from "./components/CompOffClaimsPanel";

const LEAVE_RESOURCE_TYPES = ["leave_policy"] as const;

type PolicyEditor = {
  mode: "create" | "edit_draft" | "new_version";
  resource: WorkforcePolicyItem | null;
  version: PolicyVersion | null;
};

type ArchiveTarget =
  | { kind: "type"; item: LeaveTypeItem }
  | { kind: "policy"; item: WorkforcePolicyItem }
  | null;

const formatDate = (value?: string | null) => {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
};

const LeaveManagementWorkspace = observer(function LeaveManagementWorkspace() {
  const { auth, companyStore } = stores;
  const toast = useToast();
  const role = String(auth.role || auth.user?.role || "").toLowerCase();
  const isSuperadmin = role === "superadmin";
  const canViewConfiguration = hasPermission(auth.user, PERMISSION_KEYS.VIEW_WORKFORCE_POLICIES);
  const canViewOperations = hasPermission(auth.user, PERMISSION_KEYS.VIEW_LEAVE_REQUESTS);
  const canView = canViewConfiguration || canViewOperations;
  const canManage = ["superadmin", "admin", "hradmin"].includes(role) &&
    hasPermission(auth.user, PERMISSION_KEYS.MANAGE_WORKFORCE_POLICIES);
  const [tabIndex, setTabIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<AssignmentScopeOption[]>([]);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeItem | null>(null);
  const [policyEditor, setPolicyEditor] = useState<PolicyEditor>({ mode: "create", resource: null, version: null });
  const [historyResource, setHistoryResource] = useState<WorkforcePolicyItem | null>(null);
  const [endingAssignment, setEndingAssignment] = useState<WorkforcePolicyAssignment | null>(null);
  const [assignmentResourceId, setAssignmentResourceId] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<ArchiveTarget>(null);
  const [draftCancelTarget, setDraftCancelTarget] = useState<WorkforcePolicyItem | null>(null);
  const typeDisclosure = useDisclosure();
  const policyDisclosure = useDisclosure();
  const historyDisclosure = useDisclosure();
  const assignmentDisclosure = useDisclosure();
  const archiveDisclosure = useDisclosure();
  const draftCancelDisclosure = useDisclosure();

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const surface = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  useEffect(() => {
    if (isSuperadmin) companyStore.getManagedCompanies().catch(() => undefined);
    else companyStore.initializeCompanyContext();
  }, [companyStore, isSuperadmin]);

  const companyId = companyStore.getActiveCompanyId() || "";
  const companies = companyStore.companies.data || [];
  const activeCompany = companies.find((company: any) => company._id === companyId) || auth.user?.companyDetails || null;

  const refresh = useCallback(async () => {
    if (!companyId || !canViewConfiguration) return;
    await workforcePolicyStore.fetchWorkspace(companyId);
  }, [canViewConfiguration, companyId]);

  useEffect(() => {
    if (!companyId || !canViewConfiguration) return;
    refresh().catch(() => undefined);
  }, [canViewConfiguration, companyId, refresh]);

  useEffect(() => {
    if (!companyId || !canManage) {
      setEmployeeOptions([]);
      return;
    }
    Promise.all([
      departmentStore.fetchDepartments(companyId, 1, 100),
      locationStore.fetchLocations(companyId, 1, 100),
      axios.get("/admin/users", { params: { companyId, page: 1, limit: 100 } }),
    ])
      .then(([, , usersResponse]) => {
        const users = usersResponse.data?.data?.users || [];
        setEmployeeOptions(
          users
            .filter((user: any) => /^(user|manager|departmenthead|department head|department-head|l\d+[-\s]?manager)$/i.test(String(user?.role || "")))
            .map((user: any) => ({
              id: user._id,
              label: `${user.name || user.username} (${user.code || user.username})`,
              type: "employee" as const,
            }))
        );
      })
      .catch(() => setEmployeeOptions([]));
  }, [canManage, companyId]);

  const scopeOptions: AssignmentScopeOption[] = [
    ...locationStore.locations.map((location) => ({
      id: location._id,
      label: `${location.name} (${location.code})`,
      type: "location" as const,
    })),
    ...departmentStore.departments.map((department) => ({
      id: department._id,
      label: `${department.departmentName} (${department.code})`,
      type: "department" as const,
    })),
    ...departmentStore.departments.flatMap((department) =>
      (department.teams || [])
        .filter((team) => team.isActive !== false)
        .map((team) => ({
          id: team._id,
          label: `${department.departmentName} / ${team.name}`,
          type: "team" as const,
        }))
    ),
    ...employeeOptions,
  ];

  const normalizedSearch = search.trim().toLowerCase();
  const filteredTypes = workforcePolicyStore.leaveTypes.filter((item) =>
    `${item.name} ${item.code}`.toLowerCase().includes(normalizedSearch)
  );
  const filteredPolicies = workforcePolicyStore.leavePolicies.filter((item) =>
    `${item.name} ${item.code}`.toLowerCase().includes(normalizedSearch)
  );
  const activeAssignments = workforcePolicyStore.assignments.filter(
    (item) => item.resourceType === "leave_policy" && ["active", "scheduled"].includes(item.state)
  ).length;

  const openType = (leaveType: LeaveTypeItem | null = null) => {
    setEditingLeaveType(leaveType);
    typeDisclosure.onOpen();
  };
  const openPolicy = (
    mode: PolicyEditor["mode"],
    resource: WorkforcePolicyItem | null = null,
    version: PolicyVersion | null = null
  ) => {
    setPolicyEditor({ mode, resource, version });
    policyDisclosure.onOpen();
  };
  const openHistory = async (resource: WorkforcePolicyItem) => {
    setHistoryResource(resource);
    historyDisclosure.onOpen();
    await workforcePolicyStore.fetchResourceDetail("leave_policy", resource._id, companyId).catch(() => undefined);
  };
  const openAssignment = (
    assignment: WorkforcePolicyAssignment | null = null,
    resourceId = ""
  ) => {
    setEndingAssignment(assignment);
    setAssignmentResourceId(resourceId);
    assignmentDisclosure.onOpen();
  };
  const openArchive = (target: ArchiveTarget) => {
    setArchiveTarget(target);
    archiveDisclosure.onOpen();
  };
  const archive = async (reason: string) => {
    if (!archiveTarget) return;
    try {
      if (archiveTarget.kind === "type") {
        await workforcePolicyStore.archiveLeaveType(archiveTarget.item._id, { companyId, reason });
      } else {
        await workforcePolicyStore.archiveLeavePolicy(archiveTarget.item._id, { companyId, reason });
      }
      await refresh();
      toast({ title: archiveTarget.kind === "type" ? "Leave type archived" : "Leave policy archived", status: "success" });
      archiveDisclosure.onClose();
      setArchiveTarget(null);
    } catch (error: any) {
      toast({ title: error?.message || "Could not archive configuration", status: "error", duration: 5000 });
    }
  };
  const cancelDraft = async (reason: string) => {
    if (!draftCancelTarget?.draftVersion?._id) return;
    try {
      await workforcePolicyStore.cancelLeavePolicyVersion(
        draftCancelTarget._id,
        draftCancelTarget.draftVersion._id,
        { companyId, reason }
      );
      await refresh();
      toast({ title: `Draft v${draftCancelTarget.draftVersion.versionNumber} discarded`, status: "success" });
      draftCancelDisclosure.onClose();
      setDraftCancelTarget(null);
    } catch (error: any) {
      toast({ title: error?.message || "Could not discard leave policy draft", status: "error", duration: 5000 });
    }
  };

  const LeaveTypeList = () => workforcePolicyStore.loading ? (
    <Stack><Skeleton h="88px" /><Skeleton h="88px" /></Stack>
  ) : filteredTypes.length === 0 ? (
    <Box py={12} borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md" textAlign="center">
      <Text color={muted}>No leave types found.</Text>
    </Box>
  ) : (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
      {filteredTypes.map((item) => (
        <Box key={item._id} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
          <Flex justify="space-between" gap={3}>
            <HStack align="start">
              <Box boxSize="12px" mt={1.5} borderRadius="sm" bg={item.color} flexShrink={0} />
              <Box>
                <HStack><Text fontWeight="800">{item.name}</Text><Badge>{item.code}</Badge></HStack>
                <Text mt={1} fontSize="sm" color={muted}>{item.description || "No description"}</Text>
              </Box>
            </HStack>
            <Badge colorScheme={item.status === "active" ? "green" : "gray"}>{item.status}</Badge>
          </Flex>
          <HStack mt={4} spacing={2} flexWrap="wrap">
            <Badge colorScheme={item.paid ? "blue" : "orange"}>{item.paid ? "Paid" : "Unpaid"}</Badge>
            <Badge>{item.balanceTracked ? "Balance tracked" : "No balance"}</Badge>
            <Badge>{item.unit}</Badge>
            {item.allowHalfDay ? <Badge>Half day</Badge> : null}
          </HStack>
          {canManage && item.status === "active" ? (
            <HStack mt={4} justify="end">
              <Button size="xs" variant="ghost" leftIcon={<FiEdit2 />} onClick={() => openType(item)}>Edit</Button>
              <Button size="xs" variant="ghost" colorScheme="red" leftIcon={<FiArchive />} onClick={() => openArchive({ kind: "type", item })}>Archive</Button>
            </HStack>
          ) : null}
        </Box>
      ))}
    </SimpleGrid>
  );

  const LeavePolicyList = () => workforcePolicyStore.loading ? (
    <Stack><Skeleton h="110px" /><Skeleton h="110px" /></Stack>
  ) : filteredPolicies.length === 0 ? (
    <Box py={12} borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md" textAlign="center">
      <Text color={muted}>No leave policies found. Create leave types first, then build a policy.</Text>
    </Box>
  ) : (
    <Stack spacing={0} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
      {filteredPolicies.map((item, index) => (
        <Flex key={item._id} p={4} direction={{ base: "column", lg: "row" }} justify="space-between" gap={4} borderBottomWidth={index === filteredPolicies.length - 1 ? "0" : "1px"}>
          <Box minW={0}>
            <HStack flexWrap="wrap"><Text fontWeight="800">{item.name}</Text><Badge>{item.code}</Badge><Badge colorScheme={item.status === "active" ? "green" : "gray"}>{item.status}</Badge></HStack>
            <Text mt={1} fontSize="sm" color={muted}>{item.description || "No description"}</Text>
            <HStack mt={2} fontSize="xs" color={muted} flexWrap="wrap">
              <Text>{item.latestPublishedVersion ? `Published v${item.latestPublishedVersion.versionNumber} from ${formatDate(item.latestPublishedVersion.effectiveFrom)}` : "Not published"}</Text>
              <Text>{item.assignmentCount || 0} assignment{item.assignmentCount === 1 ? "" : "s"}</Text>
              {item.draftVersion ? <Badge colorScheme="orange">Draft v{item.draftVersion.versionNumber}</Badge> : null}
            </HStack>
          </Box>
          <HStack alignSelf={{ lg: "center" }} flexWrap="wrap">
            <Button size="sm" variant="ghost" leftIcon={<FiGitBranch />} onClick={() => openHistory(item)}>History</Button>
            {canManage && item.latestPublishedVersion ? <Button size="sm" variant="outline" leftIcon={<FiLink />} onClick={() => openAssignment(null, item._id)}>Assign</Button> : null}
            {canManage && item.status === "active" && item.draftVersion ? (
              <>
                <Button size="sm" colorScheme="blue" leftIcon={<FiEdit2 />} onClick={() => openPolicy("edit_draft", item, item.draftVersion)}>Edit draft</Button>
                <Button size="sm" variant="ghost" colorScheme="red" leftIcon={<FiTrash2 />} onClick={() => { setDraftCancelTarget(item); draftCancelDisclosure.onOpen(); }}>Discard draft</Button>
              </>
            ) : null}
            {canManage && item.status === "active" && !item.draftVersion && item.latestPublishedVersion ? (
              <Button size="sm" colorScheme="blue" variant="outline" leftIcon={<FiPlus />} onClick={() => openPolicy("new_version", item, item.latestPublishedVersion)}>New version</Button>
            ) : null}
            {canManage && item.status === "active" ? <Button size="sm" variant="ghost" colorScheme="red" leftIcon={<FiArchive />} onClick={() => openArchive({ kind: "policy", item })}>Archive</Button> : null}
          </HStack>
        </Flex>
      ))}
    </Stack>
  );

  return (
    <PermissionGate
      allowed={canView}
      title="Leave management is disabled"
      description="This account does not have permission to view leave operations or configurations."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100dvh" bg={pageBg}>
        <Stack spacing={6} maxW="1500px" mx="auto">
          <Stack spacing={6}>
            <PageBanner
              titlePrefix="LEAVE"
              titleHighlight="MANAGEMENT"
              subtitle={`CONFIGURE LEAVE TYPES AND POLICIES FOR ${activeCompany?.company_name?.toUpperCase() || "YOUR COMPANY"}`}
              icon={FiCalendar}
              statLabel={`${activeAssignments} ACTIVE SCOPE`}
              statIcon={FiLink}
              showBackButton={true}
              colorScheme="blue"
            />
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} w="full">
              {[
                { label: "Leave types", value: workforcePolicyStore.leaveTypes.filter((item) => item.status === "active").length, icon: FiTag },
                { label: "Leave policies", value: workforcePolicyStore.leavePolicies.filter((item) => item.status === "active").length, icon: FiCalendar },
                { label: "Active scope", value: activeAssignments, icon: FiLink },
              ].map((stat) => (
                <HStack key={stat.label} bg={surface} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={4} minW={0} shadow="sm">
                  <Center bg={useColorModeValue("blue.50", "blue.900")} color="blue.500" w={12} h={12} borderRadius="lg" flexShrink={0}>
                    <Icon as={stat.icon} boxSize={5} />
                  </Center>
                  <Box minW={0} ml={3}>
                    <Text fontSize="sm" color={muted} noOfLines={1} fontWeight="medium">{stat.label}</Text>
                    <Text fontWeight="bold" fontSize="2xl" lineHeight="1">{stat.value}</Text>
                  </Box>
                </HStack>
              ))}
            </SimpleGrid>
          </Stack>

          {!companyId ? <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>Select a company before managing leave policies.</AlertDescription></Alert> : null}
          {workforcePolicyStore.error ? <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{workforcePolicyStore.error}</AlertDescription></Alert> : null}

          <Box bg={surface} borderWidth="1px" borderColor={borderColor} borderRadius="xl" overflow="hidden" shadow="sm">
            <Tabs index={tabIndex} onChange={setTabIndex} variant="soft-rounded" colorScheme="blue" size="sm" isLazy>
              <Box px={5} pt={5} pb={3} borderBottomWidth="1px" borderColor={borderColor} overflowX="auto" css={{ "&::-webkit-scrollbar": { display: "none" } }}>
                <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap={4}>
                  <TabList
                    gap={2}
                    flexWrap="nowrap"
                    w="max-content"
                    bg={useColorModeValue("gray.100", "gray.900")}
                    p={1}
                    borderRadius="full"
                    display="inline-flex"
                  >
                    {canViewConfiguration ? <Tab whiteSpace="nowrap" fontWeight="medium" color={muted} fontSize="sm" px={{ base: 4, md: 6 }} py={2} borderRadius="full" _selected={{ bgGradient: "linear(to-r, blue.500, purple.600)", color: "white", boxShadow: "md" }} transition="all 0.2s">Leave types</Tab> : null}
                    {canViewConfiguration ? <Tab whiteSpace="nowrap" fontWeight="medium" color={muted} fontSize="sm" px={{ base: 4, md: 6 }} py={2} borderRadius="full" _selected={{ bgGradient: "linear(to-r, blue.500, purple.600)", color: "white", boxShadow: "md" }} transition="all 0.2s">Leave policies</Tab> : null}
                    {canViewConfiguration ? <Tab whiteSpace="nowrap" fontWeight="medium" color={muted} fontSize="sm" px={{ base: 4, md: 6 }} py={2} borderRadius="full" _selected={{ bgGradient: "linear(to-r, blue.500, purple.600)", color: "white", boxShadow: "md" }} transition="all 0.2s">Assignments</Tab> : null}
                    {canViewConfiguration ? <Tab whiteSpace="nowrap" fontWeight="medium" color={muted} fontSize="sm" px={{ base: 4, md: 6 }} py={2} borderRadius="full" _selected={{ bgGradient: "linear(to-r, blue.500, purple.600)", color: "white", boxShadow: "md" }} transition="all 0.2s">Coverage</Tab> : null}
                    {canViewOperations ? <Tab whiteSpace="nowrap" fontWeight="medium" color={muted} fontSize="sm" px={{ base: 4, md: 6 }} py={2} borderRadius="full" _selected={{ bgGradient: "linear(to-r, blue.500, purple.600)", color: "white", boxShadow: "md" }} transition="all 0.2s">Requests</Tab> : null}
                    {canViewOperations ? <Tab whiteSpace="nowrap" fontWeight="medium" color={muted} fontSize="sm" px={{ base: 4, md: 6 }} py={2} borderRadius="full" _selected={{ bgGradient: "linear(to-r, blue.500, purple.600)", color: "white", boxShadow: "md" }} transition="all 0.2s">Comp-off claims</Tab> : null}
                    {canViewOperations ? <Tab whiteSpace="nowrap" fontWeight="medium" color={muted} fontSize="sm" px={{ base: 4, md: 6 }} py={2} borderRadius="full" _selected={{ bgGradient: "linear(to-r, blue.500, purple.600)", color: "white", boxShadow: "md" }} transition="all 0.2s">Balances</Tab> : null}
                  </TabList>
                  <HStack>
                    {canViewConfiguration && tabIndex < 2 ? <InputGroup size="sm" maxW="250px"><InputLeftElement><FiSearch /></InputLeftElement><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" borderRadius="lg" /></InputGroup> : null}
                    {canViewConfiguration && canManage && companyId && tabIndex < 3 ? (
                      <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} flexShrink={0} borderRadius="lg" onClick={() => tabIndex === 0 ? openType() : tabIndex === 1 ? openPolicy("create") : openAssignment()}>
                        {tabIndex === 0 ? "New leave type" : tabIndex === 1 ? "New policy" : "New assignment"}
                      </Button>
                    ) : null}
                  </HStack>
                </Flex>
              </Box>
              <TabPanels>
                {canViewConfiguration ? <TabPanel><LeaveTypeList /></TabPanel> : null}
                {canViewConfiguration ? <TabPanel><LeavePolicyList /></TabPanel> : null}
                {canViewConfiguration ? <TabPanel><PolicyAssignmentsPanel companyId={companyId} canManage={canManage} borderColor={borderColor} muted={muted} lockedResourceType="leave_policy" onEndAssignment={(assignment) => openAssignment(assignment)} /></TabPanel> : null}
                {canViewConfiguration ? <TabPanel><LeaveCoveragePanel companyId={companyId} borderColor={borderColor} muted={muted} onManageAssignments={() => setTabIndex(2)} /></TabPanel> : null}
                {canViewOperations ? <TabPanel><LeaveRequestsPanel companyId={companyId} borderColor={borderColor} muted={muted} /></TabPanel> : null}
                {canViewOperations ? <TabPanel><CompOffClaimsPanel companyId={companyId} borderColor={borderColor} muted={muted} /></TabPanel> : null}
                {canViewOperations ? <TabPanel><LeaveBalancesPanel companyId={companyId} borderColor={borderColor} muted={muted} /></TabPanel> : null}
              </TabPanels>
            </Tabs>
          </Box>
        </Stack>

        <LeaveTypeDrawer isOpen={typeDisclosure.isOpen} onClose={typeDisclosure.onClose} companyId={companyId} leaveType={editingLeaveType} onSaved={refresh} />
        <LeavePolicyDrawer isOpen={policyDisclosure.isOpen} onClose={policyDisclosure.onClose} companyId={companyId} mode={policyEditor.mode} resource={policyEditor.resource} version={policyEditor.version} leaveTypes={workforcePolicyStore.leaveTypes} onSaved={refresh} onPublished={(policyId) => openAssignment(null, policyId)} />
        <PolicyHistoryDrawer isOpen={historyDisclosure.isOpen} onClose={historyDisclosure.onClose} resourceType="leave_policy" resource={historyResource} />
        <PolicyAssignmentDrawer isOpen={assignmentDisclosure.isOpen} onClose={assignmentDisclosure.onClose} companyId={companyId} attendancePolicies={[]} workSchedules={[]} holidayCalendars={[]} leavePolicies={workforcePolicyStore.leavePolicies} allowedResourceTypes={LEAVE_RESOURCE_TYPES as any} initialResourceType="leave_policy" initialResourceId={assignmentResourceId} scopeOptions={scopeOptions} assignment={endingAssignment} onSaved={refresh} />
        <ArchiveLeaveDialog isOpen={archiveDisclosure.isOpen} onClose={archiveDisclosure.onClose} title={archiveTarget?.kind === "type" ? `Archive ${archiveTarget.item.name}` : archiveTarget?.kind === "policy" ? `Archive ${archiveTarget.item.name}` : "Archive configuration"} description={archiveTarget?.kind === "type" ? "Existing published policy versions keep their historical rule snapshot. This type cannot be used in new versions after archiving." : "Active or scheduled assignments must be ended before this policy can be archived."} submitting={workforcePolicyStore.submitting} onConfirm={archive} />
        <ArchiveLeaveDialog isOpen={draftCancelDisclosure.isOpen} onClose={draftCancelDisclosure.onClose} title={draftCancelTarget ? `Discard draft v${draftCancelTarget.draftVersion?.versionNumber}` : "Discard leave policy draft"} description="The published policy remains unchanged. This draft stays in version history as cancelled and cannot be edited or published afterward." reasonLabel="Reason for discarding" confirmLabel="Discard draft" submitting={workforcePolicyStore.submitting} onConfirm={cancelDraft} />
      </Box>
    </PermissionGate>
  );
});

export default LeaveManagementWorkspace;
