import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import EditProperties from './pages/EditProperties'
import EditUnits from './pages/EditUnits'
import PropertiesView from "./pages/PropertiesView";
import { LoginForm } from "./pages/LoginForm";
import { SignUpForm } from "./pages/SignUpForm";
import { UserDto } from "./models/UserDto";
import EditTenants from './pages/EditTenants'
import EditLeases from './pages/EditLeases'

function App() {
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);

  return (
    <Router>
      <div className="flex h-screen font-sans">
        {/* Sidebar */}
        <aside className="w-250px bg-gradient-to-br from-[#667eea] to-[#764ba2] text-[#ecf0f1] p-30px-20px flex flex-col justify-between shadow-lg">
          <div>
            {/* Sidebar Header */}
            <div className="mb-40px text-center">
              <h2 className="text-1.6rem font-600 text-[#ecf0f1]">TenantTrack</h2>
            </div>

            {/* Navigation */}
            <nav>
              <ul className="list-none p-0 m-0">
                <li className="mb-20px">
                  <Link to="/" className="text-[#ecf0f1] no-underline text-1.1rem transition-all-300 ease hover:text-[#3498db] hover:pl-10px block py-10px rounded-5px hover:bg-[rgba(52,152,219,0.2)] hover:translate-x-10px">
                    🏠 Home
                  </Link>
                </li>
                <li className="mb-20px">
                  <Link to="/editproperties" className="text-[#ecf0f1] no-underline text-1.1rem transition-all-300 ease hover:text-[#3498db] hover:pl-10px block py-10px rounded-5px hover:bg-[rgba(52,152,219,0.2)] hover:translate-x-10px">
                    🏢 Manage Properties
                  </Link>
                </li>
                <li className="mb-20px">
                  <Link to="/editunits" className="text-[#ecf0f1] no-underline text-1.1rem transition-all-300 ease hover:text-[#3498db] hover:pl-10px block py-10px rounded-5px hover:bg-[rgba(52,152,219,0.2)] hover:translate-x-10px">
                    📦 Manage Units
                  </Link>
                </li>
                <li className="mb-20px">
                  <Link to="/edittenants" className="text-[#ecf0f1] no-underline text-1.1rem transition-all-300 ease hover:text-[#3498db] hover:pl-10px block py-10px rounded-5px hover:bg-[rgba(52,152,219,0.2)] hover:translate-x-10px">
                    👤 Manage Tenants
                  </Link>
                </li>
                <li className="mb-20px">
                  <Link to="/editleases" className="text-[#ecf0f1] no-underline text-1.1rem transition-all-300 ease hover:text-[#3498db] hover:pl-10px block py-10px rounded-5px hover:bg-[rgba(52,152,219,0.2)] hover:translate-x-10px">
                    📄 Manage Leases
                  </Link>
                </li>
                <li className="mb-20px">
                  <Link to="/properties" className="text-[#ecf0f1] no-underline text-1.1rem transition-all-300 ease hover:text-[#3498db] hover:pl-10px block py-10px rounded-5px hover:bg-[rgba(52,152,219,0.2)] hover:translate-x-10px">
                    📋 View Properties
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* User Info */}
          <div className="mt-auto text-center text-0.9rem">
            {currentUser ? (
              <div>
                <p><strong>{currentUser.userName}</strong></p>
                <p>{currentUser.roles?.join(', ') || "No roles"}</p>
                <button
                  onClick={() => setCurrentUser(null)}
                  className="bg-[#e74c3c] text-white border-none py-10px px-15px rounded-4px cursor-pointer w-full mt-15px transition-background-300 ease hover:bg-[#c0392b]"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div>
                <Link to="/login" className="text-[#ecf0f1] no-underline text-1.1rem transition-all-300 ease hover:text-[#3498db] hover:pl-10px block py-10px rounded-5px hover:bg-[rgba(52,152,219,0.2)]">
                  🔑 Login
                </Link>
                <Link to="/signup" className="text-[#ecf0f1] no-underline text-1.1rem transition-all-300 ease hover:text-[#3498db] hover:pl-10px block py-10px rounded-5px hover:bg-[rgba(52,152,219,0.2)] mt-10px">
                  📝 Sign Up
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-30px overflow-y-auto bg-gray-50">
          <Routes>
            <Route path="/editproperties" element={<EditProperties />} />
            <Route path="/editunits" element={<EditUnits />} />
            <Route path="/edittenants" element={<EditTenants />} />
            <Route path="/editleases" element={<EditLeases />} />
            <Route path="/properties" element={<PropertiesView />} />

            <Route path="/login" element={
              <LoginForm
                onLoginSuccess={(user) => setCurrentUser(user)}
                onSwitchToSignUp={() => window.location.href = '/signup'}
              />
            } />

            <Route path="/signup" element={
              <SignUpForm
                onSignUpSuccess={(user) => setCurrentUser(user)}
                onSwitchToLogin={() => window.location.href = '/login'}
              />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App