import { useState, useEffect } from 'react';
import { driverAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    contact: '',
    license_no: '',
    iqama_id: '',
    status: 'active',
    email: '',
    phone_country_code: '+966',
    phone_number: '',
    address: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const response = await driverAPI.getAll();
      setDrivers(response.data);
    } catch (error) {
      showError('Failed to fetch drivers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (values) => {
    setFormValues(values);
  };

  const handleSubmit = async (values) => {
    if (!values.name || !values.contact || !values.license_no) {
      setErrors({
        name: !values.name ? 'Name is required' : '',
        contact: !values.contact ? 'Contact is required' : '',
        license_no: !values.license_no ? 'License number is required' : '',
      });
      return;
    }

    try {
      setIsLoading(true);
      if (editingId) {
        await driverAPI.update(editingId, values);
        showSuccess('Driver updated successfully');
      } else {
        await driverAPI.create(values);
        showSuccess('Driver registered successfully');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormValues({
        name: '',
        contact: '',
        license_no: '',
        iqama_id: '',
        status: 'active',
        email: '',
        phone_country_code: '+966',
        phone_number: '',
        address: '',
      });
      setErrors({});
      fetchDrivers();
    } catch (error) {
      showError('Failed to save driver');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (driver) => {
    setFormValues(driver);
    setEditingId(driver._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (driver) => {
    showConfirm('Are you sure you want to delete this driver?', async () => {
      try {
        setIsLoading(true);
        await driverAPI.delete(driver._id);
        showSuccess('Driver deleted successfully');
        fetchDrivers();
      } catch (error) {
        showError('Failed to delete driver');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleOpenForm = () => {
    setFormValues({
      name: '',
      contact: '',
      license_no: '',
      iqama_id: '',
      status: 'active',
      email: '',
      phone_country_code: '+966',
      phone_number: '',
      address: '',
    });
    setEditingId(null);
    setErrors({});
    setIsFormOpen(true);
  };

  const columns = [
    { key: 'driver_code', label: 'Code' },
    { key: 'name', label: 'Driver Name' },
    { key: 'license_no', label: 'License Number' },
    { key: 'iqama_id', label: 'Iqama ID' },
    { key: 'contact', label: 'Contact' },
    { key: 'email', label: 'Email' },
    {
      key: 'phone_number',
      label: 'Phone',
      render: (value, row) => `${row.phone_country_code} ${row.phone_number}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`px-3 py-1 rounded text-sm font-medium ${
          status === 'active' ? 'bg-green-100 text-green-800' :
          status === 'inactive' ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
  ];

  const actions = [
    { label: 'Edit', onClick: handleEdit, variant: 'primary' },
    { label: 'Delete', onClick: handleDelete, variant: 'danger' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Drivers</h1>
        <Button variant="success" onClick={handleOpenForm}>
          + Register Driver
        </Button>
      </div>

      <Table columns={columns} data={drivers} actions={actions} isLoading={isLoading} />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Driver' : 'Register New Driver'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!formValues.name || !formValues.contact || !formValues.license_no) {
                  setErrors({
                    name: !formValues.name ? 'Name is required' : '',
                    contact: !formValues.contact ? 'Contact is required' : '',
                    license_no: !formValues.license_no ? 'License number is required' : '',
                  });
                  return;
                }
                handleSubmit(formValues);
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : editingId ? 'Update Driver' : 'Register Driver'}
            </Button>
          </div>
        }
      >
        <Form
          fields={[
            { name: 'name', label: 'Driver Name', placeholder: 'Enter driver name', required: true },
            { name: 'contact', label: 'Contact Person', placeholder: 'Enter contact', required: true },
            { name: 'license_no', label: 'License Number', placeholder: 'Enter license number', required: true },
            { name: 'iqama_id', label: 'Iqama ID (Saudi)', placeholder: 'Enter Saudi Iqama ID' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email' },
            {
              name: 'phone_country_code',
              label: 'Country Code',
              type: 'select',
              options: [
                { value: '+91', label: '+91 (India)' },
                { value: '+1', label: '+1 (USA/Canada)' },
                { value: '+44', label: '+44 (UK)' },
                { value: '+966', label: '+966 (Saudi Arabia)' },
                { value: '+971', label: '+971 (UAE)' },
              ],
            },
            { name: 'phone_number', label: 'Phone Number', placeholder: 'Enter phone number (digits only)' },
            { name: 'address', label: 'Address', placeholder: 'Enter address' },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' },
              ],
            },
          ]}
          values={formValues}
          errors={errors}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitText={editingId ? 'Update Driver' : 'Register Driver'}
        />
      </Modal>
    </div>
  );
}
