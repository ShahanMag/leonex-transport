import { useState, useEffect } from 'react';
import { companyAPI, vehicleAPI, driverAPI, loadAPI, paymentAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    companies: 0,
    vehicles: 0,
    drivers: 0,
    loads: 0,
    payments: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const [companies, vehicles, drivers, loads, payments] = await Promise.all([
        companyAPI.getAll(),
        vehicleAPI.getAll(),
        driverAPI.getAll(),
        loadAPI.getAll(),
        paymentAPI.getAll(),
      ]);

      setStats({
        companies: companies.data.length,
        vehicles: vehicles.data.length,
        drivers: drivers.data.length,
        loads: loads.data.length,
        payments: payments.data.length,
      });
    } catch (error) {
      console.error('Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{isLoading ? '-' : value}</p>
        </div>
        <div className={`text-4xl ${color.replace('border', 'text')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to Vehicle Rental System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Companies"
          value={stats.companies}
          icon="🏢"
          color="border-blue-500"
        />
        <StatCard
          title="Vehicles"
          value={stats.vehicles}
          icon="🚚"
          color="border-green-500"
        />
        <StatCard
          title="Drivers"
          value={stats.drivers}
          icon="👤"
          color="border-yellow-500"
        />
        <StatCard
          title="Rental Requests"
          value={stats.loads}
          icon="📦"
          color="border-purple-500"
        />
        <StatCard
          title="Payments"
          value={stats.payments}
          icon="💰"
          color="border-red-500"
        />
      </div>

      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">Add Company</h3>
            <p className="text-sm text-blue-600">Register a new company to manage vehicles</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2">Add Vehicle</h3>
            <p className="text-sm text-green-600">Add vehicles to your fleet with pricing</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">Register Driver</h3>
            <p className="text-sm text-yellow-600">Register drivers for rental assignments</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-bold text-purple-800 mb-2">Create Load</h3>
            <p className="text-sm text-purple-600">Create rental requests and assign drivers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
