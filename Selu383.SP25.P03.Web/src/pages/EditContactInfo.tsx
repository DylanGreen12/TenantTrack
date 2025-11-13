import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../models/UserDto";

interface EditContactInfoProps {
  currentUser?: UserDto;
  onUserUpdate?: (updatedUser: UserDto) => void;
}

interface UpdateContactInfoDto {
  email?: string;
  phone?: string;
}

interface UpdateCredentialsDto {
  userName?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const EditContactInfo: React.FC<EditContactInfoProps> = ({ currentUser, onUserUpdate }) => {
  const [formData, setFormData] = useState<UpdateContactInfoDto>({
    email: "",
    phone: ""
  });
  const [credentialsData, setCredentialsData] = useState<UpdateCredentialsDto>({
    userName: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [activeTab, setActiveTab] = useState<"contact" | "credentials">("contact");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        email: currentUser.email || "",
        phone: currentUser.phone || ""
      });
      setCredentialsData({
        userName: currentUser.userName || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentialsData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to update contact information");
      setMessage("Please log in to update contact information.");
      setShowMessage(true);
      return;
    }

    setLoading(true);
    setError("");
    setShowMessage(false);

    try {
      const response = await axios.put(`/api/users/${currentUser.id}/contact`, formData);
      
      setMessage("Contact information updated successfully!");
      setShowMessage(true);

      // Update parent component with the returned user data
      if (onUserUpdate) {
        onUserUpdate(response.data);
      }
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to update contact information";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error updating contact info:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to update credentials");
      setMessage("Please log in to update credentials.");
      setShowMessage(true);
      return;
    }

    // Validate passwords match
    if (credentialsData.newPassword !== credentialsData.confirmPassword) {
      setError("New passwords do not match");
      setMessage("New passwords do not match.");
      setShowMessage(true);
      return;
    }

    // Validate password strength (optional)
    if (credentialsData.newPassword && credentialsData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      setMessage("New password must be at least 6 characters long.");
      setShowMessage(true);
      return;
    }

    setLoading(true);
    setError("");
    setShowMessage(false);

    try {
      const payload: any = {};
      if (credentialsData.userName && credentialsData.userName !== currentUser.userName) {
        payload.userName = credentialsData.userName;
      }
      if (credentialsData.newPassword) {
        payload.currentPassword = credentialsData.currentPassword;
        payload.newPassword = credentialsData.newPassword;
      }

      // Only make the request if there are changes
      if (Object.keys(payload).length > 0) {
        const response = await axios.put(`/api/users/${currentUser.id}/credentials`, payload);
        
        setMessage("Credentials updated successfully! Please log in again with your new credentials.");
        setShowMessage(true);

        // Reset password fields
        setCredentialsData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));

        // Update parent component with the returned user data
        if (onUserUpdate) {
          onUserUpdate(response.data);
        }
      } else {
        setMessage("No changes detected.");
        setShowMessage(true);
      }
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to update credentials";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error updating credentials:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetContactForm = () => {
    if (currentUser) {
      setFormData({
        email: currentUser.email || "",
        phone: currentUser.phone || ""
      });
    }
    setError("");
    setShowMessage(false);
  };

  const resetCredentialsForm = () => {
    if (currentUser) {
      setCredentialsData({
        userName: currentUser.userName || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
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
      
      {/* Tab Navigation - Styled to match button colors */}
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
            Contact Information
          </button>
          <button
            onClick={() => setActiveTab("credentials")}
            className={`py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeTab === "credentials"
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Username & Password
          </button>
        </nav>
      </div>

      {/* Contact Information Tab */}
      {activeTab === "contact" && (
        <form onSubmit={handleContactSubmit} 
          className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px"
        >
          <h2 className="text-lg font-semibold mb-24px">Your Contact Details</h2>
          
          <div className="mb-20px">
            <label htmlFor="email" className="block mb-6px font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              placeholder="your.email@example.com"
            />
            <p className="text-black text-12px mt-5px">We'll use this for important notifications</p>
          </div>

          <div className="mb-20px">
            <label htmlFor="phone" className="block mb-6px font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
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
              {loading ? "Updating..." : "Update Contact Info"}
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

      {/* Username & Password Tab */}
      {activeTab === "credentials" && (
        <form onSubmit={handleCredentialsSubmit} 
          className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px"
        >
          <h2 className="text-lg font-semibold mb-24px">Update Credentials</h2>
          
          <div className="mb-20px">
            <label htmlFor="userName" className="block mb-6px font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={credentialsData.userName}
              onChange={handleCredentialsChange}
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              placeholder="Enter new username"
            />
            <p className="text-black text-12px mt-5px">Leave blank to keep current username</p>
          </div>

          <div className="mb-20px">
            <label htmlFor="currentPassword" className="block mb-6px font-medium text-gray-700">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={credentialsData.currentPassword}
                onChange={handleCredentialsChange}
                className="w-full px-3 py-2 pr-10 border text-black border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
                placeholder="Enter your current password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
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
            </div>
            <p className="text-black text-12px mt-5px">Required for security verification</p>
          </div>

          <div className="mb-20px">
            <label htmlFor="newPassword" className="block mb-6px font-medium text-gray-700">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={credentialsData.newPassword}
                onChange={handleCredentialsChange}
                className="w-full px-3 py-2 pr-10 border text-black border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
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
            </div>
            <p className="text-black text-12px mt-5px">Leave blank to keep current password</p>
          </div>

          <div className="mb-20px">
            <label htmlFor="confirmPassword" className="block mb-6px font-medium text-gray-700">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={credentialsData.confirmPassword}
                onChange={handleCredentialsChange}
                className="w-full px-3 py-2 pr-10 border text-black border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
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
              {loading ? "Updating..." : "Update Credentials"}
            </button>
            <button 
              type="button" 
              onClick={resetCredentialsForm} 
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