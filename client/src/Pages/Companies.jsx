import { useState, useEffect } from 'react';
import { companyAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    contact: '',
    address: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const response = await companyAPI.getAll();
      setCompanies(response.data);
    } catch (error) {
      alert('Failed to fetch companies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (values) => {
    setFormValues(values);
  };

  const handleSubmit = async (values) => {
    if (!values.name || !values.contact || !values.address) {
      setErrors({
        name: !values.name ? 'Name is required' : '',
        contact: !values.contact ? 'Contact is required' : '',
        address: !values.address ? 'Address is required' : '',
      });
      return;
    }

    try {
      setIsLoading(true);
      if (editingId) {
        await companyAPI.update(editingId, values);
        alert('Company updated successfully');
      } else {
        await companyAPI.create(values);
        alert('Company created successfully');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormValues({ name: '', contact: '', address: '', email: '', phone: '' });
      setErrors({});
      fetchCompanies();
    } catch (error) {
      alert('Failed to save company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (company) => {
    setFormValues(company);
    setEditingId(company._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (company) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;

    try {
      setIsLoading(true);
      await companyAPI.delete(company._id);
      alert('Company deleted successfully');
      fetchCompanies();
    } catch (error) {
      alert('Failed to delete company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = () => {
    setFormValues({ name: '', contact: '', address: '', email: '', phone: '' });
    setEditingId(null);
    setErrors({});
    setIsFormOpen(true);
  };

  const columns = [
    { key: 'name', label: 'Company Name' },
    { key: 'contact', label: 'Contact Person' },
    { key: 'address', label: 'Address' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
  ];

  const actions = [
    { label: 'Edit', onClick: handleEdit, variant: 'primary' },
    { label: 'Delete', onClick: handleDelete, variant: 'danger' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Companies</h1>
        <Button variant="success" onClick={handleOpenForm}>
          + Add Company
        </Button>
      </div>

      <Table columns={columns} data={companies} actions={actions} isLoading={isLoading} />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Company' : 'Add Company'}
        size="md"
      >
        <Form
          fields={[
            { name: 'name', label: 'Company Name', placeholder: 'Enter company name', required: true },
            { name: 'contact', label: 'Contact Person', placeholder: 'Enter contact person', required: true },
            { name: 'address', label: 'Address', placeholder: 'Enter address', required: true },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email' },
            { name: 'phone', label: 'Phone', placeholder: 'Enter phone number' },
          ]}
          values={formValues}
          errors={errors}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          isLoading={isLoading}
          submitText={editingId ? 'Update Company' : 'Add Company'}
        />
      </Modal>
    </div>
  );
}
