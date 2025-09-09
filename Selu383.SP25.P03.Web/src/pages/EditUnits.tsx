import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/EditUnits.css";

interface UnitDto {
  id?: number;
  unitNumber: string;
  propertyId: number;
  description?: string;
  imageUrl?: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  rent: number;
  status: string;
}

interface PropertyDto {
  id: number;
  name: string;
  userId: number;
}

interface CurrentUser {
  id: number;
  userName: string;
  roles?: string[];
}

export default function EditUnits() {
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyDto[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [formData, setFormData] = useState<UnitDto>({
    unitNumber: "",
    propertyId: 0,
    description: "",
    imageUrl: "",
    bedrooms: 0,
    bathrooms: 0,
    squareFeet: 0,
    rent: 0,
    status: "Available"
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchProperties();
      fetchUnits();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get<CurrentUser>("/api/authentication/me");
      setCurrentUser(response.data);
    } catch (err) {
      console.error("Error fetching current user:", err);
      setError("Please log in to manage units");
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get<PropertyDto[]>("/api/properties");
      setAllProperties(response.data);
    } catch (err) {
      console.error("Error fetching properties:", err);
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

  // Filter properties to only show current user's properties
  const userProperties = allProperties.filter(property => 
    currentUser && property.userId === currentUser.id
  );

  // Filter units to only show units from user's properties
  const userUnits = units.filter(unit => 
    userProperties.some(property => property.id === unit.propertyId)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "propertyId" || name === "bedrooms" || name === "bathrooms" 
        ? parseInt(value) || 0 
        : name === "squareFeet" || name === "rent"
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to manage units");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (editingId) {
        await axios.put(`/api/units/${editingId}`, formData);
      } else {
        await axios.post("/api/units", formData);
      }

      resetForm();
      await fetchUnits();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save unit");
      console.error("Error saving unit:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (unit: UnitDto) => {
    setFormData({
      unitNumber: unit.unitNumber,
      propertyId: unit.propertyId,
      description: unit.description || "",
      imageUrl: unit.imageUrl || "",
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      squareFeet: unit.squareFeet,
      rent: unit.rent,
      status: unit.status
    });
    setEditingId(unit.id || null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) {
      return;
    }

    try {
      await axios.delete(`/api/units/${id}`);
      await fetchUnits();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete unit");
      console.error("Error deleting unit:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      unitNumber: "",
      propertyId: 0,
      description: "",
      imageUrl: "",
      bedrooms: 0,
      bathrooms: 0,
      squareFeet: 0,
      rent: 0,
      status: "Available"
    });
    setEditingId(null);
    setError("");
  };

  if (!currentUser) {
    return (
      <div className="edit-units">
        <h1>Manage Units</h1>
        <div className="error-message">
          Please log in to manage units
        </div>
      </div>
    );
  }

  return (
    <div className="edit-units">
      <h1>Manage Units</h1>
      <p className="user-info">Logged in as: {currentUser.userName}</p>
      
      <form onSubmit={handleSubmit} className="unit-form">
        <h2>{editingId ? "Edit Unit" : "Add New Unit"}</h2>
        
        <div className="form-group">
          <label htmlFor="unitNumber">Unit Number:</label>
          <input
            type="text"
            id="unitNumber"
            name="unitNumber"
            value={formData.unitNumber}
            onChange={handleInputChange}
            required
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
            <option value={0}>Select Property</option>
            {userProperties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
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
            rows={3}
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

        <div className="form-group">
          <label htmlFor="bedrooms">Bedrooms:</label>
          <input
            type="number"
            id="bedrooms"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleInputChange}
            required
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="bathrooms">Bathrooms:</label>
          <input
            type="number"
            id="bathrooms"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleInputChange}
            required
            min="0"
            step="0.5"
          />
        </div>

        <div className="form-group">
          <label htmlFor="squareFeet">Square Feet:</label>
          <input
            type="number"
            id="squareFeet"
            name="squareFeet"
            value={formData.squareFeet}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="rent">Rent ($):</label>
          <input
            type="number"
            id="rent"
            name="rent"
            value={formData.rent}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
          />
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
            <option value="Available">Available</option>
            <option value="Rented">Rented</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : editingId ? "Update Unit" : "Add Unit"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="units-list">
        <h2>Your Units ({userUnits.length})</h2>
        {userUnits.length === 0 ? (
          <p>You don't have any units yet. Add your first unit above!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Unit #</th>
                <th>Property</th>
                <th>Description</th>
                <th>Bed/Bath</th>
                <th>Square Feet</th>
                <th>Rent</th>
                <th>Status</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userUnits.map(unit => {
                const property = userProperties.find(p => p.id === unit.propertyId);
                return (
                  <tr key={unit.id}>
                    <td>{unit.unitNumber}</td>
                    <td>{property?.name || unit.propertyId}</td>
                    <td className="description-cell">{unit.description}</td>
                    <td>{unit.bedrooms} BR / {unit.bathrooms} BA</td>
                    <td>{unit.squareFeet.toLocaleString()} sq ft</td>
                    <td>${unit.rent.toFixed(2)}</td>
                    <td>{unit.status}</td>
                    <td>
                      {unit.imageUrl && (
                        <div className="unit-image">
                          <img
                            src={unit.imageUrl}
                            alt={`Unit ${unit.unitNumber}`}
                            style={{
                              maxWidth: '60px',
                              maxHeight: '60px',
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleEdit(unit)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => unit.id && handleDelete(unit.id)}
                        disabled={loading}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}