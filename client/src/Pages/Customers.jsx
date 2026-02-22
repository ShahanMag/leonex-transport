import { useState, useEffect } from 'react';
import { customerAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';

const countryCodeOptions = [
  { value: '+966', label: '+966 (Saudi Arabia)' },
  { value: '+971', label: '+971 (UAE)' },
  { value: '+91', label: '+91 (India)' },
  { value: '+1', label: '+1 (USA/Canada)' },
  { value: '+44', label: '+44 (UK)' },
];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    iqama_id: '',
    phone_country_code: '+966',
    phone_number: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await customerAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      showError('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormValues({ name: '', iqama_id: '', phone_country_code: '+966', phone_number: '' });
    setErrors({});
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (customer) => {
    setFormValues({
      name: customer.name || '',
      iqama_id: customer.iqama_id || '',
      phone_country_code: customer.phone_country_code || '+966',
      phone_number: customer.phone_number || '',
    });
    setEditingId(customer._id);
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formValues.name.trim()) {
      setErrors({ name: 'Customer name is required' });
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        name: formValues.name.trim(),
        iqama_id: formValues.iqama_id,
        phone_country_code: formValues.phone_country_code,
        phone_number: formValues.phone_number,
      };

      if (editingId) {
        await customerAPI.update(editingId, payload);
        showSuccess('Customer updated successfully');
      } else {
        await customerAPI.create(payload);
        showSuccess('Customer created successfully');
      }

      setIsFormOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (customer) => {
    showConfirm(`Delete customer "${customer.name}"?`, async () => {
      try {
        setIsLoading(true);
        await customerAPI.delete(customer._id);
        showSuccess('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete customer');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'iqama_id', label: 'Iqama ID', render: (val) => val || '-' },
    {
      key: 'phone_number',
      label: 'Phone',
      render: (val, row) =>
        val ? `${row.phone_country_code} ${val}` : '-',
    },
  ];

  const actions = (row) => [
    { label: 'Edit', onClick: () => handleEdit(row), variant: 'primary' },
    { label: 'Delete', onClick: () => handleDelete(row), variant: 'danger' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
        <Button variant="success" onClick={handleOpenCreate}>
          + Add Customer
        </Button>
      </div>

      <Table columns={columns} data={customers} actions={actions} isLoading={isLoading} />

      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); resetForm(); }}
        title={editingId ? 'Edit Customer' : 'Add Customer'}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setIsFormOpen(false); resetForm(); }} disabled={isLoading}>
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
            { name: 'name', label: 'Name', placeholder: 'Enter customer name', required: true },
            { name: 'iqama_id', label: 'Iqama ID', placeholder: 'Enter Iqama ID' },
            {
              name: 'phone_country_code',
              label: 'Country Code',
              type: 'select',
              options: countryCodeOptions,
            },
            { name: 'phone_number', label: 'Phone Number', placeholder: 'Enter phone number' },
          ]}
          values={formValues}
          errors={errors}
          onChange={setFormValues}
          isLoading={isLoading}
        />
      </Modal>
    </div>
  );
}
