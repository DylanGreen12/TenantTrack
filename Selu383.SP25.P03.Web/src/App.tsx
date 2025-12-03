import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { LoginForm } from "./pages/LoginForm";
import { SignUpForm } from "./pages/SignUpForm";
import VerifyEmail from "./pages/VerifyEmail";
import AwaitingVerification from "./pages/AwaitingVerification";
import { UserDto } from "./models/UserDto";
import LandlordDashboard from './pages/LandlordDashboard'
import EditProperties from './pages/properties-page/EditProperties'
import EditUnits from './pages/units-page/EditUnits'
import ListUnits from './pages/units-page/ListUnits'
import PropertiesView from "./pages/PropertiesView";
import EditTenants from './pages/tenants-page/EditTenants'
import ListTenants from './pages/tenants-page/ListTenants';
import TenantDashboard from './pages/tenants-page/TenantDashboard';
import EditLeases from './pages/leases-page/EditLeases'
import ListLeases from './pages/leases-page/ListLeases';
import EditStaff from './pages/staff-page/EditStaff'
import ListStaff from './pages/staff-page/ListStaff'
import StaffDashboard from './pages/staff-page/StaffDashboard';
import EditContactInfo from './pages/EditContactInfo';
import PaymentsPage from "./pages/payments-page/Payments";
import RecordPayment from "./pages/payments-page/RecordPayment";
import MakePayment from "./pages/payments-page/MakePayment";
import MaintenanceRequests from "./pages/maintenance-requests-page/MaintenanceRequests";
import EditMaintenanceRequests from "./pages/maintenance-requests-page/EditMaintenanceRequests";
import AddAdminUsers from "./pages/admin-page/AddAdminUsers";
import UsersPage from "./pages/admin-page/EditUsers";
import VerifyEmailChange from './pages/VerifyEmailChange';
import VerifyPasswordChange from './pages/VerifyPasswordChange';

import {
  HomeIcon,
  BuildingOffice2Icon,
  HomeModernIcon,
  BriefcaseIcon,
  UserIcon,
  DocumentIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
  BanknotesIcon,
  WrenchScrewdriverIcon,
  UsersIcon
} from '@heroicons/react/24/solid';


// Auth service functions
const authService = {
  getCurrentUser: (): UserDto | null => {
    try {
      const userData = localStorage.getItem('currentUser');
      if (!userData) return null;

      const user = JSON.parse(userData);

      // Validate user data structure - clear if invalid
      if (!user || typeof user !== 'object') {
        console.warn('Invalid user data in localStorage, clearing...');
        localStorage.removeItem('currentUser');
        return null;
      }

      // Validate roles array - clear if invalid
      if (!user.roles || !Array.isArray(user.roles)) {
        console.warn('User data has invalid roles structure, clearing localStorage...');
        localStorage.removeItem('currentUser');
        return null;
      }

      // Validate required fields
      if (!user.id || !user.userName) {
        console.warn('User data missing required fields, clearing localStorage...');
        localStorage.removeItem('currentUser');
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error getting current user from storage:', error);
      localStorage.removeItem('currentUser');
      return null;
    }
  },

  setCurrentUser: (user: UserDto | null): void => {
    try {
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('currentUser');
      }
    } catch (error) {
      console.error('Error setting current user in storage:', error);
    }
  },

  logout: (): void => {
    try {
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
};

// Role-based access control helpers
const hasManagementAccess = (user: UserDto | null): boolean => {
  if (!user || !user.roles || !Array.isArray(user.roles)) return false;
  return user.roles.includes('Landlord') || user.roles.includes('Admin');
};

const isStaff = (user: UserDto | null): boolean => {
  if (!user || !user.roles || !Array.isArray(user.roles)) return false;
  return user.roles.includes('Maintenance');
};

const isTenant = (user: UserDto | null): boolean => {
  if (!user || !user.roles || !Array.isArray(user.roles)) return false;
  return user.roles.includes('Tenant');
};

const canAccessPayments = (user: UserDto | null): boolean => {
  return hasManagementAccess(user) || isStaff(user) || isTenant(user);
};

const canAccessMaintenance = (user: UserDto | null): boolean => {
  return hasManagementAccess(user) || isStaff(user) || isTenant(user);
};

const isAdmin = (user: UserDto | null): boolean => {
  if (!user || !user.roles || !Array.isArray(user.roles)) return false;
  return user.roles.includes('Admin');
};

function App() {
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isManageDropdownOpen, setIsManageDropdownOpen] = useState(false);

  // Load user from localStorage on component mount
  useEffect(() => {
    const savedUser = authService.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  // Update localStorage whenever currentUser changes
  useEffect(() => {
    authService.setCurrentUser(currentUser);
  }, [currentUser]);

  const handleLoginSuccess = (user: UserDto) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // Handle user updates from EditContactInfo
  const handleUserUpdate = (updatedUser: UserDto) => {
    setCurrentUser(updatedUser);
  };

  const canManage = hasManagementAccess(currentUser);
  const userIsAdmin = isAdmin(currentUser);

  return (
    <Router>
      <div className="flex flex-col min-h-screen font-sans">
        {/* --- Top Navbar --- */}
        <header className="bg-[#f8f9fb]/90 backdrop-blur-sm shadow-md flex justify-between items-center px-6 py-3 h-14 border-b-4 border-[#4b5ed7]">
          <div className="flex items-center space-x-4">
            {/* Hamburger menu for toggling sidebar */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-200 transition bg-white"
              title="Toggle Sidebar"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo / Title */}
            <h1 className="text-2xl font-bold tracking-[0.05em] bg-gradient-to-r from-[#667eea] to-[#764ba2] text-transparent bg-clip-text">
              Tenant Track
            </h1>
          </div>

          {/* Right side: user info / login */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <div className="flex items-center space-x-2 text-blue-600">
                  <p className="font-semibold truncate" title={currentUser.userName}>
                    {currentUser.userName}
                  </p>
                  <p className="text-xs">({currentUser.roles?.join(", ") || "No roles"})</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2 px-4 rounded-md text-sm font-semibold shadow-sm hover:from-[#5563d6] hover:to-[#653eaa] transition-all"
                >
                  🔑 Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2 px-4 rounded-md text-sm font-semibold shadow-sm hover:from-[#5563d6] hover:to-[#653eaa] transition-all"
                >
                  📝 Sign Up
                </Link>
              </>
            )}
          </div>
        </header>

        {/* --- Body: Sidebar + Main Content --- */}
        <div className="flex flex-1 min-h-0">

          {/* Sidebar */}
          <aside className={`bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex flex-col shadow-lg overflow-y-auto transition-all duration-300 sticky top-0 h-screen
            ${isSidebarOpen ? 'w-60' : 'w-24'}`}>

            <nav className="flex-1 p-4 space-y-2">
              <ul className="list-none space-y-2">
                <li>
                  <Link
                    to="/"
                    className={`flex items-center text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block rounded-lg hover:bg-white/10
                                ${isSidebarOpen ? 'justify-start px-4 py-3' : 'justify-center px-0 py-3'}`}
                  >
                    <HomeIcon className="h-6 w-6 text-white" />
                    <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>Home</span>
                  </Link>
                </li>

                {/* Manage Dropdown - Only show for Landlords/Admins */}
                {canManage && (
                  <li className="relative">
                    <button
                      onClick={() => setIsManageDropdownOpen(!isManageDropdownOpen)}
                      className={`flex items-center justify-between w-full text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 rounded-lg hover:bg-white/10
                                  ${isSidebarOpen ? 'px-4 py-3' : 'px-0 py-3 justify-center'} bg-gradient-to-r from-[#667eea] to-[#764ba2]`}
                    >
                      <div className="flex items-center">
                        <Cog6ToothIcon className="h-6 w-6 text-white" />
                        <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>Manage</span>
                      </div>
                      {isSidebarOpen && (
                        <span>
                          {isManageDropdownOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                        </span>
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {isManageDropdownOpen && isSidebarOpen && (
                      <ul className="ml-6 mt-2 space-y-1 border-l-2 border-white/20 pl-4 list-none">
                        {/* Properties */}
                        <li>
                          <Link
                            to="/property/create"
                            className="flex items-center text-white/80 no-underline text-sm transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-2 rounded-lg hover:bg-white/10"
                          >
                            <BuildingOfficeIcon className="h-5 w-5 text-white/80 mr-2" />
                            Properties
                          </Link>
                        </li>

                        {/* Units */}
                        <li>
                          <Link
                            to="/unit/create"
                            className="flex items-center text-white/80 no-underline text-sm transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-2 rounded-lg hover:bg-white/10"
                          >
                            <HomeModernIcon className="h-5 w-5 text-white/80 mr-2" />
                            Units
                          </Link>
                        </li>

                        {/* Staff */}
                        <li>
                          <Link
                            to="/staff/create"
                            className="flex items-center text-white/80 no-underline text-sm transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-2 rounded-lg hover:bg-white/10"
                          >
                            <BriefcaseIcon className="h-5 w-5 text-white/80 mr-2" />
                            Staff
                          </Link>
                        </li>

                        {/* Tenants */}
                        <li>
                          <Link
                            to="/tenant/create"
                            className="flex items-center text-white/80 no-underline text-sm transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-2 rounded-lg hover:bg-white/10"
                          >
                            <UserIcon className="h-5 w-5 text-white/80 mr-2" />
                            Tenants
                          </Link>
                        </li>

                        {/* Leases */}
                        <li>
                          <Link
                            to="/lease/create"
                            className="flex items-center text-white/80 no-underline text-sm transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-2 rounded-lg hover:bg-white/10"
                          >
                            <DocumentIcon className="h-5 w-5 text-white/80 mr-2" />
                            Leases
                          </Link>
                        </li> 

                        {/* Payments - For Landlords */}
                        <li>
                          <Link
                            to="/payments"
                            className="flex items-center text-white/80 no-underline text-sm transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-2 rounded-lg hover:bg-white/10"
                            onClick={() => setIsManageDropdownOpen(false)}
                          >
                            <BanknotesIcon className="h-5 w-5 text-white/80 mr-2" />
                            Payments
                          </Link>
                        </li>

                        {/* Maintenance - For Landlords */}
                        <li>
                          <Link
                            to="/maintenancerequests"
                            className="flex items-center text-white/80 no-underline text-sm transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-2 rounded-lg hover:bg-white/10"
                            onClick={() => setIsManageDropdownOpen(false)}
                          >
                            <WrenchScrewdriverIcon className="h-5 w-5 text-white/80 mr-2" />
                            Maintenance
                          </Link>
                        </li>

                        {/* Users - Only for Admins */}
                        {userIsAdmin && (
                          <li>
                            <Link
                              to="/admin/users"
                              className="flex items-center text-white/80 no-underline text-sm transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-2 rounded-lg hover:bg-white/10"
                            >
                              <UsersIcon className="h-5 w-5 text-white/80 mr-2" />
                              Users
                            </Link>
                          </li>
                        )}

                      </ul>
                    )}
                  </li>
                )}

                {/* Payments - For Tenants and Staff (standalone) - only if not showing in Manage dropdown */}
                {((isTenant(currentUser) || isStaff(currentUser)) && !canManage) && (
                  <li>
                    <Link
                      to="/payments"
                      className={`flex items-center text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block rounded-lg hover:bg-white/10
                                  ${isSidebarOpen ? 'justify-start px-4 py-3' : 'justify-center px-0 py-3'}`}
                    >
                      <BanknotesIcon className="h-6 w-6 text-white" />
                      <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>
                        Payments
                      </span>
                    </Link>
                  </li>
                )}

                {/* Maintenance - For Tenants and Staff (standalone) - only if not showing in Manage dropdown */}
                {((isTenant(currentUser) || isStaff(currentUser)) && !canManage) && (
                  <li>
                    <Link
                      to="/maintenancerequests"
                      className={`flex items-center text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block rounded-lg hover:bg-white/10
                                  ${isSidebarOpen ? 'justify-start px-4 py-3' : 'justify-center px-0 py-3'}`}
                    >
                      <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
                      <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>
                        Maintenance
                      </span>
                    </Link>
                  </li>
                )}

                {/* Public Links */}
                <li>
                  <Link
                    to="/properties"
                    className={`flex items-center text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block rounded-lg hover:bg-white/10
                                ${isSidebarOpen ? 'justify-start px-4 py-3' : 'justify-center px-0 py-3'}`}
                  >
                    <BuildingOffice2Icon className="h-6 w-6 text-white" />
                    <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>View Properties</span>
                  </Link>
                </li>

                {/* Contact Info - Only show when user is logged in */}
                {currentUser && (
                  <li>
                    <Link
                      to="/editcontact"
                      className={`flex items-center text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block rounded-lg hover:bg-white/10
                                  ${isSidebarOpen ? 'justify-start px-4 py-3' : 'justify-center px-0 py-3'}`}
                    >
                      <PhoneIcon className="h-6 w-6 text-white" />
                      <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>User Info</span>
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </aside>

          {/* Main Content - Scrollable area */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-8 text-gray-800">
              <Routes>
                <Route path="/" element={
                  canManage ? (
                    <LandlordDashboard />
                  ) : isTenant(currentUser) ? (
                    <TenantDashboard currentUser={currentUser || undefined} />
                  ) : isStaff(currentUser) ? (
                  <StaffDashboard currentUser={currentUser || undefined} />
                  ) : (
                    <PropertiesView currentUser={currentUser || undefined} />
                  )
                } />
                
                {/* Management Routes - Protected by role */}
                <Route path="/property/create" element={
                  canManage ? 
                    <EditProperties currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />
                
                <Route path="/unit/create" element={
                  canManage ? 
                    <EditUnits currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />
                
                <Route path="/unit/:id" element={
                  canManage ? 
                    <EditUnits currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />

                <Route path="/units" element={
                  canManage ? 
                    <ListUnits currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />
                
                <Route path="/landlord-dashboard" element={
                  canManage ?
                    <LandlordDashboard /> :
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />
                
                <Route path="/staff/create" element={
                  canManage ? 
                    <EditStaff currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />
                
                <Route path="/staff/:id" element={
                  canManage ? 
                    <EditStaff currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />

                <Route path="/staff" element={
                  canManage ? 
                    <ListStaff currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />
                
                <Route path="/tenant/create" element={
                  canManage ? 
                    <EditTenants currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />
                
                <Route path="/tenant/:id" element={
                  canManage ? 
                    <EditTenants currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />

                <Route path="/tenants" element={
                  canManage ? 
                    <ListTenants currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />
                
                <Route path="/lease/create" element={
                  canManage ? 
                    <EditLeases currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />
                
                <Route path="/lease/:id" element={
                  canManage ? 
                    <EditLeases currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />

                <Route path="/leases" element={
                  canManage ? 
                    <ListLeases currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                } />

                {/* Admin Routes */}
                <Route path="/admin/users" element={
                  userIsAdmin ? 
                    <UsersPage currentUser={currentUser || undefined} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be an Administrator to access this page.</p>
                    </div>
                } />

                <Route path="/admin/add-admin" element={
                  userIsAdmin ? 
                    <AddAdminUsers currentUser={currentUser || undefined} onAdminAdded={() => {}} /> : 
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be an Administrator to access this page.</p>
                    </div>
                } />
                
                {/* Public Routes */}
                <Route path="/properties" element={<PropertiesView currentUser={currentUser || undefined} />} />
                
                {/* Contact Info Route - Protected by login */}
                <Route path="/editcontact" element={
                  currentUser ? (
                    <EditContactInfo 
                      currentUser={currentUser || undefined} 
                      onUserUpdate={handleUserUpdate} 
                    />
                  ) : (
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be logged in to access this page.</p>
                    </div>
                  )
                } />

                {/* Payment Routes - Accessible by Landlords, Staff, and Tenants */}
                <Route path="/payments" element={
                  canAccessPayments(currentUser) ? (
                    <PaymentsPage currentUser={currentUser || undefined} />
                  ) : (
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be logged in to access this page.</p>
                    </div>
                  )
                } />
                
                <Route path="/recordpayment" element={
                  canManage ? (
                    <RecordPayment currentUser={currentUser || undefined} />
                  ) : (
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Landlord or Admin to access this page.</p>
                    </div>
                  )
                } />
                
                <Route path="/makepayment" element={
                  isTenant(currentUser) ? (
                    <MakePayment currentUser={currentUser || undefined} />
                  ) : (
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be a Tenant to access this page.</p>
                    </div>
                  )
                } />
                
                {/* Maintenance Request Routes - Accessible by Landlords, Staff, and Tenants */}
                <Route path="/maintenancerequests" element={
                  canAccessMaintenance(currentUser) ? (
                    <MaintenanceRequests currentUser={currentUser || undefined} />
                  ) : (
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be logged in to access this page.</p>
                    </div>
                  )
                } />
                
                <Route path="/editmaintenancerequests" element={
                  canAccessMaintenance(currentUser) ? (
                    <EditMaintenanceRequests currentUser={currentUser || undefined} />
                  ) : (
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be logged in to access this page.</p>
                    </div>
                  )
                } />
                
                <Route path="/editmaintenancerequests/:id" element={
                  canAccessMaintenance(currentUser) ? (
                    <EditMaintenanceRequests currentUser={currentUser || undefined} />
                  ) : (
                    <div className="text-center py-8">
                      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                      <p>You need to be logged in to access this page.</p>
                    </div>
                  )
                } />

                {/* Auth Routes */}
                <Route path="/login" element={
                  <LoginForm
                    onLoginSuccess={handleLoginSuccess}
                    onSwitchToSignUp={() => window.location.href = '/signup'}
                  />
                } />

                <Route path="/signup" element={
                  <SignUpForm
                    onSignUpSuccess={handleLoginSuccess}
                    onSwitchToLogin={() => window.location.href = '/login'}
                  />
                } />

                {/* Email Verification Routes */}
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/awaiting-verification" element={<AwaitingVerification />} />

                {/* Email/Password Change Verification Routes - Public (no authentication required) */}
                <Route path="/verify-email-change" element={<VerifyEmailChange />} />
                <Route path="/verify-password-change" element={<VerifyPasswordChange />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App