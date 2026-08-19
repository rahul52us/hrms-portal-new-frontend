"use client";

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
  Input,
  InputGroup,
  InputLeftElement,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { FormEvent, useEffect, useState } from "react";
import { FiSearch, FiSettings } from "react-icons/fi";
import { workforcePolicyStore } from "@/app/store/workforcePolicyStore/workforcePolicyStore";

function localDateValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const formatDate = (value?: string | null) => {
  if (!value) return "Open ended";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
};

const LeaveCoveragePanel = observer(function LeaveCoveragePanel({
  companyId,
  borderColor,
  muted,
  onManageAssignments,
}: {
  companyId: string;
  borderColor: string;
  muted: string;
  onManageAssignments: () => void;
}) {
  const [date, setDate] = useState(localDateValue());
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!companyId || !date) return;
    workforcePolicyStore
      .fetchCoverage(companyId, {
        at: date,
        page,
        limit: 20,
        search,
        resourceType: "leave_policy",
      })
      .catch(() => undefined);
  }, [companyId, date, page, search]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };
  const pagination = workforcePolicyStore.coveragePagination;
  const summary = workforcePolicyStore.coverageSummary;

  return (
    <Stack spacing={4}>
      <Flex direction={{ base: "column", md: "row" }} gap={3} align={{ md: "end" }}>
        <FormControl maxW={{ md: "220px" }}>
          <FormLabel fontSize="sm">Coverage date</FormLabel>
          <Input type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} />
        </FormControl>
        <Box as="form" onSubmit={submitSearch} flex="1">
          <FormLabel fontSize="sm">Find employee</FormLabel>
          <HStack>
            <InputGroup>
              <InputLeftElement pointerEvents="none"><FiSearch /></InputLeftElement>
              <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Name, username or employee code" />
            </InputGroup>
            <Button type="submit" variant="outline">Search</Button>
          </HStack>
        </Box>
      </Flex>

      <Flex p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md" direction={{ base: "column", md: "row" }} justify="space-between" gap={3}>
        <Box>
          <Text fontWeight="800">Leave policy coverage</Text>
          <Text mt={1} fontSize="sm" color={muted}>Resolves the policy effective for each employee on the selected date.</Text>
        </Box>
        <HStack flexWrap="wrap">
          <Badge colorScheme="gray" borderRadius="full" px={3} py={1.5}>{summary.employeesOnPage} checked</Badge>
          <Badge colorScheme="green" borderRadius="full" px={3} py={1.5}>{summary.completeOnPage} covered</Badge>
          <Badge colorScheme="orange" borderRadius="full" px={3} py={1.5}>{summary.incompleteOnPage} missing</Badge>
          <Button size="sm" variant="outline" leftIcon={<FiSettings />} onClick={onManageAssignments}>Manage assignments</Button>
        </HStack>
      </Flex>

      {workforcePolicyStore.coverageError ? (
        <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{workforcePolicyStore.coverageError}</AlertDescription></Alert>
      ) : null}

      {workforcePolicyStore.coverageLoading ? (
        <Stack><Skeleton h="88px" /><Skeleton h="88px" /></Stack>
      ) : workforcePolicyStore.coverageItems.length === 0 ? (
        <Box borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md" py={12} textAlign="center">
          <Text color={muted}>No employees match this search.</Text>
        </Box>
      ) : (
        <Stack spacing={0} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
          {workforcePolicyStore.coverageItems.map((item, index) => {
            const resolved = item.leavePolicy;
            const resource = resolved && typeof resolved.assignment.resource === "object"
              ? resolved.assignment.resource
              : null;
            return (
              <Flex key={item.employee._id} p={4} gap={4} direction={{ base: "column", md: "row" }} justify="space-between" borderBottomWidth={index === workforcePolicyStore.coverageItems.length - 1 ? "0" : "1px"}>
                <Box minW={0}>
                  <Text fontWeight="800">{item.employee.name || item.employee.username}</Text>
                  <Text fontSize="xs" color={muted}>{[item.employee.code, item.employee.username].filter(Boolean).join(" | ")}</Text>
                </Box>
                {resolved ? (
                  <Flex flex="1" justify={{ md: "space-between" }} direction={{ base: "column", md: "row" }} gap={2} maxW={{ md: "680px" }}>
                    <Box>
                      <Text fontWeight="700">{resource?.name || "Leave policy"}</Text>
                      <Text fontSize="xs" color={muted}>{resource?.code} / version {resolved.version.versionNumber}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm">Via {resolved.assignment.scopeType}: {resolved.assignment.scopeNameSnapshot}</Text>
                      <Text fontSize="xs" color={muted}>{formatDate(resolved.assignment.effectiveFrom)} to {formatDate(resolved.assignment.effectiveTo)}</Text>
                    </Box>
                    <Badge colorScheme="green" alignSelf="start">Covered</Badge>
                  </Flex>
                ) : (
                  <HStack><Text fontSize="sm" color={muted}>No published leave policy assignment applies.</Text><Badge colorScheme="orange">Missing</Badge></HStack>
                )}
              </Flex>
            );
          })}
        </Stack>
      )}

      <Flex justify="space-between" align="center" gap={3}>
        <Text fontSize="sm" color={muted}>{pagination.total} employees</Text>
        <HStack>
          <Button size="sm" variant="outline" isDisabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
          <Text fontSize="sm">{page} / {pagination.totalPages}</Text>
          <Button size="sm" variant="outline" isDisabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </HStack>
      </Flex>
    </Stack>
  );
});

export default LeaveCoveragePanel;
