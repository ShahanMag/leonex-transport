import { useState, useEffect } from 'react';
import { agentAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';

const countryCodeOptions = [
  { value: '+966', label: '+966 (Saudi Arabia)' },
  { value: '+971', label: '+971 (UAE)' },
  { value: '+91', label: '+91 (India)' },
  { value: '+1', label: '+1 (USA/Canada)' },
  { value: '+44', label: '+44 (UK)' },
];

const emptyForm = {
  name: '',
  phone_country_code: '+966',
  phone_number: '',
  email: '',
  location: '',
};

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const response = await agentAPI.getAll();
      setAgents(response.data);
    } catch {
      showError('Failed to fetch agents');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormValues(emptyForm);
    setErrors({});
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (agent) => {
    setFormValues({
      name: agent.name || '',
      phone_country_code: agent.phone_country_code || '+966',
      phone_number: agent.phone_number || '',
      email: agent.email || '',
      location: agent.location || '',
    });
    setEditingId(agent._id);
    setIsFormOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!formValues.name.trim()) e.name = 'Name is required';
    if (!formValues.phone_number.trim()) e.phone_number = 'Phone number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setIsLoading(true);
      const payload = {
        name: formValues.name.trim(),
        phone_country_code: formValues.phone_country_code,
        phone_number: formValues.phone_number.trim(),
        email: formValues.email,
        location: formValues.location,
      };
      if (editingId) {
        await agentAPI.update(editingId, payload);
        showSuccess('Agent updated successfully');
      } else {
        await agentAPI.create(payload);
        showSuccess('Agent created successfully');
      }
      setIsFormOpen(false);
      resetForm();
      fetchAgents();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (agent) => {
    showConfirm(`Delete agent "${agent.name}"?`, async () => {
      try {
        setIsLoading(true);
        await agentAPI.delete(agent._id);
        showSuccess('Agent deleted successfully');
        fetchAgents();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete agent');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'phone_number',
      label: 'Phone',
      render: (val, row) => val ? `${row.phone_country_code} ${val}` : '-',
    },
    { key: 'email', label: 'Email', render: (val) => val || '-' },
    { key: 'location', label: 'Location', render: (val) => val || '-' },
  ];

  const actions = (row) => [
    { label: 'Edit',   onClick: () => handleEdit(row),   variant: 'primary' },
    { label: 'Delete', onClick: () => handleDelete(row), variant: 'danger' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Agents</h1>
        <Button variant="success" onClick={handleOpenCreate}>+ Add Agent</Button>
      </div>

      <Table columns={columns} data={agents} actions={actions} isLoading={isLoading} />

      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); resetForm(); }}
        title={editingId ? 'Edit Agent' : 'Add Agent'}
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
            { name: 'name', label: 'Name', placeholder: 'Enter agent name', required: true },
            {
              name: 'phone_country_code',
              label: 'Country Code',
              type: 'select',
              options: countryCodeOptions,
            },
            { name: 'phone_number', label: 'Phone Number', placeholder: 'Enter phone number', required: true },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email address' },
            { name: 'location', label: 'Location', placeholder: 'Enter location' },
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
