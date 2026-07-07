"use client";

import {
  CheckCircle2,
  CircleDashed,
  FileText,
  IndianRupee,
  Layers,
  Pencil,
  Rocket,
  TrendingUp,
} from "lucide-react";
import { StepWrapper } from "./component/StepWrapper";
import { Button } from "@/components/ui/button";
import { CourseFormState, formatInr } from "../courseForm";

interface Step8ReviewProps {
  courseForm: CourseFormState;
  onEditStep: (step: number) => void;
  submitAction: "draft" | "publish";
  onSubmitActionChange: (action: "draft" | "publish") => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export default function Step8Review({
  courseForm,
  onEditStep,
  submitAction,
  onSubmitActionChange,
  onSubmit,
  isSubmitting = false,
}: Step8ReviewProps) {
  const totalSections = courseForm.structure.modules.reduce((count, module) => count + module.sections.length, 0);
  const learningOutcomeCount = courseForm.basicInfo.learningOutcomes.filter((item) => item.trim()).length;
  const quizQuestionCount =
    courseForm.structure.quizMode === "final"
      ? courseForm.structure.finalQuiz.questions.length
      : courseForm.structure.modules.reduce((count, module) => count + (module.hasQuiz ? module.quiz.questions.length : 0), 0);

  const sections = [
    {
      icon: FileText,
      label: "Basic Info",
      status: courseForm.basicInfo.courseName
        ? `${courseForm.basicInfo.courseName} - ${courseForm.basicInfo.level} - ${
            courseForm.basicInfo.visibilityType === "public" ? "Public" : "Private"
          }`
        : "Course title is still empty",
      colorClass: "text-step-1",
      bgClass: "bg-step-1/15",
      complete: Boolean(courseForm.basicInfo.courseName.trim()),
      stepIndex: 0,
    },
    {
      icon: FileText,
      label: "Teacher & Benefits",
      status:
        courseForm.basicInfo.instructorName.trim() || learningOutcomeCount > 0
          ? `${courseForm.basicInfo.instructorName.trim() || "Teacher name missing"} - ${
              courseForm.basicInfo.instructorDesignation.trim() || "Designation missing"
            } - ${learningOutcomeCount} learning outcome${learningOutcomeCount === 1 ? "" : "s"}`
          : "Add teacher details and at least one learning outcome",
      colorClass: "text-step-1",
      bgClass: "bg-step-1/15",
      complete: Boolean(
        courseForm.basicInfo.instructorName.trim() &&
          courseForm.basicInfo.instructorDesignation.trim() &&
          learningOutcomeCount > 0
      ),
      stepIndex: 0,
    },
    {
      icon: Layers,
      label: "Course Structure",
      status: `${courseForm.structure.modules.length} module${courseForm.structure.modules.length === 1 ? "" : "s"} - ${totalSections} section${
        totalSections === 1 ? "" : "s"
      } - ${
        courseForm.structure.quizMode === "per-module" ? "Quiz per module" : "Final quiz"
      }`,
      colorClass: "text-step-2",
      bgClass: "bg-step-2/15",
      complete: courseForm.structure.modules.length > 0,
      stepIndex: 1,
    },
    {
      icon: TrendingUp,
      label: "Progress Settings",
      status: courseForm.progress.completionDays.trim()
        ? `${courseForm.progress.completionDays} day completion window`
        : "No completion deadline set",
      colorClass: "text-step-3",
      bgClass: "bg-step-3/15",
      complete: true,
      stepIndex: 2,
    },
    {
      icon: IndianRupee,
      label: "Pricing",
      status: `${courseForm.pricing.isPaid ? formatInr(courseForm.pricing.amount) : "Free"} - ${
        courseForm.pricing.accessDurationDays.trim() ? `${courseForm.pricing.accessDurationDays} day access` : "Open access"
      }`,
      colorClass: "text-step-4",
      bgClass: "bg-step-4/15",
      complete: true,
      stepIndex: 3,
    },
    {
      icon: CheckCircle2,
      label: "Assessment",
      status:
        quizQuestionCount > 0
          ? `${quizQuestionCount} quiz question${quizQuestionCount === 1 ? "" : "s"} attached. Passing criteria will be set during assignment.`
          : courseForm.basicInfo.totalMarks.trim()
            ? `${courseForm.basicInfo.totalMarks} total marks. Passing criteria will be set during assignment.`
            : "Assessment marks not configured yet",
      colorClass: "text-step-2",
      bgClass: "bg-step-2/15",
      complete: Boolean(courseForm.basicInfo.totalMarks.trim()),
      stepIndex: 0,
    },
  ];

  return (
    <StepWrapper
      stepKey={6}
      title="Review & Publish"
      subtitle={
        <span className="inline-flex items-center gap-1.5">
          Almost there! Let&apos;s review everything
          <Rocket className="w-4 h-4" />
        </span>
      }
      icon={<Rocket className="w-6 h-6" />}
      accentColor="hsl(var(--step-8))"
    >
      <div className="space-y-6">
        <div className="grid gap-3">
          {sections.map(({ icon: Icon, label, status, colorClass, bgClass, complete, stepIndex }) => (
            <div key={label} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${colorClass}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{status}</p>
              </div>
              {complete ? (
                <CheckCircle2 className="w-5 h-5 text-step-2" />
              ) : (
                <CircleDashed className="w-5 h-5 text-muted-foreground" />
              )}
              <button className="text-sm text-primary hover:underline flex items-center gap-1" onClick={() => onEditStep(stepIndex)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-card/70 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Final submission</p>
              <p className="text-xs text-muted-foreground">
                Pick the status first, then submit once.
              </p>
            </div>
            <div className="inline-flex rounded-2xl bg-muted p-1">
              <button
                type="button"
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  submitAction === "draft"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
                onClick={() => onSubmitActionChange("draft")}
                disabled={isSubmitting}
              >
                Save draft
              </button>
              <button
                type="button"
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  submitAction === "publish"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
                onClick={() => onSubmitActionChange("publish")}
                disabled={isSubmitting}
              >
                Publish
              </button>
            </div>
          </div>

          <div className="pt-4">
            <Button
              className="h-14 w-full rounded-2xl text-base font-semibold"
              style={{ background: "var(--gradient-primary)" }}
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              <Rocket className="w-5 h-5 mr-2" />
              {isSubmitting
                ? submitAction === "publish"
                  ? "Publishing Course..."
                  : "Saving Draft..."
                : submitAction === "publish"
                ? "Publish Course"
                : "Save Draft"}
            </Button>
          </div>
        </div>
      </div>
    </StepWrapper>
  );
}
