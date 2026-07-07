"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import { isLearnerRole } from "@/app/config/utils/roleAccess";
import stores from "@/app/store/stores";
import {
  Box,
  Center,
  Flex,
  Icon,
  Spinner,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FiGrid } from "react-icons/fi";
import BatchesWorkspace from "./components/BatchesWorkspace";

const DashboardBatchesPage = observer(() => {
  const router = useRouter();

  const role = String(
    stores.auth.userType || stores.auth.user?.role || ""
  ).toLowerCase();

  const isLearner = isLearnerRole(role);

  const canViewBatches = hasPermission(
    stores.auth.user,
    PERMISSION_KEYS.VIEW_BATCHES
  );

  const pageBg = useColorModeValue("gray.50", "gray.950");
  const shellBg = useColorModeValue(
    "linear-gradient(135deg, #f8fafc 0%, #eef6ff 45%, #f5f3ff 100%)",
    "linear-gradient(135deg, #020617 0%, #111827 45%, #172554 100%)"
  );
  const cardGlowOne = useColorModeValue("blue.200", "blue.800");
  const cardGlowTwo = useColorModeValue("purple.200", "purple.900");
  const loadingCardBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.100");
  const loadingBorderColor = useColorModeValue("white", "whiteAlpha.200");
  const loadingTextColor = useColorModeValue("gray.700", "gray.300");

  useEffect(() => {
    if (isLearner) {
      router.replace("/batches");
    }
  }, [isLearner, router]);

  if (isLearner) {
    return (
      <Center minH="100dvh" bg={pageBg}>
        <Flex
          align="center"
          gap={3}
          px={5}
          py={4}
          rounded="2xl"
          bg={loadingCardBg}
          borderWidth="1px"
          borderColor={loadingBorderColor}
          shadow="lg"
        >
          <Spinner size="sm" color="blue.500" />

          <Text fontSize="sm" fontWeight="700" color={loadingTextColor}>
            Opening your batches...
          </Text>
        </Flex>
      </Center>
    );
  }

  return (
    <PermissionGate
      allowed={canViewBatches}
      title="Batches module is disabled"
      description="This account does not currently have access to the batch workspace."
      fallbackHref="/dashboard/profile"
    >
      <Box
        minH="100dvh"
        // bg={shellBg}
        position="relative"
        overflowX="hidden"
        // px={{ base: 2.5, sm: 3, md: 5, xl: 6 }}
        // py={{ base: 2.5, sm: 3, md: 5 }}
      >
        {/* Soft background glow */}
        <Box
          position="absolute"
          top={{ base: "-80px", md: "-120px" }}
          right={{ base: "-80px", md: "-120px" }}
          w={{ base: "180px", md: "320px" }}
          h={{ base: "180px", md: "320px" }}
          // bg={cardGlowOne}
          rounded="full"
          opacity={{ base: 0.25, md: 0.28 }}
          filter="blur(70px)"
          pointerEvents="none"
        />

        <Box
          position="absolute"
          bottom={{ base: "10%", md: "5%" }}
          left={{ base: "-90px", md: "-140px" }}
          w={{ base: "190px", md: "340px" }}
          h={{ base: "190px", md: "340px" }}
          bg={cardGlowTwo}
          rounded="full"
          opacity={{ base: 0.2, md: 0.25 }}
          filter="blur(80px)"
          pointerEvents="none"
        />

        <Box position="relative" zIndex={1} w="100%">
          {/* Small mobile-only context chip */}
          <Flex
            display={{ base: "flex", md: "none" }}
            align="center"
            gap={2}
            mb={2}
            px={3}
            py={2}
            rounded="full"
            bg={useColorModeValue("whiteAlpha.800", "whiteAlpha.100")}
            borderWidth="1px"
            borderColor={useColorModeValue("white", "whiteAlpha.200")}
            shadow="sm"
            w="fit-content"
          >
            <Icon as={FiGrid} boxSize={3.5} color="blue.500" />

            <Text
              fontSize="xs"
              fontWeight="800"
              color={useColorModeValue("gray.700", "gray.200")}
            >
              Batch Workspace
            </Text>
          </Flex>

          <Box
            rounded={{ base: "2xl", md: "3xl" }}
            bg={useColorModeValue("whiteAlpha.500", "blackAlpha.200")}
            borderWidth="1px"
            borderColor={useColorModeValue("whiteAlpha.700", "whiteAlpha.100")}
            shadow={{ base: "none", md: "xl" }}
            backdropFilter="blur(14px)"
            overflow="hidden"
          >
            <BatchesWorkspace />
          </Box>
        </Box>
      </Box>
    </PermissionGate>
  );
});

export default DashboardBatchesPage;