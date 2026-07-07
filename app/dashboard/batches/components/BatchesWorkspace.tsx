"use client";

import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import { isLearnerRole } from "@/app/config/utils/roleAccess";
import { batchStore } from "@/app/store/batchStore/batchStore";
import stores from "@/app/store/stores";
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Spinner,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast,
  useToken
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiAward,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiGrid,
  FiMoreVertical,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiTrendingUp,
  FiUserPlus,
  FiUsers
} from "react-icons/fi";
import BatchCard from "./BatchCard";
import BatchCreationModal from "./BatchCreationModal";
import BatchDetailsDrawer from "./BatchDetailsDrawer";

type BatchesWorkspaceProps = {
  courseBasePath?: string;
};

const BatchesWorkspace = observer(
  ({
    courseBasePath = "/dashboard/course/my-courses",
  }: BatchesWorkspaceProps) => {
    const { auth, companyStore } = stores;
    const role = String(auth.userType || auth.user?.role || "").toLowerCase();
    const currentUserId = String(auth.user?._id || "");
    const router = useRouter();
    const toast = useToast();
    const isLearner = isLearnerRole(role);
    const isSuperadmin = role === "superadmin";
    const canCreate = hasPermission(auth.user, PERMISSION_KEYS.MANAGE_BATCHES);
    const canManage = hasPermission(auth.user, PERMISSION_KEYS.MANAGE_BATCHES);
    const creationDisclosure = useDisclosure();
    const detailsDisclosure = useDisclosure();
    const editDisclosure = useDisclosure();
    const [editStep, setEditStep] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"card" | "table">("card");
    const [sortBy, setSortBy] = useState<"name" | "date" | "users" | "status">("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const companyId = isSuperadmin
      ? companyStore.getActiveCompanyId()
      : auth.company;
    const companies = companyStore.companies.data || [];
    const activeCompany =
      companies.find((company: any) => company._id === companyId) ||
      auth.user?.companyDetails ||
      null;

    const cardBg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const textColor = useColorModeValue("gray.600", "gray.300");
    const learnerHeroBg = useColorModeValue(
      "linear-gradient(135deg, var(--chakra-colors-brand-50) 0%, #ffffff 48%, var(--chakra-colors-brand-100) 100%)",
      "linear-gradient(135deg, var(--chakra-colors-gray-900) 0%, rgba(15, 23, 42, 0.98) 42%, var(--chakra-colors-brand-900) 100%)"
    );
    const learnerHeroPanelBg = useColorModeValue(
      "rgba(255,255,255,0.82)",
      "rgba(15, 23, 42, 0.42)"
    );
    const learnerHeroSearchBg = useColorModeValue(
      "rgba(255,255,255,0.68)",
      "rgba(15, 23, 42, 0.34)"
    );
    const learnerHeroBorderColor = useColorModeValue("brand.100", "whiteAlpha.200");
    const learnerHeroText = useColorModeValue("gray.800", "white");
    const learnerHeroMutedText = useColorModeValue("gray.600", "gray.300");
    const learnerHeroBadgeBg = useColorModeValue("brand.50", "whiteAlpha.200");
    const learnerHeroAccentGradient = useColorModeValue(
      "linear(to-r, brand.700, brand.500, brand.300)",
      "linear(to-r, brand.200, brand.400, brand.600)"
    );
    const learnerHeroShadow = useColorModeValue(
      "0 18px 54px rgba(15, 23, 42, 0.08)",
      "0 24px 70px rgba(2, 6, 23, 0.34)"
    );
    const learnerHeroStatShadow = useColorModeValue(
      "0 12px 32px rgba(15, 23, 42, 0.06)",
      "0 18px 40px rgba(2, 6, 23, 0.2)"
    );
    const [brand50, brand100, brand200, brand300, brand400, brand500, brand700] = useToken("colors", [
      "brand.50",
      "brand.100",
      "brand.200",
      "brand.300",
      "brand.400",
      "brand.500",
      "brand.700",
    ]);

    useEffect(() => {
      if (isSuperadmin) {
        companyStore.getManagedCompanies().catch(() => undefined);
      }
    }, [companyStore, isSuperadmin]);

    useEffect(() => {
      if (isLearner) {
        batchStore.fetchMyBatches().catch(() => undefined);
        return;
      }

      if (!companyId && isSuperadmin) {
        return;
      }

      batchStore
        .fetchBatches({ companyId: companyId || undefined })
        .catch(() => undefined);
    }, [companyId, isSuperadmin, isLearner]);

    const items = isLearner ? batchStore.myBatches : batchStore.batches;
    const isLoading = isLearner
      ? batchStore.isMyBatchesLoading
      : batchStore.isLoading;
    
    const filteredItems = useMemo(() => {
      const query = searchQuery.trim().toLowerCase();

      let filtered = items.filter((batch) => {
        const searchableText = [
          batch.name,
          batch.company?.company_name,
          batch.createdBy?.name,
          batch.createdBy?.email,
          batch.createdBy?.username,
          batch.status,
          batch.durationLabel,
          batch.startDate ? new Date(batch.startDate).toLocaleDateString() : "",
          batch.endDate ? new Date(batch.endDate).toLocaleDateString() : "",
          String(batch.courseCount ?? ""),
          String(batch.userCount ?? ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });

      // Apply sorting
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "date":
            const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
            comparison = dateA - dateB;
            break;
          case "users":
            comparison = (a.userCount || 0) - (b.userCount || 0);
            break;
          case "status":
            comparison = (a.status || "").localeCompare(b.status || "");
            break;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });

      return filtered;
    }, [items, searchQuery, sortBy, sortOrder]);

    // Calculate statistics
    const stats = useMemo(() => {
      const totalBatches = items.length;
      const activeBatches = items.filter(b => b.status === "active").length;
      const completedBatches = items.filter(b => b.status === "completed").length;
      const totalUsers = items.reduce((sum, b) => sum + (b.userCount || 0), 0);
      const totalCourses = items.reduce((sum, b) => sum + (b.courseCount || 0), 0);
      
      return {
        totalBatches,
        activeBatches,
        completedBatches,
        totalUsers,
        totalCourses,
        completionRate: totalBatches > 0 ? Math.round((completedBatches / totalBatches) * 100) : 0,
      };
    }, [items]);

    const refreshBatches = async () => {
      if (isLearner) {
        await batchStore.fetchMyBatches();
        return;
      }

      await batchStore.fetchBatches({ companyId: companyId || undefined });
    };

    const handleBatchClick = async (batchId: string) => {
      detailsDisclosure.onOpen();
      await batchStore.fetchBatchDetails(batchId).catch(() => undefined);
    };

    const handleEditOpen = (initialStep = 0) => {
      setEditStep(initialStep);
      detailsDisclosure.onClose();
      editDisclosure.onOpen();
    };

    const canDeleteActiveBatch = Boolean(
      canManage &&
      batchStore.activeBatch?._id &&
      currentUserId &&
      String(batchStore.activeBatch.createdBy?._id || "") === currentUserId
    );

    const handleDeleteBatch = async () => {
      if (!batchStore.activeBatch?._id) {
        return;
      }

      const confirmed = window.confirm(
        `Delete "${batchStore.activeBatch.name}"? Learners will lose access to this batch and its batch-based course access.`
      );
      if (!confirmed) {
        return;
      }

      try {
        await batchStore.deleteBatch(batchStore.activeBatch._id);
        toast({
          title: "Batch deleted",
          description: "The batch and its batch-based learner access have been removed.",
          status: "success",
          duration: 4000,
          position: "top-right",
        });
        detailsDisclosure.onClose();
        batchStore.clearActiveBatch();
        await refreshBatches();
      } catch (error: any) {
        toast({
          title: "Unable to delete batch",
          description: error?.message || error?.error || "Please try again.",
          status: "error",
          duration: 4500,
          position: "top-right",
        });
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "active":
          return FiCheckCircle;
        case "completed":
          return FiAward;
        default:
          return FiClock;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "active":
          return "green";
        case "completed":
          return "blue";
        default:
          return "gray";
      }
    };

    const MobileStatChip = ({
  label,
  value,
  icon,
  colorScheme,
}: {
  label: string;
  value: string | number;
  icon: any;
  colorScheme: string;
}) => {
  const bg = useColorModeValue("white", "whiteAlpha.100");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("gray.900", "white");
  const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.300`);

  return (
    <HStack
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      rounded="full"
      px={3}
      py={2}
      spacing={2}
      shadow="sm"
      flexShrink={0}
    >
      <Icon as={icon} boxSize={3.5} color={iconColor} />

      <Text fontSize="xs" fontWeight="700" color={labelColor}>
        {label}
      </Text>

      <Text fontSize="sm" fontWeight="900" color={valueColor}>
        {value}
      </Text>
    </HStack>
  );
};

    useEffect(() => {
  if (typeof window === "undefined") return;

  const forceCardViewOnMobile = () => {
    if (window.innerWidth < 768) {
      setViewMode("card");
    }
  };

  forceCardViewOnMobile();
  window.addEventListener("resize", forceCardViewOnMobile);

  return () => window.removeEventListener("resize", forceCardViewOnMobile);
}, []);


const BatchHeroIllustration = () => (
  <Box
    display={{ base: "none", md: "block" }}
    w={{ md: "190px", lg: "200px" }}
    flexShrink={0}
    opacity={0.96}
  >
    <svg viewBox="0 0 260 190" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="32" y="34" width="156" height="118" rx="24" fill="url(#paint0_linear)" />
      <rect x="55" y="59" width="82" height="10" rx="5" fill="white" opacity="0.9" />
      <rect x="55" y="82" width="108" height="8" rx="4" fill="white" opacity="0.55" />
      <rect x="55" y="102" width="72" height="8" rx="4" fill="white" opacity="0.55" />
      <circle cx="190" cy="63" r="30" fill="#38BDF8" />
      <path d="M178 63.5L186.5 72L203 55.5" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="150" y="105" width="76" height="50" rx="18" fill="#F97316" />
      <circle cx="173" cy="128" r="9" fill="white" opacity="0.9" />
      <circle cx="198" cy="128" r="9" fill="white" opacity="0.65" />
      <path d="M80 170C109.5 157.5 151.5 157.5 188 170" stroke="#93C5FD" strokeWidth="8" strokeLinecap="round" />
      <defs>
        <linearGradient id="paint0_linear" x1="32" y1="34" x2="188" y2="152" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </svg>
  </Box>
);


return (
  <Box
    minH="100dvh"
    w="100%"
    bg={
      isLearner
        ? "transparent"
        : useColorModeValue(
            "linear-gradient(135deg, #f8fafc 0%, #eef2ff 48%, #f5f3ff 100%)",
            "linear-gradient(135deg, #020617 0%, #111827 48%, #172554 100%)"
          )
    }
    p={isLearner ? { base: 3, md: 6 } : { base: 0, md: 2 }}
    overflowX="hidden"
  >
    <Stack
      spacing={{ base: 3, md: 6 }}
      w="100%"
      mx={isLearner ? "auto" : 0}
    >


<Box
  borderRadius={{ base: "xl", md: "2xl" }}
  px={{ base: 4, md: 8 }}
  py={{ base: 4, md: 6 }} // Reduced mobile padding
  bg={
    isLearner
      ? learnerHeroBg
      : useColorModeValue(
          "linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)",
          "linear-gradient(135deg, #1f2937 0%, #1e3a8a 50%, #1e293b 100%)"
        )
  }
  borderWidth="1px"
  borderColor={
    isLearner ? learnerHeroBorderColor : useColorModeValue("blue.100", "blue.900")
  }
  boxShadow={isLearner ? learnerHeroShadow : { base: "sm", md: "md" }}
  color={isLearner ? learnerHeroText : useColorModeValue("inherit", "white")}
  position="relative"
  overflow="hidden"
  w="100%"
>
  {/* Abstract Background Blur (Kept subtle for depth) */}
  {isLearner && (
    <>
      <Box
        position="absolute"
        top="-50px"
        right="-20px"
        w={{ base: "150px", md: "250px" }}
        h={{ base: "150px", md: "250px" }}
        bg={brand400}
        opacity={{ base: 0.1, md: 0.15 }}
        filter="blur(40px)"
        borderRadius="full"
        pointerEvents="none"
      />
      {/* <Box
        position="absolute"
        bottom="-80px"
        left="-40px"
        w={{ base: "150px", md: "200px" }}
        h={{ base: "150px", md: "200px" }}
        bg={brand200}
        opacity={{ base: 0.1, md: 0.15 }}
        filter="blur(50px)"
        borderRadius="full"
        pointerEvents="none"
      /> */}
    </>
  )}

  <Stack spacing={{ base: 4, md: 6 }} position="relative" zIndex={1} w="100%">
    <Flex
      justify="space-between"
      align="center"
      direction="row"
      gap={{ base: 3, md: 6 }}
      w="100%"
    >
      <VStack align="start" spacing={{ base: 1, md: 3 }} flex={1} minW={0}>
        {isLearner ? (
          <>
            <HStack spacing={{ base: 2, md: 3 }} align="center">
              <Box
                w={{ base: "32px", md: "42px" }}
                h={{ base: "32px", md: "42px" }}
                borderRadius={{ base: "lg", md: "xl" }}
                display="grid"
                placeItems="center"
                bg={learnerHeroPanelBg}
                borderWidth="1px"
                borderColor={learnerHeroBorderColor}
                backdropFilter="blur(14px)"
                flexShrink={0}
              >
                <Icon as={FiGrid} boxSize={{ base: 3.5, md: 5 }} color={brand700} />
              </Box>

              {stats.totalBatches > 0 && (
                <Badge
                  bg={brand50}
                  color={brand700}
                  borderRadius="full"
                  px={{ base: 2, md: 3 }}
                  py={0.5}
                  fontSize={{ base: "2xs", md: "xs" }}
                  textTransform="none"
                >
                  {stats.totalBatches} batches assigned
                </Badge>
              )}
            </HStack>

            <Heading
              fontSize={{ base: "lg", md: "3xl", xl: "4xl" }}
              fontWeight="900"
              lineHeight="1.1"
              letterSpacing="-0.03em"
              color={learnerHeroText}
            >
              Stay in sync with your{" "}
              <Text as="span" bgGradient={learnerHeroAccentGradient} bgClip="text">
                batches
              </Text>
            </Heading>
          </>
        ) : (
          <HStack spacing={{ base: 2, md: 3 }} flexWrap="nowrap" w="100%">
            <Icon
              as={FiGrid}
              boxSize={{ base: 4, md: 6 }}
              color="blue.600"
              flexShrink={0}
            />
            <Heading
              size={{ base: "sm", md: "md" }}
              fontWeight="900"
              noOfLines={1}
              letterSpacing="-0.03em"
            >
              Batch Management
            </Heading>
            {stats.totalBatches > 0 && (
              <Badge
                display={{ base: "none", sm: "inline-flex" }}
                colorScheme="purple"
                variant="solid"
                borderRadius="full"
                px={2}
                py={0.5}
                fontSize="xs"
                flexShrink={0}
              >
                {stats.totalBatches} Batches
              </Badge>
            )}
          </HStack>
        )}

        {/* HIDDEN ON MOBILE TO SAVE SPACE */}
        <Text
          display={{ base: "none", md: "block" }}
          fontSize="sm"
          color={isLearner ? learnerHeroMutedText : "gray.600"}
          maxW="2xl"
        >
          {isLearner
            ? "Track assigned cohorts, review schedules, and launch the courses bundled into each batch from one clean workspace."
            : `Manage learning cohorts for ${
                activeCompany?.company_name || "your organization"
              } with intuitive controls and real-time insights.`}
        </Text>
      </VStack>

      {/* VECTOR ILLUSTRATION - Visible only on desktop to make it look better without breaking mobile */}
      {/* <Box display={{ base: "none", lg: "block" }} flexShrink={0}>
        <Image
          src="/images/batch/batch-hero.svg" // Replace with your actual vector SVG asset path
          alt="Vector Illustration"
          w="140px"
          h="auto"
          objectFit="contain"
          transform="translateY(-10px)"
        />
      </Box> */}

      {/* <BatchHeroIllustration /> */}

      {/* CREATE BUTTON */}
      {canCreate && !isLearner && (
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="blue"
          rounded="full"
          size={{ base: "sm", md: "md" }}
          onClick={creationDisclosure.onOpen}
          isDisabled={!companyId && isSuperadmin}
          px={{ base: 4, md: 6 }}
          flexShrink={0}
          _hover={{
            transform: { base: "none", md: "translateY(-2px)" },
            boxShadow: { base: "sm", md: "xl" },
          }}
          transition="all 0.2s"
        >
          <Text display={{ base: "none", sm: "inline" }}>Create New Batch</Text>
          <Text display={{ base: "inline", sm: "none" }}>Create</Text>
        </Button>
      )}
    </Flex>

    {/* LEARNER STATS - Made more compact on mobile */}
    {isLearner && (
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2, md: 4 }} w="100%">
        {[
          { label: "Batches", value: stats.totalBatches, icon: FiGrid, iconBg: brand50, iconColor: brand700 },
          { label: "Active", value: stats.activeBatches, icon: FiCheckCircle, iconBg: brand100, iconColor: "green.500" },
          { label: "Courses", value: stats.totalCourses, icon: FiBookOpen, iconBg: brand200, iconColor: brand500 },
          { label: "Learners", value: stats.totalUsers, icon: FiUsers, iconBg: brand300, iconColor: "teal.500" },
        ].map((item) => (
          <Box
            key={item.label}
            p={{ base: 2.5, md: 3 }}
            borderRadius="3xl"
            bg={learnerHeroPanelBg}
            borderWidth="1px"
            borderColor={learnerHeroBorderColor}
            backdropFilter="blur(14px)"
            boxShadow={learnerHeroStatShadow}
          >
            <HStack align="center" spacing={{ base: 2, md: 3 }}>
              <Box
                w={{ base: "28px", md: "42px" }}
                h={{ base: "28px", md: "42px" }}
                borderRadius="lg"
                display="grid"
                placeItems="center"
                flexShrink={0}
              >
                <Icon as={item.icon} color={item.iconColor} boxSize={{ base: 3, md: 5 }} />
              </Box>
              <Box minW={0}>
                <Text fontSize={{ base: "2xs", md: "xs" }} color={learnerHeroMutedText} textTransform="uppercase" letterSpacing="0.05em">
                  {item.label}
                </Text>
                <Text fontSize={{ base: "md", md: "xl" }} fontWeight="900" color={learnerHeroText} lineHeight="1.1">
                  {item.value}
                </Text>
              </Box>
            </HStack>
          </Box>
        ))}
      </SimpleGrid>
    )}

    {/* ADMIN DESKTOP STATS */}
    {!isLearner && stats.totalBatches > 0 && (
      <SimpleGrid
        display={{ base: "none", md: "grid" }}
        columns={{ md: 3, lg: 5 }}
        spacing={4}
        pt={2}
        w="100%"
      >
        {/* Same stat boxes as before, slightly tweaked spacing inside if needed, kept mostly intact for desktop */}
        <Box bg={useColorModeValue("white", "gray.800")} borderRadius="xl" p={4} boxShadow="sm" _hover={{ transform: "translateY(-2px)", transition: "all 0.2s" }}>
          <HStack justify="space-between">
            <Stat>
              <StatLabel fontSize="xs" color={useColorModeValue("gray.500", "gray.400")}>Total Batches</StatLabel>
              <StatNumber fontSize="xl" color={useColorModeValue("blue.600", "blue.400")}>{stats.totalBatches}</StatNumber>
              <StatHelpText fontSize="xs" m={0}><HStack spacing={1}><Icon as={FiTrendingUp} boxSize={3} /><Text>{stats.activeBatches} active</Text></HStack></StatHelpText>
            </Stat>
            <Box p={2} bg={useColorModeValue("blue.50", "blue.900")} borderRadius="lg" color={useColorModeValue("blue.500", "blue.300")}><Icon as={FiGrid} boxSize={5} /></Box>
          </HStack>
        </Box>

        <Box bg={useColorModeValue("white", "gray.800")} borderRadius="xl" p={4} boxShadow="sm" _hover={{ transform: "translateY(-2px)", transition: "all 0.2s" }}>
          <HStack justify="space-between">
            <Stat>
              <StatLabel fontSize="xs" color={useColorModeValue("gray.500", "gray.400")}>Total Learners</StatLabel>
              <StatNumber fontSize="xl" color={useColorModeValue("green.600", "green.400")}>{stats.totalUsers}</StatNumber>
            </Stat>
            <Box p={2} bg={useColorModeValue("green.50", "green.900")} borderRadius="lg" color={useColorModeValue("green.500", "green.300")}><Icon as={FiUsers} boxSize={5} /></Box>
          </HStack>
        </Box>

        <Box bg={useColorModeValue("white", "gray.800")} borderRadius="xl" p={4} boxShadow="sm" _hover={{ transform: "translateY(-2px)", transition: "all 0.2s" }}>
          <HStack justify="space-between">
            <Stat>
              <StatLabel fontSize="xs" color={useColorModeValue("gray.500", "gray.400")}>Total Courses</StatLabel>
              <StatNumber fontSize="xl" color={useColorModeValue("purple.600", "purple.400")}>{stats.totalCourses}</StatNumber>
            </Stat>
            <Box p={2} bg={useColorModeValue("purple.50", "purple.900")} borderRadius="lg" color={useColorModeValue("purple.500", "purple.300")}><Icon as={FiBookOpen} boxSize={5} /></Box>
          </HStack>
        </Box>

        <Box bg={useColorModeValue("white", "gray.800")} borderRadius="xl" p={4} boxShadow="sm" _hover={{ transform: "translateY(-2px)", transition: "all 0.2s" }}>
          <HStack justify="space-between">
            <Stat>
              <StatLabel fontSize="xs" color={useColorModeValue("gray.500", "gray.400")}>Completion Rate</StatLabel>
              <StatNumber fontSize="xl" color={useColorModeValue("orange.600", "orange.400")}>{stats.completionRate}%</StatNumber>
            </Stat>
            <Box p={2} bg={useColorModeValue("orange.50", "orange.900")} borderRadius="lg" color={useColorModeValue("orange.500", "orange.300")}><Icon as={FiAward} boxSize={5} /></Box>
          </HStack>
        </Box>

        <Box bg={useColorModeValue("white", "gray.800")} borderRadius="xl" p={4} boxShadow="sm" _hover={{ transform: "translateY(-2px)", transition: "all 0.2s" }}>
          <HStack justify="space-between">
            <Stat>
              <StatLabel fontSize="xs" color={useColorModeValue("gray.500", "gray.400")}>Active Batches</StatLabel>
              <StatNumber fontSize="xl" color={useColorModeValue("teal.600", "teal.400")}>{stats.activeBatches}</StatNumber>
            </Stat>
            <Box p={2} bg={useColorModeValue("teal.50", "teal.900")} borderRadius="lg" color={useColorModeValue("teal.500", "teal.300")}><Icon as={FiCalendar} boxSize={5} /></Box>
          </HStack>
        </Box>
      </SimpleGrid>
    )}

    {/* ADMIN MOBILE SCROLLABLE CHIPS - Adjusted padding for less vertical space */}
    {!isLearner && stats.totalBatches > 0 && (
      <Box
        display={{ base: "block", md: "none" }}
        overflowX="auto"
        pb={1}
        mt={-1}
        sx={{
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        <HStack spacing={2} minW="max-content">
          <MobileStatChip label="Batches" value={stats.totalBatches} icon={FiGrid} colorScheme="blue" />
          <MobileStatChip label="Learners" value={stats.totalUsers} icon={FiUsers} colorScheme="green" />
          <MobileStatChip label="Courses" value={stats.totalCourses} icon={FiBookOpen} colorScheme="purple" />
          <MobileStatChip label="Active" value={stats.activeBatches} icon={FiCalendar} colorScheme="teal" />
          <MobileStatChip label="Done" value={`${stats.completionRate}%`} icon={FiAward} colorScheme="orange" />
        </HStack>
      </Box>
    )}
  </Stack>
</Box>

      {/* <Box
        borderRadius={{ base: "xl", md: "2xl" }}
        px={{ base: 3, md: 8 }}
        py={{ base: 4, md: 6 }}
        bg={
          isLearner
            ? learnerHeroBg
            : useColorModeValue(
                "linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)",
                "linear-gradient(135deg, #1f2937 0%, #1e3a8a 50%, #1e293b 100%)"
              )
        }
        borderWidth="1px"
        borderColor={
          isLearner ? learnerHeroBorderColor : useColorModeValue("blue.100", "blue.900")
        }
        boxShadow={isLearner ? learnerHeroShadow : { base: "sm", md: "md" }}
        color={isLearner ? learnerHeroText : useColorModeValue("inherit", "white")}
        position="relative"
        overflow="hidden"
        w="100%"
      >
        {isLearner && (
          <>
            <Box
              position="absolute"
              top="-90px"
              right="-80px"
              w={{ base: "220px", md: "300px" }}
              h={{ base: "220px", md: "300px" }}
              bg={brand400}
              opacity={{ base: 0.16, md: 0.2 }}
              filter="blur(54px)"
              borderRadius="full"
              pointerEvents="none"
            />
            <Box
              position="absolute"
              bottom="-110px"
              left="-80px"
              w={{ base: "220px", md: "280px" }}
              h={{ base: "220px", md: "280px" }}
              bg={brand200}
              opacity={{ base: 0.14, md: 0.18 }}
              filter="blur(60px)"
              borderRadius="full"
              pointerEvents="none"
            />
          </>
        )}
        <Stack spacing={{ base: 3, md: 6 }} position="relative" zIndex={1} w="100%">
          <Flex
            justify="space-between"
            align={{ base: isLearner ? "start" : "center", md: "center" }}
            direction={{ base: isLearner ? "column" : "row", md: "row" }}
            gap={{ base: isLearner ? 4 : 2, md: 4 }}
            w="100%"
          >
            <VStack align="start" spacing={{ base: 1, md: 3 }} flex={1} minW={0}>
              {isLearner ? (
                <>
                 

                  <HStack spacing={{ base: 2, md: 3 }} align="center">
                    <Box
                      w={{ base: "36px", md: "42px" }}
                      h={{ base: "36px", md: "42px" }}
                      borderRadius="xl"
                      display="grid"
                      placeItems="center"
                      bg={learnerHeroPanelBg}
                      borderWidth="1px"
                      borderColor={learnerHeroBorderColor}
                      backdropFilter="blur(14px)"
                      flexShrink={0}
                    >
                      <Icon as={FiGrid} boxSize={{ base: 4, md: 5 }} color={brand700} />
                    </Box>

                    {stats.totalBatches > 0 ? (
                      <Badge
                        bg={brand50}
                        color={brand700}
                        borderRadius="full"
                        px={3}
                        py={1}
                        fontSize="xs"
                        textTransform="none"
                      >
                        {stats.totalBatches} batches assigned
                      </Badge>
                    ) : null}
                  </HStack>

                  <Heading
                    fontSize={{ base: "xl", md: "3xl", xl: "4xl" }}
                    fontWeight="900"
                    lineHeight={{ base: "1.12", md: "1.04" }}
                    letterSpacing="-0.04em"
                    color={learnerHeroText}
                    maxW="12ch"
                  >
                    Stay in sync with your{" "}
                    <Text
                      as="span"
                      bgGradient={learnerHeroAccentGradient}
                      bgClip="text"
                    >
                      batches
                    </Text>
                  </Heading>
                </>
              ) : (
                <HStack spacing={{ base: 2, md: 3 }} flexWrap="nowrap" w="100%">
                  <Icon
                    as={FiGrid}
                    boxSize={{ base: 4, md: 6 }}
                    color="blue.600"
                    flexShrink={0}
                  />

                  <Heading
                    size={{ base: "sm", md: "md" }}
                    fontWeight="900"
                    noOfLines={1}
                    letterSpacing="-0.03em"
                  >
                    Batch Management
                  </Heading>

                  {stats.totalBatches > 0 && (
                    <Badge
                      display={{ base: "none", sm: "inline-flex" }}
                      colorScheme="purple"
                      variant="solid"
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontSize="xs"
                      flexShrink={0}
                    >
                      {stats.totalBatches} Batches
                    </Badge>
                  )}
                </HStack>
              )}

              <Text
                fontSize={{ base: isLearner ? "sm" : "xs", md: "md" }}
                color={isLearner ? learnerHeroMutedText : "gray.600"}
                maxW="3xl"
                display="block"
              >
                {isLearner
                  ? "Track assigned cohorts, review schedules, and launch the courses bundled into each batch from one clean workspace."
                  : `Manage learning cohorts for ${
                      activeCompany?.company_name || "your organization"
                    } with intuitive controls and real-time insights.`}
              </Text>

            </VStack>

            {canCreate && !isLearner && (
              <Button
                leftIcon={<Icon as={FiPlus} />}
                colorScheme="blue"
                rounded="full"
                size={{ base: "sm", md: "md" }}
                onClick={creationDisclosure.onOpen}
                isDisabled={!companyId && isSuperadmin}
                px={{ base: 3, md: 5 }}
                flexShrink={0}
                _hover={{
                  transform: { base: "none", md: "translateY(-2px)" },
                  boxShadow: { base: "sm", md: "xl" },
                }}
                transition="all 0.2s"
              >
                <Text display={{ base: "none", sm: "inline" }}>Create New Batch</Text>
                <Text display={{ base: "inline", sm: "none" }}>Create</Text>
              </Button>
            )}
          </Flex>

          {isLearner && (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} w="100%">
              {[
                { label: "Batches", value: stats.totalBatches, icon: FiGrid, iconBg: brand50, iconColor: brand700 },
                { label: "Active", value: stats.activeBatches, icon: FiCheckCircle, iconBg: brand100, iconColor: "green.500" },
                { label: "Courses", value: stats.totalCourses, icon: FiBookOpen, iconBg: brand200, iconColor: brand500 },
                { label: "Learners", value: stats.totalUsers, icon: FiUsers, iconBg: brand300, iconColor: "teal.500" },
              ].map((item) => (
                <Box
                  key={item.label}
                  p={{ base: 3.5, md: 4 }}
                  borderRadius="2xl"
                  bg={learnerHeroPanelBg}
                  borderWidth="1px"
                  borderColor={learnerHeroBorderColor}
                  backdropFilter="blur(14px)"
                  boxShadow={learnerHeroStatShadow}
                >
                  <HStack align="start" spacing={3}>
                    <Box
                      w={{ base: "38px", md: "42px" }}
                      h={{ base: "38px", md: "42px" }}
                      borderRadius="xl"
                      display="grid"
                      placeItems="center"
                      bg={item.iconBg}
                      flexShrink={0}
                    >
                      <Icon as={item.icon} color={item.iconColor} boxSize={{ base: 4, md: 5 }} />
                    </Box>
                    <Box minW={0}>
                      <Text fontSize="xs" color={learnerHeroMutedText} textTransform="uppercase" letterSpacing="0.08em">
                        {item.label}
                      </Text>
                      <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="900" color={learnerHeroText} lineHeight="1.1">
                        {item.value}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>
          )}

          {!isLearner && stats.totalBatches > 0 && (
            <SimpleGrid
              display={{ base: "none", md: "grid" }}
              columns={{ md: 3, lg: 5 }}
              spacing={4}
              pt={4}
              w="100%"
            >
              <Box
                bg={useColorModeValue("white", "gray.800")}
                borderRadius="2xl"
                p={4}
                boxShadow="md"
                _hover={{
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                }}
              >
                <HStack justify="space-between">
                  <Stat>
                    <StatLabel color={useColorModeValue("gray.500", "gray.400")}>
                      Total Batches
                    </StatLabel>
                    <StatNumber
                      fontSize="2xl"
                      color={useColorModeValue("blue.600", "blue.400")}
                    >
                      {stats.totalBatches}
                    </StatNumber>
                    <StatHelpText>
                      <HStack spacing={1}>
                        <Icon as={FiTrendingUp} boxSize={3} />
                        <Text>{stats.activeBatches} active</Text>
                      </HStack>
                    </StatHelpText>
                  </Stat>

                  <Box
                    p={2}
                    bg={useColorModeValue("blue.50", "blue.900")}
                    borderRadius="lg"
                    color={useColorModeValue("blue.500", "blue.300")}
                  >
                    <Icon as={FiGrid} boxSize={6} />
                  </Box>
                </HStack>
              </Box>

              <Box
                bg={useColorModeValue("white", "gray.800")}
                borderRadius="2xl"
                p={4}
                boxShadow="md"
                _hover={{
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                }}
              >
                <HStack justify="space-between">
                  <Stat>
                    <StatLabel color={useColorModeValue("gray.500", "gray.400")}>
                      Total Learners
                    </StatLabel>
                    <StatNumber
                      fontSize="2xl"
                      color={useColorModeValue("green.600", "green.400")}
                    >
                      {stats.totalUsers}
                    </StatNumber>
                    <StatHelpText>Across all batches</StatHelpText>
                  </Stat>

                  <Box
                    p={2}
                    bg={useColorModeValue("green.50", "green.900")}
                    borderRadius="lg"
                    color={useColorModeValue("green.500", "green.300")}
                  >
                    <Icon as={FiUsers} boxSize={6} />
                  </Box>
                </HStack>
              </Box>

              <Box
                bg={useColorModeValue("white", "gray.800")}
                borderRadius="2xl"
                p={4}
                boxShadow="md"
                _hover={{
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                }}
              >
                <HStack justify="space-between">
                  <Stat>
                    <StatLabel color={useColorModeValue("gray.500", "gray.400")}>
                      Total Courses
                    </StatLabel>
                    <StatNumber
                      fontSize="2xl"
                      color={useColorModeValue("purple.600", "purple.400")}
                    >
                      {stats.totalCourses}
                    </StatNumber>
                    <StatHelpText>Assigned in batches</StatHelpText>
                  </Stat>

                  <Box
                    p={2}
                    bg={useColorModeValue("purple.50", "purple.900")}
                    borderRadius="lg"
                    color={useColorModeValue("purple.500", "purple.300")}
                  >
                    <Icon as={FiBookOpen} boxSize={6} />
                  </Box>
                </HStack>
              </Box>

              <Box
                bg={useColorModeValue("white", "gray.800")}
                borderRadius="2xl"
                p={4}
                boxShadow="md"
                _hover={{
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                }}
              >
                <HStack justify="space-between">
                  <Stat>
                    <StatLabel color={useColorModeValue("gray.500", "gray.400")}>
                      Completion Rate
                    </StatLabel>
                    <StatNumber
                      fontSize="2xl"
                      color={useColorModeValue("orange.600", "orange.400")}
                    >
                      {stats.completionRate}%
                    </StatNumber>
                    <StatHelpText>Batches completed</StatHelpText>
                  </Stat>

                  <Box
                    p={2}
                    bg={useColorModeValue("orange.50", "orange.900")}
                    borderRadius="lg"
                    color={useColorModeValue("orange.500", "orange.300")}
                  >
                    <Icon as={FiAward} boxSize={6} />
                  </Box>
                </HStack>
              </Box>

              <Box
                bg={useColorModeValue("white", "gray.800")}
                borderRadius="2xl"
                p={4}
                boxShadow="md"
                _hover={{
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                }}
              >
                <HStack justify="space-between">
                  <Stat>
                    <StatLabel color={useColorModeValue("gray.500", "gray.400")}>
                      Active Batches
                    </StatLabel>
                    <StatNumber
                      fontSize="2xl"
                      color={useColorModeValue("teal.600", "teal.400")}
                    >
                      {stats.activeBatches}
                    </StatNumber>
                    <StatHelpText>Currently running</StatHelpText>
                  </Stat>

                  <Box
                    p={2}
                    bg={useColorModeValue("teal.50", "teal.900")}
                    borderRadius="lg"
                    color={useColorModeValue("teal.500", "teal.300")}
                  >
                    <Icon as={FiCalendar} boxSize={6} />
                  </Box>
                </HStack>
              </Box>
            </SimpleGrid>
          )}

          {!isLearner && stats.totalBatches > 0 && (
            <Box
              display={{ base: "block", md: "none" }}
              overflowX="auto"
              pb={1}
              sx={{
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                scrollbarWidth: "none",
              }}
            >
              <HStack spacing={2} minW="max-content">
                <MobileStatChip
                  label="Batches"
                  value={stats.totalBatches}
                  icon={FiGrid}
                  colorScheme="blue"
                />
                <MobileStatChip
                  label="Learners"
                  value={stats.totalUsers}
                  icon={FiUsers}
                  colorScheme="green"
                />
                <MobileStatChip
                  label="Courses"
                  value={stats.totalCourses}
                  icon={FiBookOpen}
                  colorScheme="purple"
                />
                <MobileStatChip
                  label="Active"
                  value={stats.activeBatches}
                  icon={FiCalendar}
                  colorScheme="teal"
                />
                <MobileStatChip
                  label="Done"
                  value={`${stats.completionRate}%`}
                  icon={FiAward}
                  colorScheme="orange"
                />
              </HStack>
            </Box>
          )}
        </Stack>
      </Box> */}




      {isLoading ? (
        <Flex justify="center" align="center" minH={{ base: "220px", md: "400px" }} w="100%">
          <VStack spacing={3}>
            <Spinner size={{ base: "md", md: "xl" }} colorScheme="blue" thickness="4px" />
            <Text color={textColor} fontWeight="700" fontSize={{ base: "sm", md: "md" }}>
              Loading batches...
            </Text>
          </VStack>
        </Flex>
      ) : filteredItems.length === 0 ? (
        <Box
          bg={cardBg}
          borderRadius={{ base: "2xl", md: "3xl" }}
          p={{ base: 6, md: 12 }}
          textAlign="center"
          borderWidth="1px"
          borderColor={borderColor}
          boxShadow="sm"
          w="100%"
        >
          <VStack spacing={{ base: 3, md: 4 }}>
            <Box
              p={{ base: 3, md: 4 }}
              bg={useColorModeValue("blue.50", "blue.900")}
              borderRadius="full"
              color={useColorModeValue("blue.500", "blue.300")}
            >
              <Icon as={FiSearch} boxSize={{ base: 6, md: 8 }} />
            </Box>

            <Heading size={{ base: "sm", md: "md" }} color={useColorModeValue("gray.700", "gray.200")}>
              {searchQuery ? "No matching batches found" : "No batches available"}
            </Heading>

            <Text color={textColor} maxW="md" fontSize={{ base: "sm", md: "md" }}>
              {searchQuery
                ? "Try adjusting your search terms or clear the filter to see all batches."
                : isLearner
                  ? "You haven't been added to any batches yet."
                  : "Get started by creating your first batch."}
            </Text>

            {!isLearner && canCreate && !searchQuery && (
              <Button
                leftIcon={<Icon as={FiPlus} />}
                colorScheme="blue"
                onClick={creationDisclosure.onOpen}
                size={{ base: "sm", md: "lg" }}
                rounded="full"
                mt={2}
              >
                Create Your First Batch
              </Button>
            )}
          </VStack>
        </Box>
      ) : (
        <>
          <Flex
            display={{ base: "none", md: "flex" }}
            justify="space-between"
            align="center"
            wrap="wrap"
            gap={3}
            w="100%"
          >
            <HStack spacing={2}>
              <Icon as={FiSearch} color="gray.400" />
              <Text color={textColor} fontSize="sm">
                Showing {filteredItems.length} of {items.length} batches
              </Text>

              {searchQuery && (
                <Badge colorScheme="blue" borderRadius="full" px={2}>
                  Filtered
                </Badge>
              )}
            </HStack>

            <Text color={textColor} fontSize="sm">
              Last updated: {new Date().toLocaleDateString()}
            </Text>
          </Flex>

          <Divider display={{ base: "none", md: "block" }} />

          {viewMode === "card" ? (
            <SimpleGrid
              columns={{ base: 1, lg: 2, xl: 2 }}
              spacing={{ base: 3, md: 6 }}
              w="100%"
            >
              {filteredItems.map((batch) => (
                <BatchCard
                  key={batch._id}
                  batch={batch}
                  onClick={() => handleBatchClick(batch._id)}
                  isLearner={isLearner}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Box
              display={{ base: "none", md: "block" }}
              bg={cardBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              overflowX="auto"
              boxShadow="sm"
              w="100%"
            >
              <Table variant="striped" w="100%">
                <Thead bg={useColorModeValue("gray.50", "gray.700")}>
                  <Tr>
                    <Th color={useColorModeValue("gray.700", "gray.200")}>Batch Name</Th>
                    <Th color={useColorModeValue("gray.700", "gray.200")}>Status</Th>
                    <Th color={useColorModeValue("gray.700", "gray.200")}>Start Date</Th>
                    <Th color={useColorModeValue("gray.700", "gray.200")}>End Date</Th>
                    <Th color={useColorModeValue("gray.700", "gray.200")}>Courses</Th>
                    <Th color={useColorModeValue("gray.700", "gray.200")}>Users</Th>
                    <Th color={useColorModeValue("gray.700", "gray.200")}>Created By</Th>
                    {!isLearner && (
                      <Th color={useColorModeValue("gray.700", "gray.200")}>Actions</Th>
                    )}
                  </Tr>
                </Thead>

                <Tbody>
                  {filteredItems.map((batch) => {
                    const StatusIcon = getStatusIcon(batch.status);

                    return (
                      <Tr
                        key={batch._id}
                        cursor="pointer"
                        _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
                        onClick={() => handleBatchClick(batch._id)}
                      >
                        <Td fontWeight="semibold">
                          <HStack spacing={2}>
                            <Icon
                              as={FiGrid}
                              color={useColorModeValue("blue.500", "blue.300")}
                            />
                            <Text>{batch.name}</Text>
                          </HStack>
                        </Td>

                        <Td>
                          <Badge
                            colorScheme={getStatusColor(batch.status)}
                            borderRadius="full"
                            px={3}
                            py={1}
                          >
                            <HStack spacing={1}>
                              <Icon as={StatusIcon} boxSize={3} />
                              <Text>{batch.status || "active"}</Text>
                            </HStack>
                          </Badge>
                        </Td>

                        <Td>
                          <HStack spacing={1}>
                            <Icon
                              as={FiCalendar}
                              boxSize={3}
                              color={useColorModeValue("gray.400", "gray.500")}
                            />
                            <Text>
                              {batch.startDate
                                ? new Date(batch.startDate).toLocaleDateString()
                                : "Not set"}
                            </Text>
                          </HStack>
                        </Td>

                        <Td>
                          {batch.endDate
                            ? new Date(batch.endDate).toLocaleDateString()
                            : "Not set"}
                        </Td>

                        <Td>
                          <HStack spacing={1}>
                            <Icon
                              as={FiBookOpen}
                              boxSize={3}
                              color={useColorModeValue("purple.500", "purple.300")}
                            />
                            <Text>{batch.courseCount || 0}</Text>
                          </HStack>
                        </Td>

                        <Td>
                          <HStack spacing={1}>
                            <Icon
                              as={FiUsers}
                              boxSize={3}
                              color={useColorModeValue("green.500", "green.300")}
                            />
                            <Text>{batch.userCount || 0}</Text>
                          </HStack>
                        </Td>

                        <Td>
                          <Text fontSize="sm">
                            {batch.createdBy?.name ||
                              batch.createdBy?.email ||
                              "System"}
                          </Text>
                        </Td>

                        {!isLearner && (
                          <Td onClick={(event) => event.stopPropagation()}>
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<Icon as={FiMoreVertical} />}
                                variant="ghost"
                                size="sm"
                                aria-label="Options"
                              />

                              <MenuList>
                                <MenuItem
                                  icon={<Icon as={FiEdit2} />}
                                  onClick={() => {
                                    handleEditOpen(0);
                                  }}
                                >
                                  Edit Batch
                                </MenuItem>

                                <MenuItem
                                  icon={<Icon as={FiUserPlus} />}
                                  onClick={() => {
                                    handleEditOpen(2);
                                  }}
                                >
                                  Manage Users
                                </MenuItem>

                                <MenuItem
                                  icon={<Icon as={FiTrash2} />}
                                  color="red.500"
                                  onClick={() => {
                                    handleDeleteBatch();
                                  }}
                                >
                                  Delete Batch
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        )}
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          )}
        </>
      )}
    </Stack>

    <BatchDetailsDrawer
      isOpen={detailsDisclosure.isOpen}
      onClose={() => {
        detailsDisclosure.onClose();
        batchStore.clearActiveBatch();
      }}
      batch={batchStore.activeBatch}
      isLoading={batchStore.isDetailsLoading}
      canManage={canManage && !isLearner}
      canDelete={canDeleteActiveBatch}
      isLearner={isLearner}
      isDeleteLoading={batchStore.isSubmitting}
      onEditBatch={() => handleEditOpen(0)}
      onDeleteBatch={handleDeleteBatch}
      onManageUsers={() => handleEditOpen(2)}
      onOpenCourse={
        isLearner
          ? (courseId) => router.push(`${courseBasePath}?courseId=${courseId}`)
          : undefined
      }
    />

    <BatchCreationModal
      isOpen={creationDisclosure.isOpen}
      onClose={creationDisclosure.onClose}
      companyId={companyId || undefined}
      onCreated={refreshBatches}
    />

    <BatchCreationModal
      isOpen={editDisclosure.isOpen}
      onClose={editDisclosure.onClose}
      companyId={companyId || undefined}
      onCreated={async () => {
        await refreshBatches();

        if (batchStore.activeBatch?._id) {
          await batchStore.fetchBatchDetails(batchStore.activeBatch._id);
        }
      }}
      mode="edit"
      initialBatch={batchStore.activeBatch}
      initialStep={editStep}
    />
  </Box>
);
  },
);
export default BatchesWorkspace;
