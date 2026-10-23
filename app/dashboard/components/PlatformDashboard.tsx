"use client";

import { Alert, AlertIcon, Badge, Box, Button, Flex, Heading, HStack, Link, SimpleGrid, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import NextLink from "next/link";
import { useEffect } from "react";
import { FiRefreshCw } from "react-icons/fi";
import stores from "@/app/store/stores";

export default observer(function PlatformDashboard() {
  const { scopedSummary: summary, scopedSummaryLoading: loading, scopedSummaryError: error, fetchScopedSummary } = stores.dashboardStore;
  const border = useColorModeValue("gray.200", "gray.700");
  const surface = useColorModeValue("white", "gray.800");
  useEffect(() => { fetchScopedSummary().catch(() => undefined); }, [fetchScopedSummary]);
  const stats = summary?.stats;
  const metrics = stats ? [
    { name: "Companies", value: stats.totalCompanies, detail: `${stats.activeCompanies} active | ${stats.inactiveCompanies} inactive` },
    { name: "Employee accounts", value: stats.totalEmployees, detail: `${stats.activeEmployees} active | ${stats.pendingEmployees} setup pending` },
    { name: "Departments", value: stats.departments },
    { name: "Office locations", value: stats.locations },
    { name: "Active projects", value: stats.activeProjects },
  ] : [];
  return <Box p={{ base: 3, md: 6 }} minW={0}><Stack spacing={6} maxW="1500px" mx="auto">
    <Flex align="center" justify="space-between" gap={3} wrap="wrap"><Heading size="lg">Platform overview</Heading>
      <HStack><Button variant="outline" leftIcon={<FiRefreshCw />} isLoading={loading} onClick={() => fetchScopedSummary().catch(() => undefined)}>Refresh</Button><Button as={NextLink} href="/dashboard/companies" colorScheme="blue">Manage companies</Button></HStack>
    </Flex>
    {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    {loading && !summary ? <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={3}>{[0, 1, 2, 3, 4].map((value) => <Skeleton key={value} h="100px" />)}</SimpleGrid> : stats && <>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={3}>{metrics.map((metric) => <Box key={metric.name} borderWidth="1px" borderColor={border} bg={surface} borderRadius="md" p={4}>
        <Text fontSize="sm" color="gray.500">{metric.name}</Text><Text mt={1} fontSize="2xl" fontWeight="700">{Number(metric.value || 0).toLocaleString()}</Text>{metric.detail && <Text mt={1} fontSize="xs" color="gray.500">{metric.detail}</Text>}
      </Box>)}</SimpleGrid>
      <Box minW={0}><Heading size="sm" mb={3}>Recently created companies</Heading><TableContainer borderWidth="1px" borderColor={border} borderRadius="md"><Table size="sm"><Thead><Tr><Th>Company</Th><Th>Code</Th><Th>Status</Th><Th>Created</Th></Tr></Thead><Tbody>
        {(summary.recentCompanies || []).map((company: any) => <Tr key={company._id}><Td py={4} whiteSpace="normal"><Link as={NextLink} href="/dashboard/companies" color="blue.600">{company.company_name}</Link></Td><Td>{company.companyCode}</Td><Td><Badge colorScheme={company.is_active === false ? "gray" : "green"}>{company.is_active === false ? "Inactive" : "Active"}</Badge></Td><Td>{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "-"}</Td></Tr>)}
      </Tbody></Table>{!summary.recentCompanies?.length && <Text p={8} color="gray.500" textAlign="center">No companies yet.</Text>}</TableContainer></Box>
    </>}
  </Stack></Box>;
});
