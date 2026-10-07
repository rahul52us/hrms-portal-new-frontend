"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import { PageBanner } from "@/app/component/common/PageBanner/PageBanner";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import stores from "@/app/store/stores";
import { Box, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, useColorModeValue } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { FiCreditCard } from "react-icons/fi";
import SalaryComponentsWorkspace from "./SalaryComponentsWorkspace";
import PayrollSettingsPanel from "./PayrollSettingsPanel";
import SalaryStructuresWorkspace from "./SalaryStructuresWorkspace";
import EmployeeCompensationWorkspace from "./EmployeeCompensationWorkspace";
import PayrollRunsWorkspace from "./PayrollRunsWorkspace";
import StatutoryProfilesWorkspace from "./StatutoryProfilesWorkspace";
import EmployeeStatutoryWorkspace from "./EmployeeStatutoryWorkspace";
import StatutoryReportsWorkspace from "./StatutoryReportsWorkspace";

const PayrollPage = observer(() => {
  const { auth, companyStore } = stores;
  const canViewPayroll = hasPermission(auth.user, PERMISSION_KEYS.VIEW_PAYROLL);
  const canManage = hasPermission(auth.user, PERMISSION_KEYS.MANAGE_PAYROLL_CONFIGURATION);
  const canManageCompensation = hasPermission(auth.user, PERMISSION_KEYS.MANAGE_EMPLOYEE_COMPENSATION);
  const canManageEmployeeStatutory = hasPermission(auth.user, PERMISSION_KEYS.MANAGE_EMPLOYEE_STATUTORY);
  const canManageRuns = hasPermission(auth.user, PERMISSION_KEYS.MANAGE_PAYROLL_RUNS);
  const canApproveRuns = hasPermission(auth.user, PERMISSION_KEYS.APPROVE_PAYROLL_RUNS);
  const canFinalizeRuns = hasPermission(auth.user, PERMISSION_KEYS.FINALIZE_PAYROLL_RUNS);
  const canReopenRuns = hasPermission(auth.user, PERMISSION_KEYS.REOPEN_PAYROLL_RUNS);
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    companyStore.initializeCompanyContext();
  }, [companyStore]);

  const companyId = companyStore.getActiveCompanyId();
  const companies = companyStore.companies.data || [];
  const activeCompany =
    companies.find((company: any) => company._id === companyId) ||
    auth.user?.companyDetails ||
    null;

  return (
    <PermissionGate
      allowed={canViewPayroll}
      title="Payroll module is disabled"
      description="This account does not currently have payroll access."
      fallbackHref="/dashboard/hr"
    >
      <Box minH="100dvh">
        <Stack spacing={0}>
          <PageBanner
            titlePrefix="COMPENSATION &"
            titleHighlight="PAYROLL"
            subtitle={`SALARY CONFIGURATION FOR ${activeCompany?.company_name || "YOUR COMPANY"}`}
            icon={FiCreditCard}
            showBackButton
            colorScheme="blue"
          />
          <Tabs isLazy variant="line" colorScheme="blue">
            <TabList bg={surface} borderWidth="1px" borderColor={border} borderRadius="md" px={3} overflowX="auto">
              {canManageRuns ? <Tab>Payroll runs</Tab> : null}
              {canManageRuns ? <Tab>Statutory reports</Tab> : null}
              <Tab>Salary components</Tab>
              <Tab>Salary structures</Tab>
              {canManageCompensation ? <Tab>Employee compensation</Tab> : null}
              {canManageEmployeeStatutory ? <Tab>Employee statutory</Tab> : null}
              <Tab>Statutory profiles</Tab>
              <Tab>Settings</Tab>
            </TabList>
            <TabPanels>
              {canManageRuns ? <TabPanel px={0}><PayrollRunsWorkspace companyId={companyId || ""} canManage={canManageRuns} canApprove={canApproveRuns} canFinalize={canFinalizeRuns} canReopen={canReopenRuns} currentUserId={String(auth.user?._id || "")} /></TabPanel> : null}
              {canManageRuns ? <TabPanel px={0}><StatutoryReportsWorkspace companyId={companyId || ""} /></TabPanel> : null}
              <TabPanel px={0}><SalaryComponentsWorkspace companyId={companyId || ""} canManage={canManage} /></TabPanel>
              <TabPanel px={0}><SalaryStructuresWorkspace companyId={companyId || ""} canManage={canManage} /></TabPanel>
              {canManageCompensation ? <TabPanel px={0}><EmployeeCompensationWorkspace companyId={companyId || ""} canManage={canManageCompensation} /></TabPanel> : null}
              {canManageEmployeeStatutory ? <TabPanel px={0}><EmployeeStatutoryWorkspace companyId={companyId || ""} canManage={canManageEmployeeStatutory} /></TabPanel> : null}
              <TabPanel px={0}><StatutoryProfilesWorkspace companyId={companyId || ""} canManage={canManage} /></TabPanel>
              <TabPanel px={0}><PayrollSettingsPanel companyId={companyId || ""} canManage={canManage} /></TabPanel>
            </TabPanels>
          </Tabs>
        </Stack>
      </Box>
    </PermissionGate>
  );
});

export default PayrollPage;
