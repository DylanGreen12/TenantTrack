import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { LoginForm } from "./pages/LoginForm";
import { SignUpForm } from "./pages/SignUpForm";
import { UserDto } from "./models/UserDto";
import LandlordDashboard from './pages/LandlordDashboard'
import EditProperties from './pages/properties-page/EditProperties'
import EditUnits from './pages/units-page/EditUnits'
import ListUnits from './pages/units-page/ListUnits'
import PropertiesView from "./pages/PropertiesView";
import EditTenants from './pages/tenants-page/EditTenants'
import ListTenants from './pages/tenants-page/ListTenants';
import EditLeases from './pages/leases-page/EditLeases'
import ListLeases from './pages/leases-page/ListLeases';
import EditStaff from './pages/staff-page/EditStaff'
import ListStaff from './pages/staff-page/ListStaff'
import EditContactInfo from './pages/EditContactInfo';
import PaymentsPage from "./pages/payments-page/Payments";
import RecordPayment from "./pages/payments-page/RecordPayment";
import MakePayment from "./pages/payments-page/MakePayment";
import MaintenanceRequests from "./pages/maintenance-requests-page/MaintenanceRequests";
import EditMaintenanceRequests from "./pages/maintenance-requests-page/EditMaintenanceRequests";

// Auth service functions
const authService = {
  getCurrentUser: (): UserDto | null => {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user from storage:', error);
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

// Role-based access control helper
const hasManagementAccess = (user: UserDto | null): boolean => {
  if (!user || !user.roles) return false;
  return user.roles.includes('Landlord') || user.roles.includes('Admin');
};

function App() {
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);

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

  return (
    <Router>
      <div className="flex h-screen font-sans overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex flex-col shadow-lg overflow-y-auto">
          <div className="p-6 flex-1 flex flex-col">
            <div>
              {/* Sidebar Header */}
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-white">TenantTrack</h2>
              </div>

              {/* Navigation */}
              <nav className="flex-1">
                <ul className="list-none p-0 m-0 space-y-2">
                  <li>
                    <Link to="/" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-3 px-4 rounded-lg hover:bg-white/10">
                      🏠 Home
                    </Link>
                  </li>
                
                  {/* Management Links - Only show for Landlords and Admins */}
                  {canManage && (
                    <>
                      <li>
                        <Link to="/editproperties" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-3 px-4 rounded-lg hover:bg-white/10">
                          🏢 Manage Properties
                        </Link>
                      </li>
                      <li>
                        <Link to="/editunits" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-3 px-4 rounded-lg hover:bg-white/10">
                          📦 Manage Units
                        </Link>
                      </li>
                      <li>
                        <Link to="/landlord-dashboard" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-3 px-4 rounded-lg hover:bg-white/10">
                         📊 Landlord Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link to="/editstaff" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-3 px-4 rounded-lg hover:bg-white/10">
                          👥 Manage Staff
                        </Link>
                      </li>
                      <li>
                      <Link to="/edittenants" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-3 px-4 rounded-lg hover:bg-white/10">
                        👤 Manage Tenants
                      </Link>
                    </li>
                    <li>
                      <Link to="/editleases" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-3 px-4 rounded-lg hover:bg-white/10">
                        📄 Manage Leases
                      </Link>
                    </li>
                    </>
                  )}
                  
                  {/* Public Links - Show to everyone */}
                  <li>
                    <Link to="/editcontact" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-3 px-4 rounded-lg hover:bg-white/10">
                      📧 Edit Contact Info
                    </Link>
                  </li>
                  <li>
                    <Link to="/properties" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-3 px-4 rounded-lg hover:bg-white/10">
                      📋 View Properties
                    </Link>
                  </li>
                  <li>
                  <Link to="/payments" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-3 px-4 rounded-lg hover:bg-white/10">
                    💵 Payments
                  </Link>
                </li>
                <li>
                  <Link to="/maintenancerequests" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block py-3 px-4 rounded-lg hover:bg-white/10">
                    🛠️ Maintenance
                  </Link>
                </li>
              </ul>
              </nav>
            </div>

            {/* User Info */}
            <div className="mt-auto pt-6 border-t border-white/20">
              {currentUser ? (
                <div className="text-center">
                  <p className="font-semibold truncate" title={currentUser.userName}>
                    {currentUser.userName}
                  </p>
                  <p className="text-white/80 text-sm">
                    {currentUser.roles?.join(', ') || "No roles"}
                  </p>
                  {/* Compact contact info */}
                  {currentUser.email && (
                    <p className="text-white/70 text-xs mt-1 truncate" title={currentUser.email}>
                      📧 {currentUser.email}
                    </p>
                  )}
                  {currentUser.phone && (
                    <p className="text-white/70 text-xs mt-1 truncate" title={currentUser.phone}>
                      📞 {currentUser.phone}
                    </p>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white border-none py-2 px-4 rounded-md cursor-pointer w-full mt-3 transition-colors duration-200 ease hover:bg-red-600 text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link to="/login" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 block py-2 px-4 rounded-lg hover:bg-white/10 text-sm text-center">
                    🔑 Login
                  </Link>

                  <Link to="/signup" className="text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 block py-2 px-4 rounded-lg hover:bg-white/10 text-sm text-center">
                    📝 Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>
    
        {/* Main Content - Scrollable area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8 text-gray-800">
            <Routes>
              <Route path="/" element={<div>Welcome to TenantTrack! Select an option from the sidebar.</div>} />
              
              {/* Management Routes - Protected by role */}
              <Route path="/editproperties" element={
                canManage ? 
                  <EditProperties currentUser={currentUser || undefined} /> : 
                  <div className="text-center py-8">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p>You need to be a Landlord or Admin to access this page.</p>
                  </div>
              } />
              
              <Route path="/editunits" element={
                canManage ? 
                  <EditUnits currentUser={currentUser || undefined} /> : 
                  <div className="text-center py-8">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p>You need to be a Landlord or Admin to access this page.</p>
                  </div>
              } />
              
              <Route path="/editunits/:id" element={
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
                <LandlordDashboard currentUser={currentUser || undefined} /> : 
                <div className="text-center py-8">
                  <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                  <p>You need to be a Landlord or Admin to access this page.</p>
                </div>
            } />
              
              <Route path="/editstaff" element={
                canManage ? 
                  <EditStaff currentUser={currentUser || undefined} /> : 
                  <div className="text-center py-8">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p>You need to be a Landlord or Admin to access this page.</p>
                  </div>
              } />
              
              <Route path="/editstaff/:id" element={
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
              
              <Route path="/edittenants" element={
                canManage ? 
                  <EditTenants currentUser={currentUser || undefined} /> : 
                  <div className="text-center py-8">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p>You need to be a Landlord or Admin to access this page.</p>
                  </div>
              } />
              
              <Route path="/edittenants/:id" element={
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
              
              <Route path="/editleases" element={
                canManage ? 
                  <EditLeases currentUser={currentUser || undefined} /> : 
                  <div className="text-center py-8">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p>You need to be a Landlord or Admin to access this page.</p>
                  </div>
              } />
              
              <Route path="/editleases/:id" element={
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
            
              <Route path="/properties" element={<PropertiesView currentUser={currentUser || undefined} />} />
              
              <Route path="/editcontact" element={
                <EditContactInfo 
                  currentUser={currentUser || undefined} 
                  onUserUpdate={handleUserUpdate} 
                />
              } />
              
              <Route path="/payments" element={<PaymentsPage currentUser={currentUser || undefined} />} />
              <Route path="/recordpayment" element={<RecordPayment currentUser={currentUser || undefined} />} />
              <Route path="/makepayment" element={<MakePayment currentUser={currentUser || undefined} />} />
              
              <Route path="/maintenancerequests" element={<MaintenanceRequests currentUser={currentUser || undefined} />} />
              <Route path="/editmaintenancerequests" element={<EditMaintenanceRequests currentUser={currentUser || undefined} />} />
              <Route path="/editmaintenancerequests/:id" element={<EditMaintenanceRequests currentUser={currentUser || undefined} />} />

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
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  )
}

export default App