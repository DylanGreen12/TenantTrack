import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import EditProperties from './pages/EditProperties'
import EditTenants from './pages/EditTenants'
import EditLeases from './pages/EditLeases'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <div className="app-container">
        {/* Navigation */}
        <nav className="navigation">
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/editproperties" className="nav-link">Manage Properties</Link>
            <Link to="/edittenants" className="nav-link">Manage Tenants</Link>
            <Link to="/editleases" className="nav-link">Manage Leases</Link>
          </div>
        </nav>


        {/* Routes */}
        <Routes>
          <Route path="/" element={
            <>
              <div>
                <a href="https://vite.dev" target="_blank">
                  <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                  <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
              </div>
              <h1>Vite + React</h1>
              <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                  count is {count}
                </button>
                <p>
                  Edit <code>src/App.tsx</code> and save to test HMR
                </p>
              </div>
              <p className="read-the-docs">
                Click on the Vite and React logos to learn more
              </p>
            </>
          } />
          <Route path="/editproperties" element={<EditProperties />} />
          <Route path="/edittenants" element={<EditTenants />} />
          <Route path="/editleases" element={<EditLeases />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App