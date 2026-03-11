import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { quotationAPI, customerAPI, companyAPI, termAPI } from '../services/api';
import Button from '../components/Button';
import { showSuccess, showError } from '../utils/toast';

const STATUS_OPTIONS = ['Draft', 'Sent', 'Approved', 'Rejected'];

const emptyRow = () => ({
  from_location: '', to_location: '',
  rate_4m_dyna: '', rate_6m_dyna: '', rate_fsr: '', rate_trailer: '',
});

const today = () => new Date().toISOString().slice(0, 10);

const add15Days = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 15);
  return d.toISOString().slice(0, 10);
};

const defaultForm = { clientType: 'customer', customer: '', company: '', status: 'Draft', quotation_date: today(), valid_until: add15Days(today()), notes: '' };

function downloadRatesTemplate() {
  const headers = ['From', 'To', '4m Dyna (SAR)', '6m Dyna (SAR)', 'FSR (SAR)', 'Trailer (SAR)'];
  const example = ['Riyadh', 'Jeddah', 500, 700, 900, 1200];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transport Rates');
  XLSX.writeFile(wb, 'QuotationRates_Template.xlsx');
}

export default function QuotationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);
  const [customers, setCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [allTerms, setAllTerms] = useState([]);
  const [formValues, setFormValues] = useState(defaultForm);
  const [transportRates, setTransportRates] = useState([emptyRow()]);
  const [selectedTermIds, setSelectedTermIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [rowErrors, setRowErrors] = useState([]);
  const [quotationNumber, setQuotationNumber] = useState('');
  const rateFileRef = useRef(null);

  useEffect(() => {
    loadDropdowns();
    if (isEdit) loadQuotation();
  }, [id]);

  const loadDropdowns = async () => {
    try {
      const [custRes, compRes, termRes] = await Promise.all([customerAPI.getAll(), companyAPI.getAll(), termAPI.getAll()]);
      setCustomers(custRes.data || []);
      setCompanies(compRes.data || []);
      setAllTerms((termRes.data || []).filter((t) => t.is_active));
    } catch {
      showError('Failed to load form data');
    }
  };

  const loadQuotation = async () => {
    try {
      setIsFetching(true);
      const res = await quotationAPI.getById(id);
      const q = res.data;
      setQuotationNumber(q.quotation_number);
      const hasCompany = !!(q.company?._id || q.company);
      setFormValues({
        clientType: hasCompany ? 'company' : 'customer',
        customer: q.customer?._id || q.customer || '',
        company: q.company?._id || q.company || '',
        status: q.status || 'Draft',
        quotation_date: q.quotation_date ? q.quotation_date.slice(0, 10) : today(),
        valid_until: q.valid_until ? q.valid_until.slice(0, 10) : add15Days(q.quotation_date?.slice(0, 10) || today()),
        notes: q.notes || '',
      });
      setTransportRates(
        q.transport_rates?.length
          ? q.transport_rates.map((r) => ({
              from_location: r.from_location || '',
              to_location: r.to_location || '',
              rate_4m_dyna: r.rate_4m_dyna ?? '',
              rate_6m_dyna: r.rate_6m_dyna ?? '',
              rate_fsr: r.rate_fsr ?? '',
              rate_trailer: r.rate_trailer ?? '',
            }))
          : [emptyRow()]
      );
      setSelectedTermIds(q.terms?.map((t) => String(t.term_id || t._id)).filter(Boolean) || []);
    } catch {
      showError('Failed to load quotation');
      navigate('/quotations');
    } finally {
      setIsFetching(false);
    }
  };

  const handleRateFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // allow re-selecting same file
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (rawRows.length === 0) { showError('No data rows found in the file.'); return; }

      const parsed = rawRows
        .map(r => ({
          from_location: String(r['From'] ?? r['from_location'] ?? r['FROM'] ?? '').trim(),
          to_location:   String(r['To']   ?? r['to_location']   ?? r['TO']   ?? '').trim(),
          rate_4m_dyna:  r['4m Dyna (SAR)'] ?? r['rate_4m_dyna'] ?? r['4m Dyna'] ?? '',
          rate_6m_dyna:  r['6m Dyna (SAR)'] ?? r['rate_6m_dyna'] ?? r['6m Dyna'] ?? '',
          rate_fsr:      r['FSR (SAR)']     ?? r['rate_fsr']     ?? r['FSR']     ?? '',
          rate_trailer:  r['Trailer (SAR)'] ?? r['rate_trailer'] ?? r['Trailer'] ?? '',
        }))
        .filter(r => r.from_location || r.to_location); // skip fully blank rows

      if (parsed.length === 0) { showError('No valid rows found. Ensure From/To columns are filled.'); return; }

      setTransportRates(parsed);
      setRowErrors([]);
      showSuccess(`${parsed.length} row${parsed.length !== 1 ? 's' : ''} loaded from file`);
    } catch {
      showError('Failed to read the Excel file.');
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (formValues.clientType === 'customer' && !formValues.customer) newErrors.customer = 'Customer is required';
    if (formValues.clientType === 'company' && !formValues.company) newErrors.company = 'Company is required';
    if (!formValues.quotation_date) newErrors.quotation_date = 'Quotation date is required';
    if (!formValues.valid_until) newErrors.valid_until = 'Valid until date is required';

    const newRowErrors = transportRates.map((r) => ({
      from_location: !r.from_location.trim(),
      to_location: !r.to_location.trim(),
    }));
    const hasRowErrors = newRowErrors.some((r) => r.from_location || r.to_location);
    if (hasRowErrors) newErrors.transport_rates = 'All rows must have From and To cities filled in';

    if (Object.keys(newErrors).length || hasRowErrors) {
      setErrors(newErrors);
      setRowErrors(newRowErrors);
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        transport_rates: transportRates
          .filter((r) => r.from_location.trim() && r.to_location.trim())
          .map((r) => ({
            from_location: r.from_location.trim(),
            to_location: r.to_location.trim(),
            rate_4m_dyna: parseFloat(r.rate_4m_dyna) || 0,
            rate_6m_dyna: parseFloat(r.rate_6m_dyna) || 0,
            rate_fsr: parseFloat(r.rate_fsr) || 0,
            rate_trailer: parseFloat(r.rate_trailer) || 0,
          })),
        term_ids: selectedTermIds,
        quotation_date: formValues.quotation_date,
        valid_until: formValues.valid_until,
        notes: formValues.notes,
      };

      if (formValues.clientType === 'customer') {
        payload.customer = formValues.customer;
        payload.company = null;
      } else {
        payload.company = formValues.company;
        payload.customer = null;
      }

      if (isEdit) {
        await quotationAPI.update(id, { ...payload, status: formValues.status });
        showSuccess('Quotation updated successfully');
        navigate(`/quotations/${id}`);
      } else {
        const res = await quotationAPI.create(payload);
        showSuccess('Quotation created successfully');
        navigate(`/quotations/${res.data._id}`);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save quotation');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRow = (idx, field, value) => {
    setTransportRates((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    if (value.trim() && rowErrors[idx]?.[field]) {
      setRowErrors((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: false } : r));
    }
  };

  const addRow = () => setTransportRates((prev) => [...prev, emptyRow()]);

  const removeRow = (idx) => {
    if (transportRates.length === 1) return;
    setTransportRates((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleTerm = (termId) =>
    setSelectedTermIds((prev) =>
      prev.includes(termId) ? prev.filter((t) => t !== termId) : [...prev, termId]
    );

  const handleBack = () => isEdit ? navigate(`/quotations/${id}`) : navigate('/quotations');

  if (isFetching) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-gray-500">Loading quotation...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleBack} className="text-gray-500 hover:text-gray-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? `Edit ${quotationNumber}` : 'New Quotation'}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {/* Basic fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
            <select
              value={formValues.clientType}
              onChange={(e) => {
                setFormValues((v) => ({ ...v, clientType: e.target.value, customer: '', company: '' }));
                setErrors((prev) => ({ ...prev, customer: undefined, company: undefined }));
              }}
              disabled={isEdit || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
            >
              <option value="customer">Customer</option>
              <option value="company">Company</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formValues.clientType === 'customer' ? 'Customer' : 'Company'} <span className="text-red-500">*</span>
            </label>
            {formValues.clientType === 'customer' ? (
              <select
                value={formValues.customer}
                onChange={(e) => {
                  setFormValues((v) => ({ ...v, customer: e.target.value }));
                  if (e.target.value) setErrors((prev) => ({ ...prev, customer: undefined }));
                }}
                disabled={isEdit || isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm disabled:bg-gray-100 ${errors.customer ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <select
                value={formValues.company}
                onChange={(e) => {
                  setFormValues((v) => ({ ...v, company: e.target.value }));
                  if (e.target.value) setErrors((prev) => ({ ...prev, company: undefined }));
                }}
                disabled={isEdit || isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm disabled:bg-gray-100 ${errors.company ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
              >
                <option value="">-- Select Company --</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            )}
            {errors.customer && <p className="text-red-500 text-xs mt-1">{errors.customer}</p>}
            {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formValues.status}
              onChange={(e) => setFormValues((v) => ({ ...v, status: e.target.value }))}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quotation Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formValues.quotation_date}
              onChange={(e) => {
                setFormValues((v) => ({ ...v, quotation_date: e.target.value }));
                if (e.target.value) setErrors((prev) => ({ ...prev, quotation_date: undefined }));
              }}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${errors.quotation_date ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
            />
            {errors.quotation_date && <p className="text-red-500 text-xs mt-1">{errors.quotation_date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valid Until <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formValues.valid_until}
              onChange={(e) => {
                setFormValues((v) => ({ ...v, valid_until: e.target.value }));
                if (e.target.value) setErrors((prev) => ({ ...prev, valid_until: undefined }));
              }}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${errors.valid_until ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
            />
            {errors.valid_until && <p className="text-red-500 text-xs mt-1">{errors.valid_until}</p>}
          </div>
        </div>

        {/* Notes — temporarily hidden
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={formValues.notes}
            onChange={(e) => setFormValues((v) => ({ ...v, notes: e.target.value }))}
            placeholder="Additional notes..."
            rows={3}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        */}

        {/* Transport Rates */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Transport Rates</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={downloadRatesTemplate}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                title="Download Excel template"
              >
                📥 Template
              </button>
              <button
                type="button"
                onClick={() => rateFileRef.current?.click()}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                title="Upload Excel to replace table rows"
              >
                📤 Upload Rows
              </button>
              <input
                ref={rateFileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleRateFileUpload}
              />
              <button
                onClick={addRow}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add Row
              </button>
            </div>
          </div>
          {errors.transport_rates && <p className="text-red-500 text-xs mb-2">{errors.transport_rates}</p>}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['From', 'To', '4m Dyna (SAR)', '6m Dyna (SAR)', 'FSR (SAR)', 'Trailer (SAR)', ''].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transportRates.map((row, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    {['from_location', 'to_location'].map((field) => (
                      <td key={field} className="px-2 py-2">
                        <input
                          type="text"
                          value={row[field]}
                          onChange={(e) => updateRow(idx, field, e.target.value)}
                          placeholder={field === 'from_location' ? 'From city' : 'To city'}
                          disabled={isLoading}
                          className={`w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${rowErrors[idx]?.[field] ? 'border-red-400' : 'border-gray-300'}`}
                        />
                      </td>
                    ))}
                    {['rate_4m_dyna', 'rate_6m_dyna', 'rate_fsr', 'rate_trailer'].map((field) => (
                      <td key={field} className="px-2 py-2">
                        <input
                          type="number"
                          value={row[field]}
                          onChange={(e) => updateRow(idx, field, e.target.value)}
                          placeholder="0"
                          min="0"
                          disabled={isLoading}
                          onWheel={(e) => e.target.blur()}
                          className="w-28 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <button
                        onClick={() => removeRow(idx)}
                        disabled={transportRates.length === 1}
                        className="text-red-400 hover:text-red-600 disabled:text-gray-300 text-xl leading-none px-1"
                      >×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms */}
        {allTerms.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Terms & Conditions</h3>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-blue-600 font-medium">
                <input
                  type="checkbox"
                  checked={selectedTermIds.length === allTerms.length}
                  ref={el => { if (el) el.indeterminate = selectedTermIds.length > 0 && selectedTermIds.length < allTerms.length; }}
                  onChange={() => {
                    if (selectedTermIds.length === allTerms.length) {
                      setSelectedTermIds([]);
                    } else {
                      setSelectedTermIds(allTerms.map(t => String(t._id)));
                    }
                  }}
                  className="accent-blue-600"
                />
                Select All
              </label>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
              {allTerms.map((term) => (
                <label key={term._id} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTermIds.includes(String(term._id))}
                    onChange={() => toggleTerm(String(term._id))}
                    className="mt-0.5 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    {term.title && <span className="font-medium">{term.title}: </span>}
                    {term.description}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={handleBack} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update Quotation' : 'Create Quotation'}
        </Button>
      </div>
    </div>
  );
}
