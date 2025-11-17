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
  const [searchQuery, setSearchQuery] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [iqamaFilter, setIqamaFilter] = useState('');
  const [formValues, setFormValues] = useState({
    name: '',
    iqama_id: '',
    status: 'active',
    phone_country_code: '+966',
    phone_number: '',
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

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      fetchDrivers();
      return;
    }

    try {
      setIsLoading(true);
      const response = await driverAPI.search(query);
      setDrivers(response.data);
    } catch (error) {
      showError('Failed to search drivers');
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side filter function
  const getFilteredDrivers = () => {
    let filtered = drivers;

    if (nameFilter) {
      filtered = filtered.filter(driver =>
        driver.name?.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (iqamaFilter) {
      filtered = filtered.filter(driver =>
        driver.iqama_id?.toLowerCase().includes(iqamaFilter.toLowerCase())
      );
    }

    return filtered;
  };

  const handleFormChange = (values) => {
    setFormValues(values);
  };

  const handleSubmit = async (values) => {
    if (!values.name || !values.iqama_id || !values.phone_number) {
      setErrors({
        name: !values.name ? 'Name is required' : '',
        iqama_id: !values.iqama_id ? 'Iqama ID is required' : '',
        phone_number: !values.phone_number ? 'Phone number is required' : '',
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
        iqama_id: '',
        status: 'active',
        phone_country_code: '+966',
        phone_number: '',
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
      iqama_id: '',
      status: 'active',
      phone_country_code: '+966',
      phone_number: '',
    });
    setEditingId(null);
    setErrors({});
    setIsFormOpen(true);
  };

  const columns = [
    { key: 'driver_code', label: 'Code' },
    { key: 'name', label: 'Driver Name' },
    { key: 'iqama_id', label: 'Iqama ID' },
    {
      key: 'phone_number',
      label: 'Phone',
      render: (value, row) => `${row.phone_country_code} ${row.phone_number}`
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

      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search driver by name..."
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Filter by name..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Filter by Iqama ID..."
          value={iqamaFilter}
          onChange={(e) => setIqamaFilter(e.target.value)}
          className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <Table columns={columns} data={getFilteredDrivers()} actions={actions} isLoading={isLoading} />

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
                if (!formValues.name || !formValues.iqama_id || !formValues.phone_number) {
                  setErrors({
                    name: !formValues.name ? 'Name is required' : '',
                    iqama_id: !formValues.iqama_id ? 'Iqama ID is required' : '',
                    phone_number: !formValues.phone_number ? 'Phone number is required' : '',
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
            { name: 'iqama_id', label: 'Iqama ID (Saudi)', placeholder: 'Enter Saudi Iqama ID', required: true },
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
            { name: 'phone_number', label: 'Phone Number', placeholder: 'Enter phone number (digits only)', required: true },
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
