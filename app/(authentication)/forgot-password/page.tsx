"use client";

import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { AuthLayout } from "../../../components/auth/AuthLayout";
import stores from "../../store/stores";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorText("Enter your email address.");
      return;
    }

    setLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      await stores.auth.forgotPasswordStore({ username: normalizedEmail });
      setSuccessText("If this email exists, a reset link has been sent.");
    } catch (error: any) {
      setErrorText(error?.message || error?.error || "Unable to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Forgot Password" 
      subtitle="Enter your account email. We will send a secure reset link if the account exists."
      hideBrand
    >
      <div className="w-full">
        {errorText && (
          <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span>{errorText}</span>
          </div>
        )}

        {successText && (
          <div className="mb-6 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successText}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-bold text-slate-800 mb-2 block">Email</span>
            <div className="flex h-12 rounded bg-[#e8f0fe] overflow-hidden">
              <div className="flex w-12 shrink-0 items-center justify-center bg-[#f79e5e]">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent px-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500"
                placeholder="admin@company.com"
                autoComplete="email"
                type="email"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded bg-[#2e3b4e] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            <span>Send Reset Link</span>
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] font-medium text-slate-800">
          Remembered your password? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Back to login</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
