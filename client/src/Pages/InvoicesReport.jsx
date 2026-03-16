import { useState, useEffect } from 'react';
import { reportAPI, companyAPI, customerAPI } from '../services/api';
import Button from '../components/Button';
import MultiSelect from '../components/MultiSelect';
import { showError, showSuccess } from '../utils/toast';
import { formatDate } from '../utils/dateUtils';

const STATUS_STYLES = {
  paid:    'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  unpaid:  'bg-red-100 text-red-800',
};

export default function InvoicesReport() {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const [companies, setCompanies]   = useState([]);
  const [customers, setCustomers]   = useState([]);
  const [companyFilter, setCompanyFilter]   = useState([]); // array of selected IDs
  const [customerFilter, setCustomerFilter] = useState('');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [settledFilter, setSettledFilter] = useState('active');

  useEffect(() => {
    companyAPI.getAll().then(r => setCompanies(r.data)).catch(() => {});
    customerAPI.getAll().then(r => setCustomers(r.data)).catch(() => {});
    fetchReport();
  }, []);

  const buildParams = () => {
    const params = {};
    if (companyFilter.length > 0) params.company_ids = companyFilter.join(',');
    if (customerFilter)           params.customer_id  = customerFilter;
    if (startDate)                params.startDate    = startDate;
    if (endDate)                  params.endDate      = endDate;
    params.settled = settledFilter;
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
    setCompanyFilter([]);
    setCustomerFilter('');
    setStartDate('');
    setEndDate('');
    setSettledFilter('active');
    fetchReport({ settled: 'active' });
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
  const fmt = (n) => (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

      {/* Summary Cards — 4 paired columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {/* Col 1: Total Amount / Amt. Received */}
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-blue-500">
            <div className="bg-blue-500 p-3 rounded-lg"><span className="text-white text-xl">💰</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total Amount</p>
              <p className="text-xl font-bold text-blue-600">{fmt(summary.totalAmount || 0)} SR</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-blue-300">
            <div className="bg-blue-300 p-3 rounded-lg"><span className="text-white text-xl">💵</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Amt. Received</p>
              <p className="text-xl font-bold text-blue-500">{fmt(summary.amtReceived || 0)} SR</p>
            </div>
          </div>
        </div>
        {/* Col 2: Total VAT / VAT Deducted */}
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-orange-500">
            <div className="bg-orange-500 p-3 rounded-lg"><span className="text-white text-xl">🏛️</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total VAT</p>
              <p className="text-xl font-bold text-orange-600">{fmt(summary.totalVAT || 0)} SR</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-orange-300">
            <div className="bg-orange-300 p-3 rounded-lg"><span className="text-white text-xl">📋</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">VAT Deducted</p>
              <p className="text-xl font-bold text-orange-500">{fmt(summary.vatDeducted || 0)} SR</p>
            </div>
          </div>
        </div>
        {/* Col 3: Payable Amount / Payable Paid */}
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-red-500">
            <div className="bg-red-500 p-3 rounded-lg"><span className="text-white text-xl">📊</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Payable Amount</p>
              <p className="text-xl font-bold text-red-600">{fmt(summary.payableAmount || 0)} SR</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-red-300">
            <div className="bg-red-300 p-3 rounded-lg"><span className="text-white text-xl">💸</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Payable Paid</p>
              <p className="text-xl font-bold text-red-500">{fmt(summary.payablePaid || 0)} SR</p>
            </div>
          </div>
        </div>
        {/* Col 4: Commission Total / Commission Received */}
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-purple-500">
            <div className="bg-purple-500 p-3 rounded-lg"><span className="text-white text-xl">📈</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Commission Total</p>
              <p className="text-xl font-bold text-purple-600">{fmt(summary.totalCommission || 0)} SR</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-purple-300">
            <div className="bg-purple-300 p-3 rounded-lg"><span className="text-white text-xl">✅</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Commission Received</p>
              <p className="text-xl font-bold text-purple-500">{fmt(summary.commReceived || 0)} SR</p>
            </div>
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
            <MultiSelect
              options={companies.map(c => ({ value: c._id, label: c.name }))}
              value={companyFilter}
              onChange={setCompanyFilter}
              placeholder="All Companies"
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
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={settledFilter}
              onChange={e => setSettledFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active Only</option>
              <option value="settled">Settled Only</option>
              <option value="all">All Invoices</option>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Total Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">VAT (15%)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Amt w/o VAT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Comm %</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Payable Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Amt. Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Amt Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Payable Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Comm Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Settled</th>
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
                    <td className="px-4 py-3 text-sm text-green-700 whitespace-nowrap">{inv.commission_amount?.toLocaleString(undefined, { maximumFractionDigits: 2 })} SR</td>
                    <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">{inv.balance?.toLocaleString()} SR</td>
                    <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">
                      {(() => { const bal = (inv.amount || 0) - (inv.amount_paid || 0); return <span className={bal > 0 ? 'text-red-600' : 'text-green-600'}>{bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SR</span>; })()}
                    </td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[inv.amount_status] || ''}`}>{inv.amount_status || '-'}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[inv.payable_status] || ''}`}>{inv.payable_status || '-'}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[inv.commission_status] || ''}`}>{inv.commission_status || '-'}</span></td>
                    <td className="px-4 py-3">{inv.is_settled ? <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">Settled</span> : null}</td>
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
