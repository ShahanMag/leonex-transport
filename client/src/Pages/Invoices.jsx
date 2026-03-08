import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { invoiceAPI, companyAPI, customerAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';
import { formatDate } from '../utils/dateUtils';

const emptyForm = {
  invoice_number: '',
  date: '',
  company_id: '',
  customer_id: '',
  amount: '',
  commission_pct: '0',
  description: '',
  notes: '',
};

// Download a blank Excel template for bulk upload
function downloadTemplate() {
  const headers = [
    'Invoice Number',
    'Date (YYYY-MM-DD)',
    'Company Name',
    'Customer Name',
    'Amount',
    'Commission %',
    'Description',
    'Notes',
  ];
  const example = ['INV-001', '2026-01-15', 'Acme Corp', 'John Doe', 1000, 5, 'Optional description', 'Optional notes'];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = headers.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
  XLSX.writeFile(wb, 'Invoice_Upload_Template.xlsx');
}

export default function Invoices() {
  const [invoices, setInvoices]   = useState([]);
  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Create/edit modal
  const [isOpen, setIsOpen]       = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [errors, setErrors]       = useState({});

  // Bulk upload
  const fileInputRef              = useRef(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null); // null | { successCount, errorCount, results[] }

  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
    companyAPI.getAll().then(r => setCompanies(r.data)).catch(() => {});
    customerAPI.getAll().then(r => setCustomers(r.data)).catch(() => {});
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await invoiceAPI.getAll();
      setInvoices(res.data);
    } catch {
      showError('Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setEditingId(null);
  };

  const handleOpenCreate = () => { resetForm(); setIsOpen(true); };

  const handleEdit = (inv) => {
    setForm({
      invoice_number: inv.invoice_number || '',
      date:           inv.date ? new Date(inv.date).toISOString().split('T')[0] : '',
      company_id:     inv.company_id?._id  || inv.company_id  || '',
      customer_id:    inv.customer_id?._id || inv.customer_id || '',
      amount:         inv.amount        ?? '',
      commission_pct: inv.commission_pct ?? '0',
      description:    inv.description   || '',
      notes:          inv.notes         || '',
    });
    setEditingId(inv._id);
    setIsOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.invoice_number?.trim()) e.invoice_number = 'Invoice number is required';
    if (!form.date) e.date = 'Date is required';
    if (form.amount === '') e.amount = 'Amount is required';
    else if (isNaN(form.amount) || Number(form.amount) < 0) e.amount = 'Must be a non-negative number';
    if (form.commission_pct === '') e.commission_pct = 'Commission % is required';
    else if (isNaN(form.commission_pct) || Number(form.commission_pct) < 0 || Number(form.commission_pct) > 100)
      e.commission_pct = 'Must be between 0 and 100';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setIsLoading(true);
      const payload = {
        invoice_number: form.invoice_number.trim(),
        date:           form.date,
        company_id:     form.company_id  || null,
        customer_id:    form.customer_id || null,
        amount:         parseFloat(form.amount),
        commission_pct: parseFloat(form.commission_pct),
        description:    form.description || undefined,
        notes:          form.notes       || undefined,
      };
      if (editingId) {
        await invoiceAPI.update(editingId, payload);
        showSuccess('Invoice updated successfully');
      } else {
        await invoiceAPI.create(payload);
        showSuccess('Invoice created successfully');
      }
      setIsOpen(false);
      resetForm();
      fetchInvoices();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (inv) => {
    showConfirm(`Delete invoice "${inv.invoice_number}"?`, async () => {
      try {
        setIsLoading(true);
        await invoiceAPI.delete(inv._id);
        showSuccess('Invoice deleted successfully');
        fetchInvoices();
      } catch {
        showError('Failed to delete invoice');
      } finally {
        setIsLoading(false);
      }
    });
  };

  // ─── Bulk Upload ────────────────────────────────────────────────

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected
    e.target.value = '';

    try {
      setBulkLoading(true);
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // header: true → array of objects keyed by first row
      const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (rawRows.length === 0) {
        showError('The file is empty or has no data rows.');
        return;
      }

      // Map header names to field names (flexible matching)
      const rows = rawRows.map(r => ({
        invoice_number: r['Invoice Number'] ?? r['invoice_number'] ?? r['InvoiceNumber'] ?? '',
        date:           r['Date (YYYY-MM-DD)'] ?? r['Date'] ?? r['date'] ?? '',
        company_name:   r['Company Name']  ?? r['company_name']  ?? r['Company']  ?? '',
        customer_name:  r['Customer Name'] ?? r['customer_name'] ?? r['Customer'] ?? '',
        amount:         r['Amount']        ?? r['amount']        ?? '',
        commission_pct: r['Commission %']  ?? r['commission_pct'] ?? r['Commission'] ?? 0,
        description:    r['Description']   ?? r['description']   ?? '',
        notes:          r['Notes']         ?? r['notes']         ?? '',
      }));

      const res = await invoiceAPI.bulkCreate(rows);
      setBulkResults(res.data);
      fetchInvoices();
    } catch (error) {
      showError(error.response?.data?.message || 'Bulk upload failed');
    } finally {
      setBulkLoading(false);
    }
  };

  // ─── Summary ────────────────────────────────────────────────────

  const totalAmount     = invoices.reduce((s, inv) => s + inv.amount, 0);
  const totalVAT        = invoices.reduce((s, inv) => s + (inv.vat_amount        ?? inv.amount * 0.15), 0);
  const totalCommission = invoices.reduce((s, inv) => s + (inv.commission_amount ?? inv.amount * (inv.commission_pct / 100)), 0);
  const totalBalance    = invoices.reduce((s, inv) => s + (inv.balance           ?? inv.amount - inv.amount * 0.15 - inv.amount * (inv.commission_pct / 100)), 0);

  // Form preview
  const previewAmount  = parseFloat(form.amount)         || 0;
  const previewCommPct = parseFloat(form.commission_pct) || 0;
  const previewVAT     = previewAmount * 0.15;
  const previewCommAmt = previewAmount * (previewCommPct / 100);
  const previewBalance = previewAmount - previewVAT - previewCommAmt;

  const companyOptions  = [{ value: '', label: '— None —' }, ...companies.map(c => ({ value: c._id, label: c.name }))];
  const customerOptions = [{ value: '', label: '— None —' }, ...customers.map(c => ({ value: c._id, label: c.name }))];

  const columns = [
    { key: 'invoice_number', label: 'Invoice No.' },
    { key: 'company_id',  label: 'Company',  render: (val) => val?.name || '-' },
    { key: 'customer_id', label: 'Customer', render: (val) => val?.name || '-' },
    { key: 'date',   label: 'Date',   render: (val) => val ? formatDate(val) : '-' },
    { key: 'amount', label: 'Amount', render: (val) => val != null ? `${val.toLocaleString()} SR` : '-' },
    { key: 'vat_amount',        label: 'VAT (15%)',  render: (val, row) => `${(val ?? row.amount * 0.15).toLocaleString()} SR` },
    { key: 'commission_amount', label: 'Commission', render: (val, row) => `${(val ?? row.amount * (row.commission_pct / 100)).toLocaleString()} SR` },
    { key: 'balance', label: 'Balance', render: (val, row) => {
      const b = val ?? (row.amount - row.amount * 0.15 - row.amount * (row.commission_pct / 100));
      return <span className="font-semibold text-green-700">{b.toLocaleString()} SR</span>;
    }},
    { key: 'notes', label: 'Notes', render: (val) => val || '-' },
  ];

  const actions = (row) => [
    { label: 'Edit',   onClick: () => handleEdit(row),   variant: 'secondary' },
    { label: 'Delete', onClick: () => handleDelete(row), variant: 'danger' },
  ];

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Invoices</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate('/invoices/report')}>
            📊 View Report
          </Button>
          <Button variant="secondary" onClick={downloadTemplate} title="Download Excel template for bulk upload">
            📥 Template
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkLoading}
            title="Upload an Excel file to bulk-create invoices"
          >
            {bulkLoading ? 'Uploading...' : '📤 Bulk Upload'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="success" onClick={handleOpenCreate}>+ Add Invoice</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-blue-500">
          <div className="bg-blue-500 p-3 rounded-lg"><span className="text-white text-xl">💰</span></div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total Amount</p>
            <p className="text-xl font-bold text-blue-600">{totalAmount.toLocaleString()} SR</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-orange-500">
          <div className="bg-orange-500 p-3 rounded-lg"><span className="text-white text-xl">🏛️</span></div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total VAT (15%)</p>
            <p className="text-xl font-bold text-orange-600">{totalVAT.toLocaleString()} SR</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-purple-500">
          <div className="bg-purple-500 p-3 rounded-lg"><span className="text-white text-xl">📊</span></div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total Commission</p>
            <p className="text-xl font-bold text-purple-600">{totalCommission.toLocaleString()} SR</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-green-500">
          <div className="bg-green-500 p-3 rounded-lg"><span className="text-white text-xl">📈</span></div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Net Balance</p>
            <p className="text-xl font-bold text-green-600">{totalBalance.toLocaleString()} SR</p>
          </div>
        </div>
      </div>

      <Table columns={columns} data={invoices} actions={actions} isLoading={isLoading} />

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); resetForm(); }}
        title={editingId ? 'Edit Invoice' : 'Add New Invoice'}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setIsOpen(false); resetForm(); }} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Processing...' : editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <Form
          fields={[
            { name: 'invoice_number', label: 'Invoice Number', placeholder: 'e.g., INV-001', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true },
            { name: 'company_id',  label: 'Company (optional)',  type: 'select', options: companyOptions },
            { name: 'customer_id', label: 'Customer (optional)', type: 'select', options: customerOptions },
            { name: 'amount', label: 'Amount (SR)', type: 'number', placeholder: '0', required: true },
            { name: 'commission_pct', label: 'Commission %', type: 'number', placeholder: '0', required: true },
            { name: 'description', label: 'Description', placeholder: 'Optional description' },
            { name: 'notes', label: 'Notes', placeholder: 'Optional notes' },
          ]}
          values={form}
          errors={errors}
          onChange={setForm}
          isLoading={isLoading}
        />

        {/* Live computed preview */}
        {previewAmount > 0 && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-3 text-center border">
            <div>
              <p className="text-xs text-gray-500 mb-1">VAT (15%)</p>
              <p className="font-bold text-orange-600">{previewVAT.toLocaleString()} SR</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Commission</p>
              <p className="font-bold text-purple-600">{previewCommAmt.toLocaleString()} SR</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Net Balance</p>
              <p className="font-bold text-green-600">{previewBalance.toLocaleString()} SR</p>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Bulk Upload Results Modal ── */}
      <Modal
        isOpen={!!bulkResults}
        onClose={() => setBulkResults(null)}
        title="Bulk Upload Results"
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setBulkResults(null)}>Close</Button>
        }
      >
        {bulkResults && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{bulkResults.successCount}</p>
                <p className="text-sm text-green-700">Imported successfully</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{bulkResults.errorCount}</p>
                <p className="text-sm text-red-700">Failed</p>
              </div>
            </div>

            {/* Per-row details */}
            {bulkResults.results.length > 0 && (
              <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
                {bulkResults.results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-4 py-3 ${r.status === 'success' ? 'bg-green-50' : 'bg-red-50'}`}
                  >
                    <span className="mt-0.5">{r.status === 'success' ? '✅' : '❌'}</span>
                    <div className="text-sm">
                      <span className="font-medium text-gray-600">Row {r.row}: </span>
                      {r.status === 'success'
                        ? <span className="text-green-700">Imported — <strong>{r.invoice_number}</strong></span>
                        : <span className="text-red-700">{r.message}</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}
