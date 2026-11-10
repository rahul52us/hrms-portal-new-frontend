"use client";

import stores from "@/app/store/stores";
import { readFileAsBase64 } from "@/app/config/utils/utils";
import DocumentDownloadButton from "@/app/component/common/DocumentDownloadButton";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
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
  const hydrate = (rows: any[]) => documentTemplates.map((template) => {
    const saved = rows.find((item: any) => Number(item?.id) === template.id || item?.label === template.label);
    return { ...template, ...(saved || {}), fileName: saved?.file?.name || saved?.fileName || "", fileUrl: saved?.file?.url || saved?.fileUrl || "", fileType: saved?.file?.type || saved?.fileType || "", effectiveFrom: saved?.effectiveFrom || "", validTill: saved?.validTill || "", isAdd: false, fileBuffer: undefined };
  });

  useEffect(() => {
    const load = async () => {
      if (!user?._id) return;
      try {
        const response = await stores.userStore.fetchUserDocuments(user._id);
        const backendDocs = Array.isArray(response?.data?.data?.documents)
          ? response.data.data.documents
          : [];
        if (!backendDocs.length) return;

        setDocuments(hydrate(backendDocs));
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
    if (file.size > 5 * 1024 * 1024 || !["application/pdf", "image/png", "image/jpeg"].includes(file.type)) { toast({ title: "Choose a PDF, JPG or PNG, up to 5 MB", status: "warning" }); return; }
    const buffer = await readFileAsBase64(file);
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              fileName: file.name,
              fileType: file.type,
              fileBuffer: buffer as unknown as string,
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
      const saved = await stores.userStore.updateUserDocuments(user._id, {
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
      setDocuments(hydrate(saved.data.data.documents || []));
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
    <Box bg={pageBg} minH="100vh" minW={0} p={{ base: 3, md: 6 }}>
      <Box bg={cardBg} borderRadius="md" minW={0} p={{ base: 3, md: 6 }} borderWidth="1px">
        <Flex mb={5} justify="space-between" align="center" wrap="wrap" gap={3}>
          <Text fontSize="24px" fontWeight="800">
            Documents
          </Text>
        <Button colorScheme="blue" onClick={handleSave} isLoading={saving}>
          Save Documents
        </Button>
        </Flex>
        <Box minW={0}>
          <Box minW={0}>
            <Grid display={{ base: "none", lg: "grid" }} templateColumns="48px minmax(160px,1.3fr) minmax(180px,1.5fr) minmax(140px,1fr) minmax(140px,1fr)" gap={3} bg={pageBg} px={3} py={3} fontSize="sm" fontWeight="600">
              <Text>Sr.No.</Text>
              <Text>Documents</Text>
              <Text>Uploaded Files</Text>
              <Text>Effective From</Text>
              <Text>Valid Till</Text>
            </Grid>
            {documents.map((doc, index) => (
              <Grid key={doc.id} templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))", lg: "48px minmax(160px,1.3fr) minmax(180px,1.5fr) minmax(140px,1fr) minmax(140px,1fr)" }} px={{ base: 0, lg: 3 }} py={4} borderTopWidth="1px" gap={3} alignItems="start" minW={0}>
                <Text display={{ base: "none", lg: "block" }}>{index + 1}</Text>
                <Text gridColumn={{ base: "1 / -1", lg: "auto" }} fontWeight="600" overflowWrap="anywhere">{doc.label}</Text>
                <Box gridColumn={{ base: "1 / -1", lg: "auto" }} minW={0}>
                  <Button as="label" size="sm" variant="outline" cursor="pointer" mb={2}>
                    {doc.fileName ? "Change File" : "Upload File"}
                    <input hidden type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => handleDocumentFileChange(doc.id, event.target.files?.[0])} />
                  </Button>
                  <Text fontSize="13px" color={doc.fileName ? undefined : "gray.500"} overflowWrap="anywhere">
                    {doc.fileName || "file not uploaded."}
                  </Text>
                  {doc.fileUrl && !doc.isAdd ? <DocumentDownloadButton url={doc.fileUrl} name={doc.fileName || "Document"} size="xs" variant="link" mt={1}>Download</DocumentDownloadButton> : null}
                </Box>
                <FormControl minW={0}><FormLabel htmlFor={`document-${doc.id}-effective`} display={{ base: "block", lg: "none" }} fontSize="xs">Effective from</FormLabel><Input id={`document-${doc.id}-effective`} aria-label={`${doc.label} effective from`} type="date" size="sm" minW={0} value={doc.effectiveFrom || ""} onChange={(e) => handleDocumentChange(doc.id, "effectiveFrom", e.target.value)} /></FormControl>
                <FormControl minW={0}><FormLabel htmlFor={`document-${doc.id}-expiry`} display={{ base: "block", lg: "none" }} fontSize="xs">Valid till</FormLabel><Input id={`document-${doc.id}-expiry`} aria-label={`${doc.label} valid till`} type="date" size="sm" minW={0} value={doc.validTill || ""} onChange={(e) => handleDocumentChange(doc.id, "validTill", e.target.value)} /></FormControl>
              </Grid>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

export default DocumentsManager;
