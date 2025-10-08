import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { Link } from "react-router-dom";

interface LeaseDto {
  id?: number;
  unitNumber: string;
  tenantId: number;
  firstName: string;
  lastName: string;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  status: string;
}

interface TenantDto {
  id?: number;
  unitNumber: string;
  firstName: string;
  lastName: string;
  unitId: number;
}

interface UnitDto {
  id: number;
  unitNumber: string;
  propertyId: number;
}

interface PropertyDto {
  id: number;
  name: string;
  userId: number;
}

interface EditLeasesProps {
  currentUser?: UserDto;
}

const ListLeases: React.FC<EditLeasesProps> = ({ currentUser }) => {
  const [leases, setLeases] = useState<LeaseDto[]>([]);
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyDto[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<"firstName" | "lastName" | "unitNumber">("firstName");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchLeases();
      fetchTenants();
      fetchUnits();
      fetchProperties();
    }
  }, [currentUser]);

  const fetchLeases = async () => {
    try {
      const response = await axios.get<LeaseDto[]>("/api/leases");
      setLeases(response.data);
    } catch (err) {
      setError("Failed to fetch leases");
      setMessage("Failed to fetch leases.");
      setShowMessage(true);
      console.error("Error fetching leases:", err);
    }
  };

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

  // Filter leases to only show leases from user's properties
  const userLeases = leases.filter(lease => 
    userTenants.some(tenant => tenant.id === lease.tenantId)
  );

  const filteredLeases = userLeases.filter(lease =>
    userTenants.some(tenant => tenant.id === lease.tenantId)
  ).filter(lease => {
    // Search filter
    const fieldValue = lease[searchField]?.toString().toLowerCase() || "";
    const matchesSearch = fieldValue.includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filterStatus ? lease.status === filterStatus : true;

    // Date filter
    const leaseStart = new Date(lease.startDate);
    const leaseEnd = new Date(lease.endDate);

    const matchesStartDate = filterStartDate ? leaseStart >= new Date(filterStartDate) : true;
    const matchesEndDate = filterEndDate ? leaseEnd <= new Date(filterEndDate) : true;

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });




  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this lease?")) {
      return;
    }

    try {
      await axios.delete(`/api/leases/${id}`);
      setMessage("Lease deleted successfully!");
      setShowMessage(true);
      await fetchLeases();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to delete lease";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error deleting lease:", err);
    }
  };

  return (
      <div className="leases-list">
        <h2>Leases ({filteredLeases.length})</h2>
        {/* Filters Section */}
        <div className="mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow">
              {/* Search Field */}

              {/* Search Term with magnifying glass */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Term
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search by ${searchField}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-10 pr-3 py-2 rounded-md border border-gray-300 text-black bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                  />
                  {/* Magnifying glass icon */}
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search By
                </label>
                <select
                  value={searchField}
                  onChange={(e) =>
                    setSearchField(
                      e.target.value as "firstName" | "lastName" | "unitNumber"
                    )
                  }
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-black bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="firstName">First Name</option>
                  <option value="lastName">Last Name</option>
                  <option value="unitNumber">Unit</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-black bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">--Choose Status--</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date (From)
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-64 px-3 py-2 rounded-md border border-gray-300 text-black bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (To)
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-64 px-3 py-2 rounded-md border border-gray-300 text-black bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
        {filteredLeases.length === 0 ? (
          <p>No leases match your filters.</p>
        ) : (
          <table className="w-full border-collapse mt-5 text-sm bg-[#fdfefe] rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Unit</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">First Name</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Last Name</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Start Date</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">End Date</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Rent</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Deposit</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Status</th>
                <th className="p-12px text-left border-b font-semibold text-[#374151]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeases.map((lease, i) => (
                <tr
                  key={lease.id}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"} hover:bg-[#ebf5ff] transition-colors`}
                >
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{lease.unitNumber}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{lease.firstName}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{lease.lastName}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                    {new Date(lease.startDate).toLocaleDateString()}
                  </td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                    {new Date(lease.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">${lease.rent.toFixed(2)}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">${lease.deposit.toFixed(2)}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{lease.status}</td>
                  <td className="p-12px border-b flex gap-2">
                    <Link
                      to={`/lease/${lease.id}`}
                      className="bg-[#22c55e] text-white py-6px px-12px rounded-md text-12px hover:bg-[#1e7e34] transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => lease.id && handleDelete(lease.id)}
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

export default ListLeases;

