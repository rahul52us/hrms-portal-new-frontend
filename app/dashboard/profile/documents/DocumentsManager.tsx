"use client";

import stores from "@/app/store/stores";
import { readFileAsBase64 } from "@/app/config/utils/utils";
import {
  Box,
  Button,
  Grid,
  Input,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

type EmployeeDocumentRow = {
  id: number;
  label: string;
  fileName?: string;
  fileUrl?: string;
  fileBuffer?: string;
  fileType?: string;
  isAdd?: boolean;
  effectiveFrom?: string;
  validTill?: string;
};

const documentTemplates: EmployeeDocumentRow[] = [
  { id: 1, label: "Increment letter" },
  { id: 2, label: "Qualification(Passing Certificate)" },
  { id: 3, label: "PAN Card" },
  { id: 4, label: "High School (10th ) Marksheet" },
  { id: 5, label: "Aadhaar card" },
  { id: 6, label: "Passport" },
  { id: 7, label: "Intermediate (12th ) Marksheet" },
  { id: 8, label: "Graduation Marksheet" },
  { id: 9, label: "Driving Licence" },
  { id: 10, label: "Appraisal Letter" },
];

const DocumentsManager = observer(() => {
  const toast = useToast();
  const user = stores.auth.user;
  const [documents, setDocuments] = useState<EmployeeDocumentRow[]>(documentTemplates);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?._id) return;
      try {
        const response = await stores.userStore.fetchUserDocuments(user._id);
        const backendDocs = Array.isArray(response?.data?.data?.documents)
          ? response.data.data.documents
          : [];
        if (!backendDocs.length) return;

        setDocuments(
          documentTemplates.map((template) => {
            const saved = backendDocs.find((item: any) => Number(item?.id) === template.id || item?.label === template.label);
            return {
              ...template,
              ...(saved || {}),
              fileName: saved?.file?.name || saved?.fileName || "",
              fileUrl: saved?.file?.url || saved?.fileUrl || "",
              fileType: saved?.file?.type || saved?.fileType || "",
              effectiveFrom: saved?.effectiveFrom || "",
              validTill: saved?.validTill || "",
            };
          })
        );
      } catch {
        setDocuments(documentTemplates);
      }
    };
    load();
  }, [user?._id]);

  const handleDocumentChange = (docId: number, field: keyof EmployeeDocumentRow, value: string) => {
    setDocuments((current) => current.map((doc) => (doc.id === docId ? { ...doc, [field]: value } : doc)));
  };

  const handleDocumentFileChange = async (docId: number, file?: File) => {
    if (!file) return;
    const buffer = await readFileAsBase64(file);
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              fileName: file.name,
              fileType: file.type,
              fileBuffer: buffer as unknown as string,
              fileUrl: URL.createObjectURL(file),
              isAdd: true,
            }
          : doc
      )
    );
  };

  const handleSave = async () => {
    if (!user?._id) return;
    setSaving(true);
    try {
      await stores.userStore.updateUserDocuments(user._id, {
        documents: documents.map((doc) => ({
          id: doc.id,
          label: doc.label,
          isAdd: doc.isAdd || false,
          file: doc.fileBuffer
            ? {
                file: doc.fileBuffer,
                filename: doc.fileName || `${doc.label}.pdf`,
                type: doc.fileType || "application/octet-stream",
              }
            : doc.fileUrl
              ? {
                  url: doc.fileUrl,
                  name: doc.fileName || `${doc.label}.pdf`,
                  type: doc.fileType || "application/octet-stream",
                }
              : undefined,
          effectiveFrom: doc.effectiveFrom || "",
          validTill: doc.validTill || "",
        })),
      });
      await stores.auth.fetchUser();
      toast({
        title: "Documents saved",
        status: "success",
        duration: 2500,
        position: "top-right",
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Unable to save documents",
        description: error?.message || "Please try again.",
        status: "error",
        duration: 3500,
        position: "top-right",
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const cardBg = useColorModeValue("white", "gray.800");
  const pageBg = useColorModeValue("gray.50", "gray.950");

  return (
    <Box bg={pageBg} minH="100vh" p={6}>
      <Box bg={cardBg} borderRadius="24px" p={6} boxShadow="lg">
        <Box mb={4}>
          <Text fontSize="24px" fontWeight="800">
            Documents
          </Text>
          <Text fontSize="13px" color="gray.500">
            Upload and manage your employee documents.
          </Text>
        </Box>
        <Button colorScheme="blue" mb={4} onClick={handleSave} isLoading={saving}>
          Save Documents
        </Button>
        <Box overflowX="auto">
          <Box minW="980px" borderWidth="1px" borderRadius="16px" overflow="hidden">
            <Grid templateColumns="70px 1.6fr 1.4fr 220px 220px" bg="gray.100" px={4} py={3} fontWeight="700">
              <Text>Sr.No.</Text>
              <Text>Documents</Text>
              <Text>Uploaded Files</Text>
              <Text>Effective From</Text>
              <Text>Valid Till</Text>
            </Grid>
            {documents.map((doc, index) => (
              <Grid key={doc.id} templateColumns="70px 1.6fr 1.4fr 220px 220px" px={4} py={3} borderTopWidth="1px" gap={3} alignItems="center">
                <Text>{index + 1}</Text>
                <Text fontWeight="600">{doc.label}</Text>
                <Box>
                  <Button as="label" size="sm" variant="outline" cursor="pointer" mb={2}>
                    {doc.fileName ? "Change File" : "Upload File"}
                    <input hidden type="file" onChange={(event) => handleDocumentFileChange(doc.id, event.target.files?.[0])} />
                  </Button>
                  <Text fontSize="13px" color={doc.fileName ? "orange.500" : "gray.500"} noOfLines={1}>
                    {doc.fileName || "file not uploaded."}
                  </Text>
                </Box>
                <Input type="date" size="sm" value={doc.effectiveFrom || ""} onChange={(e) => handleDocumentChange(doc.id, "effectiveFrom", e.target.value)} />
                <Input type="date" size="sm" value={doc.validTill || ""} onChange={(e) => handleDocumentChange(doc.id, "validTill", e.target.value)} />
              </Grid>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

export default DocumentsManager;
