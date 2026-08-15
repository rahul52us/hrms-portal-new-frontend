"use client";

import { AlertCircle, CheckCircle2, Loader2, Lock, Mail } from "lucide-react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { AuthLayout } from "../../../components/auth/AuthLayout";
import { getDefaultAuthenticatedRoute } from "../../config/utils/roleAccess";
import stores from "../../store/stores";

const LoginPage = observer(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = String(searchParams.get("redirect") || "").trim();
  const redirectTarget =
    requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const redirectAfterLogin = (fallbackUser?: any) => {
    const user = stores.auth.user || fallbackUser || {};
    router.replace(redirectTarget || getDefaultAuthenticatedRoute(user));
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setErrorText("Enter your email and password.");
      return;
    }

    setLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      const response: any = await stores.auth.loginWithPassword({
        email: normalizedEmail,
        password,
      });
      setSuccessText("Signed in successfully.");
      setTimeout(() => redirectAfterLogin(response?.data), 300);
    } catch (error: any) {
      setErrorText(error?.message || error?.error || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign In">
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

        <form className="space-y-6" onSubmit={handleLogin}>
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

          <label className="block">
            <span className="text-sm font-bold text-slate-800 mb-2 block">Password</span>
            <div className="flex h-12 rounded bg-[#e8f0fe] overflow-hidden relative">
              <div className="flex w-12 shrink-0 items-center justify-center bg-[#334155]">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent px-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500 pr-12"
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="absolute right-0 top-0 h-full px-4 flex items-center justify-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {/* Basic Eye-off icon placeholder */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              </button>
            </div>
          </label>

          <div className="flex justify-start">
            <Link href="/forgot-password" className="text-sm font-bold text-slate-800 hover:text-slate-900 hover:underline">
              Forgot Your Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded bg-[#2e3b4e] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            <span>Login</span>
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] font-medium text-slate-800">
          Having Problems? <a href="#" className="text-indigo-600 hover:underline">Visit Our Support Site</a>
        </p>
      </div>
    </AuthLayout>
  );
});

export default LoginPage;
