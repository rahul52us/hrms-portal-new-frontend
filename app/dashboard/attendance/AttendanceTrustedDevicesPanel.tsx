"use client";

import { getApiErrorMessage } from "@/app/config/utils/apiError";
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
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import {
  AttendanceTrustedDeviceItem,
  fetchAttendanceTrustedDevices,
  updateAttendanceTrustedDeviceStatus,
} from "./attendanceAdminApi";

const displayTime = (value?: string | null) => value
  ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "-";

const statusColor = (status: string) => status === "trusted" ? "green" : status === "revoked" ? "red" : "orange";

export default function AttendanceTrustedDevicesPanel() {
  const toast = useToast();
  const decision = useDisclosure();
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const [items, setItems] = useState<AttendanceTrustedDeviceItem[]>([]);
  const [status, setStatus] = useState<"all" | "pending" | "trusted" | "revoked">("pending");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<AttendanceTrustedDeviceItem | null>(null);
  const [nextStatus, setNextStatus] = useState<"trusted" | "revoked">("trusted");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAttendanceTrustedDevices({ status, page, limit: 25 });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not load trusted browsers"), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, status, toast]);

  useEffect(() => { void load(); }, [load]);

  const openDecision = (item: AttendanceTrustedDeviceItem, value: "trusted" | "revoked") => {
    setSelected(item);
    setNextStatus(value);
    setReason("");
    decision.onOpen();
  };

  const submitDecision = async () => {
    if (!selected || reason.trim().length < 3) return;
    setSubmitting(true);
    try {
      await updateAttendanceTrustedDeviceStatus(selected._id, nextStatus, reason.trim());
      toast({ title: nextStatus === "trusted" ? "Browser trusted" : "Browser revoked", status: "success" });
      decision.onClose();
      await load();
    } catch (error: any) {
      toast({ title: getApiErrorMessage(error?.response?.data || error, "Could not update browser trust"), status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={4}>
      <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
        <Box>
          <Text fontSize="xl" fontWeight="800">Trusted attendance browsers</Text>
          <Text fontSize="sm" color={muted}>Review employee browser registrations used by trusted-device attendance policies.</Text>
        </Box>
        <HStack>
          <Select
            value={status}
            onChange={(event) => { setStatus(event.target.value as any); setPage(1); }}
            maxW="180px"
            aria-label="Trusted browser status"
          >
            <option value="pending">Pending approval</option>
            <option value="trusted">Trusted</option>
            <option value="revoked">Revoked</option>
            <option value="all">All statuses</option>
          </Select>
          <Button variant="outline" onClick={load} isLoading={loading}>Refresh</Button>
        </HStack>
      </Flex>

      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <AlertDescription>A trusted browser ID is a server-hashed browser credential, not hardware attestation. Revoke it when a device is lost, shared, or replaced.</AlertDescription>
      </Alert>

      <Box borderWidth="1px" borderColor={border} borderRadius="md" overflowX="auto">
        {loading ? (
          <Stack p={4}><Skeleton h="48px" /><Skeleton h="48px" /><Skeleton h="48px" /></Stack>
        ) : items.length === 0 ? (
          <Text py={12} textAlign="center" color={muted}>No browser registrations match this status.</Text>
        ) : (
          <Table size="sm" minW="1050px">
            <Thead><Tr><Th>Employee</Th><Th>Browser</Th><Th>Last seen</Th><Th>Network</Th><Th>Status</Th><Th textAlign="right">Actions</Th></Tr></Thead>
            <Tbody>
              {items.map((item) => (
                <Tr key={item._id}>
                  <Td><Text fontWeight="700">{item.employee?.name || "Employee"}</Text><Text fontSize="xs" color={muted}>{item.employee?.code || "-"} | {item.employee?.username || "-"}</Text></Td>
                  <Td><Text>{item.deviceName || "Browser"}</Text><Text fontSize="xs" color={muted}>{item.platform || "Unknown platform"} | ...{item.deviceIdSuffix}</Text></Td>
                  <Td>{displayTime(item.lastSeenAt)}<Text fontSize="xs" color={muted}>First: {displayTime(item.firstSeenAt)}</Text></Td>
                  <Td>{item.lastSeenIp || "Unavailable"}</Td>
                  <Td><Badge colorScheme={statusColor(item.status)}>{item.status}</Badge></Td>
                  <Td>
                    <HStack justify="flex-end">
                      {item.status !== "trusted" ? <Button size="xs" colorScheme="green" onClick={() => openDecision(item, "trusted")}>Trust</Button> : null}
                      {item.status !== "revoked" ? <Button size="xs" colorScheme="red" variant="outline" onClick={() => openDecision(item, "revoked")}>Revoke</Button> : null}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      <Flex justify="space-between" align="center">
        <Text fontSize="sm" color={muted}>{pagination.total} browser registration(s)</Text>
        <HStack>
          <Button size="sm" variant="outline" isDisabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <Text fontSize="sm">{page} / {Math.max(1, pagination.totalPages)}</Text>
          <Button size="sm" variant="outline" isDisabled={page >= Math.max(1, pagination.totalPages)} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </HStack>
      </Flex>

      <Modal isOpen={decision.isOpen} onClose={decision.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{nextStatus === "trusted" ? "Trust browser" : "Revoke browser"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color={muted} mb={4}>{selected?.employee?.name} | {selected?.deviceName} (...{selected?.deviceIdSuffix})</Text>
            <FormControl isRequired>
              <FormLabel>Decision reason</FormLabel>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={nextStatus === "trusted" ? "Verified as the employee's work browser" : "Device lost, replaced, or no longer allowed"} />
            </FormControl>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={decision.onClose}>Cancel</Button>
            <Button colorScheme={nextStatus === "trusted" ? "green" : "red"} onClick={submitDecision} isDisabled={reason.trim().length < 3} isLoading={submitting}>{nextStatus === "trusted" ? "Trust browser" : "Revoke browser"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
