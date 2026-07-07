import React from "react";

export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current
              ? "w-4 bg-primary"
              : i < current
              ? "w-1.5 bg-primary/40"
              : "w-1.5 bg-border"
          }`}
        />
      ))}
    </div>
  );
}
