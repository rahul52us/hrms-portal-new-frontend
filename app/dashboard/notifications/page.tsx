"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import stores from "@/app/store/stores";
import { Box, useColorModeValue } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import NotificationWorkspace from "./NotificationWorkspace";

const NotificationsPage = observer(() => {
  const { auth } = stores;
  const role = String(auth.userType || auth.user?.role || "").toLowerCase();
  const pageBg = useColorModeValue("gray.50", "gray.900");

  return (
    <PermissionGate
      allowed={role === "superadmin"}
      title="Notifications access is disabled"
      description="Only Super Admins can send company email notifications."
      fallbackHref="/dashboard"
    >
      <Box minH="100vh" bg={pageBg} px={{ base: 4, lg: 2 }} py={{ base: 4, md: 6 }}>
        <NotificationWorkspace currentUser={auth.user} />
      </Box>
    </PermissionGate>
  );
});

export default NotificationsPage;
