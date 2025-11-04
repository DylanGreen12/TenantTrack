import React from "react";
import { UserDto } from "../../models/UserDto";
import { Link } from "react-router-dom";

interface UsersPageProps {
  currentUser?: UserDto;
}

const EditUsers: React.FC<UsersPageProps> = ({ }) => {
  return (
    <div className="p-20px max-w-1200px mx-auto">
      <div className="flex justify-between items-center mb-10px">
        <h1 className="text-gray-800 text-2xl font-semibold">User Management</h1>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          Administrator
        </div>
      </div>

      <div className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px">
        <h2 className="text-lg font-semibold mb-24px">Admin Tools</h2>
        
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-md font-semibold mb-2">Add Administrator</h3>
            <p className="text-gray-600 mb-4">
              Create a new administrator account.
            </p>
            <Link 
              to="/admin/add-admin"
              className="bg-purple-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-purple-700 transition-colors inline-block"
            >
              Add Admin User
            </Link>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-md font-semibold mb-2">View All Users</h3>
            <p className="text-gray-600 mb-4">
              View and manage all users in the system (WIP).
            </p>
            <button
              disabled
              className="bg-gray-400 text-white py-10px px-20px rounded-8px text-14px cursor-not-allowed opacity-60"
            >
              View Users (WIP)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUsers;