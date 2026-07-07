"use client";

export type ScormReviewStatus = "pending" | "reviewed";
export type ScormReviewEvaluation = "correct" | "incorrect";

export interface ScormReviewActor {
  _id?: string;
  name?: string;
  email?: string;
  username?: string;
}

export interface ScormInteractionReview {
  _id: string;
  uniqueKey?: string;
  index: number;
  questionNumber?: number;
  id: string;
  type?: string;
  question?: string;
  questionTitle?: string;
  questionPrompt?: string | null;
  questionAssetPaths?: string[];
  questionBankMatched?: boolean;
  learnerResponse?: string;
  learnerResponseRaw?: string;
  learnerResponseText?: string | null;
  correctResponses?: string[];
  correctResponsesRaw?: string[];
  correctResponseTexts?: string[];
  result?: string;
  isCorrect?: boolean | null;
  score?: number | null;
  latency?: string;
  time?: string;
  attemptTimestamp?: string;
  maxMarks?: number | null;
  source?: "cmi.interactions" | "suspend_data" | "course_quiz";
  rawData?: Record<string, any> | null;
  isReviewable?: boolean;
  review: {
    status: ScormReviewStatus;
    evaluation?: ScormReviewEvaluation | null;
    marks?: number | null;
    reviewedBy?: ScormReviewActor | null;
    reviewedAt?: string | null;
  };
}

export interface ScormAnswerSectionRecord {
  _id: string;
  userId: string;
  courseId: string;
  moduleId: string;
  sectionId: string;
  courseTitle?: string;
  moduleTitle?: string;
  sectionTitle?: string;
  lessonStatus: string;
  score: number | null;
  lessonLocation?: string;
  suspendData?: string | Record<string, any>;
  rawSuspendData?: string;
  totalTime?: string;
  attempts: number;
  lastAccessed?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  reviewSummary: {
    pending: number;
    reviewed: number;
  };
  awardedMarks?: number;
  possibleMarks?: number;
  interactions: ScormInteractionReview[];
}

export interface ScormAnswerModuleGroup {
  moduleId: string;
  moduleTitle: string;
  sections: ScormAnswerSectionRecord[];
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  pending: number;
  reviewed: number;
  awardedMarks: number;
  possibleMarks: number;
}

function normalizeString(value: unknown) {
  return String(value || "").trim();
}

function isGenericQuestionLabel(value: unknown) {
  const normalizedValue = normalizeString(value).toLowerCase();
  if (!normalizedValue) {
    return false;
  }

  return (
    /^question\s*\d+\b/.test(normalizedValue) ||
    /^q\s*\d+\b/.test(normalizedValue) ||
    /^interaction\s*\d+\b/.test(normalizedValue) ||
    /^item\s*\d+\b/.test(normalizedValue)
  );
}

export function formatQuestionTitle(
  interaction: Pick<
    ScormInteractionReview,
    "questionPrompt" | "questionTitle" | "question" | "id" | "index" | "questionNumber" | "type" | "source"
  >,
  fallbackIndex?: number
) {
  const questionNumber = Math.max(
    1,
    Number(interaction.questionNumber || Number(interaction.index ?? fallbackIndex ?? 0) + 1)
  );
  const normalizedType = normalizeString(interaction.type)
    .toLowerCase()
    .replace(/_/g, "-");
  const isManualInput = [
    "essay",
    "fill-in",
    "long-fill-in",
    "long-fillin",
    "short-answer",
    "text",
  ].includes(normalizedType);
  const authoredQuestion = [
    interaction.questionPrompt,
    interaction.questionTitle,
    interaction.question,
  ]
    .map(normalizeString)
    .find((value) => value.length > 3 && !isGenericQuestionLabel(value));

  if (isManualInput) {
    return authoredQuestion || "Question text not available";
  }

  return authoredQuestion || `Question ${questionNumber}`;
}

export function isReviewableInteraction(
  interaction: Pick<ScormInteractionReview, "isReviewable" | "type" | "correctResponses">
) {
  if (typeof interaction.isReviewable === "boolean") {
    return interaction.isReviewable;
  }

  const normalizedType = normalizeString(interaction.type)
    .toLowerCase()
    .replace(/_/g, "-");

  return [
    "essay",
    "fill-in",
    "long-fill-in",
    "long-fillin",
    "short-answer",
    "text",
  ].includes(normalizedType);
}

export function getEffectiveInteractionResult(interaction: Pick<ScormInteractionReview, "result" | "review" | "type" | "correctResponses" | "isReviewable" | "maxMarks">) {
  if (isReviewableInteraction(interaction)) {
    if (interaction.review?.status === "reviewed") {
      const possibleMarks = Math.max(0, Number(interaction.maxMarks ?? 10) || 10);
      const awardedMarks = Number(interaction.review?.marks);

      if (Number.isFinite(awardedMarks)) {
        if (awardedMarks <= 0) {
          return "incorrect";
        }

        if (awardedMarks >= possibleMarks) {
          return "correct";
        }

        return "partial";
      }

      if (interaction.review?.evaluation) {
        return interaction.review.evaluation;
      }
    }

    return "";
  }

  return normalizeString(interaction.result).toLowerCase();
}

function isCorrectResult(result?: string) {
  const normalized = normalizeString(result).toLowerCase();
  return normalized === "correct" || normalized === "passed";
}

function isIncorrectResult(result?: string) {
  const normalized = normalizeString(result).toLowerCase();
  return normalized === "incorrect" || normalized === "failed" || normalized === "wrong";
}

function parseStructuredOrder(value: string, fallback: number) {
  const normalized = normalizeString(value);
  const sectionMatch = normalized.match(/section-(\d+)/i);
  if (sectionMatch) {
    return Number(sectionMatch[1]);
  }

  const moduleMatch = normalized.match(/module-(\d+)/i);
  if (moduleMatch) {
    return Number(moduleMatch[1]);
  }

  const trailingNumberMatch = normalized.match(/(\d+)(?!.*\d)/);
  if (trailingNumberMatch) {
    return Number(trailingNumberMatch[1]);
  }

  return fallback;
}

function compareStructuredValues(left: { orderKey: string; title: string }, right: { orderKey: string; title: string }) {
  const leftOrder = parseStructuredOrder(left.orderKey, 9999);
  const rightOrder = parseStructuredOrder(right.orderKey, 9999);

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left.title.localeCompare(right.title);
}

function hasVisibleResponse(interaction: ScormInteractionReview) {
  const learnerResponse = normalizeString(
    interaction.learnerResponseRaw || interaction.learnerResponse
  );
  return Boolean(
    normalizeString(interaction.id) &&
    (
      (learnerResponse.length > 0 && !learnerResponse.toLowerCase().includes("loading")) ||
      normalizeString(interaction.result) ||
      normalizeString(interaction.type)
    )
  );
}

function shouldIncludeReviewedOnly(interaction: ScormInteractionReview) {
  if (!isReviewableInteraction(interaction)) {
    return true;
  }

  return interaction.review?.status === "reviewed";
}

function getInteractionPossibleMarks(interaction: ScormInteractionReview) {
  const explicitMarks = Number(interaction.maxMarks);
  if (Number.isFinite(explicitMarks) && explicitMarks > 0) {
    return explicitMarks;
  }

  if (isReviewableInteraction(interaction)) {
    return 10;
  }

  return 1;
}

function getInteractionAwardedMarks(interaction: ScormInteractionReview) {
  const possibleMarks = getInteractionPossibleMarks(interaction);

  if (isReviewableInteraction(interaction)) {
    if (interaction.review?.status !== "reviewed") {
      return 0;
    }

    const awardedMarks = Number(interaction.review?.marks);
    if (!Number.isFinite(awardedMarks)) {
      return 0;
    }

    return Math.max(0, Math.min(possibleMarks, awardedMarks));
  }

  return isCorrectResult(getEffectiveInteractionResult(interaction)) ? possibleMarks : 0;
}

function summarizeInteractions(interactions: ScormInteractionReview[]) {
  return interactions.reduce(
    (summary, interaction) => {
      const effectiveResult = getEffectiveInteractionResult(interaction);
      const isReviewable = isReviewableInteraction(interaction);

      return {
        totalQuestions: summary.totalQuestions + 1,
        correctCount: summary.correctCount + (isCorrectResult(effectiveResult) ? 1 : 0),
        incorrectCount: summary.incorrectCount + (isIncorrectResult(effectiveResult) ? 1 : 0),
        pending: summary.pending + (isReviewable && interaction.review?.status !== "reviewed" ? 1 : 0),
        reviewed: summary.reviewed + (isReviewable && interaction.review?.status === "reviewed" ? 1 : 0),
        awardedMarks: summary.awardedMarks + getInteractionAwardedMarks(interaction),
        possibleMarks: summary.possibleMarks + getInteractionPossibleMarks(interaction),
      };
    },
    {
      totalQuestions: 0,
      correctCount: 0,
      incorrectCount: 0,
      pending: 0,
      reviewed: 0,
      awardedMarks: 0,
      possibleMarks: 0,
    }
  );
}

export function sanitizeAnswerSections(
  sections: ScormAnswerSectionRecord[],
  options: { showOnlyReviewed?: boolean } = {}
) {
  const showOnlyReviewed = Boolean(options.showOnlyReviewed);

  return sections
    .map((section) => {
      const interactions = (section.interactions || []).filter((interaction) => {
        if (!hasVisibleResponse(interaction)) {
          return false;
        }

        if (!showOnlyReviewed) {
          return true;
        }

        return shouldIncludeReviewedOnly(interaction);
      });
      const summary = summarizeInteractions(interactions);

      return {
        ...section,
        interactions,
        totalQuestions: summary.totalQuestions,
        correctCount: summary.correctCount,
        incorrectCount: summary.incorrectCount,
        reviewSummary: {
          pending: summary.pending,
          reviewed: summary.reviewed,
        },
        awardedMarks: summary.awardedMarks,
        possibleMarks: summary.possibleMarks,
      };
    })
    .filter((section) => section.interactions.length > 0)
    .sort((left, right) =>
      compareStructuredValues(
        {
          orderKey: `${left.moduleId}:${left.sectionId}`,
          title: normalizeString(left.sectionTitle) || left.sectionId,
        },
        {
          orderKey: `${right.moduleId}:${right.sectionId}`,
          title: normalizeString(right.sectionTitle) || right.sectionId,
        }
      )
    );
}

export function groupAnswerSections(
  sections: ScormAnswerSectionRecord[],
  options: { showOnlyReviewed?: boolean } = {}
) {
  const sanitizedSections = sanitizeAnswerSections(sections, options);
  const moduleMap = new Map<string, ScormAnswerModuleGroup>();

  sanitizedSections.forEach((section) => {
    const moduleId = normalizeString(section.moduleId) || "module";
    const existingModule = moduleMap.get(moduleId);
    const sectionSummary = summarizeInteractions(section.interactions);

    if (!existingModule) {
      moduleMap.set(moduleId, {
        moduleId,
        moduleTitle: normalizeString(section.moduleTitle) || moduleId,
        sections: [section],
        totalQuestions: sectionSummary.totalQuestions,
        correctCount: sectionSummary.correctCount,
        incorrectCount: sectionSummary.incorrectCount,
        pending: sectionSummary.pending,
        reviewed: sectionSummary.reviewed,
        awardedMarks: sectionSummary.awardedMarks,
        possibleMarks: sectionSummary.possibleMarks,
      });
      return;
    }

    existingModule.sections.push(section);
    existingModule.totalQuestions += sectionSummary.totalQuestions;
    existingModule.correctCount += sectionSummary.correctCount;
    existingModule.incorrectCount += sectionSummary.incorrectCount;
    existingModule.pending += sectionSummary.pending;
    existingModule.reviewed += sectionSummary.reviewed;
    existingModule.awardedMarks += sectionSummary.awardedMarks;
    existingModule.possibleMarks += sectionSummary.possibleMarks;
  });

  return Array.from(moduleMap.values())
    .map((moduleGroup) => ({
      ...moduleGroup,
      sections: [...moduleGroup.sections].sort((left, right) =>
        compareStructuredValues(
          { orderKey: left.sectionId, title: normalizeString(left.sectionTitle) || left.sectionId },
          { orderKey: right.sectionId, title: normalizeString(right.sectionTitle) || right.sectionId }
        )
      ),
    }))
    .sort((left, right) =>
      compareStructuredValues(
        { orderKey: left.moduleId, title: normalizeString(left.moduleTitle) || left.moduleId },
        { orderKey: right.moduleId, title: normalizeString(right.moduleTitle) || right.moduleId }
      )
    );
}

export function summarizeAnswerSections(sections: ScormAnswerSectionRecord[]) {
  return sanitizeAnswerSections(sections).reduce(
    (summary, section) => ({
      totalQuestions: summary.totalQuestions + Number(section.totalQuestions || 0),
      correctCount: summary.correctCount + Number(section.correctCount || 0),
      incorrectCount: summary.incorrectCount + Number(section.incorrectCount || 0),
      pending: summary.pending + Number(section.reviewSummary?.pending || 0),
      reviewed: summary.reviewed + Number(section.reviewSummary?.reviewed || 0),
      awardedMarks: summary.awardedMarks + Number(section.awardedMarks || 0),
      possibleMarks: summary.possibleMarks + Number(section.possibleMarks || 0),
    }),
    {
      totalQuestions: 0,
      correctCount: 0,
      incorrectCount: 0,
      pending: 0,
      reviewed: 0,
      awardedMarks: 0,
      possibleMarks: 0,
    }
  );
}

export function estimateCompletedSections(progress?: number | null, totalSections?: number | null) {
  const safeTotalSections = Math.max(0, Number(totalSections || 0));
  if (!safeTotalSections) {
    return 0;
  }

  const safeProgress = Math.max(0, Math.min(100, Number(progress || 0)));
  return Math.max(0, Math.min(safeTotalSections, Math.round((safeProgress / 100) * safeTotalSections)));
}
