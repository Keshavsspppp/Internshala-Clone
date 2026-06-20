import React, { useEffect, useState } from "react";
import Link from "next/link";
import { auth, provider } from "../firebase/firebase";
import { Search } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { login, logout, selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { getLoginEnvironment } from "@/utils/loginEnvironment";
import {
  clearPendingOtpSession,
  clearVerifiedSession,
  getPendingOtpSession,
  PendingOtpSession,
  savePendingOtpSession,
  saveVerifiedSession,
} from "@/utils/securitySession";

const Navbar = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectuser);
  const [otpCode, setOtpCode] = useState("");
  const [pendingOtpSession, setPendingOtpSession] =
    useState<PendingOtpSession | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

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

      if (auth.currentUser) {
        await signOut(auth);
      }

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
  };

  const handlelogout = async () => {
    clearVerifiedSession();
    clearPendingOtpSession();
    setPendingOtpSession(null);
    setOtpCode("");
    dispatch(logout());
    await signOut(auth);
  };

  return (
    <div className="relative">
      {pendingOtpSession ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              Verify Chrome Login
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
              placeholder="Enter 6-digit OTP"
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

      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="text-xl font-bold text-blue-600">
                <img src={"/logo.png"} alt="" className="h-16" />
              </a>
            </div>
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/internship"}>
                  <span>Internships</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/job"}>
                  <span>Jobs</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/public-space"}>
                  <span>Public Space</span>
                </Link>
              </button>
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  className="ml-2 bg-transparent focus:outline-none text-sm w-48"
                />
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative flex">
                  <button className="flex items-center space-x-2">
                    {" "}
                    <Link href={"/profile"}>
                      <img
                        src={user.photo}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    </Link>
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2  text-gray-700  hover:bg-gray-200 rounded-lg"
                    onClick={handlelogout}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handlelogin}
                    disabled={isSigningIn}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-center space-x-2 hover:bg-gray-50 "
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                    <span className="text-gray-700">
                      {isSigningIn ? "Signing in..." : "Continue with google"}
                    </span>
                  </button>
                  <a
                    href="/adminlogin"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Admin
                  </a>
                </>
              )}
            </div>
          </div>{" "}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
