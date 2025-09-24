import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../models/UserDto";

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

  const userProperties = allProperties.filter(property => 
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
      const payload = {
        ...formData,
        userId: parseInt(currentUser.id) 
      };

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
      userId: property.userId
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
      <h1 className="text-gray-800">Manage Properties</h1>
      <p className="text-gray-700">Logged in as: {currentUser.userName} (ID: {currentUser.id})</p>
      
      {showMessage && (
        <div className={`message-popup ${error ? "error" : "success"}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-[#00061f] text-white p-20px rounded-8px mb-30px">
        <h2>{editingId ? "Edit Property" : "Add New Property"}</h2>
        
        <div className="mb-15px">
          <label htmlFor="name" className="block mb-5px font-bold">Property Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="description" className="block mb-5px font-bold">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="address" className="block mb-5px font-bold">Address:</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="city" className="block mb-5px font-bold">City:</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="state" className="block mb-5px font-bold">State:</label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
            maxLength={2}
            placeholder="LA"
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="zipCode" className="block mb-5px font-bold">Zip Code:</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="imageUrl" className="block mb-5px font-bold">Image URL:</label>
          <input
            type="text"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <input type="hidden" name="userId" value={currentUser.id} />

        {error && !showMessage && (
          <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
            {error}
          </div>
        )}

        <div className="flex gap-10px mt-20px">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#007bff] text-white py-10px px-20px border-none rounded-4px cursor-pointer text-14px hover:bg-[#0056b3] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : editingId ? "Update Property" : "Add Property"}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={resetForm} 
              disabled={loading}
              className="bg-[#6c757d] text-white py-10px px-20px border-none rounded-4px cursor-pointer text-14px hover:bg-[#545b62] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="properties-list">
        <h2>Your Properties ({userProperties.length})</h2>
        {userProperties.length === 0 ? (
          <p>You don't have any properties yet. Add your first property above!</p>
        ) : (
          <table className="w-full text-white border-collapse mt-20px">
            <thead>
              <tr>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Name</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Description</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Address</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">City</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">State</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Zip Code</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Image</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
            {userProperties.map(property => (
              <tr key={property.id} className="bg-[#322c35]">
                <td className="p-12px text-left border-b-1 border-[#ddd]">{property.name}</td>
                <td className="p-12px text-left border-b-1 border-[#ddd] description-cell">{property.description}</td>
                <td className="p-12px text-left border-b-1 border-[#ddd]">{property.address}</td>
                <td className="p-12px text-left border-b-1 border-[#ddd]">{property.city}</td>
                <td className="p-12px text-left border-b-1 border-[#ddd]">{property.state}</td>
                <td className="p-12px text-left border-b-1 border-[#ddd]">{property.zipCode}</td>
                <td className="p-12px text-left border-b-1 border-[#ddd]">
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
                <td className="p-12px text-left border-b-1 border-[#ddd]">
                  <button
                    onClick={() => handleEdit(property)}
                    disabled={loading}
                    className="bg-[#28a745] text-white py-6px px-12px mr-5px border-none rounded-4px cursor-pointer text-12px hover:bg-[#1e7e34] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => property.id && handleDelete(property.id)}
                    disabled={loading}
                    className="bg-[#dc3545] text-white py-6px px-12px border-none rounded-4px cursor-pointer text-12px hover:bg-[#c82333] disabled:opacity-60 disabled:cursor-not-allowed"
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