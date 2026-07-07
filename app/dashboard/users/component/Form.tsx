import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Divider,
  Flex,
  Grid,
  GridItem,
  IconButton,
  SimpleGrid,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { FieldArray, Formik, Form as FormikForm } from "formik";
import { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import * as Yup from "yup";
import ShowFileUploadFile from "../../../component/common/ShowFileUploadFile/ShowFileUploadFile";
import CustomInput from "../../../component/config/component/customInput/CustomInput";
import { removeDataByIndex } from "../../../config/utils/utils";
import { titles } from "./utils/constant";
import { generateIntialValues } from "./utils/function";

const Form = ({ initialData, onSubmit, isOpen, onClose, isEdit }: any) => {
  const [formData, setFormData] = useState<any>(initialData);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const bgBox = useColorModeValue("white", "darkBrand.100");
  const borderColor = useColorModeValue("brand.200", "darkBrand.200");
  const bgInput = useColorModeValue("gray.50", "darkBrand.50");
  const textColor = useColorModeValue("brand.600", "white");

  useEffect(() => {
    if (initialData) {
      setFormData(generateIntialValues(initialData));
    }
  }, [initialData]);

  const handleCloseDrawer = async () => {
    setIsDrawerOpen(false);
  };

  const validationSchema = Yup.object({
    title: Yup.mixed().required("Title is required"),
    backgroundVideo: Yup.mixed(),
    link: Yup.mixed().required("Link is required"),
    pic: Yup.mixed(),
    reviews: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required("Reviewer name is required"),
        dateInfo: Yup.string().required("Date information is required"),
        description: Yup.string()
          .required("Review description is required")
          .min(5, "Description must be at least 5 characters"),
        rating: Yup.number()
          .required("Rating is required")
          .min(1, "Rating must be between 1 and 5")
          .max(5, "Rating must be between 1 and 5"),
      })
    ),
    name: Yup.string().required("Name is required"),
    username: Yup.string().required("Username is required"),
    address: Yup.string(),
    languages: Yup.array(),
    licence: Yup.string(),
    expertise: Yup.array()
      .min(1, "At least one expertise tag is required")
      .required("Expertise is required"),
    time: Yup.string().required("Time is required"),
    charges: Yup.number()
      .required("Charges are required")
      .positive("Charges must be a positive number")
      .typeError("Charges must be a valid number"),
    bio: Yup.string().required("Bio is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string().oneOf(
      [Yup.ref("password"), null],
      "Passwords must match"
    ),
    phoneNumber: Yup.string()
      .matches(
        /^(?:\+?[0-9]{1,3})?[-.\s]?[0-9]{10}$/,
        "Phone number is not valid"
      )
      .required("Phone number is required"),
    code: Yup.string().optional(),
    qualifications: Yup.string().required("Qualifications are required"),
    professionalInfo: Yup.string().required(
      "Professional Information is required"
    ),
    // New field validations for Details section
    aboutMe: Yup.object().shape({
      paragraphs: Yup.array().of(
        Yup.string().required("Paragraph is required")
      ),
    }),
    services: Yup.array().min(1, "At least one service is required"),
    conditions: Yup.array().min(1, "At least one condition is required"),
    affiliations: Yup.array().of(
      Yup.object().shape({
        title: Yup.string().required("Affiliation title is required"),
        organization: Yup.string().required("Organization is required"),
        location: Yup.string().required("Location is required"),
      })
    ),
    stats: Yup.array().of(
      Yup.object().shape({
        value: Yup.string().required("Value is required"),
        label: Yup.string().required("Label is required"),
      })
    ),
  });

  return (
    isOpen && (
      <>
        <Formik
          initialValues={formData}
          validationSchema={validationSchema}
          enableReinitialize={true}
          onSubmit={async (values: any) => {
            onSubmit(values);
          }}
        >
          {({
            values,
            handleChange,
            handleSubmit,
            isSubmitting,
            setFieldValue,
            errors,
            touched,
          }: any) => {
            return (
              <FormikForm onSubmit={handleSubmit}>
                <Box display="flex" justifyContent="space-between" mb={4}>
                  <Text fontSize="lg" fontWeight="semibold">
                    {initialData?.username ? "Edit Patient" : "Add Patient"}
                  </Text>
                  <Button colorScheme="red" size="sm" onClick={onClose}>
                    Close
                  </Button>
                </Box>

                <Grid
                  templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                  gap={6}
                  mb={6}
                  alignItems="center"
                >
                  {/* Section 1: Personal Info */}
                  <GridItem colSpan={2}>
                    <Text fontSize="lg" fontWeight="semibold" mb={4}>
                      Personal Information
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
                      <Box width="100%">
                        {values?.pic?.file?.length === 0 ? (
                          <CustomInput
                            type="file-drag"
                            name="pic"
                            value={values.pic}
                            isMulti={true}
                            accept="image/*"
                            onChange={(e: any) => {
                              setFieldValue("pic", {
                                ...values.pic,
                                file: e.target.files[0],
                                isAdd: 1,
                              });
                            }}
                            error={errors.pic}
                          />
                        ) : (
                          <Box mt={-5} width="100%">
                            <ShowFileUploadFile
                              files={values.pic?.file}
                              removeFile={() => {
                                setFieldValue("pic", {
                                  ...values.image,
                                  file: removeDataByIndex(values.pic, 0),
                                  isDeleted: 1,
                                });
                              }}
                              edit={isEdit}
                            />
                          </Box>
                        )}
                      </Box>
                      <Grid
                        gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
                        gap={5}
                        p={4}
                        borderWidth={1}
                        borderRadius="md"
                        boxShadow="sm"
                        bg={bgBox}
                        borderColor={borderColor}
                        mt={3}
                      >
                        <Flex align={'end'} gap={2}>
                          <CustomInput
                            label="Titlessss"
                            name="title"
                            type="select"
                            options={titles}
                            value={values.title}
                            onChange={(e: any) => setFieldValue("title", e)}
                            error={errors.title && touched.title}
                            showError={errors.title && touched.title}
                          />
                          <IconButton
                            aria-label="add"
                            variant={"ghost"}
                            icon={<AddIcon />}
                            colorScheme="blue"
                            onClick={() => setIsDrawerOpen(true)}
                          />
                        </Flex>
                        <CustomInput
                          label="Name"
                          name="name"
                          placeholder="Enter Name"
                          value={values.name}
                          onChange={handleChange}
                          error={errors.name && touched.name}
                          showError={errors.name && touched.name}
                        />
                        <CustomInput
                          label="Username"
                          name="username"
                          placeholder="Enter Username"
                          value={values.username}
                          onChange={handleChange}
                          error={errors.username && touched.username}
                          showError={errors.username && touched.username}
                        />
                        <CustomInput
                          label="Phone Number"
                          name="phoneNumber"
                          type="text"
                          placeholder="Enter Phone Number"
                          value={values.phoneNumber}
                          onChange={handleChange}
                          error={errors.phoneNumber && touched.phoneNumber}
                          showError={errors.phoneNumber && touched.phoneNumber}
                        />
                        <CustomInput
                          label="Code"
                          name="code"
                          placeholder="Enter Code"
                          value={values.code}
                          onChange={handleChange}
                          error={errors.code && touched.code}
                          showError={errors.code && touched.code}
                        />
                        <CustomInput
                          label="Link"
                          name="link"
                          placeholder="Enter Link"
                          value={values.link}
                          onChange={handleChange}
                          error={errors.link && touched.link}
                          showError={errors.link && touched.link}
                        />
                        <CustomInput
                          label="Background Video"
                          name="backgroundVideo"
                          placeholder="Enter Background Video"
                          value={values.backgroundVideo}
                          onChange={handleChange}
                          error={
                            errors.backgroundVideo && touched.backgroundVideo
                          }
                          showError={
                            errors.backgroundVideo && touched.backgroundVideo
                          }
                        />
                      </Grid>
                      <Box
                        borderWidth={1}
                        borderRadius="md"
                        boxShadow="sm"
                        bg={bgBox}
                        borderColor={borderColor}
                        mt={3}
                        p={3}
                      >
                        <CustomInput
                          label="Bio"
                          name="bio"
                          type="textarea"
                          placeholder="Enter Bio"
                          value={values.bio}
                          onChange={handleChange}
                          error={errors.bio && touched.bio}
                          showError={errors.bio && touched.bio}
                          style={{ width: "100%" }}
                        />
                      </Box>
                      <Box
                        borderWidth={1}
                        borderRadius="md"
                        boxShadow="sm"
                        bg={bgBox}
                        borderColor={borderColor}
                        mt={3}
                        p={3}
                      >
                        <CustomInput
                          label="Address"
                          name="address"
                          type="textarea"
                          placeholder="Enter Address"
                          value={values.address}
                          onChange={handleChange}
                          error={errors.address && touched.address}
                          showError={errors.address && touched.address}
                          style={{ width: "100%" }}
                        />
                      </Box>
                    </SimpleGrid>
                  </GridItem>

                  {/* Section 2: Professional Info */}
                  <GridItem colSpan={2}>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      mb={4}
                      color={textColor}
                    >
                      Professional Information
                    </Text>
                    <SimpleGrid
                      p={4}
                      borderWidth={1}
                      borderRadius="md"
                      boxShadow="sm"
                      bg={bgBox}
                      borderColor={borderColor}
                      mt={3}
                      columns={{ base: 1, md: 2 }}
                      spacing={4}
                    >
                      <CustomInput
                        label="Experience"
                        name="experience"
                        placeholder="Enter Experience"
                        value={values.experience}
                        onChange={handleChange}
                        error={errors.experience && touched.experience}
                        showError={errors.experience && touched.experience}
                      />
                      <CustomInput
                        label="Expertise"
                        name="expertise"
                        placeholder="Add Expertise"
                        value={values.expertise}
                        onChange={(newTags: any) =>
                          setFieldValue("expertise", newTags)
                        }
                        type="tags"
                        error={errors.expertise && touched.expertise}
                        showError={errors.expertise && touched.expertise}
                      />
                      <CustomInput
                        label="Qualifications"
                        name="qualifications"
                        placeholder="Enter Qualifications"
                        value={values.qualifications}
                        onChange={handleChange}
                        error={errors.qualifications && touched.qualifications}
                        showError={
                          errors.qualifications && touched.qualifications
                        }
                      />
                      <CustomInput
                        label="Charges"
                        name="charges"
                        placeholder="Enter Charges"
                        value={values.charges}
                        onChange={handleChange}
                        error={errors.charges && touched.charges}
                        showError={errors.charges && touched.charges}
                      />
                      <CustomInput
                        label="Licence"
                        name="licence"
                        placeholder="Enter Licence"
                        value={values.licence}
                        onChange={handleChange}
                        error={errors.licence && touched.licence}
                        showError={errors.licence && touched.licence}
                      />
                      <CustomInput
                        label="Languages"
                        name="languages"
                        placeholder="Add Language"
                        value={values.languages}
                        onChange={(newTags: any) =>
                          setFieldValue("languages", newTags)
                        }
                        type="tags"
                        error={errors.languages && touched.languages}
                        showError={errors.languages && touched.languages}
                      />
                      <CustomInput
                        label="Professional Information"
                        name="professionalInfo"
                        placeholder="Enter Professional Information"
                        value={values.professionalInfo}
                        onChange={handleChange}
                        error={
                          errors.professionalInfo && touched.professionalInfo
                        }
                        showError={
                          errors.professionalInfo && touched.professionalInfo
                        }
                      />
                    </SimpleGrid>
                  </GridItem>

                  {/* Section 3: Details */}
                  <GridItem colSpan={2}>
                    <Text fontSize="lg" fontWeight="semibold" mb={4}>
                      Details
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
                      <Box
                        borderWidth={1}
                        borderRadius="md"
                        boxShadow="sm"
                        bg={bgBox}
                        borderColor={borderColor}
                        mt={3}
                        p={3}
                      >
                        <CustomInput
                          label="About Me"
                          name="aboutMe.paragraphs[0]"
                          type="textarea"
                          placeholder="Enter About Me paragraph"
                          value={values.aboutMe.paragraphs[0]}
                          onChange={handleChange}
                          error={
                            errors.aboutMe?.paragraphs?.[0] &&
                            touched.aboutMe?.paragraphs?.[0]
                          }
                          showError={
                            errors.aboutMe?.paragraphs?.[0] &&
                            touched.aboutMe?.paragraphs?.[0]
                          }
                        />
                      </Box>
                      <Box
                        p={4}
                        borderWidth={1}
                        borderRadius="md"
                        boxShadow="sm"
                        bg="white"
                        mt={3}
                      >
                        <Text
                          fontSize="lg"
                          fontWeight="bold"
                          mb={4}
                          color={textColor}
                        >
                          Services
                        </Text>
                        <CustomInput
                          label="Services"
                          name="services"
                          placeholder="Add Services (e.g., Mindfulness-based Therapy)"
                          value={values.services}
                          onChange={(newTags: any) =>
                            setFieldValue("services", newTags)
                          }
                          type="tags"
                          error={errors.services && touched.services}
                          showError={errors.services && touched.services}
                        />
                      </Box>
                      <Box
                        p={4}
                        borderWidth={1}
                        borderRadius="md"
                        boxShadow="sm"
                        bg="white"
                        mt={3}
                      >
                        <Text
                          fontSize="lg"
                          fontWeight="bold"
                          mb={4}
                          color={textColor}
                        >
                          Conditions
                        </Text>
                        <CustomInput
                          label="Conditions"
                          name="conditions"
                          placeholder="Add Conditions (e.g., Anxiety)"
                          value={values.conditions}
                          onChange={(newTags: any) =>
                            setFieldValue("conditions", newTags)
                          }
                          type="tags"
                          error={errors.conditions && touched.conditions}
                          showError={errors.conditions && touched.conditions}
                        />
                      </Box>
                    </SimpleGrid>
                    <Box
                      p={4}
                      borderWidth={1}
                      borderRadius="md"
                      boxShadow="sm"
                      bg={bgBox}
                      borderColor={borderColor}
                      mt={3}
                    >
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        mb={4}
                        color={textColor}
                      >
                        Affiliations
                      </Text>
                      <FieldArray name="affiliations">
                        {({ remove, push }) => (
                          <VStack spacing={4} align="stretch">
                            {values.affiliations.map((aff, index) => (
                              <SimpleGrid
                                key={index}
                                columns={{ base: 1, md: 4 }}
                                spacing={4}
                                p={4}
                                borderWidth={1}
                                borderRadius="md"
                                boxShadow="xs"
                                bg={bgInput}
                                borderColor={borderColor}
                              >
                                <CustomInput
                                  label={`Affiliation Title ${index + 1}`}
                                  name={`affiliations[${index}].title`}
                                  placeholder="Enter Affiliation Title"
                                  value={aff.title}
                                  onChange={handleChange}
                                  error={
                                    errors.affiliations?.[index]?.title &&
                                    touched.affiliations?.[index]?.title
                                  }
                                  showError={
                                    errors.affiliations?.[index]?.title &&
                                    touched.affiliations?.[index]?.title
                                  }
                                />
                                <CustomInput
                                  label={`Organization ${index + 1}`}
                                  name={`affiliations[${index}].organization`}
                                  placeholder="Enter Organization"
                                  value={aff.organization}
                                  onChange={handleChange}
                                  error={
                                    errors.affiliations?.[index]
                                      ?.organization &&
                                    touched.affiliations?.[index]?.organization
                                  }
                                  showError={
                                    errors.affiliations?.[index]
                                      ?.organization &&
                                    touched.affiliations?.[index]?.organization
                                  }
                                />
                                <CustomInput
                                  label={`Location ${index + 1}`}
                                  name={`affiliations[${index}].location`}
                                  placeholder="Enter Location"
                                  value={aff.location}
                                  onChange={handleChange}
                                  error={
                                    errors.affiliations?.[index]?.location &&
                                    touched.affiliations?.[index]?.location
                                  }
                                  showError={
                                    errors.affiliations?.[index]?.location &&
                                    touched.affiliations?.[index]?.location
                                  }
                                />
                                <IconButton
                                  aria-label="Delete affiliation"
                                  icon={<DeleteIcon />}
                                  colorScheme="red"
                                  onClick={() => remove(index)}
                                  alignSelf="center"
                                />
                              </SimpleGrid>
                            ))}
                            <Button
                              onClick={() =>
                                push({
                                  title: "",
                                  organization: "",
                                  location: "",
                                  color: "#FFFFFF",
                                })
                              }
                              colorScheme="brand"
                              size="md"
                            >
                              Add Affiliation
                            </Button>
                          </VStack>
                        )}
                      </FieldArray>
                    </Box>
                    <Box
                      p={4}
                      borderWidth={1}
                      borderRadius="md"
                      boxShadow="sm"
                      bg={bgBox}
                      borderColor={borderColor}
                      mt={3}
                    >
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        mb={4}
                        color={textColor}
                      >
                        Statistics
                      </Text>
                      <FieldArray name="stats">
                        {() => (
                          <VStack spacing={4} align="stretch">
                            <SimpleGrid
                              columns={{ base: 1, md: 3 }}
                              spacing={4}
                            >
                              {values.stats.map((stat, index) => (
                                <Box
                                  key={index}
                                  p={4}
                                  borderWidth={1}
                                  borderRadius="md"
                                  boxShadow="xs"
                                  bg={bgInput}
                                  borderColor={borderColor}
                                  position="relative"
                                >
                                  <CustomInput
                                    label={stat.label}
                                    name={`stats[${index}].value`}
                                    placeholder="Enter Value"
                                    value={stat.value}
                                    onChange={handleChange}
                                  // error={
                                  //   errors.stats?.[index]?.value &&
                                  //   touched.stats?.[index]?.value
                                  // }
                                  // showError={
                                  //   errors.stats?.[index]?.value &&
                                  //   touched.stats?.[index]?.value
                                  // }
                                  />
                                </Box>
                              ))}
                            </SimpleGrid>
                          </VStack>
                        )}
                      </FieldArray>
                    </Box>
                  </GridItem>
                  {/* Section 4: Availability and Password */}
                  <GridItem colSpan={2}>
                    <Box
                      mt={6}
                      p={4}
                      borderRadius="lg"
                      boxShadow="lg"
                      bg={bgBox}
                    >
                      <Text fontSize="xl" fontWeight="bold" mb={2}>
                        Reviews
                      </Text>
                      <Divider mb={4} />

                      <FieldArray name="reviews">
                        {({ push, remove }) => (
                          <>
                            <VStack spacing={4} align="stretch">
                              {values.reviews.map((review, index) => (
                                <Flex
                                  flexDirection="column"
                                  key={index}
                                  p={4}
                                  borderRadius="md"
                                  boxShadow="md"
                                  bg={bgInput}
                                  borderColor={borderColor}
                                  position="relative"
                                  gap={4}
                                >
                                  <Flex
                                    justify="space-between"
                                    align="center"
                                    mb={2}
                                  >
                                    <Text fontWeight="bold">
                                      Review {index + 1}
                                    </Text>
                                    <IconButton
                                      aria-label="Remove review"
                                      icon={<FiTrash2 />}
                                      colorScheme="red"
                                      size="sm"
                                      onClick={() => remove(index)}
                                      isDisabled={values.reviews.length === 1}
                                    />
                                  </Flex>

                                  <CustomInput
                                    style={{ marginTop: "5px" }}
                                    label="Name"
                                    name={`reviews.${index}.name`}
                                    placeholder="Enter Review Name"
                                    value={review.name}
                                    onChange={handleChange}
                                    error={
                                      errors.reviews?.[index]?.name &&
                                      touched.reviews?.[index]?.name
                                    }
                                    showError={
                                      errors.reviews?.[index]?.name &&
                                      touched.reviews?.[index]?.name
                                    }
                                  />

                                  <CustomInput
                                    style={{ marginTop: "5px" }}
                                    label="Date Info"
                                    name={`reviews.${index}.dateInfo`}
                                    placeholder="Enter  dateInfo"
                                    value={review.dateInfo}
                                    onChange={handleChange}
                                    error={
                                      errors.reviews?.[index]?.dateInfo &&
                                      touched.reviews?.[index]?.dateInfo
                                    }
                                    showError={
                                      errors.reviews?.[index]?.dateInfo &&
                                      touched.reviews?.[index]?.dateInfo
                                    }
                                  />

                                  <CustomInput
                                    style={{ marginTop: "5px" }}
                                    label="Description"
                                    name={`reviews.${index}.description`}
                                    placeholder="Enter Review Description"
                                    value={review.description}
                                    onChange={handleChange}
                                    error={
                                      errors.reviews?.[index]?.description &&
                                      touched.reviews?.[index]?.description
                                    }
                                    showError={
                                      errors.reviews?.[index]?.description &&
                                      touched.reviews?.[index]?.description
                                    }
                                  />

                                  <CustomInput
                                    style={{ marginTop: "5px" }}
                                    label="Rating (1-5)"
                                    name={`reviews.${index}.rating`}
                                    placeholder="Enter Rating"
                                    type="number"
                                    value={review.rating}
                                    onChange={handleChange}
                                    error={
                                      errors.reviews?.[index]?.rating &&
                                      touched.reviews?.[index]?.rating
                                    }
                                    showError={
                                      errors.reviews?.[index]?.rating &&
                                      touched.reviews?.[index]?.rating
                                    }
                                  />
                                </Flex>
                              ))}
                            </VStack>

                            {/* Add Review Button */}
                            <Button
                              leftIcon={<FiPlus />}
                              colorScheme="brand"
                              mt={4}
                              onClick={() =>
                                push({ description: "", rating: "" })
                              }
                            >
                              Add Review
                            </Button>
                          </>
                        )}
                      </FieldArray>
                    </Box>
                  </GridItem>
                  <GridItem colSpan={2}>
                    <Box
                      p={4}
                      borderWidth={1}
                      borderRadius="md"
                      boxShadow="sm"
                      bg={bgBox}
                      borderColor={borderColor}
                      mt={3}
                    >
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        mb={4}
                        color={textColor}
                      >
                        Availability & Authentication
                      </Text>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <CustomInput
                          label="Availability"
                          name="availability"
                          placeholder="Add Availability"
                          value={values.availability}
                          onChange={(newTags: any) =>
                            setFieldValue("availability", newTags)
                          }
                          type="tags"
                          error={errors.availability && touched.availability}
                          showError={
                            errors.availability && touched.availability
                          }
                        />
                        <CustomInput
                          label="Time"
                          name="time"
                          placeholder="Enter Time (e.g., 9 AM, 3:30 PM)"
                          value={values.time}
                          onChange={handleChange}
                          error={errors.time && touched.time}
                          showError={errors.time && touched.time}
                        />
                        {!isEdit && (
                          <>
                            <CustomInput
                              label="Password"
                              name="password"
                              type="password"
                              placeholder="Enter Password"
                              value={values.password}
                              onChange={handleChange}
                              error={errors.password && touched.password}
                              showError={errors.password && touched.password}
                            />
                            <CustomInput
                              label="Confirm Password"
                              name="confirmPassword"
                              type="password"
                              placeholder="Confirm Password"
                              value={values.confirmPassword}
                              onChange={handleChange}
                              error={
                                errors.confirmPassword &&
                                touched.confirmPassword
                              }
                              showError={
                                errors.confirmPassword &&
                                touched.confirmPassword
                              }
                            />
                          </>
                        )}{" "}
                      </SimpleGrid>
                    </Box>
                  </GridItem>
                </Grid>

                <Flex justifyContent="flex-end" mt={4}>
                  <Flex gap={4}>
                    <Button
                      colorScheme="red"
                      size="lg"
                      onClick={onClose}
                      _hover={{ bg: "red.500" }}
                      width="auto"
                    >
                      Close
                    </Button>
                    <Button
                      type="submit"
                      colorScheme="brand"
                      isLoading={isSubmitting}
                      loadingText="Submitting"
                      size="lg"
                      _hover={{ bg: "teal.500" }}
                      width="auto"
                    >
                      {initialData?.username ? "Update" : "Add"} Therapist
                    </Button>
                  </Flex>
                </Flex>
              </FormikForm>
            );
          }}
        </Formik>
      </>
    )
  );
};

export default Form;
