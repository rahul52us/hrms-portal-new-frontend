"use client";

import { useEffect } from "react";
import { Award, Clock, Lock, TrendingUp } from "lucide-react";
import { StepWrapper } from "./component/StepWrapper";
import { FormField } from "./component/FormField";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CourseProgressState } from "../courseForm";

interface Step3ProgressProps {
  value: CourseProgressState;
  onChange: (value: CourseProgressState) => void;
  moduleNames: string[];
  onProgressChange?: (progress: number) => void;
}

export default function Step3Progress({ value, onChange, moduleNames, onProgressChange }: Step3ProgressProps) {
  useEffect(() => {
    let filled = 3;

    if (value.completionDays.trim()) {
      filled += 1;
    }

    onProgressChange?.(Math.round((filled / 4) * 100));
  }, [value, onProgressChange]);

  const dripSchedule = moduleNames.map((name, index) => ({
    dayLabel: `Day ${index * 7 + 1}`,
    moduleLabel: name || `Module ${index + 1}`,
  }));

  return (
    <StepWrapper
      stepKey={2}
      title="Progress & Drip Settings"
      subtitle={
        <span className="inline-flex items-center gap-1.5">
          Control how learners progress
          <TrendingUp className="w-4 h-4" />
        </span>
      }
      icon={<TrendingUp className="w-6 h-6" />}
      accentColor="hsl(var(--step-3))"
    >
      <div className="grid gap-6">
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-step-3/15 flex items-center justify-center">
              <Clock className="w-5 h-5 text-step-3" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Completion Rules</h3>
              <p className="text-sm text-muted-foreground">Set deadlines and requirements</p>
            </div>
          </div>
          <FormField label="Must complete within" helper="Leave empty for no deadline" tooltip="Learners will see a countdown timer">
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={value.completionDays}
                onChange={(event) => onChange({ ...value, completionDays: event.target.value })}
                className="bg-background border-border rounded-xl h-11 w-24"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </FormField>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-step-3/15 flex items-center justify-center">
                <Lock className="w-5 h-5 text-step-3" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Drip Content</h3>
                <p className="text-sm text-muted-foreground">Release modules on a schedule</p>
              </div>
            </div>
            <Switch checked={value.dripEnabled} onCheckedChange={(dripEnabled) => onChange({ ...value, dripEnabled })} />
          </div>
          {value.dripEnabled && (
            <div className="bg-background rounded-xl p-4 space-y-3">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-step-3" />
                Configure release schedule for each module in the Structure tab
              </p>
              {dripSchedule.length > 0 ? (
                <div className="flex gap-3">
                  {dripSchedule.map((item) => (
                    <div key={`${item.dayLabel}-${item.moduleLabel}`} className="flex-1 bg-card rounded-lg border border-border p-3 text-center">
                      <div className="text-xs font-medium text-step-3">{item.dayLabel}</div>
                      <div className="text-xs text-muted-foreground mt-1">{item.moduleLabel}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Add modules in the Structure step to preview a drip schedule.</p>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-step-3" />
              <div>
                <p className="text-sm font-medium text-foreground">Certificate on Completion</p>
                <p className="text-xs text-muted-foreground">Award a certificate to learners</p>
              </div>
            </div>
            <Switch checked={value.certificateEnabled} onCheckedChange={(certificateEnabled) => onChange({ ...value, certificateEnabled })} />
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-step-3" />
              <div>
                <p className="text-sm font-medium text-foreground">Mandatory Modules</p>
                <p className="text-xs text-muted-foreground">All modules must be completed</p>
              </div>
            </div>
            <Switch checked={value.mandatoryModules} onCheckedChange={(mandatoryModules) => onChange({ ...value, mandatoryModules })} />
          </div>
        </div>
      </div>
    </StepWrapper>
  );
}
