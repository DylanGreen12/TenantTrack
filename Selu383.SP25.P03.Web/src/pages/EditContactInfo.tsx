import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../models/UserDto";

interface EditContactInfoProps {
  currentUser?: UserDto;
  onUserUpdate?: (updatedUser: UserDto) => void;
}

interface UpdateContactInfoDto {
  phone?: string;
}

interface RequestEmailChangeDto {
  newEmail: string;
}

interface RequestPasswordChangeDto {
  currentPassword: string;
  newPassword: string;
}

// PasswordVisibilityToggle component
const PasswordVisibilityToggle: React.FC<{
  isVisible: boolean;
  onToggle: () => void;
}> = ({ isVisible, onToggle }) => (
  <button
    type="button"
    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
    onClick={onToggle}
  >
    {isVisible ? (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ) : (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )}
  </button>
);

const EditContactInfo: React.FC<EditContactInfoProps> = ({ currentUser, onUserUpdate }) => {
  const [contactData, setContactData] = useState<UpdateContactInfoDto>({
    phone: ""
  });
  const [emailData, setEmailData] = useState<RequestEmailChangeDto>({
    newEmail: ""
  });
  const [passwordData, setPasswordData] = useState<RequestPasswordChangeDto>({
    currentPassword: "",
    newPassword: ""
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [activeTab, setActiveTab] = useState<"contact" | "email" | "password">("contact");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setContactData({
        phone: currentUser.phone || ""
      });
      setEmailData({
        newEmail: currentUser.email || ""
      });
    }
  }, [currentUser]);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEmailData({
      newEmail: value
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Phone number can be updated immediately
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to update contact information");
      setMessage("Please log in to update contact information.");
      setShowMessage(true);
      return;
    }

    if (contactData.phone === currentUser.phone) {
      setError("No changes detected");
      setMessage("No changes were made to your phone number.");
      setShowMessage(true);
      return;
    }

    setLoading(true);
    setError("");
    setShowMessage(false);

    try {
      const response = await axios.put(`/api/users/${currentUser.id}/contact`, {
        phone: contactData.phone
      });
      
      setMessage("Phone number updated successfully!");
      setShowMessage(true);

      if (onUserUpdate) {
        onUserUpdate(response.data);
      }
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to update phone number";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error updating phone number:", err);
    } finally {
      setLoading(false);
    }
  };

  // Email change requires verification
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to update email");
      setMessage("Please log in to update email.");
      setShowMessage(true);
      return;
    }

    if (emailData.newEmail === currentUser.email) {
      setError("No changes detected");
      setMessage("No changes were made to your email.");
      setShowMessage(true);
      return;
    }

    setLoading(true);
    setError("");
    setShowMessage(false);

    try {
      await axios.post(`/api/users/${currentUser.id}/request-email-change`, emailData);
      
      setMessage("Verification email sent! Please check your new email address to confirm the change.");
      setShowMessage(true);

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to request email change";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error requesting email change:", err);
    } finally {
      setLoading(false);
    }
  };

  // Password change requires verification
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to update password");
      setMessage("Please log in to update password.");
      setShowMessage(true);
      return;
    }

    if (passwordData.newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setMessage("New passwords do not match.");
      setShowMessage(true);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      setMessage("New password must be at least 6 characters long.");
      setShowMessage(true);
      return;
    }

    setLoading(true);
    setError("");
    setShowMessage(false);

    try {
      await axios.post(`/api/users/${currentUser.id}/request-password-change`, passwordData);
      
      setMessage("Verification email sent! Please check your email to confirm the password change.");
      setShowMessage(true);

      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: ""
      });
      setConfirmPassword("");

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to request password change";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error requesting password change:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetContactForm = () => {
    if (currentUser) {
      setContactData({
        phone: currentUser.phone || ""
      });
    }
    setError("");
    setShowMessage(false);
  };

  const resetEmailForm = () => {
    if (currentUser) {
      setEmailData({
        newEmail: currentUser.email || ""
      });
    }
    setError("");
    setShowMessage(false);
  };

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: ""
    });
    setConfirmPassword("");
    setError("");
    setShowMessage(false);
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto">
        <h1 className="text-gray-800">Update Account Information</h1>
        <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
          Please log in to update your account information
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Update Account Information</h1>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200 max-w-md">
          <button
            onClick={() => setActiveTab("contact")}
            className={`py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeTab === "contact"
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Phone Number
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={`py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeTab === "email"
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Email Address
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeTab === "password"
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Password
          </button>
        </nav>
      </div>

      {/* Phone Number Tab - Immediate Update */}
      {activeTab === "contact" && (
        <form onSubmit={handleContactSubmit} 
          className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px"
        >
          <h2 className="text-lg font-semibold mb-24px">Update Phone Number</h2>
          
          <div className="mb-20px">
            <label htmlFor="phone" className="block mb-6px font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={contactData.phone}
              onChange={handleContactChange}
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              placeholder="(555) 123-4567"
            />
            <p className="text-black text-12px mt-5px">For urgent maintenance requests and updates</p>
          </div>

          {error && showMessage && (
            <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
              {error}
            </div>
          )}

          {!error && message && (
            <div className="my-4 p-4 rounded-lg shadow-inner border border-green-300 bg-green-100 text-green-800 text-sm">
              {message}
            </div>
          )}

          <div className="flex flex-wrap gap-12px mt-24px">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Updating..." : "Update Phone Number"}
            </button>
            <button 
              type="button" 
              onClick={resetContactForm} 
              disabled={loading}
              className="bg-[#6c757d] text-white py-10px px-20px border-none rounded-4px cursor-pointer text-14px hover:bg-[#545b62] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </form>
      )}

      {/* Email Address Tab - Requires Verification */}
      {activeTab === "email" && (
        <form onSubmit={handleEmailSubmit} 
          className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px"
        >
          <h2 className="text-lg font-semibold mb-24px">Update Email Address</h2>
          
          <div className="mb-20px">
            <label htmlFor="newEmail" className="block mb-6px font-medium text-gray-700">
              New Email Address
            </label>
            <input
              type="email"
              id="newEmail"
              name="newEmail"
              value={emailData.newEmail}
              onChange={handleEmailChange}
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              placeholder="your.new.email@example.com"
            />
            <p className="text-black text-12px mt-5px">
              We'll send a verification email to your new address. The change will only take effect after you click the verification link.
            </p>
          </div>

          {error && showMessage && (
            <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
              {error}
            </div>
          )}

          {!error && message && (
            <div className="my-4 p-4 rounded-lg shadow-inner border border-green-300 bg-green-100 text-green-800 text-sm">
              {message}
            </div>
          )}

          <div className="flex flex-wrap gap-12px mt-24px">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Sending..." : "Send Verification Email"}
            </button>
            <button 
              type="button" 
              onClick={resetEmailForm} 
              disabled={loading}
              className="bg-[#6c757d] text-white py-10px px-20px border-none rounded-4px cursor-pointer text-14px hover:bg-[#545b62] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </form>
      )}

      {/* Password Tab - Requires Verification */}
      {activeTab === "password" && (
        <form onSubmit={handlePasswordSubmit} 
          className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px"
        >
          <h2 className="text-lg font-semibold mb-24px">Update Password</h2>
          
          <div className="mb-20px">
            <label htmlFor="currentPassword" className="block mb-6px font-medium text-gray-700">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 pr-10 border text-black border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
                placeholder="Enter your current password"
                required
              />
              <PasswordVisibilityToggle 
                isVisible={showCurrentPassword} 
                onToggle={() => setShowCurrentPassword(!showCurrentPassword)} 
              />
            </div>
            <p className="text-black text-12px mt-5px">Required for security verification</p>
          </div>

          <div className="mb-20px">
            <label htmlFor="newPassword" className="block mb-6px font-medium text-gray-700">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 pr-10 border text-black border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
                required
              />
              <PasswordVisibilityToggle 
                isVisible={showNewPassword} 
                onToggle={() => setShowNewPassword(!showNewPassword)} 
              />
            </div>
            <p className="text-black text-12px mt-5px">A verification email will be sent to your registered email</p>
          </div>

          <div className="mb-20px">
            <label htmlFor="confirmPassword" className="block mb-6px font-medium text-gray-700">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border text-black border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
                placeholder="Confirm new password"
                required
              />
              <PasswordVisibilityToggle 
                isVisible={showConfirmPassword} 
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)} 
              />
            </div>
            <p className="text-black text-12px mt-5px">Must match new password</p>
          </div>

          {error && showMessage && (
            <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
              {error}
            </div>
          )}

          {!error && message && (
            <div className="my-4 p-4 rounded-lg shadow-inner border border-green-300 bg-green-100 text-green-800 text-sm">
              {message}
            </div>
          )}

          <div className="flex flex-wrap gap-12px mt-24px">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Sending..." : "Send Verification Email"}
            </button>
            <button 
              type="button" 
              onClick={resetPasswordForm} 
              disabled={loading}
              className="bg-[#6c757d] text-white py-10px px-20px border-none rounded-4px cursor-pointer text-14px hover:bg-[#545b62] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </form>
      )}

      {/* Current Information Display */}
      <div className="current-info bg-white p-6 rounded-xl shadow-md max-w-[600px] border border-blue-200">
        <h3 className="text-gray-800 block mb-4">
          Current Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <strong className="text-gray-800 block">Username:</strong>
            <p className="text-gray-700">{currentUser.userName}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <strong className="text-gray-800 block">User ID:</strong>
            <p className="text-gray-700">{currentUser.id}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <strong className="text-gray-800 block">Email:</strong>
            <p className="text-gray-700">{currentUser.email || "Not set"}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <strong className="text-gray-800 block">Phone:</strong>
            <p className="text-gray-700">{currentUser.phone || "Not set"}</p>
          </div>
          <div className="col-span-2 bg-blue-50 p-3 rounded-lg">
            <strong className="text-gray-800 block">Roles:</strong>
            <p className="text-gray-700">{currentUser.roles?.join(", ") || "No roles"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditContactInfo;