import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import EditProperties from './pages/EditProperties'
import EditUnits from './pages/EditUnits'
import PropertiesView from "./pages/PropertiesView";
import { LoginForm } from "./pages/LoginForm";
import { SignUpForm } from "./pages/SignUpForm";
import { UserDto } from "./models/UserDto";
import EditTenants from './pages/EditTenants'
import EditLeases from './pages/EditLeases';
import PaymentsPage from "./pages/PaymentsPage";
import MaintenanceRequestsPage from "./pages/MaintenanceRequestsPage";

// Importing the CSS file
import './App.css';  // <-- Add this line

function App() {
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);

  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2 className="brand-name">TenantTrack</h2>
          </div>
          <nav className="sidebar-nav">
            <ul>
              <li><Link to="/" className="sidebar-link">🏠 Home</Link></li>
              <li><Link to="/editproperties" className="sidebar-link">🏢 Manage Properties</Link></li>
              <li><Link to="/editunits" className="sidebar-link">📦 Manage Units</Link></li>
              <li><Link to="/edittenants" className="sidebar-link">👤 Manage Tenants</Link></li>
              <li><Link to="/editleases" className="sidebar-link">📄 Manage Leases</Link></li>
              <li><Link to="/properties" className="sidebar-link">📋 View Properties</Link></li>
              <li><Link to="/payments" className="sidebar-link">💵 Payments</Link></li>
              <li><Link to="/maintenance-requests" className="sidebar-link">🛠️ Maintenance Requests</Link></li>
            </ul>
          </nav>

          {/* User Info */}
          <div className="user-info">
            {currentUser ? (
              <div>
                <p><strong>{currentUser.userName}</strong></p>
                <p>{currentUser.roles?.join(', ') || "No roles"}</p>
                <button
                  onClick={() => setCurrentUser(null)}
                  className="logout-button"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div>
                <Link to="/login" className="sidebar-link">🔑 Login</Link>
                <br />
                <Link to="/signup" className="sidebar-link">📝 Sign Up</Link>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/editproperties" element={<EditProperties />} />
            <Route path="/editunits" element={<EditUnits />} />
            <Route path="/edittenants" element={<EditTenants />} />
            <Route path="/editleases" element={<EditLeases />} />
            <Route path="/properties" element={<PropertiesView />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/maintenance-requests" element={<MaintenanceRequestsPage />} />

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

export default App;