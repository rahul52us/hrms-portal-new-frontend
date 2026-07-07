"use client";

import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Heading,
  Icon,
  Input,
  Spinner,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { FiBriefcase, FiSettings } from "react-icons/fi";
import PermissionGate from "../../component/common/PermissionGate";
import { getApiErrorMessage } from "../../config/utils/apiError";
import { PERMISSION_KEYS, hasPermission } from "../../config/utils/permissions";
import { readFileAsBase64 } from "../../config/utils/utils";
import stores from "../../store/stores";
import CompanyForm from "../admins/component/CompanyForm";

const isRealFile = (value: unknown): value is File => typeof File !== "undefined" && value instanceof File;

const SectionCard = ({ title, icon, children, color }: any) => {
  const bg = useColorModeValue("white", "gray.800");

  const colorMap: any = {
    blue: { icon: "blue.500", text: "blue.600", bg: "blue.50" },
    green: { icon: "green.500", text: "green.600", bg: "green.50" },
    purple: { icon: "purple.500", text: "purple.600", bg: "purple.50" },
    orange: { icon: "orange.500", text: "orange.600", bg: "orange.50" },
    pink: { icon: "pink.500", text: "pink.600", bg: "pink.50" },
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <Box
      p={5}
      borderRadius="xl"
      bg={bg}
      boxShadow="md"
      border="1px solid"
      borderColor={useColorModeValue("gray.200", "gray.700")}
    >
      <HStack align="center" mb={4} spacing={3}>
        <Box p={2} borderRadius="md" bg={theme.bg}>
          <Icon as={icon} color={theme.icon} />
        </Box>
        <Text fontSize="lg" fontWeight="bold" color={theme.text}>
          {title}
        </Text>
      </HStack>
      {children}
    </Box>
  );
};

const CompanySettingsPage = observer(() => {
  const toast = useToast();
  const { auth, companyStore, userStore } = stores;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDept, setNewDept] = useState("");

  const canAccess = hasPermission(auth.user, PERMISSION_KEYS.COMPANY_SETTINGS);
  const canEdit = canAccess; // Only admin can access, and they can edit

  const muted = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const sectionBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (canAccess) {
      loadSettings();
    }
  }, [canAccess]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await userStore.getAdminCompanySettings();
      if (response?.data) {
        setCompany(response.data);
        setDepartments(response.data.departments || []);
      }
    } catch (err: any) {
      toast({
        title: "Error loading settings",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    if (!canEdit) {
      toast({
        title: "Permission required",
        description: "You don't have permission to edit company settings.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }

    setSaving(true);
    try {
      // Strip _id to prevent MongoDB immutable field modification error
      const { _id, logo, ...cleanValues } = values;

      const existingLogoUrl = company?.logo?.url || "";
      const nextLogo = values?.logo || {};
      const nextFile = nextLogo?.file;
      const removedExistingLogo = !nextFile && !nextLogo?.url && Boolean(existingLogoUrl);
      const shouldReplaceLogo = isRealFile(nextFile);

      const companyDetails: any = {
        ...cleanValues,
        departments,
        deletedFiles: removedExistingLogo && existingLogoUrl ? [existingLogoUrl] : [],
        isLogoEdit: shouldReplaceLogo,
      };

      if (shouldReplaceLogo) {
        const buffer = await readFileAsBase64(nextFile);
        companyDetails.logo = {
          buffer,
          filename: nextFile.name,
          type: nextFile.type,
        };
      } else if (removedExistingLogo) {
        companyDetails.logo = null;
      }

      // Wrap in companyDetails as expected by the updateOrganisationCompany backend endpoint
      await companyStore.updateManagedCompany(company?._id || auth.company, {
        companyDetails,
      });
      toast({
        title: "Company settings saved",
        description: "Your company profile has been updated successfully.",
        status: "success",
        duration: 3500,
        isClosable: true,
        position: "top-right",
      });
      loadSettings();
    } catch (err: any) {
      toast({
        title: "Unable to save settings",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setSaving(false);
    }
  };

  const addDepartment = () => {
    const trimmed = newDept.trim();
    if (!trimmed || departments.includes(trimmed)) return;
    setDepartments((prev) => [...prev, trimmed]);
    setNewDept("");
  };

  const removeDepartment = (dept: string) => {
    setDepartments((prev) => prev.filter((d) => d !== dept));
  };

  if (!canAccess) {
    return (
      <Box p={8}>
        <Alert status="error" borderRadius="2xl">
          <AlertIcon />
          You do not have access to company settings.
        </Alert>
      </Box>
    );
  }

  return (
    <PermissionGate
      allowed={canAccess}
      title="Company Settings unavailable"
      description="Only company administrators can view and edit company settings."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100vh" p={{ base: 4, md: 6 }}>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <HStack spacing={4}>
            <Box
              p={3}
              borderRadius="2xl"
              bgGradient="linear(to-br, blue.500, purple.600)"
            >
              <Icon as={FiSettings} boxSize={6} color="white" />
            </Box>
            <VStack align="start" spacing={0}>
              <Heading size="lg" fontWeight="bold">
                Company Settings
              </Heading>
              <Text fontSize="sm" color={muted}>
                Manage your company profile, branding, and organization details
              </Text>
            </VStack>
          </HStack>

          {loading ? (
            <Box
              bg={cardBg}
              p={10}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              textAlign="center"
            >
              <Spinner size="lg" color="blue.500" />
              <Text mt={4} color={muted}>
                Loading company settings...
              </Text>
            </Box>
          ) : (
            <Box bg={cardBg} p={6} borderRadius="2xl" borderWidth="1px" borderColor={borderColor}>
                <CompanyForm
                  initialValues={company}
                  onSubmit={handleSave}
                  isLoading={saving}
                  submitLabel="Save Company Settings"
                  onClose={() => {}}
                >
                  <SectionCard title="Departments" icon={FiBriefcase} color="green">
                    <VStack align="stretch" spacing={4}>
                      {canEdit && (
                        <HStack>
                          <Input
                            value={newDept}
                            onChange={(e) => setNewDept(e.target.value)}
                            placeholder="Add a department (e.g. Engineering)"
                            borderRadius="xl"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addDepartment();
                              }
                            }}
                          />
                          <Button
                            onClick={addDepartment}
                            colorScheme="blue"
                            borderRadius="xl"
                            isDisabled={!newDept.trim()}
                          >
                            Add
                          </Button>
                        </HStack>
                      )}

                      <Box bg={sectionBg} p={4} borderRadius="xl" minH="60px">
                        {departments.length === 0 ? (
                          <Text fontSize="sm" color={muted} fontStyle="italic">
                            No departments yet. Add one above.
                          </Text>
                        ) : (
                          <HStack flexWrap="wrap" spacing={2}>
                            {departments.map((dept) => (
                              <Tag
                                key={dept}
                                size="md"
                                colorScheme="blue"
                                borderRadius="full"
                                variant="subtle"
                              >
                                <TagLabel>{dept}</TagLabel>
                                {canEdit && (
                                  <TagCloseButton onClick={() => removeDepartment(dept)} />
                                )}
                              </Tag>
                            ))}
                          </HStack>
                        )}
                      </Box>
                    </VStack>
                  </SectionCard>
                </CompanyForm>
            </Box>
          )}
        </VStack>
      </Box>
    </PermissionGate>
  );
});

export default CompanySettingsPage;
