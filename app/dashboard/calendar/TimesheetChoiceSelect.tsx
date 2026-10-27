"use client";

import { Box, Button, Text } from "@chakra-ui/react";
import Select from "react-select";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { getTimesheetChoices } from "./timesheetApi";

export type WorkChoice = { value: string; label: string; name: string; code: string };
export default function TimesheetChoiceSelect({ id, label, date, kind, projectId, value, disabled, onChange }: {
  id: string; label: string; date: string; kind: "projects" | "work-types"; projectId?: string;
  value: WorkChoice | null; disabled: boolean; onChange: (value: WorkChoice | null) => void;
}) {
  const [opened, setOpened] = useState(false), [search, setSearch] = useState(""), [query, setQuery] = useState("");
  const [page, setPage] = useState(1), [pages, setPages] = useState(1), [choices, setChoices] = useState<WorkChoice[]>([]);
  const [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [retry, setRetry] = useState(0), [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { if (search === query) return; const timer = setTimeout(() => { setQuery(search); setPage(1); setChoices([]); }, 250); return () => clearTimeout(timer); }, [search, query]);
  useEffect(() => { setOpened(false); setChoices([]); setPage(1); setPages(1); setSearch(""); setQuery(""); setError(""); }, [date, kind, projectId]);
  useEffect(() => {
    if (!opened || disabled || kind === "work-types" && !projectId) return;
    const controller = new AbortController();
    setLoading(true); setError("");
    getTimesheetChoices(date, kind, { page, search: query, ...(projectId ? { projectId } : {}) }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        const next = result.data.filter((item) => item.available).map((item) => ({ value: item._id, label: `${item.name} (${item.code})`, name: item.name, code: item.code }));
        setChoices((current) => page === 1 ? next : [...current, ...next.filter((item) => !current.some((c) => c.value === item.value))]);
        setPages(result.pagination.totalPages);
      }).catch((err) => { if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Could not load choices")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [opened, date, kind, projectId, page, query, disabled, retry]);
  return <Box minW={0}>
    <Select inputId={id} instanceId={id} aria-label={label} options={choices} value={value} onChange={onChange}
      isDisabled={disabled || kind === "work-types" && !projectId} isLoading={loading} isClearable
      placeholder={kind === "projects" ? "Select project" : "Select work type"} maxMenuHeight={180} menuPlacement="auto"
      onMenuOpen={() => { setOpened(true); setMenuOpen(true); }} onMenuClose={() => setMenuOpen(false)}
      onInputChange={(value, action) => { if (action.action === "input-change") setSearch(value); }}
      onMenuScrollToBottom={() => { if (!loading && page < pages) setPage((p) => p + 1); }}
      filterOption={null} noOptionsMessage={() => loading ? "Loading..." : error ? "Could not load choices" : "No available choices"}
      styles={{ menu: (base) => ({ ...base, zIndex: 20 }), control: (base) => ({ ...base, minHeight: 40 }), valueContainer: (base) => ({ ...base, minWidth: 0 }), singleValue: (base) => ({ ...base, overflow: "hidden", textOverflow: "ellipsis" }) }} />
    {menuOpen && page < pages ? <Button type="button" size="xs" variant="ghost" onMouseDown={(e) => e.preventDefault()} isDisabled={loading} onClick={() => setPage((p) => p + 1)}>Load more options</Button> : null}
    {error ? <Text mt={1} fontSize="xs" color="red.600">{error} <Button type="button" size="xs" variant="link" onClick={() => { setOpened(true); setRetry((r) => r + 1); }}>Retry</Button></Text> : null}
  </Box>;
}
