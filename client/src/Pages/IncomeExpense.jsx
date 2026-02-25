import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billAPI, customerAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';
import { formatDate } from '../utils/dateUtils';

const emptyBillForm = {
  type: 'expense',
  name: '',
  totalAmount: '',
  date: '',
  customer_id: '',
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

export default function IncomeExpense() {
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Bill create/edit modal
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [billForm, setBillForm] = useState(emptyBillForm);
  const [billErrors, setBillErrors] = useState({});

  // Installments modal
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [activeBill, setActiveBill] = useState(null);
  const [installForm, setInstallForm] = useState(emptyInstallmentForm);
  const [installErrors, setInstallErrors] = useState({});
  const [editingInstallId, setEditingInstallId] = useState(null);
  const [installLoading, setInstallLoading] = useState(false);

  const navigate = useNavigate();

  // Filter
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchBills();
    fetchCustomers();
  }, []);

  const fetchBills = async (type = typeFilter) => {
    try {
      setIsLoading(true);
      const response = await billAPI.getAll(type || undefined);
      setBills(response.data);
    } catch {
      showError('Failed to fetch bills');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data);
    } catch {
      showError('Failed to fetch customers');
    }
  };

  // Refresh activeBill from the bills list (keeps installments modal in sync)
  const syncActiveBill = (updatedBill) => {
    setBills(prev => prev.map(b => b._id === updatedBill._id ? updatedBill : b));
    setActiveBill(updatedBill);
  };

  // ─── Bill CRUD ──────────────────────────────────────────────────

  const handleFilterChange = (e) => {
    const val = e.target.value;
    setTypeFilter(val);
    fetchBills(val || undefined);
  };

  const resetBillForm = () => {
    setBillForm(emptyBillForm);
    setBillErrors({});
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetBillForm();
    setIsBillOpen(true);
  };

  const handleEditBill = (bill) => {
    setBillForm({
      type: bill.type || 'expense',
      name: bill.name || '',
      totalAmount: bill.totalAmount ?? '',
      date: bill.date ? new Date(bill.date).toISOString().split('T')[0] : '',
      customer_id: bill.customer_id?._id || bill.customer_id || '',
    });
    setEditingId(bill._id);
    setIsBillOpen(true);
  };

  const validateBill = () => {
    const e = {};
    if (!billForm.type) e.type = 'Type is required';
    if (!billForm.name?.trim()) e.name = 'Name is required';
    if (billForm.totalAmount === '') e.totalAmount = 'Total amount is required';
    else if (isNaN(billForm.totalAmount) || Number(billForm.totalAmount) < 0) e.totalAmount = 'Must be a non-negative number';
    if (!billForm.date) e.date = 'Date is required';
    setBillErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBillSubmit = async () => {
    if (!validateBill()) return;
    try {
      setIsLoading(true);
      const payload = {
        type: billForm.type,
        name: billForm.name.trim(),
        totalAmount: parseFloat(billForm.totalAmount),
        date: billForm.date,
        customer_id: billForm.customer_id || null,
      };
      if (editingId) {
        await billAPI.update(editingId, payload);
        showSuccess('Bill updated successfully');
      } else {
        await billAPI.create(payload);
        showSuccess('Bill created successfully');
      }
      setIsBillOpen(false);
      resetBillForm();
      fetchBills();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save bill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBill = (bill) => {
    showConfirm(`Delete "${bill.name}"?`, async () => {
      try {
        setIsLoading(true);
        await billAPI.delete(bill._id);
        showSuccess('Bill deleted successfully');
        fetchBills();
      } catch {
        showError('Failed to delete bill');
      } finally {
        setIsLoading(false);
      }
    });
  };

  // ─── Installments ───────────────────────────────────────────────

  const handleOpenInstallments = (bill) => {
    setActiveBill(bill);
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
        res = await billAPI.updateInstallment(activeBill._id, editingInstallId, payload);
        showSuccess('Payment updated');
      } else {
        res = await billAPI.addInstallment(activeBill._id, payload);
        showSuccess('Payment recorded');
      }
      syncActiveBill(res.data.bill);
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
        const res = await billAPI.deleteInstallment(activeBill._id, inst._id);
        showSuccess('Payment deleted');
        syncActiveBill(res.data.bill);
      } catch {
        showError('Failed to delete payment');
      } finally {
        setInstallLoading(false);
      }
    });
  };

  // ─── Summary ────────────────────────────────────────────────────

  const totalIncome  = bills.filter(b => b.type === 'income').reduce((s, b) => s + b.totalAmount, 0);
  const totalExpense = bills.filter(b => b.type === 'expense').reduce((s, b) => s + b.totalAmount, 0);
  const netBalance   = totalIncome - totalExpense;

  const customerOptions = [
    { value: '', label: '— None —' },
    ...customers.map(c => ({ value: c._id, label: c.name })),
  ];

  // ─── Table ──────────────────────────────────────────────────────

  const columns = [
    {
      key: 'type',
      label: 'Type',
      render: (val) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${val === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {val}
        </span>
      ),
    },
    { key: 'name', label: 'Name' },
    {
      key: 'customer_id',
      label: 'Customer',
      render: (val) => val?.name || '-',
    },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (val) => val != null ? `${val.toLocaleString()} SAR` : '-',
    },
    {
      key: 'paidAmount',
      label: 'Paid',
      render: (val) => val != null ? `${val.toLocaleString()} SAR` : '-',
    },
    {
      key: 'dues',
      label: 'Dues',
      render: (val) => val != null ? `${val.toLocaleString()} SAR` : '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${STATUS_STYLES[val] || ''}`}>
          {val}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (val) => val ? formatDate(val) : '-',
    },
  ];

  const actions = (row) => [
    { label: 'Payments', onClick: () => handleOpenInstallments(row), variant: 'primary' },
    { label: 'Edit',     onClick: () => handleEditBill(row),         variant: 'secondary' },
    { label: 'Delete',   onClick: () => handleDeleteBill(row),       variant: 'danger' },
  ];

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Income & Expense</h1>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => navigate('/income-expense/report')}>
            📊 View Report
          </Button>
          <Button variant="success" onClick={handleOpenCreate}>+ Add Entry</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-green-500 p-3 rounded-lg"><span className="text-white text-xl">📥</span></div>
          <div>
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-xl font-bold text-green-600">{totalIncome.toLocaleString()} SAR</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="bg-red-500 p-3 rounded-lg"><span className="text-white text-xl">📤</span></div>
          <div>
            <p className="text-sm text-gray-500">Total Expense</p>
            <p className="text-xl font-bold text-red-600">{totalExpense.toLocaleString()} SAR</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className={`${netBalance >= 0 ? 'bg-blue-500' : 'bg-orange-500'} p-3 rounded-lg`}>
            <span className="text-white text-xl">{netBalance >= 0 ? '📈' : '📉'}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Net Balance</p>
            <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {netBalance.toLocaleString()} SAR
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={typeFilter}
          onChange={handleFilterChange}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <Table columns={columns} data={bills} actions={actions} isLoading={isLoading} />

      {/* ── Bill Create / Edit Modal ── */}
      <Modal
        isOpen={isBillOpen}
        onClose={() => { setIsBillOpen(false); resetBillForm(); }}
        title={editingId ? 'Edit Bill' : 'Add New Bill'}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setIsBillOpen(false); resetBillForm(); }} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBillSubmit} disabled={isLoading}>
              {isLoading ? 'Processing...' : editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <Form
          fields={[
            {
              name: 'type',
              label: 'Type',
              type: 'select',
              required: true,
              options: [
                { value: 'income',  label: 'Income' },
                { value: 'expense', label: 'Expense' },
              ],
            },
            { name: 'name', label: 'Name / Description', placeholder: 'e.g., Salary, Fuel cost', required: true },
            {
              name: 'customer_id',
              label: 'Customer (optional)',
              type: 'select',
              options: customerOptions,
            },
            { name: 'totalAmount', label: 'Total Amount', type: 'number', placeholder: '0', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true },
          ]}
          values={billForm}
          errors={billErrors}
          onChange={setBillForm}
          isLoading={isLoading}
        />
      </Modal>

      {/* ── Installments Modal ── */}
      <Modal
        isOpen={isInstallOpen}
        onClose={() => { setIsInstallOpen(false); setActiveBill(null); handleCancelInstallEdit(); }}
        title={activeBill ? `Payments — ${activeBill.name}` : 'Payments'}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => { setIsInstallOpen(false); setActiveBill(null); handleCancelInstallEdit(); }}>
            Close
          </Button>
        }
      >
        {activeBill && (
          <div className="space-y-5">

            {/* Bill summary bar */}
            <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-4 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="font-bold text-gray-800">{activeBill.totalAmount?.toLocaleString()} SAR</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Paid</p>
                <p className="font-bold text-green-600">{activeBill.paidAmount?.toLocaleString()} SAR</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Dues</p>
                <p className="font-bold text-red-600">{activeBill.dues?.toLocaleString()} SAR</p>
              </div>
              <div className="col-span-3">
                <span className={`px-3 py-1 rounded text-xs font-semibold capitalize ${STATUS_STYLES[activeBill.status] || ''}`}>
                  {activeBill.status}
                </span>
              </div>
            </div>

            {/* Installments list */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment History</h4>
              {activeBill.installments?.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {activeBill.installments.map((inst) => (
                    <div key={inst._id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{inst.amount?.toLocaleString()} SAR</p>
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
            {activeBill.status !== 'paid' && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  {editingInstallId ? 'Edit Payment' : 'Record New Payment'}
                </h4>
                <Form
                  fields={[
                    { name: 'amount',   label: 'Amount (SAR)', type: 'number', placeholder: '0', required: true },
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

            {activeBill.status === 'paid' && (
              <p className="text-sm text-green-600 font-medium text-center border-t pt-4">
                Bill is fully paid.
              </p>
            )}

          </div>
        )}
      </Modal>

    </div>
  );
}
