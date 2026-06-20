import { selectuser } from "@/Feature/Userslice";
import { ExternalLink, Laptop, Mail, ShieldCheck, Smartphone, User } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

type LoginHistoryItem = {
  attemptId: string;
  browser: string;
  operatingSystem: string;
  deviceType: "desktop" | "laptop" | "mobile";
  ipAddress: string;
  status: "allowed" | "otp_required" | "verified" | "blocked";
  reason: string;
  createdAt: string;
  otpVerifiedAt?: string | null;
};

type SecurityProfile = {
  lastSuccessfulLoginAt?: string | null;
  summary: {
    totalAttempts: number;
    successfulLogins: number;
    blockedAttempts: number;
  };
  loginHistory: LoginHistoryItem[];
};

const ProfilePage = () => {
  const user = useSelector(selectuser);
  const [securityProfile, setSecurityProfile] = useState<SecurityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSecurityProfile = async () => {
      if (!user?.email || !user?.uid) {
        setSecurityProfile(null);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/security/profile`,
          {
            params: {
              uid: user.uid,
              email: user.email,
            },
          }
        );
        setSecurityProfile(response.data);
      } catch (error) {
        console.error(error);
        setSecurityProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSecurityProfile();
  }, [user?.email, user?.uid]);

  const summary = useMemo(
    () =>
      securityProfile?.summary || {
        totalAttempts: 0,
        successfulLogins: 0,
        blockedAttempts: 0,
      },
    [securityProfile]
  );

  const getDeviceIcon = (deviceType: LoginHistoryItem["deviceType"]) => {
    if (deviceType === "mobile") {
      return <Smartphone className="h-4 w-4 text-blue-500" />;
    }

    return <Laptop className="h-4 w-4 text-blue-500" />;
  };

  const getStatusClasses = (status: LoginHistoryItem["status"]) => {
    if (status === "blocked") {
      return "bg-red-50 text-red-650 border border-red-100";
    }

    if (status === "verified") {
      return "bg-emerald-50 text-emerald-650 border border-emerald-100";
    }

    if (status === "otp_required") {
      return "bg-amber-50 text-amber-650 border border-amber-100";
    }

    return "bg-blue-50 text-blue-655 border border-blue-100";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 animate-slide-up">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-40 bg-gradient-to-r from-blue-600 to-indigo-650">
            {/* Overlay grid design pattern */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
            <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2">
              {user?.photo ? (
                <img
                  src={user?.photo}
                  alt={user?.name}
                  className="w-28 h-28 rounded-full border-4 border-white shadow-xl object-cover"
                />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center">
                  <User className="h-12 w-12 text-slate-400" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-20 pb-10 px-6 sm:px-8">
            <div className="text-center mb-10">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-heading tracking-tight">{user?.name}</h1>
              <div className="mt-2.5 flex items-center justify-center text-slate-450 text-xs sm:text-sm font-medium bg-slate-50 w-fit mx-auto px-3.5 py-1.5 rounded-full border border-slate-100">
                <Mail className="h-4 w-4 mr-2 text-slate-400" />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-5 text-center shadow-sm">
                  <span className="text-blue-600 font-black text-3xl font-heading">
                    {summary.totalAttempts}
                  </span>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-2">
                    Total Attempts
                  </p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-5 text-center shadow-sm">
                  <span className="text-emerald-600 font-black text-3xl font-heading">
                    {summary.successfulLogins}
                  </span>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-2">
                    Success Logins
                  </p>
                </div>
                <div className="bg-red-50/50 border border-red-100/50 rounded-2xl p-5 text-center shadow-sm">
                  <span className="text-red-600 font-black text-3xl font-heading">
                    {summary.blockedAttempts}
                  </span>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-2">
                    Blocked Logins
                  </p>
                </div>
              </div>

              {/* Security Banner Info */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 flex items-start space-x-3.5">
                <div className="p-2 bg-blue-550/10 rounded-xl text-blue-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-sm font-extrabold text-slate-800 font-heading">Login Security Policy</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Last active session verified at:{" "}
                    <span className="text-slate-700 font-semibold">
                      {securityProfile?.lastSuccessfulLoginAt
                        ? new Date(securityProfile.lastSuccessfulLoginAt).toLocaleString()
                        : "No session recorded."}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed pt-1.5">
                    For enhanced protection, Chrome log-ins require OTP validation, and mobile log-ins are allowed only between 10:00 AM and 1:00 PM.
                  </p>
                </div>
              </div>

              {/* Login History */}
              <div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm shadow-slate-50">
                <h2 className="text-lg font-bold text-slate-800 mb-5 font-heading">
                  Security Login Logs
                </h2>
                {isLoading ? (
                  <p className="text-xs font-semibold text-slate-400 py-4 text-center">
                    Loading login logs history...
                  </p>
                ) : securityProfile?.loginHistory?.length ? (
                  <div className="space-y-4">
                    {securityProfile.loginHistory.map((item) => (
                      <div
                        key={item.attemptId}
                        className="rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-md hover:shadow-slate-50 transition-all duration-200"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(item.deviceType)}
                              <span className="font-bold text-slate-700 text-sm">
                                {item.browser} on {item.operatingSystem}
                              </span>
                            </div>
                            <p className="mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Device: {item.deviceType} | IP: {item.ipAddress || "Unavailable"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusClasses(
                              item.status
                            )}`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-50 flex flex-col gap-1.5 text-xs text-slate-500 font-medium">
                          <p>
                            Attempted on: <span className="text-slate-650 font-semibold">{new Date(item.createdAt).toLocaleString()}</span>
                          </p>
                          {item.otpVerifiedAt && (
                            <p className="text-emerald-600 font-semibold bg-emerald-50/50 w-fit px-2 py-0.5 rounded border border-emerald-50">
                              OTP verified: {new Date(item.otpVerifiedAt).toLocaleString()}
                            </p>
                          )}
                          {item.reason && (
                            <p className="mt-1.5 p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 italic">
                              Note: {item.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 py-6 text-center">
                    No login logs recorded yet.
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap justify-center gap-4 pt-6">
                <Link
                  href="/userapplication"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-100 hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
                >
                  View Applications
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/public-space"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-slate-200 font-bold text-xs rounded-xl hover:bg-slate-50 shadow-sm transition-all duration-200"
                >
                  Open Public Space
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
