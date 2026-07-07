"use client";

import CustomInput from "@/app/component/config/component/customInput/CustomInput";
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
  GridItem,
  HStack,
  Icon,
  Image,
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
  Switch,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
  FiBook,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiSearch,
  FiShield,
  FiUploadCloud,
  FiUsers,
} from "react-icons/fi";

type AssignmentTarget = "company" | "department" | "users";

type AssignCourseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultCourseId?: string;
  fixedCompanyId?: string;
  onAssigned?: () => void | Promise<void>;
};

const STEPS = [
  { title: "Courses", description: "Select curriculum" },
  { title: "Scope", description: "Define audience" },
  { title: "Rules", description: "Set parameters" },
  { title: "Review", description: "Confirm & assign" },
];

const SURFACE_PROPS = {
  bg: "white",
  borderWidth: "1px",
  borderColor: "gray.200",
  borderRadius: "18px",
  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
};

const focusRing = {
  borderColor: "blue.500",
  boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
};

function getDefaultTarget(role: string): AssignmentTarget {
  return role === "departmenthead" ? "users" : "company";
}

function formatDate(value?: string | null) {
  if (!value) return "No expiry";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "No expiry"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const SectionHeader = ({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) => (
  <Stack spacing={1.5} minW={0}>
    {eyebrow ? (
      <Text color="blue.600" fontSize="xs" fontWeight="800" letterSpacing="0.08em" textTransform="uppercase">
        {eyebrow}
      </Text>
    ) : null}
    <Text color="gray.950" fontSize={{ base: "lg", md: "xl" }} fontWeight="800" letterSpacing="-0.03em" lineHeight="1.15">
      {title}
    </Text>
    {description ? (
      <Text color="gray.500" fontSize="sm" lineHeight="1.6">
        {description}
      </Text>
    ) : null}
  </Stack>
);

const EmptyState = ({ icon, title, description }: { icon: any; title: string; description: string }) => (
  <Flex
    align="center"
    justify="center"
    minH="190px"
    p={{ base: 4, md: 5 }}
    textAlign="center"
    bg="white"
    borderWidth="1px"
    borderStyle="dashed"
    borderColor="gray.300"
    borderRadius="14px"
  >
    <Stack align="center" spacing={3} maxW="360px">
      <Flex align="center" justify="center" boxSize="38px" bg="gray.50" borderRadius="14px" color="gray.400">
        <Icon as={icon} boxSize={5} />
      </Flex>
      <Text color="gray.900" fontWeight="700">
        {title}
      </Text>
      <Text color="gray.500" fontSize="sm" lineHeight="1.6">
        {description}
      </Text>
    </Stack>
  </Flex>
);

const InteractiveCourseCard = ({ course, isSelected, onClick }: any) => {
  const category = course.taxonomy?.categories?.[0] || "General";
  const level = course.taxonomy?.level || "All levels";
  const modules = course.curriculum?.totalModules || 0;
  const imageSrc = course.thumbnailUrl && course.thumbnailUrl.startsWith("blob:") ? course.thumbnailUrl : course.thumbnailUrl || "https://via.placeholder.com/300x220";

  return (
    <Box
      as="button"
      type="button"
      w="full"
      h="full"
      textAlign="left"
      onClick={onClick}
      borderWidth="1px"
      borderColor={isSelected ? "blue.400" : "gray.200"}
      bg={isSelected ? "blue.50" : "white"}
      borderRadius="14px"
      overflow="hidden"
      cursor="pointer"
      transition="all 0.18s ease"
      position="relative"
      boxShadow={isSelected ? "0 10px 24px rgba(37, 99, 235, 0.10)" : "0 1px 2px rgba(16, 24, 40, 0.04)"}
      _hover={{ borderColor: isSelected ? "blue.500" : "gray.300", transform: "translateY(-1px)", boxShadow: "0 10px 24px rgba(15, 23, 42, 0.07)" }}
      _focusVisible={focusRing}
    >
      <Flex direction={{ base: "column", sm: "row" }} minH={{ base: "auto", sm: "116px" }}>
        <Box w={{ base: "full", sm: "124px" }} h={{ base: "128px", sm: "auto" }} flexShrink={0} position="relative" bg="gray.100">
          <Image src={imageSrc} alt={course.title || "Course thumbnail"} objectFit="cover" w="full" h="full" />
          <Box position="absolute" inset={0} bgGradient="linear(to-t, blackAlpha.300, transparent 55%)" />
        </Box>

        <Stack flex="1" justify="space-between" spacing={3} p={4} minW={0}>
          <Stack spacing={2.5} minW={0}>
            <HStack align="start" justify="space-between" spacing={3}>
              <Text color="gray.950" fontWeight="800" fontSize="sm" lineHeight="1.35" noOfLines={2} pr={isSelected ? 8 : 0}>
                {course.title || "Untitled Course"}
              </Text>
              {isSelected ? (
                <Flex align="center" justify="center" boxSize="24px" borderRadius="full" bg="blue.500" color="white" flexShrink={0}>
                  <Icon as={FiCheck} boxSize={3.5} />
                </Flex>
              ) : null}
            </HStack>

            <HStack spacing={2} flexWrap="wrap">
              <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={2.5} py={1} textTransform="none" fontSize="2xs">
                {category}
              </Badge>
              <Badge colorScheme={level === "Beginner" ? "green" : level === "Advanced" ? "red" : "blue"} variant="subtle" borderRadius="full" px={2.5} py={1} textTransform="none" fontSize="2xs">
                {level}
              </Badge>
            </HStack>
          </Stack>

          <HStack spacing={3} color="gray.500" fontSize="xs" fontWeight="600">
            <HStack spacing={1.5}>
              <Icon as={FiLayers} />
              <Text>{modules} module{modules !== 1 ? "s" : ""}</Text>
            </HStack>
            <HStack spacing={1.5}>
              <Icon as={FiClock} />
              <Text>{course.progression?.certificateEnabled ? "Certificate" : "No certificate"}</Text>
            </HStack>
          </HStack>
        </Stack>
      </Flex>
    </Box>
  );
};

const TargetCard = ({ isSelected, onClick, title, description, icon }: any) => (
  <Box
    as="button"
    type="button"
    w="full"
    h="full"
    textAlign="left"
    p={4}
    borderWidth="1px"
    borderColor={isSelected ? "blue.400" : "gray.200"}
    bg={isSelected ? "blue.50" : "white"}
    borderRadius="14px"
    cursor="pointer"
    onClick={onClick}
    transition="all 0.18s ease"
    boxShadow={isSelected ? "0 8px 20px rgba(37, 99, 235, 0.10)" : "0 1px 2px rgba(16, 24, 40, 0.04)"}
    _hover={{ borderColor: isSelected ? "blue.500" : "gray.300", transform: "translateY(-1px)", boxShadow: "0 10px 22px rgba(15, 23, 42, 0.06)" }}
    _focusVisible={focusRing}
  >
    <Stack spacing={3} h="full" justify="space-between">
      <HStack align="start" justify="space-between" spacing={3}>
        <Flex align="center" justify="center" boxSize="38px" bg={isSelected ? "blue.500" : "gray.50"} color={isSelected ? "white" : "gray.600"} borderRadius="13px" flexShrink={0}>
          <Icon as={icon} boxSize={5} />
        </Flex>
        <Flex align="center" justify="center" boxSize="24px" borderRadius="full" borderWidth="1px" borderColor={isSelected ? "blue.500" : "gray.300"} bg={isSelected ? "blue.500" : "white"} color="white" flexShrink={0}>
          {isSelected ? <Icon as={FiCheck} boxSize={3.5} /> : null}
        </Flex>
      </HStack>

      <Stack spacing={1.5}>
        <Text fontWeight="800" color={isSelected ? "blue.900" : "gray.950"} fontSize="sm" lineHeight="1.3">
          {title}
        </Text>
        <Text fontSize="xs" color="gray.500" lineHeight="1.5">
          {description}
        </Text>
      </Stack>
    </Stack>
  </Box>
);

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <Box p={4} borderWidth="1px" borderColor="gray.200" borderRadius="14px" bg="gray.50">
    <Text fontSize="xs" textTransform="uppercase" fontWeight="800" color="gray.500" letterSpacing="0.08em" mb={2}>
      {label}
    </Text>
    <Text fontWeight="800" fontSize="md" color="gray.950" noOfLines={2} lineHeight="1.3">
      {value}
    </Text>
  </Box>
);

const AssignCourseModal = observer(
  ({ isOpen, onClose, defaultCourseId = "", fixedCompanyId = "", onAssigned }: AssignCourseModalProps) => {
    const toast = useToast();
    const { auth, companyStore } = stores;
    const role = String(auth.userType || auth.user?.role || "").toLowerCase();
    const isSuperadmin = role === "superadmin";
    const isDepartmentHead = role === "departmenthead";

    const [step, setStep] = useState(0);
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(defaultCourseId ? [defaultCourseId] : []);
    const [courseSearch, setCourseSearch] = useState("");
    const [assignmentTarget, setAssignmentTarget] = useState<AssignmentTarget>(getDefaultTarget(role));
    const [companyId, setCompanyId] = useState(fixedCompanyId || companyStore.getActiveCompanyId());
    const [departmentName, setDepartmentName] = useState("");
    const [allowFurtherAssignment, setAllowFurtherAssignment] = useState(true);
    const [noExpiry, setNoExpiry] = useState(true);
    const [validTill, setValidTill] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [userResults, setUserResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvPreview, setCsvPreview] = useState<{
      fileName: string;
      matchedUsers: any[];
      failedEntries: any[];
    } | null>(null);
    const [assessmentCriteriaByCourse, setAssessmentCriteriaByCourse] = useState<Record<string, { passingMarks: string }>>({});

    const companies = companyStore.companies.data || [];
    const selectedCompany = companies.find((company: any) => company._id === companyId) || auth.user?.companyDetails || null;
    const departments = selectedCompany?.departments || auth.user?.companyDetails?.departments || [];
    const isCompanyInactive = Boolean(companyId && selectedCompany?.is_active === false);
    const companyRestrictionMessage = `${selectedCompany?.company_name || "This company"} is inactive. New course assignments are disabled until the company is reactivated.`;

    const availableCourses = useMemo(() => {
      let courses = isSuperadmin ? courseStore.courses || [] : [...(courseStore.courses || []), ...(courseStore.accessibleCourses || []).filter((c) => c.access?.canAssign)];
      // Deduplicate by course._id
      courses = Array.from(new Map(courses.map(c => [c._id, c])).values());
      if (courseSearch.trim()) {
        const query = courseSearch.toLowerCase();
        courses = courses.filter((c: any) => c.title?.toLowerCase().includes(query) || c.taxonomy?.categories?.some((cat: string) => cat.toLowerCase().includes(query)));
      }
      return courses;
    }, [isSuperadmin, courseSearch, courseStore.courses, courseStore.accessibleCourses]);

    const selectedCourses = useMemo(() => {
      const courseMap = new Map(availableCourses.map((course) => [course._id, course]));
      return selectedCourseIds.map((courseId) => courseMap.get(courseId)).filter(Boolean);
    }, [availableCourses, selectedCourseIds]);

    const combinedSelectedUsers = useMemo(
      () => Array.from(new Map([...selectedUsers, ...(csvPreview?.matchedUsers || [])].map((user: any) => [user._id, user])).values()),
      [csvPreview?.matchedUsers, selectedUsers]
    );

    const companyOptions = useMemo(() => companies.map((c: any) => ({ value: c._id, label: c.company_name })), [companies]);
    const departmentOptions = useMemo(() => departments.map((d: string) => ({ value: d, label: d })), [departments]);

    const selectedCompanyOption = companyOptions.find((o) => o.value === companyId) || null;
    const selectedDepartmentOption = departmentOptions.find((o) => o.value === departmentName) || null;

    useEffect(() => {
      if (!isOpen) return;
      courseStore.fetchCourses().catch(() => undefined);
      courseStore.fetchAccessibleCourses().catch(() => undefined);
      if (isSuperadmin && !companyStore.companies.data?.length) {
        companyStore.getManagedCompanies().catch(() => undefined);
      }
    }, [companyStore, isOpen, isSuperadmin]);

    useEffect(() => {
      if (!isOpen) return;
      setStep(0);
      setSelectedCourseIds(defaultCourseId ? [defaultCourseId] : []);
      setCourseSearch("");
      setCompanyId(fixedCompanyId || companyStore.getActiveCompanyId());
      setAssignmentTarget(getDefaultTarget(role));
      setDepartmentName("");
      setAllowFurtherAssignment(true);
      setNoExpiry(true);
      setValidTill("");
      setUserSearch("");
      setUserResults([]);
      setSelectedUsers([]);
      setCsvFile(null);
      setCsvPreview(null);
      setAssessmentCriteriaByCourse({});
    }, [companyStore, defaultCourseId, fixedCompanyId, isOpen, role]);

    useEffect(() => {
      if (!isOpen || assignmentTarget !== "users" || !companyId) {
        setUserResults([]);
        return;
      }
      const timeoutId = setTimeout(async () => {
        if (!userSearch.trim()) {
          setUserResults([]);
          return;
        }
        try {
          const response = await auth.getCompanyUsers({ searchValue: userSearch.trim(), companyId });
          setUserResults(response || []);
        } catch (error) {
          setUserResults([]);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }, [assignmentTarget, auth, companyId, isOpen, userSearch]);

    useEffect(() => {
      setDepartmentName("");
      setUserSearch("");
      setUserResults([]);
      setSelectedUsers([]);
      setCsvFile(null);
      setCsvPreview(null);
    }, [assignmentTarget, companyId]);

    useEffect(() => {
      setAssessmentCriteriaByCourse((current) => {
        const next = { ...current };
        let changed = false;

        selectedCourses.forEach((course: any) => {
          if (!next[course._id]) {
            next[course._id] = { passingMarks: course?.assessment?.passingMarks != null ? String(course.assessment.passingMarks) : "" };
            changed = true;
          }
        });

        Object.keys(next).forEach((courseId) => {
          if (!selectedCourseIds.includes(courseId)) {
            delete next[courseId];
            changed = true;
          }
        });

        return changed ? next : current;
      });
    }, [selectedCourseIds, selectedCourses]);

    const canContinue = useMemo(() => {
      if (step === 0) return selectedCourseIds.length > 0;
      if (step === 1) {
        if (!companyId) return false;
        if (isCompanyInactive) return false;
        if (assignmentTarget === "department") return Boolean(departmentName);
        return true;
      }
      if (step === 2) {
        if (isCompanyInactive) return false;
        const hasValidCriteria = selectedCourses.every((course: any) => {
          const totalMarks = Number(course?.assessment?.totalMarks);
          if (!Number.isFinite(totalMarks)) return true;

          const passingMarks = assessmentCriteriaByCourse[course._id]?.passingMarks?.trim();
          if (!passingMarks) return false;

          const numericPassingMarks = Number(passingMarks);
          return Number.isFinite(numericPassingMarks) && numericPassingMarks >= 0 && numericPassingMarks <= totalMarks;
        });

        return (noExpiry || Boolean(validTill)) && hasValidCriteria;
      }
      if (isCompanyInactive) return false;
      if (assignmentTarget === "users") return combinedSelectedUsers.length > 0;
      return true;
    }, [assessmentCriteriaByCourse, assignmentTarget, combinedSelectedUsers.length, companyId, departmentName, isCompanyInactive, noExpiry, selectedCourseIds.length, selectedCourses, step, validTill]);

    const toggleSelectedCourse = (courseId: string) => {
      setSelectedCourseIds((current) => (current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId]));
    };

    const toggleSelectedUser = (user: any) => {
      setSelectedUsers((current) => {
        const exists = current.some((item) => item._id === user._id);
        if (exists) return current.filter((item) => item._id !== user._id);
        return [...current, user];
      });
    };

    const handlePreviewCsv = async () => {
      if (!csvFile) return;

      if (isCompanyInactive) {
        toast({
          title: "Company is inactive",
          description: companyRestrictionMessage,
          status: "warning",
          duration: 4500,
          position: "top-right",
          isClosable: true,
        });
        return;
      }

      try {
        const response = await courseStore.previewAssignmentUsers({ file: csvFile, companyId });

        setCsvPreview({
          fileName: response?.data?.fileName || csvFile.name,
          matchedUsers: response?.data?.matchedUsers || [],
          failedEntries: response?.data?.failedEntries || [],
        });

        toast({
          title: "File validated",
          description: `${response?.data?.matchedCount || 0} learner${response?.data?.matchedCount === 1 ? "" : "s"} matched from the uploaded spreadsheet.`,
          status: "success",
          duration: 3500,
          position: "top-right",
          isClosable: true,
        });
      } catch (err: any) {
        setCsvPreview(null);
        toast({
          title: "File validation failed",
          description: err?.message || err?.error || "Unable to validate the uploaded spreadsheet.",
          status: "error",
          duration: 4500,
          position: "top-right",
          isClosable: true,
        });
      }
    };

    const handleClose = () => {
      setStep(0);
      onClose();
    };

    const handleSubmit = async () => {
      if (!canContinue) return;
      if (isCompanyInactive) {
        toast({
          title: "Company is inactive",
          description: companyRestrictionMessage,
          status: "warning",
          duration: 4500,
          position: "top-right",
          isClosable: true,
        });
        return;
      }
      try {
        const response = await courseStore.assignMultipleCourses({
          courseIds: selectedCourseIds,
          assignmentType: assignmentTarget,
          companyId,
          departmentName: assignmentTarget === "department" ? departmentName : undefined,
          userIds: assignmentTarget === "users" ? combinedSelectedUsers.map((u: any) => u._id) : undefined,
          validFrom: new Date().toISOString(),
          validTill: noExpiry ? null : new Date(validTill).toISOString(),
          assessmentCriteriaByCourse: Object.fromEntries(
            selectedCourseIds.map((courseId) => [
              courseId,
              {
                passingMarks: assessmentCriteriaByCourse[courseId]?.passingMarks ? Number(assessmentCriteriaByCourse[courseId].passingMarks) : null,
              },
            ])
          ),
          allowFurtherAssignment,
        });

        toast({
          title: "Assignment successful",
          description: response?.message || "Courses have been distributed to the selected audience.",
          status: "success",
          duration: 4000,
          position: "top-right",
          isClosable: true,
        });

        if (onAssigned) await onAssigned();
        handleClose();
      } catch (err: any) {
        toast({
          title: "Assignment failed",
          description: err?.message || err?.error || "An error occurred while creating the assignment.",
          status: "error",
          duration: 4500,
          position: "top-right",
          isClosable: true,
        });
      }
    };

    return (
      <Drawer isOpen={isOpen} placement="right" size="xl" onClose={handleClose}>
        <DrawerOverlay backdropFilter="blur(6px)" bg="blackAlpha.500" />
        <DrawerContent maxW={{ base: "full", lg: "820px", xl: "70vw" }} bg="gray.50" boxShadow="2xl" borderLeftRadius={{ base: 0, lg: "22px" }} overflow="hidden">
          <DrawerCloseButton top={{ base: 3, md: 4 }} right={{ base: 3, md: 4 }} size="md" color="gray.500" borderRadius="full" _hover={{ bg: "gray.100", color: "gray.900" }} />

          <DrawerHeader bg="white" borderBottomWidth="1px" borderColor="gray.200" px={{ base: 4, md: 6, xl: 7 }} py={{ base: 4, md: 5 }}>
            <Stack spacing={{ base: 4, md: 5 }} pr={{ base: 10, md: 12 }}>
              <Flex direction={{ base: "column", md: "row" }} align={{ base: "start", md: "center" }} justify="space-between" gap={3}>
                <HStack spacing={3} align="center">
                  <Flex align="center" justify="center" boxSize={{ base: "40px", md: "46px" }} borderRadius="14px" bg="blue.50" color="blue.600">
                    <Icon as={FiBook} boxSize={{ base: 5, md: 6 }} />
                  </Flex>
                  <Box>
                    <Text color="gray.950" fontSize={{ base: "lg", md: "xl" }} fontWeight="900" letterSpacing="-0.04em" lineHeight="1.15">
                      Assign Courses
                    </Text>
                    <Text color="gray.500" fontSize="sm" mt={1} lineHeight="1.6">
                      Configure curriculum, audience, access rules, and final review in one streamlined flow.
                    </Text>
                  </Box>
                </HStack>

                <HStack spacing={2} alignSelf={{ base: "stretch", md: "center" }} justify={{ base: "space-between", md: "flex-end" }}>
                  <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={3} py={1.5} textTransform="none">
                    Step {step + 1} of {STEPS.length}
                  </Badge>
                  {selectedCourseIds.length ? (
                    <Badge colorScheme="green" variant="subtle" borderRadius="full" px={3} py={1.5} textTransform="none">
                      {selectedCourseIds.length} selected
                    </Badge>
                  ) : null}
                </HStack>
              </Flex>

              <Stepper index={step} size="sm" colorScheme="blue" gap={0} w="full">
                {STEPS.map((item, index) => (
                  <Step key={item.title}>
                    <StepIndicator borderColor={step >= index ? "blue.500" : "gray.300"} bg={step >= index ? "blue.500" : "white"} color={step >= index ? "white" : "gray.500"}>
                      <StepStatus complete={<Icon as={FiCheck} boxSize={3.5} />} incomplete={<StepNumber />} active={<StepNumber />} />
                    </StepIndicator>
                    <Box flexShrink="0" display={{ base: "none", md: "block" }}>
                      <StepTitle color={step === index ? "gray.950" : "gray.600"} fontWeight={step === index ? "800" : "600"}>
                        {item.title}
                      </StepTitle>
                      <StepDescription color="gray.500" fontSize="xs">
                        {item.description}
                      </StepDescription>
                    </Box>
                    <StepSeparator />
                  </Step>
                ))}
              </Stepper>
            </Stack>
          </DrawerHeader>

          <DrawerBody px={{ base: 4, md: 6, xl: 7 }} py={{ base: 4, md: 5 }} bg="gray.50" overflowY="auto">
            <SlideFade in key={step} offsetY="16px">
              <Stack spacing={{ base: 4, md: 5 }}>
                {isCompanyInactive && companyId ? (
                  <Alert status="warning" borderRadius="16px" bg="orange.50" color="orange.900" borderWidth="1px" borderColor="orange.200" alignItems="start">
                    <AlertIcon color="orange.500" mt={1} />
                    <Box>
                      <AlertTitle fontSize="sm">Company is inactive</AlertTitle>
                      <AlertDescription fontSize="sm" mt={1} lineHeight="1.6">
                        {companyRestrictionMessage}
                      </AlertDescription>
                    </Box>
                  </Alert>
                ) : null}
                {!companyId && isSuperadmin && step > 0 && (
                  <Alert status="warning" borderRadius="16px" bg="orange.50" color="orange.900" borderWidth="1px" borderColor="orange.200" alignItems="start">
                    <AlertIcon color="orange.500" mt={1} />
                    <Box>
                      <AlertTitle fontSize="sm">Company selection required</AlertTitle>
                      <AlertDescription fontSize="sm" mt={1} lineHeight="1.6">
                        Select a company before defining the audience or rules.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {step === 0 && (
                  <Stack spacing={3}>
                    <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "end" }} gap={3}>
                      <SectionHeader eyebrow="Curriculum" title="Choose the courses to assign" description="Search and select one or more courses. Selected courses stay highlighted for easy scanning." />
                      <InputGroup maxW={{ base: "full", md: "340px" }}>
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FiSearch} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          placeholder="Search courses"
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          bg="white"
                          borderRadius="13px"
                          borderColor="gray.200"
                          h="42px"
                          _focus={focusRing}
                        />
                      </InputGroup>
                    </Flex>

                    {availableCourses.length === 0 ? (
                      <EmptyState icon={FiBook} title="No courses found" description="Try another keyword or confirm that assignable courses are available for this organization." />
                    ) : (
                      <Grid templateColumns={{ base: "1fr", xl: "repeat(2, minmax(0, 1fr))" }} gap={3}>
                        {availableCourses.map((course) => (
                          <GridItem key={course._id} minW={0}>
                            <InteractiveCourseCard course={course} isSelected={selectedCourseIds.includes(course._id)} onClick={() => toggleSelectedCourse(course._id)} />
                          </GridItem>
                        ))}
                      </Grid>
                    )}
                  </Stack>
                )}

                {step === 1 && (
                  <Stack spacing={3}>
                    <Box {...SURFACE_PROPS} p={{ base: 4, md: 5 }}>
                      <Stack spacing={5}>
                        <SectionHeader eyebrow="Organization" title="Target organization" description="Verify where this assignment should be created before choosing the audience." />

                        {isSuperadmin ? (
                          <Box maxW="520px">
                            <CustomInput
                              type="select"
                              name="assignment-company"
                              placeholder="Select a company"
                              value={selectedCompanyOption}
                              options={companyOptions}
                              onChange={(option: any) => setCompanyId(option?.value || "")}
                              isSearchable
                              isPortal
                              disabled={Boolean(fixedCompanyId)}
                            />
                          </Box>
                        ) : (
                          <Flex display="inline-flex" align="center" gap={3} p={4} bg="gray.50" borderRadius="14px" borderWidth="1px" borderColor="gray.200" maxW="max-content">
                            <Avatar size="md" name={selectedCompany?.company_name} bg="blue.500" color="white" />
                            <Box>
                              <Text fontSize="xs" textTransform="uppercase" fontWeight="800" color="gray.500" letterSpacing="0.08em">
                                Current organization
                              </Text>
                              <Text fontWeight="800" color="gray.950" fontSize="lg" lineHeight="1.3">
                                {selectedCompany?.company_name || "N/A"}
                              </Text>
                            </Box>
                          </Flex>
                        )}
                      </Stack>
                    </Box>

                    <Stack spacing={3}>
                      <SectionHeader eyebrow="Audience" title="Choose who receives the courses" description="Select the cleanest assignment scope. You can narrow to a department or hand-pick users if needed." />
                      <SimpleGrid columns={{ base: 1, md: isDepartmentHead ? 2 : 3 }} spacing={3}>
                        {!isDepartmentHead && (
                          <TargetCard
                            icon={FiBriefcase}
                            title="Entire company"
                            description="Assign to all current learners in the organization."
                            isSelected={assignmentTarget === "company"}
                            onClick={() => setAssignmentTarget("company")}
                          />
                        )}
                        <TargetCard
                          icon={FiLayers}
                          title="Specific department"
                          description="Send the courses to one defined team or department."
                          isSelected={assignmentTarget === "department"}
                          onClick={() => setAssignmentTarget("department")}
                        />
                        <TargetCard
                          icon={FiUsers}
                          title="Individual users"
                          description="Pick learners manually or validate them from a file."
                          isSelected={assignmentTarget === "users"}
                          onClick={() => setAssignmentTarget("users")}
                        />
                      </SimpleGrid>
                    </Stack>

                    {assignmentTarget === "department" && (
                      <Box {...SURFACE_PROPS} p={{ base: 4, md: 5 }}>
                        <Stack spacing={3}>
                          <SectionHeader title="Select department" description="Choose the department that should receive the selected courses." />
                          <Box maxW="520px">
                            <CustomInput
                              type="select"
                              name="assignment-department"
                              placeholder="Choose department"
                              value={selectedDepartmentOption}
                              options={departmentOptions}
                              onChange={(option: any) => setDepartmentName(option?.value || "")}
                              isSearchable
                              isPortal
                            />
                          </Box>
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                )}

                {step === 2 && (
                  <Stack spacing={5}>
                    <Box {...SURFACE_PROPS} p={{ base: 4, md: 5 }}>
                      <Stack spacing={5}>
                        <SectionHeader eyebrow="Rules" title="Passing criteria" description="Set the passing score for each selected course. Scores must stay within the configured total marks." />
                        <Stack spacing={3}>
                          {selectedCourses.map((course: any) => {
                            const totalMarks = Number(course?.assessment?.totalMarks);
                            const hasTotalMarks = Number.isFinite(totalMarks);

                            return (
                              <Box key={course._id} borderWidth="1px" borderColor="gray.200" borderRadius="14px" p={{ base: 4, md: 5 }} bg="gray.50">
                                <Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} justify="space-between" gap={3}>
                                  <Stack spacing={1} flex="1" minW={0}>
                                    <Text fontWeight="800" color="gray.950" noOfLines={2}>
                                      {course.title}
                                    </Text>
                                    <Text color="gray.500" fontSize="sm">
                                      {hasTotalMarks ? `Total marks: ${totalMarks}` : "No total marks configured for this course yet."}
                                    </Text>
                                  </Stack>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={hasTotalMarks ? totalMarks : undefined}
                                    value={assessmentCriteriaByCourse[course._id]?.passingMarks || ""}
                                    onChange={(event) =>
                                      setAssessmentCriteriaByCourse((current) => ({
                                        ...current,
                                        [course._id]: { passingMarks: event.target.value },
                                      }))
                                    }
                                    placeholder={hasTotalMarks ? `Passing marks / ${totalMarks}` : "Not available"}
                                    isDisabled={!hasTotalMarks}
                                    bg="white"
                                    borderRadius="14px"
                                    borderColor="gray.200"
                                    h="42px"
                                    maxW={{ base: "full", md: "240px" }}
                                    _focus={focusRing}
                                  />
                                </Flex>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Stack>
                    </Box>

                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                      <Box {...SURFACE_PROPS} p={{ base: 4, md: 5 }}>
                        <Flex justify="space-between" align="start" gap={3}>
                          <HStack align="start" spacing={3}>
                            <Flex align="center" justify="center" boxSize="38px" borderRadius="13px" bg="green.50" color="green.600" flexShrink={0}>
                              <Icon as={FiCalendar} boxSize={5} />
                            </Flex>
                            <Stack spacing={1.5}>
                              <Text fontWeight="800" fontSize="md" color="gray.950">
                                Lifetime access
                              </Text>
                              <Text color="gray.500" fontSize="sm" lineHeight="1.6">
                                Keep access open forever, or turn this off to set an expiry date.
                              </Text>
                            </Stack>
                          </HStack>
                          <Switch colorScheme="blue" size="lg" isChecked={noExpiry} onChange={(e) => setNoExpiry(e.target.checked)} />
                        </Flex>

                        {!noExpiry && (
                          <SlideFade in offsetY="-8px">
                            <Divider my={5} />
                            <Box maxW="320px">
                              <CustomInput
                                type="date"
                                name="assignment-valid-till"
                                label="Expiration date"
                                value={validTill}
                                minDate={new Date().toISOString().split("T")[0]}
                                onChange={(event: any) => setValidTill(event.target.value)}
                              />
                            </Box>
                          </SlideFade>
                        )}
                      </Box>

                      <Box {...SURFACE_PROPS} p={{ base: 4, md: 5 }}>
                        <Flex justify="space-between" align="start" gap={3}>
                          <HStack align="start" spacing={3}>
                            <Flex align="center" justify="center" boxSize="38px" borderRadius="13px" bg="blue.50" color="blue.600" flexShrink={0}>
                              <Icon as={FiShield} boxSize={5} />
                            </Flex>
                            <Stack spacing={1.5}>
                              <Text fontWeight="800" fontSize="md" color="gray.950">
                                Downstream assignment
                              </Text>
                              <Text color="gray.500" fontSize="sm" lineHeight="1.6">
                                Allow sub-managers or department heads to redistribute these courses to their teams.
                              </Text>
                            </Stack>
                          </HStack>
                          <Switch colorScheme="blue" size="lg" isChecked={allowFurtherAssignment} onChange={(e) => setAllowFurtherAssignment(e.target.checked)} />
                        </Flex>
                      </Box>
                    </SimpleGrid>
                  </Stack>
                )}

                {step === 3 && (
                  <Stack spacing={3}>
                    {assignmentTarget === "users" && (
                      <Grid templateColumns={{ base: "1fr", xl: "340px minmax(0, 1fr)" }} gap={3} alignItems="start">
                        <Stack spacing={5}>
                          <Box {...SURFACE_PROPS} p={{ base: 4, md: 5 }}>
                            <Stack spacing={3}>
                              <SectionHeader eyebrow="Learners" title="Find learners" description="Search the company directory and add learners to the assignment list." />
                              <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                  <Icon as={FiSearch} color="gray.400" />
                                </InputLeftElement>
                                <Input
                                  value={userSearch}
                                  onChange={(event) => setUserSearch(event.target.value)}
                                  placeholder="Name or email"
                                  bg="white"
                                  borderRadius="13px"
                                  borderColor="gray.200"
                                  h="42px"
                                  _focus={focusRing}
                                />
                              </InputGroup>

                              <Box bg="white" borderRadius="14px" borderWidth="1px" borderColor="gray.200" overflow="hidden" maxH="340px" overflowY="auto">
                                {userResults.length === 0 ? (
                                  <Box p={6} textAlign="center">
                                    <Text color="gray.400" fontSize="sm">
                                      Search results will appear here.
                                    </Text>
                                  </Box>
                                ) : (
                                  <VStack align="stretch" spacing={0} divider={<Divider />}>
                                    {userResults.map((row: any) => {
                                      const user = row.user || row;
                                      const isSelected = selectedUsers.some((item) => item._id === user._id);
                                      return (
                                        <HStack
                                          key={user._id}
                                          p={3.5}
                                          cursor="pointer"
                                          bg={isSelected ? "blue.50" : "white"}
                                          _hover={{ bg: isSelected ? "blue.100" : "gray.50" }}
                                          onClick={() => toggleSelectedUser(user)}
                                          justify="space-between"
                                          transition="background 0.15s ease"
                                        >
                                          <HStack spacing={3} minW={0}>
                                            <Avatar size="sm" name={user.name || user.email} src={user.profilePicture} />
                                            <Box minW={0}>
                                              <Text fontSize="sm" fontWeight="700" color="gray.950" noOfLines={1}>
                                                {user.name || "Unnamed user"}
                                              </Text>
                                              <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                                {user.email || user.username}
                                              </Text>
                                            </Box>
                                          </HStack>
                                          {isSelected ? <Icon as={FiCheckCircle} color="blue.500" flexShrink={0} /> : null}
                                        </HStack>
                                      );
                                    })}
                                  </VStack>
                                )}
                              </Box>
                            </Stack>
                          </Box>

                          <Box {...SURFACE_PROPS} p={{ base: 4, md: 5 }}>
                            <Stack spacing={3}>
                              <HStack align="start" spacing={3}>
                                <Flex align="center" justify="center" boxSize="40px" borderRadius="14px" bg="purple.50" color="purple.600" flexShrink={0}>
                                  <Icon as={FiUploadCloud} boxSize={5} />
                                </Flex>
                                <Box>
                                  <Text fontWeight="800" color="gray.950">
                                    Upload spreadsheet
                                  </Text>
                                  <Text color="gray.500" fontSize="sm" mt={1} lineHeight="1.6">
                                    Upload CSV or Excel with user phone numbers or employee IDs.
                                  </Text>
                                </Box>
                              </HStack>
                              <Box
                                as="label"
                                htmlFor="assignment-csv-file"
                                cursor="pointer"
                                display="block"
                                p={3}
                                bg={csvFile ? "blue.50" : "gray.50"}
                                borderWidth="1px"
                                borderStyle="dashed"
                                borderColor={csvFile ? "blue.300" : "gray.300"}
                                borderRadius="16px"
                                transition="all 0.18s ease"
                                _hover={{ bg: csvFile ? "blue.100" : "gray.100", borderColor: csvFile ? "blue.400" : "gray.400" }}
                              >
                                <Input
                                  id="assignment-csv-file"
                                  type="file"
                                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                  display="none"
                                  onChange={(event) => {
                                    setCsvFile(event.target.files?.[0] || null);
                                    setCsvPreview(null);
                                  }}
                                />
                                <HStack justify="space-between" spacing={3}>
                                  <HStack spacing={3} minW={0}>
                                    <Flex align="center" justify="center" boxSize="36px" borderRadius="12px" bg="white" color="blue.600" flexShrink={0} boxShadow="0 1px 2px rgba(16, 24, 40, 0.04)">
                                      <Icon as={FiUploadCloud} boxSize={4} />
                                    </Flex>
                                    <Box minW={0}>
                                      <Text fontSize="sm" fontWeight="800" color="gray.900" noOfLines={1}>
                                        {csvFile ? csvFile.name : "Choose CSV / Excel file"}
                                      </Text>
                                      <Text fontSize="xs" color="gray.500" mt={0.5} noOfLines={1}>
                                        CSV, XLS, or XLSX up to your server limit
                                      </Text>
                                    </Box>
                                  </HStack>
                                  <Badge colorScheme={csvFile ? "blue" : "gray"} variant="subtle" borderRadius="full" px={3} py={1} textTransform="none" flexShrink={0}>
                                    Browse
                                  </Badge>
                                </HStack>
                              </Box>
                              <Button
                                colorScheme="blue"
                                variant="outline"
                                onClick={handlePreviewCsv}
                                isDisabled={!csvFile || !companyId || isCompanyInactive}
                                isLoading={courseStore.isAssignmentSubmitting}
                                width="full"
                                h="42px"
                                borderRadius="14px"
                              >
                                Validate file
                              </Button>
                              {csvPreview ? (
                                <Box p={4} bg="green.50" borderRadius="13px" borderWidth="1px" borderColor="green.100">
                                  <Text fontSize="sm" fontWeight="800" color="green.900" noOfLines={1}>
                                    {csvPreview.fileName}
                                  </Text>
                                  <Text fontSize="sm" color="green.700" mt={1}>
                                    {csvPreview.matchedUsers.length} matched learner{csvPreview.matchedUsers.length === 1 ? "" : "s"} found.
                                  </Text>
                                </Box>
                              ) : null}
                            </Stack>
                          </Box>
                        </Stack>

                        <Box {...SURFACE_PROPS} p={{ base: 4, md: 5 }} minH="420px">
                          <Stack spacing={5}>
                            <Flex align="start" justify="space-between" gap={3}>
                              <SectionHeader title={`Selected learners (${combinedSelectedUsers.length})`} description="These learners will receive the selected curriculum after confirmation." />
                              <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={3} py={1.5} textTransform="none">
                                {combinedSelectedUsers.length} total
                              </Badge>
                            </Flex>

                            {combinedSelectedUsers.length === 0 ? (
                              <Flex align="center" justify="center" minH="170px" border="1px dashed" borderColor="gray.300" borderRadius="16px" bg="gray.50" p={6} textAlign="center">
                                <Stack align="center" spacing={2}>
                                  <Icon as={FiUsers} boxSize={7} color="gray.300" />
                                  <Text color="gray.500" fontSize="sm">
                                    No learners selected yet.
                                  </Text>
                                </Stack>
                              </Flex>
                            ) : (
                              <Wrap spacing={3}>
                                {combinedSelectedUsers.map((user: any) => {
                                  const isManualSelection = selectedUsers.some((selectedUser) => selectedUser._id === user._id);
                                  return (
                                    <WrapItem key={user._id}>
                                      <Tag size="lg" borderRadius="full" variant="subtle" colorScheme="blue" pl={1} pr={3} py={1.5} boxShadow="none">
                                        <Avatar size="xs" name={user.name || user.mobileNumber || user.email} src={user.profilePicture} mr={2} />
                                        <TagLabel fontWeight="700" fontSize="sm">
                                          {user.name || user.mobileNumber || user.email}
                                        </TagLabel>
                                        {isManualSelection ? <TagCloseButton onClick={() => toggleSelectedUser(user)} ml={2} /> : null}
                                      </Tag>
                                    </WrapItem>
                                  );
                                })}
                              </Wrap>
                            )}

                            {csvPreview?.failedEntries?.length ? (
                              <Alert status="warning" borderRadius="14px" alignItems="start" bg="orange.50" borderWidth="1px" borderColor="orange.200">
                                <AlertIcon mt={1} color="orange.500" />
                                <Box>
                                  <AlertTitle fontSize="sm">Some users were not found</AlertTitle>
                                  <AlertDescription fontSize="sm" mt={2} lineHeight="1.6">
                                    Add these users first, then re-upload the spreadsheet before assigning the course.
                                  </AlertDescription>
                                  <Stack spacing={1.5} mt={3}>
                                    {csvPreview.failedEntries.slice(0, 8).map((entry: any, index: number) => (
                                      <Text key={`${entry.userId || entry.phone || entry.rowNumber}-${index}`} fontSize="sm" color="orange.800">
                                        {entry.phone || entry.reference || `Row ${entry.rowNumber}`}: {entry.reason}
                                      </Text>
                                    ))}
                                  </Stack>
                                </Box>
                              </Alert>
                            ) : null}
                          </Stack>
                        </Box>
                      </Grid>
                    )}

                    <Box {...SURFACE_PROPS} p={{ base: 4, md: 5 }} position="relative" overflow="hidden">
                      <Box position="absolute" insetX={0} top={0} h="4px" bgGradient="linear(to-r, blue.500, purple.400)" />
                      <Stack spacing={3}>
                        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={3}>
                          <SectionHeader eyebrow="Final review" title="Assignment summary" description="Review the audience, organization, access, and course criteria before confirming." />
                          <Badge colorScheme="green" borderRadius="full" px={3} py={1.5} textTransform="none">
                            Ready to assign
                          </Badge>
                        </Flex>

                        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={3}>
                          <StatCard label="Curriculum" value={`${selectedCourses.length} course${selectedCourses.length !== 1 ? "s" : ""}`} />
                          <StatCard label="Organization" value={selectedCompany?.company_name || "N/A"} />
                          <StatCard
                            label="Audience scope"
                            value={
                              assignmentTarget === "company"
                                ? "Entire company"
                                : assignmentTarget === "department"
                                  ? `Dept: ${departmentName}`
                                  : `${combinedSelectedUsers.length} selected learner${combinedSelectedUsers.length !== 1 ? "s" : ""}`
                            }
                          />
                          <StatCard label="Access expiry" value={noExpiry ? "Lifetime" : formatDate(validTill)} />
                        </SimpleGrid>

                        <Wrap spacing={3}>
                          {selectedCourses.map((course: any) => (
                            <WrapItem key={course._id}>
                              <Tag borderRadius="full" colorScheme="blue" variant="subtle" px={3} py={2}>
                                <TagLabel fontWeight="700">
                                  {course.title}
                                  {Number.isFinite(Number(course?.assessment?.totalMarks)) ? ` • ${assessmentCriteriaByCourse[course._id]?.passingMarks || "--"}/${course.assessment.totalMarks}` : ""}
                                </TagLabel>
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Stack>
                    </Box>
                  </Stack>
                )}
              </Stack>
            </SlideFade>
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px" borderColor="gray.200" p={{ base: 4, md: 5 }} bg="white">
            <Flex direction={{ base: "column-reverse", sm: "row" }} justify="space-between" align={{ base: "stretch", sm: "center" }} gap={3} w="full">
              <Button h="42px" borderRadius="13px" variant="ghost" colorScheme="gray" onClick={() => (step === 0 ? handleClose() : setStep((current) => current - 1))}>
                {step === 0 ? "Cancel" : "Back"}
              </Button>

              {step < STEPS.length - 1 ? (
                <Button h="42px" borderRadius="13px" colorScheme="blue" onClick={() => setStep((current) => current + 1)} isDisabled={!canContinue} px={8}>
                  Continue
                </Button>
              ) : (
                <Button h="42px" borderRadius="13px" colorScheme="blue" onClick={handleSubmit} isLoading={courseStore.isAssignmentSubmitting} isDisabled={!canContinue || isCompanyInactive} px={8} boxShadow="0 10px 22px rgba(37, 99, 235, 0.18)">
                  Confirm & Assign
                </Button>
              )}
            </Flex>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
);

export default AssignCourseModal;
