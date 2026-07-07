"use client";

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Collapse,
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
  Icon,
  Input,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useBreakpointValue,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  Filter,
  RefreshCw,
  Target,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import stores from "@/app/store/stores";
import ScormQuizReviewContent from "@/app/dashboard/course/scorm/ScormQuizReviewContent";
import {
  ScormAnswerSectionRecord,
  ScormInteractionReview,
} from "@/app/dashboard/course/scorm/quizReviewTypes";
import {
  EMPTY_LEARNER_RESULTS_FILTERS,
  LearnerResultDetail,
  LearnerResultOption,
  LearnerResultRow,
  LearnerResultsFilters,
} from "./types";

type Props = {
  role: "superadmin" | "admin" | "departmenthead";
  showHeader?: boolean;
};

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
}

function statusMeta(status: string) {
  switch (status) {
    case "completed":
    case "passed":
      return { label: status === "passed" ? "Passed" : "Completed", color: "green" };
    case "failed":
      return { label: "Failed", color: "red" };
    case "in_progress":
      return { label: "In progress", color: "blue" };
    case "not_available":
      return { label: "Not graded", color: "gray" };
    default:
      return { label: "Not started", color: "gray" };
  }
}

function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options?: LearnerResultOption[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      size="sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      borderRadius="lg"
      bg={useColorModeValue("white", "gray.800")}
    >
      <option value="">{placeholder}</option>
      {(options || []).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: React.ElementType;
  color: string;
}) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  return (
    <Box bg={bg} borderWidth="1px" borderColor={border} borderRadius="xl" p={3.5} boxShadow="sm">
      <Flex justify="space-between" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" color="gray.500" fontWeight="semibold">
            {label}
          </Text>
          <Text mt={1} fontSize="xl" fontWeight="800">
            {value}
          </Text>
          <Text mt={1} fontSize="xs" color="gray.500" noOfLines={1}>
            {helper}
          </Text>
        </Box>
        <Flex
          boxSize="34px"
          borderRadius="lg"
          align="center"
          justify="center"
          bg={`${color}.50`}
          color={`${color}.600`}
          flexShrink={0}
        >
          <Icon as={icon} boxSize={4} />
        </Flex>
      </Flex>
    </Box>
  );
}

function ResultProgress({ row }: { row: LearnerResultRow }) {
  return (
    <Stack spacing={1} minW={{ md: "130px" }}>
      <HStack justify="space-between">
        <Text fontSize="xs" fontWeight="semibold">
          {Math.round(row.progressPercent || 0)}%
        </Text>
        <Text fontSize="xs" color="gray.500">
          {row.completedSections}/{row.totalSections || 0}
        </Text>
      </HStack>
      <Progress
        value={row.progressPercent || 0}
        size="xs"
        colorScheme={row.progressPercent >= 100 ? "green" : row.progressPercent >= 50 ? "blue" : "orange"}
        borderRadius="full"
      />
    </Stack>
  );
}

function InsightList({
  title,
  rows,
  value,
  empty,
}: {
  title: string;
  rows?: LearnerResultRow[];
  value: (row: LearnerResultRow) => string;
  empty: string;
}) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={3.5}>
      <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.06em">
        {title}
      </Text>
      {(rows || []).length ? (
        <Stack spacing={2.5} mt={3}>
          {(rows || []).slice(0, 3).map((row, index) => (
            <Flex
              key={`${title}-${row.enrollmentId}`}
              justify="space-between"
              gap={3}
              pb={index === Math.min(rows?.length || 0, 3) - 1 ? 0 : 2.5}
              borderBottomWidth={index === Math.min(rows?.length || 0, 3) - 1 ? "0" : "1px"}
              borderColor={borderColor}
            >
              <Box minW={0}>
                <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>{row.learner.name}</Text>
                <Text fontSize="xs" color="gray.500" noOfLines={1}>{row.course.title}</Text>
              </Box>
              <Badge alignSelf="center" borderRadius="full" colorScheme="purple">
                {value(row)}
              </Badge>
            </Flex>
          ))}
        </Stack>
      ) : (
        <Text mt={3} fontSize="xs" color="gray.500">{empty}</Text>
      )}
    </Box>
  );
}

function formatOptionAnswer(
  labelValue?: string,
  textValue?: string | null,
  fallbackValue?: string
) {
  const label = String(labelValue || "").trim();
  const text = String(textValue || "").trim();
  const fallback = String(fallbackValue || "").trim();

  if (label && text && label.toLowerCase() !== text.toLowerCase()) {
    return `${label}. ${text}`;
  }

  return text || label || fallback || "Not answered";
}

function ManualQuizAnswerDetails({
  sections,
}: {
  sections: ScormAnswerSectionRecord[];
}) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const surfaceBg = useColorModeValue("white", "gray.800");
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const correctBg = useColorModeValue("green.50", "green.900");
  const headerBg = useColorModeValue("purple.50", "whiteAlpha.100");

  if (!sections.length) return null;

  return (
    <Accordion allowMultiple>
      <Stack spacing={2}>
        {sections.map((section) => (
          <AccordionItem
            key={section._id}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="xl"
            overflow="hidden"
          >
            <AccordionButton bg={headerBg} px={3} py={2.5} _hover={{ bg: headerBg }}>
              <Flex flex="1" justify="space-between" gap={3} align="center" minW={0}>
                <Box textAlign="left" minW={0}>
                  <HStack spacing={2}>
                    <Badge colorScheme="purple" borderRadius="full">Manual Quiz</Badge>
                    <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                      {section.sectionTitle || "Course quiz"}
                    </Text>
                  </HStack>
                  <Text mt={0.5} fontSize="xs" color="gray.500" noOfLines={1}>
                    {section.moduleTitle || "Course level"} | Attempt #{section.attempts} | {section.interactions.length} questions
                  </Text>
                </Box>
                <HStack flexShrink={0}>
                  <Text fontSize="xs" fontWeight="bold">
                    {section.awardedMarks || 0}/{section.possibleMarks || 0}
                  </Text>
                  <AccordionIcon />
                </HStack>
              </Flex>
            </AccordionButton>

            <AccordionPanel p={2.5}>
              <Stack spacing={2}>
                {(section.interactions || []).map((interaction: ScormInteractionReview, index) => {
                  const isCorrect =
                    interaction.result === "correct" ||
                    interaction.review?.evaluation === "correct";
                  const selectedAnswer = formatOptionAnswer(
                    interaction.learnerResponse,
                    interaction.learnerResponseText,
                    interaction.learnerResponseRaw
                  );
                  const correctAnswer = formatOptionAnswer(
                    interaction.correctResponses?.[0],
                    interaction.correctResponseTexts?.[0],
                    interaction.correctResponsesRaw?.[0]
                  );
                  const marks = Number(interaction.review?.marks || 0);
                  const maxMarks = Number(interaction.maxMarks || 0);

                  return (
                    <Box
                      key={interaction.uniqueKey || interaction._id}
                      bg={surfaceBg}
                      borderWidth="1px"
                      borderColor={isCorrect ? "green.200" : "red.200"}
                      borderRadius="lg"
                      p={3}
                    >
                      <Flex justify="space-between" gap={2} align="flex-start">
                        <Box minW={0}>
                          <Text fontSize="2xs" color="gray.500" fontWeight="bold" textTransform="uppercase">
                            Question {index + 1}
                          </Text>
                          <Text mt={1} fontSize="sm" fontWeight="semibold">
                            {interaction.questionPrompt || interaction.questionTitle || interaction.question || `Question ${index + 1}`}
                          </Text>
                        </Box>
                        <Badge colorScheme={isCorrect ? "green" : "red"} borderRadius="full" flexShrink={0}>
                          {isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                      </Flex>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} mt={2}>
                        <Box bg={selectedBg} borderRadius="md" px={2.5} py={2}>
                          <Text fontSize="2xs" color="gray.500" fontWeight="bold" textTransform="uppercase">
                            Selected
                          </Text>
                          <Text mt={0.5} fontSize="xs">{selectedAnswer}</Text>
                        </Box>
                        <Box bg={correctBg} borderRadius="md" px={2.5} py={2}>
                          <Text fontSize="2xs" color="gray.500" fontWeight="bold" textTransform="uppercase">
                            Correct answer
                          </Text>
                          <Text mt={0.5} fontSize="xs">{correctAnswer}</Text>
                        </Box>
                      </SimpleGrid>

                      <Text mt={2} fontSize="2xs" color="gray.500" fontWeight="semibold">
                        Marks {marks}/{maxMarks}
                      </Text>
                    </Box>
                  );
                })}
              </Stack>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Stack>
    </Accordion>
  );
}

function selectAnswerSections(
  sections: ScormAnswerSectionRecord[],
  source: "manual" | "scorm"
) {
  return sections
    .map((section) => ({
      ...section,
      interactions: (section.interactions || []).filter((interaction) =>
        source === "manual"
          ? interaction.source === "course_quiz"
          : interaction.source !== "course_quiz"
      ),
    }))
    .filter((section) => section.interactions.length > 0);
}

const LearnerResultsWorkspace = observer(({ role, showHeader = true }: Props) => {
  const {
    dashboardStore: {
      learnerResults,
      learnerResultsLoading,
      learnerResultsError,
      learnerResultDetail,
      learnerResultDetailLoading,
      fetchLearnerResults,
      fetchLearnerResultDetail,
      clearLearnerResultDetail,
    },
  } = stores;
  const [filters, setFilters] = useState<LearnerResultsFilters>(EMPTY_LEARNER_RESULTS_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<LearnerResultsFilters>(
    EMPTY_LEARNER_RESULTS_FILTERS
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortBy, setSortBy] = useState("lastActivity");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const panelBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedBg = useColorModeValue("gray.50", "gray.900");

  const params = useMemo(
    () => ({
      ...Object.fromEntries(
        Object.entries(appliedFilters).filter(([, value]) => Boolean(value))
      ),
      page: String(page),
      limit: String(pageSize),
      sortBy,
      sortOrder,
    }),
    [appliedFilters, page, pageSize, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchLearnerResults(params).catch(() => undefined);
  }, [fetchLearnerResults, params]);

  const updateFilter = (key: keyof LearnerResultsFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "companyId" ? { departmentId: "", batchId: "", userId: "" } : {}),
    }));
  };

  const openDetail = async (row: LearnerResultRow) => {
    clearLearnerResultDetail();
    onOpen();
    await fetchLearnerResultDetail(row.enrollmentId).catch(() => undefined);
  };

  const closeDetail = () => {
    onClose();
    clearLearnerResultDetail();
  };

  const summary = learnerResults?.summary;
  const options = learnerResults?.filterOptions || {};
  const rows = learnerResults?.results || [];
  const pagination = learnerResults?.pagination;
  const passTotal = Number(summary?.passed || 0) + Number(summary?.failed || 0);
  const passRate = passTotal ? Math.round((Number(summary?.passed || 0) / passTotal) * 100) : 0;

  return (
    <Box
      bg={panelBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      p={{ base: 3, md: 5 }}
      boxShadow="sm"
    >
      <Flex justify="space-between" align="flex-start" gap={3} mb={4}>
        {showHeader ? (
          <Box>
            <HStack spacing={2}>
              <Icon as={ClipboardCheck} color="purple.500" />
              <Heading size="sm">Learner progress & results</Heading>
            </HStack>
            <Text mt={1} fontSize="xs" color="gray.500">
              Course completion, scores, attempts, and submitted answers within your allowed scope.
            </Text>
          </Box>
        ) : <Box />}
        <HStack>
          <Button
            display={{ base: "inline-flex", md: "none" }}
            size="xs"
            variant="outline"
            leftIcon={<Filter size={13} />}
            onClick={() => setFiltersOpen((current) => !current)}
          >
            Filters
          </Button>
          <Button
            size="xs"
            variant="ghost"
            leftIcon={<RefreshCw size={13} />}
            isLoading={learnerResultsLoading}
            onClick={() => fetchLearnerResults(params).catch(() => undefined)}
          >
            Refresh
          </Button>
        </HStack>
      </Flex>

      <Collapse in={!isMobile || filtersOpen} animateOpacity>
        <Box bg={mutedBg} borderRadius="xl" p={3} mb={4}>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4, xl: 6 }} spacing={2}>
            <Input
              size="sm"
              borderRadius="lg"
              placeholder="Search learner, course, batch..."
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              bg={panelBg}
            />
            {role === "superadmin" ? (
              <FilterSelect
                value={filters.companyId}
                placeholder="All companies"
                options={options.companies}
                onChange={(value) => updateFilter("companyId", value)}
              />
            ) : null}
            {role !== "departmenthead" ? (
              <FilterSelect
                value={filters.departmentId}
                placeholder="All departments"
                options={options.departments}
                onChange={(value) => updateFilter("departmentId", value)}
              />
            ) : null}
            <FilterSelect
              value={filters.courseId}
              placeholder="All courses"
              options={options.courses}
              onChange={(value) => updateFilter("courseId", value)}
            />
            <FilterSelect
              value={filters.batchId}
              placeholder="All batches"
              options={options.batches}
              onChange={(value) => updateFilter("batchId", value)}
            />
            <FilterSelect
              value={filters.userId}
              placeholder="All learners"
              options={options.users}
              onChange={(value) => updateFilter("userId", value)}
            />
            <FilterSelect
              value={filters.completionStatus}
              placeholder="Any completion"
              options={[
                { value: "completed", label: "Completed" },
                { value: "in_progress", label: "In progress" },
                { value: "not_started", label: "Not started" },
              ]}
              onChange={(value) => updateFilter("completionStatus", value)}
            />
            <FilterSelect
              value={filters.courseStatus}
              placeholder="Any course status"
              options={[
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
              ]}
              onChange={(value) => updateFilter("courseStatus", value)}
            />
            <FilterSelect
              value={filters.passFail}
              placeholder="Any result"
              options={[
                { value: "passed", label: "Passed" },
                { value: "failed", label: "Failed" },
                { value: "not_available", label: "Not graded" },
              ]}
              onChange={(value) => updateFilter("passFail", value)}
            />
            <FilterSelect
              value={filters.activityStatus}
              placeholder="Any activity"
              options={[
                { value: "active", label: "Active learners" },
                { value: "inactive", label: "Inactive learners" },
              ]}
              onChange={(value) => updateFilter("activityStatus", value)}
            />
            <Input
              size="sm"
              type="number"
              min={0}
              max={100}
              borderRadius="lg"
              placeholder="Min score"
              value={filters.scoreMin}
              onChange={(event) => updateFilter("scoreMin", event.target.value)}
              bg={panelBg}
            />
            <Input
              size="sm"
              type="number"
              min={0}
              max={100}
              borderRadius="lg"
              placeholder="Max score"
              value={filters.scoreMax}
              onChange={(event) => updateFilter("scoreMax", event.target.value)}
              bg={panelBg}
            />
            <Input
              size="sm"
              type="date"
              borderRadius="lg"
              value={filters.from}
              onChange={(event) => updateFilter("from", event.target.value)}
              bg={panelBg}
            />
            <Input
              size="sm"
              type="date"
              borderRadius="lg"
              value={filters.to}
              onChange={(event) => updateFilter("to", event.target.value)}
              bg={panelBg}
            />
          </SimpleGrid>
          <Flex justify="space-between" align="center" mt={3} gap={2} wrap="wrap">
            <HStack>
              <Select
                size="xs"
                borderRadius="lg"
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setPage(1);
                }}
                bg={panelBg}
                w="150px"
              >
                <option value="lastActivity">Last activity</option>
                <option value="submissionDate">Submission date</option>
                <option value="score">Score</option>
                <option value="progress">Progress</option>
                <option value="completionDate">Completion date</option>
                <option value="learnerName">Learner name</option>
              </Select>
              <Select
                size="xs"
                borderRadius="lg"
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(event.target.value);
                  setPage(1);
                }}
                bg={panelBg}
                w="110px"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Select>
            </HStack>
            <HStack>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setFilters(EMPTY_LEARNER_RESULTS_FILTERS);
                  setAppliedFilters(EMPTY_LEARNER_RESULTS_FILTERS);
                  setPage(1);
                }}
              >
                Clear
              </Button>
              <Button
                size="xs"
                colorScheme="purple"
                onClick={() => {
                  setAppliedFilters(filters);
                  setPage(1);
                  setFiltersOpen(false);
                }}
              >
                Apply filters
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Collapse>

      {learnerResultsError ? (
        <Alert status="error" borderRadius="xl" mb={4} py={2}>
          <AlertIcon />
          <Text fontSize="sm">{learnerResultsError}</Text>
        </Alert>
      ) : null}

      <SimpleGrid columns={{ base: 2, md: 3, xl: 6 }} spacing={2.5} mb={4}>
        <SummaryCard
          label="Learner courses"
          value={summary?.totalResults || 0}
          helper={`${summary?.pending || 0} pending`}
          icon={Users}
          color="purple"
        />
        <SummaryCard
          label="Average progress"
          value={summary?.averageProgress === null || summary?.averageProgress === undefined ? "N/A" : `${Math.round(summary.averageProgress)}%`}
          helper={`${summary?.completed || 0} completed`}
          icon={BarChart3}
          color="blue"
        />
        <SummaryCard
          label="Average score"
          value={summary?.averageScore === null || summary?.averageScore === undefined ? "N/A" : `${Math.round(summary.averageScore)}%`}
          helper="Across graded attempts"
          icon={Target}
          color="pink"
        />
        <SummaryCard
          label="Passed"
          value={summary?.passed || 0}
          helper={`${passRate}% of graded results`}
          icon={CheckCircle2}
          color="green"
        />
        <SummaryCard
          label="Failed"
          value={summary?.failed || 0}
          helper="May need follow-up"
          icon={XCircle}
          color="red"
        />
        <SummaryCard
          label="Recent submissions"
          value={summary?.recentSubmissions?.length || 0}
          helper="Latest answer activity"
          icon={ClipboardCheck}
          color="orange"
        />
      </SimpleGrid>

      <Grid templateColumns={{ base: "1fr", lg: "repeat(3, minmax(0, 1fr))" }} gap={3} mb={4}>
        <InsightList
          title="Recent submissions"
          rows={summary?.recentSubmissions}
          value={(row) => `${row.answerCount} answers`}
          empty="No submitted answers are available yet."
        />
        <InsightList
          title="Low score learners"
          rows={summary?.lowScoreLearners}
          value={(row) => `${Math.round(row.score || 0)}%`}
          empty="No learners currently fall below 60%."
        />
        <InsightList
          title="Recently completed"
          rows={summary?.recentlyCompleted}
          value={(row) => formatDate(row.completionDate).split(",")[0]}
          empty="No recent course completions are available."
        />
      </Grid>

      {learnerResultsLoading && !learnerResults ? (
        <Stack spacing={2}>
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} height="54px" borderRadius="lg" />
          ))}
        </Stack>
      ) : rows.length ? (
        <>
          <TableContainer display={{ base: "none", md: "block" }}>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th pl={0}>Learner</Th>
                  {role === "superadmin" ? <Th>Company</Th> : null}
                  <Th>Course</Th>
                  <Th>Progress</Th>
                  <Th isNumeric>Score</Th>
                  <Th>Manual quizzes</Th>
                  <Th>Result</Th>
                  <Th>Activity / submitted</Th>
                  <Th pr={0} />
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((row) => {
                  const result = statusMeta(row.passStatus);
                  return (
                    <Tr key={row.enrollmentId}>
                      <Td pl={0}>
                        <HStack>
                          <Avatar size="xs" name={row.learner.name} />
                          <Box minW={0}>
                            <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                              {row.learner.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500" noOfLines={1}>
                              {row.learner.email || row.learner.mobileNumber || "No contact details"}
                            </Text>
                            <Text fontSize="xs" color="gray.400" noOfLines={1}>
                              {row.learner.department}
                            </Text>
                          </Box>
                        </HStack>
                      </Td>
                      {role === "superadmin" ? (
                        <Td>
                          <Text fontSize="sm" noOfLines={1}>{row.company.name}</Text>
                        </Td>
                      ) : null}
                      <Td>
                        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                          {row.course.title}
                        </Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {row.batches.map((batch) => batch.name).join(", ") || "Direct assignment"} · {row.course.status}
                        </Text>
                      </Td>
                      <Td><ResultProgress row={row} /></Td>
                      <Td isNumeric fontWeight="semibold">
                        {row.score === null ? "N/A" : `${Math.round(row.score)}%`}
                      </Td>
                      <Td>
                        {(row.manualQuizResults || []).length ? (
                          <Stack spacing={1} align="flex-start">
                            {(row.manualQuizResults || []).slice(0, 2).map((quiz) => (
                              <Box key={quiz._id}>
                                <HStack spacing={1.5}>
                                  <Badge colorScheme={quiz.type === "Module Quiz" ? "purple" : "teal"} borderRadius="full">
                                    {quiz.type}
                                  </Badge>
                                  <Text fontSize="xs" fontWeight="semibold" noOfLines={1} maxW="150px">
                                    {quiz.title}
                                  </Text>
                                </HStack>
                                <Text fontSize="xs" color="gray.500">
                                  {quiz.score}/{quiz.maxScore} marks ({Math.round(quiz.percentage)}%)
                                </Text>
                              </Box>
                            ))}
                            {(row.manualQuizResults || []).length > 2 ? (
                              <Text fontSize="xs" color="purple.500">
                                +{(row.manualQuizResults || []).length - 2} more in details
                              </Text>
                            ) : null}
                          </Stack>
                        ) : (
                          <Text fontSize="xs" color="gray.400">No manual quiz submitted</Text>
                        )}
                      </Td>
                      <Td>
                        <Stack spacing={1} align="flex-start">
                          <Badge colorScheme={result.color} borderRadius="full">
                            {result.label}
                          </Badge>
                          <Badge
                            colorScheme={row.status === "completed" ? "green" : row.status === "in_progress" ? "blue" : "gray"}
                            variant="subtle"
                            borderRadius="full"
                          >
                            {statusMeta(row.status).label}
                          </Badge>
                        </Stack>
                      </Td>
                      <Td>
                        <Text fontSize="xs" whiteSpace="nowrap">{formatDate(row.lastActivity)}</Text>
                        <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
                          Submitted {formatDate(row.submissionDate)}
                        </Text>
                      </Td>
                      <Td pr={0} textAlign="right">
                        <Button
                          size="xs"
                          variant="ghost"
                          leftIcon={<Eye size={13} />}
                          onClick={() => void openDetail(row)}
                        >
                          Review
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>

          <Stack display={{ base: "flex", md: "none" }} spacing={3}>
            {rows.map((row) => {
              const result = statusMeta(row.passStatus);
              return (
                <Box key={row.enrollmentId} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={3}>
                  <Flex justify="space-between" gap={3}>
                    <HStack minW={0}>
                      <Avatar size="sm" name={row.learner.name} />
                      <Box minW={0}>
                        <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>{row.learner.name}</Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>{row.course.title}</Text>
                        <Text fontSize="xs" color="gray.400" noOfLines={1}>{row.learner.department}</Text>
                      </Box>
                    </HStack>
                    <Badge colorScheme={result.color} borderRadius="full" alignSelf="flex-start">{result.label}</Badge>
                  </Flex>
                  {(row.manualQuizResults || []).length ? (
                    <Text mt={2} fontSize="xs" color="purple.600" noOfLines={2}>
                      {(row.manualQuizResults || []).length} manual quiz result{(row.manualQuizResults || []).length === 1 ? "" : "s"}:{" "}
                      {(row.manualQuizResults || []).map((quiz) => quiz.title).join(", ")}
                    </Text>
                  ) : null}
                  <Box mt={3}><ResultProgress row={row} /></Box>
                  <Flex justify="space-between" align="center" mt={3}>
                    <Text fontSize="xs" color="gray.500">
                      Score {row.score === null ? "N/A" : `${Math.round(row.score)}%`} · {row.answerCount} answers
                    </Text>
                    <Button size="xs" variant="ghost" leftIcon={<Eye size={13} />} onClick={() => void openDetail(row)}>
                      Review
                    </Button>
                  </Flex>
                </Box>
              );
            })}
          </Stack>

          <Flex justify="space-between" align="center" mt={4} gap={3} wrap="wrap">
            <Text fontSize="xs" color="gray.500">
              {pagination?.total || 0} learner-course results
            </Text>
            <HStack>
              <Select
                size="xs"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                borderRadius="lg"
                w="82px"
                aria-label="Rows per page"
              >
                <option value={10}>10 rows</option>
                <option value={15}>15 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
              </Select>
              <Button
                size="xs"
                variant="outline"
                leftIcon={<ChevronLeft size={13} />}
                isDisabled={(pagination?.page || 1) <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Text fontSize="xs">
                {pagination?.page || 1}/{pagination?.totalPages || 1}
              </Text>
              <Button
                size="xs"
                variant="outline"
                rightIcon={<ChevronRight size={13} />}
                isDisabled={(pagination?.page || 1) >= (pagination?.totalPages || 1)}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </>
      ) : (
        <Box py={10} textAlign="center" borderWidth="1px" borderColor={borderColor} borderRadius="xl">
          <Text fontSize="sm" fontWeight="semibold">No learner results found</Text>
          <Text mt={1} fontSize="xs" color="gray.500">
            Try clearing filters or wait for learners to begin assigned courses.
          </Text>
        </Box>
      )}

      <ResultDetailDrawer
        detail={learnerResultDetail as LearnerResultDetail | null}
        isLoading={learnerResultDetailLoading}
        isOpen={isOpen}
        onClose={closeDetail}
      />
    </Box>
  );
});

function ResultDetailDrawer({
  detail,
  isLoading,
  isOpen,
  onClose,
}: {
  detail: LearnerResultDetail | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedBg = useColorModeValue("gray.50", "gray.900");
  const result = detail ? statusMeta(detail.passStatus) : statusMeta("");
  const manualAnswerSections = selectAnswerSections(detail?.answerSections || [], "manual");
  const scormAnswerSections = selectAnswerSections(detail?.answerSections || [], "scorm");
  const manualQuestionCount = manualAnswerSections.reduce(
    (total, section) => total + section.interactions.length,
    0
  );
  const scormQuestionCount = scormAnswerSections.reduce(
    (total, section) => total + section.interactions.length,
    0
  );

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} pr={12}>
          <Text fontSize="md">Learner result detail</Text>
          <Text fontSize="xs" color="gray.500" fontWeight="normal">
            Progress, modules, attempts, and submitted answers
          </Text>
        </DrawerHeader>
        <DrawerBody py={5}>
          {isLoading && !detail ? (
            <Stack spacing={4}>
              <Skeleton height="100px" borderRadius="xl" />
              <Skeleton height="180px" borderRadius="xl" />
              <Skeleton height="280px" borderRadius="xl" />
            </Stack>
          ) : detail ? (
            <Stack spacing={5}>
              <Box bg={mutedBg} borderRadius="xl" p={4}>
                <Flex justify="space-between" gap={4} wrap="wrap">
                  <HStack>
                    <Avatar name={detail.learner.name} />
                    <Box>
                      <Text fontWeight="bold">{detail.learner.name}</Text>
                      <Text fontSize="xs" color="gray.500">{detail.learner.email}</Text>
                      {detail.learner.mobileNumber ? (
                        <Text fontSize="xs" color="gray.500">{detail.learner.mobileNumber}</Text>
                      ) : null}
                      <Text fontSize="xs" color="gray.500">
                        {detail.company.name} · {detail.learner.department}
                      </Text>
                    </Box>
                  </HStack>
                  <Box textAlign={{ base: "left", sm: "right" }}>
                    <Text fontSize="sm" fontWeight="semibold">{detail.course.title}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {detail.batches.map((batch) => batch.name).join(", ") || "Direct assignment"} · {detail.course.status}
                    </Text>
                    <Badge mt={2} colorScheme={result.color} borderRadius="full">{result.label}</Badge>
                  </Box>
                </Flex>
              </Box>

              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2.5}>
                <SummaryCard label="Progress" value={`${Math.round(detail.progressPercent)}%`} helper={`${detail.completedSections}/${detail.totalSections} sections`} icon={BarChart3} color="blue" />
                <SummaryCard label="Score" value={detail.score === null ? "N/A" : `${Math.round(detail.score)}%`} helper={detail.passThreshold === null ? "No pass threshold" : `Pass at ${Math.round(detail.passThreshold)}%`} icon={Target} color="pink" />
                <SummaryCard label="Attempts" value={detail.attempts} helper={`${detail.quizAttempts} quiz · ${detail.scormAttempts} SCORM`} icon={ClipboardCheck} color="purple" />
                <SummaryCard label="Time spent" value={detail.timeSpent || "00:00:00"} helper={`Submitted ${formatDate(detail.submissionDate)}`} icon={Users} color="teal" />
              </SimpleGrid>

              <Accordion allowMultiple defaultIndex={[0]}>
                <Stack spacing={2.5}>
                  <AccordionItem borderWidth="1px" borderColor={borderColor} borderRadius="xl" overflow="hidden">
                    <AccordionButton px={3.5} py={3} _hover={{ bg: mutedBg }}>
                      <Flex flex="1" justify="space-between" align="center" gap={3}>
                        <Box textAlign="left">
                          <Text fontSize="sm" fontWeight="bold">Course activity & completion</Text>
                          <Text fontSize="xs" color="gray.500">
                            Progress and time across {detail.modules?.length || 0} modules
                          </Text>
                        </Box>
                        <HStack>
                          <Badge colorScheme="blue" borderRadius="full">
                            {detail.completedSections}/{detail.totalSections} sections
                          </Badge>
                          <AccordionIcon />
                        </HStack>
                      </Flex>
                    </AccordionButton>
                    <AccordionPanel px={3} pb={3} pt={0}>
                      <Stack spacing={2}>
                        {(detail.modules || []).length ? (
                          detail.modules?.map((module) => (
                            <Box key={module.moduleId} bg={mutedBg} borderRadius="lg" px={3} py={2.5}>
                              <Flex justify="space-between" gap={3}>
                                <Box minW={0}>
                                  <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>{module.title}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {module.sectionsCompleted}/{module.sectionCount} sections | {module.totalTime || "00:00:00"}
                                  </Text>
                                </Box>
                                <Text fontSize="xs" fontWeight="bold">{Math.round(module.progress || 0)}%</Text>
                              </Flex>
                              <Progress mt={1.5} value={module.progress || 0} size="xs" colorScheme="blue" borderRadius="full" />
                            </Box>
                          ))
                        ) : (
                          <Text fontSize="sm" color="gray.500">No module progress has been recorded.</Text>
                        )}
                      </Stack>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem borderWidth="1px" borderColor={borderColor} borderRadius="xl" overflow="hidden">
                    <AccordionButton px={3.5} py={3} _hover={{ bg: mutedBg }}>
                      <Flex flex="1" justify="space-between" align="center" gap={3}>
                        <Box textAlign="left">
                          <Text fontSize="sm" fontWeight="bold">Course creator quizzes</Text>
                          <Text fontSize="xs" color="gray.500">
                            Scores, questions, and the learner's selected options
                          </Text>
                        </Box>
                        <HStack>
                          <Badge colorScheme="purple" borderRadius="full">
                            {manualQuestionCount} questions
                          </Badge>
                          <AccordionIcon />
                        </HStack>
                      </Flex>
                    </AccordionButton>
                    <AccordionPanel px={3} pb={3} pt={0}>
                      {manualAnswerSections.length ? (
                        <ManualQuizAnswerDetails sections={manualAnswerSections} />
                      ) : (detail.manualQuizResults || []).length ? (
                        <Stack spacing={2}>
                          {(detail.manualQuizResults || []).map((quiz) => (
                            <Flex
                              key={quiz._id}
                              bg={mutedBg}
                              borderRadius="lg"
                              px={3}
                              py={2.5}
                              justify="space-between"
                              gap={3}
                            >
                              <Box minW={0}>
                                <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>{quiz.title}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {quiz.moduleTitle || "Course level"} | Attempt #{quiz.attemptNumber} | {formatDate(quiz.submittedAt)}
                                </Text>
                              </Box>
                              <Text fontSize="xs" fontWeight="bold" flexShrink={0}>
                                {quiz.score}/{quiz.maxScore}
                              </Text>
                            </Flex>
                          ))}
                        </Stack>
                      ) : (
                        <Text fontSize="sm" color="gray.500">No course creator quiz attempts are available.</Text>
                      )}
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem borderWidth="1px" borderColor={borderColor} borderRadius="xl" overflow="hidden">
                    <AccordionButton px={3.5} py={3} _hover={{ bg: mutedBg }}>
                      <Flex flex="1" justify="space-between" align="center" gap={3}>
                        <Box textAlign="left">
                          <Text fontSize="sm" fontWeight="bold">SCORM activity & quiz answers</Text>
                          <Text fontSize="xs" color="gray.500">
                            Recorded SCORM questions, responses, results, and marks
                          </Text>
                        </Box>
                        <HStack>
                          <Badge colorScheme="teal" borderRadius="full">
                            {scormQuestionCount} questions
                          </Badge>
                          <AccordionIcon />
                        </HStack>
                      </Flex>
                    </AccordionButton>
                    <AccordionPanel px={3} pb={3} pt={0}>
                      <ScormQuizReviewContent
                        sections={scormAnswerSections}
                        mode="learner"
                        compact
                        emptyState="No SCORM quiz answers have been recorded for this learner and course."
                        progressSummary={{
                          progressPercent: detail.progressPercent,
                          sectionsCompleted: detail.completedSections,
                          totalSections: detail.totalSections,
                        }}
                      />
                    </AccordionPanel>
                  </AccordionItem>
                </Stack>
              </Accordion>
            </Stack>
          ) : (
            <Alert status="error" borderRadius="xl">
              <AlertIcon />
              Unable to load this learner result.
            </Alert>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

export default LearnerResultsWorkspace;
