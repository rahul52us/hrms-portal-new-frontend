"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  FileSpreadsheet,
  FolderOpen,
  ListPlus,
  PencilLine,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { courseStore } from "@/app/store/courseStore/courseStore";
import {
  CorrectQuizOption,
  CourseQuizInput,
  CourseQuizQuestionInput,
  createEmptyQuizQuestion,
} from "../courseForm";

const CORRECT_OPTIONS: CorrectQuizOption[] = ["Option-1", "Option-2", "Option-3", "Option-4"];
const MotionDiv = motion.div;

interface CourseQuizBuilderProps {
  quiz: CourseQuizInput;
  onChange: (quiz: CourseQuizInput) => void;
  title: string;
  helper: string;
}

function mapPreviewQuestion(question: any, index: number): CourseQuizQuestionInput {
  const optionMap = new Map<string, string>(
    (question.options || []).map((option: any) => [String(option.label || ""), String(option.text || "")]),
  );

  return {
    id: question.questionId || question.id || `${Date.now()}-${index}`,
    sn: Number(question.sn || index + 1),
    question: String(question.question || ""),
    option1: optionMap.get("Option-1") || "",
    option2: optionMap.get("Option-2") || "",
    option3: optionMap.get("Option-3") || "",
    option4: optionMap.get("Option-4") || "",
    correctOption: (question.correctOptionLabel || question.correctOption || "Option-1") as CorrectQuizOption,
    marks: String(question.marks ?? "1"),
    explanation: String(question.explanation || ""),
  };
}

function truncateQuestion(value: string, limit = 88) {
  const text = String(value || "").trim();
  if (!text) {
    return "Untitled question";
  }

  return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
}

export default function CourseQuizBuilder({ quiz, onChange, title, helper }: CourseQuizBuilderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const updateQuiz = (patch: Partial<CourseQuizInput>) => {
    onChange({ ...quiz, ...patch });
  };

  const updateQuestion = (questionId: string, patch: Partial<CourseQuizQuestionInput>) => {
    updateQuiz({
      source: quiz.source === "excel" ? "mixed" : quiz.source,
      questions: quiz.questions.map((question) =>
        question.id === questionId ? { ...question, ...patch } : question,
      ),
    });
  };

  const addQuestion = () => {
    const nextQuestion = createEmptyQuizQuestion(quiz.questions.length + 1);
    updateQuiz({
      source: quiz.source === "excel" ? "mixed" : "manual",
      questions: [...quiz.questions, nextQuestion],
    });
    setIsEditorOpen(true);
  };

  const removeQuestion = (questionId: string) => {
    updateQuiz({
      questions: quiz.questions
        .filter((question) => question.id !== questionId)
        .map((question, index) => ({ ...question, sn: index + 1 })),
    });
  };

  const handleExcelFile = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadMessage("");

    try {
      const preview = await courseStore.previewQuizExcel(file);
      const parsedQuestions = (preview?.questions || []).map(mapPreviewQuestion);

      updateQuiz({
        title: quiz.title || preview?.title || file.name.replace(/\.[^.]+$/, ""),
        source: "excel",
        questions: parsedQuestions,
      });
      setUploadMessage(
        `${parsedQuestions.length} question${parsedQuestions.length === 1 ? "" : "s"} imported from ${file.name}.`,
      );
      setIsEditorOpen(true);
    } catch (error: any) {
      setUploadMessage(error?.message || error?.error || "Unable to read this Excel quiz. Please check the sample format.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const completedQuestionCount = quiz.questions.filter((question) => {
    return (
      question.question.trim() &&
      question.option1.trim() &&
      question.option2.trim() &&
      question.option3.trim() &&
      question.option4.trim()
    );
  }).length;
  const totalMarks = quiz.questions.reduce((total, question) => {
    const marks = Number(question.marks || 1);
    return total + (Number.isFinite(marks) ? Math.max(0, marks) : 1);
  }, 0);
  const incompleteCount = Math.max(quiz.questions.length - completedQuestionCount, 0);
  const primaryButtonLabel = quiz.questions.length > 0 ? "View or edit questions" : "Open quiz builder";

  const drawer = typeof document !== "undefined"
    ? createPortal(
        <AnimatePresence>
          {isEditorOpen ? (
            <MotionDiv
              className="fixed inset-0 z-[1300] flex justify-end bg-slate-950/55 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditorOpen(false)}
            >
              <MotionDiv
                className="flex h-full w-full max-w-4xl flex-col overflow-hidden border-l border-slate-200 bg-slate-50 shadow-2xl"
                initial={{ x: 48 }}
                animate={{ x: 0 }}
                exit={{ x: 48 }}
                transition={{ duration: 0.2 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        <Sparkles className="h-3.5 w-3.5" />
                        Quiz editor
                      </div>
                      <h4 className="mt-3 text-lg font-bold text-slate-950">{title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{helper}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-slate-200 bg-white"
                        onClick={() => setIsEditorOpen(false)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Close
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          Quiz title
                        </label>
                        <Input
                          value={quiz.title}
                          onChange={(event) => updateQuiz({ title: event.target.value })}
                          placeholder="e.g., Affordable Home Loans Checkpoint"
                          className="h-11 rounded-xl border-emerald-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          Questions
                        </label>
                        <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-700">
                          {quiz.questions.length}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-emerald-200 bg-white"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        {isUploading ? "Reading..." : "Upload Excel"}
                      </Button>
                      <Button
                        type="button"
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                        onClick={addQuestion}
                      >
                        <ListPlus className="mr-2 h-4 w-4" />
                        Add question
                      </Button>
                    </div>
                  </div>

                  {uploadMessage ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-slate-700">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                      {uploadMessage}
                    </div>
                  ) : null}
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                  {quiz.questions.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-emerald-300 bg-white p-8 text-center">
                      <FileSpreadsheet className="mx-auto h-10 w-10 text-emerald-600" />
                      <p className="mt-4 text-sm font-semibold text-slate-800">Start with Excel or add questions manually</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Expected columns: SN, Question, Option-1, Option-2, Option-3, Option-4, Correct Option.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quiz.questions.map((question, index) => (
                        <div key={question.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                          <div className="mb-4 flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-black text-emerald-700">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <Textarea
                                value={question.question}
                                onChange={(event) => updateQuestion(question.id, { question: event.target.value })}
                                placeholder="Question"
                                className="min-h-[90px] resize-none rounded-2xl border-slate-200 bg-slate-50"
                              />
                            </div>
                            <button
                              type="button"
                              className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              onClick={() => removeQuestion(question.id)}
                              aria-label="Remove question"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            {(["option1", "option2", "option3", "option4"] as const).map((optionKey, optionIndex) => {
                              const label = CORRECT_OPTIONS[optionIndex];
                              const isCorrect = question.correctOption === label;

                              return (
                                <label
                                  key={optionKey}
                                  className={`rounded-2xl border p-3 transition ${
                                    isCorrect
                                      ? "border-emerald-300 bg-emerald-50"
                                      : "border-slate-200 bg-slate-50"
                                  }`}
                                >
                                  <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                      {label}
                                    </span>
                                    <button
                                      type="button"
                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                                        isCorrect
                                          ? "bg-emerald-600 text-white"
                                          : "bg-white text-slate-500 hover:text-emerald-700"
                                      }`}
                                      onClick={() => updateQuestion(question.id, { correctOption: label })}
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                      Correct
                                    </button>
                                  </div>
                                  <Input
                                    value={question[optionKey]}
                                    onChange={(event) => updateQuestion(question.id, { [optionKey]: event.target.value })}
                                    placeholder={`Answer ${optionIndex + 1}`}
                                    className="h-10 rounded-xl border-slate-200 bg-white"
                                  />
                                </label>
                              );
                            })}
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr]">
                            <div>
                              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Marks
                              </label>
                              <Input
                                type="number"
                                min={0}
                                step={0.5}
                                value={question.marks}
                                onChange={(event) => updateQuestion(question.id, { marks: event.target.value })}
                                className="h-10 rounded-xl border-slate-200 bg-slate-50"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Explanation or feedback
                              </label>
                              <Input
                                value={question.explanation}
                                onChange={(event) => updateQuestion(question.id, { explanation: event.target.value })}
                                placeholder="Optional note shown in admin data"
                                className="h-10 rounded-xl border-slate-200 bg-slate-50"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </MotionDiv>
            </MotionDiv>
          ) : null}
        </AnimatePresence>,
        document.body,
      )
    : null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(event) => handleExcelFile(event.target.files)}
      />

      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
              Course quiz
            </div>
            <h4 className="mt-3 text-base font-bold text-slate-950">{title}</h4>
            <p className="mt-1 text-sm text-slate-600">{helper}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[260px]">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm">
              <p className="text-lg font-black text-slate-900">{quiz.questions.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Questions</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm">
              <p className="text-lg font-black text-emerald-700">{completedQuestionCount}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ready</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm">
              <p className="text-lg font-black text-amber-700">{totalMarks}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Marks</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Quiz title
            </label>
            <Input
              value={quiz.title}
              onChange={(event) => updateQuiz({ title: event.target.value })}
              placeholder="e.g., Affordable Home Loans Checkpoint"
              className="h-11 rounded-xl border-emerald-200 bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-emerald-200 bg-white"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              {isUploading ? "Reading..." : "Upload Excel"}
            </Button>
            <Button type="button" variant="outline" className="rounded-xl border-slate-200 bg-white" onClick={addQuestion}>
              <ListPlus className="mr-2 h-4 w-4" />
              Add question
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setIsEditorOpen(true)}
            >
              {quiz.questions.length > 0 ? <PencilLine className="mr-2 h-4 w-4" /> : <FolderOpen className="mr-2 h-4 w-4" />}
              {primaryButtonLabel}
            </Button>
          </div>
        </div>

        {uploadMessage ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-sm text-slate-700">
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            {uploadMessage}
          </div>
        ) : null}

        {quiz.questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-300 bg-white/70 p-6 text-center">
            <FileSpreadsheet className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-3 text-sm font-semibold text-slate-800">Keep the builder tucked away until you need it</p>
            <p className="mt-1 text-xs text-slate-500">
              Open the side panel to write questions one by one, or import the whole quiz from Excel.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Quiz snapshot</p>
                <p className="text-xs text-slate-500">
                  {quiz.source === "excel" ? "Imported from Excel" : quiz.source === "mixed" ? "Excel + manual edits" : "Built manually"}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {incompleteCount === 0 ? "Everything looks ready" : `${incompleteCount} question${incompleteCount === 1 ? "" : "s"} still need work`}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {quiz.questions.slice(0, 3).map((question, index) => (
                <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Question {index + 1}</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">{truncateQuestion(question.question)}</p>
                </div>
              ))}
            </div>

            {quiz.questions.length > 3 ? (
              <button
                type="button"
                onClick={() => setIsEditorOpen(true)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Review the remaining {quiz.questions.length - 3} question{quiz.questions.length - 3 === 1 ? "" : "s"} in the side panel
                <FolderOpen className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        )}
      </div>

      {drawer}
    </>
  );
}
