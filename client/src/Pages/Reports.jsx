import { useState, useEffect, useMemo } from 'react';
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

// 🔍 Additional Filters Component (Date, Company, Driver, Iqama) - Moved outside to prevent recreation
const AdditionalFilters = ({
  activeReport,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  companyNameFilter,
  setCompanyNameFilter,
  driverNameFilter,
  setDriverNameFilter,
  iqamaFilter,
  setIqamaFilter
}) => {
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      {/* Date Filters - Show for all reports */}
      <input
        type="date"
        placeholder="Start Date"
        value={startDateFilter}
        onChange={(e) => setStartDateFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      <input
        type="date"
        placeholder="End Date"
        value={endDateFilter}
        onChange={(e) => setEndDateFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />

      {/* Company Name Filter - For company-payments and combined-report */}
      {(activeReport === 'company-payments' || activeReport === 'combined-report') && (
        <input
          type="text"
          placeholder="Filter by company name..."
          value={companyNameFilter}
          onChange={(e) => setCompanyNameFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-48"
        />
      )}

      {/* Driver Name Filter - For rental-payments and combined-report */}
      {(activeReport === 'rental-payments' || activeReport === 'combined-report') && (
        <input
          type="text"
          placeholder="Filter by driver name..."
          value={driverNameFilter}
          onChange={(e) => setDriverNameFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-48"
        />
      )}

      {/* Iqama Filter - Only for rental-payments */}
      {activeReport === 'rental-payments' && (
        <input
          type="text"
          placeholder="Filter by Iqama ID..."
          value={iqamaFilter}
          onChange={(e) => setIqamaFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-48"
        />
      )}
    </div>
  );
};

export default function Reports() {
  const [activeReport, setActiveReport] = useState('company-payments');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Additional filters
  const [companyNameFilter, setCompanyNameFilter] = useState('');
  const [driverNameFilter, setDriverNameFilter] = useState('');
  const [iqamaFilter, setIqamaFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [combinedStatusFilter, setCombinedStatusFilter] = useState('all');

  useEffect(() => {
    fetchReport(activeReport);
    // Reset filters when changing report tabs
    setPaymentFilter('all');
    setCompanyNameFilter('');
    setDriverNameFilter('');
    setIqamaFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setCombinedStatusFilter('all');
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

  // 🔍 Filter Report Data by Payment Status and other filters (Memoized for performance)
  const filteredData = useMemo(() => {
    if (!reportData || !Array.isArray(reportData)) {
      return [];
    }

    let filtered = reportData;

    // Apply payment status filter for payment reports
    if (activeReport === 'company-payments' || activeReport === 'rental-payments') {
      if (paymentFilter !== 'all') {
        filtered = filtered.filter(item => item.status === paymentFilter);
      }
    }

    // Apply company name filter for company-payments and combined-report
    if ((activeReport === 'company-payments' || activeReport === 'combined-report') && companyNameFilter) {
      filtered = filtered.filter(item =>
        item.company?.toLowerCase().includes(companyNameFilter.toLowerCase())
      );
    }

    // Apply driver name filter for rental-payments and combined-report
    if ((activeReport === 'rental-payments' || activeReport === 'combined-report') && driverNameFilter) {
      filtered = filtered.filter(item =>
        item.driver?.toLowerCase().includes(driverNameFilter.toLowerCase())
      );
    }

    // Apply iqama filter only for rental-payments
    if (activeReport === 'rental-payments' && iqamaFilter) {
      filtered = filtered.filter(item =>
        item.iqama_id?.toLowerCase().includes(iqamaFilter.toLowerCase())
      );
    }

    // Apply status filter for combined report
    if (activeReport === 'combined-report' && combinedStatusFilter !== 'all') {
      filtered = filtered.filter(item => {
        // Filter based on acquisition payment status or rental payment status
        const revStatus = item.revenue_status || 'unpaid';
        const costStatus = item.cost_status || 'unpaid';

        if (combinedStatusFilter === 'paid') {
          return revStatus === 'paid' && costStatus === 'paid';
        } else if (combinedStatusFilter === 'partial') {
          return revStatus === 'partial' || costStatus === 'partial' ||
                 (revStatus === 'paid' && costStatus !== 'paid') ||
                 (revStatus !== 'paid' && costStatus === 'paid');
        } else if (combinedStatusFilter === 'unpaid') {
          return revStatus === 'unpaid' && costStatus === 'unpaid';
        }
        return true;
      });
    }

    // Apply date filters for all reports with transaction_date or rental_date
    if (startDateFilter) {
      filtered = filtered.filter(item => {
        const itemDate = item.transaction_date || item.rental_date;
        if (!itemDate) return false;
        return new Date(itemDate) >= new Date(startDateFilter);
      });
    }

    if (endDateFilter) {
      filtered = filtered.filter(item => {
        const itemDate = item.transaction_date || item.rental_date;
        if (!itemDate) return false;
        return new Date(itemDate) <= new Date(endDateFilter);
      });
    }

    return filtered;
  }, [reportData, activeReport, paymentFilter, companyNameFilter, driverNameFilter, iqamaFilter, startDateFilter, endDateFilter, combinedStatusFilter]);

  // 📊 Calculate Summary Statistics
  const calculateSummary = () => {
    if (!filteredData || filteredData.length === 0) {
      return null;
    }

    switch (activeReport) {
      case 'company-payments':
      case 'rental-payments': {
        const totalAmount = filteredData.reduce((sum, p) => sum + (p.total_amount || 0), 0);
        const totalPaid = filteredData.reduce((sum, p) => sum + (p.total_paid || 0), 0);
        const totalDue = filteredData.reduce((sum, p) => sum + (p.total_due || 0), 0);
        const count = filteredData.length;
        return { totalAmount, totalPaid, totalDue, count };
      }

      case 'combined-report': {
        const totalRevenue = filteredData.reduce((sum, item) => sum + (item.revenue || 0), 0);
        const totalCost = filteredData.reduce((sum, item) => sum + (item.cost || 0), 0);
        const netProfit = filteredData.reduce((sum, item) => sum + (item.net_profit || 0), 0);
        const count = filteredData.length;
        return { totalRevenue, totalCost, netProfit, count };
      }

      case 'profit-loss': {
        const totalRevenue = filteredData.reduce((sum, item) => sum + (item.revenue || 0), 0);
        const totalCost = filteredData.reduce((sum, item) => sum + (item.cost || 0), 0);
        const netProfit = filteredData.reduce((sum, item) => sum + (item.net_profit || 0), 0);
        const avgMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;
        const count = filteredData.length;
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

  // 🔍 Payment Status Filter Component
  const PaymentFilter = () => {
    // Show filter for payment reports
    if (activeReport !== 'company-payments' && activeReport !== 'rental-payments') {
      return null;
    }

    return (
      <div className="flex gap-2">
        <button
          onClick={() => setPaymentFilter('all')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            paymentFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setPaymentFilter('paid')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            paymentFilter === 'paid'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => setPaymentFilter('partial')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            paymentFilter === 'partial'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Partial
        </button>
        <button
          onClick={() => setPaymentFilter('unpaid')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            paymentFilter === 'unpaid'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Unpaid
        </button>
      </div>
    );
  };

  // 🔍 Combined Report Status Filter Component
  const CombinedStatusFilter = () => {
    // Only show filter for combined report
    if (activeReport !== 'combined-report') {
      return null;
    }

    return (
      <div className="flex gap-2">
        <button
          onClick={() => setCombinedStatusFilter('all')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            combinedStatusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setCombinedStatusFilter('paid')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            combinedStatusFilter === 'paid'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => setCombinedStatusFilter('partial')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            combinedStatusFilter === 'partial'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Partial
        </button>
        <button
          onClick={() => setCombinedStatusFilter('unpaid')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            combinedStatusFilter === 'unpaid'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Unpaid
        </button>
      </div>
    );
  };

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
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <PaymentFilter />
        <CombinedStatusFilter />
        <Button variant="primary" onClick={current.fn}>
          📥 {current.label}
        </Button>
      </div>
    );
  };

  // =============================
  // 🔹 Report Table Layouts
  // =============================

  const PaymentsReport = ({ data }) => {
    const isRentalPayments = activeReport === 'rental-payments';

    return (
      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full min-w-max">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Type</th>
              <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Company</th>
              <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Driver</th>
              {isRentalPayments && (
                <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Iqama ID</th>
              )}
              <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Vehicle Number</th>
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
                {isRentalPayments && (
                  <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800">{p.iqama_id || '-'}</td>
                )}
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800">{p.plate_no || '-'}</td>
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
  };

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
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Rev. Status</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Cost</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Cost Paid</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Cost Due</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Cost Status</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Net Profit/Loss</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(data) ? data : []).map((item, i) => {
            const isProfitable = item.net_profit >= 0;
            const revStatus = item.revenue_status || 'unpaid';
            const costStatus = item.cost_status || 'unpaid';
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
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    revStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    revStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {revStatus}
                  </span>
                </td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-800 whitespace-nowrap">SAR {item.cost?.toLocaleString() || 0}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-green-700 whitespace-nowrap">SAR {item.cost_paid?.toLocaleString() || 0}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-red-700 whitespace-nowrap">SAR {item.cost_due?.toLocaleString() || 0}</td>
                <td className="px-2 md:px-4 py-3 text-xs md:text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    costStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    costStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {costStatus}
                  </span>
                </td>
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
      case 'combined-report':
      case 'profit-loss':
        return {
          'company-payments': <PaymentsReport data={filteredData} />,
          'rental-payments': <PaymentsReport data={filteredData} />,
          'combined-report': <CombinedReport data={filteredData} />,
          'profit-loss': <ProfitLossReport data={filteredData} />,
        }[activeReport];
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
        <AdditionalFilters
          activeReport={activeReport}
          startDateFilter={startDateFilter}
          setStartDateFilter={setStartDateFilter}
          endDateFilter={endDateFilter}
          setEndDateFilter={setEndDateFilter}
          companyNameFilter={companyNameFilter}
          setCompanyNameFilter={setCompanyNameFilter}
          driverNameFilter={driverNameFilter}
          setDriverNameFilter={setDriverNameFilter}
          iqamaFilter={iqamaFilter}
          setIqamaFilter={setIqamaFilter}
        />
        <SummaryCards />
        {renderReport()}
      </div>
    </div>
  );
}
