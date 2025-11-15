import { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';
import Button from '../components/Button';
import { showError, showSuccess } from '../utils/toast';

export default function Reports() {
  const [activeReport, setActiveReport] = useState('company-payments');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  // 🔹 Fetch JSON Data for each report
  const fetchReport = async (reportType) => {
    try {
      setIsLoading(true);
      let response;

      switch (reportType) {
        case 'company-payments':
          response = await reportAPI.getCompanyPayments();
          break;
        case 'rental-payments':
          response = await reportAPI.getRentalPayments();
          break;
        case 'combined-report':
          response = await reportAPI.getCombinedReport();
          break;
        case 'profit-loss':
          response = await reportAPI.getProfitLoss();
          break;
        case 'vehicle-utilization':
          response = await reportAPI.getVehicleUtilization();
          break;
        case 'driver-performance':
          response = await reportAPI.getDriverPerformance();
          break;
        default:
          response = await reportAPI.getCompanyPayments();
      }

      setReportData(response.data);
    } catch (error) {
      console.error(error);
      showError('Failed to fetch report');
    } finally {
      setIsLoading(false);
    }
  };

  // 📥 Handle Excel Download
  const handleDownload = async (type, filename) => {
    try {
      const response = await reportAPI[type]();
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess(`Downloaded: ${filename}`);
    } catch (err) {
      console.error('Download failed', err);
      showError('Failed to download report');
    }
  };

  // 🧭 Tabs
  const ReportTabs = () => (
    <div className="flex gap-2 mb-6 border-b overflow-x-auto">
      {[
        { id: 'company-payments', label: 'Company Payments' },
        { id: 'rental-payments', label: 'Rental Payments' },
        { id: 'combined-report', label: 'Combined Report' },
        { id: 'profit-loss', label: 'Profit & Loss' },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveReport(tab.id)}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
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

  // 🧾 Download Buttons (Excel)
  const DownloadButton = ({ reportType }) => {
    const buttons = {
      'company-payments': {
        fn: () => handleDownload('downloadCompanyPayments', 'CompanyPaymentsReport.xlsx'),
        label: 'Download Company Payments Report',
      },
      'rental-payments': {
        fn: () => handleDownload('downloadRentalPayments', 'RentalPaymentsReport.xlsx'),
        label: 'Download Rental Payments Report',
      },
      'combined-report': {
        fn: () => handleDownload('downloadCombinedReport', 'CombinedReport.xlsx'),
        label: 'Download Combined Report',
      },
      'profit-loss': {
        fn: () => handleDownload('downloadProfitLoss', 'ProfitLossReport.xlsx'),
        label: 'Download Profit & Loss Report',
      },
      'vehicle-utilization': {
        fn: () => handleDownload('downloadVehicles', 'VehicleReport.xlsx'),
        label: 'Download Vehicle Report',
      },
      'driver-performance': {
        fn: () => handleDownload('downloadDrivers', 'DriverReport.xlsx'),
        label: 'Download Driver Report',
      },
    };

    const current = buttons[reportType];
    if (!current) return null;

    return (
      <div className="mb-6 flex justify-end">
        <Button variant="primary" onClick={current.fn}>
          📥 {current.label}
        </Button>
      </div>
    );
  };

  // =============================
  // 🔹 Report Table Layouts
  // =============================

  const PaymentsReport = ({ data }) => (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Driver</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Paid</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Due</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(data) ? data : []).map((p, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-800">{p.payment_type}</td>
              <td className="px-4 py-3 text-sm text-gray-800">{p.company}</td>
              <td className="px-4 py-3 text-sm text-gray-800">{p.driver || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-800">₹{p.total_amount?.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm text-green-700 font-medium">₹{p.total_paid?.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm text-red-700 font-medium">₹{p.total_due?.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    p.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : p.status === 'partial'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">
                {p.transaction_date ? new Date(p.transaction_date).toLocaleDateString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const CombinedReport = ({ data }) => (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rental Code</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Driver</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">From</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">To</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Revenue</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rev. Paid</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rev. Due</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cost</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cost Paid</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cost Due</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Net Profit/Loss</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(data) ? data : []).map((item, i) => {
            const isProfitable = item.net_profit >= 0;
            return (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-800">{item.rental_code || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{item.company || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{item.driver || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{item.from_location || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{item.to_location || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-800">SAR {item.revenue?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-sm text-green-700">SAR {item.revenue_paid?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-sm text-red-700">SAR {item.revenue_due?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-sm text-gray-800">SAR {item.cost?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-sm text-green-700">SAR {item.cost_paid?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-sm text-red-700">SAR {item.cost_due?.toLocaleString() || 0}</td>
                <td className={`px-4 py-3 text-sm font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                  SAR {item.net_profit?.toLocaleString() || 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const ProfitLossReport = ({ data }) => (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rental Code</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Driver</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Revenue</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cost</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Net Profit/Loss</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Profit Margin</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(data) ? data : []).map((item, i) => {
            const isProfitable = item.net_profit >= 0;
            return (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-800">{item.rental_code || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{item.company || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{item.driver || '-'}</td>
                <td className="px-4 py-3 text-sm text-green-700 font-medium">SAR {item.revenue?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-sm text-red-700 font-medium">SAR {item.cost?.toLocaleString() || 0}</td>
                <td className={`px-4 py-3 text-sm font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                  SAR {item.net_profit?.toLocaleString() || 0}
                </td>
                <td className={`px-4 py-3 text-sm font-medium ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                  {item.profit_margin || '0%'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {item.rental_date ? new Date(item.rental_date).toLocaleDateString() : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const VehicleUtilizationReport = ({ data }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {(Array.isArray(data) ? data : []).map((vehicle, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{vehicle.vehicle_type}</h3>
            </div>
            <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
              {vehicle.utilization_rate}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-gray-700">Total Loads:</span> {vehicle.total_loads}
            </p>
            <p>
              <span className="font-medium text-gray-700">Completed:</span> {vehicle.completed_loads}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const DriverPerformanceReport = ({ data }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {(Array.isArray(data) ? data : []).map((driver, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{driver.name}</h3>
            </div>
            <span className="px-3 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
              {driver.performance_rate}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-gray-700">Total Loads:</span> {driver.total_loads}
            </p>
            <p>
              <span className="font-medium text-gray-700">Completed:</span> {driver.completed_loads}
            </p>
            <p>
              <span className="font-medium text-gray-700">Pending:</span> {driver.pending_loads}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  // 🧩 Render current report
  const renderReport = () => {
    if (isLoading) return <div className="text-center py-8 text-gray-600">Loading report...</div>;
    if (!reportData) return <div className="text-center py-8 text-gray-600">No data available</div>;

    switch (activeReport) {
      case 'company-payments':
      case 'rental-payments':
        return <PaymentsReport data={reportData} />;
      case 'combined-report':
        return <CombinedReport data={reportData} />;
      case 'profit-loss':
        return <ProfitLossReport data={reportData} />;
      case 'vehicle-utilization':
        return <VehicleUtilizationReport data={reportData} />;
      case 'driver-performance':
        return <DriverPerformanceReport data={reportData} />;
      default:
        return <div>Unknown report</div>;
    }
  };

  // =============================
  // 🔹 Page Layout
  // =============================
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-600 mt-2">View detailed reports and download Excel files</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <ReportTabs />
        <DownloadButton reportType={activeReport} />
        {renderReport()}
      </div>
    </div>
  );
}
