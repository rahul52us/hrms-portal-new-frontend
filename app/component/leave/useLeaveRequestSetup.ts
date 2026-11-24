"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/app/config/utils/apiError";
import { fetchLeaveRequestSetup, LeaveRequestSetup } from "./leaveApi";

export function useLeaveRequestSetup(enabled: boolean, fromDate: string, toDate: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; attempt: number; setup: LeaveRequestSetup | null; loading: boolean; error: string }>({ key: "", attempt: 0, setup: null, loading: false, error: "" });
  const key = `${fromDate}|${toDate}`;
  const dateError = !fromDate || !toDate ? "Select both From date and To date to check your work schedule." : fromDate > toDate ? "From date must be on or before To date." : "";
  const recheck = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (!enabled || dateError) {
      setResult({ key: "", attempt, setup: null, loading: false, error: "" });
      return;
    }
    let active = true;
    const controller = new AbortController();
    setResult({ key, attempt, setup: null, loading: true, error: "" });
    const timer = setTimeout(async () => {
      try {
        const setup = await fetchLeaveRequestSetup({ fromDate, toDate }, controller.signal);
        const validIssues = Array.isArray(setup?.issues) && setup.issues.every((issue) => issue?.code === "work_schedule_missing" && typeof issue.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(issue.date) && Number.isFinite(Date.parse(`${issue.date}T00:00:00Z`)) && issue.date >= fromDate && issue.date <= toDate);
        if (typeof setup?.ready !== "boolean" || !validIssues || setup.ready !== (setup.issues.length === 0) || setup.fromDate !== fromDate || setup.toDate !== toDate) throw new Error("Unable to verify the work schedule for these dates. Please try again.");
        if (active) setResult({ key, attempt, setup, loading: false, error: "" });
      } catch (error: any) {
        if (active) setResult({ key, attempt, setup: null, loading: false, error: getApiErrorMessage(error?.response?.data || error, "Unable to check your work schedule. Please try again.") });
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [enabled, fromDate, toDate, key, attempt, dateError]);

  // Date changes and retries invalidate readiness immediately, before the next effect runs.
  const current = enabled && result.key === key && result.attempt === attempt;
  return {
    ready: Boolean(current && !dateError && !result.loading && !result.error && result.setup?.ready === true),
    loading: Boolean(enabled && !dateError && (!current || result.loading)),
    error: enabled ? dateError || (current ? result.error : "") : "",
    issues: current && !dateError ? result.setup?.issues || [] : [],
    recheck,
  };
}
