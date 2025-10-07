import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

interface TenantDto {
  id?: number;
  unitId: number;
  unitNumber: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface UnitDto {
  id: number;
  unitNumber: string;
  propertyId: number;
  status: string;
}

interface PropertyDto {
  id: number;
  name: string;
  userId: number;
}

interface EditTenantsProps {
  currentUser?: UserDto;
}

const EditTenants: React.FC<EditTenantsProps> = ({ currentUser }) => {
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyDto[]>([]);
  const [formData, setFormData] = useState<Omit<TenantDto, "createdAt" | "updatedAt">>({
    unitId: 0,
    unitNumber: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: ""
  });
  const { id } = useParams<{ id: string }>();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchUnits();
      fetchProperties();
    }
  }, [currentUser]);

  useEffect(() => {
    if (id) {
      setEditingId(parseInt(id));
      fetchTenant(parseInt(id));
    }
  }, [id]);

  const fetchTenant = async (tenantId: number) => {
    try {
      const response = await axios.get<TenantDto>(`/api/tenants/${tenantId}`);
      setFormData({
        id: response.data.id,
        unitId: response.data.unitId,
        unitNumber: response.data.unitNumber,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        phoneNumber: response.data.phoneNumber,
        email: response.data.email
      });
    } catch (err) {
      console.error("Error fetching tenant:", err);
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

  // Filter units to only show units from user's properties that are available
  const availableUnits = units.filter(unit => 
    userProperties.some(property => property.id === unit.propertyId) && 
    (unit.status === "Available" || unit.id === formData.unitId)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "unitId" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to manage tenants");
      setMessage("Please log in to manage tenants.");
      setShowMessage(true);
      return;
    }

    setLoading(true);
    setError("");
    setShowMessage(false);

    try {
      if (editingId) {
        await axios.put(`/api/tenants/${editingId}`, formData);
        setMessage("Tenant updated successfully!");
      } else {
        await axios.post("/api/tenants", formData);
        setMessage("Tenant added successfully!");
      }
      setShowMessage(true);

      resetForm();
      await fetchUnits(); // Refresh units to update status
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to save tenant";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error saving tenant:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      unitId: 0,
      unitNumber: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: ""
    });
    setEditingId(null);
    setError("");
    setShowMessage(false);
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto">
        <h1 className="text-gray-800">Manage Tenants</h1>
        <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
          Please log in to manage tenants
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Manage Tenants</h1>
      
      <form 
        onSubmit={handleSubmit} 
        className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px"
      >
        <h2 className="text-lg font-semibold mb-24px">
          {editingId ? "Edit Tenant" : "Create Tenant"}
        </h2>
        
        <div className="mb-20px">
          <label htmlFor="unitId" className="block mb-6px font-medium text-gray-700">
            Unit:
          </label>
          <select
            id="unitId"
            name="unitId"
            value={formData.unitId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
          >
            <option value={0}>-- Select Unit --</option>
            {availableUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.unitNumber} (Available)
              </option>
            ))}
          </select>
          {availableUnits.length === 0 && (
            <p className="text-[#dc3545] text-12px mt-5px">No available units found for your properties.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="mb-20px">
            <label htmlFor="firstName" className="block mb-6px font-medium text-gray-700">
              First Name:
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-100 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
            />
          </div>

          <div className="mb-20px">
            <label htmlFor="lastName" className="block mb-6px font-medium text-gray-700">
              Last Name:
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-105 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
            />
          </div>
        </div>

        <div className="mb-20px">
          <label htmlFor="phoneNumber" className="block mb-6px font-medium text-gray-700">
            Phone Number:
          </label>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className="w-217 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
            maxLength={15}
            placeholder="123-456-7890"
          />
        </div>

        <div className="mb-20px">
          <label htmlFor="email" className="block mb-6px font-medium text-gray-700">
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className= "w-217 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
          />
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

        <div className="flex flex-wrap gap-12px mt-24px">
          <button 
            type="submit" 
            disabled={loading || availableUnits.length === 0}
            className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : editingId ? "Update Tenant" : "Add Tenant"}
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
              to="/tenants"
              className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700"
            >
              View All Tenants
            </Link>
        </div>
      </form>
    </div>
  );
};

export default EditTenants;