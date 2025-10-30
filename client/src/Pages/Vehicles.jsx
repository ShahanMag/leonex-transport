import { useState, useEffect } from 'react';
import { vehicleAPI, companyAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formValues, setFormValues] = useState({
    company_id: '',
    vehicle_type: '',
    plate_no: '',
    status: 'available',
    // Acquisition fields
    acquisition_cost: '',
    acquisition_date: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchVehicles();
    fetchCompanies();
  }, []);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const response = await vehicleAPI.getAll();
      setVehicles(response.data);
    } catch (error) {
      showError('Failed to fetch vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyAPI.getAll();
      setCompanies(response.data);
    } catch (error) {
      showError('Failed to fetch companies');
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      fetchVehicles();
      return;
    }

    try {
      setIsLoading(true);
      const response = await vehicleAPI.search(query);
      setVehicles(response.data);
    } catch (error) {
      showError('Failed to search vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateFilter = async () => {
    if (!startDate || !endDate) {
      showError('Please select both start and end dates');
      return;
    }

    try {
      setIsLoading(true);
      const response = await vehicleAPI.filter(startDate, endDate);
      setVehicles(response.data);
    } catch (error) {
      showError('Failed to filter vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (values) => {
    setFormValues(values);
  };

  const handleSubmit = async (values) => {
    if (!values.company_id || !values.vehicle_type || !values.plate_no || !values.acquisition_cost || !values.acquisition_date) {
      setErrors({
        company_id: !values.company_id ? 'Company is required' : '',
        vehicle_type: !values.vehicle_type ? 'Vehicle type is required' : '',
        plate_no: !values.plate_no ? 'Plate number is required' : '',
        acquisition_cost: !values.acquisition_cost ? 'Acquisition cost is required' : '',
        acquisition_date: !values.acquisition_date ? 'Acquisition date is required' : '',
      });
      return;
    }

    try {
      setIsLoading(true);
      if (editingId) {
        await vehicleAPI.update(editingId, values);
        showSuccess('Vehicle updated successfully');
      } else {
        await vehicleAPI.create(values);
        showSuccess('Vehicle created successfully');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormValues({
        company_id: '',
        vehicle_type: '',
        plate_no: '',
        status: 'available',
        acquisition_cost: '',
        acquisition_date: '',
      });
      setErrors({});
      fetchVehicles();
    } catch (error) {
      showError('Failed to save vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vehicle) => {
    setFormValues(vehicle);
    setEditingId(vehicle._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (vehicle) => {
    showConfirm('Are you sure you want to delete this vehicle?', async () => {
      try {
        setIsLoading(true);
        await vehicleAPI.delete(vehicle._id);
        showSuccess('Vehicle deleted successfully');
        fetchVehicles();
      } catch (error) {
        showError('Failed to delete vehicle');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleOpenForm = () => {
    setFormValues({
      company_id: '',
      vehicle_type: '',
      plate_no: '',
      status: 'available',
      acquisition_cost: '',
      acquisition_date: '',
    });
    setEditingId(null);
    setErrors({});
    setIsFormOpen(true);
  };

  const columns = [
    { key: 'vehicle_code', label: 'Code' },
    { key: 'plate_no', label: 'Plate Number' },
    { key: 'vehicle_type', label: 'Type' },
    {
      key: 'company_id',
      label: 'Company',
      render: (value) => value?.name || 'N/A'
    },
    { key: 'acquisition_cost', label: 'Acquisition Cost' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`px-3 py-1 rounded text-sm font-medium ${
          status === 'available' ? 'bg-green-100 text-green-800' :
          status === 'rented' ? 'bg-yellow-100 text-yellow-800' :
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
        <h1 className="text-3xl font-bold text-gray-800">Vehicles</h1>
        <Button variant="success" onClick={handleOpenForm}>
          + Add Vehicle
        </Button>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search vehicle by plate number..."
            value={searchQuery}
            onChange={handleSearch}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="primary" onClick={handleDateFilter}>
            Filter by Date
          </Button>
        </div>
      </div>

      <Table columns={columns} data={vehicles} actions={actions} isLoading={isLoading} />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!formValues.company_id || !formValues.vehicle_type || !formValues.plate_no || !formValues.acquisition_cost || !formValues.acquisition_date) {
                  setErrors({
                    company_id: !formValues.company_id ? 'Company is required' : '',
                    vehicle_type: !formValues.vehicle_type ? 'Vehicle type is required' : '',
                    plate_no: !formValues.plate_no ? 'Plate number is required' : '',
                    acquisition_cost: !formValues.acquisition_cost ? 'Acquisition cost is required' : '',
                    acquisition_date: !formValues.acquisition_date ? 'Acquisition date is required' : '',
                  });
                  return;
                }
                handleSubmit(formValues);
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : editingId ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        }
      >
        <Form
          fields={[
            {
              name: 'company_id',
              label: 'Company',
              type: 'select',
              required: true,
              options: companies.map((c) => ({ value: c._id, label: c.name })),
            },
            { name: 'vehicle_type', label: 'Vehicle Type', placeholder: 'e.g., Truck, Van', required: true },
            { name: 'plate_no', label: 'Plate Number', placeholder: 'e.g., ABC123', required: true },
            { name: 'acquisition_cost', label: 'Acquisition Cost', type: 'number', placeholder: 'Amount company paid', required: true },
            { name: 'acquisition_date', label: 'Acquisition Date', type: 'date', required: true },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'available', label: 'Available' },
                { value: 'rented', label: 'Rented' },
                { value: 'maintenance', label: 'Maintenance' },
              ],
            },
          ]}
          values={formValues}
          errors={errors}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitText={editingId ? 'Update Vehicle' : 'Add Vehicle'}
        />
      </Modal>
    </div>
  );
}
