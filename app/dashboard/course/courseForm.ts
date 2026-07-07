"use client";

export const LANGUAGES = ["English", "Spanish", "French", "German", "Hindi", "Arabic", "Chinese"];
export const CATEGORIES = ["Technology", "Business", "Design", "Marketing", "HR", "Compliance", "Leadership"];
export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export type QuizMode = "per-module" | "final";
export type StoredFileKind = "image" | "video" | "document" | "scorm" | "zip" | "spreadsheet" | "other";
export type CorrectQuizOption = "Option-1" | "Option-2" | "Option-3" | "Option-4";

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  kind: StoredFileKind;
  previewUrl?: string;
  file?: File | null;
  isExisting?: boolean;
}

export interface CourseBasicInfo {
  courseCode: string;
  companyId: string;
  courseName: string;
  slug: string;
  descriptionHtml: string;
  descriptionText: string;
  learningOutcomes: string[];
  instructorName: string;
  instructorDesignation: string;
  thumbnail: StoredFile | null;
  languages: string[];
  categories: string[];
  level: string;
  visibilityType: "private" | "public";
  totalMarks: string;
  passingMarks: string;
}

export interface CourseModuleSectionInput {
  id: string;
  title: string;
  description: string;
  contentFile: StoredFile | null;
  studyMaterials: StoredFile[];
}

export interface CourseQuizQuestionInput {
  id: string;
  sn: number;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: CorrectQuizOption;
  marks: string;
  explanation: string;
}

export interface CourseQuizInput {
  id: string;
  title: string;
  source: "manual" | "excel" | "mixed";
  questions: CourseQuizQuestionInput[];
}

export interface CourseModuleInput {
  id: string;
  name: string;
  description: string;
  sections: CourseModuleSectionInput[];
  studyMaterials: StoredFile[];
  hasQuiz: boolean;
  hasTest: boolean;
  quiz: CourseQuizInput;
}

export interface CourseStructureState {
  quizMode: QuizMode;
  finalQuiz: CourseQuizInput;
  modules: CourseModuleInput[];
}

export interface CourseProgressState {
  completionDays: string;
  dripEnabled: boolean;
  certificateEnabled: boolean;
  mandatoryModules: boolean;
}

export interface CoursePricingState {
  isPaid: boolean;
  amount: string;
  currency: "INR";
  accessDurationDays: string;
}

export interface CourseFormState {
  basicInfo: CourseBasicInfo;
  structure: CourseStructureState;
  progress: CourseProgressState;
  pricing: CoursePricingState;
}

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getFileExtension(fileName: string) {
  return fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() ?? "" : "";
}

function parseNumericValue(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function createCourseSlug(courseName: string) {
  return courseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractPlainTextFromHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function inferModuleUploadKind(file: File): StoredFileKind {
  const extension = getFileExtension(file.name);
  const normalizedName = file.name.toLowerCase();

  if (extension === "scorm" || normalizedName.includes("scorm")) {
    return "scorm";
  }

  if (extension === "zip" || file.type.includes("zip")) {
    return "zip";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type === "application/pdf" || extension === "pdf") {
    return "document";
  }

  return "other";
}

export function createStoredFile(file: File, kind: StoredFileKind, previewUrl?: string): StoredFile {
  return {
    id: createClientId(),
    name: file.name,
    size: file.size,
    type: file.type,
    extension: getFileExtension(file.name),
    kind,
    previewUrl,
    file,
  };
}

function inferStoredFileKindFromAsset(asset: any): StoredFileKind {
  const kind = String(asset?.kind || "").toLowerCase();
  const extension = String(asset?.extension || asset?.name || asset?.previewUrl || "").split(".").pop()?.toLowerCase() || "";
  const mimeType = String(asset?.mimeType || asset?.type || "").toLowerCase();

  if (kind === "scorm" || kind === "zip" || extension === "zip") {
    return kind === "scorm" ? "scorm" : "zip";
  }

  if (kind === "image" || mimeType.startsWith("image/")) {
    return "image";
  }

  if (kind === "video" || mimeType.startsWith("video/")) {
    return "video";
  }

  if (kind === "spreadsheet" || ["csv", "xlsx", "xls"].includes(extension)) {
    return "spreadsheet";
  }

  if (kind === "document" || extension === "pdf" || mimeType.includes("pdf")) {
    return "document";
  }

  return "other";
}

export function createExistingStoredFile(asset: any, fallbackName = "Existing file"): StoredFile | null {
  const previewUrl = String(asset?.previewUrl || "").trim();
  if (!previewUrl) {
    return null;
  }

  const rawName = String(asset?.name || fallbackName).trim();
  const name = rawName || fallbackName;

  return {
    id: createClientId(),
    name,
    size: Number(asset?.sizeInBytes || asset?.size || 0) || 0,
    type: String(asset?.mimeType || asset?.type || "application/octet-stream"),
    extension: String(asset?.extension || getFileExtension(name) || "").toLowerCase(),
    kind: inferStoredFileKindFromAsset(asset),
    previewUrl,
    file: null,
    isExisting: true,
  };
}

export function createEmptyQuizQuestion(sn = 1): CourseQuizQuestionInput {
  return {
    id: createClientId(),
    sn,
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correctOption: "Option-1",
    marks: "1",
    explanation: "",
  };
}

export function createEmptyQuiz(title = "Course quiz"): CourseQuizInput {
  return {
    id: createClientId(),
    title,
    source: "manual",
    questions: [],
  };
}

export function createEmptyModuleSection(): CourseModuleSectionInput {
  return {
    id: createClientId(),
    title: "",
    description: "",
    contentFile: null,
    studyMaterials: [],
  };
}

export function createEmptyModule(): CourseModuleInput {
  const moduleId = createClientId();

  return {
    id: moduleId,
    name: "",
    description: "",
    sections: [createEmptyModuleSection()],
    studyMaterials: [],
    hasQuiz: false,
    hasTest: false,
    quiz: createEmptyQuiz("Module quiz"),
  };
}

export const initialCourseFormState: CourseFormState = {
  basicInfo: {
    courseCode: "",
    companyId: "",
    courseName: "",
    slug: "",
    descriptionHtml: "",
    descriptionText: "",
    learningOutcomes: [""],
    instructorName: "",
    instructorDesignation: "",
    thumbnail: null,
    languages: ["English"],
    categories: [],
    level: "Beginner",
    visibilityType: "private",
    totalMarks: "",
    passingMarks: "",
  },
  structure: {
    quizMode: "per-module",
    finalQuiz: createEmptyQuiz("Final course quiz"),
    modules: [],
  },
  progress: {
    completionDays: "",
    dripEnabled: false,
    certificateEnabled: true,
    mandatoryModules: true,
  },
  pricing: {
    isPaid: false,
    amount: "",
    currency: "INR",
    accessDurationDays: "",
  },
};

function summarizeFile(file: StoredFile | null) {
  if (!file) {
    return null;
  }

  return {
    name: file.name,
    kind: file.kind,
    mimeType: file.type || "unknown",
    extension: file.extension || null,
    sizeInBytes: file.size,
    previewUrl: file.previewUrl ?? null,
  };
}

function parseQuizMarks(value: string) {
  const parsedValue = parseNumericValue(value);
  return parsedValue !== null && parsedValue >= 0 ? parsedValue : 1;
}

function summarizeQuiz(quiz: CourseQuizInput, fallbackTitle: string) {
  const questions = quiz.questions
    .map((question, index) => {
      const options = [question.option1, question.option2, question.option3, question.option4].map((option) => option.trim());
      const isComplete = question.question.trim() && options.every(Boolean) && question.correctOption;

      if (!isComplete) {
        return null;
      }

      return {
        id: question.id,
        questionId: question.id,
        sn: question.sn || index + 1,
        question: question.question.trim(),
        option1: options[0],
        option2: options[1],
        option3: options[2],
        option4: options[3],
        correctOption: question.correctOption,
        marks: parseQuizMarks(question.marks),
        explanation: question.explanation.trim(),
      };
    })
    .filter(Boolean);

  return {
    id: quiz.id,
    quizId: quiz.id,
    title: quiz.title.trim() || fallbackTitle,
    source: quiz.source,
    questions,
  };
}

export function calculateCourseQuizTotalMarks(courseForm: CourseFormState) {
  const quizzes =
    courseForm.structure.quizMode === "final"
      ? [courseForm.structure.finalQuiz]
      : courseForm.structure.modules.filter((module) => module.hasQuiz).map((module) => module.quiz);

  return quizzes.reduce((total, quiz) => {
    return (
      total +
      quiz.questions.reduce((questionTotal, question) => {
        const isComplete =
          question.question.trim() &&
          question.option1.trim() &&
          question.option2.trim() &&
          question.option3.trim() &&
          question.option4.trim();

        return questionTotal + (isComplete ? parseQuizMarks(question.marks) : 0);
      }, 0)
    );
  }, 0);
}

export function formatInr(value: string | number | null | undefined) {
  const numericValue = typeof value === "number" ? value : parseNumericValue(String(value ?? ""));

  if (numericValue === null) {
    return "Free";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export function getFileKindLabel(kind: StoredFileKind) {
  switch (kind) {
    case "scorm":
      return "SCORM";
    case "zip":
      return "ZIP";
    case "video":
      return "Video";
    case "document":
      return "PDF";
    case "spreadsheet":
      return "CSV";
    case "image":
      return "Image";
    default:
      return "File";
  }
}

export function createStudyMaterialFiles(fileList: FileList | File[]) {
  return Array.from(fileList || []).map((file) => createStoredFile(file, "document"));
}

export function collectCourseUploadFiles(courseForm: CourseFormState) {
  const scormFiles: File[] = [];
  const contentFiles: File[] = [];
  const studyMaterialFiles: File[] = [];

  courseForm.structure.modules.forEach((module) => {
    module.studyMaterials.forEach((material) => {
      if (material.file) {
        studyMaterialFiles.push(material.file);
      }
    });

    module.sections.forEach((section) => {
      if (section.contentFile?.file) {
        if (section.contentFile.kind === "scorm" || section.contentFile.kind === "zip") {
          scormFiles.push(section.contentFile.file);
        } else {
          contentFiles.push(section.contentFile.file);
        }
      }

      section.studyMaterials.forEach((material) => {
        if (material.file) {
          studyMaterialFiles.push(material.file);
        }
      });
    });
  });

  return {
    scormFiles,
    contentFiles,
    studyMaterialFiles,
    totalFileCount:
      scormFiles.length +
      contentFiles.length +
      studyMaterialFiles.length +
      (courseForm.basicInfo.thumbnail?.file ? 1 : 0),
  };
}

function mapExistingStudyMaterials(materials: any, fallbackPrefix: string) {
  if (!Array.isArray(materials)) {
    return [];
  }

  return materials
    .map((material, index) => createExistingStoredFile(material, `${fallbackPrefix} ${index + 1}`))
    .filter(Boolean) as StoredFile[];
}

function mapExistingQuizQuestion(question: any, index: number): CourseQuizQuestionInput {
  const options = Array.isArray(question?.options) ? question.options : [];
  const getOptionText = (label: CorrectQuizOption, legacyKey: string) => {
    return String(options.find((option: any) => option?.label === label)?.text || question?.[legacyKey] || "");
  };
  const correctOption =
    (String(question?.correctOptionLabel || question?.correctOption || "") as CorrectQuizOption) ||
    (options.find((option: any) => option?.isCorrect)?.label as CorrectQuizOption) ||
    "Option-1";

  return {
    id: String(question?.questionId || question?.id || createClientId()),
    sn: Number(question?.sn || index + 1),
    question: String(question?.question || ""),
    option1: getOptionText("Option-1", "option1"),
    option2: getOptionText("Option-2", "option2"),
    option3: getOptionText("Option-3", "option3"),
    option4: getOptionText("Option-4", "option4"),
    correctOption: ["Option-1", "Option-2", "Option-3", "Option-4"].includes(correctOption)
      ? correctOption
      : "Option-1",
    marks: String(question?.marks ?? "1"),
    explanation: String(question?.explanation || ""),
  };
}

function mapExistingQuiz(quiz: any, fallbackTitle: string): CourseQuizInput {
  return {
    id: String(quiz?.quizId || quiz?.id || createClientId()),
    title: String(quiz?.title || fallbackTitle),
    source: quiz?.source === "excel" || quiz?.source === "mixed" ? quiz.source : "manual",
    questions: Array.isArray(quiz?.questions)
      ? quiz.questions.map((question: any, index: number) => mapExistingQuizQuestion(question, index))
      : [],
  };
}

export function courseToFormState(course: any): CourseFormState {
  const curriculum = course?.curriculum || {};
  const modules = Array.isArray(curriculum.modules) ? curriculum.modules : [];
  const quizMode: QuizMode = curriculum.quizStrategy === "final" ? "final" : "per-module";

  return {
    basicInfo: {
      courseCode: String(course?.courseCode || ""),
      companyId: String(course?.company?._id || course?.company || ""),
      courseName: String(course?.title || ""),
      slug: String(course?.slug || ""),
      descriptionHtml: String(course?.description?.html || ""),
      descriptionText: String(course?.description?.text || ""),
      learningOutcomes:
        Array.isArray(course?.highlights?.learningOutcomes) && course.highlights.learningOutcomes.length
          ? course.highlights.learningOutcomes.map((item: any) => String(item || ""))
          : [""],
      instructorName: String(course?.instructor?.name || ""),
      instructorDesignation: String(course?.instructor?.designation || ""),
      thumbnail: course?.thumbnailUrl
        ? createExistingStoredFile(
            {
              name: "Current thumbnail",
              kind: "image",
              mimeType: "image/*",
              previewUrl: course.thumbnailUrl,
            },
            "Current thumbnail"
          )
        : null,
      languages: Array.isArray(course?.taxonomy?.languages) && course.taxonomy.languages.length
        ? course.taxonomy.languages
        : ["English"],
      categories: Array.isArray(course?.taxonomy?.categories) ? course.taxonomy.categories : [],
      level: String(course?.taxonomy?.level || "Beginner"),
      visibilityType: course?.visibility?.type === "public" ? "public" : "private",
      totalMarks: course?.assessment?.totalMarks == null ? "" : String(course.assessment.totalMarks),
      passingMarks: course?.assessment?.passingMarks == null ? "" : String(course.assessment.passingMarks),
    },
    structure: {
      quizMode,
      finalQuiz: mapExistingQuiz(curriculum.finalQuiz, "Final course quiz"),
      modules: modules.map((module: any, moduleIndex: number) => ({
        id: String(module?.moduleId || module?.id || createClientId()),
        name: String(module?.title || ""),
        description: String(module?.summary || ""),
        sections: (Array.isArray(module?.sections) && module.sections.length ? module.sections : [{}]).map(
          (section: any, sectionIndex: number) => ({
            id: String(section?.sectionId || section?.id || createClientId()),
            title: String(section?.title || ""),
            description: String(section?.description || ""),
            contentFile: createExistingStoredFile(section?.content, `Section ${sectionIndex + 1} content`),
            studyMaterials: mapExistingStudyMaterials(section?.studyMaterial, `Section ${sectionIndex + 1} material`),
          })
        ),
        studyMaterials: mapExistingStudyMaterials(module?.studyMaterial, `Module ${moduleIndex + 1} material`),
        hasQuiz: Boolean(module?.assessments?.quizEnabled),
        hasTest: Boolean(module?.assessments?.testEnabled),
        quiz: mapExistingQuiz(module?.assessments?.quiz, `${String(module?.title || `Module ${moduleIndex + 1}`)} quiz`),
      })),
    },
    progress: {
      completionDays: course?.progression?.completionWindowDays == null ? "" : String(course.progression.completionWindowDays),
      dripEnabled: Boolean(course?.progression?.dripEnabled),
      certificateEnabled: course?.progression?.certificateEnabled !== false,
      mandatoryModules: course?.progression?.mandatoryModules !== false,
    },
    pricing: {
      isPaid: course?.commerce?.pricingModel === "paid",
      amount: course?.commerce?.amountInRupees == null ? "" : String(course.commerce.amountInRupees),
      currency: "INR",
      accessDurationDays: course?.commerce?.accessDurationDays == null ? "" : String(course.commerce.accessDurationDays),
    },
  };
}

export function buildCoursePayload(courseForm: CourseFormState, action: "draft" | "publish") {
  const amount = courseForm.pricing.isPaid ? parseNumericValue(courseForm.pricing.amount) : null;
  const accessDurationDays = parseNumericValue(courseForm.pricing.accessDurationDays);
  const completionDays = parseNumericValue(courseForm.progress.completionDays);
  const quizTotalMarks = calculateCourseQuizTotalMarks(courseForm);
  const totalMarks = parseNumericValue(courseForm.basicInfo.totalMarks) ?? (quizTotalMarks > 0 ? quizTotalMarks : null);
  const passingMarks = parseNumericValue(courseForm.basicInfo.passingMarks);
  const totalSections = courseForm.structure.modules.reduce((count, module) => count + module.sections.length, 0);

  return {
    action,
    generatedAt: new Date().toISOString(),
    course: {
      courseCode: courseForm.basicInfo.courseCode,
      companyId: courseForm.basicInfo.companyId,
      title: courseForm.basicInfo.courseName.trim(),
      slug: courseForm.basicInfo.slug,
      description: {
        text: courseForm.basicInfo.descriptionText,
        html: courseForm.basicInfo.descriptionHtml,
      },
      highlights: {
        learningOutcomes: courseForm.basicInfo.learningOutcomes
          .map((item) => item.trim())
          .filter(Boolean),
      },
      instructor: {
        name: courseForm.basicInfo.instructorName.trim(),
        designation: courseForm.basicInfo.instructorDesignation.trim(),
      },
      taxonomy: {
        languages: courseForm.basicInfo.languages,
        categories: courseForm.basicInfo.categories,
        level: courseForm.basicInfo.level,
      },
      visibility: {
        type: courseForm.basicInfo.visibilityType,
      },
      assessment: {
        totalMarks,
        passingMarks,
      },
      media: {
        thumbnail: summarizeFile(courseForm.basicInfo.thumbnail),
      },
    },
    curriculum: {
      quizStrategy: courseForm.structure.quizMode,
      totalModules: courseForm.structure.modules.length,
      totalSections,
      finalQuiz:
        courseForm.structure.quizMode === "final"
          ? summarizeQuiz(courseForm.structure.finalQuiz, "Final course quiz")
          : null,
      modules: courseForm.structure.modules.map((module, index) => ({
        order: index + 1,
        title: module.name.trim(),
        summary: module.description.trim(),
        sectionCount: module.sections.length,
        studyMaterial: module.studyMaterials.map((material) => summarizeFile(material)),
        sections: module.sections.map((section, sectionIndex) => ({
          order: sectionIndex + 1,
          title: section.title.trim(),
          description: section.description.trim(),
          content: summarizeFile(section.contentFile),
          studyMaterial: section.studyMaterials.map((material) => summarizeFile(material)),
        })),
        assessments: {
          quizEnabled: module.hasQuiz,
          testEnabled: module.hasTest,
          quiz:
            courseForm.structure.quizMode === "per-module" && module.hasQuiz
              ? summarizeQuiz(module.quiz, `${module.name.trim() || `Module ${index + 1}`} quiz`)
              : null,
        },
      })),
    },
    progression: {
      completionWindowDays: completionDays,
      dripEnabled: courseForm.progress.dripEnabled,
      certificateEnabled: courseForm.progress.certificateEnabled,
      mandatoryModules: courseForm.progress.mandatoryModules,
    },
    commerce: {
      pricingModel: courseForm.pricing.isPaid ? "paid" : "free",
      currency: courseForm.pricing.currency,
      amountInRupees: amount,
      accessDurationDays,
    },
    meta: {
      moduleCount: courseForm.structure.modules.length,
      sectionCount: totalSections,
    },
  };
}
