"use client";

import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  ModalBody,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import DashboardDrawer from "@/app/component/common/Drawer/DashboardDrawer";
import stores from "@/app/store/stores";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import EmployeePolicyTab from "./EmployeePolicyTab";

const getUserStatusMeta = (user: any) => {
  if (user?.status === "INACTIVE" || user?.isEnabled === false || user?.is_enabled === false) {
    return { label: "Inactive", colorScheme: "red" };
  }

  if (user?.status === "ACTIVE") {
    return { label: "Active", colorScheme: "green" };
  }

  return { label: "Pending", colorScheme: "orange" };
};

const DetailCard = ({ label, value }: { label: string; value?: string | null }) => {
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Box p={4} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor="blackAlpha.100">
      <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={muted} fontWeight="700" mb={1.5}>
        {label}
      </Text>
      <Text fontWeight="600" noOfLines={2}>
        {value || "--"}
      </Text>
    </Box>
  );
};

const getOfficeLocationDisplay = (user: any) =>
  user?.officeLocationName ||
  user?.officeLocation?.name ||
  [user?.city, user?.state].filter(Boolean).join(", ");

const formatHistoryDate = (value: unknown) => {
  if (!value) return "Present";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime())
    ? "--"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const UserDetailsModal = ({
  isOpen,
  onClose,
  user,
  formatRoleLabel,
  canEditReportingManager = false,
  onEditReportingManager,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  formatRoleLabel: (_role: string) => string;
  canEditReportingManager?: boolean;
  onEditReportingManager?: (_user: any) => void;
}) => {
  const { userStore } = stores;
  const muted = useColorModeValue("gray.600", "gray.400");
  const sectionBg = useColorModeValue("white", "gray.900");
  const statusMeta = getUserStatusMeta(user);
  const isWorkforceEmployee = /^(user|manager|departmenthead|department head|department-head|l\d+[-\s]?manager)$/i.test(
    String(user?.role || "")
  );

  useEffect(() => {
    if (isOpen && user?._id) {
      userStore
        .fetchEmployeeAssignmentHistory(String(user._id))
        .catch(() => undefined);
      return;
    }

    userStore.clearEmployeeAssignmentHistory();
  }, [isOpen, user?._id, userStore]);

  return (
    <DashboardDrawer
      isOpen={isOpen}
      onClose={onClose}
      titlePrefix={user?.name || "Employee details"}
      subtitle={user?.username || "No email available"}
      badgeContent={
        <HStack spacing={2} flexWrap="wrap">
          <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
            {formatRoleLabel(user?.role || "user")}
          </Badge>
          <Badge colorScheme={statusMeta.colorScheme} borderRadius="full" px={3} py={1}>
            {statusMeta.label}
          </Badge>
          <Badge
            colorScheme={user?.passwordStatus === "SET" ? "green" : "orange"}
            borderRadius="full"
            px={3}
            py={1}
          >
            {user?.passwordStatus === "SET" ? "Password" : "Setup Pending"}
          </Badge>
        </HStack>
      }
    >
      <Box pb={6}>
        <Tabs colorScheme="blue" isLazy>
            <TabList>
              <Tab flex="1" whiteSpace="nowrap">Overview</Tab>
              <Tab flex="1" whiteSpace="nowrap">
                <Text as="span" display={{ base: "none", md: "inline" }}>Employment History</Text>
                <Text as="span" display={{ base: "inline", md: "none" }}>History</Text>
              </Tab>
              {isWorkforceEmployee ? (
                <Tab flex="1" whiteSpace="nowrap">
                  <Text as="span" display={{ base: "none", md: "inline" }}>Policy &amp; Schedule</Text>
                  <Text as="span" display={{ base: "inline", md: "none" }}>Policies</Text>
                </Tab>
              ) : null}
            </TabList>
            <TabPanels>
              <TabPanel px={0} pt={5}>
                <VStack align="stretch" spacing={5}>
            <Box bg={sectionBg}>
              <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
                <DetailCard label="Employee Number" value={user?.employeeNumber} />
                <DetailCard label="Employee Code" value={user?.code} />
                <DetailCard label="Mobile" value={user?.mobileNumber} />
                <DetailCard label="Designation" value={user?.designation} />
                <DetailCard label="Department" value={user?.department} />
                <DetailCard label="Team" value={user?.team} />
                <DetailCard label="Office Location" value={getOfficeLocationDisplay(user)} />
                <DetailCard label="City" value={user?.city} />
                <DetailCard label="State" value={user?.state} />
                <DetailCard
                  label="Company"
                  value={user?.company?.name || user?.company?.company_name || "Unassigned"}
                />
                <DetailCard
                  label="Created By"
                  value={user?.createdBy?.name || user?.createdBy?.username || "System"}
                />
                <DetailCard
                  label="Joining Date"
                  value={user?.joiningDate ? String(user.joiningDate).slice(0, 10) : "--"}
                />
              </SimpleGrid>
            </Box>

            <Box borderWidth="1px" borderColor="blackAlpha.100" borderRadius="2xl" p={5}>
              <Flex justify="space-between" align="center" gap={3} mb={3}>
                <Text fontSize="sm" fontWeight="700">
                  Reporting Manager
                </Text>
                {canEditReportingManager && user ? (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onEditReportingManager?.(user);
                    }}
                  >
                    Edit Reporting Manager
                  </Button>
                ) : null}
              </Flex>
              <Divider mb={4} />
              {!user?.reportingManager ? (
                <Text color={muted}>No reporting manager assigned.</Text>
              ) : (
                <Flex justify="space-between" align={{ base: "start", md: "center" }} gap={3}>
                  <Box>
                    <Text fontWeight="600">
                      {user.reportingManager.name || user.reportingManager.username || "Manager"}
                    </Text>
                    <Text fontSize="sm" color={muted}>
                      {user.reportingManager.username || "--"}
                    </Text>
                  </Box>
                  <Badge colorScheme="green" borderRadius="full">Assigned</Badge>
                </Flex>
              )}
            </Box>
                </VStack>
              </TabPanel>
              <TabPanel px={0} pt={5}>
                {userStore.assignmentHistoryLoading ? (
                  <Flex justify="center" py={10}>
                    <Spinner color="blue.500" />
                  </Flex>
                ) : userStore.assignmentHistoryError ? (
                  <Box
                    borderWidth="1px"
                    borderColor="red.200"
                    bg="red.50"
                    color="red.700"
                    borderRadius="md"
                    p={4}
                  >
                    {userStore.assignmentHistoryError}
                  </Box>
                ) : userStore.assignmentHistory.length === 0 ? (
                  <Box
                    borderWidth="1px"
                    borderColor="blackAlpha.100"
                    borderRadius="md"
                    p={6}
                    textAlign="center"
                  >
                    <Text fontWeight="700">No employment history recorded.</Text>
                  </Box>
                ) : (
                  <VStack align="stretch" spacing={3}>
                    {userStore.assignmentHistory.map((assignment: any) => {
                      const changedBy =
                        assignment?.changedBy?.name ||
                        assignment?.changedBy?.username ||
                        "System";

                      return (
                        <Box
                          key={assignment._id}
                          borderWidth="1px"
                          borderColor="blackAlpha.200"
                          borderRadius="md"
                          p={4}
                        >
                          <Flex
                            justify="space-between"
                            align={{ base: "start", md: "center" }}
                            direction={{ base: "column", md: "row" }}
                            gap={2}
                          >
                            <Box>
                              <HStack spacing={2} flexWrap="wrap">
                                <Text fontWeight="700">
                                  {assignment.departmentNameSnapshot ||
                                    "No department"}
                                </Text>
                                {assignment.teamNameSnapshot ? (
                                  <Badge colorScheme="purple">
                                    {assignment.teamNameSnapshot}
                                  </Badge>
                                ) : null}
                                {assignment.isCurrent ? (
                                  <Badge colorScheme="green">Current</Badge>
                                ) : null}
                              </HStack>
                              <Text color={muted} fontSize="sm" mt={1}>
                                {formatHistoryDate(assignment.effectiveFrom)} -{" "}
                                {formatHistoryDate(assignment.effectiveTo)}
                              </Text>
                            </Box>
                            <Badge colorScheme="blue">
                              {String(assignment.changeType || "assignment")
                                .replace(/_/g, " ")}
                            </Badge>
                          </Flex>

                          <SimpleGrid
                            columns={{ base: 1, md: 2 }}
                            spacing={2}
                            mt={4}
                          >
                            <Text fontSize="sm">
                              <strong>Designation:</strong>{" "}
                              {assignment.designationSnapshot || "--"}
                            </Text>
                            <Text fontSize="sm">
                              <strong>Office:</strong>{" "}
                              {assignment.officeLocationNameSnapshot || "--"}
                            </Text>
                            <Text fontSize="sm">
                              <strong>Manager:</strong>{" "}
                              {assignment.reportingManagerNameSnapshot || "--"}
                            </Text>
                            <Text fontSize="sm">
                              <strong>Changed by:</strong> {changedBy}
                            </Text>
                          </SimpleGrid>

                          {assignment.changeReason ? (
                            <Text mt={3} fontSize="sm" color={muted}>
                              {assignment.changeReason}
                            </Text>
                          ) : null}
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </TabPanel>
              {isWorkforceEmployee ? (
                <TabPanel px={0} pt={5}>
                  <EmployeePolicyTab
                    employeeId={String(user?._id || "")}
                    assignmentHistory={userStore.assignmentHistory}
                  />
                </TabPanel>
              ) : null}
            </TabPanels>
          </Tabs>
      </Box>
    </DashboardDrawer>
  );
};

export default observer(UserDetailsModal);
