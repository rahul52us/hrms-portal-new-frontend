"use client";

import { Autocomplete, GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";
import { Form, Formik, getIn } from "formik";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  GraduationCap,
  Loader2,
  LocateFixed,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  User,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import * as Yup from "yup";
import { AuthLayout } from "../../../components/auth/AuthLayout";
import { StepDots } from "../../../components/auth/StepDots";
import { getDefaultAuthenticatedRoute } from "../../config/utils/roleAccess";
import stores from "../../store/stores";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}


const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const hasGoogleMapsKey = Boolean(GOOGLE_MAPS_API_KEY.trim());
const GOOGLE_MAP_LIBRARIES: ("places")[] = ["places"];

type AccountType = "learner" | "admin";
type Step = "phone" | "otp" | "profile" | "company" | "location" | "review";

type SignupLocation = {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  placeId: string;
  lat: number | null;
  lng: number | null;
  formattedAddress: string;
};

type SignupValues = {
  accountType: AccountType;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyEmail: string;
  location: SignupLocation;
  termsAccepted: boolean;
};

const emptyLocation: SignupLocation = {
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  placeId: "",
  lat: null,
  lng: null,
  formattedAddress: "",
};

const defaultMapCenter = { lat: 20.5937, lng: 78.9629 };
const mapContainerStyle = { width: "100%", height: "100%" };
const mapOptions = { disableDefaultUI: true, clickableIcons: false, gestureHandling: "greedy" };

function getAddressPart(components: any[] = [], types: string[]) {
  const part = components.find((component) => types.some((type) => component.types?.includes(type)));
  return part?.long_name || "";
}

function buildLocationFromPlace(place: any, fallbackPoint?: { lat: number; lng: number }): SignupLocation {
  const components = place?.address_components || [];
  const geometryLocation = place?.geometry?.location;
  const lat = typeof geometryLocation?.lat === "function" ? geometryLocation.lat() : fallbackPoint?.lat ?? null;
  const lng = typeof geometryLocation?.lng === "function" ? geometryLocation.lng() : fallbackPoint?.lng ?? null;

  return {
    address: place?.formatted_address || place?.name || "",
    formattedAddress: place?.formatted_address || "",
    placeId: place?.place_id || "",
    city:
      getAddressPart(components, ["locality", "postal_town"]) ||
      getAddressPart(components, ["administrative_area_level_3", "administrative_area_level_2"]) ||
      getAddressPart(components, ["sublocality", "sublocality_level_1"]),
    state: getAddressPart(components, ["administrative_area_level_1"]),
    country: getAddressPart(components, ["country"]),
    postalCode: getAddressPart(components, ["postal_code"]),
    lat,
    lng,
  };
}

function applyLocationToFormik(setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void, location: SignupLocation) {
  Object.entries(location).forEach(([key, value]) => {
    setFieldValue(`location.${key}`, value, true);
  });
}

const Register = observer(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerAdmin, registerLearner, openNotification, requestOtp, verifyOtp } = stores.auth;
  const requestedRedirect = String(searchParams.get("redirect") || "").trim();
  const redirectTarget = requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//") ? requestedRedirect : "";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpSessionToken, setOtpSessionToken] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const [locationBusy, setLocationBusy] = useState(false);
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState(defaultMapCenter);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState("Search, tap the map, or use current location.");

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || "AIzaSyDUMMY_KEY_FOR_DISABLED_MAP",
    libraries: GOOGLE_MAP_LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  useEffect(() => {
    if (!resendIn) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const normalizedPhone = phone.trim();
  const normalizedOtp = otp.join("").trim();

  const initialValues = useMemo<SignupValues>(
    () => ({
      accountType: "learner",
      name: "",
      email: "",
      phone: "",
      companyName: "",
      companyEmail: "",
      location: emptyLocation,
      termsAccepted: false,
    }),
    []
  );

  const validationSchema = useMemo(
    () =>
      Yup.object({
        accountType: Yup.mixed<AccountType>().oneOf(["learner", "admin"]).required(),
        name: Yup.string().trim().min(2, "Enter your full name").max(80, "Name is too long").required("Full name is required"),
        email: Yup.string().trim().lowercase().email("Enter a valid email address"),
        companyName: Yup.string().when("accountType", {
          is: "admin",
          then: (schema) => schema.trim().min(2, "Enter your company name").max(120, "Company name is too long").required("Company name is required"),
          otherwise: (schema) => schema.trim(),
        }),
        companyEmail: Yup.string().when("accountType", {
          is: "admin",
          then: (schema) => schema.trim().lowercase().email("Enter a valid company email address"),
          otherwise: (schema) => schema.trim(),
        }),
        location: Yup.object({
          address: Yup.string().trim().min(3, "Enter a complete address").required("Address is required"),
          city: Yup.string().trim().required("City is required"),
          state: Yup.string().trim().required("State is required"),
          country: Yup.string().trim().required("Country is required"),
          postalCode: Yup.string().trim().required("Pincode is required"),
          placeId: Yup.string().trim(),
          lat: Yup.number().nullable(),
          lng: Yup.number().nullable(),
          formattedAddress: Yup.string().trim(),
        }),
        termsAccepted: Yup.boolean().oneOf([true], "Accept the terms to continue"),
      }),
    []
  );

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(normalizedPhone)) {
      openNotification({ title: "Check your phone number", message: "Enter a valid 10-digit phone number.", type: "error" });
      return;
    }
    setBusy(true);
    try {
      const res = await requestOtp({ phone: normalizedPhone, purpose: "register" });
      if (res?.data?.token) {
        setOtpSessionToken(res.data.token);
      }
      setOtp(["", "", "", "", "", ""]);
      setResendIn(30);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 500);
      const hintMessage = res?.data?.otpHint || "Check your phone for the 6-digit code.";
      openNotification({ title: "OTP sent", message: hintMessage, type: "success" });
    } catch (error: any) {
      openNotification({ title: "Unable to continue", message: error?.message || error?.error || "We could not start registration.", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (overrideOtp?: string) => {
    const code = overrideOtp || normalizedOtp;
    if (code.length !== 6) {
      openNotification({ title: "Check your OTP", message: "Enter the 6-digit OTP.", type: "error" });
      return;
    }
    setBusy(true);
    try {
      const response: any = await verifyOtp({ phone: normalizedPhone, otp: code, purpose: "register", token: otpSessionToken || undefined });
      setVerificationToken(response?.data?.verificationToken || response?.verificationToken || "");
      setStep("profile");
      openNotification({ title: "Phone verified", message: "Finish the rest of your account details.", type: "success" });
    } catch (error: any) {
      openNotification({ title: "Verification failed", message: error?.message || error?.error || "Unable to verify that OTP.", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (values: SignupValues) => {
    const location = {
      address: values.location.address.trim(),
      city: values.location.city.trim(),
      state: values.location.state.trim(),
      country: values.location.country.trim(),
      postalCode: values.location.postalCode.trim(),
      placeId: values.location.placeId || undefined,
      lat: values.location.lat,
      lng: values.location.lng,
      formattedAddress: values.location.formattedAddress || values.location.address.trim(),
    };

    try {
      const response: any =
        values.accountType === "admin"
          ? await registerAdmin({
              name: values.name.trim(),
              phone: normalizedPhone,
              email: values.email.trim().toLowerCase() || undefined,
              verificationToken,
              companyName: values.companyName.trim(),
              companyEmail: values.companyEmail.trim().toLowerCase() || undefined,
              location,
            })
          : await registerLearner({
              name: values.name.trim(),
              phone: normalizedPhone,
              email: values.email.trim().toLowerCase() || undefined,
              verificationToken,
              location,
            });

      const authenticatedRoute = getDefaultAuthenticatedRoute(
        stores.auth.user || { userType: response?.data?.userType, role: response?.data?.role }
      );

      openNotification({
        title: values.accountType === "admin" ? "Business workspace created" : "Learner account created",
        message: response?.message || (values.accountType === "admin" ? "Your company workspace is ready." : "Your learner account is ready."),
        type: "success",
        duration: 4000,
      });

      setTimeout(() => {
        window.location.href = redirectTarget || authenticatedRoute;
      }, 1500);
    } catch (error: any) {
      openNotification({ title: "Signup failed", message: error?.message || error?.error || "Unable to create your account.", type: "error" });
    }
  };

  const geocodePoint = async (point: { lat: number; lng: number }, setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void) => {
    if (!isLoaded || !(window as any).google?.maps) {
      setLocationBusy(false);
      setLocationStatus("Pin selected. Fill the address fields manually.");
      return;
    }
    setLocationBusy(true);
    setLocationStatus("Resolving address from map pin...");
    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ location: point }, (results: any[], status: string) => {
      setLocationBusy(false);
      if (status === "OK" && results?.[0]) {
        applyLocationToFormik(setFieldValue, buildLocationFromPlace(results[0], point));
        setLocationStatus("Address filled from the selected map point.");
      } else {
        setLocationStatus("Pin selected. Fill the address fields manually.");
      }
    });
  };

  const handlePlaceChanged = (setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void) => {
    const place = autocomplete?.getPlace?.();
    const geometryLocation = place?.geometry?.location;
    if (!geometryLocation) {
      setLocationStatus("Choose a suggestion from the search list.");
      return;
    }
    const point = { lat: geometryLocation.lat(), lng: geometryLocation.lng() };
    const location = buildLocationFromPlace(place, point);
    setSelectedPoint(point);
    setMapCenter(point);
    applyLocationToFormik(setFieldValue, location);
    setLocationStatus("Location details filled from Google Places.");
  };

  const detectCurrentLocation = (setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void) => {
    if (!navigator.geolocation) {
      openNotification({ title: "Location unavailable", message: "Your browser does not support current location detection.", type: "error" });
      return;
    }
    setLocationBusy(true);
    setLocationStatus("Requesting current location permission...");
    
    // Add a manual timeout to prevent infinite loading if the user ignores the prompt
    let timeoutFired = false;
    const fallbackTimeout = setTimeout(() => {
      timeoutFired = true;
      setLocationBusy(false);
      setLocationStatus("Permission prompt timed out. Please search or fill manually.");
    }, 6000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (timeoutFired) return;
        clearTimeout(fallbackTimeout);
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        setSelectedPoint(point);
        setMapCenter(point);
        setFieldValue("location.lat", point.lat);
        setFieldValue("location.lng", point.lng);
        await geocodePoint(point, setFieldValue);
      },
      () => {
        if (timeoutFired) return;
        clearTimeout(fallbackTimeout);
        setLocationBusy(false);
        setLocationStatus("Permission was blocked. Search or fill the location manually.");
        openNotification({ title: "Could not read current location", message: "Please allow location access or search for the address.", type: "error" });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const stepTitles: Record<Step, { eyebrow: string; title: string; sub: string }> = {
    phone: { eyebrow: "Step 1", title: "ACCOUNT SETUP", sub: "ENTER YOUR PHONE NUMBER" },
    otp: { eyebrow: "Step 2", title: "VERIFY PHONE", sub: `CODE SENT TO +91 ${phone}` },
    profile: { eyebrow: "About you", title: "YOUR DETAILS", sub: "PERSONAL INFORMATION" },
    company: { eyebrow: "Company", title: "WORKSPACE", sub: "COMPANY INFORMATION" },
    location: { eyebrow: "Location", title: "LOCATION", sub: "WHERE ARE YOU BASED?" },
    review: { eyebrow: "Almost done", title: "FINALIZE", sub: "REVIEW YOUR DETAILS" },
  };

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
      {(formik) => {
        const { values, errors, touched, setFieldValue, handleChange, handleBlur, isSubmitting } = formik;
        const isAdmin = values.accountType === "admin";
        const stepsForType: Step[] = isAdmin
          ? ["phone", "otp", "profile", "company", "location", "review"]
          : ["phone", "otp", "profile", "location", "review"];
        const currentIdx = stepsForType.indexOf(step);

        const next = async () => {
          let fieldsToValidate: string[] = [];
          if (step === "profile") fieldsToValidate = ["name", "email"];
          if (step === "company") fieldsToValidate = ["companyName", "companyEmail"];
          if (step === "location") fieldsToValidate = ["location.address", "location.city", "location.state", "location.country", "location.postalCode"];

          if (fieldsToValidate.length > 0) {
            const formErrors = await formik.validateForm();
            fieldsToValidate.forEach((field) => formik.setFieldTouched(field, true, false));
            if (fieldsToValidate.some((field) => getIn(formErrors, field))) return;
          }
          const nextStep = stepsForType[Math.min(currentIdx + 1, stepsForType.length - 1)];
          setStep(nextStep);
          
          if (nextStep === "location" && !values.location.city) {
            detectCurrentLocation(setFieldValue);
          }
        };
        const prev = () => setStep(stepsForType[Math.max(currentIdx - 1, 0)]);

        const { eyebrow, title, sub } = stepTitles[step];

        const renderStep = () => {
          switch (step) {
            case "phone":
              return (
                <div key="phone" className="space-y-7">
                  <AccountTypePicker value={values.accountType} onChange={(v) => setFieldValue("accountType", v)} />
                  <label className="block">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] ml-1 text-left text-black/50 dark:text-white/50 mb-2 block">
                      Phone number<span className="text-red-500 dark:text-red-400 ml-1">*</span>
                    </span>
                    <div className="flex items-center justify-start border-b-[1.5px] pb-1.5 transition-all duration-500 border-black/5 focus-within:border-primary dark:border-white/10 dark:focus-within:border-primary/50">
                      <span className="text-xl font-semibold mr-3 text-black/40 dark:text-white/20">+91</span>
                      <input
                        autoFocus
                        type="tel"
                        maxLength={10}
                        placeholder="0000000000"
                        value={values.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setPhone(val);
                          setFieldValue("phone", val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && phone) {
                            e.preventDefault();
                            sendOtp();
                          }
                        }}
                        className="bg-transparent border-none outline-none font-semibold text-2xl w-full text-left text-black/80 placeholder:text-black/20 dark:text-white dark:placeholder:text-white/20"
                      />
                    </div>
                  </label>
                  <PrimaryButton loading={busy} disabled={!phone} onClick={sendOtp}>
                    Send OTP <ArrowRight className="h-4 w-4" />
                  </PrimaryButton>
                </div>
              );
            case "otp":
              return (
                <div key="otp" className="space-y-5">
                  <div className="flex justify-between gap-2 mt-4">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(-1);
                          const newOtp = [...otp];
                          newOtp[i] = val;
                          setOtp(newOtp);
                          if (val && i < 5) otpRefs.current[i + 1]?.focus();
                          
                          const currentCode = newOtp.join("");
                          if (currentCode.length === 6) {
                            handleVerifyOtp(currentCode);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otp[i] && i > 0) {
                            otpRefs.current[i - 1]?.focus();
                          }
                          if (e.key === "Enter" && otp.join("").length === 6) {
                            handleVerifyOtp();
                          }
                        }}
                        maxLength={1}
                        className={cn(
                          "w-full aspect-[4/5] rounded-xl text-center font-mono text-xl font-bold outline-none transition-all",
                          "bg-black/5 border-transparent focus:border-primary text-black",
                          "dark:bg-black/40 dark:border-white/10 dark:text-white dark:focus:border-primary dark:focus:bg-primary/10"
                        )}
                      />
                    ))}
                  </div>
                  <PrimaryButton loading={busy} disabled={otp.join("").length !== 6} onClick={handleVerifyOtp}>
                    Verify <CheckCircle2 className="h-4 w-4" />
                  </PrimaryButton>
                  <div className="text-center text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
                    {resendIn > 0 ? (
                      <>RESEND IN {resendIn}S</>
                    ) : (
                      <button type="button" onClick={sendOtp} className="text-primary hover:brightness-110 transition-colors">
                        RESEND OTP
                      </button>
                    )}
                  </div>
                </div>
              );
            case "profile":
              return (
                <div key="profile" className="space-y-5">
                  <Field icon={User} name="name" label="Full name" placeholder="Ada Lovelace" value={values.name} onChange={handleChange} onBlur={handleBlur} error={touched.name ? errors.name : undefined} autoFocus required />
                  <Field icon={Mail} name="email" label="Email" type="email" placeholder="you@example.com" value={values.email} onChange={handleChange} onBlur={handleBlur} error={touched.email ? errors.email : undefined} />
                  <PrimaryButton loading={busy} onClick={next}>
                    Continue <ArrowRight className="h-4 w-4" />
                  </PrimaryButton>
                </div>
              );
            case "company":
              return (
                <div key="company" className="space-y-5">
                  <Field icon={Building2} name="companyName" label="Company name" placeholder="Acme Inc." value={values.companyName} onChange={handleChange} onBlur={handleBlur} error={touched.companyName ? errors.companyName : undefined} autoFocus required />
                  <Field icon={Mail} name="companyEmail" label="Company email" type="email" placeholder="team@acme.com" value={values.companyEmail} onChange={handleChange} onBlur={handleBlur} error={touched.companyEmail ? errors.companyEmail : undefined} />
                  <PrimaryButton loading={busy} onClick={next}>
                    Continue <ArrowRight className="h-4 w-4" />
                  </PrimaryButton>
                </div>
              );

            case "location":
              return (
                <div key="location" className="space-y-5">
                  <div className="flex flex-col items-center justify-center relative py-2 mt-0">
                    {/* Radar System */}
                    <div className="relative w-28 h-28 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 rounded-full border border-primary/10 animate-ping duration-[4s]" />
                      <div className="absolute inset-3 rounded-full border border-black/5 dark:border-white/5" />
                      <div className={cn(
                        "absolute inset-0 rounded-full border-2 border-transparent border-t-primary/40 animate-spin",
                        locationBusy ? "duration-700" : "duration-[3s]"
                      )} />
                      <div className={cn(
                        "relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-700",
                        values.location.city ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.3)]" : "border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5"
                      )}>
                        <MapPin className={cn(
                          "w-5 h-5 transition-all duration-700",
                          values.location.city ? "text-primary" : "text-black/20 dark:text-white/20"
                        )} />
                        {locationBusy && <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping" />}
                      </div>
                    </div>

                    {values.location.city && (
                      <div className="mt-4 text-center animate-in zoom-in slide-in-from-top-2 duration-700">
                        <h4 className="text-[12px] font-black mb-0.5 uppercase tracking-widest text-black dark:text-white">{values.location.city}, {values.location.country}</h4>
                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 max-w-[250px] truncate">{values.location.address}</p>
                      </div>
                    )}

                    {!values.location.city && !locationBusy && (
                      <div className="w-full mt-4 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-center text-black/40 dark:text-white/40 mb-2">Or enter manually</div>
                        <Field name="location.address" label="Address" placeholder="Street Address" value={values.location.address} onChange={handleChange} onBlur={handleBlur} error={getIn(touched, "location.address") ? getIn(errors, "location.address") : undefined} required />
                        <div className="grid grid-cols-2 gap-3">
                          <Field name="location.city" label="City" placeholder="City" value={values.location.city} onChange={handleChange} onBlur={handleBlur} error={getIn(touched, "location.city") ? getIn(errors, "location.city") : undefined} required />
                          <Field name="location.state" label="State" placeholder="State" value={values.location.state} onChange={handleChange} onBlur={handleBlur} error={getIn(touched, "location.state") ? getIn(errors, "location.state") : undefined} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field name="location.country" label="Country" placeholder="Country" value={values.location.country} onChange={handleChange} onBlur={handleBlur} error={getIn(touched, "location.country") ? getIn(errors, "location.country") : undefined} required />
                          <Field name="location.postalCode" label="Pincode" placeholder="Postal Code" value={values.location.postalCode} onChange={handleChange} onBlur={handleBlur} error={getIn(touched, "location.postalCode") ? getIn(errors, "location.postalCode") : undefined} required />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pb-2 mt-4">
                    <button
                      type="button"
                      onClick={() => detectCurrentLocation(setFieldValue)}
                      disabled={locationBusy}
                      className={cn(
                        "w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all",
                        locationBusy
                          ? "opacity-50 pointer-events-none bg-black/5 dark:bg-white/5 text-black dark:text-white"
                          : values.location.city
                            ? "bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                            : "bg-primary/10 text-primary dark:bg-white/5 dark:text-white hover:bg-primary/20 transition-colors"
                      )}
                    >
                      {locationBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : values.location.city ? "Re-Detect Signal" : "Detect Resonance"}
                    </button>

                    <div className={cn("transition-all duration-700", values.location.city || (!locationBusy && touched.location?.address) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 h-0 overflow-hidden pointer-events-none")}>
                      <PrimaryButton loading={busy} onClick={next} className="!mt-0">
                        Proceed to Review <ArrowRight className="h-4 w-4" />
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              );
            case "review":
              return (
                <div key="review" className="space-y-5">
                  <ReviewCard form={values} phone={normalizedPhone} />
                  <label className="flex items-center gap-3 mt-4 px-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-black/20 dark:border-white/20 text-primary focus:ring-primary focus:ring-offset-0 bg-transparent" checked={values.termsAccepted} onChange={(e) => setFieldValue("termsAccepted", e.target.checked)} />
                    <span className="text-[9px] font-bold text-black/60 dark:text-white/60 uppercase tracking-widest pt-[1px]">I agree to terms & conditions</span>
                  </label>
                  {touched.termsAccepted && errors.termsAccepted && <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest px-2">{errors.termsAccepted as string}</div>}

                  <PrimaryButton loading={isSubmitting || busy} disabled={isSubmitting || busy} onClick={() => formik.handleSubmit()}>
                    {isSubmitting || busy ? "Creating account..." : "Complete Registration"}
                  </PrimaryButton>
                </div>
              );
            default:
              return null;
          }
        };

        return (
          <Form noValidate onKeyDown={(e) => {
            // Prevent accidental form submission on Enter key (except for textareas or explicit submits)
            if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
              e.preventDefault();
            }
          }}>
            <AuthLayout>
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className={cn(
                  "w-full rounded-[40px] px-8 py-8 transition-all duration-1000 flex flex-col justify-center space-y-5",
                  "bg-white/60 border border-white/80 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur-3xl",
                  "ring-1 ring-black/5 dark:ring-white/10 inner-border inner-border-white/50",
                  "dark:bg-[#13072E]/40 dark:border-white/5 dark:backdrop-blur-[40px] dark:shadow-[0_40px_100px_rgba(139,92,246,0.15)] dark:inner-border-white/5"
                )}
              >
                <div className="flex items-center justify-between">
                  {currentIdx > 0 ? (
                    <button type="button" onClick={prev} className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-primary dark:text-white/40 dark:hover:text-primary transition-colors">
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>
                  ) : (
                    <a href="/" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-primary dark:text-white/40 dark:hover:text-primary transition-colors">
                      <ArrowLeft className="h-3.5 w-3.5" /> Home
                    </a>
                  )}
                  <StepDots total={stepsForType.length} current={currentIdx} />
                </div>

                <div className="text-center">
                  <p className="text-[15px] font-[900] uppercase tracking-widest text-black dark:text-white">
                    {title}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-2 text-black/50 dark:text-white/50">
                    {sub}
                  </p>
                </div>

                <div className="transition-all duration-300">
                  {renderStep()}
                </div>

                <div className="pt-4 border-t border-black/5 dark:border-white/10 text-center text-[10px] font-bold text-black/50 dark:text-white/50">
                  <NextLink href={redirectTarget ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : "/login"} className="uppercase tracking-widest hover:text-primary dark:hover:text-white transition-colors">
                    Already have an account? Sign in
                  </NextLink>
                </div>
              </motion.div>
            </AuthLayout>
          </Form>
        );
      }}
    </Formik>
  );
});

export default Register;

/* --- small building blocks --- */

function AccountTypePicker({ value, onChange }: { value: AccountType; onChange: (v: AccountType) => void }) {
  const items: Array<{ id: AccountType; label: string; sub: string; icon: typeof User }> = [
    { id: "learner", label: "Learner", sub: "Take courses", icon: GraduationCap },
    { id: "admin", label: "Admin", sub: "Manage a team", icon: Building2 },
  ];
  return (
    <div>
      <div className="flex relative bg-black/5 dark:bg-white/5 p-1 rounded-full items-center">
        {items.map((it) => {
          const active = value === it.id;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onChange(it.id)}
              className={cn(
                "flex-1 relative rounded-[2rem] py-3 text-center transition-all z-10 flex items-center justify-center gap-2",
              )}
            >
              {active && (
                <motion.div
                  layoutId="accountTypeBubble"
                  className="absolute inset-0 bg-white dark:bg-primary shadow-sm shadow-black/5 dark:shadow-primary/20 rounded-[2rem] z-[-1]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <it.icon className={cn("w-3.5 h-3.5 transition-colors duration-300", active ? "text-primary dark:text-white" : "text-black/50 dark:text-white/50")} />
              <div className={cn(
                "text-[10px] font-[900] uppercase tracking-widest transition-colors duration-300 pt-[1px]",
                active ? "text-primary dark:text-white" : "text-black/50 dark:text-white/50"
              )}>{it.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  icon: Icon,
  type = "text",
  autoFocus,
  required,
}: {
  name: string;
  label: string;
  value: string;
  onChange: any;
  onBlur: any;
  error?: string | any;
  placeholder?: string;
  icon?: typeof User;
  type?: string;
  autoFocus?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block mt-4">
      <span className="text-[9px] font-black uppercase tracking-[0.3em] ml-1 text-black/50 dark:text-white/50 mb-2 block">
        {label}{required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
      </span>
      <div className="flex items-center justify-start border-b-[1.5px] pb-1.5 transition-all duration-500 border-black/5 focus-within:border-primary dark:border-primary/30 dark:focus-within:border-primary">
        <input
          name={name}
          type={type}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="bg-transparent border-none outline-none font-semibold text-[1.1rem] w-full text-left text-black/80 placeholder:text-black/20 dark:text-white dark:placeholder:text-white/20"
        />
      </div>
      {error && <div className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-widest animate-in fade-in">{error}</div>}
    </label>
  );
}

function ReviewCard({ form, phone }: { form: SignupValues; phone: string }) {
  const truncate = (str: string, max = 30) => str.length > max ? str.substring(0, max) + "..." : str;

  const rows: Array<[string, string]> = [
    ["Account type", form.accountType === "admin" ? "Admin" : "Learner"],
    ["Name", form.name],
    ["Email", form.email],
    ["Phone", `+91 ${phone}`],
  ];
  if (form.accountType === "admin") {
    rows.push(
      ["Company", form.companyName],
      ["Company email", form.companyEmail],
    );
  }
  
  const locationString = form.location.formattedAddress 
    ? form.location.formattedAddress.replace(/^[A-Z0-9\+]{8,12},\s*/, "") 
    : [form.location.address, form.location.city, form.location.state].filter(Boolean).join(", ");
    
  if (locationString) {
    rows.push(["Location", locationString]);
  }
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-transparent p-4 space-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[100px_minmax(0,1fr)] gap-3 text-sm">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/40 dark:text-white/40 pt-0.5">{k}</div>
          <div className="font-semibold text-black dark:text-white break-words" title={v}>{v ? truncate(v, 30) : "—"}</div>
        </div>
      ))}
    </div>
  );
}

function PrimaryButton({
  children,
  loading,
  disabled,
  onClick,
  type = "button",
  className,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "w-full py-4 mt-8 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all",
        "bg-primary text-white shadow-[0_10px_20px_rgba(var(--primary),0.2)] hover:brightness-110",
        "dark:bg-primary dark:text-white dark:shadow-[0_10px_30px_rgba(237,56,85,0.3)] dark:hover:brightness-110",
        disabled || loading ? "opacity-50 pointer-events-none" : "opacity-100",
        className
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </motion.button>
  );
}
