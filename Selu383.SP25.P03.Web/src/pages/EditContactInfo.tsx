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
    <div className="p-20px max-w-1200px mx-auto">
      <h1 className="text-gray-800">Update Contact Information</h1>
      <p className="text-gray-700">Logged in as: {currentUser.userName} (ID: {currentUser.id})</p>
      
      <form onSubmit={handleSubmit} className="bg-[#00061f] text-white p-20px rounded-8px mb-30px max-w-600px">
        <h2 className="mb-20px">Your Contact Details</h2>
        
        <div className="mb-15px">
          <label htmlFor="email" className="block mb-5px font-bold">Email Address:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px text-white"
            placeholder="your.email@example.com"
          />
          <p className="text-[#ccc] text-12px mt-5px">We'll use this for important notifications</p>
        </div>

        <div className="mb-15px">
          <label htmlFor="phone" className="block mb-5px font-bold">Phone Number:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px text-white"
            placeholder="(555) 123-4567"
          />
          <p className="text-[#ccc] text-12px mt-5px">For urgent maintenance requests and updates</p>
        </div>

        {error && showMessage && (
          <div className="text-[#721c24] my-10px py-10px px-15px bg-[#f8d7da] border border-[#f5c6cb] rounded-4px">
            {error}
          </div>
        )}

        {!error && message && (
          <div className="text-[#155724] my-10px py-10px px-15px bg-[#d4edda] border border-[#c3e6cb] rounded-4px">
            {message}
          </div>
        )}

        <div className="flex gap-10px mt-20px">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#007bff] text-white py-10px px-20px border-none rounded-4px cursor-pointer text-14px hover:bg-[#0056b3] disabled:opacity-60 disabled:cursor-not-allowed"
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

      <div className="current-info bg-[#f8f9fa] p-20px rounded-8px max-w-600px">
        <h3 className="text-gray-800 mb-15px">Current Information</h3>
        <div className="grid grid-cols-2 gap-15px">
          <div>
            <strong className="text-gray-700">Username:</strong>
            <p className="text-gray-600">{currentUser.userName}</p>
          </div>
          <div>
            <strong className="text-gray-700">User ID:</strong>
            <p className="text-gray-600">{currentUser.id}</p>
          </div>
          <div>
            <strong className="text-gray-700">Email:</strong>
            <p className="text-gray-600">{currentUser.email || "Not set"}</p>
          </div>
          <div>
            <strong className="text-gray-700">Phone:</strong>
            <p className="text-gray-600">{currentUser.phone || "Not set"}</p>
          </div>
          <div className="col-span-2">
            <strong className="text-gray-700">Roles:</strong>
            <p className="text-gray-600">{currentUser.roles?.join(", ") || "No roles"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditContactInfo;