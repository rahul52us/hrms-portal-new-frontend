"use client";
import { Text } from "@chakra-ui/react";
import { useState } from "react";
import AsyncSelect from "react-select/async";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetGet, Option, Page } from "./assetApi";

/** Keep lookups bounded and server-searched, including companies with large employee/location lists. */
export default function AssetLookup({ kind, inputId, value, onChange, disabled }: { kind: "employees" | "locations"; inputId: string; value: Option | null; onChange: (value: Option | null) => void; disabled?: boolean }) {
  const [error, setError] = useState("");
  const options = async (search: string) => {
    try {
      const result = await assetGet<Page<{ _id: string; name: string; code: string }>>(`/${kind}`, { search: search.trim() || undefined, limit: 20 });
      setError(""); return result.data.map((row) => ({ value: row._id, label: `${row.name}${row.code ? ` (${row.code})` : ""}` }));
    } catch (err) { setError(getApiErrorMessage(err)); return []; }
  };
  return <><AsyncSelect inputId={inputId} isClearable isDisabled={disabled} defaultOptions loadOptions={options} value={value} onChange={onChange} placeholder={kind === "employees" ? "Search employee name or code" : "Select inventory location"} noOptionsMessage={() => error ? "Unable to load options" : "No matches found"} />{error && <Text role="alert" color="red.500" fontSize="xs" mt={1}>{error}</Text>}</>;
}
