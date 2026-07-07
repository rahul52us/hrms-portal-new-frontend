"use client";

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  Grid,
  HStack,
  Image,
  Input,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useBreakpointValue,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { AlertCircle, CheckCircle2, Layers3, Trophy, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  formatQuestionTitle,
  getEffectiveInteractionResult,
  groupAnswerSections,
  isReviewableInteraction,
  ScormAnswerSectionRecord,
  ScormInteractionReview,
  summarizeAnswerSections,
} from "./quizReviewTypes";
import { buildCourseAssetUrl } from "./sectionTracking";

type ScormQuizReviewContentProps = {
  sections: ScormAnswerSectionRecord[];
  isLoading?: boolean;
  mode?: "learner" | "manager";
  compact?: boolean;
  emptyState?: string;
  onSaveReview?: (
    trackingId: string,
    interaction: ScormInteractionReview,
    marks: number
  ) => void | Promise<void>;
  isSubmittingReview?: boolean;
  showOnlyReviewed?: boolean;
  progressSummary?: {
    progressPercent?: number | null;
    sectionsCompleted?: number | null;
    totalSections?: number | null;
  };
};

function formatResponse(interaction: Pick<ScormInteractionReview, "learnerResponseText" | "learnerResponse" | "learnerResponseRaw">) {
  const text = String(
    interaction.learnerResponseText ||
    interaction.learnerResponse ||
    interaction.learnerResponseRaw ||
    ""
  ).trim();
  if (
    !text ||
    text.toLowerCase().includes("loading") ||
    ["undefined", "null", "[object object]"].includes(text.toLowerCase()) ||
    /^data:[^;]+;base64,/i.test(text)
  ) {
    return "Not answered";
  }
  return text;
}

function getCorrectResponses(
  interaction: Pick<ScormInteractionReview, "correctResponseTexts" | "correctResponses" | "correctResponsesRaw">
) {
  const responseSets = [
    interaction.correctResponseTexts,
    interaction.correctResponses,
    interaction.correctResponsesRaw,
  ];

  for (const values of responseSets) {
    const normalizedValues = Array.isArray(values)
      ? values.map((value) => String(value || "").trim()).filter(Boolean)
      : [];

    if (normalizedValues.length) {
      return normalizedValues;
    }
  }

  return [];
}

type StatusMeta = {
  label: string;
  colorScheme: "green" | "red" | "orange" | "gray" | "blue";
  icon: React.ReactNode;
  borderColor: string;
};

function getInteractionStatusMeta(interaction: ScormInteractionReview): StatusMeta {
  const reviewable = isReviewableInteraction(interaction);
  const effectiveResult = getEffectiveInteractionResult(interaction);
  const awardedMarks = Number(interaction.review?.marks);
  const possibleMarks =
    isReviewableInteraction(interaction)
      ? Math.max(0, Number(interaction.maxMarks ?? 10) || 10)
      : 1;

  if (reviewable) {
    if (interaction.review?.status === "reviewed" && Number.isFinite(awardedMarks) && awardedMarks >= possibleMarks) {
      return {
        label: `Reviewed: ${awardedMarks}/${possibleMarks}`,
        colorScheme: "green",
        icon: <CheckCircle2 size={15} />,
        borderColor: "green.300",
      };
    }

    if (interaction.review?.status === "reviewed" && Number.isFinite(awardedMarks) && awardedMarks <= 0) {
      return {
        label: `Reviewed: ${awardedMarks}/${possibleMarks}`,
        colorScheme: "red",
        icon: <XCircle size={15} />,
        borderColor: "red.300",
      };
    }

    if (interaction.review?.status === "reviewed") {
      return {
        label: `Reviewed: ${Number.isFinite(awardedMarks) ? awardedMarks : 0}/${possibleMarks}`,
        colorScheme: "blue",
        icon: <Trophy size={15} />,
        borderColor: "blue.300",
      };
    }

    return {
      label: "Pending Review",
      colorScheme: "orange",
      icon: <AlertCircle size={15} />,
      borderColor: "orange.300",
    };
  }

  if (effectiveResult === "correct" || effectiveResult === "passed") {
    return {
      label: "Correct",
      colorScheme: "green",
      icon: <CheckCircle2 size={15} />,
      borderColor: "green.300",
    };
  }

  if (effectiveResult === "incorrect" || effectiveResult === "failed" || effectiveResult === "wrong") {
    return {
      label: "Incorrect",
      colorScheme: "red",
      icon: <XCircle size={15} />,
      borderColor: "red.300",
    };
  }

  if (effectiveResult === "unanswered" || formatResponse(interaction) === "Not answered") {
    return {
      label: "Not answered",
      colorScheme: "gray",
      icon: <AlertCircle size={15} />,
      borderColor: "gray.300",
    };
  }

  if (effectiveResult === "neutral" || effectiveResult === "unanticipated") {
    return {
      label: "Neutral",
      colorScheme: "blue",
      icon: <AlertCircle size={15} />,
      borderColor: "blue.200",
    };
  }

  return {
    label: "Neutral",
    colorScheme: "gray",
    icon: <AlertCircle size={15} />,
    borderColor: "gray.300",
  };
}

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Box bg={bg} borderWidth="1px" borderColor={accent || border} borderRadius="2xl" p={4}>
      <HStack spacing={2} color={accent || muted}>
        {icon}
        <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" fontWeight="600">
          {label}
        </Text>
      </HStack>
      <Text mt={2} fontSize="xl" fontWeight="bold">
        {value}
      </Text>
    </Box>
  );
}

function AnswerBlock({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  const bg = useColorModeValue("gray.50", "whiteAlpha.50");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Box bg={bg} borderWidth="1px" borderColor={border} borderRadius="lg" p={compact ? 2.5 : 3}>
      <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={muted} fontWeight="600" mb={1}>
        {label}
      </Text>
      <Text fontSize="sm">{value}</Text>
    </Box>
  );
}

function QuestionPromptAssets({ assetPaths = [] }: { assetPaths?: string[] }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const normalizedPaths = Array.from(
    new Set(assetPaths.map((assetPath) => String(assetPath || "").trim()).filter(Boolean))
  );

  if (!normalizedPaths.length) {
    return null;
  }

  return (
    <SimpleGrid columns={{ base: 1, md: Math.min(normalizedPaths.length, 2) }} spacing={3}>
      {normalizedPaths.map((assetPath) => (
        <Box key={assetPath} borderWidth="1px" borderColor={border} borderRadius="xl" overflow="hidden">
          <Image
            src={buildCourseAssetUrl(assetPath)}
            alt="SCORM question prompt"
            width="100%"
            maxH="360px"
            objectFit="contain"
            bg="gray.50"
          />
        </Box>
      ))}
    </SimpleGrid>
  );
}

function ReviewStatusBlock({ interaction }: { interaction: ScormInteractionReview }) {
  const bg = useColorModeValue("gray.50", "whiteAlpha.50");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  if (!isReviewableInteraction(interaction)) {
    return null;
  }

  const reviewed = interaction.review?.status === "reviewed";
  const possibleMarks = Math.max(0, Number(interaction.maxMarks ?? 10) || 10);
  const marks = Number(interaction.review?.marks);

  return (
    <Box bg={bg} borderWidth="1px" borderColor={border} borderRadius="xl" p={3}>
      <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={muted} fontWeight="600" mb={1}>
        Status
      </Text>
      <Text fontSize="sm">{reviewed ? "Reviewed" : "Pending Review"}</Text>
      {reviewed && Number.isFinite(marks) ? (
        <Text mt={2} fontSize="sm" fontWeight="semibold">
          Marks: {marks}/{possibleMarks}
        </Text>
      ) : null}
    </Box>
  );
}

function ManagerEvaluationPanel({
  interaction,
  trackingId,
  onSaveReview,
  isSubmittingReview,
}: {
  interaction: ScormInteractionReview;
  trackingId: string;
  onSaveReview?: (
    trackingId: string,
    interaction: ScormInteractionReview,
    marks: number
  ) => void | Promise<void>;
  isSubmittingReview?: boolean;
}) {
  const border = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");
  const [marksInput, setMarksInput] = useState("");
  const reviewable = isReviewableInteraction(interaction);
  const possibleMarks = Math.max(0, Number(interaction.maxMarks ?? 10) || 10);
  const numericMarks = Number(marksInput);
  const isValidMarks =
    marksInput.trim().length > 0 &&
    Number.isFinite(numericMarks) &&
    numericMarks >= 0 &&
    numericMarks <= possibleMarks;

  useEffect(() => {
    if (interaction.review?.status === "reviewed" && interaction.review?.marks !== null && interaction.review?.marks !== undefined) {
      setMarksInput(String(interaction.review.marks));
      return;
    }

    setMarksInput("");
  }, [interaction._id, interaction.review?.marks, interaction.review?.status]);

  if (!reviewable) {
    return null;
  }

  return (
    <Box borderWidth="1px" borderColor={border} borderRadius="xl" p={4} bg={bg}>
      <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color="gray.500" fontWeight="600" mb={3}>
        Marks Review
      </Text>
      <Stack spacing={3}>
        <FormControl>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.600">
              Award marks for this answer
            </Text>
            <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
              Out of {possibleMarks}
            </Badge>
          </HStack>
          <Input
            type="number"
            min={0}
            max={possibleMarks}
            step={0.5}
            value={marksInput}
            onChange={(event) => setMarksInput(event.target.value)}
            placeholder={`Enter marks between 0 and ${possibleMarks}`}
          />
        </FormControl>
        <Button
          colorScheme="blue"
          borderRadius="lg"
          leftIcon={<Trophy size={14} />}
          onClick={() => onSaveReview?.(trackingId, interaction, numericMarks)}
          isLoading={isSubmittingReview}
          isDisabled={!isValidMarks}
        >
          Submit marks
        </Button>
      </Stack>
    </Box>
  );
}

function LoadingState() {
  return (
    <Stack spacing={4}>
      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
        {[0, 1, 2].map((item) => (
          <Box key={item} borderWidth="1px" borderRadius="2xl" p={4}>
            <Skeleton height="10px" width="90px" />
            <Skeleton mt={3} height="24px" width="80px" />
          </Box>
        ))}
      </SimpleGrid>
      {[0, 1].map((item) => (
        <Box key={item} borderWidth="1px" borderRadius="2xl" p={4}>
          <Skeleton height="16px" width="180px" />
          <Skeleton mt={4} height="14px" width="100%" />
          <Skeleton mt={2} height="14px" width="88%" />
          <Skeleton mt={2} height="14px" width="92%" />
        </Box>
      ))}
    </Stack>
  );
}

export default function ScormQuizReviewContent({
  sections,
  isLoading = false,
  mode = "learner",
  compact = false,
  emptyState = "Quiz answers will appear here after the SCORM lesson commits progress.",
  onSaveReview,
  isSubmittingReview = false,
  showOnlyReviewed = false,
  progressSummary,
}: ScormQuizReviewContentProps) {
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const sectionBg = useColorModeValue("gray.50", "gray.900");
  const moduleBg = useColorModeValue("white", "gray.800");
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;
  const useCompactLayout = compact || isMobile;

  const moduleGroups = groupAnswerSections(sections, { showOnlyReviewed });
  const visibleSections = moduleGroups.flatMap((moduleGroup) => moduleGroup.sections);
  const summary = summarizeAnswerSections(visibleSections);
  const hasProgressSummary =
    progressSummary?.progressPercent !== null &&
    progressSummary?.progressPercent !== undefined &&
    progressSummary?.sectionsCompleted !== null &&
    progressSummary?.sectionsCompleted !== undefined &&
    progressSummary?.totalSections !== null &&
    progressSummary?.totalSections !== undefined;

  if (isLoading && moduleGroups.length === 0) {
    return <LoadingState />;
  }

  if (moduleGroups.length === 0) {
    return (
      <Box
        borderWidth="1px"
        borderColor={border}
        borderRadius={compact ? "lg" : "2xl"}
        p={compact ? 3 : 6}
        textAlign="center"
      >
        <Text color={muted} fontSize="sm">
          {emptyState}
        </Text>
      </Box>
    );
  }

  return (
    <Stack spacing={useCompactLayout ? 3 : 5}>
      {useCompactLayout ? (
        <HStack spacing={2} flexWrap="wrap">
          <Badge colorScheme="blue" borderRadius="full" px={2.5} py={1}>
            {summary.totalQuestions} question{summary.totalQuestions !== 1 ? "s" : ""}
          </Badge>
          <Badge colorScheme="green" borderRadius="full" px={2.5} py={1}>
            Marks {summary.awardedMarks}/{summary.possibleMarks}
          </Badge>
          {mode === "manager" && summary.pending ? (
            <Badge colorScheme="orange" borderRadius="full" px={2.5} py={1}>
              {summary.pending} pending
            </Badge>
          ) : null}
        </HStack>
      ) : (
        <SimpleGrid columns={{ base: 1, md: mode === "manager" ? 3 : 2 }} spacing={3}>
          {hasProgressSummary ? (
            <SummaryCard
              label="Course Progress"
              value={`${Math.round(Number(progressSummary?.progressPercent || 0))}%`}
              icon={<Trophy size={14} />}
              accent="blue.400"
            />
          ) : null}
          <SummaryCard
            label="Marks"
            value={`${summary.awardedMarks} / ${summary.possibleMarks}`}
            icon={<Layers3 size={14} />}
            accent="green.400"
          />
          {mode === "manager" ? (
            <SummaryCard
              label="Pending Review"
              value={summary.pending}
              icon={<AlertCircle size={14} />}
              accent="orange.400"
            />
          ) : null}
        </SimpleGrid>
      )}

      {hasProgressSummary && !useCompactLayout ? (
        <Box>
          <Flex justify="space-between" mb={1.5}>
            <Text fontSize="xs" fontWeight="semibold">Progress</Text>
            <Text fontSize="xs" color={muted}>
              {Math.round(Number(progressSummary?.progressPercent || 0))}%
            </Text>
          </Flex>
          <Progress
            value={Number(progressSummary?.progressPercent || 0)}
            size="sm"
            colorScheme={Number(progressSummary?.progressPercent || 0) >= 100 ? "green" : "blue"}
            borderRadius="full"
          />
        </Box>
      ) : null}

      <Accordion allowMultiple defaultIndex={[0]}>
        {moduleGroups.map((moduleGroup, moduleIndex) => (
          <AccordionItem
            key={moduleGroup.moduleId || `module-${moduleIndex}`}
            borderWidth="1px"
            borderColor={border}
            borderRadius={useCompactLayout ? "xl" : "2xl"}
            bg={moduleBg}
            overflow="hidden"
            mb={useCompactLayout ? 2 : 3}
          >
            <AccordionButton px={useCompactLayout ? 3 : 5} py={useCompactLayout ? 2.5 : 4} _hover={{ bg: "transparent" }}>
              <Flex
                flex="1"
                align={{ base: "stretch", md: "center" }}
                justify="space-between"
                gap={useCompactLayout ? 2.5 : 4}
                direction={{ base: "column", md: "row" }}
              >
                <Box textAlign="left">
                  <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={muted} fontWeight="600">
                    Module {moduleIndex + 1}
                  </Text>
                  <Text mt={useCompactLayout ? 0.5 : 1} fontSize={useCompactLayout ? "sm" : "md"} fontWeight="semibold">
                    {moduleGroup.moduleTitle}
                  </Text>
                </Box>
                <HStack spacing={2} flexWrap="wrap" justify={{ base: "flex-start", md: "flex-end" }} pr={1}>
                  <Badge colorScheme="teal" borderRadius="full" px={useCompactLayout ? 2.5 : 3} py={1} fontSize="10px">
                    {moduleGroup.sections.length} section{moduleGroup.sections.length !== 1 ? "s" : ""}
                  </Badge>
                  <Badge colorScheme="green" variant="subtle" borderRadius="full" px={useCompactLayout ? 2.5 : 3} py={1} fontSize="10px">
                    Marks {moduleGroup.awardedMarks}/{moduleGroup.possibleMarks}
                  </Badge>
                  <AccordionIcon color={muted} />
                </HStack>
              </Flex>
            </AccordionButton>

            <AccordionPanel px={useCompactLayout ? 2.5 : 4} pb={useCompactLayout ? 2.5 : 4} pt={0}>
              <Accordion allowMultiple defaultIndex={[0]}>
                {moduleGroup.sections.map((section, sectionIndex) => {
                  const statusValue = String(section.lessonStatus || "").toLowerCase();
                  const sectionStatusColor =
                    statusValue === "completed" || statusValue === "passed"
                      ? "green"
                      : statusValue === "failed"
                        ? "red"
                        : "gray";

                  return (
                    <AccordionItem
                      key={section._id}
                      borderWidth="1px"
                      borderColor={border}
                      borderRadius={useCompactLayout ? "lg" : "xl"}
                      bg={sectionBg}
                      overflow="hidden"
                      mb={useCompactLayout ? 2 : 3}
                    >
                      <AccordionButton px={useCompactLayout ? 2.5 : 4} py={useCompactLayout ? 2.5 : 3} _hover={{ bg: "transparent" }}>
                        <Flex
                          flex="1"
                          align={{ base: "stretch", md: "center" }}
                          justify="space-between"
                          gap={useCompactLayout ? 2.5 : 4}
                          direction={{ base: "column", md: "row" }}
                        >
                          <Box textAlign="left">
                            <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={muted} fontWeight="600">
                              Section {sectionIndex + 1}
                            </Text>
                            <Text mt={useCompactLayout ? 0.5 : 1} fontSize={useCompactLayout ? "sm" : undefined} fontWeight="semibold">
                              {section.sectionTitle || section.sectionId}
                            </Text>
                          </Box>
                          <HStack spacing={2} flexWrap="wrap" justify={{ base: "flex-start", md: "flex-end" }} pr={1}>
                            <Badge colorScheme={sectionStatusColor} borderRadius="full" px={useCompactLayout ? 2.5 : 3} py={1} fontSize="10px">
                              {section.lessonStatus?.replace(/_/g, " ") || "not started"}
                            </Badge>
                            <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={useCompactLayout ? 2.5 : 3} py={1} fontSize="10px">
                              Marks {section.awardedMarks ?? 0}/{section.possibleMarks ?? 0}
                            </Badge>
                            <AccordionIcon color={muted} />
                          </HStack>
                        </Flex>
                      </AccordionButton>

                      <AccordionPanel px={useCompactLayout ? 1.5 : 3} pb={useCompactLayout ? 2 : 3} pt={0}>
                        <Accordion allowMultiple>
                          {section.interactions.map((interaction, questionIndex) => {
                            const statusMeta = getInteractionStatusMeta(interaction);
                            const questionTitle = formatQuestionTitle(interaction, questionIndex);
                            const correctResponses = getCorrectResponses(interaction);

                            return (
                              <AccordionItem
                                key={interaction.uniqueKey || interaction._id}
                                borderWidth="1px"
                                borderColor={statusMeta.borderColor}
                                borderRadius={useCompactLayout ? "lg" : "xl"}
                                bg={moduleBg}
                                overflow="hidden"
                                mb={useCompactLayout ? 2 : 3}
                              >
                                <AccordionButton px={useCompactLayout ? 2.5 : 4} py={useCompactLayout ? 2.5 : 3} _hover={{ bg: "transparent" }}>
                                  <Flex
                                    flex="1"
                                    align={{ base: "stretch", md: "center" }}
                                    justify="space-between"
                                    gap={useCompactLayout ? 2.5 : 3}
                                    minW={0}
                                    direction={{ base: "column", md: "row" }}
                                  >
                                    <HStack spacing={2.5} minW={0} flex="1" align="center">
                                      <Box
                                        color={
                                          statusMeta.colorScheme === "green"
                                            ? "green.500"
                                            : statusMeta.colorScheme === "red"
                                              ? "red.500"
                                              : statusMeta.colorScheme === "orange"
                                                ? "orange.500"
                                                : "gray.400"
                                        }
                                        flexShrink={0}
                                      >
                                        {statusMeta.icon}
                                      </Box>
                                      <Box minW={0}>
                                        <Text fontWeight="semibold" fontSize="sm" noOfLines={isMobile ? 2 : 1}>
                                          {questionTitle}
                                        </Text>
                                      </Box>
                                    </HStack>
                                    <HStack spacing={2} flexShrink={0} justify={{ base: "space-between", md: "flex-end" }} w={{ base: "full", md: "auto" }}>
                                      <Badge
                                        colorScheme={statusMeta.colorScheme}
                                        borderRadius="full"
                                        px={useCompactLayout ? 2.5 : 3}
                                        py={1}
                                        fontSize="10px"
                                        maxW={{ base: "calc(100% - 28px)", md: "none" }}
                                        whiteSpace="normal"
                                        textAlign="center"
                                      >
                                        {statusMeta.label}
                                      </Badge>
                                      <AccordionIcon color={muted} />
                                    </HStack>
                                  </Flex>
                                </AccordionButton>

                                <AccordionPanel px={useCompactLayout ? 2.5 : 4} pb={useCompactLayout ? 2.5 : 4} pt={0}>
                                  <Stack spacing={3}>
                                    <QuestionPromptAssets assetPaths={interaction.questionAssetPaths} />

                                    <Grid
                                      templateColumns={{
                                        base: "1fr",
                                        md: correctResponses.length ? "repeat(2, minmax(0, 1fr))" : "1fr",
                                      }}
                                      gap={3}
                                    >
                                      <AnswerBlock label="Your Answer" value={formatResponse(interaction)} compact={useCompactLayout} />
                                      {correctResponses.length ? (
                                        <AnswerBlock
                                          label="Correct Answer"
                                          value={correctResponses.join(", ")}
                                          compact={useCompactLayout}
                                        />
                                      ) : null}
                                    </Grid>

                                    {interaction.score !== null && interaction.score !== undefined ? (
                                      <Text fontSize="xs" color={muted}>
                                        Score: {interaction.score}
                                        {interaction.maxMarks !== null && interaction.maxMarks !== undefined
                                          ? ` / ${interaction.maxMarks}`
                                          : ""}
                                      </Text>
                                    ) : null}

                                    <ReviewStatusBlock interaction={interaction} />

                                    {mode === "manager" ? (
                                      <ManagerEvaluationPanel
                                        interaction={interaction}
                                        trackingId={section._id}
                                        onSaveReview={onSaveReview}
                                        isSubmittingReview={isSubmittingReview}
                                      />
                                    ) : null}
                                  </Stack>
                                </AccordionPanel>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </AccordionPanel>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>

      {mode === "manager" ? (
        <Text color={muted} fontSize="sm">
          Only subjective or input-style answers need manual marking. Auto-graded answers remain read-only.
        </Text>
      ) : null}
    </Stack>
  );
}
