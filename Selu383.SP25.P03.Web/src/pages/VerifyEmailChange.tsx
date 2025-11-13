import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const VerifyEmailChange: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmailChange = async () => {
      const token = searchParams.get("token");
      const newEmail = searchParams.get("newEmail");

      if (!token || !newEmail) {
        setStatus("error");
        setMessage("Invalid verification link. Please try requesting the email change again.");
        return;
      }

      try {
        await axios.post("/api/users/verify-email-change", {
          token: token
        });
        
        setStatus("success");
        setMessage(`Your email has been successfully updated to ${decodeURIComponent(newEmail)}! You can now close this page or continue using the application.`);
        
      } catch (error: any) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Failed to verify email change. The link may have expired.");
      }
    };

    verifyEmailChange();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Verify Email Change</h1>
        
        {status === "loading" && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your email change...</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 mb-4">{message}</p>
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => navigate("/")}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Go to Home
              </button>
              <button
                onClick={() => navigate("/editcontact")}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                User Settings
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{message}</p>
            <button
              onClick={() => navigate("/editcontact")}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Back to User Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailChange;