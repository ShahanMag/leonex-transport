import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyAPI, driverAPI, loadAPI, paymentAPI, dashboardAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    companies: 0,
    drivers: 0,
    loads: 0,
    payments: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchStats();
    fetchMonthlyAnalytics();
  }, [selectedYear]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const [companies, drivers, loads, payments] = await Promise.all([
        companyAPI.getAll(),
        driverAPI.getAll(),
        loadAPI.getAll(),
        paymentAPI.getAll(),
      ]);

      setStats({
        companies: companies.data.length,
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

  const fetchMonthlyAnalytics = async () => {
    try {
      const response = await dashboardAPI.getMonthlyRentalAnalytics(selectedYear);
      setMonthlyData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch monthly analytics');
    }
  };

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <div
      className={`bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 ${color} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-xs md:text-sm font-medium">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">{isLoading ? '-' : value}</p>
        </div>
        <div className={`text-3xl md:text-4xl ${color.replace('border', 'text')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">Welcome to Leonex Road Freight Transport</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Companies"
          value={stats.companies}
          icon="🏢"
          color="border-blue-500"
          onClick={() => navigate('/companies')}
        />
        <StatCard
          title="Drivers"
          value={stats.drivers}
          icon="👤"
          color="border-yellow-500"
          onClick={() => navigate('/drivers')}
        />
        <StatCard
          title="Rental Requests"
          value={stats.loads}
          icon="📦"
          color="border-purple-500"
          onClick={() => navigate('/loads')}
        />
        <StatCard
          title="Payments"
          value={stats.payments}
          icon="💰"
          color="border-red-500"
          onClick={() => navigate('/payments')}
        />
      </div>

      {/* Monthly Rental Analytics Chart */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-8 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Monthly Rental Analytics</h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
          >
            {[2023, 2024, 2025].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="h-64 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value) => `${value.toLocaleString()} SAR`}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (Company Payments)" />
            <Bar dataKey="cost" fill="#ef4444" name="Cost (Driver Payments)" />
            <Bar dataKey="profit" fill="#10b981" name="Profit" />
          </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

     
    </div>
  );
}
