import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/EditProperties.css";

interface LeaseDto {
  id?: number;
  tenantId: number;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  status: string;
}

export default function EditLeases() {
  const [leases, setLeases] = useState<LeaseDto[]>([]);
  const [formData, setFormData] = useState<LeaseDto>({
    tenantId: 0,
    startDate: "",
    endDate: "",
    rent: 0,
    deposit: 0,
    status: ""
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeases();
  }, []);

  const fetchLeases = async () => {
    try {
      const response = await axios.get<LeaseDto[]>("/api/leases");
      setLeases(response.data);
    } catch (err) {
      setError("Failed to fetch leases");
      console.error("Error fetching leases:", err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => ({
        ...prev,
        [name]:
            name === "tenantId" || name === "rent" || name === "deposit"
                ? value === "" ? "" : Number(value)  // allow empty string
                : value,
    }));
  };
/*
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "userId" ? parseInt(value) || 0 : value
    }));
  };
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editingId) {
        // Update existing lease
        await axios.put(`/api/leases/${editingId}`, formData);
      } else {
        // Create new lease
        await axios.post("/api/leases", formData);
      }

      resetForm();
      await fetchLeases();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save lease");
      console.error("Error saving lease:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lease: LeaseDto) => {
    setFormData({
      tenantId: lease.tenantId,
      startDate: lease.startDate,
      endDate: lease.endDate,
      rent: lease.rent,
      deposit: lease.deposit,
      status: lease.status,
    });
    setEditingId(lease.id || null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this lease?")) {
      return;
    }

    try {
      await axios.delete(`/api/leases/${id}`);
      await fetchLeases();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete lease");
      console.error("Error deleting lease:", err);
    }
  };

  const resetForm = () => {
    setFormData({
        tenantId: 0,
        startDate: "",
        endDate: "",
        rent: 0,
        deposit: 0,
        status: ""
    });
    setEditingId(null);
    setError("");
  };

 

  return (
    <div className="edit-leases">
      <h1>Manage Leases</h1>
      
      <form onSubmit={handleSubmit} className="lease-form">
        <h2>{editingId ? "Edit Lease" : "Add New Lease"}</h2>
        
        <div className="form-group">
          <label htmlFor="name">TenantId:</label>
          <input
            type="number"
            id="tenantId"
            name="tenantId"
            value={formData.tenantId}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
            />
        </div>

        <div className="form-group">
            <label htmlFor="endDate">End Date:</label>
            <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
            />
        </div>

        <div className="form-group">
            <label htmlFor="rent">Rent:</label>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span>$</span>
                <input
                    type="number"
                    id="rent"
                    name="rent"
                    value={formData.rent}
                    onChange={handleInputChange}
                    required
                />
            </div>
        </div>

        <div className="form-group">
            <label htmlFor="deposit">Deposit:</label>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span>$</span>
                <input
                    type="number"
                    id="deposit"
                    name="deposit"
                    value={formData.deposit}
                    onChange={handleInputChange}
                    required
                />
            </div>
        </div>

        <div className="form-group">
            <label htmlFor="status">Status:</label>
            <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
            >     
                <option value="">-- Select Status --</option>
                <option value="Active">Active</option>
                <option value="Terminated">Terminated</option>
                <option value="Expired">Expired</option>
            </select>
        </div>


        {error && <div className="error-message">{error}</div>}

        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : editingId ? "Update Lease" : "Add Lease"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="leases-list">
        <h2>Leases</h2>
        {leases.length === 0 ? (
          <p>No leases found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>TenantId</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Rent</th>
                <th>Deposit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leases.map(lease=> (
                <tr key={lease.id}>
                  <td>{lease.tenantId}</td>
                  <td>{lease.startDate}</td>
                  <td>{lease.endDate}</td>
                  <td>{lease.rent}</td>
                  <td>{lease.deposit}</td>
                  <td>{lease.status}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(lease)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => lease.id && handleDelete(lease.id)}
                      disabled={loading}
                      className="delete-btn"
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
}