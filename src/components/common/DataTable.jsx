import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.jsx';
import { TableSkeleton } from '../feedback/Skeleton.jsx';

/**
 * Lumina Clarity high-density data table with sort headers, row hover, and pagination.
 */
export function DataTable({
  columns = [],
  data = [],
  rowKey = 'id',
  sortBy = '',
  sortOrder = 'asc',
  onSortChange,
  onRowClick,
  loading = false,
  skeletonRows = 6,
  emptyState = null,
  meta = null,
  onPageChange,
  className = '',
}) {
  const handleHeaderSort = (column) => {
    if (!column.sortable || !onSortChange) return;
    const field = column.sortField || column.key;
    if (sortBy === field) {
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, column.defaultOrder || 'desc');
    }
  };

  return (
    <div className={`surface-card rounded-xl overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="h-9 border-b border-outline bg-surface-container-low">
              {columns.map((col) => {
                const field = col.sortField || col.key;
                const isSorted = sortBy === field;

                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={`px-4 text-caption-xs font-medium uppercase tracking-wider text-on-surface-variant whitespace-nowrap ${col.headerClassName || ''}`}
                  >
                    {col.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => handleHeaderSort(col)}
                        className="inline-flex items-center gap-1 hover:text-on-surface transition-colors cursor-pointer"
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-primary" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-on-surface-muted" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <TableSkeleton rows={skeletonRows} columns={columns.length} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  {emptyState || (
                    <p className="text-body-sm text-on-surface-muted text-center">
                      No records found.
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const key = typeof rowKey === 'function' ? rowKey(row) : row[rowKey] ?? rowIndex;
                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={[
                      'h-[52px] border-b border-surface-container last:border-b-0 transition-colors',
                      onRowClick ? 'hover:bg-surface cursor-pointer' : 'hover:bg-surface',
                    ].join(' ')}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-2.5 text-body-sm text-on-surface align-middle ${col.cellClassName || ''}`}
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.total_pages > 1 && onPageChange ? (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-outline bg-surface-container-low">
          <span className="text-caption-xs text-on-surface-variant">
            Page <strong className="text-on-surface">{meta.page}</strong> of{' '}
            <strong className="text-on-surface">{meta.total_pages}</strong> ·{' '}
            <span>{meta.total} total</span>
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.page <= 1 || loading}
              onClick={() => onPageChange(meta.page - 1)}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.page >= meta.total_pages || loading}
              onClick={() => onPageChange(meta.page + 1)}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
