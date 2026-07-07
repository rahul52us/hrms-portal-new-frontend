"use client";

import {
  Badge,
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
} from "@chakra-ui/react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  results: any;
  borderColor: string;
  tableHeadBg: string;
  muted: string;
};

const BulkUploadResultModal = ({
  isOpen,
  onClose,
  results,
  borderColor,
  tableHeadBg,
  muted,
}: Props) => {
  if (!results) return null;

  const { totalRows, createdCount, failedCount, results: items = [] } = results;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(6px)" />
      <ModalContent borderRadius="2xl">
        <ModalHeader>Upload Results</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={6}>
            <StatGroup
              borderWidth="1px"
              borderColor={borderColor}
              p={4}
              borderRadius="xl"
              bg="gray.50"
              _dark={{ bg: "whiteAlpha.50" }}
            >
              <Stat>
                <StatLabel>Total Rows</StatLabel>
                <StatNumber>{totalRows}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="green.500">Created</StatLabel>
                <StatNumber color="green.500">{createdCount}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="red.500">Skipped/Failed</StatLabel>
                <StatNumber color="red.500">{failedCount}</StatNumber>
              </Stat>
            </StatGroup>

            <Box>
              <Heading size="sm" mb={4}>
                Detail List
              </Heading>
              <TableContainer
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="xl"
              >
                <Table size="sm">
                  <Thead bg={tableHeadBg}>
                    <Tr>
                      <Th>Row</Th>
                      <Th>Phone Number</Th>
                      <Th>Email</Th>
                      <Th>Status</Th>
                      <Th>Message</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {items.map((item: any, index: number) => (
                      <Tr key={index}>
                        <Td>{item.rowNumber}</Td>
                        <Td fontWeight="medium">{item.mobileNumber || "--"}</Td>
                        <Td>{item.email || "--"}</Td>
                        <Td>
                          <Badge
                            colorScheme={item.success ? "green" : "red"}
                            variant="subtle"
                          >
                            {item.success ? "CREATED" : item.action === "SKIP" ? "ALREADY EXISTS" : "FAILED"}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="xs" color={item.success ? "gray.500" : "red.500"}>
                            {item.success ? "User created successfully" : item.error}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BulkUploadResultModal;
