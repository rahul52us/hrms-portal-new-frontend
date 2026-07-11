import React from "react";
import "./auth.css";

export function AuthLayout({
  children,
  eyebrow = "HRMS",
  title = "Workspace Access",
  subtitle = "Sign in to manage companies, employees, attendance, leave, and payroll operations.",
  hideBrand,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  hideBrand?: boolean;
}) {
  return (
    <main className="min-h-[100dvh] bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-6xl grid-cols-1 lg:grid-cols-[1fr_440px]">
        <section className="hidden flex-col justify-between px-10 py-10 lg:flex">
          <div>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {eyebrow}
            </div>
            {!hideBrand && (
              <div className="mt-12 max-w-xl">
                <h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-950">
                  Human Resource Management System
                </h1>
                <p className="mt-5 text-base leading-7 text-slate-600">
                  {subtitle}
                </p>
              </div>
            )}
          </div>

          <div className="grid max-w-2xl grid-cols-3 gap-4">
            {[
              ["Companies", "Tenant setup and admin access"],
              ["Employees", "Profiles, roles, and documents"],
              ["Approvals", "Leave, attendance, and workflows"],
            ].map(([label, text]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-[100dvh] items-center justify-center px-4 py-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-6 lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {title}
              </h1>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
