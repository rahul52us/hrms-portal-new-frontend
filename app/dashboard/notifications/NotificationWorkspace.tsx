"use client";

import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  AlertTitle,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Icon,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Tag,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBell,
  FiBookOpen,
  FiClock,
  FiEye,
  FiFilter,
  FiFlag,
  FiMail,
  FiMessageSquare,
  FiSearch,
  FiSend,
  FiShield,
  FiZap
} from "react-icons/fi";
import { getApiErrorMessage } from "../../config/utils/apiError";
import stores from "../../store/stores";

type NotificationType =
  | "announcement"
  | "quiz_reminder"
  | "pending_course"
  | "course_expiry"
  | "batch_ending"
  | "custom";

type RecipientMode = "selected" | "all";

type NotificationUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  status: "active" | "inactive" | "pending" | string;
  managers?: Array<{ managerEmail?: string; managerName?: string; level?: number }>;
  notificationSignals?: {
    assignedCourses?: number;
    pendingCourses?: number;
    completedCourses?: number;
    inProgressCourses?: number;
    notStartedCourses?: number;
    overdueCourses?: number;
    expiringCourses?: number;
    batchEndingSoon?: boolean;
    batchEndingSoonCount?: number;
    quizAttempts?: number;
    courseStatus?: string;
    quizStatus?: string;
  };
};

const notificationTypes: Array<{
  value: NotificationType;
  label: string;
  subject: string;
  message: string;
  icon: any;
  tone: string;
}> = [
  {
    value: "announcement",
    label: "Announcement",
    subject: "Important Announcement",
    message: "We have an important update for {{company_name}}. Please review the details and reach out to your administrator if you need support.",
    icon: FiBell,
    tone: "blue",
  },
  {
    value: "quiz_reminder",
    label: "Quiz Reminder",
    subject: "Please complete your pending quiz",
    message: "A quiz is waiting for you. Please complete it soon so your learning progress stays up to date.",
    icon: FiZap,
    tone: "purple",
  },
  {
    value: "pending_course",
    label: "Pending Course",
    subject: "Reminder: Complete your pending course",
    message: "You still have pending course work in {{company_name}}. Please continue from where you left off and complete it before the due date.",
    icon: FiBookOpen,
    tone: "orange",
  },
  {
    value: "course_expiry",
    label: "Course Expiry",
    subject: "Your course is about to expire",
    message: "One or more assigned courses are nearing expiry. Please complete the required learning before access closes.",
    icon: FiClock,
    tone: "red",
  },
  {
    value: "batch_ending",
    label: "Batch Ending",
    subject: "Your batch is ending soon",
    message: "Your batch is approaching its end date. Please complete any remaining course and quiz activity as soon as possible.",
    icon: FiFlag,
    tone: "teal",
  },
  {
    value: "custom",
    label: "Custom Message",
    subject: "Message from {{company_name}}",
    message: "Write your message here for {{user_name}}.",
    icon: FiMessageSquare,
    tone: "gray",
  },
];

const defaultFilters = {
  role: "",
  department: "",
  manager: "",
  status: "",
  courseStatus: "",
  quizStatus: "",
  pendingCourses: false,
  completedCourses: false,
  courseExpiringSoon: false,
  batchEndingSoon: false,
  overdueCourses: false,
  notStarted: false,
  inProgress: false,
};

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function formatLabel(value: string) {
  return String(value || "all")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderPreviewText(template: string, user: NotificationUser | null, company: any) {
  return String(template || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const values: Record<string, string> = {
      user_name: user?.name || "Alex Learner",
      company_name: company?.company_name || "Company",
      course_name: "Assigned Course",
      batch_name: "Current Batch",
      due_date: "Due date",
    };
    return values[key] || "";
  });
}

const NotificationWorkspace = observer(({
  initialCompany = null,
  currentUser = stores.auth.user,
}: {
  initialCompany?: any;
  currentUser?: any;
}) => {
  const toast = useToast();
  const confirmDialog = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const surfaceBg = useColorModeValue("white", "gray.800");
  const subtleBg = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const previewBg = useColorModeValue("gray.100", "gray.900");
  const cardTextColor = useColorModeValue("gray.800", "gray.100");
  const selectedUserBg = useColorModeValue("blue.50", "blue.900");
  const heroBg = useColorModeValue(
    "linear-gradient(135deg, rgba(235,248,255,0.98) 0%, rgba(255,255,255,0.98) 45%, rgba(230,255,250,0.96) 100%)",
    "linear-gradient(135deg, rgba(26,32,44,0.96) 0%, rgba(17,24,39,0.98) 55%, rgba(22,78,99,0.85) 100%)"
  );
  const searchBg = useColorModeValue("white", "whiteAlpha.80");
  const searchBorderColor = useColorModeValue("blue.100", "whiteAlpha.200");
  const chipBg = useColorModeValue("whiteAlpha.800", "whiteAlpha.140");
  const scrollbarThumb = useColorModeValue("rgba(59,130,246,0.45)", "rgba(144,205,244,0.45)");
  const scrollbarTrack = useColorModeValue("rgba(226,232,240,0.75)", "rgba(45,55,72,0.7)");
  const heroBorderColor = useColorModeValue("blue.100", "whiteAlpha.200");
  const heroOrbBg = useColorModeValue("blue.100", "whiteAlpha.100");

  const { companyStore, userStore } = stores;
  const managedCompanies = companyStore.companies?.data || [];
  const companyOptions = managedCompanies.length ? managedCompanies : initialCompany ? [initialCompany] : [];
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompany?._id || "");
  const selectedCompany = companyOptions.find((entry: any) => entry?._id === selectedCompanyId) || initialCompany;
  const platformBrandName = currentUser?.companyDetails?.company_name || currentUser?.company?.company_name || "LMS Team";

  const [users, setUsers] = useState<NotificationUser[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>({ roles: [], departments: [], managers: [] });
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState("");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("selected");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [notificationType, setNotificationType] = useState<NotificationType>("announcement");
  const [subject, setSubject] = useState(notificationTypes[0].subject);
  const [message, setMessage] = useState(notificationTypes[0].message);
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [priority, setPriority] = useState("Normal");

  const isSuperAdmin = normalize(currentUser?.role || currentUser?.userType) === "superadmin";

  useEffect(() => {
    if (isSuperAdmin && managedCompanies.length === 0) {
      companyStore.getManagedCompanies().catch(() => undefined);
    }
  }, [companyStore, isSuperAdmin, managedCompanies.length]);

  useEffect(() => {
    if (!selectedCompanyId && companyOptions[0]?._id) {
      setSelectedCompanyId(companyOptions[0]._id);
    }
  }, [companyOptions, selectedCompanyId]);

  useEffect(() => {
    if (!isSuperAdmin || !selectedCompanyId) {
      return;
    }

    let isCurrent = true;
    setIsLoadingUsers(true);
    userStore
      .fetchNotificationUsers(selectedCompanyId)
      .then((response: any) => {
        if (!isCurrent) {
          return;
        }
        setUsers(response?.data?.users || []);
        setFilterOptions(response?.data?.filters || { roles: [], departments: [], managers: [] });
        setSelectedUserIds([]);
      })
      .catch((err: any) => {
        if (!isCurrent) {
          return;
        }
        toast({
          title: "Unable to load users",
          description: getApiErrorMessage(err),
          status: "error",
          position: "top-right",
          isClosable: true,
        });
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingUsers(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isSuperAdmin, selectedCompanyId, toast, userStore]);

  const filteredUsers = useMemo(() => {
    const searchText = normalize(search);
    return users.filter((user) => {
      const signals = user.notificationSignals || {};
      const matchesSearch =
        !searchText ||
        normalize(user.name).includes(searchText) ||
        normalize(user.email).includes(searchText) ||
        normalize(user.role).includes(searchText) ||
        normalize(user.department).includes(searchText);

      if (!matchesSearch) return false;
      if (filters.role && normalize(user.role) !== normalize(filters.role)) return false;
      if (filters.department && normalize(user.department) !== normalize(filters.department)) return false;
      if (filters.status && normalize(user.status) !== normalize(filters.status)) return false;
      if (filters.courseStatus && normalize(signals.courseStatus) !== normalize(filters.courseStatus)) return false;
      if (filters.quizStatus && normalize(signals.quizStatus) !== normalize(filters.quizStatus)) return false;
      if (filters.manager) {
        const managerMatch = (user.managers || []).some(
          (manager) =>
            normalize(manager.managerEmail) === normalize(filters.manager) ||
            normalize(manager.managerName) === normalize(filters.manager)
        );
        if (!managerMatch) return false;
      }
      if (filters.pendingCourses && !signals.pendingCourses) return false;
      if (filters.completedCourses && !signals.completedCourses) return false;
      if (filters.courseExpiringSoon && !signals.expiringCourses) return false;
      if (filters.batchEndingSoon && !signals.batchEndingSoon) return false;
      if (filters.overdueCourses && !signals.overdueCourses) return false;
      if (filters.notStarted && !signals.notStartedCourses) return false;
      if (filters.inProgress && !signals.inProgressCourses) return false;

      return true;
    });
  }, [filters, search, users]);

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedUserIds.includes(user._id)),
    [selectedUserIds, users]
  );
  const recipientCount = recipientMode === "all" ? filteredUsers.length : selectedUsers.length;
  const sampleUser = selectedUsers[0] || filteredUsers[0] || null;
  const previewSubject = renderPreviewText(subject, sampleUser, selectedCompany);
  const previewMessage = renderPreviewText(message, sampleUser, selectedCompany);

  const stats = useMemo(() => {
    return {
      total: users.length,
      selected: recipientCount,
      pending: filteredUsers.reduce((sum, user) => sum + Number(user.notificationSignals?.pendingCourses || 0), 0),
      expiring: filteredUsers.reduce((sum, user) => sum + Number(user.notificationSignals?.expiringCourses || 0), 0),
    };
  }, [filteredUsers, recipientCount, users.length]);

  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const selectType = (type: NotificationType) => {
    const option = notificationTypes.find((entry) => entry.value === type);
    if (!option) return;
    setNotificationType(type);
    setSubject(option.subject);
    setMessage(option.message);
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    setRecipientMode("selected");
    setSelectedUserIds(filteredUsers.map((user) => user._id));
  };

  const clearSelection = () => {
    setSelectedUserIds([]);
    setRecipientMode("selected");
  };

  const validateBeforeSend = () => {
    if (!selectedCompanyId) return "Select a company first.";
    if (recipientCount < 1) return "Select at least one recipient.";
    if (!subject.trim()) return "Subject is required.";
    if (!message.trim()) return "Message is required.";
    if (ctaUrl.trim() && !/^https?:\/\//i.test(ctaUrl.trim())) return "CTA URL must start with http:// or https://.";
    return "";
  };

  const openConfirm = () => {
    const error = validateBeforeSend();
    if (error) {
      toast({
        title: "Review notification",
        description: error,
        status: "warning",
        position: "top-right",
        isClosable: true,
      });
      return;
    }
    confirmDialog.onOpen();
  };

  const sendNotification = async () => {
    setIsSending(true);
    try {
      const payload = {
        companyId: selectedCompanyId,
        recipientMode,
        userIds: recipientMode === "selected" ? selectedUserIds : [],
        filters,
        notificationType,
        subject,
        message,
        ctaText,
        ctaUrl,
        priority,
      };
      const response = await userStore.sendCompanyNotification(payload);
      confirmDialog.onClose();
      toast({
        title: "Notification sent",
        description: `${response?.data?.sentCount ?? response?.sentCount ?? 0} sent, ${response?.data?.failedCount ?? response?.failedCount ?? 0} failed.`,
        status: "success",
        position: "top-right",
        isClosable: true,
      });
    } catch (err: any) {
      toast({
        title: "Unable to send notification",
        description: getApiErrorMessage(err),
        status: "error",
        position: "top-right",
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <Alert status="error" borderRadius="2xl">
        <AlertIcon />
        <Box>
          <AlertTitle>Unauthorized</AlertTitle>
          <AlertDescription>Only Super Admin users can send company notifications.</AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <VStack spacing={5} align="stretch">
      <Box
        borderRadius="3xl"
        p={{ base: 3, md: 6 }}
        color={cardTextColor}
        shadow="base"
        overflow="hidden"
        position="relative"
        bg={heroBg}
        borderWidth="1px"
        borderColor={heroBorderColor}
      >
        {/* <Box
          position="absolute"
          top="-50px"
          right="-30px"
          w="180px"
          h="180px"
          borderRadius="full"
          bg={heroOrbBg}
          filter="blur(8px)"
        /> */}
        <HStack spacing={4} align="center" justify="space-between" flexWrap="wrap">
          <HStack spacing={4}>
            <Flex
              w="50px"
              h="50px"
              borderRadius="2xl"
              bg={useColorModeValue("whiteAlpha.900", "whiteAlpha.160")}
              color="blue.600"
              align="center"
              justify="center"
              boxShadow="0 12px 30px rgba(59, 130, 246, 0.14)"
            >
              <FiMail size={20} />
            </Flex>
            <Box>
              <Heading fontSize="2xl" fontWeight="bold">
                Notifications
              </Heading>
              <Text color={mutedText} fontSize="sm" mt={1}>
                Send polished, targeted updates with sharper filtering and live preview.
              </Text>
            </Box>
          </HStack>
          <HStack spacing={3} flexWrap="wrap">
            <Badge px={3} py={1.5} borderRadius="full" bg={chipBg} color={cardTextColor}>
              {stats.total} users
            </Badge>
            <Badge px={3} py={1.5} borderRadius="full" bg={chipBg} color={cardTextColor}>
              {recipientCount} recipients
            </Badge>
            <Badge px={3} py={1.5} borderRadius="full" bg={chipBg} color={cardTextColor}>
              {selectedCompany?.company_name || "No company selected"}
            </Badge>
          </HStack>
        </HStack>
      </Box>

      {/* <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        {[
          { label: "Company users", value: stats.total, icon: FiUsers, color: "blue" },
          { label: "Recipients", value: stats.selected, icon: FiCheckCircle, color: "green" },
          { label: "Pending courses", value: stats.pending, icon: FiBookOpen, color: "orange" },
          { label: "Expiring soon", value: stats.expiring, icon: FiClock, color: "red" },
        ].map((stat) => (
          <Card key={stat.label} borderRadius="2xl" border="1px solid" borderColor={borderColor} shadow="sm" bg={surfaceBg}>
            <CardBody>
              <HStack justify="space-between">
                <Box>
                  <Text fontSize="xs" color={mutedText} fontWeight="800" textTransform="uppercase">
                    {stat.label}
                  </Text>
                  <Text fontSize="2xl" fontWeight="900" mt={1}>
                    {stat.value}
                  </Text>
                </Box>
                <Flex w="42px" h="42px" borderRadius="xl" bg={`${stat.color}.50`} color={`${stat.color}.500`} align="center" justify="center">
                  <Icon as={stat.icon} boxSize={5} />
                </Flex>
              </HStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid> */}

      <Grid templateColumns={{ base: "1fr", xl: "280px minmax(0, 1fr) 380px" }} gap={5} alignItems="start">
        <Card bg={surfaceBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" shadow="sm">
          <CardBody>
            <HStack mb={4} justify="space-between">
              <HStack>
                <Icon as={FiFilter} color="blue.500" />
                <Heading size="sm">Filters</Heading>
              </HStack>
              <Button size="xs" variant="ghost" onClick={() => setFilters(defaultFilters)}>
                Reset
              </Button>
            </HStack>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="800" textTransform="uppercase" color={mutedText}>
                  Company
                </FormLabel>
                <Select
                  value={selectedCompanyId}
                  onChange={(event) => setSelectedCompanyId(event.target.value)}
                  bg={subtleBg}
                  color={cardTextColor}
                  borderColor={borderColor}
                  borderRadius="xl"
                  fontWeight="700"
                >
                  {companyOptions.map((entry: any) => (
                    <option key={entry._id} value={entry._id}>
                      {entry.company_name || entry.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Role</FormLabel>
                <Select size="sm" value={filters.role} onChange={(event) => updateFilter("role", event.target.value)}>
                  <option value="">All roles</option>
                  {(filterOptions.roles || []).map((role: string) => (
                    <option key={role} value={role}>
                      {formatLabel(role)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Department</FormLabel>
                <Select size="sm" value={filters.department} onChange={(event) => updateFilter("department", event.target.value)}>
                  <option value="">All departments</option>
                  {(filterOptions.departments || []).map((department: string) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Manager</FormLabel>
                <Select size="sm" value={filters.manager} onChange={(event) => updateFilter("manager", event.target.value)}>
                  <option value="">Any manager</option>
                  {(filterOptions.managers || []).map((manager: any) => (
                    <option key={manager.value} value={manager.value}>
                      {manager.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Account status</FormLabel>
                <Select size="sm" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
                  <option value="">Any status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Course status</FormLabel>
                <Select size="sm" value={filters.courseStatus} onChange={(event) => updateFilter("courseStatus", event.target.value)}>
                  <option value="">Any course status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="none">No courses</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Quiz status</FormLabel>
                <Select size="sm" value={filters.quizStatus} onChange={(event) => updateFilter("quizStatus", event.target.value)}>
                  <option value="">Any quiz status</option>
                  <option value="not_attempted">Not attempted</option>
                  <option value="needs_attention">Needs attention</option>
                  <option value="completed">Completed</option>
                </Select>
              </FormControl>
              <Divider />
              <VStack align="stretch" spacing={2}>
                {[
                  ["pendingCourses", "Has pending courses"],
                  ["completedCourses", "Has completed courses"],
                  ["courseExpiringSoon", "Course expiring soon"],
                  ["batchEndingSoon", "Batch ending soon"],
                  ["overdueCourses", "Overdue courses"],
                  ["notStarted", "Not started"],
                  ["inProgress", "In progress"],
                ].map(([key, label]) => (
                  <Checkbox
                    key={key}
                    size="sm"
                    isChecked={(filters as any)[key]}
                    onChange={(event) => updateFilter(key, event.target.checked)}
                  >
                    {label}
                  </Checkbox>
                ))}
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        <VStack spacing={5} align="stretch">
          <Card bg={surfaceBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" shadow="sm">
            <CardBody>
              <HStack justify="space-between" mb={4} align="start">
                <Box>
                  <Heading size="sm">Notification type</Heading>
                  <Text fontSize="sm" color={mutedText} mt={1}>
                    Pick a starting template, then fine-tune the content in the composer.
                  </Text>
                </Box>
                <Badge borderRadius="full" px={3} py={1} colorScheme="blue" variant="subtle">
                  {formatLabel(notificationType)}
                </Badge>
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                {notificationTypes.map((type) => {
                  const isSelected = notificationType === type.value;
                  return (
                    <Box
                      as="button"
                      key={type.value}
                      textAlign="left"
                      borderWidth="1px"
                      borderColor={isSelected ? `${type.tone}.300` : borderColor}
                      bg={isSelected ? `${type.tone}.50` : surfaceBg}
                      color={cardTextColor}
                      borderRadius="2xl"
                      p={4}
                      transition="all 0.2s ease"
                      _hover={{ transform: "translateY(-2px)", shadow: "md" }}
                      onClick={() => selectType(type.value)}
                    >
                      <HStack>
                        <Flex w="36px" h="36px" borderRadius="xl" bg={`${type.tone}.100`} color={`${type.tone}.600`} align="center" justify="center">
                          <Icon as={type.icon} />
                        </Flex>
                        <Text fontWeight="800" fontSize="sm">{type.label}</Text>
                      </HStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </CardBody>
          </Card>

          <Card bg={surfaceBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" shadow="sm">
            <CardBody>
              <Flex justify="space-between" gap={3} align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} mb={4}>
                <HStack
                  flex="1"
                  bg={searchBg}
                  borderRadius="xl"
                  px={3}
                  borderWidth="1px"
                  borderColor={searchBorderColor}
                  boxShadow="sm"
                >
                  <Icon as={FiSearch} color={mutedText} />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search users, email, role, department"
                    border="0"
                    bg="transparent"
                    _focusVisible={{ boxShadow: "none" }}
                  />
                </HStack>
                <HStack>
                  <Button size="sm" variant={recipientMode === "all" ? "solid" : "outline"} colorScheme="blue" onClick={() => setRecipientMode("all")}>
                    All filtered
                  </Button>
                  <Button size="sm" variant={recipientMode === "selected" ? "solid" : "outline"} colorScheme="teal" onClick={selectAllFiltered}>
                    Select visible
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearSelection}>
                    Clear
                  </Button>
                </HStack>
              </Flex>

              {isLoadingUsers ? (
                <Flex minH="220px" align="center" justify="center">
                  <Spinner color="blue.500" />
                </Flex>
              ) : filteredUsers.length === 0 ? (
                <Alert status="info" borderRadius="xl">
                  <AlertIcon />
                  <AlertDescription>No users match the current filters.</AlertDescription>
                </Alert>
              ) : (
                <VStack
                  spacing={3}
                  pt={2}
                  align="stretch"
                  maxH="530px"
                  overflowY="auto"
                  pr={2}
                  sx={{
                    scrollbarColor: `${scrollbarThumb} ${scrollbarTrack}`,
                    scrollbarWidth: "thin",
                    "&::-webkit-scrollbar": {
                      width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: scrollbarTrack,
                      borderRadius: "999px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: scrollbarThumb,
                      borderRadius: "999px",
                      border: "2px solid transparent",
                      backgroundClip: "padding-box",
                    },
                  }}
                >
                  {filteredUsers.map((user) => {
                    const signals = user.notificationSignals || {};
                    const checked = recipientMode === "all" || selectedUserIds.includes(user._id);
                    return (
                      <Box
                        key={user._id}
                        borderWidth="1px"
                        borderColor={checked ? "blue.300" : borderColor}
                        bg={checked ? selectedUserBg : surfaceBg}
                        borderRadius="2xl"
                        p={4}
                        transition="all 0.2s ease"
                        _hover={{ borderColor: "blue.300", shadow: "md", transform: "translateY(-1px)" }}
                      >
                        <HStack align="flex-start" spacing={3}>
                          <Checkbox
                            mt={1}
                            isChecked={checked}
                            isDisabled={recipientMode === "all"}
                            onChange={() => toggleUser(user._id)}
                          />
                          <Avatar size="sm" name={user.name} />
                          <Box flex="1" minW={0}>
                            <Flex justify="space-between" gap={3} align="start">
                              <Box minW={0}>
                                <Text fontWeight="800" noOfLines={1}>{user.name}</Text>
                                <Text fontSize="sm" color={mutedText} noOfLines={1}>{user.email}</Text>
                                {(user.designation || user.department) ? (
                                  <Text fontSize="xs" color={mutedText} mt={1} noOfLines={1}>
                                    {[user.designation, user.department].filter(Boolean).join(" • ")}
                                  </Text>
                                ) : null}
                              </Box>
                              <Badge colorScheme={user.status === "active" ? "green" : user.status === "pending" ? "yellow" : "gray"} borderRadius="full">
                                {formatLabel(user.status)}
                              </Badge>
                            </Flex>
                            <HStack spacing={2} mt={3} flexWrap="wrap">
                              <Tag size="sm">{formatLabel(user.role)}</Tag>
                              {user.department ? <Tag size="sm" colorScheme="blue">{user.department}</Tag> : null}
                              <Tag size="sm" colorScheme={signals.pendingCourses ? "orange" : "green"}>
                                {signals.pendingCourses || 0} pending
                              </Tag>
                              <Tag size="sm" colorScheme={signals.expiringCourses ? "red" : "gray"}>
                                {signals.expiringCourses || 0} expiring
                              </Tag>
                              <Tag size="sm" colorScheme={signals.quizStatus === "completed" ? "green" : "purple"}>
                                {formatLabel(signals.quizStatus || "no quiz")}
                              </Tag>
                            </HStack>
                          </Box>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </CardBody>
          </Card>
        </VStack>

        <VStack spacing={5} align="stretch" position={{ xl: "sticky" }} top={{ xl: "20px" }}>
          <Card bg={surfaceBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" shadow="sm">
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="sm">Composer</Heading>
                <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                  {recipientCount} recipients
                </Badge>
              </HStack>
                <Box borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={3} bg={subtleBg}>
                  <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={mutedText} fontWeight="800">
                    Target company
                  </Text>
                  <Text fontWeight="800" mt={0}>
                    {selectedCompany?.company_name || "Choose a company"}
                  </Text>
                </Box>
                {/* <Box borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={3} bg={subtleBg}>
                  <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={mutedText} fontWeight="800">
                    Delivery mode
                  </Text>
                  <Text fontWeight="800" mt={1}>
                    {recipientMode === "all" ? "All filtered users" : "Selected users only"}
                  </Text>
                </Box> */}
              <VStack mt={2} spacing={4} align="stretch">
                <FormControl>
                  <FormLabel fontSize="xs">Subject</FormLabel>
                  <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Message</FormLabel>
                  <Textarea minH="150px" resize="vertical" value={message} onChange={(event) => setMessage(event.target.value)} />
                </FormControl>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="xs">CTA text</FormLabel>
                    <Input value={ctaText} onChange={(event) => setCtaText(event.target.value)} placeholder="Open Course" />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs">Priority</FormLabel>
                    <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
                      <option>Normal</option>
                      <option>Important</option>
                      <option>Urgent</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel fontSize="xs">CTA URL</FormLabel>
                  <Input value={ctaUrl} onChange={(event) => setCtaUrl(event.target.value)} placeholder="https://example.com/course" />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={previewBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" shadow="sm" overflow="hidden">
            <Box p={4} bg={surfaceBg} borderBottomWidth="1px" borderColor={borderColor}>
              <HStack>
                <Icon as={FiEye} color="teal.500" />
                <Heading size="sm">Email preview</Heading>
              </HStack>
            </Box>
            <CardBody>
              <Box bg="white" color="gray.800" borderRadius="2xl" overflow="hidden" shadow="lg">
                <Box p={5} color="gray.800" bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
                  <HStack spacing={3}>
                    <Avatar size="sm" name={platformBrandName} bg="gray.200" color="gray.700" />
                    <Box>
                      <Text fontSize="xs" textTransform="uppercase" letterSpacing="1px" fontWeight="800" color="gray.500">
                        {priority} notification
                      </Text>
                      <Text fontWeight="900" fontSize="lg" lineHeight="1.25">{previewSubject || "Email subject"}</Text>
                      <Text fontSize="sm" color="gray.500" mt={1}>Sent by {platformBrandName}</Text>
                    </Box>
                  </HStack>
                </Box>
                <Box p={5}>
                  <Text mb={3}>Hi {sampleUser?.name || "Alex Learner"},</Text>
                  <Text whiteSpace="pre-wrap" color="gray.700" lineHeight="1.7">{previewMessage || "Your message preview will appear here."}</Text>
                  {ctaText && ctaUrl ? (
                    <Button mt={5} size="sm" borderRadius="full" colorScheme="blue">
                      {ctaText}
                    </Button>
                  ) : null}
                  <Text mt={6} color="gray.600">
                    Regards,<br />
                    <Text as="span" fontWeight="800">{selectedCompany?.company_name || "Company"} Team</Text>
                  </Text>
                </Box>
                <Box px={5} py={3} bg="gray.50" color="gray.500" fontSize="xs">
                  Sent by {platformBrandName} for {selectedCompany?.company_name || "this company"}.
                </Box>
              </Box>
              <Button mt={5} w="full" size="lg" borderRadius="xl" colorScheme="blue" leftIcon={<FiSend />} onClick={openConfirm} isDisabled={isLoadingUsers || recipientCount < 1}>
                Send notification
              </Button>
            </CardBody>
          </Card>
        </VStack>
      </Grid>

      <AlertDialog
        isOpen={confirmDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={confirmDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
        <AlertDialogContent borderRadius="3xl" overflow="hidden">
          <Box px={6} py={5} bg="blue.50" borderBottomWidth="1px" borderColor={borderColor}>
            <HStack>
              <Flex w="44px" h="44px" borderRadius="xl" bg="blue.100" color="blue.600" align="center" justify="center">
                <FiShield size={22} />
              </Flex>
              <Box>
                <AlertDialogHeader p={0}>Send notification?</AlertDialogHeader>
                <Text fontSize="sm" color={mutedText}>This email will be delivered to selected recipients.</Text>
              </Box>
            </HStack>
          </Box>
          <AlertDialogBody py={5}>
            <VStack align="stretch" spacing={2} fontSize="sm">
              <HStack justify="space-between"><Text color={mutedText}>Company</Text><Text fontWeight="800">{selectedCompany?.company_name}</Text></HStack>
              <HStack justify="space-between"><Text color={mutedText}>Type</Text><Text fontWeight="800">{formatLabel(notificationType)}</Text></HStack>
              <HStack justify="space-between"><Text color={mutedText}>Recipients</Text><Text fontWeight="800">{recipientCount}</Text></HStack>
              <HStack justify="space-between" align="start"><Text color={mutedText}>Subject</Text><Text fontWeight="800" textAlign="right">{previewSubject}</Text></HStack>
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter bg="gray.50" borderTopWidth="1px" borderColor={borderColor}>
            <Button ref={cancelRef} variant="ghost" onClick={confirmDialog.onClose}>
              Cancel
            </Button>
            <Button ml={3} colorScheme="blue" leftIcon={<FiSend />} onClick={sendNotification} isLoading={isSending}>
              Confirm send
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </VStack>
  );
});

export default NotificationWorkspace;
