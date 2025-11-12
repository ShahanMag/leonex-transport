import { useState, useEffect } from 'react';
import { transactionAPI, companyAPI, driverAPI, paymentAPI } from '../services/api';
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
  const [transactions, setTransactions] = useState([]);
const [editingId, setEditingId] = useState(null);

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
    rental_amount: '',
    rental_date: '',
  });

  useEffect(() => {
    fetchCompanies();
    fetchDrivers();
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      // Fetch all payments and filter for rental payments (driver-rental type)
      const response = await paymentAPI.getAll();
      const rentalPayments = response.data.filter(p => p.payment_type === 'driver-rental');

      // Enhance with acquisition payment data
      const enhancedPayments = rentalPayments.map(rental => {
        // Handle both cases: related_payment_id can be a string ID or a populated object
        let relatedPaymentId = rental.related_payment_id;
        if (typeof relatedPaymentId === 'object' && relatedPaymentId?._id) {
          // If it's a populated object, get the _id
          relatedPaymentId = relatedPaymentId._id;
        }
        relatedPaymentId = relatedPaymentId?.toString?.() || relatedPaymentId;

        const acquisitionPayment = response.data.find(p => {
          let paymentId = p._id?.toString?.() || p._id;
          return paymentId === relatedPaymentId && p.payment_type === 'vehicle-acquisition';
        });

        // If not found by ID, try to find by payment object (in case it's populated)
        if (!acquisitionPayment && typeof rental.related_payment_id === 'object') {
          const relatedPaymentFromObject = rental.related_payment_id;
          if (relatedPaymentFromObject?.payment_type === 'vehicle-acquisition') {
            return {
              ...rental,
              acquisition_amount: relatedPaymentFromObject.total_amount,
              acquisition_date: relatedPaymentFromObject.transaction_date,
            };
          }
        }

        return {
          ...rental,
          acquisition_amount: acquisitionPayment?.total_amount,
          acquisition_date: acquisitionPayment?.transaction_date,
        };
      });

      setTransactions(enhancedPayments);
    } catch (error) {
      showError('Failed to fetch transactions');
      console.error('Fetch error:', error);
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
    if (!formValues.rental_amount) newErrors.rental_amount = 'Rental amount is required';
    if (formValues.rental_amount && isNaN(formValues.rental_amount)) {
      newErrors.rental_amount = 'Rental amount must be a number';
    }
    if (!formValues.rental_date) newErrors.rental_date = 'Rental date is required';

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
        rental_amount: parseFloat(formValues.rental_amount),
        rental_date: formValues.rental_date,
      };

      const response = await transactionAPI.createRentalTransaction(payload);

      showSuccess('Rental transaction created successfully!');

      // Refresh transactions list
      fetchTransactions();

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
        rental_amount: '',
        rental_date: '',
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
  console.log(companies);

  const companyOptions = companies?.map(c => ({
    value: c._id,
    label: c.name
  }));

  const driverOptions = drivers.map(d => ({
    value: d._id,
    label: d.name
  }));


  const countryCodeOptions = [
    { value: '+91', label: '+91 (India)' },
    { value: '+1', label: '+1 (USA/Canada)' },
    { value: '+44', label: '+44 (UK)' },
    { value: '+966', label: '+966 (Saudi Arabia)' },
    { value: '+971', label: '+971 (UAE)' },
  ];
  // View transaction
  const handleView = async (transaction) => {
    try {
      const id = transaction.load_id?._id || transaction.load_id;
      const response = await transactionAPI.getById(id);
      console.log('Transaction details:', response.data);
      showSuccess('Transaction data loaded in console (you can expand this to a View modal)');
    } catch (error) {
      console.error('View error:', error);
      showError('Failed to fetch transaction details');
    }
  };

  // Edit transaction
  const handleEdit = async (transaction) => {
    try {
      const id = transaction.load_id?._id || transaction.load_id;
      const response = await transactionAPI.getById(id);

      const t = response.data;

      setFormValues({
        company_id: t.company?._id || '',
        driver_id: t.driver?._id || '',
        vehicle_type: t.vehicle_type || '',
        plate_no: t.payments?.acquisition?.plate_no || '',
        acquisition_cost: t.payments?.acquisition?.total_amount || '',
        acquisition_date: t.payments?.acquisition?.acquisition_date?.split('T')[0] || '',
        from_location: t.from_location || '',
        to_location: t.to_location || '',
        rental_amount: t.payments?.rental?.total_amount || '',
        rental_date: t.payments?.rental?.rental_date?.split('T')[0] || '',
      });

      setIsModalOpen(true);
    } catch (error) {
      console.error('Edit fetch error:', error);
      showError('Failed to load transaction for editing');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Create Rental Transaction</h1>
          <Button variant="success" onClick={() => setIsModalOpen(true)}>
            + New Rental Transaction
          </Button>
        </div>

        {/* <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">Complete Rental Setup in One Step</h2>
          <p className="text-blue-800 text-sm">
            This form creates a complete rental transaction including company, driver, vehicle acquisition,
            and rental payment in a single operation. You can select existing companies and drivers or create new ones on-the-fly.
          </p>
        </div> */}
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
                { name: 'rental_amount', label: 'Rental Amount', type: 'number', placeholder: '0', required: true },
                { name: 'rental_date', label: 'Rental Date', type: 'date', required: true },
              ]}
              values={formValues}
              errors={errors}
              onChange={handleFormChange}
              isLoading={isLoading}
            />
          </div>
        </div>
      </Modal>

      {/* Transactions Table */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Rental Transactions</h2>
        {transactions.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-600">No rental transactions yet. Click "New Rental Transaction" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Rental Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Company</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Driver</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">From</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">To</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Vehicle Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Acquisition Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Rental Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{transaction.load_id?.rental_code || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{transaction.company_id?.name || transaction.payee || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{transaction.payer || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{transaction.from_location || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{transaction.to_location || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{transaction.vehicle_type || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{transaction.acquisition_amount || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{transaction.total_amount || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleView(transaction)}
                      >
                        View
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleEdit(transaction)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
