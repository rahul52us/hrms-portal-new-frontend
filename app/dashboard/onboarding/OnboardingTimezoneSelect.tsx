"use client";
import { Select } from "@chakra-ui/react";

export default function OnboardingTimezoneSelect({ id, value, disabled, onChange }: { id: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  const supported = (Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone") || ["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "America/New_York", "America/Los_Angeles", "Australia/Sydney"];
  const zones = Array.from(new Set([value, "UTC", "Asia/Kolkata", ...supported].filter(Boolean))).sort();
  return <Select id={id} value={value} isDisabled={disabled} onChange={(event) => onChange(event.target.value)}>{zones.map((zone) => <option key={zone} value={zone}>{zone.replaceAll("_", " ")}</option>)}</Select>;
}
