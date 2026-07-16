"use client";

import stores from "@/app/store/stores";
import { getDefaultAuthenticatedRoute, isEmployeeRole } from "@/app/config/utils/roleAccess";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiHash,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";

function text(value: any) {
  if (value === null || value === undefined || typeof value === "object") {
    return "";
  }

  return String(value).trim();
}

function formatDate(value: any) {
  if (!value) {
    return "Not added";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not added";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getProfileValue(user: any, personalInfo: any, key: string) {
  return text(user?.[key]) || text(personalInfo?.[key]);
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  const iconBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("gray.900", "gray.100");

  return (
    <HStack align="flex-start" spacing={3}>
      <Center
        flexShrink={0}
        w="38px"
        h="38px"
        borderRadius="8px"
        bg={iconBg}
        color="blue.500"
      >
        <Icon as={icon} boxSize={4} />
      </Center>
      <Box minW={0}>
        <Text fontSize="12px" fontWeight="700" color={labelColor} textTransform="uppercase">
          {label}
        </Text>
        <Text fontSize="14px" fontWeight="700" color={valueColor} noOfLines={2}>
          {value || "Not added"}
        </Text>
      </Box>
    </HStack>
  );
}

function ModuleCard({
  icon,
  title,
  description,
  status,
}: {
  icon: any;
  title: string;
  description: string;
  status: string;
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const textColor = useColorModeValue("gray.600", "gray.300");

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="8px"
      p={5}
      minH="160px"
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Center w="42px" h="42px" borderRadius="8px" bg="blue.50" color="blue.600">
          <Icon as={icon} boxSize={5} />
        </Center>
        <Badge colorScheme="gray" borderRadius="6px" px={2} py={1}>
          {status}
        </Badge>
      </Flex>
      <Text mt={4} fontSize="16px" fontWeight="800">
        {title}
      </Text>
      <Text mt={2} fontSize="13px" lineHeight="1.6" color={textColor}>
        {description}
      </Text>
    </Box>
  );
}

const EmployeePage = observer(() => {
  const router = useRouter();
  const { user, sessionReady } = stores.auth;
  const role = String(stores.auth.userType || user?.role || "");
  const isEmployee = Boolean(user) && isEmployeeRole(role);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    if (!user) {
      router.replace("/login?redirect=/employee");
      return;
    }

    if (!isEmployeeRole(role)) {
      router.replace(getDefaultAuthenticatedRoute(user));
    }
  }, [role, router, sessionReady, user]);

  const personalInfo = useMemo(
    () => user?.profile_details?.personalInfo || {},
    [user?.profile_details?.personalInfo]
  );

  const employeeName = text(user?.name || personalInfo?.name) || "Employee";
  const company = user?.companyDetails || {};
  const companyName = text(company?.company_name || company?.name) || "Company not added";
  const profileId = getProfileValue(user, personalInfo, "profileId");
  const employeeCode = getProfileValue(user, personalInfo, "code");
  const department = getProfileValue(user, personalInfo, "department");
  const designation = getProfileValue(user, personalInfo, "designation") || getProfileValue(user, personalInfo, "title");
  const email = text(user?.email || user?.username || personalInfo?.email || personalInfo?.username);
  const phone = getProfileValue(user, personalInfo, "mobileNumber");
  const joiningDate = user?.joiningDate || personalInfo?.joiningDate;
  const location = [
    getProfileValue(user, personalInfo, "city"),
    getProfileValue(user, personalInfo, "state"),
    getProfileValue(user, personalInfo, "country"),
  ].filter(Boolean).join(", ");
  const managerRows = Array.isArray(user?.managers) ? user.managers : [];

  const pageBg = useColorModeValue("gray.50", "gray.950");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const strongText = useColorModeValue("gray.950", "gray.50");

  if (!sessionReady || !user || !isEmployee) {
    return (
      <Center minH="60vh">
        <Spinner size="lg" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }}>
      <Box maxW="1180px" mx="auto">
        <Flex
          align={{ base: "flex-start", md: "center" }}
          justify="space-between"
          gap={4}
          direction={{ base: "column", md: "row" }}
          mb={6}
        >
          <Box>
            <Text color={mutedText} fontSize="13px" fontWeight="700" textTransform="uppercase">
              Employee Workspace
            </Text>
            <Text mt={1} fontSize={{ base: "24px", md: "30px" }} fontWeight="900" color={strongText}>
              My HRMS
            </Text>
          </Box>
          <Button as={Link} href="/user-profile" size="sm" borderRadius="8px" colorScheme="blue" leftIcon={<FiUser />}>
            View Profile
          </Button>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={5}>
          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="8px"
            p={6}
            gridColumn={{ base: "auto", lg: "span 1" }}
          >
            <VStack align="stretch" spacing={5}>
              <HStack align="center" spacing={4}>
                <Avatar name={employeeName} src={text(user?.pic?.url)} size="lg" bg="blue.600" color="white" />
                <Box minW={0}>
                  <Text fontSize="20px" fontWeight="900" noOfLines={1}>
                    {employeeName}
                  </Text>
                  <Text fontSize="14px" color={mutedText} noOfLines={1}>
                    {designation || department || "Employee"}
                  </Text>
                  <HStack mt={2} spacing={2} wrap="wrap">
                    <Badge colorScheme={user?.is_active ? "green" : "yellow"} borderRadius="6px">
                      {user?.is_active ? "Active" : "Pending setup"}
                    </Badge>
                    <Badge colorScheme="blue" borderRadius="6px">
                      Employee
                    </Badge>
                  </HStack>
                </Box>
              </HStack>

              <Divider />

              <Stack spacing={4}>
                <InfoItem icon={FiHash} label="Employee Code" value={employeeCode} />
                <InfoItem icon={FiShield} label="Profile ID" value={profileId} />
                <InfoItem icon={FiBriefcase} label="Department" value={department} />
                <InfoItem icon={FiCalendar} label="Joining Date" value={formatDate(joiningDate)} />
              </Stack>
            </VStack>
          </Box>

          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="8px"
            p={6}
            gridColumn={{ base: "auto", lg: "span 2" }}
          >
            <Flex justify="space-between" gap={3} align="flex-start" mb={5}>
              <Box>
                <Text fontSize="18px" fontWeight="900">
                  Employee Details
                </Text>
                <Text fontSize="13px" color={mutedText}>
                  Your company, contact, and reporting information.
                </Text>
              </Box>
              <Icon as={FiCheckCircle} boxSize={5} color="green.500" />
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
              <InfoItem icon={FiBriefcase} label="Company" value={companyName} />
              <InfoItem icon={FiUser} label="Designation" value={designation} />
              <InfoItem icon={FiMail} label="Email" value={email} />
              <InfoItem icon={FiPhone} label="Phone" value={phone} />
              <InfoItem icon={FiMapPin} label="Location" value={location} />
              <InfoItem icon={FiUsers} label="Reporting Managers" value={`${managerRows.length || 0} assigned`} />
            </SimpleGrid>

            <Divider my={6} />

            <Box>
              <Text fontSize="15px" fontWeight="800" mb={3}>
                Reporting Line
              </Text>
              {managerRows.length ? (
                <Stack spacing={3}>
                  {managerRows.map((manager: any, index: number) => (
                    <Flex
                      key={`${manager?.managerEmail || "manager"}-${index}`}
                      align={{ base: "flex-start", sm: "center" }}
                      justify="space-between"
                      gap={3}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="8px"
                      px={4}
                      py={3}
                      direction={{ base: "column", sm: "row" }}
                    >
                      <Box>
                        <Text fontSize="14px" fontWeight="800">
                          Level {manager?.level || index + 1} Manager
                        </Text>
                        <Text fontSize="13px" color={mutedText}>
                          {text(manager?.managerName) || text(manager?.managerEmail) || "Manager not added"}
                        </Text>
                      </Box>
                      <Badge colorScheme={manager?.status === "ASSIGNED" ? "green" : "yellow"} borderRadius="6px">
                        {text(manager?.status) || "Pending"}
                      </Badge>
                    </Flex>
                  ))}
                </Stack>
              ) : (
                <Box border="1px dashed" borderColor={borderColor} borderRadius="8px" p={4}>
                  <Text fontSize="13px" color={mutedText}>
                    No reporting manager has been assigned yet.
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        </SimpleGrid>

        <Box mt={6}>
          <Text fontSize="18px" fontWeight="900" mb={4}>
            HR Modules
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={5}>
            <ModuleCard
              icon={FiClock}
              title="Attendance"
              description="Clock-in, daily attendance, shift status, and attendance history."
              status="Next"
            />
            <ModuleCard
              icon={FiCalendar}
              title="Leave"
              description="Apply for leave, view balances, and track approvals."
              status="Next"
            />
            <ModuleCard
              icon={FiFileText}
              title="Documents"
              description="Access employee documents, policy files, and generated letters."
              status="Planned"
            />
            <ModuleCard
              icon={FiCreditCard}
              title="Payroll"
              description="Payslips, salary structure, reimbursements, and tax documents."
              status="Planned"
            />
          </SimpleGrid>
        </Box>
      </Box>
    </Box>
  );
});

export default EmployeePage;
