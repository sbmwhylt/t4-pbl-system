import { Inbox } from "lucide-react";

export default function Table({ columns = [], data = [], actions }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Inbox size={40} strokeWidth={1.5} />
        <p className="mt-3 text-sm font-medium">No data found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white ">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                {col.header}
              </th>
            ))}
            {actions && (
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="hover:bg-gray-50/80 transition-colors even:bg-gray-50/40"
            >
              {columns.map((col) => (
                <td
                  key={col.header}
                  className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap"
                >
                  {typeof col.accessor === "function"
                    ? col.accessor(row)
                    : row[col.accessor]}
                </td>
              ))}
              {actions && (
                <td className="px-5 py-3.5 text-sm text-right">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
