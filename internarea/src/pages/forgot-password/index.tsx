import axios from "axios";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { Mail, Phone, RefreshCcw } from "lucide-react";
import { toast } from "react-toastify";

type ResetMethod = "email" | "phone";

const ForgotPasswordPage = () => {
  const [resetMethod, setResetMethod] = useState<ResetMethod>("email");
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const placeholder = useMemo(() => {
    return resetMethod === "email"
      ? "Enter your registered email"
      : "Enter your registered phone number";
  }, [resetMethod]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!identifier.trim()) {
      toast.error("Please enter your registered email or phone number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setIsSuccess(false);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/forgot-password`,
        {
          identifier: identifier.trim(),
        }
      );

      setIsSuccess(true);
      toast.success(response.data.message || "Password reset successful.");
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Unable to reset the password.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <RefreshCcw className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Reset your password using your registered email or phone number.
            This option can be used only once per day.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setResetMethod("email")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              resetMethod === "email"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
          <button
            type="button"
            onClick={() => setResetMethod("phone")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              resetMethod === "phone"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <Phone className="h-4 w-4" />
            Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              {resetMethod === "email" ? "Registered email" : "Registered phone number"}
            </label>
            <input
              id="identifier"
              type={resetMethod === "email" ? "email" : "tel"}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Resetting password..." : "Generate new password"}
          </button>
        </form>

        {isSuccess ? (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm font-medium text-green-800">
              Password Reset Successful
            </p>
            <p className="mt-2 text-xs text-green-700">
              Your new temporary password has been sent to your registered email.
              Please check your inbox.
            </p>
          </div>
        ) : null}

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link href="/adminlogin" className="font-medium text-blue-600 hover:text-blue-700">
            Back to admin login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
