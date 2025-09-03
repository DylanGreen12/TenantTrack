import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/EditProperties.css";

interface PropertyDto {
  id?: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  userId: number;
}

export default function EditProperties() {
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [formData, setFormData] = useState<PropertyDto>({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    userId: 0
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axios.get<PropertyDto[]>("/api/properties");
      setProperties(response.data);
    } catch (err) {
      setError("Failed to fetch properties");
      console.error("Error fetching properties:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "userId" ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editingId) {
        // Update existing property
        await axios.put(`/api/properties/${editingId}`, formData);
      } else {
        // Create new property
        await axios.post("/api/properties", formData);
      }

      resetForm();
      await fetchProperties();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save property");
      console.error("Error saving property:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (property: PropertyDto) => {
    setFormData({
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      userId: property.userId
    });
    setEditingId(property.id || null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this property?")) {
      return;
    }

    try {
      await axios.delete(`/api/properties/${id}`);
      await fetchProperties();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete property");
      console.error("Error deleting property:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      userId: 0
    });
    setEditingId(null);
    setError("");
  };

  return (
    <div className="edit-properties">
      <h1>Manage Properties</h1>
      
      <form onSubmit={handleSubmit} className="property-form">
        <h2>{editingId ? "Edit Property" : "Add New Property"}</h2>
        
        <div className="form-group">
          <label htmlFor="name">Property Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address:</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="city">City:</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="state">State:</label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            required
            maxLength={2}
            placeholder="LA"
          />
        </div>

        <div className="form-group">
          <label htmlFor="zipCode">Zip Code:</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="userId">Owner User ID:</label>
          <input
            type="number"
            id="userId"
            name="userId"
            value={formData.userId}
            onChange={handleInputChange}
            required
            min="1"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : editingId ? "Update Property" : "Add Property"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="properties-list">
        <h2>Properties</h2>
        {properties.length === 0 ? (
          <p>No properties found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>City</th>
                <th>State</th>
                <th>Zip Code</th>
                <th>Owner ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(property => (
                <tr key={property.id}>
                  <td>{property.name}</td>
                  <td>{property.address}</td>
                  <td>{property.city}</td>
                  <td>{property.state}</td>
                  <td>{property.zipCode}</td>
                  <td>{property.userId}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(property)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => property.id && handleDelete(property.id)}
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