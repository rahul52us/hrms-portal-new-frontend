"use client";

import { Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormLabel, Heading, HStack, IconButton, Input, Select, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr, useColorModeValue } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import stores from "@/app/store/stores";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { emptyPage, PageResult, Project, projectGet, ProjectOptions } from "./projectApi";
import ProjectPagination from "./ProjectPagination";
import ProjectDrawer from "./ProjectDrawer";
import PermissionGate from "@/app/component/common/PermissionGate";

export default observer(function ProjectsWorkspace() {
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const [options, setOptions] = useState<ProjectOptions | null>(null);
  const [scope, setScope] = useState<"all" | "managed" | "">("");
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Project[]>([]);
  const [pagination, setPagination] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [opened, setOpened] = useState<{ id?: string } | null>(null);
  const ready = stores.auth.sessionReady && Boolean(stores.auth.user);
  const superadmin = String(stores.auth.user?.role || "").toLowerCase() === "superadmin";
  const sessionAccess = stores.auth.user?.projectAccess?.canAccessWorkspace === true;
  const canAccessWorkspace = sessionAccess && (options?.canAccessWorkspace ?? true);
  useEffect(() => {
    const timeout = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(timeout);
  }, [search]);
  useEffect(() => {
    if (!ready || superadmin || !sessionAccess) return;
    const controller = new AbortController();
    projectGet<{ data: ProjectOptions }>("/options", undefined, controller.signal).then(({ data }) => {
      if (controller.signal.aborted) return;
      setOptions(data); setScope((value) => value && data.scopes.includes(value) ? value : data.scopes.includes("all") ? "all" : data.scopes.includes("managed") ? "managed" : "");
      if (!data.canAccessWorkspace) setLoading(false);
    }).catch((err) => { if (!controller.signal.aborted) { setError(getApiErrorMessage(err?.response?.data || err, "Unable to load project access")); setLoading(false); } });
    return () => controller.abort();
  }, [ready, superadmin, sessionAccess, revision]);
  useEffect(() => {
    if (!ready || !canAccessWorkspace || !scope) return;
    const controller = new AbortController();
    setLoading(true); setError("");
    projectGet<PageResult<Project>>("", { scope, status, search: query || undefined, page, limit: 20 }, controller.signal)
      .then((result) => { if (!controller.signal.aborted) { setRows(result.data); setPagination(result.pagination); } })
      .catch((err) => { if (!controller.signal.aborted) { setRows([]); setError(getApiErrorMessage(err?.response?.data || err, "Unable to load projects")); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [ready, canAccessWorkspace, scope, status, query, page, revision]);
  if (superadmin) return <Box p={6}><Alert status="info"><AlertIcon />Projects are available from company accounts.</Alert></Box>;
  if (!ready) return <Stack p={6}><Skeleton h="45px" /><Skeleton h="120px" /></Stack>;
  return <PermissionGate allowed={canAccessWorkspace} title="Project management only" description="This workspace is available to project managers and authorized HR users." fallbackHref="/dashboard/calendar"><Box p={{ base: 3, md: 6 }} minW={0}><Stack spacing={5} maxW="1500px" mx="auto">
    <Flex justify="space-between" align="center" gap={3} wrap="wrap"><Heading size="lg">Projects</Heading><HStack>
      <Tooltip label="Refresh projects"><IconButton aria-label="Refresh projects" variant="outline" icon={<FiRefreshCw />} onClick={() => setRevision((value) => value + 1)} /></Tooltip>
      {options?.canCreate && <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => setOpened({})}>New project</Button>}
    </HStack></Flex>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    <Flex gap={3} wrap="wrap" align="end">
      <FormControl flex="1" minW={{ base: "100%", sm: "220px" }}><FormLabel fontSize="sm" htmlFor="project-search">Search</FormLabel><Input id="project-search" placeholder="Project name or code" maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} /></FormControl>
      {options && options.scopes.length > 1 && <FormControl w={{ base: "100%", sm: "190px" }}><FormLabel fontSize="sm" htmlFor="project-scope">View</FormLabel><Select id="project-scope" value={scope} onChange={(event) => { setScope(event.target.value as "all" | "managed"); setPage(1); }}>{options.scopes.map((item) => <option key={item} value={item}>{{ managed: "Managed by me", all: "Company projects" }[item]}</option>)}</Select></FormControl>}
      <FormControl w={{ base: "100%", sm: "160px" }}><FormLabel fontSize="sm" htmlFor="project-status">Status</FormLabel><Select id="project-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="active">Active</option><option value="archived">Archived</option><option value="all">All statuses</option></Select></FormControl>
    </Flex>
    <Box borderWidth="1px" borderColor={border} borderRadius="md" bg={surface} overflow="hidden" minW={0}>
      {loading ? <Stack p={5}>{[0, 1, 2].map((value) => <Skeleton key={value} h="52px" />)}</Stack> : <>
        <TableContainer><Table size="sm"><Thead><Tr><Th>Project</Th><Th>Managers</Th><Th>Project dates</Th><Th>Status</Th></Tr></Thead>
          <Tbody>{rows.map((project) => <Tr key={project._id}><Td py={4} maxW="350px" whiteSpace="normal"><Button variant="link" textAlign="left" whiteSpace="normal" overflowWrap="anywhere" onClick={() => setOpened({ id: project._id })}>{project.name}</Button><Text mt={1} color="gray.500" fontSize="xs">{project.code}</Text></Td>
            <Td whiteSpace="normal" maxW="260px">{project.managers.map((person) => person.name || person.code).join(", ")}</Td>
            <Td>{project.startDate} to {project.endDate || "Ongoing"}</Td><Td><Badge colorScheme={project.status === "active" ? "green" : "gray"}>{project.status}</Badge></Td></Tr>)}</Tbody>
        </Table></TableContainer>
        {!rows.length && <Text p={10} textAlign="center" color="gray.500">No projects found.</Text>}
        <ProjectPagination value={pagination} loading={loading} onPage={setPage} />
      </>}
    </Box>
  </Stack>
    {options && <ProjectDrawer open={Boolean(opened)} projectId={opened?.id} options={options} onClose={() => setOpened(null)} onCreated={(id) => setOpened({ id })} onChanged={() => setRevision((value) => value + 1)} />}
  </Box></PermissionGate>;
});
