import { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';
import Button from '../components/Button';

export default function Reports() {
  const [activeReport, setActiveReport] = useState('balance');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  const fetchReport = async (reportType) => {
    try {
      setIsLoading(true);
      let response;
      switch (reportType) {
        case 'balance':
          response = await reportAPI.getBalanceReport();
          break;
        case 'payment-history':
          response = await reportAPI.getPaymentHistory();
          break;
        case 'vehicle-utilization':
          response = await reportAPI.getVehicleUtilization();
          break;
        case 'driver-performance':
          response = await reportAPI.getDriverPerformance();
          break;
        default:
          response = await reportAPI.getBalanceReport();
      }
      setReportData(response.data);
    } catch (error) {
      alert('Failed to fetch report');
    } finally {
      setIsLoading(false);
    }
  };

  const ReportTabs = () => (
    <div className="flex gap-2 mb-6 border-b">
      {[
        { id: 'balance', label: 'Balance Report' },
        { id: 'payment-history', label: 'Payment History' },
        { id: 'vehicle-utilization', label: 'Vehicle Utilization' },
        { id: 'driver-performance', label: 'Driver Performance' },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveReport(tab.id)}
          className={`px-4 py-2 font-medium transition ${
            activeReport === tab.id
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const BalanceReport = ({ data }) => (
    <div className="space-y-4">
      {Object.entries(data || {}).map(([entity, info]) => (
        <div key={entity} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-800 mb-2">{entity}</h3>
          <p className="text-2xl font-bold text-blue-600">₹{info.total?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-600 mt-2">{info.payments?.length || 0} transactions</p>
        </div>
      ))}
    </div>
  );

  const PaymentHistoryReport = ({ data }) => (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payer</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payee</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(data) ? data : []).map((payment, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-800">{payment.payer}</td>
              <td className="px-4 py-3 text-sm text-gray-800">{payment.payee || '-'}</td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-800">₹{payment.amount?.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm text-gray-800">
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {payment.type}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">
                {new Date(payment.date).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const VehicleUtilizationReport = ({ data }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {(Array.isArray(data) ? data : []).map((vehicle) => (
        <div key={vehicle._id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{vehicle.plate_no}</h3>
              <p className="text-sm text-gray-600">{vehicle.vehicle_type}</p>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
              vehicle.status === 'rented' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {vehicle.status}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-gray-700">Company:</span> {vehicle.company}</p>
            <p><span className="font-medium text-gray-700">Total Loads:</span> {vehicle.total_loads}</p>
            <p><span className="font-medium text-gray-700">Completed:</span> {vehicle.completed_loads}</p>
            <p><span className="font-medium text-gray-700">Utilization:</span>
              <span className="ml-2 font-bold text-blue-600">{vehicle.utilization_rate}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const DriverPerformanceReport = ({ data }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {(Array.isArray(data) ? data : []).map((driver) => (
        <div key={driver._id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{driver.name}</h3>
              <p className="text-sm text-gray-600">{driver.license_no}</p>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              driver.status === 'active' ? 'bg-green-100 text-green-800' :
              driver.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }`}>
              {driver.status}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-gray-700">Total Loads:</span> {driver.total_loads}</p>
            <p><span className="font-medium text-gray-700">Completed:</span> {driver.completed_loads}</p>
            <p><span className="font-medium text-gray-700">Pending:</span> {driver.pending_loads}</p>
            <p><span className="font-medium text-gray-700">Total Earnings:</span>
              <span className="ml-2 font-bold text-green-600">₹{driver.total_earnings?.toLocaleString()}</span>
            </p>
            <p><span className="font-medium text-gray-700">Performance Rate:</span>
              <span className="ml-2 font-bold text-blue-600">{driver.performance_rate}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderReport = () => {
    if (isLoading) {
      return <div className="text-center py-8 text-gray-600">Loading report...</div>;
    }

    if (!reportData) {
      return <div className="text-center py-8 text-gray-600">No data available</div>;
    }

    switch (activeReport) {
      case 'balance':
        return <BalanceReport data={reportData} />;
      case 'payment-history':
        return <PaymentHistoryReport data={reportData} />;
      case 'vehicle-utilization':
        return <VehicleUtilizationReport data={reportData} />;
      case 'driver-performance':
        return <DriverPerformanceReport data={reportData} />;
      default:
        return <div>Unknown report</div>;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-600 mt-2">View detailed reports and analytics</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <ReportTabs />
        {renderReport()}
      </div>
    </div>
  );
}
