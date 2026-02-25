export default function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  if (!totalItems) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="flex items-center justify-between mt-4 px-1 flex-wrap gap-2">
      <span className="text-sm text-gray-500">
        Showing {from}–{to} of {totalItems} results
      </span>

      {totalPages > 1 && (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
          >
            Previous
          </button>
          {getPageNumbers().map((page, i) =>
            page === '...' ? (
              <span key={`e-${i}`} className="px-2 py-1 text-sm text-gray-400">…</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 rounded border text-sm transition ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
