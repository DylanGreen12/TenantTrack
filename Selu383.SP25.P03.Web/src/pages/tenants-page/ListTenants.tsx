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
  const [searchField, setSearchField] = useState<"firstName" | "lastName" | "unitNumber">("firstName"); // 🔹 new state

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
        <h2>Your Tenants ({filteredTenants.length})</h2>
        <div className="flex gap-2 mb-4">
            <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as "firstName" | "lastName" | "unitNumber")}
            className="px-3 py-2 rounded border text-black"
            >
            <option value="firstName">First Name</option>
            <option value="lastName">Last Name</option>
            <option value="unitNumber">Unit Number</option>
            </select>

            <input
            type="text"
            placeholder={`Search by ${searchField}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 rounded border text-black flex-1"
            />
        </div>
        {filteredTenants.length === 0 ? (
          <p>No Tenants Found</p>
        ) : (

           
          <table className="w-full text-white border-collapse mt-20px">
            <thead>
              <tr>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Unit</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">First Name</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Last Name</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Phone Number</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Email</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Created</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Updated</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map(t => (
                <tr key={t.id} className="bg-[#322c35]">
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{t.unitNumber}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{t.firstName}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{t.lastName}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{t.phoneNumber}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{t.email}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{new Date(t.updatedAt).toLocaleDateString()}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">
                    <Link
                        to={`/edittenants/${t.id}`}
                        className="bg-[#28a745] text-white py-6px px-12px mr-5px border-none rounded-4px cursor-pointer text-12px hover:bg-[#1e7e34]"
                    >
                        Edit
                    </Link>
                    <button
                      onClick={() => t.id && handleDelete(t.id)}
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

export default ListTenants;