import axios from "axios";
import { useEffect, useState } from "react";
import { UserDto } from "../models/UserDto";

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

interface PropertiesViewProps {
  currentUser?: UserDto;
}

export default function PropertiesView({ currentUser }: PropertiesViewProps) {
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
      <div className="p-5 max-w-1400px mx-auto">
        <h1 className="text-center text-gray-800 mb-2 text-3xl font-bold">Properties Directory</h1>
        <div className="text-center py-10 text-gray-600 text-lg">Loading properties and units...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 max-w-1400px mx-auto">
        <h1 className="text-center text-gray-800 mb-2 text-3xl font-bold">Properties Directory</h1>
        <div className="text-center text-red-600 py-5 bg-red-50 border border-red-300 rounded-md my-5">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-1400px mx-auto">
      <h1 className="text-center text-gray-800 mb-2 text-3xl font-bold">Properties Directory</h1>
      <p className="text-center text-gray-600 mb-8 text-lg">Browse all properties and their available units</p>
      
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

      <div className="flex flex-col gap-6">
        {properties.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <h3 className="text-2xl mb-2">No properties found</h3>
            <p className="text-base">There are no properties available at this time.</p>
          </div>
        ) : (
          properties.map(property => (
            <div key={property.id} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div 
                className="grid grid-cols-[auto,1fr,auto] items-center gap-6 p-6 bg-gradient-to-br from-purple-600 to-purple-800 text-white cursor-pointer transition-colors duration-300 hover:from-purple-700 hover:to-purple-900"
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
                      <span className="text-3xl opacity-70">🏠</span>
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