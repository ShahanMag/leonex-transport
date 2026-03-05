import { useState, useEffect } from 'react';
import { termAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';

const defaultForm = { title: '', description: '', is_active: 'true', order: '0' };

export default function Terms() {
  const [terms, setTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchTerms(); }, []);

  const fetchTerms = async () => {
    try {
      setIsLoading(true);
      const response = await termAPI.getAll();
      setTerms(response.data);
    } catch {
      showError('Failed to fetch terms');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => { setFormValues(defaultForm); setErrors({}); setEditingId(null); };

  const handleOpenCreate = () => { resetForm(); setIsFormOpen(true); };

  const handleEdit = (term) => {
    setFormValues({
      title: term.title || '',
      description: term.description || '',
      is_active: String(term.is_active !== false),
      order: String(term.order ?? 0),
    });
    setEditingId(term._id);
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formValues.description.trim()) {
      setErrors({ description: 'Description is required' });
      return;
    }
    try {
      setIsLoading(true);
      const payload = {
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        is_active: formValues.is_active === 'true',
        order: parseInt(formValues.order) || 0,
      };
      if (editingId) {
        await termAPI.update(editingId, payload);
        showSuccess('Term updated successfully');
      } else {
        await termAPI.create(payload);
        showSuccess('Term created successfully');
      }
      setIsFormOpen(false);
      resetForm();
      fetchTerms();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save term');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (term) => {
    showConfirm(`Delete term "${term.title || term.description.slice(0, 30)}"?`, async () => {
      try {
        setIsLoading(true);
        await termAPI.delete(term._id);
        showSuccess('Term deleted successfully');
        fetchTerms();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete term');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const columns = [
    { key: 'title', label: 'Title', render: (val) => val || '-' },
    { key: 'description', label: 'Description', render: (val) => val?.length > 80 ? val.slice(0, 80) + '…' : val },
    { key: 'order', label: 'Order' },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${val ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {val ? 'Active' : 'Inactive'}
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
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Terms</h1>
          <p className="text-sm text-gray-500 mt-1">Quotation terms and conditions</p>
        </div>
        <Button variant="success" onClick={handleOpenCreate}>+ Add Term</Button>
      </div>

      <Table columns={columns} data={terms} actions={actions} isLoading={isLoading} />

      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); resetForm(); }}
        title={editingId ? 'Edit Term' : 'Add Term'}
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
            { name: 'title', label: 'Title', placeholder: 'Enter term title (optional)' },
            { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter term description', required: true, rows: 4 },
            {
              name: 'is_active',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ],
            },
            { name: 'order', label: 'Display Order', type: 'number', placeholder: '0' },
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
