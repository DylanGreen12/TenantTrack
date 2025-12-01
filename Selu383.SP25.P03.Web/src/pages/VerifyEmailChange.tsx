import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const VerifyEmailChange: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [redirectTimer, setRedirectTimer] = useState(5); // Countdown timer

  useEffect(() => {
    let timer: number;
    
    if (status === "success") {
      // Start countdown for redirect
      timer = window.setInterval(() => {
        setRedirectTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Force a hard refresh to ensure sidebar shows updated email
            window.location.href = "/";
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status, navigate]);

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
        // Using the SMTP backend endpoint
        await axios.post("/api/users/verify-email-change", {
          token: token
        });
        
        setStatus("success");
        setMessage(`Your email has been successfully updated to ${decodeURIComponent(newEmail)}! You will be redirected in ${redirectTimer} seconds...`);
        
        // Clear localStorage to force re-fetch of user data
        localStorage.removeItem('currentUser');
        
      } catch (error: any) {
        console.error("Email change verification error:", error);
        setStatus("error");
        if (error.response?.status === 400) {
          setMessage(error.response.data || "Invalid or expired verification token. Please request a new email change.");
        } else if (error.response?.status === 404) {
          setMessage("Invalid verification token. Please request a new email change.");
        } else {
          setMessage("Failed to verify email change. Please try again later.");
        }
      }
    };

    verifyEmailChange();
  }, [searchParams, navigate]);

  // Function to force refresh the app
  const forceRefreshApp = () => {
    // Clear all user data from localStorage
    localStorage.removeItem('currentUser');
    // Force a full page reload to refresh all components
    window.location.href = "/";
  };

  const handleGoToSettings = () => {
    // Clear localStorage and navigate to settings
    localStorage.removeItem('currentUser');
    navigate("/editcontact");
    // Force a refresh after navigation
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

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
            <p className="text-sm text-gray-500 mb-4">
              Redirecting in {redirectTimer} seconds...
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={forceRefreshApp}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Go to Home Now
              </button>
              <button
                onClick={handleGoToSettings}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                User Settings
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors text-sm"
              >
                ↻ Refresh Page
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
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGoToSettings}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Back to User Settings
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors text-sm"
              >
                ↻ Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailChange;