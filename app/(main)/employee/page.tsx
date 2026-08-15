"use client";

import stores from "@/app/store/stores";
import { getDefaultAuthenticatedRoute, isEmployeeRole } from "@/app/config/utils/roleAccess";
import {
  Badge,
  Box,
  Button,
  Center,
  Grid,
  GridItem,
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
  FiMail,
  FiMapPin,
  FiPhone,
  FiPower,
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

function QuickLinkTile({
  icon,
  label,
  href,
}: {
  icon: any;
  label: string;
  href: string;
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const accent = useColorModeValue("orange.500", "orange.300");

  return (
    <Button
      as={Link}
      href={href}
      variant="ghost"
      h="auto"
      p={0}
      _hover={{ bg: "transparent", transform: "translateY(-2px)" }}
      _active={{ transform: "translateY(0)" }}
      transition="all 0.2s ease"
    >
      <VStack spacing={2} w="full">
        <Center
          w="64px"
          h="64px"
          borderRadius="18px"
          bg={cardBg}
          border="1px solid"
          borderColor={useColorModeValue("gray.200", "whiteAlpha.200")}
          boxShadow="sm"
        >
          <Icon as={icon} boxSize={7} color={accent} />
        </Center>
        <Text fontSize="13px" fontWeight="700" color={textColor} textAlign="center">
          {label}
        </Text>
      </VStack>
    </Button>
  );
}

const EmployeePage = observer(() => {
  const router = useRouter();
  const { user, sessionReady } = stores.auth;
  const role = String(stores.auth.userType || user?.role || "");
  const isEmployee = Boolean(user) && isEmployeeRole(role);
  const accountStatus = String(user?.status || "PENDING").toUpperCase();

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

  const company = user?.companyDetails || {};
  const companyName = text(company?.company_name || company?.name) || "Company not added";
  const designation = getProfileValue(user, personalInfo, "designation") || getProfileValue(user, personalInfo, "title");
  const email = text(user?.email || user?.username || personalInfo?.email || personalInfo?.username);
  const phone = getProfileValue(user, personalInfo, "mobileNumber");
  const location = [
    getProfileValue(user, personalInfo, "city"),
    getProfileValue(user, personalInfo, "state"),
    getProfileValue(user, personalInfo, "country"),
  ].filter(Boolean).join(", ");
  const reportingManager = user?.reportingManager || null;

  const pageBg = useColorModeValue("gray.50", "gray.950");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const strongText = useColorModeValue("gray.950", "gray.50");
  const tableHeaderBg = useColorModeValue("gray.100", "gray.700");
  const punchBadgeBg = useColorModeValue("yellow.300", "yellow.500");
  const punchButtonBg = useColorModeValue("orange.400", "orange.300");
  const punchButtonText = useColorModeValue("white", "gray.900");
  const detailsButtonBg = useColorModeValue("green.500", "green.400");

  if (!sessionReady || !user || !isEmployee) {
    return (
      <Center minH="60vh">
        <Spinner size="lg" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg}>
      <Flex align="stretch" minH="calc(100vh - 88px)">
        <Box flex="1" px={{ base: 4, md: 6, xl: 8 }} py={{ base: 5, md: 6 }}>
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
                Employee Self Service
              </Text>
            </Box>
            <Button as={Link} href="/dashboard/user-profile" size="sm" borderRadius="8px" colorScheme="blue" leftIcon={<FiUser />}>
              View Profile
            </Button>
          </Flex>

          <Grid templateColumns={{ base: "1fr", xl: "1.05fr 1fr" }} gap={5}>
          <GridItem>
            <Stack spacing={5}>
              <Box
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="14px"
                p={{ base: 5, md: 6 }}
                boxShadow="0 10px 28px rgba(15, 23, 42, 0.06)"
              >
                <HStack justify="space-between" align="center" mb={5}>
                  <HStack spacing={3}>
                    <Center w="34px" h="34px" borderRadius="full" bg={useColorModeValue("gray.100", "gray.700")}>
                      <Icon as={FiPower} boxSize={4} color={useColorModeValue("gray.700", "gray.200")} />
                    </Center>
                    <Text fontSize="18px" fontWeight="900">
                      Todays Punches
                    </Text>
                  </HStack>
                  <Badge
                    colorScheme={accountStatus === "ACTIVE" ? "green" : accountStatus === "INACTIVE" ? "red" : "yellow"}
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    {accountStatus === "ACTIVE" ? "Active" : accountStatus === "INACTIVE" ? "Inactive" : "Pending"}
                  </Badge>
                </HStack>

                <HStack spacing={3} flexWrap="wrap">
                  <Badge
                    borderRadius="full"
                    px={4}
                    py={2}
                    bg={punchBadgeBg}
                    color="gray.900"
                    fontSize="13px"
                    fontWeight="800"
                  >
                    Last Punch : 18:23
                  </Badge>
                  <Button borderRadius="full" bg={punchButtonBg} color={punchButtonText} _hover={{ opacity: 0.92 }}>
                    Punch Time
                  </Button>
                  <Button borderRadius="full" bg={detailsButtonBg} color="white" _hover={{ opacity: 0.92 }}>
                    Get Details
                  </Button>
                </HStack>
              </Box>

              <Box
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="14px"
                p={{ base: 5, md: 6 }}
                boxShadow="0 10px 28px rgba(15, 23, 42, 0.06)"
              >
                <Text fontSize="18px" fontWeight="900" mb={4}>
                  My Attendance
                </Text>
                <Box overflowX="auto">
                  <Box minW="560px">
                    <Flex bg={tableHeaderBg} borderRadius="8px 8px 0 0" px={4} py={3} fontSize="13px" fontWeight="800">
                      <Box flex="1">Date</Box>
                      <Box flex="0.7">In</Box>
                      <Box flex="0.7">Out</Box>
                      <Box flex="0.7">WHrs</Box>
                      <Box flex="0.6">Status</Box>
                      <Box flex="0.6">Late</Box>
                      <Box flex="0.6">Early</Box>
                    </Flex>
                    {[
                      { date: "20 Jul 2026", in: "09:01", out: "18:15", whrs: "09:14", status: "P", late: "-", early: "-" },
                      { date: "19 Jul 2026", in: "00:00", out: "00:00", whrs: "00:00", status: "WO", late: "-", early: "-" },
                    ].map((row) => (
                      <Flex key={row.date} px={4} py={3} borderTop="1px solid" borderColor={borderColor} fontSize="13px">
                        <Box flex="1">{row.date}</Box>
                        <Box flex="0.7">{row.in}</Box>
                        <Box flex="0.7">{row.out}</Box>
                        <Box flex="0.7">{row.whrs}</Box>
                        <Box flex="0.6" fontWeight="700">
                          {row.status}
                        </Box>
                        <Box flex="0.6">{row.late}</Box>
                        <Box flex="0.6">{row.early}</Box>
                      </Flex>
                    ))}
                  </Box>
                </Box>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <Box
                  bg={cardBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="14px"
                  p={6}
                  boxShadow="0 10px 28px rgba(15, 23, 42, 0.06)"
                >
                  <Text fontSize="18px" fontWeight="900" mb={4}>
                    Employee Benefit
                  </Text>
                  <Stack spacing={3}>
                    <InfoItem icon={FiCreditCard} label="Payroll" value="Salary slip & structure" />
                    <InfoItem icon={FiFileText} label="Documents" value="Policy files & letters" />
                    <InfoItem icon={FiCalendar} label="Leave" value="Apply and track approvals" />
                  </Stack>
                </Box>

                <Box
                  bg={cardBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="14px"
                  p={6}
                  boxShadow="0 10px 28px rgba(15, 23, 42, 0.06)"
                >
                  <Text fontSize="18px" fontWeight="900" mb={4}>
                    Value Add
                  </Text>
                  <Stack spacing={3}>
                    <InfoItem icon={FiShield} label="Policy" value="Announcements and updates" />
                    <InfoItem icon={FiUsers} label="Support" value="HR and reporting team contacts" />
                    <InfoItem icon={FiCheckCircle} label="Status" value="Profile and attendance snapshot" />
                  </Stack>
                </Box>
              </SimpleGrid>
            </Stack>
          </GridItem>

          <GridItem>
            <Stack spacing={5}>
              <Box
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="14px"
                p={{ base: 5, md: 6 }}
                boxShadow="0 10px 28px rgba(15, 23, 42, 0.06)"
              >
                <Text fontSize="18px" fontWeight="900" mb={5}>
                  Quick Links
                </Text>
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={6}>
                  <QuickLinkTile icon={FiCalendar} label="Monthly Att." href="/dashboard/user-profile" />
                  <QuickLinkTile icon={FiClock} label="Leave Request" href="/dashboard/request/leave" />
                  <QuickLinkTile icon={FiShield} label="Holiday List" href="/dashboard/company/policy/holidays" />
                  <QuickLinkTile icon={FiCreditCard} label="Expense Claim" href="/dashboard/request" />
                  <QuickLinkTile icon={FiFileText} label="Salary Slip" href="/dashboard/salary-slip" />
                  <QuickLinkTile icon={FiUsers} label="Help Desk" href="/contact-us" />
                </SimpleGrid>
              </Box>

              <Box
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="14px"
                p={6}
                boxShadow="0 10px 28px rgba(15, 23, 42, 0.06)"
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
                  <InfoItem
                    icon={FiUsers}
                    label="Reporting Manager"
                    value={reportingManager?.name || reportingManager?.email || "Not assigned"}
                  />
                </SimpleGrid>

                <Divider my={6} />

                <Box>
                  <Text fontSize="15px" fontWeight="800" mb={3}>
                    Reporting Line
                  </Text>
                  {reportingManager ? (
                    <Flex
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
                          {text(reportingManager.name) || "Reporting Manager"}
                        </Text>
                        <Text fontSize="13px" color={mutedText}>
                          {text(reportingManager.email || reportingManager.username) || "--"}
                        </Text>
                      </Box>
                      <Badge colorScheme="green" borderRadius="6px">Assigned</Badge>
                    </Flex>
                  ) : (
                    <Box border="1px dashed" borderColor={borderColor} borderRadius="8px" p={4}>
                      <Text fontSize="13px" color={mutedText}>
                        No reporting manager has been assigned yet.
                      </Text>
                    </Box>
                  )}
                </Box>
              </Box>
            </Stack>
          </GridItem>
          </Grid>

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
      </Flex>
    </Box>
  );
});

export default EmployeePage;
