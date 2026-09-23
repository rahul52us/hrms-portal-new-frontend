"use client";

import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  applyAttendanceImport,
  AttendanceImportPreview,
  downloadAttendanceImportTemplate,
  previewAttendanceImport,
} from "./attendanceAdminApi";

function importKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `attendance-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AttendanceImportDrawer({
  isOpen,
  onClose,
  onApplied,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApplied: () => void;
}) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<AttendanceImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(importKey);

  useEffect(() => {
    if (!isOpen) return;
    setFile(null);
    setPreview(null);
    setIdempotencyKey(importKey());
  }, [isOpen]);

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      await downloadAttendanceImportTemplate();
    } catch (error: any) {
      toast({
        title: "Unable to download template",
        description: getApiErrorMessage(error?.response?.data || error, "Template download failed"),
        status: "error",
      });
    } finally {
      setDownloading(false);
    }
  };

  const runPreview = async () => {
    if (!file) return;
    setLoading(true);
    try {
      setPreview(await previewAttendanceImport(file));
    } catch (error: any) {
      setPreview(null);
      toast({
        title: "Unable to preview import",
        description: getApiErrorMessage(error?.response?.data || error, "Import validation failed"),
        status: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!file || !preview || preview.invalidRows) return;
    setApplying(true);
    try {
      const response = await applyAttendanceImport(file, idempotencyKey);
      const result = response.data || {};
      toast({
        title: `${result.appliedRows || 0} attendance row(s) imported`,
        description: result.failedRows ? `${result.failedRows} row(s) failed during apply.` : undefined,
        status: result.failedRows ? "warning" : "success",
        duration: 5000,
      });
      onApplied();
      if (!result.failedRows) onClose();
    } catch (error: any) {
      toast({
        title: "Attendance import failed",
        description: getApiErrorMessage(error?.response?.data || error, "Could not apply attendance import"),
        status: "error",
        duration: 5000,
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      titlePrefix="Import attendance"
      titleSuffix="CSV or XLSX"
      subtitle="Preview first, then apply verified rows"
      maxW={{ base: "100%", lg: "760px" }}
      footerContent={
        <HStack justify="flex-end" w="100%">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button
            colorScheme="blue"
            onClick={apply}
            isLoading={applying}
            isDisabled={!preview || preview.invalidRows > 0 || preview.validRows === 0}
          >
            Apply import
          </Button>
        </HStack>
      }
    >
      <Stack spacing={5}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            Employee code, attendance date, and reason are required. A file can contain up to 5,000 rows.
          </AlertDescription>
        </Alert>

        <Button variant="outline" alignSelf="flex-start" onClick={downloadTemplate} isLoading={downloading}>
          Download import template
        </Button>

        <FormControl>
          <FormLabel>Attendance file</FormLabel>
          <Input
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            p={1}
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setPreview(null);
              setIdempotencyKey(importKey());
            }}
          />
          <FormHelperText>Maximum file size: 5 MB.</FormHelperText>
        </FormControl>
        <Button colorScheme="blue" variant="outline" onClick={runPreview} isLoading={loading} isDisabled={!file}>
          Validate and preview
        </Button>

        {preview ? (
          <Stack spacing={4}>
            <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
              {[
                ["Rows", preview.totalRows],
                ["Ready", preview.validRows],
                ["Needs correction", preview.invalidRows],
              ].map(([label, value]) => (
                <Box key={String(label)} borderWidth="1px" borderRadius="md" p={3}>
                  <Text fontSize="xs" color="gray.500">{label}</Text>
                  <Text fontSize="xl" fontWeight="800">{value}</Text>
                </Box>
              ))}
            </SimpleGrid>

            {preview.invalidRows ? (
              <Alert status="error" borderRadius="md" alignItems="flex-start">
                <AlertIcon mt={1} />
                <Box>
                  <AlertDescription fontWeight="700">Correct these rows and upload the file again.</AlertDescription>
                  <Stack spacing={2} mt={3} maxH="300px" overflowY="auto">
                    {preview.errors.map((item) => (
                      <Box key={`${item.rowNumber}-${item.employeeCode}`}>
                        <Text fontSize="sm" fontWeight="700">
                          Row {item.rowNumber}{item.employeeCode ? ` | ${item.employeeCode}` : ""}{item.attendanceDate ? ` | ${item.attendanceDate}` : ""}
                        </Text>
                        <Text fontSize="sm">{item.errors.join("; ")}</Text>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Alert>
            ) : (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <AlertDescription>All rows passed validation and are ready to import.</AlertDescription>
              </Alert>
            )}
          </Stack>
        ) : null}
      </Stack>
    </DashboardDrawer>
  );
}
