import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/EditStaff.css"

interface StaffDto {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  propertyId: number;
  propertyName: string;
  userId: number;
  userName: string;
}

interface PropertyDto {
  id: number;
  name: string;
}

interface UserDto {
  id: number;
  userName: string;
}

export default function EditStaff() {
  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [formData, setFormData] = useState<Omit<StaffDto, "propertyName" | "userName">>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    propertyId: 0,
    userId: 0
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStaff();
    fetchProperties();
    fetchUsers();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get<StaffDto[]>("/api/staff");
      setStaff(response.data);
    } catch (err) {
      setError("Failed to fetch staff");
      console.error("Error fetching staff:", err);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get<PropertyDto[]>("/api/properties");
      setProperties(response.data);
    } catch (err) {
      setError("Failed to fetch properties");
      console.error("Error fetching properties:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get<UserDto[]>("/api/users");
      setUsers(response.data);
    } catch (err) {
      setError("Failed to fetch users");
      console.error("Error fetching users:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "propertyId" || name === "userId" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editingId) {
        // Update existing staff
        await axios.put(`/api/staff/${editingId}`, formData);
      } else {
        // Create new staff
        await axios.post("/api/staff", formData);
      }

      resetForm();
      await fetchStaff();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save staff member");
      console.error("Error saving staff:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember: StaffDto) => {
    setFormData({
      id: staffMember.id,
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phone: staffMember.phone,
      position: staffMember.position,
      propertyId: staffMember.propertyId,
      userId: staffMember.userId
    });
    setEditingId(staffMember.id || null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    try {
      await axios.delete(`/api/staff/${id}`);
      await fetchStaff();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete staff member");
      console.error("Error deleting staff:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      propertyId: 0,
      userId: 0
    });
    setEditingId(null);
    setError("");
  };

  return (
    <div className="edit-staff">
      <h1>Manage Staff</h1>
      
      <form onSubmit={handleSubmit} className="staff-form">
        <h2>{editingId ? "Edit Staff Member" : "Add New Staff Member"}</h2>
        
        <div className="form-group">
          <label htmlFor="firstName">First Name:</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            maxLength={50}
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
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone:</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            maxLength={15}
          />
        </div>

        <div className="form-group">
          <label htmlFor="position">Position:</label>
          <input
            type="text"
            id="position"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            required
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label htmlFor="propertyId">Property:</label>
          <select
            id="propertyId"
            name="propertyId"
            value={formData.propertyId}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Select Property --</option>
            {properties?.map?.(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            )) || null}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="userId">User:</label>
          <select
            id="userId"
            name="userId"
            value={formData.userId}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Select User --</option>
            {users?.map?.(user => (
              <option key={user.id} value={user.id}>
                {user.userName}
              </option>
            )) || null}
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : editingId ? "Update Staff Member" : "Add Staff Member"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="staff-list">
        <h2>Staff Members</h2>
        {staff.length === 0 ? (
          <p>No staff members found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Position</th>
                <th>Property</th>
                <th>User</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff?.map?.(staffMember => (
                <tr key={staffMember.id}>
                  <td>{staffMember.firstName}</td>
                  <td>{staffMember.lastName}</td>
                  <td>{staffMember.email}</td>
                  <td>{staffMember.phone}</td>
                  <td>{staffMember.position}</td>
                  <td>{staffMember.propertyName}</td>
                  <td>{staffMember.userName}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(staffMember)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => staffMember.id && handleDelete(staffMember.id)}
                      disabled={loading}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="8">
                    {loading ? "Loading staff..." : "No staff found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}