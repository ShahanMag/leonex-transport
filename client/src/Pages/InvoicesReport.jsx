import { useState, useEffect } from 'react';
import { reportAPI, companyAPI, customerAPI } from '../services/api';
import Button from '../components/Button';
import { showError, showSuccess } from '../utils/toast';
import { formatDate } from '../utils/dateUtils';

export default function InvoicesReport() {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const [companies, setCompanies]   = useState([]);
  const [customers, setCustomers]   = useState([]);
  const [companyFilter, setCompanyFilter]   = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');

  useEffect(() => {
    companyAPI.getAll().then(r => setCompanies(r.data)).catch(() => {});
    customerAPI.getAll().then(r => setCustomers(r.data)).catch(() => {});
    fetchReport();
  }, []);

  const buildParams = () => {
    const params = {};
    if (companyFilter)  params.company_id  = companyFilter;
    if (customerFilter) params.customer_id = customerFilter;
    if (startDate)      params.startDate   = startDate;
    if (endDate)        params.endDate     = endDate;
    return params;
  };

  const fetchReport = async (params) => {
    try {
      setIsLoading(true);
      const res = await reportAPI.getInvoicesReport(params ?? buildParams());
      setReportData(res.data);
    } catch {
      showError('Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => fetchReport(buildParams());

  const handleReset = () => {
    setCompanyFilter('');
    setCustomerFilter('');
    setStartDate('');
    setEndDate('');
    fetchReport({});
  };

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);
      const response = await reportAPI.downloadInvoicesReport(buildParams());
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'InvoicesReport.xlsx');
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

  const data    = reportData?.data    || [];
  const summary = reportData?.summary || {};

  return (
    <div className="p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Invoices Report</h1>
          <p className="text-sm text-gray-500 mt-1">Summary of all invoices with VAT and commission breakdown</p>
        </div>
        <Button variant="primary" onClick={handleDownload} disabled={downloadLoading}>
          {downloadLoading ? 'Downloading...' : '📥 Download Excel'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-lg"><span className="text-white text-xl">💰</span></div>
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-xl font-bold text-blue-600">{(summary.totalAmount || 0).toLocaleString()} SR</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-orange-500 p-3 rounded-lg"><span className="text-white text-xl">🏛️</span></div>
          <div>
            <p className="text-sm text-gray-500">Total VAT (15%)</p>
            <p className="text-xl font-bold text-orange-600">{(summary.totalVAT || 0).toLocaleString()} SR</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-purple-500 p-3 rounded-lg"><span className="text-white text-xl">📊</span></div>
          <div>
            <p className="text-sm text-gray-500">Total Commission</p>
            <p className="text-xl font-bold text-purple-600">{(summary.totalCommission || 0).toLocaleString()} SR</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-green-500 p-3 rounded-lg"><span className="text-white text-xl">📈</span></div>
          <div>
            <p className="text-sm text-gray-500">Net Balance</p>
            <p className="text-xl font-bold text-green-600">{(summary.totalBalance || 0).toLocaleString()} SR</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
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
            <label className="block text-xs text-gray-500 mb-1">Company</label>
            <select
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Customer</label>
            <select
              value={customerFilter}
              onChange={e => setCustomerFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Customers</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Button variant="primary" onClick={handleApplyFilters} disabled={isLoading}>
            Apply
          </Button>
          <Button variant="secondary" onClick={handleReset} disabled={isLoading}>
            Reset
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Loading report...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Invoice No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">VAT (15%)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Amt w/o VAT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Comm %</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.map((inv, i) => (
                  <tr key={inv._id || i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{inv.company  || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{inv.customer || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{inv.date ? formatDate(inv.date) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{inv.amount?.toLocaleString()} SR</td>
                    <td className="px-4 py-3 text-sm text-orange-700 whitespace-nowrap">{inv.vat_amount?.toLocaleString(undefined, { maximumFractionDigits: 2 })} SR</td>
                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{inv.amount_without_vat?.toLocaleString(undefined, { maximumFractionDigits: 2 })} SR</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{inv.commission_pct}%</td>
                    <td className="px-4 py-3 text-sm text-purple-700 whitespace-nowrap">{inv.commission_amount?.toLocaleString(undefined, { maximumFractionDigits: 2 })} SR</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-700 whitespace-nowrap">{inv.balance?.toLocaleString()} SR</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inv.notes || '-'}</td>
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
