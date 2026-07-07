"use client";

import { isLearnerRole } from "@/app/config/utils/roleAccess";
import BatchesWorkspace from "@/app/dashboard/batches/components/BatchesWorkspace";
import stores from "@/app/store/stores";
import {
  Badge,
  Box,
  Button,
  Grid,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  useColorModeValue,
  useToken,
  VStack,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { FiArrowRight, FiBookOpen, FiGrid, FiUsers } from "react-icons/fi";

const MainBatchesPage = observer(() => {
  const role = String(stores.auth.userType || stores.auth.user?.role || "").toLowerCase();
  const isLearner = Boolean(stores.auth.user) && isLearnerRole(role);
  const pageBg = useColorModeValue("#F8FAFC", "gray.900");
  const heroBg = useColorModeValue(
    "linear-gradient(135deg, var(--chakra-colors-brand-50) 0%, #ffffff 50%, var(--chakra-colors-brand-100) 100%)",
    "linear-gradient(135deg, var(--chakra-colors-gray-900) 0%, rgba(15, 23, 42, 0.98) 42%, var(--chakra-colors-brand-900) 100%)"
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.300");
  const accentGradient = useColorModeValue(
    "linear(to-r, brand.700, brand.500, brand.300)",
    "linear(to-r, brand.200, brand.400, brand.600)"
  );
  const panelShadow = useColorModeValue(
    "0 20px 60px rgba(15, 23, 42, 0.08)",
    "0 26px 70px rgba(2, 6, 23, 0.34)"
  );
  const featureRowBg = useColorModeValue("rgba(248, 250, 252, 0.9)", "whiteAlpha.50");
  const [brand50, brand100, brand200, brand400, brand500, brand700] = useToken("colors", [
    "brand.50",
    "brand.100",
    "brand.200",
    "brand.400",
    "brand.500",
    "brand.700",
  ]);

  if (!isLearner) {
    return (
      <Box minH="100vh" bg={pageBg} overflow="hidden">
        <Box
          position="relative"
          borderBottomWidth="1px"
          borderColor={borderColor}
          bg={heroBg}
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="-80px"
            right="-60px"
            w={{ base: "220px", md: "300px" }}
            h={{ base: "220px", md: "300px" }}
            bg={brand400}
            opacity={{ base: 0.16, md: 0.2 }}
            filter="blur(50px)"
            borderRadius="full"
            pointerEvents="none"
          />
          <Box
            position="absolute"
            bottom="-100px"
            left="-70px"
            w={{ base: "220px", md: "280px" }}
            h={{ base: "220px", md: "280px" }}
            bg={brand200}
            opacity={{ base: 0.14, md: 0.18 }}
            filter="blur(54px)"
            borderRadius="full"
            pointerEvents="none"
          />

          <Box maxW="8xl" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 8, md: 14 }} position="relative">
            <Grid templateColumns={{ base: "1fr", lg: "1.1fr 0.9fr" }} gap={{ base: 6, lg: 10 }} alignItems="center">
              <Box>
                <Badge bg={brand50} color={brand700} borderRadius="full" px={3} py={1} textTransform="none">
                  Learner batches
                </Badge>

                <Heading
                  mt={{ base: 3, md: 4 }}
                  fontSize={{ base: "3xl", md: "5xl", xl: "6xl" }}
                  lineHeight={{ base: "1.08", md: "1.02" }}
                  letterSpacing="-0.04em"
                  maxW="12ch"
                >
                  Join your next
                  <Text as="span" bgGradient={accentGradient} bgClip="text">
                    {" "}
                    learning cohort
                  </Text>
                </Heading>

                <Text mt={{ base: 4, md: 5 }} color={mutedText} fontSize={{ base: "sm", md: "lg" }} maxW="2xl" lineHeight="1.8">
                  Sign in with your learner account to open assigned batches, track dates, and jump directly into the
                  courses inside each cohort.
                </Text>

                <HStack mt={{ base: 5, md: 7 }} spacing={3} flexWrap="wrap">
                  <Button
                    as={Link}
                    href="/login"
                    colorScheme="brand"
                    borderRadius="full"
                    rightIcon={<FiArrowRight />}
                    px={{ base: 5, md: 6 }}
                  >
                    Go to login
                  </Button>
                  <Button
                    as={Link}
                    href="/course"
                    variant="outline"
                    borderRadius="full"
                    borderColor={borderColor}
                    color={mutedText}
                  >
                    Explore courses
                  </Button>
                </HStack>
              </Box>

              <Stack
                spacing={4}
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius={{ base: "2xl", md: "3xl" }}
                p={{ base: 4, md: 6 }}
                boxShadow={panelShadow}
              >
                {[
                  {
                    icon: FiGrid,
                    title: "Organized cohorts",
                    text: "See each assigned batch in one place with clear schedules and progress context.",
                    iconColor: brand700,
                    iconBg: brand50,
                  },
                  {
                    icon: FiBookOpen,
                    title: "Course bundles",
                    text: "Open the exact courses attached to a batch without hunting through the full catalog.",
                    iconColor: brand500,
                    iconBg: brand100,
                  },
                  {
                    icon: FiUsers,
                    title: "Team learning flow",
                    text: "Keep up with cohort-based training designed for onboarding, compliance, and upskilling.",
                    iconColor: "green.500",
                    iconBg: brand200,
                  },
                ].map((item) => (
                  <HStack
                    key={item.title}
                    align="start"
                    spacing={4}
                    p={{ base: 3, md: 4 }}
                    borderRadius="2xl"
                    bg={featureRowBg}
                  >
                    <Box
                      w="44px"
                      h="44px"
                      borderRadius="xl"
                      display="grid"
                      placeItems="center"
                      bg={item.iconBg}
                      flexShrink={0}
                    >
                      <Icon as={item.icon} color={item.iconColor} boxSize={5} />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="800">{item.title}</Text>
                      <Text color={mutedText} fontSize="sm" lineHeight="1.7">
                        {item.text}
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </Stack>
            </Grid>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg}>
      <BatchesWorkspace courseBasePath="/course" />
    </Box>
  );
});

export default MainBatchesPage;
