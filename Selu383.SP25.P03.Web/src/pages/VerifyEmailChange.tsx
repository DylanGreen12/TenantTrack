import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams} from "react-router-dom";

const VerifyEmailChange: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingLocalStorage, setIsUpdatingLocalStorage] = useState(false);

  useEffect(() => {
    const verifyEmailChange = async () => {
      const token = searchParams.get("token");
      const emailFromUrl = searchParams.get("newEmail");

      if (!token || !emailFromUrl) {
        setStatus("error");
        setMessage("Invalid verification link. Please try requesting the email change again.");
        return;
      }

      const decodedEmail = decodeURIComponent(emailFromUrl);
      setNewEmail(decodedEmail);

      try {
        // Using the SMTP backend endpoint
        await axios.post("/api/users/verify-email-change", {
          token: token
        });
        
        setStatus("success");
        setMessage(`Your email has been successfully updated to ${decodedEmail}!`);
        
        // Update localStorage with new email
        try {
          setIsUpdatingLocalStorage(true);
          const currentUserStr = localStorage.getItem('currentUser');
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const updatedUser = {
              ...currentUser,
              email: decodedEmail
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            console.log("Updated localStorage email to:", decodedEmail);
          }
        } catch (storageError) {
          console.warn("Could not update localStorage:", storageError);
        } finally {
          setIsUpdatingLocalStorage(false);
        }
        
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
  }, [searchParams]);

  // Function to navigate home with user data preserved
  const goToHome = () => {
    // Create a fresh copy of user data to ensure it's valid
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const user = JSON.parse(currentUserStr);
        // Ensure we have all required fields
        if (!user.id || !user.userName) {
          console.warn("Invalid user data in localStorage, clearing...");
          localStorage.removeItem('currentUser');
        }
      }
    } catch (error) {
      console.error("Error validating user data:", error);
      localStorage.removeItem('currentUser');
    }
    
    // Use window.location instead of navigate to avoid React Router state issues
    window.location.href = "/";
  };

  // Function to go to settings with updated email
  const goToSettings = () => {
    // Use window.location to ensure a clean navigation
    window.location.href = "/editcontact";
  };

  // Function to login again if needed
  const handleLoginAgain = () => {
    localStorage.removeItem('currentUser');
    window.location.href = "/login";
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
            
            {isUpdatingLocalStorage ? (
              <div className="mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Updating your session...</p>
              </div>
            ) : (
              <>
                <p className="text-green-600 mb-2">
                  Your email has been successfully updated to <strong>{newEmail}</strong>!
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Your email has been updated in the system and your session has been refreshed.
                </p>
              </>
            )}
            
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={goToHome}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                disabled={isUpdatingLocalStorage}
              >
                Go to Home Page
              </button>
              <button
                onClick={goToSettings}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                disabled={isUpdatingLocalStorage}
              >
                Go to User Settings
              </button>
              <div className="border-t pt-4 mt-2">
                <p className="text-xs text-gray-400 mb-2">Having issues?</p>
                <button
                  onClick={handleLoginAgain}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors text-sm w-full"
                >
                  Log in again with new email
                </button>
              </div>
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
                onClick={() => window.location.href = "/editcontact"}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Back to User Settings
              </button>
              <button
                onClick={() => window.location.href = "/login"}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors text-sm"
              >
                Go to Login Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailChange;