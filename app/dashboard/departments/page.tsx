"use client";

import PermissionGate from "@/app/component/common/PermissionGate";
import { PERMISSION_KEYS, hasPermission } from "@/app/config/utils/permissions";
import { departmentStore } from "@/app/store/departmentStore/departmentStore";
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
import { FiBriefcase, FiGrid } from "react-icons/fi";
import DepartmentTable from "./DepartmentTable";

const DepartmentsPage = observer(() => {
  const { auth, companyStore } = stores;

  const role = String(auth.userType || auth.user?.role || "").toLowerCase();
  const isSuperadmin = role === "superadmin";
  const canViewDepartments = hasPermission(
    auth.user,
    PERMISSION_KEYS.VIEW_DEPARTMENTS
  );

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.900", "white");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");
  const statLabelColor = useColorModeValue("gray.500", "gray.400");
  const statValueColor = useColorModeValue("gray.900", "white");

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
    const iconBg = useColorModeValue(
      `${colorScheme}.50`,
      `${colorScheme}.900`
    );
    const iconColor = useColorModeValue(
      `${colorScheme}.500`,
      `${colorScheme}.300`
    );

    return (
      <Flex
        align="center"
        gap={{ base: 3, md: 4 }}
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        rounded={{ base: "2xl", md: "3xl" }}
        p={{ base: 3, md: 4 }}
        minW={0}
        shadow="sm"
      >
        <Center
          w={{ base: 9, md: 11 }}
          h={{ base: 9, md: 11 }}
          bg={iconBg}
          color={iconColor}
          rounded="xl"
          flexShrink={0}
        >
          <Icon as={icon} boxSize={{ base: 4, md: 5 }} />
        </Center>

        <Box minW={0}>
          <Text
            fontSize={{ base: "2xs", md: "xs" }}
            fontWeight="800"
            color={statLabelColor}
            textTransform="uppercase"
            letterSpacing="wide"
            noOfLines={1}
          >
            {label}
          </Text>

          <Text
            mt={0.5}
            fontSize={{ base: "md", md: "xl" }}
            fontWeight="800"
            color={statValueColor}
            lineHeight="1.15"
            noOfLines={1}
          >
            {value}
          </Text>
        </Box>
      </Flex>
    );
  };

  return (
    <PermissionGate
      allowed={canViewDepartments}
      title="Departments module is disabled"
      description="This account does not currently have access to departments."
      fallbackHref="/dashboard/profile"
    >
      <Box minH="100dvh" bg={pageBg} px={{ base: 3, md: 6 }} py={{ base: 3, md: 6 }}>
        <Stack spacing={{ base: 4, md: 6 }}>
          <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            rounded={{ base: "2xl", md: "3xl" }}
            p={{ base: 4, md: 6 }}
            shadow="sm"
            overflow="hidden"
            position="relative"
          >
            <Box
              position="absolute"
              insetX={0}
              top={0}
              h="1"
              bgGradient="linear(to-r, blue.400, purple.500, pink.400)"
            />

            <Flex
              direction={{ base: "column", lg: "row" }}
              justify="space-between"
              align={{ base: "stretch", lg: "center" }}
              gap={{ base: 4, md: 6 }}
            >
              <Box minW={0}>
                <Heading
                  size={{ base: "md", md: "lg" }}
                  color={headingColor}
                  letterSpacing="-0.04em"
                >
                  Departments
                </Heading>

                <Text
                  mt={1}
                  fontSize={{ base: "xs", md: "sm" }}
                  color={secondaryTextColor}
                  noOfLines={{ base: 2, md: 1 }}
                >
                  Structure and management for{" "}
                  <Text as="span" fontWeight="700" color={headingColor}>
                    {activeCompany?.company_name || "selected company"}
                  </Text>
                </Text>
              </Box>

              <SimpleGrid
                columns={{ base: 1, sm: 2 }}
                spacing={{ base: 3, md: 4 }}
                minW={{ base: "100%", lg: "420px" }}
              >
                <StatCard
                  icon={FiGrid}
                  label="Total departments"
                  value={totalDepartments}
                  colorScheme="blue"
                />

                <StatCard
                  icon={FiBriefcase}
                  label="Company"
                  value={activeCompany?.company_name || "ABC"}
                  colorScheme="purple"
                />
              </SimpleGrid>
            </Flex>
          </Box>

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