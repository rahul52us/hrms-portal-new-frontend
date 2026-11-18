"use client";
import { Text } from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import AsyncSelect from "react-select/async";
import { assetFailure, AssetCategory, Option, Page } from "./assetApi";

/** Shared bounded lookup; template designers can use it without gaining company inventory access. */
export default function AssetCategorySelect({ inputId, value, onChange, disabled, includeArchived = false, clearable = false, scope = "assets" }: { inputId: string; value: Option | null; onChange: (value: Option | null) => void; disabled?: boolean; includeArchived?: boolean; clearable?: boolean; scope?: "assets" | "onboarding" }) {
  const [error, setError] = useState("");
  const load = async (search: string) => {
    try {
      const response = await axios.get<Page<AssetCategory>>(scope === "assets" ? "/assets/categories" : "/onboarding/asset-categories", { params: { search: search.trim() || undefined, state: includeArchived ? "all" : "active", limit: 20 } });
      setError(""); return response.data.data.map((row) => ({ value: row.code, label: `${row.name}${row.state === "archived" ? " (archived)" : ""}` }));
    } catch (err) { setError(assetFailure(err)); return []; }
  };
  return <><AsyncSelect inputId={inputId} value={value} onChange={onChange} isDisabled={disabled} isClearable={clearable} defaultOptions loadOptions={load} placeholder={clearable ? "All categories" : "Choose a category"} noOptionsMessage={() => error ? "Unable to load categories" : "No matching categories"} />{error && <Text role="alert" color="red.500" mt={1} fontSize="xs">{error}</Text>}</>;
}
