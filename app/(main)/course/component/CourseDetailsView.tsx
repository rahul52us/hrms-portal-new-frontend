"use client";

import { isLearnerRole } from "@/app/config/utils/roleAccess";
import stores from "@/app/store/stores";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useToken,
  VStack,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Avatar,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  FiBookOpen,
  FiClock,
  FiDollarSign,
  FiGlobe,
  FiStar,
  FiTrendingUp,
  FiArrowLeft,
  FiAward,
  FiCheckCircle,
  FiPlay,
  FiFileText,
  FiChevronRight,
} from "react-icons/fi";

const MotionBox = motion(Box);

function formatCurrency(value?: number | null) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

interface CourseDetailsViewProps {
  courseId: string;
  onBack: () => void;
}

export const CourseDetailsView = observer(({ courseId, onBack }: CourseDetailsViewProps) => {
  const router = useRouter();

  const role = String(stores.auth.userType || stores.auth.user?.role || "").toLowerCase();
  const isLearner = isLearnerRole(role);

  useEffect(() => {
    stores.courseStore.fetchPublicCourses().catch(() => undefined);
    if (isLearner) {
      stores.courseStore.fetchMyCourses().catch(() => undefined);
    }
  }, [isLearner]);

  const course = useMemo(() => {
    return (stores.courseStore.publicCourses || []).find(
      (c) => String(c._id).trim() === String(courseId).trim()
    );
  }, [stores.courseStore.publicCourses, courseId]);

  const enrolledCourseIds = useMemo(() => {
    return new Set(
      (stores.courseStore.myCourses || []).map((c) => String(c.courseId || "").trim())
    );
  }, [stores.courseStore.myCourses]);

  const isEnrolled = enrolledCourseIds.has(courseId);
  const isEnrolling = stores.courseStore.enrollmentCourseId === courseId;
  const requiresPayment =
    String(course?.commerce?.pricingModel || "free").toLowerCase() === "paid";

  const handleEnrollmentAction = async () => {
    if (!courseId) return;

    if (isEnrolled) {
      router.push(`/course?courseId=${courseId}`);
      return;
    }

    if (!stores.auth.user) {
      stores.auth.openNotification({
        title: "Sign in required",
        message: "Please sign in or sign up to enroll in this course.",
        type: "info",
      });
      router.push(`/login?redirect=${encodeURIComponent(`/course?courseId=${courseId}`)}`);
      return;
    }

    if (!isLearner) {
      stores.auth.openNotification({
        title: "Learner account required",
        message: "Sign in with a learner account to enroll in this course.",
        type: "error",
      });
      return;
    }

    if (requiresPayment) {
      stores.auth.openNotification({
        title: "Payment required",
        message: "Complete payment before enrolling in this course.",
        type: "error",
      });
      return;
    }

    try {
      const response = await stores.courseStore.enrollInPublishedCourse(courseId);
      await stores.auth.fetchUser();
      stores.auth.openNotification({
        title: response?.data?.alreadyEnrolled ? "Already enrolled" : "Enrollment complete",
        message: response?.message || "The course is now available in your learning dashboard.",
        type: "success",
      });
      // Redirect to the learner board for this course
      router.push(`/course?courseId=${courseId}`);
    } catch (error: any) {
      stores.auth.openNotification({
        title: "Enrollment failed",
        message: error?.message || error?.error || "Unable to enroll in this course.",
        type: "error",
      });
    }
  };

  const bgMain = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const textPrimary = useColorModeValue("gray.800", "whiteAlpha.900");
  const textSecondary = useColorModeValue("gray.600", "gray.400");

  if (stores.courseStore.isPublicCoursesLoading && !course) {
    return (
      <Flex minH="60vh" align="center" justify="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text color={textSecondary} fontWeight="medium">
            Loading course details...
          </Text>
        </VStack>
      </Flex>
    );
  }

  if (!course) {
    return (
      <Flex minH="60vh" align="center" justify="center" px={4}>
        <Box textAlign="center" py={12} px={6} bg={cardBg} borderRadius="3xl" shadow="xl" maxW="md" borderWidth="1px" borderColor={borderColor}>
          <Icon as={FiBookOpen} boxSize={12} color="red.400" mb={4} />
          <Heading size="lg" mb={2}>
            Course Not Found
          </Heading>
          <Text color={textSecondary} mb={6}>
            The course you are looking for does not exist or may have been removed.
          </Text>
          <Button
            colorScheme="blue"
            borderRadius="xl"
            leftIcon={<FiArrowLeft />}
            onClick={onBack}
          >
            Back to Courses
          </Button>
        </Box>
      </Flex>
    );
  }

  return (
    <Box pb={16}>
      {/* HEADER HERO AREA */}
      <Box
        bg={useColorModeValue("white", "gray.800")}
        borderBottom="1px"
        borderColor={borderColor}
        pt={6}
        pb={8}
        mx={-6}
        px={6}
        shadow="sm"
      >
        <Container maxW="8xl">
          {/* Breadcrumbs */}
          <Breadcrumb
            spacing="8px"
            separator={<FiChevronRight color="gray.500" />}
            fontSize="sm"
            color={textSecondary}
            mb={6}
          >
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push("/")} cursor="pointer" _hover={{ color: "brand.500" }}>
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={onBack} cursor="pointer" _hover={{ color: "brand.500" }}>
                Courses
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink fontWeight="semibold" color={textPrimary}>
                {course.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8} alignItems="start">
            <Stack spacing={4}>
              <HStack spacing={2} flexWrap="wrap">
                <Badge colorScheme="green" borderRadius="full" px={3} py={1}>
                  Public
                </Badge>
                <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                  {course.courseType === "scorm" ? "SCORM" : "Standard"}
                </Badge>
                <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
                  {course.taxonomy?.level || "Beginner"}
                </Badge>
                {isEnrolled && (
                  <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>
                    Enrolled
                  </Badge>
                )}
              </HStack>

              <Heading as="h1" size="xl" fontWeight="black" color={textPrimary} lineHeight="1.2">
                {course.title}
              </Heading>

              <Text fontSize="lg" color={textSecondary} lineHeight="1.6">
                {course.description?.text || "Explore this course to inspect pricing, curriculum, and enrollment options."}
              </Text>

              <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={4} pt={4}>
                <HStack spacing={3}>
                  <Flex w={10} h={10} borderRadius="xl" bg="orange.50" align="center" justify="center">
                    <Icon as={FiStar} color="orange.400" boxSize={5} />
                  </Flex>
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">
                      Rating
                    </Text>
                    <Text fontWeight="bold" color={textPrimary}>
                      {course.metrics?.averageRating ? course.metrics.averageRating.toFixed(1) : "New"}
                    </Text>
                  </Box>
                </HStack>

                <HStack spacing={3}>
                  <Flex w={10} h={10} borderRadius="xl" bg="purple.50" align="center" justify="center">
                    <Icon as={FiTrendingUp} color="purple.500" boxSize={5} />
                  </Flex>
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">
                      Popularity
                    </Text>
                    <Text fontWeight="bold" color={textPrimary}>
                      {course.metrics?.popularityScore || 0} learners
                    </Text>
                  </Box>
                </HStack>

                <HStack spacing={3}>
                  <Flex w={10} h={10} borderRadius="xl" bg="blue.50" align="center" justify="center">
                    <Icon as={FiGlobe} color="blue.500" boxSize={5} />
                  </Flex>
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">
                      Language
                    </Text>
                    <Text fontWeight="bold" color={textPrimary}>
                      {course.taxonomy?.languages?.[0] || "English"}
                    </Text>
                  </Box>
                </HStack>

                <HStack spacing={3}>
                  <Flex w={10} h={10} borderRadius="xl" bg="green.50" align="center" justify="center">
                    <Icon as={FiAward} color="green.500" boxSize={5} />
                  </Flex>
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">
                      Certificate
                    </Text>
                    <Text fontWeight="bold" color={textPrimary}>
                      {course.progression?.certificateEnabled !== false ? "Included" : "None"}
                    </Text>
                  </Box>
                </HStack>
              </SimpleGrid>
            </Stack>
          </Grid>
        </Container>
      </Box>

      {/* CONTENT & SIDEBAR */}
      <Container maxW="8xl" mt={8} px={0}>
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          {/* LEFT COLUMN */}
          <Stack spacing={8}>
            {/* Highlights */}
            {course.highlights?.learningOutcomes && course.highlights.learningOutcomes.length > 0 && (
              <Box bg={cardBg} p={{ base: 6, md: 8 }} borderRadius="3xl" borderWidth="1px" borderColor={borderColor} shadow="sm">
                <Heading size="md" mb={4} color={textPrimary}>
                  What you will learn
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {course.highlights.learningOutcomes.map((outcome: string, idx: number) => (
                    <HStack key={idx} align="start" spacing={3}>
                      <Icon as={FiCheckCircle} color="green.500" mt={1} />
                      <Text color={textSecondary} fontSize="md">
                        {outcome}
                      </Text>
                    </HStack>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {/* Curriculum */}
            <Box bg={cardBg} p={{ base: 6, md: 8 }} borderRadius="3xl" borderWidth="1px" borderColor={borderColor} shadow="sm">
              <Heading size="md" mb={2} color={textPrimary}>
                Course Curriculum
              </Heading>
              <Text color={textSecondary} fontSize="sm" mb={6}>
                {course.curriculum?.totalModules || 0} module{(course.curriculum?.totalModules || 0) === 1 ? "" : "s"} • {course.curriculum?.totalSections || 0} section{(course.curriculum?.totalSections || 0) === 1 ? "" : "s"}
              </Text>

              {(course.curriculum as any)?.modules && (course.curriculum as any).modules.length > 0 ? (
                <Accordion allowMultiple defaultIndex={[0]}>
                  {(course.curriculum as any).modules.map((mod: any, mIdx: number) => (
                    <AccordionItem key={mIdx} border="none" mb={3} bg={useColorModeValue("gray.50", "gray.750")} borderRadius="2xl" overflow="hidden">
                      <h2>
                        <AccordionButton py={4} px={5} _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}>
                          <Box flex="1" textAlign="left">
                            <Text fontWeight="bold" color={textPrimary}>
                              Module {mIdx + 1}: {mod.title || "Untitled Module"}
                            </Text>
                            <Text fontSize="xs" color={textSecondary} mt={1}>
                              {mod.sections?.length || 0} section{(mod.sections?.length || 0) === 1 ? "" : "s"}
                            </Text>
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4} px={5} bg={cardBg}>
                        <Stack spacing={3} divider={<Divider borderColor={borderColor} />}>
                          {mod.sections && mod.sections.length > 0 ? (
                            mod.sections.map((sec: any, sIdx: number) => (
                              <HStack key={sIdx} justify="space-between" py={2}>
                                <HStack spacing={3}>
                                  <Icon
                                    as={sec.content?.kind === "scorm" ? FiPlay : FiFileText}
                                    color="blue.500"
                                  />
                                  <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color={textPrimary}>
                                      {sec.title || "Untitled Section"}
                                    </Text>
                                    {sec.content?.slideCount && (
                                      <Text fontSize="xs" color="gray.500">
                                        {sec.content.slideCount} slides
                                      </Text>
                                    )}
                                  </Box>
                                </HStack>
                                {sec.content?.duration && (
                                  <Text fontSize="xs" color={textSecondary}>
                                    {sec.content.duration}
                                  </Text>
                                )}
                              </HStack>
                            ))
                          ) : (
                            <Text fontSize="sm" color={textSecondary}>
                              No sections in this module.
                            </Text>
                          )}
                        </Stack>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <Text color={textSecondary}>Curriculum details are not published yet.</Text>
              )}
            </Box>

            {/* Instructor */}
            {course.instructor && (course.instructor.name || course.instructor.designation) && (
              <Box bg={cardBg} p={{ base: 6, md: 8 }} borderRadius="3xl" borderWidth="1px" borderColor={borderColor} shadow="sm">
                <Heading size="md" mb={6} color={textPrimary}>
                  Your Instructor
                </Heading>
                <HStack spacing={4} align="start">
                  <Avatar
                    src={course.instructor.avatarUrl}
                    name={course.instructor.name}
                    size="xl"
                    boxShadow="md"
                  />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" fontSize="lg" color={textPrimary}>
                      {course.instructor.name || "Expert Instructor"}
                    </Text>
                    {course.instructor.designation && (
                      <Text fontSize="sm" color="blue.500" fontWeight="semibold">
                        {course.instructor.designation}
                      </Text>
                    )}
                    {course.instructor.companyName && (
                      <Text fontSize="sm" color={textSecondary}>
                        {course.instructor.companyName}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Box>
            )}
          </Stack>

          {/* RIGHT COLUMN (STICKY SIDEBAR) */}
          <Box position={{ lg: "sticky" }} top="90px">
            <MotionBox
              bg={cardBg}
              borderRadius="3xl"
              borderWidth="1px"
              borderColor={borderColor}
              overflow="hidden"
              shadow="xl"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
            >
              {course.thumbnailUrl ? (
                <Image src={course.thumbnailUrl} alt={course.title} w="full" h="200px" objectFit="cover" />
              ) : (
                <Flex h="200px" bgGradient="linear(to-br, brand.600, brand.300)" align="center" justify="center" color="white">
                  <Icon as={FiBookOpen} boxSize={12} />
                </Flex>
              )}

              <Box p={6}>
                <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase" letterSpacing="0.08em">
                  Price
                </Text>
                <Heading size="lg" color={textPrimary} mt={1} mb={6}>
                  {formatCurrency(course.commerce?.amountInRupees)}
                </Heading>

                <Stack spacing={4}>
                  <Button
                    colorScheme="blue"
                    borderRadius="xl"
                    h="52px"
                    w="full"
                    fontSize="md"
                    fontWeight="bold"
                    isLoading={isEnrolling}
                    loadingText="Enrolling..."
                    isDisabled={Boolean(stores.auth.user && !isLearner)}
                    onClick={handleEnrollmentAction}
                    shadow="lg"
                  >
                    {isEnrolled
                      ? "Open course"
                      : !stores.auth.user
                      ? "Sign in to enroll"
                      : !isLearner
                      ? "Learner account required"
                      : requiresPayment
                      ? "Purchase course"
                      : "Enroll now"}
                  </Button>

                  <Text fontSize="xs" textAlign="center" color={textSecondary}>
                    {isEnrolled
                      ? "You are enrolled in this course. You can access it anytime."
                      : requiresPayment
                      ? "Paid course details and invoice will be available post-purchase."
                      : "Instant access upon clicking enroll."}
                  </Text>

                  <Divider />

                  <Stack spacing={3} pt={2}>
                    <HStack justify="space-between" fontSize="sm">
                      <HStack spacing={2} color={textSecondary}>
                        <Icon as={FiClock} />
                        <Text>Access Period</Text>
                      </HStack>
                      <Text fontWeight="semibold" color={textPrimary}>
                        {course.commerce?.accessDurationDays
                          ? `${course.commerce.accessDurationDays} Days`
                          : "Lifetime Access"}
                      </Text>
                    </HStack>

                    <HStack justify="space-between" fontSize="sm">
                      <HStack spacing={2} color={textSecondary}>
                        <Icon as={FiBookOpen} />
                        <Text>Course Type</Text>
                      </HStack>
                      <Text fontWeight="semibold" color={textPrimary}>
                        {course.courseType === "scorm" ? "SCORM Package" : "Standard Module"}
                      </Text>
                    </HStack>

                    {course.assessment?.totalMarks && (
                      <HStack justify="space-between" fontSize="sm">
                        <HStack spacing={2} color={textSecondary}>
                          <Icon as={FiAward} />
                          <Text>Passing score</Text>
                        </HStack>
                        <Text fontWeight="semibold" color={textPrimary}>
                          {course.assessment.passingMarks} / {course.assessment.totalMarks} marks
                        </Text>
                      </HStack>
                    )}
                  </Stack>
                </Stack>
              </Box>
            </MotionBox>
          </Box>
        </Grid>
      </Container>
    </Box>
  );
});
