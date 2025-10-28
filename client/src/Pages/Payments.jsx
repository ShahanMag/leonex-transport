import { useState, useEffect } from 'react';
import { paymentAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({
    payer: '',
    payee: '',
    amount: '',
    type: 'rental',
    balance: '',
    description: '',
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
      alert('Failed to fetch payments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (values) => {
    setFormValues(values);
  };

  const handleSubmit = async (values) => {
    if (!values.payer || !values.amount || !values.type) {
      setErrors({
        payer: !values.payer ? 'Payer is required' : '',
        amount: !values.amount ? 'Amount is required' : '',
        type: !values.type ? 'Type is required' : '',
      });
      return;
    }

    try {
      setIsLoading(true);
      if (editingId) {
        await paymentAPI.update(editingId, values);
        alert('Payment updated successfully');
      } else {
        await paymentAPI.create(values);
        alert('Payment recorded successfully');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormValues({
        payer: '',
        payee: '',
        amount: '',
        type: 'rental',
        balance: '',
        description: '',
      });
      setErrors({});
      fetchPayments();
    } catch (error) {
      alert('Failed to save payment');
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
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    try {
      setIsLoading(true);
      await paymentAPI.delete(payment._id);
      alert('Payment deleted successfully');
      fetchPayments();
    } catch (error) {
      alert('Failed to delete payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = () => {
    setFormValues({
      payer: '',
      payee: '',
      amount: '',
      type: 'rental',
      balance: '',
      description: '',
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
      key: 'type',
      label: 'Type',
      render: (type) => (
        <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
          {type}
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
        title={editingId ? 'Edit Payment' : 'Record Payment'}
        size="lg"
      >
        <Form
          fields={[
            { name: 'payer', label: 'Payer', placeholder: 'Enter payer name', required: true },
            { name: 'payee', label: 'Payee', placeholder: 'Enter payee name' },
            { name: 'amount', label: 'Amount', type: 'number', placeholder: 'Enter amount', required: true },
            {
              name: 'type',
              label: 'Payment Type',
              type: 'select',
              required: true,
              options: [
                { value: 'rental', label: 'Rental' },
                { value: 'driver-commission', label: 'Driver Commission' },
                { value: 'company-payment', label: 'Company Payment' },
                { value: 'other', label: 'Other' },
              ],
            },
            { name: 'balance', label: 'Balance', type: 'number', placeholder: 'Enter balance' },
            { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
          ]}
          values={formValues}
          errors={errors}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          isLoading={isLoading}
          submitText={editingId ? 'Update Payment' : 'Record Payment'}
        />
      </Modal>
    </div>
  );
}
