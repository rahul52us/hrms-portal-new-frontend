"use client";

import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
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
  useColorModeValue,
} from "@chakra-ui/react";
import ReactSelect from "react-select";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  bulkForm: any;
  setBulkForm: any;
  isSuperadmin: boolean;
  managedCompanies: any[];
  filteredCompanies: any[];
  borderColor: string;
  tableHeadBg: string;
  muted: string;
  selectedBulkManagerLevels: number;
  uploadRoleOptions: Array<{
    value: string;
    label: string;
    description: string;
  }>;

  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;

  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;

  preview: any[];
  loading: boolean;

  onDownloadTemplate: () => void;
  onUpload: () => void;
};

const BulkUploadModal = ({
  isOpen,
  onClose,
  bulkForm,
  setBulkForm,
  isSuperadmin,
  filteredCompanies,
  borderColor,
  tableHeadBg,
  muted,
  selectedBulkManagerLevels,
  uploadRoleOptions,
  getRootProps,
  getInputProps,
  isDragActive,
  selectedFile,
  setSelectedFile,
  preview,
  loading,
  onDownloadTemplate,
  onUpload,
}: Props) => {
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: "12px",
      borderColor: "inherit",
      "&:hover": {
        borderColor: "inherit",
      },
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: "12px",
      zIndex: 9999,
    }),
  };

  const companyOptions = filteredCompanies.map((c: any) => ({
    label: c.company_name,
    value: c._id,
  }));

  const selectedOption = companyOptions.find(
    (opt) => opt.value === bulkForm.companyId
  );
  const selectedUploadOption = uploadRoleOptions.find(
    (opt) => opt.value === bulkForm.uploadRole
  );
  const parseManagerLevel = (role: string) => {
    const match = String(role || "").trim().toLowerCase().match(/^l(\d+)-manager$/);
    return match ? Number(match[1]) : null;
  };
  const managerLevel = parseManagerLevel(bulkForm.uploadRole);
  const expectedManagerLevels =
    bulkForm.uploadRole === "user"
      ? Array.from({ length: selectedBulkManagerLevels }, (_, index) => index + 1)
      : managerLevel
        ? Array.from(
            { length: Math.max(0, selectedBulkManagerLevels - managerLevel) },
            (_, index) => managerLevel + index + 1
          )
        : [];
  const expectedColumns = [
    "Employee Code",
    "Employee Name",
    "Phone Number",
    "Email ID (Optional)",
    bulkForm.uploadRole === "user" ? "Branch (Optional)" : "Branch",
    "City",
    "State",
    ...(bulkForm.uploadRole === "user" ? ["Designation", "Joining Date"] : []),
    ...expectedManagerLevels.map((level) => `L${level} Manager Phone Number (Name)`),
  ];
  const companyReady = Boolean(bulkForm.companyId);
  const getUniqueManagers = (managers: any[] = []) => {
    const seen = new Set<string>();
    return managers.filter((manager) => {
      const key = `${manager?.level || ""}:${String(manager?.managerEmail || "").trim().toLowerCase()}`;
      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay backdropFilter="blur(6px)" />

      <ModalContent borderRadius="2xl">
        <ModalHeader>Bulk Upload Employees</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack align="stretch" spacing={5}>
            {/* ================= COMPANY SELECTION ================= */}
            {isSuperadmin && (
              <Box
                borderWidth="1px"
                borderColor={borderColor}
                p={4}
                borderRadius="xl"
              >
                <FormControl isRequired>
                  <FormLabel fontWeight="bold">Select Company</FormLabel>
                  <ReactSelect
                    placeholder="Search and choose company..."
                    options={companyOptions}
                    value={selectedOption}
                    onChange={(opt: any) =>
                      setBulkForm((p: any) => ({
                        ...p,
                        companyId: opt?.value || "",
                        createCompany: false,
                      }))
                    }
                    styles={selectStyles}
                  />
                </FormControl>
              </Box>
            )}

            <Box
              borderWidth="1px"
              borderColor={borderColor}
              p={4}
              borderRadius="xl"
            >
              <FormControl isRequired>
                <FormLabel fontWeight="bold">Select Employee Type</FormLabel>
                <ReactSelect
                  placeholder="Select the employee level you want to create..."
                  options={uploadRoleOptions}
                  value={
                    selectedUploadOption
                      ? {
                          label: selectedUploadOption.label,
                          value: selectedUploadOption.value,
                        }
                      : null
                  }
                  onChange={(opt: any) =>
                    setBulkForm((prev: any) => ({
                      ...prev,
                      uploadRole: opt?.value || "",
                    }))
                  }
                  styles={selectStyles}
                />
              </FormControl>

              {selectedUploadOption && (
                <VStack align="start" spacing={1} mt={3}>
                  <Text fontSize="sm" fontWeight="semibold">
                    {selectedUploadOption.label}
                  </Text>
                  <Text fontSize="sm" color={muted}>
                    {selectedUploadOption.description}
                  </Text>
                  <Text fontSize="xs" color={muted}>
                    Expected columns: {expectedColumns.join(", ")}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onDownloadTemplate}
                    isDisabled={!companyReady || !bulkForm.uploadRole}
                  >
                    Download Dummy Template
                  </Button>
                </VStack>
              )}
            </Box>

            {/* ================= DROPZONE ================= */}            
            {companyReady && bulkForm.uploadRole ? (
              <Box
                {...getRootProps()}
                borderWidth="2px"
                borderStyle="dashed"
                borderColor={isDragActive ? "blue.400" : borderColor}
                borderRadius="2xl"
                p={8}
                textAlign="center"
                cursor="pointer"
                bg={isDragActive ? "blue.50" : "transparent"}
                _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }}
                transition="all 0.2s"
              >
                <input {...getInputProps()} />

                <Text fontWeight="bold">Drag & drop Excel file here</Text>

                <Text fontSize="sm" color={muted} mt={2}>
                  Upload `.xlsx` / `.xls` for <strong>{selectedUploadOption?.label || "the selected hierarchy level"}</strong>.
                </Text>

                {selectedFile && (
                  <Text mt={3} color="blue.500" fontSize="sm" fontWeight="semibold">
                    Selected: {selectedFile.name}
                  </Text>
                )}
              </Box>
            ) : (
              <Box
                borderWidth="1px"
                borderColor={borderColor}
                p={8}
                borderRadius="2xl"
                bg={useColorModeValue("gray.50", "whiteAlpha.50")}
                textAlign="center"
              >
                <Text color={muted} fontStyle="italic">
                  Please select a company and the employee type you want to create before uploading the Excel file.
                </Text>
              </Box>
            )}

            {/* ================= PREVIEW ================= */}
            {preview.length > 0 && (
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Preview ({preview.length} rows)
                </Text>

                <TableContainer
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="xl"
                  maxH="400px"
                  overflowY="auto"
                >
                  <Table size="sm">
                    <Thead bg={tableHeadBg}>
                      <Tr>
                        <Th>Row</Th>
                        <Th>Name</Th>
                        <Th>Phone Number</Th>
                        <Th>Email</Th>
                        <Th>Department</Th>
                        <Th>City</Th>
                        <Th>State</Th>
                        <Th>Role</Th>
                        <Th>Company Status</Th>
                        <Th>Managers</Th>
                        <Th>Action</Th>
                        <Th>Errors</Th>
                      </Tr>
                    </Thead>

                    <Tbody>
                      {loading ? (
                        <Tr>
                          <Td colSpan={12} textAlign="center" py={6}>
                            Loading preview...
                          </Td>
                        </Tr>
                      ) : (
                        preview.map((row: any) => (
                          <Tr key={row.rowNumber}>
                            <Td>{row.rowNumber}</Td>
                            <Td fontWeight="medium">{row.name}</Td>
                            <Td>{row.mobileNumber || "--"}</Td>
                            <Td>{row.email}</Td>
                            <Td>{row.department || "--"}</Td>
                            <Td>{row.city || "--"}</Td>
                            <Td>{row.state || "--"}</Td>
                            <Td>
                              <Badge variant="outline">{row.role}</Badge>
                            </Td>

                            <Td>
                              <Badge
                                colorScheme={
                                  row.companyStatus === "EXISTS"
                                    ? "green"
                                    : "purple"
                                }
                              >
                                {row.company}
                              </Badge>
                            </Td>

                            <Td>
                              <VStack align="start" spacing={0}>
                                {getUniqueManagers(row.managers || []).map((m: any) => (
                                  <Text key={`${m.level}-${m.managerEmail}`} fontSize="xs">
                                    L{m.level}: {m.managerEmail}
                                  </Text>
                                ))}
                              </VStack>
                            </Td>

                            <Td>
                              <Badge
                                colorScheme={
                                  row.action === "CREATE" ? "blue" : "red"
                                }
                              >
                                {row.action}
                              </Badge>
                            </Td>

                            <Td>
                              {row.errors?.length > 0 ? (
                                <Text color="red.500" fontSize="xs">
                                  {row.errors.join(", ")}
                                </Text>
                              ) : (
                                <Text fontSize="xs" color={muted}>
                                  Ready
                                </Text>
                              )}
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onClose();
              setSelectedFile(null);
            }}
          >
            Cancel
          </Button>

          <Button
            colorScheme="purple"
            onClick={onUpload}
            isLoading={loading}
            isDisabled={!selectedFile || !companyReady || !bulkForm.uploadRole}
            ml={3}
          >
            Upload Employees
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BulkUploadModal;
