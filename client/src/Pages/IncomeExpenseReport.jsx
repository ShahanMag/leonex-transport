import { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';
import Button from '../components/Button';
import { showError, showSuccess } from '../utils/toast';
import { formatDate } from '../utils/dateUtils';

const STATUS_STYLES = {
  paid:    'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  unpaid:  'bg-red-100 text-red-800',
};

export default function IncomeExpenseReport() {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate]       = useState('');
  const [endDate, setEndDate]           = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (typeFilter)   params.type   = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await reportAPI.getBillsReport(params);
      setReportData(response.data);
    } catch {
      showError('Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => fetchReport();

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);
      const response = await reportAPI.downloadBillsReport();
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

  // Client-side date filter on top of server data
  const filteredData = (reportData?.data || []).filter(b => {
    if (startDate && new Date(b.date) < new Date(startDate)) return false;
    if (endDate   && new Date(b.date) > new Date(endDate))   return false;
    return true;
  });

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
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
            <div className="bg-green-500 p-3 rounded-lg"><span className="text-white text-xl">📥</span></div>
            <div>
              <p className="text-sm text-gray-500">Total Income</p>
              <p className="text-xl font-bold text-green-600">{(summary.totalIncome || 0).toLocaleString()} SAR</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
            <div className="bg-red-500 p-3 rounded-lg"><span className="text-white text-xl">📤</span></div>
            <div>
              <p className="text-sm text-gray-500">Total Expense</p>
              <p className="text-xl font-bold text-red-600">{(summary.totalExpense || 0).toLocaleString()} SAR</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
            <div className={`${(summary.netBalance || 0) >= 0 ? 'bg-blue-500' : 'bg-orange-500'} p-3 rounded-lg`}>
              <span className="text-white text-xl">{(summary.netBalance || 0) >= 0 ? '📈' : '📉'}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Balance</p>
              <p className={`text-xl font-bold ${(summary.netBalance || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {(summary.netBalance || 0).toLocaleString()} SAR
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
            <div className="bg-purple-500 p-3 rounded-lg"><span className="text-white text-xl">📋</span></div>
            <div>
              <p className="text-sm text-gray-500">Total Due</p>
              <p className="text-xl font-bold text-purple-600">{(summary.totalDue || 0).toLocaleString()} SAR</p>
            </div>
          </div>
        </div>
      )}

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
          <Button variant="primary" onClick={handleApplyFilters} disabled={isLoading}>
            Apply
          </Button>
          <Button variant="secondary" onClick={() => { setTypeFilter(''); setStatusFilter(''); setStartDate(''); setEndDate(''); fetchReport(); }}>
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
                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{b.totalAmount?.toLocaleString()} SAR</td>
                    <td className="px-4 py-3 text-sm text-green-700 font-medium whitespace-nowrap">{b.paidAmount?.toLocaleString()} SAR</td>
                    <td className="px-4 py-3 text-sm text-red-700 font-medium whitespace-nowrap">{b.dues?.toLocaleString()} SAR</td>
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
