"use client";

import ScormQuizReviewContent from "@/app/dashboard/course/scorm/ScormQuizReviewContent";
import {
  clampLearningProgress,
  getLearningProgressState,
  getLearningStatusMeta,
} from "@/app/dashboard/course/scorm/progressPresentation";
import {
  estimateCompletedSections,
  ScormAnswerSectionRecord,
  summarizeAnswerSections,
} from "@/app/dashboard/course/scorm/quizReviewTypes";
import {
  buildCourseAssetUrl,
  buildLaunchSection,
  CourseLaunchSection,
  deriveModuleId,
  deriveSectionId,
  getFirstPlayableLaunchSection,
  isScormLaunchSection,
  preloadCourseAsset,
} from "@/app/dashboard/course/scorm/sectionTracking";
import { CourseQuizForLearner } from "@/app/store/courseStore/courseStore";
import {
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  Download,
  ExternalLink,
  FileBox,
  FileText,
  GraduationCap,
  Layers,
  PlayCircle,
  Rocket,
  Star,
  Users,
  Video,
} from "lucide-react";
import { useMemo } from "react";

function normalizeMaterials(materials: any) {
  return Array.isArray(materials) ? materials.filter(Boolean) : [];
}

function getStartLearningLabel(
  launchSection: CourseLaunchSection | null,
  fallbackPath?: string | null
) {
  if (launchSection?.contentKind === "video") return "Watch Lesson";
  if (launchSection?.contentKind === "document") return "Open Lesson";
  if (launchSection && isScormLaunchSection(launchSection)) return "Start SCORM";
  if (fallbackPath) return "Start Learning";
  return "No lesson asset";
}

function getSectionActionLabel(
  launchSection: CourseLaunchSection | null,
  status?: string | null,
  progress?: number | null
) {
  if (!launchSection) {
    return "Lesson unavailable";
  }

  const state = getLearningProgressState(status, progress);
  if (state === "completed") {
    if (launchSection.contentKind === "video") return "Rewatch video";
    if (launchSection.contentKind === "document") return "Reopen document";
    return "Review lesson";
  }

  if (state === "in_progress") {
    if (launchSection.contentKind === "video") return "Resume video";
    if (launchSection.contentKind === "document") return "Continue document";
    return "Continue lesson";
  }

  if (launchSection.contentKind === "video") return "Start video";
  if (launchSection.contentKind === "document") return "Open document";
  return "Start lesson";
}

function getSectionTypeLabel(contentKind?: string | null) {
  const normalizedKind = String(contentKind || "").trim().toLowerCase();
  if (normalizedKind === "video") return "VIDEO";
  if (normalizedKind === "document") return "DOCUMENT";
  if (normalizedKind === "scorm" || normalizedKind === "zip") return "SCORM";
  return normalizedKind ? normalizedKind.toUpperCase() : "";
}

function formatAccessLabel(value?: string | null) {
  if (!value) return "No expiry";
  const accessDate = new Date(value);
  if (Number.isNaN(accessDate.getTime())) return "No expiry";
  return accessDate.toLocaleDateString();
}

function formatCompactNumber(value: unknown, fallback: string) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback;
  }

  return numericValue.toLocaleString();
}

function getInstructor(course: any) {
  return {
    name: String(course?.instructor?.name || "").trim() || "Course Instructor",
    designation: String(course?.instructor?.designation || "").trim(),
    companyName: String(course?.instructor?.companyName || "").trim(),
    avatarUrl: String(course?.instructor?.avatarUrl || "").trim(),
  };
}

function getInstructorMeta(instructor: ReturnType<typeof getInstructor>) {
  return [instructor.designation, instructor.companyName].filter(Boolean).join(" - ");
}

function getInstructorInitials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "CI";
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

function getLearningOutcomes(course: any) {
  const storedItems = Array.isArray(course?.highlights?.learningOutcomes)
    ? course.highlights.learningOutcomes
        .map((item: any) => String(item || "").trim())
        .filter(Boolean)
    : [];

  if (storedItems.length > 0) {
    return storedItems;
  }

  return Array.isArray(course?.curriculum?.modules)
    ? course.curriculum.modules
        .flatMap((moduleRecord: any) => [moduleRecord?.summary, moduleRecord?.title])
        .map((item: any) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
}

function getMaterialGroups(course: any) {
  const modules = Array.isArray(course?.curriculum?.modules) ? course.curriculum.modules : [];

  return modules
    .map((moduleRecord: any, moduleIndex: number) => {
      const moduleMaterials = normalizeMaterials(moduleRecord?.studyMaterial);
      const sections = (moduleRecord?.sections || [])
        .map((sectionRecord: any, sectionIndex: number) => ({
          id: `${moduleIndex + 1}-${sectionIndex + 1}`,
          title: String(sectionRecord?.title || `Section ${sectionIndex + 1}`),
          label: `Section ${moduleIndex + 1}.${sectionIndex + 1}`,
          materials: normalizeMaterials(sectionRecord?.studyMaterial),
        }))
        .filter((sectionRecord: any) => sectionRecord.materials.length > 0);

      if (!moduleMaterials.length && !sections.length) {
        return null;
      }

      return {
        id: String(moduleRecord?.moduleId || moduleRecord?.id || moduleIndex + 1),
        index: moduleIndex + 1,
        title: String(moduleRecord?.title || `Module ${moduleIndex + 1}`),
        moduleMaterials,
        sections,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    index: number;
    title: string;
    moduleMaterials: any[];
    sections: Array<{ id: string; title: string; label: string; materials: any[] }>;
  }>;
}

function getSectionIcon(kind: string, completed: boolean, hasLaunch: boolean) {
  if (completed) return CheckCircle;
  if (kind === "video") return Video;
  if (kind === "document") return FileText;
  if (hasLaunch) return PlayCircle;
  return BookOpen;
}

function getMaterialUrl(material: any) {
  const rawPath = String(
    material?.previewUrl ||
      material?.assetPath ||
      material?.path ||
      material?.url ||
      material?.file ||
      ""
  ).trim();

  return rawPath ? buildCourseAssetUrl(rawPath) : "";
}

function getPriceLabel(course: any) {
  if (course?.commerce?.pricingModel === "paid" && Number(course?.commerce?.amountInRupees) > 0) {
    return `INR ${Number(course.commerce.amountInRupees).toLocaleString()}`;
  }

  return "Free";
}

interface CourseDetailsProps {
  course: any;
  onBack: () => void;
  onLaunchSection: (launchSection: CourseLaunchSection) => void;
  onAssignCourse?: (course: any) => void;
  learnerAnswers?: ScormAnswerSectionRecord[];
  isLearnerAnswersLoading?: boolean;
  courseQuizzes?: CourseQuizForLearner[];
  isCourseQuizzesLoading?: boolean;
  onTakeQuiz?: (quiz: CourseQuizForLearner) => void;
  onDownloadCertificate?: (courseId: string) => void;
  isCertificateDownloading?: boolean;
  onEnrollCourse?: () => void;
  isEnrolling?: boolean;
}

export default function CourseDetails({
  course,
  onBack,
  onLaunchSection,
  onAssignCourse,
  learnerAnswers = [],
  isLearnerAnswersLoading = false,
  courseQuizzes = [],
  isCourseQuizzesLoading = false,
  onTakeQuiz,
  onDownloadCertificate,
  isCertificateDownloading = false,
  onEnrollCourse,
  isEnrolling = false,
}: CourseDetailsProps) {
  const isAssignedCourseView = Array.isArray(course.sources);
  const firstPlayableLaunchSection = getFirstPlayableLaunchSection(course);
  const answerSummary = summarizeAnswerSections(learnerAnswers);
  const totalSections = Number(course.curriculum?.totalSections || 0);
  const progressModules = Array.isArray(course.progressModules) ? course.progressModules : [];
  const courseId = String(course._id || course.courseId || "").trim();
  const certificateReason =
    course.certificate?.reason || "Certificate will be available after eligibility is confirmed.";
  const certificateStatus = String(course.certificate?.status || "").trim().toLowerCase();
  const canDownloadCertificate = Boolean(
    isAssignedCourseView &&
    course.progression?.certificateEnabled !== false &&
    course.certificate?.enabled !== false &&
    course.certificate &&
    (certificateStatus === "issued" || course.certificate.canIssue)
  );
  const modules = Array.isArray(course.curriculum?.modules) ? course.curriculum.modules : [];

  const warmLaunchSection = (launchSection?: CourseLaunchSection | null) => {
    if (launchSection && isScormLaunchSection(launchSection)) {
      void preloadCourseAsset(launchSection.assetPath).catch(() => undefined);
    }
  };

  const moduleProgressMap = useMemo(
    () => new Map<string, any>(progressModules.map((moduleRecord: any) => [moduleRecord.moduleId, moduleRecord])),
    [progressModules]
  );

  const sectionProgressMap = useMemo(() => {
    const nextMap = new Map<string, any>();

    progressModules.forEach((moduleRecord: any) => {
      (moduleRecord.sections || []).forEach((sectionRecord: any) => {
        nextMap.set(sectionRecord.sectionId, sectionRecord);
      });
    });

    return nextMap;
  }, [progressModules]);

  const sectionSummary = useMemo(() => {
    let computedTotal = 0;
    let completed = 0;
    let inProgress = 0;

    modules.forEach((moduleRecord: any) => {
      (moduleRecord.sections || []).forEach((sectionRecord: any) => {
        computedTotal += 1;
        const trackingRecord = sectionProgressMap.get(deriveSectionId(moduleRecord, sectionRecord));
        const state = getLearningProgressState(trackingRecord?.lessonStatus, trackingRecord?.progress);

        if (state === "completed") {
          completed += 1;
          return;
        }

        if (state === "in_progress") {
          inProgress += 1;
        }
      });
    });

    return {
      total: computedTotal || totalSections,
      completed,
      inProgress,
      notStarted: Math.max((computedTotal || totalSections) - completed - inProgress, 0),
    };
  }, [modules, sectionProgressMap, totalSections]);

  const sectionsCompleted = isAssignedCourseView
    ? sectionSummary.completed
    : estimateCompletedSections(course.progress, totalSections);

  const nextLaunchSection = useMemo(() => {
    let firstIncompleteLaunchSection: CourseLaunchSection | null = null;

    for (const moduleRecord of modules) {
      for (const sectionRecord of moduleRecord.sections || []) {
        const launchSection = buildLaunchSection(moduleRecord, sectionRecord);
        if (!launchSection) {
          continue;
        }

        const trackingRecord = sectionProgressMap.get(launchSection.sectionId);
        const state = getLearningProgressState(trackingRecord?.lessonStatus, trackingRecord?.progress);

        if (state === "in_progress") {
          return launchSection;
        }

        if (!firstIncompleteLaunchSection && state !== "completed") {
          firstIncompleteLaunchSection = launchSection;
        }
      }
    }

    return firstIncompleteLaunchSection || firstPlayableLaunchSection;
  }, [firstPlayableLaunchSection, modules, sectionProgressMap]);

  const nextLaunchTracking = nextLaunchSection ? sectionProgressMap.get(nextLaunchSection.sectionId) : null;
  const nextLaunchLabel = getSectionActionLabel(
    nextLaunchSection,
    nextLaunchTracking?.lessonStatus,
    nextLaunchTracking?.progress
  );

  const pendingQuizzes = courseQuizzes.filter((quiz) => !quiz.attempt);
  const completedQuizzes = courseQuizzes.filter((quiz) => quiz.attempt);
  const nextQuiz = pendingQuizzes[0] || courseQuizzes[0] || null;
  const instructor = useMemo(() => getInstructor(course), [course]);
  const instructorMeta = getInstructorMeta(instructor);
  const learningOutcomes = useMemo(() => getLearningOutcomes(course), [course]);
  const materialGroups = useMemo(() => getMaterialGroups(course), [course]);
  const totalMaterialCount = materialGroups.reduce(
    (count, group) =>
      count +
      group.moduleMaterials.length +
      group.sections.reduce((sectionTotal, sectionGroup) => sectionTotal + sectionGroup.materials.length, 0),
    0
  );
  const totalModuleCount = Number(course.curriculum?.totalModules || modules.length || 0);
  const totalLessonCount = Number(course.curriculum?.totalSections || sectionSummary.total || 0);
  const ratingLabel = Number.isFinite(Number(course?.metrics?.averageRating))
    ? Number(course.metrics.averageRating).toFixed(1)
    : "4.9";
  const reviewCountLabel = formatCompactNumber(course?.metrics?.reviewCount, "1,284");
  const learnersLabel = formatCompactNumber(course?.metrics?.totalEnrollments, "18,420");
  const durationLabel = String(course?.estimatedDuration || course?.durationLabel || "").trim() || "8h 42m";
  const progressLabel = clampLearningProgress(course.progress);
  const priceLabel = getPriceLabel(course);
  const categories = Array.isArray(course.taxonomy?.categories) ? course.taxonomy.categories : [];
  const levelLabel = String(course.taxonomy?.level || "Beginner");
  const visibilityLabel =
    course.visibility?.type === "public" ? "Public Course" : course.visibility?.type ? "Private Course" : "";
  const nextCardLabel = isAssignedCourseView
    ? `${sectionSummary.completed} of ${sectionSummary.total} lessons completed`
    : `${totalModuleCount} modules - ${totalLessonCount} lessons`;
  const heroSnapshotLabel = isAssignedCourseView ? `${progressLabel}%` : `${totalModuleCount} modules`;
  const finalQuizzes = courseQuizzes.filter((quiz) => quiz.scope === "final");
  const showQuizReview = isAssignedCourseView || learnerAnswers.length > 0 || courseQuizzes.length > 0;
  const previewLaunchSection = firstPlayableLaunchSection || nextLaunchSection;

  const renderQuizCard = (quiz: CourseQuizForLearner) => {
    const completed = Boolean(quiz.attempt);

    return (
      <div
        key={quiz.quizId}
        className={`mt-3 rounded-2xl border p-4 ${
          completed
            ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20"
            : "border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${
                completed ? "bg-emerald-500" : "bg-amber-500"
              }`}
            >
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{quiz.title}</p>
              <p className="text-xs text-muted-foreground">
                {quiz.questionCount} question{quiz.questionCount === 1 ? "" : "s"} - {quiz.totalMarks} marks
              </p>
              <p className={`mt-1 text-sm ${completed ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                {completed
                  ? `Score ${quiz.attempt?.score}/${quiz.attempt?.maxScore} (${Math.round(
                      Number(quiz.attempt?.percentage || 0)
                    )}%)`
                  : "Required quiz waiting for you"}
              </p>
            </div>
          </div>
          {onTakeQuiz ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onTakeQuiz(quiz);
              }}
              className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition ${
                completed
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              {completed ? "View Result" : "Take Quiz"}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const renderMaterialLink = (material: any, helperText: string, key: string) => {
    const materialUrl = getMaterialUrl(material);
    const hasUrl = Boolean(materialUrl);

    return (
      <div
        key={key}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {material?.name || "Study material"}
            </p>
            <p className="text-xs text-muted-foreground">{helperText}</p>
          </div>
        </div>
        <div className="flex gap-2 sm:justify-end">
          {hasUrl ? (
            <>
              <a
                href={materialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-foreground transition hover:bg-muted sm:flex-none"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </a>
              <a
                href={materialUrl}
                download
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium text-primary transition hover:bg-primary/10 sm:flex-none"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Material link unavailable</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(56% 56% at 100% 0%, hsl(var(--primary) / 0.18), transparent 55%), radial-gradient(42% 42% at 0% 36%, hsl(var(--accent) / 0.14), transparent 62%)",
          }}
        />

        <div className="mx-auto max-w-8xl px-1 pb-8 pt-5 sm:px-4 sm:pb-10 sm:pt-8 lg:px-6 lg:pb-14">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-start lg:gap-10">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                {onAssignCourse ? (
                  <button
                    type="button"
                    onClick={() => onAssignCourse(course)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-primary/20 bg-primary/5 px-4 text-sm font-medium text-primary transition hover:bg-primary/10"
                  >
                    Assign Course
                  </button>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {levelLabel}
                </span>
                {categories.slice(0, 2).map((category: string, index: number) => (
                  <span
                    key={`${category}-${index}`}
                    className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    {category}
                  </span>
                ))}
                {visibilityLabel ? (
                  <span className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground">
                    {visibilityLabel}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.7rem]">
                {course.title}
              </h1>

              <div
                className="prose prose-sm mt-4 max-w-none text-muted-foreground prose-headings:text-foreground prose-p:leading-7 prose-strong:text-foreground"
                dangerouslySetInnerHTML={{
                  __html: course.description?.html || course.description?.text || "<p>No description provided.</p>",
                }}
              />

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">{ratingLabel}</span>
                  <span>({reviewCountLabel})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {learnersLabel} learners
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {durationLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {totalLessonCount} lessons
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                {instructor.avatarUrl ? (
                  <img
                    src={instructor.avatarUrl}
                    alt={instructor.name}
                    className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-background shadow-sm"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {getInstructorInitials(instructor.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{instructor.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {instructorMeta || "Instructor details will appear here"}
                  </p>
                </div>
              </div>

              {!isAssignedCourseView ? (
                <div className="mt-6 rounded-[1.6rem] border border-border bg-card p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Enrollment price
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="text-xl font-semibold text-foreground">{priceLabel}</span>
                        <span className="ml-2">- {totalMaterialCount} materials</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onEnrollCourse}
                      disabled={isEnrolling}
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
                    >
                      <Rocket className="h-4 w-4" />
                      {isEnrolling ? "Enrolling..." : "Self Enroll Now"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[1.6rem] border border-border bg-card p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {isAssignedCourseView ? "Your progress" : "Course snapshot"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="text-xl font-semibold text-foreground">{heroSnapshotLabel}</span>
                        <span className="ml-2">
                          {isAssignedCourseView
                            ? `- ${sectionSummary.completed}/${sectionSummary.total} lessons`
                            : `- ${totalMaterialCount} materials`}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onMouseEnter={() => warmLaunchSection(nextLaunchSection)}
                      onFocus={() => warmLaunchSection(nextLaunchSection)}
                      onClick={() => {
                        if (nextLaunchSection) {
                          onLaunchSection(nextLaunchSection);
                          return;
                        }

                        if (course.scormFilePath) {
                          onLaunchSection({
                            assetPath: course.scormFilePath,
                            contentKind: "scorm",
                            moduleId: "",
                            moduleTitle: "",
                            sectionId: "",
                            sectionTitle: course.title || "Course",
                          });
                        }
                      }}
                      disabled={!nextLaunchSection && !course.scormFilePath}
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Rocket className="h-4 w-4" />
                      {isAssignedCourseView
                        ? nextLaunchLabel
                        : getStartLearningLabel(firstPlayableLaunchSection, course.scormFilePath)}
                    </button>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{
                        width: `${isAssignedCourseView ? progressLabel : Math.min(totalModuleCount * 12, 100)}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{nextCardLabel}</span>
                    <span>{durationLabel}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="order-first lg:order-last">
              <div className="group relative overflow-hidden rounded-[1.8rem] border border-border bg-muted shadow-xl shadow-black/5">
                <div className="aspect-video w-full">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-accent">
                      <GraduationCap className="h-12 w-12 text-primary" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <button
                  type="button"
                  onClick={() => {
                    if (previewLaunchSection) {
                      onLaunchSection(previewLaunchSection);
                    }
                  }}
                  disabled={!previewLaunchSection}
                  className="absolute inset-0 flex items-center justify-center"
                  aria-label="Play preview"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-background/90 text-foreground shadow-lg transition group-hover:scale-110">
                    <PlayCircle className="h-8 w-8" />
                  </span>
                </button>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90">
                  <span className="rounded-full bg-black/45 px-3 py-1 backdrop-blur">
                    Preview course
                  </span>
                  <span className="rounded-full bg-black/45 px-3 py-1 backdrop-blur">
                    {durationLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-8xl gap-4 px-1 pb-20 sm:gap-6 sm:px-4 lg:grid-cols-[1.55fr_1fr] lg:gap-10 lg:px-6">
        <div className="min-w-0 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground">Course content</h2>
              <p className="text-sm text-muted-foreground">
                {totalModuleCount} modules - {totalLessonCount} lessons - {durationLabel}
              </p>
            </div>
          </div>

          <div className="-mx-1 overflow-hidden rounded-[1.05rem] border border-border bg-card shadow-sm sm:mx-0 sm:rounded-[1.7rem]">
            {modules.length > 0 ? (
              <div className="divide-y divide-border/70">
                {modules.map((mod: any, moduleIndex: number) => {
                  const moduleTracking = moduleProgressMap.get(deriveModuleId(mod));
                  const moduleProgressMeta = getLearningStatusMeta(
                    moduleTracking?.lessonStatus,
                    moduleTracking?.progress
                  );
                  const moduleSections = Array.isArray(mod.sections) ? mod.sections : [];
                  const moduleCompletedCount = moduleSections.filter((sec: any) => {
                    const trackingRecord = sectionProgressMap.get(deriveSectionId(mod, sec));
                    return getLearningProgressState(trackingRecord?.lessonStatus, trackingRecord?.progress) === "completed";
                  }).length;
                  const moduleProgressPercent = moduleSections.length
                    ? Math.round((moduleCompletedCount / moduleSections.length) * 100)
                    : 0;
                  const moduleQuizzes = courseQuizzes.filter(
                    (quiz) => quiz.scope === "module" && quiz.moduleId === deriveModuleId(mod)
                  );

                  return (
                    <details
                      key={deriveModuleId(mod)}
                      open={moduleIndex < 2}
                      className="[&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="cursor-pointer list-none px-2.5 py-3 sm:px-5 sm:py-4">
                        <div className="flex w-full items-center gap-2.5 sm:gap-3">
                          <div
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-semibold sm:h-11 sm:w-11 sm:rounded-2xl ${
                              isAssignedCourseView && moduleProgressMeta.state === "completed"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {isAssignedCourseView && moduleProgressMeta.state === "completed" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <span className="flex flex-col items-center leading-none">
                                <span className="text-[9px] uppercase tracking-[0.16em] opacity-70">Mod</span>
                                <span className="mt-1 text-xs font-bold">{String(moduleIndex + 1).padStart(2, "0")}</span>
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                              Module {moduleIndex + 1}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-foreground sm:truncate sm:text-[15px]">
                              {mod.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span>
                                {moduleSections.length} section{moduleSections.length === 1 ? "" : "s"}
                              </span>
                              {isAssignedCourseView && moduleTracking ? (
                                <span>
                                  {moduleTracking.sectionsCompleted}/{moduleTracking.sectionCount} complete
                                </span>
                              ) : null}
                              {isAssignedCourseView ? <span>{moduleProgressPercent}% done</span> : null}
                            </div>
                          </div>

                          <div className="hidden items-center gap-3 sm:flex">
                            {isAssignedCourseView ? (
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                                  moduleProgressMeta.state === "completed"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                    : moduleProgressMeta.state === "in_progress"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {moduleProgressMeta.label}
                              </span>
                            ) : null}
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-[width] duration-500"
                                style={{ width: `${moduleProgressPercent}%` }}
                              />
                            </div>
                            <span className="w-9 text-right text-xs font-medium text-muted-foreground">
                              {moduleProgressPercent}%
                            </span>
                          </div>

                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                        </div>
                      </summary>

                      <div className="border-t border-border/70 px-1.5 pb-3 pt-2 sm:px-5 sm:pb-5 sm:pt-3">
                        {mod.summary ? (
                          <p className="pb-4 text-sm leading-6 text-muted-foreground">{mod.summary}</p>
                        ) : null}

                        <ol className="relative space-y-2 border-l border-dashed border-border pl-2.5 sm:pl-5">
                          {moduleSections.map((sec: any, index: number) => {
                            const launchSection = buildLaunchSection(mod, sec);
                            const sectionTracking = sectionProgressMap.get(deriveSectionId(mod, sec));
                            const sectionProgressMeta = getLearningStatusMeta(
                              sectionTracking?.lessonStatus,
                              sectionTracking?.progress
                            );
                            const sectionStudyMaterials = normalizeMaterials(sec.studyMaterial);
                            const contentKind = String(sec.content?.kind || "").trim().toLowerCase();
                            const contentTagLabel = getSectionTypeLabel(contentKind);
                            const SectionIcon = getSectionIcon(
                              contentKind,
                              sectionProgressMeta.state === "completed",
                              Boolean(launchSection)
                            );

                            return (
                              <li key={deriveSectionId(mod, sec)} className="relative">
                                <span className="absolute -left-[13px] top-8 h-2 w-2 rounded-full bg-border sm:-left-[19px]" />
                                <button
                                  type="button"
                                  disabled={!launchSection}
                                  onMouseEnter={() => warmLaunchSection(launchSection)}
                                  onFocus={() => warmLaunchSection(launchSection)}
                                  onClick={() => {
                                    if (!isAssignedCourseView) {
                                      if (onEnrollCourse) {
                                        onEnrollCourse();
                                      }
                                      return;
                                    }
                                    if (launchSection) {
                                      onLaunchSection(launchSection);
                                    }
                                  }}
                                  className={`group flex w-full items-start gap-2 rounded-xl border px-2 py-3 text-left transition sm:gap-3 sm:rounded-2xl sm:px-4 ${
                                    sectionProgressMeta.state === "completed"
                                      ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/15"
                                      : "border-border bg-background hover:border-primary/30 hover:bg-muted/40"
                                  } ${!launchSection ? "cursor-not-allowed opacity-70" : ""}`}
                                >
                                  <span
                                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${
                                      sectionProgressMeta.state === "completed"
                                        ? "bg-emerald-500 text-white"
                                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                    }`}
                                  >
                                    <SectionIcon className="h-4 w-4" />
                                  </span>

                                  <span className="min-w-0 flex-1 overflow-hidden">
                                    <span className="flex flex-wrap items-center gap-2">
                                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                        Section {moduleIndex + 1}.{index + 1}
                                      </span>
                                      {contentTagLabel ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                          <FileBox className="h-3 w-3" />
                                          {contentTagLabel}
                                        </span>
                                      ) : null}
                                      {isAssignedCourseView ? (
                                        <span
                                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                                            sectionProgressMeta.state === "completed"
                                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                              : sectionProgressMeta.state === "in_progress"
                                                ? "bg-primary/10 text-primary"
                                                : "bg-muted text-muted-foreground"
                                          }`}
                                        >
                                          {sectionProgressMeta.label}
                                        </span>
                                      ) : null}
                                    </span>

                                    <span className="mt-1 block break-words text-sm font-semibold leading-5 text-foreground">
                                      {sec.title}
                                    </span>

                                    {sec.description ? (
                                      <span className="mt-1 block break-words text-sm leading-6 text-muted-foreground">
                                        {sec.description}
                                      </span>
                                    ) : null}

                                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                      {isAssignedCourseView ? (
                                        <span>{sectionProgressMeta.progress}% progress</span>
                                      ) : null}
                                      {sectionStudyMaterials.length > 0 ? (
                                        <span>
                                          {sectionStudyMaterials.length} study material
                                          {sectionStudyMaterials.length === 1 ? "" : "s"}
                                        </span>
                                      ) : null}
                                      <span>
                                        {launchSection
                                          ? getSectionActionLabel(
                                              launchSection,
                                              sectionTracking?.lessonStatus,
                                              sectionTracking?.progress
                                            )
                                          : "Lesson unavailable"}
                                      </span>
                                    </span>
                                  </span>

                                  <PlayCircle className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                                </button>
                              </li>
                            );
                          })}
                        </ol>

                        {moduleQuizzes.map(renderQuizCard)}
                      </div>
                    </details>
                  );
                })}

                {finalQuizzes.length > 0 ? (
                  <div className="px-4 py-4 sm:px-5">
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Final quizzes</p>
                          <p className="text-xs text-muted-foreground">
                            Course-level quizzes that appear after module work.
                          </p>
                        </div>
                      </div>
                      {finalQuizzes.map(renderQuizCard)}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="p-5 text-sm text-muted-foreground">No curriculum has been added to this course yet.</div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground">What you&apos;ll learn</h2>
              <p className="text-sm text-muted-foreground">
                Clear takeaways learners can expect from this course.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {learningOutcomes.length > 0 ? (
              learningOutcomes.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-foreground">{item}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground sm:col-span-2">
                Learning outcomes have not been added for this course yet.
              </div>
            )}
          </div>

          {showQuizReview ? (
            <div className="rounded-[1.15rem] border border-border bg-card shadow-sm sm:rounded-[1.7rem]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Quiz Review</h2>
                    <p className="text-sm text-muted-foreground">
                      Review SCORM answers and course quiz progress in one place.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Score {answerSummary.correctCount}/{answerSummary.totalQuestions}
                  </span>
                  {courseQuizzes.length > 0 ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                      {completedQuizzes.length}/{courseQuizzes.length} course quizzes
                    </span>
                  ) : null}
                  {answerSummary.pending > 0 ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                      {answerSummary.pending} pending review
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="px-2 py-3 sm:px-5 sm:py-5">
                <ScormQuizReviewContent
                  sections={learnerAnswers}
                  isLoading={isLearnerAnswersLoading}
                  progressSummary={{
                    progressPercent: Number(course.progress || 0),
                    sectionsCompleted,
                    totalSections,
                  }}
                  emptyState="Your quiz answers will appear here after a SCORM quiz or course quiz is submitted."
                />
              </div>
            </div>
          ) : null}

          {!isAssignedCourseView ? (
            <div className="rounded-[1.7rem] border border-border bg-card shadow-sm">
              <div className="border-b border-border px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Batch Delivery</h2>
                    <p className="text-sm text-muted-foreground">
                      Courses are assigned through the batch workspace without changing course setup.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 sm:px-5 sm:py-5">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Standalone batch management</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Use the batch screens to group users, attach multiple courses, define dates, and track learner
                        progress without mixing batch logic into course setup.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[1.7rem] border border-border bg-card p-5 shadow-sm">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {isAssignedCourseView ? "Your progress" : "Enrollment price"}
              </p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">
                {isAssignedCourseView ? `${progressLabel}%` : priceLabel}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{nextCardLabel}</p>
            </div>

            {isAssignedCourseView ? (
              <div className="mt-5 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Course progress</p>
                  <p className="text-sm font-semibold text-foreground">{progressLabel}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${progressLabel}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Done</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-300">
                      {sectionSummary.completed}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Active</p>
                    <p className="mt-1 text-lg font-semibold text-primary">{sectionSummary.inProgress}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Left</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{sectionSummary.notStarted}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {isAssignedCourseView && courseQuizzes.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Required quizzes</p>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                      pendingQuizzes.length
                        ? "bg-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                    }`}
                  >
                    {pendingQuizzes.length ? `${pendingQuizzes.length} left` : "Done"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isCourseQuizzesLoading
                    ? "Loading quiz status..."
                    : `${completedQuizzes.length} of ${courseQuizzes.length} submitted`}
                </p>
                {nextQuiz && onTakeQuiz ? (
                  <button
                    type="button"
                    onClick={() => onTakeQuiz(nextQuiz)}
                    className={`mt-4 inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-sm font-medium text-white transition ${
                      pendingQuizzes.length ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {nextQuiz.attempt ? "View quiz result" : "Take next quiz"}
                  </button>
                ) : null}
              </div>
            ) : null}

            {!isAssignedCourseView ? (
              <button
                type="button"
                onClick={onEnrollCourse}
                disabled={isEnrolling}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-60"
              >
                <Rocket className="h-4 w-4" />
                {isEnrolling ? "Enrolling..." : "Self Enroll Now"}
              </button>
            ) : (
              <button
                type="button"
                onMouseEnter={() => {
                  if (nextLaunchSection) {
                    warmLaunchSection(nextLaunchSection);
                  } else if (course.scormFilePath) {
                    void preloadCourseAsset(course.scormFilePath).catch(() => undefined);
                  }
                }}
                onFocus={() => {
                  if (nextLaunchSection) {
                    warmLaunchSection(nextLaunchSection);
                  } else if (course.scormFilePath) {
                    void preloadCourseAsset(course.scormFilePath).catch(() => undefined);
                  }
                }}
                onClick={() => {
                  if (nextLaunchSection) {
                    onLaunchSection(nextLaunchSection);
                    return;
                  }

                  if (course.scormFilePath) {
                    onLaunchSection({
                      assetPath: course.scormFilePath,
                      contentKind: "scorm",
                      moduleId: "",
                      moduleTitle: "",
                      sectionId: "",
                      sectionTitle: course.title || "Course",
                    });
                  }
                }}
                disabled={!nextLaunchSection && !course.scormFilePath}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Rocket className="h-4 w-4" />
                {isAssignedCourseView
                  ? nextLaunchLabel
                  : getStartLearningLabel(firstPlayableLaunchSection, course.scormFilePath)}
              </button>
            )}

            {isAssignedCourseView ? (
              <div className="mt-4">
                <button
                  type="button"
                  disabled={!canDownloadCertificate}
                  title={canDownloadCertificate ? "Download certificate" : certificateReason}
                  onClick={() => {
                    if (canDownloadCertificate && courseId) {
                      onDownloadCertificate?.(courseId);
                    }
                  }}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
                >
                  <Award className="h-4 w-4" />
                  {isCertificateDownloading ? "Downloading..." : "Download Certificate"}
                  <Download className="h-4 w-4" />
                </button>
                {!canDownloadCertificate ? (
                  <p className="mt-2 text-center text-xs text-muted-foreground">{certificateReason}</p>
                ) : null}
              </div>
            ) : null}

            {isAssignedCourseView && nextLaunchSection ? (
              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Next up</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{nextLaunchSection.sectionTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {nextLaunchTracking
                    ? getLearningStatusMeta(nextLaunchTracking.lessonStatus, nextLaunchTracking.progress).label
                    : "Ready to start"}
                </p>
              </div>
            ) : null}

            <div className="mt-5 space-y-3 border-t border-border pt-5">
              {isAssignedCourseView ? (
                <>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    {sectionSummary.completed} lesson{sectionSummary.completed === 1 ? "" : "s"} completed
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Layers className="h-4 w-4 text-primary" />
                    {totalModuleCount} modules, {totalLessonCount} lessons
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    Access ends: {formatAccessLabel(course.validTill)}
                  </div>
                  {course.progression?.certificateEnabled ? (
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <Award className="h-4 w-4 text-primary" />
                      Certificate available after completion
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Full lifetime access
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Layers className="h-4 w-4 text-primary" />
                    {totalLessonCount} lessons across {totalModuleCount} modules
                  </div>
                  {course.progression?.certificateEnabled ? (
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <Award className="h-4 w-4 text-primary" />
                      Certificate of completion
                    </div>
                  ) : null}
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Guided learning path
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground">Materials</h2>
                <p className="text-sm text-muted-foreground">
                  Grouped by module and section so learners can quickly spot the right resource.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {materialGroups.length > 0 ? (
                materialGroups.map((group) => (
                  <div key={group.id} className="rounded-2xl border border-border bg-background/80 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                        {group.index}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Module {group.index}
                        </p>
                        <p className="text-sm font-semibold text-foreground">{group.title}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {group.moduleMaterials.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Module files
                          </p>
                          {group.moduleMaterials.map((material, materialIndex) =>
                            renderMaterialLink(
                              material,
                              `Module material - ${group.title}`,
                              `${group.id}-module-${materialIndex}`
                            )
                          )}
                        </div>
                      ) : null}

                      {group.sections.map((sectionGroup) => (
                        <div key={sectionGroup.id} className="space-y-3 rounded-2xl border border-dashed border-border p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                              {sectionGroup.label}
                            </span>
                            <span className="text-sm font-semibold text-foreground">{sectionGroup.title}</span>
                          </div>
                          {sectionGroup.materials.map((material, materialIndex) =>
                            renderMaterialLink(
                              material,
                              `Section material - ${sectionGroup.title}`,
                              `${sectionGroup.id}-${materialIndex}`
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background/70 p-4 text-sm text-muted-foreground">
                  No study materials are attached to this course yet.
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.7rem] border border-primary/20 bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/80">
              <Award className="h-4 w-4" />
              Certificate
            </div>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/90">
              Finish all lessons to unlock your verified certificate of completion.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
              <Building2 className="h-4 w-4" />
              Instructor company is auto-linked from the course owner profile
            </div>
          </div>
        </aside>
      </main>

      {!isAssignedCourseView ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)] sm:hidden">
          <button
            type="button"
            onClick={onEnrollCourse}
            disabled={isEnrolling}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            <Rocket className="h-4 w-4" />
            {isEnrolling ? "Enrolling..." : `Self Enroll - ${priceLabel}`}
          </button>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)] sm:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground">Progress</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{
                      width: `${isAssignedCourseView ? progressLabel : Math.min(totalModuleCount * 12, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground">
                  {isAssignedCourseView ? `${progressLabel}%` : `${totalModuleCount}M`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (nextLaunchSection) {
                  onLaunchSection(nextLaunchSection);
                  return;
                }

                if (course.scormFilePath) {
                  onLaunchSection({
                    assetPath: course.scormFilePath,
                    contentKind: "scorm",
                    moduleId: "",
                    moduleTitle: "",
                    sectionId: "",
                    sectionTitle: course.title || "Course",
                  });
                }
              }}
              disabled={!nextLaunchSection && !course.scormFilePath}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlayCircle className="h-4 w-4" />
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
