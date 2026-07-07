import { motion } from "framer-motion";
import { Sparkles, Scan, Zap, ChevronLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import "./auth.css";

const emojis = [
  { e: "📚", l: "10%", d: "10s", a: "0s" },
  { e: "🎓", l: "45%", d: "12s", a: "2s" },
  { e: "✨", l: "80%", d: "9s", a: "1s" },
  { e: "💡", l: "25%", d: "14s", a: "4s" },
  { e: "🎯", l: "65%", d: "11s", a: "1.5s" },
  { e: "💻", l: "85%", d: "15s", a: "3s" },
  { e: "🧠", l: "35%", d: "12s", a: "5s" },
  { e: "📝", l: "15%", d: "13s", a: "3.5s" },
  { e: "🚀", l: "55%", d: "9s", a: "0.5s" },
  { e: "🔬", l: "75%", d: "16s", a: "6s" },
  { e: "⚡️", l: "5%", d: "11s", a: "2.5s" },
  { e: "🏆", l: "90%", d: "14s", a: "7s" },
  { e: "✏️", l: "30%", d: "10s", a: "1.2s" },
  { e: "🎒", l: "50%", d: "15s", a: "4.5s" },
];

export function AuthLayout({
  children,
  eyebrow,
  title,
  subtitle,
  hideBrand,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  hideBrand?: boolean;
}) {
  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden select-none z-[100] bg-[#FFF5F6] dark:bg-black transition-colors duration-700">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-white dark:bg-[#090314] transition-colors duration-1000">
        <div className="absolute w-[800px] h-[800px] bg-gradient-to-br from-primary/10 to-transparent dark:from-[#8b5cf6]/20 dark:to-transparent top-[-20%] left-[-20%] rounded-full blur-[120px] dark:blur-[160px] animate-pulse transition-all duration-1000" />
        <div className="absolute w-[600px] h-[600px] bg-[#F7B733]/15 dark:bg-primary/20 bottom-[-10%] right-[-10%] rounded-full blur-[120px] dark:blur-[160px] transition-all duration-1000" />

        <div className="absolute inset-0 overflow-hidden">
          {emojis.map((emoji, i) => (
            <div
              key={i}
              className="absolute bottom-[-50px] text-3xl opacity-100 dark:opacity-25 drop-shadow-sm transition-opacity duration-700"
              style={{
                left: emoji.l,
                animation: `floatUp ${emoji.d} linear infinite ${emoji.a}`,
              }}
            >
              {emoji.e}
            </div>
          ))}
        </div>
      </div>

      {/* Absolute Top Elements - Kept fixed so they don't scroll */}
      <div className="fixed top-8 left-0 w-full flex justify-between items-center px-8 z-[120] pointer-events-none">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-black/40 dark:text-white/30 transition-colors">ACADEMY</span>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold tracking-[0.3em] uppercase text-black/30 dark:text-white/20 transition-colors">Learner Access</span>
          <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_10px] bg-primary shadow-primary/50 animate-pulse" />
        </div>
      </div>

      {/* Main Scrollable Wrapper */}
      <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center pt-16 pb-4 px-4">
        {/* Main UI Layer */}
        <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center justify-center -mt-12 transition-transform duration-[1.5s] ease-[cubic-bezier(0.85,0,0.15,1)]">
        {/* Brand Header */}
        {!hideBrand && (
          <div className="flex flex-col items-center mb-2 w-full animate-in slide-in-from-bottom-4 fade-in duration-1000">
            <h1 className="text-[2.2rem] sm:text-[2.8rem] font-[900] leading-tight text-transparent bg-clip-text bg-gradient-to-br from-primary via-[#8b5cf6] to-[#F7B733] drop-shadow-[0_10px_20px_rgba(var(--primary),0.2)] tracking-tighter uppercase flex items-center justify-center transition-all duration-1000 pb-1 whitespace-nowrap">
              LUMA LMS
            </h1>
          </div>
        )}

        {/* Auth Interaction Area */}
        <div className="w-full perspective-[1200px] flex flex-col">
          <div className="w-full relative transition-transform duration-1000 preserve-3d">
            {children}
          </div>
        </div>
      </div>
    </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.25; }
          90% { opacity: 0.25; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
      `}} />
    </div>
  );
}
