"use client";

import { Box, Center, Spinner, Text, VStack, useColorModeValue } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import stores from "../store/stores";
import PermissionGate from "../component/common/PermissionGate";
import ScopedDashboard from "./components/LMS/ScopedDashboard";
import { PERMISSION_KEYS, hasPermission } from "../config/utils/permissions";
import { getDefaultAuthenticatedRoute } from "../config/utils/roleAccess";

const Page = observer(() => {
  const { auth } = stores;
  const router = useRouter();
  const canViewDashboard = hasPermission(auth.user, PERMISSION_KEYS.VIEW_DASHBOARD);
  const isLoading = auth.isLoading || !auth.sessionReady;
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const defaultRoute = auth.user
    ? getDefaultAuthenticatedRoute(auth.user)
    : "/login";

  useEffect(() => {
    if (isLoading || !auth.user) {
      return;
    }

    if (defaultRoute !== "/dashboard") {
      router.replace(defaultRoute);
    }
  }, [auth.user, defaultRoute, isLoading, router]);

  if (isLoading || !auth.user || defaultRoute !== "/dashboard") {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color="gray.500" fontWeight="medium">
            Opening your workspace...
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <PermissionGate
      allowed={canViewDashboard}
      title="Dashboard access is disabled"
      description="This account does not currently have access to the dashboard."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100vh" bg={pageBg}>
        <ScopedDashboard />
      </Box>
    </PermissionGate>
  );
});

export default Page;
