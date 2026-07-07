"use client";

import { motion } from "framer-motion";
import {
  FileText,      // Basic Info
  LayoutTemplate,// Structure
  TrendingUp,    // Progress
  CreditCard,    // Pricing
  Eye,           // Preview
  Send,          // Publish
} from "lucide-react";

const STEPS = [
  { label: "Basic Info", icon: FileText },
  { label: "Structure",  icon: LayoutTemplate },
  { label: "Progress",   icon: TrendingUp },
  { label: "Pricing",    icon: CreditCard },
  { label: "Preview",    icon: Eye },
  { label: "Publish",    icon: Send },
];

// One distinct color per step (Tailwind-like hues, adjust as needed)
const STEP_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#06B6D4", // cyan
  "#6B7280", // gray
];

interface CourseStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: Set<number>;
  /** 0–100: how much of the current step is filled in */
  stepProgress?: number;
}

/**
 * ProgressRing wraps cleanly around a BUBBLE_SIZE bubble.
 * BUBBLE_SIZE = 52  →  SVG = 52 + 2*GAP + 2*STROKE  positioned at -(GAP+STROKE)
 */
const BUBBLE   = 52;   // px — must match the bubble width/height below
const STROKE   = 3;    // ring stroke width
const GAP      = 3;    // gap between bubble edge and ring centre
const SVG_SIZE = BUBBLE + 2 * (GAP + STROKE);          // 52 + 2*(3+3) = 64
const OFFSET   = -(GAP + STROKE);                       // -6
const RADIUS   = (BUBBLE / 2) + GAP + STROKE / 2;      // 26 + 3 + 1.5 = 30.5

function ProgressRing({ progress = 0, color }: { progress?: number; color: string }) {
  const circumference = 2 * Math.PI * RADIUS;
  const dashOffset    = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={SVG_SIZE}
      height={SVG_SIZE}
      style={{
        position: "absolute",
        top: OFFSET,
        left: OFFSET,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {/* Grey track — only show when there is some progress */}
      {progress > 0 && (
        <circle
          cx={SVG_SIZE / 2}
          cy={SVG_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={STROKE}
        />
      )}
      {/* Coloured arc */}
      <motion.circle
        cx={SVG_SIZE / 2}
        cy={SVG_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: dashOffset }}
        initial={{ strokeDashoffset: circumference }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          transformOrigin: `${SVG_SIZE / 2}px ${SVG_SIZE / 2}px`,
          rotate: "-90deg",
        }}
      />
    </svg>
  );
}

export function CourseStepper({
  currentStep,
  onStepClick,
  completedSteps,
  stepProgress = 0,
}: CourseStepperProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        width: "100%",
        marginBottom: 40,
        paddingTop: 16,
        paddingBottom: 8,
        boxSizing: "border-box",
      }}
    >
      {STEPS.map((step, i) => {
        const isCompleted = completedSteps.has(i);
        const isCurrent   = i === currentStep;
        const stepColor   = STEP_COLORS[i % STEP_COLORS.length];
        const Icon        = step.icon;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* ── Bubble + label ── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => onStepClick(i)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  position: "relative",
                  width: 52,
                  height: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "visible",
                }}
              >
                {/* Progress ring — only on current step */}
                {isCurrent && stepProgress > 0 && (
                  <ProgressRing progress={stepProgress} color={stepColor} />
                )}

                <motion.div
                  animate={{ scale: isCurrent ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    background: isCurrent || isCompleted ? stepColor : "#F3F4F6",
                    border:
                      isCurrent || isCompleted
                        ? "none"
                        : "1.5px solid #E5E7EB",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                    flexShrink: 0,
                    color: "white",
                  }}
                >
                  {isCompleted ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      color={isCurrent || isCompleted ? "white" : "#9CA3AF"}
                    />
                  )}
                </motion.div>
              </button>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  color: isCurrent || isCompleted ? stepColor : "#9CA3AF",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* ── Connector line ── */}
            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  marginLeft: 6,
                  marginRight: 6,
                  marginTop: -20,
                  background: "#E5E7EB",
                  position: "relative",
                  borderRadius: 2,
                }}
              >
                <motion.div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    background: STEP_COLORS[i % STEP_COLORS.length],
                    borderRadius: 2,
                  }}
                  animate={{
                    width: isCompleted ? "100%" : isCurrent ? "50%" : "0%",
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
