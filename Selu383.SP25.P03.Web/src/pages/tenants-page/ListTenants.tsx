import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { Link } from "react-router-dom";

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
  propertyId: number;
  status: string;
}

interface PropertyDto {
  id: number;
  name: string;
  userId: number;
}

interface ListTenantsProps {
  currentUser?: UserDto;
}

const ListTenants: React.FC<ListTenantsProps> = ({ currentUser }) => {
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyDto[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchField, setSearchField] = useState<"firstName" | "lastName" | "unitNumber">("firstName");

  useEffect(() => {
      if (currentUser) {
        fetchTenants();
        fetchUnits();
        fetchProperties();
      }
    }, [currentUser]);

  const fetchTenants = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      setTenants(response.data);
    } catch (err) {
      setError("Failed to fetch tenants");
      setMessage("Failed to fetch tenants.");
      setShowMessage(true);
      console.error("Error fetching tenants:", err);
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

  const fetchProperties = async () => {
    try {
      const response = await axios.get<PropertyDto[]>("/api/properties");
      setAllProperties(response.data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  // Filter properties to only show current user's properties
  const userProperties = allProperties.filter(property => 
    currentUser && property.userId === parseInt(currentUser.id)
  );

  // Filter tenants to only show tenants from user's properties
  const userTenants = tenants.filter(tenant => 
    userProperties.some(property => 
      units.some(unit => unit.id === tenant.unitId && unit.propertyId === property.id)
    )
  );

  const filteredTenants = userTenants.filter(t => {
    const value = t[searchField] || "";
    return value.toLowerCase().includes(searchTerm.toLowerCase());
  });

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this tenant?")) {
        return;
        }

        try {
        await axios.delete(`/api/tenants/${id}`);
        setMessage("Tenant deleted successfully!");
        setShowMessage(true);
        await fetchTenants();
        await fetchUnits(); // Refresh units to update status
        } catch (err: any) {
        const errorMsg = err.response?.data?.message || "Failed to delete tenant";
        setError(errorMsg);
        setMessage(errorMsg);
        setShowMessage(true);
        console.error("Error deleting tenant:", err);
        }
    };

  return (
      <div className="tenants-list">
        <h2>Tenants ({filteredTenants.length})</h2>
        <div className="flex items-center w-full max-w-xl gap-2">
          {/* Search Field Dropdown */}
          <select
            value={searchField}
            onChange={(e) =>
              setSearchField(
                e.target.value as "firstName" | "lastName" | "unitNumber"
              )
            }
            className="px-3 py-2 rounded-full border border-gray-300 text-black bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="firstName">First Name</option>
            <option value="lastName">Last Name</option>
            <option value="unitNumber">Unit</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder={`Search by ${searchField}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black shadow-sm"
            />
          </div>
        </div>
        {filteredTenants.length === 0 ? (
          <p>No Tenants Found</p>
        ) : (

           
          <table className="w-full border-collapse mt-5 text-sm bg-[#fdfefe] rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Unit</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">First Name</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Last Name</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Phone Number</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Email</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Created</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Updated</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((t,i) => (
                <tr
                  key={t.id}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"} hover:bg-[#ebf5ff] transition-colors`}
                >
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{t.unitNumber}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{t.firstName}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{t.lastName}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{t.phoneNumber}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{t.email}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{new Date(t.updatedAt).toLocaleDateString()}</td>
                  <td className="p-12px border-b flex gap-2">
                    <Link
                      to={`/tenant/${t.id}`}
                      className="bg-[#22c55e] text-white py-6px px-12px rounded-md text-12px hover:bg-[#1e7e34] transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => t.id && handleDelete(t.id)}
                      className="bg-[#ef4444] text-white py-6px px-12px rounded-md text-12px hover:bg-[#dc2626] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                     Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
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
          </table>
        )}
      </div>

  );
};

export default ListTenants;