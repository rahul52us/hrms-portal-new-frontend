"use client";

export type LearningProgressState = "completed" | "in_progress" | "not_started";

const COMPLETED_STATUSES = new Set(["completed", "passed"]);
const ACTIVE_STATUSES = new Set(["incomplete", "failed", "browsed", "in_progress"]);

export function clampLearningProgress(value?: number | null) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

export function getLearningProgressState(status?: string | null, progress?: number | null): LearningProgressState {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const safeProgress = clampLearningProgress(progress);

  if (COMPLETED_STATUSES.has(normalizedStatus) || safeProgress >= 100) {
    return "completed";
  }

  if (ACTIVE_STATUSES.has(normalizedStatus) || safeProgress > 0) {
    return "in_progress";
  }

  return "not_started";
}

export function getLearningStatusLabel(status?: string | null, progress?: number | null) {
  const safeProgress = clampLearningProgress(progress);
  const state = getLearningProgressState(status, safeProgress);

  if (state === "completed") {
    return "Completed";
  }

  if (state === "in_progress") {
    return safeProgress > 0 ? `In progress ${safeProgress}%` : "In progress";
  }

  return "Not started";
}

export function getLearningStatusColorScheme(status?: string | null, progress?: number | null) {
  const state = getLearningProgressState(status, progress);

  if (state === "completed") {
    return "green";
  }

  if (state === "in_progress") {
    return "blue";
  }

  return "gray";
}

export function getLearningStatusMeta(status?: string | null, progress?: number | null) {
  const state = getLearningProgressState(status, progress);

  return {
    state,
    progress: clampLearningProgress(progress),
    label: getLearningStatusLabel(status, progress),
    colorScheme: getLearningStatusColorScheme(status, progress),
  };
}
