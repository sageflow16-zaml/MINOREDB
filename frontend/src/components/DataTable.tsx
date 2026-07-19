import { DataTable as PremiumDataTable, type Column as PremiumColumn } from './ui/DataTable';

export type Column<T> = Omit<PremiumColumn<T>, 'id'> & { id?: string };

export function DataTable<T>({
  columns,
  ...props
}: Omit<Parameters<typeof PremiumDataTable<T>>[0], 'columns'> & { columns: Column<T>[] }) {
  const enrichedColumns: PremiumColumn<T>[] = columns.map((col, i) => ({
    ...col,
    id: col.id || `col-${i}`,
  }));
  return <PremiumDataTable<T> columns={enrichedColumns} {...props} />;
}
