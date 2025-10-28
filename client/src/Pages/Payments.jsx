import { useState, useEffect } from 'react';
import { paymentAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({
    payer: '',
    payee: '',
    amount: '',
    payment_type: 'driver-rental',
    balance: '',
    description: '',
    status: 'pending',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPayments();
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

  const handleFormChange = (values) => {
    setFormValues(values);
  };

  const handleSubmit = async (values) => {
    if (!values.payer || !values.amount || !values.payment_type) {
      setErrors({
        payer: !values.payer ? 'Payer is required' : '',
        amount: !values.amount ? 'Amount is required' : '',
        payment_type: !values.payment_type ? 'Payment type is required' : '',
      });
      return;
    }

    try {
      setIsLoading(true);
      if (editingId) {
        await paymentAPI.update(editingId, values);
        showSuccess('Payment updated successfully');
      } else {
        await paymentAPI.create(values);
        showSuccess('Payment recorded successfully');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormValues({
        payer: '',
        payee: '',
        amount: '',
        payment_type: 'driver-rental',
        balance: '',
        description: '',
        status: 'pending',
      });
      setErrors({});
      fetchPayments();
    } catch (error) {
      showError('Failed to save payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (payment) => {
    setFormValues(payment);
    setEditingId(payment._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (payment) => {
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

  const handleOpenForm = () => {
    setFormValues({
      payer: '',
      payee: '',
      amount: '',
      payment_type: 'driver-rental',
      balance: '',
      description: '',
      status: 'pending',
    });
    setEditingId(null);
    setErrors({});
    setIsFormOpen(true);
  };

  const columns = [
    { key: 'payer', label: 'Payer' },
    { key: 'payee', label: 'Payee' },
    { key: 'amount', label: 'Amount' },
    {
      key: 'payment_type',
      label: 'Payment Type',
      render: (payment_type) => (
        <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
          {payment_type}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`px-3 py-1 rounded text-sm font-medium ${
          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          status === 'completed' ? 'bg-green-100 text-green-800' :
          status === 'failed' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (date) => new Date(date).toLocaleDateString()
    },
    { key: 'balance', label: 'Balance' },
  ];

  const actions = [
    { label: 'Edit', onClick: handleEdit, variant: 'primary' },
    { label: 'Delete', onClick: handleDelete, variant: 'danger' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
        <Button variant="success" onClick={handleOpenForm}>
          + Record Payment
        </Button>
      </div>

      <Table columns={columns} data={payments} actions={actions} isLoading={isLoading} />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Payment' : 'Record New Payment'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!formValues.payer || !formValues.amount || !formValues.payment_type) {
                  setErrors({
                    payer: !formValues.payer ? 'Payer is required' : '',
                    amount: !formValues.amount ? 'Amount is required' : '',
                    payment_type: !formValues.payment_type ? 'Payment type is required' : '',
                  });
                  return;
                }
                handleSubmit(formValues);
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : editingId ? 'Update Payment' : 'Record Payment'}
            </Button>
          </div>
        }
      >
        <Form
          fields={[
            { name: 'payer', label: 'Payer', placeholder: 'Enter payer name', required: true },
            { name: 'payee', label: 'Payee', placeholder: 'Enter payee name' },
            { name: 'amount', label: 'Amount', type: 'number', placeholder: 'Enter amount', required: true },
            {
              name: 'payment_type',
              label: 'Payment Type',
              type: 'select',
              required: true,
              options: [
                { value: 'vehicle-acquisition', label: 'Vehicle Acquisition' },
                { value: 'driver-rental', label: 'Driver Rental' },
                { value: 'vehicle-maintenance', label: 'Vehicle Maintenance' },
                { value: 'driver-commission', label: 'Driver Commission' },
                { value: 'other', label: 'Other' },
              ],
            },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' },
              ],
            },
            { name: 'balance', label: 'Balance', type: 'number', placeholder: 'Enter balance' },
            { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
          ]}
          values={formValues}
          errors={errors}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitText={editingId ? 'Update Payment' : 'Record Payment'}
        />
      </Modal>
    </div>
  );
}
