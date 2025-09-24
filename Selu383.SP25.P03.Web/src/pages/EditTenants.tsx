import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../models/UserDto";

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
  const [tenants, setTenants] = useState<TenantDto[]>([]);
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchTenants();
      fetchUnits();
      fetchProperties();
    }
  }, [currentUser]);

  const fetchTenants = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      setTenants(response.data);
    } catch (err) {
      setError("Failed to fetch tenants");
      setMessage("Failed to fetch tenants.");
      setShowMessage(true);
      console.error("Error fetching tenants:", err);
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
    unit.status === "Available"
  );

  // Filter tenants to only show tenants from user's properties
  const userTenants = tenants.filter(tenant => 
    userProperties.some(property => 
      units.some(unit => unit.id === tenant.unitId && unit.propertyId === property.id)
    )
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
      await fetchTenants();
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

  const handleEdit = (tenant: TenantDto) => {
    setFormData({
      id: tenant.id,
      unitId: tenant.unitId,
      unitNumber: tenant.unitNumber,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      phoneNumber: tenant.phoneNumber,
      email: tenant.email
    });
    setEditingId(tenant.id || null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this tenant?")) {
      return;
    }

    try {
      await axios.delete(`/api/tenants/${id}`);
      setMessage("Tenant deleted successfully!");
      setShowMessage(true);
      await fetchTenants();
      await fetchUnits(); // Refresh units to update status
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to delete tenant";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error deleting tenant:", err);
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
      <h1 className="text-gray-800">Manage Tenants</h1>
      <p className="text-gray-700">Logged in as: {currentUser.userName} (ID: {currentUser.id})</p>
      
      {showMessage && (
        <div className={`message-popup ${error ? "error" : "success"}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-[#00061f] p-20px rounded-8px mb-30px">
        <h2>{editingId ? "Edit Tenant" : "Add New Tenant"}</h2>
        
        <div className="mb-15px">
          <label htmlFor="unitId" className="block mb-5px font-bold">Unit:</label>
          <select
            id="unitId"
            name="unitId"
            value={formData.unitId}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
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

        <div className="mb-15px">
          <label htmlFor="firstName" className="block mb-5px font-bold">First Name:</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="lastName" className="block mb-5px font-bold">Last Name:</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="phoneNumber" className="block mb-5px font-bold">Phone Number:</label>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
            maxLength={15}
            placeholder="123-456-7890"
          />
        </div>

        <div className="mb-15px">
          <label htmlFor="email" className="block mb-5px font-bold">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
          />
        </div>

        {error && !showMessage && (
          <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
            {error}
          </div>
        )}

        <div className="flex gap-10px mt-20px">
          <button 
            type="submit" 
            disabled={loading || availableUnits.length === 0}
            className="bg-[#007bff] text-white py-10px px-20px border-none rounded-4px cursor-pointer text-14px hover:bg-[#0056b3] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : editingId ? "Update Tenant" : "Add Tenant"}
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

      <div className="tenants-list">
        <h2>Your Tenants ({userTenants.length})</h2>
        {userTenants.length === 0 ? (
          <p>You don't have any tenants yet. Add your first tenant above!</p>
        ) : (
          <table className="w-full border-collapse mt-20px">
            <thead>
              <tr>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Unit</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">First Name</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Last Name</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Phone Number</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Email</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Created</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Updated</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userTenants.map(tenant => (
                <tr key={tenant.id} className="bg-[#322c35]">
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{tenant.unitNumber}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{tenant.firstName}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{tenant.lastName}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{tenant.phoneNumber}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{tenant.email}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{new Date(tenant.updatedAt).toLocaleDateString()}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">
                    <button
                      onClick={() => handleEdit(tenant)}
                      disabled={loading}
                      className="bg-[#28a745] text-white py-6px px-12px mr-5px border-none rounded-4px cursor-pointer text-12px hover:bg-[#1e7e34] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => tenant.id && handleDelete(tenant.id)}
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

export default EditTenants;