"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import { departmentStore } from "@/app/store/departmentStore/departmentStore";
import stores from "@/app/store/stores";
import {
  Box,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { FiBriefcase, FiGrid } from "react-icons/fi";
import DepartmentTable from "./DepartmentTable";
import { PageBanner } from "@/app/component/common/PageBanner/PageBanner";

const DepartmentsPage = observer(() => {
  const { auth, companyStore } = stores;

  const role = String(auth.role || auth.user?.role || "").toLowerCase();
  const isSuperadmin = role === "superadmin";
  const canViewDepartments = hasPermission(
    auth.user,
    PERMISSION_KEYS.VIEW_DEPARTMENTS
  );

  useEffect(() => {
    if (isSuperadmin) {
      companyStore.getManagedCompanies().catch(() => undefined);
      return;
    }

    companyStore.initializeCompanyContext();
  }, [companyStore, isSuperadmin]);

  const companyId = companyStore.getActiveCompanyId();
  const companies = companyStore.companies.data || [];

  const activeCompany =
    companies.find((company: any) => company._id === companyId) ||
    auth.user?.companyDetails ||
    null;

  const totalDepartments =
    departmentStore.activeCompanyId === (companyId || "")
      ? departmentStore.pagination?.total || 0
      : 0;

  return (
    <PermissionGate
      allowed={canViewDepartments}
      title="Departments module is disabled"
      description="This account does not currently have access to departments."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100dvh">
        <Stack>
          <PageBanner
            titlePrefix="DEPARTMENT"
            titleHighlight="MANAGEMENT"
            subtitle={`STRUCTURE AND MANAGEMENT FOR ${activeCompany?.company_name || "YOUR COMPANY"}`}
            icon={FiBriefcase}
            statLabel={`${totalDepartments} DEPARTMENTS`}
            statIcon={FiGrid}
            showBackButton={true}
            colorScheme="purple"
          />

          <DepartmentTable
            key={companyId || "no-company"}
            companyId={companyId || undefined}
            companyName={activeCompany?.company_name}
          />
        </Stack>
      </Box>
    </PermissionGate>
  );
});

export default DepartmentsPage;
