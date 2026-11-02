"use client";
import { Box, Button, Text } from "@chakra-ui/react";
import Select from "react-select";
import { useEffect, useState } from "react";
import { Choice, operationsLookup } from "./timesheetOperationsApi";
export default function OperationsLookup({ kind, label, params, value, onChange, disabled = false }: { kind: string; label: string; params: Record<string, any>; value: Choice | null; onChange: (value: Choice | null) => void; disabled?: boolean }) {
  const [search, setSearch] = useState(""), [query, setQuery] = useState(""), [page, setPage] = useState(1), [opened, setOpened] = useState(false), [retry, setRetry] = useState(0);
  const [choices, setChoices] = useState<Choice[]>([]), [more, setMore] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const key = JSON.stringify(params);
  useEffect(() => { if (search === query) return; const timer = setTimeout(() => { setQuery(search); setPage(1); setChoices([]); }, 250); return () => clearTimeout(timer); }, [search, query]);
  useEffect(() => { setPage(1); setChoices([]); setSearch(""); setQuery(""); setOpened(false); }, [key, kind]);
  useEffect(() => {
    if (!opened || disabled) return;
    const controller = new AbortController(); setLoading(true); setError("");
    operationsLookup(kind, { ...JSON.parse(key), search: query, page }, controller.signal).then((result) => { if (!controller.signal.aborted) { setChoices((old) => page === 1 ? result.data : [...old, ...result.data.filter((next) => !old.some((o) => o._id === next._id))]); setMore(result.pagination.hasMore); } }).catch((err) => { if (!controller.signal.aborted) setError(err?.response?.data?.message || "Could not load choices"); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [key, kind, query, page, opened, disabled, retry]);
  return <Box minW={0}><Select inputId={`timesheet-filter-${kind}`} instanceId={`timesheet-filter-${kind}`} aria-label={label} options={choices} value={value} onChange={onChange} getOptionValue={(item) => item._id} getOptionLabel={(item) => `${item.name}${item.code ? ` (${item.code})` : ""}`} filterOption={null} isClearable isDisabled={disabled} isLoading={loading} placeholder={`All ${label.toLowerCase()}`} onMenuOpen={() => setOpened(true)} onInputChange={(value, meta) => { if (meta.action === "input-change") setSearch(value); }} onMenuScrollToBottom={() => { if (more && !loading) setPage((p) => p + 1); }} menuPlacement="auto" maxMenuHeight={180} styles={{ control: (base) => ({ ...base, minHeight: 40 }), menu: (base) => ({ ...base, zIndex: 30 }) }} />{error ? <Text fontSize="xs" color="red.600">{error} <Button type="button" size="xs" variant="link" onClick={() => setRetry((r) => r + 1)}>Retry</Button></Text> : null}</Box>;
}
