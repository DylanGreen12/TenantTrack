
import axios from "axios";
import "../styles/PropertiesView.css";
import { useEffect, useState } from "react";

interface PropertyDto {
  id: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  imageUrl?: string;
  userId: number;
}

interface UnitDto {
  id: number;
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

interface PropertyWithUnits extends PropertyDto {
  units: UnitDto[];
  isExpanded: boolean;
}

export default function PropertiesView() {
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPropertiesWithUnits();
  }, []);

  const fetchPropertiesWithUnits = async () => {
    try {
      setLoading(true);
      
      // Fetch all properties
      const propertiesResponse = await axios.get<PropertyDto[]>("/api/properties");
      const propertiesData = propertiesResponse.data;
      
      // Fetch all units
      const unitsResponse = await axios.get<UnitDto[]>("/api/units");
      const allUnits = unitsResponse.data;
      
      // Combine properties with their units
      const propertiesWithUnits = propertiesData.map(property => ({
        ...property,
        units: allUnits.filter(unit => unit.propertyId === property.id),
        isExpanded: false
      }));
      
      setProperties(propertiesWithUnits);
    } catch (err) {
      setError("Failed to fetch properties and units");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePropertyExpansion = (propertyId: number) => {
    setProperties(prev => prev.map(property => 
      property.id === propertyId 
        ? { ...property, isExpanded: !property.isExpanded }
        : property
    ));
  };

  const toggleAllProperties = (expand: boolean) => {
    setProperties(prev => prev.map(property => ({
      ...property,
      isExpanded: expand
    })));
  };

  if (loading) {
    return (
      <div className="properties-view">
        <h1>Properties Directory</h1>
        <div className="loading">Loading properties and units...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="properties-view">
        <h1>Properties Directory</h1>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="properties-view">
      <h1>Properties Directory</h1>
      <p className="subtitle">Browse all properties and their available units</p>
      
      <div className="controls">
        <button 
          onClick={() => toggleAllProperties(true)}
          className="control-btn"
        >
          Expand All
        </button>
        <button 
          onClick={() => toggleAllProperties(false)}
          className="control-btn"
        >
          Collapse All
        </button>
      </div>

      <div className="properties-list">
        {properties.length === 0 ? (
          <div className="empty-state">
            <h3>No properties found</h3>
            <p>There are no properties available at this time.</p>
          </div>
        ) : (
          properties.map(property => (
            <div key={property.id} className="property-card">
              <div 
                className="property-header"
                onClick={() => togglePropertyExpansion(property.id)}
              >
                <div className="property-image-container">
                  {property.imageUrl ? (
                    <img
                      src={property.imageUrl}
                      alt={property.name}
                      className="property-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <div className="property-image-placeholder">
                      <span className="placeholder-icon">🏠</span>
                    </div>
                  )}
                </div>
                
                <div className="property-info">
                  <h3>{property.name}</h3>
                  <p className="property-address">
                    {property.address}, {property.city}, {property.state} {property.zipCode}
                  </p>
                  {property.description && (
                    <p className="property-description">{property.description}</p>
                  )}
                </div>
                
                <div className="property-stats">
                  <span className="units-count">
                    {property.units.length} unit{property.units.length !== 1 ? 's' : ''}
                  </span>
                  <span className="expand-icon">
                    {property.isExpanded ? '▼' : '►'}
                  </span>
                </div>
              </div>

              {property.isExpanded && (
                <div className="units-section">
                  {property.units.length === 0 ? (
                    <div className="no-units">
                      <p>No units available for this property</p>
                    </div>
                  ) : (
                    <div className="units-grid">
                      {property.units.map(unit => (
                        <div key={unit.id} className="unit-card">
                          <div className="unit-header">
                            <h4>Unit {unit.unitNumber}</h4>
                            <span className={`status-badge status-${unit.status.toLowerCase()}`}>
                              {unit.status}
                            </span>
                          </div>
                          
                          <div className="unit-details">
                            <div className="unit-specs">
                              <span className="spec">
                                <strong>{unit.bedrooms}</strong> BR
                              </span>
                              <span className="spec">
                                <strong>{unit.bathrooms}</strong> BA
                              </span>
                              <span className="spec">
                                <strong>{unit.squareFeet.toLocaleString()}</strong> sq ft
                              </span>
                            </div>
                            
                            <div className="unit-rent">
                              <span className="rent-amount">${unit.rent.toFixed(2)}</span>
                              <span className="rent-label">/month</span>
                            </div>
                            
                            {unit.description && (
                              <p className="unit-description">{unit.description}</p>
                            )}
                            
                            {unit.imageUrl && (
                              <div className="unit-image">
                                <img
                                  src={unit.imageUrl}
                                  alt={`Unit ${unit.unitNumber}`}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
