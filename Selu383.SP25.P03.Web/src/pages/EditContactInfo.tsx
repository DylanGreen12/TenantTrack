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

const EditContactInfo: React.FC<EditContactInfoProps> = ({ currentUser, onUserUpdate }) => {
  const [formData, setFormData] = useState<UpdateContactInfoDto>({
    email: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        email: currentUser.email || "",
        phone: currentUser.phone || ""
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

  const handleSubmit = async (e: React.FormEvent) => {
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

  const resetForm = () => {
    if (currentUser) {
      setFormData({
        email: currentUser.email || "",
        phone: currentUser.phone || ""
      });
    }
    setError("");
    setShowMessage(false);
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto">
        <h1 className="text-gray-800">Update Contact Information</h1>
        <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
          Please log in to update your contact information
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Update Contact Information</h1>
      
      <form onSubmit={handleSubmit} 
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
            className="w-217 px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
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
            className="w-217 px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
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
            onClick={resetForm} 
            disabled={loading}
            className="bg-[#6c757d] text-white py-10px px-20px border-none rounded-4px cursor-pointer text-14px hover:bg-[#545b62] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </form>

      <div className="current-info bg-white p-6 rounded-xl shadow-md max-w-[600px] border border-blue-200">
            <h3 className="text-gray-800 block">
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