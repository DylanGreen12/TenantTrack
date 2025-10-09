import { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { Link } from "react-router-dom";

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

interface MaintenanceRequestsProps {
  currentUser?: UserDto;
}

export default function MaintenanceRequests({ currentUser }: MaintenanceRequestsProps) {
  const [requests, setRequests] = useState<MaintenanceRequestDto[]>([]);
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Check user roles
  const isLandlord = currentUser?.roles?.includes("Landlord") || currentUser?.roles?.includes("Admin");
  const isStaff = currentUser?.roles?.includes("Maintenance");
  const isTenant = currentUser?.roles?.includes("Tenant");

  useEffect(() => {
    if (currentUser) {
      initializeData();
    }
  }, [currentUser]);

  const initializeData = async () => {
    try {
      let tenantId: number | null = null;
      
      // Landlords and Staff need the tenants list for display
      if (isLandlord || isStaff) {
        await fetchTenants();
      }
      
      // Tenants need to find their tenant record first
      if (isTenant) {
        tenantId = await fetchCurrentTenantId();
      }
      
      // Then fetch maintenance requests with the tenant ID
      await fetchMaintenanceRequests(tenantId);
    } catch (err) {
      console.error("Error initializing data:", err);
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

  const fetchCurrentTenantId = async (): Promise<number | null> => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      const myTenant = response.data.find(t => 
        t.email.toLowerCase() === currentUser?.email?.toLowerCase() ||
        t.email.toLowerCase() === currentUser?.userName?.toLowerCase()
      );
      if (myTenant) {
        setCurrentTenantId(myTenant.id);
        return myTenant.id; // Return it!
      } else {
        setError("No tenant account found for your user. Please contact your landlord.");
        return null;
      }
    } catch (err) {
      console.error("Error fetching tenant info:", err);
      setError("Failed to fetch tenant information");
      return null;
    }
  };

  const fetchMaintenanceRequests = async (tenantIdOverride?: number | null) => {
    try {
      const response = await axios.get<MaintenanceRequestDto[]>("/api/maintenancerequests");
      
      // Use the passed-in ID or fall back to state
      const effectiveTenantId = tenantIdOverride !== undefined ? tenantIdOverride : currentTenantId;
      
      // DEBUG
      console.log("=== MAINTENANCE DEBUG ===");
      console.log("Effective Tenant ID:", effectiveTenantId);
      console.log("All Requests:", response.data.map(r => ({ id: r.id, tenantId: r.tenantId, description: r.description })));
      console.log("=== END DEBUG ===");
      
      let filteredRequests = response.data;

      if (isTenant) {
        if (effectiveTenantId !== null) {
          filteredRequests = response.data.filter(r => r.tenantId === effectiveTenantId);
          console.log("Filtered for tenant:", filteredRequests);
        } else {
          filteredRequests = [];
        }
      }

      setRequests(filteredRequests);
    } catch (err) {
      setError("Failed to fetch maintenance requests");
      console.error("Error fetching maintenance requests:", err);
    }
  };

  const getTenantName = (tenantId: number): string => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName}` : `Tenant ID: ${tenantId}`;
  };

  const getTenantUnit = (tenantId: number): string => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.unitNumber : '';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // Filter requests based on search term
  const filteredRequests = requests.filter(request => {
    if (!searchTerm) return true;

    const tenantName = getTenantName(request.tenantId).toLowerCase();
    const unitNumber = request.unitNumber.toLowerCase();
    const description = request.description.toLowerCase();
    const search = searchTerm.toLowerCase();

    return tenantName.includes(search) || unitNumber.includes(search) || description.includes(search);
  });

  const handleStatusUpdate = async (requestId: number, newStatus: string) => {
    // Only landlords and staff can update status
    if (!isLandlord && !isStaff) {
      setError("You don't have permission to update maintenance request status");
      setShowMessage(true);
      return;
    }

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
      await fetchMaintenanceRequests();
    } catch (err) {
      console.error("Error updating maintenance request status:", err);
      setError("Failed to update maintenance request status");
      setShowMessage(true);
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
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">
        {isLandlord && "Maintenance Requests"}
        {isStaff && "Maintenance Requests"}
        {isTenant && "My Maintenance Requests"}
      </h1>

      {/* Action button */}
      <div className="mb-20px flex gap-10px">
        {(!isTenant || (isTenant && currentTenantId)) && (
          <Link
            to="/editmaintenancerequests"
            className="bg-[#667eea] text-white py-10px px-20px rounded-md text-14px hover:bg-[#5563d6] transition-colors inline-block shadow-sm"
          >
            {isTenant ? "Submit New Request" : "Create Maintenance Request"}
          </Link>
        )}
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

      <div className="maintenance-requests-list bg-white shadow-lg p-24px rounded-12px border border-gray-300">
        <div className="flex justify-between items-center mb-10px">
          <h2 className="text-lg font-semibold text-gray-800">
            {(isLandlord || isStaff) && `All Maintenance Requests (${filteredRequests.length}${searchTerm ? ` of ${requests.length}` : ''})`}
            {isTenant && `Request History (${requests.length})`}
          </h2>

          {/* Search box for landlords/staff */}
          {(isLandlord || isStaff) && (
            <input
              type="text"
              placeholder="Search by name, unit, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-200 bg-gray-50 text-gray-800 rounded-lg text-sm focus:(outline-none ring-2 ring-[#667eea] bg-white) w-80"
            />
          )}
        </div>
        
        {isTenant && !currentTenantId && (
          <div className="my-4 p-4 rounded-lg shadow-inner border border-yellow-300 bg-yellow-100 text-yellow-800 text-sm">
            <strong>No tenant account found.</strong> You need to apply for a unit first. 
            Visit the <a href="/properties" className="underline font-semibold">View Properties</a> page to apply for a unit.
          </div>
        )}
        
        {isTenant && currentTenantId && (
          <p className="text-gray-600 mb-10px text-sm">
            View your maintenance request history below. Use "Submit New Request" to create a new request.
          </p>
        )}

        {filteredRequests.length === 0 && requests.length === 0 && (!isTenant || currentTenantId) ? (
          <p className="text-gray-600">No maintenance requests found.</p>
        ) : filteredRequests.length === 0 && searchTerm ? (
          <p className="text-gray-600">No requests match your search.</p>
        ) : filteredRequests.length > 0 ? (
          <table className="w-full border-collapse mt-5 text-sm bg-[#fdfefe] rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-[#f3f4f6]">
                {(isLandlord || isStaff) && <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Tenant</th>}
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Unit</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Description</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Priority</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Status</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Date Requested</th>
                {(isLandlord || isStaff) && <th className="p-12px text-left border-b font-semibold text-[#374151]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request, i) => (
                <tr
                  key={request.id}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"} hover:bg-[#ebf5ff] transition-colors`}
                >
                  {(isLandlord || isStaff) && <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{getTenantName(request.tenantId)}</td>}
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{request.unitNumber}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{request.description}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                    <span className={`py-4px px-8px rounded-4px text-12px inline-block ${
                      request.priority === 'High' ? 'bg-[#764ba2] text-white' :
                      request.priority === 'Medium' ? 'bg-[#8b5cf6] text-white' :
                      'bg-[#a78bfa] text-white'
                    }`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                    {(isLandlord || isStaff) ? (
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusUpdate(request.id!, e.target.value)}
                        className={`px-2 py-1 rounded-md text-12px border ${
                          request.status === 'Completed' ? 'bg-white text-gray-800 border-gray-300' :
                          request.status === 'In Progress' ? 'bg-[#3b82f6] text-white border-none' :
                          'bg-[#c7d2fe] text-gray-800 border-none'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : (
                      <span className={`py-4px px-8px rounded-4px text-12px inline-block ${
                        request.status === 'Completed' ? 'bg-white text-gray-800 border border-gray-300' :
                        request.status === 'In Progress' ? 'bg-[#3b82f6] text-white' :
                        'bg-[#c7d2fe] text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    )}
                  </td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{formatDate(request.requestedAt)}</td>
                  {(isLandlord || isStaff) && (
                    <td className="p-12px border-b text-[#111827]">
                      <Link
                        to={`/editmaintenancerequests/${request.id}`}
                        className="text-blue-500 hover:text-blue-700 text-12px"
                      >
                        Edit
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}