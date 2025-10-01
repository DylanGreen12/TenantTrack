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
        <h2>Your Leases ({userLeases.length})</h2>
        {userLeases.length === 0 ? (
          <p>You don't have any leases yet. Add your first lease above!</p>
        ) : (
          <table className="w-full text-white border-collapse mt-20px">
            <thead>
              <tr>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Unit</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">First Name</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Last Name</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Start Date</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">End Date</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Rent</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Deposit</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Status</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userLeases.map(lease => (
                <tr key={lease.id} className="bg-[#322c35]">
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{lease.unitNumber}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{lease.firstName}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{lease.lastName}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{new Date(lease.startDate).toLocaleDateString()}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{new Date(lease.endDate).toLocaleDateString()}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">${lease.rent.toFixed(2)}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">${lease.deposit.toFixed(2)}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{lease.status}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">
                    <Link
                        to={`/editleases/${lease.id}`}
                        className="bg-[#28a745] text-white py-6px px-12px mr-5px border-none rounded-4px cursor-pointer text-12px hover:bg-[#1e7e34]"
                    >
                        Edit
                    </Link>
                    <button
                      onClick={() => lease.id && handleDelete(lease.id)}
                      className="bg-[#dc3545] text-white py-6px px-12px border-none rounded-4px cursor-pointer text-12px hover:bg-[#c82333] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {error && showMessage && (
            <div className="text-[#721c24] my-10px py-10px px-15px bg-[#f8d7da] border border-[#f5c6cb] rounded-4px">
                {error}
            </div>
            )}

            {!error && message && (
            <div className="text-[#155724] my-10px py-10px px-15px bg-[#d4edda] border border-[#c3e6cb] rounded-4px">
                {message}
            </div>
            )}
          </table>
        )}
    </div>
  );
};

export default ListLeases;

