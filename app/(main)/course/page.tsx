"use client";

import MyCoursesBoard from "@/app/(main)/course/component/MyCoursesBoard";
import { isLearnerRole } from "@/app/config/utils/roleAccess";
import stores from "@/app/store/stores";
import { CourseCard } from "@/app/(main)/course/component/CourseCard";
import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useToken,
  useDisclosure,
  VStack
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiBookOpen,
  FiClock,
  FiDollarSign,
  FiFilter,
  FiGlobe,
  FiSearch,
  FiStar,
  FiTrendingUp
} from "react-icons/fi";

type CatalogSort = "latest" | "popularity" | "price_asc" | "price_desc" | "highest_rated";

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

function AssessmentBadge({ summary }: { summary?: any }) {
  if (!summary || summary.outcome === "not_configured") {
    return null;
  }

  const colorScheme = summary.outcome === "passed" ? "green" : summary.outcome === "failed" ? "red" : "orange";
  const label =
    summary.outcome === "passed"
      ? "Passed"
      : summary.outcome === "failed"
        ? "Failed"
        : "Assessment Pending";

  return (
    <Badge colorScheme={colorScheme} borderRadius="full" px={3} py={1} size={'sm'} fontSize={'xs'}>
      {label}
    </Badge>
  );
}

const CoursesPage = observer(function CoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const role = String(stores.auth.userType || stores.auth.user?.role || "").toLowerCase();
  const isLearner = Boolean(stores.auth.user) && isLearnerRole(role);
  const requestedCourseId = String(searchParams.get("courseId") || "").trim();
  const requestedEnrollmentCourseId = String(searchParams.get("enrollCourseId") || "").trim();
  const initialSearch = String(searchParams.get("search") || "").trim();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [pricingFilter, setPricingFilter] = useState<"all" | "free" | "paid">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [courseTypeFilter, setCourseTypeFilter] = useState<"all" | "standard" | "scorm">("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [sortBy, setSortBy] = useState<CatalogSort>("latest");

  const heroBg = useColorModeValue(
    "linear-gradient(135deg, var(--chakra-colors-brand-50) 0%, #ffffff 48%, var(--chakra-colors-brand-100) 100%)",
    "linear-gradient(135deg, var(--chakra-colors-gray-900) 0%, rgba(15, 23, 42, 0.98) 40%, var(--chakra-colors-brand-900) 100%)"
  );
  const pageBg = useColorModeValue("#F8FAFC", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.300");
  const softText = useColorModeValue("gray.500", "gray.400");
  const drawerBg = useColorModeValue("white", "gray.800");
  const heroPanelOverlay = useColorModeValue(
    "linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.3) 100%)",
    "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
  );
  const heroHeadingAccent = useColorModeValue(
    "linear(to-r, brand.700, brand.500, brand.300)",
    "linear(to-r, brand.200, brand.400, brand.600)"
  );
  const heroStatShadow = useColorModeValue(
    "0 14px 34px rgba(15, 23, 42, 0.06)",
    "0 18px 42px rgba(2, 6, 23, 0.28)"
  );
  const heroPanelShadow = useColorModeValue(
    "0 18px 50px rgba(15, 23, 42, 0.08)",
    "0 24px 60px rgba(2, 6, 23, 0.34)"
  );
  const heroButtonShadow = useColorModeValue(
    "0 12px 28px rgba(37, 99, 235, 0.24)",
    "0 16px 32px rgba(15, 23, 42, 0.34)"
  );
  const priceSummaryBg = useColorModeValue("blue.50", "blue.900");
  const moduleSummaryBg = useColorModeValue("purple.50", "purple.900");
  const assessmentSummaryBg = useColorModeValue("green.50", "green.900");
  const ratingSummaryBg = useColorModeValue("orange.50", "orange.900");
  const [brand50, brand100, brand200, brand400, brand500, brand700] = useToken("colors", [
    "brand.50",
    "brand.100",
    "brand.200",
    "brand.400",
    "brand.500",
    "brand.700",
  ]);

  useEffect(() => {
    stores.courseStore.fetchPublicCourses().catch(() => undefined);
    if (isLearner) {
      stores.courseStore.fetchMyCourses().catch(() => undefined);
    }
  }, [isLearner]);

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  const publicCourses = stores.courseStore.publicCourses || [];
  const assignedCourses = stores.courseStore.myCourses || [];
  const enrolledCourseIds = useMemo(
    () => new Set(assignedCourses.map((course) => String(course.courseId || "").trim()).filter(Boolean)),
    [assignedCourses]
  );

  useEffect(() => {
    if (requestedEnrollmentCourseId) {
      router.replace(`/course?courseId=${requestedEnrollmentCourseId}`);
    }
  }, [requestedEnrollmentCourseId, router]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    publicCourses.forEach((course) => {
      (course.taxonomy?.categories || []).forEach((category) => {
        if (category) categories.add(category);
      });
    });
    return ["all", ...Array.from(categories).sort((left, right) => left.localeCompare(right))];
  }, [publicCourses]);

  const availableLanguages = useMemo(() => {
    const languages = new Set<string>();
    publicCourses.forEach((course) => {
      (course.taxonomy?.languages || []).forEach((language) => {
        if (language) languages.add(language);
      });
    });
    return ["all", ...Array.from(languages).sort((left, right) => left.localeCompare(right))];
  }, [publicCourses]);

  const filteredPublicCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const nextCourses = publicCourses.filter((course) => {
      const searchableText = [
        course.title,
        course.description?.text,
        course.taxonomy?.level,
        ...(course.taxonomy?.categories || []),
        ...(course.taxonomy?.languages || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !searchableText.includes(query)) {
        return false;
      }

      if (pricingFilter !== "all" && course.commerce?.pricingModel !== pricingFilter) {
        return false;
      }

      if (categoryFilter !== "all" && !(course.taxonomy?.categories || []).includes(categoryFilter)) {
        return false;
      }

      if (courseTypeFilter !== "all" && course.courseType !== courseTypeFilter) {
        return false;
      }

      if (languageFilter !== "all" && !(course.taxonomy?.languages || []).includes(languageFilter)) {
        return false;
      }

      return true;
    });

    nextCourses.sort((left, right) => {
      if (sortBy === "popularity") {
        return (right.metrics?.popularityScore || 0) - (left.metrics?.popularityScore || 0);
      }

      if (sortBy === "price_asc") {
        return Number(left.commerce?.amountInRupees || 0) - Number(right.commerce?.amountInRupees || 0);
      }

      if (sortBy === "price_desc") {
        return Number(right.commerce?.amountInRupees || 0) - Number(left.commerce?.amountInRupees || 0);
      }

      if (sortBy === "highest_rated") {
        return (right.metrics?.averageRating || 0) - (left.metrics?.averageRating || 0);
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    return nextCourses;
  }, [categoryFilter, courseTypeFilter, languageFilter, pricingFilter, publicCourses, searchQuery, sortBy]);

  const featuredAssignedCourses = useMemo(() => assignedCourses.slice(0, 3), [assignedCourses]);

  if (requestedCourseId) {
    return (
      <Box minH="100vh" bg={pageBg} px={{ base: 4, md: 6 }}>
        <MyCoursesBoard basePath="/course" />
      </Box>
    );
  }

const filterInputStyles = {
  bg: cardBg,
  borderColor,
  borderRadius: "xl",
  h: { base: "38px", md: "38px" },
  fontSize: "sm",
  _hover: {
    borderColor: "brand.300",
  },
  _focusVisible: {
    borderColor: "brand.400",
    boxShadow: `0 0 0 3px ${brand100}`,
  },
};

const FilterPanel = (
  <VStack align="stretch" spacing={2.5}>
    <InputGroup>
      <InputLeftElement h="38px" pointerEvents="none">
        <Icon as={FiSearch} color={softText} fontSize="sm" />
      </InputLeftElement>

      <Input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search course, category, language..."
        pl={9}
        {...filterInputStyles}
      />
    </InputGroup>

    <SimpleGrid columns={{ base: 1, md: 4 }} spacing={2.5}>
      <Select
        value={pricingFilter}
        onChange={(event) =>
          setPricingFilter(event.target.value as typeof pricingFilter)
        }
        {...filterInputStyles}
      >
        <option value="all">Paid / Free</option>
        <option value="free">Free</option>
        <option value="paid">Paid</option>
      </Select>

      <Select
        value={categoryFilter}
        onChange={(event) => setCategoryFilter(event.target.value)}
        {...filterInputStyles}
      >
        {availableCategories.map((category) => (
          <option key={category} value={category}>
            {category === "all" ? "Category" : category}
          </option>
        ))}
      </Select>

      <Select
        value={courseTypeFilter}
        onChange={(event) =>
          setCourseTypeFilter(event.target.value as typeof courseTypeFilter)
        }
        {...filterInputStyles}
      >
        <option value="all">Type</option>
        <option value="standard">Standard</option>
        <option value="scorm">SCORM</option>
      </Select>

      <Select
        value={languageFilter}
        onChange={(event) => setLanguageFilter(event.target.value)}
        {...filterInputStyles}
      >
        {availableLanguages.map((language) => (
          <option key={language} value={language}>
            {language === "all" ? "Language" : language}
          </option>
        ))}
      </Select>
    </SimpleGrid>

    <Select
      value={sortBy}
      onChange={(event) => setSortBy(event.target.value as CatalogSort)}
      {...filterInputStyles}
    >
      <option value="latest">Latest courses</option>
      <option value="popularity">Most popular</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
      <option value="highest_rated">Highest Rated</option>
    </Select>
  </VStack>
);

  return (
    <Box minH="100vh" bg={pageBg} overflowX="hidden">
<Box
  bg={heroBg}
  borderBottomWidth="1px"
  borderColor={borderColor}
  position="relative"
  overflow="hidden"
>
  {/* Decorative background blobs */}
  <Box
    position="absolute"
    top="-80px"
    right="-70px"
    w="260px"
    h="260px"
    bg={brand400}
    opacity={{ base: 0.14, md: 0.18 }}
    filter="blur(40px)"
    borderRadius="full"
    pointerEvents="none"
  />

  <Box
    maxW="8xl"
    mx="auto"
    px={{ base: 4, md: 8 }}
    py={{ base: 4, md: 8 }}
    position="relative"
  >
    <Grid
      templateColumns={{ base: "1fr", lg: "1.08fr 0.92fr" }}
      gap={{ base: 5, lg: 8 }}
      alignItems="center"
    >
      <Box>
        <Badge
          bg={brand50}
          color={brand700}
          borderRadius="full"
          px={3}
          py={1}
          textTransform="none"
          fontSize="xs"
          boxShadow={heroButtonShadow}
        >
          Course catalog
        </Badge>

        <Heading
          mt={{ base: 2.5, md: 3 }}
          fontSize={{ base: "2xl", md: "4xl", xl: "5xl" }}
          lineHeight={{ base: "1.12", md: "1.05" }}
          maxW="3xl"
          letterSpacing="-0.04em"
        >
          Find the right course,
          <Text
            as="span"
            bgGradient={heroHeadingAccent}
            bgClip="text"
          >
            {" "}
            faster.
          </Text>
        </Heading>

        <Text
          mt={{ base: 3, md: 4 }}
          fontSize={{ base: "sm", md: "md" }}
          color={mutedText}
          maxW={{ base: "20rem", sm: "2xl" }}
          lineHeight="1.65"
          display={{ base: "none", md: "block" }}
        >
          Search, filter, and sort public courses by the signals that matter most.
        </Text>

        <HStack
          mt={{ base: 4, md: 6 }}
          spacing={2.5}
          flexWrap="wrap"
          display={{ base: "none", sm: "flex" }}
        >
          {[
            {
              icon: FiBookOpen,
              color: brand700,
              colorBg: brand50,
              label: "Courses",
              value: publicCourses.length,
            },
            {
              icon: FiTrendingUp,
              color: brand500,
              colorBg: brand100,
              label: "Enrollments",
              value: publicCourses.reduce(
                (sum, course) =>
                  sum + Number(course.metrics?.popularityScore || 0),
                0
              ),
            },
            {
              icon: FiGlobe,
              colorBg: brand200,
              color: "green.500",
              label: "Open access",
              value: "Open to all",
            },
          ].map((item) => (
            <Box
              key={item.label}
              display="flex"
              alignItems="center"
              gap={3}
              px={3.5}
              py={2.5}
              borderRadius="2xl"
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow={heroStatShadow}
              transition="all 0.2s ease"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: heroPanelShadow,
              }}
            >
              <Box
                w="34px"
                h="34px"
                display="grid"
                placeItems="center"
                borderRadius="xl"
                bg={item.colorBg}
              >
                <Icon as={item.icon} color={item.color} />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="800" lineHeight="1.1">
                  {item.value}
                </Text>
                <Text fontSize="xs" color={softText}>
                  {item.label}
                </Text>
              </Box>
            </Box>
          ))}
        </HStack>

        <Button
          mt={{ base: 3, md: 5 }}
          display={{ base: "inline-flex", md: "none" }}
          colorScheme="brand"
          borderRadius="full"
          leftIcon={<FiFilter />}
          size="sm"
          onClick={onOpen}
          boxShadow={heroButtonShadow}
        >
          Filters
        </Button>
      </Box>

     <Box
  display={{ base: "none", md: "block" }}
  borderRadius="2xl"
  borderWidth="1px"
  borderColor={borderColor}
  bg={cardBg}
  p={{ md: 4, lg: 4 }}
  boxShadow="0 18px 50px rgba(15, 23, 42, 0.08)"
  position="relative"
  overflow="hidden"
  maxW="760px"
  w="full"
>
  <Box
    position="absolute"
    inset={0}
    bgGradient={heroPanelOverlay}
    opacity={1}
    pointerEvents="none"
  />

  <Box position="relative">
    <HStack justify="space-between" align="center" mb={3}>
      <HStack spacing={2.5}>
        <Box
          w="34px"
          h="34px"
          display="grid"
          placeItems="center"
          borderRadius="xl"
          bg={brand500}
          color="white"
          boxShadow={heroButtonShadow}
        >
          <Icon as={FiSearch} fontSize="sm" />
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="800" lineHeight="1.1">
            Find Courses
          </Text>
          <Text fontSize="xs" color={softText}>
            Search and refine quickly
          </Text>
        </Box>
      </HStack>

      <Badge
        borderRadius="full"
        bg={brand50}
        color={brand700}
        px={2.5}
        py={1}
        textTransform="none"
        fontSize="xs"
      >
        {publicCourses.length} total
      </Badge>
    </HStack>

    {FilterPanel}

    <HStack mt={3} spacing={2.5}>
      <Button
        flex="1"
        h="38px"
        colorScheme="brand"
        borderRadius="xl"
        leftIcon={<FiFilter />}
        onClick={onOpen}
        fontSize="sm"
        boxShadow={heroButtonShadow}
        _hover={{
          transform: "translateY(-1px)",
          boxShadow: heroPanelShadow,
        }}
        transition="all 0.2s ease"
      >
        Refine catalog
      </Button>

      <Button
        h="38px"
        px={4}
        variant="outline"
        borderRadius="xl"
        borderColor={borderColor}
        color={mutedText}
        fontSize="sm"
        onClick={() => {
          setSearchQuery("");
          setPricingFilter("all");
          setCategoryFilter("all");
          setCourseTypeFilter("all");
          setLanguageFilter("all");
          setSortBy("latest");
        }}
      >
        Reset
      </Button>
    </HStack>
  </Box>
</Box>
    </Grid>
  </Box>
</Box>


      <Box maxW="8xl" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 7, md: 10 }}>
        {isLearner && featuredAssignedCourses.length > 0 ? (
          <Box mb={{ base: 7, md: 10 }}>
            <Flex justify="space-between" align="center" mb={5} flexWrap="wrap" gap={3}>
              <Box>
                <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="700" color="blue.500" textTransform="uppercase" letterSpacing="0.08em">
                  Assigned Courses
                </Text>
                <Heading size={{ base: "md", md: "lg" }} mt={1}>Continue learning</Heading>
              </Box>
              <Button
                size={{ base: "sm", md: "md" }}
                variant="ghost"
                colorScheme="blue"
                rightIcon={<FiArrowRight />}
                onClick={() => router.push(`/course?courseId=${featuredAssignedCourses[0].courseId}`)}
              >
                Resume latest course
              </Button>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={{ base: 4, md: 5 }}>
              {featuredAssignedCourses.map((course) => (
                <MotionBox
                  key={course.courseId}
                  whileHover={{ y: -6 }}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="2xl"
                  overflow="hidden"
                  boxShadow="0 18px 45px rgba(15, 23, 42, 0.06)"
                  cursor="pointer"
                  onClick={() => router.push(`/course?courseId=${course.courseId}`)}
                >
                  <Box position="relative">
                    {course.thumbnailUrl ? (
                    <Image src={course.thumbnailUrl} alt={course.title} h={{ base: "112px", sm: "140px", md: "190px" }} w="full" objectFit="cover" />
                  ) : (
                      <Box h={{ base: "112px", sm: "140px", md: "190px" }} bgGradient="linear(to-br, brand.600, brand.300)" />
                    )}
                    <Badge position="absolute" top={{ base: 3, md: 4 }} left={{ base: 3, md: 4 }} colorScheme="blue" borderRadius="full" px={3} py={1}>
                      Private
                    </Badge>
                  </Box>

                  <Box p={{ base: 3, md: 5 }}>
                    <HStack spacing={2} flexWrap="wrap" mb={3}>
                      <Badge colorScheme="gray" borderRadius="full" px={3} py={1}>
                        {course.taxonomy?.level || "Beginner"}
                      </Badge>
                      <AssessmentBadge summary={course.assessmentSummary} />
                    </HStack>
                    <Heading size={{ base: "sm", md: "md" }} mb={2} noOfLines={2}>{course.title}</Heading>
                    <Text fontSize="sm" color={mutedText} noOfLines={2} display={{ base: "none", md: "block" }}>
                      {course.description?.text || "Assigned privately by your organization."}
                    </Text>

                    <HStack justify="space-between" mt={4}>
                      <Text fontSize="sm" fontWeight="700" color="blue.500">
                        {Math.round(Number(course.progress || 0))}% complete
                      </Text>
                      <Text fontSize="sm" color={softText}>
                        {course.status === "completed" ? "Completed" : "In progress"}
                      </Text>
                    </HStack>

                    <Button
                      mt={{ base: 3, md: 4 }}
                      h={{ base: "34px", md: "40px" }}
                      w="full"
                      size={{ base: "sm", md: "md" }}
                      variant="outline"
                      colorScheme="blue"
                      borderRadius="xl"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/course?courseId=${course.courseId}`);
                      }}
                    >
                      Continue Course
                    </Button>
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>
          </Box>
        ) : null}

        <Flex
          justify="space-between"
          align={{ base: "flex-start", md: "flex-end" }}
          direction={{ base: "column", md: "row" }}
          mb={{base:3,md:5}}
          gap={{ base: 3, md: 4 }}
        >
          <Box minW={0}>
            <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="700" color="blue.500" textTransform="uppercase" letterSpacing="0.08em">
              Explore Courses
            </Text>
            <Heading size={{ base: "md", md: "lg" }} mt={1}>Public learning catalog</Heading>
                <Text mt={2} color={mutedText} display={{ base: "none", md: "block" }}>
                  {filteredPublicCourses.length} course{filteredPublicCourses.length === 1 ? "" : "s"} match your current filters.
                </Text>
          </Box>

          <Button
            display={{ base: "inline-flex", md: "none" }}
            colorScheme="blue"
            borderRadius="full"
            leftIcon={<FiFilter />}
            size="sm"
            minH={{ base: "34px", md:"38px"}}
            flexShrink={0}
            onClick={onOpen}
          >
            Filters
          </Button>
        </Flex>

        {stores.courseStore.isPublicCoursesLoading ? (
          <HStack justify="center" py={20}>
            <Spinner color="blue.500" />
            <Text color={mutedText}>Loading public courses...</Text>
          </HStack>
        ) : filteredPublicCourses.length === 0 ? (
          <Box textAlign="center" py={16} borderRadius="2xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <Icon as={FiBookOpen} boxSize={8} color="gray.400" />
            <Heading size="md" mt={4}>No public courses found</Heading>
            <Text mt={2} color={mutedText}>Try changing your search or filters to broaden the results.</Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={{ base: 4, md: 5 }}>
            {filteredPublicCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                enrolled={enrolledCourseIds.has(String(course._id))}
                onClick={() => {
                  router.push(`/course?courseId=${course._id}`);
                }}
              />
            ))}
          </SimpleGrid>
        )}
      </Box>

      <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
        <DrawerOverlay backdropFilter="blur(6px)" />
        <DrawerContent borderTopRadius="3xl" bg={drawerBg}>
          <DrawerCloseButton mt={2} />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
            Filters and Sorting
          </DrawerHeader>
          <DrawerBody py={6}>{FilterPanel}</DrawerBody>
        </DrawerContent>
      </Drawer>


    </Box>
  );
});

export default CoursesPage;
