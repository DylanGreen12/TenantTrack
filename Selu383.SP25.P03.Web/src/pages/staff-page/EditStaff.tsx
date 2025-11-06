import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

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
  const [allProperties, setAllProperties] = useState<PropertyDto[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    propertyId: 0
  });
  const { id } = useParams<{ id: string }>();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  // Check if user is Admin
  const isAdmin = currentUser?.roles?.includes("Admin") || false;

  useEffect(() => {
    if (currentUser) {
      fetchProperties();
    }
  }, [currentUser]);

  useEffect(() => {
      if (id) {
        setEditingId(parseInt(id));
        fetchStaff(parseInt(id));
      }
    }, [id]);

  const fetchStaff = async (staffId: number) => {
    try {
      const response = await axios.get<StaffDto>(`/api/staff/${staffId}`);
      setFormData({
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        phone: response.data.phone,
        position: response.data.position,
        propertyId: response.data.propertyId,
      });
    } catch (err) {
      console.error("Error fetching staff member:", err);
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

  // Show all properties for Admin, only user's properties for others
  const displayProperties = isAdmin 
    ? allProperties 
    : allProperties.filter(property => 
        currentUser && property.userId === parseInt(currentUser.id)
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
    <div className="p-20px max-w-1200px mx-auto">
      <div className="flex justify-between items-center mb-10px">
        <h1 className="text-gray-800 text-2xl font-semibold">Manage Staff</h1>
        {isAdmin && (
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Admin View - All Properties
          </div>
        )}
      </div>
      
      <form 
        onSubmit={handleSubmit} 
        className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px"
      >
        <div className="flex justify-between items-center mb-24px">
          <h2 className="text-lg font-semibold">
            {editingId ? "Edit Staff Member" : "Create Staff Member"}
          </h2>
          {isAdmin && (
            <div className="text-sm text-gray-600">
              Can assign to any property
            </div>
          )}
        </div>
        
        {editingId && isAdmin && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Admin Note:</strong> You are editing a staff member assigned to another user's property.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="mb-20px">
            <label htmlFor="firstName" className="block mb-6px font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-100 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
              maxLength={50}
            />
          </div>

          <div className="mb-20px">
            <label htmlFor="lastName" className="block mb-6px font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-105 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
              maxLength={50}
            />
          </div>
        </div>

        <div className="mb-20px">
          <label htmlFor="email" className="block mb-6px font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
            maxLength={100}
          />
        </div>

        <div className="mb-20px">
          <label htmlFor="phone" className="block mb-6px font-medium text-gray-700">
            Phone
          </label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
            maxLength={15}
            placeholder="e.g., 123-456-7890"
          />
        </div>

        <div className="mb-20px">
          <label htmlFor="position" className="block mb-6px font-medium text-gray-700">
            Position
          </label>
          <input
            type="text"
            id="position"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
            maxLength={50}
            placeholder="e.g., Manager, Receptionist"
          />
        </div>

        <div className="mb-20px">
          <label htmlFor="propertyId" className="block mb-6px font-medium text-gray-700">
            Property
          </label>
          <select
            id="propertyId"
            name="propertyId"
            value={formData.propertyId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
          >
            <option value={0}>-- Select Property --</option>
            {displayProperties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name} {isAdmin && `(Owner: ${property.userId})`}
              </option>
            ))}
          </select>
          {isAdmin && displayProperties.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Showing all {displayProperties.length} properties in the system
            </p>
          )}
          {!isAdmin && displayProperties.length === 0 && (
            <p className="text-red-400 text-sm mt-1">No properties found for your account. Please create a property first.</p>
          )}
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
            disabled={loading || displayProperties.length === 0}
            className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : editingId ? "Update Staff Member" : "Add Staff Member"}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={resetForm} 
              disabled={loading}
              className="bg-gray-400 text-white py-10px px-20px rounded-8px text-14px hover:bg-gray-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}

          <Link 
            to="/staff"
            className= "bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700"
          >
            View All Staff
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EditStaff;