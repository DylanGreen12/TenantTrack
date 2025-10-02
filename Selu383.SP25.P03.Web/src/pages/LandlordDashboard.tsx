import { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../models/UserDto"; 
import "../styles/LandlordDashboard.css";

interface PropertySummary {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  imageUrl?: string;
}

interface UnitSummary {
  id: number;
  unitNumber: string;
  propertyId: number;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  status: string;
}

interface LeaseDetails {
  id: number;
  unitNumber: string;
  tenantId: number;
  tenantFirstName: string;
  tenantLastName: string;
  tenantEmail: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  status: string;
}

interface OwnerContact {
  propertyId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface DashboardSummary {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  activeLeases: number;
  totalMonthlyRent: number;
}

interface LandlordDashboardData {
  properties: PropertySummary[];
  units: UnitSummary[];
  leases: LeaseDetails[];
  owners: OwnerContact[];
  summary: DashboardSummary;
}

interface LandlordDashboardProps {
  currentUser?: UserDto;
}

export default function LandlordDashboard({ currentUser }: LandlordDashboardProps) {
  const [dashboardData, setDashboardData] = useState<LandlordDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get<LandlordDashboardData>("/api/landlord/dashboard");
      setDashboardData(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
      setLoading(false);
      console.error("Error fetching dashboard:", err);
    }
  };

  const getUnitsForProperty = (propertyId: number) => {
    return dashboardData?.units.filter(u => u.propertyId === propertyId) || [];
  };

  const getLeasesForUnit = (unitNumber: string) => {
    return dashboardData?.leases.filter(l => l.unitNumber === unitNumber) || [];
  };

  const getOwnerContact = (propertyId: number) => {
    return dashboardData?.owners.find(o => o.propertyId === propertyId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isLeaseActive = (lease: LeaseDetails) => {
    const today = new Date();
    const endDate = new Date(lease.endDate);
    return lease.status.toLowerCase() === 'active' && endDate >= today;
  };

  console.log("Current user in dashboard:", currentUser);

  if (loading) {
    return <div className="landlord-dashboard"><p>Loading dashboard...</p></div>;
  }

  if (error) {
    return <div className="landlord-dashboard"><p className="error-message">{error}</p></div>;
  }

  if (!dashboardData || dashboardData.properties.length === 0) {
    return (
      <div className="landlord-dashboard">
        <h1>Landlord Dashboard</h1>
        <p>You don't have any properties yet. Add properties to get started.</p>
      </div>
    );
  }

  return (
    <div className="landlord-dashboard">
      <h1>Landlord Dashboard</h1>
      
      {/* Optional: Display current user info */}
      {currentUser && (
        <div className="user-welcome">
          <p>Welcome, {currentUser.userName}!</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Properties</h3>
          <p className="summary-value">{dashboardData.summary.totalProperties}</p>
        </div>
        <div className="summary-card">
          <h3>Total Units</h3>
          <p className="summary-value">{dashboardData.summary.totalUnits}</p>
        </div>
        <div className="summary-card">
          <h3>Occupied Units</h3>
          <p className="summary-value">{dashboardData.summary.occupiedUnits}</p>
        </div>
        <div className="summary-card">
          <h3>Available Units</h3>
          <p className="summary-value">{dashboardData.summary.availableUnits}</p>
        </div>
        <div className="summary-card">
          <h3>Active Leases</h3>
          <p className="summary-value">{dashboardData.summary.activeLeases}</p>
        </div>
        <div className="summary-card highlight">
          <h3>Monthly Revenue</h3>
          <p className="summary-value">{formatCurrency(dashboardData.summary.totalMonthlyRent)}</p>
        </div>
      </div>

      {/* Properties List */}
      <div className="properties-section">
        <h2>Your Properties</h2>
        {dashboardData.properties.map(property => {
          const units = getUnitsForProperty(property.id);
          const owner = getOwnerContact(property.id);
          const isExpanded = selectedProperty === property.id;

          return (
            <div key={property.id} className="property-card">
              <div 
                className="property-header" 
                onClick={() => setSelectedProperty(isExpanded ? null : property.id)}
              >
                <div className="property-info">
                  <h3>{property.name}</h3>
                  <p>{property.address}, {property.city}, {property.state} {property.zipCode}</p>
                  <p className="property-stats">
                    {units.length} units • {units.filter(u => u.status.toLowerCase() === 'rented').length} occupied
                  </p>
                </div>
                <button className="expand-btn">{isExpanded ? '▼' : '▶'}</button>
              </div>

              {isExpanded && (
                <div className="property-details">
                  {/* Owner Contact */}
                  {owner && (
                    <div className="owner-contact">
                      <h4>Owner Contact</h4>
                      <p><strong>{owner.firstName} {owner.lastName}</strong></p>
                      <p>Email: {owner.email}</p>
                      <p>Phone: {owner.phone}</p>
                    </div>
                  )}

                  {/* Units and Leases */}
                  <div className="units-section">
                    <h4>Units</h4>
                    {units.length === 0 ? (
                      <p>No units for this property</p>
                    ) : (
                      <table className="units-table">
                        <thead>
                          <tr>
                            <th>Unit #</th>
                            <th>Beds/Baths</th>
                            <th>Rent</th>
                            <th>Status</th>
                            <th>Tenant</th>
                            <th>Lease Info</th>
                          </tr>
                        </thead>
                        <tbody>
                          {units.map(unit => {
                            const leases = getLeasesForUnit(unit.unitNumber);
                            const activeLease = leases.find(l => isLeaseActive(l));

                            return (
                              <tr key={unit.id}>
                                <td>{unit.unitNumber}</td>
                                <td>{unit.bedrooms}BR / {unit.bathrooms}BA</td>
                                <td>{formatCurrency(unit.rent)}</td>
                                <td>
                                  <span className={`status-badge ${unit.status.toLowerCase()}`}>
                                    {unit.status}
                                  </span>
                                </td>
                                <td>
                                  {activeLease ? (
                                    <div className="tenant-info">
                                      <p><strong>{activeLease.tenantFirstName} {activeLease.tenantLastName}</strong></p>
                                      <p className="contact-small">{activeLease.tenantEmail}</p>
                                      <p className="contact-small">{activeLease.tenantPhone}</p>
                                    </div>
                                  ) : (
                                    <span className="text-muted">No active tenant</span>
                                  )}
                                </td>
                                <td>
                                  {activeLease ? (
                                    <div className="lease-info">
                                      <p><strong>Rent:</strong> {formatCurrency(activeLease.rent)}/mo</p>
                                      <p><strong>Start:</strong> {formatDate(activeLease.startDate)}</p>
                                      <p><strong>End:</strong> {formatDate(activeLease.endDate)}</p>
                                      <p><strong>Deposit:</strong> {formatCurrency(activeLease.deposit)}</p>
                                    </div>
                                  ) : (
                                    <span className="text-muted">No active lease</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}