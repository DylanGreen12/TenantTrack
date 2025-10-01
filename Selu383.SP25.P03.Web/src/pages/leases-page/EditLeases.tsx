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

  // Filter properties to only show current user's properties
  const userProperties = allProperties.filter(property => 
    currentUser && property.userId === parseInt(currentUser.id)
  );

  // Filter tenants to only show tenants from user's properties
  const userTenants = tenants.filter(tenant => 
    userProperties.some(property => 
      units.some(unit => unit.id === tenant.unitId && unit.propertyId === property.id)
    )
  );

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
      <h1 className="text-gray-800">Manage Leases</h1>
      <p className="text-gray-700">Logged in as: {currentUser.userName} (ID: {currentUser.id})</p>
      
      <form onSubmit={handleSubmit} className="bg-[#00061f] text-white p-20px rounded-8px mb-30px">
        <h2>{editingId ? "Edit Lease" : "Add New Lease"}</h2>
        
        <div className="mb-15px">
          <label htmlFor="tenantId" className="block mb-5px font-bold">Tenant:</label>
          <select
            id="tenantId"
            name="tenantId"
            value={formData.tenantId}
            onChange={(e) => {
              const tenantId = Number(e.target.value);
              const tenant = userTenants.find(t => t.id === tenantId);

              setFormData(prev => ({
                ...prev,
                tenantId,
                unitNumber: tenant?.unitNumber || "",
                firstName: tenant?.firstName || "",
                lastName: tenant?.lastName || ""
              }));
            }}
            className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
            required
          >
            <option value={0}>-- Select Tenant --</option>
            {userTenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.firstName} {tenant.lastName} (Unit {tenant.unitNumber})
              </option>
            ))}
          </select>
          {userTenants.length === 0 && (
            <p className="text-[#dc3545] text-12px mt-5px">No tenants found for your properties.</p>
          )}
        </div>

        <div className="mb-15px">
            <label htmlFor="startDate" className="block mb-5px font-bold">Start Date:</label>
            <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
                required
            />
        </div>

        <div className="mb-15px">
            <label htmlFor="endDate" className="block mb-5px font-bold">End Date:</label>
            <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
                required
            />
        </div>

        <div className="mb-15px">
            <label htmlFor="rent" className="block mb-5px font-bold">Rent:</label>
            <div className="flex items-center gap-5px">
                <span>$</span>
                <input
                    type="number"
                    id="rent"
                    name="rent"
                    value={formData.rent === 0 ? "" : formData.rent}
                    onChange={handleInputChange}
                    className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
                    required
                />
            </div>
        </div>

        <div className="mb-15px">
            <label htmlFor="deposit" className="block mb-5px font-bold">Deposit:</label>
            <div className="flex items-center gap-5px">
                <span>$</span>
                <input
                    type="number"
                    id="deposit"
                    name="deposit"
                    value={formData.deposit === 0 ? "" : formData.deposit}
                    onChange={handleInputChange}
                    className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px"
                    required
                />
            </div>
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
                <option value="">-- Select Status --</option>
                <option value="Active">Active</option>
                <option value="Terminated">Terminated</option>
                <option value="Expired">Expired</option>
            </select>
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
            disabled={loading || userTenants.length === 0}
            className="bg-[#007bff] text-white py-10px px-20px border-none rounded-4px cursor-pointer text-14px hover:bg-[#0056b3] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : editingId ? "Update Lease" : "Add Lease"}
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
          <Link 
            to="/leases"
            className="bg-green-600 text-white py-2 px-4 rounded-md text-sm hover:bg-green-700 transition-colors duration-200"
          >
            View All Leases
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EditLeases;