import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function AwaitingVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResend = async () => {
    if (!email) {
      setError("Email address is missing");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await axios.post("/api/users/resend-verification", { email });
      setMessage("Verification email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification Required
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please verify your email address to continue
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <svg
                className="h-8 w-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Check Your Email
            </h3>

            <p className="text-gray-600 mb-4">
              We've sent a verification email to:
            </p>

            <p className="text-sm font-medium text-gray-900 mb-6">
              {email || "your email address"}
            </p>

            <p className="text-sm text-gray-500 mb-6">
              Click the verification link in the email to activate your account.
              If you don't see the email, check your spam folder.
            </p>

            {message && (
              <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 text-sm">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#667eea] hover:bg-[#5563d6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#667eea] disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {loading ? "Sending..." : "Resend Verification Email"}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#667eea]"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
