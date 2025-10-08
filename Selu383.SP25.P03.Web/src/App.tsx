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
//import TenantUnit from './pages/TenantUnit';
import {
  HomeIcon,
  BuildingOffice2Icon,
  HomeModernIcon,
  ChartBarIcon,
  BriefcaseIcon,
  UserIcon,
  DocumentIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ClipboardIcon
} from '@heroicons/react/24/solid';


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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="flex flex-col min-h-screen font-sans">
        {/* --- Top Navbar --- */}
        <header className="bg-[#f8f9fb]/90 backdrop-blur-sm shadow-md flex justify-between items-center px-6 py-3 h-14 border-b-4 border-[#4b5ed7]">
          <div className="flex items-center space-x-4">
            {/* Hamburger menu for toggling sidebar */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-200 transition"
              title="Toggle Sidebar"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo / Title */}
            <h1 className="text-2xl font-bold tracking-[0.08em] bg-gradient-to-r from-[#667eea] to-[#764ba2] text-transparent bg-clip-text">
              TenantTrack
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
          <aside className={`bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex flex-col shadow-lg overflow-y-auto transition-all duration-300
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

                {canManage && (
                  <>
                    <li>
                      <Link
                        to="/property/create"
                        className={`flex items-center text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block rounded-lg hover:bg-white/10
                                ${isSidebarOpen ? 'justify-start px-4 py-3' : 'justify-center px-0 py-3'}`}
                      >
                        <BuildingOfficeIcon className="h-6 w-6 text-white" />
                        <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>Properties</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/unit/create"
                        className={`flex items-center text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block rounded-lg hover:bg-white/10
                                ${isSidebarOpen ? 'justify-start px-4 py-3' : 'justify-center px-0 py-3'}`}
                      >
                        <HomeModernIcon className="h-6 w-6 text-white" />
                        <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>Units</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/landlord-dashboard"
                        className={`flex items-center text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block rounded-lg hover:bg-white/10
                                ${isSidebarOpen ? 'justify-start px-4 py-3' : 'justify-center px-0 py-3'}`}
                      >
                        <ChartBarIcon className="h-6 w-6 text-white" />
                        <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>Landlord Dashboard</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/staff/create"
                        className={`flex items-center text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block rounded-lg hover:bg-white/10
                                ${isSidebarOpen ? 'justify-start px-4 py-3' : 'justify-center px-0 py-3'}`}
                      >
                        <BriefcaseIcon className="h-6 w-6 text-white" />
                        <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>Staff</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/tenant/create"
                        className={`flex items-center text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block rounded-lg hover:bg-white/10
                                ${isSidebarOpen ? 'justify-start px-4 py-3' : 'justify-center px-0 py-3'}`}
                      >
                        <UserIcon className="h-6 w-6 text-white" />
                        <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>Tenants</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/lease/create"
                        className={`flex items-center text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block rounded-lg hover:bg-white/10
                                ${isSidebarOpen ? 'justify-start px-4 py-3' : 'justify-center px-0 py-3'}`}
                      >
                        <DocumentIcon className="h-6 w-6 text-white" />
                        <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>Leases</span>
                      </Link>
                    </li>
                  </>
                )}

                <li>
                  <Link
                    to="/editcontact"
                    className={`flex items-center text-white no-underline text-base transition-all duration-200 ease hover:text-blue-300 hover:pl-2 block rounded-lg hover:bg-white/10
                                ${isSidebarOpen ? 'justify-start px-4 py-3' : 'justify-center px-0 py-3'}`}
                  >
                    <PhoneIcon className="h-6 w-6 text-white" />
                    <span className={`${isSidebarOpen ? 'ml-2 inline' : 'hidden'}`}>Contact Info</span>
                  </Link>
                </li>

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
              </ul>
            </nav>
          </aside>  


        {/* Main Content - Scrollable area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8 text-gray-800">
            <Routes>
              <Route path="/" element={<div>Welcome to TenantTrack! Select an option from the sidebar.</div>} />
              
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
                <LandlordDashboard currentUser={currentUser || undefined} /> : 
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
              
              {/* Public Routes */}
              <Route path="/properties" element={<PropertiesView currentUser={currentUser || undefined} />} />
              
              <Route path="/editcontact" element={
                <EditContactInfo 
                  currentUser={currentUser || undefined} 
                  onUserUpdate={handleUserUpdate} 
                />
              } />

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
      </div>
    </Router>
  )
}

export default App