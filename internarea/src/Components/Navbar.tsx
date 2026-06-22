import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth, provider } from "../firebase/firebase";
import { Search, Menu, X } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { login, logout, selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { getLoginEnvironment } from "@/utils/loginEnvironment";
import { useTranslation } from "next-i18next/pages";
import {
  clearPendingOtpSession,
  clearVerifiedSession,
  getPendingOtpSession,
  PendingOtpSession,
  savePendingOtpSession,
  saveVerifiedSession,
} from "@/utils/securitySession";

const Navbar = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectuser);
  const { t } = useTranslation("common");
  const currentLocale = router.locale || "en";

  const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "hi", label: "हिन्दी" },
    { code: "pt", label: "Português" },
    { code: "zh", label: "中文" },
    { code: "fr", label: "Français" },
  ];

  const [otpCode, setOtpCode] = useState("");
  const [pendingOtpSession, setPendingOtpSession] =
    useState<PendingOtpSession | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [pendingLangChange, setPendingLangChange] = useState<{
    targetLocale: string;
    otpCode: string;
    email: string;
  } | null>(null);
  const [isSendingLangOtp, setIsSendingLangOtp] = useState(false);
  const [isVerifyingLangOtp, setIsVerifyingLangOtp] = useState(false);

  const handleLocaleChange = async (targetLocale: string) => {
    if (targetLocale === "fr") {
      if (!user || !user.email) {
        toast.error("Please sign in first to switch to French.");
        return;
      }

      try {
        setIsSendingLangOtp(true);
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/security/send-lang-otp`,
          { email: user.email }
        );

        setPendingLangChange({
          targetLocale,
          otpCode: "",
          email: user.email,
        });

        if (response.data.developmentOtpPreview) {
          toast.info(`Development OTP Preview: ${response.data.developmentOtpPreview}`);
        } else {
          toast.success("OTP sent to your registered email.");
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to send OTP.");
      } finally {
        setIsSendingLangOtp(false);
      }
    } else {
      router.push(router.pathname, router.asPath, { locale: targetLocale });
    }
  };

  const handleVerifyLangOtp = async () => {
    if (!pendingLangChange || !pendingLangChange.otpCode.trim()) {
      toast.error("Please enter the OTP code.");
      return;
    }

    try {
      setIsVerifyingLangOtp(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/security/verify-lang-otp`,
        {
          email: pendingLangChange.email,
          otp: pendingLangChange.otpCode.trim(),
        }
      );

      toast.success("Verification successful!");
      const target = pendingLangChange.targetLocale;
      setPendingLangChange(null);
      router.push(router.pathname, router.asPath, { locale: target });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setIsVerifyingLangOtp(false);
    }
  };

  useEffect(() => {
    setPendingOtpSession(getPendingOtpSession());
  }, []);

  const syncVerifiedUser = (authUser: any) => {
    const verifiedUser = {
      uid: authUser.uid,
      photo: authUser.photoURL,
      name: authUser.displayName,
      email: authUser.email,
      phoneNumber: authUser.phoneNumber,
    };

    saveVerifiedSession(verifiedUser);
    clearPendingOtpSession();
    setPendingOtpSession(null);
    setOtpCode("");
    dispatch(login(verifiedUser));
  };

  const handlelogin = async () => {
    try {
      setIsSigningIn(true);

      clearVerifiedSession();
      clearPendingOtpSession();

      const signInResult = await signInWithPopup(auth, provider);
      const authUser = signInResult.user;

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/security/login-attempt`,
        {
          user: {
            uid: authUser.uid,
            photo: authUser.photoURL,
            name: authUser.displayName,
            email: authUser.email,
            phoneNumber: authUser.phoneNumber,
          },
          loginEnvironment: getLoginEnvironment(),
        }
      );

      if (response.data.status === "otp_required") {
        const nextPendingSession: PendingOtpSession = {
          attemptId: response.data.attemptId,
          uid: authUser.uid,
          photo: authUser.photoURL || "",
          name: authUser.displayName || "InternArea User",
          email: authUser.email || "",
          phoneNumber: authUser.phoneNumber,
          expiresAt: response.data.expiresAt,
          developmentOtpPreview: response.data.developmentOtpPreview,
        };

        savePendingOtpSession(nextPendingSession);
        setPendingOtpSession(nextPendingSession);

        if (response.data.developmentOtpPreview) {
          toast.info(
            `Development OTP preview: ${response.data.developmentOtpPreview}`
          );
        } else {
          toast.info("OTP sent to your registered email.");
        }

        return;
      }

      syncVerifiedUser(authUser);
      toast.success("Logged in successfully.");
    } catch (error) {
      console.error(error);
      clearVerifiedSession();
      clearPendingOtpSession();
      setPendingOtpSession(null);
      await signOut(auth).catch(() => null);
      toast.error(
        (error as any)?.response?.data?.message || "Login failed."
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!pendingOtpSession?.attemptId || !otpCode.trim()) {
      toast.error("Enter the OTP sent to your email.");
      return;
    }

    if (!auth.currentUser) {
      toast.error("Google session expired. Please sign in again.");
      clearPendingOtpSession();
      setPendingOtpSession(null);
      setOtpCode("");
      return;
    }

    try {
      setIsVerifyingOtp(true);

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/security/verify-otp`, {
        user: {
          uid: pendingOtpSession.uid,
          photo: pendingOtpSession.photo,
          name: pendingOtpSession.name,
          email: pendingOtpSession.email,
          phoneNumber: pendingOtpSession.phoneNumber,
        },
        attemptId: pendingOtpSession.attemptId,
        otp: otpCode.trim(),
      });

      syncVerifiedUser(auth.currentUser);
      toast.success("OTP verified successfully.");
    } catch (error) {
      console.error(error);
      toast.error(
        (error as any)?.response?.data?.message || "Unable to verify OTP."
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCancelPendingLogin = async () => {
    clearPendingOtpSession();
    clearVerifiedSession();
    setPendingOtpSession(null);
    setOtpCode("");
    dispatch(logout());
    await signOut(auth).catch(() => null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
    }
  };

  const handlelogout = async () => {
    clearVerifiedSession();
    clearPendingOtpSession();
    setPendingOtpSession(null);
    setOtpCode("");
    dispatch(logout());
    await signOut(auth);
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
    }
  };

  return (
    <div className="relative">
      {pendingOtpSession ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("verifyChrome")}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter the OTP sent to `{pendingOtpSession.email}` to complete this
              login.
            </p>
            {pendingOtpSession.expiresAt ? (
              <p className="mt-2 text-xs text-gray-500">
                OTP expires at {new Date(pendingOtpSession.expiresAt).toLocaleString()}.
              </p>
            ) : null}
            <input
              type="text"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
              placeholder={t("enter6DigitOtp")}
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                onClick={handleCancelPendingLogin}
                disabled={isVerifyingOtp}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingLangChange ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("verifyFrench")}
            </h2>
            <p className="mt-2 text-sm text-gray-650">
              {t("otpSent")}
            </p>
            <input
              type="text"
              value={pendingLangChange.otpCode}
              onChange={(e) => {
                const text = e.target.value;
                setPendingLangChange(prev => prev ? { ...prev, otpCode: text } : null);
              }}
              placeholder={t("enter6DigitOtp")}
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-center tracking-widest text-lg font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleVerifyLangOtp}
                disabled={isVerifyingLangOtp}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isVerifyingLangOtp ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                onClick={() => setPendingLangChange(null)}
                disabled={isVerifyingLangOtp}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600 transition-transform hover:scale-[1.02]">
                <img src={"/logo.png"} alt="InternArea Logo" className="h-12 object-contain" />
              </a>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href={"/internship"}
                className={`relative py-2 text-sm font-medium transition-colors duration-200 hover:text-blue-600 ${
                  router.pathname === "/internship" ? "text-blue-600 font-semibold" : "text-slate-600"
                }`}
              >
                <span>{t("internships")}</span>
                {router.pathname === "/internship" && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-full animate-fade-in" />
                )}
              </Link>

              <Link 
                href={"/job"}
                className={`relative py-2 text-sm font-medium transition-colors duration-200 hover:text-blue-600 ${
                  router.pathname === "/job" ? "text-blue-600 font-semibold" : "text-slate-600"
                }`}
              >
                <span>{t("jobs")}</span>
                {router.pathname === "/job" && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-full animate-fade-in" />
                )}
              </Link>

              <Link 
                href={"/public-space"}
                className={`relative py-2 text-sm font-medium transition-colors duration-200 hover:text-blue-600 ${
                  router.pathname === "/public-space" ? "text-blue-600 font-semibold" : "text-slate-600"
                }`}
              >
                <span>{t("publicSpace")}</span>
                {router.pathname === "/public-space" && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-full animate-fade-in" />
                )}
              </Link>

              {user && (
                <Link 
                  href={"/resume"}
                  className={`relative py-2 text-sm font-medium transition-colors duration-200 hover:text-blue-600 ${
                    router.pathname === "/resume" ? "text-blue-600 font-semibold" : "text-slate-600"
                  }`}
                >
                  <span>{t("resumeBuilder")}</span>
                  {router.pathname === "/resume" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-full animate-fade-in" />
                  )}
                </Link>
              )}

              {/* Modernized Search Input */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  className="ml-2 bg-transparent text-slate-800 focus:outline-none text-xs w-40"
                />
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <select
                value={currentLocale}
                onChange={(e) => handleLocaleChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-700 cursor-pointer hover:border-slate-300 transition-all duration-200"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link 
                    href={"/profile"}
                    className="group relative flex items-center p-0.5 rounded-full border border-slate-200 hover:border-blue-500 transition-colors"
                  >
                    <img
                      src={user.photo}
                      alt={user.name || "User profile"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {t("profile")}
                    </span>
                  </Link>
                  <button
                    className="px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-full transition-colors border border-rose-100"
                    onClick={handlelogout}
                  >
                    {t("logout")}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlelogin}
                    disabled={isSigningIn}
                    className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/10 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-slate-700">
                      {isSigningIn ? "Signing in..." : t("loginWithGoogle")}
                    </span>
                  </button>
                  <Link
                    href="/adminlogin"
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    {t("admin")}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden ml-1">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="block h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="block h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100">
            <div className="px-4 pt-2 pb-6 space-y-4">
              <Link 
                href={"/internship"}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-base font-semibold transition-colors ${
                  router.pathname === "/internship" ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("internships")}
              </Link>
              <Link 
                href={"/job"}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-base font-semibold transition-colors ${
                  router.pathname === "/job" ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("jobs")}
              </Link>
              <Link 
                href={"/public-space"}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-base font-semibold transition-colors ${
                  router.pathname === "/public-space" ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("publicSpace")}
              </Link>
              {user && (
                <Link 
                  href={"/resume"}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-xl text-base font-semibold transition-colors ${
                    router.pathname === "/resume" ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t("resumeBuilder")}
                </Link>
              )}
              
              {/* Search in mobile menu */}
              <div className="pt-2">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    className="ml-2 bg-transparent text-slate-800 focus:outline-none text-sm w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
