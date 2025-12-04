import axios from "axios";
import { useEffect, useState } from "react";
import { UserDto } from "../models/UserDto";
import { HomeIcon } from '@heroicons/react/24/solid';

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

// Add BasicUserDto interface for the simplified user data
interface BasicUserDto {
  id: number;
  userName?: string;
  email?: string;
  phone?: string;
}

interface PropertyWithUnits extends PropertyDto {
  units: UnitDto[];
  isExpanded: boolean;
  owner?: BasicUserDto; // Changed from UserDto to BasicUserDto
}

interface RentalApplicationData {
  unitId: number;
  unitNumber: string;
  propertyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  moveInDate: string;
  message?: string;
}

interface PropertiesViewProps {
  currentUser?: UserDto;
}

export default function PropertiesView({ currentUser }: PropertiesViewProps) {
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyWithUnits[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRentalForm, setShowRentalForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitDto | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDto | null>(null);
  const [rentalFormData, setRentalFormData] = useState<RentalApplicationData>({
    unitId: 0,
    unitNumber: "",
    propertyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    moveInDate: "",
    message: ""
  });
  const [submittingRental, setSubmittingRental] = useState(false);
  const [rentalMessage, setRentalMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPropertiesWithUnits();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchTerm, properties]);

  const fetchPropertiesWithUnits = async () => {
    try {
      setLoading(true);
      
      // Fetch all properties
      const propertiesResponse = await axios.get<PropertyDto[]>("/api/properties");
      const propertiesData = propertiesResponse.data;
      
      // Fetch all units
      const unitsResponse = await axios.get<UnitDto[]>("/api/units");
      const allUnits = unitsResponse.data;
      
      // Try to fetch users, but if it fails, we'll handle it gracefully
      let allUsersData: BasicUserDto[] = [];
      try {
        const usersResponse = await axios.get<BasicUserDto[]>("/api/users");
        allUsersData = usersResponse.data;
      } catch (usersError) {
        console.warn("Could not fetch users, property owners will not be displayed:", usersError);
        // Continue without user data - properties will still show but without owner info
      }
      
      // Combine properties with their units and owner information
      const propertiesWithUnits = propertiesData.map(property => {
        // Find owner for this property (user who owns the property)
        // Convert userId to string for comparison since UserDto.id is string
        const owner = allUsersData.find(user => user.id.toString() === property.userId.toString());
        
        return {
          ...property,
          units: allUnits.filter(unit => unit.propertyId === property.id),
          isExpanded: false,
          owner: owner
        };
      });
      
      setProperties(propertiesWithUnits);
      setFilteredProperties(propertiesWithUnits);
    } catch (err) {
      setError("Failed to fetch properties and units");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    if (!searchTerm.trim()) {
      setFilteredProperties(properties);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    const filtered = properties.filter(property => {
      // Search property fields
      const propertyMatches = 
        property.name.toLowerCase().includes(searchLower) ||
        property.address.toLowerCase().includes(searchLower) ||
        property.city.toLowerCase().includes(searchLower) ||
        property.state.toLowerCase().includes(searchLower) ||
        property.zipCode.toLowerCase().includes(searchLower) ||
        (property.description && property.description.toLowerCase().includes(searchLower));

      // Search owner fields (removed roles search)
      const ownerMatches = property.owner && (
        property.owner.userName?.toLowerCase().includes(searchLower) ||
        property.owner.email?.toLowerCase().includes(searchLower) ||
        property.owner.phone?.toLowerCase().includes(searchLower)
      );

      // Search unit fields within this property
      const unitMatches = property.units.some(unit =>
        unit.unitNumber.toLowerCase().includes(searchLower) ||
        (unit.description && unit.description.toLowerCase().includes(searchLower)) ||
        unit.bedrooms.toString().includes(searchLower) ||
        unit.bathrooms.toString().includes(searchLower) ||
        unit.squareFeet.toString().includes(searchLower) ||
        unit.rent.toString().includes(searchLower) ||
        unit.status.toLowerCase().includes(searchLower)
      );

      return propertyMatches || ownerMatches || unitMatches;
    });

    setFilteredProperties(filtered);
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

  const openRentalForm = (unit: UnitDto, property: PropertyDto) => {
    setSelectedUnit(unit);
    setSelectedProperty(property);
    setRentalFormData({
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      propertyName: property.name,
      firstName: "",
      lastName: "",
      email: currentUser?.email || currentUser?.userName || "", // Try email first, fallback to userName
      phoneNumber: "",
      moveInDate: "",
      message: ""
    });
    setShowRentalForm(true);
    setRentalMessage("");
  };

  const closeRentalForm = () => {
    setShowRentalForm(false);
    setSelectedUnit(null);
    setSelectedProperty(null);
    setRentalFormData({
      unitId: 0,
      unitNumber: "",
      propertyName: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      moveInDate: "",
      message: ""
    });
  };

  const handleRentalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRentalFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitRentalApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRental(true);
    setRentalMessage("");

    try {
      // Create tenant entry using the rental form data
      const tenantData = {
        unitId: rentalFormData.unitId,
        unitNumber: rentalFormData.unitNumber,
        firstName: rentalFormData.firstName,
        lastName: rentalFormData.lastName,
        phoneNumber: rentalFormData.phoneNumber,
        email: rentalFormData.email,
        requestedMoveInDate: rentalFormData.moveInDate || undefined
      };

      await axios.post("/api/tenants", tenantData);

      setRentalMessage("success");
      // Keep the loading state to show the success message
      setTimeout(() => {
        closeRentalForm();
        setSubmittingRental(false);
      }, 2500);

    } catch (err: any) {
      setRentalMessage(err.response?.data?.message || "Failed to submit rental application. Please try again.");
      setSubmittingRental(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="p-5 max-w-1400px mx-auto">
        <h1 className="text-center text-gray-800 mb-2 text-3xl font-bold">Find Your Perfect Home</h1>
        <div className="text-center py-10 text-gray-600 text-lg">Loading properties and units...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 max-w-1400px mx-auto">
        <h1 className="text-center text-gray-800 mb-2 text-3xl font-bold">Find Your Perfect Home</h1>
        <div className="text-center text-red-600 py-5 bg-red-50 border border-red-300 rounded-md my-5">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-1400px mx-auto">
      <h1 className="text-center text-gray-800 mb-2 text-3xl font-bold">Find Your Perfect Home</h1>
      <p className="text-center text-gray-600 mb-8 text-lg">Browse our available properties and apply online</p>
      
      {currentUser && (
        <p className="text-center text-gray-700 mb-5">Welcome, {currentUser.userName}!</p>
      )}
      
      <div className="flex justify-center gap-4 mb-8">
        <button 
          onClick={() => toggleAllProperties(true)}
          className="px-6 py-3 border-2 border-blue-500 bg-white text-blue-500 rounded-lg cursor-pointer font-bold transition-all duration-300 hover:bg-blue-500 hover:text-white"
        >
          Expand All
        </button>
        <button 
          onClick={() => toggleAllProperties(false)}
          className="px-6 py-3 border-2 border-blue-500 bg-white text-blue-500 rounded-lg cursor-pointer font-bold transition-all duration-300 hover:bg-blue-500 hover:text-white"
        >
          Collapse All
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search properties, units, prices, locations..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-6 py-4 pl-12 text-lg border-2 bg-white text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              Found {filteredProperties.length} propert{filteredProperties.length === 1 ? 'y' : 'ies'} matching "{searchTerm}"
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {filteredProperties.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <h3 className="text-2xl mb-2">No properties found</h3>
            <p className="text-base">
              {searchTerm ? `No properties matching "${searchTerm}"` : "There are no properties available at this time."}
            </p>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredProperties.map(property => (
            <div key={property.id} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div 
                className="grid grid-cols-[auto,1fr,auto] items-center gap-6 p-6 bg-gradient-to-br from-purple-600 to-blue-400 text-white cursor-pointer transition-colors duration-300 hover:from-purple-700 hover:to-purple-900"
                onClick={() => togglePropertyExpansion(property.id)}
              >
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                  {property.imageUrl ? (
                    <img
                      src={property.imageUrl}
                      alt={property.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-white bg-opacity-10 flex items-center justify-center border-2 border-dashed border-white border-opacity-30">
                      <HomeIcon className="h-12 w-12 text-white opacity-70" />
                    </div>
                  )}
                </div>
                
                <div className="min-w-0">
                  <h3 className="m-0 mb-3 text-2xl font-bold">{property.name}</h3>
                  <p className="my-2 text-base opacity-95">
                    {property.address}, {property.city}, {property.state} {property.zipCode}
                  </p>
                  {property.description && (
                    <p className="my-3 mt-3 italic opacity-85 max-w-2xl line-clamp-2 overflow-hidden">
                      {property.description}
                    </p>
                  )}
                  
                  {/* Owner Information - Only show if we have owner data */}
                  {property.owner && (
                    <div className="mt-4 p-3 bg-white bg-opacity-10 rounded-lg">
                      <h4 className="font-semibold mb-2 text-blue-200">Property Manager</h4>
                      <div className="text-sm space-y-1">
                        <p className="flex items-center gap-2">
                          <span className="font-medium">👤 {property.owner.userName}</span>
                        </p>
                        {property.owner.email && (
                          <p className="flex items-center gap-2">
                            <span>📧 {property.owner.email}</span>
                          </p>
                        )}
                        {property.owner.phone && (
                          <p className="flex items-center gap-2">
                            <span>📞 {property.owner.phone}</span>
                          </p>
                        )}
                        {/* Removed roles display since BasicUserDto doesn't include roles */}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-center gap-4 min-w-24">
                  <span className="bg-white bg-opacity-20 py-2 px-4 rounded-full font-bold text-sm text-center min-w-20">
                    {property.units.length} unit{property.units.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xl font-bold transition-transform duration-300 hover:scale-110">
                    {property.isExpanded ? '▼' : '►'}
                  </span>
                </div>
              </div>

              {property.isExpanded && (
                <div className="bg-gray-50 border-t border-gray-200">
                  {property.units.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 italic text-base">
                      <p>No units available for this property</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 p-6">
                      {property.units.map(unit => (
                        <div key={unit.id} className="bg-white rounded-lg p-6 shadow-md transition-all duration-300 border border-gray-200 hover:-translate-y-1 hover:shadow-lg hover:border-purple-500">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
                            <div>
                              <h4 className="m-0 text-gray-800 text-xl font-bold">Unit {unit.unitNumber}</h4>
                              <div className="flex gap-4 mt-2">
                                <span className="text-gray-600 text-sm">
                                  <strong className="text-gray-800">{unit.bedrooms}</strong> BR
                                </span>
                                <span className="text-gray-600 text-sm">
                                  <strong className="text-gray-800">{unit.bathrooms}</strong> BA
                                </span>
                                <span className="text-gray-600 text-sm">
                                  <strong className="text-gray-800">{unit.squareFeet.toLocaleString()}</strong> sq ft
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                unit.status.toLowerCase() === 'available' ? 'bg-green-100 text-green-800' :
                                unit.status.toLowerCase() === 'rented' ? 'bg-yellow-100 text-yellow-800' :
                                unit.status.toLowerCase() === 'maintenance' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {unit.status}
                              </span>
                              <div className="text-right">
                                <span className="block text-2xl font-bold text-green-600">${unit.rent.toFixed(2)}</span>
                                <span className="text-sm text-gray-600 font-medium">/month</span>
                              </div>
                            </div>
                          </div>
                          
                          {unit.description && (
                            <p className="text-gray-700 text-sm italic mb-4">
                              {unit.description}
                            </p>
                          )}
                          
                          {unit.imageUrl && (
                            <div className="mt-4">
                              <img
                                src={unit.imageUrl}
                                alt={`Unit ${unit.unitNumber}`}
                                className="max-w-full max-h-48 rounded-lg shadow-md border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}

                          {/* Rent Now Button */}
                          {unit.status.toLowerCase() === 'available' && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => openRentalForm(unit, property)}
                                className="w-full bg-green-500 text-white py-3 px-6 rounded-lg font-bold text-lg hover:bg-green-600 transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                              >
                                <HomeIcon className="h-6 w-6" />
                                Rent This Unit
                              </button>
                            </div>
                          )}
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

      {/* Rental Application Modal */}
      {showRentalForm && selectedUnit && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Apply for Unit {selectedUnit.unitNumber}</h2>
                <button
                  onClick={closeRentalForm}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-blue-100 mt-2">{selectedProperty.name} • {selectedProperty.address}</p>
            </div>

            <form onSubmit={submitRentalApplication} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Unit Details</h3>
                  <p className="text-sm text-blue-600">
                    <strong>Unit:</strong> {selectedUnit.unitNumber}<br />
                    <strong>Rent:</strong> ${selectedUnit.rent.toFixed(2)}/month<br />
                    <strong>Size:</strong> {selectedUnit.squareFeet.toLocaleString()} sq ft<br />
                    <strong>Bed/Bath:</strong> {selectedUnit.bedrooms} BR / {selectedUnit.bathrooms} BA
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Property Info</h3>
                  <p className="text-sm text-green-600">
                    <strong>Property:</strong> {selectedProperty.name}<br />
                    <strong>Location:</strong> {selectedProperty.city}, {selectedProperty.state}<br />
                    <strong>Status:</strong> <span className="text-green-600 font-semibold">Available</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={rentalFormData.firstName}
                      onChange={handleRentalInputChange}
                      className="w-full px-4 py-3 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      required
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={rentalFormData.lastName}
                      onChange={handleRentalInputChange}
                      className="w-full px-4 py-3 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      required
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={rentalFormData.email}
                      onChange={handleRentalInputChange}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                        currentUser ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'text-black bg-white'
                      }`}
                      required
                      placeholder="your.email@example.com"
                      readOnly={!!currentUser}
                      title={currentUser ? "Email matches your account" : ""}
                    />
                    {currentUser && (
                      <p className="text-xs text-gray-600 mt-1">
                        This email matches your account and cannot be changed.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={rentalFormData.phoneNumber}
                      onChange={handleRentalInputChange}
                      className="w-full px-4 py-3 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      required
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desired Move-In Date *
                  </label>
                  <input
                    type="date"
                    name="moveInDate"
                    value={rentalFormData.moveInDate}
                    onChange={handleRentalInputChange}
                    className="w-full px-4 py-3 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Message (Optional)
                  </label>
                  <textarea
                    name="message"
                    value={rentalFormData.message}
                    onChange={handleRentalInputChange}
                    rows={3}
                    className="w-full px-4 py-3 text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Tell us about yourself or any special requirements..."
                  />
                </div>
              </div>

              {rentalMessage && (
                <div className={`mt-4 p-4 rounded-lg ${
                  rentalMessage.includes("🎉") 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {rentalMessage}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={submittingRental}
                  className={`flex-1 text-white py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                    rentalMessage === "success"
                      ? "bg-gradient-to-r from-green-600 to-green-700"
                      : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  {rentalMessage === "success" ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Application Submitted! Redirecting...
                    </span>
                  ) : submittingRental ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Application...
                    </span>
                  ) : (
                    "Submit Rental Application"
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeRentalForm}
                  className="bg-[#ef4444] text-white py-4 px-6 rounded-md text-12px hover:bg-[#dc2626] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                By submitting this application, you agree to our rental terms and conditions.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}