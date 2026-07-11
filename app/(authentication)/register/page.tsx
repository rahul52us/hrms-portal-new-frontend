"use client";

import { useRouter } from "next/navigation";
import { AuthLayout } from "../../../components/auth/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <AuthLayout title="Invite Required" hideBrand>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Account Access
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          Registration is managed by your admin
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          HRMS accounts are created by the platform superadmin or your company admin. Use your invite link or sign in with your existing account.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-6 w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Go To Login
        </button>
      </div>
    </AuthLayout>
  );
}
