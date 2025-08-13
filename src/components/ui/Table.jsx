export default function Table({ columns = [], data = [], actions }) {
  return (
    <div className="overflow-x-auto">
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">No data found.</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-200 rounded shadow">
          <thead>
            <tr className="bg-white border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className="px-4 py-2 text-left text-sm font-semibold text-gray-700"
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                {columns.map((col) => (
                  <td key={col.header} className="px-4 py-2 text-sm">
                    {typeof col.accessor === "function"
                      ? col.accessor(row)
                      : row[col.accessor]}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-2 text-sm text-right">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
