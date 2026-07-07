"use client";

import { motion } from "framer-motion";
import { Loader2, Scan, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { AuthLayout } from "../../../components/auth/AuthLayout";

import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getDefaultAuthenticatedRoute } from "../../config/utils/roleAccess";
import stores from "../../store/stores";
import { observer } from "mobx-react-lite";


type Step = "phone" | "otp";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const LoginPage = observer(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, openNotification, requestOtp } = stores.auth;
  const requestedRedirect = String(searchParams.get("redirect") || "").trim();
  const wasRegistered = searchParams.get("registered") === "1";
  const redirectTarget = requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//") ? requestedRedirect : "";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (wasRegistered) {
      openNotification({
        title: "Account created",
        message: "Sign in with your phone number and OTP to continue.",
        type: "success",
      });
    }
  }, [openNotification, wasRegistered]);

  const handleRequestOtp = async () => {
    const normalizedPhone = phone.trim();
    if (!/^\d{10}$/.test(normalizedPhone)) {
      setErrorText("INVALID NUMBER");
      return;
    }
    setLoading(true);
    setErrorText("");
    try {
      const res = await requestOtp({ phone: normalizedPhone, purpose: "login" });
      if (res?.data?.token) {
        setToken(res.data.token);
      }
      setIsFlipped(true);
      setTimeout(() => setStep("otp"), 300);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 800);
    } catch (error: any) {
      const backendMessage = error?.message || error?.error || error?.response?.data?.message || "UNABLE TO SEND OTP";
      setErrorText(backendMessage.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    const normalizedPhone = phone.trim();
    setLoading(true);
    setErrorText("");
    try {
      const response: any = await login({ phone: normalizedPhone, otp: code, token: token || undefined });
      setIsUnlocked(true);
      setTimeout(() => {
        window.location.href = redirectTarget || getDefaultAuthenticatedRoute(stores.auth.user || { userType: response?.data?.userType, role: response?.data?.role });
      }, 1500);
    } catch (error: any) {
      const backendMessage = error?.message || error?.error || error?.response?.data?.message || "INVALID OTP";
      setErrorText(backendMessage.toUpperCase());
      setTimeout(() => {
        setErrorText("");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    const currentCode = newOtp.join("");
    if (currentCode.length === 6) {
      handleVerify(currentCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <AuthLayout>
      <div className={cn(
        "w-full relative transition-transform duration-1000",
        isFlipped ? "rotate-y-180" : ""
      )} style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}>

        {/* Phone Input Card (Front) */}
        <div
          className={cn(
            "w-full rounded-[36px] px-8 transition-all duration-1000",
            "bg-white/60 border border-white/80 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur-3xl pt-8 pb-6",
            "ring-1 ring-black/5 dark:ring-white/10 inner-border inner-border-white/50",
            "dark:bg-[#13072E]/40 dark:border-white/5 dark:pt-10 dark:pb-8 dark:backdrop-blur-[40px] dark:shadow-[0_40px_100px_rgba(139,92,246,0.15)] dark:inner-border-white/5"
          )}
          style={{ backfaceVisibility: 'hidden', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', position: step === 'phone' ? 'relative' : 'absolute', top: 0, left: 0 }}
        >
          <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
            <NextLink href="/" className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-black/40 hover:text-primary dark:text-white/40 dark:hover:text-primary transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Home
            </NextLink>
            <p className="text-[11px] font-[900] uppercase tracking-[0.3em] text-black/60 dark:text-white/60 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">Welcome Back</p>
            <div className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center justify-start border-b-[1.5px] pb-1.5 transition-all duration-500 border-black/5 focus-within:border-primary dark:border-primary/30 dark:focus-within:border-primary mt-12">
            <span className="text-xl font-semibold mr-3 text-black/40 dark:text-white/20">+91</span>
            <input
              type="tel"
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && phone.length === 10) {
                  e.preventDefault();
                  handleRequestOtp();
                }
              }}
              className="bg-transparent border-none outline-none font-semibold text-2xl w-full text-left text-black/80 placeholder:text-black/20 dark:text-white dark:placeholder:text-white/20"
              placeholder="0000000000"
              disabled={loading}
            />
          </div>
          {errorText && (
            <div className="mt-4 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 animate-in slide-in-from-top-1 fade-in duration-300 backdrop-blur-md shadow-[0_4px_15px_rgba(239,68,68,0.15)]">
              <AlertCircle className="w-4 h-4 shrink-0 animate-pulse text-red-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-tight pt-[1px]">{errorText}</p>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={handleRequestOtp}
              disabled={phone.length !== 10 || loading}
              className={cn(
                "w-full py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all",
                "bg-primary text-white shadow-[0_10px_20px_rgba(var(--primary),0.2)] hover:brightness-110",
                "dark:bg-primary dark:text-white dark:shadow-[0_10px_30px_rgba(237,56,85,0.3)] dark:hover:brightness-110",
                phone.length === 10 ? "opacity-100 translate-y-0" : "opacity-50 pointer-events-none"
              )}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>SEND OTP <CheckCircle2 className="w-3.5 h-3.5" /></>}
            </button>
          </div>

          <div className="mt-6 text-center text-[10px] font-bold text-black/40 dark:text-white/40">
            <NextLink href={redirectTarget ? `/register?redirect=${encodeURIComponent(redirectTarget)}` : "/register"} className="uppercase tracking-widest hover:text-primary dark:hover:text-white transition-colors">
              New User? Create Account
            </NextLink>
          </div>
        </div>

        {/* OTP Cipher Card (Back) */}
        <div
          className={cn(
            "w-full rounded-[40px] px-8 py-10 border transition-all duration-1000 flex flex-col justify-center",
            "bg-white/60 border-white/80 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur-3xl",
            "ring-1 ring-black/5 dark:ring-white/10 inner-border inner-border-white/50",
            "dark:bg-[#13072E]/40 dark:border-white/5 dark:backdrop-blur-[40px] dark:shadow-[0_40px_100px_rgba(139,92,246,0.15)] dark:inner-border-white/5"
          )}
          style={{ backfaceVisibility: 'hidden', transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)', position: step === 'otp' ? 'relative' : 'absolute', top: 0, left: 0 }}
        >
          <div className="text-center mt-2">
            <p className={cn(
              "text-[15px] font-[900] uppercase tracking-widest transition-colors",
              errorText ? "text-red-500" : isUnlocked ? "text-green-500" : "text-black dark:text-white"
            )}>
              {isUnlocked ? "SIGN IN SUCCESSFUL" : errorText ? "INVALID CODE" : "VERIFY IT'S YOU"}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] mt-2 text-black/30 dark:text-white/40">
              Enter the 6-digit OTP
            </p>
          </div>

          <div className="flex justify-between gap-2 mt-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                maxLength={1}
                className={cn(
                  "w-full aspect-[4/5] rounded-xl text-center font-mono text-xl font-bold outline-none transition-all",
                  "bg-black/5 border-transparent focus:border-primary text-black",
                  "dark:bg-black/40 dark:border-white/10 dark:text-white dark:focus:border-primary dark:focus:bg-primary/10",
                  errorText && "border-red-500/50 bg-red-500/10 dark:border-red-500/50 dark:bg-red-500/10"
                )}
              />
            ))}
          </div>
          {errorText && (
            <div className="mt-6 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 animate-in slide-in-from-bottom-2 fade-in duration-300 backdrop-blur-md shadow-[0_4px_15px_rgba(239,68,68,0.15)]">
              <AlertCircle className="w-4 h-4 shrink-0 animate-pulse text-red-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-tight pt-[1px]">{errorText}</p>
            </div>
          )}

          <div className="mt-8 flex flex-col items-center">
            <button
              onClick={() => {
                setIsFlipped(false);
                setTimeout(() => setStep("phone"), 500);
              }}
              className="text-[10px] font-bold uppercase tracking-[0.4em] transition-all text-black/30 hover:text-primary dark:text-white/30 dark:hover:text-primary"
            >
              Change Number
            </button>
          </div>

          {loading && (
            <div className="absolute inset-0 z-[50] flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in duration-500 rounded-[40px] bg-white/40 dark:bg-black/40">
              <div className="relative scale-75">
                <div className="w-24 h-24 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="mt-6 text-[9px] font-black uppercase tracking-[0.4em] text-black/40 dark:text-white/40">Verifying...</p>
            </div>
          )}
        </div>

      </div>
    </AuthLayout>
  );
});

export default LoginPage;

