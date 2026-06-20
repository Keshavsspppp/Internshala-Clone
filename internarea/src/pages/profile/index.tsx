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

const index = () => {
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
      return "bg-red-100 text-red-700";
    }

    if (status === "verified") {
      return "bg-green-100 text-green-700";
    }

    if (status === "otp_required") {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              {user?.photo ? (
                <img
                  src={user?.photo}
                  alt={user?.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-16 pb-8 px-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <div className="mt-2 flex items-center justify-center text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <span className="text-blue-600 font-semibold text-2xl">
                    {summary.totalAttempts}
                  </span>
                  <p className="text-blue-600 text-sm mt-1">
                    Total Login Attempts
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <span className="text-green-600 font-semibold text-2xl">
                    {summary.successfulLogins}
                  </span>
                  <p className="text-green-600 text-sm mt-1">
                    Successful Logins
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <span className="text-red-600 font-semibold text-2xl">
                    {summary.blockedAttempts}
                  </span>
                  <p className="text-red-600 text-sm mt-1">
                    Blocked Attempts
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-gray-900">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Login Security Summary</h2>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Last successful login:{" "}
                  {securityProfile?.lastSuccessfulLoginAt
                    ? new Date(securityProfile.lastSuccessfulLoginAt).toLocaleString()
                    : "No verified login recorded yet."}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Chrome logins require OTP verification, and mobile logins are
                  allowed only between 10:00 AM and 1:00 PM.
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-gray-100 p-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  Login History
                </h2>
                {isLoading ? (
                  <p className="mt-4 text-sm text-gray-500">
                    Loading login history...
                  </p>
                ) : securityProfile?.loginHistory?.length ? (
                  <div className="mt-4 space-y-4">
                    {securityProfile.loginHistory.map((item) => (
                      <div
                        key={item.attemptId}
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(item.deviceType)}
                              <span className="font-medium text-gray-900">
                                {item.browser} on {item.operatingSystem}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              {item.deviceType.toUpperCase()} | IP: {item.ipAddress || "Unavailable"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusClasses(
                              item.status
                            )}`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-600">
                          Attempted at {new Date(item.createdAt).toLocaleString()}
                        </p>
                        {item.otpVerifiedAt ? (
                          <p className="mt-1 text-sm text-gray-600">
                            OTP verified at{" "}
                            {new Date(item.otpVerifiedAt).toLocaleString()}
                          </p>
                        ) : null}
                        {item.reason ? (
                          <p className="mt-2 text-sm text-gray-700">{item.reason}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">
                    No login history is available yet.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link
                  href="/userapplication"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  View Applications
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/public-space"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-blue-200 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200"
                >
                  Open Public Space
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;
