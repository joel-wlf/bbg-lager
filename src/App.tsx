import {
  Link,
  Route,
  BrowserRouter as Router,
  Routes,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Pages
import LogInScreen from "./LogInScreen";
import Items from "./pages/Items";
import Kisten from "./pages/Kisten";
import AppHeader from "./components/AppHeader";

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className='bg-gray-50'>
      <Router>
        {/* Header */}
        {user && <AppHeader />}
        <Routes>
          {/* Public Routes */}
          <Route
            path='/'
            element={
              user ? <Navigate to='/items' replace /> : <LogInScreen />
            }
          />

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
            path='/kisten'
            element={
              <ProtectedRoute>
                <Kisten />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
