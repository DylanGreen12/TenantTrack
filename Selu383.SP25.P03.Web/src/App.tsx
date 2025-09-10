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
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        {/* User Info at the top */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
          <h1>TenantTrack</h1>
          {currentUser ? (
            <div>
              <p><strong>Current User:</strong> {currentUser.userName}</p>
              <p><strong>Role:</strong> {currentUser.roles?.join(', ') || 'No roles'}</p>
            </div>
          ) : (
            <p>No user logged in</p>
          )}
        </div>

        {/* Navigation Links in list order */}
        <div style={{ marginBottom: '30px' }}>
          <h2>Navigation</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ margin: '5px 0' }}>
              <Link to="/" style={{ textDecoration: 'none', color: 'blue' }}>Home</Link>
            </li>
            <li style={{ margin: '5px 0' }}>
              <Link to="/editproperties" style={{ textDecoration: 'none', color: 'blue' }}>Manage Properties</Link>
            </li>
            <li style={{ margin: '5px 0' }}>
              <Link to="/editunits" style={{ textDecoration: 'none', color: 'blue' }}>Manage Units</Link>
            </li>
            <li style={{ margin: '5px 0' }}>
              <Link to="/edittenants" style={{ textDecoration: 'none', color: 'blue' }}>Manage Tenants</Link>
            </li>
            <li style={{ margin: '5px 0' }}>
              <Link to="/editleases" style={{ textDecoration: 'none', color: 'blue' }}>Manage Leases</Link>
            </li>
            <li style={{ margin: '5px 0' }}>
              <Link to="/properties" style={{ textDecoration: 'none', color: 'blue' }}>View Properties</Link>
            </li>
            {!currentUser ? (
              <>
                <li style={{ margin: '5px 0' }}>
                  <Link to="/login" style={{ textDecoration: 'none', color: 'blue' }}>Login</Link>
                </li>
                <li style={{ margin: '5px 0' }}>
                  <Link to="/signup" style={{ textDecoration: 'none', color: 'blue' }}>Sign Up</Link>
                </li>
              </>
            ) : (
              <li style={{ margin: '5px 0' }}>
                <button 
                  onClick={() => setCurrentUser(null)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'blue', 
                    textDecoration: 'underline', 
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit'
                  }}
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Main Content */}
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
      </div>
    </Router>
  )
}

export default App