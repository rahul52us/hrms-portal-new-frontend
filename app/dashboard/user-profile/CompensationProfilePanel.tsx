"use client";

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  HStack,
  SimpleGrid,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Skeleton,
  useColorModeValue,
} from "@chakra-ui/react";

type CompensationComponent = {
  code: string;
  name: string;
  category: string;
  monthlyAmountMinor: number;
  annualAmountMinor: number;
  overridden: boolean;
};

type CompensationAssignment = {
  structureName: string;
  structureCode: string;
  versionNumber: number;
  currency: string;
  currencyMinorUnits: number;
  payFrequency: "monthly";
  effectiveFrom: string;
  effectiveTo: string | null;
  components: CompensationComponent[];
  totals: Record<string, number>;
};

export type CompensationProfileData = {
  visibility: "hidden" | "current" | "history";
  asOf: string;
  currentAssignment: CompensationAssignment | null;
  history: CompensationAssignment[];
};

type Props = {
  data: CompensationProfileData | null;
  loading?: boolean;
  error?: string;
};

function formatMoney(value: number | undefined, assignment: CompensationAssignment) {
  const divisor = 10 ** assignment.currencyMinorUnits;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: assignment.currency,
    minimumFractionDigits: assignment.currencyMinorUnits,
    maximumFractionDigits: assignment.currencyMinorUnits,
  }).format(Number(value || 0) / divisor);
}

function formatDate(value: string | null) {
  if (!value) return "Present";
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00.000Z`));
}

function ComponentsTable({ assignment }: { assignment: CompensationAssignment }) {
  const headingBg = useColorModeValue("gray.50", "whiteAlpha.50");
  return (
    <TableContainer>
      <Table size="sm">
        <Thead bg={headingBg}>
          <Tr><Th>Component</Th><Th>Category</Th><Th isNumeric>Monthly</Th><Th isNumeric>Annual</Th></Tr>
        </Thead>
        <Tbody>
          {assignment.components.map((component) => (
            <Tr key={`${assignment.effectiveFrom}-${component.code}`}>
              <Td>
                <Text fontWeight="700">{component.name}</Text>
                <HStack spacing={2} mt={1}>
                  <Text fontSize="xs" color="gray.500">{component.code}</Text>
                  {component.overridden ? <Badge colorScheme="blue">Employee value</Badge> : null}
                </HStack>
              </Td>
              <Td textTransform="capitalize">{component.category.replace(/_/g, " ")}</Td>
              <Td isNumeric>{formatMoney(component.monthlyAmountMinor, assignment)}</Td>
              <Td isNumeric>{formatMoney(component.annualAmountMinor, assignment)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

export default function CompensationProfilePanel({ data, loading = false, error = "" }: Props) {
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  if (loading) {
    return <Stack spacing={4}><Skeleton h="110px" borderRadius="md" /><Skeleton h="260px" borderRadius="md" /></Stack>;
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md" alignItems="flex-start">
        <AlertIcon mt={1} />
        <Box>
          <Text fontWeight="800">Unable to load compensation</Text>
          <AlertDescription>{error}</AlertDescription>
        </Box>
      </Alert>
    );
  }

  if (!data || data.visibility === "hidden") {
    return (
      <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={6}>
        <Text fontWeight="800">Compensation details are hidden</Text>
        <Text mt={1} fontSize="sm" color={muted}>Your company has not enabled compensation visibility for employee profiles.</Text>
      </Box>
    );
  }

  const current = data.currentAssignment;

  if (!current) {
    return (
      <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={6}>
        <Text fontWeight="800">No current compensation assignment</Text>
        <Text mt={1} fontSize="sm" color={muted}>A published compensation package has not been assigned for the current date.</Text>
      </Box>
    );
  }

  return (
    <Stack spacing={5}>
      <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={{ base: 4, md: 6 }}>
        <Stack spacing={5}>
          <Box>
            <Text fontSize="lg" fontWeight="800">Current compensation</Text>
            <Text mt={1} fontSize="sm" color={muted}>
              {current.structureName} ({current.structureCode}) | Version {current.versionNumber} | Effective {formatDate(current.effectiveFrom)}
            </Text>
          </Box>
          <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={5}>
            <Box><Text fontSize="xs" color={muted}>Monthly gross</Text><Text fontWeight="800">{formatMoney(current.totals.monthlyGrossMinor, current)}</Text></Box>
            <Box><Text fontSize="xs" color={muted}>Monthly deductions</Text><Text fontWeight="800">{formatMoney(current.totals.monthlyDeductionsMinor, current)}</Text></Box>
            <Box><Text fontSize="xs" color={muted}>Monthly net</Text><Text fontWeight="800">{formatMoney(current.totals.monthlyNetMinor, current)}</Text></Box>
            <Box><Text fontSize="xs" color={muted}>Annual gross</Text><Text fontWeight="800">{formatMoney(current.totals.annualGrossMinor, current)}</Text></Box>
          </SimpleGrid>
          <ComponentsTable assignment={current} />
        </Stack>
      </Box>

      {data.visibility === "history" ? (
        <Box bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" p={{ base: 4, md: 6 }}>
          <Text fontSize="lg" fontWeight="800">Compensation history</Text>
          <Text mt={1} mb={4} fontSize="sm" color={muted}>Previous effective packages only. Future and cancelled assignments are excluded.</Text>
          {data.history.length ? (
            <Accordion allowMultiple>
              {data.history.map((assignment) => (
                <AccordionItem key={`${assignment.structureCode}-${assignment.versionNumber}-${assignment.effectiveFrom}`} borderColor={border}>
                  <AccordionButton px={0} py={4}>
                    <Box flex="1" textAlign="left">
                      <Text fontWeight="700">{assignment.structureName} | Version {assignment.versionNumber}</Text>
                      <Text fontSize="sm" color={muted}>{formatDate(assignment.effectiveFrom)} to {formatDate(assignment.effectiveTo)} | {formatMoney(assignment.totals.monthlyGrossMinor, assignment)} monthly gross</Text>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel px={0} pb={5}>
                    <ComponentsTable assignment={assignment} />
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          ) : <Text fontSize="sm" color={muted}>No previous compensation packages.</Text>}
        </Box>
      ) : null}
    </Stack>
  );
}
