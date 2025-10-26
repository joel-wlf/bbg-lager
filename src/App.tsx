import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import LogInScreen from "./LogInScreen";
import Items from "./pages/Items";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<LogInScreen />} />

          {/* Protected Routes */}
          <Route
            path='/items'
            element={
              <ProtectedRoute>
                <Items />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
