import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";

interface PropertyDto {
  id?: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  imageUrl?: string;
  userId: number;
}

interface EditPropertiesProps {
  currentUser?: UserDto; 
}

const EditProperties: React.FC<EditPropertiesProps> = ({ currentUser }) => {
  const [allProperties, setAllProperties] = useState<PropertyDto[]>([]);
  const [formData, setFormData] = useState<PropertyDto>({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    imageUrl: "",
    userId: 0
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  // Check if user is Admin
  const isAdmin = currentUser?.roles?.includes("Admin") || false;

  useEffect(() => {
    if (currentUser) {
      // Convert string ID to number for the backend
      const userIdNumber = parseInt(currentUser.id);
      setFormData(prev => ({
        ...prev,
        userId: userIdNumber
      }));
      fetchProperties();
    }
  }, [currentUser]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to manage properties");
      setMessage("Please log in to manage properties.");
      setShowMessage(true);
      return;
    }

    setLoading(true);
    setError("");
    setShowMessage(false);

    try {
      // For Admin users editing existing properties, preserve the original owner
      // For new properties or non-admin users, use current user's ID
      let payload;
      
      if (editingId && isAdmin) {
        // Admin editing existing property - preserve original owner
        const originalProperty = allProperties.find(p => p.id === editingId);
        payload = {
          ...formData,
          userId: originalProperty?.userId || parseInt(currentUser.id)
        };
      } else {
        // New property or non-admin user - use current user's ID
        payload = {
          ...formData,
          userId: parseInt(currentUser.id) 
        };
      }

      if (editingId) {
        await axios.put(`/api/properties/${editingId}`, payload);
        setMessage("Property updated successfully!");
      } else {
        await axios.post("/api/properties", payload);
        setMessage("Property added successfully!");
      }
      setShowMessage(true);

      resetForm();
      await fetchProperties();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to save property";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error saving property:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (property: PropertyDto) => {
    setFormData({
      name: property.name,
      description: property.description || "",
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      imageUrl: property.imageUrl || "",
      userId: property.userId // Keep the original owner's ID
    });
    setEditingId(property.id || null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this property?")) {
      return;
    }

    try {
      await axios.delete(`/api/properties/${id}`);
      setMessage("Property deleted successfully!");
      setShowMessage(true);
      await fetchProperties();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to delete property";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error deleting property:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      imageUrl: "",
      userId: currentUser ? parseInt(currentUser.id) : 0
    });
    setEditingId(null);
    setError("");
    setShowMessage(false);
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto">
        <h1 className="text-gray-800">Manage Properties</h1>
        <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
          Please log in to manage properties
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto">
      <div className="flex justify-between items-center mb-10px">
        <h1 className="text-gray-800 text-2xl font-semibold">Manage Properties</h1>
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
        <h2 className="text-lg font-semibold mb-24px">
          {editingId ? "Edit Property" : "Create Property"}
        </h2>
        
        {editingId && isAdmin && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Admin Note:</strong> You are editing a property owned by another user. 
              The original owner will be preserved.
            </p>
          </div>
        )}
        
        <div className="mb-20px">
          <label htmlFor="name" className="block mb-6px font-medium text-gray-700">
            Property Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-217 px-3 text-black py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
          />
        </div>

        {/* Rest of the form remains the same */}
        <div className="mb-20px">
          <label htmlFor="description" className="block mb-6px font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-217 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
          />
        </div>

        <div className="mb-20px">
          <label htmlFor="address" className="block mb-6px font-medium text-gray-700">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-217 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 mb-5">
          <div className="mb-20px">
            <label htmlFor="city" className="block mb-6px font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-65 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
            />
          </div>

          <div className="mb-20px">
            <label htmlFor="state" className="block mb-6px font-medium text-gray-700">
              State
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className="w-65 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
              maxLength={2}
              placeholder=""
            />
          </div>

          <div className="mb-20px">
            <label htmlFor="zipCode" className="block mb-6px font-medium text-gray-700">
              Zip Code
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              className="w-65 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
            />
          </div>
        </div>

        <div className="mb-20px">
          <label htmlFor="imageUrl" className="block mb-6px font-medium text-gray-700">
            Image URL
          </label>
          <input
            type="text"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            className="w-217 px-3 text-black py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <input type="hidden" name="userId" value={currentUser.id} />

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

        <div className="flex flex-wrap gap-12px mt-24px">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : editingId ? "Update Property" : "Add Property"}
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
        </div>
      </form>

      <div className="properties-list">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isAdmin ? "All Properties" : "Your Properties"} ({displayProperties.length})
          </h2>
        </div>
        
        {displayProperties.length === 0 ? (
          <p className="text-gray-600">
            {isAdmin 
              ? "No properties found in the system." 
              : "You don't have any properties yet. Add your first property above!"
            }
          </p>
        ) : (
          <table className="w-full border-collapse mt-5 text-sm bg-[#fdfefe] rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Name</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Description</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Address</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">City</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">State</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Zip Code</th>
                {isAdmin && (
                  <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Owner ID</th>
                )}
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Image</th>
                <th className="p-12px text-left border-b font-semibold text-[#374151]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayProperties.map((property, i) => (
                <tr
                  key={property.id}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"} hover:bg-[#ebf5ff] transition-colors`}
                >
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{property.name}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827] description-cell">{property.description}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{property.address}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{property.city}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{property.state}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{property.zipCode}</td>
                  {isAdmin && (
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827] text-sm">
                      {property.userId}
                    </td>
                  )}
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                    {property.imageUrl && (
                      <div className="property-image">
                        <img
                          src={property.imageUrl}
                          alt={property.name}
                          className="max-w-80px max-h-80px object-cover rounded-4px"
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-12px border-b flex gap-2">
                    <button
                      onClick={() => handleEdit(property)}
                      disabled={loading}
                      className="bg-[#22c55e] text-white py-6px px-12px rounded-md text-12px hover:bg-[#1e7e34] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => property.id && handleDelete(property.id)}
                      disabled={loading}
                      className="bg-[#ef4444] text-white py-6px px-12px rounded-md text-12px hover:bg-[#dc2626] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EditProperties;