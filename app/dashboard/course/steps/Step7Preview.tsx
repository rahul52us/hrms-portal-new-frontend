"use client";

import { useEffect } from "react";
import { Award, BookOpen, Clock, Eye, IndianRupee, Layers } from "lucide-react";
import { StepWrapper } from "./component/StepWrapper";
import { Badge } from "@/components/ui/badge";
import { CourseFormState, formatInr, getFileKindLabel } from "../courseForm";

interface Step7PreviewProps {
  courseForm: CourseFormState;
  onProgressChange?: (progress: number) => void;
}

export default function Step7Preview({ courseForm, onProgressChange }: Step7PreviewProps) {
  const modules = courseForm.structure.modules;
  const learningOutcomes = courseForm.basicInfo.learningOutcomes
    .map((item) => item.trim())
    .filter(Boolean);
  const totalSections = modules.reduce((count, module) => count + module.sections.length, 0);
  const totalStudyMaterials = modules.reduce((count, module) => {
    return (
      count +
      module.studyMaterials.length +
      module.sections.reduce((sectionCount, section) => sectionCount + section.studyMaterials.length, 0)
    );
  }, 0);
  const pricingLabel = courseForm.pricing.isPaid ? formatInr(courseForm.pricing.amount) : "Free";
  const accessLabel = courseForm.pricing.accessDurationDays.trim()
    ? `${courseForm.pricing.accessDurationDays} days`
    : "Open access";
  const assessmentLabel = courseForm.basicInfo.totalMarks.trim()
    ? `${courseForm.basicInfo.totalMarks} total marks`
    : "Not configured";
  const quizCount =
    courseForm.structure.quizMode === "final"
      ? courseForm.structure.finalQuiz.questions.length
      : modules.reduce((count, module) => count + (module.hasQuiz ? module.quiz.questions.length : 0), 0);

  useEffect(() => {
    onProgressChange?.(100);
  }, [onProgressChange]);

  return (
    <StepWrapper
      stepKey={5}
      title="Course Preview"
      subtitle={
        <span className="inline-flex items-center gap-1.5">
          See how your course will look
          <Eye className="w-4 h-4" />
        </span>
      }
      icon={<Eye className="w-6 h-6" />}
      accentColor="hsl(var(--step-7))"
    >
      <div className="space-y-6">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {courseForm.basicInfo.thumbnail?.previewUrl ? (
            <img
              src={courseForm.basicInfo.thumbnail.previewUrl}
              alt={courseForm.basicInfo.courseName || "Course thumbnail"}
              className="h-48 w-full object-cover"
            />
          ) : (
            <div className="h-48 bg-gradient-to-br from-primary/20 via-step-7/20 to-step-2/20 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-step-7 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Course Thumbnail</p>
              </div>
            </div>
          )}
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">{courseForm.basicInfo.courseName || "Untitled Course"}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {courseForm.basicInfo.descriptionText || "Your course description will appear here once you enter it."}
              </p>
            </div>
            {(courseForm.basicInfo.instructorName || courseForm.basicInfo.instructorDesignation) && (
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Teacher</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {courseForm.basicInfo.instructorName || "Teacher name"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {courseForm.basicInfo.instructorDesignation || "Designation will appear here"}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {courseForm.basicInfo.categories.map((category) => (
                <Badge key={category} className="bg-primary/10 text-primary border-0 rounded-full">
                  {category}
                </Badge>
              ))}
              <Badge className="bg-step-2/10 text-step-2 border-0 rounded-full">{courseForm.basicInfo.level}</Badge>
              {courseForm.basicInfo.languages.map((language) => (
                <Badge key={language} className="bg-step-3/10 text-step-3 border-0 rounded-full">
                  {language}
                </Badge>
              ))}
              <Badge
                className={`border-0 rounded-full ${
                  courseForm.basicInfo.visibilityType === "public"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {courseForm.basicInfo.visibilityType === "public" ? "Public Course" : "Private Course"}
              </Badge>
              <Badge className="bg-step-4/10 text-step-4 border-0 rounded-full flex items-center gap-1">
                <IndianRupee className="w-3 h-3" /> {pricingLabel}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              {[
                { icon: Layers, label: "Structure", value: `${modules.length}M / ${totalSections}S` },
                { icon: Clock, label: "Access", value: accessLabel },
                {
                  icon: Award,
                  label: "Assessment",
                  value: quizCount > 0 ? `${quizCount} quiz Qs` : assessmentLabel,
                },
                {
                  icon: Award,
                  label: "Certificate / Assets",
                  value: `${courseForm.progress.certificateEnabled ? "Yes" : "No"} / ${totalStudyMaterials}`,
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center">
                  <Icon className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm font-semibold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground">What you&apos;ll learn</h4>
              {learningOutcomes.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Add course benefits in the Basic Info step to preview them here.
                </p>
              ) : (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {learningOutcomes.map((outcome) => (
                    <div key={outcome} className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground">
                      {outcome}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-step-7" /> Course Modules
          </h4>
          {modules.length === 0 ? (
            <div className="p-4 bg-background rounded-xl text-sm text-muted-foreground">
              Add modules in the Structure step to preview the curriculum here.
            </div>
          ) : (
            modules.map((module, index) => (
              <div key={module.id} className="p-4 bg-background rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-step-7/15 flex items-center justify-center text-sm font-bold text-step-7">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{module.name || `Module ${index + 1}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {module.sections.length} section{module.sections.length === 1 ? "" : "s"}
                    </p>
                    {module.description && (
                      <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                    )}
                  </div>
                  {courseForm.structure.quizMode === "per-module" && module.hasQuiz && (
                    <Badge className="bg-step-2/10 text-step-2 border-0 text-xs">
                      Quiz: {module.quiz.questions.length} Qs
                    </Badge>
                  )}
                  {courseForm.structure.quizMode === "per-module" && module.hasTest && (
                    <Badge className="bg-step-3/10 text-step-3 border-0 text-xs">Test</Badge>
                  )}
                </div>
                {module.studyMaterials.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {module.studyMaterials.map((material) => (
                      <Badge key={material.id} className="bg-step-2/10 text-step-2 border-0 text-xs">
                        Module PDF: {material.name}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="space-y-2">
                  {module.sections.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No sections added yet.</div>
                  ) : (
                    module.sections.map((section, sectionIndex) => (
                      <div key={section.id} className="rounded-lg border border-border bg-card px-3 py-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-semibold text-step-7">{sectionIndex + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{section.title || `Section ${sectionIndex + 1}`}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {section.description || "Section description will appear here."}
                            </p>
                          </div>
                          {section.contentFile && (
                            <Badge className="bg-step-4/10 text-step-4 border-0 text-xs">
                              {getFileKindLabel(section.contentFile.kind)}
                            </Badge>
                          )}
                        </div>
                        {section.studyMaterials.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {section.studyMaterials.map((material) => (
                              <Badge key={material.id} className="bg-step-2/10 text-step-2 border-0 text-xs">
                                PDF: {material.name}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
          {courseForm.structure.quizMode === "final" && courseForm.structure.finalQuiz.questions.length > 0 ? (
            <div className="p-4 bg-background rounded-xl border border-step-2/20">
              <p className="text-sm font-medium text-foreground">Final course quiz</p>
              <p className="text-xs text-muted-foreground mt-1">
                {courseForm.structure.finalQuiz.questions.length} question{courseForm.structure.finalQuiz.questions.length === 1 ? "" : "s"} attached
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </StepWrapper>
  );
}
