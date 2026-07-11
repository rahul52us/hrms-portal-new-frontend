"use client";

import { AlertCircle, CheckCircle2, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { AuthLayout } from "../../../../components/auth/AuthLayout";
import stores from "../../../store/stores";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const tokenParam = params?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : String(tokenParam || "");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setErrorText("Reset token is missing. Use the link from your email.");
      return;
    }

    if (!password || !confirmPassword) {
      setErrorText("Enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorText("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      await stores.auth.resetPassword({ token, password });
      setSuccessText("Password changed successfully. Redirecting to login.");
      setTimeout(() => router.replace("/login"), 700);
    } catch (error: any) {
      setErrorText(error?.message || error?.error || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" hideBrand>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Password Reset
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          Create a new password
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Choose a secure password for your HRMS account.
        </p>

        {errorText && (
          <div className="mt-5 flex gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        {successText && (
          <div className="mt-5 flex gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{successText}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">New Password</span>
            <div className="mt-2 flex items-center rounded-md border border-slate-200 bg-white px-3 focus-within:border-slate-400">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border-0 bg-transparent px-3 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="Enter new password"
                type="password"
                autoComplete="new-password"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Confirm Password</span>
            <div className="mt-2 flex items-center rounded-md border border-slate-200 bg-white px-3 focus-within:border-slate-400">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full border-0 bg-transparent px-3 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="Confirm new password"
                type="password"
                autoComplete="new-password"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Reset Password
          </button>
        </form>

        <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-slate-600 hover:text-slate-950">
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
