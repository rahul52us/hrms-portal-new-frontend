"use client";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, FormControl, FormLabel, HStack, Input, Select, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Textarea, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import Pagination from "@/app/component/common/pagination/Pagination";
import { assetFailure, assetGet, AssetCategory, assetSave, dateTime, emptyPage, Page, statusLabel } from "./assetApi";

type Event = { _id: string; actorName: string; action: string; reason: string; createdAt: string; before?: { name: string; state: string }; after: { name: string; state: string } };
type Command = { path: string; body: Record<string, unknown>; method: "post" | "put" };
function History({ id, reload }: { id: string; reload: number }) {
  const [data, setData] = useState<Page<Event>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [error, setError] = useState(""), [loading, setLoading] = useState(true), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError(""); setLoading(true);
    assetGet<Page<Event>>(`/categories/${id}/events`, { page, limit: 10 }, controller.signal).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((err) => { if (!controller.signal.aborted) setError(assetFailure(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, page, reload, attempt]);
  return <Stack spacing={3}><Text fontWeight="600">Category history</Text>{error && <Alert status="error"><AlertIcon /><Stack><Text>{error}</Text><Button size="sm" onClick={() => setAttempt((value) => value + 1)}>Reload history</Button></Stack></Alert>}{loading ? <Skeleton h="100px" /> : data.data.map((event) => <Box key={event._id} borderBottomWidth="1px" pb={3}><Text fontSize="sm" fontWeight="600">{statusLabel(event.action)}</Text><Text fontSize="xs">{event.actorName} | {dateTime(event.createdAt)}</Text><Text fontSize="sm" overflowWrap="anywhere">{event.before?.name && event.before.name !== event.after.name ? `${event.before.name} -> ` : ""}{event.after.name} | {statusLabel(event.after.state)}</Text><Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{event.reason}</Text></Box>)}{data.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}</Stack>;
}
export default function AssetCategoriesDrawer({ categoryId, canManage, onClose, onChanged }: { categoryId?: string; canManage: boolean; onClose: () => void; onChanged: () => void }) {
  const [selected, setSelected] = useState(categoryId || ""), [rows, setRows] = useState<Page<AssetCategory>>({ data: [], pagination: emptyPage }), [data, setData] = useState<AssetCategory | null>(null), [page, setPage] = useState(1), [state, setState] = useState("all"), [search, setSearch] = useState(""), [query, setQuery] = useState(""), [reload, setReload] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [action, setAction] = useState<"create" | "edit" | "archive" | "restore" | null>(null), [name, setName] = useState(""), [reason, setReason] = useState(""), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [retry, setRetry] = useState<Command | null>(null);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    const load = async () => {
      try {
        if (selected) { const result = await assetGet<{ data: AssetCategory }>(`/categories/${selected}`, undefined, controller.signal); if (!controller.signal.aborted) setData(result.data); }
        else { const result = await assetGet<Page<AssetCategory>>("/categories", { state, page, limit: 20, search: query || undefined }, controller.signal); if (!controller.signal.aborted) setRows(result); }
      } catch (err) { if (!controller.signal.aborted) { setError(assetFailure(err)); setData(null); setRows({ data: [], pagination: emptyPage }); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [selected, state, page, query, reload]);
  const choose = (value: NonNullable<typeof action>) => { setAction(value); setName(value === "edit" ? data?.name || "" : ""); setReason(""); setConfirmed(false); setError(""); };
  const execute = async (command: Command) => {
    if (busy) return;
    setBusy(true); setError("");
    try { const response = await assetSave<AssetCategory>(command.path, command.body, command.method); setRetry(null); setAction(null); setData(response.data); setSelected(response.data._id); setReload((value) => value + 1); onChanged(); }
    catch (err: any) { setError(assetFailure(err)); setRetry(!err?.response || err.response.status >= 500 ? command : null); }
    finally { setBusy(false); }
  };
  const save = () => {
    if (!action || busy || retry) return;
    const body = { ...(action !== "create" ? { revision: data?.revision } : {}), ...(["create", "edit"].includes(action) ? { name: name.trim() } : {}), ...(action === "archive" ? { confirmArchive: confirmed } : {}), reason: reason.trim(), requestId: crypto.randomUUID() };
    void execute({ path: action === "create" ? "/categories" : `/categories/${selected}${action === "edit" ? "" : `/${action}`}`, method: action === "edit" ? "put" : "post", body });
  };
  const disabled = busy || Boolean(retry), naming = action === "create" || action === "edit";
  return <DashboardDrawer isOpen onClose={() => { if (!busy) onClose(); }} titlePrefix="Asset categories" maxW={{ base: "100%", lg: "900px" }}><Stack spacing={5} minW={0}>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}{retry && <Alert status="warning"><AlertIcon /><Stack><Text>The result is uncertain. Retry this exact category change before another action.</Text><Button size="sm" alignSelf="start" isDisabled={busy} onClick={() => void execute(retry)}>Retry same request</Button></Stack></Alert>}
    {!selected ? <>
      <HStack justify="space-between" flexWrap="wrap" gap={3}><Text fontWeight="600">Company catalog</Text>{canManage && <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} isDisabled={disabled || Boolean(action)} onClick={() => choose("create")}>New category</Button>}</HStack>
      {!action && <HStack flexWrap="wrap" gap={3}><Input aria-label="Search asset categories" maxW="420px" placeholder="Category name or code" value={search} isDisabled={disabled} onChange={(event) => setSearch(event.target.value)} /><Select aria-label="Category state" maxW="200px" value={state} isDisabled={disabled} onChange={(event) => { setState(event.target.value); setPage(1); }}><option value="all">All categories</option><option value="active">Active</option><option value="archived">Archived</option></Select><Button size="sm" variant="outline" isDisabled={disabled || loading} onClick={() => setReload((value) => value + 1)}>Reload</Button></HStack>}
      {!action && (loading ? <Skeleton h="180px" /> : <><TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr><Th>Category</Th><Th>Code</Th><Th>State</Th><Th /></Tr></Thead><Tbody>{!rows.data.length && <Tr><Td colSpan={4}>No matching categories.</Td></Tr>}{rows.data.map((row) => <Tr key={row._id}><Td whiteSpace="normal" overflowWrap="anywhere"><Text fontWeight="600">{row.name}</Text>{row.builtin && <Text fontSize="xs" color="gray.500">Built-in</Text>}</Td><Td whiteSpace="normal" overflowWrap="anywhere">{row.code}</Td><Td><Badge colorScheme={row.state === "active" ? "green" : "gray"}>{row.state}</Badge></Td><Td><Button size="sm" variant="outline" isDisabled={disabled} onClick={() => { setData(null); setAction(null); setSelected(row._id); }}>Open</Button></Td></Tr>)}</Tbody></Table></TableContainer>{rows.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={rows.pagination.totalPages} onPageChange={setPage} />}</>)}
    </> : <>
      <HStack justify="space-between" flexWrap="wrap"><Button size="sm" variant="outline" isDisabled={disabled} onClick={() => { setSelected(""); setData(null); setAction(null); }}>Back to catalog</Button><Button size="sm" variant="ghost" isDisabled={disabled || loading} onClick={() => { setAction(null); setReload((value) => value + 1); }}>Reload</Button></HStack>
      {loading ? <Skeleton h="150px" /> : data && <>
        <HStack justify="space-between" flexWrap="wrap" gap={3}><Text fontSize="lg" fontWeight="600" overflowWrap="anywhere">{data.name}</Text><Badge colorScheme={data.state === "active" ? "green" : "gray"}>{data.state}</Badge></HStack><Box><Text fontSize="xs" color="gray.500">Code</Text><Text overflowWrap="anywhere">{data.code}</Text></Box><Text fontSize="sm">Registered units: {data.inventoryUnits ?? 0}</Text>
        {data.builtin && <Alert status="info"><AlertIcon />Built-in categories stay fixed and available. Company-specific categories are managed separately.</Alert>}
        {data.state === "archived" && <Alert status="info"><AlertIcon />New selections are stopped. Existing equipment, handovers and published onboarding requirements keep their category.</Alert>}
        {data.canManage && !action && <HStack flexWrap="wrap" gap={3}>{data.state === "active" ? <><Button size="sm" variant="outline" isDisabled={disabled} onClick={() => choose("edit")}>Rename</Button><Button size="sm" variant="outline" colorScheme="red" isDisabled={disabled} onClick={() => choose("archive")}>Archive</Button></> : <Button size="sm" colorScheme="blue" isDisabled={disabled} onClick={() => choose("restore")}>Restore</Button>}</HStack>}
        {!data.builtin && !action && <Box borderTopWidth="1px" pt={4}><History key={data._id} id={data._id} reload={reload} /></Box>}
      </>}
    </>}
    {action && <Box borderTopWidth="1px" pt={4}><Stack spacing={4}><Text fontWeight="600">{action === "create" ? "New category" : action === "edit" ? "Rename category" : `${statusLabel(action)} category`}</Text>
      {naming && <FormControl isRequired><FormLabel htmlFor="asset-category-name">Category name</FormLabel><Input id="asset-category-name" value={name} maxLength={80} isDisabled={disabled} onChange={(event) => setName(event.target.value)} /></FormControl>}
      <FormControl isRequired><FormLabel htmlFor="asset-category-reason">Reason</FormLabel><Textarea id="asset-category-reason" value={reason} maxLength={1000} isDisabled={disabled} onChange={(event) => setReason(event.target.value)} /></FormControl>
      {action === "archive" && <Checkbox id="asset-category-archive-confirmation" isChecked={confirmed} isDisabled={disabled} onChange={(event) => setConfirmed(event.target.checked)}>Stop new selections without changing existing equipment or onboarding history.</Checkbox>}
      <HStack flexWrap="wrap"><Button size="sm" variant="ghost" isDisabled={disabled} onClick={() => setAction(null)}>Cancel action</Button><Button size="sm" colorScheme={action === "archive" ? "red" : "blue"} isLoading={busy} isDisabled={disabled || reason.trim().length < 3 || naming && name.trim().length < 2 || action === "archive" && !confirmed} onClick={save}>{action === "create" ? "Create category" : action === "edit" ? "Save name" : `Confirm ${action}`}</Button></HStack>
    </Stack></Box>}
  </Stack></DashboardDrawer>;
}
