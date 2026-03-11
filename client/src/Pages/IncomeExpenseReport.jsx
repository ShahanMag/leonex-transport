import { useState, useEffect } from 'react';
import { reportAPI, customerAPI } from '../services/api';
import Button from '../components/Button';
import { showError, showSuccess } from '../utils/toast';
import { formatDate } from '../utils/dateUtils';

const STATUS_STYLES = {
  paid:    'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  unpaid:  'bg-red-100 text-red-800',
};

const COUNTRY_CONFIG = {
  saudi: { label: 'Saudi Arabia', symbol: 'SR' },
  india: { label: 'India',        symbol: '₹'  },
};

export default function IncomeExpenseReport() {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Filters
  const [activeCountry, setActiveCountry]   = useState('saudi');
  const [typeFilter, setTypeFilter]         = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [startDate, setStartDate]           = useState('');
  const [endDate, setEndDate]               = useState('');

  const [customerOptions, setCustomerOptions] = useState([]);

  useEffect(() => {
    customerAPI.getAll().then(r => setCustomerOptions(r.data.map(c => c.name))).catch(() => {});
    fetchReport();
  }, []);

  const buildParams = (country = activeCountry) => {
    const params = { country };
    if (typeFilter)     params.type     = typeFilter;
    if (statusFilter)   params.status   = statusFilter;
    if (customerFilter) params.customer = customerFilter;
    if (startDate)      params.startDate = startDate;
    if (endDate)        params.endDate   = endDate;
    return params;
  };

  const currencySymbol = COUNTRY_CONFIG[activeCountry].symbol;

  const handleTabChange = (country) => {
    setActiveCountry(country);
    setTypeFilter('');
    setStatusFilter('');
    setCustomerFilter('');
    setStartDate('');
    setEndDate('');
    fetchReport({ country });
  };

  const fetchReport = async (params) => {
    try {
      setIsLoading(true);
      const response = await reportAPI.getBillsReport(params ?? buildParams());
      setReportData(response.data);
    } catch {
      showError('Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => fetchReport(buildParams());

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);
      const response = await reportAPI.downloadBillsReport(buildParams());
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'IncomeExpenseReport.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('Report downloaded');
    } catch {
      showError('Failed to download report');
    } finally {
      setDownloadLoading(false);
    }
  };

  const filteredData = reportData?.data || [];
  const summary = reportData?.summary || {};

  return (
    <div className="p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Income & Expense Report</h1>
          <p className="text-sm text-gray-500 mt-1">Full breakdown of all income and expense entries</p>
        </div>
        <Button variant="primary" onClick={handleDownload} disabled={downloadLoading}>
          {downloadLoading ? 'Downloading...' : '📥 Download Excel'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="space-y-3 mb-6">
        {/* Income Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-green-500">
            <div className="bg-green-500 p-3 rounded-lg"><span className="text-white text-xl">📥</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total Income</p>
              <p className="text-xl font-bold text-green-600">{(summary.totalIncome || 0).toLocaleString()} {currencySymbol}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-green-300">
            <div className="bg-green-300 p-3 rounded-lg"><span className="text-white text-xl">✅</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Received Income</p>
              <p className="text-xl font-bold text-green-500">{(summary.receivedIncome || 0).toLocaleString()} {currencySymbol}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-yellow-400">
            <div className="bg-yellow-400 p-3 rounded-lg"><span className="text-white text-xl">⏳</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Pending Income</p>
              <p className="text-xl font-bold text-yellow-500">{(summary.pendingIncome || 0).toLocaleString()} {currencySymbol}</p>
            </div>
          </div>
        </div>
        {/* Expense Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-red-500">
            <div className="bg-red-500 p-3 rounded-lg"><span className="text-white text-xl">📤</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total Expense</p>
              <p className="text-xl font-bold text-red-600">{(summary.totalExpense || 0).toLocaleString()} {currencySymbol}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-red-300">
            <div className="bg-red-300 p-3 rounded-lg"><span className="text-white text-xl">💸</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Paid Expense</p>
              <p className="text-xl font-bold text-red-500">{(summary.paidExpense || 0).toLocaleString()} {currencySymbol}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-orange-400">
            <div className="bg-orange-400 p-3 rounded-lg"><span className="text-white text-xl">⏳</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Pending Expense</p>
              <p className="text-xl font-bold text-orange-500">{(summary.pendingExpense || 0).toLocaleString()} {currencySymbol}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Country Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {Object.entries(COUNTRY_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeCountry === key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Customer</label>
            <select
              value={customerFilter}
              onChange={e => setCustomerFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Customers</option>
              {customerOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Button variant="primary" onClick={handleApplyFilters} disabled={isLoading}>
            Apply
          </Button>
          <Button variant="secondary" onClick={() => { setTypeFilter(''); setStatusFilter(''); setCustomerFilter(''); setStartDate(''); setEndDate(''); fetchReport({ country: activeCountry }); }}>
            Reset
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Loading report...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Dues</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((b, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${b.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {b.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">{b.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{b.customer || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{b.totalAmount?.toLocaleString()} {currencySymbol}</td>
                    <td className="px-4 py-3 text-sm text-green-700 font-medium whitespace-nowrap">{b.paidAmount?.toLocaleString()} {currencySymbol}</td>
                    <td className="px-4 py-3 text-sm text-red-700 font-medium whitespace-nowrap">{b.dues?.toLocaleString()} {currencySymbol}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${STATUS_STYLES[b.status] || ''}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                      {b.date ? formatDate(b.date) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
