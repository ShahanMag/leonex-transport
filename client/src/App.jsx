import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Sidebar from "./components/Sidebar";
import Dashboard from "./Pages/Dashboard";
import Companies from "./Pages/Companies";
import Vehicles from "./Pages/Vehicles";
import Drivers from "./Pages/Drivers";
import Loads from "./Pages/Loads";
import Payments from "./Pages/Payments";
import Reports from "./Pages/Reports";
import RentalTransaction from "./Pages/RentalTransaction";
import Login from "./Pages/Login";
import Users from "./Pages/Users";
import Settings from "./Pages/Settings";
import VehicleTypes from "./Pages/VehicleTypes";
import Customers from "./Pages/Customers";
import IncomeExpense from "./Pages/IncomeExpense";
import IncomeExpenseReport from "./Pages/IncomeExpenseReport";
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('authToken');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Layout with Sidebar
function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
        <Toaster position="top-right" richColors />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rental-transaction"
          element={
            <ProtectedRoute>
              <AppLayout>
                <RentalTransaction />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Companies />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Vehicles />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/drivers"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Drivers />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loads"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Loads />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Payments />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Reports />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Users />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-types"
          element={
            <ProtectedRoute>
              <AppLayout>
                <VehicleTypes />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Customers />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/income-expense"
          element={
            <ProtectedRoute>
              <AppLayout>
                <IncomeExpense />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/income-expense/report"
          element={
            <ProtectedRoute>
              <AppLayout>
                <IncomeExpenseReport />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
