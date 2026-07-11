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
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Email Login
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Email and Password
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter your email and password to access your HRMS workspace.
          </p>
        </div>

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

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <div className="mt-2 flex items-center rounded-md border border-slate-200 bg-white px-3 focus-within:border-slate-400">
              <Mail className="h-4 w-4 text-slate-400" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border-0 bg-transparent px-3 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="admin@company.com"
                autoComplete="email"
                type="email"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <div className="mt-2 flex items-center rounded-md border border-slate-200 bg-white px-3 focus-within:border-slate-400">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border-0 bg-transparent px-3 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="Enter password"
                type="password"
                autoComplete="current-password"
              />
            </div>
          </label>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          Need access? Ask your superadmin or company admin to invite you.
        </p>
      </div>
    </AuthLayout>
  );
});

export default LoginPage;
