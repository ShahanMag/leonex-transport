export default function Table({ columns, data, actions, isLoading = false }) {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data available</div>;
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
              >
                {column.label}
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b hover:bg-gray-50 transition">
              {columns.map((column) => (
                <td
                  key={`${rowIndex}-${column.key}`}
                  className="px-4 py-3 text-sm text-gray-800"
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    {actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => action.onClick(row)}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${
                          action.variant === 'danger'
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : action.variant === 'warning'
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
