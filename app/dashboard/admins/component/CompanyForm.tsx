"use client";

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  Grid,
  GridItem,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Formik, Form as FormikForm, getIn } from "formik";
import {
  Building2,
  Globe,
  MapPin,
  Palette,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as Yup from "yup";

import BrandColorField from "../../../component/common/BrandColorField/BrandColorField";
import CustomInput from "../../../component/config/component/customInput/CustomInput";
import { getApiErrorMessage } from "../../../config/utils/apiError";
import { SITE_URL } from "../../../config/utils/variables";
import { DEFAULT_LEARNER_PRIMARY_COLOR, normalizeHexColor } from "../../../theme/theme";

/* ================= SECTION CARD ================= */
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
      borderColor="gray.200"
    >
      <Flex align="center" mb={4} gap={2}>
        <Box p={2} borderRadius="md" bg={theme.bg}>
          <Icon as={icon} color={theme.icon} />
        </Box>
        <Text fontSize="lg" fontWeight="bold" color={theme.text}>
          {title}
        </Text>
      </Flex>
      {children}
    </Box>
  );
};

/* ================= UTILS ================= */
const slugifyTenant = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const buildTenantPreview = (slug: string, customDomain?: string) => {
  if (customDomain?.trim()) {
    const normalized = customDomain.trim().replace(/^https?:\/\//, "");
    return `https://${normalized}`;
  }

  const siteUrl = SITE_URL || "http://localhost:3000";

  try {
    const parsed = new URL(siteUrl);
    return `${parsed.protocol}//${slug}.${parsed.hostname}`;
  } catch {
    return slug ? `https://${slug}.localhost` : "";
  }
};

const getContrastTextColor = (hexColor?: string) => {
  const normalizedColor = normalizeHexColor(hexColor, DEFAULT_LEARNER_PRIMARY_COLOR).replace("#", "");
  const red = Number.parseInt(normalizedColor.slice(0, 2), 16);
  const green = Number.parseInt(normalizedColor.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedColor.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance >= 150 ? "gray.900" : "white";
};

/* ================= INITIAL ================= */
export const companyInitialValues = {
  _id: "",
  company_name: "",
  companyCode: "",
  companyType: "company",
  tenantSlug: "",
  customDomain: "",
  companyEmail: "",
  managerLevels: 0,
  mobileNo: "",
  workNo: "",
  webLink: "",
  bio: "",
  primaryThemeColor: DEFAULT_LEARNER_PRIMARY_COLOR,
  verified_email_allowed: false,
  logo: { file: null },
  addressInfo: [
    {
      address: "",
      city: "",
      state: "",
      country: "",
      pinCode: "",
    },
  ],
};

const createCompanyFormValues = (company?: any) => ({
  ...companyInitialValues,
  ...company,
  _id: company?._id || "",
  company_name: company?.company_name || "",
  companyCode: company?.companyCode || "",
  companyType: company?.companyType || "company",
  tenantSlug: company?.tenantSlug || "",
  customDomain: company?.customDomain || "",
  companyEmail: company?.companyEmail || "",
  managerLevels: company?.managerLevels ?? 0,
  mobileNo: company?.mobileNo || "",
  workNo: company?.workNo || "",
  webLink: company?.webLink || "",
  bio: company?.bio || "",
  primaryThemeColor: normalizeHexColor(
    company?.primaryThemeColor,
    DEFAULT_LEARNER_PRIMARY_COLOR
  ),
  verified_email_allowed: Boolean(company?.verified_email_allowed),
  logo: company?.logo
    ? { ...company.logo, file: null }
    : { file: null },
  addressInfo:
    company?.addressInfo?.length
      ? company.addressInfo.map((address: any) => ({
          address: address?.address || "",
          city: address?.city || "",
          state: address?.state || "",
          country: address?.country || "",
          pinCode: address?.pinCode || "",
        }))
      : companyInitialValues.addressInfo,
});

/* ================= FORM ================= */
const CompanyForm = ({
  onSubmit,
  onClose,
  isLoading,
  initialValues,
  submitLabel = "Create Company",
  children,
  simpleCreate = false,
}: any) => {
  const [preview, setPreview] = useState<string | null>(null);
  const toast = useToast();

  /* ✅ SAFE PREVIEW */
  const handlePreview = (file: any) => {
    if (file && file instanceof File) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  };

  const validationSchema = Yup.object({
    company_name: Yup.string()
      .trim()
      .min(2, "Company name should be at least 2 characters")
      .required("Company name is required"),
    companyCode: Yup.string().trim().min(2, "Company code should be at least 2 characters").required("Company code is required"),
    tenantSlug: Yup.string()
      .trim()
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only")
      .required("Tenant slug is required"),
    customDomain: Yup.string()
      .trim()
      .test(
        "custom-domain",
        "Enter a valid custom domain",
        (value) =>
          !value ||
          /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(value)
      ),
    companyEmail: Yup.string()
      .trim()
      .email("Enter a valid company email address")
      .required("Company email is required"),
    managerLevels: simpleCreate
      ? Yup.number().optional()
      : Yup.number()
          .typeError("Manager levels must be a number")
          .integer("Manager levels must be a whole number")
          .min(0, "Manager levels cannot be negative")
          .max(20, "Manager levels must be 20 or less")
          .required("Manager levels are required"),
    mobileNo: Yup.string()
      .trim()
      .matches(/^[0-9+()\-\s]{7,20}$/, "Enter a valid primary phone number")
      .required("Primary phone number is required"),
    webLink: Yup.string()
      .trim()
      .test(
        "website-url",
        "Enter a valid website URL",
        (value) => !value || Yup.string().url().isValidSync(value)
      ),
    bio: simpleCreate
      ? Yup.string().trim().optional()
      : Yup.string()
          .trim()
          .min(10, "Company description should be at least 10 characters")
          .required("Company description is required"),
    primaryThemeColor: Yup.string()
      .matches(/^#(?:[0-9A-Fa-f]{3}){1,2}$/, "Enter a valid hex color")
      .required("Primary theme color is required"),
  });

  return (
    <Formik
      initialValues={createCompanyFormValues(initialValues)}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={async (values, helpers) => {
        try {
          const normalizedValues = simpleCreate
            ? {
                ...values,
                customDomain: "",
                managerLevels: Number(values.managerLevels) || 3,
                webLink: "",
                bio: String(values.bio || "").trim() || `${values.company_name} HRMS workspace`,
                primaryThemeColor: normalizeHexColor(values.primaryThemeColor, DEFAULT_LEARNER_PRIMARY_COLOR),
                verified_email_allowed: false,
              }
            : values;
          await onSubmit(normalizedValues);
        } catch (error: any) {
          toast({
            title: "Unable to save company",
            description: getApiErrorMessage(error, "Please review the company details and try again."),
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "top-right",
          });
          helpers.setSubmitting(false);
        }
      }}
    >
      {({
        values,
        errors,
        touched,
        submitCount,
        handleBlur,
        handleChange,
        setFieldValue,
        submitForm,
      }: any) => {
        useEffect(() => {
          const cleanup = handlePreview(values?.logo?.file);
          if (!values?.logo?.file) {
            setPreview(values?.logo?.url || null);
          }

          return cleanup;
        }, [values?.logo?.file, values?.logo?.url]);

        const address = values.addressInfo?.[0] || {};
        const slug = slugifyTenant(values.tenantSlug || values.company_name || "");
        const previewUrl = buildTenantPreview(slug, values.customDomain);
        const resolvedThemeColor = normalizeHexColor(
          values.primaryThemeColor,
          DEFAULT_LEARNER_PRIMARY_COLOR
        );
        const previewTextColor = getContrastTextColor(resolvedThemeColor);

        const fieldError = (path: string) => getIn(errors, path);
        const showFieldError = (path: string) =>
          Boolean(fieldError(path) && (getIn(touched, path) || submitCount > 0));

        const handleValidatedSubmit = async (event: any) => {
          event.preventDefault();
          await submitForm();
        };

        return (
          <FormikForm onSubmit={handleValidatedSubmit}>
            <Flex direction="column" gap={6}>

              {/* TENANT */}
              <SectionCard title={simpleCreate ? "Company Basics" : "Tenant Configuration"} icon={Globe} color="purple">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <CustomInput
                    label="Company Name"
                    name="company_name"
                    placeholder="Enter company name"
                    value={values.company_name}
                    onBlur={handleBlur}
                    onChange={(e: any) => {
                      handleChange(e);
                      if (!values.tenantSlug)
                        setFieldValue("tenantSlug", slugifyTenant(e.target.value));
                    }}
                    error={fieldError("company_name")}
                    showError={showFieldError("company_name")}
                  />
                  <CustomInput
                    label="Company Code"
                    name="companyCode"
                    placeholder="Enter company code"
                    value={values.companyCode}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    error={fieldError("companyCode")}
                    showError={showFieldError("companyCode")}
                  />
                  <CustomInput
                    label="Tenant Slug"
                    name="tenantSlug"
                    placeholder="Enter tenant slug"
                    value={values.tenantSlug}
                    onBlur={handleBlur}
                    onChange={(e: any) =>
                      setFieldValue("tenantSlug", slugifyTenant(e.target.value))
                    }
                    error={fieldError("tenantSlug")}
                    showError={showFieldError("tenantSlug")}
                  />
                  {!simpleCreate && (
                    <>
                      <CustomInput
                        label="Custom Domain"
                        name="customDomain"
                        placeholder="portal.example.com"
                        value={values.customDomain}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        error={fieldError("customDomain")}
                        showError={showFieldError("customDomain")}
                      />
                      <CustomInput
                        label="Manager Levels"
                        name="managerLevels"
                        type="number"
                        placeholder="Enter number of manager levels"
                        value={values.managerLevels}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        error={fieldError("managerLevels")}
                        showError={showFieldError("managerLevels")}
                      />
                    </>
                  )}
                </SimpleGrid>

                <Flex mt={4} gap={3} align="center">
                  <Text fontSize="sm">Preview:</Text>
                  <Badge colorScheme="purple">{previewUrl || "—"}</Badge>
                  {!simpleCreate && <Badge colorScheme="blue">{values.managerLevels || 3} levels</Badge>}
                </Flex>
              </SectionCard>

              {!simpleCreate && (
                <SectionCard title="Company Branding" icon={Palette} color="blue">
                  <BrandColorField
                    value={resolvedThemeColor}
                    onChange={(nextColor) => setFieldValue("primaryThemeColor", nextColor)}
                    helperText="This color will be used for employee-facing company pages and future HRMS branding."
                    error={fieldError("primaryThemeColor")}
                    showError={showFieldError("primaryThemeColor")}
                  />

                  <HStack mt={4} spacing={3} flexWrap="wrap">
                    <Text fontSize="sm">Preview:</Text>
                    <Badge
                      px={4}
                      py={2}
                      borderRadius="full"
                      bg={resolvedThemeColor}
                      color={previewTextColor}
                      textTransform="none"
                    >
                      HRMS Portal
                    </Badge>
                    <Badge
                      px={3}
                      py={2}
                      borderRadius="full"
                      variant="outline"
                      borderColor={resolvedThemeColor}
                      color={resolvedThemeColor}
                    >
                      {resolvedThemeColor}
                    </Badge>
                  </HStack>
                </SectionCard>
              )}

              {/* PROFILE */}
              <SectionCard title={simpleCreate ? "Contact & Logo" : "Company Profile"} icon={Building2} color="blue">
                {preview ? (
                  <Flex direction="column" gap={3}>
                    <Box
                      w="120px"
                      h="120px"
                      borderRadius="lg"
                      overflow="hidden"
                      border="1px solid"
                    >
                      <img
                        src={preview}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Box>

                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => setFieldValue("logo", { file: null, url: "" })}
                    >
                      Remove Logo
                    </Button>
                  </Flex>
                ) : (
                  <CustomInput
                    type="file-drag"
                    name="logo"
                    accept="image/*"
                    onChange={(e: any) => {
                      const file = e.target.files?.[0];
                      if (file) setFieldValue("logo", { file });
                    }}
                  />
                )}

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                  <CustomInput
                    label="Company Email"
                    name="companyEmail"
                    placeholder="Enter email address"
                    value={values.companyEmail}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    error={fieldError("companyEmail")}
                    showError={showFieldError("companyEmail")}
                  />
                  <CustomInput
                    label="Primary Phone"
                    name="mobileNo"
                    placeholder="Enter mobile number"
                    value={values.mobileNo}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    error={fieldError("mobileNo")}
                    showError={showFieldError("mobileNo")}
                  />
                  {!simpleCreate && (
                    <CustomInput
                      label="Website"
                      name="webLink"
                      placeholder="https://example.com"
                      value={values.webLink}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={fieldError("webLink")}
                      showError={showFieldError("webLink")}
                    />
                  )}
                </SimpleGrid>

                {!simpleCreate && (
                  <>
                    <Box mt={4}>
                      <Checkbox
                        isChecked={Boolean(values.verified_email_allowed)}
                        onChange={(e) =>
                          setFieldValue("verified_email_allowed", e.target.checked)
                        }
                      >
                        Require email verification before activating users
                      </Checkbox>
                    </Box>

                    <Box mt={4}>
                      <CustomInput
                        label="Description"
                        name="bio"
                        type="textarea"
                        placeholder="Enter company description"
                        value={values.bio}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        error={fieldError("bio")}
                        showError={showFieldError("bio")}
                      />
                    </Box>
                  </>
                )}
              </SectionCard>

              {/* ADDRESS */}
              <SectionCard title={simpleCreate ? "Address (Optional)" : "Address"} icon={MapPin} color="orange">
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                  <GridItem colSpan={2}>
                    <CustomInput
                      label="Street"
                      name="addressInfo[0].address"
                      placeholder="Enter street address"
                      value={address.address}
                      onBlur={handleBlur}
                      onChange={(e: any) =>
                        setFieldValue("addressInfo[0].address", e.target.value)
                      }
                    />
                  </GridItem>

                  <CustomInput
                    label="City"
                    name="addressInfo[0].city"
                    placeholder="Enter city"
                    value={address.city}
                    onBlur={handleBlur}
                    onChange={(e: any) =>
                      setFieldValue("addressInfo[0].city", e.target.value)
                    }
                  />
                  <CustomInput
                    label="State"
                    name="addressInfo[0].state"
                    placeholder="Enter state"
                    value={address.state}
                    onBlur={handleBlur}
                    onChange={(e: any) =>
                      setFieldValue("addressInfo[0].state", e.target.value)
                    }
                  />
                  <CustomInput
                    label="Country"
                    name="addressInfo[0].country"
                    placeholder="Enter country"
                    value={address.country}
                    onBlur={handleBlur}
                    onChange={(e: any) =>
                      setFieldValue("addressInfo[0].country", e.target.value)
                    }
                  />
                  <CustomInput
                    label="Pin Code"
                    name="addressInfo[0].pinCode"
                    placeholder="Enter pin code"
                    value={address.pinCode}
                    onBlur={handleBlur}
                    onChange={(e: any) =>
                      setFieldValue("addressInfo[0].pinCode", e.target.value)
                    }
                  />
                </Grid>
              </SectionCard>

              {children}

              <Divider />

              {/* ACTIONS */}
              <Flex justify="flex-end" gap={4}>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" colorScheme="brand" isLoading={isLoading}>
                  {submitLabel}
                </Button>
              </Flex>
            </Flex>
          </FormikForm>
        );
      }}
    </Formik>
  );
};

export default CompanyForm;
export { createCompanyFormValues };
