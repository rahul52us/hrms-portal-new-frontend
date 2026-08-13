"use client";

import axios from "axios";
import PermissionGate from "@/app/component/common/PermissionGate";
import { hasPermission, PERMISSION_KEYS } from "@/app/config/utils/permissions";
import { departmentStore } from "@/app/store/departmentStore/departmentStore";
import { locationStore } from "@/app/store/locationStore/locationStore";
import stores from "@/app/store/stores";
import {
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
  FiClock,
  FiEdit2,
  FiGitBranch,
  FiLink,
  FiPlus,
  FiSearch,
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
  const role = String(auth.userType || auth.user?.role || "").toLowerCase();
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
  const editorDisclosure = useDisclosure();
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
              label: `${user.name || user.email} (${user.email || user.role})`,
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
          : "holiday calendars";
    const createLabel =
      type === "attendance_policy" ? "policy" : type === "work_schedule" ? "schedule" : "calendar";
    if (workforcePolicyStore.loading) {
      return <Stack spacing={3}><Skeleton h="72px" /><Skeleton h="72px" /><Skeleton h="72px" /></Stack>;
    }
    if (!items.length) {
      return (
        <Center borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md" py={12}>
          <Stack align="center" spacing={3}>
            <Icon as={type === "attendance_policy" ? FiClock : type === "work_schedule" ? FiBriefcase : FiCalendar} boxSize={7} color="gray.400" />
            <Text color={muted}>No {emptyLabel} found.</Text>
            {canManage ? (
              <Button size="sm" leftIcon={<FiPlus />} onClick={() => openEditor(type, "create")}>Create first {createLabel}</Button>
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
      <Box minH="100dvh" bg={pageBg} px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
        <Stack spacing={5} maxW="1500px" mx="auto">
          <Flex direction={{ base: "column", lg: "row" }} justify="space-between" align={{ base: "stretch", lg: "end" }} gap={4}>
            <Box>
              <Heading size={{ base: "md", md: "lg" }}>Workforce policies</Heading>
              <Text mt={1} fontSize="sm" color={muted}>
                Effective-dated attendance policies, work schedules, holiday calendars, and assignments for {activeCompany?.company_name || "the selected company"}.
              </Text>
            </Box>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} minW={{ lg: "620px" }}>
              {[{ label: "Policies", value: workforcePolicyStore.attendancePolicies.length, icon: FiClock }, { label: "Schedules", value: workforcePolicyStore.workSchedules.length, icon: FiBriefcase }, { label: "Calendars", value: workforcePolicyStore.holidayCalendars.length, icon: FiCalendar }, { label: "Active scope", value: activeAssignments, icon: FiLink }].map((stat) => (
                <HStack key={stat.label} bg={surface} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={3} minW={0}>
                  <Icon as={stat.icon} color="blue.500" flexShrink={0} /><Box minW={0}><Text fontSize="xs" color={muted} noOfLines={1}>{stat.label}</Text><Text fontWeight="800">{stat.value}</Text></Box>
                </HStack>
              ))}
            </SimpleGrid>
          </Flex>

          {!companyId ? (
            <Alert status="warning" borderRadius="md"><AlertIcon /><AlertDescription>Select a company before managing workforce policies.</AlertDescription></Alert>
          ) : null}
          {workforcePolicyStore.error ? (
            <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{workforcePolicyStore.error}</AlertDescription></Alert>
          ) : null}

          <Box bg={surface} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
            <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="blue" isLazy>
              <Flex direction={{ base: "column", md: "row" }} justify="space-between" gap={3} px={4} pt={4}>
                <TabList overflowX="auto"><Tab whiteSpace="nowrap">Attendance policies</Tab><Tab whiteSpace="nowrap">Work schedules</Tab><Tab whiteSpace="nowrap">Holiday calendars</Tab><Tab whiteSpace="nowrap">Assignments</Tab><Tab whiteSpace="nowrap">Coverage</Tab><Tab whiteSpace="nowrap">Audit log</Tab></TabList>
                <HStack pb={{ base: 0, md: 2 }}>
                  {tabIndex < 3 ? (
                    <InputGroup size="sm" maxW="260px"><InputLeftElement><FiSearch /></InputLeftElement><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" /></InputGroup>
                  ) : null}
                  {canManage && companyId && tabIndex <= 3 ? (
                    <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} flexShrink={0} onClick={() => tabIndex === 0 ? openEditor("attendance_policy", "create") : tabIndex === 1 ? openEditor("work_schedule", "create") : tabIndex === 2 ? openEditor("holiday_calendar", "create") : openAssignment()}>
                      {tabIndex === 0 ? "New policy" : tabIndex === 1 ? "New schedule" : tabIndex === 2 ? "New calendar" : "New assignment"}
                    </Button>
                  ) : null}
                </HStack>
              </Flex>
              <TabPanels>
                <TabPanel><PolicyList type="attendance_policy" items={filteredAttendance} /></TabPanel>
                <TabPanel><PolicyList type="work_schedule" items={filteredSchedules} /></TabPanel>
                <TabPanel><PolicyList type="holiday_calendar" items={filteredCalendars} /></TabPanel>
                <TabPanel>
                  <PolicyAssignmentsPanel companyId={companyId} canManage={canManage} borderColor={borderColor} muted={muted} onEndAssignment={openAssignment} />
                </TabPanel>
                <TabPanel>
                  <PolicyCoveragePanel
                    companyId={companyId}
                    borderColor={borderColor}
                    muted={muted}
                    onManageAssignments={() => setTabIndex(3)}
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
        <PolicyHistoryDrawer isOpen={historyDisclosure.isOpen} onClose={historyDisclosure.onClose} resourceType={history.type} resource={history.resource} />
        <PolicyAssignmentDrawer isOpen={assignmentDisclosure.isOpen} onClose={assignmentDisclosure.onClose} companyId={companyId} attendancePolicies={workforcePolicyStore.attendancePolicies} workSchedules={workforcePolicyStore.workSchedules} holidayCalendars={workforcePolicyStore.holidayCalendars} scopeOptions={scopeOptions} assignment={endingAssignment} onSaved={refresh} />
      </Box>
    </PermissionGate>
  );
});

export default WorkforcePoliciesWorkspace;
