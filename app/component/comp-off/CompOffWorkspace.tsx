"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  CompOffEligibility,
  actOnCompOffClaim,
  fetchCompOffClaims,
  fetchCompOffCredits,
  fetchCompOffEligibility,
  submitCompOffClaim,
} from "./compOffApi";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiRefreshCw } from "react-icons/fi";

const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
}).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
const label = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusColor = (status: string) => ({ submitted: "orange", approved: "green", rejected: "red", withdrawn: "gray", revoked: "gray" }[status] || "gray");

type Props = { embedded?: boolean };

export default function CompOffWorkspace({ embedded = false }: Props) {
  const toast = useToast();
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const [claims, setClaims] = useState<any[]>([]);
  const [credits, setCredits] = useState<any>({ summary: {}, lots: [] });
  const [attendanceDate, setAttendanceDate] = useState(today());
  const [eligibility, setEligibility] = useState<CompOffEligibility | null>(null);
  const [eligibilityError, setEligibilityError] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [claimResult, creditResult] = await Promise.all([
        fetchCompOffClaims({ scope: "self", page: 1, limit: 50 }),
        fetchCompOffCredits(),
      ]);
      setClaims(claimResult.items || []);
      setCredits(creditResult || { summary: {}, lots: [] });
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not load comp-off data"), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const selected = useMemo(
    () => eligibility?.items?.find((item) => String(item.leaveType?._id) === leaveTypeId) || null,
    [eligibility, leaveTypeId]
  );

  const check = async () => {
    setChecking(true);
    setEligibility(null);
    setEligibilityError("");
    try {
      const result = await fetchCompOffEligibility({ attendanceDate });
      setEligibility(result);
      const first = result.items?.[0];
      setLeaveTypeId(String(first?.leaveType?._id || ""));
    } catch (error: any) {
      setEligibilityError(getApiErrorMessage(error?.response?.data || error, "This date is not eligible for comp-off"));
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    if (!selected || reason.trim().length < 3) return;
    setSubmitting(true);
    try {
      await submitCompOffClaim({ attendanceDate, leaveTypeId, requestedUnits: selected.eligibleUnits, reason: reason.trim() });
      toast({ title: "Comp-off claim submitted", status: "success" });
      setReason("");
      setEligibility(null);
      await load();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not submit comp-off claim"), status: "error", duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  const withdraw = async (claimId: string) => {
    try {
      await actOnCompOffClaim(claimId, "withdraw", { comment: "Withdrawn by employee" });
      toast({ title: "Comp-off claim withdrawn", status: "success" });
      await load();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error), status: "error" });
    }
  };

  const summary = credits?.summary || {};
  return (
    <Box minH={embedded ? undefined : "100dvh"} bg={embedded ? "transparent" : pageBg} px={embedded ? 0 : { base: 3, md: 6 }} py={embedded ? 0 : { base: 4, md: 6 }}>
      <Stack maxW={embedded ? undefined : "1400px"} mx={embedded ? undefined : "auto"} spacing={5}>
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap={3}>
          <Box><Heading size="lg">Comp-off</Heading><Text mt={1} color={muted} fontSize="sm">Claim time worked on a weekly off or mandatory holiday.</Text></Box>
          <Button variant="outline" leftIcon={<FiRefreshCw />} onClick={load} isLoading={loading}>Refresh</Button>
        </Flex>

        {loading ? <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}><Skeleton h="86px" /><Skeleton h="86px" /><Skeleton h="86px" /><Skeleton h="86px" /></SimpleGrid> : (
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
            {[
              ["Available", summary.availableUnits || 0, "green"],
              ["Reserved", summary.reservedUnits || 0, "orange"],
              ["Used", summary.consumedUnits || 0, "blue"],
              ["Expired", summary.expiredUnits || 0, "gray"],
            ].map(([name, value, color]) => <Box key={String(name)} bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={4}><Text fontSize="xs" color={muted}>{name} credits</Text><Text mt={1} fontSize="2xl" fontWeight="800" color={`${color}.500`}>{String(value)}</Text></Box>)}
          </SimpleGrid>
        )}

        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={{ base: 4, md: 5 }}>
          <Text fontWeight="800">Claim earned comp-off</Text>
          <Text mt={1} fontSize="sm" color={muted}>Choose the date you worked. Closed attendance and the historical policy determine eligibility.</Text>
          <Flex mt={4} gap={3} align="end" direction={{ base: "column", sm: "row" }}>
            <FormControl maxW={{ sm: "280px" }} isRequired><FormLabel>Worked on</FormLabel><Input type="date" max={today()} value={attendanceDate} onChange={(event) => { setAttendanceDate(event.target.value); setEligibility(null); setEligibilityError(""); }} /></FormControl>
            <Button leftIcon={<FiCheckCircle />} colorScheme="blue" onClick={check} isLoading={checking} isDisabled={!attendanceDate}>Check eligibility</Button>
          </Flex>
          {eligibilityError ? <Alert mt={4} status="warning" borderRadius="md"><AlertIcon /><AlertDescription>{eligibilityError}</AlertDescription></Alert> : null}
          {eligibility ? (
            <Stack mt={5} spacing={4}>
              <Alert status={selected && selected.eligibleUnits > 0 && !selected.existingClaim ? "success" : "warning"} borderRadius="md"><AlertIcon /><AlertDescription>{label(eligibility.dayType)} | {eligibility.workedMinutes} worked minutes{selected ? ` | ${selected.eligibleUnits} day eligible` : ""}</AlertDescription></Alert>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired><FormLabel>Comp-off leave type</FormLabel><Select value={leaveTypeId} onChange={(event) => setLeaveTypeId(event.target.value)}>{eligibility.items.map((item) => <option key={item.leaveType._id} value={item.leaveType._id}>{item.leaveType.name} ({item.leaveType.code})</option>)}</Select></FormControl>
                <FormControl><FormLabel>Credit earned</FormLabel><Input isReadOnly variant="filled" value={selected ? `${selected.eligibleUnits} ${selected.eligibleUnits === 1 ? "day" : "days"}` : "0 days"} /></FormControl>
              </SimpleGrid>
              <FormControl isRequired><FormLabel>Reason</FormLabel><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe the off-day work completed" /></FormControl>
              {selected?.existingClaim ? <Alert status="info" borderRadius="md"><AlertIcon /><AlertDescription>A {selected.existingClaim.status} claim already exists for this date and leave type.</AlertDescription></Alert> : null}
              <Button alignSelf="start" colorScheme="blue" onClick={submit} isLoading={submitting} isDisabled={!selected || selected.eligibleUnits <= 0 || Boolean(selected.existingClaim) || reason.trim().length < 3}>Submit claim</Button>
            </Stack>
          ) : null}
        </Box>

        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          <Box px={4} py={3} borderBottomWidth="1px" borderColor={border}><Text fontWeight="800">Claim history</Text></Box>
          {claims.length === 0 ? <Text py={10} textAlign="center" color={muted}>No comp-off claims yet.</Text> : claims.map((claim, index) => (
            <Flex key={claim._id} px={4} py={4} direction={{ base: "column", md: "row" }} justify="space-between" gap={3} borderBottomWidth={index === claims.length - 1 ? 0 : "1px"} borderColor={border}>
              <Box><HStack flexWrap="wrap"><Text fontWeight="800">{claim.leaveType?.name || "Comp-off"}</Text><Badge>{claim.leaveType?.code}</Badge><Badge colorScheme={statusColor(claim.status)}>{claim.status}</Badge></HStack><Text mt={1} fontSize="sm">Worked {formatDate(claim.attendanceDate)} | {claim.requestedUnits} day claimed | {claim.workedMinutesSnapshot} minutes</Text><Text mt={1} fontSize="xs" color={muted}>{claim.status === "approved" && claim.expiresOn ? `Credit expires ${formatDate(claim.expiresOn)}` : `Approver: ${claim.approver?.name || claim.approverNameSnapshot || "HR queue"}`} | {claim.reason}</Text></Box>
              {claim.status === "submitted" ? <Button size="sm" variant="outline" colorScheme="red" alignSelf={{ md: "center" }} onClick={() => withdraw(claim._id)}>Withdraw</Button> : null}
            </Flex>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
