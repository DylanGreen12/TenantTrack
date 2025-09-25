import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../models/UserDto";

interface UnitDto {
  id?: number;
  unitNumber: string;
  propertyId: number;
  description?: string;
  imageUrl?: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  rent: number;
  status: string;
}

interface PropertyDto {
  id: number;
  name: string;
  userId: number;
}

interface EditUnitsProps {
  currentUser?: UserDto;
}

const EditUnits: React.FC<EditUnitsProps> = ({ currentUser }) => {
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyDto[]>([]);
  const [formData, setFormData] = useState<UnitDto>({
    unitNumber: "",
    propertyId: 0,
    description: "",
    imageUrl: "",
    bedrooms: 0,
    bathrooms: 0,
    squareFeet: 0,
    rent: 0,
    status: "Available"
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchProperties();
      fetchUnits();
    }
  }, [currentUser]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get<PropertyDto[]>("/api/properties");
      setAllProperties(response.data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await axios.get<UnitDto[]>("/api/units");
      setUnits(response.data);
    } catch (err) {
      setError("Failed to fetch units");
      setMessage("Failed to fetch units.");
      setShowMessage(true);
      console.error("Error fetching units:", err);
    }
  };

  // Filter properties to only show current user's properties
  const userProperties = allProperties.filter(property => 
    currentUser && property.userId === parseInt(currentUser.id)
  );

  // Filter units to only show units from user's properties
  const userUnits = units.filter(unit => 
    userProperties.some(property => property.id === unit.propertyId)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "propertyId" || name === "bedrooms" || name === "bathrooms" 
        ? parseInt(value) || 0 
        : name === "squareFeet" || name === "rent"
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to manage units");
      setMessage("Please log in to manage units.");
      setShowMessage(true);
      return;
    }

    setLoading(true);
    setError("");
    setShowMessage(false);

    try {
      if (editingId) {
        await axios.put(`/api/units/${editingId}`, formData);
        setMessage("Unit updated successfully!");
      } else {
        await axios.post("/api/units", formData);
        setMessage("Unit added successfully!");
      }
      setShowMessage(true);

      resetForm();
      await fetchUnits();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to save unit";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error saving unit:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (unit: UnitDto) => {
    setFormData({
      id: unit.id,
      unitNumber: unit.unitNumber,
      propertyId: unit.propertyId,
      description: unit.description || "",
      imageUrl: unit.imageUrl || "",
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      squareFeet: unit.squareFeet,
      rent: unit.rent,
      status: unit.status
    });
    setEditingId(unit.id || null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) {
      return;
    }

    try {
      await axios.delete(`/api/units/${id}`);
      setMessage("Unit deleted successfully!");
      setShowMessage(true);
      await fetchUnits();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to delete unit";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error deleting unit:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      unitNumber: "",
      propertyId: 0,
      description: "",
      imageUrl: "",
      bedrooms: 0,
      bathrooms: 0,
      squareFeet: 0,
      rent: 0,
      status: "Available"
    });
    setEditingId(null);
    setError("");
    setShowMessage(false);
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto">
        <h1 className="text-gray-800">Manage Units</h1>
        <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
          Please log in to manage units
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto">
      <h1 className="text-gray-800">Manage Units</h1>
      <p className="text-gray-700">Logged in as: {currentUser.userName} (ID: {currentUser.id})</p>
      
      {showMessage && (
        <div className={`message-popup ${error ? "error" : "success"}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-[#00061f] text-white p-20px rounded-8px mb-30px">
        <h2>{editingId ? "Edit Unit" : "Add New Unit"}</h2>
        
        <div className="mb-15px">
          <label htmlFor="unitNumber" className="block mb-5px font-bold">Unit Number:</label>
          <input
            type="text"
            id="unitNumber"
            name="unitNumber"
            value={formData.unitNumber}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="propertyId" className="block mb-5px font-bold">Property:</label>
          <select
            id="propertyId"
            name="propertyId"
            value={formData.propertyId}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
          >
            <option value={0}>Select Property</option>
            {userProperties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
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

        <div className="mb-15px">
          <label htmlFor="bedrooms" className="block mb-5px font-bold">Bedrooms:</label>
          <input
            type="number"
            id="bedrooms"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
            min="0"
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="bathrooms" className="block mb-5px font-bold">Bathrooms:</label>
          <input
            type="number"
            id="bathrooms"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
            min="0"
            step="0.5"
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="squareFeet" className="block mb-5px font-bold">Square Feet:</label>
          <input
            type="number"
            id="squareFeet"
            name="squareFeet"
            value={formData.squareFeet}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="rent" className="block mb-5px font-bold">Rent ($):</label>
          <input
            type="number"
            id="rent"
            name="rent"
            value={formData.rent}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="status" className="block mb-5px font-bold">Status:</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
          >
            <option value="Available">Available</option>
            <option value="Rented">Rented</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>

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
            {loading ? "Saving..." : editingId ? "Update Unit" : "Add Unit"}
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

      <div className="units-list">
        <h2>Your Units ({userUnits.length})</h2>
        {userUnits.length === 0 ? (
          <p>You don't have any units yet. Add your first unit above!</p>
        ) : (
          <table className="w-full text-white border-collapse mt-20px">
            <thead>
              <tr>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Unit #</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Property</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Description</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Bed/Bath</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Square Feet</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Rent</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Status</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Image</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userUnits.map(unit => {
                const property = userProperties.find(p => p.id === unit.propertyId);
                return (
                  <tr key={unit.id} className="bg-[#322c35]">
                    <td className="p-12px text-left border-b-1 border-[#ddd]">{unit.unitNumber}</td>
                    <td className="p-12px text-left border-b-1 border-[#ddd]">{property?.name || unit.propertyId}</td>
                    <td className="p-12px text-left border-b-1 border-[#ddd] description-cell">{unit.description}</td>
                    <td className="p-12px text-left border-b-1 border-[#ddd]">{unit.bedrooms} BR / {unit.bathrooms} BA</td>
                    <td className="p-12px text-left border-b-1 border-[#ddd]">{unit.squareFeet.toLocaleString()} sq ft</td>
                    <td className="p-12px text-left border-b-1 border-[#ddd]">${unit.rent.toFixed(2)}</td>
                    <td className="p-12px text-left border-b-1 border-[#ddd]">{unit.status}</td>
                    <td className="p-12px text-left border-b-1 border-[#ddd]">
                      {unit.imageUrl && (
                        <div className="unit-image">
                          <img
                            src={unit.imageUrl}
                            alt={`Unit ${unit.unitNumber}`}
                            className="max-w-60px max-h-60px object-cover rounded-4px"
                          />
                        </div>
                      )}
                    </td>
                    <td className="p-12px text-left border-b-1 border-[#ddd]">
                      <button
                        onClick={() => handleEdit(unit)}
                        disabled={loading}
                        className="bg-[#28a745] text-white py-6px px-12px mr-5px border-none rounded-4px cursor-pointer text-12px hover:bg-[#1e7e34] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => unit.id && handleDelete(unit.id)}
                        disabled={loading}
                        className="bg-[#dc3545] text-white py-6px px-12px border-none rounded-4px cursor-pointer text-12px hover:bg-[#c82333] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EditUnits;