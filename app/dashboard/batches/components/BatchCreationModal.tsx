"use client";

import CourseMultiSelectInput from "@/app/dashboard/course/components/CourseMultiSelectInput";
import {
  batchStore,
  type BatchDetailsItem,
  type BatchUploadPreviewData,
} from "@/app/store/batchStore/batchStore";
import { courseStore } from "@/app/store/courseStore/courseStore";
import stores from "@/app/store/stores";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Grid,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  SlideFade,
  Stack,
  Step,
  StepDescription,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  useToast,
  VStack,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiSearch,
  FiUploadCloud,
  FiUsers
} from "react-icons/fi";

const STEPS = [
  { title: "Details", description: "Name and dates" },
  { title: "Setup", description: "Courses and learners" },
];

const focusRing = {
  borderColor: "blue.500",
  boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
};

type CreationMode = "manual" | "upload";

type BatchCreationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  onCreated?: () => void | Promise<void>;
  mode?: "create" | "edit";
  initialBatch?: BatchDetailsItem | null;
  initialStep?: number;
};

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "Open ended";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Open ended";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const SectionHeader = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) => (
  <Stack spacing={1.5}>
    {eyebrow ? (
      <Text
        color="blue.600"
        fontSize="xs"
        fontWeight="900"
        textTransform="uppercase"
        letterSpacing="0.08em"
      >
        {eyebrow}
      </Text>
    ) : null}

    <Text
      color="gray.950"
      fontSize={{ base: "lg", md: "xl" }}
      fontWeight="900"
      letterSpacing="-0.04em"
      lineHeight="1.15"
    >
      {title}
    </Text>

    {description ? (
      <Text color="gray.500" fontSize="sm" lineHeight="1.6">
        {description}
      </Text>
    ) : null}
  </Stack>
);

const Surface = ({
  children,
  p = { base: 4, md: 5 },
}: {
  children: React.ReactNode;
  p?: any;
}) => (
  <Box
    bg="white"
    borderWidth="1px"
    borderColor="gray.200"
    borderRadius="22px"
    p={p}
    boxShadow="sm"
  >
    {children}
  </Box>
);

const EmptyState = ({
  icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <Flex
    align="center"
    justify="center"
    minH="150px"
    p={5}
    borderWidth="1px"
    borderStyle="dashed"
    borderColor="gray.300"
    borderRadius="18px"
    bg="gray.50"
    textAlign="center"
  >
    <Stack align="center" spacing={3} maxW="360px">
      <Flex
        align="center"
        justify="center"
        boxSize="42px"
        borderRadius="16px"
        bg="white"
        color="gray.400"
        boxShadow="sm"
      >
        <Icon as={icon} boxSize={5} />
      </Flex>

      <Text color="gray.900" fontWeight="800">
        {title}
      </Text>

      <Text color="gray.500" fontSize="sm" lineHeight="1.6">
        {description}
      </Text>
    </Stack>
  </Flex>
);

const StatCard = ({
  label,
  value,
  colorScheme = "blue",
}: {
  label: string;
  value: string;
  colorScheme?: string;
}) => (
  <Box
    p={4}
    borderWidth="1px"
    borderColor="gray.200"
    borderRadius="16px"
    bg={`${colorScheme}.50`}
  >
    <Text
      fontSize="xs"
      fontWeight="900"
      letterSpacing="0.08em"
      textTransform="uppercase"
      color={`${colorScheme}.600`}
      mb={2}
    >
      {label}
    </Text>

    <Text color="gray.950" fontSize="lg" fontWeight="900" lineHeight="1.2">
      {value}
    </Text>
  </Box>
);

const ModeCard = ({
  title,
  description,
  icon,
  isSelected,
  onClick,
  badge,
}: {
  title: string;
  description: string;
  icon: any;
  isSelected: boolean;
  onClick: () => void;
  badge?: string;
}) => (
  <Box
    as="button"
    type="button"
    onClick={onClick}
    textAlign="left"
    w="full"
    p={5}
    borderWidth="1px"
    borderColor={isSelected ? "blue.400" : "gray.200"}
    bg={isSelected ? "blue.50" : "white"}
    borderRadius="20px"
    transition="all 0.18s ease"
    boxShadow={isSelected ? "0 12px 30px rgba(37, 99, 235, 0.10)" : "sm"}
    _hover={{
      borderColor: isSelected ? "blue.500" : "gray.300",
      bg: isSelected ? "blue.50" : "gray.50",
      transform: "translateY(-1px)",
    }}
    _focusVisible={focusRing}
  >
    <Stack spacing={4}>
      <HStack justify="space-between" align="start">
        <Flex
          align="center"
          justify="center"
          boxSize="44px"
          borderRadius="16px"
          bg={isSelected ? "blue.500" : "gray.100"}
          color={isSelected ? "white" : "gray.600"}
        >
          <Icon as={icon} boxSize={5} />
        </Flex>

        <HStack spacing={2}>
          {badge ? (
            <Badge
              colorScheme={isSelected ? "blue" : "gray"}
              borderRadius="full"
              px={2.5}
              py={1}
              textTransform="none"
            >
              {badge}
            </Badge>
          ) : null}

          <Flex
            align="center"
            justify="center"
            boxSize="24px"
            borderRadius="full"
            borderWidth="1px"
            borderColor={isSelected ? "blue.500" : "gray.300"}
            bg={isSelected ? "blue.500" : "white"}
            color="white"
          >
            {isSelected ? <Icon as={FiCheck} boxSize={3.5} /> : null}
          </Flex>
        </HStack>
      </HStack>

      <Box>
        <Text color="gray.950" fontWeight="900" fontSize="md">
          {title}
        </Text>

        <Text color="gray.500" fontSize="sm" mt={1.5} lineHeight="1.6">
          {description}
        </Text>
      </Box>
    </Stack>
  </Box>
);

const ReviewRow = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) => (
  <HStack justify="space-between" spacing={3}>
    <HStack spacing={3} minW={0}>
      <Flex
        align="center"
        justify="center"
        boxSize="34px"
        borderRadius="12px"
        bg="blue.50"
        color="blue.600"
        flexShrink={0}
      >
        <Icon as={icon} boxSize={4} />
      </Flex>

      <Text fontSize="sm" fontWeight="800" color="gray.700" noOfLines={1}>
        {label}
      </Text>
    </HStack>

    <Text fontSize="sm" fontWeight="900" color="gray.950" flexShrink={0}>
      {value}
    </Text>
  </HStack>
);

const BatchCreationModal = observer(
  ({
    isOpen,
    onClose,
    companyId = "",
    onCreated,
    mode = "create",
    initialBatch = null,
    initialStep = 0,
  }: BatchCreationModalProps) => {
    const toast = useToast();
    const { auth, companyStore } = stores;
    const isEditMode = mode === "edit";

    const [step, setStep] = useState(Math.min(initialStep, 1));
    const [creationMode, setCreationMode] = useState<CreationMode>("manual");
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [courseSearch, setCourseSearch] = useState("");
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [userResults, setUserResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] =
      useState<BatchUploadPreviewData | null>(null);

    const managedCompanies = companyStore.companies.data || [];

    const selectedCompany =
      managedCompanies.find((company: any) => company?._id === companyId) ||
      auth.user?.companyDetails ||
      null;

    const isCompanyInactive = Boolean(
      companyId && selectedCompany?.is_active === false
    );

    const companyName = selectedCompany?.company_name || "this company";

    const inactiveCompanyMessage = `${companyName} is inactive. Batch creation and updates are disabled until the company is reactivated.`;

    const companyAssignedCourseIds = useMemo(
      () =>
        Array.from(
          new Set(
            (courseStore.assignedCourseAccesses || [])
              .filter(
                (access) =>
                  access.assignmentType === "company" &&
                  access.status !== "expired"
              )
              .map((access) => access.courseId)
              .filter(Boolean)
          )
        ),
      [courseStore.assignedCourseAccesses]
    );

    const companyAssignedCourseMap = useMemo(
      () =>
        new Map(
          (courseStore.assignedCourseAccesses || [])
            .filter(
              (access) => access.assignmentType === "company" && access.courseId
            )
            .map((access) => [access.courseId, access.courseName])
        ),
      [courseStore.assignedCourseAccesses]
    );

    const availableCourses = useMemo<any[]>(() => {
      const courseMap = new Map(
        (courseStore.courses || []).map((course) => [course._id, course])
      );

      const existingCourseMap = new Map(
        (initialBatch?.courses || []).map((course) => [course._id, course])
      );

      const scopedCourses = companyAssignedCourseIds
        .map((courseId) => {
          const existingCourse = existingCourseMap.get(courseId);

          return (
            courseMap.get(courseId) ||
            existingCourse || {
              _id: courseId,
              title: companyAssignedCourseMap.get(courseId) || "Assigned course",
              description: { text: "" },
            }
          );
        })
        .filter(Boolean);

      const missingExistingCourses = (initialBatch?.courses || [])
        .filter(
          (course) =>
            selectedCourseIds.includes(course._id) &&
            !companyAssignedCourseIds.includes(course._id)
        )
        .map((course) => ({
          ...course,
          description: {
            text:
              course.description?.text ||
              "This course is no longer assigned to the company. Remove it before saving this batch.",
          },
        }));

      return [...scopedCourses, ...missingExistingCourses].filter(
        (course, index, courses) =>
          courses.findIndex((item) => item._id === course._id) === index
      );
    }, [
      companyAssignedCourseIds,
      companyAssignedCourseMap,
      courseStore.courses,
      initialBatch?.courses,
      selectedCourseIds,
    ]);

    const selectedCourses = useMemo(() => {
      const byId = new Map(availableCourses.map((course) => [course._id, course]));
      return selectedCourseIds
        .map((courseId) => byId.get(courseId))
        .filter(Boolean);
    }, [availableCourses, selectedCourseIds]);

    const invalidSelectedCourses = useMemo(
      () =>
        selectedCourses.filter(
          (course: any) => !companyAssignedCourseIds.includes(course._id)
        ),
      [companyAssignedCourseIds, selectedCourses]
    );

    const canContinueFromDetails =
      Boolean(name.trim() && startDate) && (!endDate || endDate >= startDate);

    const manualCanSubmit =
      selectedCourseIds.length > 0 &&
      selectedUsers.length > 0 &&
      invalidSelectedCourses.length === 0 &&
      !isCompanyInactive;

    const uploadCanSubmit = Boolean(
      uploadPreview?.courseCount && uploadPreview?.matchedCount && !isCompanyInactive
    );

    const normalizeForOpen = (batch: BatchDetailsItem | null, nextStep = 0) => {
      setStep(Math.min(nextStep, 1));
      setCreationMode("manual");
      setName(batch?.name || "");
      setStartDate(toDateInputValue(batch?.startDate));
      setEndDate(toDateInputValue(batch?.endDate));
      setCourseSearch("");
      setSelectedCourseIds((batch?.courses || []).map((course) => course._id));
      setUserSearch("");
      setUserResults([]);
      setSelectedUsers(batch?.users || []);
      setUploadFile(null);
      setUploadPreview(null);
    };

    const reset = () => {
      setStep(Math.min(initialStep, 1));
      setCreationMode("manual");
      setName("");
      setStartDate("");
      setEndDate("");
      setCourseSearch("");
      setSelectedCourseIds([]);
      setUserSearch("");
      setUserResults([]);
      setSelectedUsers([]);
      setUploadFile(null);
      setUploadPreview(null);
    };

    useEffect(() => {
      if (!isOpen) return;

      if (isEditMode) {
        normalizeForOpen(initialBatch, initialStep);
      } else {
        reset();
      }

      courseStore.fetchCourses().catch(() => undefined);

      if (companyId) {
        courseStore
          .fetchAssignedCourseAccesses({
            companyId,
            assignmentType: "company",
          })
          .catch(() => undefined);
      }
    }, [companyId, initialBatch, initialStep, isEditMode, isOpen]);

    useEffect(() => {
      if (!isOpen || creationMode !== "manual") {
        setUserResults([]);
        return;
      }

      const timeoutId = setTimeout(async () => {
        if (!userSearch.trim()) {
          setUserResults([]);
          return;
        }

        try {
          const response = await auth.getCompanyUsers({
            searchValue: userSearch.trim(),
            ...(companyId ? { companyId } : {}),
          });

          setUserResults(response || []);
        } catch {
          setUserResults([]);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }, [auth, companyId, creationMode, isOpen, userSearch]);

    const handleModeChange = (nextMode: CreationMode) => {
      setCreationMode(nextMode);

      if (nextMode === "manual") {
        setUploadFile(null);
        setUploadPreview(null);
        return;
      }

      setCourseSearch("");
      setSelectedCourseIds([]);
      setUserSearch("");
      setUserResults([]);
      setSelectedUsers([]);
    };

    const handleClose = () => {
      reset();
      onClose();
    };

    const toggleUser = (user: any) => {
      setSelectedUsers((current) => {
        const exists = current.some((item) => item._id === user._id);

        if (exists) {
          return current.filter((item) => item._id !== user._id);
        }

        return [...current, user];
      });
    };

    const handleValidateUpload = async () => {
      if (!uploadFile) return;

      if (isCompanyInactive) {
        toast({
          title: "Company is inactive",
          description: inactiveCompanyMessage,
          status: "warning",
          duration: 4500,
          position: "top-right",
          isClosable: true,
        });
        return;
      }

      try {
        const response = await batchStore.previewBatchUpload({
          file: uploadFile,
          companyId: companyId || undefined,
        });

        const preview = response?.data || null;
        setUploadPreview(preview);

        toast({
          title: preview?.summary?.validRows
            ? "Workbook reviewed"
            : "No valid data found",
          description: preview?.summary?.validRows
            ? `${preview.summary.validCourseRows} valid course${
                preview.summary.validCourseRows === 1 ? "" : "s"
              } and ${preview.summary.validUserRows} valid user${
                preview.summary.validUserRows === 1 ? "" : "s"
              } identified.`
            : "No batchable courses or users were found in the uploaded workbook.",
          status: preview?.summary?.validRows ? "success" : "warning",
          duration: 4000,
          position: "top-right",
          isClosable: true,
        });
      } catch (err: any) {
        setUploadPreview(null);

        toast({
          title: "Validation failed",
          description:
            err?.message ||
            err?.error ||
            "Unable to validate the uploaded spreadsheet.",
          status: "error",
          duration: 4500,
          position: "top-right",
          isClosable: true,
        });
      }
    };

    const handleSubmit = async () => {
      const isUploadMode = creationMode === "upload" && !isEditMode;

      if (isUploadMode && !uploadCanSubmit) return;
      if (!isUploadMode && !manualCanSubmit) return;

      if (isCompanyInactive) {
        toast({
          title: "Company is inactive",
          description: inactiveCompanyMessage,
          status: "warning",
          duration: 4500,
          position: "top-right",
          isClosable: true,
        });
        return;
      }

      try {
        const response =
          isEditMode && initialBatch?._id
            ? await batchStore.updateBatch(initialBatch._id, {
                name: name.trim(),
                courseIds: selectedCourseIds,
                userIds: selectedUsers.map((user) => user._id),
                startDate: new Date(startDate).toISOString(),
                endDate: endDate ? new Date(endDate).toISOString() : null,
              })
            : await batchStore.createBatch({
                name: name.trim(),
                companyId: companyId || undefined,
                courseIds: isUploadMode ? [] : selectedCourseIds,
                userIds: isUploadMode
                  ? []
                  : selectedUsers.map((user) => user._id),
                startDate: new Date(startDate).toISOString(),
                endDate: endDate ? new Date(endDate).toISOString() : null,
                file: isUploadMode ? uploadFile : null,
              });

        toast({
          title: isEditMode ? "Batch updated" : "Batch created",
          description:
            response?.message ||
            (isEditMode
              ? "The batch has been updated successfully."
              : "The batch has been created successfully."),
          status: "success",
          duration: 4000,
          position: "top-right",
          isClosable: true,
        });

        await onCreated?.();
        handleClose();
      } catch (err: any) {
        toast({
          title: isEditMode ? "Unable to update batch" : "Unable to create batch",
          description: err?.message || err?.error || "Please try again.",
          status: "error",
          duration: 4500,
          position: "top-right",
          isClosable: true,
        });
      }
    };

    const actionLabel = isEditMode
      ? "Save Batch"
      : creationMode === "upload"
        ? uploadPreview?.failedCount
          ? "Create With Valid Data"
          : "Create Batch"
        : "Create Batch";

    const isSubmitDisabled =
      isCompanyInactive ||
      (creationMode === "upload" && !isEditMode
        ? !uploadCanSubmit
        : !manualCanSubmit);

    return (
      <Drawer isOpen={isOpen} placement="right" size="full" onClose={handleClose}>
        <DrawerOverlay backdropFilter="blur(8px)" bg="blackAlpha.400" />

        <DrawerContent bg="gray.50" maxW={{ base: "100vw", xl: "82vw" }}>
          <DrawerCloseButton mt={2} />

          <DrawerHeader
            bg="white"
            borderBottomWidth="1px"
            borderColor="gray.200"
            px={{ base: 4, md: 8 }}
            py={{ base: 4, md: 6 }}
          >
            <Grid
              templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) 420px" }}
              gap={{ base: 5, lg: 8 }}
              alignItems="center"
            >
              <Stack spacing={3}>
                <Badge
                  alignSelf="start"
                  colorScheme={isEditMode ? "purple" : "blue"}
                  borderRadius="full"
                  px={3}
                  py={1}
                  textTransform="none"
                  fontSize="xs"
                >
                  {isEditMode ? "Edit existing batch" : "Create new batch"}
                </Badge>

                <Box>
                  <Text
                    color="gray.950"
                    fontSize={{ base: "2xl", md: "3xl" }}
                    fontWeight="950"
                    letterSpacing="-0.055em"
                    lineHeight="1.05"
                  >
                    {isEditMode ? "Update batch setup" : "Create a clear learning batch"}
                  </Text>

                  <Text color="gray.500" fontSize="sm" mt={2} maxW="720px" lineHeight="1.7">
                    Add the basic details first, then choose how learners and courses should be assigned.
                    The review panel will show exactly what will be created.
                  </Text>
                </Box>
              </Stack>

              <Box>
                <Stepper index={step} size="sm" colorScheme="blue">
                  {STEPS.map((item) => (
                    <Step key={item.title}>
                      <StepIndicator>
                        <StepStatus
                          complete={<StepNumber />}
                          incomplete={<StepNumber />}
                          active={<StepNumber />}
                        />
                      </StepIndicator>

                      <Box flexShrink="0">
                        <StepTitle>{item.title}</StepTitle>
                        <StepDescription>{item.description}</StepDescription>
                      </Box>

                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </Grid>
          </DrawerHeader>

          <DrawerBody px={{ base: 4, md: 8 }} py={{ base: 5, md: 6 }}>
            <SlideFade in offsetY="8px">
              <Stack spacing={5}>
                {isCompanyInactive ? (
                  <Alert
                    status="warning"
                    borderRadius="18px"
                    bg="orange.50"
                    color="orange.900"
                    borderWidth="1px"
                    borderColor="orange.200"
                    alignItems="start"
                  >
                    <AlertIcon color="orange.500" mt={1} />
                    <Box>
                      <AlertTitle fontSize="sm">Company is inactive</AlertTitle>
                      <AlertDescription fontSize="sm" mt={1} lineHeight="1.6">
                        {inactiveCompanyMessage}
                      </AlertDescription>
                    </Box>
                  </Alert>
                ) : null}

                {step === 0 ? (
                  <Grid
                    templateColumns={{ base: "1fr", xl: "minmax(0, 1fr) 360px" }}
                    gap={5}
                    alignItems="start"
                  >
                    <Surface p={{ base: 4, md: 6 }}>
                      <Stack spacing={6}>
                        <SectionHeader
                          eyebrow="Step 1"
                          title="Batch details"
                          description="Give this batch a clear name and schedule so admins and learners can understand it quickly."
                        />

                        <Stack spacing={5}>
                          <Box>
                            <Text fontSize="sm" fontWeight="800" color="gray.700" mb={2}>
                              Batch Name
                            </Text>

                            <Input
                              value={name}
                              onChange={(event) => setName(event.target.value)}
                              placeholder="Example: Q3 Sales Onboarding"
                              bg="white"
                              borderRadius="16px"
                              borderColor="gray.200"
                              h="46px"
                              _focus={focusRing}
                            />

                            <Text fontSize="xs" color="gray.500" mt={2}>
                              Use a name that explains the audience, purpose, or timeline.
                            </Text>
                          </Box>

                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <Box>
                              <Text fontSize="sm" fontWeight="800" color="gray.700" mb={2}>
                                Start Date
                              </Text>

                              <Input
                                type="date"
                                value={startDate}
                                onChange={(event) => setStartDate(event.target.value)}
                                bg="white"
                                borderRadius="16px"
                                borderColor="gray.200"
                                h="46px"
                                _focus={focusRing}
                              />
                            </Box>

                            <Box>
                              <Text fontSize="sm" fontWeight="800" color="gray.700" mb={2}>
                                End Date
                              </Text>

                              <Input
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={(event) => setEndDate(event.target.value)}
                                bg="white"
                                borderRadius="16px"
                                borderColor="gray.200"
                                h="46px"
                                _focus={focusRing}
                              />

                              <Text fontSize="xs" color="gray.500" mt={2}>
                                Leave empty for an open-ended batch.
                              </Text>
                            </Box>
                          </SimpleGrid>

                          {endDate && startDate && endDate < startDate ? (
                            <Alert status="warning" borderRadius="16px">
                              <AlertIcon />
                              <Box>
                                <AlertTitle fontSize="sm">Check the schedule</AlertTitle>
                                <AlertDescription fontSize="sm">
                                  End date must be later than start date.
                                </AlertDescription>
                              </Box>
                            </Alert>
                          ) : null}
                        </Stack>
                      </Stack>
                    </Surface>

                    <Surface>
                      <Stack spacing={4}>
                        <SectionHeader
                          eyebrow="Preview"
                          title="Batch summary"
                          description="This will update as you complete the setup."
                        />

                        <Stack spacing={3}>
                          <ReviewRow
                            icon={FiFileText}
                            label="Batch Name"
                            value={name.trim() || "Not added"}
                          />

                          <ReviewRow
                            icon={FiCalendar}
                            label="Start Date"
                            value={formatDate(startDate)}
                          />

                          <ReviewRow
                            icon={FiCalendar}
                            label="End Date"
                            value={formatDate(endDate)}
                          />
                        </Stack>

                        <Alert status="info" borderRadius="16px" bg="blue.50">
                          <AlertIcon color="blue.500" />
                          <Text fontSize="sm" color="blue.900" lineHeight="1.6">
                            Next, you will add courses and learners manually or through a validated Excel upload.
                          </Text>
                        </Alert>
                      </Stack>
                    </Surface>
                  </Grid>
                ) : null}

                {step === 1 ? (
                  <Stack spacing={5}>
                    {!isEditMode ? (
                      <Surface>
                        <Stack spacing={4}>
                          <SectionHeader
                            eyebrow="Step 2"
                            title="Choose setup method"
                            description="Manual setup is best for smaller batches. Excel upload is best when you already have a prepared learner/course list."
                          />

                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <ModeCard
                              title="Manual Setup"
                              description="Select courses and learners inside this screen. Best when you want full control."
                              icon={FiUsers}
                              badge="Recommended"
                              isSelected={creationMode === "manual"}
                              onClick={() => handleModeChange("manual")}
                            />

                            <ModeCard
                              title="Excel Upload"
                              description="Upload one workbook, validate it, then create the batch using only valid rows."
                              icon={FiUploadCloud}
                              badge="Bulk"
                              isSelected={creationMode === "upload"}
                              onClick={() => handleModeChange("upload")}
                            />
                          </SimpleGrid>
                        </Stack>
                      </Surface>
                    ) : null}

                    {creationMode === "manual" || isEditMode ? (
                      <Grid
                        templateColumns={{
                          base: "1fr",
                          xl: "minmax(0, 1fr) 380px",
                        }}
                        gap={5}
                        alignItems="start"
                      >
                        <Stack spacing={5}>
                          <Surface>
                            <Stack spacing={4}>
                              <SectionHeader
                                eyebrow="Courses"
                                title="Select courses"
                                description="Every learner in this batch will receive all selected courses."
                              />

                              {!companyAssignedCourseIds.length ? (
                                <Alert status="warning" borderRadius="16px">
                                  <AlertIcon />
                                  <Box>
                                    <AlertTitle fontSize="sm">
                                      No assigned courses available
                                    </AlertTitle>
                                    <AlertDescription fontSize="sm">
                                      Assign at least one course to this company before creating a batch.
                                    </AlertDescription>
                                  </Box>
                                </Alert>
                              ) : null}

                              {invalidSelectedCourses.length ? (
                                <Alert status="warning" borderRadius="16px">
                                  <AlertIcon />
                                  <Box>
                                    <AlertTitle fontSize="sm">
                                      Some selected courses are no longer valid
                                    </AlertTitle>
                                    <AlertDescription fontSize="sm">
                                      Remove outdated course assignments before saving this batch.
                                    </AlertDescription>
                                  </Box>
                                </Alert>
                              ) : null}

                              <CourseMultiSelectInput
                                courses={availableCourses}
                                selectedCourseIds={selectedCourseIds}
                                onSelectionChange={setSelectedCourseIds}
                                searchValue={courseSearch}
                                onSearchChange={setCourseSearch}
                                label="Batch courses"
                                helperText="Only company-assigned courses are available here."
                                emptyStateText="No company-assigned courses match this search."
                              />
                            </Stack>
                          </Surface>

                          <Surface>
                            <Stack spacing={4}>
                              <SectionHeader
                                eyebrow="Learners"
                                title="Search and add learners"
                                description="Search users by name, email, code, or department, then click a user to add or remove them."
                              />

                              <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                  <Icon as={FiSearch} color="gray.400" />
                                </InputLeftElement>

                                <Input
                                  value={userSearch}
                                  onChange={(event) => setUserSearch(event.target.value)}
                                  placeholder="Search learners..."
                                  bg="white"
                                  borderRadius="16px"
                                  borderColor="gray.200"
                                  h="46px"
                                  _focus={focusRing}
                                />
                              </InputGroup>

                              <Box
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="18px"
                                overflow="hidden"
                                bg="white"
                                maxH="360px"
                                overflowY="auto"
                              >
                                {userResults.length === 0 ? (
                                  <Box p={6}>
                                    <Text color="gray.400" fontSize="sm" textAlign="center">
                                      Search results will appear here.
                                    </Text>
                                  </Box>
                                ) : (
                                  <VStack align="stretch" spacing={0} divider={<Divider />}>
                                    {userResults.map((row: any) => {
                                      const user = row.user || row;
                                      const isSelected = selectedUsers.some(
                                        (item) => item._id === user._id
                                      );

                                      return (
                                        <HStack
                                          key={user._id}
                                          p={3.5}
                                          cursor="pointer"
                                          bg={isSelected ? "blue.50" : "white"}
                                          _hover={{
                                            bg: isSelected ? "blue.100" : "gray.50",
                                          }}
                                          onClick={() => toggleUser(user)}
                                          justify="space-between"
                                        >
                                          <HStack spacing={3} minW={0}>
                                            <Avatar
                                              size="sm"
                                              name={user.name || user.email}
                                              src={user.profilePicture}
                                            />

                                            <Box minW={0}>
                                              <Text
                                                fontSize="sm"
                                                fontWeight="800"
                                                color="gray.950"
                                                noOfLines={1}
                                              >
                                                {user.name || "Unnamed user"}
                                              </Text>

                                              <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                                {user.email || user.username}
                                              </Text>
                                            </Box>
                                          </HStack>

                                          {isSelected ? (
                                            <Icon
                                              as={FiCheckCircle}
                                              color="blue.500"
                                              flexShrink={0}
                                            />
                                          ) : null}
                                        </HStack>
                                      );
                                    })}
                                  </VStack>
                                )}
                              </Box>
                            </Stack>
                          </Surface>
                        </Stack>

                        <Box position={{ xl: "sticky" }} top={{ xl: 5 }}>
                          <Surface>
                            <Stack spacing={5}>
                              <SectionHeader
                                eyebrow="Live Review"
                                title="Ready to create?"
                                description="Check the final course and learner count before saving."
                              />

                              <SimpleGrid columns={2} spacing={3}>
                                <StatCard
                                  label="Courses"
                                  value={`${selectedCourseIds.length}`}
                                  colorScheme="blue"
                                />
                                <StatCard
                                  label="Learners"
                                  value={`${selectedUsers.length}`}
                                  colorScheme="green"
                                />
                              </SimpleGrid>

                              <Divider />

                              <Box>
                                <Text
                                  fontSize="xs"
                                  fontWeight="900"
                                  letterSpacing="0.08em"
                                  textTransform="uppercase"
                                  color="gray.500"
                                  mb={3}
                                >
                                  Selected Courses
                                </Text>

                                {selectedCourses.length ? (
                                  <Wrap spacing={2}>
                                    {selectedCourses.slice(0, 8).map((course: any) => (
                                      <WrapItem key={course._id}>
                                        <Tag
                                          borderRadius="full"
                                          colorScheme="blue"
                                          variant="subtle"
                                          px={3}
                                          py={2}
                                        >
                                          <HStack spacing={2}>
                                            <Icon as={FiBookOpen} boxSize={3.5} />
                                            <TagLabel fontWeight="800" maxW="180px" noOfLines={1}>
                                              {course.title}
                                            </TagLabel>
                                          </HStack>
                                        </Tag>
                                      </WrapItem>
                                    ))}

                                    {selectedCourses.length > 8 ? (
                                      <WrapItem>
                                        <Tag borderRadius="full" colorScheme="gray" px={3} py={2}>
                                          +{selectedCourses.length - 8} more
                                        </Tag>
                                      </WrapItem>
                                    ) : null}
                                  </Wrap>
                                ) : (
                                  <EmptyState
                                    icon={FiBookOpen}
                                    title="No courses selected"
                                    description="Select at least one course to continue."
                                  />
                                )}
                              </Box>

                              <Box>
                                <Text
                                  fontSize="xs"
                                  fontWeight="900"
                                  letterSpacing="0.08em"
                                  textTransform="uppercase"
                                  color="gray.500"
                                  mb={3}
                                >
                                  Selected Learners
                                </Text>

                                {selectedUsers.length ? (
                                  <Wrap spacing={2}>
                                    {selectedUsers.slice(0, 10).map((user) => (
                                      <WrapItem key={user._id}>
                                        <Tag
                                          size="lg"
                                          borderRadius="full"
                                          variant="subtle"
                                          colorScheme="green"
                                          pl={1}
                                          pr={3}
                                          py={1.5}
                                        >
                                          <Avatar
                                            size="xs"
                                            name={user.name || user.email}
                                            src={user.profilePicture}
                                            mr={2}
                                          />
                                          <TagLabel fontWeight="800" fontSize="sm">
                                            {user.name || user.email}
                                          </TagLabel>
                                          <TagCloseButton
                                            onClick={() => toggleUser(user)}
                                            ml={2}
                                          />
                                        </Tag>
                                      </WrapItem>
                                    ))}

                                    {selectedUsers.length > 10 ? (
                                      <WrapItem>
                                        <Tag borderRadius="full" colorScheme="gray" px={3} py={2}>
                                          +{selectedUsers.length - 10} more
                                        </Tag>
                                      </WrapItem>
                                    ) : null}
                                  </Wrap>
                                ) : (
                                  <EmptyState
                                    icon={FiUsers}
                                    title="No learners selected"
                                    description="Search and add learners to this batch."
                                  />
                                )}
                              </Box>
                            </Stack>
                          </Surface>
                        </Box>
                      </Grid>
                    ) : null}

                    {creationMode === "upload" && !isEditMode ? (
                      <Grid
                        templateColumns={{
                          base: "1fr",
                          xl: "minmax(0, 1fr) 420px",
                        }}
                        gap={5}
                        alignItems="start"
                      >
                        <Stack spacing={5}>
                          <Surface>
                            <Stack spacing={4}>
                              <SectionHeader
                                eyebrow="Spreadsheet Upload"
                                title="Upload and validate workbook"
                                description="Use one XLSX workbook with separate Courses and Users sheets."
                              />

                              <Alert
                                status="info"
                                borderRadius="16px"
                                alignItems="start"
                                bg="blue.50"
                                borderWidth="1px"
                                borderColor="blue.100"
                              >
                                <AlertIcon mt={1} color="blue.500" />
                                <Box>
                                  <AlertTitle fontSize="sm">Required workbook structure</AlertTitle>
                                  <AlertDescription fontSize="sm" mt={2} lineHeight="1.6">
                                    Add a <strong>Courses</strong> sheet with{" "}
                                    <strong>courseCode</strong>, and a{" "}
                                    <strong>Users</strong> sheet with{" "}
                                    <strong>email</strong>,{" "}
                                    <strong>employeeId</strong>,{" "}
                                    <strong>code</strong>, or{" "}
                                    <strong>userId</strong>.
                                  </AlertDescription>
                                </Box>
                              </Alert>

                              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                                <Box
                                  p={4}
                                  borderWidth="1px"
                                  borderColor="gray.200"
                                  borderRadius="16px"
                                  bg="gray.50"
                                >
                                  <Text
                                    fontSize="xs"
                                    fontWeight="900"
                                    letterSpacing="0.08em"
                                    textTransform="uppercase"
                                    color="gray.500"
                                    mb={2}
                                  >
                                    Sheet 1
                                  </Text>
                                  <Text color="gray.900" fontWeight="900" fontSize="sm">
                                    Courses
                                  </Text>
                                  <Text color="gray.500" fontSize="sm" mt={1}>
                                    Required column: <strong>courseCode</strong>
                                  </Text>
                                </Box>

                                <Box
                                  p={4}
                                  borderWidth="1px"
                                  borderColor="gray.200"
                                  borderRadius="16px"
                                  bg="gray.50"
                                >
                                  <Text
                                    fontSize="xs"
                                    fontWeight="900"
                                    letterSpacing="0.08em"
                                    textTransform="uppercase"
                                    color="gray.500"
                                    mb={2}
                                  >
                                    Sheet 2
                                  </Text>
                                  <Text color="gray.900" fontWeight="900" fontSize="sm">
                                    Users
                                  </Text>
                                  <Text color="gray.500" fontSize="sm" mt={1}>
                                    Use <strong>phone number</strong> or{" "}
                                    <strong>employeeId/code</strong>
                                  </Text>
                                </Box>
                              </SimpleGrid>

                              <Box
                                as="label"
                                htmlFor="batch-upload-file"
                                cursor="pointer"
                                display="block"
                                p={5}
                                bg={uploadFile ? "blue.50" : "gray.50"}
                                borderWidth="1px"
                                borderStyle="dashed"
                                borderColor={uploadFile ? "blue.300" : "gray.300"}
                                borderRadius="20px"
                                transition="all 0.18s ease"
                                _hover={{
                                  bg: uploadFile ? "blue.100" : "gray.100",
                                  borderColor: uploadFile ? "blue.400" : "gray.400",
                                }}
                              >
                                <Input
                                  id="batch-upload-file"
                                  type="file"
                                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                  display="none"
                                  onChange={(event) => {
                                    setUploadFile(event.target.files?.[0] || null);
                                    setUploadPreview(null);
                                  }}
                                />

                                <HStack justify="space-between" spacing={3}>
                                  <HStack spacing={3} minW={0}>
                                    <Flex
                                      align="center"
                                      justify="center"
                                      boxSize="44px"
                                      borderRadius="16px"
                                      bg="white"
                                      color="blue.600"
                                      flexShrink={0}
                                      boxShadow="sm"
                                    >
                                      <Icon as={FiUploadCloud} boxSize={5} />
                                    </Flex>

                                    <Box minW={0}>
                                      <Text
                                        fontSize="sm"
                                        fontWeight="900"
                                        color="gray.900"
                                        noOfLines={1}
                                      >
                                        {uploadFile
                                          ? uploadFile.name
                                          : "Choose Excel workbook (.xlsx)"}
                                      </Text>

                                      <Text fontSize="xs" color="gray.500" mt={0.5}>
                                        CSV and legacy .xls files are not supported.
                                      </Text>
                                    </Box>
                                  </HStack>

                                  <Badge
                                    colorScheme={uploadFile ? "blue" : "gray"}
                                    variant="subtle"
                                    borderRadius="full"
                                    px={3}
                                    py={1}
                                    textTransform="none"
                                  >
                                    Browse
                                  </Badge>
                                </HStack>
                              </Box>

                              <Button
                                colorScheme="blue"
                                variant="solid"
                                onClick={handleValidateUpload}
                                isDisabled={!uploadFile || !companyId || isCompanyInactive}
                                isLoading={batchStore.isPreviewSubmitting}
                                h="44px"
                                borderRadius="16px"
                              >
                                Validate Workbook
                              </Button>

                              {uploadPreview ? (
                                <Alert
                                  status={uploadPreview.summary.validRows ? "success" : "warning"}
                                  borderRadius="16px"
                                  alignItems="start"
                                  bg={uploadPreview.summary.validRows ? "green.50" : "orange.50"}
                                  borderWidth="1px"
                                  borderColor={
                                    uploadPreview.summary.validRows
                                      ? "green.100"
                                      : "orange.200"
                                  }
                                >
                                  <AlertIcon
                                    mt={1}
                                    color={
                                      uploadPreview.summary.validRows
                                        ? "green.500"
                                        : "orange.500"
                                    }
                                  />
                                  <Box>
                                    <AlertTitle fontSize="sm">Upload summary</AlertTitle>
                                    <AlertDescription fontSize="sm" mt={2} lineHeight="1.6">
                                      {uploadPreview.summary.validRows
                                        ? `Validated ${uploadPreview.summary.validCourseRows} course${
                                            uploadPreview.summary.validCourseRows === 1
                                              ? ""
                                              : "s"
                                          } and ${uploadPreview.summary.validUserRows} user${
                                            uploadPreview.summary.validUserRows === 1
                                              ? ""
                                              : "s"
                                          }. ${uploadPreview.summary.failedRows} issue${
                                            uploadPreview.summary.failedRows === 1 ? "" : "s"
                                          } found.`
                                        : "No valid courses or users were found in the uploaded workbook."}
                                    </AlertDescription>
                                  </Box>
                                </Alert>
                              ) : null}
                            </Stack>
                          </Surface>

                          {uploadPreview ? (
                            <Grid
                              templateColumns={{ base: "1fr", xl: "1fr 1fr" }}
                              gap={5}
                              alignItems="start"
                            >
                              <Surface>
                                <Stack spacing={4}>
                                  <SectionHeader
                                    eyebrow="Valid Courses"
                                    title={`Courses found (${uploadPreview.matchedCourses.length})`}
                                    description="These courses will be assigned to every learner in the batch."
                                  />

                                  {uploadPreview.matchedCourses.length ? (
                                    <Stack spacing={3} maxH="420px" overflowY="auto" pr={1}>
                                      {uploadPreview.matchedCourses.map((course) => (
                                        <Box
                                          key={course.courseId}
                                          borderWidth="1px"
                                          borderColor="gray.200"
                                          borderRadius="16px"
                                          p={4}
                                          bg="white"
                                        >
                                          <HStack justify="space-between" align="start" gap={3}>
                                            <Stack spacing={1} minW={0}>
                                              <Text fontWeight="900" color="gray.950">
                                                {course.title}
                                              </Text>
                                              <Badge
                                                alignSelf="start"
                                                colorScheme="blue"
                                                variant="subtle"
                                                borderRadius="full"
                                                px={2.5}
                                                py={1}
                                                textTransform="none"
                                              >
                                                {course.courseCode}
                                              </Badge>
                                            </Stack>

                                            <Icon
                                              as={FiCheckCircle}
                                              color="green.500"
                                              boxSize={5}
                                              flexShrink={0}
                                            />
                                          </HStack>
                                        </Box>
                                      ))}
                                    </Stack>
                                  ) : (
                                    <EmptyState
                                      icon={FiBookOpen}
                                      title="No valid courses"
                                      description="No courses from the workbook passed validation."
                                    />
                                  )}
                                </Stack>
                              </Surface>

                              <Surface>
                                <Stack spacing={4}>
                                  <SectionHeader
                                    eyebrow="Valid Learners"
                                    title={`Learners found (${uploadPreview.matchedUsers.length})`}
                                    description="These learners will be added to the batch."
                                  />

                                  {uploadPreview.matchedUsers.length ? (
                                    <Stack spacing={3} maxH="420px" overflowY="auto" pr={1}>
                                      {uploadPreview.matchedUsers.map((user) => (
                                        <HStack
                                          key={user._id}
                                          p={4}
                                          borderWidth="1px"
                                          borderColor="gray.200"
                                          borderRadius="16px"
                                          justify="space-between"
                                          align="start"
                                          gap={3}
                                          bg="white"
                                        >
                                          <HStack spacing={3} minW={0} align="start">
                                            <Avatar
                                              size="sm"
                                              name={user.name || user.mobileNumber || user.email || user.username}
                                            />

                                            <Stack spacing={1} minW={0}>
                                              <Text
                                                fontWeight="900"
                                                color="gray.950"
                                                noOfLines={1}
                                              >
                                                {user.name || user.mobileNumber || user.email || "Unnamed user"}
                                              </Text>

                                              <Text fontSize="sm" color="gray.500" noOfLines={1}>
                                                {user.mobileNumber ||
                                                  user.email ||
                                                  user.username ||
                                                  user.code ||
                                                  "No identifier available"}
                                              </Text>
                                            </Stack>
                                          </HStack>

                                          {user.code ? (
                                            <Badge
                                              colorScheme="blue"
                                              variant="subtle"
                                              borderRadius="full"
                                              px={2.5}
                                              py={1}
                                              textTransform="none"
                                            >
                                              {user.code}
                                            </Badge>
                                          ) : null}
                                        </HStack>
                                      ))}
                                    </Stack>
                                  ) : (
                                    <EmptyState
                                      icon={FiUsers}
                                      title="No valid learners"
                                      description="No users from the workbook passed validation."
                                    />
                                  )}
                                </Stack>
                              </Surface>
                            </Grid>
                          ) : null}
                        </Stack>

                        <Box position={{ xl: "sticky" }} top={{ xl: 5 }}>
                          <Surface>
                            <Stack spacing={5}>
                              <SectionHeader
                                eyebrow="Upload Review"
                                title="Final outcome"
                                description="Only valid rows will be used when creating the batch."
                              />

                              {uploadPreview ? (
                                <>
                                  <SimpleGrid columns={2} spacing={3}>
                                    <StatCard
                                      label="Courses"
                                      value={`${uploadPreview.courseCount}`}
                                      colorScheme="blue"
                                    />
                                    <StatCard
                                      label="Learners"
                                      value={`${uploadPreview.matchedCount}`}
                                      colorScheme="green"
                                    />
                                    <StatCard
                                      label="Failed"
                                      value={`${uploadPreview.failedCount}`}
                                      colorScheme={
                                        uploadPreview.failedCount ? "orange" : "gray"
                                      }
                                    />
                                    <StatCard
                                      label="Rows"
                                      value={`${uploadPreview.summary.totalRows}`}
                                      colorScheme="purple"
                                    />
                                  </SimpleGrid>

                                  <Alert
                                    status="info"
                                    borderRadius="16px"
                                    bg="gray.50"
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                  >
                                    <AlertIcon color="blue.500" />
                                    <Text fontSize="sm" lineHeight="1.6">
                                      This batch will be created with{" "}
                                      <strong>{uploadPreview.courseCount}</strong> course
                                      {uploadPreview.courseCount === 1 ? "" : "s"} and{" "}
                                      <strong>{uploadPreview.matchedCount}</strong> learner
                                      {uploadPreview.matchedCount === 1 ? "" : "s"}.
                                    </Text>
                                  </Alert>

                                  {uploadPreview.courseErrors.length ||
                                  uploadPreview.userErrors.length ? (
                                    <Stack spacing={4}>
                                      <Divider />

                                      <SectionHeader
                                        eyebrow="Issues"
                                        title={`Rows skipped (${uploadPreview.failedCount})`}
                                        description="Invalid entries are listed below and will not be included."
                                      />

                                      <Stack spacing={3} maxH="420px" overflowY="auto" pr={1}>
                                        {uploadPreview.courseErrors.map((entry, index) => (
                                          <Box
                                            key={`course-${entry.rowNumber || index}`}
                                            borderWidth="1px"
                                            borderColor="orange.200"
                                            borderRadius="16px"
                                            p={4}
                                            bg="orange.50"
                                          >
                                            <Stack spacing={1.5}>
                                              <HStack spacing={2} flexWrap="wrap">
                                                {entry.rowNumber ? (
                                                  <Badge
                                                    colorScheme="orange"
                                                    variant="subtle"
                                                    borderRadius="full"
                                                    px={2.5}
                                                    py={1}
                                                    textTransform="none"
                                                  >
                                                    Course row {entry.rowNumber}
                                                  </Badge>
                                                ) : null}
                                                {entry.courseCode ? (
                                                  <Badge
                                                    colorScheme="gray"
                                                    variant="subtle"
                                                    borderRadius="full"
                                                    px={2.5}
                                                    py={1}
                                                    textTransform="none"
                                                  >
                                                    {entry.courseCode}
                                                  </Badge>
                                                ) : null}
                                              </HStack>

                                              <Text fontWeight="900" color="orange.900">
                                                {entry.reason}
                                              </Text>
                                            </Stack>
                                          </Box>
                                        ))}

                                        {uploadPreview.userErrors.map((entry, index) => (
                                          <Box
                                            key={`user-${entry.rowNumber || index}`}
                                            borderWidth="1px"
                                            borderColor="orange.200"
                                            borderRadius="16px"
                                            p={4}
                                            bg="orange.50"
                                          >
                                            <Stack spacing={1.5}>
                                              <HStack spacing={2} flexWrap="wrap">
                                                {entry.rowNumber ? (
                                                  <Badge
                                                    colorScheme="orange"
                                                    variant="subtle"
                                                    borderRadius="full"
                                                    px={2.5}
                                                    py={1}
                                                    textTransform="none"
                                                  >
                                                    User row {entry.rowNumber}
                                                  </Badge>
                                                ) : null}
                                                {entry.phone ? (
                                                  <Badge
                                                    colorScheme="gray"
                                                    variant="subtle"
                                                    borderRadius="full"
                                                    px={2.5}
                                                    py={1}
                                                    textTransform="none"
                                                  >
                                                    {entry.phone}
                                                  </Badge>
                                                ) : null}
                                              </HStack>

                                              <Text fontWeight="900" color="orange.900">
                                                {entry.reason}
                                              </Text>
                                            </Stack>
                                          </Box>
                                        ))}
                                      </Stack>
                                    </Stack>
                                  ) : (
                                    <Alert status="success" borderRadius="16px">
                                      <AlertIcon />
                                      <Text fontSize="sm" fontWeight="700">
                                        No validation issues found.
                                      </Text>
                                    </Alert>
                                  )}
                                </>
                              ) : (
                                <EmptyState
                                  icon={FiFileText}
                                  title="No upload review yet"
                                  description="Upload and validate a workbook to see the final course and learner count."
                                />
                              )}
                            </Stack>
                          </Surface>
                        </Box>
                      </Grid>
                    ) : null}
                  </Stack>
                ) : null}
              </Stack>
            </SlideFade>
          </DrawerBody>

          <DrawerFooter
            borderTopWidth="1px"
            borderColor="gray.200"
            p={{ base: 4, md: 5 }}
            bg="white"
          >
            <Flex
              direction={{ base: "column-reverse", sm: "row" }}
              justify="space-between"
              align={{ base: "stretch", sm: "center" }}
              gap={3}
              w="full"
            >
              <Button
                h="44px"
                borderRadius="16px"
                variant="ghost"
                colorScheme="gray"
                onClick={() => (step === 0 ? handleClose() : setStep(0))}
              >
                {step === 0 ? "Cancel" : "Back to Details"}
              </Button>

              {step === 0 ? (
                <Button
                  h="44px"
                  borderRadius="16px"
                  colorScheme="blue"
                  onClick={() => setStep(1)}
                  isDisabled={!canContinueFromDetails}
                  px={8}
                >
                  Continue to Setup
                </Button>
              ) : (
                <Button
                  h="44px"
                  borderRadius="16px"
                  colorScheme="blue"
                  onClick={handleSubmit}
                  isLoading={batchStore.isSubmitting}
                  isDisabled={isSubmitDisabled}
                  px={8}
                  leftIcon={<Icon as={FiCheckCircle} />}
                >
                  {actionLabel}
                </Button>
              )}
            </Flex>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
);

export default BatchCreationModal;
