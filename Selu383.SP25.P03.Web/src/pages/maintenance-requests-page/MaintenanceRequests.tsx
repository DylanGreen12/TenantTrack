import { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { Link } from "react-router-dom";

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

interface MaintenanceRequestsProps {
  currentUser?: UserDto;
}

export default function MaintenanceRequests({ currentUser }: MaintenanceRequestsProps) {
  const [requests, setRequests] = useState<MaintenanceRequestDto[]>([]);
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  // Check user roles
  const isLandlord = currentUser?.roles?.includes("Landlord") || currentUser?.roles?.includes("Admin");
  const isTenant = currentUser?.roles?.includes("Tenant");

  useEffect(() => {
    if (isLandlord) {
      fetchTenants();
    }
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
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get<MaintenanceRequestDto[]>("/api/maintenancerequests");
      setRequests(response.data);
    } catch (err) {
      setError("Failed to fetch maintenance requests");
      console.error("Error fetching requests:", err);
    }
  };

  const getTenantName = (tenantId: number): string => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName} (Unit ${tenant.unitNumber})` : `Tenant ID: ${tenantId}`;
  };

  const handleStatusUpdate = async (requestId: number, newStatus: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      await axios.put(`/api/maintenancerequests/${requestId}`, {
        ...request,
        status: newStatus
      });
      setMessage("Request status updated successfully!");
      setShowMessage(true);
      await fetchRequests();
    } catch (err) {
      console.error("Error updating request status:", err);
      setError("Failed to update request status");
      setShowMessage(true);
    }
  };

  const handlePriorityUpdate = async (requestId: number, newPriority: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      await axios.put(`/api/maintenancerequests/${requestId}`, {
        ...request,
        priority: newPriority
      });
      setMessage("Request priority updated successfully!");
      setShowMessage(true);
      await fetchRequests();
    } catch (err) {
      console.error("Error updating request priority:", err);
      setError("Failed to update request priority");
      setShowMessage(true);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Maintenance Requests</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
          Please log in to view maintenance requests
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Maintenance Requests</h1>

      {/* Action buttons */}
      <div className="mb-20px flex gap-10px">
        <Link
          to="/editmaintenancerequests"
          className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 transition-colors inline-block"
        >
          {isLandlord ? "Create New Request" : "Submit Request"}
        </Link>
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

      <div className="requests-list">
        <h2 className="text-lg font-semibold mb-10px text-gray-800">
          {isLandlord && `All Requests (${requests.length})`}
          {isTenant && `My Requests (${requests.length})`}
        </h2>
        
        {isTenant && (
          <p className="text-gray-600 mb-10px text-sm">
            View your maintenance requests below. Use "Submit Request" to create a new one.
          </p>
        )}

        {requests.length === 0 ? (
          <p className="text-gray-600">No maintenance requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse mt-5 text-sm bg-[#fdfefe] rounded-lg overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-[#f3f4f6]">
                  {isLandlord && <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Tenant</th>}
                  <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Description</th>
                  <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Priority</th>
                  <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Status</th>
                  <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Requested</th>
                  {isLandlord && <th className="p-12px text-left border-b font-semibold text-[#374151]">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((request, i) => (
                  <tr
                    key={request.id}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"} hover:bg-[#ebf5ff] transition-colors`}
                  >
                    {isLandlord && (
                      <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                        {getTenantName(request.tenantId)}
                      </td>
                    )}
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827] max-w-xs">
                      <div className="truncate" title={request.description}>
                        {request.description}
                      </div>
                    </td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                      {isLandlord ? (
                        <select
                          value={request.priority}
                          onChange={(e) => handlePriorityUpdate(request.id!, e.target.value)}
                          className={`px-2 py-1 rounded-md text-12px border-none ${
                            request.priority === 'Emergency' ? 'bg-red-600 text-white' :
                            request.priority === 'High' ? 'bg-orange-500 text-white' :
                            request.priority === 'Medium' ? 'bg-yellow-500 text-white' :
                            'bg-green-600 text-white'
                          }`}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Emergency">Emergency</option>
                        </select>
                      ) : (
                        <span className={`py-4px px-8px rounded-4px text-12px inline-block ${
                          request.priority === 'Emergency' ? 'bg-red-600 text-white' :
                          request.priority === 'High' ? 'bg-orange-500 text-white' :
                          request.priority === 'Medium' ? 'bg-yellow-500 text-white' :
                          'bg-green-600 text-white'
                        }`}>
                          {request.priority}
                        </span>
                      )}
                    </td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                      {isLandlord ? (
                        <select
                          value={request.status}
                          onChange={(e) => handleStatusUpdate(request.id!, e.target.value)}
                          className={`px-2 py-1 rounded-md text-12px border-none ${
                            request.status === 'Completed' ? 'bg-green-600 text-white' :
                            request.status === 'In Progress' ? 'bg-blue-500 text-white' :
                            request.status === 'Open' ? 'bg-yellow-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`py-4px px-8px rounded-4px text-12px inline-block ${
                          request.status === 'Completed' ? 'bg-green-600 text-white' :
                          request.status === 'In Progress' ? 'bg-blue-500 text-white' :
                          request.status === 'Open' ? 'bg-yellow-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {request.status}
                        </span>
                      )}
                    </td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                      {formatDate(request.requestedAt)}
                    </td>
                    {isLandlord && (
                      <td className="p-12px border-b text-[#111827]">
                        <Link
                          to={`/editmaintenancerequests/${request.id}`}
                          className="text-blue-600 hover:text-blue-800 text-12px underline"
                        >
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}