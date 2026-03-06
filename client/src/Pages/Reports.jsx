import { useState, useEffect, useRef } from 'react';
import { reportAPI, companyAPI, driverAPI, agentAPI } from '../services/api';
import Button from '../components/Button';
import { showError, showSuccess } from '../utils/toast';
import { formatDate } from '../utils/dateUtils';

// ─── Summary Card ─────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500', green: 'bg-green-500', red: 'bg-red-500',
    yellow: 'bg-yellow-500', purple: 'bg-purple-500',
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

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CLASSES = {
  paid: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  unpaid: 'bg-red-100 text-red-800',
};
const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${STATUS_CLASSES[status] || ''}`}>
    {status}
  </span>
);

// ─── Config: which filters each report uses ───────────────────────────────────
const REPORT_FILTERS = {
  'company-payments': { status: true, company: true, driver: false, agent: false, date: true },
  'rental-payments':  { status: true, company: true,  driver: true,  agent: false, date: true },
  'combined-report':  { status: true, company: true,  driver: true,  agent: true,  date: true },
  'profit-loss':      { status: false, company: true, driver: true,  agent: true,  date: true },
};

// ─── Searchable Select ────────────────────────────────────────────────────────
const SearchableSelect = ({ label, value, onChange, options, placeholder = 'All' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  const select = (val) => {
    onChange(val);
    setSearch('');
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
        >
          <span className={value ? 'text-gray-800' : 'text-gray-400'}>{value || placeholder}</span>
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-2">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <ul className="max-h-48 overflow-y-auto">
              <li
                onClick={() => select('')}
                className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                {placeholder}
              </li>
              {filtered.map(o => (
                <li
                  key={o}
                  onClick={() => select(o)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${value === o ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-800'}`}
                >
                  {o}
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-400">No results</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const STATUS_OPTIONS = ['paid', 'partial', 'unpaid'];

const EMPTY_FILTERS = { status: '', company: '', driver: '', agent: '', startDate: '', endDate: '' };

export default function Reports() {
  const [activeReport, setActiveReport] = useState('company-payments');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter options loaded from API
  const [companyOptions, setCompanyOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [agentOptions, setAgentOptions] = useState([]);

  // Active filters (applied on "Apply")
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Load company + driver + agent lists once for filter options
  useEffect(() => {
    companyAPI.getAll().then(r => setCompanyOptions(r.data.map(c => c.name))).catch(() => {});
    driverAPI.getAll().then(r => setDriverOptions(r.data.map(d => d.name))).catch(() => {});
    agentAPI.getAll().then(r => setAgentOptions(r.data.map(a => a.name))).catch(() => {});
  }, []);

  // Reset filters + data when switching tabs, then auto-fetch
  useEffect(() => {
    setFilters(EMPTY_FILTERS);
    setReportData(null);
    fetchReport(activeReport, EMPTY_FILTERS);
  }, [activeReport]);

  // ─── Build query params from filters ───────────────────────────────────────
  const buildParams = (reportType, f) => {
    const params = {};
    if (f.startDate) params.startDate = f.startDate;
    if (f.endDate)   params.endDate   = f.endDate;

    const cfg = REPORT_FILTERS[reportType] || {};
    if (cfg.status  && f.status)  params.status    = f.status;
    if (cfg.company && f.company) params.companies = f.company;
    if (cfg.driver  && f.driver)  params.drivers   = f.driver;
    if (cfg.agent   && f.agent)   params.agents    = f.agent;
    return params;
  };

  // ─── Fetch report data ──────────────────────────────────────────────────────
  const fetchReport = async (reportType, f = filters) => {
    try {
      setIsLoading(true);
      const params = buildParams(reportType, f);
      let response;

      switch (reportType) {
        case 'company-payments':  response = await reportAPI.getCompanyPayments(params); break;
        case 'rental-payments':   response = await reportAPI.getRentalPayments(params);  break;
        case 'combined-report':   response = await reportAPI.getCombinedReport(params);  break;
        case 'profit-loss':       response = await reportAPI.getProfitLoss(params);      break;
        default: return;
      }

      setReportData(response.data);
    } catch (err) {
      console.error(err);
      showError('Failed to fetch report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => fetchReport(activeReport, filters);
  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    fetchReport(activeReport, EMPTY_FILTERS);
  };

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  // ─── Excel Download ─────────────────────────────────────────────────────────
  const handleDownload = async (apiMethod, filename) => {
    try {
      const params = buildParams(activeReport, filters);
      const response = await reportAPI[apiMethod](params);
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
      showError('Failed to download report');
    }
  };

  // ─── Summary Cards ──────────────────────────────────────────────────────────
  const SummaryCards = () => {
    const data = Array.isArray(reportData) ? reportData : [];
    if (!data.length) return null;

    switch (activeReport) {
      case 'company-payments':
      case 'rental-payments': {
        const totalAmount = data.reduce((s, p) => s + (p.total_amount || 0), 0);
        const totalPaid   = data.reduce((s, p) => s + (p.total_paid   || 0), 0);
        const totalDue    = data.reduce((s, p) => s + (p.total_due    || 0), 0);
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard title="Total Amount"   value={`SR ${totalAmount.toLocaleString()}`} icon="💰" color="blue" />
            <StatCard title="Total Paid"     value={`SR ${totalPaid.toLocaleString()}`}   icon="✅" color="green" />
            <StatCard title="Total Due"      value={`SR ${totalDue.toLocaleString()}`}    icon="⏳" color="red" />
            <StatCard title="Total Payments" value={data.length}                            icon="📋" color="purple" />
          </div>
        );
      }
      case 'combined-report': {
        const totalRevenue = data.reduce((s, i) => s + (i.revenue    || 0), 0);
        const totalCost    = data.reduce((s, i) => s + (i.cost       || 0), 0);
        const netProfit    = data.reduce((s, i) => s + (i.net_profit || 0), 0);
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard title="Total Revenue"    value={`SR ${totalRevenue.toLocaleString()}`} icon="💵" color="green" />
            <StatCard title="Total Cost"       value={`SR ${totalCost.toLocaleString()}`}    icon="💸" color="red" />
            <StatCard title="Net Profit/Loss"  value={`SR ${netProfit.toLocaleString()}`}    icon={netProfit >= 0 ? '📈' : '📉'} color={netProfit >= 0 ? 'green' : 'red'} />
            <StatCard title="Transactions"     value={data.length}                             icon="🔄" color="purple" />
          </div>
        );
      }
      case 'profit-loss': {
        const totalRevenue = data.reduce((s, i) => s + (i.revenue    || 0), 0);
        const totalCost    = data.reduce((s, i) => s + (i.cost       || 0), 0);
        const netProfit    = data.reduce((s, i) => s + (i.net_profit || 0), 0);
        const avgMargin    = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard title="Total Revenue"   value={`SR ${totalRevenue.toLocaleString()}`} icon="💵" color="green" />
            <StatCard title="Total Cost"      value={`SR ${totalCost.toLocaleString()}`}    icon="💸" color="red" />
            <StatCard title="Net Profit/Loss" value={`SR ${netProfit.toLocaleString()}`}    icon={netProfit >= 0 ? '📈' : '📉'} color={netProfit >= 0 ? 'green' : 'red'} />
            <StatCard title="Avg Margin"      value={`${avgMargin}%`}                        icon="📊" color={netProfit >= 0 ? 'blue' : 'yellow'} />
          </div>
        );
      }
      default: return null;
    }
  };

  // ─── Filter Panel ───────────────────────────────────────────────────────────
  const FilterPanel = () => {
    const cfg = REPORT_FILTERS[activeReport] || {};
    return (
      <div className="mb-4 flex flex-wrap gap-3 items-end">
        {cfg.date && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={e => setFilter('startDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={e => setFilter('endDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}
        {cfg.status && (
          <SearchableSelect
            label="Status"
            value={filters.status}
            onChange={v => setFilter('status', v)}
            options={STATUS_OPTIONS}
          />
        )}
        {cfg.company && (
          <SearchableSelect
            label="Company"
            value={filters.company}
            onChange={v => setFilter('company', v)}
            options={companyOptions}
          />
        )}
        {cfg.driver && (
          <SearchableSelect
            label="Driver"
            value={filters.driver}
            onChange={v => setFilter('driver', v)}
            options={driverOptions}
          />
        )}
        {cfg.agent && (
          <SearchableSelect
            label="Agent"
            value={filters.agent}
            onChange={v => setFilter('agent', v)}
            options={agentOptions}
          />
        )}
        <div className="flex gap-2 items-end pb-0.5">
          <Button variant="primary" onClick={handleApply} disabled={isLoading}>
            Apply
          </Button>
          <Button variant="secondary" onClick={handleReset} disabled={isLoading}>
            Reset
          </Button>
        </div>
      </div>
    );
  };

  // ─── Tabs ───────────────────────────────────────────────────────────────────
  const ReportTabs = () => (
    <div className="flex gap-2 mb-6 border-b overflow-x-auto">
      {[
        { id: 'company-payments', label: 'Company Payments' },
        { id: 'rental-payments',  label: 'Rental Payments' },
        { id: 'combined-report',  label: 'Combined Report' },
        { id: 'profit-loss',      label: 'Profit & Loss' },
      ].map(tab => (
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

  // ─── Download Button Row ────────────────────────────────────────────────────
  const DownloadRow = () => {
    const map = {
      'company-payments': { fn: 'downloadCompanyPayments', file: 'CompanyPaymentsReport.xlsx' },
      'rental-payments':  { fn: 'downloadRentalPayments',  file: 'RentalPaymentsReport.xlsx' },
      'combined-report':  { fn: 'downloadCombinedReport',  file: 'CombinedReport.xlsx' },
      'profit-loss':      { fn: 'downloadProfitLoss',      file: 'ProfitLossReport.xlsx' },
    };
    const current = map[activeReport];
    if (!current) return null;
    return (
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => handleDownload(current.fn, current.file)}>
          📥 Download Excel
        </Button>
      </div>
    );
  };

  // ─── Table Components ───────────────────────────────────────────────────────
  const PaymentsReport = ({ data }) => {
    const isRental = activeReport === 'rental-payments';
    return (
      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full min-w-max">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Driver</th>
              {isRental && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Iqama ID</th>}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Paid</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Due</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-800">{p.payment_type === 'vehicle-acquisition' ? 'Vehicle Rental' : p.payment_type}</td>
                <td className="px-4 py-3 text-xs text-gray-800 whitespace-nowrap">{p.transaction_date ? formatDate(p.transaction_date) : '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-800">{p.company}</td>
                <td className="px-4 py-3 text-xs text-gray-800">{p.driver || '-'}</td>
                {isRental && <td className="px-4 py-3 text-xs text-gray-800">{p.iqama_id || '-'}</td>}
                <td className="px-4 py-3 text-xs text-gray-800 whitespace-nowrap">SR {p.total_amount?.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-green-700 font-medium whitespace-nowrap">SR {p.total_paid?.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-red-700 font-medium whitespace-nowrap">SR {p.total_due?.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs"><StatusBadge status={p.status} /></td>
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
            {['Rental Code','Company','Driver','Agent','From','To','Revenue','Rev. Paid','Rev. Due','Rev. Status','Cost','Cost Paid','Cost Due','Cost Status','Net Profit/Loss'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => {
            const profit = item.net_profit >= 0;
            return (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-800 whitespace-nowrap">{item.rental_code || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-800">{item.company || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-800">{item.driver || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-800">{item.agent || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-800">{item.from_location || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-800">{item.to_location || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-800 whitespace-nowrap">SR {item.revenue?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-xs text-green-700 whitespace-nowrap">SR {item.revenue_paid?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-xs text-red-700 whitespace-nowrap">SR {item.revenue_due?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-xs"><StatusBadge status={item.revenue_status} /></td>
                <td className="px-4 py-3 text-xs text-gray-800 whitespace-nowrap">SR {item.cost?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-xs text-green-700 whitespace-nowrap">SR {item.cost_paid?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-xs text-red-700 whitespace-nowrap">SR {item.cost_due?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-xs"><StatusBadge status={item.cost_status} /></td>
                <td className={`px-4 py-3 text-xs font-bold whitespace-nowrap ${profit ? 'text-green-600' : 'text-red-600'}`}>
                  SR {item.net_profit?.toLocaleString() || 0}
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
            {['Rental Code','Company','Driver','Agent','Revenue','Cost','Net Profit/Loss','Profit Margin','Date'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => {
            const profit = item.net_profit >= 0;
            return (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-800 whitespace-nowrap">{item.rental_code || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-800">{item.company || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-800">{item.driver || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-800">{item.agent || '-'}</td>
                <td className="px-4 py-3 text-xs text-green-700 font-medium whitespace-nowrap">SR {item.revenue?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-xs text-red-700 font-medium whitespace-nowrap">SR {item.cost?.toLocaleString() || 0}</td>
                <td className={`px-4 py-3 text-xs font-bold whitespace-nowrap ${profit ? 'text-green-600' : 'text-red-600'}`}>
                  SR {item.net_profit?.toLocaleString() || 0}
                </td>
                <td className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${profit ? 'text-green-600' : 'text-red-600'}`}>
                  {item.profit_margin || '0%'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-800 whitespace-nowrap">
                  {item.rental_date ? formatDate(item.rental_date) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  const renderReport = () => {
    if (isLoading) return <div className="text-center py-12 text-gray-600">Loading report...</div>;
    if (!reportData) return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Report data is not loaded yet.</p>
        <Button variant="primary" onClick={() => fetchReport(activeReport)}>Load Report</Button>
      </div>
    );

    const data = Array.isArray(reportData) ? reportData : [];
    if (!data.length) return <div className="text-center py-12 text-gray-400">No results match the selected filters.</div>;

    switch (activeReport) {
      case 'company-payments':
      case 'rental-payments':  return <PaymentsReport data={data} />;
      case 'combined-report':  return <CombinedReport data={data} />;
      case 'profit-loss':      return <ProfitLossReport data={data} />;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Reports</h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">View detailed reports and download Excel files</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <ReportTabs />
        <FilterPanel />
        <DownloadRow />
        <SummaryCards />
        {renderReport()}
      </div>
    </div>
  );
}
