import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { useParams, useNavigate } from "react-router-dom";

interface MaintenanceRequestDto {
  id?: number;
  tenantId: number;
  unitNumber: string;
  description: string;
  priority: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
}

interface TenantDto {
  id: number;
  unitNumber: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface EditMaintenanceRequestsProps {
  currentUser?: UserDto;
}

export default function EditMaintenanceRequests({ currentUser }: EditMaintenanceRequestsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [currentTenant, setCurrentTenant] = useState<TenantDto | null>(null);
  const [formData, setFormData] = useState<MaintenanceRequestDto>({
    tenantId: 0,
    unitNumber: "",
    description: "",
    priority: "",
    status: "Pending",
    requestedAt: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Check user roles
  const isLandlord = currentUser?.roles?.includes("Landlord") || currentUser?.roles?.includes("Admin");
  const isStaff = currentUser?.roles?.includes("Maintenance");
  const isTenant = currentUser?.roles?.includes("Tenant");

  useEffect(() => {
    if (currentUser) {
      initializeData();
    }
  }, [currentUser, id]);

  const initializeData = async () => {
    try {
      // If editing, fetch the maintenance request
      if (id) {
        await fetchMaintenanceRequest(parseInt(id));
      }

      // Landlords and Staff need the full tenants list
      if (isLandlord || isStaff) {
        await fetchTenants();
      }
      
      // Tenants need to find their own tenant record
      if (isTenant && !id) {
        await fetchCurrentTenant();
      }
    } catch (err) {
      console.error("Error initializing data:", err);
    }
  };

  const fetchMaintenanceRequest = async (requestId: number) => {
    try {
      const response = await axios.get<MaintenanceRequestDto>(`/api/maintenancerequests/${requestId}`);
      setFormData(response.data);
    } catch (err) {
      console.error("Error fetching maintenance request:", err);
      setError("Failed to fetch maintenance request");
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      setTenants(response.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError("Failed to fetch tenants");
    }
  };

  const fetchCurrentTenant = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      // Match tenant by email - check both user's email and userName fields
      const myTenant = response.data.find(t => 
        t.email.toLowerCase() === currentUser?.email?.toLowerCase() ||
        t.email.toLowerCase() === currentUser?.userName?.toLowerCase()
      );
      
      if (myTenant) {
        setCurrentTenant(myTenant);
        setFormData(prev => ({
          ...prev,
          tenantId: myTenant.id,
          unitNumber: myTenant.unitNumber
        }));
      } else {
        setError("No tenant account found. Please contact your landlord to set up your tenant profile.");
      }
    } catch (err) {
      console.error("Error fetching tenant info:", err);
      setError("Failed to fetch tenant information");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tenantId = Number(e.target.value);
    const tenant = tenants.find(t => t.id === tenantId);
    
    setFormData(prev => ({
      ...prev,
      tenantId,
      unitNumber: tenant?.unitNumber || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to submit a maintenance request");
      return;
    }

    if (isTenant && !currentTenant) {
      setError("Tenant account not found. Please contact your landlord.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (id) {
        // Editing existing request
        await axios.put(`/api/maintenancerequests/${id}`, formData);
        setMessage("Maintenance request updated successfully!");
      } else {
        // Creating new request
        await axios.post("/api/maintenancerequests", formData);
        setMessage("Maintenance request submitted successfully!");
      }

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/maintenancerequests");
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to save maintenance request";
      setError(errorMsg);
      console.error("Error saving maintenance request:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto">
        <h1 className="text-gray-800">
          {id ? "Edit Maintenance Request" : "Submit Maintenance Request"}
        </h1>
        <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
          Please log in to {id ? "edit" : "submit"} a maintenance request
        </div>
      </div>
    );
  }

  if (isTenant && !currentTenant && !error && !id) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Submit Maintenance Request</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-blue-300 bg-blue-100 text-blue-800 text-sm">
          Loading your tenant information...
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">
        {id ? "Edit Maintenance Request" : (isTenant ? "Submit Maintenance Request" : "Create Maintenance Request")}
      </h1>

      {isTenant && currentTenant && !id && (
        <div className="mb-20px p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-blue-800 font-semibold mb-2">Your Information</h3>
          <p className="text-blue-700 text-sm">
            <strong>Name:</strong> {currentTenant.firstName} {currentTenant.lastName}<br />
            <strong>Unit:</strong> {currentTenant.unitNumber}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300"
      >
        <h2 className="text-lg font-semibold mb-24px">Request Details</h2>

        {/* Tenant Selection - Only for Landlords/Staff */}
        {(isLandlord || isStaff) && (
          <div className="mb-20px">
            <label htmlFor="tenantId" className="block mb-6px font-medium text-gray-700">
              Tenant *
            </label>
            <select
              id="tenantId"
              name="tenantId"
              value={formData.tenantId}
              onChange={handleTenantChange}
              className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
              disabled={!!id} // Can't change tenant when editing
            >
              <option value={0}>-- Select Tenant --</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.firstName} {tenant.lastName} (Unit {tenant.unitNumber})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Unit Number - Auto-filled, read-only */}
        <div className="mb-20px">
          <label htmlFor="unitNumber" className="block mb-6px font-medium text-gray-700">
            Unit Number
          </label>
          <input
            type="text"
            id="unitNumber"
            name="unitNumber"
            value={formData.unitNumber}
            className="w-full px-12px py-10px border bg-gray-100 text-gray-600 border-gray-300 rounded-8px text-14px cursor-not-allowed"
            readOnly
          />
        </div>

        {/* Description */}
        <div className="mb-20px">
          <label htmlFor="description" className="block mb-6px font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-12px py-10px border bg-white text-black border-gray-300 rounded-8px text-14px focus:(outline-none ring-2 ring-blue-400)"
            required
            placeholder="Please describe the maintenance issue in detail..."
          />
        </div>

        {/* Priority */}
        <div className="mb-20px">
          <label htmlFor="priority" className="block mb-6px font-medium text-gray-700">
            Priority *
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
          >
            <option value="">-- Select Priority --</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Status - Only for Landlords/Staff editing existing requests */}
        {(isLandlord || isStaff) && id && (
          <div className="mb-20px">
            <label htmlFor="status" className="block mb-6px font-medium text-gray-700">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        )}

        {error && (
          <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="my-4 p-4 rounded-lg shadow-inner border border-green-300 bg-green-100 text-green-800 text-sm">
            {message}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap gap-12px mt-24px">
          <button
            type="submit"
            disabled={loading || (isTenant && !currentTenant) || ((isLandlord || isStaff) && !formData.tenantId)}
            className="bg-[#667eea] text-white py-10px px-20px rounded-md text-14px hover:bg-[#5563d6] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? "Saving..." : id ? "Update Request" : "Submit Request"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/maintenancerequests")}
            disabled={loading}
            className="bg-gray-400 text-white py-10px px-20px rounded-md text-14px hover:bg-gray-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}