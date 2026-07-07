'use client';

import stores from "@/app/store/stores";
import { CourseCard } from "@/app/(main)/course/component/CourseCard";
import {
  Badge,
  Box,
  Button,
  Circle,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Image,
  Input,
  Progress,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useToken,
  VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaBolt,
  FaLock,
  FaPlayCircle,
  FaSearch,
  FaUserGraduate
} from "react-icons/fa";

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

export default observer(function LMSLandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const role = String(stores.auth.userType || stores.auth.user?.role || "").toLowerCase();
  const isLearner = role === "user" || role === "manager" || /^l\d+-manager$/i.test(role);

  useEffect(() => {
    stores.courseStore.fetchPublicCourses().catch(() => undefined);
    if (isLearner) {
      stores.courseStore.fetchMyCourses().catch(() => undefined);
    }
  }, [isLearner]);

  const publicCourses = stores.courseStore.publicCourses || [];
  const assignedCourses = stores.courseStore.myCourses || [];
  const enrolledCourseIds = useMemo(() => {
    return new Set((stores.courseStore.myCourses || []).map((course) => String(course.courseId || "").trim()));
  }, [stores.courseStore.myCourses]);
  const featuredPublicCourses = useMemo(() => publicCourses.slice(0, 4), [publicCourses]);
  const featuredAssignedCourses = useMemo(() => assignedCourses.slice(0, 2), [assignedCourses]);
  const avgRating = useMemo(() => {
    const ratedCourses = publicCourses.filter((course) => Number(course.metrics?.averageRating || 0) > 0);
    if (!ratedCourses.length) {
      return "New";
    }

    const average =
      ratedCourses.reduce((sum, course) => sum + Number(course.metrics?.averageRating || 0), 0) / ratedCourses.length;
    return average.toFixed(1);
  }, [publicCourses]);
  const heroHighlights = useMemo(
    () => [
      { label: "Public courses", value: publicCourses.length || "120+" },
      { label: "Avg. rating", value: avgRating },
      { label: "For teams", value: "Private paths" },
    ],
    [avgRating, publicCourses.length]
  );

  const bgMain = useColorModeValue("white", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const mutedBg = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const textPrimary = useColorModeValue("gray.800", "whiteAlpha.900");
  const textSecondary = useColorModeValue("gray.600", "gray.400");
  const glassBg = useColorModeValue("rgba(255,255,255,0.8)", "rgba(15,23,42,0.76)");
  const subtleBorder = useColorModeValue("rgba(255,255,255,0.68)", "rgba(255,255,255,0.08)");
  const gridOverlayOpacity = useColorModeValue(0.08, 0.05);
  const glowOneOpacity = useColorModeValue(0.22, 0.16);
  const glowTwoOpacity = useColorModeValue(0.18, 0.14);
  const glowThreeOpacity = useColorModeValue(0.32, 0.1);
  const heroBaseBg = useColorModeValue(
    "linear-gradient(135deg, var(--chakra-colors-brand-50) 0%, #FFFFFF 42%, var(--chakra-colors-brand-100) 100%)",
    "linear-gradient(135deg, var(--chakra-colors-gray-900) 0%, var(--chakra-colors-gray-800) 48%, var(--chakra-colors-brand-900) 100%)"
  );
  const learnerPanelBg = useColorModeValue(
    "linear-gradient(135deg, var(--chakra-colors-brand-700) 0%, var(--chakra-colors-brand-500) 60%, var(--chakra-colors-brand-400) 100%)",
    "linear-gradient(135deg, var(--chakra-colors-brand-900) 0%, var(--chakra-colors-brand-700) 55%, var(--chakra-colors-brand-500) 100%)"
  );
  const [brand50, brand100, brand200, brand300, brand400, brand500, brand600, brand700, brand900] = useToken("colors", [
    "brand.50",
    "brand.100",
    "brand.200",
    "brand.300",
    "brand.400",
    "brand.500",
    "brand.600",
    "brand.700",
    "brand.900",
  ]);

  const categoryChips = ["Design", "Engineering", "Leadership", "Compliance", "AI & Data"];
  const accentGradients = [
    `linear-gradient(135deg, ${brand600} 0%, ${brand400} 100%)`,
    `linear-gradient(135deg, ${brand500} 0%, ${brand300} 100%)`,
    `linear-gradient(135deg, ${brand700} 0%, ${brand500} 100%)`,
    `linear-gradient(135deg, ${brand400} 0%, ${brand200} 100%)`,
  ];
 


  const handleExplore = () => {
    const query = searchQuery.trim();
    router.push(query ? `/course?search=${encodeURIComponent(query)}` : "/course");
  };

  return (
    <Box minH="100vh" bg={bgMain}>

<Box
  as="section"
  position="relative"
  overflow="hidden"
  bgImage={heroBaseBg}
  pb={{ base: 4, md: 8 }}
  borderBottomWidth="1px"
  borderColor={subtleBorder}
>
  <Box
    position="absolute"
    inset={0}
    opacity={gridOverlayOpacity}
    backgroundImage="linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)"
    backgroundSize={{ base: "28px 28px", md: "44px 44px" }}
    color={brand900}
    pointerEvents="none"
  />

  <Circle
    size={{ base: "180px", md: "300px" }}
    bg={brand400}
    opacity={glowOneOpacity}
    position="absolute"
    top={{ base: "-70px", md: "-100px" }}
    left={{ base: "-70px", md: "-60px" }}
    filter="blur(70px)"
    pointerEvents="none"
  />
  <Circle
    size={{ base: "200px", md: "340px" }}
    bg={brand500}
    opacity={glowTwoOpacity}
    position="absolute"
    top={{ base: "10px", md: "30px" }}
    right={{ base: "-100px", md: "-100px" }}
    filter="blur(80px)"
    pointerEvents="none"
  />
  <Circle
    size={{ base: "150px", md: "240px" }}
    bg={brand200}
    opacity={glowThreeOpacity}
    position="absolute"
    bottom={{ base: "-70px", md: "-110px" }}
    left={{ base: "35%", md: "30%" }}
    filter="blur(80px)"
    pointerEvents="none"
  />

  <Box
    maxW="8xl"
    mx="auto"
    px={{ base: 4, md: 8 }}
    py={{ base: 4, md: 8 }}
    position="relative"
    zIndex={1}
  >
    <Grid
      templateColumns={{ base: "1fr", lg: "minmax(0,1fr) 380px" }}
      gap={{ base: 4, lg: 8 }}
      alignItems="start"
    >
      <VStack align="start" spacing={{ base: 3, md: 4 }} maxW="2xl">
        <Badge
          bg={glassBg}
          color={brand700}
          borderRadius="full"
          px={3}
          py={1}
          borderWidth="1px"
          borderColor={subtleBorder}
          fontSize="10px"
          textTransform="uppercase"
          letterSpacing="0.08em"
          display="flex"
          alignItems="center"
          gap={1}
        >
          <Icon as={FaBolt} boxSize={2.5} />
          Learning platform
        </Badge>

        <Heading
          as="h1"
          fontSize={{ base: "1.7rem", sm: "2rem", md: "2.6rem" }}
          fontWeight="extrabold"
          lineHeight="1.1"
          color={textPrimary}
          letterSpacing="-0.03em"
        >
          Learn &amp; grow{" "}
          <Text
            as="span"
            bgGradient={`linear(to-r, ${brand700}, ${brand500}, ${brand300})`}
            bgClip="text"
          >
            faster
          </Text>
        </Heading>

        <Text
          display={{ base: "none", sm: "block" }}
          fontSize={{ sm: "xs", md: "sm" }}
          color={textSecondary}
          maxW="38ch"
          lineHeight="1.7"
        >
          Discover courses, compare formats, and jump back into your assignments all in one place.
        </Text>

        <Flex
          w="full"
          maxW={{ base: "100%", md: "560px" }}
          p={1.5}
          bg={glassBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={subtleBorder}
          backdropFilter="blur(20px)"
          gap={2}
          align="center"
        >
          <Flex align="center" gap={2} px={3} flex="1" minW={0}>
            <Icon as={FaSearch} color={brand500} boxSize={3.5} flexShrink={0} />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search courses, topics..."
              border="none"
              h="36px"
              fontSize="sm"
              _focusVisible={{ boxShadow: "none" }}
              px={0}
            />
          </Flex>
          <Button
            colorScheme="brand"
            borderRadius="lg"
            h={{ base: "32px", md: "36px" }}
            px={4}
            fontSize="sm"
            rightIcon={<FaArrowRight size={11} />}
            bgGradient={`linear(to-r, ${brand700}, ${brand500}, ${brand400})`}
            _hover={{
              bgGradient: `linear(to-r, ${brand700}, ${brand600}, ${brand500})`,
              transform: "translateY(-1px)",
            }}
            onClick={handleExplore}
            flexShrink={0}
          >
            Explore
          </Button>
        </Flex>

        <SimpleGrid columns={3} spacing={{base:1,md:2}} w="full" maxW={{ base: "100%", md: "560px" }}>
          {heroHighlights.map((item) => (
            <Box
              key={item.label}
              bg={glassBg}
              borderWidth="1px"
              borderColor={subtleBorder}
              borderRadius="lg"
              px={{base:1,md:3}}
              py={2.5}
              backdropFilter="blur(16px)"
              textAlign="center"
            >
              <Text
                fontSize={{ base: "9px", md: "10px" }}
                textTransform="uppercase"
                letterSpacing="0.07em"
                color={textSecondary}
              >
                {item.label}
              </Text>
              <Text
                mt={0.5}
                fontSize={{ base: "xs", md: "md" }}
                fontWeight="800"
                color={textPrimary}
              >
                {item.value}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        <HStack spacing={1.5} flexWrap="wrap">
          {categoryChips.map((item) => (
            <Button
              key={item}
              size="xs"
              variant="ghost"
              borderRadius="full"
              bg={glassBg}
              color={textSecondary}
              borderWidth="1px"
              borderColor={borderColor}
              fontSize="11px"
              px={3}
              h="26px"
              _hover={{ color: brand700, borderColor: brand200, bg: cardBg }}
            >
              {item}
            </Button>
          ))}
        </HStack>

        {isLearner && featuredAssignedCourses.length > 0 ? (
          <Box
            display={{ base: "block", lg: "none" }}
            w="full"
            maxW={{ base: "100%", md: "560px" }}
            bg={glassBg}
            borderWidth="1px"
            borderColor={subtleBorder}
            borderRadius="xl"
            p={3}
            backdropFilter="blur(16px)"
          >
            <HStack justify="space-between" mb={3}>
              <Text
                fontSize="10px"
                textTransform="uppercase"
                letterSpacing="0.08em"
                fontWeight="700"
                color={textSecondary}
              >
                Resume learning
              </Text>
              <Icon as={FaLock} color={brand500} boxSize={3} />
            </HStack>
            <Stack spacing={2}>
              {featuredAssignedCourses.map((course) => (
                <Flex
                  key={course.courseId}
                  align="center"
                  gap={3}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={subtleBorder}
                  borderRadius="lg"
                  p={2.5}
                >
                  <Box flex="1" minW={0}>
                    <Text fontWeight="700" fontSize="xs" noOfLines={1} color={textPrimary}>
                      {course.title}
                    </Text>
                    <Progress
                      value={Math.round(Number(course.progress || 0))}
                      size="xs"
                      mt={1.5}
                      borderRadius="full"
                      bg="blackAlpha.100"
                      sx={{
                        "& > div": {
                          background: `linear-gradient(90deg, ${brand700}, ${brand300})`,
                        },
                      }}
                    />
                    <Text fontSize="10px" color={textSecondary} mt={1}>
                      {Math.round(Number(course.progress || 0))}% complete
                    </Text>
                  </Box>
                  <Button
                    size="xs"
                    leftIcon={<FaPlayCircle size={10} />}
                    colorScheme="brand"
                    borderRadius="full"
                    flexShrink={0}
                    bgGradient={`linear(to-r, ${brand700}, ${brand500})`}
                    _hover={{ bgGradient: `linear(to-r, ${brand700}, ${brand600})` }}
                    onClick={() => router.push(`/course?courseId=${course.courseId}`)}
                  >
                    Continue
                  </Button>
                </Flex>
              ))}
            </Stack>
          </Box>
        ) : null}
      </VStack>

      {isLearner && featuredAssignedCourses.length > 0 ? (
        <Box display={{ base: "none", lg: "block" }}>
          <Box
            bgImage={learnerPanelBg}
            borderRadius="2xl"
            position="relative"
            overflow="hidden"
            p={4}
            color="white"
            boxShadow="0 20px 48px rgba(15, 23, 42, 0.18)"
          >
            <Circle
              size="140px"
              position="absolute"
              top="-50px"
              right="-30px"
              bg={brand200}
              opacity={0.25}
              filter="blur(36px)"
              pointerEvents="none"
            />

            <HStack justify="space-between" mb={4}>
              <VStack align="start" spacing={0.5}>
                <Text
                  fontSize="9px"
                  color="whiteAlpha.700"
                  textTransform="uppercase"
                  letterSpacing="0.12em"
                  fontWeight="700"
                >
                  Assigned courses
                </Text>
                <Text fontSize="sm" fontWeight="700">
                  Resume your learning
                </Text>
              </VStack>
              <Circle size="32px" bg="whiteAlpha.200">
                <Icon as={FaLock} boxSize={3} />
              </Circle>
            </HStack>

            <Stack spacing={2.5}>
              {featuredAssignedCourses.map((course) => (
                <Box
                  key={course.courseId}
                  p={3}
                  borderRadius="xl"
                  bg="whiteAlpha.100"
                  border="1px solid rgba(255,255,255,0.12)"
                >
                  <Flex justify="space-between" gap={2.5} align="start">
                    <Box flex="1" minW={0}>
                      <Text fontWeight="700" fontSize="sm" noOfLines={2}>
                        {course.title}
                      </Text>
                      <Progress
                        value={Math.round(Number(course.progress || 0))}
                        size="xs"
                        mt={2}
                        borderRadius="full"
                        bg="whiteAlpha.200"
                        sx={{
                          "& > div": {
                            background: `linear-gradient(90deg, ${brand50}, ${brand300})`,
                          },
                        }}
                      />
                      <Text fontSize="xs" color="whiteAlpha.700" mt={1}>
                        {Math.round(Number(course.progress || 0))}% complete
                      </Text>
                    </Box>
                    <Button
                      size="sm"
                      leftIcon={<FaPlayCircle size={12} />}
                      bg="white"
                      color={brand700}
                      borderRadius="full"
                      flexShrink={0}
                      fontSize="xs"
                      _hover={{ bg: brand50 }}
                      onClick={() => router.push(`/course?courseId=${course.courseId}`)}
                    >
                      Continue
                    </Button>
                  </Flex>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      ) : null}
    </Grid>
  </Box>
</Box>

      
      {/* <Box as="section" position="relative" overflow="hidden" pb={{ base: 8, md: 14 }} bgImage={heroBaseBg}>
        <Box
          position="absolute"
          inset={0}
          opacity={gridOverlayOpacity}
          backgroundImage="linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)"
          backgroundSize={{ base: "28px 28px", md: "44px 44px" }}
          color={brand900}
        />
        <Circle
          size={{ base: "220px", md: "360px", xl: "460px" }}
          bg={brand400}
          opacity={glowOneOpacity}
          position="absolute"
          top={{ base: "-80px", md: "-120px" }}
          left={{ base: "-90px", md: "-80px" }}
          filter="blur(90px)"
        />
        <Circle
          size={{ base: "260px", md: "420px", xl: "540px" }}
          bg={brand500}
          opacity={glowTwoOpacity}
          position="absolute"
          top={{ base: "20px", md: "40px" }}
          right={{ base: "-140px", md: "-120px" }}
          filter="blur(95px)"
        />
        <Circle
          size={{ base: "190px", md: "290px", xl: "360px" }}
          bg={brand200}
          opacity={glowThreeOpacity}
          position="absolute"
          bottom={{ base: "-90px", md: "-140px" }}
          left={{ base: "35%", md: "30%" }}
          filter="blur(100px)"
        />

        <Box maxW="8xl" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }} position="relative" zIndex={1}>
          <Grid templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) 400px" }} gap={{ base: 6, lg: 6, xl: 8 }} alignItems="center">
            <Box>
              <VStack align="start" spacing={{ base: 4, md: 5 }} maxW="2xl">
                <Badge
                  bg={glassBg}
                  color={brand700}
                  borderRadius="full"
                  px={3}
                  py={1.5}
                  borderWidth="1px"
                  borderColor={subtleBorder}
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  Discover, continue, and manage learning
                </Badge>
              <Heading
                as="h1"
                fontSize={{ base: "2rem", sm: "2.5rem", md: "3.25rem", xl: "3rem" }}
                fontWeight="extrabold"
                lineHeight={{ base: "1.1", md: "1.04" }}
                color={textPrimary}
                letterSpacing="-0.03em"
                maxW="14ch"
              >
                Learn, resume, and grow{" "}
                <Text as="span" bgGradient={`linear(to-r, ${brand700}, ${brand500}, ${brand300})`} bgClip="text">
                  faster
                </Text>
              </Heading>

              <Text fontSize={{ base: "sm", md: "md" }} color={textSecondary} maxW="xl" lineHeight={{ base: "1.7", md: "1.8" }}>
                Search the open catalog, compare pricing and course formats, and jump back into your private assignments
                all from one beautifully focused home.
              </Text>

              <Flex
                w="full"
                p={2}
                bg={glassBg}
                borderRadius={{ base: "xl", md: "20px" }}
                borderWidth="1px"
                borderColor={subtleBorder}
                backdropFilter="blur(20px)"
                boxShadow={{ base: "0 10px 24px rgba(15, 23, 42, 0.08)", md: "0 16px 48px rgba(15, 23, 42, 0.12)" }}
                gap={{ base: 3, sm: 2 }}
                direction={{ base: "column", sm: "row" }}
                align="center"
                maxW={{ base: "100%", md: "620px" }}
              >
                <Flex align="center" gap={{ base: 2, md: 3 }} px={{ base: 3, md: 4 }} flex="1" minW={0} w="full">
                  <Icon as={FaSearch} color={brand500} />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search courses, topics, instructors..."
                    border="none"
                    h={{ base: "38px", md: "46px" }}
                    fontSize={{ base: "sm", md: "md" }}
                    _focusVisible={{ boxShadow: "none" }}
                    px={0}
                  />
                </Flex>
                <Button
                  colorScheme="brand"
                  borderRadius={{ base: "md", md: "xl" }}
                  h={{ base: "36px", md: "46px" }}
                  w={{ base: "auto", sm: "auto" }}
                  alignSelf={{ base: "flex-end", sm: "stretch" }}
                  minW={{ sm: "140px" }}
                  px={{ base: 4, md: 6 }}
                  rightIcon={<FaArrowRight />}
                  fontSize={{ base: "xs", md: "md" }}
                  bgGradient={`linear(to-r, ${brand700}, ${brand500}, ${brand400})`}
                  _hover={{ bgGradient: `linear(to-r, ${brand700}, ${brand600}, ${brand500})`, transform: "translateY(-1px)" }}
                  onClick={handleExplore}
                >
                  Explore
                </Button>
              </Flex>

              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} w="full" maxW="620px">
                {heroHighlights.map((item) => (
                  <Box
                    key={item.label}
                    bg={glassBg}
                    borderWidth="1px"
                    borderColor={subtleBorder}
                    borderRadius="xl"
                    px={4}
                    py={3}
                    backdropFilter="blur(16px)"
                  >
                    <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={textSecondary}>
                      {item.label}
                    </Text>
                    <Text mt={1} fontSize={{ base: "md", md: "lg" }} fontWeight="800" color={textPrimary}>
                      {item.value}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>

              <HStack spacing={2} flexWrap="wrap">
                {categoryChips.map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant="ghost"
                    borderRadius="full"
                    bg={glassBg}
                    color={textSecondary}
                    borderWidth="1px"
                    borderColor={borderColor}
                    _hover={{ color: brand700, borderColor: brand200, bg: cardBg }}
                  >
                    {item}
                  </Button>
                ))}
              </HStack>
              </VStack>
            </Box>

            <Stack spacing={4} display={{ base: "none", lg: "flex" }}>
              {isLearner && featuredAssignedCourses.length > 0 ? (
                <MotionBox
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.12 }}
                  bgImage={learnerPanelBg}
                  borderRadius="28px"
                  position="relative"
                  overflow="hidden"
                  p={4}
                  color="white"
                  boxShadow="0 24px 56px rgba(15, 23, 42, 0.2)"
                >
                  <Circle
                    size="180px"
                    position="absolute"
                    top="-60px"
                    right="-40px"
                    bg={brand200}
                    opacity={0.28}
                    filter="blur(40px)"
                  />
                  <HStack justify="space-between" mb={4}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="0.12em" fontWeight="700">
                        Assigned Courses
                      </Text>
                      <Heading size="sm">Resume your learning</Heading>
                    </VStack>
                    <Circle size="38px" bg="whiteAlpha.200">
                      <Icon as={FaLock} />
                    </Circle>
                  </HStack>

                  <Stack spacing={3}>
                    {featuredAssignedCourses.map((course) => (
                      <Box
                        key={course.courseId}
                        p={3.5}
                        borderRadius="20px"
                        bg="whiteAlpha.100"
                        border="1px solid rgba(255,255,255,0.12)"
                      >
                        <Flex justify="space-between" gap={3} align="start">
                          <Box flex="1">
                            <Text fontWeight="700" noOfLines={2}>{course.title}</Text>
                            <Progress
                              value={Math.round(Number(course.progress || 0))}
                              size="xs"
                              mt={2}
                              borderRadius="full"
                              bg="whiteAlpha.200"
                              sx={{
                                "& > div": {
                                  background: `linear-gradient(90deg, ${brand50}, ${brand300})`,
                                },
                              }}
                            />
                            <Text fontSize="sm" color="whiteAlpha.700" mt={1.5}>
                              {Math.round(Number(course.progress || 0))}% complete
                            </Text>
                          </Box>
                          <Button
                            size="sm"
                            leftIcon={<FaPlayCircle />}
                            bg="white"
                            color={brand700}
                            borderRadius="full"
                            flexShrink={0}
                            _hover={{ bg: brand50 }}
                            onClick={() => router.push(`/course?courseId=${course.courseId}`)}
                          >
                            Continue
                          </Button>
                        </Flex>
                      </Box>
                    ))}
                  </Stack>
                </MotionBox>
              ) : null}
            </Stack>
          </Grid>
        </Box>
      </Box> */}

      <Box as="section" py={{ base: 10, md: 20 }} bg={mutedBg}>
        <Box maxW="8xl" mx="auto" px={{ base: 4, md: 8 }}>
          <Flex justify="space-between" align="flex-end" mb={{ base: 5, md: 10 }} flexWrap="wrap" gap={4}>
            <VStack align="start" spacing={2}>
              <Badge bg={brand50} color={brand700} borderRadius="full" px={3} py={1}>
                Explore Public Courses
              </Badge>
              <Heading size={{ base: "md", md: "xl" }} color={textPrimary}>
                Courses to start{" "}
                <Text as="span" bgGradient={`linear(to-r, ${brand500}, ${brand300})`} bgClip="text">
                  right now
                </Text>
              </Heading>
              <Text color={textSecondary}>
                Public courses stay open to everyone, while private assignments remain visible for your signed-in learners.
              </Text>
            </VStack>
            <Button
              size={{ base: "sm", md: "md" }}
              variant="outline"
              borderColor={brand200}
              color={brand700}
              rightIcon={<FaArrowRight />}
              _hover={{ bg: brand50, borderColor: brand400 }}
              onClick={() => router.push("/course")}
            >
              Browse
            </Button>
          </Flex>

          {stores.courseStore.isPublicCoursesLoading ? (
            <HStack justify="center" py={14}>
              <Spinner color={brand500} />
              <Text color={textSecondary}>Loading course highlights...</Text>
            </HStack>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={{ base: 4, md: 6 }}>
              {featuredPublicCourses.map((course) => (
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
      </Box>
    </Box>
  );
});
