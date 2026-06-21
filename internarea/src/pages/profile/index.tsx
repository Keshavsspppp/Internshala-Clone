import { selectuser } from "@/Feature/Userslice";
import { ExternalLink, Laptop, Mail, ShieldCheck, Smartphone, User, X, CreditCard } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { toast } from "react-toastify";
import { auth } from "@/firebase/firebase";

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
  resumeUrl?: string;
};

const ProfilePage = () => {
  const { t } = useTranslation("common");
  const user = useSelector(selectuser);
  const [securityProfile, setSecurityProfile] = useState<SecurityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [subscription, setSubscription] = useState<any>(null);
  const [isSubLoading, setIsSubLoading] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.email) return;
      try {
        setIsSubLoading(true);
        const token = await auth.currentUser?.getIdToken();
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/status`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          }
        );
        setSubscription(response.data);
      } catch (error) {
        console.error("Failed to fetch subscription status:", error);
      } finally {
        setIsSubLoading(false);
      }
    };
    fetchSubscription();
  }, [user]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgradePayment = async (amount: number) => {
    try {
      setIsPaying(true);
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error("Razorpay SDK failed to load. Please check your network connection.");
        return;
      }

      const token = await auth.currentUser?.getIdToken();
      const orderResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/create-order`,
        { amount },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const order = orderResponse.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_T3tbDnwaj6pkS2",
        amount: order.amount,
        currency: order.currency,
        name: "InternArea Subscription",
        description: `Upgrade to ${amount === 100 ? "Bronze" : amount === 300 ? "Silver" : "Gold"} Plan`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            toast.info("Verifying payment...");
            const verifyResponse = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email: user?.email,
                amount
              },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            if (verifyResponse.data.success) {
              toast.success("Subscription upgraded successfully!");
              setIsUpgradeModalOpen(false);
              const refreshSub = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/status`,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              setSubscription(refreshSub.data);
            }
          } catch (verifyError: any) {
            console.error(verifyError);
            toast.error(verifyError.response?.data?.message || "Payment verification failed.");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#2563eb"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (paymentError: any) {
      console.error(paymentError);
      toast.error(paymentError.response?.data?.message || "Failed to start payment.");
    } finally {
      setIsPaying(false);
    }
  };

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
                    {t("totalAttempts")}
                  </p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-5 text-center shadow-sm">
                  <span className="text-emerald-600 font-black text-3xl font-heading">
                    {summary.successfulLogins}
                  </span>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-2">
                    {t("successLogins")}
                  </p>
                </div>
                <div className="bg-red-50/50 border border-red-100/50 rounded-2xl p-5 text-center shadow-sm">
                  <span className="text-red-600 font-black text-3xl font-heading">
                    {summary.blockedAttempts}
                  </span>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-2">
                    {t("blockedLogins")}
                  </p>
                </div>
              </div>

              {/* Security Banner Info */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 flex items-start space-x-3.5">
                <div className="p-2 bg-blue-550/10 rounded-xl text-blue-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-sm font-extrabold text-slate-800 font-heading">{t("loginSecurityPolicy")}</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {t("lastActiveSession")}{" "}
                    <span className="text-slate-700 font-semibold">
                      {securityProfile?.lastSuccessfulLoginAt
                        ? new Date(securityProfile.lastSuccessfulLoginAt).toLocaleString()
                        : t("noSessionRecorded")}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed pt-1.5">
                    {t("securityPolicyDetails")}
                  </p>
                </div>
              </div>

              {/* My Plan Section */}
              <div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm shadow-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800 font-heading">
                    {t("myPlan")}
                  </h2>
                  {subscription && (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      subscription.planName === "Gold" 
                        ? "bg-amber-100 text-amber-800 border border-amber-200" 
                        : subscription.planName === "Silver"
                        ? "bg-slate-100 text-slate-800 border border-slate-200"
                        : subscription.planName === "Bronze"
                        ? "bg-orange-100 text-orange-850 border border-orange-200"
                        : "bg-blue-50 text-blue-700 border border-blue-100"
                    }`}>
                      {subscription.planName}
                    </span>
                  )}
                </div>

                {isSubLoading ? (
                  <p className="text-xs font-semibold text-slate-400 py-4 text-center">
                    Loading subscription details...
                  </p>
                ) : subscription ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          {t("applicationsUsed")}
                        </span>
                        <span className="text-slate-700 font-extrabold text-base">
                          {subscription.applicationsUsed} / {subscription.limit === null || subscription.limit === Infinity || subscription.limit === "Infinity" || (typeof subscription.limit === 'string' && subscription.limit.toLowerCase() === 'infinity') ? t("unlimited") : subscription.limit}
                        </span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          {t("expiresOn")}
                        </span>
                        <span className="text-slate-700 font-extrabold text-xs block truncate">
                          {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : t("unlimited")}
                        </span>
                      </div>
                    </div>

                    {subscription.planName === "Free" && (
                      <div className="mt-4 p-4 border border-blue-100 bg-blue-50/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Ready to boost your applications?</p>
                          <p className="text-[10px] text-slate-500 font-medium">Upgrade to premium and build resumes, post without limits, and more.</p>
                        </div>
                        <button
                          onClick={() => setIsUpgradeModalOpen(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap self-end sm:self-auto"
                        >
                          {t("upgradeNow")}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 py-4 text-center">
                    Unable to fetch subscription status.
                  </p>
                )}
              </div>

              {/* Login History */}
              <div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm shadow-slate-50">
                <h2 className="text-lg font-bold text-slate-800 mb-5 font-heading">
                  {t("securityLoginLogs")}
                </h2>
                {isLoading ? (
                  <p className="text-xs font-semibold text-slate-400 py-4 text-center">
                    {t("loadingLogs")}
                  </p>
                ) : securityProfile?.loginHistory?.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t("device")}
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t("ipAddress")}
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t("status")}
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t("attemptedOn").replace(":", "").trim()}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {securityProfile.loginHistory.map((item) => (
                          <tr key={item.attemptId} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="flex-shrink-0">
                                  {getDeviceIcon(item.deviceType)}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-700">
                                    {item.browser} on {item.operatingSystem}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                                    {item.deviceType}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-xs font-semibold text-slate-600">
                              {item.ipAddress || "Unavailable"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusClasses(
                                  item.status
                                )}`}
                              >
                                {item.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                              <div>{new Date(item.createdAt).toLocaleString()}</div>
                              {item.otpVerifiedAt && (
                                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 animate-fade-in">
                                  {t("otpVerified")} {new Date(item.otpVerifiedAt).toLocaleString()}
                                </div>
                              )}
                              {item.reason && (
                                <div className="text-[10px] text-rose-500 italic mt-0.5 max-w-xs truncate">
                                  {item.reason}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 py-6 text-center">
                    {t("noLogsRecorded")}
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap justify-center gap-4 pt-6">
                {securityProfile?.resumeUrl && (
                  <a
                    href={securityProfile.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-100 hover:bg-emerald-700 hover:shadow-lg transition-all duration-200"
                  >
                    {t("downloadResume")}
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                )}
                <Link
                  href="/userapplication"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-100 hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
                >
                  {t("viewApplications")}
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/public-space"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-slate-200 font-bold text-xs rounded-xl hover:bg-slate-50 shadow-sm transition-all duration-200"
                >
                  {t("openPublicSpace")}
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Plan Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative animate-slide-up">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 font-heading flex items-center gap-2">
              <CreditCard className="text-blue-600" />
              Upgrade Your Plan
            </h2>
            <p className="mt-2 text-xs text-slate-550 font-medium">
              Choose a tier that fits your applications and professional needs. Payments are accepted only between 10:00 AM and 11:00 AM IST.
            </p>

            <div className="mt-6 space-y-3.5">
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-700">Bronze Tier</h3>
                  <p className="text-[10px] text-slate-500 font-medium">3 applications per month</p>
                </div>
                <button
                  disabled={isPaying}
                  onClick={() => handleUpgradePayment(100)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  ₹100
                </button>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-700">Silver Tier</h3>
                  <p className="text-[10px] text-slate-500 font-medium">5 applications per month</p>
                </div>
                <button
                  disabled={isPaying}
                  onClick={() => handleUpgradePayment(300)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  ₹300
                </button>
              </div>

              <div className="border border-slate-150 rounded-xl p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-blue-100 flex items-center justify-between relative overflow-hidden">
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-bl uppercase tracking-wider">
                  Best Value
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-700 flex items-center gap-1">
                    Gold Tier ⭐
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Unlimited applications + Resume Builder</p>
                </div>
                <button
                  disabled={isPaying}
                  onClick={() => handleUpgradePayment(1000)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  ₹1000
                </button>
              </div>
            </div>
            
            <p className="mt-4 text-[9px] text-slate-400 text-center font-medium italic">
              Note: Current time is {new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })} IST.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

export default ProfilePage;

