"use client";
import { Alert, AlertIcon, Box, Checkbox, FormControl, FormLabel, SimpleGrid, Stack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useId, useState } from "react";
import AsyncSelect from "react-select/async";
import stores from "@/app/store/stores";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { hasPermission, PERMISSION_KEYS } from "@/app/config/utils/permissions";
import { onboardingGet, Page } from "./onboardingApi";
import OnboardingTimezoneSelect from "./OnboardingTimezoneSelect";

export type CreationOnboardingSelection = { templateVersionId: string; templateLabel: string; timezone: string };

/** Keep UI labels out of the API payload and reject a checked-but-unconfigured selection before submission. */
export function creationOnboardingPayload(value?: CreationOnboardingSelection | null) {
  if (!value) return undefined;
  if (!/^[a-f0-9]{24}$/i.test(value.templateVersionId) || !value.timezone) throw new Error("Choose a published onboarding checklist and its deadline timezone.");
  return { templateVersionId: value.templateVersionId, timezone: value.timezone };
}

const CreationOnboardingFields = observer(function CreationOnboardingFields({ value, onChange, disabled = false, bulk = false }: {
  value?: CreationOnboardingSelection | null;
  onChange: (value: CreationOnboardingSelection | null) => void;
  disabled?: boolean;
  bulk?: boolean;
}) {
  const id = useId(), [error, setError] = useState("");
  const actor = stores.auth.user;
  const allowed = actor?.role !== "superadmin" && hasPermission(actor, PERMISSION_KEYS.VIEW_ONBOARDING) && hasPermission(actor, PERMISSION_KEYS.MANAGE_ONBOARDING);
  const loadTemplates = async (search: string) => {
    try {
      const response = await onboardingGet<Page<{ templateVersion: string; name: string; version: number; taskCount: number }>>("/assignment-templates", { search: search || undefined, limit: 20 });
      setError("");
      return response.data.map((template) => ({ value: template.templateVersion, label: `${template.name} | v${template.version} | ${template.taskCount} tasks` }));
    } catch (err) { setError(getApiErrorMessage(err)); return []; }
  };
  if (!allowed) return null;
  return <Box borderTopWidth="1px" pt={4}><Stack spacing={4}>
    <Checkbox isChecked={Boolean(value)} isDisabled={disabled} onChange={(event) => {
      setError("");
      onChange(event.target.checked ? { templateVersionId: "", templateLabel: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata" } : null);
    }}>{bulk ? "Assign onboarding to new employees in this file" : "Assign onboarding checklist"}</Checkbox>
    {value && <>
      {error && <Alert status="error"><AlertIcon />{error}</Alert>}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isRequired><FormLabel htmlFor={`${id}-template`}>Published checklist</FormLabel><AsyncSelect inputId={`${id}-template`} defaultOptions loadOptions={loadTemplates} isClearable isDisabled={disabled} placeholder="Search published checklists" value={value.templateVersionId ? { value: value.templateVersionId, label: value.templateLabel } : null} onChange={(option) => onChange({ ...value, templateVersionId: option?.value || "", templateLabel: option?.label || "" })} /></FormControl>
        <FormControl isRequired><FormLabel htmlFor={`${id}-timezone`}>Deadline timezone</FormLabel><OnboardingTimezoneSelect id={`${id}-timezone`} value={value.timezone} disabled={disabled} onChange={(timezone) => onChange({ ...value, timezone })} /></FormControl>
      </SimpleGrid>
    </>}
  </Stack></Box>;
});
export default CreationOnboardingFields;
