import { useState, useEffect } from 'react';
import { vehicleTypeAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';

export default function VehicleTypes() {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({ name: '', isAvailable: true });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      setIsLoading(true);
      const response = await vehicleTypeAPI.getAll();
      setVehicleTypes(response.data);
    } catch (error) {
      showError('Failed to fetch vehicle types');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormValues({ name: '', isAvailable: true });
    setErrors({});
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (vehicleType) => {
    setFormValues({
      name: vehicleType.name || '',
      isAvailable: vehicleType.isAvailable !== undefined ? vehicleType.isAvailable : true,
    });
    setEditingId(vehicleType._id);
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formValues.name.trim()) {
      setErrors({ name: 'Vehicle type name is required' });
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        name: formValues.name.trim(),
        isAvailable: formValues.isAvailable === 'false' ? false : Boolean(formValues.isAvailable),
      };

      if (editingId) {
        await vehicleTypeAPI.update(editingId, payload);
        showSuccess('Vehicle type updated successfully');
      } else {
        await vehicleTypeAPI.create(payload);
        showSuccess('Vehicle type created successfully');
      }

      setIsFormOpen(false);
      resetForm();
      fetchVehicleTypes();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save vehicle type');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (vehicleType) => {
    showConfirm(`Delete vehicle type "${vehicleType.name}"?`, async () => {
      try {
        setIsLoading(true);
        await vehicleTypeAPI.delete(vehicleType._id);
        showSuccess('Vehicle type deleted successfully');
        fetchVehicleTypes();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete vehicle type');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const columns = [
    { key: 'name', label: 'Vehicle Type' },
    {
      key: 'isAvailable',
      label: 'Availability',
      render: (val) => (
        <span className={`px-3 py-1 rounded text-sm font-medium ${val ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {val ? 'Available' : 'Unavailable'}
        </span>
      ),
    },
  ];

  const actions = (row) => [
    { label: 'Edit', onClick: () => handleEdit(row), variant: 'primary' },
    { label: 'Delete', onClick: () => handleDelete(row), variant: 'danger' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Vehicle Types</h1>
        <Button variant="success" onClick={handleOpenCreate}>
          + Add Vehicle Type
        </Button>
      </div>

      <Table columns={columns} data={vehicleTypes} actions={actions} isLoading={isLoading} />

      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); resetForm(); }}
        title={editingId ? 'Edit Vehicle Type' : 'Add Vehicle Type'}
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
            { name: 'name', label: 'Vehicle Type Name', placeholder: 'e.g., Truck, Van, Car', required: true },
            {
              name: 'isAvailable',
              label: 'Availability',
              type: 'select',
              options: [
                { value: true, label: 'Available' },
                { value: false, label: 'Unavailable' },
              ],
            },
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
