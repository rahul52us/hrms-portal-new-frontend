"use client";

import { useEffect } from "react";
import { IndianRupee } from "lucide-react";
import { StepWrapper } from "./component/StepWrapper";
import { FormField } from "./component/FormField";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CoursePricingState } from "../courseForm";

interface Step4PricingProps {
  value: CoursePricingState;
  onChange: (value: CoursePricingState) => void;
  onProgressChange?: (progress: number) => void;
}

export default function Step4Pricing({ value, onChange, onProgressChange }: Step4PricingProps) {
  useEffect(() => {
    let filled = 1;

    if (!value.isPaid || value.amount.trim()) filled++;
    if (!value.isPaid || value.accessDurationDays.trim()) filled++;

    onProgressChange?.(Math.round((filled / 3) * 100));
  }, [value, onProgressChange]);

  return (
    <StepWrapper
      stepKey={3}
      title="Pricing & Access"
      subtitle={
        <span className="inline-flex items-center gap-1.5">
          Set up pricing and access duration
          <IndianRupee className="w-4 h-4" />
        </span>
      }
      icon={<IndianRupee className="w-6 h-6" />}
      accentColor="hsl(var(--step-4))"
    >
      <div className="grid gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-step-4/15 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-step-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{value.isPaid ? "Paid Course" : "Free Course"}</h3>
                <p className="text-sm text-muted-foreground">
                  {value.isPaid ? "Set your price in rupees" : "This course is free for all"}
                </p>
              </div>
            </div>
            <Switch checked={value.isPaid} onCheckedChange={(isPaid) => onChange({ ...value, isPaid })} />
          </div>
          {value.isPaid && (
            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="Price" required helper="In INR">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rs.</span>
                  <Input
                    type="number"
                    value={value.amount}
                    onChange={(event) => onChange({ ...value, amount: event.target.value })}
                    className="bg-background border-border rounded-xl h-11 pl-10"
                  />
                </div>
              </FormField>
              <FormField label="Access Duration" helper="How long learners can access" tooltip="Set to 0 for lifetime access">
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={value.accessDurationDays}
                    onChange={(event) => onChange({ ...value, accessDurationDays: event.target.value })}
                    className="bg-background border-border rounded-xl h-11 w-24"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </FormField>
            </div>
          )}
        </div>

      </div>
    </StepWrapper>
  );
}
