"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface StepWrapperProps {
  children: ReactNode;
  stepKey: number;
  title: string;
  subtitle: ReactNode;
  icon: ReactNode;
  accentColor: string;
}

export function StepWrapper({ children, stepKey, title, subtitle, icon, accentColor }: StepWrapperProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4 mb-2">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg"
            style={{ background: `${accentColor}20`, color: accentColor }}
          >
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
