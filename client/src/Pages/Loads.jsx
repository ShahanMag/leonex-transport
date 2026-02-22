import { useState, useEffect } from 'react';
import { loadAPI, driverAPI, vehicleTypeAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';
import { formatDate } from '../utils/dateUtils';

export default function Loads() {
  const [loads, setLoads] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
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
    rental_amount: '',
    rental_date: '',
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [assignValues, setAssignValues] = useState({ driver_id: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchLoads();
    fetchDrivers();
    fetchVehicleTypes();
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

  const fetchVehicleTypes = async () => {
    try {
      const response = await vehicleTypeAPI.getAll();
      setVehicleTypes(response.data);
    } catch (error) {
      showError('Failed to fetch vehicle types');
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

  const handleVehicleTypeFilter = (e) => {
    const vehicleType = e.target.value;
    setSelectedVehicleTypeFilter(vehicleType);
  };

  // Client-side filter function
  const getFilteredLoads = () => {
    let filtered = loads;

    if (selectedVehicleTypeFilter) {
      filtered = filtered.filter(load => load.vehicle_type === selectedVehicleTypeFilter);
    }

    return filtered;
  };

  const handleFormChange = (values) => {
    setFormValues(values);
  };

  const handleSubmit = async (values) => {
    if (!values.vehicle_type || !values.from_location || !values.to_location || !values.rental_amount || !values.rental_date) {
      setErrors({
        vehicle_type: !values.vehicle_type ? 'Vehicle type is required' : '',
        from_location: !values.from_location ? 'From location is required' : '',
        to_location: !values.to_location ? 'To location is required' : '',
        rental_amount: !values.rental_amount ? 'Rental amount is required' : '',
        rental_date: !values.rental_date ? 'Rental date is required' : '',
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
        rental_amount: '',
        rental_date: '',
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
    // Format rental_date for the date input
    let rentalDate = '';
    if (load.rental_date) {
      const date = new Date(load.rental_date);
      rentalDate = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
    }

    setFormValues({
      vehicle_type: load.vehicle_type || '',
      from_location: load.from_location || '',
      to_location: load.to_location || '',
      rental_amount: load.rental_amount || '',
      rental_date: rentalDate,
    });
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


  const handleOpenForm = () => {
    setFormValues({
      vehicle_type: '',
      from_location: '',
      to_location: '',
      rental_amount: '',
      rental_date: '',
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
    {
      key: 'rental_amount',
      label: 'Amount',
      render: (value) => value ? `${value}` : '-'
    },
    {
      key: 'rental_date',
      label: 'Rental Date',
      render: (value) => value ? formatDate(value) : '-'
    },
    {
      key: 'driver_id',
      label: 'Driver',
      render: (value) => value?.name || 'Unassigned'
    },
  ];

  // Dynamic actions based on load status
  const getActions = (load) => {
    const baseActions = [];

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

      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search load by rental code or vehicle type..."
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 min-w-[250px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedVehicleTypeFilter}
          onChange={handleVehicleTypeFilter}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Vehicle Types</option>
          {vehicleTypes.map((vt) => (
            <option key={vt._id} value={vt.name}>
              {vt.name}
            </option>
          ))}
        </select>
      </div>

      <Table columns={columns} data={getFilteredLoads()} actions={getActions} isLoading={isLoading} />

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
                if (!formValues.vehicle_type || !formValues.from_location || !formValues.to_location || !formValues.rental_amount || !formValues.rental_date) {
                  setErrors({
                    vehicle_type: !formValues.vehicle_type ? 'Vehicle type is required' : '',
                    from_location: !formValues.from_location ? 'From location is required' : '',
                    to_location: !formValues.to_location ? 'To location is required' : '',
                    rental_amount: !formValues.rental_amount ? 'Rental amount is required' : '',
                    rental_date: !formValues.rental_date ? 'Rental date is required' : '',
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
            { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: vehicleTypes.map(vt => ({ value: vt.name, label: vt.name })), required: true },
            { name: 'from_location', label: 'From Location', placeholder: 'Enter starting location', required: true },
            { name: 'to_location', label: 'To Location', placeholder: 'Enter destination', required: true },
            { name: 'rental_amount', label: 'Rental Amount', type: 'number', placeholder: '0', required: true },
            { name: 'rental_date', label: 'Rental Date', type: 'date', required: true },
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
