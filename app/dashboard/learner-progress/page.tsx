"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import LearnerResultsWorkspace from "@/app/dashboard/components/LMS/components/learner-results/LearnerResultsWorkspace";
import stores from "@/app/store/stores";
import {
  Badge,
  Box,
  Center,
  Flex,
  Heading,
  Icon,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClipboardCheck, ShieldCheck } from "lucide-react";

const LearnerProgressPage = observer(() => {
  const router = useRouter();
  const { auth } = stores;
  const role = String(auth.userType || auth.user?.role || "").toLowerCase();
  const isAllowedRole = ["superadmin", "admin", "departmenthead"].includes(role);
  const canView = hasPermission(
    auth.user,
    PERMISSION_KEYS.VIEW_LEARNER_PROGRESS_RESULTS
  );
  const isLoading = auth.isLoading || !auth.sessionReady;
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const heroBg = useColorModeValue(
    "linear-gradient(135deg, #312E81 0%, #6D28D9 55%, #0F766E 125%)",
    "linear-gradient(135deg, #111827 0%, #312E81 60%, #134E4A 125%)"
  );

  useEffect(() => {
    if (!isLoading && !isAllowedRole) {
      router.replace("/");
    }
  }, [isAllowedRole, isLoading, router]);

  if (isLoading) {
    return (
      <Center minH="70vh">
        <Stack align="center">
          <Spinner color="purple.500" />
          <Text fontSize="sm" color="gray.500">
            Loading learner progress...
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <PermissionGate
      allowed={isAllowedRole && canView}
      title="Learner progress access is disabled"
      description="This account does not currently have permission to view learner progress and results."
      fallbackHref="/dashboard"
    >
      <Box minH="100vh" bg={pageBg} p={{ base: 3, md: 5 }}>
        <Stack spacing={4} maxW="1600px" mx="auto">
          <Box
            bgImage={heroBg}
            color="white"
            borderRadius={{ base: "2xl", md: "3xl" }}
            p={{ base: 4, md: 6 }}
            boxShadow="lg"
          >
            <Badge bg="whiteAlpha.200" color="white" borderRadius="full" px={3} py={1}>
              <Flex align="center" gap={1.5}>
                <Icon as={ShieldCheck} boxSize={3.5} />
                {role === "superadmin"
                  ? "Platform scope"
                  : role === "admin"
                    ? "Company scope"
                    : "Department scope"}
              </Flex>
            </Badge>
            <Flex align="center" gap={2.5} mt={3}>
              <Icon as={ClipboardCheck} boxSize={6} />
              <Heading size={{ base: "md", md: "lg" }}>Learner Progress</Heading>
            </Flex>
            <Text mt={2} color="whiteAlpha.800" fontSize={{ base: "sm", md: "md" }}>
              Review course completion, assessment results, submitted answers, and learner activity.
            </Text>
          </Box>

          <LearnerResultsWorkspace
            role={role as "superadmin" | "admin" | "departmenthead"}
            showHeader={false}
          />
        </Stack>
      </Box>
    </PermissionGate>
  );
});

export default LearnerProgressPage;
