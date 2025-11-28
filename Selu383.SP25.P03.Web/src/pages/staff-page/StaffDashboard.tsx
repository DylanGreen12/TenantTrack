import { useEffect, useState } from "react";
import { UserDto } from "../../models/UserDto";
import axios from "axios";

interface MaintenanceRequestDto {
  id: number;
  tenantId: number;
  unitNumber: string;
  description: string;
  status: string;
  priority: string;
  staffId?: number;
  requestedAt: string;
  updatedAt?: string;
  completedAt?: string;
}

interface TenantDto {
  id: number;
  unitNumber: string;
  firstName: string;
  lastName: string;
}

interface StaffDashboardProps {
  currentUser?: UserDto;
}

export default function StaffDashboard({ currentUser }: StaffDashboardProps) {
  const [requests, setRequests] = useState<MaintenanceRequestDto[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const getTenantName = (tenantId: number): string => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName}` : `Unknown Tenant (ID: ${tenantId})`;
  };

  useEffect(() => {
    if (currentUser)
      loadRequests();
      fetchTenants();
      fetchMaintenanceRequests();
  }, [currentUser]);

  const loadRequests = async () => {
      try {
        const response = await axios.get("/api/staff/my-requests");
        setRequests(response.data);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

  const fetchTenants = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      setTenants(response.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
    }
  };

  const fetchMaintenanceRequests = async () => {
    try {
      const response = await axios.get<MaintenanceRequestDto[]>("/api/MaintenanceRequests");
      setMaintenanceRequests(response.data);
    } catch (err) {
      console.error("Error fetching MaintenanceRequests:", err);
    }
  };

  const statusClass = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-400 text-black px-2 py-1 rounded";
      case "In Progress":
        return "bg-blue-500 text-white px-2 py-1 rounded";
      case "Completed":
        return "bg-green-600 text-white px-2 py-1 rounded";
      default:
        return "bg-gray-400 text-white px-2 py-1 rounded";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <div className="i-line-md-loading-loop text-4xl text-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-20 text-red-600 text-xl">
        {error}
      </div>
    );
  }

  const handleStatusUpdate = async (requestId: number, newStatus: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      await axios.put(`/api/maintenancerequests/${requestId}`, {
        ...request,
        status: newStatus,
        completedAt: newStatus === 'Completed' ? new Date().toISOString() : request.completedAt
      });
      setMessage("Maintenance request status updated successfully!");
      setShowMessage(true);
      await loadRequests();
    } catch (err) {
      console.error("Error updating maintenance request status:", err);
      setError("Failed to update maintenance request status");
      setShowMessage(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold mb-6">Assigned Maintenance Requests</h1>

      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
        <table className="w-full border-collapse text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-4 border-b">Tenant</th>
              <th className="p-4 border-b">Unit</th>
              <th className="p-4 border-b">Description</th>
              <th className="p-4 border-b">Priority</th>
              <th className="p-4 border-b">Status</th>
              <th className="p-4 border-b">Date Requested</th>
            </tr>
          </thead>

          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-6 text-gray-500">
                  No assigned maintenance requests.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 border-b">{getTenantName(r.tenantId)}</td>
                  <td className="p-4 border-b">{r.unitNumber}</td>
                  <td className="p-4 border-b">{r.description}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                    <span className={`py-4px px-8px rounded-4px text-12px inline-block ${
                      r.priority === 'High' ? 'bg-[#764ba2] text-white' :
                      r.priority === 'Medium' ? 'bg-[#8b5cf6] text-white' :
                      'bg-[#a78bfa] text-white'
                    }`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                    <select
                      value={r.status}
                      onChange={(e) => handleStatusUpdate(r.id!, e.target.value)}
                      className={`px-2 py-1 rounded-md text-12px border ${
                        r.status === 'Completed' ? 'bg-white text-gray-800 border-gray-300' :
                        r.status === 'In Progress' ? 'bg-[#3b82f6] text-white border-none' :
                        'bg-[#c7d2fe] text-gray-800 border-none'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="p-4 border-b">
                    {new Date(r.requestedAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
    </div>
  );
}
