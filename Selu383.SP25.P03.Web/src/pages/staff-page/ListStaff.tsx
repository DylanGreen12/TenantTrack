import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { Link } from "react-router-dom";

interface StaffDto {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  propertyId: number;
}

interface PropertyDto {
  id: number;
  name: string;
  userId: number;
}

interface EditStaffProps {
  currentUser?: UserDto;
}

const ListStaff: React.FC<EditStaffProps> = ({ currentUser }) => {
  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyDto[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchStaff();
      fetchProperties();
    }
  }, [currentUser]);

  const fetchStaff = async () => {
    try {
      const response = await axios.get<StaffDto[]>("/api/staff");
      setStaff(response.data);
    } catch (err) {
      setError("Failed to fetch staff");
      setMessage("Failed to fetch staff.");
      setShowMessage(true);
      console.error("Error fetching staff:", err);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get<PropertyDto[]>("/api/properties");
      setAllProperties(response.data);
    } catch (err) {
      setError("Failed to fetch properties");
      setMessage("Failed to fetch properties.");
      setShowMessage(true);
      console.error("Error fetching properties:", err);
    }
  };

  // Filter properties to only show current user's properties
  const userProperties = allProperties.filter(property => 
    currentUser && property.userId === parseInt(currentUser.id)
  );

  // Filter staff to only show staff from user's properties
  const userStaff = staff.filter(staffMember => 
    userProperties.some(property => property.id === staffMember.propertyId)
  );

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    try {
      await axios.delete(`/api/staff/${id}`);
      setMessage("Staff member deleted successfully!");
      setShowMessage(true);
      await fetchStaff();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to delete staff member";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error deleting staff:", err);
    }
  };

  return (
    <div className="staff-list">
    <h2> Staff Members ({userStaff.length})</h2>
    {userStaff.length === 0 ? (
        <p>You don't have any staff members yet. Add your first staff member above!</p>
    ) : (
        <>
        <table className="w-full border-collapse mt-5 text-sm bg-[#fdfefe] rounded-lg overflow-hidden shadow-sm">
            <thead>
            <tr className="bg-[#f3f4f6]">
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">First Name</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Last Name</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Email</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Phone</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Position</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Property</th>
                <th className="p-12px text-left border-b font-semibold text-[#374151]">Actions</th>
            </tr>
            </thead>
            <tbody>
            {userStaff.map((staffMember, i) => {
                const property = userProperties.find(p => p.id === staffMember.propertyId);
                return (
                <tr
                    key={staffMember.id}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"} hover:bg-[#ebf5ff] transition-colors`}
                >
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{staffMember.firstName}</td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{staffMember.lastName}</td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{staffMember.email}</td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{staffMember.phone}</td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{staffMember.position}</td>
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{property?.name || staffMember.propertyId}</td>
                    <td className="p-12px border-b flex gap-2">
                    <Link
                        to={`/staff/${staffMember.id}`}
                        className="bg-[#22c55e] text-white py-6px px-12px rounded-md text-12px hover:bg-[#1e7e34] transition-colors"
                    >
                        Edit
                    </Link>
                    <button
                        onClick={() => staffMember.id && handleDelete(staffMember.id)}
                        className="bg-[#ef4444] text-white py-6px px-12px rounded-md text-12px hover:bg-[#dc2626] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Delete
                    </button>
                    </td>
                </tr>
                );
            })}
            </tbody>
        </table>

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
        </>
    )}
    </div>
      
  );
};
        

export default ListStaff;
