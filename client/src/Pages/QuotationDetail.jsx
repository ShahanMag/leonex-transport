import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationAPI } from '../services/api';
import Button from '../components/Button';
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

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  useEffect(() => { fetchQuotation(); }, [id]);

  const fetchQuotation = async () => {
    try {
      setIsLoading(true);
      const res = await quotationAPI.getById(id);
      setQuotation(res.data);
    } catch {
      showError('Failed to load quotation');
      navigate('/quotations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsPdfLoading(true);
      const res = await quotationAPI.generatePdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${quotation.quotation_number}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showError('Failed to generate PDF');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleDelete = () => {
    showConfirm(`Delete quotation "${quotation?.quotation_number}"?`, async () => {
      try {
        await quotationAPI.delete(id);
        showSuccess('Quotation deleted successfully');
        navigate('/quotations');
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete quotation');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-gray-500">Loading quotation...</p>
      </div>
    );
  }

  if (!quotation) return null;

  const customer = quotation.customer;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/quotations')} className="text-gray-500 hover:text-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{quotation.quotation_number}</h1>
            <p className="text-sm text-gray-500">Created {formatDate(quotation.createdAt)}</p>
          </div>
          <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${STATUS_BADGE[quotation.status] || 'bg-gray-100 text-gray-700'}`}>
            {quotation.status}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleDownloadPdf} disabled={isPdfLoading}>
            {isPdfLoading ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button variant="primary" onClick={() => navigate(`/quotations/${id}/edit`)}>Edit</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer</p>
          <p className="font-semibold text-gray-800">{customer?.name || '-'}</p>
          {customer?.phone_number && (
            <p className="text-sm text-gray-500">{customer.phone_country_code} {customer.phone_number}</p>
          )}
          {customer?.email && (
            <p className="text-sm text-gray-500">{customer.email}</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quotation Date</p>
          <p className="font-semibold text-gray-800">{formatDate(quotation.quotation_date)}</p>
          <p className="text-xs text-gray-500 mt-1">Valid until: {formatDate(quotation.valid_until)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Updated</p>
          <p className="font-semibold text-gray-800">{formatDate(quotation.updatedAt)}</p>
        </div>
      </div>

      {/* Transport Rates */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Transport Rates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['From', 'To', '4m Dyna (SAR)', '6m Dyna (SAR)', 'FSR (SAR)', 'Trailer (SAR)'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotation.transport_rates?.length ? quotation.transport_rates.map((row, idx) => (
                <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{row.from_location}</td>
                  <td className="px-4 py-3 text-gray-800">{row.to_location}</td>
                  <td className="px-4 py-3 text-gray-700">{row.rate_4m_dyna || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{row.rate_6m_dyna || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{row.rate_fsr || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{row.rate_trailer || '-'}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No transport rates</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Terms */}
      {quotation.terms?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-800">Terms & Conditions</h2>
          </div>
          <ol className="px-5 py-4 space-y-2 list-decimal list-inside">
            {quotation.terms.map((t, idx) => (
              <li key={idx} className="text-sm text-gray-700">{t.description}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Notes */}
      {quotation.notes && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-800">Notes</h2>
          </div>
          <p className="px-5 py-4 text-sm text-gray-700 whitespace-pre-wrap">{quotation.notes}</p>
        </div>
      )}
    </div>
  );
}
