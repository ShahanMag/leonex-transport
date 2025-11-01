import { useState, useEffect } from 'react';
import { transactionAPI, companyAPI, driverAPI } from '../services/api';
import Button from '../components/Button';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';

export default function RentalTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [companyType, setCompanyType] = useState('existing'); // 'existing' or 'new'
  const [driverType, setDriverType] = useState('existing'); // 'existing' or 'new'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const [formValues, setFormValues] = useState({
    // Company
    company_id: '',
    company_name: '',
    company_contact: '',
    company_address: '',
    company_email: '',
    company_phone_country_code: '+91',
    company_phone_number: '',

    // Driver
    driver_id: '',
    driver_name: '',
    driver_iqama_id: '',
    driver_phone_country_code: '+966',
    driver_phone_number: '',

    // Vehicle & Acquisition
    vehicle_type: '',
    plate_no: '',
    acquisition_cost: '',
    acquisition_date: '',

    // Load & Rental
    from_location: '',
    to_location: '',
    load_description: '',
    rental_price_per_day: '',
    rental_type: 'per_day',
    rental_date: '',
    start_date: '',
    end_date: '',
    distance_km: '',
  });

  useEffect(() => {
    fetchCompanies();
    fetchDrivers();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await companyAPI.getAll();
      setCompanies(response.data);
    } catch (error) {
      showError('Failed to fetch companies');
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

  const handleFormChange = (values) => {
    setFormValues(values);
    // Clear errors when user starts typing
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Company validation
    if (companyType === 'existing' && !formValues.company_id) {
      newErrors.company_id = 'Please select a company';
    } else if (companyType === 'new') {
      if (!formValues.company_name) newErrors.company_name = 'Company name is required';
      if (!formValues.company_contact) newErrors.company_contact = 'Contact person is required';
      if (!formValues.company_address) newErrors.company_address = 'Company address is required';
    }

    // Driver validation
    if (driverType === 'existing' && !formValues.driver_id) {
      newErrors.driver_id = 'Please select a driver';
    } else if (driverType === 'new') {
      if (!formValues.driver_name) newErrors.driver_name = 'Driver name is required';
      if (!formValues.driver_iqama_id) newErrors.driver_iqama_id = 'Iqama ID is required';
      if (!formValues.driver_phone_number) newErrors.driver_phone_number = 'Phone number is required';
    }

    // Vehicle & Acquisition validation
    if (!formValues.vehicle_type) newErrors.vehicle_type = 'Vehicle type is required';
    if (!formValues.acquisition_cost) newErrors.acquisition_cost = 'Acquisition cost is required';
    if (formValues.acquisition_cost && isNaN(formValues.acquisition_cost)) {
      newErrors.acquisition_cost = 'Acquisition cost must be a number';
    }
    if (!formValues.acquisition_date) newErrors.acquisition_date = 'Acquisition date is required';

    // Load & Rental validation
    if (!formValues.from_location) newErrors.from_location = 'From location is required';
    if (!formValues.to_location) newErrors.to_location = 'To location is required';
    if (!formValues.rental_price_per_day) newErrors.rental_price_per_day = 'Rental price is required';
    if (formValues.rental_price_per_day && isNaN(formValues.rental_price_per_day)) {
      newErrors.rental_price_per_day = 'Rental price must be a number';
    }
    if (!formValues.start_date) newErrors.start_date = 'Start date is required';
    if (!formValues.end_date) newErrors.end_date = 'End date is required';

    // Per KM validation
    if (formValues.rental_type === 'per_km' && !formValues.distance_km) {
      newErrors.distance_km = 'Distance is required for per-km pricing';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Please fix all errors before submitting');
      return;
    }

    try {
      setIsLoading(true);

      // Prepare payload based on company and driver types
      const payload = {
        // Company data
        ...(companyType === 'existing' && { company_id: formValues.company_id }),
        ...(companyType === 'new' && {
          company_name: formValues.company_name,
          company_contact: formValues.company_contact,
          company_address: formValues.company_address,
          company_email: formValues.company_email,
          company_phone_country_code: formValues.company_phone_country_code,
          company_phone_number: formValues.company_phone_number,
        }),

        // Driver data
        ...(driverType === 'existing' && { driver_id: formValues.driver_id }),
        ...(driverType === 'new' && {
          driver_name: formValues.driver_name,
          driver_iqama_id: formValues.driver_iqama_id,
          driver_phone_country_code: formValues.driver_phone_country_code,
          driver_phone_number: formValues.driver_phone_number,
        }),

        // Vehicle & Acquisition
        vehicle_type: formValues.vehicle_type,
        plate_no: formValues.plate_no || undefined,
        acquisition_cost: parseFloat(formValues.acquisition_cost),
        acquisition_date: formValues.acquisition_date,

        // Load & Rental
        from_location: formValues.from_location,
        to_location: formValues.to_location,
        load_description: formValues.load_description || undefined,
        rental_price_per_day: parseFloat(formValues.rental_price_per_day),
        rental_type: formValues.rental_type,
        rental_date: formValues.rental_date || undefined,
        start_date: formValues.start_date,
        end_date: formValues.end_date,
        distance_km: formValues.distance_km ? parseFloat(formValues.distance_km) : undefined,
      };

      const response = await transactionAPI.createRentalTransaction(payload);

      showSuccess('Rental transaction created successfully!');

      // Reset form
      setFormValues({
        company_id: '',
        company_name: '',
        company_contact: '',
        company_address: '',
        company_email: '',
        company_phone_country_code: '+91',
        company_phone_number: '',
        driver_id: '',
        driver_name: '',
        driver_iqama_id: '',
        driver_phone_country_code: '+966',
        driver_phone_number: '',
        vehicle_type: '',
        plate_no: '',
        acquisition_cost: '',
        acquisition_date: '',
        from_location: '',
        to_location: '',
        load_description: '',
        rental_price_per_day: '',
        rental_type: 'per_day',
        rental_date: '',
        start_date: '',
        end_date: '',
        distance_km: '',
      });
      setCompanyType('existing');
      setDriverType('existing');
      setIsModalOpen(false);

      console.log('Transaction created:', response.data);
    } catch (error) {
      console.error('Error:', error);
      showError(error.response?.data?.message || 'Failed to create rental transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const companyOptions = companies.map(c => ({
    value: c._id,
    label: c.name
  }));

  const driverOptions = drivers.map(d => ({
    value: d._id,
    label: d.name
  }));

  const rentalTypeOptions = [
    { value: 'per_day', label: 'Per Day' },
    { value: 'per_job', label: 'Per Job (Fixed Price)' },
    { value: 'per_km', label: 'Per Kilometer' },
  ];

  const countryCodeOptions = [
    { value: '+91', label: '+91 (India)' },
    { value: '+1', label: '+1 (USA/Canada)' },
    { value: '+44', label: '+44 (UK)' },
    { value: '+966', label: '+966 (Saudi Arabia)' },
    { value: '+971', label: '+971 (UAE)' },
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Create Rental Transaction</h1>
          <Button variant="success" onClick={() => setIsModalOpen(true)}>
            + New Rental Transaction
          </Button>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">Complete Rental Setup in One Step</h2>
          <p className="text-blue-800 text-sm">
            This form creates a complete rental transaction including company, driver, vehicle acquisition,
            and rental payment in a single operation. You can select existing companies and drivers or create new ones on-the-fly.
          </p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Rental Transaction"
        size="xl"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Create Transaction'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Company Section */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Company Information</h3>

            <div className="mb-4 flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="companyType"
                  value="existing"
                  checked={companyType === 'existing'}
                  onChange={(e) => {
                    setCompanyType(e.target.value);
                    setFormValues({ ...formValues, company_id: '', company_name: '' });
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700">Select Existing Company</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="companyType"
                  value="new"
                  checked={companyType === 'new'}
                  onChange={(e) => {
                    setCompanyType(e.target.value);
                    setFormValues({ ...formValues, company_id: '' });
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700">Create New Company</span>
              </label>
            </div>

            {companyType === 'existing' ? (
              <Form
                fields={[
                  {
                    name: 'company_id',
                    label: 'Company',
                    type: 'select',
                    options: companyOptions,
                    required: true,
                  },
                ]}
                values={formValues}
                errors={errors}
                onChange={handleFormChange}
                isLoading={isLoading}
              />
            ) : (
              <Form
                fields={[
                  { name: 'company_name', label: 'Company Name', placeholder: 'Enter company name', required: true },
                  { name: 'company_contact', label: 'Contact Person', placeholder: 'Enter contact person name', required: true },
                  { name: 'company_address', label: 'Address', placeholder: 'Enter company address', required: true },
                  { name: 'company_email', label: 'Email', type: 'email', placeholder: 'Enter email' },
                  {
                    name: 'company_phone_country_code',
                    label: 'Country Code',
                    type: 'select',
                    options: countryCodeOptions,
                  },
                  { name: 'company_phone_number', label: 'Phone Number', placeholder: 'Enter phone number' },
                ]}
                values={formValues}
                errors={errors}
                onChange={handleFormChange}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Driver Section */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Driver Information</h3>

            <div className="mb-4 flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="driverType"
                  value="existing"
                  checked={driverType === 'existing'}
                  onChange={(e) => {
                    setDriverType(e.target.value);
                    setFormValues({ ...formValues, driver_id: '', driver_name: '' });
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700">Select Existing Driver</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="driverType"
                  value="new"
                  checked={driverType === 'new'}
                  onChange={(e) => {
                    setDriverType(e.target.value);
                    setFormValues({ ...formValues, driver_id: '' });
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700">Create New Driver</span>
              </label>
            </div>

            {driverType === 'existing' ? (
              <Form
                fields={[
                  {
                    name: 'driver_id',
                    label: 'Driver',
                    type: 'select',
                    options: driverOptions,
                    required: true,
                  },
                ]}
                values={formValues}
                errors={errors}
                onChange={handleFormChange}
                isLoading={isLoading}
              />
            ) : (
              <Form
                fields={[
                  { name: 'driver_name', label: 'Driver Name', placeholder: 'Enter driver name', required: true },
                  { name: 'driver_iqama_id', label: 'Iqama ID', placeholder: 'Enter iqama/ID number', required: true },
                  {
                    name: 'driver_phone_country_code',
                    label: 'Country Code',
                    type: 'select',
                    options: countryCodeOptions,
                  },
                  { name: 'driver_phone_number', label: 'Phone Number', placeholder: 'Enter phone number', required: true },
                ]}
                values={formValues}
                errors={errors}
                onChange={handleFormChange}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Vehicle & Acquisition Section */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Vehicle & Acquisition</h3>
            <Form
              fields={[
                { name: 'vehicle_type', label: 'Vehicle Type', placeholder: 'e.g., Truck, Van, Car', required: true },
                { name: 'plate_no', label: 'Plate Number', placeholder: 'e.g., ABC-1234' },
                { name: 'acquisition_cost', label: 'Acquisition Cost', type: 'number', placeholder: '0', required: true },
                { name: 'acquisition_date', label: 'Acquisition Date', type: 'date', required: true },
              ]}
              values={formValues}
              errors={errors}
              onChange={handleFormChange}
              isLoading={isLoading}
            />
          </div>

          {/* Load & Rental Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Load & Rental Details</h3>
            <Form
              fields={[
                { name: 'from_location', label: 'From Location', placeholder: 'e.g., Riyadh', required: true },
                { name: 'to_location', label: 'To Location', placeholder: 'e.g., Jeddah', required: true },
                { name: 'load_description', label: 'Load Description', placeholder: 'e.g., Goods delivery' },
                {
                  name: 'rental_type',
                  label: 'Rental Type',
                  type: 'select',
                  options: rentalTypeOptions,
                },
                { name: 'rental_price_per_day', label: 'Price Per Unit', type: 'number', placeholder: '0', required: true },
                ...(formValues.rental_type === 'per_km' ? [
                  { name: 'distance_km', label: 'Distance (KM)', type: 'number', placeholder: '0', required: true },
                ] : []),
                { name: 'rental_date', label: 'Rental Date', type: 'date' },
                { name: 'start_date', label: 'Start Date', type: 'date', required: true },
                { name: 'end_date', label: 'End Date', type: 'date', required: true },
              ]}
              values={formValues}
              errors={errors}
              onChange={handleFormChange}
              isLoading={isLoading}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
