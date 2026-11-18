"use client";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, Heading, HStack, Input, Menu, MenuButton, MenuItem, MenuList, Select, Skeleton, Stack, Tab, TabList, TabPanel, TabPanels, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, Tabs } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiDownload, FiMaximize, FiPlus, FiPrinter, FiRefreshCw, FiUpload } from "react-icons/fi";
import stores from "@/app/store/stores";
import PermissionGate from "@/app/component/common/PermissionGate";
import Pagination from "@/app/component/common/pagination/Pagination";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import AssetDrawer from "./AssetDrawer";
import AssetAssignmentDrawer from "./AssetAssignmentDrawer";
import AssetLookup from "./AssetLookup";
import AssetIncidentsList from "./AssetIncidentsList";
import AssetIncidentDrawer from "./AssetIncidentDrawer";
import AssetServiceDrawer from "./AssetServiceDrawer";
import AssetServicesList from "./AssetServicesList";
import AssetWriteOffList from "./AssetWriteOffList";
import AssetWriteOffDrawer from "./AssetWriteOffDrawer";
import AssetClearanceList from "./AssetClearanceList";
import AssetClearanceCreate from "./AssetClearanceCreate";
import AssetClearanceDrawer from "./AssetClearanceDrawer";
import AssetImportDrawer from "./AssetImportDrawer";
import AssetCategoriesDrawer from "./AssetCategoriesDrawer";
import AssetCategorySelect from "./AssetCategorySelect";
import AssetLabelsDrawer from "./AssetLabelsDrawer";
import AssetScanDrawer from "./AssetScanDrawer";
import AssetExportsDrawer from "./AssetExportsDrawer";
import AssetDisposalDrawer from "./AssetDisposalDrawer";
import { AssetDisposalsList, AssetPurchasesList } from "./AssetLifecycleLists";
import { assetDownload, assetFailure, assetGet, AssetLabelSelection, AssetRecord, Assignment, categoryLabel, dateTime, emptyPage, Option, Page, statusLabel } from "./assetApi";

function Inventory({ canManage, canImport, canExport, onOpen, onImport, onCategories, reload }: { canManage: boolean; canImport: boolean; canExport: boolean; onOpen: (id?: string) => void; onImport: () => void; onCategories: () => void; reload: number }) {
  const [rows, setRows] = useState<Page<AssetRecord>>({ data: [], pagination: emptyPage }), [search, setSearch] = useState(""), [query, setQuery] = useState(""), [status, setStatus] = useState("all"), [category, setCategory] = useState<Option | null>(null), [location, setLocation] = useState<Option | null>(null), [page, setPage] = useState(1), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [exporting, setExporting] = useState(false), [downloadError, setDownloadError] = useState("");
  const [selection, setSelection] = useState<Record<string, AssetLabelSelection>>({}), [labels, setLabels] = useState<AssetLabelSelection[] | null>(null), [scanning, setScanning] = useState(false);
  const [exportsView, setExportsView] = useState<{ create: boolean } | null>(null);
  useEffect(() => { setSelection({}); }, [query, status, category?.value, location?.value]);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    assetGet<Page<AssetRecord>>("/inventory", { page, limit: 20, search: query || undefined, status, category: category?.value || "all", officeLocation: location?.value || undefined }, controller.signal).then((response) => { if (!controller.signal.aborted) setRows(response); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, query, status, category?.value, location?.value, reload]);
  const download = async (format: string) => { if (exporting) return; setExporting(true); setDownloadError(""); try { await assetDownload("/inventory/export", `asset-inventory.${format}`, { format, search: query || undefined, status, category: category?.value || "all", officeLocation: location?.value || undefined }); } catch (err) { setDownloadError(assetFailure(err)); } finally { setExporting(false); } };
  const select = (units: AssetRecord[], checked: boolean) => setSelection((current) => {
    const next = { ...current };
    for (const unit of units) { if (!checked) delete next[unit._id]; else if (next[unit._id] || Object.keys(next).length < 100) next[unit._id] = { _id: unit._id, tag: unit.tag, name: unit.name }; }
    return next;
  });
  const selectedCount = Object.keys(selection).length, visibleSelected = rows.data.filter(unit => Boolean(selection[unit._id])).length;
  return <Stack spacing={4} minW={0}><HStack justify="space-between" flexWrap="wrap" gap={3}><Text fontSize="sm">{rows.pagination.total} matching assets</Text><HStack flexWrap="wrap" gap={3}>
    <Button size="sm" variant="outline" leftIcon={<FiMaximize />} onClick={() => setScanning(true)}>Scan asset</Button>
    {canExport && <Button size="sm" variant="outline" leftIcon={<FiPrinter />} isDisabled={!selectedCount || loading || search.trim() !== query || Boolean(error)} onClick={() => setLabels(Object.values(selection))}>Labels{selectedCount ? ` (${selectedCount})` : ""}</Button>}
    {canExport && <Menu><MenuButton as={Button} size="sm" variant="outline" leftIcon={<FiDownload />} isLoading={exporting} isDisabled={loading || exporting || Boolean(error) || search.trim() !== query}>Export</MenuButton><MenuList><MenuItem onClick={() => void download("xlsx")}>Excel (.xlsx)</MenuItem><MenuItem onClick={() => void download("csv")}>CSV (.csv)</MenuItem><MenuItem onClick={() => setExportsView({ create: true })}>Background CSV</MenuItem><MenuItem onClick={() => setExportsView({ create: false })}>My export history</MenuItem></MenuList></Menu>}
    <Button size="sm" variant="outline" leftIcon={canImport ? <FiUpload /> : undefined} onClick={onImport}>{canImport ? "Import CSV" : "Import history"}</Button>
    <Button size="sm" variant="outline" onClick={onCategories}>Categories</Button>
    {canManage && <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={() => onOpen()}>Register asset</Button>}
  </HStack></HStack>
    <Box display="grid" gridTemplateColumns={{ base: "minmax(0, 1fr)", md: "minmax(200px, 2fr) repeat(3, minmax(160px, 1fr))" }} gap={3}><Input aria-label="Search assets" placeholder="Asset name, tag, serial or employee" value={search} onChange={(event) => setSearch(event.target.value)} /><Select aria-label="Asset status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">All statuses</option>{["available", "issued", "maintenance", "retired", "written_off", "disposed"].map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</Select><Box minW={0}><AssetCategorySelect key={`category-filter:${reload}`} inputId="asset-category-filter" includeArchived clearable value={category} onChange={(value) => { setCategory(value); setPage(1); }} /></Box><Box minW={0}><AssetLookup kind="locations" inputId="asset-inventory-filter" value={location} onChange={(value) => { setLocation(value); setPage(1); }} /></Box></Box>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {downloadError && <Alert status="error"><AlertIcon />{downloadError}</Alert>}
    {selectedCount > 0 && <HStack flexWrap="wrap"><Text fontSize="sm">{selectedCount}/100 selected</Text><Button size="xs" variant="ghost" onClick={() => setSelection({})}>Clear selection</Button></HStack>}
    <TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr>{canExport && <Th w="40px"><Checkbox aria-label="Select current page for labels" isChecked={Boolean(rows.data.length && visibleSelected === rows.data.length)} isIndeterminate={visibleSelected > 0 && visibleSelected < rows.data.length} isDisabled={loading || !rows.data.length || Boolean(error)} onChange={(event) => select(rows.data, event.target.checked)} /></Th>}<Th>Asset</Th><Th>Serial number</Th><Th>Inventory location</Th><Th>Custodian</Th><Th>Status</Th><Th /></Tr></Thead><Tbody>{!rows.data.length && <Tr><Td colSpan={canExport ? 7 : 6}>{loading ? "Loading assets..." : "No assets found."}</Td></Tr>}{rows.data.map((asset) => <Tr key={asset._id}>{canExport && <Td><Checkbox aria-label={`Select ${asset.tag} for labels`} isChecked={Boolean(selection[asset._id])} isDisabled={loading || Boolean(error) || !selection[asset._id] && selectedCount >= 100} onChange={(event) => select([asset], event.target.checked)} /></Td>}<Td whiteSpace="normal" minW="180px"><Text fontWeight="600">{asset.name}</Text><Text fontSize="xs">{asset.tag} | {categoryLabel(asset.category, asset.categoryName)}</Text></Td><Td whiteSpace="normal" maxW="200px" overflowWrap="anywhere">{asset.serialNumber || "Not recorded"}</Td><Td whiteSpace="normal">{asset.locationName || "Not assigned"}</Td><Td whiteSpace="normal">{asset.holder ? <><Text>{asset.holder.name}</Text><Text fontSize="xs">{asset.holder.code}</Text></> : "Not issued"}</Td><Td><Stack align="start" spacing={1}><Badge colorScheme={asset.status === "available" ? "green" : asset.status === "maintenance" ? "orange" : "blue"}>{statusLabel(asset.status)}</Badge>{asset.openIncident && <Badge colorScheme="red">Incident hold</Badge>}</Stack></Td><Td><Button size="sm" variant="outline" onClick={() => onOpen(asset._id)}>Open</Button></Td></Tr>)}</Tbody></Table></TableContainer>
    {rows.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={rows.pagination.totalPages} onPageChange={setPage} />}
    {labels && <AssetLabelsDrawer assets={labels} onClose={() => setLabels(null)} />}
    {scanning && <AssetScanDrawer onClose={() => setScanning(false)} onOpen={(id) => { setScanning(false); onOpen(id); }} />}
    {exportsView && <AssetExportsDrawer filters={{ search: query, status, category: category?.value || "all", officeLocation: location?.value || "" }} filterSummary={`${status === "all" ? "All statuses" : statusLabel(status)} | ${category?.label || "All categories"} | ${location?.label || "All locations"}${query ? ` | Search: ${query}` : ""}`} createInitially={exportsView.create} onClose={() => setExportsView(null)} />}
  </Stack>;
}
function Assignments({ scope, onOpen, reload }: { scope: "mine" | "company"; onOpen: (id: string) => void; reload: number }) {
  const [rows, setRows] = useState<Page<Assignment>>({ data: [], pagination: emptyPage }), [page, setPage] = useState(1), [state, setState] = useState("active"), [search, setSearch] = useState(""), [query, setQuery] = useState(""), [error, setError] = useState(""), [loading, setLoading] = useState(true);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    assetGet<Page<Assignment>>("/assignments", { scope, state, search: query || undefined, page, limit: 20 }, controller.signal).then((response) => { if (!controller.signal.aborted) setRows(response); }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [scope, state, query, page, reload]);
  return <Stack spacing={4} minW={0}><HStack flexWrap="wrap" gap={3}><Input aria-label="Search asset handovers" placeholder={scope === "mine" ? "Asset name or tag" : "Asset or employee name / code"} value={search} maxW="420px" onChange={(event) => setSearch(event.target.value)} /><Select aria-label="Asset handover status" maxW="220px" value={state} onChange={(event) => { setState(event.target.value); setPage(1); }}><option value="active">In employee custody</option><option value="return_requested">Return requested</option><option value="returned">Returned</option><option value="voided">Voided records</option><option value="written_off">Written-off custody</option><option value="all">All handovers</option></Select></HStack>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    <TableContainer borderWidth="1px" borderRadius="md"><Table size="sm"><Thead><Tr><Th>Asset</Th>{scope === "company" && <Th>Employee</Th>}<Th>Issued on</Th><Th>Status</Th><Th>Receipt</Th><Th /></Tr></Thead><Tbody>{!rows.data.length && <Tr><Td colSpan={scope === "company" ? 6 : 5}>{loading ? "Loading handovers..." : "No handovers in this view."}</Td></Tr>}{rows.data.map((record) => <Tr key={record._id}><Td whiteSpace="normal" minW="180px"><Text fontWeight="600">{record.assetSnapshot.name}</Text><Text fontSize="xs">{record.assetSnapshot.tag}</Text></Td>{scope === "company" && <Td whiteSpace="normal"><Text>{record.employeeName}</Text><Text fontSize="xs">{record.employeeCode}</Text></Td>}<Td>{dateTime(record.issuedAt)}</Td><Td><Badge colorScheme={record.status === "return_requested" ? "orange" : "gray"}>{statusLabel(record.status)}</Badge></Td><Td><Badge colorScheme={record.acknowledgedAt ? "green" : "yellow"}>{record.acknowledgedAt ? "Acknowledged" : "Not acknowledged"}</Badge></Td><Td><Button size="sm" variant="outline" onClick={() => onOpen(record._id)}>Open</Button></Td></Tr>)}</Tbody></Table></TableContainer>
    {rows.pagination.totalPages > 1 && <Pagination currentPage={page} totalPages={rows.pagination.totalPages} onPageChange={setPage} />}
  </Stack>;
}
export default observer(function AssetWorkspace() {
  const user = stores.auth.user, ready = stores.auth.sessionReady && Boolean(user), companyAccount = Boolean(user?.company) && user?.role !== "superadmin", accountKey = `${user?._id || ""}:${user?.company?._id || user?.company || ""}`;
  const params = useSearchParams().toString();
  const [options, setOptions] = useState<{ canViewInventory: boolean; canManage: boolean; canManageClearances: boolean; canImport: boolean; canExport: boolean; canManageCategories: boolean } | null>(null), [error, setError] = useState(""), [reload, setReload] = useState(0), [workspaceReload, setWorkspaceReload] = useState(0), [tab, setTab] = useState(0);
  const [openedAsset, setOpenedAsset] = useState<{ id?: string; tab?: "purchase" } | null>(null), [openedAssignment, setOpenedAssignment] = useState<string | null>(null);
  const [openedDisposal, setOpenedDisposal] = useState<string | null>(null);
  const [openedIncident, setOpenedIncident] = useState<string | null>(null);
  const [openedService, setOpenedService] = useState<string | null>(null);
  const [openedWriteOff, setOpenedWriteOff] = useState<string | null>(null);
  const [openedClearance, setOpenedClearance] = useState<string | null>(null), [creatingClearance, setCreatingClearance] = useState(false), [returnClearance, setReturnClearance] = useState<string | null>(null);
  const [openedImport, setOpenedImport] = useState<{ id?: string } | null>(null), [returnImport, setReturnImport] = useState<string | null>(null);
  const [openedCategories, setOpenedCategories] = useState<{ id?: string } | null>(null);
  useEffect(() => {
    setOpenedAsset(null); setOpenedDisposal(null); setOpenedAssignment(null); setOpenedIncident(null); setOpenedService(null); setOpenedWriteOff(null); setOpenedClearance(null); setCreatingClearance(false); setReturnClearance(null); setOpenedImport(null); setReturnImport(null); setOpenedCategories(null); setOptions(null); setError("");
    if (!ready || !companyAccount) return;
    const controller = new AbortController();
    assetGet<{ data: NonNullable<typeof options> }>("/workspace", undefined, controller.signal).then(({ data }) => {
      if (!controller.signal.aborted) {
        const link = new URLSearchParams(params);
        if (data.canViewInventory && link.get("disposalId")) { setOptions(data); setTab(7); setOpenedDisposal(link.get("disposalId")); return; }
        if (data.canViewInventory && link.get("assetId")) { setOptions(data); setTab(0); setOpenedAsset({ id: link.get("assetId")!, tab: link.get("assetTab") === "purchase" ? "purchase" : undefined }); return; }
        setOptions(data); const query = new URLSearchParams(params), categoryId = query.get("categoryId"), importId = categoryId ? null : query.get("importId"), clearanceId = importId || categoryId ? null : query.get("clearanceId"), lossId = clearanceId || importId || categoryId ? null : query.get("writeOffId"), serviceId = lossId || clearanceId || importId || categoryId ? null : query.get("serviceOrderId"), incidentId = serviceId || lossId || clearanceId || importId || categoryId ? null : query.get("incidentId");
        setTab(importId || categoryId ? 0 : clearanceId ? data.canViewInventory ? 6 : 2 : lossId ? data.canViewInventory ? 5 : 0 : serviceId ? data.canViewInventory ? 4 : 0 : incidentId ? data.canViewInventory ? 3 : 1 : data.canViewInventory && query.get("view") === "mine" ? 2 : 0);
        setOpenedAssignment(incidentId || serviceId || lossId || clearanceId || importId || categoryId ? null : query.get("assignmentId")); setOpenedIncident(incidentId); setOpenedService(serviceId); setOpenedWriteOff(lossId); setOpenedClearance(clearanceId); setOpenedImport(importId ? { id: importId } : null); setOpenedCategories(categoryId ? { id: categoryId } : null);
      }
    }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err)); });
    return () => controller.abort();
  }, [ready, companyAccount, accountKey, params, workspaceReload]);
  const changed = () => setReload((value) => value + 1);
  const leaveClearance = () => { setOpenedDisposal(null); if (openedClearance) setReturnClearance(openedClearance); setOpenedClearance(null); setCreatingClearance(false); setOpenedImport(null); setOpenedCategories(null); };
  const openAssignment = (id: string) => { leaveClearance(); setOpenedWriteOff(null); setOpenedService(null); setOpenedAsset(null); setOpenedIncident(null); setOpenedAssignment(id); };
  const openIncident = (id: string) => { leaveClearance(); setOpenedWriteOff(null); setOpenedService(null); setOpenedAsset(null); setOpenedAssignment(null); setOpenedIncident(id); };
  const openService = (id: string) => { leaveClearance(); setOpenedWriteOff(null); setOpenedAsset(null); setOpenedAssignment(null); setOpenedIncident(null); setOpenedService(id); };
  const openAsset = (id?: string, tab?: "purchase") => { leaveClearance(); setOpenedWriteOff(null); setOpenedAssignment(null); setOpenedIncident(null); setOpenedService(null); setOpenedAsset({ id, tab }); };
  const openDisposal = (id: string) => { leaveClearance(); setOpenedAsset(null); setOpenedWriteOff(null); setOpenedAssignment(null); setOpenedIncident(null); setOpenedService(null); setOpenedDisposal(id); };
  const openWriteOff = (id: string) => { leaveClearance(); setOpenedAsset(null); setOpenedAssignment(null); setOpenedIncident(null); setOpenedService(null); setOpenedWriteOff(id); };
  const openClearance = (id?: string) => { setOpenedDisposal(null); setOpenedAsset(null); setOpenedAssignment(null); setOpenedIncident(null); setOpenedService(null); setOpenedWriteOff(null); setReturnClearance(null); setOpenedImport(null); setReturnImport(null); setOpenedCategories(null); setCreatingClearance(!id); setOpenedClearance(id || null); };
  const openImport = (id?: string) => { setOpenedDisposal(null); setOpenedAsset(null); setOpenedAssignment(null); setOpenedIncident(null); setOpenedService(null); setOpenedWriteOff(null); setOpenedClearance(null); setCreatingClearance(false); setReturnClearance(null); setReturnImport(null); setOpenedCategories(null); setOpenedImport({ id }); };
  const openCategories = () => { setOpenedDisposal(null); setOpenedAsset(null); setOpenedAssignment(null); setOpenedIncident(null); setOpenedService(null); setOpenedWriteOff(null); setOpenedClearance(null); setCreatingClearance(false); setReturnClearance(null); setReturnImport(null); setOpenedImport(null); setOpenedCategories({}); };
  const closeRelated = (close: () => void) => { if (returnClearance) openClearance(returnClearance); else if (returnImport) openImport(returnImport); else close(); };
  if (!ready) return <Stack p={6}><Skeleton h="40px" /><Skeleton h="200px" /></Stack>;
  return <PermissionGate allowed={companyAccount} title="Company account required" description="Assets are managed inside a company."><Box p={{ base: 3, md: 6 }} minW={0}><Stack spacing={5} maxW="1500px" mx="auto">
    <HStack justify="space-between" gap={3} flexWrap="wrap"><Heading size="lg">{options?.canViewInventory ? "Assets" : "My assets"}</Heading><Button size="sm" variant="outline" leftIcon={<FiRefreshCw />} onClick={() => { changed(); setWorkspaceReload((value) => value + 1); }}>Refresh</Button></HStack>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {returnClearance && <Button size="sm" variant="outline" alignSelf="start" onClick={() => openClearance(returnClearance)}>Back to asset clearance</Button>}
    {!options ? !error && <Skeleton h="200px" /> : options.canViewInventory ? <Tabs index={tab} onChange={setTab} isLazy>
      <TabList overflowX="auto"><Tab whiteSpace="nowrap">Inventory</Tab><Tab whiteSpace="nowrap">Employee handovers</Tab><Tab whiteSpace="nowrap">My assets</Tab><Tab whiteSpace="nowrap">Incidents</Tab><Tab whiteSpace="nowrap">Service orders</Tab><Tab whiteSpace="nowrap">Write-offs</Tab><Tab whiteSpace="nowrap">Clearances</Tab><Tab whiteSpace="nowrap">Disposals</Tab><Tab whiteSpace="nowrap">Purchase and warranty</Tab></TabList>
      <TabPanels>
        <TabPanel px={0}><Inventory key={accountKey} canManage={options.canManage} canImport={options.canImport} canExport={options.canExport} reload={reload} onOpen={openAsset} onImport={() => openImport()} onCategories={openCategories} /></TabPanel>
        <TabPanel px={0}><Assignments key={`${accountKey}:company`} scope="company" reload={reload} onOpen={openAssignment} /></TabPanel>
        <TabPanel px={0}><Assignments key={`${accountKey}:mine`} scope="mine" reload={reload} onOpen={openAssignment} /></TabPanel>
        <TabPanel px={0}><AssetIncidentsList key={`${accountKey}:incidents`} scope="company" reload={reload} onOpen={openIncident} /></TabPanel>
        <TabPanel px={0}><AssetServicesList key={`${accountKey}:services`} reload={reload} onOpen={openService} /></TabPanel>
        <TabPanel px={0}><AssetWriteOffList key={`${accountKey}:writeoffs`} reload={reload} onOpen={openWriteOff} /></TabPanel>
        <TabPanel px={0}><AssetClearanceList key={`${accountKey}:clearances`} scope="company" canManage={options.canManageClearances} reload={reload} onOpen={openClearance} onCreate={() => openClearance()} /></TabPanel>
        <TabPanel px={0}><AssetDisposalsList key={`${accountKey}:disposals`} reload={reload} onOpen={openDisposal} /></TabPanel>
        <TabPanel px={0}><AssetPurchasesList key={`${accountKey}:purchases`} reload={reload} canManage={options.canManage} onOpen={id => openAsset(id, "purchase")} /></TabPanel>
      </TabPanels>
    </Tabs> : <Tabs index={tab} onChange={setTab} isLazy><TabList overflowX="auto"><Tab whiteSpace="nowrap">My assets</Tab><Tab whiteSpace="nowrap">My incidents</Tab><Tab whiteSpace="nowrap">My clearances</Tab></TabList><TabPanels>
      <TabPanel px={0}><Assignments key={`${accountKey}:mine`} scope="mine" reload={reload} onOpen={openAssignment} /></TabPanel>
      <TabPanel px={0}><AssetIncidentsList key={`${accountKey}:my-incidents`} scope="mine" reload={reload} onOpen={openIncident} /></TabPanel>
      <TabPanel px={0}><AssetClearanceList key={`${accountKey}:my-clearances`} scope="mine" canManage={false} reload={reload} onOpen={openClearance} onCreate={() => openClearance()} /></TabPanel>
    </TabPanels></Tabs>}
    {openedAsset && <AssetDrawer key={`${accountKey}:${openedAsset.id || "new"}:${openedAsset.tab || "details"}`} assetId={openedAsset.id} initialTab={openedAsset.tab} onClose={() => closeRelated(() => setOpenedAsset(null))} onChanged={changed} onAssignment={openAssignment} onIncident={openIncident} onService={openService} onWriteOff={openWriteOff} onDisposal={openDisposal} />}
    {openedDisposal && <AssetDisposalDrawer key={`${accountKey}:${openedDisposal}`} disposalId={openedDisposal} onClose={() => closeRelated(() => setOpenedDisposal(null))} onChanged={changed} onAsset={openAsset} />}
    {openedAssignment && <AssetAssignmentDrawer key={openedAssignment} assignmentId={openedAssignment} onClose={() => closeRelated(() => setOpenedAssignment(null))} onChanged={changed} onIncident={openIncident} />}
    {openedIncident && <AssetIncidentDrawer key={openedIncident} incidentId={openedIncident} onClose={() => closeRelated(() => setOpenedIncident(null))} onChanged={changed} onService={openService} onWriteOff={openWriteOff} />}
    {openedService && <AssetServiceDrawer key={openedService} serviceOrderId={openedService} onClose={() => closeRelated(() => setOpenedService(null))} onChanged={changed} onAsset={openAsset} onIncident={openIncident} onWriteOff={openWriteOff} />}
    {openedWriteOff && <AssetWriteOffDrawer key={openedWriteOff} writeOffId={openedWriteOff} onClose={() => closeRelated(() => setOpenedWriteOff(null))} onChanged={changed} onAsset={openAsset} onIncident={openIncident} />}
    {creatingClearance && <AssetClearanceCreate onClose={() => setCreatingClearance(false)} onSaved={(id) => { changed(); openClearance(id); }} />}
    {openedClearance && <AssetClearanceDrawer key={openedClearance} clearanceId={openedClearance} onClose={() => setOpenedClearance(null)} onChanged={changed} onAssignment={openAssignment} onIncident={openIncident} onWriteOff={openWriteOff} />}
    {openedImport && <AssetImportDrawer key={openedImport.id || "new-import"} importId={openedImport.id} canImport={Boolean(options?.canImport)} onClose={() => setOpenedImport(null)} onChanged={changed} onAsset={(id, batchId) => { openAsset(id); setReturnImport(batchId); }} />}
    {openedCategories && <AssetCategoriesDrawer key={openedCategories.id || "category-catalog"} categoryId={openedCategories.id} canManage={Boolean(options?.canManageCategories)} onClose={() => setOpenedCategories(null)} onChanged={changed} />}
  </Stack></Box></PermissionGate>;
});
