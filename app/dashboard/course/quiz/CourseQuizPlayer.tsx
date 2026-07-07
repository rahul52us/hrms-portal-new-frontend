"use client";

import { CourseQuizForLearner } from "@/app/store/courseStore/courseStore";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
  useTheme,
  useToast,
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  PartyPopper,
  Send,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface CourseQuizPlayerProps {
  quiz: CourseQuizForLearner;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (answers: Array<{ questionId: string; selectedOptionId: string }>) => Promise<any>;
}

const MotionBox = motion(Box);

export default function CourseQuizPlayer({ quiz, isSubmitting = false, onClose, onSubmit }: CourseQuizPlayerProps) {
  const toast = useToast();
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState(quiz.attempt || null);

  useEffect(() => {
    const previousAnswers = quiz.attempt?.answers || [];
    setAnswers(Object.fromEntries(previousAnswers.map((answer) => [answer.questionId, answer.selectedOptionId])));
    setCurrentIndex(0);
    setResult(quiz.attempt || null);
  }, [quiz.quizId, quiz.attempt?._id]);

  const brandScale = (theme.colors?.brand || {}) as Record<number, string>;
  const brand50 = brandScale[50] || "#EFF6FF";
  const brand100 = brandScale[100] || "#DBEAFE";
  const brand200 = brandScale[200] || "#BFDBFE";
  const brand500 = brandScale[500] || "#2563EB";
  const brand700 = brandScale[700] || "#1D4ED8";
  const cardBg = useColorModeValue("white", "gray.900");
  const overlayBg = useColorModeValue("rgba(15, 23, 42, 0.7)", "rgba(2, 6, 23, 0.84)");
  const shellBg = useColorModeValue("rgba(255,255,255,0.94)", "rgba(15,23,42,0.95)");
  const shellBorder = useColorModeValue("whiteAlpha.700", "whiteAlpha.200");
  const surfaceBg = useColorModeValue("white", "whiteAlpha.80");
  const mutedSurfaceBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const textMuted = useColorModeValue("gray.600", "gray.300");
  const questionBadgeBg = useColorModeValue(brand50, "whiteAlpha.120");
  const questionBadgeText = useColorModeValue(brand700, "white");
  const answeredCount = quiz.questions.filter((question) => answers[question.questionId]).length;
  const unansweredCount = Math.max(quiz.questions.length - answeredCount, 0);
  const progressPercent = quiz.questions.length ? Math.round((answeredCount / quiz.questions.length) * 100) : 0;
  const currentQuestion = quiz.questions[currentIndex];
  const isCompleted = Boolean(result);

  const answerReviewMap = useMemo(() => {
    return new Map((result?.answers || []).map((answer) => [answer.questionId, answer]));
  }, [result?.answers]);

  const currentAnswerId = currentQuestion ? answers[currentQuestion.questionId] : "";

  const submitQuiz = async () => {
    const unansweredIndex = quiz.questions.findIndex((question) => !answers[question.questionId]);
    if (unansweredIndex >= 0) {
      setCurrentIndex(unansweredIndex);
      toast({
        title: "A few answers are still waiting",
        description: "Jump to the highlighted question bubbles and finish those picks before submitting.",
        status: "warning",
        duration: 3200,
      });
      return;
    }

    const payload = quiz.questions.map((question) => ({
      questionId: question.questionId,
      selectedOptionId: answers[question.questionId],
    }));
    const response = await onSubmit(payload);
    setResult(response?.attempt || null);
  };

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 md:p-5" style={{ background: overlayBg }}>
      <MotionBox
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ duration: 0.22 }}
        bg={shellBg}
        backdropFilter="blur(18px)"
        borderRadius={{ base: "28px", md: "34px" }}
        boxShadow="0 36px 120px rgba(15, 23, 42, 0.46)"
        borderWidth="1px"
        borderColor={shellBorder}
        width="min(1120px, 100%)"
        maxH="94vh"
        overflow="hidden"
        position="relative"
      >
        <Box
          position="absolute"
          inset={0}
          pointerEvents="none"
          bg={`radial-gradient(circle at top left, ${brand100} 0%, transparent 34%), radial-gradient(circle at bottom right, ${brand200} 0%, transparent 26%)`}
          opacity={0.78}
        />

        <Box position="relative" p={{ base: 4, md: 6 }} borderBottomWidth="1px" borderColor={borderColor}>
          <Flex align="start" justify="space-between" gap={4}>
            <Box>
              <HStack spacing={2} flexWrap="wrap">
                <Badge borderRadius="full" px={3} py={1} bg={brand500} color="white">
                  {quiz.scope === "final" ? "Final Quiz" : quiz.moduleTitle || "Module Quiz"}
                </Badge>
                <Badge borderRadius="full" px={3} py={1} bg={questionBadgeBg} color={questionBadgeText}>
                  {quiz.totalMarks} marks
                </Badge>
                <Badge borderRadius="full" px={3} py={1} bg={mutedSurfaceBg} color={textMuted}>
                  {quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"}
                </Badge>
              </HStack>
              <Text mt={3} fontSize={{ base: "xl", md: "2xl" }} fontWeight="900" color="gray.900">
                {quiz.title}
              </Text>
              <Text mt={1} color={textMuted} fontSize="sm">
                Follow the question trail, lock in an answer with a single tap, and finish with a polished review.
              </Text>
            </Box>

            <Button
              variant="ghost"
              borderRadius="full"
              onClick={onClose}
              aria-label="Close quiz"
              _hover={{ bg: "blackAlpha.50" }}
            >
              <X size={18} />
            </Button>
          </Flex>

          <Stack mt={5} spacing={4}>
            <Flex align="center" justify="space-between" gap={4} wrap="wrap">
              <Box>
                <Text fontSize="xs" fontWeight="800" textTransform="uppercase" letterSpacing="0.14em" color={textMuted}>
                  Progress
                </Text>
                <Text mt={1} fontSize="sm" fontWeight="700" color="gray.800">
                  {isCompleted ? "Quiz complete" : unansweredCount === 0 ? "Ready to submit" : `${unansweredCount} left to answer`}
                </Text>
              </Box>
              <HStack spacing={2} flexWrap="wrap">
                <Badge borderRadius="full" px={3} py={1} bg={surfaceBg} color="gray.800">
                  {answeredCount}/{quiz.questions.length} answered
                </Badge>
                {currentQuestion ? (
                  <Badge borderRadius="full" px={3} py={1} bg={brand50} color={questionBadgeText}>
                    Question {currentIndex + 1}
                  </Badge>
                ) : null}
              </HStack>
            </Flex>

            <Progress
              value={isCompleted ? 100 : progressPercent}
              colorScheme="brand"
              borderRadius="full"
              h="12px"
              bg={useColorModeValue("gray.100", "whiteAlpha.200")}
              sx={{ "& > div": { transition: "width 0.28s ease" } }}
            />

            <SimpleGrid columns={{ base: 5, md: 10 }} spacing={2}>
              {quiz.questions.map((question, index) => {
                const isCurrent = index === currentIndex;
                const isAnswered = Boolean(answers[question.questionId]);

                return (
                  <MotionBox
                    key={question.questionId}
                    as="button"
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentIndex(index)}
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor={isCurrent ? brand500 : isAnswered ? brand200 : borderColor}
                    bg={isCurrent ? brand500 : isAnswered ? brand50 : surfaceBg}
                    color={isCurrent ? "white" : "gray.800"}
                    px={0}
                    py={3}
                    textAlign="center"
                    boxShadow={isCurrent ? `0 14px 32px ${brand100}` : "none"}
                    _focusVisible={{ outline: "2px solid", outlineColor: brand500, outlineOffset: "2px" }}
                  >
                    <Text fontSize="sm" fontWeight="900">{index + 1}</Text>
                    <Text mt={1} fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="0.12em" opacity={0.88}>
                      {isCurrent ? "Now" : isAnswered ? "Done" : "Pick"}
                    </Text>
                  </MotionBox>
                );
              })}
            </SimpleGrid>
          </Stack>
        </Box>

        <Box position="relative" p={{ base: 4, md: 6 }} overflowY="auto" maxH="calc(94vh - 250px)">
          {isCompleted && result ? (
            <Stack spacing={5}>
              <Box
                borderWidth="1px"
                borderColor={brand200}
                bg={`linear-gradient(135deg, ${brand50}, ${surfaceBg})`}
                borderRadius="3xl"
                p={{ base: 5, md: 6 }}
                boxShadow="0 20px 50px rgba(15, 23, 42, 0.08)"
              >
                <Flex align={{ base: "start", md: "center" }} justify="space-between" gap={4} direction={{ base: "column", md: "row" }}>
                  <HStack spacing={4} align="start">
                    <Box borderRadius="2xl" bg={brand500} color="white" p={3}>
                      <PartyPopper size={24} />
                    </Box>
                    <Box>
                      <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="900" color="gray.900">
                        Quiz submitted
                      </Text>
                      <Text mt={1} color={textMuted}>
                        You scored {result.score}/{result.maxScore} marks with {Math.round(result.percentage)}% accuracy.
                      </Text>
                    </Box>
                  </HStack>

                  <Box
                    minW={{ base: "full", md: "210px" }}
                    rounded="3xl"
                    borderWidth="1px"
                    borderColor={brand200}
                    bg={surfaceBg}
                    px={5}
                    py={4}
                  >
                    <HStack spacing={3}>
                      <Box rounded="2xl" bg={brand50} color={questionBadgeText} p={2}>
                        <Trophy size={18} />
                      </Box>
                      <Box>
                        <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.14em" color={textMuted} fontWeight="800">
                          Attempt
                        </Text>
                        <Text fontWeight="900" color="gray.900">#{result.attemptNumber}</Text>
                      </Box>
                    </HStack>
                  </Box>
                </Flex>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
                <Box borderWidth="1px" borderColor={borderColor} bg={surfaceBg} borderRadius="2xl" p={4}>
                  <Text fontSize="xs" color={textMuted} textTransform="uppercase" fontWeight="800">Score</Text>
                  <Text mt={2} fontSize="2xl" fontWeight="900" color={questionBadgeText}>
                    {result.score}/{result.maxScore}
                  </Text>
                </Box>
                <Box borderWidth="1px" borderColor={borderColor} bg={surfaceBg} borderRadius="2xl" p={4}>
                  <Text fontSize="xs" color={textMuted} textTransform="uppercase" fontWeight="800">Correct</Text>
                  <Text mt={2} fontSize="2xl" fontWeight="900" color="green.500">{result.correctCount}</Text>
                </Box>
                <Box borderWidth="1px" borderColor={borderColor} bg={surfaceBg} borderRadius="2xl" p={4}>
                  <Text fontSize="xs" color={textMuted} textTransform="uppercase" fontWeight="800">Incorrect</Text>
                  <Text mt={2} fontSize="2xl" fontWeight="900" color="red.500">{result.incorrectCount}</Text>
                </Box>
                <Box borderWidth="1px" borderColor={borderColor} bg={surfaceBg} borderRadius="2xl" p={4}>
                  <Text fontSize="xs" color={textMuted} textTransform="uppercase" fontWeight="800">Accuracy</Text>
                  <Text mt={2} fontSize="2xl" fontWeight="900" color={questionBadgeText}>
                    {Math.round(result.percentage)}%
                  </Text>
                </Box>
              </SimpleGrid>

              <Stack spacing={3}>
                {quiz.questions.map((question, index) => {
                  const review = answerReviewMap.get(question.questionId);

                  return (
                    <Box key={question.questionId} borderWidth="1px" borderColor={borderColor} bg={surfaceBg} borderRadius="3xl" p={4}>
                      <Flex justify="space-between" align="start" gap={3} wrap="wrap">
                        <Box>
                          <Text fontSize="xs" color={textMuted} fontWeight="800" textTransform="uppercase" letterSpacing="0.12em">
                            Question {index + 1}
                          </Text>
                          <Text mt={2} fontWeight="800" color="gray.900">{question.question}</Text>
                        </Box>
                        <Badge
                          borderRadius="full"
                          px={3}
                          py={1}
                          bg={review?.isCorrect ? "green.100" : "red.100"}
                          color={review?.isCorrect ? "green.700" : "red.700"}
                        >
                          {review?.marksAwarded || 0}/{review?.maxMarks || question.marks}
                        </Badge>
                      </Flex>

                      <SimpleGrid mt={4} columns={{ base: 1, md: 2 }} spacing={3}>
                        <Box borderRadius="2xl" p={4} bg={review?.isCorrect ? "green.50" : "red.50"}>
                          <Text fontSize="xs" color={textMuted} fontWeight="800" textTransform="uppercase">Your answer</Text>
                          <Text mt={2} fontSize="sm" color="gray.800">{review?.selectedAnswerText || "No answer"}</Text>
                        </Box>
                        <Box borderRadius="2xl" p={4} bg={brand50}>
                          <Text fontSize="xs" color={textMuted} fontWeight="800" textTransform="uppercase">Correct answer</Text>
                          <Text mt={2} fontSize="sm" color="gray.800">{review?.correctAnswerText || "Not available"}</Text>
                        </Box>
                      </SimpleGrid>
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          ) : currentQuestion ? (
            <Stack spacing={5}>
              <Flex align={{ base: "start", md: "center" }} justify="space-between" gap={4} direction={{ base: "column", md: "row" }}>
                <HStack spacing={3} align="start">
                  <Box bg={questionBadgeBg} color={questionBadgeText} borderRadius="2xl" p={3}>
                    <Sparkles size={20} />
                  </Box>
                  <Box>
                    <Text fontSize="xs" color={textMuted} fontWeight="800" textTransform="uppercase" letterSpacing="0.14em">
                      Question {currentIndex + 1} of {quiz.questions.length}
                    </Text>
                    <Text mt={1} fontWeight="900" color="gray.900">
                      {currentQuestion.marks} mark{currentQuestion.marks === 1 ? "" : "s"} waiting here
                    </Text>
                  </Box>
                </HStack>

                <Box rounded="2xl" borderWidth="1px" borderColor={brand200} bg={brand50} px={4} py={3}>
                  <Text fontSize="xs" color={textMuted} fontWeight="800" textTransform="uppercase" letterSpacing="0.12em">
                    Current status
                  </Text>
                  <Text mt={1} fontSize="sm" fontWeight="800" color="gray.900">
                    {currentAnswerId ? "Choice locked in" : "Pick the best answer"}
                  </Text>
                </Box>
              </Flex>

              <AnimatePresence mode="wait">
                <MotionBox
                  key={currentQuestion.questionId}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.18 }}
                >
                  <Box borderWidth="1px" borderColor={borderColor} bg={surfaceBg} borderRadius="3xl" p={{ base: 5, md: 6 }}>
                    <Text fontSize={{ base: "lg", md: "2xl" }} lineHeight="1.35" fontWeight="900" color="gray.900">
                      {currentQuestion.question}
                    </Text>
                    <Text mt={2} fontSize="sm" color={textMuted}>
                      Tap a card to select your answer. You can still revisit any question from the progress bubbles above.
                    </Text>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={5}>
                      {currentQuestion.options.map((option) => {
                        const isSelected = currentAnswerId === option.optionId;

                        return (
                          <MotionBox
                            key={option.optionId}
                            as="button"
                            type="button"
                            whileHover={{ y: -4, scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() =>
                              setAnswers((currentAnswers) => ({
                                ...currentAnswers,
                                [currentQuestion.questionId]: option.optionId,
                              }))
                            }
                            w="full"
                            borderWidth="1px"
                            borderColor={isSelected ? brand500 : borderColor}
                            bg={isSelected ? brand50 : surfaceBg}
                            borderRadius="3xl"
                            p={0}
                            textAlign="left"
                            boxShadow={isSelected ? `0 18px 42px ${brand100}` : "0 10px 24px rgba(15, 23, 42, 0.04)"}
                            _focusVisible={{ outline: "2px solid", outlineColor: brand500, outlineOffset: "2px" }}
                          >
                            <Box p={4}>
                              <Flex align="start" gap={3}>
                                <Flex
                                  h="42px"
                                  w="42px"
                                  shrink={0}
                                  align="center"
                                  justify="center"
                                  borderRadius="2xl"
                                  bg={isSelected ? brand500 : mutedSurfaceBg}
                                  color={isSelected ? "white" : "gray.700"}
                                >
                                  {isSelected ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                </Flex>
                                <Box flex="1">
                                  <Text
                                    fontSize="xs"
                                    fontWeight="900"
                                    letterSpacing="0.14em"
                                    textTransform="uppercase"
                                    color={isSelected ? questionBadgeText : textMuted}
                                  >
                                    {option.label}
                                  </Text>
                                  <Text mt={2} fontSize="sm" lineHeight="1.6" color="gray.900">
                                    {option.text}
                                  </Text>
                                  <Text mt={3} fontSize="xs" fontWeight="700" color={isSelected ? questionBadgeText : textMuted}>
                                    {isSelected ? "Selected" : "Select this answer"}
                                  </Text>
                                </Box>
                              </Flex>
                            </Box>
                          </MotionBox>
                        );
                      })}
                    </SimpleGrid>
                  </Box>
                </MotionBox>
              </AnimatePresence>
            </Stack>
          ) : null}
        </Box>

        <Box position="relative" p={{ base: 4, md: 5 }} borderTopWidth="1px" borderColor={borderColor} bg={cardBg}>
          <Flex justify="space-between" gap={3} wrap="wrap" align="center">
            <HStack spacing={2}>
              <Button
                variant="outline"
                borderRadius="full"
                leftIcon={<ArrowLeft size={16} />}
                isDisabled={isCompleted || currentIndex <= 0}
                onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              >
                Previous
              </Button>
              {!isCompleted ? (
                <Badge borderRadius="full" px={3} py={1} bg={brand50} color={questionBadgeText}>
                  {unansweredCount === 0 ? "All answered" : `${unansweredCount} waiting`}
                </Badge>
              ) : null}
            </HStack>

            <HStack spacing={2}>
              {!isCompleted && currentIndex < quiz.questions.length - 1 ? (
                <Button
                  colorScheme="brand"
                  borderRadius="full"
                  rightIcon={<ArrowRight size={16} />}
                  onClick={() => setCurrentIndex((index) => Math.min(quiz.questions.length - 1, index + 1))}
                >
                  Next question
                </Button>
              ) : !isCompleted ? (
                <Button
                  colorScheme="brand"
                  borderRadius="full"
                  rightIcon={<Send size={16} />}
                  isLoading={isSubmitting}
                  loadingText="Submitting"
                  onClick={submitQuiz}
                >
                  Submit quiz
                </Button>
              ) : (
                <Button colorScheme="brand" borderRadius="full" onClick={onClose}>
                  Back to course
                </Button>
              )}
            </HStack>
          </Flex>
        </Box>
      </MotionBox>
    </div>
  );
}
