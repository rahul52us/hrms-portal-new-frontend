"use client";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  VStack,
  Text,
  Flex,
  useColorModeValue,
  HStack,
  Stack,
  Divider,
  Input,
  useToast,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  MenuItem
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import stores from "../../../../store/stores";
import { Folder, Upload, FileText, Download, Trash2, ChevronDown } from "lucide-react";
import CustomInput from "../../../../component/config/component/customInput/CustomInput";

type Props = {
  userId: string;
};

const DocumentsForm = observer(({ userId }: Props) => {
  const { companyStore, userStore } = stores;
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedType, setSelectedType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const cardBorder = useColorModeValue("gray.400", "whiteAlpha.100");
  const headerGradient = useColorModeValue("linear(to-r, blue.600, purple.600)", "linear(to-r, blue.300, purple.300)");
  const sectionTitleColor = useColorModeValue("blue.600", "blue.300");
  const tableBg = useColorModeValue("white", "whiteAlpha.50");
  const labelColor = useColorModeValue("gray.800", "gray.300");

  useEffect(() => {
    loadMasterData();
    if (userId) {
      loadDocuments();
    }
  }, [userId]);

  const loadMasterData = async () => {
    try {
      const companyId = companyStore.getActiveCompanyId();
      if (!companyId) return;
      const res = await companyStore.getMasterData({ company: companyId });
      const md = res?.data?.data;
      if (md?.documentTypes) {
        setDocumentTypes(md.documentTypes);
      }
    } catch (e) {}
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await userStore.fetchUserDocuments(userId);
      if (res?.data?.data?.documents) {
        setExistingDocuments(res.data.data.documents);
      } else {
        setExistingDocuments([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleUpload = async () => {
    if (!selectedType || !selectedFile) {
      toast({ title: "Please select a type and a file", status: "warning" });
      return;
    }

    setUploading(true);
    try {
      const base64 = await toBase64(selectedFile);
      
      const newDoc = {
        isAdd: true,
        title: selectedType,
        file: {
          file: base64,
          filename: selectedFile.name,
          type: selectedFile.type
        }
      };

      const payload = {
        documents: [...existingDocuments.map(d => ({ ...d, isAdd: false })), newDoc]
      };

      await userStore.updateUserDocuments(userId, payload);
      toast({ title: "Document uploaded successfully", status: "success" });
      
      setSelectedFile(null);
      setSelectedType("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      loadDocuments();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message || "Something went wrong", status: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (index: number) => {
    const updated = [...existingDocuments];
    updated.splice(index, 1);
    
    setUploading(true);
    try {
      const payload = {
        documents: updated.map(d => ({ ...d, isAdd: false }))
      };
      await userStore.updateUserDocuments(userId, payload);
      toast({ title: "Document deleted", status: "success" });
      loadDocuments();
    } catch (error: any) {
      toast({ title: "Deletion failed", status: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <VStack spacing={{ base: 5, md: 8 }} align="stretch">
        {/* Header */}
        <HStack spacing={4} align="center">
          <Box display="inline-flex" p={2.5} borderRadius="lg" bg={useColorModeValue("blue.50", "blue.900/30")} color={sectionTitleColor} boxShadow="sm">
            <Folder size={20} />
          </Box>
          <Box>
            <Text fontSize="lg" fontWeight="800" bgGradient={headerGradient} bgClip="text" letterSpacing="tight">
              Documents
            </Text>
            <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")} fontWeight="600" mt={0.5}>
              Manage and upload employee documents.
            </Text>
          </Box>
        </HStack>

        <Box 
          p={{ base: 0, sm: 4, md: 8 }} 
          borderWidth={{ base: "0", md: "1px" }} 
          borderColor={cardBorder} 
          borderRadius={{ base: "none", md: "3xl" }}
          bg={{ base: "transparent", md: useColorModeValue("white", "whiteAlpha.50") }}
          boxShadow={{ base: "none", md: useColorModeValue("0 4px 20px rgba(0,0,0,0.03)", "0 4px 20px rgba(0,0,0,0.2)") }}
        >
          <VStack spacing={6} align="stretch">
            {/* Upload Section */}
            <Box p={{ base: 4, md: 6 }} borderRadius="2xl" bg={useColorModeValue("gray.50", "whiteAlpha.100")} borderWidth="1px" borderColor={cardBorder} position="relative" overflow="hidden">
              <Box position="absolute" top="-20px" right="-20px" w="100px" h="100px" bg="blue.200" filter="blur(50px)" opacity={0.4} borderRadius="full" zIndex={0} pointerEvents="none" />
              
              <VStack spacing={5} align="stretch" position="relative" zIndex={1}>
                <Text fontSize="md" fontWeight="800" color={sectionTitleColor} textTransform="uppercase" letterSpacing="widest">Upload New Document</Text>
                
                <Stack direction="column" spacing={6} align="stretch" w="full">
                  <Box>
                    <CustomInput
                      type="select"
                      label="DOCUMENT TYPE"
                      name="documentType"
                      placeholder="Select document type"
                      parentStyle={{ width: "100%" }}
                      value={selectedType ? { label: selectedType, value: selectedType } : null}
                      options={documentTypes.map(t => ({ label: t, value: t }))}
                      onChange={(selectedOption: any) => setSelectedType(selectedOption?.value || "")}
                    />
                  </Box>
                  
                  <Box>
                    <FormLabel fontSize="xs" fontWeight="700" color={useColorModeValue("gray.600", "gray.400")}>FILE SELECTION</FormLabel>
                    {selectedFile ? (
                      <Flex 
                        align="center" 
                        justify="space-between" 
                        p={4} 
                        borderWidth="1px" 
                        borderColor="blue.400" 
                        borderRadius="xl"
                        bg={useColorModeValue("blue.50", "blue.900/30")}
                      >
                        <HStack spacing={3}>
                          <Box p={2} bg="white" borderRadius="md" boxShadow="sm">
                            <FileText size={20} color="#3182ce" />
                          </Box>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="700" color={useColorModeValue("gray.800", "white")} isTruncated maxW="200px">
                              {selectedFile.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500" fontWeight="600">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </Text>
                          </VStack>
                        </HStack>
                        <Button 
                          size="sm" 
                          colorScheme="red" 
                          variant="ghost" 
                          onClick={() => setSelectedFile(null)}
                          px={2}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </Flex>
                    ) : (
                      <CustomInput
                        type="file-drag"
                        name="documentFile"
                        parentStyle={{ width: "100%" }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e: any) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    )}
                  </Box>
                </Stack>

                <Flex w="full" justify={{ base: "center", md: "flex-end" }} pt={2}>
                  <Button 
                    w={{ base: "full", md: "auto" }}
                    leftIcon={<Upload size={16} />}
                    colorScheme="blue" 
                    onClick={handleUpload}
                    isLoading={uploading}
                    isDisabled={!selectedType || !selectedFile}
                    borderRadius="full"
                    px={8}
                    boxShadow="0 4px 14px 0 rgba(0, 118, 255, 0.39)"
                    _hover={{ transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0, 118, 255, 0.23)" }}
                    transition="all 0.2s"
                  >
                    Upload Document
                  </Button>
                </Flex>
              </VStack>
            </Box>

            <Divider borderColor={cardBorder} />

            {/* List Section */}
            <Box>
              <Text fontSize="sm" fontWeight="700" color={sectionTitleColor} mb={4}>Uploaded Documents</Text>
              
              {loading ? (
                <Flex justify="center" p={{ base: 4, md: 8 }}><Spinner size="xl" color="blue.500" /></Flex>
              ) : existingDocuments.length === 0 ? (
                <Flex justify="center" p={{ base: 4, md: 8 }} bg={tableBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} borderStyle="dashed">
                  <Text color="gray.500" fontSize="sm" fontWeight="600">No documents found.</Text>
                </Flex>
              ) : (
                <Box overflowX="auto" borderRadius={{ base: "md", md: "xl" }} borderWidth="1px" borderColor={cardBorder} w="100%">
                  <Table variant="simple" bg={tableBg} size={{ base: "sm", md: "md" }}>
                    <Thead bg={useColorModeValue("gray.50", "whiteAlpha.50")}>
                      <Tr>
                        <Th px={{ base: 2, md: 4 }} whiteSpace="nowrap">Type / Title</Th>
                        <Th px={{ base: 2, md: 4 }} whiteSpace="nowrap">File Name</Th>
                        <Th px={{ base: 2, md: 4 }} textAlign="right" whiteSpace="nowrap">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {existingDocuments.map((doc, idx) => (
                        <Tr key={idx}>
                          <Td fontWeight="600" fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 4 }}>{doc.title || doc.documentType || "Document"}</Td>
                          <Td px={{ base: 2, md: 4 }}>
                            <HStack>
                              <FileText size={16} color="gray" />
                              <Text fontSize={{ base: "xs", md: "sm" }} isTruncated maxW={{ base: "100px", md: "200px" }}>
                                {doc.file?.name || "File"}
                              </Text>
                            </HStack>
                          </Td>
                          <Td textAlign="right" px={{ base: 2, md: 4 }}>
                            <HStack justify="flex-end" spacing={1}>
                              {doc.file?.url && (
                                <Button 
                                  as="a" 
                                  href={doc.file.url} 
                                  target="_blank"
                                  size="sm" 
                                  variant="ghost" 
                                  colorScheme="blue"
                                >
                                  <Download size={16} />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                colorScheme="red"
                                onClick={() => handleDelete(idx)}
                                isDisabled={uploading}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>

          </VStack>
        </Box>
      </VStack>
    </Box>
  );
});

export default DocumentsForm;
