import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationAPI } from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import { showSuccess, showError, showConfirm } from '../utils/toast';

const STATUS_BADGE = {
  Draft: 'bg-gray-100 text-gray-700',
  Sent: 'bg-blue-100 text-blue-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

function formatDate(val) {
  if (!val) return '-';
  return new Date(val).toLocaleDateString('en-GB');
}

export default function Quotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchQuotations(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchQuotations(), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const res = await quotationAPI.getAll({ search, limit: 100 });
      setQuotations(res.data.data || []);
    } catch {
      showError('Failed to fetch quotations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (q) => {
    showConfirm(`Delete quotation "${q.quotation_number}"?`, async () => {
      try {
        setIsLoading(true);
        await quotationAPI.delete(q._id);
        showSuccess('Quotation deleted successfully');
        fetchQuotations();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete quotation');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const columns = [
    { key: 'quotation_number', label: 'Quotation #' },
    { key: 'customer', label: 'Customer', render: (val) => val?.name || '-' },
    {
      key: 'status', label: 'Status',
      render: (val) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[val] || 'bg-gray-100 text-gray-700'}`}>{val}</span>
      ),
    },
    { key: 'valid_until', label: 'Valid Until', render: (val) => formatDate(val) },
    { key: 'createdAt', label: 'Created', render: (val) => formatDate(val) },
  ];

  const actions = (row) => [
    { label: 'View', onClick: () => navigate(`/quotations/${row._id}`), variant: 'secondary' },
    { label: 'Edit', onClick: () => navigate(`/quotations/${row._id}/edit`), variant: 'primary' },
    { label: 'Delete', onClick: () => handleDelete(row), variant: 'danger' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quotations</h1>
        <Button variant="success" onClick={() => navigate('/quotations/new')}>+ New Quotation</Button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by quotation number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <Table columns={columns} data={quotations} actions={actions} isLoading={isLoading} />
    </div>
  );
}
