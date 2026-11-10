"use client";

import { Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormLabel, Heading, HStack, IconButton, Input, Select, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr, useColorModeValue } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import stores from "@/app/store/stores";
import { hasPermission, PERMISSION_KEYS } from "@/app/config/utils/permissions";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import PermissionGate from "@/app/component/common/PermissionGate";
import Pagination from "@/app/component/common/pagination/Pagination";
import { emptyPage, onboardingGet, Page, Template } from "./onboardingApi";
import TemplateDrawer from "./TemplateDrawer";

export default observer(function ChecklistTemplatesWorkspace({ embedded = false }: { embedded?: boolean }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const [search, setSearch] = useState(""), [query, setQuery] = useState(""), [status, setStatus] = useState("all"), [page, setPage] = useState(1);
  const [rows, setRows] = useState<Template[]>([]), [pagination, setPagination] = useState(emptyPage);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [refresh, setRefresh] = useState(0);
  const [opened, setOpened] = useState<{ id?: string } | null>(null);
  const user = stores.auth.user, ready = stores.auth.sessionReady && Boolean(user);
  const accountKey = `${user?._id || ""}:${user?.company?._id || user?.company || ""}`;
  const canView = String(user?.role || "").toLowerCase() !== "superadmin" && hasPermission(user, PERMISSION_KEYS.VIEW_ONBOARDING_TEMPLATES);
  const canManage = hasPermission(user, PERMISSION_KEYS.MANAGE_ONBOARDING_TEMPLATES);
  useEffect(() => { setOpened(null); setRows([]); setPagination(emptyPage); setPage(1); }, [accountKey]);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    if (!ready || !canView) return;
    const controller = new AbortController(); setLoading(true); setError("");
    onboardingGet<Page<Template>>("/templates", { search: query || undefined, status, page, limit: 20 }, controller.signal)
      .then((result) => { if (!controller.signal.aborted) { setRows(result.data); setPagination(result.pagination); } })
      .catch((err) => { if (!controller.signal.aborted) { setError(getApiErrorMessage(err?.response?.data || err, "Unable to load checklist templates")); setRows([]); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [ready, canView, accountKey, query, status, page, refresh]);
  if (!ready) return <Stack p={6}><Skeleton h="40px" /><Skeleton h="150px" /></Stack>;
  return <PermissionGate allowed={canView} title="Onboarding access required" description="Contact your company administrator for checklist template access."><Box p={embedded ? 0 : { base: 3, md: 6 }} minW={0}><Stack maxW="1500px" mx="auto" spacing={5}>
    <Flex justify="space-between" align="center" wrap="wrap" gap={3}><Heading size="md">Checklist templates</Heading><HStack>
      <Tooltip label="Refresh templates"><IconButton aria-label="Refresh templates" variant="outline" icon={<FiRefreshCw />} onClick={() => setRefresh((n) => n + 1)} /></Tooltip>
      {canManage && <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => setOpened({})}>New checklist template</Button>}
    </HStack></Flex>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    <Flex gap={4} align="end" wrap="wrap"><FormControl flex="1" minW={{ base: "100%", sm: "220px" }}><FormLabel htmlFor="onboarding-search">Search templates</FormLabel><Input id="onboarding-search" placeholder="Template name" maxLength={100} value={search} onChange={(e) => setSearch(e.target.value)} /></FormControl>
      <FormControl w={{ base: "100%", sm: "190px" }}><FormLabel htmlFor="onboarding-status">Status</FormLabel><Select id="onboarding-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></FormControl></Flex>
    <Box borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden" minW={0}>
      {loading ? <Stack p={5}><Skeleton h="55px" /><Skeleton h="55px" /></Stack> : <>
        <TableContainer><Table size="sm"><Thead><Tr><Th>Template</Th><Th>Tasks</Th><Th>Status</Th><Th>Published version</Th><Th>Last updated</Th></Tr></Thead><Tbody>
          {rows.map((row) => <Tr key={row._id}><Td py={4} whiteSpace="normal" maxW="420px"><Button variant="link" textAlign="left" whiteSpace="normal" overflowWrap="anywhere" onClick={() => setOpened({ id: row._id })}>{row.name}</Button><Text mt={1} fontSize="sm" color="gray.500" noOfLines={2}>{row.description}</Text></Td>
            <Td>{row.taskCount || 0}</Td><Td><HStack wrap="wrap"><Badge colorScheme={row.status === "published" ? "green" : row.status === "draft" ? "yellow" : "gray"}>{row.status}</Badge>{row.publishedVersion > 0 && row.hasDraft && <Badge colorScheme="yellow">Unpublished changes</Badge>}</HStack></Td><Td>{row.publishedVersion ? `v${row.publishedVersion}` : "Not published"}</Td><Td>{new Date(row.updatedAt).toLocaleDateString("en-GB")}</Td></Tr>)}
        </Tbody></Table></TableContainer>
        {!rows.length && <Text p={10} textAlign="center" color="gray.500">{query || status !== "all" ? "No matching checklist templates." : "No checklist templates yet."}</Text>}
        <Flex p={3} gap={3} justify="space-between" align="center" wrap="wrap"><Text fontSize="sm" color="gray.500">{pagination.total} {pagination.total === 1 ? "template" : "templates"}</Text>{pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />}</Flex>
      </>}
    </Box>
    {opened && <TemplateDrawer templateId={opened.id} canManage={canManage} onClose={() => setOpened(null)} onChanged={() => setRefresh((n) => n + 1)} />}
  </Stack></Box></PermissionGate>;
});
