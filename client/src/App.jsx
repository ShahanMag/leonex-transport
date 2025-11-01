import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Navigation from "./components/Navigation";
import Dashboard from "./Pages/Dashboard";
import Companies from "./Pages/Companies";
import Vehicles from "./Pages/Vehicles";
import Drivers from "./Pages/Drivers";
import Loads from "./Pages/Loads";
import Payments from "./Pages/Payments";
import Reports from "./Pages/Reports";
import RentalTransaction from "./Pages/RentalTransaction";
import './App.css'
function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rental-transaction" element={<RentalTransaction />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/loads" element={<Loads />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </BrowserRouter>
  );
}

export default App;
