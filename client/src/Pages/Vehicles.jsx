import { useState, useEffect } from 'react';
import { vehicleAPI, companyAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({
    company_id: '',
    vehicle_type: '',
    plate_no: '',
    rent_price: '',
    status: 'available',
    manufacturer: '',
    year: '',
    capacity: '',
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
      alert('Failed to fetch vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyAPI.getAll();
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies');
    }
  };

  const handleFormChange = (values) => {
    setFormValues(values);
  };

  const handleSubmit = async (values) => {
    if (!values.company_id || !values.vehicle_type || !values.plate_no || !values.rent_price) {
      setErrors({
        company_id: !values.company_id ? 'Company is required' : '',
        vehicle_type: !values.vehicle_type ? 'Vehicle type is required' : '',
        plate_no: !values.plate_no ? 'Plate number is required' : '',
        rent_price: !values.rent_price ? 'Rent price is required' : '',
      });
      return;
    }

    try {
      setIsLoading(true);
      if (editingId) {
        await vehicleAPI.update(editingId, values);
        alert('Vehicle updated successfully');
      } else {
        await vehicleAPI.create(values);
        alert('Vehicle created successfully');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormValues({
        company_id: '',
        vehicle_type: '',
        plate_no: '',
        rent_price: '',
        status: 'available',
        manufacturer: '',
        year: '',
        capacity: '',
      });
      setErrors({});
      fetchVehicles();
    } catch (error) {
      alert('Failed to save vehicle');
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
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      setIsLoading(true);
      await vehicleAPI.delete(vehicle._id);
      alert('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      alert('Failed to delete vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = () => {
    setFormValues({
      company_id: '',
      vehicle_type: '',
      plate_no: '',
      rent_price: '',
      status: 'available',
      manufacturer: '',
      year: '',
      capacity: '',
    });
    setEditingId(null);
    setErrors({});
    setIsFormOpen(true);
  };

  const columns = [
    { key: 'plate_no', label: 'Plate Number' },
    { key: 'vehicle_type', label: 'Type' },
    {
      key: 'company_id',
      label: 'Company',
      render: (value) => value?.name || 'N/A'
    },
    { key: 'rent_price', label: 'Rent Price' },
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

      <Table columns={columns} data={vehicles} actions={actions} isLoading={isLoading} />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Vehicle' : 'Add Vehicle'}
        size="lg"
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
            { name: 'rent_price', label: 'Rent Price', type: 'number', placeholder: 'Enter rent price', required: true },
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
            { name: 'manufacturer', label: 'Manufacturer', placeholder: 'e.g., Volvo' },
            { name: 'year', label: 'Year', type: 'number', placeholder: 'e.g., 2022' },
            { name: 'capacity', label: 'Capacity (tons)', type: 'number', placeholder: 'e.g., 25' },
          ]}
          values={formValues}
          errors={errors}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          isLoading={isLoading}
          submitText={editingId ? 'Update Vehicle' : 'Add Vehicle'}
        />
      </Modal>
    </div>
  );
}
