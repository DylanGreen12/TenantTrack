import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../models/UserDto";

interface MaintenanceRequestDto {
  id?: number;
  tenantId: string; 
  description: string;
  status: string;
  priority: string;
  assignedTo?: string | null; 
  requestedAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
}

interface TenantDto {
  id: string; 
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
    tenantId: "",
    description: "",
    status: "Open",
    priority: "Medium",
    assignedTo: null,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTenants();
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
      const response = await axios.get<MaintenanceRequestDto[]>("/api/maintenanceRequests");
      if (currentUser?.roles?.includes("Tenant")) {
        setRequests(response.data.filter((r) => r.tenantId === currentUser.id));
      } else {
        setRequests(response.data);
      }
    } catch (err) {
      setError("Failed to fetch maintenance requests");
      console.error("Error fetching maintenance requests:", err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenantId) {
      setError("Please select a tenant");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (editingId) {
        await axios.put(`/api/maintenanceRequests/${editingId}`, formData);
      } else {
        await axios.post("/api/maintenanceRequests", formData);
      }

      setFormData({
        tenantId: "",
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

  const handleCancel = async (id: number) => {
    if (!window.confirm("Cancel this request?")) return;
    try {
      await axios.put(`/api/maintenanceRequests/${id}`, { status: "Cancelled" });
      await fetchRequests();
    } catch (err) {
      console.error("Error cancelling request:", err);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await axios.put(`/api/maintenanceRequests/${id}`, { status });
      await fetchRequests();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  if (!currentUser) {
    return (
      <div className="maintenance-requests-page">
        <h1>Maintenance Requests</h1>
        <div className="error-message">Please log in to view maintenance requests</div>
      </div>
    );
  }

  return (
    <div className="maintenance-requests-page">
      <h1>Maintenance Requests</h1>
      <p className="user-info">Logged in as: {currentUser.userName}</p>

      <form onSubmit={handleSubmit} className="request-form">
        <h2>{editingId ? "Edit Request" : "Submit a New Request"}</h2>

        <div className="form-group">
          <label htmlFor="tenantId">Tenant:</label>
          <select
            id="tenantId"
            name="tenantId"
            value={formData.tenantId}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Select Tenant --</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName} (Unit {t.unitNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority:</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Emergency</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : editingId ? "Update Request" : "Submit Request"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({
                tenantId: "",
                description: "",
                status: "Open",
                priority: "Medium",
                assignedTo: null,
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <div className="requests-list">
        <h2>{currentUser.roles?.includes("Tenant") ? "My Requests" : "All Requests"}</h2>
        {requests.length === 0 ? (
          <p>No maintenance requests found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Tenant ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.description}</td>
                  <td>{req.priority}</td>
                  <td>{req.status}</td>
                  <td>{req.requestedAt ? new Date(req.requestedAt).toLocaleString() : "-"}</td>
                  <td>{req.tenantId}</td>
                  <td>
                    {req.status === "Open" && (
                      <>
                        <button onClick={() => handleEdit(req)}>Edit</button>
                        <button onClick={() => handleCancel(req.id!)}>Cancel</button>
                      </>
                    )}
                    {!currentUser.roles?.includes("Tenant") && (
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id!, e.target.value)}
                      >
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
