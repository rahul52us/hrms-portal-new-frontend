"use client";

import { Alert, AlertIcon, Button, Stack } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import Select from "react-select";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { formatRoleLabel } from "@/app/config/utils/roleAccess";

export type PolicyEmployeeOption = { value: string; label: string };

export default function PolicyAssignmentEmployeeSelect({ companyId, value, onChange, isDisabled = false }: {
  companyId: string; value: PolicyEmployeeOption | null; onChange: (option: PolicyEmployeeOption | null) => void; isDisabled?: boolean;
}) {
  const [input, setInput] = useState(""), [query, setQuery] = useState(""), [page, setPage] = useState(1);
  const [options, setOptions] = useState<PolicyEmployeeOption[]>([]), [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false), [error, setError] = useState(""), [reload, setReload] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);
  // Raw input also invalidates in-flight results before the debounced search is ready.
  useEffect(() => {
    if (!companyId || input.trim() !== query) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setError("");
    axios.get("/workforce-policies/assignment-employees", { params: { companyId, search: query || undefined, page, limit: 25 }, signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        const incoming: PolicyEmployeeOption[] = (data.data || []).map((employee: any) => ({
          value: employee._id,
          label: `${employee.name || employee.username || "Employee"}${employee.code ? ` (${employee.code})` : ""} - ${formatRoleLabel(employee.role)}`,
        }));
        setOptions((current) => page === 1 ? incoming : Array.from(new Map([...current, ...incoming].map((option) => [option.value, option])).values()));
        setHasMore(page < data.pagination.totalPages);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err?.response?.data || err, "Unable to load employees"));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [companyId, input, query, page, reload]);
  return <Stack spacing={2}>
    <Select<PolicyEmployeeOption>
      inputId="policy-assignment-employee" aria-label="Employee" isClearable isDisabled={isDisabled} isLoading={loading || input.trim() !== query}
      value={value} options={options} inputValue={input} filterOption={null}
      onChange={(option) => onChange(option)}
      onInputChange={(next) => { if (next !== input) { setInput(next); setPage(1); setOptions([]); setHasMore(false); setError(""); } }}
      onMenuScrollToBottom={() => { if (hasMore && !loading && !error) setPage(page + 1); }}
      placeholder="Search employee name, code or username"
      noOptionsMessage={() => error ? "Unable to load employees" : loading ? "Loading employees..." : "No matching employees"}
      menuPlacement="auto" maxMenuHeight={260}
    />
    {error && <Alert status="error"><AlertIcon />{error}<Button ml="auto" size="sm" variant="outline" onClick={() => setReload((current) => current + 1)}>Retry</Button></Alert>}
  </Stack>;
}
