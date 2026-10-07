"use client";

import { PageBanner } from "@/app/component/common/PageBanner/PageBanner";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import axios from "axios";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FiCreditCard, FiDownload, FiFileText, FiRefreshCw } from "react-icons/fi";

type Payslip = {
  _id: string;
  payslipNumber: string;
  periodKey: string;
  finalizationVersion: number;
  currency: string;
  currencyMinorUnits: number;
  companySnapshot: { name: string; code: string };
  employeeSnapshot: { name: string; code: string; designation?: string };
  amountsSnapshot: {
    grossEarningsMinor: number;
    totalDeductionsMinor: number;
    totalReimbursementsMinor: number;
    netPayMinor: number;
  };
  contentHash: string;
  issuedAt: string;
  isLatest: boolean;
};

function periodLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatMoney(amountMinor: unknown, currency = "INR", minorUnits = 2) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: minorUnits,
    maximumFractionDigits: minorUnits,
  }).format(Number(amountMinor || 0) / 10 ** minorUnits);
}

function filenameFromDisposition(value: string, fallback: string) {
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(value)?.[1];
  const regular = /filename="?([^";]+)"?/i.exec(value)?.[1];
  return encoded ? decodeURIComponent(encoded) : regular || fallback;
}

export default function MyPayslipsWorkspace() {
  const toast = useToast();
  const [items, setItems] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardHeader = useColorModeValue("blue.50", "whiteAlpha.100");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/payroll/payslips/me", { params: { page, limit: 12 } });
      setItems(data.data || []);
      setTotal(Number(data.pagination?.total || 0));
      setTotalPages(Number(data.pagination?.totalPages || 1));
    } catch (error) {
      toast({ title: "Unable to load payslips", description: getApiErrorMessage(error), status: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => { void load(); }, [load]);

  const download = async (item: Payslip) => {
    setDownloadingId(item._id);
    try {
      const response = await axios.get(`/payroll/payslips/me/${item._id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFromDisposition(String(response.headers["content-disposition"] || ""), `${item.payslipNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Unable to download payslip", description: getApiErrorMessage(error), status: "error" });
    } finally {
      setDownloadingId("");
    }
  };

  return <Box minH="100dvh" bg={pageBg}>
    <PageBanner
      titlePrefix="MY"
      titleHighlight="PAYSLIPS"
      subtitle="FINALIZED PAYROLL DOCUMENTS"
      icon={FiCreditCard}
      showBackButton
      colorScheme="blue"
    />
    <Stack spacing={5} py={5}>
      <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
        <Box><Text fontWeight="800" fontSize="lg">Payslip history</Text><Text fontSize="sm" color={muted}>Only payslips issued from finalized payroll are available here.</Text></Box>
        <Button alignSelf={{ base: "flex-start", md: "center" }} leftIcon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={() => void load()}>Refresh</Button>
      </Flex>

      {loading ? <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>{[1, 2, 3].map((item) => <Skeleton key={item} h="238px" borderRadius="md" />)}</SimpleGrid> : items.length === 0 ? (
        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" py={16} textAlign="center">
          <Icon as={FiFileText} boxSize={9} color="gray.400" />
          <Text mt={3} fontWeight="800">No payslips issued yet</Text>
          <Text mt={1} fontSize="sm" color={muted}>Your payslip will appear after payroll is finalized and released by HR.</Text>
        </Box>
      ) : <>
        {items.some((item) => !item.isLatest) ? <Alert status="info" borderRadius="md"><AlertIcon /><AlertDescription>A corrected payroll may create another payslip version for the same month. The latest version is marked clearly; older versions remain available for history.</AlertDescription></Alert> : null}
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>{items.map((item) => <Box key={item._id} bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" overflow="hidden">
          <Flex px={5} py={4} bg={cardHeader} justify="space-between" align="start">
            <Box><Text fontWeight="800" fontSize="lg">{periodLabel(item.periodKey)}</Text><Text fontSize="xs" color={muted}>{item.payslipNumber}</Text></Box>
            <Badge colorScheme={item.isLatest ? "green" : "gray"}>{item.isLatest ? "Latest" : `Version ${item.finalizationVersion}`}</Badge>
          </Flex>
          <Stack spacing={3} p={5}>
            <Box><Text fontSize="xs" color={muted}>NET PAY</Text><Text fontSize="2xl" fontWeight="800">{formatMoney(item.amountsSnapshot.netPayMinor, item.currency, item.currencyMinorUnits)}</Text></Box>
            <SimpleGrid columns={2} spacing={3}>
              <Box><Text fontSize="xs" color={muted}>GROSS</Text><Text fontWeight="700">{formatMoney(item.amountsSnapshot.grossEarningsMinor, item.currency, item.currencyMinorUnits)}</Text></Box>
              <Box><Text fontSize="xs" color={muted}>DEDUCTIONS</Text><Text fontWeight="700">{formatMoney(item.amountsSnapshot.totalDeductionsMinor, item.currency, item.currencyMinorUnits)}</Text></Box>
            </SimpleGrid>
            <Text fontSize="xs" color={muted}>Issued {new Date(item.issuedAt).toLocaleDateString()} | Payroll finalization v{item.finalizationVersion}</Text>
            <Button leftIcon={<FiDownload />} colorScheme="blue" isLoading={downloadingId === item._id} onClick={() => void download(item)}>Download PDF</Button>
          </Stack>
        </Box>)}</SimpleGrid>
      </>}

      <Flex justify="space-between" align="center"><Text fontSize="sm" color={muted}>{total} payslip{total === 1 ? "" : "s"}</Text><HStack><Button size="sm" variant="outline" isDisabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Text fontSize="sm">{page} / {totalPages}</Text><Button size="sm" variant="outline" isDisabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></HStack></Flex>
    </Stack>
  </Box>;
}
