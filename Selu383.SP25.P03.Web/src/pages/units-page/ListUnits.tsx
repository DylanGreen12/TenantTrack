import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { Link } from "react-router-dom";

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

interface EditUnitsProps {
  currentUser?: UserDto;
}

const ListUnits: React.FC<EditUnitsProps> = ({ currentUser }) => {
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyDto[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  // Check if user is Admin
  const isAdmin = currentUser?.roles?.includes("Admin") || false;

  useEffect(() => {
    if (currentUser) {
      fetchProperties();
      fetchUnits();
    }
  }, [currentUser]);

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
      setMessage("Failed to fetch units.");
      setShowMessage(true);
      console.error("Error fetching units:", err);
    }
  };

  // Show all units for Admin, only user's units for others
  const displayUnits = isAdmin 
    ? units 
    : units.filter(unit => {
        const userProperty = allProperties.find(property => 
          property.id === unit.propertyId && property.userId === parseInt(currentUser?.id || "0")
        );
        return userProperty !== undefined;
      });

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) {
      return;
    }

    try {
      await axios.delete(`/api/units/${id}`);
      setMessage("Unit deleted successfully!");
      setShowMessage(true);
      await fetchUnits();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to delete unit";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error deleting unit:", err);
    }
  };

  // Get property name for a unit
  const getPropertyName = (propertyId: number) => {
    const property = allProperties.find(p => p.id === propertyId);
    return property?.name || propertyId;
  };

  return (
    <div className="p-20px max-w-1200px mx-auto">
      <div className="flex justify-between items-center mb-10px">
        <h1 className="text-gray-800 text-2xl font-semibold">Manage Units</h1>
        {isAdmin && (
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Admin View - All Units
          </div>
        )}
      </div>

      <div className="units-list">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isAdmin ? "All Units" : "Your Units"} ({displayUnits.length})
          </h2>
        </div>

        {error && showMessage && (
          <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
            {error}
          </div>
        )}

        {!error && message && (
          <div className="my-4 p-4 rounded-lg shadow-inner border border-green-300 bg-green-100 text-green-800 text-sm">
            {message}
          </div>
        )}
        
        {displayUnits.length === 0 ? (
          <p className="text-gray-600">
            {isAdmin 
              ? "No units found in the system." 
              : "You don't have any units yet. Add your first unit above!"
            }
          </p>
        ) : (
          <table className="w-full border-collapse mt-5 text-sm bg-[#fdfefe] rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Unit #</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Property</th>
                {isAdmin && (
                  <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Owner ID</th>
                )}
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Description</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Bed/Bath</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Square Feet</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Rent</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Status</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Image</th>
                <th className="p-12px text-left border-b font-semibold text-[#374151]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayUnits.map((unit, i) => {
                const property = allProperties.find(p => p.id === unit.propertyId);
                return (
                  <tr
                    key={unit.id}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"} hover:bg-[#ebf5ff] transition-colors`}
                  >
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{unit.unitNumber}</td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                      {getPropertyName(unit.propertyId)}
                      {isAdmin && property && ` (Owner: ${property.userId})`}
                    </td>
                    {isAdmin && (
                      <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827] text-sm">
                        {property?.userId || "N/A"}
                      </td>
                    )}
                    <td className="p-12px border-b border-r border-[#e5e7eb] description-cell">{unit.description}</td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{unit.bedrooms} BR / {unit.bathrooms} BA</td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{unit.squareFeet.toLocaleString()} sq ft</td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">${unit.rent.toFixed(2)}</td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{unit.status}</td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                      {unit.imageUrl && (
                        <div className="unit-image">
                          <img
                            src={unit.imageUrl}
                            alt={`Unit ${unit.unitNumber}`}
                            className="max-w-60px max-h-60px object-cover rounded-4px"
                          />
                        </div>
                      )}
                    </td>
                    <td className="p-12px border-b flex gap-2">
                      <Link
                        to={`/unit/${unit.id}`}
                        className="bg-[#22c55e] text-white py-6px px-12px rounded-md text-12px hover:bg-[#1e7e34] transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => unit.id && handleDelete(unit.id)}
                        className="bg-[#dc3545] text-white py-6px px-12px border-none rounded-4px cursor-pointer text-12px hover:bg-[#c82333] disabled:opacity-60 disabled:cursor-not-allowed"
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
};

export default ListUnits;