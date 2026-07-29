import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Button } from './Button';

export interface Column<T> {
  id: string;
  header: string;
  accessor: string | ((row: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
  hideable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor?: (row: T) => string;
  searchable?: boolean;
  searchFields?: string[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  stickyHeader?: boolean;
  compact?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchFields,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  emptyDescription,
  onRowClick,
  isLoading,
  pageSize: defaultPageSize = 50,
  pageSizeOptions = [10, 25, 50, 100],
  stickyHeader = true,
  compact = false,
}: DataTableProps<T>) {
  const getKey = keyExtractor || ((row: any, i: number) => (row.id != null ? String(row.id) : String(i)));
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    const fields = searchFields || columns.filter(c => typeof c.accessor === 'string').map(c => c.accessor as string);
    return data.filter((row: any) =>
      fields.some((field) => {
        const val = (row as any)[field];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchFields, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    const val = (row as any)[column.accessor];
    if (val == null) return '-';
    return String(val);
  };

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder={searchPlaceholder}
              className={cn(
                'h-8 w-full rounded border border-border bg-surface pl-8 pr-3 text-xs',
                'placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              )}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted/50 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {search && (
            <span className="text-2xs text-muted">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      <div className="rounded-md border border-border overflow-hidden">
        <div className={cn('overflow-x-auto', stickyHeader && 'max-h-[600px]')}>
          <Table>
            <TableHeader className={cn(stickyHeader && 'sticky top-0 z-10 bg-card')}>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.id}
                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                    className={cn(
                      col.sortable && 'cursor-pointer select-none hover:text-foreground',
                      col.hideOnMobile && 'hidden md:table-cell',
                      col.className
                    )}
                    onClick={() => col.sortable && typeof col.accessor === 'string' && handleSort(col.accessor)}
                    aria-sort={col.sortable && sortKey === col.accessor ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="shrink-0">
                          {sortKey === col.accessor ? (
                            sortDir === 'asc' ? (
                              <ArrowUp className="h-3 w-3 text-primary" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-20 group-hover:opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-40">
                    <div className="flex items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-40">
                    <div className="flex flex-col items-center justify-center gap-1 text-center">
                      <p className="text-sm text-secondary">{emptyMessage}</p>
                      {emptyDescription && (
                        <p className="text-xs text-muted">{emptyDescription}</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row, index) => (
                  <TableRow
                    key={getKey(row, index)}
                    onClick={() => onRowClick?.(row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') { e.preventDefault(); onRowClick(row); } } : undefined}
                    className={cn(
                      onRowClick && 'cursor-pointer',
                      compact && '[&_td]:py-2 [&_td]:text-xs'
                    )}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        className={cn(
                          col.hideOnMobile && 'hidden md:table-cell',
                          compact && 'py-2',
                          col.className
                        )}
                      >
                        {getCellValue(row, col)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {!isLoading && paginated.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xs text-muted">
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="h-7 rounded border border-border bg-surface px-2 text-2xs text-muted"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={() => setPage(0)} disabled={page === 0} aria-label="First page">
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => setPage(page - 1)} disabled={page === 0} aria-label="Previous page">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="min-w-[40px] text-center text-2xs text-muted">
              {page + 1} / {totalPages}
            </span>
            <Button variant="ghost" size="icon-xs" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1} aria-label="Next page">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} aria-label="Last page">
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
