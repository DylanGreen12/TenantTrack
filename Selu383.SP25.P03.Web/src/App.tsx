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

// Chakra UI imports
import { 
  Box, 
  Text, 
  Button, 
  Flex,
  Heading
} from '@chakra-ui/react'

function App() {
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);

  return (
    <Router>
      <Flex height="100vh" fontFamily="Arial, sans-serif">
        {/* Sidebar */}
        <Box 
          width="250px" 
          bg="blue.700" 
          color="white"
          p={6}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          boxShadow="2px 0 10px rgba(0, 0, 0, 0.1)"
        >
          <Box>
            {/* Sidebar Header */}
            <Box mb={10} textAlign="center">
              <Heading as="h2" size="lg" color="white">
                TenantTrack
              </Heading>
            </Box>

            {/* Navigation */}
            <nav>
              <Box as="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <Box as="li" mb={5}>
                  <Link to="/">
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start"
                      color="white"
                      width="100%"
                      _hover={{ 
                        color: 'blue.200',
                        bg: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateX(10px)'
                      }}
                      transition="all 0.3s ease"
                    >
                      🏠 Home
                    </Button>
                  </Link>
                </Box>
                <Box as="li" mb={5}>
                  <Link to="/editproperties">
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start"
                      color="white"
                      width="100%"
                      _hover={{ 
                        color: 'blue.200',
                        bg: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateX(10px)'
                      }}
                      transition="all 0.3s ease"
                    >
                      🏢 Manage Properties
                    </Button>
                  </Link>
                </Box>
                <Box as="li" mb={5}>
                  <Link to="/editunits">
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start"
                      color="white"
                      width="100%"
                      _hover={{ 
                        color: 'blue.200',
                        bg: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateX(10px)'
                      }}
                      transition="all 0.3s ease"
                    >
                      📦 Manage Units
                    </Button>
                  </Link>
                </Box>
                <Box as="li" mb={5}>
                  <Link to="/edittenants">
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start"
                      color="white"
                      width="100%"
                      _hover={{ 
                        color: 'blue.200',
                        bg: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateX(10px)'
                      }}
                      transition="all 0.3s ease"
                    >
                      👤 Manage Tenants
                    </Button>
                  </Link>
                </Box>
                <Box as="li" mb={5}>
                  <Link to="/editleases">
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start"
                      color="white"
                      width="100%"
                      _hover={{ 
                        color: 'blue.200',
                        bg: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateX(10px)'
                      }}
                      transition="all 0.3s ease"
                    >
                      📄 Manage Leases
                    </Button>
                  </Link>
                </Box>
                <Box as="li" mb={5}>
                  <Link to="/properties">
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start"
                      color="white"
                      width="100%"
                      _hover={{ 
                        color: 'blue.200',
                        bg: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateX(10px)'
                      }}
                      transition="all 0.3s ease"
                    >
                      📋 View Properties
                    </Button>
                  </Link>
                </Box>
              </Box>
            </nav>
          </Box>

          {/* User Info */}
          <Box mt="auto" textAlign="center" fontSize="sm">
            {currentUser ? (
              <Box>
                <Text fontWeight="bold">{currentUser.userName}</Text>
                <Text>{currentUser.roles?.join(', ') || "No roles"}</Text>
                <Button
                  onClick={() => setCurrentUser(null)}
                  colorScheme="red"
                  size="sm"
                  width="100%"
                  mt={4}
                >
                  Logout
                </Button>
              </Box>
            ) : (
              <Box>
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    color="white"
                    width="100%"
                    mb={2}
                    _hover={{ color: 'blue.200', bg: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    🔑 Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    color="white"
                    width="100%"
                    _hover={{ color: 'blue.200', bg: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    📝 Sign Up
                  </Button>
                </Link>
              </Box>
            )}
          </Box>
        </Box>

        {/* Main Content */}
        <Box 
          flex={1} 
          p={8} 
          overflowY="auto" 
          bg="gray.50"
        >
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
        </Box>
      </Flex>
    </Router>
  )
}

export default App