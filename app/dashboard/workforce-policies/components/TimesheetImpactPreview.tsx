"use client";
import axios from "axios";
import { Alert, AlertIcon, Badge, Box, Button, Flex, Input, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { formatMinutes } from "../../calendar/timesheetUi.utils";
import { getApiErrorMessage } from "@/app/config/utils/apiError";

export default function TimesheetImpactPreview(props: { companyId: string; policyId?: string; rules?: Record<string, unknown>; at: string; scopeType?: string; scopeId?: string }) {
  const [result, setResult] = useState<any>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false), [search, setSearch] = useState("");
  const signature = JSON.stringify(props);
  const sequence = useRef(0);
  useEffect(() => { sequence.current++; setResult(null); setError(""); setBusy(false); return () => { sequence.current++; }; }, [signature]);
  async function load(page = 1) {
    const current = ++sequence.current;
    setBusy(true); setError("");
    try { const response = await axios.post("/workforce-policies/timesheet-policies/preview", { companyId: props.companyId, policyId: props.policyId, rules: props.rules, effectiveFrom: props.at, scopeType: props.scopeType, scopeId: props.scopeId || undefined, page, limit: 10, search: search || undefined }); if (current === sequence.current) setResult(response.data); }
    catch (error: any) { if (current === sequence.current) setError(getApiErrorMessage(error?.response?.data || error, "Unable to preview Timesheet coverage")); }
    finally { if (current === sequence.current) setBusy(false); }
  }
  return <Box borderTopWidth="1px" pt={4}><Stack spacing={3}>
    <Flex gap={3} wrap="wrap"><Input aria-label="Policy preview employee search" placeholder="Employee name or code" maxW="280px" value={search} onChange={(e) => setSearch(e.target.value)} /><Button variant="outline" isLoading={busy} isDisabled={!props.at || Boolean(props.scopeType && props.scopeType !== "company" && !props.scopeId)} onClick={() => load()}>Preview coverage and impact</Button></Flex>
    {error ? <Alert status="error"><AlertIcon />{error}</Alert> : null}
    {result ? <>{result.conflict ? <Alert status="warning"><AlertIcon />This scope already has an assignment. End its overlap before creating the proposed assignment.</Alert> : null}<Text fontSize="sm">Preview for {props.at}{props.scopeType ? `, proposed ${props.scopeType} assignment` : ", existing assignments"}. Page results only; more-specific assignments still take precedence.</Text><TableContainer><Table size="sm"><Thead><Tr><Th>Employee</Th><Th>Proposed policy</Th><Th>Required</Th><Th>Payroll treatment</Th></Tr></Thead><Tbody>{result.data.map((row: any) => <Tr key={row.employee._id}><Td>{row.employee.name}<Text fontSize="xs">{row.employee.code}</Text></Td><Td><Badge colorScheme={row.applies ? "blue" : "gray"}>{row.applies ? "Applies" : "Not affected"}</Badge>{row.applies && row.setupIssues.length ? <Text fontSize="xs" whiteSpace="normal">{row.setupIssues.map((issue: any) => issue.message).join("; ")}</Text> : null}</Td><Td>{formatMinutes(row.requiredMinutes)}</Td><Td whiteSpace="normal">{row.payrollMode.replaceAll("_", " ")}</Td></Tr>)}</Tbody></Table></TableContainer><Flex gap={3} align="center"><Button size="sm" isDisabled={busy || result.pagination.page <= 1} onClick={() => load(result.pagination.page - 1)}>Previous employees</Button><Text>{result.pagination.page}/{result.pagination.totalPages}</Text><Button size="sm" isDisabled={busy || result.pagination.page >= result.pagination.totalPages} onClick={() => load(result.pagination.page + 1)}>Next employees</Button></Flex></> : null}
  </Stack></Box>;
}
