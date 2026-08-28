"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { hasPermission, PERMISSION_KEYS } from "@/app/config/utils/permissions";
import stores from "@/app/store/stores";
import {
  CompOffClaim,
  actOnCompOffClaim,
  fetchCompOffClaims,
} from "@/app/component/comp-off/compOffApi";
import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Select,
  Skeleton,
  Stack,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiEye, FiX } from "react-icons/fi";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
}).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
const statusColor = (status: string) => ({ submitted: "orange", approved: "green", rejected: "red", withdrawn: "gray", revoked: "gray" }[status] || "gray");
const dayType = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function CompOffClaimsPanel({ companyId, borderColor, muted }: { companyId: string; borderColor: string; muted: string }) {
  const toast = useToast();
  const details = useDisclosure();
  const canApprove = hasPermission(stores.auth.user, PERMISSION_KEYS.APPROVE_LEAVE_REQUESTS);
  const actorId = String(stores.auth.user?._id || "");
  const [items, setItems] = useState<CompOffClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("submitted");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<CompOffClaim | null>(null);
  const [comment, setComment] = useState("");
  const canDecideSelected = Boolean(
    selected && canApprove && (
      selected.approvalInstance
        ? (selected.currentApprovers || []).some((item) => String(item?._id || item) === actorId)
        : true
    )
  );

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const result = await fetchCompOffClaims({ companyId, scope: "company", status: status || undefined, page, limit: 20 });
      setItems(result.items);
      setTotalPages(result.pagination.totalPages || 1);
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not load comp-off claims"), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, page, status, toast]);

  useEffect(() => { load(); }, [load]);

  const open = (claim: CompOffClaim) => {
    setSelected(claim);
    setComment("");
    details.onOpen();
  };

  const decide = async (action: "approve" | "reject" | "revoke") => {
    if (!selected) return;
    if (["reject", "revoke"].includes(action) && comment.trim().length < 3) {
      toast({ title: action === "revoke" ? "A revocation reason is required" : "A rejection reason is required", status: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      const updated = await actOnCompOffClaim(selected._id, action, { companyId, comment: comment.trim() || undefined });
      const movedToNextLevel = action === "approve" && updated.status === "submitted";
      toast({ title: movedToNextLevel ? "Approval recorded; claim moved to the next level" : action === "approve" ? "Comp-off credited" : action === "revoke" ? "Comp-off credit revoked" : "Comp-off claim rejected", status: "success" });
      details.onClose();
      await load();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, `Could not ${action} comp-off claim`), status: "error", duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={4}>
      <Flex justify="space-between" direction={{ base: "column", md: "row" }} gap={3}>
        <Box><Text fontWeight="800">Comp-off earning claims</Text><Text fontSize="sm" color={muted}>Approval rechecks attendance and creates an expiring credit lot.</Text></Box>
        <Select size="sm" maxW="210px" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="submitted">Pending approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="withdrawn">Withdrawn</option><option value="revoked">Revoked</option><option value="">All statuses</option></Select>
      </Flex>
      {loading ? <Stack><Skeleton h="92px" /><Skeleton h="92px" /></Stack> : items.length === 0 ? <Box py={12} textAlign="center" borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md"><Text color={muted}>No comp-off claims match this filter.</Text></Box> : (
        <Stack spacing={0} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
          {items.map((claim, index) => <Flex key={claim._id} p={4} direction={{ base: "column", lg: "row" }} justify="space-between" gap={3} borderBottomWidth={index === items.length - 1 ? 0 : "1px"}><Box><HStack flexWrap="wrap"><Text fontWeight="800">{claim.employee?.name || "Employee"}</Text><Text fontSize="sm" color={muted}>{claim.employee?.code || claim.employee?.username}</Text><Badge colorScheme={statusColor(claim.status)}>{claim.status}</Badge></HStack><Text mt={1} fontSize="sm">{claim.leaveType?.name || "Comp-off"} | Worked {formatDate(claim.attendanceDate)} | {claim.requestedUnits} day</Text><Text mt={1} fontSize="xs" color={muted}>{dayType(claim.dayTypeSnapshot)} | {claim.workedMinutesSnapshot} worked minutes | {claim.reason}</Text></Box><Button size="sm" variant="outline" leftIcon={<FiEye />} alignSelf={{ lg: "center" }} onClick={() => open(claim)}>Review</Button></Flex>)}
        </Stack>
      )}
      <HStack justify="end"><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">Page {page} of {totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack>

      <Drawer isOpen={details.isOpen} onClose={details.onClose} placement="right" size="lg"><DrawerOverlay /><DrawerContent><DrawerCloseButton /><DrawerHeader borderBottomWidth="1px">Comp-off claim</DrawerHeader><DrawerBody py={5}>{selected ? <Stack spacing={5}><Box><HStack><Text fontSize="lg" fontWeight="800">{selected.employee?.name}</Text><Badge colorScheme={statusColor(selected.status)}>{selected.status}</Badge></HStack><Text fontSize="sm" color={muted}>{selected.employee?.code || selected.employee?.username}</Text></Box><Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}><Text fontWeight="800">{selected.leaveType?.name || "Comp-off"} ({selected.leaveType?.code})</Text><Text mt={1}>Worked {formatDate(selected.attendanceDate)}</Text><Text mt={1} fontSize="sm" color={muted}>{dayType(selected.dayTypeSnapshot)} | {selected.workedMinutesSnapshot} minutes | {selected.requestedUnits} day requested</Text>{selected.expiresOn ? <Text mt={1} fontSize="sm">Credit expiry: {formatDate(selected.expiresOn)}</Text> : null}</Box><Box><Text fontSize="xs" color={muted}>Reason</Text><Text mt={1}>{selected.reason}</Text></Box>{((selected.status === "submitted" && canDecideSelected) || (selected.status === "approved" && canApprove)) ? <FormControl><FormLabel>{selected.status === "approved" ? "Revocation reason" : "Decision comment"}</FormLabel><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={selected.status === "approved" ? "Required to revoke unused credit" : "Required when rejecting"} /></FormControl> : null}</Stack> : null}</DrawerBody><DrawerFooter borderTopWidth="1px" gap={3}><Button variant="outline" onClick={details.onClose}>Close</Button>{selected?.status === "submitted" && canDecideSelected ? <><Button colorScheme="red" variant="outline" leftIcon={<FiX />} onClick={() => decide("reject")} isLoading={submitting}>Reject</Button><Button colorScheme="green" leftIcon={<FiCheck />} onClick={() => decide("approve")} isLoading={submitting}>Approve</Button></> : null}{selected?.status === "approved" && canApprove ? <Button colorScheme="red" variant="outline" onClick={() => decide("revoke")} isLoading={submitting}>Revoke unused credit</Button> : null}</DrawerFooter></DrawerContent></Drawer>
    </Stack>
  );
}
