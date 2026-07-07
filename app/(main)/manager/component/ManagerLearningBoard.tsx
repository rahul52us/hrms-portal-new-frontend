"use client";

import { isManagerRole } from "@/app/config/utils/roleAccess";
import LearnerReviewDrawer from "@/app/dashboard/course/scorm/LearnerProgressDashboard";
import { ScormInteractionReview } from "@/app/dashboard/course/scorm/quizReviewTypes";
import { managerStore } from "@/app/store/managerStore/managerStore";
import stores from "@/app/store/stores";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  CircularProgressLabel,
  Grid,
  Heading,
  HStack,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast
} from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function getProgressColor(progress: number) {
  if (progress >= 100) return "green";
  if (progress > 0) return "yellow";
  return "red";
}

function formatScore(score?: number | null) {
  if (score === null || score === undefined) return "N/A";
  return `${Math.round(score * 100) / 100}`;
}

function formatTime(value?: string | null) {
  return value || "00:00:00";
}

function averageNumbers(values: number[]) {
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 100) / 100;
}

function averageNullableNumbers(values: Array<number | null | undefined>) {
  const numericValues = values.filter((value): value is number => Number.isFinite(value));
  if (!numericValues.length) return null;
  return averageNumbers(numericValues);
}

const ManagerLearningBoard = observer(() => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const role = String(stores.auth.userType || stores.auth.user?.role || "").toLowerCase();
  const isManagerUser = isManagerRole(role);

  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isAnswersLoading, setIsAnswersLoading] = useState(false);

  // ✅ Track the latest course-select request to discard stale responses
  const answersFetchSeqRef = useRef(0);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.300");
  const metricBg = useColorModeValue("gray.50", "whiteAlpha.100");

  useEffect(() => {
    if (!isManagerUser) return;
    managerStore.fetchManagedLearners().catch(() => undefined);
  }, [isManagerUser]);

  // ✅ selectedCourse is now derived from the SAME selectedCourseId that drives answers,
  //    so both always point to the same course simultaneously.
  const selectedCourse = useMemo(() => {
    const courses = managerStore.learnerProgress?.courses || [];
    if (!courses.length) return null;
    // Fall back to first course only when selectedCourseId is empty (initial open)
    return courses.find((c) => c.courseId === selectedCourseId) ?? courses[0] ?? null;
  }, [selectedCourseId, managerStore.learnerProgress?.courses]);

  // ✅ Fetch answers for a course with stale-request protection
  const fetchAnswersForCourse = useCallback(
    async (learnerId: string, courseId: string) => {
      // Increment sequence — any in-flight request with an older seq is discarded
      const seq = ++answersFetchSeqRef.current;
      setIsAnswersLoading(true);

      try {
        await managerStore.fetchLearnerAnswers(learnerId, courseId);
        // Only apply the result if this is still the latest request
        if (seq !== answersFetchSeqRef.current) return;
      } catch (error: any) {
        if (seq !== answersFetchSeqRef.current) return;
        toast({
          title: "Unable to load answers",
          description: error?.message || error?.error || "Please try again.",
          status: "error",
          duration: 4000,
        });
      } finally {
        if (seq === answersFetchSeqRef.current) {
          setIsAnswersLoading(false);
        }
      }
    },
    [toast]
  );

  const openLearner = async (learnerId: string) => {
    // ✅ Clear stale state BEFORE opening so drawer never shows previous learner's data
    setSelectedLearnerId(learnerId);
    setSelectedCourseId("");
    managerStore.clearLearnerState();
    onOpen();

    try {
      const learnerProgress = await managerStore.fetchLearnerProgress(learnerId);
      const initialCourseId = learnerProgress?.courses?.[0]?.courseId || "";

      // ✅ Set course ID first so selectedCourse memo resolves correctly
      setSelectedCourseId(initialCourseId);

      if (initialCourseId) {
        await fetchAnswersForCourse(learnerId, initialCourseId);
      }
    } catch (error: any) {
      toast({
        title: "Unable to load learner details",
        description: error?.message || error?.error || "Please try again.",
        status: "error",
        duration: 4000,
      });
    }
  };

  const selectCourse = useCallback(
    async (courseId: string) => {
      if (!selectedLearnerId || courseId === selectedCourseId) return;

      // ✅ Update course ID immediately so UI highlights the right tab/course at once
      setSelectedCourseId(courseId);
      await fetchAnswersForCourse(selectedLearnerId, courseId);
    },
    [selectedLearnerId, selectedCourseId, fetchAnswersForCourse]
  );

  const handleCloseDrawer = () => {
    // ✅ Invalidate any in-flight answer fetch so it doesn't update state after close
    answersFetchSeqRef.current++;
    setSelectedLearnerId("");
    setSelectedCourseId("");
    setIsAnswersLoading(false);
    managerStore.clearLearnerState();
    onClose();
  };

  const submitReview = async (
    trackingId: string,
    interaction: ScormInteractionReview,
    marks: number
  ) => {
    try {
      await managerStore.reviewAnswer({
        trackingId,
        interactionId: interaction._id,
        marks,
      });
      toast({
        title: "Marks saved",
        description: `This answer has been reviewed with ${marks} mark${marks === 1 ? "" : "s"}.`,
        status: "success",
        duration: 3000,
      });

      if (selectedLearnerId) {
        managerStore.fetchLearnerProgress(selectedLearnerId).catch(() => {});
      }
      managerStore.fetchManagedLearners().catch(() => {});
    } catch (error: any) {
      toast({
        title: "Unable to save review",
        description: error?.message || error?.error || "Please try again.",
        status: "error",
        duration: 4000,
      });
    }
  };

  if (!isManagerUser) {
    return (
      <Box minH="100vh" bg={pageBg} p={{ base: 4, md: 6 }}>
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="3xl" p={8}>
          <Heading size="md">Manager workspace is available to manager roles only</Heading>
          <Text mt={3} color={mutedText}>
            This page is meant for manager and L1/L2 manager users who review learner progress and answer submissions.
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg}>
      <Stack spacing={6}>
        {/* Header banner */}
        <Box
          borderRadius="3xl"
          px={{ base: 5, md: 8 }}
          py={{ base: 6, md: 8 }}
          bg="linear-gradient(135deg, #052e16 0%, #0f766e 52%, #dcfce7 100%)"
          color="white"
        >
          <Grid templateColumns={{ base: "1fr", lg: "1.4fr 0.9fr" }} gap={6}>
            <Box>
              <Badge bg="whiteAlpha.300" color="white" borderRadius="full" px={3} py={1}>
                Team Review
              </Badge>
              <Heading mt={4} size="lg">
                Track learner progress, scores, and answer reviews from one place
              </Heading>
              <Text mt={3} color="whiteAlpha.900" maxW="2xl">
              Open a learner to inspect course progress at the module and section level, review captured quiz
                answers, and award marks to subjective responses question by question.
              </Text>
            </Box>

            <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap={3}>
              <Box bg="whiteAlpha.220" borderWidth="1px" borderColor="whiteAlpha.300" borderRadius="2xl" p={4}>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.1em" color="whiteAlpha.800">
                  Learners
                </Text>
                <Text mt={2} fontSize="2xl" fontWeight="bold">
                  {managerStore.learners.length}
                </Text>
              </Box>
              <Box bg="whiteAlpha.220" borderWidth="1px" borderColor="whiteAlpha.300" borderRadius="2xl" p={4}>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.1em" color="whiteAlpha.800">
                  Avg Progress
                </Text>
                <Text mt={2} fontSize="2xl" fontWeight="bold">
                  {Math.round(
                    averageNumbers(managerStore.learners.map((l) => Number(l.overallProgress || 0)))
                  )}%
                </Text>
              </Box>
              <Box bg="whiteAlpha.220" borderWidth="1px" borderColor="whiteAlpha.300" borderRadius="2xl" p={4}>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.1em" color="whiteAlpha.800">
                  Avg Score
                </Text>
                <Text mt={2} fontSize="2xl" fontWeight="bold">
                  {formatScore(averageNullableNumbers(managerStore.learners.map((l) => l.avgScore)))}
                </Text>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Learners table */}
        {managerStore.isLearnersLoading ? (
          <HStack justify="center" py={20}>
            <Spinner />
            <Text color={mutedText}>Loading assigned learners...</Text>
          </HStack>
        ) : managerStore.learners.length === 0 ? (
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="3xl" p={8}>
            <Heading size="md">No assigned learners yet</Heading>
            <Text mt={3} color={mutedText}>
              Learners will appear here when they are assigned to you through the manager hierarchy.
            </Text>
          </Box>
        ) : (
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="3xl" overflow="hidden">
            <TableContainer>
              <Table variant="simple">
                <Thead bg={metricBg}>
                  <Tr>
                    <Th>Learner</Th>
                    <Th>Department</Th>
                    <Th isNumeric>Progress</Th>
                    <Th isNumeric>Avg Score</Th>
                    <Th isNumeric>Courses</Th>
                    <Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {managerStore.learners.map((learner) => (
                    <Tr key={learner._id}>
                      <Td>
                        <Text fontWeight="semibold">{learner.name}</Text>
                        <Text mt={1} fontSize="sm" color={mutedText}>
                          {learner.email || learner.username || "Learner account"}
                        </Text>
                      </Td>
                      <Td>
                        {learner.department ? (
                          <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>
                            {learner.department}
                          </Badge>
                        ) : (
                          <Text color={mutedText}>Unassigned</Text>
                        )}
                      </Td>
                      <Td isNumeric>
                        <HStack justify="flex-end" spacing={3}>
                          <CircularProgress
                            value={learner.overallProgress}
                            color={`${getProgressColor(learner.overallProgress)}.400`}
                            size="54px"
                            thickness="10px"
                          >
                            <CircularProgressLabel fontSize="xs" fontWeight="bold">
                              {Math.round(learner.overallProgress)}%
                            </CircularProgressLabel>
                          </CircularProgress>
                        </HStack>
                      </Td>
                      <Td isNumeric>{formatScore(learner.avgScore)}</Td>
                      <Td isNumeric>
                        {learner.completedCourses}/{learner.courseCount}
                      </Td>
                      <Td textAlign="right">
                        <Button colorScheme="teal" borderRadius="xl" onClick={() => openLearner(learner._id)}>
                          View Answers
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Stack>

      <LearnerReviewDrawer
        isOpen={isOpen}
        onClose={handleCloseDrawer}
        managerStore={managerStore}
        selectedCourse={selectedCourse}
        selectedCourseId={selectedCourseId}   // ✅ pass down so drawer can highlight active tab
        isAnswersLoading={isAnswersLoading}    // ✅ pass down so drawer can show inline spinner
        selectCourse={selectCourse}
        submitReview={submitReview}
      />
    </Box>
  );
});

export default ManagerLearningBoard;
