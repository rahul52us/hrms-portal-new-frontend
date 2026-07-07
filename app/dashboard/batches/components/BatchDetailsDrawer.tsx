"use client";

import type { BatchDetailsItem } from "@/app/store/batchStore/batchStore";
import {
  AspectRatio,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Grid,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Progress,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FiBookOpen, FiBriefcase, FiCalendar, FiEdit2, FiPlayCircle, FiSearch, FiTrash2, FiUserPlus, FiUsers } from "react-icons/fi";

function getStatusColor(status: string) {
  if (status === "expired") {
    return "red";
  }

  if (status === "completed") {
    return "green";
  }

  if (status === "expiring_soon") {
    return "orange";
  }

  return "blue";
}

function formatDuration(batch?: BatchDetailsItem | null) {
  if (!batch) {
    return "Not set";
  }

  const start = batch.startDate ? new Date(batch.startDate).toLocaleDateString() : "Not set";
  const end = batch.endDate ? new Date(batch.endDate).toLocaleDateString() : "Open ended";
  return `${start} - ${end}`;
}

function truncateText(value?: string, limit = 120) {
  const text = String(value || "").trim();
  if (!text) {
    return "No description available yet.";
  }

  return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
}

type BatchDetailsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchDetailsItem | null;
  isLoading?: boolean;
  canManage?: boolean;
  canDelete?: boolean;
  isLearner?: boolean;
  isDeleteLoading?: boolean;
  onEditBatch?: () => void;
  onDeleteBatch?: () => void;
  onManageUsers?: () => void;
  onOpenCourse?: (courseId: string) => void;
};

export default function BatchDetailsDrawer({
  isOpen,
  onClose,
  batch,
  isLoading = false,
  canManage = false,
  canDelete = false,
  isLearner = false,
  isDeleteLoading = false,
  onEditBatch,
  onDeleteBatch,
  onManageUsers,
  onOpenCourse,
}: BatchDetailsDrawerProps) {
  const [userSearch, setUserSearch] = useState("");
  const mutedText = useColorModeValue("gray.600", "gray.300");
  const softBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const learnerHighlight = useColorModeValue("blue.50", "blue.900");

  useEffect(() => {
    if (!isOpen) {
      setUserSearch("");
    }
  }, [isOpen, batch?._id]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query || !batch?.users?.length) {
      return batch?.users || [];
    }

    return batch.users.filter((user) =>
      `${user.name} ${user.email || ""} ${user.department || ""}`.toLowerCase().includes(query)
    );
  }, [batch?.users, userSearch]);

  const courseCompletionCount = batch?.courses.filter((course) => course.status === "completed").length || 0;
  const courseProgressPercent =
    batch?.courses.length ? Math.round((courseCompletionCount / batch.courses.length) * 100) : 0;

  return (
    <Drawer isOpen={isOpen} placement="right" size="xl" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          <Stack spacing={3} pr={10}>
            <HStack justify="space-between" align="start">
              <Box>
                <Text fontSize="sm" color="gray.500" textTransform="uppercase" letterSpacing="0.08em">
                  {isLearner ? "Learning Batch" : "Batch Details"}
                </Text>
                <Text fontSize="2xl" fontWeight="semibold" color="gray.900">
                  {batch?.name || "Batch"}
                </Text>
              </Box>
              {batch ? (
                <Badge colorScheme={getStatusColor(batch.status)} borderRadius="full" px={3} py={1}>
                  {batch.status === "expiring_soon" ? "Expiring soon" : batch.status.replace(/_/g, " ")}
                </Badge>
              ) : null}
            </HStack>

            {canManage ? (
              <HStack spacing={3}>
                <Button leftIcon={<Icon as={FiEdit2} />} colorScheme="blue" onClick={onEditBatch}>
                  Edit batch
                </Button>
                <Button leftIcon={<Icon as={FiUserPlus} />} variant="outline" onClick={onManageUsers}>
                  Add or remove users
                </Button>
                {canDelete ? (
                  <Button
                    leftIcon={<Icon as={FiTrash2} />}
                    variant="outline"
                    colorScheme="red"
                    onClick={onDeleteBatch}
                    isLoading={isDeleteLoading}
                  >
                    Delete batch
                  </Button>
                ) : null}
              </HStack>
            ) : null}
          </Stack>
        </DrawerHeader>

        <DrawerBody py={6}>
          {isLoading ? (
            <HStack justify="center" py={16}>
              <Spinner />
              <Text color={mutedText}>Loading batch details...</Text>
            </HStack>
          ) : !batch ? (
            <Box borderWidth="1px" borderRadius="2xl" borderStyle="dashed" p={8} textAlign="center" bg="gray.50">
              <Text fontWeight="medium">Select a batch to inspect it.</Text>
            </Box>
          ) : (
            <Stack spacing={6}>
              {isLearner ? (
                <Box borderWidth="1px" borderRadius="3xl" p={5} bg={learnerHighlight}>
                  <Stack spacing={4}>
                    <Text color="blue.700" fontWeight="semibold">
                      This batch bundles together the learning assigned to you as a group.
                    </Text>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="blue.700">
                        {courseCompletionCount} of {batch.courses.length} courses completed
                      </Text>
                      <Text fontSize="sm" color="blue.700">
                        {courseProgressPercent}% done
                      </Text>
                    </HStack>
                    <Progress value={courseProgressPercent} colorScheme="blue" borderRadius="full" h="10px" />
                  </Stack>
                </Box>
              ) : null}

              {!isLearner ? (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Box borderWidth="1px" borderRadius="2xl" p={4} bg={softBg}>
                    <HStack spacing={2} color={mutedText}>
                      <Icon as={FiBriefcase} />
                      <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                        Company
                      </Text>
                    </HStack>
                    <Text mt={2} fontWeight="semibold">
                      {batch.company?.company_name || "Not available"}
                    </Text>
                  </Box>

                  <Box borderWidth="1px" borderRadius="2xl" p={4} bg={softBg}>
                    <HStack spacing={2} color={mutedText}>
                      <Icon as={FiUsers} />
                      <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                        Created By
                      </Text>
                    </HStack>
                    <Text mt={2} fontWeight="semibold">
                      {batch.createdBy?.name || batch.createdBy?.email || "Unknown"}
                    </Text>
                  </Box>

                  <Box borderWidth="1px" borderRadius="2xl" p={4} bg={softBg}>
                    <HStack spacing={2} color={mutedText}>
                      <Icon as={FiCalendar} />
                      <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                        Duration
                      </Text>
                    </HStack>
                    <Text mt={2} fontWeight="semibold">
                      {formatDuration(batch)}
                    </Text>
                  </Box>
                </SimpleGrid>
              ) : (
                <SimpleGrid columns={{ base: 1 }} spacing={4}>
                  <Box borderWidth="1px" borderRadius="2xl" p={4} bg={softBg}>
                    <HStack spacing={2} color={mutedText}>
                      <Icon as={FiCalendar} />
                      <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                        Batch Duration
                      </Text>
                    </HStack>
                    <Text mt={2} fontWeight="semibold">
                      {formatDuration(batch)}
                    </Text>
                  </Box>
                </SimpleGrid>
              )}

              <Box borderWidth="1px" borderRadius="3xl" p={5}>
                <HStack justify="space-between" mb={4} align="end">
                  <Box>
                    <Text fontSize="lg" fontWeight="semibold">
                      {isLearner ? "Courses in this batch" : "Courses"}
                    </Text>
                    <Text color={mutedText} fontSize="sm">
                      {isLearner
                        ? "Open any course below to continue learning."
                        : "Review the course bundle assigned through this batch."}
                    </Text>
                  </Box>
                  <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                    {batch.courses.length} total
                  </Badge>
                </HStack>

                <Stack spacing={4}>
                  {batch.courses.map((course) => (
                    <Box key={course._id} borderWidth="1px" borderRadius="3xl" overflow="hidden">
                      <Grid templateColumns={{ base: "1fr", md: "180px 1fr" }}>
                        <AspectRatio ratio={16 / 10} h="full">
                          {course.thumbnailUrl ? (
                            <Image src={course.thumbnailUrl} alt={course.title} objectFit="cover" />
                          ) : (
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              bg="linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)"
                              color="blue.700"
                            >
                              <Stack align="center" spacing={2}>
                                <Icon as={FiBookOpen} boxSize={6} />
                                <Text fontWeight="semibold">Course</Text>
                              </Stack>
                            </Box>
                          )}
                        </AspectRatio>

                        <Stack spacing={4} p={4}>
                          <HStack justify="space-between" align="start" spacing={4}>
                            <Box>
                              <Text fontWeight="semibold" fontSize="lg">
                                {course.title}
                              </Text>
                              <Text mt={2} color={mutedText} fontSize="sm" noOfLines={3}>
                                {truncateText(course.description?.text)}
                              </Text>
                            </Box>
                            <Badge colorScheme={course.status === "completed" ? "green" : "blue"} borderRadius="full" px={3} py={1}>
                              {course.status.replace(/_/g, " ")}
                            </Badge>
                          </HStack>

                          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                            <Box borderRadius="2xl" bg={softBg} p={3}>
                              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={mutedText}>
                                Modules
                              </Text>
                              <Text mt={2} fontWeight="semibold">
                                {course.curriculum?.totalModules || 0}
                              </Text>
                            </Box>
                            <Box borderRadius="2xl" bg={softBg} p={3}>
                              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={mutedText}>
                                Progress
                              </Text>
                              <Text mt={2} fontWeight="semibold">
                                {course.progress || 0}%
                              </Text>
                            </Box>
                            <Box borderRadius="2xl" bg={softBg} p={3}>
                              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={mutedText}>
                                Valid Till
                              </Text>
                              <Text mt={2} fontWeight="semibold" fontSize="sm">
                                {course.validTill ? new Date(course.validTill).toLocaleDateString() : "No expiry"}
                              </Text>
                            </Box>
                          </SimpleGrid>

                          <HStack justify="space-between" flexWrap="wrap">
                            <Text fontSize="sm" color={mutedText}>
                              {course.sourceLabel || "From batch"}
                            </Text>
                            {onOpenCourse ? (
                              <Button
                                size="sm"
                                colorScheme="blue"
                                borderRadius="xl"
                                rightIcon={<Icon as={FiPlayCircle} />}
                                onClick={() => onOpenCourse(course._id)}
                              >
                                Open course
                              </Button>
                            ) : null}
                          </HStack>
                        </Stack>
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              </Box>

              {!isLearner ? (
                <Box borderWidth="1px" borderRadius="3xl" p={5}>
                  <HStack justify="space-between" mb={4} align="end">
                    <Box>
                      <Text fontSize="lg" fontWeight="semibold">
                        Users
                      </Text>
                      <Text color={mutedText} fontSize="sm">
                        Search within this batch to quickly inspect assigned learners.
                      </Text>
                    </Box>
                    <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
                      {filteredUsers.length} shown
                    </Badge>
                  </HStack>

                  <InputGroup mb={4}>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search by name, email, or department"
                    />
                  </InputGroup>

                  <Stack spacing={3}>
                    {filteredUsers.length ? (
                      filteredUsers.map((user) => (
                        <Box key={user._id} borderWidth="1px" borderRadius="2xl" p={4} bg={softBg}>
                          <Grid templateColumns={{ base: "1fr", md: "1.2fr 1fr auto" }} gap={3} alignItems="center">
                            <Box>
                              <Text fontWeight="semibold">{user.name}</Text>
                              <Text color={mutedText} fontSize="sm">
                                {user.email || "No email"}
                              </Text>
                            </Box>
                            <Text color="gray.700" fontSize="sm">
                              {user.department || "No department"}
                            </Text>
                            <Badge colorScheme="gray" borderRadius="full" px={3} py={1}>
                              User
                            </Badge>
                          </Grid>
                        </Box>
                      ))
                    ) : (
                      <Box borderWidth="1px" borderRadius="2xl" borderStyle="dashed" p={6} textAlign="center" bg="gray.50">
                        <Text fontWeight="medium">No users match that search.</Text>
                        <Text mt={1} color={mutedText} fontSize="sm">
                          Clear the search to see everyone in this batch.
                        </Text>
                      </Box>
                    )}
                  </Stack>
                </Box>
              ) : null}

              <Divider />
            </Stack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
