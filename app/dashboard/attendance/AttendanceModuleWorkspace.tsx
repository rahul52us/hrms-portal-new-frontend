"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import { hasPermission, PERMISSION_KEYS } from "@/app/config/utils/permissions";
import stores from "@/app/store/stores";
import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import AttendancePayrollPanel from "./AttendancePayrollPanel";
import AttendanceReportsPanel from "./AttendanceReportsPanel";
import AttendanceWorkspace from "./AttendanceWorkspace";

const AttendanceModuleWorkspace = observer(function AttendanceModuleWorkspace() {
  const canView = hasPermission(stores.auth.user, PERMISSION_KEYS.VIEW_ATTENDANCE);
  const canViewReports = hasPermission(stores.auth.user, PERMISSION_KEYS.VIEW_ATTENDANCE_REPORTS);
  const canExportReports = hasPermission(stores.auth.user, PERMISSION_KEYS.EXPORT_ATTENDANCE_REPORTS);
  const canManagePayroll = hasPermission(stores.auth.user, PERMISSION_KEYS.MANAGE_ATTENDANCE_PAYROLL);
  const tabs = [
    { key: "daily", label: "Daily register", content: <AttendanceWorkspace /> },
    ...(canViewReports ? [{ key: "reports", label: "Reports", content: <AttendanceReportsPanel canExport={canExportReports} /> }] : []),
    ...(canManagePayroll ? [{ key: "payroll", label: "Payroll", content: <AttendancePayrollPanel /> }] : []),
  ];

  return (
    <PermissionGate allowed={canView} title="Attendance access required" description="Your role does not have permission to view organization attendance.">
      <Box maxW="1500px" mx="auto">
        <Tabs variant="enclosed" colorScheme="blue" isLazy>
          <TabList overflowX="auto">{tabs.map((item) => <Tab key={item.key} whiteSpace="nowrap">{item.label}</Tab>)}</TabList>
          <TabPanels>{tabs.map((item) => <TabPanel key={item.key} px={{ base: 0, md: 1 }} pt={5}>{item.content}</TabPanel>)}</TabPanels>
        </Tabs>
      </Box>
    </PermissionGate>
  );
});

export default AttendanceModuleWorkspace;
