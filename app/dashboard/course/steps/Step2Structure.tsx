"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, FileText, FolderTree, Layers, Plus, Rocket, Trash2, Upload, Video } from "lucide-react";
import { StepWrapper } from "./component/StepWrapper";
import { FormField } from "./component/FormField";
import CourseQuizBuilder from "../components/CourseQuizBuilder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  CourseModuleInput,
  CourseModuleSectionInput,
  CourseQuizInput,
  CourseStructureState,
  createEmptyModule,
  createEmptyModuleSection,
  createStoredFile,
  createStudyMaterialFiles,
  getFileKindLabel,
  inferModuleUploadKind,
} from "../courseForm";

interface Step2StructureProps {
  value: CourseStructureState;
  onChange: (value: CourseStructureState) => void;
  onProgressChange?: (progress: number) => void;
}

export default function Step2Structure({ value, onChange, onProgressChange }: Step2StructureProps) {
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (value.modules.length === 0) {
      onProgressChange?.(0);
      return;
    }

    const totalFields =
      1 +
      value.modules.reduce((count, module) => count + 2 + module.sections.length * 3, 0);

    const completedFields =
      1 +
      value.modules.reduce((count, module) => {
        if (module.name.trim()) count += 1;
        if (module.description.trim()) count += 1;

        module.sections.forEach((section) => {
          if (section.title.trim()) count += 1;
          if (section.description.trim()) count += 1;
          if (section.contentFile) count += 1;
        });

        return count;
      }, 0);

    onProgressChange?.(Math.round((completedFields / totalFields) * 100));
  }, [value, onProgressChange]);

  const addModule = () => {
    const nextModule = createEmptyModule();
    setOpenModuleId(nextModule.id);

    onChange({
      ...value,
      modules: [...value.modules, nextModule],
    });
  };

  const removeModule = (id: string) => {
    if (openModuleId === id) {
      setOpenModuleId(null);
    }

    onChange({
      ...value,
      modules: value.modules.filter((module) => module.id !== id),
    });
  };

  const toggleModuleAccordion = (id: string) => {
    setOpenModuleId((prev) => (prev === id ? null : id));
  };

  const updateModule = (id: string, patch: Partial<CourseModuleInput>) => {
    onChange({
      ...value,
      modules: value.modules.map((module) => (module.id === id ? { ...module, ...patch } : module)),
    });
  };

  const updateSection = (moduleId: string, sectionId: string, patch: Partial<CourseModuleSectionInput>) => {
    onChange({
      ...value,
      modules: value.modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              sections: module.sections.map((section) =>
                section.id === sectionId ? { ...section, ...patch } : section,
              ),
            }
          : module,
      ),
    });
  };

  const addSection = (moduleId: string) => {
    onChange({
      ...value,
      modules: value.modules.map((module) =>
        module.id === moduleId
          ? { ...module, sections: [...module.sections, createEmptyModuleSection()] }
          : module,
      ),
    });
  };

  const removeSection = (moduleId: string, sectionId: string) => {
    onChange({
      ...value,
      modules: value.modules.map((module) =>
        module.id === moduleId
          ? { ...module, sections: module.sections.filter((section) => section.id !== sectionId) }
          : module,
      ),
    });
  };

  const handleSectionFileChange = (moduleId: string, sectionId: string, fileList: FileList | null) => {
    const file = fileList?.[0];

    if (!file) {
      return;
    }

    updateSection(moduleId, sectionId, {
      contentFile: createStoredFile(file, inferModuleUploadKind(file)),
    });
  };

  const updateModuleQuiz = (moduleId: string, quiz: CourseQuizInput) => {
    updateModule(moduleId, {
      quiz,
      hasQuiz: quiz.questions.length > 0 || value.modules.find((module) => module.id === moduleId)?.hasQuiz || false,
    });
  };

  const handleModuleStudyMaterialChange = (moduleId: string, fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }

    const nextFiles = createStudyMaterialFiles(fileList);
    const targetModule = value.modules.find((module) => module.id === moduleId);
    updateModule(moduleId, {
      studyMaterials: [...(targetModule?.studyMaterials || []), ...nextFiles],
    });
  };

  const handleSectionStudyMaterialChange = (moduleId: string, sectionId: string, fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }

    const targetModule = value.modules.find((module) => module.id === moduleId);
    const targetSection = targetModule?.sections.find((section) => section.id === sectionId);

    updateSection(moduleId, sectionId, {
      studyMaterials: [...(targetSection?.studyMaterials || []), ...createStudyMaterialFiles(fileList)],
    });
  };

  const removeModuleStudyMaterial = (moduleId: string, materialId: string) => {
    const targetModule = value.modules.find((module) => module.id === moduleId);
    updateModule(moduleId, {
      studyMaterials: (targetModule?.studyMaterials || []).filter((material) => material.id !== materialId),
    });
  };

  const removeSectionStudyMaterial = (moduleId: string, sectionId: string, materialId: string) => {
    const targetModule = value.modules.find((module) => module.id === moduleId);
    const targetSection = targetModule?.sections.find((section) => section.id === sectionId);

    updateSection(moduleId, sectionId, {
      studyMaterials: (targetSection?.studyMaterials || []).filter((material) => material.id !== materialId),
    });
  };

  return (
    <StepWrapper
      stepKey={1}
      title="Course Structure"
      subtitle={
        <span className="inline-flex items-center gap-1.5">
          Build your learning path
          <Layers className="w-4 h-4" />
        </span>
      }
      icon={<Layers className="w-6 h-6" />}
      accentColor="hsl(var(--step-2))"
    >
      <div className="space-y-6">
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <FormField label="Quiz Strategy" tooltip="Choose how quizzes are structured">
            <div className="grid grid-cols-2 gap-3 mt-1">
              {(["per-module", "final"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChange({ ...value, quizMode: mode })}
                  className={`p-4 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                    value.quizMode === mode
                      ? "border-step-2 bg-step-2/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-step-2/30"
                  }`}
                >
                  {mode === "per-module" ? "Quiz per Module" : "Final Quiz Only"}
                  <p className="text-xs text-muted-foreground mt-1">
                    {mode === "per-module" ? "Assess after each module" : "One assessment at the end"}
                  </p>
                </button>
              ))}
            </div>
          </FormField>
          <div className="rounded-xl bg-background border border-border p-4 text-sm text-muted-foreground">
            Each section can have a primary SCORM package or MP4 lesson, and you can attach PDF study materials at the module or section level.
          </div>
        </div>

        {value.quizMode === "final" ? (
          <CourseQuizBuilder
            quiz={value.finalQuiz}
            onChange={(finalQuiz) => onChange({ ...value, finalQuiz })}
            title="Final course quiz"
            helper="This quiz appears after the learner finishes the course content. Upload the sample Excel format or build it manually here."
          />
        ) : null}

        <div className="space-y-4">
          <AnimatePresence>
            {value.modules.map((module, moduleIndex) => {
              const isOpen = openModuleId === module.id;

              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden"
                >
                  <div
                    onClick={() => toggleModuleAccordion(module.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-step-2/15 flex items-center justify-center text-sm font-bold text-step-2">
                      {moduleIndex + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {module.name || `Module ${moduleIndex + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {module.sections.length} section{module.sections.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeModule(module.id);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-5 pt-4 border-t border-border space-y-5">
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormField label="Module Name" required>
                              <Input
                                value={module.name}
                                onChange={(event) => updateModule(module.id, { name: event.target.value })}
                                placeholder="e.g., Foundations"
                                className="bg-background border-border rounded-xl h-11"
                              />
                            </FormField>
                            <div className="rounded-xl border border-dashed border-border bg-background px-4 py-3 flex items-center gap-3">
                              <FolderTree className="w-5 h-5 text-step-2" />
                              <div>
                                <p className="text-sm font-medium text-foreground">Nested section layout</p>
                                <p className="text-xs text-muted-foreground">
                                  One module can now contain multiple sections.
                                </p>
                              </div>
                            </div>
                          </div>

                          <FormField label="Module Overview">
                            <Textarea
                              value={module.description}
                              onChange={(event) => updateModule(module.id, { description: event.target.value })}
                              placeholder="Summarize what this module covers."
                              className="bg-background border-border rounded-xl resize-none min-h-[80px]"
                            />
                          </FormField>

                          <FormField label="Module Study Material" helper="Attach one or more PDFs learners can open or download">
                            <div className="space-y-3">
                              <label className="border-2 border-dashed border-border rounded-xl p-3 flex items-center gap-3 hover:border-step-2/50 transition-colors cursor-pointer">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="application/pdf,.pdf"
                                  multiple
                                  onChange={(event) => {
                                    handleModuleStudyMaterialChange(module.id, event.target.files);
                                    event.currentTarget.value = "";
                                  }}
                                />
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <span className="block text-sm text-muted-foreground">
                                    Add PDF notes, handouts, or worksheets
                                  </span>
                                  <span className="block text-xs text-muted-foreground mt-1">
                                    {module.studyMaterials.length > 0
                                      ? `${module.studyMaterials.length} PDF file${module.studyMaterials.length === 1 ? "" : "s"} attached`
                                      : "No module study material yet"}
                                  </span>
                                </div>
                              </label>

                              {module.studyMaterials.length > 0 ? (
                                <div className="space-y-2">
                                  {module.studyMaterials.map((material) => (
                                    <div
                                      key={material.id}
                                      className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                                    >
                                      <FileText className="w-4 h-4 text-step-2" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground truncate">{material.name}</p>
                                        <p className="text-xs text-muted-foreground">{getFileKindLabel(material.kind)}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeModuleStudyMaterial(module.id, material.id)}
                                        className="text-xs text-destructive hover:underline"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </FormField>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-foreground">Module Sections</p>
                                <p className="text-xs text-muted-foreground">
                                  Add sections with SCORM or MP4 content, then attach PDFs separately as study material.
                                </p>
                              </div>
                              <Button type="button" variant="outline" className="rounded-xl" onClick={() => addSection(module.id)}>
                                <Plus className="w-4 h-4 mr-2" /> Add Section
                              </Button>
                            </div>

                            {module.sections.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                                This module has no sections yet.
                              </div>
                            ) : (
                              module.sections.map((section, sectionIndex) => (
                                <div key={section.id} className="rounded-xl border border-border bg-background p-4 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        Section {sectionIndex + 1}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {section.title || "Untitled section"}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeSection(module.id, section.id)}
                                      className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <FormField label="Section Title" required>
                                      <Input
                                        value={section.title}
                                        onChange={(event) => updateSection(module.id, section.id, { title: event.target.value })}
                                        placeholder="e.g., Lesson 1: Introduction"
                                        className="bg-card border-border rounded-xl h-11"
                                      />
                                    </FormField>
                                    <FormField label="Primary Lesson Content" helper="Upload one SCORM package or one MP4 video">
                                      <label className="border-2 border-dashed border-border rounded-xl p-3 flex items-center gap-3 hover:border-step-2/50 transition-colors cursor-pointer">
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="video/mp4,video/*,.zip,.scorm,application/zip,application/x-zip-compressed"
                                          onChange={(event) => handleSectionFileChange(module.id, section.id, event.target.files)}
                                        />
                                        {section.contentFile?.kind === "video" ? (
                                          <Video className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                          <Upload className="w-5 h-5 text-muted-foreground" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <span className="block text-sm text-muted-foreground truncate">
                                            {section.contentFile ? section.contentFile.name : "Drop a SCORM package or click to upload an MP4"}
                                          </span>
                                          {section.contentFile && (
                                            <span className="block text-xs text-step-2 mt-1">
                                              {getFileKindLabel(section.contentFile.kind)} lesson ready
                                            </span>
                                          )}
                                        </div>
                                        {section.contentFile && (
                                          <button
                                            type="button"
                                            onClick={(event) => {
                                              event.preventDefault();
                                              event.stopPropagation();
                                              updateSection(module.id, section.id, { contentFile: null });
                                            }}
                                            className="text-xs text-destructive hover:underline"
                                          >
                                            Remove
                                          </button>
                                        )}
                                      </label>
                                    </FormField>
                                  </div>

                                  <FormField label="Section Description">
                                    <Textarea
                                      value={section.description}
                                      onChange={(event) => updateSection(module.id, section.id, { description: event.target.value })}
                                      placeholder="Explain what learners will cover in this section."
                                      className="bg-card border-border rounded-xl resize-none min-h-[80px]"
                                    />
                                  </FormField>

                                  <FormField label="Section Study Material" helper="Attach PDF reading material for this section">
                                    <div className="space-y-3">
                                      <label className="border-2 border-dashed border-border rounded-xl p-3 flex items-center gap-3 hover:border-step-2/50 transition-colors cursor-pointer">
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="application/pdf,.pdf"
                                          multiple
                                          onChange={(event) => {
                                            handleSectionStudyMaterialChange(module.id, section.id, event.target.files);
                                            event.currentTarget.value = "";
                                          }}
                                        />
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                          <span className="block text-sm text-muted-foreground">
                                            Add PDF study materials
                                          </span>
                                          <span className="block text-xs text-muted-foreground mt-1">
                                            {section.studyMaterials.length > 0
                                              ? `${section.studyMaterials.length} PDF file${section.studyMaterials.length === 1 ? "" : "s"} attached`
                                              : "No section study material yet"}
                                          </span>
                                        </div>
                                      </label>

                                      {section.studyMaterials.length > 0 ? (
                                        <div className="space-y-2">
                                          {section.studyMaterials.map((material) => (
                                            <div
                                              key={material.id}
                                              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                                            >
                                              <FileText className="w-4 h-4 text-step-2" />
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground truncate">{material.name}</p>
                                                <p className="text-xs text-muted-foreground">{getFileKindLabel(material.kind)}</p>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => removeSectionStudyMaterial(module.id, section.id, material.id)}
                                                className="text-xs text-destructive hover:underline"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  </FormField>
                                </div>
                              ))
                            )}
                          </div>

                          {value.quizMode === "per-module" && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                  <Switch checked={module.hasQuiz} onCheckedChange={(hasQuiz) => updateModule(module.id, { hasQuiz })} />
                                  <span className="text-sm text-foreground">Module has quiz</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch checked={module.hasTest} onCheckedChange={(hasTest) => updateModule(module.id, { hasTest })} />
                                  <span className="text-sm text-foreground">Module has test</span>
                                </div>
                              </div>
                              {module.hasQuiz ? (
                                <CourseQuizBuilder
                                  quiz={module.quiz}
                                  onChange={(quiz) => updateModuleQuiz(module.id, quiz)}
                                  title={`${module.name || `Module ${moduleIndex + 1}`} quiz`}
                                  helper="Attach a checkpoint quiz to this module. Learners will see the questions shuffled when they take it."
                                />
                              ) : null}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {value.modules.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
            <Rocket className="w-10 h-10 text-step-2 mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">No modules yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create a module, then add as many sections under it as you need.</p>
            <Button onClick={addModule} className="rounded-xl bg-step-2 hover:bg-step-2/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Add First Module
            </Button>
          </div>
        ) : (
          <Button onClick={addModule} variant="outline" className="w-full rounded-xl border-dashed border-2 h-12 hover:bg-step-2/5 hover:border-step-2/30">
            <Plus className="w-4 h-4 mr-2" /> Add Module
          </Button>
        )}
      </div>
    </StepWrapper>
  );
}
