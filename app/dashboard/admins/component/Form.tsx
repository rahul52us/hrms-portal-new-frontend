"use client";

import {
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  SimpleGrid,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { Formik, Form as FormikForm } from "formik";
import {
  Image as ImageIcon,
  Lock,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as Yup from "yup";

import CustomInput from "../../../component/config/component/customInput/CustomInput";
import { generateIntialValues } from "./utils/function";
import stores from "../../../store/stores";

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
      p={4}
      borderRadius="xl"
      bg={bg}
      boxShadow="md"
      border="1px solid"
      borderColor="gray.200"
    >
      <Flex align="center" mb={3} gap={2}>
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

/* ================= MAIN FORM ================= */
const Form = ({
  initialData,
  onSubmit,
  isOpen,
  onClose,
  isEdit,
  isLoading,
  selectedCompany,
}: any) => {
  const { auth: { user: currentUser } } = stores;
  const [formData, setFormData] = useState<any>(initialData);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(generateIntialValues(initialData));
    }
  }, [initialData]);

  /* ✅ SAFE IMAGE PREVIEW */
  useEffect(() => {
    if (formData?.pic?.file && formData.pic.file instanceof File) {
      const url = URL.createObjectURL(formData.pic.file);
      setPreview(url);

      return () => URL.revokeObjectURL(url);
    }
  }, [formData?.pic?.file]);

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    username: Yup.string().email().trim().lowercase().required("Email is required"),
    designation: Yup.string().required("Designation is required"),
    city: Yup.string().required("City is required"),
    state: Yup.string().required("State is required"),
    joiningDate: Yup.string().required("Joining date is required"),
    phoneNumber: Yup.string().required("Phone is required"),
    password: !isEdit
      ? Yup.string().min(6).required()
      : Yup.string().optional(),
    confirmPassword: !isEdit
      ? Yup.string().oneOf([Yup.ref("password"), null])
      : Yup.string().optional(),
    role: Yup.string().required("Role is required"),
    department: Yup.string().when('role', {
      is: 'departmenthead',
      then: (schema: any) => schema.required("Department is required"),
      otherwise: (schema: any) => schema.optional()
    }),
  });

  if (!isOpen) return null;

  return (
    <Formik
      initialValues={formData}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={onSubmit}
    >
      {({
        values,
        handleChange,
        handleSubmit,
        setFieldValue,
      }: any) => {
        /* 🔥 handle preview based on current formik values */
        const isDeptHead = currentUser?.role === "departmenthead";
        const isSuperadmin = currentUser?.role === "superadmin";
        const roleOptions = isDeptHead
          ? [{ label: "Employee", value: "user" }]
          : isSuperadmin
            ? [
                { label: "Admin", value: "admin" },
                { label: "Department Head", value: "departmenthead" },
              ]
            : [
                { label: "Admin", value: "admin" },
                { label: "Department Head", value: "departmenthead" },
                { label: "Employee", value: "user" },
              ];

        useEffect(() => {
          if (isDeptHead && !values.department) {
            setFieldValue("department", currentUser?.department);
            setFieldValue("role", "user");
          }
        }, [isDeptHead, setFieldValue, currentUser]);

        useEffect(() => {
          if (values?.pic?.file && values.pic.file instanceof File) {
            const url = URL.createObjectURL(values.pic.file);
            setPreview(url);

            return () => URL.revokeObjectURL(url);
          } else {
            setPreview(null);
          }
        }, [values?.pic?.file]);

        return (
          <FormikForm onSubmit={handleSubmit}>
            <Grid gap={6}>
              
              {/* IMAGE */}
              <SectionCard title="Profile Image" icon={ImageIcon} color="pink">
                {preview ? (
                  <Flex direction="column" gap={4}>
                    <Box
                      borderRadius="lg"
                      overflow="hidden"
                      border="1px solid"
                      borderColor="gray.200"
                      maxW="200px"
                    >
                      <img
                        src={preview}
                        alt="preview"
                        style={{
                          width: "100%",
                          height: "150px",
                          objectFit: "cover",
                        }}
                      />
                    </Box>

                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() =>
                        setFieldValue("pic", {
                          ...values.pic,
                          file: null,
                          isDeleted: 1,
                        })
                      }
                    >
                      Remove Image
                    </Button>
                  </Flex>
                ) : (
                  <CustomInput
                    type="file-drag"
                    name="pic"
                    accept="image/*"
                    onChange={(e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFieldValue("pic", {
                          ...values.pic,
                          file,
                          isAdd: 1,
                        });
                      }
                    }}
                  />
                )}
              </SectionCard>

              {/* PERSONAL */}
              <SectionCard title="Employee Details" icon={User} color="blue">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <CustomInput
                    label="Employee Name"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                  />

                  <CustomInput
                    label="Email ID"
                    name="username"
                    value={values.username}
                    onChange={handleChange}
                  />

                  <CustomInput
                    label="Contact Number"
                    name="phoneNumber"
                    value={values.phoneNumber}
                    onChange={handleChange}
                  />

                  <CustomInput
                    label="Employee Code"
                    name="code"
                    value={values.code}
                    onChange={handleChange}
                  />

                  <CustomInput
                    label="Designation"
                    name="designation"
                    value={values.designation}
                    onChange={handleChange}
                  />

                  <CustomInput
                    label="City"
                    name="city"
                    value={values.city}
                    onChange={handleChange}
                  />

                  <CustomInput
                    label="State"
                    name="state"
                    value={values.state}
                    onChange={handleChange}
                  />

                  <CustomInput
                    label="Joining Date"
                    name="joiningDate"
                    type="date"
                    value={values.joiningDate}
                    onChange={handleChange}
                  />

                  <CustomInput
                    type="select"
                    label="Role"
                    name="role"
                    disabled={isDeptHead}
                    value={
                      roleOptions.find((r: any) => r.value === values.role) || null
                    }
                    onChange={(opt: any) => {
                       const role = opt?.value || "";
                       setFieldValue("role", role);
                       setFieldValue("userType", role === "user" ? "user" : "admin");
                       if (role !== "departmenthead") {
                          setFieldValue("department", "");
                       }
                    }}
                    options={roleOptions}
                  />

                  {((!isDeptHead && values.role === "departmenthead") || values.role === "user") && (
                    <CustomInput
                      type="select"
                      label="Department"
                      name="department"
                      disabled={isDeptHead}
                      value={
                         values.department
                           ? { label: values.department, value: values.department }
                           : null
                      }
                      onChange={(opt: any) => setFieldValue("department", opt?.value || opt?.label || "")}
                      options={
                         selectedCompany?.departments?.map((dep: string) => ({
                           label: dep,
                           value: dep,
                         })) || []
                      }
                    />
                  )}
                </SimpleGrid>
              </SectionCard>

              {/* AUTH */}
              {!isEdit && (
                <SectionCard title="Authentication" icon={Lock} color="green">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <CustomInput
                      label="Password"
                      name="password"
                      type="password"
                      value={values.password}
                      onChange={handleChange}
                    />
                    <CustomInput
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      value={values.confirmPassword}
                      onChange={handleChange}
                    />
                  </SimpleGrid>
                </SectionCard>
              )}

              {/* ACTIONS */}
              <Flex justify="flex-end" gap={4} pt={4}>
                <Button variant="outline" colorScheme="red" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="brand"
                  isLoading={isLoading}
                  isDisabled={!selectedCompany?._id}
                >
                  {isEdit ? "Update Member" : "Create Member"}
                </Button>
              </Flex>
            </Grid>
          </FormikForm>
        );
      }}
    </Formik>
  );
};

export default Form;
