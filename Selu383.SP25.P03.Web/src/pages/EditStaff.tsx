import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../models/UserDto";

interface StaffDto {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  propertyId: number;
}

interface PropertyDto {
  id: number;
  name: string;
  userId: number;
}

interface EditStaffProps {
  currentUser?: UserDto;
}

const EditStaff: React.FC<EditStaffProps> = ({ currentUser }) => {
  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyDto[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    propertyId: 0
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchStaff();
      fetchProperties();
    }
  }, [currentUser]);

  const fetchStaff = async () => {
    try {
      const response = await axios.get<StaffDto[]>("/api/staff");
      setStaff(response.data);
    } catch (err) {
      setError("Failed to fetch staff");
      setMessage("Failed to fetch staff.");
      setShowMessage(true);
      console.error("Error fetching staff:", err);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get<PropertyDto[]>("/api/properties");
      setAllProperties(response.data);
    } catch (err) {
      setError("Failed to fetch properties");
      setMessage("Failed to fetch properties.");
      setShowMessage(true);
      console.error("Error fetching properties:", err);
    }
  };

  // Filter properties to only show current user's properties
  const userProperties = allProperties.filter(property => 
    currentUser && property.userId === parseInt(currentUser.id)
  );

  // Filter staff to only show staff from user's properties
  const userStaff = staff.filter(staffMember => 
    userProperties.some(property => property.id === staffMember.propertyId)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "propertyId" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to manage staff");
      setMessage("Please log in to manage staff.");
      setShowMessage(true);
      return;
    }

    // Validate property selection
    if (formData.propertyId === 0) {
      setError("Please select a property");
      setMessage("Please select a property.");
      setShowMessage(true);
      return;
    }

    setLoading(true);
    setError("");
    setShowMessage(false);

    try {
      // Prepare the data for API - remove any undefined fields
      const submitData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        position: formData.position.trim(),
        propertyId: formData.propertyId
      };

      if (editingId) {
        // For update, include the ID
        await axios.put(`/api/staff/${editingId}`, {
          ...submitData,
          id: editingId
        });
        setMessage("Staff member updated successfully!");
      } else {
        // For create, don't include ID
        await axios.post("/api/staff", submitData);
        setMessage("Staff member added successfully!");
      }
      setShowMessage(true);

      resetForm();
      await fetchStaff();
    } catch (err: any) {
      console.error("Full error object:", err);
      
      let errorMsg = "Failed to save staff member";
      if (err.response?.data) {
        // Handle different error response formats
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.data.errors) {
          // Handle validation errors
          const validationErrors = Object.values(err.response.data.errors).flat();
          errorMsg = validationErrors.join(', ');
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember: StaffDto) => {
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phone: staffMember.phone,
      position: staffMember.position,
      propertyId: staffMember.propertyId
    });
    setEditingId(staffMember.id || null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    try {
      await axios.delete(`/api/staff/${id}`);
      setMessage("Staff member deleted successfully!");
      setShowMessage(true);
      await fetchStaff();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to delete staff member";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error deleting staff:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      propertyId: 0
    });
    setEditingId(null);
    setError("");
    setShowMessage(false);
  };

  if (!currentUser) {
    return (
      <div className="p-5 max-w-1200px mx-auto">
        <h1 className="text-gray-800">Manage Staff</h1>
        <div className="text-red-600 my-2 py-2 bg-red-50 border border-red-300 rounded-md">
          Please log in to manage staff
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-1200px mx-auto">
      <h1 className="text-gray-800">Manage Staff</h1>
      <p className="text-gray-700">Logged in as: {currentUser.userName} (ID: {currentUser.id})</p>
      
      <form onSubmit={handleSubmit} className="bg-[#00061f] text-white p-6 rounded-lg mb-8 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Staff Member" : "Add New Staff Member"}</h2>
        
        <div className="mb-4">
          <label htmlFor="firstName" className="block mb-2 font-medium">First Name:</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            maxLength={50}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="lastName" className="block mb-2 font-medium">Last Name:</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            maxLength={50}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block mb-2 font-medium">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            maxLength={100}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="phone" className="block mb-2 font-medium">Phone:</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            maxLength={15}
            placeholder="e.g., 123-456-7890"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="position" className="block mb-2 font-medium">Position:</label>
          <input
            type="text"
            id="position"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            maxLength={50}
            placeholder="e.g., Manager, Receptionist"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="propertyId" className="block mb-2 font-medium">Property:</label>
          <select
            id="propertyId"
            name="propertyId"
            value={formData.propertyId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value={0}>-- Select Property --</option>
            {userProperties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          {userProperties.length === 0 && (
            <p className="text-red-400 text-sm mt-1">No properties found for your account. Please create a property first.</p>
          )}
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

        <div className="flex gap-3 mt-6">
          <button 
            type="submit" 
            disabled={loading || userProperties.length === 0}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? "Saving..." : editingId ? "Update Staff Member" : "Add Staff Member"}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={resetForm} 
              disabled={loading}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="staff-list">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Your Staff Members ({userStaff.length})</h2>
        {userStaff.length === 0 ? (
          <p className="text-gray-600">You don't have any staff members yet. Add your first staff member above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-white bg-[#01101f] border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-white">
                  <th className="p-3 text-left border border-gray-300 bg-[#01101f] font-semibold">First Name</th>
                  <th className="p-3 text-left border border-gray-300 bg-[#01101f] font-semibold">Last Name</th>
                  <th className="p-3 text-left border border-gray-300 bg-[#01101f] font-semibold">Email</th>
                  <th className="p-3 text-left border border-gray-300 bg-[#01101f] font-semibold">Phone</th>
                  <th className="p-3 text-left border border-gray-300 bg-[#01101f] font-semibold">Position</th>
                  <th className="p-3 text-left border border-gray-300 bg-[#01101f] font-semibold">Property</th>
                  <th className="p-3 text-left border border-gray-300 bg-[#01101f] font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userStaff.map(staffMember => {
                  const property = userProperties.find(p => p.id === staffMember.propertyId);
                  return (
                  <tr key={staffMember.id} className="bg-[#322c35] text-white">
                    <td className="p-3 border border-gray-300">{staffMember.firstName}</td>
                    <td className="p-3 border border-gray-300">{staffMember.lastName}</td>
                    <td className="p-3 border border-gray-300">{staffMember.email}</td>
                    <td className="p-3 border border-gray-300">{staffMember.phone}</td>
                    <td className="p-3 border border-gray-300">{staffMember.position}</td>
                    <td className="p-12px text-left border-b-1 border-[#ddd]">{property?.name || staffMember.propertyId}</td>
                    <td className="p-3 border border-gray-300">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(staffMember)}
                          disabled={loading}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => staffMember.id && handleDelete(staffMember.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditStaff;