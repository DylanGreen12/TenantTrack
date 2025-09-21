import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/EditTenants.css"

interface TenantDto {
  id?: number;
  unitId: number;
  unitNumber: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface UnitDto {
  id: number;
  unitNumber: string;
}

export default function EditTenants() {
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [formData, setFormData] = useState<Omit<TenantDto, "createdAt" | "updatedAt">>({
    unitId: 0,
    unitNumber: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: ""
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTenants();
    fetchUnits();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      setTenants(response.data);
    } catch (err) {
      setError("Failed to fetch tenants");
      console.error("Error fetching tenants:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await axios.get<UnitDto[]>("/api/units");
      setUnits(response.data);
    } catch (err) {
      setError("Failed to fetch units");
      console.error("Error fetching units:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "userId" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editingId) {
        // Update existing tenant
        await axios.put(`/api/tenants/${editingId}`, formData);
      } else {
        // Create new tenant
        await axios.post("/api/tenants", formData);
      }

      resetForm();
      await fetchTenants();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save tenant");
      console.error("Error saving tenant:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tenant: TenantDto) => {
    setFormData({
      id: tenant.id,
      unitId: tenant.unitId,
      unitNumber: tenant.unitNumber,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      phoneNumber: tenant.phoneNumber,
      email: tenant.email
    });
    setEditingId(tenant.id || null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this tenant?")) {
      return;
    }

    try {
      await axios.delete(`/api/tenants/${id}`);
      await fetchTenants();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete tenant");
      console.error("Error deleting tenant:", err);
    }
  };

  const resetForm = () => {
    setFormData({
        unitId: 0,
        unitNumber: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: ""
    });
    setEditingId(null);
    setError("");
  };

  return (
    <div className="edit-tenants">
      <h1>Manage Tenants</h1>
      
      <form onSubmit={handleSubmit} className="tenant-form">
        <h2>{editingId ? "Edit Tenant" : "Add New Tenant"}</h2>
        
        <div className="form-group">
          <label htmlFor="unitId">Unit:</label>
          <select
            id="unitId"
            name="unitId"
            value={formData.unitId}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Select Unit --</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.unitNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="firstName">First Name:</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name:</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            required
            maxLength={12}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="text"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : editingId ? "Update Tenant" : "Add Tenant"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="tenants-list">
        <h2>Tenants</h2>
        {tenants.length === 0 ? (
          <p>No tenants found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Unit</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Created At</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(tenant => (
                <tr key={tenant.id}>
                  <td>{tenant.unitNumber}</td>
                  <td>{tenant.firstName}</td>
                  <td>{tenant.lastName}</td>
                  <td>{tenant.phoneNumber}</td>
                  <td>{tenant.email}</td>
                  <td>{tenant.createdAt}</td>
                  <td>{tenant.updatedAt}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(tenant)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => tenant.id && handleDelete(tenant.id)}
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