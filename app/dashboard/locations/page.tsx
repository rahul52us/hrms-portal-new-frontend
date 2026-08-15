"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import stores from "@/app/store/stores";
import {
  Box,
  Center,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { FiBriefcase, FiMapPin } from "react-icons/fi";
import LocationTable from "./LocationTable";
import { PageBanner } from "@/app/component/common/PageBanner/PageBanner";

const LocationsPage = observer(() => {
  const { auth, companyStore, locationStore } = stores;

  const role = String(auth.userType || auth.user?.role || "").toLowerCase();
  const isSuperadmin = role === "superadmin";
  const canViewLocations = hasPermission(auth.user, PERMISSION_KEYS.VIEW_LOCATIONS);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");

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
  const totalLocations =
    locationStore.activeCompanyId === (companyId || "")
      ? locationStore.pagination?.total || 0
      : 0;

  return (
    <PermissionGate
      allowed={canViewLocations}
      title="Locations module is disabled"
      description="This account does not currently have access to office locations."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100dvh">
        <Stack>
          <PageBanner
            titlePrefix="OFFICE"
            titleHighlight="LOCATIONS"
            subtitle={`OFFICE MASTER DATA FOR ${activeCompany?.company_name || "YOUR COMPANY"}`}
            icon={FiMapPin}
            statLabel={`${totalLocations} LOCATIONS`}
            statIcon={FiMapPin}
            showBackButton={true}
            colorScheme="blue"
          />

          <LocationTable
            key={companyId || "no-company"}
            companyId={companyId || undefined}
            companyName={activeCompany?.company_name}
          />
        </Stack>
      </Box>
    </PermissionGate>
  );
});

export default LocationsPage;
