import { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto"; // Adjusted path to match the correct location
import { useParams, Link } from "react-router-dom";

interface MaintenanceRequestDto {
  id?: number;
  tenantId: number;
  description: string;
  status: string;
  priority: string;
  assignedTo?: number | null;
  requestedAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
}

interface TenantDto {
  id: number;
  unitNumber: string;
  firstName: string;
  lastName: string;
}

interface EditMaintenanceRequestsProps {
  currentUser?: UserDto;
}

export default function EditMaintenanceRequests({ currentUser }: EditMaintenanceRequestsProps) {
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [formData, setFormData] = useState<MaintenanceRequestDto>({
    tenantId: 0,
    description: "",
    status: "Open",
    priority: "Medium",
    assignedTo: null,
  });
  const { id } = useParams<{ id: string }>();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  // Check user roles
  const isLandlord = currentUser?.roles?.includes("Landlord") || currentUser?.roles?.includes("Admin");
  const isTenant = currentUser?.roles?.includes("Tenant");

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (id) {
      setEditingId(parseInt(id));
      fetchRequest(parseInt(id));
    }
  }, [id]);

  const fetchTenants = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      setTenants(response.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError("Failed to fetch tenants");
    }
  };

  const fetchRequest = async (requestId: number) => {
    try {
      const response = await axios.get<MaintenanceRequestDto>(`/api/maintenancerequests/${requestId}`);
      setFormData({
        tenantId: response.data.tenantId,
        description: response.data.description,
        status: response.data.status,
        priority: response.data.priority,
        assignedTo: response.data.assignedTo || null,
      });
    } catch (err) {
      console.error("Error fetching request:", err);
      setError("Failed to fetch request");
      setShowMessage(true);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "tenantId" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to submit a request");
      setShowMessage(true);
      return;
    }

    if (!formData.tenantId || formData.tenantId === 0) {
      setError("Please select a tenant");
      setShowMessage(true);
      return;
    }

    setLoading(true);
    setError("");
    setShowMessage(false);

    try {
      if (editingId) {
        await axios.put(`/api/maintenancerequests/${editingId}`, formData);
        setMessage("Request updated successfully!");
      } else {
        await axios.post("/api/maintenancerequests", formData);
        setMessage("Request submitted successfully!");
      }
      setShowMessage(true);
      resetForm();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to submit request";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tenantId: 0,
      description: "",
      status: "Open",
      priority: "Medium",
      assignedTo: null,
    });
    setEditingId(null);
    setError("");
    setShowMessage(false);
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Maintenance Request</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
          Please log in to submit maintenance requests
        </div>
      </div>
    );
  }

  if (!isLandlord && !isTenant) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Maintenance Request</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
          You don't have permission to submit maintenance requests
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">
        {editingId ? "Edit Maintenance Request" : "Submit Maintenance Request"}
      </h1>

      <form 
        onSubmit={handleSubmit}
        className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px"
      >
        <h2 className="text-lg font-semibold mb-24px">
          {editingId ? "Edit Request" : "New Request"}
        </h2>

        <div className="mb-20px">
          <label htmlFor="tenantId" className="block mb-6px font-medium text-gray-700">
            Tenant
          </label>
          <select
            id="tenantId"
            name="tenantId"
            value={formData.tenantId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
            disabled={isTenant && !isLandlord}
          >
            <option value={0}>-- Select Tenant --</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName} (Unit {t.unitNumber})
              </option>
            ))}
          </select>
          {isTenant && !isLandlord && (
            <p className="text-gray-500 text-12px mt-5px">
              Select your tenant profile from the dropdown
            </p>
          )}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
            rows={4}
            placeholder="Describe the maintenance issue..."
          />
        </div>

        <div className="mb-20px">
          <label htmlFor="priority" className="block mb-6px font-medium text-gray-700">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Emergency</option>
          </select>
        </div>

        {error && showMessage && (
          <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
            {error}
          </div>
        )}

        {!error && message && showMessage && (
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
            {loading ? "Submitting..." : editingId ? "Update Request" : "Submit Request"}
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
            to="/maintenancerequests"
            className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 inline-block"
          >
            View All Requests
          </Link>
        </div>
      </form>
    </div>
  );
}