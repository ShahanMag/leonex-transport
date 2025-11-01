import { useState, useEffect } from 'react';
import { loadAPI, driverAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';

export default function Loads() {
  const [loads, setLoads] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigningLoadId, setAssigningLoadId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleTypeFilter, setSelectedVehicleTypeFilter] = useState('');
  const [formValues, setFormValues] = useState({
    vehicle_type: '',
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

  const fetchDrivers = async () => {
    try {
      const response = await driverAPI.getAll();
      setDrivers(response.data);
    } catch (error) {
      showError('Failed to fetch drivers');
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      fetchLoads();
      return;
    }

    try {
      setIsLoading(true);
      const response = await loadAPI.search(query);
      setLoads(response.data);
    } catch (error) {
      showError('Failed to search loads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVehicleTypeFilter = async (e) => {
    const vehicleType = e.target.value;
    setSelectedVehicleTypeFilter(vehicleType);

    if (!vehicleType) {
      fetchLoads();
      return;
    }

    try {
      setIsLoading(true);
      const response = await loadAPI.filter(vehicleType);
      setLoads(response.data);
    } catch (error) {
      showError('Failed to filter loads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (values) => {
    setFormValues(values);
  };

  const handleSubmit = async (values) => {
    if (!values.vehicle_type || !values.from_location || !values.to_location || !values.rental_price_per_day) {
      setErrors({
        vehicle_type: !values.vehicle_type ? 'Vehicle type is required' : '',
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
        vehicle_type: '',
        from_location: '',
        to_location: '',
        load_description: '',
        rental_price_per_day: '',
        rental_type: 'per_day',
        distance_km: '',
        start_date: '',
        end_date: '',
      });
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
      vehicle_type: '',
      from_location: '',
      to_location: '',
      load_description: '',
      rental_price_per_day: '',
      rental_type: 'per_day',
      distance_km: '',
      start_date: '',
      end_date: '',
    });
    setEditingId(null);
    setErrors({});
    setIsFormOpen(true);
  };

  const columns = [
    { key: 'rental_code', label: 'Rental Code' },
    {
      key: 'vehicle_type',
      label: 'Vehicle Type',
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

  // Dynamic actions based on load status
  const getActions = (load) => {
    const baseActions = [];

    // Show Assign button only for pending loads
    if (load.status === 'pending') {
      baseActions.push({
        label: 'Assign',
        onClick: () => handleOpenAssign(load),
        variant: 'primary',
      });
    }

    // Show Complete button only for assigned loads
    if (load.status === 'assigned') {
      baseActions.push({
        label: 'Complete',
        onClick: () => handleCompleteLoad(load),
        variant: 'success',
      });
    }

    // Show Edit button for pending and assigned loads (not for completed)
    if (load.status !== 'completed') {
      baseActions.push({
        label: 'Edit',
        onClick: () => handleEdit(load),
        variant: 'primary',
      });
    }

    // Always show Delete button
    baseActions.push({
      label: 'Delete',
      onClick: () => handleDelete(load),
      variant: 'danger',
    });

    return baseActions;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Rental Requests</h1>
        <Button variant="success" onClick={handleOpenForm}>
          + Create Load
        </Button>
      </div>

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search load by rental code or vehicle type..."
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedVehicleTypeFilter}
          onChange={handleVehicleTypeFilter}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Vehicle Types</option>
          {[...new Set(loads.map(l => l.vehicle_type))].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <Table columns={columns} data={loads} actions={getActions} isLoading={isLoading} />

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
                if (!formValues.vehicle_type || !formValues.from_location || !formValues.to_location || !formValues.rental_price_per_day) {
                  setErrors({
                    vehicle_type: !formValues.vehicle_type ? 'Vehicle type is required' : '',
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
            { name: 'vehicle_type', label: 'Vehicle Type', placeholder: 'e.g., Truck, Van, Car', required: true },
            {
              name: 'rental_price_per_day',
              label: 'Rental Price',
              type: 'number',
              placeholder: 'Enter rental price',
              required: true,
            },
            {
              name: 'rental_type',
              label: 'Pricing Type',
              type: 'select',
              options: [
                { value: 'per_day', label: 'Per Day' },
                { value: 'per_job', label: 'Per Job (Fixed Price)' },
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
            ] : []),
            { name: 'from_location', label: 'From Location', placeholder: 'Enter starting location', required: true },
            { name: 'to_location', label: 'To Location', placeholder: 'Enter destination', required: true },
            { name: 'load_description', label: 'Load Description', type: 'textarea', placeholder: 'Describe the load' },
            { name: 'start_date', label: 'Start Date', type: 'datetime-local' },
            { name: 'end_date', label: 'End Date', type: 'datetime-local' },
          ]}
          values={formValues}
          errors={errors}
          onChange={handleFormChange}
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
