import { useState, useEffect } from 'react';
import { loadAPI, vehicleAPI, driverAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';

export default function Loads() {
  const [loads, setLoads] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigningLoadId, setAssigningLoadId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({
    vehicle_id: '',
    from_location: '',
    to_location: '',
    load_description: '',
    rental_price_per_day: '',
    rental_type: 'per_day',
    distance_km: '',
    start_date: '',
    end_date: '',
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [assignValues, setAssignValues] = useState({ driver_id: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchLoads();
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchLoads = async () => {
    try {
      setIsLoading(true);
      const response = await loadAPI.getAll();
      setLoads(response.data);
    } catch (error) {
      showError('Failed to fetch loads');
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

  const fetchDrivers = async () => {
    try {
      const response = await driverAPI.getAll();
      setDrivers(response.data);
    } catch (error) {
      showError('Failed to fetch drivers');
    }
  };

  const handleVehicleSelect = (vehicleId) => {
    const vehicle = vehicles.find(v => v._id === vehicleId);
    setSelectedVehicle(vehicle);
    setFormValues(prev => ({
      ...prev,
      vehicle_id: vehicleId,
    }));
  };

  const handleFormChange = (values) => {
    setFormValues(values);
  };

  const handleSubmit = async (values) => {
    if (!values.vehicle_id || !values.from_location || !values.to_location || !values.rental_price_per_day) {
      setErrors({
        vehicle_id: !values.vehicle_id ? 'Vehicle is required' : '',
        from_location: !values.from_location ? 'From location is required' : '',
        to_location: !values.to_location ? 'To location is required' : '',
        rental_price_per_day: !values.rental_price_per_day ? 'Rental price per day is required' : '',
      });
      return;
    }

    try {
      setIsLoading(true);
      if (editingId) {
        await loadAPI.update(editingId, values);
        showSuccess('Load updated successfully');
      } else {
        await loadAPI.create(values);
        showSuccess('Load created successfully');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormValues({
        vehicle_id: '',
        from_location: '',
        to_location: '',
        load_description: '',
        rental_price_per_day: '',
        rental_type: 'per_day',
        distance_km: '',
        start_date: '',
        end_date: '',
      });
      setSelectedVehicle(null);
      setErrors({});
      fetchLoads();
    } catch (error) {
      showError('Failed to save load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignDriver = async (values) => {
    if (!values.driver_id) {
      setErrors({ driver_id: 'Driver is required' });
      return;
    }

    try {
      setIsLoading(true);
      await loadAPI.assignDriver(assigningLoadId, values);
      showSuccess('Driver assigned successfully');
      setIsAssignOpen(false);
      setAssigningLoadId(null);
      setAssignValues({ driver_id: '' });
      setErrors({});
      fetchLoads();
    } catch (error) {
      showError('Failed to assign driver');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (load) => {
    setFormValues(load);
    setEditingId(load._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (load) => {
    showConfirm('Are you sure you want to delete this load?', async () => {
      try {
        setIsLoading(true);
        await loadAPI.delete(load._id);
        showSuccess('Load deleted successfully');
        fetchLoads();
      } catch (error) {
        showError('Failed to delete load');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleOpenAssign = (load) => {
    setAssigningLoadId(load._id);
    setAssignValues({ driver_id: '' });
    setErrors({});
    setIsAssignOpen(true);
  };

  const handleCompleteLoad = async (load) => {
    showConfirm('Mark this load as completed and create rental payment?', async () => {
      try {
        setIsLoading(true);
        await loadAPI.completeLoad(load._id);
        showSuccess('Load completed and rental payment created');
        fetchLoads();
      } catch (error) {
        showError('Failed to complete load');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleOpenForm = () => {
    setFormValues({
      vehicle_id: '',
      from_location: '',
      to_location: '',
      load_description: '',
      rental_price_per_day: '',
      rental_type: 'per_day',
      distance_km: '',
      start_date: '',
      end_date: '',
    });
    setSelectedVehicle(null);
    setEditingId(null);
    setErrors({});
    setIsFormOpen(true);
  };

  const columns = [
    { key: 'rental_code', label: 'Rental Code' },
    {
      key: 'vehicle_id',
      label: 'Vehicle',
      render: (value) => value?.plate_no || 'N/A'
    },
    { key: 'from_location', label: 'From' },
    { key: 'to_location', label: 'To' },
    { key: 'rental_price_per_day', label: 'Rate' },
    { key: 'rental_amount', label: 'Amount' },
    { key: 'days_rented', label: 'Days' },
    {
      key: 'driver_id',
      label: 'Driver',
      render: (value) => value?.name || 'Unassigned'
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`px-3 py-1 rounded text-sm font-medium ${
          status === 'pending' ? 'bg-gray-100 text-gray-800' :
          status === 'assigned' ? 'bg-blue-100 text-blue-800' :
          status === 'in-transit' ? 'bg-yellow-100 text-yellow-800' :
          status === 'completed' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
  ];

  const actions = [
    {
      label: 'Assign',
      onClick: (load) => load.status === 'pending' && handleOpenAssign(load),
      variant: 'primary',
      disabled: (load) => load.status !== 'pending'
    },
    {
      label: 'Complete',
      onClick: handleCompleteLoad,
      variant: 'success',
      disabled: (load) => load.status !== 'assigned'
    },
    { label: 'Edit', onClick: handleEdit, variant: 'primary', disabled: (load) => load.status === 'completed' },
    { label: 'Delete', onClick: handleDelete, variant: 'danger' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Rental Requests</h1>
        <Button variant="success" onClick={handleOpenForm}>
          + Create Load
        </Button>
      </div>

      <Table columns={columns} data={loads} actions={actions} isLoading={isLoading} />

      {/* Create/Edit Load Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Rental Request' : 'Create New Rental Request'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!formValues.vehicle_id || !formValues.from_location || !formValues.to_location || !formValues.rental_price_per_day) {
                  setErrors({
                    vehicle_id: !formValues.vehicle_id ? 'Vehicle is required' : '',
                    from_location: !formValues.from_location ? 'From location is required' : '',
                    to_location: !formValues.to_location ? 'To location is required' : '',
                    rental_price_per_day: !formValues.rental_price_per_day ? 'Rental price is required' : '',
                  });
                  return;
                }
                handleSubmit(formValues);
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : editingId ? 'Update Load' : 'Create Load'}
            </Button>
          </div>
        }
      >
        <Form
          fields={[
            {
              name: 'vehicle_id',
              label: 'Vehicle',
              type: 'select',
              required: true,
              options: vehicles.map((v) => ({ value: v._id, label: `${v.plate_no} (${v.vehicle_type})` })),
            },
            ...(selectedVehicle ? [
              {
                name: 'rental_price_per_day',
                label: 'Rental Price Per Day',
                type: 'number',
                placeholder: 'Enter rental price for this job',
                required: true,
              },
              {
                name: 'rental_type',
                label: 'Pricing Type',
                type: 'select',
                options: [
                  { value: 'per_day', label: 'Per Day' },
                  { value: 'per_job', label: 'Per Job' },
                  { value: 'per_km', label: 'Per KM' },
                ],
              },
              ...(formValues.rental_type === 'per_km' ? [
                {
                  name: 'distance_km',
                  label: 'Distance (KM)',
                  type: 'number',
                  placeholder: 'Enter distance in kilometers',
                }
              ] : [])
            ] : []),
            { name: 'from_location', label: 'From Location', placeholder: 'Enter starting location', required: true },
            { name: 'to_location', label: 'To Location', placeholder: 'Enter destination', required: true },
            { name: 'load_description', label: 'Load Description', type: 'textarea', placeholder: 'Describe the load' },
            { name: 'start_date', label: 'Start Date', type: 'datetime-local' },
            { name: 'end_date', label: 'End Date', type: 'datetime-local' },
          ]}
          values={formValues}
          errors={errors}
          onChange={(values) => {
            handleFormChange(values);
            if (values.vehicle_id && values.vehicle_id !== formValues.vehicle_id) {
              handleVehicleSelect(values.vehicle_id);
            }
          }}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitText={editingId ? 'Update Load' : 'Create Load'}
        />
      </Modal>

      {/* Assign Driver Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Driver to Load"
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsAssignOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!assignValues.driver_id) {
                  setErrors({ driver_id: 'Driver is required' });
                  return;
                }
                handleAssignDriver(assignValues);
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Assign Driver'}
            </Button>
          </div>
        }
      >
        <Form
          fields={[
            {
              name: 'driver_id',
              label: 'Driver',
              type: 'select',
              required: true,
              options: drivers.map((d) => ({ value: d._id, label: `${d.name} (${d.license_no})` })),
            },
          ]}
          values={assignValues}
          errors={errors}
          onChange={setAssignValues}
          onSubmit={handleAssignDriver}
          isLoading={isLoading}
          submitText="Assign Driver"
        />
      </Modal>
    </div>
  );
}
