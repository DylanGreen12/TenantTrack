import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/EditProperties.css";

interface PropertyDto {
  id?: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  imageUrl?: string;
  userId: number;
}

interface CurrentUser {
  id: number;
  userName: string;
  roles?: string[];
}

export default function EditProperties() {
  const [allProperties, setAllProperties] = useState<PropertyDto[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [formData, setFormData] = useState<PropertyDto>({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    imageUrl: "",
    userId: 0
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCurrentUser();
    fetchProperties();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get<CurrentUser>("/api/authentication/me");
      setCurrentUser(response.data);
      setFormData(prev => ({
        ...prev,
        userId: response.data.id
      }));
    } catch (err) {
      console.error("Error fetching current user:", err);
      setError("Please log in to manage properties");
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get<PropertyDto[]>("/api/properties");
      setAllProperties(response.data);
    } catch (err) {
      setError("Failed to fetch properties");
      console.error("Error fetching properties:", err);
    }
  };

  const userProperties = allProperties.filter(property => 
    currentUser && property.userId === currentUser.id
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to manage properties");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        userId: currentUser.id
      };

      if (editingId) {
        await axios.put(`/api/properties/${editingId}`, payload);
      } else {
        await axios.post("/api/properties", payload);
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
      description: property.description || "",
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      imageUrl: property.imageUrl || "",
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
      description: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      imageUrl: "",
      userId: currentUser?.id || 0
    });
    setEditingId(null);
    setError("");
  };

  if (!currentUser) {
    return (
      <div className="edit-properties">
        <h1>Manage Properties</h1>
        <div className="error-message">
          Please log in to manage properties
        </div>
      </div>
    );
  }

  return (
    <div className="edit-properties">
      <h1>Manage Properties</h1>
      <p className="user-info">Logged in as: {currentUser.userName} (ID: {currentUser.id})</p>
      
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
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
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
          <label htmlFor="imageUrl">Image URL:</label>
          <input
            type="text"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <input type="hidden" name="userId" value={currentUser.id} />

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
        <h2>Your Properties ({userProperties.length})</h2>
        {userProperties.length === 0 ? (
          <p>You don't have any properties yet. Add your first property above!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Address</th>
                <th>City</th>
                <th>State</th>
                <th>Zip Code</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userProperties.map(property => (
                <tr key={property.id}>
                  <td>{property.name}</td>
                  <td className="description-cell">{property.description}</td>
                  <td>{property.address}</td>
                  <td>{property.city}</td>
                  <td>{property.state}</td>
                  <td>{property.zipCode}</td>
                  <td>
                    {property.imageUrl && (
                      <div className="property-image">
                        <img
                          src={property.imageUrl}
                          alt={property.name}
                          style={{
                            maxWidth: '80px',
                            maxHeight: '80px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    )}
                  </td>
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