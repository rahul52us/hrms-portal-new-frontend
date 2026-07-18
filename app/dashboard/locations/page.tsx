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

  const StatCard = ({
    icon,
    label,
    value,
    colorScheme,
  }: {
    icon: any;
    label: string;
    value: string | number;
    colorScheme: "blue" | "purple";
  }) => {
    const iconBg = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
    const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.300`);

    return (
      <Flex align="center" gap={4} bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4} shadow="sm">
        <Center w={11} h={11} bg={iconBg} color={iconColor} borderRadius="xl" flexShrink={0}>
          <Icon as={icon} boxSize={5} />
        </Center>
        <Box minW={0}>
          <Text fontSize="xs" fontWeight="800" color={muted} textTransform="uppercase" noOfLines={1}>
            {label}
          </Text>
          <Text mt={0.5} fontSize="xl" fontWeight="800" color={headingColor} noOfLines={1}>
            {value}
          </Text>
        </Box>
      </Flex>
    );
  };

  return (
    <PermissionGate
      allowed={canViewLocations}
      title="Locations module is disabled"
      description="This account does not currently have access to office locations."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100dvh" bg={pageBg} px={{ base: 3, md: 6 }} py={{ base: 3, md: 6 }}>
        <Stack spacing={{ base: 4, md: 6 }}>
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={{ base: 4, md: 6 }} shadow="sm" overflow="hidden" position="relative">
            <Box position="absolute" insetX={0} top={0} h="1" bgGradient="linear(to-r, blue.400, purple.500, pink.400)" />
            <Flex direction={{ base: "column", lg: "row" }} justify="space-between" align={{ base: "stretch", lg: "center" }} gap={5}>
              <Box minW={0}>
                <Heading size={{ base: "md", md: "lg" }} color={headingColor}>
                  Office Locations
                </Heading>
                <Text mt={1} fontSize="sm" color={muted} noOfLines={{ base: 2, md: 1 }}>
                  Office master data for{" "}
                  <Text as="span" fontWeight="700" color={headingColor}>
                    {activeCompany?.company_name || "selected company"}
                  </Text>
                </Text>
              </Box>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} minW={{ base: "100%", lg: "420px" }}>
                <StatCard icon={FiMapPin} label="Total locations" value={totalLocations} colorScheme="blue" />
                <StatCard icon={FiBriefcase} label="Company" value={activeCompany?.company_name || "ABC"} colorScheme="purple" />
              </SimpleGrid>
            </Flex>
          </Box>

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
