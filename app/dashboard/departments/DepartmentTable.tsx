import axios from "axios";
import { departmentStore } from "@/app/store/departmentStore/departmentStore";
import stores from "@/app/store/stores";
import { AddIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  VStack
} from "@chakra-ui/react";
import { ChevronLeftIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { FiEdit2, FiHash, FiLayers, FiPlus, FiTrash2, FiUserCheck, FiUsers } from "react-icons/fi";
import AddDepartmentModal from "./AddDepartment";

type DepartmentTableProps = {
  companyId?: string;
  companyName?: string;
};

const DepartmentTable = ({ companyId, companyName }: DepartmentTableProps) => {
  const role = String(
    stores.auth.userType || stores.auth.user?.role || ""
  ).toLowerCase();

  const canManageDepartments = role === "superadmin" || role === "admin";

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isHeadOpen,
    onOpen: onHeadOpen,
    onClose: onHeadClose,
  } = useDisclosure();
  const {
    isOpen: isEmployeesOpen,
    onOpen: onEmployeesOpen,
    onClose: onEmployeesClose,
  } = useDisclosure();
  const {
    isOpen: isTeamsOpen,
    onOpen: onTeamsOpen,
    onClose: onTeamsClose,
  } = useDisclosure();

  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [headDept, setHeadDept] = useState<any>(null);
  const [departmentHeadId, setDepartmentHeadId] = useState("");
  const [headCandidates, setHeadCandidates] = useState<any[]>([]);
  const [isHeadCandidatesLoading, setIsHeadCandidatesLoading] = useState(false);
  const [employeesDept, setEmployeesDept] = useState<any>(null);
  const [departmentEmployees, setDepartmentEmployees] = useState<any[]>([]);
  const [departmentEmployeesPage, setDepartmentEmployeesPage] = useState(1);
  const [departmentEmployeesPagination, setDepartmentEmployeesPagination] = useState<any>({
    total: 0,
    totalPages: 1,
    page: 1,
  });
  const [isDepartmentEmployeesLoading, setIsDepartmentEmployeesLoading] = useState(false);
  const [teamsDept, setTeamsDept] = useState<any>(null);
  const [teamForm, setTeamForm] = useState({
    id: "",
    name: "",
    code: "",
    description: "",
  });

  const limit = 5;
  const employeesLimit = 20;

  const cardBg = useColorModeValue("white", "gray.800");
  const softBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const subtleBorderColor = useColorModeValue("gray.100", "gray.700");

  const headingColor = useColorModeValue("gray.900", "white");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedTextColor = useColorModeValue("gray.500", "gray.400");

  const headerBg = useColorModeValue("gray.800", "gray.900");
  const rowHoverBg = useColorModeValue("blue.50", "blue.900");
  const tableRowEvenBg = useColorModeValue("white", "gray.800");
  const tableRowOddBg = useColorModeValue("gray.50", "gray.700");

  const statTextColor = useColorModeValue("gray.500", "gray.400");
  const statNumberColor = useColorModeValue("blue.600", "blue.400");
  const statNumberPurple = useColorModeValue("purple.600", "purple.400");
  const statNumberOrange = useColorModeValue("orange.600", "orange.400");

  const emptyStateBg = useColorModeValue("gray.50", "gray.700");
  const emptyStateBorder = useColorModeValue("gray.200", "gray.600");
  const emptyStateText = useColorModeValue("gray.700", "gray.200");
  const emptyStateSubtext = useColorModeValue("gray.500", "gray.400");

  const errorBg = useColorModeValue("red.50", "red.900");
  const errorBorder = useColorModeValue("red.200", "red.700");
  const errorText = useColorModeValue("red.600", "red.300");

  const modalBg = useColorModeValue("white", "gray.800");
  const modalCloseBtnColor = useColorModeValue("gray.500", "gray.400");
  const modalDeleteBg = useColorModeValue("red.50", "red.900");
  const modalDeleteColor = useColorModeValue("red.500", "red.400");
  const modalTextColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    if (companyId) {
      departmentStore
        .fetchDepartments(companyId, page, limit)
        .catch(() => undefined);
    }
  }, [companyId, page]);

  const normalizeRole = (value: unknown) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^department[-\s]?head$/i, "departmenthead")
      .replace(/^l\s*(\d+)\s*manager$/i, "l$1-manager")
      .replace(/\s+/g, "-");

  const formatRoleLabel = (value: unknown) => {
    const normalized = normalizeRole(value);
    if (!normalized || normalized === "user") return "Employee";
    if (normalized === "departmenthead") return "Department Head";

    return normalized
      .split("-")
      .map((part) =>
        part.startsWith("l") && /\d+/.test(part.slice(1))
          ? part.toUpperCase()
          : `${part.charAt(0).toUpperCase()}${part.slice(1)}`
      )
      .join(" ");
  };

  const getHeadName = (dept: any) => dept?.departmentHead?.name || "No head assigned";
  const getHeadEmail = (dept: any) => dept?.departmentHead?.email || dept?.departmentHead?.username || "";

  const totalPages = Math.max(
    1,
    Math.ceil((departmentStore.pagination?.total || 0) / limit)
  );

  const stats = {
    total: departmentStore.pagination?.total || 0,
    currentPage: departmentStore.departments.length,
    totalPages,
  };

  const handleEdit = (dept: any) => {
    setSelectedDept(dept);
    onOpen();
  };

  const handleCreate = () => {
    setSelectedDept(null);
    onOpen();
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    onDeleteOpen();
  };

  const fetchHeadCandidates = async () => {
    if (!companyId) return;

    setIsHeadCandidatesLoading(true);
    try {
      const { data } = await axios.get("/admin/users", {
        params: {
          companyId,
          page: 1,
          limit: 100,
        },
      });
      const users = data?.data?.users || [];
      setHeadCandidates(
        users.filter(
          (user: any) => !["admin", "superadmin"].includes(normalizeRole(user.role || user.userType))
        )
      );
    } catch {
      setHeadCandidates([]);
    } finally {
      setIsHeadCandidatesLoading(false);
    }
  };

  const handleAssignHeadClick = (dept: any) => {
    setHeadDept(dept);
    setDepartmentHeadId(String(dept?.departmentHead?._id || ""));
    setHeadCandidates([]);
    onHeadOpen();
    fetchHeadCandidates().catch(() => undefined);
  };

  const confirmAssignHead = async () => {
    if (!headDept?._id || !companyId) return;

    await departmentStore.assignDepartmentHead(headDept._id, {
      departmentHeadId,
    });
    await departmentStore.fetchDepartments(companyId, page, limit);
    setHeadDept(null);
    setDepartmentHeadId("");
    onHeadClose();
  };

  const fetchDepartmentEmployees = async (dept: any, nextPage = 1) => {
    if (!companyId || !dept?.departmentName) return;

    setIsDepartmentEmployeesLoading(true);
    try {
      const { data } = await axios.get("/admin/users", {
        params: {
          companyId,
          department: dept.departmentName,
          page: nextPage,
          limit: employeesLimit,
        },
      });
      setDepartmentEmployees(data?.data?.users || []);
      setDepartmentEmployeesPagination({
        total: data?.data?.total || 0,
        totalPages: data?.data?.totalPages || 1,
        page: data?.data?.page || nextPage,
      });
      setDepartmentEmployeesPage(nextPage);
    } catch {
      setDepartmentEmployees([]);
      setDepartmentEmployeesPagination({ total: 0, totalPages: 1, page: nextPage });
    } finally {
      setIsDepartmentEmployeesLoading(false);
    }
  };

  const handleViewEmployees = (dept: any) => {
    setEmployeesDept(dept);
    setDepartmentEmployees([]);
    setDepartmentEmployeesPage(1);
    onEmployeesOpen();
    fetchDepartmentEmployees(dept, 1).catch(() => undefined);
  };

  const resetTeamForm = () =>
    setTeamForm({
      id: "",
      name: "",
      code: "",
      description: "",
    });

  const getDepartmentTeams = (dept: any) =>
    Array.isArray(dept?.teams) ? dept.teams : [];

  const handleManageTeams = (dept: any) => {
    setTeamsDept(dept);
    resetTeamForm();
    onTeamsOpen();
  };

  const handleEditTeam = (team: any) => {
    setTeamForm({
      id: String(team?._id || ""),
      name: team?.name || "",
      code: team?.code || "",
      description: team?.description || "",
    });
  };

  const handleSaveTeam = async () => {
    if (!teamsDept?._id || !teamForm.name.trim()) return;

    try {
      const payload = {
        name: teamForm.name.trim(),
        code: teamForm.code.trim(),
        description: teamForm.description.trim(),
      };
      const response = teamForm.id
        ? await departmentStore.updateDepartmentTeam(teamsDept._id, teamForm.id, payload)
        : await departmentStore.addDepartmentTeam(teamsDept._id, payload);

      setTeamsDept(response?.data || teamsDept);
      resetTeamForm();
    } catch {}
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!teamsDept?._id || !teamId) return;

    try {
      const response = await departmentStore.deleteDepartmentTeam(teamsDept._id, teamId);
      setTeamsDept(response?.data || teamsDept);
      resetTeamForm();
    } catch {}
  };

  const handleSaved = async (mode: "create" | "update") => {
    if (!companyId) return;

    if (mode === "create" && page !== 1) {
      setPage(1);
      return;
    }

    await departmentStore.fetchDepartments(companyId, page, limit);
  };

  const confirmDelete = async () => {
    if (!deleteId || !companyId) return;

    const moveToPreviousPage =
      page > 1 && departmentStore.departments.length === 1;

    try {
      await departmentStore.deleteDepartment(deleteId);
      setDeleteId(null);
      onDeleteClose();

      if (moveToPreviousPage) {
        setPage((currentPage) => currentPage - 1);
        return;
      }

      await departmentStore.fetchDepartments(companyId, page, limit);
    } catch {}
  };

  const DepartmentAvatar = ({
    name,
    index,
    size = "md",
  }: {
    name?: string;
    index: number;
    size?: "sm" | "md";
  }) => {
    const colors = ["blue", "purple", "green", "orange", "pink"];
    const color = colors[index % colors.length];

    return (
      <Box
        w={size === "sm" ? 8 : 9}
        h={size === "sm" ? 8 : 9}
        rounded="xl"
        bgGradient={`linear(to-br, ${color}.400, ${color}.600)`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="white"
        fontWeight="800"
        flexShrink={0}
      >
        {name?.charAt(0).toUpperCase() || "D"}
      </Box>
    );
  };

  const DepartmentActions = ({ dept }: { dept: any }) => {
    if (!canManageDepartments) return null;

    return (
      <HStack spacing={1} justify="flex-end">
        <Tooltip label="Manage teams" hasArrow>
          <IconButton
            aria-label="Manage teams"
            icon={<Icon as={FiLayers} />}
            size="sm"
            variant="ghost"
            colorScheme="purple"
            onClick={() => handleManageTeams(dept)}
          />
        </Tooltip>

        <Tooltip label="Edit department" hasArrow>
          <IconButton
            aria-label="Edit department"
            icon={<Icon as={FiEdit2} />}
            size="sm"
            variant="ghost"
            colorScheme="blue"
            onClick={() => handleEdit(dept)}
          />
        </Tooltip>

        <Tooltip label="Assign department head" hasArrow>
          <IconButton
            aria-label="Assign department head"
            icon={<Icon as={FiUserCheck} />}
            size="sm"
            variant="ghost"
            colorScheme="green"
            onClick={() => handleAssignHeadClick(dept)}
          />
        </Tooltip>

        <Tooltip label="Delete department" hasArrow>
          <IconButton
            aria-label="Delete department"
            icon={<Icon as={FiTrash2} />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={() => handleDeleteClick(dept._id)}
          />
        </Tooltip>
      </HStack>
    );
  };

  const StatsCards = () => {
    if (!companyId || departmentStore.departments.length === 0) return null;

    return (
      <SimpleGrid
        columns={{ base: 3, md: 3 }}
        spacing={{ base: 2, md: 4 }}
        mb={{ base: 4, md: 6 }}
      >
        <Box
          bg={cardBg}
          p={{ base: 3, md: 4 }}
          rounded={{ base: "xl", md: "2xl" }}
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <Stat>
            <StatLabel color={statTextColor} fontSize={{ base: "2xs", md: "sm" }}>
              Total
            </StatLabel>
            <StatNumber
              fontSize={{ base: "lg", md: "2xl" }}
              fontWeight="800"
              color={statNumberColor}
            >
              {stats.total}
            </StatNumber>
            <StatHelpText
              display={{ base: "none", md: "block" }}
              fontSize="xs"
              color={statTextColor}
              mb={0}
            >
              Across organization
            </StatHelpText>
          </Stat>
        </Box>

        <Box
          bg={cardBg}
          p={{ base: 3, md: 4 }}
          rounded={{ base: "xl", md: "2xl" }}
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <Stat>
            <StatLabel color={statTextColor} fontSize={{ base: "2xs", md: "sm" }}>
              Showing
            </StatLabel>
            <StatNumber
              fontSize={{ base: "lg", md: "2xl" }}
              fontWeight="800"
              color={statNumberPurple}
            >
              {stats.currentPage}
            </StatNumber>
            <StatHelpText
              display={{ base: "none", md: "block" }}
              fontSize="xs"
              color={statTextColor}
              mb={0}
            >
              Current page
            </StatHelpText>
          </Stat>
        </Box>

        <Box
          bg={cardBg}
          p={{ base: 3, md: 4 }}
          rounded={{ base: "xl", md: "2xl" }}
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <Stat>
            <StatLabel color={statTextColor} fontSize={{ base: "2xs", md: "sm" }}>
              Page
            </StatLabel>
            <StatNumber
              fontSize={{ base: "lg", md: "2xl" }}
              fontWeight="800"
              color={statNumberOrange}
            >
              {page}/{stats.totalPages}
            </StatNumber>
            <StatHelpText
              display={{ base: "none", md: "block" }}
              fontSize="xs"
              color={statTextColor}
              mb={0}
            >
              Navigation
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>
    );
  };

  const DesktopTable = () => (
    <Box display={{ base: "none", md: "block" }} overflow="hidden" rounded="xl">
      <Table variant="simple" size="md">
        <Thead bg={headerBg}>
          <Tr>
            <Th color="white" fontSize="sm">
              Department Name
            </Th>
            <Th color="white" fontSize="sm">
              Code
            </Th>
            <Th color="white" fontSize="sm">
              Teams
            </Th>
            <Th color="white" fontSize="sm">
              Department Head
            </Th>
            <Th color="white" fontSize="sm">
              Employees
            </Th>
            {canManageDepartments ? (
              <Th textAlign="right" color="white" fontSize="sm">
                Actions
              </Th>
            ) : null}
          </Tr>
        </Thead>

        <Tbody>
          {departmentStore.departments.map((dept, index) => (
            <Tr
              key={dept._id}
              bg={index % 2 === 0 ? tableRowEvenBg : tableRowOddBg}
              _hover={{ bg: rowHoverBg }}
              transition="background 0.2s"
            >
              <Td>
                <HStack spacing={3}>
                  <DepartmentAvatar name={dept.departmentName} index={index} />

                  <Text fontWeight="700" fontSize="md" color={textColor}>
                    {dept.departmentName}
                  </Text>
                </HStack>
              </Td>

              <Td>
                <Badge
                  variant="subtle"
                  colorScheme="purple"
                  rounded="full"
                  px={3}
                  py={1.5}
                  fontSize="sm"
                  fontWeight="600"
                >
                  <HStack spacing={1}>
                    <Icon as={FiHash} boxSize={3} />
                    <Text>{dept.code}</Text>
                  </HStack>
                </Badge>
              </Td>

              <Td>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="purple"
                  leftIcon={<Icon as={FiLayers} />}
                  onClick={() => handleManageTeams(dept)}
                >
                  {dept.teamCount ?? getDepartmentTeams(dept).length}
                </Button>
              </Td>

              <Td>
                <VStack align="start" spacing={0.5}>
                  <Text fontWeight="700" color={textColor}>
                    {getHeadName(dept)}
                  </Text>
                  <Text fontSize="xs" color={mutedTextColor}>
                    {getHeadEmail(dept) || "Assign a head"}
                  </Text>
                </VStack>
              </Td>

              <Td>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  leftIcon={<Icon as={FiUsers} />}
                  onClick={() => handleViewEmployees(dept)}
                >
                  {dept.employeeCount || 0}
                </Button>
                <Text mt={1} fontSize="xs" color={mutedTextColor}>
                  {dept.activeEmployeeCount || 0} active - {dept.managerCount || 0} managers
                </Text>
              </Td>

              {canManageDepartments ? (
                <Td>
                  <DepartmentActions dept={dept} />
                </Td>
              ) : null}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );

  const MobileCards = () => (
    <VStack display={{ base: "flex", md: "none" }} spacing={3} align="stretch">
      {departmentStore.departments.map((dept, index) => (
        <Box
          key={dept._id}
          bg={softBg}
          borderWidth="1px"
          borderColor={subtleBorderColor}
          rounded="2xl"
          p={3}
        >
          <Flex align="flex-start" gap={3}>
            <DepartmentAvatar name={dept.departmentName} index={index} size="sm" />

            <Box minW={0} flex="1">
              <Text
                fontSize="sm"
                fontWeight="800"
                color={textColor}
                lineHeight="1.25"
                noOfLines={2}
              >
                {dept.departmentName}
              </Text>

              <Badge
                mt={2}
                variant="subtle"
                colorScheme="purple"
                rounded="full"
                px={2.5}
                py={1}
                fontSize="xs"
                fontWeight="700"
              >
                <HStack spacing={1}>
                  <Icon as={FiHash} boxSize={3} />
                  <Text>{dept.code}</Text>
                </HStack>
              </Badge>

              <Text mt={2} fontSize="xs" color={mutedTextColor} noOfLines={1}>
                Head: {getHeadName(dept)}
              </Text>
              <HStack mt={2} spacing={2} flexWrap="wrap">
                <Badge colorScheme="blue" borderRadius="full">
                  {dept.employeeCount || 0} employees
                </Badge>
                <Badge colorScheme="green" borderRadius="full">
                  {dept.activeEmployeeCount || 0} active
                </Badge>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="purple"
                  leftIcon={<Icon as={FiLayers} />}
                  onClick={() => handleManageTeams(dept)}
                >
                  {dept.teamCount ?? getDepartmentTeams(dept).length} teams
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="blue"
                  leftIcon={<Icon as={FiUsers} />}
                  onClick={() => handleViewEmployees(dept)}
                >
                  View
                </Button>
              </HStack>
            </Box>

            <DepartmentActions dept={dept} />
          </Flex>
        </Box>
      ))}
    </VStack>
  );

  const Pagination = () => (
    <Flex
      align={{ base: "stretch", sm: "center" }}
      justify="space-between"
      mt={{ base: 4, md: 6 }}
      pt={{ base: 4, md: 5 }}
      borderTopWidth="1px"
      borderColor={borderColor}
      gap={3}
      direction={{ base: "column", sm: "row" }}
    >
      <Text
        fontSize={{ base: "xs", md: "sm" }}
        color={mutedTextColor}
        textAlign={{ base: "center", sm: "left" }}
      >
        Page {page} of {totalPages} • {departmentStore.pagination?.total || 0} total
      </Text>

      <HStack spacing={2} justify={{ base: "center", sm: "flex-end" }}>
        <Button
          size={{ base: "sm", md: "sm" }}
          onClick={() => setPage((p) => p - 1)}
          isDisabled={page === 1}
          leftIcon={<ChevronLeftIcon size={16} />}
          variant="outline"
          colorScheme="blue"
          flex={{ base: 1, sm: "initial" }}
        >
          Prev
        </Button>

        <HStack spacing={1} display={{ base: "none", sm: "flex" }}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;

            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                size="sm"
                variant={page === pageNum ? "solid" : "outline"}
                colorScheme="blue"
                onClick={() => setPage(pageNum)}
                minW="34px"
              >
                {pageNum}
              </Button>
            );
          })}
        </HStack>

        <Button
          size={{ base: "sm", md: "sm" }}
          onClick={() => setPage((p) => p + 1)}
          isDisabled={page >= totalPages}
          rightIcon={<ChevronRightIcon />}
          variant="outline"
          colorScheme="blue"
          flex={{ base: 1, sm: "initial" }}
        >
          Next
        </Button>
      </HStack>
    </Flex>
  );

  return (
    <Box>
      <StatsCards />

      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        rounded={{ base: "2xl", md: "3xl" }}
        overflow="hidden"
        shadow="sm"
        position="relative"
      >
        <Box
          h="1"
          bgGradient="linear(to-r, blue.400, purple.500, pink.400)"
          position="absolute"
          top="0"
          left="0"
          right="0"
        />

        <Box p={{ base: 4, md: 6 }}>
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
            justify="space-between"
            gap={{ base: 3, md: 4 }}
            mb={{ base: 4, md: 6 }}
          >
            <HStack spacing={3} align="flex-start">
              <Box
                p={{ base: 2, md: 2.5 }}
                rounded="xl"
                bgGradient="linear(to-br, blue.500, purple.600)"
                color="white"
                flexShrink={0}
              >
                <Icon as={FiHash} boxSize={{ base: 4, md: 5 }} />
              </Box>

              <Box minW={0}>
                <Text
                  fontSize={{ base: "lg", md: "2xl" }}
                  fontWeight="800"
                  color={headingColor}
                  lineHeight="1.2"
                >
                  Departments
                </Text>

                <Text
                  fontSize={{ base: "xs", md: "sm" }}
                  color={mutedTextColor}
                  mt={1}
                  noOfLines={{ base: 2, md: 1 }}
                >
                  {companyName
                    ? `${canManageDepartments ? "Manage" : "View"} departments for ${companyName}`
                    : `Select a company to ${
                        canManageDepartments ? "view and manage" : "view"
                      } departments`}
                </Text>
              </Box>
            </HStack>

            <Tooltip
              label={
                !companyId
                  ? "Please select a company first"
                  : !canManageDepartments
                    ? "Only Admins and Super Admins can manage departments"
                    : "Add new department"
              }
              hasArrow
            >
              <Button
                leftIcon={<Icon as={FiPlus} />}
                colorScheme="blue"
                size={{ base: "sm", md: "md" }}
                width={{ base: "100%", md: "auto" }}
                onClick={handleCreate}
                isDisabled={!companyId || !canManageDepartments}
                rounded="full"
                bgGradient="linear(to-r, blue.500, purple.600)"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, blue.600, purple.700)",
                }}
              >
                Add Department
              </Button>
            </Tooltip>
          </Flex>

          {departmentStore.isLoading ? (
            <Flex justify="center" py={{ base: 10, md: 16 }}>
              <Spinner size={{ base: "md", md: "xl" }} color="blue.500" />
            </Flex>
          ) : departmentStore.error ? (
            <Box
              p={{ base: 3, md: 4 }}
              bg={errorBg}
              rounded="xl"
              borderWidth="1px"
              borderColor={errorBorder}
            >
              <Text
                color={errorText}
                textAlign="center"
                fontSize={{ base: "sm", md: "md" }}
              >
                {departmentStore.error}
              </Text>
            </Box>
          ) : departmentStore.departments.length === 0 ? (
            <Box
              p={{ base: 6, md: 12 }}
              textAlign="center"
              bg={emptyStateBg}
              rounded="2xl"
              borderWidth="1px"
              borderColor={emptyStateBorder}
              borderStyle="dashed"
            >
              <Icon as={FiHash} boxSize={{ base: 8, md: 12 }} color={statTextColor} mb={3} />

              <Text
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="800"
                color={emptyStateText}
              >
                No departments found
              </Text>

              <Text
                fontSize={{ base: "xs", md: "sm" }}
                color={emptyStateSubtext}
                mt={2}
              >
                {companyName
                  ? `No departments have been created for ${companyName} yet.`
                  : "Please select a company to view its departments."}
              </Text>

              {companyId && canManageDepartments ? (
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  size="sm"
                  mt={4}
                  rounded="full"
                  onClick={handleCreate}
                >
                  Create department
                </Button>
              ) : null}
            </Box>
          ) : (
            <>
              <MobileCards />
              <DesktopTable />
              <Pagination />
            </>
          )}
        </Box>
      </Box>

      <AddDepartmentModal
        isOpen={isOpen}
        onClose={() => {
          setSelectedDept(null);
          onClose();
        }}
        initialData={selectedDept}
        companyId={companyId}
        companyName={companyName}
        onSaved={handleSaved}
      />

      <Modal
        isOpen={isHeadOpen}
        onClose={() => {
          setHeadDept(null);
          setDepartmentHeadId("");
          onHeadClose();
        }}
        isCentered
        size={{ base: "xs", md: "lg" }}
      >
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent mx={4} rounded="2xl" bg={modalBg}>
          <ModalHeader>Assign Department Head</ModalHeader>
          <ModalCloseButton color={modalCloseBtnColor} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="sm" color={mutedTextColor}>
                  Department
                </Text>
                <Text fontWeight="800" color={headingColor}>
                  {headDept?.departmentName || "--"}
                </Text>
              </Box>

              <Box>
                <Text mb={2} fontSize="sm" fontWeight="700">
                  Department Head
                </Text>
                <Select
                  value={departmentHeadId}
                  onChange={(event) => setDepartmentHeadId(event.target.value)}
                  placeholder={isHeadCandidatesLoading ? "Loading employees..." : "No department head"}
                  isDisabled={isHeadCandidatesLoading}
                >
                  <option value="">No department head</option>
                  {headCandidates.map((user: any) => (
                    <option key={user._id} value={user._id}>
                      {user.name || user.email || user.username} - {user.email || user.username} ({formatRoleLabel(user.role || user.userType)})
                    </option>
                  ))}
                </Select>
              </Box>

              <Box p={3} borderRadius="xl" bg={softBg} borderWidth="1px" borderColor={subtleBorderColor}>
                <Text fontSize="xs" color={mutedTextColor}>
                  The selected employee or manager will be promoted to Department Head and scoped to this department.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button
              variant="ghost"
              onClick={() => {
                setHeadDept(null);
                setDepartmentHeadId("");
                onHeadClose();
              }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={confirmAssignHead}
              isLoading={departmentStore.isSubmitting}
              leftIcon={<Icon as={FiUserCheck} />}
            >
              Save Head
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Drawer
        isOpen={isTeamsOpen}
        placement="right"
        size="lg"
        onClose={() => {
          setTeamsDept(null);
          resetTeamForm();
          onTeamsClose();
        }}
      >
        <DrawerOverlay backdropFilter="blur(8px)" bg="blackAlpha.300" />
        <DrawerContent bg={modalBg} borderLeftRadius={{ base: "none", md: "2xl" }} shadow="2xl">
          <DrawerCloseButton color={modalCloseBtnColor} top={4} right={4} />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} pr={12}>
            <VStack align="start" spacing={1}>
              <Text>Teams in {teamsDept?.departmentName || "Department"}</Text>
              <Text fontSize="sm" fontWeight="500" color={mutedTextColor}>
                Optional teams inside this department
              </Text>
            </VStack>
          </DrawerHeader>

          <DrawerBody py={5}>
            <VStack align="stretch" spacing={5}>
              {canManageDepartments ? (
                <Box p={4} borderWidth="1px" borderColor={borderColor} borderRadius="xl" bg={softBg}>
                  <Text fontWeight="800" color={textColor} mb={3}>
                    {teamForm.id ? "Edit team" : "Add team"}
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">Team Name</FormLabel>
                      <Input
                        value={teamForm.name}
                        placeholder="Fullstack Team"
                        onChange={(event) =>
                          setTeamForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Code</FormLabel>
                      <Input
                        value={teamForm.code}
                        placeholder="FS"
                        onChange={(event) =>
                          setTeamForm((prev) => ({ ...prev, code: event.target.value }))
                        }
                      />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl mt={3}>
                    <FormLabel fontSize="sm">Description</FormLabel>
                    <Textarea
                      value={teamForm.description}
                      placeholder="Optional team description"
                      rows={3}
                      onChange={(event) =>
                        setTeamForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </FormControl>
                  <HStack mt={4} justify="flex-end">
                    <Button size="sm" variant="ghost" onClick={resetTeamForm}>
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="purple"
                      leftIcon={<Icon as={FiPlus} />}
                      isDisabled={!teamForm.name.trim()}
                      isLoading={departmentStore.isSubmitting}
                      onClick={handleSaveTeam}
                    >
                      {teamForm.id ? "Update Team" : "Add Team"}
                    </Button>
                  </HStack>
                </Box>
              ) : null}

              {getDepartmentTeams(teamsDept).length === 0 ? (
                <Box p={6} textAlign="center" bg={emptyStateBg} borderRadius="xl">
                  <Text fontWeight="700">No teams added yet.</Text>
                  <Text mt={1} fontSize="sm" color={mutedTextColor}>
                    Teams are optional. Add them only where a department needs smaller groups.
                  </Text>
                </Box>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {getDepartmentTeams(teamsDept).map((team: any) => (
                    <Box
                      key={team._id}
                      p={4}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="xl"
                      bg={cardBg}
                    >
                      <Flex justify="space-between" gap={3} align="flex-start">
                        <Box minW={0}>
                          <HStack spacing={2} flexWrap="wrap">
                            <Text fontWeight="800" color={textColor}>
                              {team.name}
                            </Text>
                            {team.code ? (
                              <Badge colorScheme="purple" borderRadius="full">
                                {team.code}
                              </Badge>
                            ) : null}
                            {team.isActive === false ? (
                              <Badge colorScheme="orange" borderRadius="full">
                                Inactive
                              </Badge>
                            ) : null}
                          </HStack>
                          {team.description ? (
                            <Text mt={1} fontSize="sm" color={mutedTextColor}>
                              {team.description}
                            </Text>
                          ) : null}
                        </Box>

                        {canManageDepartments ? (
                          <HStack spacing={1}>
                            <IconButton
                              aria-label="Edit team"
                              icon={<Icon as={FiEdit2} />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => handleEditTeam(team)}
                            />
                            <IconButton
                              aria-label="Delete team"
                              icon={<Icon as={FiTrash2} />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              isLoading={departmentStore.isSubmitting}
                              onClick={() => handleDeleteTeam(String(team._id || ""))}
                            />
                          </HStack>
                        ) : null}
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Drawer
        isOpen={isEmployeesOpen}
        placement="right"
        size="xl"
        onClose={() => {
          setEmployeesDept(null);
          setDepartmentEmployees([]);
          onEmployeesClose();
        }}
      >
        <DrawerOverlay backdropFilter="blur(8px)" bg="blackAlpha.300" />
        <DrawerContent bg={modalBg} borderLeftRadius={{ base: "none", md: "2xl" }} shadow="2xl">
          <DrawerCloseButton color={modalCloseBtnColor} top={4} right={4} />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} pr={12}>
            <VStack align="start" spacing={1}>
              <Text>Employees in {employeesDept?.departmentName || "Department"}</Text>
              <Text fontSize="sm" fontWeight="500" color={mutedTextColor}>
                {departmentEmployeesPagination.total || 0} employees found
              </Text>
            </VStack>
          </DrawerHeader>
          <DrawerBody py={5}>
            {isDepartmentEmployeesLoading ? (
              <Flex justify="center" py={10}>
                <Spinner color="blue.500" />
              </Flex>
            ) : departmentEmployees.length === 0 ? (
              <Box p={6} textAlign="center" bg={emptyStateBg} borderRadius="xl">
                <Text fontWeight="700">No employees found in this department.</Text>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table size="sm">
                  <Thead bg={headerBg}>
                    <Tr>
                      <Th color="white">Employee</Th>
                      <Th color="white">Role</Th>
                      <Th color="white">Team</Th>
                      <Th color="white">Office Location</Th>
                      <Th color="white">Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {departmentEmployees.map((user: any) => (
                      <Tr key={user._id}>
                        <Td>
                          <VStack align="start" spacing={0.5}>
                            <Text fontWeight="700">{user.name || "--"}</Text>
                            <Text fontSize="xs" color={mutedTextColor}>
                              {user.email || user.username || "--"}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>{formatRoleLabel(user.role || user.userType)}</Td>
                        <Td>{user.team || "--"}</Td>
                        <Td>
                          {user.officeLocationName ||
                            user.officeLocation?.name ||
                            [user.city, user.state].filter(Boolean).join(", ") ||
                            "--"}
                        </Td>
                        <Td>
                          <Badge colorScheme={user.status === "ACTIVE" ? "green" : user.status === "INACTIVE" ? "red" : "orange"}>
                            {user.status || "Pending"}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" borderColor={borderColor} justifyContent="space-between" gap={3}>
            <Text fontSize="sm" color={mutedTextColor}>
              Page {departmentEmployeesPage} of {departmentEmployeesPagination.totalPages || 1}
            </Text>
            <HStack>
              <Button
                size="sm"
                variant="outline"
                isDisabled={departmentEmployeesPage <= 1 || isDepartmentEmployeesLoading}
                onClick={() => fetchDepartmentEmployees(employeesDept, departmentEmployeesPage - 1)}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                isDisabled={
                  departmentEmployeesPage >= (departmentEmployeesPagination.totalPages || 1) ||
                  isDepartmentEmployeesLoading
                }
                onClick={() => fetchDepartmentEmployees(employeesDept, departmentEmployeesPage + 1)}
              >
                Next
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Modal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        isCentered
        size={{ base: "xs", md: "md" }}
      >
        <ModalOverlay backdropFilter="blur(10px)" />

        <ModalContent mx={4} rounded="2xl" bg={modalBg}>
          <ModalHeader
            fontSize={{ base: "lg", md: "xl" }}
            bgGradient="linear(to-r, red.500, pink.500)"
            bgClip="text"
          >
            Delete Department
          </ModalHeader>

          <ModalCloseButton color={modalCloseBtnColor} />

          <ModalBody>
            <Flex align="center" justify="center" direction="column" py={4}>
              <Box
                p={4}
                rounded="full"
                bg={modalDeleteBg}
                color={modalDeleteColor}
                mb={4}
              >
                <Icon as={FiTrash2} boxSize={{ base: 6, md: 8 }} />
              </Box>

              <Text
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="800"
                textAlign="center"
                color={headingColor}
              >
                Are you sure you want to delete this department?
              </Text>

              <Text
                fontSize={{ base: "xs", md: "sm" }}
                color={modalTextColor}
                mt={2}
                textAlign="center"
              >
                This action cannot be undone. All related data will be permanently
                removed.
              </Text>
            </Flex>
          </ModalBody>

          <ModalFooter
            gap={3}
            flexDirection={{ base: "column-reverse", sm: "row" }}
          >
            <Button
              variant="ghost"
              onClick={onDeleteClose}
              width={{ base: "100%", sm: "auto" }}
            >
              Cancel
            </Button>

            <Button
              colorScheme="red"
              onClick={confirmDelete}
              isLoading={departmentStore.isSubmitting}
              leftIcon={<Icon as={FiTrash2} />}
              width={{ base: "100%", sm: "auto" }}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default observer(DepartmentTable);
