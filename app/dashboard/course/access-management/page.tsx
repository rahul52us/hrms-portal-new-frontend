"use client";

import { Box, Stack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import stores from "@/app/store/stores";
import PermissionGate from "@/app/component/common/PermissionGate";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import CourseAccessGrantFlow from "./components/CourseAccessGrantFlow";
import CourseAssignmentWorkspace from "./components/CourseAssignmentWorkspace";
import AssignedCoursesPanel from "./components/AssignedCoursesPanel";

const AccessManagementPage = observer(() => {
  const role = String(stores.auth.userType || stores.auth.user?.role || "").toLowerCase();
  const canAssignCourses = hasPermission(stores.auth.user, PERMISSION_KEYS.ASSIGN_COURSES);

  return (
    <PermissionGate
      allowed={role === "user" || canAssignCourses}
      title="Course assignment is disabled"
      description="This account does not currently have access to course assignment tools."
      fallbackHref="/dashboard/profile"
    >
    <Box minH="100vh" bg="gray.50" p={{ base: 4, md: 6 }}>
      <Stack spacing={6}>
        {role === "superadmin" && canAssignCourses ? <CourseAccessGrantFlow /> : null}
        {["admin", "departmenthead"].includes(role) && canAssignCourses ? <CourseAssignmentWorkspace /> : null}
        {role === "user" ? <AssignedCoursesPanel /> : null}
      </Stack>
    </Box>
    </PermissionGate>
  );
});

export default AccessManagementPage;
