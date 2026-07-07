"use client";

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  CircularProgress,
  CircularProgressLabel,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Grid,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import {
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  LayoutGrid,
  PlayCircle,
  TrendingUp,
  Video,
} from "lucide-react";
import type { ReactNode } from "react";
import ScormQuizReviewContent from "./ScormQuizReviewContent";
import { clampLearningProgress, getLearningStatusMeta } from "./progressPresentation";

type LearnerReviewDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  managerStore: any;
  selectedCourse: any;
  selectCourse: (courseId: string) => Promise<void>;
  submitReview: (trackingId: string, interaction: any, marks: number) => void | Promise<void>;
  selectedCourseId: string;
  isAnswersLoading: boolean;
};

function formatScore(score?: number | null) {
  if (score == null || Number.isNaN(score)) return "--";
  return `${Math.round(score)}%`;
}

function formatTime(value?: string | number | null) {
  if (typeof value === "string") {
    return value || "--";
  }

  if (!value) {
    return "--";
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function getProgressColor(progress: number) {
  if (progress >= 100) return "green";
  if (progress > 0) return "blue";
  return "gray";
}

function summarizeCourseSections(modules: any[] = []) {
  const sections = modules.flatMap((moduleRecord) => moduleRecord.sections || []);
  const completed = sections.filter((sectionRecord) => {
    return getLearningStatusMeta(sectionRecord.lessonStatus, sectionRecord.progress).state === "completed";
  }).length;

  return {
    total: sections.length,
    completed,
  };
}

function getSectionContentIcon(sectionRecord: any) {
  const contentType = String(sectionRecord?.contentType || "").trim().toLowerCase();

  if (contentType === "video") return Video;
  if (contentType === "document") return FileText;
  return PlayCircle;
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  accent?: string;
}) {
  const bg = useColorModeValue("gray.50", "whiteAlpha.50");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Box bg={bg} borderWidth="1px" borderColor={border} borderRadius="xl" p={4}>
      <HStack spacing={2} mb={2}>
        <Box color={accent || muted}>{icon}</Box>
        <Text fontSize="xs" textTransform="uppercase" letterSpacing="wide" color={muted} fontWeight="600">
          {label}
        </Text>
      </HStack>
      <Text fontSize="lg" fontWeight="bold" color={accent}>
        {value}
      </Text>
    </Box>
  );
}

function ProgressRing({ value }: { value: number }) {
  const safeValue = clampLearningProgress(value);
  const color = getProgressColor(safeValue);

  return (
    <CircularProgress value={safeValue} color={`${color}.400`} trackColor="gray.100" size="54px" thickness="9px">
      <CircularProgressLabel fontSize="10px" fontWeight="bold">
        {safeValue}%
      </CircularProgressLabel>
    </CircularProgress>
  );
}

function SectionRow({ sectionRecord }: { sectionRecord: any }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const bg = useColorModeValue("white", "gray.800");
  const completedBg = useColorModeValue("green.50", "green.900");
  const completedBorder = useColorModeValue("green.200", "green.700");
  const statusMeta = getLearningStatusMeta(sectionRecord.lessonStatus, sectionRecord.progress);
  const SectionIcon = getSectionContentIcon(sectionRecord);

  return (
    <Flex
      align="center"
      gap={4}
      px={4}
      py={3}
      bg={statusMeta.state === "completed" ? completedBg : bg}
      borderWidth="1px"
      borderColor={statusMeta.state === "completed" ? completedBorder : border}
      borderRadius="lg"
    >
      <Box
        w={10}
        h={10}
        borderRadius="full"
        bg={statusMeta.state === "completed" ? "green.500" : `${statusMeta.colorScheme}.50`}
        color={statusMeta.state === "completed" ? "white" : `${statusMeta.colorScheme}.500`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        {statusMeta.state === "completed" ? <CheckCircle size={18} /> : <SectionIcon size={18} />}
      </Box>

      <Box flex="1" minW={0}>
        <HStack spacing={3} flexWrap="wrap" mb={1}>
          <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
            {sectionRecord.title}
          </Text>
          <Badge colorScheme={statusMeta.colorScheme} fontSize="10px" borderRadius="full" px={2.5} py={1}>
            {statusMeta.label}
          </Badge>
          {statusMeta.state === "completed" ? (
            <Badge colorScheme="green" fontSize="10px" borderRadius="full" px={2.5} py={1}>
              Done
            </Badge>
          ) : null}
        </HStack>

        <HStack spacing={3} mt={1} flexWrap="wrap">
          <Text fontSize="xs" color={muted}>
            Score: {formatScore(sectionRecord.score)}
          </Text>
          <Text fontSize="xs" color={muted}>
            Attempts: {sectionRecord.attempts}
          </Text>
          <Text fontSize="xs" color={muted}>
            Time: {formatTime(sectionRecord.totalTime)}
          </Text>
        </HStack>
      </Box>

      <ProgressRing value={sectionRecord.progress} />
    </Flex>
  );
}

function ModuleAccordionItem({ moduleRecord }: { moduleRecord: any }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const headerBg = useColorModeValue("gray.50", "gray.750");
  const statusMeta = getLearningStatusMeta(moduleRecord.lessonStatus, moduleRecord.progress);

  return (
    <AccordionItem borderWidth="1px" borderColor={border} borderRadius="xl" mb={3} overflow="hidden">
      <AccordionButton py={4} px={5} bg={headerBg} _hover={{ bg: headerBg }} _expanded={{ bg: headerBg }}>
        <Flex flex="1" align="center" gap={4}>
          <ProgressRing value={moduleRecord.progress} />
          <Box flex="1" textAlign="left">
            <HStack spacing={3} flexWrap="wrap">
              <Text fontWeight="semibold" fontSize="sm">
                {moduleRecord.title}
              </Text>
              <Badge colorScheme={statusMeta.colorScheme} borderRadius="full" px={3} py={1} fontSize="10px">
                {statusMeta.label}
              </Badge>
            </HStack>

            <HStack spacing={3} mt={1} flexWrap="wrap">
              <Text fontSize="xs" color={muted}>
                {moduleRecord.sectionsCompleted || 0}/{moduleRecord.sectionCount || moduleRecord.sections?.length || 0} done
              </Text>
              <Text fontSize="xs" color={muted}>
                Score: {formatScore(moduleRecord.score)}
              </Text>
              <Text fontSize="xs" color={muted}>
                Time: {formatTime(moduleRecord.totalTime)}
              </Text>
            </HStack>
          </Box>
          <AccordionIcon color={muted} />
        </Flex>
      </AccordionButton>
      <AccordionPanel p={4}>
        <Stack spacing={2}>
          {moduleRecord.sections?.map((sectionRecord: any) => (
            <SectionRow key={sectionRecord.sectionId} sectionRecord={sectionRecord} />
          ))}
        </Stack>
      </AccordionPanel>
    </AccordionItem>
  );
}

function CourseCard({
  course,
  isActive,
  onSelect,
}: {
  course: any;
  isActive: boolean;
  onSelect: () => void;
}) {
  const border = useColorModeValue("gray.200", "gray.700");
  const activeBg = useColorModeValue("teal.50", "teal.900");
  const bg = useColorModeValue("white", "gray.800");
  const muted = useColorModeValue("gray.500", "gray.400");
  const courseSections = summarizeCourseSections(course.modules || []);
  const statusMeta = getLearningStatusMeta(course.lessonStatus, course.progress);

  return (
    <Box
      borderWidth="2px"
      borderColor={isActive ? "teal.400" : border}
      borderRadius="xl"
      p={4}
      bg={isActive ? activeBg : bg}
      cursor="pointer"
      onClick={onSelect}
      transition="all 0.15s"
      _hover={{ borderColor: "teal.300", shadow: "sm" }}
      position="relative"
    >
      {isActive ? (
        <Box position="absolute" top={3} right={3} w={2} h={2} borderRadius="full" bg="teal.400" />
      ) : null}

      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box flex="1" minW={0}>
          <Text fontWeight="semibold" fontSize="sm" noOfLines={2} mb={2}>
            {course.title}
          </Text>

          <HStack spacing={2} flexWrap="wrap" mb={2}>
            <Badge colorScheme={statusMeta.colorScheme} borderRadius="full" px={2.5} py={1} fontSize="10px">
              {statusMeta.label}
            </Badge>
            <Badge colorScheme="teal" borderRadius="full" px={2.5} py={1} fontSize="10px">
              {courseSections.completed}/{courseSections.total} done
            </Badge>
            {course.answerSummary?.pending > 0 ? (
              <Badge colorScheme="orange" borderRadius="full" px={2.5} py={1} fontSize="10px">
                {course.answerSummary.pending} pending
              </Badge>
            ) : null}
          </HStack>

          <VStack align="stretch" spacing={1}>
            <Text fontSize="xs" color={muted}>
              Score: {formatScore(course.score)}
            </Text>
            <Text fontSize="xs" color={muted}>
              Time: {formatTime(course.totalTime)}
            </Text>
          </VStack>
        </Box>

        <ProgressRing value={course.progress} />
      </Flex>
    </Box>
  ); 
}

export default function LearnerReviewDrawer({
  isOpen,
  onClose,
  managerStore,
  selectedCourse,
  selectedCourseId,
  isAnswersLoading,
  selectCourse,
  submitReview,
}: LearnerReviewDrawerProps) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const divider = useColorModeValue("gray.100", "gray.700");

  const learner = managerStore.learnerProgress?.learner;
  const summary = managerStore.learnerProgress?.summary;
  const courses = managerStore.learnerProgress?.courses || [];
  const selectedCourseSectionSummary = summarizeCourseSections(selectedCourse?.modules || []);
  const answersLoading = isAnswersLoading || managerStore.isLearnerAnswersLoading;

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="full">
      <DrawerOverlay backdropFilter="blur(6px)" bg="blackAlpha.400" />
      <DrawerContent maxW={{ base: "100%", md: "640px", lg: "70vw" }}>
        <DrawerCloseButton top={4} right={4} />

        <DrawerHeader px={6} pt={6} pb={4} borderBottomWidth="1px" borderColor={divider}>
          <HStack spacing={3}>
            <Box p={2} bg="teal.50" borderRadius="lg" color="teal.600">
              <GraduationCap size={20} />
            </Box>
            <Box>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="wide" color={muted} fontWeight="600">
                Learner Review
              </Text>
              {learner ? (
                <Heading size="md" mt={0.5}>
                  {learner.name}
                </Heading>
              ) : null}
            </Box>
          </HStack>
        </DrawerHeader>

        <DrawerBody px={6} py={5}>
          {managerStore.isLearnerProgressLoading || !managerStore.learnerProgress ? (
            <Flex justify="center" align="center" direction="column" gap={3} py={20}>
              <Spinner size="lg" color="teal.400" />
              <Text color={muted} fontSize="sm">
                Loading learner details...
              </Text>
            </Flex>
          ) : (
            <Stack spacing={7}>
              <Box>
                <Text color={muted} fontSize="sm">
                  {learner?.email || learner?.username || ""}
                </Text>
                <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={3} mt={4}>
                  <StatCard
                    icon={<TrendingUp size={14} />}
                    label="Overall"
                    value={`${Math.round(summary.overallProgress)}%`}
                    accent="teal.500"
                  />
                  <StatCard
                    icon={<CheckCircle size={14} />}
                    label="Avg Score"
                    value={formatScore(summary.avgScore)}
                    accent="blue.500"
                  />
                  <StatCard
                    icon={<BookOpen size={14} />}
                    label="Courses"
                    value={summary.courseCount}
                    accent="purple.500"
                  />
                </Grid>
              </Box>

              <Box>
                <HStack mb={3}>
                  <LayoutGrid size={15} color="var(--chakra-colors-gray-400)" />
                  <Heading size="xs" textTransform="uppercase" letterSpacing="wide" color={muted}>
                    Courses
                  </Heading>
                </HStack>

                <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }} gap={3}>
                  {courses.map((course: any) => (
                    <CourseCard
                      key={course.courseId}
                      course={course}
                      isActive={selectedCourseId === course.courseId}
                      onSelect={() => void selectCourse(course.courseId)}
                    />
                  ))}
                </Grid>
              </Box>

              {selectedCourse ? (
                <>
                  <Box>
                    <HStack justify="space-between" mb={3} flexWrap="wrap" gap={2}>
                      <HStack>
                        <Clock size={15} color="var(--chakra-colors-gray-400)" />
                        <Heading size="xs" textTransform="uppercase" letterSpacing="wide" color={muted}>
                          Module Breakdown
                        </Heading>
                      </HStack>
                      <HStack spacing={2} flexWrap="wrap">
                        <Badge colorScheme="teal" borderRadius="full" px={3} py={1} fontSize="xs">
                          {selectedCourse.title}
                        </Badge>
                        <Badge colorScheme="green" borderRadius="full" px={3} py={1} fontSize="xs">
                          {selectedCourseSectionSummary.completed}/{selectedCourseSectionSummary.total} completed
                        </Badge>
                      </HStack>
                    </HStack>

                    <Accordion allowMultiple defaultIndex={[0]}>
                      {selectedCourse.modules?.map((moduleRecord: any) => (
                        <ModuleAccordionItem key={moduleRecord.moduleId} moduleRecord={moduleRecord} />
                      ))}
                    </Accordion>
                  </Box>

                  <Box>
                    <HStack justify="space-between" mb={3} flexWrap="wrap" gap={2}>
                      <Heading size="xs" textTransform="uppercase" letterSpacing="wide" color={muted}>
                        Answers Review
                      </Heading>
                      <Badge colorScheme="teal" borderRadius="full" px={3} py={1} fontSize="xs">
                        {selectedCourse.title}
                      </Badge>
                    </HStack>

                    <ScormQuizReviewContent
                      key={selectedCourseId}
                      sections={managerStore.learnerAnswers}
                      isLoading={answersLoading}
                      mode="manager"
                      progressSummary={{
                        progressPercent: Number(selectedCourse.progress || 0),
                        sectionsCompleted: selectedCourseSectionSummary.completed,
                        totalSections: selectedCourseSectionSummary.total,
                      }}
                      onSaveReview={submitReview}
                      isSubmittingReview={managerStore.isSubmittingReview}
                      emptyState="No SCORM answers have been captured for this course yet."
                    />
                  </Box>
                </>
              ) : null}
            </Stack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
