import { useState, useEffect } from 'react';
import { paymentAPI, vehicleAPI, loadAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loads, setLoads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('vehicle-acquisition');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Payment creation modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFormValues, setCreateFormValues] = useState({
    payment_type: 'vehicle-acquisition',
    vehicle_id: '',
    load_id: '',
  });
  const [createErrors, setCreateErrors] = useState({});

  // Installment registration modal
  const [isInstallmentOpen, setIsInstallmentOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [installmentValues, setInstallmentValues] = useState({
    amount: '',
    paid_date: '',
    notes: '',
  });
  const [installmentErrors, setInstallmentErrors] = useState({});

  // Installment edit modal
  const [isEditInstallmentOpen, setIsEditInstallmentOpen] = useState(false);
  const [editingInstallmentId, setEditingInstallmentId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editInstallmentValues, setEditInstallmentValues] = useState({
    amount: '',
    paid_date: '',
    notes: '',
  });
  const [editInstallmentErrors, setEditInstallmentErrors] = useState({});

  useEffect(() => {
    fetchPayments();
    fetchVehicles();
    fetchLoads();
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await paymentAPI.getAll();
      setPayments(response.data);
    } catch (error) {
      showError('Failed to fetch payments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await vehicleAPI.getAll();
      setVehicles(response.data);
    } catch (error) {
      showError('Failed to fetch vehicles');
    }
  };

  const fetchLoads = async () => {
    try {
      const response = await loadAPI.getAll();
      setLoads(response.data);
    } catch (error) {
      showError('Failed to fetch loads');
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query) {
      fetchPayments();
      return;
    }

    try {
      setIsLoading(true);
      const response = await paymentAPI.search(query);
      setPayments(response.data);
    } catch (error) {
      showError('Failed to search payments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterByStatus = async (status) => {
    setStatusFilter(status);
    if (status === 'all') {
      fetchPayments();
      return;
    }

    try {
      setIsLoading(true);
      const response = await paymentAPI.filterByStatus(status);
      setPayments(response.data);
    } catch (error) {
      showError('Failed to filter payments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePayment = async (values) => {
    const { payment_type, vehicle_id, load_id } = values;

    if (!payment_type) {
      setCreateErrors({ payment_type: 'Payment type is required' });
      return;
    }

    if (payment_type === 'vehicle-acquisition' && !vehicle_id) {
      setCreateErrors({ vehicle_id: 'Vehicle is required' });
      return;
    }

    if (payment_type === 'driver-rental' && !load_id) {
      setCreateErrors({ load_id: 'Load is required' });
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        payment_type,
      };
      if (payment_type === 'vehicle-acquisition') {
        payload.vehicle_id = vehicle_id;
      } else {
        payload.load_id = load_id;
      }

      await paymentAPI.create(payload);
      showSuccess('Payment created successfully');
      setIsCreateOpen(false);
      setCreateFormValues({
        payment_type: 'vehicle-acquisition',
        vehicle_id: '',
        load_id: '',
      });
      setCreateErrors({});
      fetchPayments();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterInstallment = async (paymentId, amount, paid_date, notes) => {
    if (!amount || amount <= 0) {
      setInstallmentErrors({ amount: 'Amount must be greater than 0' });
      return;
    }

    if (!paid_date) {
      setInstallmentErrors({ paid_date: 'Payment date is required' });
      return;
    }

    try {
      setIsLoading(true);
      await paymentAPI.registerInstallment(paymentId, {
        amount: parseFloat(amount),
        paid_date,
        notes
      });
      showSuccess('Installment registered successfully');
      setIsInstallmentOpen(false);
      setSelectedPaymentId(null);
      setInstallmentValues({ amount: '', paid_date: '', notes: '' });
      setInstallmentErrors({});
      fetchPayments();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to register installment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInstallment = (payment, installment) => {
    setEditingPaymentId(payment._id);
    setEditingInstallmentId(installment._id);
    setEditInstallmentValues({
      amount: installment.amount,
      paid_date: installment.paid_date ? new Date(installment.paid_date).toISOString().split('T')[0] : '',
      notes: installment.notes || '',
    });
    setEditInstallmentErrors({});
    setIsEditInstallmentOpen(true);
  };

  const handleUpdateInstallment = async (amount, paid_date, notes) => {
    if (!amount || amount <= 0) {
      setEditInstallmentErrors({ amount: 'Amount must be greater than 0' });
      return;
    }

    if (!paid_date) {
      setEditInstallmentErrors({ paid_date: 'Payment date is required' });
      return;
    }

    try {
      setIsLoading(true);
      await paymentAPI.updateInstallment(editingPaymentId, editingInstallmentId, {
        amount: parseFloat(amount),
        paid_date,
        notes
      });
      showSuccess('Installment updated successfully');
      setIsEditInstallmentOpen(false);
      setEditingInstallmentId(null);
      setEditingPaymentId(null);
      setEditInstallmentValues({ amount: '', paid_date: '', notes: '' });
      setEditInstallmentErrors({});
      fetchPayments();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update installment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInstallment = (payment, installment) => {
    showConfirm('Are you sure you want to delete this installment?', async () => {
      try {
        setIsLoading(true);
        await paymentAPI.deleteInstallment(payment._id, installment._id);
        showSuccess('Installment deleted successfully');
        fetchPayments();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete installment');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleDeletePayment = async (payment) => {
    showConfirm('Are you sure you want to delete this payment?', async () => {
      try {
        setIsLoading(true);
        await paymentAPI.delete(payment._id);
        showSuccess('Payment deleted successfully');
        fetchPayments();
      } catch (error) {
        showError('Failed to delete payment');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const getSelectedPayment = () => {
    return payments.find(p => p._id === selectedPaymentId);
  };

  const columns = [
    { key: 'payer', label: 'Payer' },
    { key: 'payee', label: 'Payee' },
    {
      key: 'total_amount',
      label: 'Total Amount',
      render: (amount) => `₹${amount?.toLocaleString() || 0}`
    },
    {
      key: 'total_paid',
      label: 'Paid',
      render: (amount) => `₹${amount?.toLocaleString() || 0}`
    },
    {
      key: 'total_due',
      label: 'Due',
      render: (amount) => `₹${amount?.toLocaleString() || 0}`
    },
    {
      key: 'payment_type',
      label: 'Type',
      render: (payment_type) => (
        <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
          {payment_type === 'vehicle-acquisition' && 'Vehicle Acq.'}
          {payment_type === 'driver-rental' && 'Driver Rental'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`px-3 py-1 rounded text-sm font-medium ${
          status === 'unpaid' ? 'bg-red-100 text-red-800' :
          status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
          status === 'paid' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </span>
      )
    },
  ];

  const actions = [
    { label: 'Register Payment', onClick: (payment) => {
      setSelectedPaymentId(payment._id);
      setInstallmentValues({ amount: '', notes: '' });
      setInstallmentErrors({});
      setIsInstallmentOpen(true);
    }, variant: 'success' },
    { label: 'Delete', onClick: handleDeletePayment, variant: 'danger' },
  ];

  // Filter payments based on tab
  // Search is already handled by backend API (searches by vehicle number)
  let displayPayments = payments.filter(p => p.payment_type === activeTab);

  const vehicleAcqCount = payments.filter(p => p.payment_type === 'vehicle-acquisition').length;
  const driverRentalCount = payments.filter(p => p.payment_type === 'driver-rental').length;

  const selectedPayment = getSelectedPayment();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
          <p className="text-gray-600 text-sm mt-1">Manage payment records and installments</p>
        </div>
        <Button variant="success" onClick={() => setIsCreateOpen(true)}>
          + Create Payment
        </Button>
      </div>

      {/* Info Banner */}
      {/* <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>ℹ️ Info:</strong> Payments are automatically created when vehicles are added or loads are created.
          Use "Register Payment" to record installments. Status updates: unpaid → partial → paid
        </p>
      </div> */}

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by vehicle number..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleFilterByStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partially Paid</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('vehicle-acquisition')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'vehicle-acquisition'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-800'
          }`}
        >
          Vehicle Acquisition <span className="text-xs text-gray-500 ml-2">({vehicleAcqCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('driver-rental')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'driver-rental'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-800'
          }`}
        >
          Driver Rental <span className="text-xs text-gray-500 ml-2">({driverRentalCount})</span>
        </button>
      </div>

      {/* Payments Table */}
      <div className="mb-8">
        <Table columns={columns} data={displayPayments} actions={actions} isLoading={isLoading} />
      </div>

      {/* Installment History Section */}
      {displayPayments.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Installment History</h2>
          {displayPayments.map((payment) => (
            <div key={payment._id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-600 text-sm">
                    <strong>Payment:</strong> {payment.payer} → {payment.payee}
                  </p>
                  <p className="text-gray-600 text-sm">
                    <strong>Progress:</strong> ₹{payment.total_paid?.toLocaleString() || 0} / ₹{payment.total_amount?.toLocaleString() || 0}
                    ({payment.total_amount > 0 ? Math.round((payment.total_paid / payment.total_amount) * 100) : 0}%)
                  </p>
                </div>
              </div>

              {payment.installments && payment.installments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-700">#</th>
                        <th className="px-4 py-2 text-left text-gray-700">Amount</th>
                        <th className="px-4 py-2 text-left text-gray-700">Date Paid</th>
                        <th className="px-4 py-2 text-left text-gray-700">Notes</th>
                        <th className="px-4 py-2 text-left text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payment.installments.map((installment, idx) => (
                        <tr key={installment._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-800">{idx + 1}</td>
                          <td className="px-4 py-2 text-gray-800">₹{installment.amount?.toLocaleString() || 0}</td>
                          <td className="px-4 py-2 text-gray-800">
                            {installment.paid_date ? new Date(installment.paid_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-gray-800">{installment.notes || '-'}</td>
                          <td className="px-4 py-2 text-gray-800 flex gap-2">
                            <button
                              onClick={() => handleEditInstallment(payment, installment)}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteInstallment(payment, installment)}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No installments recorded yet</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Payment Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateFormValues({
            payment_type: 'vehicle-acquisition',
            vehicle_id: '',
            load_id: '',
          });
          setCreateErrors({});
        }}
        title="Create Payment"
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateOpen(false);
                setCreateFormValues({
                  payment_type: 'vehicle-acquisition',
                  vehicle_id: '',
                  load_id: '',
                });
                setCreateErrors({});
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleCreatePayment(createFormValues)}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Payment'}
            </Button>
          </div>
        }
      >
        <Form
          fields={[
            {
              name: 'payment_type',
              label: 'Payment Type',
              type: 'select',
              required: true,
              options: [
                { value: 'vehicle-acquisition', label: 'Vehicle Acquisition' },
                { value: 'driver-rental', label: 'Driver Rental' },
              ],
            },
            ...(createFormValues.payment_type === 'vehicle-acquisition' ? [
              {
                name: 'vehicle_id',
                label: 'Vehicle',
                type: 'select',
                required: true,
                options: vehicles.map((v) => ({
                  value: v._id,
                  label: `${v.plate_no} - ₹${v.acquisition_cost?.toLocaleString() || 0}`,
                })),
              },
            ] : []),
            ...(createFormValues.payment_type === 'driver-rental' ? [
              {
                name: 'load_id',
                label: 'Load',
                type: 'select',
                required: true,
                options: loads.filter(l => l.driver_id).map((l) => ({
                  value: l._id,
                  label: `${l.rental_code} - ₹${l.rental_amount?.toLocaleString() || 0}`,
                })),
              },
            ] : []),
          ]}
          values={createFormValues}
          errors={createErrors}
          onChange={setCreateFormValues}
          isLoading={isLoading}
        />
      </Modal>

      {/* Register Installment Modal */}
      <Modal
        isOpen={isInstallmentOpen}
        onClose={() => {
          setIsInstallmentOpen(false);
          setSelectedPaymentId(null);
          setInstallmentValues({ amount: '', paid_date: '', notes: '' });
          setInstallmentErrors({});
        }}
        title="Register Payment"
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsInstallmentOpen(false);
                setSelectedPaymentId(null);
                setInstallmentValues({ amount: '', paid_date: '', notes: '' });
                setInstallmentErrors({});
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                handleRegisterInstallment(
                  selectedPaymentId,
                  installmentValues.amount,
                  installmentValues.paid_date,
                  installmentValues.notes
                )
              }
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Register Payment'}
            </Button>
          </div>
        }
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Total Amount:</strong> ₹{selectedPayment.total_amount?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Already Paid:</strong> ₹{selectedPayment.total_paid?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Remaining Due:</strong> ₹{selectedPayment.total_due?.toLocaleString() || 0}
              </p>
            </div>

            <Form
              fields={[
                {
                  name: 'amount',
                  label: 'Amount to Pay',
                  type: 'number',
                  placeholder: `Max: ₹${selectedPayment.total_due || 0}`,
                  required: true,
                },
                {
                  name: 'paid_date',
                  label: 'Payment Date',
                  type: 'date',
                  required: true,
                },
                {
                  name: 'notes',
                  label: 'Notes (Optional)',
                  type: 'textarea',
                  placeholder: 'Enter notes for this payment',
                },
              ]}
              values={installmentValues}
              errors={installmentErrors}
              onChange={setInstallmentValues}
              isLoading={isLoading}
            />
          </div>
        )}
      </Modal>

      {/* Edit Installment Modal */}
      <Modal
        isOpen={isEditInstallmentOpen}
        onClose={() => {
          setIsEditInstallmentOpen(false);
          setEditingInstallmentId(null);
          setEditingPaymentId(null);
          setEditInstallmentValues({ amount: '', paid_date: '', notes: '' });
          setEditInstallmentErrors({});
        }}
        title="Edit Installment"
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditInstallmentOpen(false);
                setEditingInstallmentId(null);
                setEditingPaymentId(null);
                setEditInstallmentValues({ amount: '', paid_date: '', notes: '' });
                setEditInstallmentErrors({});
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                handleUpdateInstallment(
                  editInstallmentValues.amount,
                  editInstallmentValues.paid_date,
                  editInstallmentValues.notes
                )
              }
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Installment'}
            </Button>
          </div>
        }
      >
        <Form
          fields={[
            {
              name: 'amount',
              label: 'Amount to Pay',
              type: 'number',
              placeholder: 'Enter amount',
              required: true,
            },
            {
              name: 'paid_date',
              label: 'Payment Date',
              type: 'date',
              required: true,
            },
            {
              name: 'notes',
              label: 'Notes (Optional)',
              type: 'textarea',
              placeholder: 'Enter notes for this payment',
            },
          ]}
          values={editInstallmentValues}
          errors={editInstallmentErrors}
          onChange={setEditInstallmentValues}
          isLoading={isLoading}
        />
      </Modal>
    </div>
  );
}
