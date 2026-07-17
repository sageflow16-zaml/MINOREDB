interface DataTableProps<T> {
  data: T[];
  columns: { header: string; accessor: keyof T | ((item: T) => React.ReactNode) }[];
}

export function DataTable<T>({ data, columns }: DataTableProps<T>) {
  return (
    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
      <thead className="bg-slate-50 dark:bg-slate-800">
        <tr>
          {columns.map((col, i) => (
            <th key={i} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map((col, j) => (
              <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
