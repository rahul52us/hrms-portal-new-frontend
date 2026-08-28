"use client";

import axios from "axios";
import PermissionGate from "@/app/component/common/PermissionGate";
import { PageBanner } from "@/app/component/common/PageBanner/PageBanner";
import { hasPermission, PERMISSION_KEYS } from "@/app/config/utils/permissions";
import { departmentStore } from "@/app/store/departmentStore/departmentStore";
import { locationStore } from "@/app/store/locationStore/locationStore";
import stores from "@/app/store/stores";
import {
  ApprovalWorkflowItem,
  ApprovalWorkflowVersion,
  PolicyResourceType,
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
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Tabs,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import {
  FiCalendar,
  FiBriefcase,
  FiCheckSquare,
  FiClock,
  FiEdit2,
  FiGitBranch,
  FiLink,
  FiPlus,
  FiSearch,
  FiWifi,
} from "react-icons/fi";
import AttendancePolicyDrawer from "./components/AttendancePolicyDrawer";
import HolidayCalendarDrawer from "./components/HolidayCalendarDrawer";
import PolicyAssignmentDrawer, {
  AssignmentScopeOption,
} from "./components/PolicyAssignmentDrawer";
import PolicyHistoryDrawer from "./components/PolicyHistoryDrawer";
import WorkScheduleDrawer from "./components/WorkScheduleDrawer";
import PolicyAssignmentsPanel from "./components/PolicyAssignmentsPanel";
import PolicyAuditPanel from "./components/PolicyAuditPanel";
import PolicyCoveragePanel from "./components/PolicyCoveragePanel";
import RemoteWorkPolicyDrawer from "./components/RemoteWorkPolicyDrawer";
import ApprovalWorkflowsPanel from "./components/ApprovalWorkflowsPanel";
import ApprovalWorkflowDrawer from "./components/ApprovalWorkflowDrawer";
import ApprovalWorkflowHistoryDrawer from "./components/ApprovalWorkflowHistoryDrawer";

type EditorState = {
  type: PolicyResourceType;
  mode: "create" | "edit_draft" | "new_version";
  resource: WorkforcePolicyItem | null;
  version: PolicyVersion | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

const WorkforcePoliciesWorkspace = observer(() => {
  const { auth, companyStore } = stores;
  const role = String(auth.role || auth.user?.role || "").toLowerCase();
  const isSuperadmin = role === "superadmin";
  const canView = hasPermission(auth.user, PERMISSION_KEYS.VIEW_WORKFORCE_POLICIES);
  const canManage =
    ["superadmin", "admin", "hradmin"].includes(role) &&
    hasPermission(auth.user, PERMISSION_KEYS.MANAGE_WORKFORCE_POLICIES);
  const [tabIndex, setTabIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<AssignmentScopeOption[]>([]);
  const [editor, setEditor] = useState<EditorState>({
    type: "attendance_policy",
    mode: "create",
    resource: null,
    version: null,
  });
  const [history, setHistory] = useState<{
    type: PolicyResourceType;
    resource: WorkforcePolicyItem | null;
  }>({ type: "attendance_policy", resource: null });
  const [endingAssignment, setEndingAssignment] = useState<WorkforcePolicyAssignment | null>(null);
  const [approvalEditor, setApprovalEditor] = useState<{
    mode: "create" | "edit_draft" | "new_version";
    workflow: ApprovalWorkflowItem | null;
    version: ApprovalWorkflowVersion | null;
  }>({ mode: "create", workflow: null, version: null });
  const [approvalHistory, setApprovalHistory] = useState<ApprovalWorkflowItem | null>(null);
  const editorDisclosure = useDisclosure();
  const approvalEditorDisclosure = useDisclosure();
  const approvalHistoryDisclosure = useDisclosure();
  const historyDisclosure = useDisclosure();
  const assignmentDisclosure = useDisclosure();

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const surface = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const tableHeadBg = useColorModeValue("gray.100", "gray.700");

  useEffect(() => {
    if (isSuperadmin) {
      companyStore.getManagedCompanies().catch(() => undefined);
    } else {
      companyStore.initializeCompanyContext();
    }
  }, [companyStore, isSuperadmin]);

  const companyId = companyStore.getActiveCompanyId() || "";
  const companies = companyStore.companies.data || [];
  const activeCompany =
    companies.find((company: any) => company._id === companyId) ||
    auth.user?.companyDetails ||
    null;

  const refresh = useCallback(async () => {
    if (!companyId || !canView) return;
    await workforcePolicyStore.fetchWorkspace(companyId);
  }, [canView, companyId]);

  useEffect(() => {
    if (!companyId || !canView) {
      workforcePolicyStore.clear();
      return;
    }
    refresh().catch(() => undefined);
  }, [canView, companyId, refresh]);

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
            .filter((user: any) =>
              /^(user|manager|departmenthead|department head|department-head|l\d+[-\s]?manager)$/i.test(
                String(user?.role || "")
              )
            )
            .map((user: any) => ({
              id: user._id,
              label: `${user.name || user.username} (${user.username || user.role})`,
              type: "employee" as const,
            }))
        );
      })
      .catch(() => setEmployeeOptions([]));
  }, [canManage, companyId]);

  const scopeOptions: AssignmentScopeOption[] = (() => {
    const locationOptions: AssignmentScopeOption[] = locationStore.locations.map((location) => ({
      id: location._id,
      label: `${location.name} (${location.code})`,
      type: "location",
    }));
    const departmentOptions: AssignmentScopeOption[] = departmentStore.departments.map((department) => ({
      id: department._id,
      label: `${department.departmentName} (${department.code})`,
      type: "department",
    }));
    const teamOptions: AssignmentScopeOption[] = departmentStore.departments.flatMap((department) =>
      (department.teams || [])
        .filter((team) => team.isActive !== false)
        .map((team) => ({
          id: team._id,
          label: `${department.departmentName} / ${team.name}`,
          type: "team" as const,
        }))
    );
    return [...locationOptions, ...departmentOptions, ...teamOptions, ...employeeOptions];
  })();

  const filteredAttendance = workforcePolicyStore.attendancePolicies.filter((item) =>
    `${item.name} ${item.code}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSchedules = workforcePolicyStore.workSchedules.filter((item) =>
    `${item.name} ${item.code}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCalendars = workforcePolicyStore.holidayCalendars.filter((item) =>
    `${item.name} ${item.code}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredRemoteWork = workforcePolicyStore.remoteWorkPolicies.filter((item) =>
    `${item.name} ${item.code}`.toLowerCase().includes(search.toLowerCase())
  );
  const activeAssignments = workforcePolicyStore.assignments.filter(
    (assignment) => assignment.state === "active" || assignment.state === "scheduled"
  ).length;

  const openEditor = (
    type: PolicyResourceType,
    mode: EditorState["mode"],
    resource: WorkforcePolicyItem | null = null,
    version: PolicyVersion | null = null
  ) => {
    setEditor({ type, mode, resource, version });
    editorDisclosure.onOpen();
  };

  const openHistory = async (type: PolicyResourceType, resource: WorkforcePolicyItem) => {
    setHistory({ type, resource });
    historyDisclosure.onOpen();
    await workforcePolicyStore.fetchResourceDetail(type, resource._id, companyId).catch(() => undefined);
  };

  const openAssignment = (assignment: WorkforcePolicyAssignment | null = null) => {
    setEndingAssignment(assignment);
    assignmentDisclosure.onOpen();
  };

  const openApprovalEditor = (
    mode: "create" | "edit_draft" | "new_version",
    workflow: ApprovalWorkflowItem | null = null,
    version: ApprovalWorkflowVersion | null = null
  ) => {
    setApprovalEditor({ mode, workflow, version });
    approvalEditorDisclosure.onOpen();
  };

  const openApprovalHistory = (workflow: ApprovalWorkflowItem) => {
    setApprovalHistory(workflow);
    approvalHistoryDisclosure.onOpen();
  };

  const PolicyList = ({
    type,
    items,
  }: {
    type: PolicyResourceType;
    items: WorkforcePolicyItem[];
  }) => {
    const emptyLabel =
      type === "attendance_policy"
        ? "attendance policies"
        : type === "work_schedule"
          ? "work schedules"
          : type === "holiday_calendar"
            ? "holiday calendars"
            : "WFH policies";
    const createLabel =
      type === "attendance_policy" ? "policy" : type === "work_schedule" ? "schedule" : type === "holiday_calendar" ? "calendar" : "WFH policy";
    if (workforcePolicyStore.loading) {
      return <Stack spacing={3}><Skeleton h="72px" /><Skeleton h="72px" /><Skeleton h="72px" /></Stack>;
    }
    if (!items.length) {
      return (
        <Center borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="xl" py={16} bg={useColorModeValue("white", "gray.800")} mb={4}>
          <Stack align="center" spacing={4}>
            <Center bg={useColorModeValue("gray.50", "gray.700")} w={16} h={16} borderRadius="full">
              <Icon as={type === "attendance_policy" ? FiClock : type === "work_schedule" ? FiBriefcase : type === "holiday_calendar" ? FiCalendar : FiWifi} boxSize={8} color="gray.400" />
            </Center>
            <Stack spacing={1} align="center">
              <Text fontWeight="600" fontSize="lg">No {emptyLabel} found</Text>
              <Text color={muted} fontSize="sm">Get started by creating a new {createLabel}</Text>
            </Stack>
            {canManage ? (
              <Button mt={2} colorScheme="blue" size="sm" leftIcon={<FiPlus />} onClick={() => openEditor(type, "create")}>Create {createLabel}</Button>
            ) : null}
          </Stack>
        </Center>
      );
    }

    return (
      <>
        <TableContainer display={{ base: "none", md: "block" }} borderWidth="1px" borderColor={borderColor} borderRadius="md">
          <Table size="sm">
            <Thead bg={tableHeadBg}>
              <Tr><Th>Configuration</Th><Th>Published version</Th><Th>Assignments</Th><Th>Status</Th><Th textAlign="right">Actions</Th></Tr>
            </Thead>
            <Tbody>
              {items.map((item) => (
                <Tr key={item._id}>
                  <Td><Text fontWeight="700">{item.name}</Text><Text fontSize="xs" color={muted}>{item.code}</Text></Td>
                  <Td>
                    {item.latestPublishedVersion ? (
                      <><Text fontWeight="600">v{item.latestPublishedVersion.versionNumber}</Text><Text fontSize="xs" color={muted}>From {formatDate(item.latestPublishedVersion.effectiveFrom)}</Text></>
                    ) : <Badge colorScheme="orange">Draft only</Badge>}
                    {item.draftVersion ? <Badge ml={2} colorScheme="yellow">Draft v{item.draftVersion.versionNumber}</Badge> : null}
                  </Td>
                  <Td>{item.assignmentCount || 0}</Td>
                  <Td><Badge colorScheme={item.status === "active" ? "green" : "gray"}>{item.status}</Badge></Td>
                  <Td>
                    <HStack justify="flex-end" spacing={2}>
                      <Button size="xs" variant="ghost" leftIcon={<FiGitBranch />} onClick={() => openHistory(type, item)}>History</Button>
                      {canManage && item.status === "active" ? (
                        item.draftVersion ? (
                          <Button size="xs" leftIcon={<FiEdit2 />} onClick={() => openEditor(type, "edit_draft", item, item.draftVersion)}>Edit draft</Button>
                        ) : (
                          <Button size="xs" leftIcon={<FiPlus />} onClick={() => openEditor(type, "new_version", item, item.latestPublishedVersion || null)}>New version</Button>
                        )
                      ) : null}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <Stack display={{ base: "flex", md: "none" }} spacing={3}>
          {items.map((item) => (
            <Box key={item._id} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
              <HStack justify="space-between" align="start"><Box><Text fontWeight="800">{item.name}</Text><Text fontSize="xs" color={muted}>{item.code}</Text></Box><Badge colorScheme={item.status === "active" ? "green" : "gray"}>{item.status}</Badge></HStack>
              <SimpleGrid mt={3} columns={2} spacing={3}><Box><Text fontSize="xs" color={muted}>Published</Text><Text fontSize="sm" fontWeight="600">{item.latestPublishedVersion ? `v${item.latestPublishedVersion.versionNumber}` : "None"}</Text></Box><Box><Text fontSize="xs" color={muted}>Assignments</Text><Text fontSize="sm" fontWeight="600">{item.assignmentCount || 0}</Text></Box></SimpleGrid>
              <HStack mt={4} spacing={2}><Button size="xs" variant="outline" onClick={() => openHistory(type, item)}>History</Button>{canManage && item.status === "active" ? (item.draftVersion ? <Button size="xs" onClick={() => openEditor(type, "edit_draft", item, item.draftVersion)}>Edit draft</Button> : <Button size="xs" onClick={() => openEditor(type, "new_version", item, item.latestPublishedVersion || null)}>New version</Button>) : null}</HStack>
            </Box>
          ))}
        </Stack>
      </>
    );
  };

  return (
    <PermissionGate
      allowed={canView}
      title="Workforce policies are disabled"
      description="This account does not have permission to view workforce configurations."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100dvh">
        <Stack spacing={5} maxW="1500px" mx="auto">
          <Stack spacing={6}>
            <PageBanner
              titlePrefix="WORKFORCE"
              titleHighlight="POLICIES"
              subtitle={`EFFECTIVE-DATED POLICIES FOR ${activeCompany?.company_name?.toUpperCase() || "YOUR COMPANY"}`}
              icon={FiBriefcase}
              statLabel={`${activeAssignments} ACTIVE SCOPE`}
              statIcon={FiLink}
              showBackButton={true}
              colorScheme="blue"
            />
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} w="full">
              {[{ label: "Policies", value: workforcePolicyStore.attendancePolicies.length, icon: FiClock }, { label: "Schedules", value: workforcePolicyStore.workSchedules.length, icon: FiBriefcase }, { label: "Approval flows", value: workforcePolicyStore.approvalWorkflows.length, icon: FiCheckSquare }, { label: "Active scope", value: activeAssignments, icon: FiLink }].map((stat) => (
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

          {!companyId ? (
            <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>Select a company before managing workforce policies.</AlertDescription></Alert>
          ) : null}
          {workforcePolicyStore.error ? (
            <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{workforcePolicyStore.error}</AlertDescription></Alert>
          ) : null}

          <Box bg={surface} borderWidth="1px" borderColor={borderColor} borderRadius="xl" overflow="hidden" shadow="sm">
            <Tabs index={tabIndex} onChange={setTabIndex} variant="soft-rounded" colorScheme="blue" size="sm" isLazy>
              <Box px={5} pt={5} pb={3} borderBottomWidth="1px" borderColor={borderColor} overflowX="auto" css={{ "&::-webkit-scrollbar": { display: "none" } }}>
                <TabList
                  gap={2}
                  flexWrap="nowrap"
                  w="max-content"
                  bg={useColorModeValue("gray.100", "gray.900")}
                  p={1}
                  borderRadius="full"
                  display="inline-flex"
                >
                  {[
                    "Attendance policies",
                    "Work schedules",
                    "Holiday calendars",
                    "WFH policies",
                    "Approval flows",
                    "Assignments",
                    "Coverage",
                    "Audit log"
                  ].map((tabLabel, idx) => (
                    <Tab
                      key={idx}
                      whiteSpace="nowrap"
                      fontWeight="medium"
                      color={muted}
                      fontSize="sm"
                      px={{ base: 4, md: 6 }}
                      py={2}
                      borderRadius="full"
                      _selected={{
                        bgGradient: "linear(to-r, blue.500, purple.600)",
                        color: "white",
                        boxShadow: "md"
                      }}
                      _hover={{
                        color: useColorModeValue("gray.900", "white")
                      }}
                      transition="all 0.2s"
                    >
                      {tabLabel}
                    </Tab>
                  ))}
                </TabList>
              </Box>

              <Flex px={5} py={3} borderBottomWidth="1px" borderColor={borderColor} bg={useColorModeValue("gray.50", "gray.800")} justify="space-between" align="center" display={(tabIndex < 4 || (canManage && companyId && tabIndex <= 5)) ? "flex" : "none"}>
                <Box>
                  {tabIndex < 4 ? (
                    <InputGroup size="sm" w={{ base: "full", md: "280px" }}><InputLeftElement><FiSearch color="gray.400" /></InputLeftElement><Input bg={surface} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." /></InputGroup>
                  ) : <Box />}
                </Box>
                <HStack>
                  {canManage && companyId && tabIndex <= 5 ? (
                    <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={() => tabIndex === 0 ? openEditor("attendance_policy", "create") : tabIndex === 1 ? openEditor("work_schedule", "create") : tabIndex === 2 ? openEditor("holiday_calendar", "create") : tabIndex === 3 ? openEditor("remote_work_policy", "create") : tabIndex === 4 ? openApprovalEditor("create") : openAssignment()}>
                      {tabIndex === 0 ? "New policy" : tabIndex === 1 ? "New schedule" : tabIndex === 2 ? "New calendar" : tabIndex === 3 ? "New WFH policy" : tabIndex === 4 ? "New approval flow" : "New assignment"}
                    </Button>
                  ) : null}
                </HStack>
              </Flex>
              <TabPanels p={2}>
                <TabPanel><PolicyList type="attendance_policy" items={filteredAttendance} /></TabPanel>
                <TabPanel><PolicyList type="work_schedule" items={filteredSchedules} /></TabPanel>
                <TabPanel><PolicyList type="holiday_calendar" items={filteredCalendars} /></TabPanel>
                <TabPanel><PolicyList type="remote_work_policy" items={filteredRemoteWork} /></TabPanel>
                <TabPanel>
                  <ApprovalWorkflowsPanel canManage={canManage} borderColor={borderColor} muted={muted} tableHeadBg={tableHeadBg} onEdit={openApprovalEditor} onHistory={openApprovalHistory} />
                </TabPanel>
                <TabPanel>
                  <PolicyAssignmentsPanel companyId={companyId} canManage={canManage} borderColor={borderColor} muted={muted} onEndAssignment={openAssignment} />
                </TabPanel>
                <TabPanel>
                  <PolicyCoveragePanel
                    companyId={companyId}
                    borderColor={borderColor}
                    muted={muted}
                    onManageAssignments={() => setTabIndex(5)}
                  />
                </TabPanel>
                <TabPanel><PolicyAuditPanel companyId={companyId} borderColor={borderColor} muted={muted} /></TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Stack>

        <AttendancePolicyDrawer isOpen={editorDisclosure.isOpen && editor.type === "attendance_policy"} onClose={editorDisclosure.onClose} companyId={companyId} mode={editor.mode} resource={editor.resource} version={editor.version} onSaved={refresh} />
        <WorkScheduleDrawer isOpen={editorDisclosure.isOpen && editor.type === "work_schedule"} onClose={editorDisclosure.onClose} companyId={companyId} mode={editor.mode} resource={editor.resource} version={editor.version} onSaved={refresh} />
        <HolidayCalendarDrawer isOpen={editorDisclosure.isOpen && editor.type === "holiday_calendar"} onClose={editorDisclosure.onClose} companyId={companyId} mode={editor.mode} resource={editor.resource} version={editor.version} onSaved={refresh} />
        <RemoteWorkPolicyDrawer isOpen={editorDisclosure.isOpen && editor.type === "remote_work_policy"} onClose={editorDisclosure.onClose} companyId={companyId} mode={editor.mode} resource={editor.resource} version={editor.version} onSaved={refresh} />
        <ApprovalWorkflowDrawer isOpen={approvalEditorDisclosure.isOpen} onClose={approvalEditorDisclosure.onClose} companyId={companyId} mode={approvalEditor.mode} workflow={approvalEditor.workflow} version={approvalEditor.version} onSaved={refresh} />
        <ApprovalWorkflowHistoryDrawer isOpen={approvalHistoryDisclosure.isOpen} onClose={approvalHistoryDisclosure.onClose} companyId={companyId} workflow={approvalHistory} canManage={canManage} onSaved={refresh} />
        <PolicyHistoryDrawer isOpen={historyDisclosure.isOpen} onClose={historyDisclosure.onClose} resourceType={history.type} resource={history.resource} />
        <PolicyAssignmentDrawer isOpen={assignmentDisclosure.isOpen} onClose={assignmentDisclosure.onClose} companyId={companyId} attendancePolicies={workforcePolicyStore.attendancePolicies} workSchedules={workforcePolicyStore.workSchedules} holidayCalendars={workforcePolicyStore.holidayCalendars} leavePolicies={workforcePolicyStore.leavePolicies} remoteWorkPolicies={workforcePolicyStore.remoteWorkPolicies} scopeOptions={scopeOptions} assignment={endingAssignment} onSaved={refresh} />
      </Box>
    </PermissionGate>
  );
});

export default WorkforcePoliciesWorkspace;
