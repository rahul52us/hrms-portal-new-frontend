"use client";
import { Alert, AlertIcon, Button, Checkbox, FormControl, FormLabel, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { useState } from "react";
import AsyncSelect from "react-select/async";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { assetGet, AssetClearance, assetSave, ClearanceEmployee, Page } from "./assetApi";

type EmployeeOption = { value: string; label: string; currentClearance: string | null };
export default function AssetClearanceCreate({ onClose, onSaved }: { onClose: () => void; onSaved: (id: string) => void }) {
  const [employee, setEmployee] = useState<EmployeeOption | null>(null), [date, setDate] = useState(""), [reason, setReason] = useState(""), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [lookupError, setLookupError] = useState(""), [retry, setRetry] = useState<Record<string, unknown> | null>(null);
  const loadEmployees = async (search: string) => {
    try {
      const response = await assetGet<Page<ClearanceEmployee>>("/clearances/employees", { search: search.trim() || undefined, limit: 20 });
      setLookupError(""); return response.data.map((row) => ({ value: row._id, label: `${row.name} (${row.code})${row.archived ? " - Inactive" : ""}${row.currentClearance ? " - Current clearance" : ""}`, currentClearance: row.currentClearance }));
    } catch (err) { setLookupError(getApiErrorMessage(err)); return []; }
  };
  const execute = async (body: Record<string, unknown>) => {
    if (busy) return;
    setBusy(true); setError("");
    try { const result = await assetSave<AssetClearance>("/clearances", body); setRetry(null); onSaved(result.data._id); }
    catch (err: any) { setError(getApiErrorMessage(err)); setRetry(!err?.response || err.response.status >= 500 ? body : null); }
    finally { setBusy(false); }
  };
  const disabled = busy || Boolean(retry);
  return <DashboardDrawer isOpen onClose={() => { if (!busy) onClose(); }} titlePrefix="Open asset clearance" maxW={{ base: "100%", lg: "720px" }}><Stack spacing={5}>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {retry && <Alert status="warning"><AlertIcon /><Stack><Text>The result is uncertain. Retry the original request before creating another case.</Text><Button size="sm" isDisabled={busy} onClick={() => void execute(retry)}>Retry same request</Button></Stack></Alert>}
    <FormControl isRequired><FormLabel htmlFor="clearance-employee">Employee</FormLabel><AsyncSelect inputId="clearance-employee" value={employee} onChange={setEmployee} defaultOptions loadOptions={loadEmployees} isClearable isDisabled={disabled} placeholder="Search employee name or code" noOptionsMessage={() => lookupError ? "Unable to load employees" : "No matches found"} />{lookupError && <Text role="alert" fontSize="sm" color="red.500">{lookupError}</Text>}</FormControl>
    {employee?.currentClearance ? <><Alert status="info"><AlertIcon />This employee already has a current asset clearance.</Alert><Button alignSelf="start" onClick={() => onSaved(employee.currentClearance!)}>Open current case</Button></> : <>
      <FormControl isRequired><FormLabel htmlFor="clearance-last-date">Expected last working date</FormLabel><Input id="clearance-last-date" type="date" value={date} isDisabled={disabled} onChange={(event) => setDate(event.target.value)} /></FormControl>
      <FormControl isRequired><FormLabel htmlFor="clearance-opening-reason">Reason (shared with employee)</FormLabel><Textarea id="clearance-opening-reason" value={reason} maxLength={1000} isDisabled={disabled} onChange={(event) => setReason(event.target.value)} /></FormControl>
      <Checkbox id="clearance-issue-hold" isChecked={confirmed} isDisabled={disabled} onChange={(event) => setConfirmed(event.target.checked)}>Block new equipment issues until this clearance is cancelled, including after it is cleared.</Checkbox>
      <Alert status="info"><AlertIcon />Asset clearance does not exit the employee, disable login, or change payroll.</Alert>
      <Button colorScheme="blue" alignSelf="start" isLoading={busy} isDisabled={disabled || !employee || !date || reason.trim().length < 3 || !confirmed} onClick={() => void execute({ employeeId: employee?.value, lastWorkingDate: date, reason: reason.trim(), confirmIssueHold: confirmed, requestId: crypto.randomUUID() })}>Open clearance</Button>
    </>}
  </Stack></DashboardDrawer>;
}
