import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

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
  const { id } = useParams<{ id: string }>();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchProperties();
    }
  }, [currentUser]);

  useEffect(() => {
        if (id) {
          setEditingId(parseInt(id));
          fetchUnit(parseInt(id));
        }
      }, [id]);

  const fetchUnit = async (unitId: number) => {
      try {
        const response = await axios.get<UnitDto>(`/api/units/${unitId}`);
        setFormData({
          id: response.data.id,
          unitNumber: response.data.unitNumber,
          propertyId: response.data.propertyId,
          description: response.data.description,
          imageUrl: response.data.imageUrl,
          bedrooms: response.data.bedrooms,
          bathrooms: response.data.bathrooms,
          squareFeet: response.data.squareFeet,
          rent: response.data.rent,
          status: response.data.status
        });
      } catch (err) {
        console.error("Error fetching unit:", err);
      }
    };

  const fetchProperties = async () => {
    try {
      const response = await axios.get<PropertyDto[]>("/api/properties");
      setAllProperties(response.data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };



  // Filter properties to only show current user's properties
  const userProperties = allProperties.filter(property => 
    currentUser && property.userId === parseInt(currentUser.id)
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
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Manage Units</h1>
      
      <form onSubmit={handleSubmit} 
        className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px"
        >
        <h2 className="text-lg font-semibold mb-24px">
          {editingId ? "Edit Unit" : "Create Unit"}
        </h2>
        
        <div className="mb-20px">
          <label htmlFor="unitNumber" className="block mb-6px font-medium text-gray-700">
            Unit Number
          </label>
          <input
            type="text"
            id="unitNumber"
            name="unitNumber"
            value={formData.unitNumber}
            onChange={handleInputChange}
            className="w-217 px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
          >
            <option value={0}>--Select Property--</option>
            {userProperties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>

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
            className="w-217 px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
          />
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
            className="w-217 px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 mb-5">
          <div className="flex flex-col">
            <label htmlFor="bedrooms" className="block mb-6px font-medium text-gray-700">
              Bedrooms
            </label>
            <input
              type="number"
              id="bedrooms"
              name="bedrooms"
              value={formData.bedrooms === 0 ? "" : formData.bedrooms}
              onChange={handleInputChange}
              className="w-65 px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
              min="0"
              step = "1"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="bathrooms" className="block mb-6px font-medium text-gray-700">
              Bathrooms
            </label>
            <input
              type="number"
              id="bathrooms"
              name="bathrooms"
              value={formData.bathrooms === 0 ? "" : formData.bathrooms}
              onChange={handleInputChange}
              className="w-65 px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
              min="0"
              step=".5"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="squareFeet" className="block mb-6px font-medium text-gray-700">
              Square Feet
            </label>
            <input
              type="number"
              id="squareFeet"
              name="squareFeet"
              value={formData.squareFeet === 0 ? "" : formData.squareFeet}
              onChange={handleInputChange}
              className="w-65 px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="mb-20px">
          <label htmlFor="rent" className="block mb-6px font-medium text-gray-700">
            Rent ($)
          </label>
          <input
            type="number"
            id="rent"
            name="rent"
            value={formData.rent === 0 ? "" : formData.rent}
            onChange={handleInputChange}
            className="w-217 px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="mb-20px">
          <label htmlFor="status" className="block mb-6px font-medium text-gray-700">Status:</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
          >
            <option value="Available">Available</option>
            <option value="Rented">Rented</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Unavailable">Unavailable</option>
          </select>
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
            {loading ? "Saving..." : editingId ? "Update Unit" : "Add Unit"}
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
            to="/units"
            className= "bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700"
          >
            View All Units
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EditUnits;