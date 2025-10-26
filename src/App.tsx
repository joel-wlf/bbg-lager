import { Link, Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Pages
import LogInScreen from "./LogInScreen";
import Items from "./pages/Items";
import Gruppen from "./pages/Gruppen";
import { pb } from "./lib/pocketbase";
import AppHeader from "./components/AppHeader";

function App() {
  const isLoggedIn = pb.authStore.isValid;

  const handleTabChange = (value: string) => {
    //set route for react router
    
    
  };

  return (
    <div className='bg-gray-50'>
      <AuthProvider>
        <Router>
          {/* Header */}
          {isLoggedIn && (
            <AppHeader 
              defaultValue='items' 
              onValueChange={handleTabChange}
            />
          )}
          <Routes>
            {/* Public Routes */}
            <Route path='/' element={isLoggedIn ? <Navigate to="/items" replace /> : <LogInScreen />} />

            {/* Protected Routes */}
            <Route
              path='/items'
              element={
                <ProtectedRoute>
                  <Items />
                </ProtectedRoute>
              }
            />
            <Route
              path='/gruppen'
              element={
                <ProtectedRoute>
                  <Gruppen />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
