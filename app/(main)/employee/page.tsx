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
  IconButton,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  FiChevronDown,
  FiChevronRight,
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

function EmployeeSidebar() {
  const sidebarBg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subText = useColorModeValue("gray.700", "gray.300");
  const accent = useColorModeValue("orange.500", "orange.300");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    links: true,
    profile: false,
    attendance: false,
    request: true,
    claims: false,
    company: false,
    valueAdd: false,
    benefits: false,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups((current) => ({ ...current, [group]: !current[group] }));
  };

  const navLink = (label: string, href: string, isActive = false) => (
    <ChakraLink
      as={Link}
      href={href}
      display="flex"
      alignItems="center"
      gap={2}
      px={3}
      py={2}
      borderRadius="md"
      fontSize="14px"
      color={isActive ? accent : textColor}
      fontWeight={isActive ? "800" : "600"}
      _hover={{ textDecoration: "none", bg: hoverBg }}
    >
      <Icon as={FiUser} boxSize={4} />
      <Text>{label}</Text>
    </ChakraLink>
  );

  return (
    <Box
      as="aside"
      w={collapsed ? "64px" : { base: "full", lg: "210px", xl: "220px" }}
      flexShrink={0}
      bg={sidebarBg}
      borderRight="1px solid"
      borderColor={borderColor}
      minH="calc(100vh - 88px)"
      position={{ base: "relative", lg: "sticky" }}
      top={{ base: 0, lg: "88px" }}
      overflowY="auto"
    >
      <Flex align="center" justify={collapsed ? "center" : "space-between"} px={3} py={3} borderBottom="1px solid" borderColor={borderColor}>
        {!collapsed ? <Text fontSize="13px" fontWeight="800" color={accent}>Menu</Text> : null}
        <IconButton
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          icon={collapsed ? <FiChevronRight /> : <FiChevronDown />}
          size="sm"
          variant="ghost"
          onClick={() => setCollapsed((value) => !value)}
        />
      </Flex>

      {!collapsed ? (
        <Stack spacing={0}>
          <Box borderBottom="1px solid" borderColor={borderColor}>{navLink("Home", "/employee", true)}</Box>

          <Box borderBottom="1px solid" borderColor={borderColor}>
            <Flex
              as="button"
              type="button"
              w="full"
              align="center"
              justify="space-between"
              px={3}
              py={3}
              fontWeight="700"
              color={textColor}
              onClick={() => toggleGroup("links")}
            >
              <HStack spacing={2}>
                <Icon as={FiFileText} boxSize={4} />
                <Text fontSize="14px">My Links</Text>
              </HStack>
              <Icon as={openGroups.links ? FiChevronDown : FiChevronRight} boxSize={4} />
            </Flex>
            {openGroups.links ? (
              <Stack px={3} pb={3} spacing={1}>
                {[
                  ["My CTC", "/employee/ctc"],
                  ["My Salary Slip", "/dashboard/salary-slip"],
                  ["My Investment Declaration", "/employee/investment-declaration"],
                  ["My Tax Report", "/employee/tax-report"],
                  ["My Annual Salary", "/employee/annual-salary"],
                  ["My To Do", "/employee/todo"],
                  ["My Activity Update", "/employee/activity-update"],
                  ["Asset Allocated", "/employee/assets"],
                  ["View My Process Activities", "/employee/process-activities"],
                  ["My Form16", "/employee/form16"],
                  ["My Trainings", "/course"],
                  ["Remarks", "/employee/remarks"],
                  ["My Appreciation", "/employee/appreciation"],
                ].map(([label, href]) => (
                  <ChakraLink
                    key={label}
                    as={Link}
                    href={href}
                    px={2}
                    py={1.5}
                    borderRadius="md"
                    fontSize="13px"
                    color={subText}
                    _hover={{ textDecoration: "none", bg: hoverBg, color: accent }}
                  >
                    {label}
                  </ChakraLink>
                ))}
              </Stack>
            ) : null}
          </Box>

          <Box borderBottom="1px solid" borderColor={borderColor}>
            <Flex as="button" type="button" w="full" align="center" justify="space-between" px={3} py={3} fontWeight="700" color={textColor} onClick={() => toggleGroup("profile")}>
              <HStack spacing={2}>
                <Icon as={FiUser} boxSize={4} />
                <Text fontSize="14px">My Profile</Text>
              </HStack>
              <Icon as={openGroups.profile ? FiChevronDown : FiChevronRight} boxSize={4} />
            </Flex>
            {openGroups.profile ? <Box px={3} pb={3}>{navLink("Profile Details", "/user-profile")}</Box> : null}
          </Box>

          <Box borderBottom="1px solid" borderColor={borderColor}>
            <Flex as="button" type="button" w="full" align="center" justify="space-between" px={3} py={3} fontWeight="700" color={textColor} onClick={() => toggleGroup("attendance")}>
              <HStack spacing={2}>
                <Icon as={FiCalendar} boxSize={4} />
                <Text fontSize="14px">My Attendance</Text>
              </HStack>
              <Icon as={openGroups.attendance ? FiChevronDown : FiChevronRight} boxSize={4} />
            </Flex>
            {openGroups.attendance ? <Box px={3} pb={3}>{navLink("Attendance Overview", "#attendance")}</Box> : null}
          </Box>

          <Box borderBottom="1px solid" borderColor={borderColor}>
            <Flex as="button" type="button" w="full" align="center" justify="space-between" px={3} py={3} fontWeight="700" color={textColor} onClick={() => toggleGroup("request")}>
              <HStack spacing={2}>
                <Icon as={FiFileText} boxSize={4} />
                <Text fontSize="14px">Request</Text>
              </HStack>
              <Icon as={openGroups.request ? FiChevronDown : FiChevronRight} boxSize={4} />
            </Flex>
            {openGroups.request ? (
              <Stack px={3} pb={3} spacing={1}>
                {[
                  ["Attendance Regularise", "/dashboard/request"],
                  ["Leave/OD/WFH", "/dashboard/request/leave"],
                  ["HelpDesk", "/contact-us"],
                  ["Appreciation", "/employee/appreciation"],
                  ["Resignation Note", "/employee/resignation"],
                  ["Leave Encashment", "/employee/leave-encashment"],
                ].map(([label, href]) => (
                  <ChakraLink
                    key={label}
                    as={Link}
                    href={href}
                    px={2}
                    py={1.5}
                    borderRadius="md"
                    fontSize="13px"
                    color={subText}
                    _hover={{ textDecoration: "none", bg: hoverBg, color: accent }}
                  >
                    {label}
                  </ChakraLink>
                ))}
              </Stack>
            ) : null}
          </Box>

          {[
            ["My Claims", "claims", "/employee/claims"],
            ["Corp. Info.", "company", "/dashboard/company-settings"],
            ["Value Add", "valueAdd", "/employee/value-add"],
            ["Employee Benefit", "benefits", "/employee/benefits"],
          ].map(([label, groupKey, href]) => (
            <Box key={label} borderBottom="1px solid" borderColor={borderColor}>
              <Flex as="button" type="button" w="full" align="center" justify="space-between" px={3} py={3} fontWeight="700" color={textColor} onClick={() => toggleGroup(String(groupKey))}>
                <HStack spacing={2}>
                  <Icon as={FiShield} boxSize={4} />
                  <Text fontSize="14px">{label}</Text>
                </HStack>
                <Icon as={openGroups[String(groupKey)] ? FiChevronDown : FiChevronRight} boxSize={4} />
              </Flex>
              {openGroups[String(groupKey)] ? <Box px={3} pb={3}>{navLink(`${label} Home`, href)}</Box> : null}
            </Box>
          ))}
        </Stack>
      ) : null}
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
  const managerRows = Array.isArray(user?.managers) ? user.managers : [];

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
        <Box display={{ base: "none", lg: "block" }}>
          <EmployeeSidebar />
        </Box>
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
            <Button as={Link} href="/user-profile" size="sm" borderRadius="8px" colorScheme="blue" leftIcon={<FiUser />}>
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
                  <Badge colorScheme={user?.is_active ? "green" : "yellow"} borderRadius="full" px={3} py={1}>
                    {user?.is_active ? "Active" : "Pending"}
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
                  <QuickLinkTile icon={FiCalendar} label="Monthly Att." href="/user-profile" />
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
