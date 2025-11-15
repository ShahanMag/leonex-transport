import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Form from '../components/Form';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({
    username: '',
    password: '',
    role: 'user',
    email: '',
    fullName: '',
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      showError('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (values) => {
    setFormValues(values);
  };

  const handleSubmit = async (values) => {
    if (!values.username || (!editingId && !values.password)) {
      setErrors({
        username: !values.username ? 'Username is required' : '',
        password: !editingId && !values.password ? 'Password is required' : '',
      });
      return;
    }

    try {
      setIsLoading(true);
      if (editingId) {
        await userAPI.update(editingId, values);
        showSuccess('User updated successfully');
      } else {
        await userAPI.create(values);
        showSuccess('User created successfully');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormValues({
        username: '',
        password: '',
        role: 'user',
        email: '',
        fullName: '',
        isActive: true,
      });
      setErrors({});
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user) => {
    setFormValues({
      username: user.username || '',
      password: '', // Don't show existing password
      role: user.role || 'user',
      email: user.email || '',
      fullName: user.fullName || '',
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
    setEditingId(user._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (user) => {
    if (user.role === 'superadmin') {
      showError('Cannot delete superadmin user');
      return;
    }

    showConfirm('Are you sure you want to delete this user?', async () => {
      try {
        setIsLoading(true);
        await userAPI.delete(user._id);
        showSuccess('User deleted successfully');
        fetchUsers();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete user');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleOpenForm = () => {
    setFormValues({
      username: '',
      password: '',
      role: 'user',
      email: '',
      fullName: '',
      isActive: true,
    });
    setEditingId(null);
    setErrors({});
    setIsFormOpen(true);
  };

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (role) => (
        <span
          className={`px-3 py-1 rounded text-sm font-medium ${
            role === 'superadmin'
              ? 'bg-red-100 text-red-800'
              : role === 'admin'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {role}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (isActive) => (
        <span
          className={`px-3 py-1 rounded text-sm font-medium ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (value) => (value ? new Date(value).toLocaleDateString() : '-'),
    },
  ];

  const actions = (user) => {
    const baseActions = [
      {
        label: 'Edit',
        onClick: () => handleEdit(user),
        variant: 'primary',
      },
    ];

    // Don't allow deleting superadmin
    if (user.role !== 'superadmin') {
      baseActions.push({
        label: 'Delete',
        onClick: () => handleDelete(user),
        variant: 'danger',
      });
    }

    return baseActions;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <Button variant="success" onClick={handleOpenForm}>
          + Create User
        </Button>
      </div>

      <Table columns={columns} data={users} actions={actions} isLoading={isLoading} />

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingId(null);
        }}
        title={editingId ? 'Edit User' : 'Create New User'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsFormOpen(false);
                setEditingId(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSubmit(formValues)}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : editingId ? 'Update User' : 'Create User'}
            </Button>
          </div>
        }
      >
        <Form
          fields={[
            {
              name: 'username',
              label: 'Username',
              placeholder: 'Enter username',
              required: true,
            },
            {
              name: 'password',
              label: editingId ? 'Password (leave blank to keep current)' : 'Password',
              type: 'password',
              placeholder: editingId ? 'Leave blank to keep current' : 'Enter password',
              required: !editingId,
            },
            {
              name: 'fullName',
              label: 'Full Name',
              placeholder: 'Enter full name',
            },
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              placeholder: 'Enter email',
            },
            {
              name: 'role',
              label: 'Role',
              type: 'select',
              required: true,
              options: [
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Admin' },
                { value: 'superadmin', label: 'Super Admin' },
              ],
            },
            {
              name: 'isActive',
              label: 'Status',
              type: 'select',
              required: true,
              options: [
                { value: true, label: 'Active' },
                { value: false, label: 'Inactive' },
              ],
            },
          ]}
          values={formValues}
          errors={errors}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitText={editingId ? 'Update User' : 'Create User'}
        />
      </Modal>
    </div>
  );
}
