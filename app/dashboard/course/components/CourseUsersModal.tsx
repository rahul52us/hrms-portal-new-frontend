"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Tag,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FiMail, FiPhone, FiSearch, FiUser, FiUsers } from "react-icons/fi";
import useDebounce from "../../../component/config/component/customHooks/useDebounce";
import { getApiErrorMessage } from "../../../config/utils/apiError";
import stores from "../../../store/stores";

type CourseUsersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle?: string;
};

const FILTER_OPTIONS = [
  { value: "all", label: "All Enrolled" },
  { value: "self_enrolled", label: "Self-Enrolled" },
  { value: "assigned", label: "Assigned by Admin" },
] as const;

type FilterValue = typeof FILTER_OPTIONS[number]["value"];

const ACCESS_TYPE_META: Record<string, { label: string; colorScheme: string }> = {
  self_enrolled: { label: "Self-Enrolled", colorScheme: "purple" },
  assigned: { label: "Admin Assigned", colorScheme: "blue" },
  other: { label: "Other", colorScheme: "gray" },
};

const CourseUsersModal = ({ isOpen, onClose, courseId, courseTitle }: CourseUsersModalProps) => {
  const toast = useToast();
  const { userStore } = stores;

  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    users: any[];
    total: number;
    totalPages: number;
    page: number;
    filter: string;
  } | null>(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const filterBg = useColorModeValue("gray.50", "gray.700");

  const fetchCourseUsers = useCallback(async () => {
    if (!courseId || !isOpen) return;
    setLoading(true);
    try {
      const res = await (userStore as any).fetchCourseUsers(courseId, {
        filter,
        search: debouncedSearch,
        page,
        limit: 15,
      });
      setData(res?.data || null);
    } catch (err: any) {
      toast({
        title: "Unable to load course users",
        description: getApiErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, filter, debouncedSearch, page, isOpen]);

  useEffect(() => {
    fetchCourseUsers();
  }, [fetchCourseUsers]);

  // Reset state when modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setFilter("all");
      setSearch("");
      setPage(1);
      setData(null);
    }
  }, [isOpen, courseId]);

  const users = data?.users || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" overflow="hidden">
        <ModalHeader pb={2}>
          <HStack spacing={3}>
            <Box
              p={2}
              borderRadius="xl"
              bgGradient="linear(to-br, blue.400, purple.500)"
            >
              <Icon as={FiUsers} boxSize={5} color="white" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" fontSize="lg">
                Course Enrollments
              </Text>
              {courseTitle && (
                <Text fontSize="sm" color={muted} noOfLines={1}>
                  {courseTitle}
                </Text>
              )}
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            {/* Filter Tabs */}
            <Flex
              bg={filterBg}
              p={1}
              borderRadius="full"
              gap={1}
              flexWrap="wrap"
            >
              {FILTER_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  borderRadius="full"
                  flex={1}
                  variant={filter === opt.value ? "solid" : "ghost"}
                  colorScheme={filter === opt.value ? "blue" : "gray"}
                  onClick={() => {
                    setFilter(opt.value);
                    setPage(1);
                  }}
                  transition="all 0.2s"
                >
                  {opt.label}
                </Button>
              ))}
            </Flex>

            {/* Search */}
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color={muted} />
              </InputLeftElement>
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, email or phone..."
                borderRadius="xl"
                pl={9}
              />
            </InputGroup>

            {/* Results Count */}
            {data && (
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color={muted}>
                  Showing{" "}
                  <strong>{users.length}</strong>{" "}
                  of{" "}
                  <strong>{data.total}</strong>{" "}
                  {data.total === 1 ? "user" : "users"}
                </Text>
                {filter !== "all" && (
                  <Tag
                    colorScheme={ACCESS_TYPE_META[filter]?.colorScheme || "gray"}
                    borderRadius="full"
                    size="sm"
                    variant="subtle"
                  >
                    {ACCESS_TYPE_META[filter]?.label || filter}
                  </Tag>
                )}
              </Flex>
            )}

            {/* Users List */}
            {loading ? (
              <Box py={12} textAlign="center">
                <Spinner size="lg" color="blue.500" />
                <Text mt={3} fontSize="sm" color={muted}>
                  Loading enrolled users...
                </Text>
              </Box>
            ) : users.length === 0 ? (
              <Box
                bg={filterBg}
                p={8}
                borderRadius="2xl"
                textAlign="center"
              >
                <Icon as={FiUser} boxSize={8} color={muted} mb={2} />
                <Text fontWeight="medium">No users found</Text>
                <Text fontSize="sm" color={muted} mt={1}>
                  {filter !== "all"
                    ? "Try changing the filter above"
                    : "No one is enrolled in this course yet"}
                </Text>
              </Box>
            ) : (
              <Stack spacing={2}>
                {users.map((user: any) => {
                  const accessMeta = ACCESS_TYPE_META[user.accessType] || ACCESS_TYPE_META.other;
                  return (
                    <Box
                      key={user._id}
                      bg={cardBg}
                      p={4}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor={borderColor}
                      transition="all 0.2s"
                      _hover={{ boxShadow: "sm", borderColor: "blue.200" }}
                    >
                      <Flex justify="space-between" align="start">
                        <HStack spacing={3} align="start">
                          <Avatar
                            size="sm"
                            name={user.name || "User"}
                            bgGradient="linear(to-br, blue.400, purple.500)"
                            color="white"
                          />
                          <VStack align="start" spacing={0.5}>
                            <Text fontWeight="semibold" fontSize="sm">
                              {user.name || "--"}
                            </Text>
                            {user.email && (
                              <HStack spacing={1}>
                                <Icon as={FiMail} boxSize={3} color={muted} />
                                <Text fontSize="xs" color={muted}>
                                  {user.email}
                                </Text>
                              </HStack>
                            )}
                            {user.mobileNumber && (
                              <HStack spacing={1}>
                                <Icon as={FiPhone} boxSize={3} color={muted} />
                                <Text fontSize="xs" color={muted}>
                                  {user.mobileNumber}
                                </Text>
                              </HStack>
                            )}
                          </VStack>
                        </HStack>

                        <VStack align="end" spacing={1}>
                          <Badge
                            colorScheme={accessMeta.colorScheme}
                            variant="subtle"
                            borderRadius="full"
                            px={2}
                            py={0.5}
                            fontSize="xs"
                          >
                            {accessMeta.label}
                          </Badge>
                          {user.department && (
                            <Text fontSize="xs" color={muted}>
                              {user.department}
                            </Text>
                          )}
                          {user.enrolledAt && (
                            <Text fontSize="10px" color={muted}>
                              {new Date(user.enrolledAt).toLocaleDateString()}
                            </Text>
                          )}
                        </VStack>
                      </Flex>
                    </Box>
                  );
                })}
              </Stack>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <Flex justify="center" align="center" gap={3} pt={2}>
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="xl"
                  isDisabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Text fontSize="sm" color={muted}>
                  Page {page} of {data.totalPages}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="xl"
                  isDisabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </Flex>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CourseUsersModal;
