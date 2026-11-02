"use client";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import stores from "@/app/store/stores";
import { hasPermission, PERMISSION_KEYS } from "@/app/config/utils/permissions";
import TimesheetOperationsWorkspace from "./TimesheetOperationsWorkspace";
import { TimesheetAutomationPanel, TimesheetCorrectionsPanel, TimesheetPayrollPanel } from "./TimesheetManagementPanels";
function Workspace() {
  const user = stores.auth.user, payroll = hasPermission(user, PERMISSION_KEYS.MANAGE_PAYROLL_RUNS), automation = ["admin", "hradmin"].includes(String(user?.role));
  const reports = Boolean(user?.timesheetAccess?.scopes?.length);
  if (!payroll && !automation) return <TimesheetOperationsWorkspace />;
  const panels = [
    ...(reports ? [{ key: "reports", title: "Reports", content: <TimesheetOperationsWorkspace /> }] : []),
    ...(payroll ? [{ key: "payroll", title: "Payroll cycles", content: <TimesheetPayrollPanel /> }, { key: "corrections", title: "Corrections", content: <TimesheetCorrectionsPanel /> }] : []),
    ...(automation ? [{ key: "automation", title: "Automation", content: <TimesheetAutomationPanel /> }] : []),
  ];
  return <Tabs isLazy variant="line" px={{ base: 0, md: 3 }}><TabList overflowX="auto" overflowY="hidden">{panels.map((panel) => <Tab key={panel.key} flexShrink={0}>{panel.title}</Tab>)}</TabList><TabPanels>{panels.map((panel) => <TabPanel key={panel.key} p={panel.key === "reports" ? 0 : 4}>{panel.content}</TabPanel>)}</TabPanels></Tabs>;
}
export default observer(Workspace);
