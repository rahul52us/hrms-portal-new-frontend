"use client";

import { Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormLabel, HStack, IconButton, Input, Select, SimpleGrid, Skeleton, Stack, Tab, TabList, TabPanel, TabPanels, Table, TableContainer, Tabs, Tbody, Td, Text, Textarea, Th, Thead, Tooltip, Tr, useToast } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import { FiArrowLeft, FiEdit2, FiPlus, FiUserMinus } from "react-icons/fi";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { Assignment, emptyPage, PageResult, Person, Project, projectGet, ProjectOptions, projectSave, WorkType } from "./projectApi";
import ProjectPagination from "./ProjectPagination";

type Mode = "detail" | "project" | "work" | "assign" | "end" | "status";
type Choice = { value: string; label: string };
const choice = (person: Person): Choice => ({ value: person._id, label: `${person.name || "Employee"}${person.code ? ` (${person.code})` : ""}` });

export default function ProjectDrawer({ open, projectId, options, onClose, onCreated, onChanged }: {
  open: boolean; projectId?: string; options: ProjectOptions; onClose: () => void; onCreated: (id: string) => void; onChanged: () => void;
}) {
  const toast = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [mode, setMode] = useState<Mode>("detail");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({});
  const [people, setPeople] = useState<Choice[]>([]);
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [rows, setRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState(emptyPage);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const field = (key: string, value: unknown) => setForm((current: any) => ({ ...current, [key]: value }));
  const resetProjectForm = useCallback((value: Project | null) => {
    setForm({ name: value?.name || "", description: value?.description || "", startDate: value?.startDate || options.today, endDate: value?.endDate || "", reason: "" });
    setPeople((value?.managers || [options.self]).map(choice));
  }, [options.today, options.self]);
  useEffect(() => {
    if (!open) return;
    setError(""); setTab(0); setPage(1); setFilter("all"); setRows([]); setProject(null);
    if (!projectId) { setMode("project"); resetProjectForm(null); return; }
    const controller = new AbortController();
    setMode("detail"); setLoading(true);
    projectGet<{ data: Project }>(`/${projectId}`, undefined, controller.signal).then(({ data }) => setProject(data))
      .catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Unable to load project")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, projectId]);
  useEffect(() => {
    if (!open || !project || mode !== "detail") return;
    const controller = new AbortController();
    const section = tab === 0 ? "work-types" : tab === 1 ? "assignments" : "audit";
    setRowsLoading(true); setRowsError(""); setRows([]);
    projectGet<PageResult<any>>(`/${project._id}/${section}`, { page, limit: 20, ...(tab < 2 ? { status: filter } : {}) }, controller.signal)
      .then((result) => { setRows(result.data); setPagination(result.pagination); })
      .catch((err) => { if (!controller.signal.aborted) setRowsError(getApiErrorMessage(err?.response?.data || err, "Unable to load project details")); })
      .finally(() => { if (!controller.signal.aborted) setRowsLoading(false); });
    return () => controller.abort();
  }, [open, project?._id, project?.revision, mode, tab, page, filter, refresh]);
  const loadPeople = async (search: string) => {
    try {
      const result = await projectGet<PageResult<Person>>("/people", { search: search || undefined, kind: mode === "project" ? "manager" : "employee", projectId: project?._id, limit: 50 });
      return result.data.map(choice);
    } catch (err: any) {
      toast({ title: getApiErrorMessage(err?.response?.data || err, "Unable to search employees"), status: "error" }); return [];
    }
  };
  const changeMode = (next: Mode, values: any = {}) => { setForm(values); setError(""); setPeople([]); setMode(next); };
  const save = async () => {
    setSaving(true); setError("");
    try {
      let result: any;
      const prefix = project ? `/${project._id}` : "";
      const base = { revision: project?.revision, reason: form.reason };
      if (mode === "project") {
        result = await projectSave(prefix, { ...base, name: form.name, description: form.description,
          startDate: form.startDate, endDate: form.endDate || null,
          ...(options.canAdmin ? { managerIds: people.map((person) => person.value) } : {}) }, project ? "put" : "post");
        if (!project) { onCreated(result.data._id); onChanged(); toast({ title: "Project created", status: "success" }); return; }
      } else if (mode === "work") {
        result = await projectSave(`${prefix}/work-types${form._id ? `/${form._id}` : ""}`, { ...base, name: form.name, status: form.status || "active" }, form._id ? "put" : "post");
      } else if (mode === "assign") {
        result = await projectSave(`${prefix}/assignments`, { ...base, employeeIds: people.map((person) => person.value), effectiveFrom: form.effectiveFrom, effectiveTo: form.effectiveTo || null });
      } else if (mode === "end") {
        result = await projectSave(`${prefix}/assignments/${form._id}/end`, { ...base, effectiveTo: form.effectiveTo, cancel: form.action === "cancel" });
      } else {
        result = await projectSave(`${prefix}/${project!.status === "active" ? "archive" : "restore"}`, base);
      }
      const { data } = await projectGet<{ data: Project }>(prefix);
      setProject(data); setMode("detail"); onChanged();
      toast({ title: result.message || "Project saved", status: "success" });
    } catch (err: any) { setError(getApiErrorMessage(err?.response?.data || err, "Unable to save changes")); }
    finally { setSaving(false); }
  };
  const needsReason = mode !== "detail" && (mode !== "project" || Boolean(project)) && (mode !== "work" || Boolean(form._id));
  const valid = mode === "project" ? form.name?.trim().length >= 2 && form.startDate && (!options.canAdmin || people.length > 0)
    : mode === "work" ? form.name?.trim().length >= 2
      : mode === "assign" ? people.length > 0 && people.length <= 100 && form.effectiveFrom
        : mode === "end" ? form.action === "cancel" || Boolean(form.effectiveTo) : true;
  const title = mode === "detail" ? project?.name || "Project" : mode === "project" ? project ? "Edit project" : "New project"
    : mode === "work" ? form._id ? "Edit work type" : "New work type"
      : mode === "assign" ? "Assign employees" : mode === "end" ? "End assignment" : project?.status === "active" ? "Archive project" : "Restore project";
  return <DashboardDrawer isOpen={open} onClose={saving ? () => undefined : onClose} titlePrefix={title} subtitle={mode === "detail" ? project?.code : project?.name}
    maxW={{ base: "100%", md: "820px" }} footerContent={mode !== "detail" ? <HStack w="full" justify="end"><Button variant="ghost" isDisabled={saving} onClick={() => project ? setMode("detail") : onClose()}>Cancel</Button><Button colorScheme={mode === "status" && project?.status === "active" ? "red" : "blue"} isLoading={saving} isDisabled={!valid || (needsReason && form.reason?.trim().length < 3) || (needsReason && !form.reason)} onClick={() => void save()}>{mode === "assign" ? "Assign employees" : mode === "status" ? project?.status === "active" ? "Archive project" : "Restore project" : "Save"}</Button></HStack> : undefined}>
    {loading ? <Stack><Skeleton h="80px" /><Skeleton h="220px" /></Stack> : <Stack spacing={5}>
      {error && <Alert status="error"><AlertIcon />{error}</Alert>}
      {mode !== "detail" && project && <Button alignSelf="start" leftIcon={<FiArrowLeft />} size="sm" variant="ghost" isDisabled={saving} onClick={() => setMode("detail")}>Back to project</Button>}
      {mode === "project" && <>
        <FormControl isRequired><FormLabel htmlFor="project-name">Project name</FormLabel><Input id="project-name" maxLength={120} value={form.name || ""} onChange={(event) => field("name", event.target.value)} /></FormControl>
        <FormControl><FormLabel htmlFor="project-description">Description</FormLabel><Textarea id="project-description" maxLength={1000} value={form.description || ""} onChange={(event) => field("description", event.target.value)} /></FormControl>
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}><FormControl isRequired><FormLabel htmlFor="project-start">Start date</FormLabel><Input id="project-start" type="date" value={form.startDate || ""} onChange={(event) => field("startDate", event.target.value)} /></FormControl><FormControl><FormLabel htmlFor="project-end">End date</FormLabel><Input id="project-end" type="date" min={form.startDate} value={form.endDate || ""} onChange={(event) => field("endDate", event.target.value)} /></FormControl></SimpleGrid>
        {options.canAdmin ? <FormControl isRequired><FormLabel htmlFor="project-managers">Project managers</FormLabel><AsyncSelect key={`managers-${projectId || "new"}`} inputId="project-managers" isMulti defaultOptions loadOptions={loadPeople} value={people} onChange={(value) => setPeople([...value])} placeholder="Search by employee name or code" /></FormControl> : <Box><Text fontSize="sm" color="gray.500">Project managers</Text><Text>{project ? project.managers.map((person) => person.name).join(", ") : options.self.name}</Text></Box>}
      </>}
      {mode === "work" && <>
        <FormControl isRequired><FormLabel htmlFor="work-type-name">Work type name</FormLabel><Input id="work-type-name" maxLength={100} placeholder="Feature Development, Meeting, Enhancement" value={form.name || ""} onChange={(event) => field("name", event.target.value)} /></FormControl>
        {form._id && <FormControl><FormLabel htmlFor="work-type-status">Status</FormLabel><Select id="work-type-status" value={form.status} onChange={(event) => field("status", event.target.value)}><option value="active">Active</option><option value="archived">Archived</option></Select></FormControl>}
      </>}
      {mode === "assign" && <>
        <FormControl isRequired><FormLabel htmlFor="project-employees">Employees</FormLabel><AsyncSelect key={`employees-${projectId}`} inputId="project-employees" isMulti defaultOptions loadOptions={loadPeople} value={people} onChange={(value) => setPeople([...value])} placeholder="Search by employee name or code" /></FormControl>
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}><FormControl isRequired><FormLabel htmlFor="assignment-start">Assigned from</FormLabel><Input id="assignment-start" type="date" min={project?.startDate} max={project?.endDate || undefined} value={form.effectiveFrom || ""} onChange={(event) => field("effectiveFrom", event.target.value)} /></FormControl><FormControl><FormLabel htmlFor="assignment-end">Last project day</FormLabel><Input id="assignment-end" type="date" min={form.effectiveFrom} max={project?.endDate || undefined} value={form.effectiveTo || ""} onChange={(event) => field("effectiveTo", event.target.value)} /></FormControl></SimpleGrid>
      </>}
      {mode === "end" && <>
        <Text fontWeight="600">{form.employeeNameSnapshot}</Text>
        {form.effectiveFrom > options.today && <FormControl><FormLabel htmlFor="assignment-action">Action</FormLabel><Select id="assignment-action" value={form.action} onChange={(event) => field("action", event.target.value)}><option value="end">Set last project day</option><option value="cancel">Cancel future assignment</option></Select></FormControl>}
        {form.action !== "cancel" && <FormControl isRequired><FormLabel htmlFor="last-project-day">Last project day</FormLabel><Input id="last-project-day" type="date" min={form.effectiveFrom > options.today ? form.effectiveFrom : options.today} value={form.effectiveTo || ""} onChange={(event) => field("effectiveTo", event.target.value)} /></FormControl>}
      </>}
      {mode === "status" && <Alert status="warning"><AlertIcon />{project?.status === "active" ? "Archiving removes this project from new assignments. Existing employee assignments and history are retained." : "Restoring makes this project available again within its project dates."}</Alert>}
      {needsReason && <FormControl isRequired><FormLabel htmlFor="project-change-reason">Reason</FormLabel><Textarea id="project-change-reason" minLength={3} maxLength={500} value={form.reason || ""} onChange={(event) => field("reason", event.target.value)} /></FormControl>}
      {mode === "detail" && project && <>
        <Flex justify="space-between" align="start" wrap="wrap" gap={3}><Box><Badge colorScheme={project.status === "active" ? "green" : "gray"}>{project.status}</Badge><Text mt={2} fontSize="sm">{project.startDate} to {project.endDate || "Ongoing"}</Text><Text mt={1} fontSize="sm" color="gray.500">{project.managers.map((person) => person.name || person.code).join(", ")}</Text></Box>
          {project.canManage && <HStack flexWrap="wrap">{project.status === "active" && <Button size="sm" variant="outline" leftIcon={<FiEdit2 />} onClick={() => { resetProjectForm(project); setMode("project"); }}>Edit project</Button>}<Button size="sm" variant="outline" onClick={() => changeMode("status", { reason: "" })}>{project.status === "active" ? "Archive" : "Restore"}</Button></HStack>}
        </Flex>
        {project.description && <Text whiteSpace="pre-wrap" overflowWrap="anywhere">{project.description}</Text>}
        <Tabs index={tab} onChange={(value) => { setTab(value); setPage(1); setFilter("all"); }} isLazy><TabList><Tab>Work types</Tab><Tab>{project.canManage || options.canAdmin ? "Employees" : "My assignment history"}</Tab>{project.canManage && <Tab>Activity</Tab>}</TabList>
          <TabPanels>{[0, 1, ...(project.canManage ? [2] : [])].map((panel) => panel !== tab ? <TabPanel key={panel} /> : <TabPanel key={panel} px={0}>
            <Flex gap={3} justify="space-between" wrap="wrap" mb={4}>
              {panel < 2 ? <Select aria-label={panel === 0 ? "Work type status" : "Assignment status"} maxW="190px" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}>
                <option value="all">All statuses</option>{(panel === 0 ? ["active", "archived"] : ["current", "upcoming", "ended", "cancelled"]).map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
              </Select> : <Text fontWeight="600">Project history</Text>}
              {project.canManage && project.status === "active" && panel < 2 && <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={() => panel === 0 ? changeMode("work", { name: "", status: "active" }) : changeMode("assign", { effectiveFrom: options.today < project.startDate ? project.startDate : options.today, effectiveTo: project.endDate || "", reason: "" })}>{panel === 0 ? "Add work type" : "Assign employees"}</Button>}
            </Flex>
            {rowsError && <Alert status="error"><AlertIcon />{rowsError}<Button ml="auto" size="sm" variant="ghost" onClick={() => setRefresh((value) => value + 1)}>Retry</Button></Alert>}
            {rowsLoading ? <Stack><Skeleton h="45px" /><Skeleton h="45px" /></Stack> : <>
              {panel === 0 && <TableContainer><Table size="sm"><Thead><Tr><Th>Work type</Th><Th>Status</Th>{project.canManage && <Th>Actions</Th>}</Tr></Thead><Tbody>{(rows as WorkType[]).map((row) => <Tr key={row._id}><Td whiteSpace="normal" py={3}>{row.name}</Td><Td><Badge colorScheme={row.status === "active" ? "green" : "gray"}>{row.status}</Badge></Td>{project.canManage && <Td>{project.status === "active" && <Tooltip label="Edit work type"><IconButton aria-label={`Edit ${row.name}`} size="sm" variant="ghost" icon={<FiEdit2 />} onClick={() => changeMode("work", { ...row, reason: "" })} /></Tooltip>}</Td>}</Tr>)}</Tbody></Table></TableContainer>}
              {panel === 1 && <TableContainer><Table size="sm"><Thead><Tr><Th>Employee</Th><Th>Assigned from</Th><Th>Last project day</Th><Th>Status</Th>{project.canManage && <Th />}</Tr></Thead><Tbody>{(rows as Assignment[]).map((row) => <Tr key={row._id}><Td whiteSpace="normal" py={3}>{row.employeeNameSnapshot}<Text fontSize="xs" color="gray.500">{row.employeeCodeSnapshot}</Text></Td><Td>{row.effectiveFrom}</Td><Td>{row.effectiveTo || "Ongoing"}</Td><Td><Badge>{row.status === "cancelled" ? "Cancelled" : row.effectiveFrom > options.today ? "Upcoming" : row.effectiveTo && row.effectiveTo < options.today ? "Ended" : "Current"}</Badge></Td>{project.canManage && <Td>{row.status !== "cancelled" && (!row.effectiveTo || row.effectiveTo > options.today) && <Tooltip label="End or cancel assignment"><IconButton aria-label={`End assignment for ${row.employeeNameSnapshot}`} size="sm" variant="ghost" icon={<FiUserMinus />} onClick={() => changeMode("end", { ...row, effectiveTo: row.effectiveFrom > options.today ? row.effectiveFrom : options.today, action: row.effectiveFrom > options.today ? "cancel" : "end", reason: "" })} /></Tooltip>}</Td>}</Tr>)}</Tbody></Table></TableContainer>}
              {panel === 2 && <Stack spacing={0}>{rows.map((row) => <Box key={row._id} py={3} borderBottomWidth="1px"><Text fontWeight="600">{row.action.replace(/_/g, " ")}</Text><Text fontSize="sm">{row.actor?.name || "Employee"} | {new Date(row.createdAt).toLocaleString()}</Text><Text mt={1} fontSize="sm" color="gray.500">{row.reason}</Text>{row.after?.employeeNameSnapshot && <Text fontSize="sm">{row.after.employeeNameSnapshot}</Text>}</Box>)}</Stack>}
              {!rows.length && !rowsError && <Text py={8} textAlign="center" color="gray.500">{panel === 0 ? "No work types." : panel === 1 ? "No employee assignments." : "No activity."}</Text>}
              <ProjectPagination value={pagination} loading={rowsLoading} onPage={setPage} />
            </>}
          </TabPanel>)}</TabPanels>
        </Tabs>
      </>}
    </Stack>}
  </DashboardDrawer>;
}
