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

const emptyInstallmentForm = {
  amount: '',
  paid_date: '',
  notes: '',
};

const STATUS_STYLES = {
  paid:    'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  unpaid:  'bg-red-100 text-red-800',
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

  // Installments modal
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [activeTrack, setActiveTrack]     = useState('amount'); // 'amount' | 'commission'
  const [installForm, setInstallForm]     = useState(emptyInstallmentForm);
  const [installErrors, setInstallErrors] = useState({});
  const [editingInstallId, setEditingInstallId] = useState(null);
  const [installLoading, setInstallLoading] = useState(false);

  // Bulk upload
  const fileInputRef              = useRef(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);

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

  // ─── Installments ───────────────────────────────────────────────

  const syncActiveInvoice = (updated) => {
    setInvoices(prev => prev.map(inv => inv._id === updated._id ? updated : inv));
    setActiveInvoice(updated);
  };

  const handleOpenInstallments = (inv, track) => {
    setActiveInvoice(inv);
    setActiveTrack(track);
    setInstallForm(emptyInstallmentForm);
    setInstallErrors({});
    setEditingInstallId(null);
    setIsInstallOpen(true);
  };

  const handleEditInstallment = (inst) => {
    setInstallForm({
      amount: inst.amount ?? '',
      paid_date: inst.paid_date ? new Date(inst.paid_date).toISOString().split('T')[0] : '',
      notes: inst.notes || '',
    });
    setEditingInstallId(inst._id);
  };

  const handleCancelInstallEdit = () => {
    setInstallForm(emptyInstallmentForm);
    setInstallErrors({});
    setEditingInstallId(null);
  };

  const validateInstallment = () => {
    const e = {};
    if (installForm.amount === '' || installForm.amount === undefined) e.amount = 'Amount is required';
    else if (isNaN(installForm.amount) || Number(installForm.amount) <= 0) e.amount = 'Amount must be greater than 0';
    if (!installForm.paid_date) e.paid_date = 'Date is required';
    setInstallErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleInstallSubmit = async () => {
    if (!validateInstallment()) return;
    try {
      setInstallLoading(true);
      const payload = {
        amount: parseFloat(installForm.amount),
        paid_date: installForm.paid_date,
        notes: installForm.notes || undefined,
      };
      let res;
      if (editingInstallId) {
        res = await invoiceAPI.updateInstallment(activeInvoice._id, activeTrack, editingInstallId, payload);
        showSuccess('Payment updated');
      } else {
        res = await invoiceAPI.addInstallment(activeInvoice._id, activeTrack, payload);
        showSuccess('Payment recorded');
      }
      syncActiveInvoice(res.data.invoice);
      setInstallForm(emptyInstallmentForm);
      setInstallErrors({});
      setEditingInstallId(null);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save payment');
    } finally {
      setInstallLoading(false);
    }
  };

  const handleDeleteInstallment = (inst) => {
    showConfirm('Delete this payment entry?', async () => {
      try {
        setInstallLoading(true);
        const res = await invoiceAPI.deleteInstallment(activeInvoice._id, activeTrack, inst._id);
        showSuccess('Payment deleted');
        syncActiveInvoice(res.data.invoice);
      } catch {
        showError('Failed to delete payment');
      } finally {
        setInstallLoading(false);
      }
    });
  };

  // ─── Bulk Upload ────────────────────────────────────────────────

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      setBulkLoading(true);
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (rawRows.length === 0) {
        showError('The file is empty or has no data rows.');
        return;
      }

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
  const amtReceived     = invoices.reduce((s, inv) => s + (inv.amount_paid || 0), 0);
  const totalVAT        = invoices.reduce((s, inv) => s + (inv.vat_amount ?? inv.amount * 0.15 / 1.15), 0);
  const totalCommission = invoices.reduce((s, inv) => s + (inv.commission_amount ?? (inv.amount / 1.15) * (inv.commission_pct / 100)), 0);
  const commReceived    = invoices.reduce((s, inv) => s + (inv.commission_paid || 0), 0);
  const payableAmount   = totalAmount - totalVAT - totalCommission;
  const vatOfReceived   = amtReceived * 0.15 / 1.15;
  const payablePaid     = amtReceived - vatOfReceived - commReceived;
  const netBalance      = payableAmount;
  const balanceReceived = payablePaid;

  // Form preview — amount is VAT-inclusive
  const previewAmount      = parseFloat(form.amount)         || 0;
  const previewCommPct     = parseFloat(form.commission_pct) || 0;
  const previewAmountNoVAT = previewAmount / 1.15;
  const previewVAT         = previewAmount * 0.15 / 1.15;
  const previewCommAmt     = previewAmountNoVAT * (previewCommPct / 100);
  const previewBalance     = previewAmount - previewVAT - previewCommAmt;

  const companyOptions  = [{ value: '', label: '— None —' }, ...companies.map(c => ({ value: c._id, label: c.name }))];
  const customerOptions = [{ value: '', label: '— None —' }, ...customers.map(c => ({ value: c._id, label: c.name }))];

  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const columns = [
    { key: 'invoice_number', label: 'Invoice No.' },
    { key: 'company_id',  label: 'Company',  render: (val) => val?.name || '-' },
    { key: 'customer_id', label: 'Customer', render: (val) => val?.name || '-' },
    { key: 'date',   label: 'Date',   render: (val) => val ? formatDate(val) : '-' },
    { key: 'amount', label: 'Amount', render: (val) => val != null ? `${val.toLocaleString()} SR` : '-' },
    { key: 'vat_amount',       label: 'VAT (15%)',   render: (val, row) => `${fmt(val ?? row.amount * 0.15 / 1.15)} SR` },
    { key: 'amount_without_vat', label: 'Amt w/o VAT', render: (val, row) => `${fmt(val ?? row.amount / 1.15)} SR` },
    { key: 'commission_amount', label: 'Commission',  render: (val, row) => `${fmt(val ?? (row.amount / 1.15) * (row.commission_pct / 100))} SR` },
    { key: 'balance', label: 'Balance', render: (val, row) => {
      const b = val ?? (row.amount - (row.amount * 0.15 / 1.15) - (row.amount / 1.15) * (row.commission_pct / 100));
      return <span className="font-semibold text-green-700">{fmt(b)} SR</span>;
    }},
    { key: 'amount_status', label: 'Amt Status', render: (val) => (
      <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${STATUS_STYLES[val] || ''}`}>{val || 'unpaid'}</span>
    )},
    { key: 'commission_status', label: 'Comm Status', render: (val) => (
      <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${STATUS_STYLES[val] || ''}`}>{val || 'unpaid'}</span>
    )},
    { key: 'notes', label: 'Notes', render: (val) => val || '-' },
  ];

  const actions = (row) => [
    { label: 'Payments', onClick: () => handleOpenInstallments(row, 'amount'), variant: 'primary' },
    { label: 'Edit',     onClick: () => handleEdit(row),   variant: 'secondary' },
    { label: 'Delete',   onClick: () => handleDelete(row), variant: 'danger' },
  ];

  // ─── Installment modal helpers ──────────────────────────────────

  const getTrackInstallments = () => {
    if (!activeInvoice) return [];
    return activeTrack === 'amount'
      ? (activeInvoice.amount_installments || [])
      : (activeInvoice.commission_installments || []);
  };

  const getTrackTotal = () => {
    if (!activeInvoice) return 0;
    return activeTrack === 'amount'
      ? activeInvoice.amount
      : (activeInvoice.commission_amount ?? (activeInvoice.amount / 1.15) * (activeInvoice.commission_pct / 100));
  };

  const getTrackPaid = () => {
    if (!activeInvoice) return 0;
    return activeTrack === 'amount'
      ? (activeInvoice.amount_paid || 0)
      : (activeInvoice.commission_paid || 0);
  };

  const getTrackStatus = () => {
    if (!activeInvoice) return 'unpaid';
    return activeTrack === 'amount'
      ? (activeInvoice.amount_status || 'unpaid')
      : (activeInvoice.commission_status || 'unpaid');
  };

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Invoices</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate('/invoices/report')}>
            View Report
          </Button>
          <Button variant="secondary" onClick={downloadTemplate} title="Download Excel template for bulk upload">
            Template
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkLoading}
            title="Upload an Excel file to bulk-create invoices"
          >
            {bulkLoading ? 'Uploading...' : 'Bulk Upload'}
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

      {/* Summary Cards — 8 tiles in 2 rows */}
      <div className="space-y-3 mb-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-blue-500">
            <div className="bg-blue-500 p-3 rounded-lg"><span className="text-white text-xl">💰</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Amt. Received</p>
              <p className="text-xl font-bold text-blue-600">{fmt(amtReceived)} SR</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-orange-500">
            <div className="bg-orange-500 p-3 rounded-lg"><span className="text-white text-xl">🏛️</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">VAT Deducted</p>
              <p className="text-xl font-bold text-orange-600">{fmt(totalVAT)} SR</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-purple-500">
            <div className="bg-purple-500 p-3 rounded-lg"><span className="text-white text-xl">📊</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Commission Total</p>
              <p className="text-xl font-bold text-purple-600">{fmt(totalCommission)} SR</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-purple-300">
            <div className="bg-purple-300 p-3 rounded-lg"><span className="text-white text-xl">✅</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Commission Received</p>
              <p className="text-xl font-bold text-purple-500">{fmt(commReceived)} SR</p>
            </div>
          </div>
        </div>
        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-red-500">
            <div className="bg-red-500 p-3 rounded-lg"><span className="text-white text-xl">📋</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Payable Amount</p>
              <p className="text-xl font-bold text-red-600">{fmt(payableAmount)} SR</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-red-300">
            <div className="bg-red-300 p-3 rounded-lg"><span className="text-white text-xl">💸</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Payable Paid</p>
              <p className="text-xl font-bold text-red-500">{fmt(payablePaid)} SR</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-green-500">
            <div className="bg-green-500 p-3 rounded-lg"><span className="text-white text-xl">📈</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Net Balance</p>
              <p className="text-xl font-bold text-green-600">{fmt(netBalance)} SR</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4 border-l-4 border-green-300">
            <div className="bg-green-300 p-3 rounded-lg"><span className="text-white text-xl">✅</span></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Balance Received</p>
              <p className="text-xl font-bold text-green-500">{fmt(balanceReceived)} SR</p>
            </div>
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
            { name: 'notes', label: 'Notes', placeholder: 'Optional notes' },
          ]}
          values={form}
          errors={errors}
          onChange={setForm}
          isLoading={isLoading}
        />

        {/* Live computed preview */}
        {previewAmount > 0 && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center border">
            <div>
              <p className="text-xs text-gray-500 mb-1">VAT (15%)</p>
              <p className="font-bold text-orange-600">{fmt(previewVAT)} SR</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Amt w/o VAT</p>
              <p className="font-bold text-gray-700">{fmt(previewAmountNoVAT)} SR</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Commission</p>
              <p className="font-bold text-purple-600">{fmt(previewCommAmt)} SR</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Net Balance</p>
              <p className="font-bold text-green-600">{fmt(previewBalance)} SR</p>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Installments Modal ── */}
      <Modal
        isOpen={isInstallOpen}
        onClose={() => { setIsInstallOpen(false); setActiveInvoice(null); handleCancelInstallEdit(); }}
        title={activeInvoice
          ? `${activeTrack === 'amount' ? 'Amount' : 'Commission'} Payments — ${activeInvoice.invoice_number}`
          : 'Payments'}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => { setIsInstallOpen(false); setActiveInvoice(null); handleCancelInstallEdit(); }}>
            Close
          </Button>
        }
      >
        {activeInvoice && (
          <div className="space-y-5">

            {/* Track tabs */}
            <div className="flex border-b border-gray-200">
              {['amount', 'commission'].map(t => (
                <button
                  key={t}
                  onClick={() => { setActiveTrack(t); handleCancelInstallEdit(); }}
                  className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTrack === t
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'amount' ? 'Amount Payments' : 'Commission Payments'}
                </button>
              ))}
            </div>

            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-4 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="font-bold text-gray-800">{fmt(getTrackTotal())} SR</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Paid</p>
                <p className="font-bold text-green-600">{fmt(getTrackPaid())} SR</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Remaining</p>
                <p className="font-bold text-red-600">{fmt(getTrackTotal() - getTrackPaid())} SR</p>
              </div>
              <div className="col-span-3">
                <span className={`px-3 py-1 rounded text-xs font-semibold capitalize ${STATUS_STYLES[getTrackStatus()] || ''}`}>
                  {getTrackStatus()}
                </span>
              </div>
            </div>

            {/* Installments list */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment History</h4>
              {getTrackInstallments().length === 0 ? (
                <p className="text-sm text-gray-400 italic">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {getTrackInstallments().map((inst) => (
                    <div key={inst._id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{fmt(inst.amount)} SR</p>
                        <p className="text-xs text-gray-500">{inst.paid_date ? formatDate(inst.paid_date) : '-'}</p>
                        {inst.notes && <p className="text-xs text-gray-400 mt-0.5">{inst.notes}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => handleEditInstallment(inst)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteInstallment(inst)} disabled={installLoading}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add / Edit installment form */}
            {(getTrackStatus() !== 'paid' || editingInstallId) && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  {editingInstallId ? 'Edit Payment' : 'Record New Payment'}
                </h4>
                <Form
                  fields={[
                    { name: 'amount',   label: 'Amount (SR)', type: 'number', placeholder: '0', required: true },
                    { name: 'paid_date', label: 'Payment Date', type: 'date',   required: true },
                    { name: 'notes',    label: 'Notes',        placeholder: 'Optional note' },
                  ]}
                  values={installForm}
                  errors={installErrors}
                  onChange={setInstallForm}
                  isLoading={installLoading}
                />
                <div className="flex gap-2 mt-3">
                  <Button variant="primary" onClick={handleInstallSubmit} disabled={installLoading}>
                    {installLoading ? 'Saving...' : editingInstallId ? 'Update Payment' : 'Add Payment'}
                  </Button>
                  {editingInstallId && (
                    <Button variant="secondary" onClick={handleCancelInstallEdit} disabled={installLoading}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}

            {getTrackStatus() === 'paid' && !editingInstallId && (
              <p className="text-sm text-green-600 font-medium text-center border-t pt-4">
                Fully paid.
              </p>
            )}

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
