import { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../models/UserDto";

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

interface MaintenanceRequestsPageProps {
  currentUser?: UserDto;
}

export default function MaintenanceRequestsPage({ currentUser }: MaintenanceRequestsPageProps) {
  const [requests, setRequests] = useState<MaintenanceRequestDto[]>([]);
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [formData, setFormData] = useState<MaintenanceRequestDto>({
    tenantId: 0,
    description: "",
    status: "Open",
    priority: "Medium",
    assignedTo: null,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check user roles
  const isLandlord = currentUser?.roles?.includes("Landlord") || currentUser?.roles?.includes("Admin");
  const isTenant = currentUser?.roles?.includes("Tenant");
  const isStaff = currentUser?.roles?.includes("Staff");

  useEffect(() => {
    fetchTenants(); // Always fetch tenants for name lookup
    if (currentUser) {
      fetchRequests();
    }
  }, [currentUser]);

  const fetchTenants = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      setTenants(response.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError("Failed to fetch tenants");
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get<MaintenanceRequestDto[]>("/api/maintenancerequests");
      setRequests(response.data);
    } catch (err) {
      setError("Failed to fetch maintenance requests");
      console.error("Error fetching maintenance requests:", err);
    }
  };

  const getTenantName = (tenantId: number): string => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName} (Unit ${tenant.unitNumber})` : `Tenant ID: ${tenantId}`;
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
    if (!formData.tenantId || formData.tenantId === 0) {
      setError("Please select a tenant");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (editingId) {
        await axios.put(`/api/maintenancerequests/${editingId}`, formData);
      } else {
        await axios.post("/api/maintenancerequests", formData);
      }

      setFormData({
        tenantId: 0,
        description: "",
        status: "Open",
        priority: "Medium",
        assignedTo: null,
      });
      setEditingId(null);
      await fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (req: MaintenanceRequestDto) => {
    setFormData({
      tenantId: req.tenantId,
      description: req.description,
      status: req.status,
      priority: req.priority,
      assignedTo: req.assignedTo || null,
    });
    setEditingId(req.id!);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this request?")) return;
    try {
      await axios.delete(`/api/maintenancerequests/${id}`);
      await fetchRequests();
    } catch (err) {
      console.error("Error deleting request:", err);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const request = requests.find(r => r.id === id);
      if (!request) return;
      
      await axios.put(`/api/maintenancerequests/${id}`, {
        ...request,
        status
      });
      await fetchRequests();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto">
        <h1 className="text-gray-800">Maintenance Requests</h1>
        <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
          Please log in to view maintenance requests
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto">
      <h1 className="text-gray-800">Maintenance Requests</h1>
      <p className="text-gray-700">Logged in as: {currentUser.userName} ({currentUser.roles?.join(", ")})</p>

      {/* Only Landlords can create requests for any tenant */}
      {isLandlord && (
        <form onSubmit={handleSubmit} className="bg-[#00061f] text-white p-20px rounded-8px mb-30px">
          <h2>{editingId ? "Edit Request" : "Submit a New Request"}</h2>

          <div className="mb-15px">
            <label htmlFor="tenantId" className="block mb-5px font-bold">Tenant:</label>
            <select
              id="tenantId"
              name="tenantId"
              value={formData.tenantId}
              onChange={handleInputChange}
              className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px text-black"
              required
            >
              <option value={0}>-- Select Tenant --</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} (Unit {t.unitNumber})
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
              className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px text-black"
              required
              rows={3}
            />
          </div>

          <div className="mb-15px">
            <label htmlFor="priority" className="block mb-5px font-bold">Priority:</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px text-black"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Emergency</option>
            </select>
          </div>

          {error && (
            <div className="text-[#721c24] my-10px py-10px px-15px bg-[#f8d7da] border border-[#f5c6cb] rounded-4px">
              {error}
            </div>
          )}

          <div className="flex gap-10px mt-20px">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#007bff] text-white py-10px px-20px border-none rounded-4px cursor-pointer text-14px hover:bg-[#0056b3] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : editingId ? "Update Request" : "Submit Request"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    tenantId: 0,
                    description: "",
                    status: "Open",
                    priority: "Medium",
                    assignedTo: null,
                  });
                }}
                className="bg-[#6c757d] text-white py-10px px-20px border-none rounded-4px cursor-pointer text-14px hover:bg-[#545b62] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="requests-list">
        <h2>
          {isLandlord && `All Requests (${requests.length})`}
          {isTenant && `Tenant View (${requests.length})`}
          {isStaff && `All Requests - Staff View (${requests.length})`}
        </h2>
        
        {!isLandlord && !isStaff && (
          <p className="text-gray-600 mb-10px">
            Tenants: Contact your landlord to submit maintenance requests.
          </p>
        )}

        {requests.length === 0 ? (
          <p>No maintenance requests found.</p>
        ) : (
          <table className="w-full text-white border-collapse mt-20px">
            <thead>
              <tr>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Tenant</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Description</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Priority</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Status</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Requested</th>
                {(isLandlord || isStaff) && (
                  <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="bg-[#322c35]">
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{getTenantName(req.tenantId)}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{req.description}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{req.priority}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">
                    {(isLandlord || isStaff) ? (
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id!, e.target.value)}
                        className="bg-[#00061f] text-white p-4px rounded-4px border-1 border-[#ddd]"
                      >
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                      </select>
                    ) : (
                      req.status
                    )}
                  </td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">
                    {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : "-"}
                  </td>
                  {(isLandlord || isStaff) && (
                    <td className="p-12px text-left border-b-1 border-[#ddd]">
                      {isLandlord && (
                        <>
                          <button
                            onClick={() => handleEdit(req)}
                            disabled={loading}
                            className="bg-[#28a745] text-white py-6px px-12px mr-5px border-none rounded-4px cursor-pointer text-12px hover:bg-[#1e7e34] disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => req.id && handleDelete(req.id)}
                            disabled={loading}
                            className="bg-[#dc3545] text-white py-6px px-12px border-none rounded-4px cursor-pointer text-12px hover:bg-[#c82333] disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {isStaff && <span className="text-gray-400 text-12px">Status update only</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}