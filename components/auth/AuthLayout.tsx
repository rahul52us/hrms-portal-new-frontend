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
      <div className="mx-auto grid min-h-[100dvh] w-full grid-cols-1 lg:grid-cols-2">
        {/* Left Section: Graphic */}
        <section className="hidden lg:flex flex-col items-center justify-center bg-[#f8fafc] relative overflow-hidden p-8 xl:p-12">

          <div className="relative w-full h-full flex items-center justify-center max-w-[900px] max-h-[900px]">
             {/* Subtle background glow to fill space visually */}
             <div className="absolute inset-4 bg-gradient-to-tr from-indigo-100 via-blue-50 to-indigo-100 rounded-[4rem] blur-3xl mix-blend-multiply opacity-70"></div>

             {/* Container for the illustration - Removed white background */}
             <div className="relative w-full h-full flex items-center justify-center p-10 lg:p-16">

                {/* Using the exact SVG requested by the user */}
                <img
                  src="/images/logo.svg"
                  alt="HRMS Dashboard Illustration"
                  className="w-full h-full object-contain drop-shadow-sm"
                />

             </div>
          </div>
        </section>

        {/* Right Section: Form */}
        <section className="flex flex-col min-h-[100dvh] items-center justify-center px-6 py-12 lg:px-12 lg:min-h-0 relative z-10 bg-slate-50 lg:bg-transparent">
          {/* Subtle mobile background glow */}
          <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-indigo-100/40 to-transparent lg:hidden -z-10"></div>
          
          <div className="w-full max-w-[400px] relative z-10">

            {/* Page Header (Title & Subtitle) */}
            <div className="mb-12">
              <div className="relative flex items-center justify-center mb-6 min-h-[48px]">
                {/* Left: Icon (Hidden on Mobile) */}
                <div className="hidden sm:flex absolute left-0 w-12 h-12 rounded-2xl bg-indigo-50 items-center justify-center border border-indigo-100 shadow-sm">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                {/* Center: Title */}
                <h2 className="whitespace-nowrap text-3xl sm:text-[2.1rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-800 tracking-tight text-center pb-1 drop-shadow-sm">
                  {title}
                </h2>
              </div>

              {subtitle && (
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-100 rounded-full"></div>
                  <p className="pl-4 text-[15px] text-slate-500 leading-relaxed font-medium">
                    {subtitle}
                  </p>
                </div>
              )}
            </div>

            {children}
          </div>
        </section>

      </div>
    </main>
  );
}
