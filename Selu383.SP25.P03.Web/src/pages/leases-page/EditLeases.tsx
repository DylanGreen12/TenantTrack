import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

interface LeaseDto {
  id?: number;
  unitNumber: string;
  tenantId: number;
  firstName: string;
  lastName: string;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  status: string;
}

interface TenantDto {
  id?: number;
  unitNumber: string;
  firstName: string;
  lastName: string;
  unitId: number;
}

interface UnitDto {
  id: number;
  unitNumber: string;
  propertyId: number;
}

interface PropertyDto {
  id: number;
  name: string;
  userId: number;
}

interface EditLeasesProps {
  currentUser?: UserDto;
}

const EditLeases: React.FC<EditLeasesProps> = ({ currentUser }) => {
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyDto[]>([]);
  const [formData, setFormData] = useState<LeaseDto>({
    tenantId: 0,
    unitNumber: "",
    firstName: "",
    lastName: "",
    startDate: "",
    endDate: "",
    rent: 0,
    deposit: 0,
    status: ""
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
      fetchTenants();
      fetchUnits();
      fetchProperties();
    }
  }, [currentUser]);

  useEffect(() => {
      if (id) {
        setEditingId(parseInt(id));
        fetchLease(parseInt(id));
      }
    }, [id]);

  const fetchLease = async (leaseId: number) => {
    try {
      const response = await axios.get<LeaseDto>(`/api/leases/${leaseId}`);
      setFormData({
        id: response.data.id,
        unitNumber: response.data.unitNumber,
        tenantId: response.data.tenantId,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        startDate: response.data.startDate,
        endDate: response.data.endDate,
        rent: response.data.rent,
        deposit: response.data.deposit,
        status: response.data.status
      });
    } catch (err) {
      console.error("Error fetching lease:", err);
    }
  };

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

  // Show all tenants for Admin, only user's tenants for others
  const displayTenants = isAdmin 
    ? tenants 
    : tenants.filter(tenant => {
        const userProperty = allProperties.find(property => 
          units.some(unit => unit.id === tenant.unitId && unit.propertyId === property.id && property.userId === parseInt(currentUser?.id || "0"))
        );
        return userProperty !== undefined;
      });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => ({
        ...prev,
        [name]:
            name === "tenantId" || name === "rent" || name === "deposit"
                ? value === "" ? 0 : Number(value)
                : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to manage leases");
      setMessage("Please log in to manage leases.");
      setShowMessage(true);
      return;
    }

    setLoading(true);
    setError("");
    setShowMessage(false);

    try {
      if (editingId) {
        await axios.put(`/api/leases/${editingId}`, formData);
        setMessage("Lease updated successfully!");
      } else {
        await axios.post("/api/leases", formData);
        setMessage("Lease added successfully!");
      }
      setShowMessage(true);

      resetForm();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to save lease";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error saving lease:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
        unitNumber: "",
        tenantId: 0,
        firstName: "",
        lastName: "",
        startDate: "",
        endDate: "",
        rent: 0,
        deposit: 0,
        status: ""
    });
    setEditingId(null);
    setError("");
    setShowMessage(false);
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto">
        <h1 className="text-gray-800">Manage Leases</h1>
        <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
          Please log in to manage leases
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto">
      <div className="flex justify-between items-center mb-10px">
        <h1 className="text-gray-800 text-2xl font-semibold">Manage Leases</h1>
        {isAdmin && (
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Admin View - All Tenants
          </div>
        )}
      </div>
      
      <form 
        onSubmit={handleSubmit} 
        className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px"
      >
        <div className="flex justify-between items-center mb-24px">
          <h2 className="text-lg font-semibold">
            {editingId ? "Edit Lease" : "Create Lease"}
          </h2>
          {isAdmin && (
            <div className="text-sm text-gray-600">
              Can create leases for any tenant
            </div>
          )}
        </div>

        {editingId && isAdmin && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Admin Note:</strong> You are editing a lease for another user's tenant.
            </p>
          </div>
        )}

        <div className="mb-20px">
          <label htmlFor="tenantId" className="block mb-6px font-medium text-gray-700">
            Tenant
          </label>
          <select
            id="tenantId"
            name="tenantId"
            value={formData.tenantId}
            onChange={(e) => {
              const tenantId = Number(e.target.value);
              const tenant = displayTenants.find(t => t.id === tenantId);

              setFormData(prev => ({
                ...prev,
                tenantId,
                unitNumber: tenant?.unitNumber || "",
                firstName: tenant?.firstName || "",
                lastName: tenant?.lastName || ""
              }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white text-black focus:(outline-none ring-2 ring-blue-400)"
            required
          >
            <option value={0}>-- Select Tenant --</option>
            {displayTenants.map(tenant => {
              const property = allProperties.find(p => 
                units.some(u => u.id === tenant.unitId && u.propertyId === p.id)
              );
              return (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.firstName} {tenant.lastName} (Unit {tenant.unitNumber})
                  {isAdmin && property && ` - ${property.name} (Owner: ${property.userId})`}
                </option>
              );
            })}
          </select>
          {isAdmin && displayTenants.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Showing all {displayTenants.length} tenants in the system
            </p>
          )}
          {displayTenants.length === 0 && (
            <p className="text-[#dc3545] text-12px mt-5px">
              {isAdmin ? "No tenants found in the system." : "No tenants found for your properties."}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 mb-5">
          <div className="flex flex-col">
            <label
              htmlFor="startDate"
              className="mb-2 font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-100 px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white text-black focus:(outline-none ring-2 ring-blue-400)"
              required
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="endDate"
              className="mb-2 font-medium text-gray-700"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="w-105 px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white text-black focus:(outline-none ring-2 ring-blue-400)"
              required
            />
          </div>
        </div>
        {/* Rent */}
        <div className="mb-20px">
          <label htmlFor="rent" className="block mb-6px font-medium text-gray-700">
            Rent
          </label>
          <div className="flex items-center gap-8px">
            <span className="text-gray-500">$</span>
            <input
              type="number"
              id="rent"
              name="rent"
              value={formData.rent === 0 ? "" : formData.rent}
              onChange={handleInputChange}
              className="flex-1 px-12px py-10px border bg-white text-black border-gray-300 rounded-8px text-14px focus:(outline-none ring-2 ring-blue-400)"
              required
            />
          </div>
        </div>

        {/* Deposit */}
        <div className="mb-20px">
          <label htmlFor="deposit" className="block mb-6px font-medium text-gray-700">
            Deposit
          </label>
          <div className="flex items-center gap-8px">
            <span className="text-gray-500">$</span>
            <input
              type="number"
              id="deposit"
              name="deposit"
              value={formData.deposit === 0 ? "" : formData.deposit}
              onChange={handleInputChange}
              className="flex-1 px-12px py-10px bg-white text-black border border-gray-300 rounded-8px text-14px focus:(outline-none ring-2 ring-blue-400)"
              required
            />
          </div>
        </div>

        {/* Status */}
        <div className="mb-20px">
          <label htmlFor="status" className="block mb-6px font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-12px py-10px bg-white text-black border border-gray-300 rounded-8px text-14px focus:(outline-none ring-2 ring-blue-400)"
            required
          >
            <option value="">-- Select Status --</option>
            <option value="Active">Active</option>
            <option value="Terminated">Terminated</option>
            <option value="Expired">Expired</option>
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

        {/* Buttons */}
        <div className="flex flex-wrap gap-12px mt-24px">
          <button 
            type="submit" 
            disabled={loading || displayTenants.length === 0}
            className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : editingId ? "Update Lease" : "Add Lease"}
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
            to="/leases"
            className= "bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700"
          >
            View All Leases
          </Link>
        </div>
      </form>
    </div>
  );
  
};

export default EditLeases;