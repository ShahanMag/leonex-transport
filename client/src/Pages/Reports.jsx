import { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';
import Button from '../components/Button';
import { showError, showSuccess } from '../utils/toast';

// 📊 Summary Card Component
const StatCard = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-lg`}>
          <span className="text-white text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

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

  // 📊 Calculate Summary Statistics
  const calculateSummary = () => {
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      return null;
    }

    switch (activeReport) {
      case 'company-payments':
      case 'rental-payments': {
        const totalAmount = reportData.reduce((sum, p) => sum + (p.total_amount || 0), 0);
        const totalPaid = reportData.reduce((sum, p) => sum + (p.total_paid || 0), 0);
        const totalDue = reportData.reduce((sum, p) => sum + (p.total_due || 0), 0);
        const count = reportData.length;
        return { totalAmount, totalPaid, totalDue, count };
      }

      case 'combined-report': {
        const totalRevenue = reportData.reduce((sum, item) => sum + (item.revenue || 0), 0);
        const totalCost = reportData.reduce((sum, item) => sum + (item.cost || 0), 0);
        const netProfit = reportData.reduce((sum, item) => sum + (item.net_profit || 0), 0);
        const count = reportData.length;
        return { totalRevenue, totalCost, netProfit, count };
      }

      case 'profit-loss': {
        const totalRevenue = reportData.reduce((sum, item) => sum + (item.revenue || 0), 0);
        const totalCost = reportData.reduce((sum, item) => sum + (item.cost || 0), 0);
        const netProfit = reportData.reduce((sum, item) => sum + (item.net_profit || 0), 0);
        const avgMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;
        const count = reportData.length;
        return { totalRevenue, totalCost, netProfit, avgMargin, count };
      }

      default:
        return null;
    }
  };

  // 🎴 Render Summary Cards
  const SummaryCards = () => {
    const summary = calculateSummary();
    if (!summary) return null;

    switch (activeReport) {
      case 'company-payments':
      case 'rental-payments':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Amount"
              value={`SAR ${summary.totalAmount.toLocaleString()}`}
              icon="💰"
              color="blue"
            />
            <StatCard
              title="Total Paid"
              value={`SAR ${summary.totalPaid.toLocaleString()}`}
              icon="✅"
              color="green"
            />
            <StatCard
              title="Total Due"
              value={`SAR ${summary.totalDue.toLocaleString()}`}
              icon="⏳"
              color="red"
            />
            <StatCard
              title="Total Payments"
              value={summary.count}
              icon="📋"
              color="purple"
            />
          </div>
        );

      case 'combined-report':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Revenue"
              value={`SAR ${summary.totalRevenue.toLocaleString()}`}
              icon="💵"
              color="green"
            />
            <StatCard
              title="Total Cost"
              value={`SAR ${summary.totalCost.toLocaleString()}`}
              icon="💸"
              color="red"
            />
            <StatCard
              title="Net Profit/Loss"
              value={`SAR ${summary.netProfit.toLocaleString()}`}
              icon={summary.netProfit >= 0 ? '📈' : '📉'}
              color={summary.netProfit >= 0 ? 'green' : 'red'}
            />
            <StatCard
              title="Total Transactions"
              value={summary.count}
              icon="🔄"
              color="purple"
            />
          </div>
        );

      case 'profit-loss':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Revenue"
              value={`SAR ${summary.totalRevenue.toLocaleString()}`}
              icon="💵"
              color="green"
            />
            <StatCard
              title="Total Cost"
              value={`SAR ${summary.totalCost.toLocaleString()}`}
              icon="💸"
              color="red"
            />
            <StatCard
              title="Net Profit/Loss"
              value={`SAR ${summary.netProfit.toLocaleString()}`}
              icon={summary.netProfit >= 0 ? '📈' : '📉'}
              color={summary.netProfit >= 0 ? 'green' : 'red'}
            />
            <StatCard
              title="Avg Profit Margin"
              value={`${summary.avgMargin}%`}
              icon="📊"
              color={summary.netProfit >= 0 ? 'blue' : 'yellow'}
            />
          </div>
        );

      default:
        return null;
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
    <div className="overflow-x-auto border rounded-lg bg-white">
      <table className="w-full min-w-max">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Type</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Company</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Driver</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Total</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Paid</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Due</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Date</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(data) ? data : []).map((p, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800">{p.payment_type}</td>
              <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800">{p.company}</td>
              <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800">{p.driver || '-'}</td>
              <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800 whitespace-nowrap">₹{p.total_amount?.toLocaleString()}</td>
              <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-green-700 font-medium whitespace-nowrap">₹{p.total_paid?.toLocaleString()}</td>
              <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-red-700 font-medium whitespace-nowrap">₹{p.total_due?.toLocaleString()}</td>
              <td className="px-2 md:px-4 py-3 text-xs md:text-sm">
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
              <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800 whitespace-nowrap">
                {p.transaction_date ? new Date(p.transaction_date).toLocaleDateString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const CombinedReport = ({ data }) => (
    <div className="overflow-x-auto border rounded-lg bg-white">
      <table className="w-full min-w-max">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Rental Code</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Company</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Driver</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">From</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">To</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Revenue</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Rev. Paid</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Rev. Due</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Cost</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Cost Paid</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Cost Due</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Net Profit/Loss</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(data) ? data : []).map((item, i) => {
            const isProfitable = item.net_profit >= 0;
            return (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800 whitespace-nowrap">{item.rental_code || '-'}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800">{item.company || '-'}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800">{item.driver || '-'}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800">{item.from_location || '-'}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800">{item.to_location || '-'}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800 whitespace-nowrap">SAR {item.revenue?.toLocaleString() || 0}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-green-700 whitespace-nowrap">SAR {item.revenue_paid?.toLocaleString() || 0}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-red-700 whitespace-nowrap">SAR {item.revenue_due?.toLocaleString() || 0}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800 whitespace-nowrap">SAR {item.cost?.toLocaleString() || 0}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-green-700 whitespace-nowrap">SAR {item.cost_paid?.toLocaleString() || 0}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-red-700 whitespace-nowrap">SAR {item.cost_due?.toLocaleString() || 0}</td>
                <td className={`px-2 md:px-4 py-3 text-xs md:text-sm font-bold whitespace-nowrap ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
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
    <div className="overflow-x-auto border rounded-lg bg-white">
      <table className="w-full min-w-max">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Rental Code</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Company</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Driver</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Revenue</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Cost</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Net Profit/Loss</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Profit Margin</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Date</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(data) ? data : []).map((item, i) => {
            const isProfitable = item.net_profit >= 0;
            return (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800 whitespace-nowrap">{item.rental_code || '-'}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800">{item.company || '-'}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800">{item.driver || '-'}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-green-700 font-medium whitespace-nowrap">SAR {item.revenue?.toLocaleString() || 0}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-red-700 font-medium whitespace-nowrap">SAR {item.cost?.toLocaleString() || 0}</td>
                <td className={`px-2 md:px-4 py-3 text-xs md:text-sm font-bold whitespace-nowrap ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                  SAR {item.net_profit?.toLocaleString() || 0}
                </td>
                <td className={`px-2 md:px-4 py-3 text-xs md:text-sm font-medium whitespace-nowrap ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                  {item.profit_margin || '0%'}
                </td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800 whitespace-nowrap">
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
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Reports</h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">View detailed reports and download Excel files</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <ReportTabs />
        <DownloadButton reportType={activeReport} />
        <SummaryCards />
        {renderReport()}
      </div>
    </div>
  );
}
