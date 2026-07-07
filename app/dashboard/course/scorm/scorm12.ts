"use client";

import LZString from "lz-string";

export type ScormVersion = "1.2" | "2004";

export type ScormTrackingContext = {
  userId?: string | null;
  courseId?: string | null;
  moduleId?: string | null;
  sectionId?: string | null;
  learnerName?: string | null;
};

export type ScormProgressSnapshot = {
  lessonStatus?: string;
  score?: number | null;
  progress?: number | null;
  lessonLocation?: string;
  suspendData?: string;
  sessionTime?: string;
  totalTime?: string;
  completionStatus?: string;
  successStatus?: string;
  progressMeasure?: number | null;
  scoreRaw?: number | null;
  scoreScaled?: number | null;
  scoreMin?: number | null;
  scoreMax?: number | null;
};

export type ScormInteractionPayload = {
  index: number;
  questionNumber?: number;
  id?: string;
  type?: string;
  question?: string;
  questionPrompt?: string | null;
  learnerResponse?: string;
  learnerResponseRaw?: string;
  correctResponses?: string[];
  result?: string;
  isCorrect?: boolean | null;
  score?: number | null;
  latency?: string;
  time?: string;
  attemptTimestamp?: string;
  maxMarks?: number | null;
  source?: "cmi.interactions" | "suspend_data";
  rawData?: Record<string, any>;
};

export type ScormTrackingPayload = {
  userId: string;
  courseId: string;
  moduleId: string;
  sectionId: string;
  scorm_version: ScormVersion;
  lesson_status: string;
  completion_status: string;
  success_status: string;
  progress_measure: number | null;
  score: number | null;
  score_raw: number | null;
  score_scaled: number | null;
  score_min: number | null;
  score_max: number | null;
  lesson_location: string;
  suspend_data: string;
  session_time: string;
  total_time: string;
  interactions: ScormInteractionPayload[];
};

type CreateScorm12ApiOptions = {
  context: ScormTrackingContext;
  initialState?: Record<string, string>;
  onCommit?: (payload: ScormTrackingPayload) => void | Promise<void>;
  onFinish?: (payload: ScormTrackingPayload) => void | Promise<void>;
};

const DEFAULT_SCORM_TIME = "00:00:00";
const DEFAULT_SCORM_2004_TIME = "PT0H0M0S";
const COMPLETED_STATUSES = new Set(["completed", "passed"]);
const MANUAL_INTERACTION_TYPES = new Set([
  "essay",
  "fill-in",
  "long-fill-in",
  "long-fillin",
  "short-answer",
  "text",
]);

const ERROR_MESSAGES: Record<string, string> = {
  "0": "No error",
  "101": "General exception",
  "301": "Not initialized",
  "401": "Not implemented",
};

function normalizeString(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeScore(value: unknown) {
  const normalizedValue = normalizeString(value);
  if (!normalizedValue) {
    return null;
  }

  const numericValue = Number(normalizedValue);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeProgressMeasure(value: unknown) {
  const numericValue = normalizeScore(value);
  if (numericValue === null) {
    return null;
  }

  const normalizedValue = numericValue > 1 ? numericValue / 100 : numericValue;
  return Math.max(0, Math.min(1, Math.round(normalizedValue * 10000) / 10000));
}

function parseScorm12Time(value: string | null | undefined) {
  const normalizedValue = normalizeString(value);
  if (!normalizedValue) {
    return null;
  }

  const match = normalizedValue.match(/^(\d{1,4}):([0-5]?\d):([0-5]?\d)(?:\.(\d{1,2}))?$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const centiseconds = Number((match[4] || "").padEnd(2, "0").slice(0, 2) || "0");

  return ((((hours * 60) + minutes) * 60) + seconds) * 100 + centiseconds;
}

function parseScorm2004Time(value: string | null | undefined) {
  const normalizedValue = normalizeString(value).toUpperCase();
  if (!normalizedValue) {
    return null;
  }

  const match = normalizedValue.match(
    /^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
  );
  if (!match) {
    return null;
  }

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

  return Number.isFinite(totalSeconds) ? Math.round(totalSeconds * 100) : null;
}

function parseScormTime(value: string | null | undefined) {
  return parseScorm12Time(value) ?? parseScorm2004Time(value);
}

function formatScorm12Time(totalCentiseconds: number | null | undefined) {
  if (!Number.isFinite(totalCentiseconds) || totalCentiseconds === null || totalCentiseconds === undefined) {
    return DEFAULT_SCORM_TIME;
  }

  const safeValue = Math.max(0, Math.floor(totalCentiseconds));
  const hours = Math.floor(safeValue / 360000);
  const remainderAfterHours = safeValue % 360000;
  const minutes = Math.floor(remainderAfterHours / 6000);
  const remainderAfterMinutes = remainderAfterHours % 6000;
  const seconds = Math.floor(remainderAfterMinutes / 100);
  const centiseconds = remainderAfterMinutes % 100;

  const baseValue = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return centiseconds > 0 ? `${baseValue}.${String(centiseconds).padStart(2, "0")}` : baseValue;
}

function formatScorm2004Time(totalCentiseconds: number | null | undefined) {
  if (!Number.isFinite(totalCentiseconds) || totalCentiseconds === null || totalCentiseconds === undefined) {
    return DEFAULT_SCORM_2004_TIME;
  }

  const safeValue = Math.max(0, Math.floor(totalCentiseconds));
  const totalSeconds = safeValue / 100;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secondsValue = totalSeconds - (hours * 3600) - (minutes * 60);
  const secondsLabel = Number.isInteger(secondsValue)
    ? String(secondsValue)
    : secondsValue.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

  return `PT${hours}H${minutes}M${secondsLabel}S`;
}

function toScorm12Time(value: unknown, fallback = DEFAULT_SCORM_TIME) {
  const parsedValue = parseScormTime(normalizeString(value));
  return parsedValue === null ? fallback : formatScorm12Time(parsedValue);
}

function toScorm2004Time(value: unknown, fallback = DEFAULT_SCORM_2004_TIME) {
  const parsedValue = parseScormTime(normalizeString(value));
  return parsedValue === null ? fallback : formatScorm2004Time(parsedValue);
}

function normalizeCompletionStatus(value: unknown) {
  const normalizedValue = normalizeString(value)
    .toLowerCase()
    .replace(/_/g, " ");

  if (
    normalizedValue === "completed" ||
    normalizedValue === "incomplete" ||
    normalizedValue === "not attempted" ||
    normalizedValue === "unknown"
  ) {
    return normalizedValue;
  }

  return "";
}

function normalizeSuccessStatus(value: unknown) {
  const normalizedValue = normalizeString(value).toLowerCase();
  if (normalizedValue === "passed" || normalizedValue === "failed" || normalizedValue === "unknown") {
    return normalizedValue;
  }

  return "";
}

function mapLessonStatusTo2004Statuses(lessonStatus: unknown) {
  const normalizedLessonStatus = normalizeString(lessonStatus).toLowerCase();

  if (normalizedLessonStatus === "passed") {
    return {
      completionStatus: "completed",
      successStatus: "passed",
    };
  }

  if (normalizedLessonStatus === "failed") {
    return {
      completionStatus: "completed",
      successStatus: "failed",
    };
  }

  if (normalizedLessonStatus === "completed") {
    return {
      completionStatus: "completed",
      successStatus: "unknown",
    };
  }

  if (normalizedLessonStatus === "incomplete" || normalizedLessonStatus === "browsed") {
    return {
      completionStatus: "incomplete",
      successStatus: "unknown",
    };
  }

  return {
    completionStatus: "not attempted",
    successStatus: "unknown",
  };
}

function map2004ToLessonStatus(options: {
  completionStatus?: unknown;
  successStatus?: unknown;
  fallbackLessonStatus?: unknown;
}) {
  const successStatus = normalizeSuccessStatus(options.successStatus);
  const completionStatus = normalizeCompletionStatus(options.completionStatus);

  if (successStatus === "passed") {
    return "passed";
  }

  if (successStatus === "failed") {
    return "failed";
  }

  if (completionStatus === "completed") {
    return "completed";
  }

  if (completionStatus === "incomplete") {
    return "incomplete";
  }

  if (completionStatus === "not attempted") {
    return "not_attempted";
  }

  return normalizeString(options.fallbackLessonStatus).toLowerCase() || "not_attempted";
}

function toScaledScore(score: number | null) {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return "";
  }

  const normalizedValue = score > 1 ? score / 100 : score;
  return String(Math.max(0, Math.min(1, normalizedValue)));
}

function resolveRawScore(state: Record<string, string>, scormVersion: ScormVersion) {
  const rawScoreKeys = scormVersion === "2004"
    ? ["cmi.score.raw", "cmi.core.score.raw"]
    : ["cmi.core.score.raw", "cmi.score.raw"];

  for (const key of rawScoreKeys) {
    const rawScore = normalizeScore(state[key]);
    if (rawScore !== null) {
      return rawScore;
    }
  }

  const scaledScore = normalizeScore(state["cmi.score.scaled"]);
  if (scaledScore === null) {
    return null;
  }

  return scaledScore <= 1 ? Math.round(scaledScore * 10000) / 100 : scaledScore;
}

function readFirstStateValue(state: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = normalizeString(state[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

function readVersionedStateValue(
  state: Record<string, string>,
  scormVersion: ScormVersion,
  scorm12Keys: string[],
  scorm2004Keys: string[]
) {
  return scormVersion === "2004"
    ? readFirstStateValue(state, [...scorm2004Keys, ...scorm12Keys])
    : readFirstStateValue(state, [...scorm12Keys, ...scorm2004Keys]);
}

function extractLocationProgress(value: unknown) {
  const normalizedValue = normalizeString(value);
  if (!normalizedValue) {
    return null;
  }

  const match = normalizedValue.match(/^(\d+(?:\.\d+)?)%?$/);
  if (!match?.[1]) {
    return null;
  }

  const numericValue = Number(match[1]);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.max(0, Math.min(100, numericValue));
}

function resolveProgressMeasure(
  state: Record<string, string>,
  lessonStatus: string,
  scormVersion: ScormVersion
) {
  const directProgressMeasure = normalizeProgressMeasure(state["cmi.progress_measure"]);
  if (directProgressMeasure !== null) {
    return directProgressMeasure;
  }

  const locationProgress = extractLocationProgress(
    readVersionedStateValue(
      state,
      scormVersion,
      ["cmi.core.lesson_location"],
      ["cmi.location"]
    )
  );
  if (locationProgress !== null) {
    return Math.max(0, Math.min(1, locationProgress / 100));
  }

  return COMPLETED_STATUSES.has(lessonStatus) ? 1 : null;
}

function normalizeInteractionType(value: unknown) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/_/g, "-");
}

function isManualInteractionType(value: unknown) {
  return MANUAL_INTERACTION_TYPES.has(normalizeInteractionType(value));
}

function normalizeInteractionResult(value: unknown) {
  const result = normalizeString(value).toLowerCase();
  if (result === "wrong" || result === "false") return "incorrect";
  if (result === "true") return "correct";
  if (result === "not answered") return "unanswered";
  return result;
}

function getIsCorrect(result: unknown) {
  const normalizedResult = normalizeInteractionResult(result);
  if (normalizedResult === "correct" || normalizedResult === "passed") return true;
  if (normalizedResult === "incorrect" || normalizedResult === "failed") return false;
  return null;
}

function sanitizeLearnerResponse(value: unknown, interactionType: unknown) {
  const response = normalizeString(value);
  if (!response) return "";

  const normalizedResponse = response.toLowerCase();
  if (
    normalizedResponse.includes("loading") ||
    normalizedResponse === "undefined" ||
    normalizedResponse === "null" ||
    normalizedResponse === "[object object]" ||
    /^data:[^;]+;base64,/i.test(response)
  ) {
    return "";
  }

  return response.slice(0, isManualInteractionType(interactionType) ? 10000 : 1000);
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function flattenPrimitiveValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenPrimitiveValues(entry));
  }

  if (isPlainObject(value)) {
    const directText = [
      value.text,
      value.label,
      value.value,
      value.answer,
      value.response,
      value.name,
      value.title,
      value.prompt,
      value.pattern,
    ]
      .map((entry) => normalizeString(entry))
      .filter(Boolean);

    if (directText.length) {
      return directText;
    }

    return Object.values(value).flatMap((entry) => flattenPrimitiveValues(entry));
  }

  const normalizedValue = normalizeString(value);
  return normalizedValue ? [normalizedValue] : [];
}

function toDisplayString(value: unknown) {
  return flattenPrimitiveValues(value).filter(Boolean).join(", ");
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => normalizeString(value)).filter(Boolean)));
}

function shouldPersistInteraction(
  interaction: Pick<ScormInteractionPayload, "id" | "learnerResponse" | "learnerResponseRaw" | "result" | "type">
) {
  const interactionId = normalizeString(interaction.id);

  return Boolean(
    interactionId &&
    (
      sanitizeLearnerResponse(
        interaction.learnerResponseRaw || interaction.learnerResponse,
        interaction.type
      ) ||
      normalizeString(interaction.result) ||
      normalizeString(interaction.type)
    )
  );
}

function toLightweightInteraction(
  interaction: ScormInteractionPayload,
  fallbackIndex: number
): ScormInteractionPayload {
  const type = normalizeInteractionType(interaction.type);
  const result = normalizeInteractionResult(interaction.result);
  const learnerResponseRaw = sanitizeLearnerResponse(
    interaction.learnerResponseRaw || interaction.learnerResponse,
    type
  );
  const manualInput = isManualInteractionType(type);
  const prompt = manualInput ? normalizeString(interaction.questionPrompt || interaction.question) : "";

  return {
    index: Number.isFinite(Number(interaction.index)) ? Number(interaction.index) : fallbackIndex,
    questionNumber: Number.isFinite(Number(interaction.questionNumber))
      ? Math.max(1, Number(interaction.questionNumber))
      : fallbackIndex + 1,
    id: normalizeString(interaction.id),
    type,
    question: prompt,
    questionPrompt: prompt || null,
    learnerResponse: learnerResponseRaw,
    learnerResponseRaw,
    correctResponses: [],
    result,
    isCorrect: getIsCorrect(result),
    score: normalizeScore(interaction.score),
    latency: normalizeString(interaction.latency),
    time: normalizeString(interaction.time),
    attemptTimestamp: normalizeString(interaction.attemptTimestamp || interaction.time),
    maxMarks: normalizeScore(interaction.maxMarks),
    source: interaction.source || "cmi.interactions",
  };
}

function normalizeQuestionFingerprint(value: unknown) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildInteractionKey(interaction: { id?: string; index?: number }) {
  const normalizedId = normalizeString(interaction.id);
  if (normalizedId) {
    return `id:${normalizedId.toLowerCase()}`;
  }

  const normalizedQuestion = normalizeQuestionFingerprint((interaction as any)?.question);
  if (normalizedQuestion) {
    return `question:${normalizedQuestion}`;
  }

  const normalizedIndex = Number(interaction.index || 0);
  return `index:${normalizedIndex}`;
}

function collapseInteractionsByKey(interactions: ScormInteractionPayload[]) {
  const interactionMap = new Map<string, ScormInteractionPayload>();

  interactions
    .slice()
    .sort((left, right) => left.index - right.index)
    .forEach((interaction) => {
      interactionMap.set(buildInteractionKey(interaction), interaction);
    });

  return Array.from(interactionMap.values()).sort((left, right) => left.index - right.index);
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function decodeSuspendDataPayload(suspendData: string) {
  const normalizedSuspendData = normalizeString(suspendData);
  if (!normalizedSuspendData) {
    return null;
  }

  const candidateStrings = [
    normalizedSuspendData,
    (() => {
      try {
        return decodeURIComponent(normalizedSuspendData);
      } catch (error) {
        return "";
      }
    })(),
    LZString.decompressFromEncodedURIComponent(normalizedSuspendData) || "",
    LZString.decompressFromBase64(normalizedSuspendData) || "",
    LZString.decompress(normalizedSuspendData) || "",
  ].filter(Boolean);

  for (const candidate of candidateStrings) {
    const parsed = safeJsonParse(candidate);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function findCandidateQuizArray(rootValue: unknown): any[] {
  if (!rootValue) {
    return [];
  }

  const root = isPlainObject(rootValue) ? rootValue : {};
  const directCandidates = [
    root.quiz && isPlainObject(root.quiz) ? root.quiz.questions : null,
    root.questions,
    root.interactions,
    root.responses,
  ];
  const firstDirectCandidate = directCandidates.find((value) => Array.isArray(value));

  if (Array.isArray(firstDirectCandidate)) {
    return firstDirectCandidate;
  }

  const queue: unknown[] = [root];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (Array.isArray(current)) {
      current.forEach((entry) => queue.push(entry));
      continue;
    }

    if (!isPlainObject(current)) {
      continue;
    }

    const nestedCandidate = [current.questions, current.interactions, current.responses].find((value) =>
      Array.isArray(value)
    );
    if (Array.isArray(nestedCandidate)) {
      return nestedCandidate;
    }

    Object.values(current).forEach((entry) => queue.push(entry));
  }

  return [];
}

function buildQuestionMetadataMap(parsedSuspendData: any) {
  const candidateQuestions = Array.isArray(parsedSuspendData?.quiz?.questions)
    ? parsedSuspendData.quiz.questions
    : Array.isArray(parsedSuspendData?.questions)
      ? parsedSuspendData.questions
      : [];

  const metadataMap = new Map<string, Partial<ScormInteractionPayload>>();

  candidateQuestions.forEach((entry: any, index: number) => {
    const safeEntry = isPlainObject(entry) ? entry : {};
    const key = normalizeString(safeEntry.questionId || safeEntry.id || safeEntry.identifier || safeEntry.name) || `index:${index}`;

    metadataMap.set(key, {
      id: normalizeString(safeEntry.questionId || safeEntry.id || safeEntry.identifier || safeEntry.name),
      question: normalizeString(
        safeEntry.question ||
        safeEntry.prompt ||
        safeEntry.text ||
        safeEntry.title ||
        safeEntry.label ||
        safeEntry.description
      ),
      correctResponses: uniqueStrings(
        flattenPrimitiveValues(
          safeEntry.correctResponses ||
          safeEntry.correct_responses ||
          safeEntry.correctAnswer ||
          safeEntry.correct_answer ||
          safeEntry.correctResponse ||
          safeEntry.correct_response ||
          safeEntry.expectedAnswer ||
          safeEntry.expected_answer ||
          safeEntry.solution
        )
      ),
      maxMarks: normalizeScore(safeEntry.weighting ?? safeEntry.maxMarks ?? safeEntry.max_marks ?? safeEntry.marks),
    });
  });

  return metadataMap;
}

function normalizeSuspendDataInteraction(entry: any, index: number, metadataMap: Map<string, Partial<ScormInteractionPayload>>) {
  const safeEntry = isPlainObject(entry) ? entry : {};
  const metadataKey = normalizeString(safeEntry.questionId || safeEntry.id || safeEntry.identifier || safeEntry.name) || `index:${index}`;
  const metadata = metadataMap.get(metadataKey) || {};

  return {
    index,
    id: normalizeString(safeEntry.questionId || safeEntry.id || safeEntry.identifier || safeEntry.name || metadata.id),
    type: normalizeInteractionType(safeEntry.type || safeEntry.kind || safeEntry.questionType),
    question: normalizeString(
      safeEntry.question ||
      safeEntry.prompt ||
      safeEntry.text ||
      safeEntry.title ||
      safeEntry.label ||
      safeEntry.description ||
      metadata.question
    ),
    learnerResponse: toDisplayString(
      safeEntry.learnerResponse ??
      safeEntry.studentResponse ??
      safeEntry.response ??
      safeEntry.answer ??
      safeEntry.value ??
      safeEntry.userAnswer ??
      safeEntry.selected ??
      safeEntry.selectedOption ??
      safeEntry.selectedOptions
    ),
    correctResponses: uniqueStrings(
      flattenPrimitiveValues(
        safeEntry.correctResponses ??
        safeEntry.correct_responses ??
        safeEntry.correctAnswer ??
        safeEntry.correct_answer ??
        safeEntry.correctResponse ??
        safeEntry.correct_response ??
        safeEntry.expectedAnswer ??
        safeEntry.expected_answer ??
        safeEntry.solution ??
        metadata.correctResponses
      )
    ),
    result: normalizeString(
      typeof safeEntry.result === "boolean"
        ? safeEntry.result ? "correct" : "incorrect"
        : safeEntry.result ?? safeEntry.status ?? safeEntry.isCorrect
    ).toLowerCase(),
    latency: normalizeString(safeEntry.latency),
    time: normalizeString(safeEntry.time || safeEntry.timestamp),
    maxMarks: normalizeScore(
      safeEntry.weighting ?? safeEntry.maxMarks ?? safeEntry.max_marks ?? safeEntry.marks ?? metadata.maxMarks
    ),
    source: "suspend_data" as const,
    rawData: isPlainObject(entry) ? entry : { value: entry },
  };
}

function buildSuspendDataInteractions(suspendData: string) {
  const parsedSuspendData = decodeSuspendDataPayload(suspendData);
  if (!parsedSuspendData) {
    return [];
  }

  const metadataMap = buildQuestionMetadataMap(parsedSuspendData);
  const candidateArray = findCandidateQuizArray(parsedSuspendData);

  return candidateArray.map((entry, index) => normalizeSuspendDataInteraction(entry, index, metadataMap));
}

function extractScormInteractions(state: Record<string, string>) {
  const interactionMap = new Map<number, ScormInteractionPayload>();

  Object.entries(state).forEach(([key, value]) => {
    const match = key.match(/^cmi\.interactions\.(\d+)\.(.+)$/);
    if (!match) {
      return;
    }

    const interactionIndex = Number(match[1]);
    const propertyPath = match[2];
    const currentInteraction = interactionMap.get(interactionIndex) || {
      index: interactionIndex,
      id: "",
      type: "",
      question: "",
      learnerResponse: "",
      correctResponses: [],
      result: "",
      latency: "",
      time: "",
      maxMarks: null,
      source: "cmi.interactions" as const,
      rawData: {},
    };

    currentInteraction.rawData = currentInteraction.rawData || {};
    currentInteraction.rawData[propertyPath] = String(value ?? "");

    if (propertyPath === "id") {
      currentInteraction.id = normalizeString(value);
    } else if (propertyPath === "type") {
      currentInteraction.type = normalizeInteractionType(value);
    } else if (propertyPath === "result") {
      currentInteraction.result = normalizeString(value).toLowerCase();
    } else if (propertyPath === "student_response" || propertyPath === "learner_response") {
      currentInteraction.learnerResponse = normalizeString(value);
    } else if (propertyPath === "latency") {
      currentInteraction.latency = normalizeString(value);
    } else if (propertyPath === "time" || propertyPath === "timestamp") {
      currentInteraction.time = normalizeString(value);
    } else if (propertyPath === "weighting") {
      currentInteraction.maxMarks = normalizeScore(value);
    } else if (propertyPath === "description" || propertyPath === "text") {
      currentInteraction.question = normalizeString(value);
    } else {
      const correctResponseMatch = propertyPath.match(/^correct_responses\.(\d+)\.pattern$/);
      if (correctResponseMatch) {
        const patternIndex = Number(correctResponseMatch[1]);
        const nextCorrectResponses = Array.isArray(currentInteraction.correctResponses)
          ? [...currentInteraction.correctResponses]
          : [];
        nextCorrectResponses[patternIndex] = normalizeString(value);
        currentInteraction.correctResponses = nextCorrectResponses.filter(Boolean);
      }
    }

    interactionMap.set(interactionIndex, currentInteraction);
  });

  return collapseInteractionsByKey(
    Array.from(interactionMap.values())
      .sort((left, right) => left.index - right.index)
      .map((interaction) => ({
        ...interaction,
        correctResponses: uniqueStrings(Array.isArray(interaction.correctResponses) ? interaction.correctResponses : []),
      }))
  );
}

function enrichNativeInteractions(nativeInteractions: ScormInteractionPayload[], suspendDataInteractions: ScormInteractionPayload[]) {
  if (!suspendDataInteractions.length) {
    return nativeInteractions;
  }

  const fallbackMap = new Map<string, ScormInteractionPayload>();
  suspendDataInteractions.forEach((interaction, index) => {
    fallbackMap.set(buildInteractionKey({ id: interaction.id, index: interaction.index ?? index }), interaction);
  });

  return nativeInteractions.map((interaction, index) => {
    const fallbackInteraction = fallbackMap.get(
      buildInteractionKey({ id: interaction.id, index: interaction.index ?? index })
    );
    if (!fallbackInteraction) {
      return interaction;
    }

    return {
      ...interaction,
      question: interaction.question || fallbackInteraction.question,
      learnerResponse: interaction.learnerResponse || fallbackInteraction.learnerResponse,
      correctResponses: interaction.correctResponses?.length
        ? interaction.correctResponses
        : fallbackInteraction.correctResponses,
      latency: interaction.latency || fallbackInteraction.latency,
      time: interaction.time || fallbackInteraction.time,
      maxMarks: interaction.maxMarks ?? fallbackInteraction.maxMarks ?? null,
      rawData: {
        ...(fallbackInteraction.rawData || {}),
        ...(interaction.rawData || {}),
      },
    };
  });
}

function getInteractionCount(state: Record<string, string>) {
  const indexes = new Set<number>();

  Object.keys(state).forEach((key) => {
    const match = key.match(/^cmi\.interactions\.(\d+)\./);
    if (match) {
      indexes.add(Number(match[1]));
    }
  });

  return indexes.size;
}

function getCorrectResponseCount(state: Record<string, string>, interactionIndex: number) {
  const indexes = new Set<number>();

  Object.keys(state).forEach((key) => {
    const match = key.match(new RegExp(`^cmi\\.interactions\\.${interactionIndex}\\.correct_responses\\.(\\d+)\\.`));
    if (match) {
      indexes.add(Number(match[1]));
    }
  });

  return indexes.size;
}

export function buildScorm12InitialState(options: {
  context: ScormTrackingContext;
  progress?: ScormProgressSnapshot | null;
  includeSessionTime?: boolean;
}) {
  const progress = options.progress || null;
  const lessonStatus = normalizeString(progress?.lessonStatus).toLowerCase() || "not_attempted";
  const scorm2004Statuses = mapLessonStatusTo2004Statuses(lessonStatus);
  const completionStatus = normalizeCompletionStatus(progress?.completionStatus) || scorm2004Statuses.completionStatus;
  const successStatus = normalizeSuccessStatus(progress?.successStatus) || scorm2004Statuses.successStatus;
  const progressMeasure = normalizeProgressMeasure(progress?.progressMeasure ?? progress?.progress)
    ?? (COMPLETED_STATUSES.has(lessonStatus) ? 1 : null);
  const score = normalizeScore(progress?.scoreRaw ?? progress?.score);
  const scoreScaled = normalizeScore(progress?.scoreScaled);
  const state: Record<string, string> = {
    "cmi.core.student_id": normalizeString(options.context.userId),
    "cmi.core.student_name": normalizeString(options.context.learnerName),
    "cmi.core.lesson_status": lessonStatus,
    "cmi.core.lesson_mode": "normal",
    "cmi.core.score.raw": score === null ? "" : String(score),
    "cmi.core.score.min": progress?.scoreMin == null ? "" : String(progress.scoreMin),
    "cmi.core.score.max": progress?.scoreMax == null ? "" : String(progress.scoreMax),
    "cmi.core.lesson_location": normalizeString(progress?.lessonLocation),
    "cmi.suspend_data": normalizeString(progress?.suspendData),
    "cmi.core.total_time": toScorm12Time(progress?.totalTime),
    "cmi.learner_id": normalizeString(options.context.userId),
    "cmi.learner_name": normalizeString(options.context.learnerName),
    "cmi.mode": "normal",
    "cmi.completion_status": completionStatus,
    "cmi.success_status": successStatus,
    "cmi.location": normalizeString(progress?.lessonLocation),
    "cmi.total_time": toScorm2004Time(progress?.totalTime),
    "cmi.progress_measure": progressMeasure === null ? "" : String(progressMeasure),
    "cmi.score.raw": score === null ? "" : String(score),
    "cmi.score.scaled": scoreScaled === null ? toScaledScore(score) : String(scoreScaled),
    "cmi.score.min": progress?.scoreMin == null ? "" : String(progress.scoreMin),
    "cmi.score.max": progress?.scoreMax == null ? "" : String(progress.scoreMax),
  };

  if (options.includeSessionTime !== false) {
    state["cmi.core.session_time"] = DEFAULT_SCORM_TIME;
    state["cmi.session_time"] = DEFAULT_SCORM_2004_TIME;
  }

  return state;
}

export function createScorm12Api(options: CreateScorm12ApiOptions) {
  const state: Record<string, string> = {
    ...options.initialState,
  };

  let initialized = false;
  let lastError = "0";
  let activeVersion: ScormVersion | null = null;

  const buildTrackingPayload = (): ScormTrackingPayload | null => {
    const userId = normalizeString(options.context.userId);
    const courseId = normalizeString(options.context.courseId);

    if (!userId || !courseId) {
      return null;
    }

    const suspendData = normalizeString(state["cmi.suspend_data"]);
    const nativeInteractions = extractScormInteractions(state);
    const fallbackInteractions = buildSuspendDataInteractions(suspendData);
    const resolvedInteractions = nativeInteractions.length
      ? enrichNativeInteractions(nativeInteractions, fallbackInteractions)
      : fallbackInteractions;
    const interactions = resolvedInteractions
      .map((interaction, index) => toLightweightInteraction(interaction, index))
      .filter((interaction) => shouldPersistInteraction(interaction));
    const inferredVersion = activeVersion
      || (
        normalizeCompletionStatus(state["cmi.completion_status"])
        || normalizeSuccessStatus(state["cmi.success_status"])
        || normalizeString(state["cmi.location"])
        || normalizeString(state["cmi.progress_measure"])
          ? "2004"
          : "1.2"
      );
    const completionStatus = normalizeCompletionStatus(state["cmi.completion_status"]);
    const successStatus = normalizeSuccessStatus(state["cmi.success_status"]);
    const lessonStatus = inferredVersion === "2004"
      ? map2004ToLessonStatus({
          completionStatus,
          successStatus,
          fallbackLessonStatus: state["cmi.core.lesson_status"],
        })
      : normalizeString(state["cmi.core.lesson_status"]).toLowerCase()
        || map2004ToLessonStatus({
            completionStatus,
            successStatus,
          });
    const progressMeasure = resolveProgressMeasure(state, lessonStatus, inferredVersion);

    return {
      userId,
      courseId,
      moduleId: normalizeString(options.context.moduleId),
      sectionId: normalizeString(options.context.sectionId),
      scorm_version: inferredVersion,
      lesson_status: lessonStatus || "not_attempted",
      completion_status: completionStatus || mapLessonStatusTo2004Statuses(lessonStatus).completionStatus,
      success_status: successStatus || mapLessonStatusTo2004Statuses(lessonStatus).successStatus,
      progress_measure: progressMeasure,
      score: resolveRawScore(state, inferredVersion),
      score_raw: normalizeScore(
        readVersionedStateValue(
          state,
          inferredVersion,
          ["cmi.core.score.raw"],
          ["cmi.score.raw"]
        )
      ),
      score_scaled: normalizeScore(state["cmi.score.scaled"]),
      score_min: normalizeScore(
        readVersionedStateValue(
          state,
          inferredVersion,
          ["cmi.core.score.min"],
          ["cmi.score.min"]
        )
      ),
      score_max: normalizeScore(
        readVersionedStateValue(
          state,
          inferredVersion,
          ["cmi.core.score.max"],
          ["cmi.score.max"]
        )
      ),
      lesson_location: readVersionedStateValue(
        state,
        inferredVersion,
        ["cmi.core.lesson_location"],
        ["cmi.location"]
      ),
      suspend_data: suspendData,
      session_time: toScorm12Time(
        readVersionedStateValue(
          state,
          inferredVersion,
          ["cmi.core.session_time"],
          ["cmi.session_time"]
        ),
        DEFAULT_SCORM_TIME
      ),
      total_time: toScorm12Time(
        readVersionedStateValue(
          state,
          inferredVersion,
          ["cmi.core.total_time"],
          ["cmi.total_time"]
        ),
        DEFAULT_SCORM_TIME
      ),
      interactions,
    };
  };

  const fireAndForget = (handler?: (payload: ScormTrackingPayload) => void | Promise<void>) => {
    const payload = buildTrackingPayload();
    if (!payload || !handler) {
      return;
    }

    Promise.resolve(handler(payload)).catch(() => undefined);
  };

  const api = {
    LMSInitialize: () => {
      initialized = true;
      activeVersion = "1.2";
      lastError = "0";
      return "true";
    },
    LMSFinish: () => {
      if (!initialized) {
        lastError = "301";
        return "false";
      }

      lastError = "0";
      fireAndForget(options.onFinish);
      initialized = false;
      return "true";
    },
    LMSGetValue: (key: string) => {
      if (!initialized) {
        lastError = "301";
        return "";
      }

      if (key === "cmi.interactions._count") {
        lastError = "0";
        return String(getInteractionCount(state));
      }

      const correctResponseCountMatch = key.match(/^cmi\.interactions\.(\d+)\.correct_responses\._count$/);
      if (correctResponseCountMatch) {
        lastError = "0";
        return String(getCorrectResponseCount(state, Number(correctResponseCountMatch[1])));
      }

      lastError = "0";
      return state[key] ?? "";
    },
    LMSSetValue: (key: string, value: string) => {
      if (!initialized) {
        lastError = "301";
        return "false";
      }

      activeVersion = "1.2";
      state[key] = String(value ?? "");
      lastError = "0";
      return "true";
    },
    LMSCommit: () => {
      if (!initialized) {
        lastError = "301";
        return "false";
      }

      lastError = "0";
      fireAndForget(options.onCommit);
      return "true";
    },
    LMSGetLastError: () => lastError,
    LMSGetErrorString: (errorCode: string) => ERROR_MESSAGES[String(errorCode)] || "Unknown error",
    LMSGetDiagnostic: (errorCode?: string) => ERROR_MESSAGES[String(errorCode || lastError)] || "Unknown error",
  };

  const api2004 = {
    Initialize: (_parameter?: string) => {
      initialized = true;
      activeVersion = "2004";
      lastError = "0";
      return "true";
    },
    Terminate: (_parameter?: string) => {
      if (!initialized) {
        lastError = "301";
        return "false";
      }

      lastError = "0";
      fireAndForget(options.onFinish);
      initialized = false;
      return "true";
    },
    GetValue: (key: string) => {
      if (!initialized) {
        lastError = "301";
        return "";
      }

      if (key === "cmi.interactions._count") {
        lastError = "0";
        return String(getInteractionCount(state));
      }

      const correctResponseCountMatch = key.match(/^cmi\.interactions\.(\d+)\.correct_responses\._count$/);
      if (correctResponseCountMatch) {
        lastError = "0";
        return String(getCorrectResponseCount(state, Number(correctResponseCountMatch[1])));
      }

      lastError = "0";
      return state[key] ?? "";
    },
    SetValue: (key: string, value: string) => {
      if (!initialized) {
        lastError = "301";
        return "false";
      }

      activeVersion = "2004";
      state[key] = String(value ?? "");
      lastError = "0";
      return "true";
    },
    Commit: (_parameter?: string) => {
      if (!initialized) {
        lastError = "301";
        return "false";
      }

      lastError = "0";
      fireAndForget(options.onCommit);
      return "true";
    },
    GetLastError: () => lastError,
    GetErrorString: (errorCode: string) => ERROR_MESSAGES[String(errorCode)] || "Unknown error",
    GetDiagnostic: (errorCode?: string) => ERROR_MESSAGES[String(errorCode || lastError)] || "Unknown error",
  };

  return {
    api,
    api2004,
    context: options.context,
    isInitialized: () => initialized,
    getValue: (key: string) => state[key] ?? "",
    mergeState: (values: Record<string, string>) => {
      Object.entries(values).forEach(([key, value]) => {
        state[key] = String(value ?? "");
      });
    },
    buildTrackingPayload,
  };
}
