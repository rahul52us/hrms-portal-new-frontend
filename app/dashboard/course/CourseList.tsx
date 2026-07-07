"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { observer } from "mobx-react-lite";
import { useBreakpointValue } from "@chakra-ui/react";
import { CourseStepper } from "./CourseStepper";
import Step1BasicInfo from "./steps/Step1BasicInfo";
import Step2Structure from "./steps/Step2Structure";
import Step3Progress from "./steps/Step3Progress";
import Step4Pricing from "./steps/Step4Pricing";
import Step7Preview from "./steps/Step7Preview";
import Step8Review from "./steps/Step8Review";
import { CourseFormState, buildCoursePayload, collectCourseUploadFiles, courseToFormState, initialCourseFormState } from "./courseForm";
import { courseStore } from "@/app/store/courseStore/courseStore";
import stores from "@/app/store/stores";

const TOTAL_STEPS = 6;

interface CourseListProps {
  mode?: "create" | "edit";
  courseId?: string;
  initialCourse?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function CourseList({ mode = "create", courseId, initialCourse, onSuccess, onCancel }: CourseListProps) {
  const isCompact = useBreakpointValue({ base: true, md: false }) ?? false;
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepProgress, setStepProgress] = useState<Record<number, number>>({});
  const [courseForm, setCourseForm] = useState<CourseFormState>(
    mode === "edit" && initialCourse ? courseToFormState(initialCourse) : initialCourseFormState
  );
  const [finalAction, setFinalAction] = useState<"draft" | "publish">("publish");
  const router = useRouter();
  const isEditMode = mode === "edit";
  const role = String(stores.auth.userType || stores.auth.user?.role || "").toLowerCase();
  const isSuperadmin = role === "superadmin";
  const companyOptions = useMemo(() => {
    const managedCompanies = stores.companyStore.companies.data || [];
    const accountCompany = stores.auth.user?.companyDetails;
    const options = isSuperadmin
      ? managedCompanies
      : accountCompany?._id
        ? [accountCompany]
        : [];
    const currentCompany = initialCourse?.company;

    if (
      currentCompany?._id &&
      !options.some((company: any) => String(company?._id) === String(currentCompany._id))
    ) {
      return [currentCompany, ...options];
    }

    return options;
  }, [initialCourse?.company, isSuperadmin, stores.auth.user?.companyDetails, stores.companyStore.companies.data]);

  useEffect(() => {
    if (isSuperadmin && !stores.companyStore.companies.data?.length) {
      stores.companyStore.getManagedCompanies().catch(() => undefined);
    }
  }, [isSuperadmin]);

  useEffect(() => {
    if (courseForm.basicInfo.companyId) {
      return;
    }

    const activeCompanyId = stores.companyStore.getActiveCompanyId();
    if (!activeCompanyId) {
      return;
    }

    setCourseForm((current) => ({
      ...current,
      basicInfo: {
        ...current.basicInfo,
        companyId: activeCompanyId,
      },
    }));
  }, [companyOptions.length, courseForm.basicInfo.companyId]);

  useEffect(() => {
    if (isEditMode || courseForm.basicInfo.courseCode) {
      return;
    }

    courseStore
      .fetchNextCourseCode()
      .then((courseCode) => {
        if (!courseCode) {
          return;
        }

        setCourseForm((prev) => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            courseCode,
          },
        }));
      })
      .catch(() => undefined);
  }, [courseForm.basicInfo.courseCode, isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    if (!courseId) {
      if (initialCourse) {
        setCourseForm(courseToFormState(initialCourse));
      }
      return;
    }

    let isMounted = true;
    courseStore
      .fetchCourse(courseId)
      .then((course) => {
        if (course && isMounted) {
          setCourseForm(courseToFormState(course));
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [courseId, initialCourse, isEditMode]);

  const updateStepProgress = useCallback((step: number, progress: number) => {
    setStepProgress((prev) => {
      if (prev[step] === progress) {
        return prev;
      }

      return { ...prev, [step]: progress };
    });
  }, []);

  const goNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep));
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async (action: "draft" | "publish") => {
    if (
      action === "publish" &&
      courseForm.basicInfo.visibilityType === "public" &&
      !courseForm.basicInfo.companyId
    ) {
      courseStore.error = "Select a company before publishing a public course.";
      setCurrentStep(0);
      return;
    }

    let wasSuccessful = false;
    const uploadFiles = collectCourseUploadFiles(courseForm);
    const payload = buildCoursePayload(courseForm, action);

    try {
      const input = {
        payload,
        thumbnailFile: courseForm.basicInfo.thumbnail?.file ?? null,
        scormFiles: uploadFiles.scormFiles,
        contentFiles: uploadFiles.contentFiles,
        studyMaterialFiles: uploadFiles.studyMaterialFiles,
      };

      if (isEditMode && courseId) {
        await courseStore.updateCourse(courseId, input, {
          action,
          fileCount: uploadFiles.totalFileCount,
        });
      } else {
        await courseStore.createCourse(input, {
          action,
          fileCount: uploadFiles.totalFileCount,
        });
      }

      wasSuccessful = true;
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/course");
      }
    } catch (err) {
      console.error("Failed to save course:", err);
    } finally {
      if (wasSuccessful) {
        setTimeout(() => {
          courseStore.resetSubmissionState();
        }, 250);
      }
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1BasicInfo
            value={courseForm.basicInfo}
            onChange={(basicInfo) => setCourseForm((prev) => ({ ...prev, basicInfo }))}
            onProgressChange={(progress) => updateStepProgress(0, progress)}
            companies={companyOptions}
            isCompanySelectionDisabled={!isSuperadmin}
          />
        );
      case 1:
        return (
          <Step2Structure
            value={courseForm.structure}
            onChange={(structure) => setCourseForm((prev) => ({ ...prev, structure }))}
            onProgressChange={(progress) => updateStepProgress(1, progress)}
          />
        );
      case 2:
        return (
          <Step3Progress
            value={courseForm.progress}
            onChange={(progress) => setCourseForm((prev) => ({ ...prev, progress }))}
            moduleNames={courseForm.structure.modules.map((module) => module.name)}
            onProgressChange={(progressValue) => updateStepProgress(2, progressValue)}
          />
        );
      case 3:
        return (
          <Step4Pricing
            value={courseForm.pricing}
            onChange={(pricing) => setCourseForm((prev) => ({ ...prev, pricing }))}
            onProgressChange={(progress) => updateStepProgress(3, progress)}
          />
        );
      case 4:
        return (
          <Step7Preview
            courseForm={courseForm}
            onProgressChange={(progress) => updateStepProgress(4, progress)}
          />
        );
      case 5:
        return (
          <Step8Review
            courseForm={courseForm}
            onEditStep={setCurrentStep}
            submitAction={finalAction}
            onSubmitActionChange={setFinalAction}
            onSubmit={() => handleSave(finalAction)}
            isSubmitting={courseStore.isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
      {courseStore.isSubmitting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(17, 24, 39, 0.48)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              width: "min(520px, 100%)",
              borderRadius: 28,
              background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
              boxShadow: "0 28px 90px rgba(15, 23, 42, 0.22)",
              padding: 28,
              border: "1px solid rgba(226, 232, 240, 0.9)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  background: "linear-gradient(135deg, #4F46E5 0%, #0EA5E9 100%)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 12px 30px rgba(79, 70, 229, 0.28)",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: "2.5px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#FFFFFF",
                    animation: "course-submit-spin 0.9s linear infinite",
                  }}
                />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
                  {courseStore.submissionStage || (isEditMode ? "Updating course" : "Submitting course")}
                </h3>
                <p style={{ margin: "6px 0 0", fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
                  {courseStore.submissionDetail || "Please keep this tab open while we finish preparing the course."}
                </p>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: 12,
                borderRadius: 999,
                background: "#E2E8F0",
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: `${Math.max(courseStore.submissionProgress, 8)}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #4F46E5 0%, #0EA5E9 100%)",
                  transition: "width 220ms ease",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 13, color: "#64748B" }}>
              <span>{Math.max(courseStore.submissionProgress, 8)}% complete</span>
              <span>SCORM, MP4, and PDF files upload in smaller parts before the course is created.</span>
            </div>
          </div>
          <style>{`@keyframes course-submit-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            padding: isCompact ? "12px 14px" : "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => (onCancel ? onCancel() : router.push("/dashboard"))}
              style={{
                width: isCompact ? 34 : 36,
                height: isCompact ? 34 : 36,
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onMouseEnter={(event) => (event.currentTarget.style.background = "#F3F4F6")}
              onMouseLeave={(event) => (event.currentTarget.style.background = "#FFFFFF")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: isCompact ? 16 : 17,
                  fontWeight: 700,
                  color: "#111827",
                  lineHeight: 1.2,
                }}
                >
                {isEditMode ? "Edit Course" : "Create New Course"}
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                Step {currentStep + 1} of {TOTAL_STEPS}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, width: isCompact ? "100%" : "auto" }}>
            <span style={{ fontSize: 13, color: "#64748B", display: isCompact ? "none" : "inline" }}>
              {currentStep === TOTAL_STEPS - 1
                ? "Choose draft or publish once and submit from the final review."
                : "Complete the course setup to unlock the final submit action."}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: isCompact ? "20px 12px 28px" : "32px 24px",
          boxSizing: "border-box",
        }}
      >
        <CourseStepper
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          completedSteps={completedSteps}
          stepProgress={stepProgress[currentStep] ?? 0}
        />

        {courseStore.error && !courseStore.isSubmitting && (
          <div
            style={{
              marginTop: 20,
              marginBottom: 20,
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid #FECACA",
              background: "#FEF2F2",
              color: "#991B1B",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {courseStore.error}
          </div>
        )}

        {renderCurrentStep()}

        {currentStep < TOTAL_STEPS - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isCompact ? "stretch" : "center",
              flexDirection: isCompact ? "column-reverse" : "row",
              marginTop: 32,
              paddingTop: 24,
              gap: 12,
              borderTop: "1px solid #E5E7EB",
            }}
          >
            <button
              onClick={goBack}
              disabled={currentStep === 0 || courseStore.isSubmitting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: isCompact ? "10px 16px" : "10px 20px",
                borderRadius: 10,
                border: "1.5px solid #D1D5DB",
                background: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                color: currentStep === 0 || courseStore.isSubmitting ? "#D1D5DB" : "#374151",
                cursor: currentStep === 0 || courseStore.isSubmitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                width: isCompact ? "100%" : "auto",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>

            <button
              onClick={goNext}
              disabled={courseStore.isSubmitting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: isCompact ? "10px 18px" : "10px 24px",
                borderRadius: 10,
                border: "none",
                background: "#4F46E5",
                fontSize: 14,
                fontWeight: 600,
                color: "#FFFFFF",
                cursor: courseStore.isSubmitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: courseStore.isSubmitting ? 0.6 : 1,
                width: isCompact ? "100%" : "auto",
                justifyContent: "center",
              }}
              onMouseEnter={(event) => {
                if (!courseStore.isSubmitting) {
                  event.currentTarget.style.background = "#4338CA";
                }
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "#4F46E5";
              }}
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default observer(CourseList);
