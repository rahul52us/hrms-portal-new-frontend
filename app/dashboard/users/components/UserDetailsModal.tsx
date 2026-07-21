"use client";

import {
  Badge,
  Box,
  Divider,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

const COLORS = ["blue", "purple", "orange", "green", "pink", "cyan"];

const getUserStatusMeta = (user: any) => {
  if (user?.status === "INACTIVE" || user?.isEnabled === false || user?.is_enabled === false) {
    return { label: "Inactive", colorScheme: "red" };
  }

  if (user?.status === "ACTIVE" || user?.isActive) {
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

const UserDetailsModal = ({
  isOpen,
  onClose,
  user,
  formatRoleLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  formatRoleLabel: (role: string) => string;
}) => {
  const muted = useColorModeValue("gray.600", "gray.400");
  const sectionBg = useColorModeValue("white", "gray.900");
  const managerItemBg = useColorModeValue("gray.50", "gray.800");
  const statusMeta = getUserStatusMeta(user);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay backdropFilter="blur(6px)" />
      <ModalContent borderRadius="2xl" overflow="hidden">
        <ModalHeader py={5}>
          <Flex justify="space-between" align="center" pr={8} gap={3}>
            <Box>
              <Text fontSize="xl" fontWeight="700">
                {user?.name || "Employee details"}
              </Text>
              <Text color={muted} fontSize="sm" mt={1}>
                {user?.email || "No email available"}
              </Text>
            </Box>
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
          </Flex>
        </ModalHeader>
        <ModalCloseButton top={5} />

        <ModalBody pb={6}>
          <VStack align="stretch" spacing={5}>
            <Box bg={sectionBg}>
              <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
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
                  value={user?.createdBy?.name || user?.createdBy?.email || "System"}
                />
                <DetailCard
                  label="Joining Date"
                  value={user?.joiningDate ? String(user.joiningDate).slice(0, 10) : "--"}
                />
              </SimpleGrid>
            </Box>

            <Box borderWidth="1px" borderColor="blackAlpha.100" borderRadius="2xl" p={5}>
              <Text fontSize="sm" fontWeight="700" mb={3}>
                Manager Hierarchy
              </Text>
              <Divider mb={4} />
              {(user?.managers || []).length === 0 ? (
                <Text color={muted}>No managers assigned.</Text>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {(user?.managers || []).map((manager: any, index: number) => (
                    <Flex
                      key={`${user?._id || "user"}-${manager.level}`}
                      justify="space-between"
                      align={{ base: "start", md: "center" }}
                      direction={{ base: "column", md: "row" }}
                      gap={3}
                      p={4}
                      borderRadius="xl"
                      bg={managerItemBg}
                    >
                      <HStack spacing={3}>
                        <Badge colorScheme={COLORS[index % COLORS.length]} borderRadius="full" px={2.5} py={1}>
                          L{manager.level}
                        </Badge>
                        <Box>
                          <Text fontWeight="600">{manager.managerName || manager.manager?.name || "Manager"}</Text>
                          <Text fontSize="sm" color={muted}>
                            {manager.managerEmail || manager.manager?.email || manager.manager?.username || "--"}
                          </Text>
                        </Box>
                      </HStack>
                      <Badge colorScheme={manager.status === "ASSIGNED" ? "green" : "orange"} borderRadius="full">
                        {manager.status || "Pending"}
                      </Badge>
                    </Flex>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default UserDetailsModal;
